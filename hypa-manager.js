//@name hypa-manager
//@display-name Hypa Manager
//@api 3.0
//@version 1.7.8
//@arg summary_prompt string Default summary prompt
//@update-url https://raw.githubusercontent.com/sae-chi/RisuAIPlugin/refs/heads/main/hypa-manager.js

(async () => {
  try {
    const PROMPT_STORAGE_KEY = 'prompt_presets'
    const MAX_SLOTS = 5
    let summaryRequestActive = false
    let summaryBodyInterceptor = null

    function toIndex(value, fallback = 0) {
      const number = Number(value)
      return Number.isInteger(number) && number >= 0 ? number : fallback
    }

    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    function formatTimestamp(ts) {
      return ts ? new Date(ts).toLocaleString() : '저장 시간 없음'
    }

    function safeFileName(s) {
      return String(s).replace(/[\\/:*?"<>|]/g, '_')
    }

    function showMsg(id, text, isError) {
      const el = document.getElementById(id)
      if (!el) return
      el.style.color = isError ? '#f87171' : '#4ade80'
      el.textContent = text
      if (!isError && text) setTimeout(() => { el.textContent = '' }, 4000)
    }

    function clearDerivedMemory(chat) {
      delete chat.lastMemory
      delete chat.suggestMessages
    }

    async function getCurrentChat() {
      const charIndex = await Risuai.getCurrentCharacterIndex()
      const chatIndex = await Risuai.getCurrentChatIndex()
      const chat = await Risuai.getChatFromIndex(charIndex, chatIndex)
      return { charIndex, chatIndex, chat }
    }

    async function getCharacterContext() {
      const charIndex = await Risuai.getCurrentCharacterIndex()
      const chatIndex = await Risuai.getCurrentChatIndex()
      const currentChar = await Risuai.getCharacter()
      const indexedChar = await Risuai.getCharacterFromIndex(charIndex)
      const char = currentChar || indexedChar
      const currentChat = currentChar?.chats?.[chatIndex] || currentChar?.chats?.[currentChar?.chatPage ?? chatIndex]
      const indexedChat = await Risuai.getChatFromIndex(charIndex, chatIndex)
      const chat = currentChat || indexedChat
      return { charIndex, chatIndex, char, chat }
    }

    function getCharId(char) {
      return (char?.name ?? 'unknown').replace(/\s+/g, '_').slice(0, 64)
    }

    function getCurrentFirstMessage(char, chat) {
      const altGreetings =
        char?.alternateGreetings ||
        char?.alternate_greetings ||
        char?.data?.alternateGreetings ||
        char?.data?.alternate_greetings ||
        []
      const fmIndex = chat && !Array.isArray(chat) && chat.fmIndex != null ? toIndex(chat.fmIndex, -1) : -1
      let firstMessage = ''
      if (fmIndex >= 0 && Array.isArray(altGreetings)) firstMessage = altGreetings[fmIndex] || ''
      if (!firstMessage) firstMessage = char?.firstMessage || char?.firstmessage || char?.first_message || char?.first_mes || char?.firstMsg || ''
      if (!firstMessage && char?.data) firstMessage = char.data.firstMessage || char.data.firstmessage || char.data.first_message || char.data.first_mes || char.data.firstMsg || ''
      return String(firstMessage).trim()
    }

    async function getRawMessages() {
      const { char, chat } = await getCharacterContext()
      const messages = chat?.message ?? []
      const firstMessage = getCurrentFirstMessage(char, chat)
      if (!firstMessage) return messages
      return [
        {
          role: 'assistant',
          name: char?.name || '캐릭터',
          data: firstMessage,
          isFirstMessage: true
        },
        ...messages
      ]
    }

    async function getConfig() {
      const savedPrompt = (await Risuai.getArgument('summary_prompt') ?? '').trim()
      const db = await Risuai.getDatabase(['seperateModelsForAxModels', 'seperateModels', 'subModel'])
      const memoryModel = (db?.seperateModelsForAxModels ? db?.seperateModels?.memory ?? '' : '').trim()
      return {
        prompt: savedPrompt,
        memoryModel,
        modelLabel: memoryModel || db?.subModel || 'RisuAI 기본 보조모델',
        usesSeparateAuxModels: !!db?.seperateModelsForAxModels
      }
    }

    async function loadPromptPresets() {
      const raw = await Risuai.pluginStorage.getItem(PROMPT_STORAGE_KEY)
      if (!Array.isArray(raw)) return []
      return raw.filter(item => item && typeof item.name === 'string' && typeof item.prompt === 'string')
    }

    async function savePromptPresets(presets) {
      await Risuai.pluginStorage.setItem(PROMPT_STORAGE_KEY, presets)
    }

    function extractGigaTransSource(content) {
      const blocks = []
      const matches = []
      const pattern = /<GigaTrans\b[^>]*>([\s\S]*?)<\/GigaTrans\s*>/gi
      let match
      while ((match = pattern.exec(content)) !== null) {
        matches.push(match)
      }

      if (matches.length === 0) return content

      for (let i = 0; i < matches.length; i++) {
        const current = matches[i]
        const source = current[1].trim()
        if (source) blocks.push(source)

        const tailStart = current.index + current[0].length
        const tailEnd = i + 1 < matches.length ? matches[i + 1].index : content.length
        const tail = content.slice(tailStart, tailEnd)
        const ctrlIndex = tail.search(/<GT-CTRL\s*\/?\s*>/i)
        if (ctrlIndex >= 0) {
          const additionalSource = tail.slice(0, ctrlIndex).trim()
          if (additionalSource) blocks.push(additionalSource)
        }
      }

      return blocks.length ? blocks.join('\n\n') : content
    }

    function formatSelectedForSummary(messages, selectedIndexes) {
      return selectedIndexes
        .map(index => messages[index])
        .filter(m => m && m.role !== 'system')
        .map(m => {
          const role = m.isFirstMessage ? '첫 메시지' : (m.role === 'user' ? '사용자' : (m.name ?? '캐릭터'))
          const rawText = typeof m.data === 'string' ? m.data : (m.data?.[0] ?? '')
          const text = extractGigaTransSource(String(rawText))
          return '[' + role + ']: ' + text
        })
        .join('\n')
    }

    function stripThoughtTags(text) {
      return String(text ?? '')
        .replace(/<Thoughts>[\s\S]*?<\/Thoughts>/gi, '')
        .replace(/<Thought>[\s\S]*?<\/Thought>/gi, '')
        .trim()
    }

    function protectXmlTagsForRequest(text) {
      return String(text ?? '').replace(/<\/?[A-Za-z][A-Za-z0-9:_-]*(?:\s+[^<>\n]*)?\s*\/?>/g, tag =>
        tag.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      )
    }

    function getChatMemoIds(messages, selectedIndexes) {
      return selectedIndexes
        .map(index => messages[index])
        .map(m => m?.chatId)
        .filter(Boolean)
    }

    function extractModelText(value) {
      if (value == null) return ''
      if (typeof value === 'string') return value
      if (Array.isArray(value)) return value.map(extractModelText).filter(Boolean).join('\n')
      if (typeof value !== 'object') return String(value)
      const direct =
        value.text ??
        value.content ??
        value.message?.content ??
        value.message?.text ??
        value.response ??
        value.output ??
        value.result ??
        value.data
      if (direct != null && direct !== value) {
        const text = extractModelText(direct)
        if (text) return text
      }
      const choiceText = value.choices?.[0]?.message?.content ?? value.choices?.[0]?.text
      if (choiceText != null) return extractModelText(choiceText)
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return String(value)
      }
    }

    function parseChatML(prompt) {
      const text = String(prompt || '')
      if (!/<\|im_start\|>/i.test(text)) return null
      const messages = []
      const blocks = text.split(/<\|im_start\|>/i).slice(1)
      for (const block of blocks) {
        const endIndex = block.search(/<\|im_end\|>/i)
        const segment = endIndex >= 0 ? block.slice(0, endIndex) : block
        const lineMatch = segment.match(/^([^\r\n]*)(?:\r?\n)?([\s\S]*)$/)
        if (!lineMatch) continue
        const role = lineMatch[1].trim().split(/\s+/)[0].toLowerCase()
        if (!['system', 'user', 'assistant', 'tool', 'function'].includes(role)) continue
        const content = protectXmlTagsForRequest(lineMatch[2].replace(/^\r?\n/, '').replace(/\s+$/, ''))
        if (content) messages.push({ role, content })
      }
      return messages.length ? messages : null
    }

    function buildSummaryMessages(systemPrompt, userContent) {
      const prompt = String(systemPrompt || '')
      const promptWithSlot = prompt.replace(/\{\{slot\}\}/gi, userContent)
      const chatMLMessages = parseChatML(promptWithSlot)
      if (chatMLMessages) return chatMLMessages
      if (/\{\{slot\}\}/i.test(prompt)) {
        return [{ role: 'user', content: protectXmlTagsForRequest(promptWithSlot) }]
      }
      const messages = []
      if (prompt) messages.push({ role: 'system', content: protectXmlTagsForRequest(prompt) })
      messages.push({ role: 'user', content: userContent })
      return messages
    }

    async function setupSummaryBodyInterceptor() {
      if (typeof Risuai.registerBodyIntercepter !== 'function') return null
      try {
        summaryBodyInterceptor = await Risuai.registerBodyIntercepter(async body => {
          if (!summaryRequestActive) return body
          const gen = body.generation_config || body.generationConfig
          if (gen) {
            if (!gen.thinkingConfig) gen.thinkingConfig = {}
            gen.thinkingConfig.includeThoughts = false
          }
          return body
        })
        return summaryBodyInterceptor
      } catch (e) {
        console.warn('[Hypa Manager] Body interceptor registration failed:', e)
        return null
      }
    }

    async function callMemoryModel(cfg, systemPrompt, userContent) {
      const messages = buildSummaryMessages(systemPrompt, userContent)
      if (summaryRequestActive) throw new Error('이미 요약 요청이 진행 중입니다.')
      summaryRequestActive = true
      try {
        // Use RisuAI's shared model dispatch for all registered providers.
        // Provider-specific API requests and response conversion belong to the provider plugin.
        const content = await Risuai.runLLMModel({
          messages,
          staticModel: cfg.memoryModel || undefined,
          mode: 'memory',
          allowPlugins: true
        })
        const text = stripThoughtTags(await readSummaryResponse(content))
        if (!text) throw new Error('모델이 빈 요약을 반환했습니다. 모델 설정과 프롬프트를 확인해 주세요.')
        return text
      } finally {
        summaryRequestActive = false
      }
    }

    async function readSummaryResponse(content) {
      if (content?.type === 'fail' || content?.success === false) {
        const detail = extractModelText(content.result ?? content.content ?? content.error ?? '')
        const hint = /plugin.*block|block.*plugin/i.test(detail)
          ? ' 프로바이더 호출을 지원하는 RisuAI 버전인지 확인해 주세요.' : ''
        throw new Error((detail || '모델 요청에 실패했습니다.') + hint)
      }
      const payload = content?.type === 'streaming' || content?.type === 'success' || content?.type === 'multiline'
        ? content.result : content?.success === true ? content.content : content
      if (payload && typeof payload.getReader === 'function') {
        const reader = payload.getReader()
        const decoder = new TextDecoder()
        let text = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (typeof value === 'string') {
              text += decoder.decode() + value
            } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
              text += decoder.decode(value, { stream: true })
            } else if (value && typeof value['0'] === 'string') {
              // RisuAI StreamResponseChunk contains the complete text so far, not a delta.
              decoder.decode()
              text = value['0']
            } else {
              throw new Error('지원하지 않는 요약 스트리밍 응답 형식입니다.')
            }
          }
          return text + decoder.decode()
        } catch (error) {
          try { await reader.cancel() } catch {}
          throw error
        } finally {
          reader.releaseLock()
        }
      }
      if (content?.type === 'streaming') throw new Error('요약 스트림을 읽을 수 없습니다. 프로바이더의 스트리밍을 끄거나 RisuAI를 업데이트해 주세요.')
      if (content?.type === 'multiline' && Array.isArray(payload)) {
        return payload.map(line => Array.isArray(line) ? String(line[1] ?? '') : extractModelText(line)).join('\n')
      }
      return extractModelText(payload)
    }

    async function injectSummary(summaryText, chatMemos = []) {
      const { charIndex, chatIndex, chat } = await getCurrentChat()
      const existing = chat.hypaV3Data ?? { summaries: [] }
      if (!Array.isArray(existing.summaries)) existing.summaries = []
      existing.summaries.push({ text: summaryText, chatMemos, isImportant: false, tags: [] })
      chat.hypaV3Data = existing
      clearDerivedMemory(chat)
      await Risuai.setChatToIndex(charIndex, chatIndex, chat)
    }

    function slotsKey(charId) {
      return `memoryBank::slots::${charId}`
    }

    function slotDataKey(charId, name) {
      return `memoryBank::slot::${charId}::${name}`
    }

    async function getSlotList(charId) {
      const raw = await Risuai.pluginStorage.getItem(slotsKey(charId))
      if (!raw) return []
      if (Array.isArray(raw)) return raw
      try { return JSON.parse(raw) } catch { return [] }
    }

    async function saveSlotList(charId, list) {
      await Risuai.pluginStorage.setItem(slotsKey(charId), JSON.stringify(list))
    }

    async function getSlotData(charId, name) {
      const raw = await Risuai.pluginStorage.getItem(slotDataKey(charId, name))
      if (!raw) return null
      if (typeof raw === 'object') return raw
      try { return JSON.parse(raw) } catch { return null }
    }

    async function saveSlot(charId, name) {
      const { chat } = await getCurrentChat()
      const data = {
        name,
        timestamp: Date.now(),
        hypaV2Data: chat.hypaV2Data ?? null,
        hypaV3Data: chat.hypaV3Data ?? null
      }
      await Risuai.pluginStorage.setItem(slotDataKey(charId, name), JSON.stringify(data))
      const list = await getSlotList(charId)
      const idx = list.findIndex(s => s.name === name)
      if (idx >= 0) list[idx].timestamp = data.timestamp
      else list.push({ name, timestamp: data.timestamp })
      await saveSlotList(charId, list)
      return data
    }

    async function loadSlot(charId, name) {
      const data = await getSlotData(charId, name)
      if (!data) return false
      const { charIndex, chatIndex, chat } = await getCurrentChat()
      chat.hypaV2Data = data.hypaV2Data
      chat.hypaV3Data = data.hypaV3Data
      clearDerivedMemory(chat)
      await Risuai.setChatToIndex(charIndex, chatIndex, chat)
      return true
    }

    async function deleteSlot(charId, name) {
      await Risuai.pluginStorage.removeItem(slotDataKey(charId, name))
      const list = await getSlotList(charId)
      await saveSlotList(charId, list.filter(s => s.name !== name))
    }

    function downloadJSON(data, filename) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }

    async function splitChatForHypaV3() {
      const character = await Risuai.getCharacter()
      const chatIndex = await Risuai.getCurrentChatIndex()
      const currentChat = character?.chats?.[chatIndex] || character?.chats?.[character.chatPage]
      const currentMessages = currentChat?.message
      if (!currentMessages || currentMessages.length === 0) throw new Error('현재 채팅에 메시지가 없습니다.')

      const summaries = currentChat.hypaV3Data?.summaries
      const lastSummary = summaries?.[summaries.length - 1]
      if (!lastSummary) throw new Error('현재 채팅에 hypaV3 요약 데이터가 없습니다.')

      const lastChatId = [...(lastSummary.chatMemos || [])].at(-1)
      if (!lastChatId) throw new Error('마지막 요약에 연결된 채팅 ID가 없습니다.')

      const lastChatIndex = currentMessages.findIndex(m => m.chatId === lastChatId)
      if (lastChatIndex === -1) throw new Error('마지막 요약과 연결된 메시지를 찾지 못했습니다.')
      if (currentMessages.length === lastChatIndex + 1) throw new Error('요약되지 않은 새 메시지가 없어 분할할 필요가 없습니다.')

      const summarizedChat = structuredClone(currentChat)
      summarizedChat.name = (summarizedChat.name || 'Chat') + ' 요약'
      summarizedChat.message.splice(lastChatIndex + 1)

      const unsummarizedChat = structuredClone(currentChat)
      unsummarizedChat.name = (unsummarizedChat.name || 'Chat') + ' 비요약'
      unsummarizedChat.message.splice(0, lastChatIndex)

      const originalBackupChat = structuredClone(currentChat)
      originalBackupChat.name = (originalBackupChat.name || 'Chat') + ' 원본 백업'

      character.chats.unshift(originalBackupChat, summarizedChat, unsummarizedChat)
      await Risuai.setCharacter(character)
    }

    function setLoading(on) {
      const btn = document.getElementById('btn-run')
      const sp = document.getElementById('spinner')
      if (btn) btn.disabled = on
      if (sp) sp.style.display = on ? 'block' : 'none'
    }

    function renderPresetOptions(presets) {
      return '<option value="">프리셋 선택</option>' + presets.map((preset, index) =>
        '<option value="' + index + '">' + esc(preset.name) + '</option>'
      ).join('')
    }

    function extractPromptPresetFromJson(json) {
      const name = json?.data?.name || json?.name || 'Imported Preset'
      const prompt = json?.data?.settings?.summarizationPrompt || json?.settings?.summarizationPrompt || ''
      return { name: String(name), prompt: String(prompt) }
    }

    function renderSlotItems(list) {
      if (!list.length) return '<div class="empty">저장된 메모리 슬롯이 없습니다.</div>'
      return list.map(s =>
        '<div class="slot-row" data-name="' + esc(s.name) + '">' +
          '<div class="slot-info">' +
            '<span class="slot-name">' + esc(s.name) + '</span>' +
            '<span class="slot-ts">' + esc(formatTimestamp(s.timestamp)) + '</span>' +
          '</div>' +
          '<div class="slot-actions">' +
            '<button class="mini-btn sl-load" data-name="' + esc(s.name) + '">불러오기</button>' +
            '<button class="mini-btn sl-dl" data-name="' + esc(s.name) + '">JSON</button>' +
            '<button class="mini-btn danger sl-del" data-name="' + esc(s.name) + '">삭제</button>' +
          '</div>' +
        '</div>'
      ).join('')
    }

    async function refreshSlots(charId) {
      const list = await getSlotList(charId)
      const listEl = document.getElementById('slot-list')
      if (listEl) listEl.innerHTML = renderSlotItems(list)
      const countEl = document.getElementById('slot-count')
      if (countEl) countEl.textContent = list.length + ' / ' + MAX_SLOTS
      bindSlotButtons(charId)
    }

    function buildUI(messages, cfg, presets, slots, char) {
      const total = messages.length
      const selectableTotal = messages.filter(m => m.role !== 'system').length
      const modelLabel = cfg.modelLabel
      const charName = char?.name || '캐릭터'

      const msgRows = total === 0
        ? '<div class="empty">메시지가 없습니다.</div>'
        : messages.map((m, i) => {
            const isSystem = m.role === 'system'
            const isUser = m.role === 'user'
            const role = m.isFirstMessage ? '첫 메시지' : (isSystem ? '시스템' : (isUser ? '사용자' : (m.name ?? '캐릭터')))
            const text = typeof m.data === 'string' ? m.data : (m.data?.[0] ?? '')
            const cls = isSystem ? 'msg-role-system' : (isUser ? 'msg-role-user' : 'msg-role-char')
            const disabled = isSystem ? ' disabled' : ''
            return '<div class="msg-row' + (m.isFirstMessage ? ' first-message' : '') + '" data-idx="' + i + '" tabindex="0" aria-haspopup="dialog" title="클릭해서 전문 보기">' +
              '<input class="msg-check" type="checkbox" data-idx="' + i + '"' + disabled + '>' +
              '<span class="msg-idx">' + i + '</span>' +
              '<span class="' + cls + '">' + esc(role) + '</span>' +
              '<span class="msg-text">' + esc(text) + '</span>' +
            '</div>'
          }).join('')

      document.body.innerHTML =
        '<style>' +
        /* ── 리셋 & 스크롤바 ── */
        '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }' +
        '* { scrollbar-width: thin; scrollbar-color: rgba(100,180,210,.25) transparent; }' +
        '*::-webkit-scrollbar { width: 5px; height: 5px; }' +
        '*::-webkit-scrollbar-track { background: transparent; }' +
        '*::-webkit-scrollbar-thumb { background: rgba(100,180,210,.22); border-radius: 999px; }' +
        '*::-webkit-scrollbar-thumb:hover { background: rgba(100,180,210,.45); }' +
        '*::-webkit-scrollbar-corner { background: transparent; }' +

        /* ── CSS 변수 ── */
        ':root {' +
          '--c-bg: #12141c;' +
          '--c-surface: #191b26;' +
          '--c-surface2: #1e2130;' +
          '--c-border: rgba(255,255,255,.08);' +
          '--c-border-focus: rgba(96,180,210,.6);' +
          '--c-text: #d4d8f0;' +
          '--c-text-dim: #6a7a99;' +
          '--c-text-muted: #424d66;' +
          '--c-accent: #4ab8d0;' +
          '--c-accent-dim: rgba(74,184,208,.1);' +
          '--c-accent-border: rgba(74,184,208,.25);' +
          '--c-user: #6fa8e8;' +
          '--c-char: #82c9a0;' +
          '--c-danger: #e07070;' +
          '--c-danger-bg: rgba(200,70,70,.18);' +
          '--c-success: #5ec9a0;' +
          '--radius-sm: 7px;' +
          '--radius-md: 10px;' +
          '--radius-lg: 14px;' +
          '--shadow-panel: 0 32px 80px rgba(0,0,0,.85), 0 0 0 1px rgba(74,184,208,.05) inset;' +
        '}' +

        /* ── 기본 레이아웃 ── */
        'html, body { width: 100%; height: 100%; background: transparent; }' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; color: var(--c-text); display: flex; align-items: center; justify-content: center; }' +

        /* ── 패널 ── */
        '.panel { background: var(--c-bg); border: 1px solid var(--c-border); border-radius: var(--radius-lg); padding: 26px 26px 22px; width: min(800px, 96vw); max-height: 92vh; overflow-y: auto; box-shadow: var(--shadow-panel); display: flex; flex-direction: column; gap: 18px; }' +

        /* ── 헤더 ── */
        '.header { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-bottom: 1px solid var(--c-border); padding-bottom: 16px; }' +
        '.header-left { display: flex; align-items: center; gap: 12px; }' +
        '.header-icon { width: 34px; height: 34px; background: var(--c-accent-dim); border: 1px solid var(--c-accent-border); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }' +
        'h2 { font-size: 16px; font-weight: 650; color: #e8eaf8; letter-spacing: -.015em; line-height: 1.2; }' +
        '.sub { font-size: 11.5px; color: var(--c-text-dim); margin-top: 3px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }' +
        '.badge { display: inline-flex; align-items: center; background: var(--c-accent-dim); border: 1px solid var(--c-accent-border); border-radius: 5px; padding: 1px 7px; color: var(--c-accent); font-size: 11px; font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
        '.sub-dot { color: var(--c-text-muted); }' +
        '#btn-close { background: transparent; border: 1px solid var(--c-border); color: var(--c-text-dim); border-radius: var(--radius-sm); padding: 6px 12px; font-size: 12.5px; cursor: pointer; flex-shrink: 0; transition: border-color .15s, color .15s, background .15s; }' +
        '#btn-close:hover { border-color: rgba(255,255,255,.18); color: #ccd; background: rgba(255,255,255,.05); }' +

        /* ── 탭 ── */
        '.tabs { display: flex; gap: 1px; border-bottom: 1px solid var(--c-border); overflow-x: auto; overflow-y: hidden; }' +
        '.tab-btn { background: none; border: none; border-bottom: 2px solid transparent; color: var(--c-text-dim); font-size: 13px; font-weight: 500; padding: 8px 16px; cursor: pointer; white-space: nowrap; transition: color .15s, border-color .15s; flex-shrink: 0; margin-bottom: -1px; font-family: inherit; }' +
        '.tab-btn:hover { color: #a8bcd4; }' +
        '.tab-btn.active { color: var(--c-accent); border-bottom-color: var(--c-accent); font-weight: 600; }' +
        '.tab-panel { display: none; flex-direction: column; gap: 14px; padding-top: 2px; }' +
        '.tab-panel.active { display: flex; }' +

        /* ── 섹션 헤더 ── */
        '.section-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; }' +
        '.section-title { font-size: 11px; font-weight: 600; color: var(--c-accent); letter-spacing: .06em; }' +
        '.select-tools { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }' +

        /* ── 범위 선택 ── */
        '.range-tools { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; padding: 12px 14px; background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-md); }' +
        '.range-tools label { flex: 1 1 100px; min-width: 0; color: var(--c-text-dim); font-size: 11.5px; font-weight: 500; }' +
        '.range-tools label input { display: block; margin-top: 5px; }' +

        /* ── 미니 버튼 ── */
        '.mini-btn { background: var(--c-surface2); border: 1px solid var(--c-border); color: #99aec8; border-radius: var(--radius-sm); padding: 5px 10px; font-size: 11.5px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: background .15s, border-color .15s, color .15s; font-family: inherit; }' +
        '.mini-btn:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.16); color: #ccdbe8; }' +
        '.mini-btn.danger { background: var(--c-danger-bg); border-color: rgba(200,80,80,.28); color: var(--c-danger); }' +
        '.mini-btn.danger:hover { background: rgba(200,70,70,.3); color: #f4a0a0; }' +
        '.mini-btn:disabled { opacity: .35; cursor: not-allowed; }' +

        /* ── 메시지 목록 ── */
        '.msg-preview { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-md); max-height: 340px; overflow-y: auto; }' +
        '.msg-row { display: grid; grid-template-columns: 18px 34px minmax(60px, auto) 1fr; align-items: center; gap: 10px; padding: 9px 14px; border-bottom: 1px solid rgba(255,255,255,.04); font-size: 13px; cursor: pointer; transition: background .1s; }' +
        '.msg-row:last-child { border-bottom: none; }' +
        '.msg-row:hover { background: rgba(255,255,255,.025); }' +
        '.msg-row.selected { background: rgba(74,184,208,.07); }' +
        '.msg-row.selected:hover { background: rgba(74,184,208,.12); }' +
        '.msg-row.first-message { border-left: 2px solid rgba(74,184,208,.5); }' +
        '.msg-check { width: 14px; height: 14px; accent-color: var(--c-accent); align-self: center; cursor: pointer; }' +
        '.msg-idx { color: var(--c-text-muted); font-size: 11px; flex-shrink: 0; font-variant-numeric: tabular-nums; }' +
        '.msg-role-user { color: var(--c-user); font-size: 11.5px; font-weight: 600; flex-shrink: 0; }' +
        '.msg-role-char { color: var(--c-char); font-size: 11.5px; font-weight: 600; flex-shrink: 0; }' +
        '.msg-role-system { color: var(--c-text-muted); font-size: 11.5px; flex-shrink: 0; }' +
        '.msg-text { color: #a8b0cc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; line-height: 1.5; }' +
        '.msg-row:focus-visible { outline: 2px solid var(--c-accent); outline-offset: -2px; }' +
        '#message-dialog { margin: auto; width: min(760px, 94vw); max-height: 86vh; padding: 0; background: var(--c-bg); color: var(--c-text); border: 1px solid var(--c-accent-border); border-radius: var(--radius-lg); box-shadow: var(--shadow-panel); }' +
        '#message-dialog[open] { display: flex; flex-direction: column; }' +
        '#message-dialog::backdrop { background: transparent; }' +
        '.message-dialog-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 20px; border-bottom: 1px solid var(--c-border); flex-shrink: 0; }' +
        '#message-dialog-title { min-width: 0; overflow-wrap: anywhere; }' +
        '#message-dialog-close { flex-shrink: 0; }' +
        '#message-dialog-content { padding: 20px; overflow-y: auto; min-height: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; line-height: 1.75; }' +
        '.empty { padding: 28px 16px; color: var(--c-text-muted); font-size: 13px; text-align: center; }' +

        /* ── 버튼 행 ── */
        '.btn-row { display: flex; align-items: center; gap: 8px; }' +

        /* ── 프리셋 ── */
        '.preset-picker { display: grid; grid-template-columns: 1fr; gap: 9px; }' +
        '.preset-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }' +

        /* ── 폼 요소 ── */
        'input[type="text"], input[type="number"], select, textarea { width: 100%; background: var(--c-surface); border: 1px solid rgba(255,255,255,.1); border-radius: var(--radius-sm); padding: 9px 12px; font-size: 13px; color: #dde0f4; outline: none; font-family: inherit; transition: border-color .15s, box-shadow .15s; }' +
        'input[type="text"]::placeholder, input[type="number"]::placeholder, textarea::placeholder { color: var(--c-text-muted); }' +
        'textarea { resize: vertical; min-height: 160px; line-height: 1.65; }' +
        'select { cursor: pointer; }' +
        'input[type="text"]:focus, input[type="number"]:focus, select:focus, textarea:focus { border-color: var(--c-border-focus); box-shadow: 0 0 0 3px rgba(74,184,208,.08); }' +

        /* ── 힌트 ── */
        '.hint { font-size: 11.5px; color: var(--c-text-dim); line-height: 1.65; }' +

        /* ── 결과 박스 ── */
        '.result-box, .desc-box { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-md); padding: 13px 15px; font-size: 13px; color: var(--c-text); line-height: 1.75; white-space: pre-wrap; max-height: 240px; overflow-y: auto; }' +
        'textarea.result-editor { min-height: 160px; max-height: 280px; background: var(--c-surface); border-color: rgba(255,255,255,.1); line-height: 1.7; }' +

        /* ── 메인 버튼 ── */
        '.btn { padding: 10px 16px; border: none; border-radius: var(--radius-sm); font-size: 13px; cursor: pointer; font-weight: 600; color: #fff; min-width: 0; white-space: nowrap; transition: opacity .15s, filter .15s; font-family: inherit; letter-spacing: -.01em; }' +
        '.btn-row .btn { flex: 1; }' +
        '.btn:not(:disabled):hover { filter: brightness(1.12) saturate(1.08); }' +
        '.btn:disabled { opacity: .35; cursor: not-allowed; }' +
        '.btn-main { background: linear-gradient(135deg, #1d8fa8 0%, #166e84 100%); }' +
        '.btn-alt { background: linear-gradient(135deg, #2a5298 0%, #1e3e78 100%); }' +
        '.btn-danger { background: linear-gradient(135deg, #803232 0%, #632828 100%); }' +
        '.btn-muted { background: var(--c-surface2); border: 1px solid var(--c-border); color: #a8b8cc; }' +
        '.btn-muted:not(:disabled):hover { background: rgba(255,255,255,.12); color: #ccd; }' +

        /* ── 슬롯 ── */
        '.slot-save { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; }' +
        '#slot-list { display: flex; flex-direction: column; gap: 6px; }' +
        '.slot-row { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-md); padding: 11px 14px; display: flex; justify-content: space-between; gap: 12px; align-items: center; transition: border-color .15s; }' +
        '.slot-row:hover { border-color: rgba(255,255,255,.14); background: var(--c-surface2); }' +
        '.slot-info { min-width: 0; }' +
        '.slot-name { display: block; font-weight: 600; font-size: 13px; color: #e0e4f4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
        '.slot-ts { display: block; margin-top: 2px; font-size: 11px; color: var(--c-text-dim); }' +
        '.slot-actions { display: flex; gap: 5px; flex-shrink: 0; }' +

        /* ── 기타 ── */
        '#json-input { display: none; }' +
        '#spinner { display: none; font-size: 12.5px; color: var(--c-accent); text-align: center; padding: 5px 0; }' +
        '.msg-status { font-size: 12.5px; min-height: 18px; text-align: center; padding: 2px 0; transition: color .2s; }' +

        /* ── 인포 배너 ── */
        '.info-banner { background: var(--c-surface); border: 1px solid var(--c-border); border-left: 3px solid var(--c-accent-border); border-radius: var(--radius-sm); padding: 10px 13px; font-size: 12px; color: var(--c-text-dim); line-height: 1.6; }' +
        '.split-card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px; }' +
        '.split-card .desc-box { max-height: unset; font-size: 12.5px; color: var(--c-text-dim); background: transparent; border: none; padding: 0; }' +

        /* ── 반응형 ── */
        '@media (max-width: 560px) {' +
          '.panel { padding: 18px 14px; gap: 14px; }' +
          '.section-head { align-items: flex-start; flex-direction: column; }' +
          '.select-tools { justify-content: flex-start; }' +
          '.btn-row, .slot-row { flex-wrap: wrap; }' +
          '.btn-row .btn { flex-basis: calc(50% - 4px); }' +
          '.preset-actions, .slot-save { grid-template-columns: 1fr; }' +
          '.slot-actions { width: 100%; justify-content: flex-end; }' +
          '.msg-row { grid-template-columns: 16px 28px 54px 1fr; gap: 7px; }' +
          '.tab-btn { font-size: 12px; padding: 7px 12px; }' +
        '}' +
        '</style>' +

        '<dialog id="message-dialog" aria-labelledby="message-dialog-title">' +
          '<div class="message-dialog-header"><h2 id="message-dialog-title">메시지 전문</h2><button class="mini-btn" id="message-dialog-close" type="button" autofocus>닫기</button></div>' +
          '<div id="message-dialog-content"></div>' +
        '</dialog>' +
        '<div class="panel">' +
          '<div class="header"><div class="header-left"><div class="header-icon">✨</div><div><h2>Hypa Manager</h2><div class="sub"><span class="badge">' + esc(modelLabel) + '</span><span class="sub-dot">·</span>' + esc(charName) + '<span class="sub-dot">·</span>' + total + '개 항목</div></div></div><button id="btn-close">닫기</button></div>' +
          '<div class="tabs">' +
            '<button class="tab-btn active" data-tab="tab-summarize">요약</button>' +
            '<button class="tab-btn" data-tab="tab-prompt">프롬프트</button>' +
            '<button class="tab-btn" data-tab="tab-memory">메모리</button>' +
            '<button class="tab-btn" data-tab="tab-split">챗 분할</button>' +
          '</div>' +

          '<div id="tab-summarize" class="tab-panel active">' +
            '<div class="info-banner">RisuAI 설정에서 보조모델 분리를 켜고 memory 모델에 원하는 모델을 선택하세요. 분리가 꺼져 있거나 memory 모델이 비어 있으면 기본 보조모델을 사용합니다. 프로바이더 플러그인으로 설정한 모델도 사용할 수 있습니다.</div>' +
            '<div><div class="section-head"><div class="section-title">요약할 채팅 선택</div><div class="select-tools"><span class="hint" id="selection-hint">총 0개 선택</span><button class="mini-btn" id="btn-select-all" type="button">전체 선택</button><button class="mini-btn" id="btn-clear-all" type="button">전체 해제</button></div></div>' +
              '<div class="range-tools"><label for="range-start">시작 번호<input id="range-start" type="number" min="0" max="' + Math.max(0, total - 1) + '" step="1" placeholder="예: 0"></label><label for="range-end">끝 번호<input id="range-end" type="number" min="0" max="' + Math.max(0, total - 1) + '" step="1" placeholder="예: ' + Math.max(0, total - 1) + '"></label><button class="mini-btn" id="btn-select-range" type="button"' + (selectableTotal === 0 ? ' disabled' : '') + '>구간 선택</button></div>' +
              '<div class="hint">아래 목록의 번호 기준(0부터 시작). 시작·끝을 모두 포함하며 시스템 메시지는 제외합니다. 구간 선택을 누르면 기존 선택이 해당 구간으로 바뀝니다. 선택 확인 후 요약 실행을 누르세요.</div><div id="range-msg" class="msg-status" role="status" aria-live="polite"></div>' +
              '<div class="msg-preview">' + msgRows + '</div></div>' +
            '<div id="result-wrap" style="display:none"><div class="section-title">요약 결과</div><textarea class="result-editor" id="result-box"></textarea><div class="hint">저장 전에 요약문을 직접 수정할 수 있습니다. 저장하면 현재 채팅의 hypaV3 요약 목록에 추가됩니다.</div></div>' +
            '<div class="btn-row"><button class="btn btn-main" id="btn-run">요약 실행</button><button class="btn btn-alt" id="btn-inject" style="display:none">hypaV3에 추가</button></div><div id="spinner">memory 보조모델로 요약 중...</div><div class="msg-status" id="msg"></div>' +
          '</div>' +

          '<div id="tab-prompt" class="tab-panel">' +
            '<div><div class="section-title">프롬프트 프리셋</div><div class="preset-picker"><select id="preset-select">' + renderPresetOptions(presets) + '</select><div class="preset-actions"><button class="btn btn-muted" id="btn-load-preset" type="button">불러오기</button><button class="btn btn-muted" id="btn-import-json" type="button">JSON 가져오기</button><button class="btn btn-danger" id="btn-delete-preset" type="button">삭제</button></div><input type="file" id="json-input" accept=".json,application/json"></div></div>' +
            '<div><div class="section-title">프리셋 이름</div><input id="preset-name" type="text" placeholder="예: 짧은 장기기억 요약"></div>' +
            '<div><div class="section-title">요약 프롬프트</div><textarea id="prompt-input" rows="10" placeholder="프롬프트를 입력하거나 프리셋/JSON에서 불러오세요.">' + esc(cfg.prompt) + '</textarea></div>' +
            '<div class="btn-row"><button class="btn btn-main" id="btn-save-preset" type="button">프리셋 저장</button><button class="btn btn-alt" id="btn-save-default" type="button">기본값 저장</button></div><div class="hint">요약 실행은 항상 RisuAI의 memory 보조모델 설정을 사용합니다.</div><div class="msg-status" id="prompt-msg"></div>' +
          '</div>' +

          '<div id="tab-memory" class="tab-panel">' +
            '<div class="slot-save"><input id="slot-name-input" type="text" maxlength="40" placeholder="메모리 슬롯 이름"><span class="hint" id="slot-count">' + slots.length + ' / ' + MAX_SLOTS + '</span><button class="btn btn-main" id="btn-save-slot" type="button">현재 메모리 저장</button></div>' +
            '<div id="slot-list">' + renderSlotItems(slots) + '</div><div class="msg-status" id="memory-msg"></div>' +
          '</div>' +

          '<div id="tab-split" class="tab-panel">' +
            '<div class="split-card">' +
              '<div class="desc-box">현재 채팅의 hypaV3 마지막 요약 지점을 기준으로 원본 백업, 요약 채팅, 비요약 채팅을 새로 만듭니다. 고아 메모리 보존 옵션을 켜야 합니다.</div>' +
              '<div><button class="btn btn-alt" id="btn-split-chat" type="button">챗 분할 실행</button></div>' +
              '<div class="hint">생성된 채팅은 채팅 목록 맨 앞에 추가됩니다.</div>' +
            '</div>' +
            '<div class="msg-status" id="split-msg"></div>' +
          '</div>' +
        '</div>'
    }

    function bindSlotButtons(charId) {
      document.querySelectorAll('.sl-load').forEach(btn => {
        btn.addEventListener('click', async () => {
          const name = btn.dataset.name
          try {
            await loadSlot(charId, name)
            showMsg('memory-msg', `'${name}' 슬롯을 불러왔습니다.`, false)
          } catch (e) {
            console.error(e)
            showMsg('memory-msg', '불러오기 실패: ' + e.message, true)
          }
        })
      })
      document.querySelectorAll('.sl-dl').forEach(btn => {
        btn.addEventListener('click', async () => {
          const name = btn.dataset.name
          try {
            const data = await getSlotData(charId, name)
            const ts = new Date(data?.timestamp ?? Date.now()).toISOString().slice(0, 10)
            downloadJSON(data, `memory_${safeFileName(charId)}_${safeFileName(name)}_${ts}.json`)
            showMsg('memory-msg', `'${name}' JSON 다운로드를 시작했습니다.`, false)
          } catch (e) {
            console.error(e)
            showMsg('memory-msg', '다운로드 실패: ' + e.message, true)
          }
        })
      })
      document.querySelectorAll('.sl-del').forEach(btn => {
        btn.addEventListener('click', async () => {
          const name = btn.dataset.name
          if (!confirm(`'${name}' 슬롯을 삭제할까요?`)) return
          try {
            await deleteSlot(charId, name)
            await refreshSlots(charId)
            showMsg('memory-msg', `'${name}' 슬롯을 삭제했습니다.`, false)
          } catch (e) {
            console.error(e)
            showMsg('memory-msg', '삭제 실패: ' + e.message, true)
          }
        })
      })
    }

    function bindUI(messages, cfg, presets, char) {
      const total = messages.length
      const charId = getCharId(char)
      let currentPresets = presets.slice()
      let lastSummary = ''
      let lastSummaryChatMemos = []

      document.getElementById('btn-close').addEventListener('click', () => {
        Risuai.hideContainer()
      })
      document.body.addEventListener('click', event => {
        if (event.target === document.body) Risuai.hideContainer()
      })
      const panel = document.querySelector('.panel')
      if (panel) panel.addEventListener('click', event => event.stopPropagation())

      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn))
          document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === btn.dataset.tab))
        })
      })

      function getSelectedIndexes() {
        return Array.from(document.querySelectorAll('.msg-check:checked'))
          .map(input => parseInt(input.dataset.idx))
          .filter(index => Number.isInteger(index))
      }

      function updateSelectionState() {
        const selected = getSelectedIndexes()
        document.querySelectorAll('.msg-row').forEach(row => {
          const input = row.querySelector('.msg-check')
          row.classList.toggle('selected', !!input?.checked && !input.disabled)
        })
        const hint = document.getElementById('selection-hint')
        if (hint) hint.textContent = '총 ' + selected.length + '개 선택'
      }

      document.querySelectorAll('.msg-check').forEach(input => {
        input.addEventListener('click', event => event.stopPropagation())
        input.addEventListener('change', updateSelectionState)
      })
      const messageDialog = document.getElementById('message-dialog')
      document.getElementById('message-dialog-close').addEventListener('click', () => messageDialog.close())
      messageDialog.addEventListener('click', event => {
        if (event.target !== messageDialog) return
        const rect = messageDialog.getBoundingClientRect()
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
          messageDialog.close()
        }
      })
      function openMessageDialog(row) {
        const role = row.querySelector('.msg-role-system, .msg-role-user, .msg-role-char').textContent
        document.getElementById('message-dialog-title').textContent = '#' + row.dataset.idx + ' · ' + role
        const content = document.getElementById('message-dialog-content')
        content.textContent = row.querySelector('.msg-text').textContent
        messageDialog.showModal()
        content.scrollTop = 0
      }
      document.querySelectorAll('.msg-row').forEach(row => {
        row.addEventListener('click', event => {
          if (event.target?.classList?.contains('msg-check')) return
          openMessageDialog(row)
        })
        row.addEventListener('keydown', event => {
          if (event.target === row && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            openMessageDialog(row)
          }
        })
      })
      document.getElementById('btn-select-all').addEventListener('click', () => {
        document.querySelectorAll('.msg-check:not(:disabled)').forEach(input => { input.checked = true })
        updateSelectionState()
      })
      document.getElementById('btn-clear-all').addEventListener('click', () => {
        document.querySelectorAll('.msg-check:not(:disabled)').forEach(input => { input.checked = false })
        updateSelectionState()
      })
      updateSelectionState()

      function selectMessageRange() {
        const startValue = document.getElementById('range-start').value.trim()
        const endValue = document.getElementById('range-end').value.trim()
        const start = Number(startValue)
        const end = Number(endValue)
        if (!startValue || !endValue || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
          showMsg('range-msg', '시작 번호와 끝 번호를 정수로 입력해 주세요.', true)
          return
        }
        if (total === 0) {
          showMsg('range-msg', '메시지가 없습니다.', true)
          return
        }
        if (start < 0 || end < 0 || start >= total || end >= total) {
          showMsg('range-msg', '메시지 번호는 0부터 ' + (total - 1) + '까지 입력해 주세요.', true)
          return
        }
        if (start > end) {
          showMsg('range-msg', '시작 번호는 끝 번호보다 클 수 없습니다.', true)
          return
        }
        if (!messages.slice(start, end + 1).some(message => message.role !== 'system')) {
          showMsg('range-msg', '해당 구간에는 요약할 메시지가 없습니다.', true)
          return
        }
        document.querySelectorAll('.msg-check').forEach(input => {
          const index = Number(input.dataset.idx)
          input.checked = !input.disabled && index >= start && index <= end
        })
        updateSelectionState()
        showMsg('range-msg', '', false)
      }
      document.getElementById('btn-select-range').addEventListener('click', selectMessageRange)
      ;['range-start', 'range-end'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', event => {
          if (event.key !== 'Enter' || event.isComposing) return
          event.preventDefault()
          selectMessageRange()
        })
      })

      function refreshPresetSelect(selectedIndex) {
        const select = document.getElementById('preset-select')
        select.innerHTML = renderPresetOptions(currentPresets)
        select.value = Number.isInteger(selectedIndex) ? String(selectedIndex) : ''
      }
      function putPresetIntoEditor(preset) {
        document.getElementById('preset-name').value = preset.name
        document.getElementById('prompt-input').value = preset.prompt
      }

      document.getElementById('btn-run').addEventListener('click', async () => {
        if (total === 0) {
          showMsg('msg', '메시지가 없습니다.', true)
          return
        }
        const selectedIndexes = getSelectedIndexes()
        if (selectedIndexes.length === 0) {
          showMsg('msg', '요약할 채팅을 하나 이상 선택해 주세요.', true)
          return
        }
        const systemPrompt = document.getElementById('prompt-input')?.value?.trim() || cfg.prompt || ''
        const userContent = formatSelectedForSummary(messages, selectedIndexes)
        if (!userContent.trim()) {
          showMsg('msg', '선택한 채팅에 요약할 내용이 없습니다.', true)
          return
        }
        setLoading(true)
        showMsg('msg', '', false)
        document.getElementById('result-wrap').style.display = 'none'
        document.getElementById('btn-inject').style.display = 'none'
        try {
          const result = await callMemoryModel(cfg, systemPrompt, userContent)
          lastSummary = stripThoughtTags(result)
          lastSummaryChatMemos = getChatMemoIds(messages, selectedIndexes)
          document.getElementById('result-box').value = lastSummary
          document.getElementById('result-wrap').style.display = 'block'
          document.getElementById('btn-inject').style.display = 'block'
          showMsg('msg', '요약 완료.', false)
        } catch (e) {
          console.error(e)
          showMsg('msg', '오류: ' + e.message, true)
        } finally {
          setLoading(false)
        }
      })

      document.getElementById('btn-inject').addEventListener('click', async () => {
        const editedSummary = stripThoughtTags(document.getElementById('result-box')?.value ?? lastSummary)
        if (!editedSummary) return
        try {
          await injectSummary(editedSummary, lastSummaryChatMemos)
          lastSummary = editedSummary
          showMsg('msg', 'hypaV3에 추가했습니다.', false)
          document.getElementById('btn-inject').style.display = 'none'
        } catch (e) {
          console.error(e)
          showMsg('msg', '추가 실패: ' + e.message, true)
        }
      })

      document.getElementById('btn-load-preset').addEventListener('click', () => {
        const idx = parseInt(document.getElementById('preset-select').value)
        const preset = currentPresets[idx]
        if (!preset) {
          showMsg('prompt-msg', '불러올 프리셋을 선택해 주세요.', true)
          return
        }
        putPresetIntoEditor(preset)
        showMsg('prompt-msg', '프리셋을 불러왔습니다.', false)
      })
      document.getElementById('btn-import-json').addEventListener('click', () => {
        document.getElementById('json-input').click()
      })
      document.getElementById('json-input').addEventListener('change', e => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => {
          try {
            const json = JSON.parse(String(ev.target.result ?? ''))
            const preset = extractPromptPresetFromJson(json)
            if (!preset.prompt.trim()) {
              showMsg('prompt-msg', 'JSON에서 summarizationPrompt를 찾지 못했습니다.', true)
              return
            }
            putPresetIntoEditor(preset)
            showMsg('prompt-msg', '"' + preset.name + '" JSON을 불러왔습니다.', false)
          } catch (err) {
            console.error(err)
            showMsg('prompt-msg', 'JSON 파일을 읽지 못했습니다.', true)
          } finally {
            e.target.value = ''
          }
        }
        reader.readAsText(file)
      })
      document.getElementById('btn-save-preset').addEventListener('click', async () => {
        const name = document.getElementById('preset-name').value.trim()
        const prompt = document.getElementById('prompt-input').value.trim()
        if (!name) {
          showMsg('prompt-msg', '프리셋 이름을 입력해 주세요.', true)
          return
        }
        if (!prompt) {
          showMsg('prompt-msg', '저장할 프롬프트를 입력해 주세요.', true)
          return
        }
        const existingIndex = currentPresets.findIndex(p => p.name === name)
        const preset = { name, prompt, updatedAt: Date.now() }
        if (existingIndex >= 0) currentPresets[existingIndex] = preset
        else currentPresets.push(preset)
        await savePromptPresets(currentPresets)
        refreshPresetSelect(existingIndex >= 0 ? existingIndex : currentPresets.length - 1)
        showMsg('prompt-msg', '프리셋을 저장했습니다.', false)
      })
      document.getElementById('btn-delete-preset').addEventListener('click', async () => {
        const idx = parseInt(document.getElementById('preset-select').value)
        if (!currentPresets[idx]) {
          showMsg('prompt-msg', '삭제할 프리셋을 선택해 주세요.', true)
          return
        }
        currentPresets.splice(idx, 1)
        await savePromptPresets(currentPresets)
        refreshPresetSelect()
        showMsg('prompt-msg', '프리셋을 삭제했습니다.', false)
      })
      document.getElementById('btn-save-default').addEventListener('click', async () => {
        const promptVal = document.getElementById('prompt-input').value.trim()
        try {
          await Risuai.setArgument('summary_prompt', promptVal)
          cfg.prompt = promptVal
          showMsg('prompt-msg', '기본 프롬프트로 저장했습니다.', false)
        } catch (e) {
          showMsg('prompt-msg', '저장 실패: ' + e.message, true)
        }
      })

      bindSlotButtons(charId)
      document.getElementById('btn-save-slot').addEventListener('click', async () => {
        const input = document.getElementById('slot-name-input')
        const name = input.value.trim()
        if (!name) {
          showMsg('memory-msg', '슬롯 이름을 입력해 주세요.', true)
          return
        }
        const currentList = await getSlotList(charId)
        const isOverwrite = currentList.some(s => s.name === name)
        if (!isOverwrite && currentList.length >= MAX_SLOTS) {
          showMsg('memory-msg', '슬롯은 최대 ' + MAX_SLOTS + '개까지 저장할 수 있습니다.', true)
          return
        }
        try {
          await saveSlot(charId, name)
          input.value = ''
          await refreshSlots(charId)
          showMsg('memory-msg', isOverwrite ? `'${name}' 슬롯을 덮어썼습니다.` : `'${name}' 슬롯을 저장했습니다.`, false)
        } catch (e) {
          console.error(e)
          showMsg('memory-msg', '저장 실패: ' + e.message, true)
        }
      })
      document.getElementById('slot-name-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btn-save-slot').click()
      })

      document.getElementById('btn-split-chat').addEventListener('click', async () => {
        if (!confirm('현재 채팅을 마지막 hypaV3 요약 기준으로 분할할까요?')) return
        try {
          await splitChatForHypaV3()
          showMsg('split-msg', '챗 분할을 완료했습니다.', false)
        } catch (e) {
          console.error(e)
          showMsg('split-msg', '분할 실패: ' + e.message, true)
        }
      })
    }

    await setupSummaryBodyInterceptor()
    if (typeof Risuai.onUnload === 'function') {
      await Risuai.onUnload(async () => {
        if (summaryBodyInterceptor?.id && typeof Risuai.unregisterBodyIntercepter === 'function') {
          try { await Risuai.unregisterBodyIntercepter(summaryBodyInterceptor.id) } catch {}
        }
      })
    }

    await Risuai.registerButton(
      { name: 'Hypa Manager', icon: '✨️', iconType: 'html', location: 'chat', id: 'hypa-manager-chat' },
      async () => {
        const { char } = await getCharacterContext()
        const charId = getCharId(char)
        const [messages, cfg, presets, slots] = await Promise.all([
          getRawMessages(),
          getConfig(),
          loadPromptPresets(),
          getSlotList(charId)
        ])
        buildUI(messages, cfg, presets, slots, char)
        bindUI(messages, cfg, presets, char)
        await Risuai.showContainer('fullscreen')
      }
    )

    console.log('[Hypa Manager] Plugin loaded v1.7.8')
  } catch (error) {
    console.log('[Hypa Manager] Error: ' + error.message)
  }
})()
