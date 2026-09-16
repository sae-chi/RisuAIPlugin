//@name autopilot
//@api 3.0
//@version 1.7.1
//@display-name Autopilot
//@update-url https://raw.githubusercontent.com/sae-chi/RisuAIPlugin/refs/heads/main/Autopilot.js

(async () => {
  'use strict';

  const api = globalThis.Risuai || globalThis.risuai;
  if (!api) {
    console.error('[Autopilot] RisuAI API를 찾을 수 없습니다.');
    return;
  }

  const PLUGIN_NAME = 'Autopilot';
  const DEFAULT_MESSAGE = '*says nothing*';
  const DEFAULT_INSTRUCTIONS = [
    '마지막 캐릭터 응답에 자연스럽게 이어지는 사용자의 다음 메시지를 작성하세요.',
    '사용자의 말과 행동만 작성하고 캐릭터의 말이나 행동을 대신 작성하지 마세요.',
  ].join('\n');
  const STORAGE_KEY = 'risu-autopilot:settings:v1';
  const CHAT_BUTTON_ID = 'risu-autopilot-chat-button';
  const MODE_FIXED = 'fixed';
  const MODE_GENERATED = 'generated';
  const MIN_TURNS = 1;
  const MAX_TURNS = 100;
  const DEFAULT_TURNS = 10;
  const MIN_CONTEXT_MESSAGES = 1;
  const MAX_CONTEXT_MESSAGES = 10;
  const DEFAULT_CONTEXT_MESSAGES = 6;
  const COOLDOWN_MS = 800;
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 2000;

  const state = {
    running: false,
    stopRequested: false,
    sessionToken: 0,
    mode: MODE_FIXED,
    targetTurns: DEFAULT_TURNS,
    retryCount: 0,
    message: DEFAULT_MESSAGE,
    instructions: DEFAULT_INSTRUCTIONS,
    contextMessageLimit: DEFAULT_CONTEXT_MESSAGES,
    includePersona: false,
    personaContext: null,
    generatedMessage: '',
    completedTurns: 0,
    phase: 'idle',
    status: '자동 진행 모드와 턴 수를 설정해 주세요.',
    error: '',
    activeCharacterIndex: null,
    activeChatIndex: null,
    activeCharacterName: '',
    activeChatName: '',
    generatedReady: false,
    generatedBlockReason: '현재 채팅을 확인하는 중입니다.',
    panelPosition: null,
    chatButtonPart: null,
    eventsBound: false,
  };

  let dragSession = null;
  let settingsSaveTimer = null;

  function clampTurnCount(value) {
    const number = Number.parseInt(String(value), 10);
    if (!Number.isFinite(number)) return DEFAULT_TURNS;
    return Math.min(MAX_TURNS, Math.max(MIN_TURNS, number));
  }

  function clampRetryCount(value) {
    const number = Number.parseInt(String(value), 10);
    return Number.isFinite(number) ? Math.min(MAX_RETRIES, Math.max(0, number)) : 0;
  }

  function clampContextMessageCount(value) {
    const number = Number.parseInt(String(value), 10);
    if (!Number.isFinite(number)) return DEFAULT_CONTEXT_MESSAGES;
    return Math.min(MAX_CONTEXT_MESSAGES, Math.max(MIN_CONTEXT_MESSAGES, number));
  }

  function errorMessage(error) {
    if (error instanceof Error && error.message) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return String(error || '알 수 없는 오류');
  }

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function messagesOf(chat) {
    return Array.isArray(chat?.message) ? chat.message : [];
  }

  function isCharacterMessage(message) {
    return message?.role === 'char';
  }

  function containsRisuError(message) {
    return isCharacterMessage(message)
      && /```risuerror(?:\s|$)/i.test(String(message?.data || ''));
  }

  function generationIdOf(message) {
    const generationId = message?.generationInfo?.generationId;
    return generationId == null ? '' : String(generationId);
  }

  function messageIdentity(message, index) {
    const generationId = generationIdOf(message);
    const time = message?.time == null ? '' : String(message.time);
    return `${index}|${generationId}|${time}|${String(message?.data || '')}`;
  }

  function conversationSignature(chat) {
    return JSON.stringify({
      bindedPersona: chat?.bindedPersona ?? '',
      messages: messagesOf(chat).map((message) => [
        message?.role || '',
        String(message?.data || ''),
        message?.time ?? null,
        generationIdOf(message),
        message?.disabled ?? false,
        message?.isComment === true,
      ]),
    });
  }

  function isRelevantConversationMessage(message) {
    return (message?.role === 'user' || message?.role === 'char')
      && message?.isComment !== true
      && message?.disabled !== true;
  }

  function generatedModeSource(chat) {
    const relevant = messagesOf(chat)
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => isRelevantConversationMessage(message));

    const characterMessages = relevant.filter(({ message }) => isCharacterMessage(message));
    if (characterMessages.length === 0) {
      return {
        ok: false,
        reason: '첫 메시지를 제외한 실제 캐릭터 응답이 최소 1개 필요합니다.',
      };
    }

    const latest = relevant.at(-1);
    if (!latest || !isCharacterMessage(latest.message)) {
      return {
        ok: false,
        reason: '마지막 유효 메시지가 캐릭터 응답일 때만 시작할 수 있습니다.',
      };
    }
    if (containsRisuError(latest.message)) {
      return {
        ok: false,
        reason: '마지막 캐릭터 메시지가 RisuAI 오류 응답입니다.',
      };
    }
    if (!String(latest.message?.data || '').trim()) {
      return {
        ok: false,
        reason: '마지막 캐릭터 응답이 비어 있습니다.',
      };
    }

    return {
      ok: true,
      message: latest.message,
      index: latest.index,
      identity: messageIdentity(latest.message, latest.index),
    };
  }

  function updateGeneratedEligibility(chat) {
    const source = generatedModeSource(chat);
    state.generatedReady = source.ok === true;
    state.generatedBlockReason = source.ok ? '' : source.reason;
    return source;
  }

  function snapshotChat(chat) {
    const messages = messagesOf(chat);
    return {
      length: messages.length,
      generationIds: new Set(messages.map(generationIdOf).filter(Boolean)),
      risuErrorIdentities: new Set(
        messages
          .map((message, index) => ({ message, index }))
          .filter(({ message }) => containsRisuError(message))
          .map(({ message, index }) => messageIdentity(message, index)),
      ),
    };
  }

  function findNewRisuError(before, afterChat) {
    const afterMessages = messagesOf(afterChat);
    for (let index = 0; index < afterMessages.length; index += 1) {
      const message = afterMessages[index];
      if (!containsRisuError(message)) continue;
      const identity = messageIdentity(message, index);
      if (!before.risuErrorIdentities.has(identity)) return message;
    }
    return null;
  }

  function findNewCharacterMessages(before, afterChat, startedAt) {
    const afterMessages = messagesOf(afterChat);
    return afterMessages.filter((message, index) => {
      if (!isCharacterMessage(message)) return false;

      const generationId = generationIdOf(message);
      if (generationId && !before.generationIds.has(generationId)) return true;

      const messageTime = Number(message?.time || 0);
      if (index >= before.length && messageTime >= startedAt - 2000) return true;

      return false;
    });
  }

  function syncFormStateFromDOM() {
    const retryInput = document.getElementById('autopilot-retries');
    if (retryInput) state.retryCount = clampRetryCount(retryInput.value);
    const turnInput = document.getElementById('autopilot-turns');
    const messageInput = document.getElementById('autopilot-message');
    const instructionsInput = document.getElementById('autopilot-instructions');
    const contextMessagesInput = document.getElementById('autopilot-context-messages');
    const includePersonaInput = document.getElementById('autopilot-include-persona');
    if (turnInput) state.targetTurns = clampTurnCount(turnInput.value);
    if (messageInput) state.message = String(messageInput.value ?? state.message);
    if (instructionsInput) {
      state.instructions = String(instructionsInput.value ?? state.instructions);
    }
    if (contextMessagesInput) {
      state.contextMessageLimit = clampContextMessageCount(contextMessagesInput.value);
    }
    if (includePersonaInput) {
      state.includePersona = includePersonaInput.checked === true;
    }
  }

  async function loadSettings() {
    try {
      const raw = await api.pluginStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state.targetTurns = clampTurnCount(parsed?.turns);
      state.retryCount = clampRetryCount(parsed?.retries);
      state.contextMessageLimit = clampContextMessageCount(parsed?.contextMessages);
      state.mode = parsed?.mode === MODE_GENERATED ? MODE_GENERATED : MODE_FIXED;
      if (typeof parsed?.message === 'string' && parsed.message.trim()) {
        state.message = parsed.message;
      }
      if (typeof parsed?.instructions === 'string') {
        state.instructions = parsed.instructions;
      }
      state.includePersona = parsed?.includePersona === true;
    } catch (error) {
      console.warn('[Autopilot] 설정을 불러오지 못했습니다.', error);
    }
  }

  async function saveSettings() {
    try {
      await api.pluginStorage.setItem(STORAGE_KEY, JSON.stringify({
        turns: state.targetTurns,
        retries: state.retryCount,
        mode: state.mode,
        message: state.message,
        instructions: state.instructions,
        contextMessages: state.contextMessageLimit,
        includePersona: state.includePersona,
      }));
    } catch (error) {
      console.warn('[Autopilot] 설정을 저장하지 못했습니다.', error);
    }
  }

  function scheduleSettingsSave() {
    syncFormStateFromDOM();
    if (settingsSaveTimer !== null) clearTimeout(settingsSaveTimer);
    settingsSaveTimer = setTimeout(() => {
      settingsSaveTimer = null;
      void saveSettings();
    }, 300);
  }

  async function flushSettingsSave() {
    syncFormStateFromDOM();
    if (settingsSaveTimer !== null) {
      clearTimeout(settingsSaveTimer);
      settingsSaveTimer = null;
    }
    await saveSettings();
  }

  async function closeUI() {
    await flushSettingsSave();
    await api.hideContainer();
  }

  function installStyle() {
    if (document.getElementById('risu-autopilot-style')) return;
    const style = document.createElement('style');
    style.id = 'risu-autopilot-style';
    style.textContent = `
      :root {
        font-family: Inter, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background-color: transparent !important;
      }
      * {
        box-sizing: border-box;
        scrollbar-width: thin;
        scrollbar-color: #8064d6 rgba(255, 255, 255, .045);
      }
      *::-webkit-scrollbar { width: 10px; height: 10px; }
      *::-webkit-scrollbar-track {
        border-radius: 999px;
        background: rgba(255, 255, 255, .035);
      }
      *::-webkit-scrollbar-thumb {
        min-height: 34px;
        border: 2px solid transparent;
        border-radius: 999px;
        background: linear-gradient(180deg, #9678f0, #6650b9) padding-box;
      }
      *::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #aa91ff, #7960d4) padding-box;
      }
      *::-webkit-scrollbar-corner { background: transparent; }
      html, body {
        width: 100%;
        min-height: 100%;
        margin: 0;
        background: transparent !important;
      }
      body {
        min-height: 100vh;
        color: #f6f2ff;
        background: transparent !important;
      }
      button, input, textarea { font: inherit; }
      button { cursor: pointer; }
      .app {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 28px 18px;
        background: transparent;
      }
      .panel {
        position: fixed;
        top: 50%;
        left: 50%;
        width: min(560px, 100%);
        max-height: calc(100vh - 32px);
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: 24px;
        overflow: hidden;
        background: #181426;
        box-shadow: 0 24px 80px rgba(0, 0, 0, .42);
        transform: translate(-50%, -50%);
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 22px 24px 16px;
        cursor: grab;
        touch-action: none;
        user-select: none;
      }
      .panel.dragging .header { cursor: grabbing; }
      .eyebrow {
        margin: 0 0 5px;
        color: #bdaaff;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: .11em;
        text-transform: uppercase;
      }
      h1 { margin: 0; font-size: 24px; letter-spacing: -.03em; }
      .icon-button {
        width: 38px;
        height: 38px;
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: 12px;
        color: #eee8ff;
        background: rgba(255, 255, 255, .06);
      }
      .content {
        max-height: calc(100vh - 102px);
        padding: 8px 24px 24px;
        overflow-y: auto;
      }
      .context {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 16px;
      }
      .context-card, .message-card, .status-card, .availability {
        border: 1px solid rgba(255, 255, 255, .09);
        border-radius: 16px;
        background: rgba(255, 255, 255, .045);
      }
      .context-card { min-width: 0; padding: 12px 14px; }
      .label {
        display: block;
        margin-bottom: 5px;
        color: #aaa1bc;
        font-size: 12px;
        font-weight: 700;
      }
      .context-value {
        display: block;
        overflow: hidden;
        color: #f6f2ff;
        font-size: 14px;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        margin-bottom: 18px;
        padding: 5px;
        border: 1px solid rgba(255, 255, 255, .09);
        border-radius: 15px;
        background: rgba(7, 6, 12, .38);
      }
      .tab {
        min-height: 42px;
        border: 0;
        border-radius: 11px;
        color: #9f97b1;
        background: transparent;
        font-weight: 800;
      }
      .tab.active {
        color: #f7f3ff;
        background: rgba(140, 104, 255, .2);
        box-shadow: inset 0 0 0 1px rgba(180, 158, 255, .15);
      }
      .phase-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 14px;
      }
      .phase-badge, .mode-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
      }
      .phase-badge { color: #d9ceff; background: rgba(140, 104, 255, .14); }
      .mode-badge { color: #b9e9ed; background: rgba(80, 206, 216, .11); }
      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #9c7cff;
        box-shadow: 0 0 0 4px rgba(156, 124, 255, .12);
      }
      .running .dot { animation: pulse 1.15s ease-in-out infinite; }
      @keyframes pulse { 50% { opacity: .35; transform: scale(.72); } }
      .message-card { margin-bottom: 18px; padding: 14px 16px; }
      code {
        color: #d8ccff;
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: 14px;
      }
      .message-card code {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .field { margin-bottom: 16px; }
      .field label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
        font-weight: 800;
      }
      .hint { color: #938aa6; font-size: 12px; font-weight: 500; }
      input[type="number"], textarea {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, .13);
        border-radius: 14px;
        outline: none;
        color: #fff;
        background: rgba(7, 6, 12, .5);
      }
      input[type="number"] { height: 50px; padding: 0 15px; }
      textarea {
        min-height: 104px;
        padding: 13px 15px;
        line-height: 1.5;
        resize: vertical;
      }
      #autopilot-instructions { min-height: 150px; }
      input[type="number"]:focus, textarea:focus {
        border-color: #9d7cff;
        box-shadow: 0 0 0 3px rgba(157, 124, 255, .14);
      }
      .settings-fold {
        margin: 0 0 16px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, .1);
        border-radius: 16px;
        background: rgba(255, 255, 255, .035);
      }
      .settings-fold summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        min-height: 62px;
        padding: 12px 14px;
        color: #f2edff;
        cursor: pointer;
        list-style: none;
        user-select: none;
      }
      .settings-fold summary::-webkit-details-marker { display: none; }
      .settings-fold summary:hover { background: rgba(157, 124, 255, .07); }
      .settings-fold summary:focus-visible {
        outline: 2px solid #9d7cff;
        outline-offset: -2px;
      }
      .settings-fold[open] summary {
        border-bottom: 1px solid rgba(255, 255, 255, .08);
        background: rgba(157, 124, 255, .055);
      }
      .settings-fold-copy { display: grid; gap: 3px; min-width: 0; }
      .settings-fold-title { font-size: 14px; font-weight: 850; }
      .settings-fold-description {
        overflow: hidden;
        color: #9f97b1;
        font-size: 12px;
        font-weight: 500;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .settings-fold-chevron {
        flex: 0 0 auto;
        color: #bdaaff;
        font-size: 20px;
        line-height: 1;
        transition: transform .18s ease;
      }
      .settings-fold[open] .settings-fold-chevron { transform: rotate(180deg); }
      .settings-fold-body { padding: 16px 14px 0; }
      .option-card {
        display: flex;
        align-items: flex-start;
        gap: 11px;
        margin: 0 0 16px;
        padding: 13px 14px;
        border: 1px solid rgba(255, 255, 255, .1);
        border-radius: 15px;
        background: rgba(255, 255, 255, .035);
        cursor: pointer;
      }
      .option-card input {
        flex: 0 0 auto;
        width: 18px;
        height: 18px;
        margin: 2px 0 0;
        accent-color: #8f6cff;
      }
      .option-copy { display: grid; gap: 3px; }
      .option-title { color: #f2edff; font-size: 14px; font-weight: 800; }
      .option-description { color: #9f97b1; font-size: 12px; font-weight: 500; line-height: 1.45; }
      .availability {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 16px;
        padding: 12px 14px;
        color: #c9c2d7;
        font-size: 13px;
        line-height: 1.5;
      }
      .availability.good {
        border-color: rgba(80, 206, 216, .2);
        color: #d2f6f8;
        background: rgba(30, 112, 119, .14);
      }
      .availability.blocked {
        border-color: rgba(255, 190, 88, .22);
        color: #ffe7bd;
        background: rgba(132, 84, 22, .17);
      }
      .availability-icon { flex: 0 0 auto; font-weight: 900; }
      .notice {
        margin: 0 0 18px;
        color: #aaa1bc;
        font-size: 13px;
        line-height: 1.55;
      }
      .status-card { margin-bottom: 18px; padding: 16px; }
      .status-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 12px;
      }
      .status-text { color: #ddd6eb; font-size: 14px; line-height: 1.45; }
      .counter { color: #cdbfff; font-size: 14px; font-weight: 900; white-space: nowrap; }
      .progress {
        width: 100%;
        height: 9px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255, 255, 255, .08);
      }
      .progress > span {
        display: block;
        width: var(--progress);
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #8c68ff, #50ced8);
        transition: width .25s ease;
      }
      .error-box {
        margin: 0 0 18px;
        padding: 13px 14px;
        border: 1px solid rgba(255, 102, 129, .28);
        border-radius: 14px;
        color: #ffd6dd;
        background: rgba(147, 35, 60, .18);
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .button {
        min-height: 48px;
        padding: 0 16px;
        border: 0;
        border-radius: 14px;
        font-weight: 850;
      }
      .button.primary {
        color: #fff;
        background: linear-gradient(135deg, #8f6cff, #6651d8);
        box-shadow: 0 9px 25px rgba(104, 77, 216, .28);
      }
      .button.secondary {
        border: 1px solid rgba(255, 255, 255, .11);
        color: #ddd6eb;
        background: rgba(255, 255, 255, .055);
      }
      .button.danger {
        border: 1px solid rgba(255, 104, 132, .25);
        color: #ffdce2;
        background: rgba(146, 39, 61, .24);
      }
      .button:disabled { cursor: not-allowed; opacity: .48; }
      @media (max-width: 520px) {
        .app { padding: 0; place-items: stretch; }
        .panel {
          position: relative;
          top: auto;
          left: auto;
          max-height: none;
          min-height: 100vh;
          border-radius: 0;
          transform: none;
        }
        .header { padding: 20px 18px 14px; cursor: default; }
        .content { max-height: none; padding: 8px 18px 22px; }
        .context { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function phaseLabel() {
    switch (state.phase) {
      case 'permission': return '권한 확인 중';
      case 'generating': return '사용자 응답 생성 중';
      case 'sending': return '응답 및 후처리 대기 중';
      case 'retrying': return '오류 재시도 대기 중';
      case 'cooldown': return '다음 턴 준비 중';
      case 'stopping': return '중지 대기 중';
      case 'completed': return '완료';
      case 'stopped': return '중지됨';
      case 'error': return '오류로 중단됨';
      default: return '준비';
    }
  }

  function clampPanelPosition(panel, left, top) {
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - panel.offsetWidth - margin);
    const maxTop = Math.max(margin, window.innerHeight - panel.offsetHeight - margin);
    return {
      left: Math.min(maxLeft, Math.max(margin, left)),
      top: Math.min(maxTop, Math.max(margin, top)),
    };
  }

  function applyPanelPosition() {
    if (!state.panelPosition || window.innerWidth <= 520) return;
    const panel = document.querySelector('.panel');
    if (!panel) return;
    const position = clampPanelPosition(
      panel,
      state.panelPosition.left,
      state.panelPosition.top,
    );
    state.panelPosition = position;
    panel.style.left = `${position.left}px`;
    panel.style.top = `${position.top}px`;
    panel.style.transform = 'none';
  }

  function startPanelDrag(event) {
    if (event.button !== 0 || window.innerWidth <= 520) return;
    const header = event.target.closest('.header');
    if (!header || event.target.closest('button, input, textarea, a')) return;
    const panel = header.closest('.panel');
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    state.panelPosition = { left: rect.left, top: rect.top };
    dragSession = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    panel.classList.add('dragging');
    try { header.setPointerCapture(event.pointerId); } catch (error) {}
    event.preventDefault();
  }

  function movePanel(event) {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const panel = document.querySelector('.panel');
    if (!panel) return;
    state.panelPosition = clampPanelPosition(
      panel,
      event.clientX - dragSession.offsetX,
      event.clientY - dragSession.offsetY,
    );
    applyPanelPosition();
  }

  function stopPanelDrag(event) {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    dragSession = null;
    document.querySelector('.panel')?.classList.remove('dragging');
  }

  function renderProgress(progress) {
    return `
      <div class="status-card">
        <div class="status-line">
          <span class="status-text">${escapeHTML(state.status)}</span>
          <span class="counter">${state.completedTurns} / ${state.targetTurns}</span>
        </div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
          <span style="--progress: ${progress}%"></span>
        </div>
      </div>
    `;
  }

  function renderIdleSettings(progress) {
    const generatedMode = state.mode === MODE_GENERATED;
    const generatedDisabled = generatedMode && !state.generatedReady;
    return `
      <div class="tabs" role="tablist" aria-label="자동 진행 모드">
        <button class="tab${generatedMode ? '' : ' active'}" type="button" role="tab"
          aria-selected="${generatedMode ? 'false' : 'true'}" data-action="select-mode" data-mode="${MODE_FIXED}">
          고정 메시지
        </button>
        <button class="tab${generatedMode ? ' active' : ''}" type="button" role="tab"
          aria-selected="${generatedMode ? 'true' : 'false'}" data-action="select-mode" data-mode="${MODE_GENERATED}">
          AI 자동 응답
        </button>
      </div>

      ${generatedMode ? `
        <details class="settings-fold">
          <summary>
            <span class="settings-fold-copy">
              <span class="settings-fold-title">응답 생성 설정</span>
              <span class="settings-fold-description">작성 지침 · 대화 컨텍스트 · 사용자 페르소나</span>
            </span>
            <span class="settings-fold-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div class="settings-fold-body">
            <div class="field">
              <label for="autopilot-instructions">
                작성 지침 프롬프트
                <span class="hint">보조모델에 매 턴 적용</span>
              </label>
              <textarea id="autopilot-instructions" spellcheck="true">${escapeHTML(state.instructions)}</textarea>
            </div>
            <div class="field">
              <label for="autopilot-context-messages">
                전달할 최근 메시지 수
                <span class="hint">${MIN_CONTEXT_MESSAGES}–${MAX_CONTEXT_MESSAGES}개 · 기본 ${DEFAULT_CONTEXT_MESSAGES}개</span>
              </label>
              <input id="autopilot-context-messages" type="number" min="${MIN_CONTEXT_MESSAGES}" max="${MAX_CONTEXT_MESSAGES}" step="1" value="${state.contextMessageLimit}">
            </div>
            <label class="option-card" for="autopilot-include-persona">
              <input id="autopilot-include-persona" type="checkbox" ${state.includePersona ? 'checked' : ''}>
              <span class="option-copy">
                <span class="option-title">페르소나 정보 포함</span>
                <span class="option-description">채팅에 바인드되거나 현재 선택된 페르소나 정보를 보조모델에 전달합니다.</span>
              </span>
            </label>
          </div>
        </details>
        <div class="availability ${state.generatedReady ? 'good' : 'blocked'}">
          <span class="availability-icon">${state.generatedReady ? '✓' : '!'}</span>
          <span>${escapeHTML(state.generatedReady
            ? '마지막 실제 메시지가 캐릭터 응답입니다. AI 자동 응답을 시작할 수 있습니다.'
            : state.generatedBlockReason)}</span>
        </div>
      ` : `
        <div class="field">
          <label for="autopilot-message">
            전송 메시지
            <span class="hint">매 턴 동일하게 전송</span>
          </label>
          <textarea id="autopilot-message" spellcheck="true">${escapeHTML(state.message)}</textarea>
        </div>
      `}

      <div class="field">
        <label for="autopilot-turns">
          자동 진행 턴 수
          <span class="hint">${MIN_TURNS}–${MAX_TURNS}턴</span>
        </label>
        <input id="autopilot-turns" type="number" min="${MIN_TURNS}" max="${MAX_TURNS}" step="1" value="${state.targetTurns}">
      </div>

      <div class="field">
        <label for="autopilot-retries">
          오류 시 재시도 횟수
          <span class="hint">0–${MAX_RETRIES}회 · 0회는 사용 안 함</span>
        </label>
        <input id="autopilot-retries" type="number" min="0" max="${MAX_RETRIES}" step="1" value="${state.retryCount}">
        <p class="hint">모델 생성·전송 실패 시 2초 후 재시도합니다. 각 단계의 최초 요청에 추가되는 횟수입니다.</p>
      </div>

      <p class="notice">${generatedMode
        ? '각 턴마다 RisuAI의 기타 보조모델이 최근 실제 대화와 마지막 캐릭터 응답을 바탕으로 사용자 메시지를 작성합니다. 첫 메시지만 있는 새 채팅에서는 시작할 수 없습니다.'
        : '1턴은 메시지 1회 전송과 AI 응답의 전체 후처리 완료까지입니다. 오류 응답이나 응답 누락 시 설정한 횟수만큼 재시도한 뒤 중단됩니다.'}</p>
      ${state.error ? `<div class="error-box" role="alert">${escapeHTML(state.error)}</div>` : ''}
      ${state.phase === 'completed' || state.phase === 'stopped' ? renderProgress(progress) : ''}
      <div class="actions">
        <button class="button primary" type="button" data-action="start" ${generatedDisabled ? 'disabled' : ''}>
          ${generatedMode ? 'AI 자동 응답 시작' : '자동 진행 시작'}
        </button>
        <button class="button secondary" type="button" data-action="close">취소</button>
      </div>
    `;
  }

  function render() {
    installStyle();
    const progress = state.targetTurns > 0
      ? Math.min(100, Math.round((state.completedTurns / state.targetTurns) * 100))
      : 0;
    const runningClass = state.running ? ' running' : '';
    const characterName = state.activeCharacterName || '현재 캐릭터';
    const chatName = state.activeChatName || '현재 채팅';
    const generatedMode = state.mode === MODE_GENERATED;
    const displayedMessage = generatedMode ? state.generatedMessage : state.message;

    document.body.innerHTML = `
      <main class="app${runningClass}">
        <section class="panel" aria-label="Autopilot 설정">
          <header class="header">
            <div>
              <p class="eyebrow">RisuAI Plugin</p>
              <h1>Autopilot</h1>
            </div>
            <button class="icon-button" type="button" data-action="close" aria-label="화면 닫기">✕</button>
          </header>
          <div class="content">
            <div class="phase-row">
              <div class="phase-badge"><span class="dot"></span>${escapeHTML(phaseLabel())}</div>
              ${state.running ? `<div class="mode-badge">${generatedMode ? 'AI 자동 응답' : '고정 메시지'}</div>` : ''}
            </div>

            <div class="context">
              <div class="context-card">
                <span class="label">캐릭터</span>
                <span class="context-value">${escapeHTML(characterName)}</span>
              </div>
              <div class="context-card">
                <span class="label">채팅</span>
                <span class="context-value">${escapeHTML(chatName)}</span>
              </div>
            </div>

            ${state.running ? `
              <div class="message-card">
                <span class="label">${generatedMode ? '최근 생성된 전송 메시지' : '전송 메시지'}</span>
                <code>${escapeHTML(displayedMessage || '보조모델 응답을 생성하는 중입니다.')}</code>
              </div>
              ${renderProgress(progress)}
              <p class="notice">중지를 눌러도 진행 중인 보조모델 또는 메인모델 호출은 강제로 취소하지 않습니다. 현재 호출이 끝난 뒤 다음 전송을 막습니다.</p>
              <div class="actions">
                <button class="button danger" type="button" data-action="stop" ${state.stopRequested ? 'disabled' : ''}>
                  ${state.stopRequested ? '중지 대기 중' : '자동 진행 중지'}
                </button>
                <button class="button secondary" type="button" data-action="close">채팅 보기</button>
              </div>
            ` : renderIdleSettings(progress)}
          </div>
        </section>
      </main>
    `;
    applyPanelPosition();
  }

  async function refreshContext() {
    try {
      const [characterIndex, chatIndex, character] = await Promise.all([
        api.getCurrentCharacterIndex(),
        api.getCurrentChatIndex(),
        api.getCharacter(),
      ]);
      state.activeCharacterIndex = characterIndex;
      state.activeChatIndex = chatIndex;
      state.activeCharacterName = String(character?.name || '이름 없는 캐릭터');
      const chat = await api.getChatFromIndex(characterIndex, chatIndex);
      state.activeChatName = String(chat?.name || `채팅 ${Number(chatIndex) + 1}`);
      updateGeneratedEligibility(chat);
      return chat;
    } catch (error) {
      state.activeCharacterName = '캐릭터 확인 실패';
      state.activeChatName = '채팅 확인 실패';
      state.generatedReady = false;
      state.generatedBlockReason = '현재 채팅 정보를 읽지 못했습니다.';
      console.warn('[Autopilot] 현재 채팅 정보를 읽지 못했습니다.', error);
      return null;
    }
  }

  async function requestSendChatPermissionBeforeUI() {
    if (typeof api.sendChat !== 'function') {
      try {
        await api.alertError(
          '현재 RisuAI 버전에는 플러그인 sendChat API가 없습니다.\n\nRisuAI를 v2026.3.330 이상으로 업데이트해 주세요.',
        );
      } catch (error) {
        console.error('[Autopilot] 버전 오류 알림을 표시하지 못했습니다.', error);
      }
      return false;
    }

    try {
      const permission = await api.requestPluginPermission('sendChat');
      if (permission === true) return true;
      await api.alertError('채팅 자동 전송 권한이 허용되지 않아 설정 화면을 열지 않았습니다.');
    } catch (error) {
      console.error('[Autopilot] sendChat 권한 요청에 실패했습니다.', error);
      try {
        await api.alertError(`채팅 자동 전송 권한을 확인하지 못했습니다.\n\n${errorMessage(error)}`);
      } catch (alertError) {
        console.error('[Autopilot] 권한 오류 알림을 표시하지 못했습니다.', alertError);
      }
    }
    return false;
  }

  async function openUI() {
    const permissionGranted = await requestSendChatPermissionBeforeUI();
    if (!permissionGranted) return;
    if (!state.running) await refreshContext();
    state.panelPosition = null;
    dragSession = null;
    render();
    await api.showContainer('fullscreen');
  }

  async function sameActiveChat() {
    const [characterIndex, chatIndex] = await Promise.all([
      api.getCurrentCharacterIndex(),
      api.getCurrentChatIndex(),
    ]);
    return characterIndex === state.activeCharacterIndex
      && chatIndex === state.activeChatIndex;
  }

  async function waitForCooldown(token) {
    const endAt = Date.now() + COOLDOWN_MS;
    while (Date.now() < endAt) {
      if (state.stopRequested || token !== state.sessionToken) return false;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return true;
  }

  async function stopWithError(reason, details = '') {
    state.running = false;
    state.stopRequested = false;
    state.phase = 'error';
    state.status = '오류가 감지되어 다음 전송을 중단했습니다.';
    state.error = details ? `${reason}\n${details}` : reason;
    render();
    console.error(`[${PLUGIN_NAME}] ${state.error}`);
    try {
      await api.alertError(`Autopilot 중단\n\n${state.error}`);
    } catch (error) {
      console.error('[Autopilot] 오류 알림을 표시하지 못했습니다.', error);
    }
  }

  function finishStopped() {
    state.running = false;
    state.stopRequested = false;
    state.phase = 'stopped';
    state.status = `${state.completedTurns}턴 완료 후 사용자가 중지했습니다.`;
    render();
  }

  function finishCompleted() {
    state.running = false;
    state.stopRequested = false;
    state.phase = 'completed';
    state.status = `${state.targetTurns}턴 자동 진행을 완료했습니다.`;
    render();
  }

  async function resolvePersonaContext(chat) {
    if (!state.includePersona) return null;
    if (typeof api.getDatabase !== 'function') {
      throw new Error('현재 RisuAI 버전에는 플러그인 getDatabase API가 없습니다.');
    }

    const permission = await api.requestPluginPermission('db');
    if (permission !== true) {
      throw new Error('페르소나 정보를 읽기 위한 DB 권한이 허용되지 않았습니다.');
    }

    const database = await api.getDatabase(['personas', 'selectedPersona']);
    if (!database) {
      throw new Error('RisuAI 데이터베이스에서 페르소나 정보를 읽지 못했습니다.');
    }

    const personas = Array.isArray(database.personas) ? database.personas : [];
    let persona = null;
    const bindedPersonaId = String(chat?.bindedPersona || '');

    if (bindedPersonaId) {
      persona = personas.find((item) => String(item?.id || '') === bindedPersonaId) || null;
    }

    if (!persona) {
      const selectedIndex = Number.parseInt(String(database.selectedPersona), 10);
      if (Number.isInteger(selectedIndex) && selectedIndex >= 0) {
        persona = personas[selectedIndex] || null;
      }
    }

    if (!persona) {
      throw new Error('채팅에 바인드되었거나 현재 선택된 페르소나를 찾지 못했습니다.');
    }

    return {
      personaPrompt: String(persona?.personaPrompt || ''),
    };
  }

  function buildGenerationMessages(chat, source) {
    const recentMessages = messagesOf(chat)
      .map((message, index) => ({ message, index }))
      .filter(({ message, index }) => index <= source.index && isRelevantConversationMessage(message))
      .slice(-clampContextMessageCount(state.contextMessageLimit))
      .map(({ message }) => ({
        role: message.role === 'char' ? 'character' : 'user',
        speaker: String(message?.name || (
          message.role === 'char' ? state.activeCharacterName || '캐릭터' : '사용자'
        )),
        content: String(message?.data || ''),
      }));

    const instructions = state.instructions.trim() || DEFAULT_INSTRUCTIONS;
    const personaInformation = state.includePersona && state.personaContext
      ? [
        'The <persona_json> below is the user\'s persona.',
        'Refer to it when adopting the user\'s identity, personality, and tone in the current chat.',
        'If the persona information conflicts with other output rules, prioritize the output rules.',
        '<persona_json>',
        JSON.stringify(state.personaContext, null, 2),
        '</persona_json>',
      ].join('\n')
      : '';
    return [
      {
        role: 'system',
        content: [
          'You are an assistant writer who writes the user\'s next message in an AI roleplay chat.',
          'The output must be solely a single user message body to be sent directly to the actual chat.',
          'Do not output explanations, analyses, prefaces, candidate lists, or code fences.',
          'Respond in the primary language used in the current chat.',
          personaInformation,
          `Writing Instructions:\n${instructions}`,
        ].filter(Boolean).join('\n\n'),
      },
      {
        role: 'user',
        content: [
          'Write a user message that naturally follows the last character message in the following conversation.',
          '<conversation_json>',
          JSON.stringify(recentMessages, null, 2),
          '</conversation_json>',
        ].join('\n'),
      },
    ];
  }

  function generatedTextFromResult(result) {
    if (result?.type === 'fail') {
      throw new Error(String(result.result || '보조모델 요청이 실패했습니다.'));
    }
    if (result?.type && result.type !== 'success') {
      throw new Error(`지원하지 않는 보조모델 응답 형식입니다: ${String(result.type)}`);
    }

    let text = '';
    if (typeof result === 'string') text = result;
    else if (typeof result?.result === 'string') text = result.result;

    text = text
      .replace(/^\s*<Thoughts>[\s\S]*?<\/Thoughts>\s*/i, '')
      .trim();

    if (!text) throw new Error('보조모델이 빈 메시지를 반환했습니다.');
    if (/```risuerror(?:\s|$)/i.test(text)) {
      throw new Error(`보조모델이 RisuAI 오류 응답을 반환했습니다.\n${text}`);
    }
    return text;
  }

  async function generateNextUserMessage(chat, source) {
    const result = await api.runLLMModel({
      messages: buildGenerationMessages(chat, source),
      mode: 'otherAx',
      allowPlugins: true,
    });
    return generatedTextFromResult(result);
  }

  function checkRetrySession(token) {
    if (token !== state.sessionToken || state.stopRequested) throw new Error('자동 진행이 중지되었습니다.');
  }

  async function withRetries(token, label, operation, prepareRetry) {
    for (let attempt = 0; ; attempt += 1) {
      checkRetrySession(token);
      try {
        return await operation();
      } catch (error) {
        checkRetrySession(token);
        if (error.noRetry || attempt >= state.retryCount) throw error;
        state.phase = 'retrying';
        state.status = label + ' 재시도 ' + (attempt + 1) + '/' + state.retryCount + ' · 2초 대기';
        state.error = errorMessage(error);
        render();
        const deadline = Date.now() + RETRY_DELAY_MS;
        while (Date.now() < deadline) {
          checkRetrySession(token);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        checkRetrySession(token);
        if (!await sameActiveChat()) throw new Error('재시도 전 캐릭터 또는 채팅이 변경되었습니다.');
        await prepareRetry();
        checkRetrySession(token);
        state.phase = label === '보조모델' ? 'generating' : 'sending';
        state.status = label + ' 재시도 ' + (attempt + 1) + '/' + state.retryCount;
        state.error = '';
        render();
      }
    }
  }

  async function prepareChatRetry(beforeChat, outgoingMessage) {
    const chat = await api.getChatFromIndex(state.activeCharacterIndex, state.activeChatIndex);
    if (!chat || !Array.isArray(chat.message) || chat.isStreaming) {
      throw new Error('채팅 상태를 확인할 수 없거나 스트리밍 중이므로 재시도를 중단했습니다.');
    }
    const original = messagesOf(beforeChat);
    const prefix = { ...chat, message: chat.message.slice(0, original.length) };
    if (conversationSignature(prefix) !== conversationSignature(beforeChat)) {
      throw new Error('기존 대화가 변경되어 재시도를 중단했습니다.');
    }
    const added = chat.message.slice(original.length);
    // Remove only the failed attempt's own user message and empty/error responses.
    const safe = added.length === 0 || (
      added[0]?.role === 'user' && String(added[0].data || '') === outgoingMessage
      && added.slice(1).every((message) => isCharacterMessage(message)
        && (containsRisuError(message) || !String(message.data || '').trim()))
    );
    if (!safe) throw new Error('새 메시지가 남아 있어 중복 전송 방지를 위해 재시도를 중단했습니다.');
    if (added.length) {
      if (typeof api.setChatToIndex !== 'function') throw new Error('실패한 전송을 정리할 API가 없습니다.');
      await api.setChatToIndex(state.activeCharacterIndex, state.activeChatIndex, { ...chat, message: chat.message.slice(0, original.length) });
      const verified = await api.getChatFromIndex(state.activeCharacterIndex, state.activeChatIndex);
      if (!verified || conversationSignature(verified) !== conversationSignature(beforeChat)) {
        throw new Error('실패한 전송 정리를 확인하지 못했습니다.');
      }
    }
  }

  async function runAutopilot(token) {
    while (state.completedTurns < state.targetTurns) {
      if (token !== state.sessionToken) return;
      if (state.stopRequested) {
        finishStopped();
        return;
      }

      let activeChatMatches;
      try {
        activeChatMatches = await sameActiveChat();
      } catch (error) {
        await stopWithError('현재 채팅을 확인하지 못했습니다.', errorMessage(error));
        return;
      }
      if (!activeChatMatches) {
        await stopWithError('실행 중 캐릭터 또는 채팅이 변경되었습니다.');
        return;
      }

      let beforeChat;
      try {
        beforeChat = await api.getChatFromIndex(
          state.activeCharacterIndex,
          state.activeChatIndex,
        );
      } catch (error) {
        await stopWithError('전송 전 채팅 상태를 읽지 못했습니다.', errorMessage(error));
        return;
      }
      if (!beforeChat || !Array.isArray(beforeChat.message)) {
        await stopWithError('활성 채팅의 메시지 목록을 찾을 수 없습니다.');
        return;
      }

      let outgoingMessage = state.message;
      if (state.mode === MODE_GENERATED) {
        const source = updateGeneratedEligibility(beforeChat);
        if (!source.ok) {
          await stopWithError('AI 자동 응답 모드를 계속할 수 없습니다.', source.reason);
          return;
        }

        const signatureBeforeGeneration = conversationSignature(beforeChat);
        state.phase = 'generating';
        state.status = `${state.completedTurns + 1}번째 사용자 메시지를 보조모델로 생성하는 중입니다.`;
        state.error = '';
        render();

        try {
          outgoingMessage = await withRetries(token, '보조모델',
            () => generateNextUserMessage(beforeChat, source),
            async () => {
              const current = await api.getChatFromIndex(state.activeCharacterIndex, state.activeChatIndex);
              if (!current || conversationSignature(current) !== signatureBeforeGeneration) {
                throw new Error('보조모델 재시도 전 채팅 내용이 변경되었습니다.');
              }
            });
        } catch (error) {
          if (token !== state.sessionToken) return;
          if (state.stopRequested) { finishStopped(); return; }
          await stopWithError('보조모델이 사용자 메시지를 생성하지 못했습니다.', errorMessage(error));
          return;
        }

        if (token !== state.sessionToken) return;
        if (state.stopRequested) {
          finishStopped();
          return;
        }

        try {
          activeChatMatches = await sameActiveChat();
        } catch (error) {
          await stopWithError('보조모델 생성 후 현재 채팅을 확인하지 못했습니다.', errorMessage(error));
          return;
        }
        if (!activeChatMatches) {
          await stopWithError('보조모델 생성 중 캐릭터 또는 채팅이 변경되었습니다.');
          return;
        }

        let latestChat;
        try {
          latestChat = await api.getChatFromIndex(
            state.activeCharacterIndex,
            state.activeChatIndex,
          );
        } catch (error) {
          await stopWithError('보조모델 생성 후 채팅 상태를 읽지 못했습니다.', errorMessage(error));
          return;
        }
        if (!latestChat || !Array.isArray(latestChat.message)) {
          await stopWithError('보조모델 생성 후 메시지 목록을 찾을 수 없습니다.');
          return;
        }
        if (conversationSignature(latestChat) !== signatureBeforeGeneration) {
          await stopWithError(
            '보조모델 생성 중 채팅 내용이 변경되었습니다.',
            '생성된 메시지는 전송하지 않았습니다.',
          );
          return;
        }

        const latestSource = updateGeneratedEligibility(latestChat);
        if (!latestSource.ok || latestSource.identity !== source.identity) {
          await stopWithError(
            '메시지 생성의 기준이 된 캐릭터 응답이 변경되었습니다.',
            '생성된 메시지는 전송하지 않았습니다.',
          );
          return;
        }

        beforeChat = latestChat;
        state.generatedMessage = outgoingMessage;
      }

      if (!String(outgoingMessage || '').trim()) {
        await stopWithError('전송할 사용자 메시지가 비어 있습니다.');
        return;
      }

      let afterChat;
      try {
        afterChat = await withRetries(token, '채팅 전송', async () => {
          const before = snapshotChat(beforeChat);
          const startedAt = Date.now();
          state.phase = 'sending';
          state.status = (state.completedTurns + 1) + '번째 메시지를 전송하고 전체 후처리를 기다리는 중입니다.';
          render();
          const sendResult = await api.sendChat(outgoingMessage);
          checkRetrySession(token);
          if (!await sameActiveChat()) {
            throw Object.assign(new Error('응답 처리 중 캐릭터 또는 채팅이 변경되었습니다.'), { noRetry: true });
          }
          const chat = await api.getChatFromIndex(state.activeCharacterIndex, state.activeChatIndex);
          if (!chat || !Array.isArray(chat.message)) throw new Error('응답 후 메시지 목록을 찾을 수 없습니다.');
          if (chat.isStreaming) throw Object.assign(new Error('응답 스트리밍이 종료되지 않았습니다.'), { noRetry: true });
          if (sendResult === false) throw new Error('RisuAI가 채팅 전송을 완료하지 못했습니다.');
          const risuError = findNewRisuError(before, chat);
          if (risuError) throw new Error('RisuAI 오류 응답이 생성되었습니다.\n' + String(risuError.data || ''));
          const responses = findNewCharacterMessages(before, chat, startedAt);
          if (!responses.length) throw new Error('새 AI 응답이 추가되지 않았습니다.');
          if (!String(responses.at(-1)?.data || '').trim()) throw new Error('AI 응답이 비어 있습니다.');
          return chat;
        }, () => prepareChatRetry(beforeChat, outgoingMessage));
      } catch (error) {
        if (token !== state.sessionToken) return;
        if (state.stopRequested) { finishStopped(); return; }
        await stopWithError('채팅 전송을 완료하지 못했습니다.', errorMessage(error));
        return;
      }

      updateGeneratedEligibility(afterChat);
      state.completedTurns += 1;
      if (state.stopRequested) {
        finishStopped();
        return;
      }
      if (state.completedTurns >= state.targetTurns) {
        finishCompleted();
        return;
      }

      state.phase = 'cooldown';
      state.status = `${state.completedTurns}턴 완료. 다음 전송을 준비하는 중입니다.`;
      render();
      const shouldContinue = await waitForCooldown(token);
      if (!shouldContinue) {
        if (token === state.sessionToken) finishStopped();
        return;
      }
    }
  }

  function showIdleError(status, details) {
    state.phase = 'error';
    state.status = status;
    state.error = details;
    render();
  }

  async function startAutopilot() {
    if (state.running) return;
    syncFormStateFromDOM();

    if (typeof api.sendChat !== 'function') {
      showIdleError(
        '현재 RisuAI 버전에서는 시작할 수 없습니다.',
        '플러그인 sendChat API가 없습니다. RisuAI를 v2026.3.330 이상으로 업데이트해 주세요.',
      );
      return;
    }
    if (state.mode === MODE_GENERATED && typeof api.runLLMModel !== 'function') {
      showIdleError(
        'AI 자동 응답 모드를 시작할 수 없습니다.',
        '현재 RisuAI 버전에는 플러그인 runLLMModel API가 없습니다.',
      );
      return;
    }
    if (state.mode === MODE_FIXED && !state.message.trim()) {
      showIdleError('전송 메시지를 입력해 주세요.', '빈 메시지는 자동 전송할 수 없습니다.');
      return;
    }

    state.targetTurns = clampTurnCount(state.targetTurns);
    state.completedTurns = 0;
    state.generatedMessage = '';
    state.personaContext = null;
    state.error = '';
    state.sessionToken += 1;
    const token = state.sessionToken;
    state.running = true;
    state.stopRequested = false;
    state.phase = 'permission';
    state.status = '채팅 자동 전송 권한을 확인하는 중입니다.';
    render();
    await saveSettings();

    let permission;
    try {
      permission = await api.requestPluginPermission('sendChat');
    } catch (error) {
      await stopWithError('채팅 전송 권한을 요청하지 못했습니다.', errorMessage(error));
      return;
    }
    if (permission !== true) {
      await stopWithError('채팅 자동 전송 권한이 허용되지 않았습니다.');
      return;
    }
    if (state.stopRequested || token !== state.sessionToken) {
      if (token === state.sessionToken) finishStopped();
      return;
    }

    let chat;
    try {
      chat = await refreshContext();
      if (!chat || !Array.isArray(chat.message)) {
        await stopWithError('자동 진행을 시작할 활성 채팅이 없습니다.');
        return;
      }
    } catch (error) {
      await stopWithError('현재 채팅을 확인하지 못했습니다.', errorMessage(error));
      return;
    }

    if (state.mode === MODE_GENERATED) {
      const source = updateGeneratedEligibility(chat);
      if (!source.ok) {
        await stopWithError('AI 자동 응답 모드를 시작할 수 없습니다.', source.reason);
        return;
      }

      if (state.includePersona) {
        state.phase = 'permission';
        state.status = '현재 페르소나 정보를 확인하는 중입니다.';
        render();
        try {
          state.personaContext = await resolvePersonaContext(chat);
        } catch (error) {
          await stopWithError('페르소나 정보를 보조모델에 포함하지 못했습니다.', errorMessage(error));
          return;
        }
      }
    }

    if (state.stopRequested || token !== state.sessionToken) {
      if (token === state.sessionToken) finishStopped();
      return;
    }
    state.phase = state.mode === MODE_GENERATED ? 'generating' : 'sending';
    state.status = state.mode === MODE_GENERATED
      ? '첫 사용자 메시지를 보조모델로 생성합니다.'
      : '자동 진행을 시작합니다.';
    render();
    void runAutopilot(token).catch(async (error) => {
      if (token !== state.sessionToken) return;
      await stopWithError('예상하지 못한 오류로 자동 진행이 중단되었습니다.', errorMessage(error));
    });
  }

  function requestStop() {
    if (!state.running || state.stopRequested) return;
    state.stopRequested = true;
    state.phase = 'stopping';
    state.status = '현재 진행 중인 모델 호출이 끝나면 중단합니다.';
    render();
  }

  function selectMode(mode) {
    if (state.running) return;
    syncFormStateFromDOM();
    state.mode = mode === MODE_GENERATED ? MODE_GENERATED : MODE_FIXED;
    state.phase = 'idle';
    state.status = '자동 진행 모드와 턴 수를 설정해 주세요.';
    state.error = '';
    scheduleSettingsSave();
    render();
  }

  function bindEvents() {
    if (state.eventsBound) return;
    state.eventsBound = true;

    document.body.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'close') await closeUI();
      else if (action === 'start') await startAutopilot();
      else if (action === 'stop') requestStop();
      else if (action === 'select-mode') selectMode(target.dataset.mode);
    });

    document.body.addEventListener('pointerdown', startPanelDrag);
    document.addEventListener('pointermove', movePanel);
    document.addEventListener('pointerup', stopPanelDrag);
    document.addEventListener('pointercancel', stopPanelDrag);
    window.addEventListener('resize', applyPanelPosition);

    document.body.addEventListener('input', (event) => {
      if (![
        'autopilot-turns',
        'autopilot-retries',
        'autopilot-message',
        'autopilot-instructions',
        'autopilot-context-messages',
        'autopilot-include-persona',
      ].includes(event.target.id)) return;
      scheduleSettingsSave();
    });

    document.body.addEventListener('change', (event) => {
      if (event.target.id === 'autopilot-turns') {
        event.target.value = String(clampTurnCount(event.target.value));
      } else if (event.target.id === 'autopilot-retries') {
        event.target.value = String(clampRetryCount(event.target.value));
      } else if (event.target.id === 'autopilot-context-messages') {
        event.target.value = String(clampContextMessageCount(event.target.value));
      }
      if ([
        'autopilot-turns',
        'autopilot-retries',
        'autopilot-message',
        'autopilot-instructions',
        'autopilot-context-messages',
        'autopilot-include-persona',
      ].includes(event.target.id)) scheduleSettingsSave();
    });

    document.addEventListener('keydown', async (event) => {
      if (event.key === 'Escape') await closeUI();
      if (event.key === 'Enter' && !state.running
        && ['autopilot-turns', 'autopilot-context-messages', 'autopilot-retries'].includes(event.target.id)) {
        event.preventDefault();
        await startAutopilot();
      }
    });
  }

  try {
    await loadSettings();
    bindEvents();

    state.chatButtonPart = await api.registerButton({
      name: PLUGIN_NAME,
      icon: '⏩',
      iconType: 'html',
      location: 'chat',
      id: CHAT_BUTTON_ID,
    }, () => openUI());

    await api.onUnload(async () => {
      state.stopRequested = true;
      state.sessionToken += 1;
      await flushSettingsSave();
      window.removeEventListener('resize', applyPanelPosition);
      const chatButtonId = state.chatButtonPart?.id || state.chatButtonPart || CHAT_BUTTON_ID;
      if (chatButtonId) await api.unregisterUIPart(chatButtonId);
    });

    console.log('[Autopilot] v1.7.1 loaded');
  } catch (error) {
    console.error('[Autopilot] 초기화에 실패했습니다.', error);
  }
})();
