//@name autopilot
//@api 3.0
//@version 1.3.0
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
  const STORAGE_KEY = 'risu-autopilot:settings:v1';
  const CHAT_BUTTON_ID = 'risu-autopilot-chat-button';
  const MIN_TURNS = 1;
  const MAX_TURNS = 100;
  const DEFAULT_TURNS = 10;
  const COOLDOWN_MS = 800;

  const state = {
    running: false,
    stopRequested: false,
    sessionToken: 0,
    targetTurns: DEFAULT_TURNS,
    message: DEFAULT_MESSAGE,
    completedTurns: 0,
    phase: 'idle',
    status: '자동 진행할 턴 수를 설정해 주세요.',
    error: '',
    activeCharacterIndex: null,
    activeChatIndex: null,
    activeCharacterName: '',
    activeChatName: '',
    panelPosition: null,
    chatButtonPart: null,
    eventsBound: false,
  };

  let dragSession = null;

  function clampTurnCount(value) {
    const number = Number.parseInt(String(value), 10);
    if (!Number.isFinite(number)) return DEFAULT_TURNS;
    return Math.min(MAX_TURNS, Math.max(MIN_TURNS, number));
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

  async function loadSettings() {
    try {
      const raw = await api.pluginStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state.targetTurns = clampTurnCount(parsed?.turns);
      if (typeof parsed?.message === 'string' && parsed.message.trim()) {
        state.message = parsed.message;
      }
    } catch (error) {
      console.warn('[Autopilot] 설정을 불러오지 못했습니다.', error);
    }
  }

  async function saveSettings() {
    try {
      await api.pluginStorage.setItem(STORAGE_KEY, JSON.stringify({
        turns: state.targetTurns,
        message: state.message,
      }));
    } catch (error) {
      console.warn('[Autopilot] 설정을 저장하지 못했습니다.', error);
    }
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
      * { box-sizing: border-box; }
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
        transform: translate(-50%, -50%);
        width: min(520px, 100%);
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: 24px;
        background: #181426;
        box-shadow: 0 24px 80px rgba(0, 0, 0, .42);
        overflow: hidden;
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
      .content { padding: 8px 24px 24px; }
      .context {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 18px;
      }
      .context-card, .message-card, .status-card {
        border: 1px solid rgba(255, 255, 255, .09);
        border-radius: 16px;
        background: rgba(255, 255, 255, .045);
      }
      .context-card { padding: 12px 14px; min-width: 0; }
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
      input[type="number"] {
        height: 50px;
        padding: 0 15px;
      }
      textarea {
        min-height: 104px;
        padding: 13px 15px;
        line-height: 1.5;
        resize: vertical;
      }
      input[type="number"]:focus, textarea:focus {
        border-color: #9d7cff;
        box-shadow: 0 0 0 3px rgba(157, 124, 255, .14);
      }
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
      .actions.single { grid-template-columns: 1fr; }
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
      .phase-badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 14px;
        padding: 6px 10px;
        border-radius: 999px;
        color: #d9ceff;
        background: rgba(140, 104, 255, .14);
        font-size: 12px;
        font-weight: 800;
      }
      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #9c7cff;
        box-shadow: 0 0 0 4px rgba(156, 124, 255, .12);
      }
      .running .dot { animation: pulse 1.15s ease-in-out infinite; }
      @keyframes pulse { 50% { opacity: .35; transform: scale(.72); } }
      @media (max-width: 520px) {
        .app { padding: 0; place-items: stretch; }
        .panel {
          position: relative;
          top: auto;
          left: auto;
          min-height: 100vh;
          border-radius: 0;
          transform: none;
        }
        .header { cursor: default; }
        .header { padding: 20px 18px 14px; }
        .content { padding: 8px 18px 22px; }
        .context { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function phaseLabel() {
    switch (state.phase) {
      case 'permission': return '권한 확인 중';
      case 'sending': return '응답 및 후처리 대기 중';
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

  function render() {
    installStyle();
    const progress = state.targetTurns > 0
      ? Math.min(100, Math.round((state.completedTurns / state.targetTurns) * 100))
      : 0;
    const runningClass = state.running ? ' running' : '';
    const characterName = state.activeCharacterName || '현재 캐릭터';
    const chatName = state.activeChatName || '현재 채팅';

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
            <div class="phase-badge"><span class="dot"></span>${escapeHTML(phaseLabel())}</div>

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
                <span class="label">전송 메시지</span>
                <code>${escapeHTML(state.message)}</code>
              </div>
              <div class="status-card">
                <div class="status-line">
                  <span class="status-text">${escapeHTML(state.status)}</span>
                  <span class="counter">${state.completedTurns} / ${state.targetTurns}</span>
                </div>
                <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
                  <span style="--progress: ${progress}%"></span>
                </div>
              </div>
              <p class="notice">중지를 눌러도 생성 중인 응답은 강제로 취소하지 않습니다. 현재 응답의 후처리가 끝난 뒤 다음 전송을 막습니다.</p>
              <div class="actions">
                <button class="button danger" type="button" data-action="stop" ${state.stopRequested ? 'disabled' : ''}>
                  ${state.stopRequested ? '중지 대기 중' : '자동 진행 중지'}
                </button>
                <button class="button secondary" type="button" data-action="close">채팅 보기</button>
              </div>
            ` : `
              <div class="field">
                <label for="autopilot-message">
                  전송 메시지
                  <span class="hint">매 턴 동일하게 전송</span>
                </label>
                <textarea id="autopilot-message" spellcheck="true">${escapeHTML(state.message)}</textarea>
              </div>
              <div class="field">
                <label for="autopilot-turns">
                  자동 진행 턴 수
                  <span class="hint">${MIN_TURNS}–${MAX_TURNS}턴</span>
                </label>
                <input id="autopilot-turns" type="number" min="${MIN_TURNS}" max="${MAX_TURNS}" step="1" value="${state.targetTurns}">
              </div>
              <p class="notice">1턴은 메시지 1회 전송과 AI 응답의 전체 후처리 완료까지입니다. 오류 응답이나 응답 누락이 확인되면 즉시 중단됩니다.</p>
              ${state.error ? `<div class="error-box" role="alert">${escapeHTML(state.error)}</div>` : ''}
              ${state.phase === 'completed' || state.phase === 'stopped' ? `
                <div class="status-card">
                  <div class="status-line">
                    <span class="status-text">${escapeHTML(state.status)}</span>
                    <span class="counter">${state.completedTurns} / ${state.targetTurns}</span>
                  </div>
                  <div class="progress">
                    <span style="--progress: ${progress}%"></span>
                  </div>
                </div>
              ` : ''}
              <div class="actions">
                <button class="button primary" type="button" data-action="start">자동 진행 시작</button>
                <button class="button secondary" type="button" data-action="close">취소</button>
              </div>
            `}
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
    } catch (error) {
      state.activeCharacterName = '캐릭터 확인 실패';
      state.activeChatName = '채팅 확인 실패';
      console.warn('[Autopilot] 현재 채팅 정보를 읽지 못했습니다.', error);
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

      const before = snapshotChat(beforeChat);
      const startedAt = Date.now();
      state.phase = 'sending';
      state.status = `${state.completedTurns + 1}번째 메시지를 전송하고 전체 후처리를 기다리는 중입니다.`;
      state.error = '';
      render();

      let sendResult;
      try {
        sendResult = await api.sendChat(state.message);
      } catch (error) {
        await stopWithError('채팅 전송 중 예외가 발생했습니다.', errorMessage(error));
        return;
      }

      if (token !== state.sessionToken) return;
      if (sendResult !== true) {
        await stopWithError('RisuAI가 채팅 전송을 완료하지 못했습니다.');
        return;
      }

      try {
        activeChatMatches = await sameActiveChat();
      } catch (error) {
        await stopWithError('응답 후 현재 채팅을 확인하지 못했습니다.', errorMessage(error));
        return;
      }
      if (!activeChatMatches) {
        await stopWithError('응답 처리 중 캐릭터 또는 채팅이 변경되었습니다.');
        return;
      }

      let afterChat;
      try {
        afterChat = await api.getChatFromIndex(
          state.activeCharacterIndex,
          state.activeChatIndex,
        );
      } catch (error) {
        await stopWithError('응답 후 채팅 상태를 읽지 못했습니다.', errorMessage(error));
        return;
      }
      if (!afterChat || !Array.isArray(afterChat.message)) {
        await stopWithError('응답 후 메시지 목록을 찾을 수 없습니다.');
        return;
      }
      if (afterChat.isStreaming === true) {
        await stopWithError('응답 스트리밍이 종료되지 않은 상태로 반환되었습니다.');
        return;
      }

      const risuError = findNewRisuError(before, afterChat);
      if (risuError) {
        await stopWithError(
          'RisuAI 오류 응답이 생성되었습니다.',
          String(risuError.data || '').trim(),
        );
        return;
      }

      const newCharacterMessages = findNewCharacterMessages(before, afterChat, startedAt);
      if (newCharacterMessages.length === 0) {
        await stopWithError(
          '새 AI 응답이 추가되지 않았습니다.',
          '요청 취소, 모델 오류 또는 start 트리거에 의한 전송 중단일 수 있습니다.',
        );
        return;
      }

      const finalMessage = newCharacterMessages.at(-1);
      if (!String(finalMessage?.data || '').trim()) {
        await stopWithError('AI 응답이 비어 있어 자동 진행을 중단했습니다.');
        return;
      }

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

  async function startAutopilot() {
    if (state.running) return;
    if (typeof api.sendChat !== 'function') {
      await stopWithError(
        '현재 RisuAI 버전에는 플러그인 sendChat API가 없습니다.',
        'RisuAI를 v2026.3.330 이상으로 업데이트해 주세요.',
      );
      return;
    }

    const turnInput = document.getElementById('autopilot-turns');
    const messageInput = document.getElementById('autopilot-message');
    const requestedMessage = String(messageInput?.value ?? state.message);
    if (!requestedMessage.trim()) {
      state.phase = 'error';
      state.status = '전송 메시지를 입력해 주세요.';
      state.error = '빈 메시지는 자동 전송할 수 없습니다.';
      render();
      return;
    }
    state.targetTurns = clampTurnCount(turnInput?.value);
    state.message = requestedMessage;
    state.completedTurns = 0;
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

    try {
      await refreshContext();
      const chat = await api.getChatFromIndex(
        state.activeCharacterIndex,
        state.activeChatIndex,
      );
      if (!chat || !Array.isArray(chat.message)) {
        await stopWithError('자동 진행을 시작할 활성 채팅이 없습니다.');
        return;
      }
    } catch (error) {
      await stopWithError('현재 채팅을 확인하지 못했습니다.', errorMessage(error));
      return;
    }

    if (state.stopRequested || token !== state.sessionToken) {
      if (token === state.sessionToken) finishStopped();
      return;
    }
    state.phase = 'sending';
    state.status = '자동 진행을 시작합니다.';
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
    state.status = '현재 응답의 후처리가 끝나면 중단합니다.';
    render();
  }

  function bindEvents() {
    if (state.eventsBound) return;
    state.eventsBound = true;

    document.body.addEventListener('click', async (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'close') await api.hideContainer();
      else if (action === 'start') await startAutopilot();
      else if (action === 'stop') requestStop();
    });

    document.body.addEventListener('pointerdown', startPanelDrag);
    document.addEventListener('pointermove', movePanel);
    document.addEventListener('pointerup', stopPanelDrag);
    document.addEventListener('pointercancel', stopPanelDrag);
    window.addEventListener('resize', applyPanelPosition);

    document.body.addEventListener('change', (event) => {
      if (event.target.id !== 'autopilot-turns') return;
      event.target.value = String(clampTurnCount(event.target.value));
    });

    document.addEventListener('keydown', async (event) => {
      if (event.key === 'Escape') await api.hideContainer();
      if (event.key === 'Enter' && !state.running && event.target.id === 'autopilot-turns') {
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
      window.removeEventListener('resize', applyPanelPosition);
      const chatButtonId = state.chatButtonPart?.id || state.chatButtonPart || CHAT_BUTTON_ID;
      if (chatButtonId) await api.unregisterUIPart(chatButtonId);
    });

    console.log('[Autopilot] v1.3.0 loaded');
  } catch (error) {
    console.error('[Autopilot] 초기화에 실패했습니다.', error);
  }
})();
