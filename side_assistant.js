//@name side_context_assistant
//@display-name Side Assistant
//@api 3.0
//@version 1.2.0
//@arg context_messages int 포함할 최근 채팅 수
//@arg model_mode string 모델 호출 모드
//@arg custom_api_endpoint string 커스텀 API 엔드포인트
//@arg custom_api_model string 커스텀 API 모델명
//@arg custom_api_key string 커스텀 API 키
//@arg custom_api_params string 커스텀 API 추가 JSON 파라미터
//@arg ai_persona_prompt string AI 페르소나 프롬프트
//@arg system_prompt string 추가 지시문
//@arg parse_cbs_conditions int CBS 파싱 사용
//@arg include_lore_context int 로어북 컨텍스트 포함
//@arg chat_role_filter string 보낼 최근 채팅 역할

(async () => {
  const api = globalThis.Risuai || globalThis.risuai;
  if (!api) {
    console.log("Risuai API was not found.");
    return;
  }

  const storageKeyPrefix = "side_context_assistant_thread";
  const defaultContextMessages = 24;
  const defaultIncludeLoreContext = 1;
  const defaultChatRoleFilter = "all";
  const defaultSidePrompt = [
    "You are an RP side assistant for RisuAI.",
    "Your job is to help the user understand, analyze, plan, and troubleshoot the ongoing roleplay without writing into or interfering with the main chat.",
    "Use the provided character description, selected persona, any included lorebook context, and selected recent chat excerpt as your only scene context.",
    "You may suggest next actions, explain character intent, summarize continuity, check lore consistency, or help draft OOC questions.",
    "Answer in Korean by default unless the user asks for another language.",
    "Be concise, practical, and clear. If the provided context is not enough, say what is missing instead of inventing facts.",
  ].join("\n");
  const textKeys = ["data", "content", "message", "text", "value"];
  const arrayKeys = ["message", "messages", "chat", "chats", "data", "history", "items"];

  const state = {
    thread: [],
    threadKey: "",
    context: null,
    busy: false,
    settingsOpen: false,
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function readInt(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, min, max);
  }

  function normalizeRole(role) {
    const raw = String(role || "").toLowerCase();
    if (raw.includes("user")) return "user";
    if (raw.includes("char") || raw.includes("assistant") || raw.includes("bot")) return "assistant";
    if (raw.includes("system")) return "system";
    return "unknown";
  }

  function roleLabel(role) {
    if (role === "user") return "User";
    if (role === "assistant") return "Character";
    if (role === "system") return "System";
    return "Unknown";
  }

  function normalizeChatRoleFilter(value) {
    const raw = String(value || "").toLowerCase();
    if (raw === "user") return "user";
    if (raw === "assistant" || raw === "character" || raw === "char") return "assistant";
    return defaultChatRoleFilter;
  }

  function chatRoleFilterLabel(value) {
    const filter = normalizeChatRoleFilter(value);
    if (filter === "user") return "사용자만";
    if (filter === "assistant") return "캐릭터만";
    return "사용자+캐릭터";
  }

  function shouldIncludeChatRole(role, filter) {
    const normalizedFilter = normalizeChatRoleFilter(filter);
    if (normalizedFilter === "user") return role === "user";
    if (normalizedFilter === "assistant") return role === "assistant";
    return role === "user" || role === "assistant" || role === "unknown";
  }

  function getTextRef(message) {
    if (typeof message === "string") return { value: message };
    if (!message || typeof message !== "object") return null;

    for (const key of textKeys) {
      if (typeof message[key] === "string") return { value: message[key] };
    }

    return null;
  }

  function scoreMessageArray(value) {
    if (!Array.isArray(value) || value.length === 0) return 0;
    let score = 0;

    for (const item of value.slice(0, 30)) {
      if (typeof item === "string") {
        score += item.length > 0 ? 1 : 0;
        continue;
      }

      if (!item || typeof item !== "object") continue;
      if ("role" in item) score += 2;
      if ("time" in item || "sendTime" in item || "date" in item) score += 1;

      for (const key of textKeys) {
        if (typeof item[key] === "string") score += 4;
      }
    }

    return score;
  }

  function findMessageArray(root) {
    if (Array.isArray(root)) return root;

    const queue = [{ value: root, depth: 0 }];
    let best = null;

    while (queue.length) {
      const item = queue.shift();
      if (!item || !item.value || typeof item.value !== "object" || item.depth > 4) continue;

      const keys = Object.keys(item.value);
      const orderedKeys = [
        ...arrayKeys.filter((key) => keys.includes(key)),
        ...keys.filter((key) => !arrayKeys.includes(key)),
      ];

      for (const key of orderedKeys) {
        const child = item.value[key];
        const score = scoreMessageArray(child);
        if (score > 0 && (!best || score > best.score)) best = { messages: child, score };
        if (child && typeof child === "object" && !Array.isArray(child)) {
          queue.push({ value: child, depth: item.depth + 1 });
        }
      }
    }

    return best ? best.messages : [];
  }

  function getCharacterDescription(character) {
    if (!character || typeof character !== "object") return "";
    return (
      character.description ||
      character.desc ||
      character.personality ||
      character.prompt ||
      character.data?.description ||
      ""
    );
  }

  function getPersonaName(persona) {
    if (!persona || typeof persona !== "object") return "";
    return String(persona.name || persona.personaName || persona.title || persona.id || "");
  }

  function getPersonaPrompt(persona) {
    if (!persona || typeof persona !== "object") return "";
    return String(persona.personaPrompt || persona.description || persona.prompt || persona.note || persona.content || "");
  }

  function isPersonaLike(value) {
    return Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        (value.personaPrompt || value.name || value.personaName || value.prompt || value.note)
    );
  }

  function matchPersona(personas, ref) {
    if (!Array.isArray(personas) || ref == null) return null;

    if (typeof ref === "number") return personas[ref] || null;
    if (isPersonaLike(ref)) {
      const direct =
        personas.find((persona) => persona === ref) ||
        personas.find((persona) => ref.id && persona.id === ref.id) ||
        personas.find((persona) => ref.name && persona.name === ref.name);
      return direct || ref;
    }

    if (typeof ref === "string") {
      const trimmed = ref.trim();
      if (!trimmed) return null;
      const numeric = Number.parseInt(trimmed, 10);
      if (String(numeric) === trimmed && personas[numeric]) return personas[numeric];

      return (
        personas.find((persona) => String(persona.id || "") === trimmed) ||
        personas.find((persona) => String(persona.name || "") === trimmed) ||
        personas.find((persona) => String(persona.personaName || "") === trimmed) ||
        null
      );
    }

    return null;
  }

  function collectPersonaRefs(root, refs = [], depth = 0) {
    if (!root || typeof root !== "object" || depth > 4) return refs;

    for (const [key, value] of Object.entries(root)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === "personas") continue;

      if (normalizedKey.includes("persona") || normalizedKey.includes("userpersona")) {
        refs.push(value);
        if (value && typeof value === "object" && !Array.isArray(value)) {
          refs.push(...Object.values(value));
        }
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        collectPersonaRefs(value, refs, depth + 1);
      }
    }

    return refs;
  }

  function collectBoundPersonaRefs(root, character, refs = [], depth = 0) {
    if (!root || typeof root !== "object" || depth > 4) return refs;
    const characterKeys = [
      character?.chaId,
      character?.id,
      character?.name,
      character?.data?.chaId,
      character?.data?.id,
    ]
      .map((value) => String(value || ""))
      .filter(Boolean);

    for (const [key, value] of Object.entries(root)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey === "personas") continue;

      if ((normalizedKey.includes("persona") || normalizedKey.includes("userpersona")) && value && typeof value === "object" && !Array.isArray(value)) {
        for (const characterKey of characterKeys) {
          if (Object.prototype.hasOwnProperty.call(value, characterKey)) refs.push(value[characterKey]);
        }
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        collectBoundPersonaRefs(value, character, refs, depth + 1);
      }
    }

    return refs;
  }

  function findSelectedPersona(db, character, chat) {
    if (!db || !Array.isArray(db.personas)) return null;

    const refs = [
      ...collectBoundPersonaRefs(chat, character),
      ...collectPersonaRefs(chat),
      ...collectBoundPersonaRefs(character, character),
      ...collectPersonaRefs(character),
      ...collectBoundPersonaRefs(db, character),
      db.boundPersona,
      db.bindedPersona,
      db.selectedPersona,
      db.currentPersona,
      db.persona,
      db.personaId,
      db.personaIndex,
    ];

    for (const ref of refs) {
      const matched = matchPersona(db.personas, ref);
      if (matched) return matched;
    }

    return db.personas.length === 1 ? db.personas[0] : null;
  }

  async function parseContextCbs(value) {
    const text = String(value ?? "");
    if (!text) return text;
    if (typeof api.parseRisuChat !== "function") {
      throw new Error("PocketRisu CBS 파싱 API를 사용할 수 없습니다. PocketRisu를 업데이트하거나 CBS API 파싱 옵션을 꺼 주세요.");
    }

    try {
      // Use the active character/chat's native CBS context without running variable writes or regex scripts.
      const parsed = await api.parseRisuChat(text, {
        messageIndex: -1,
        processRegex: false,
        runVar: false,
        rmVar: true,
      });
      if (typeof parsed !== "string") {
        throw new Error("파싱 API가 문자열을 반환하지 않았습니다.");
      }
      return parsed;
    } catch (error) {
      throw new Error(`PocketRisu CBS 파싱 실패: ${error?.message || String(error)}`);
    }
  }

  function entryText(entry) {
    if (!entry || typeof entry !== "object") return "";
    return String(entry.content || entry.data || entry.text || entry.value || "");
  }

  function entryTitle(entry, index) {
    if (!entry || typeof entry !== "object") return `Entry ${index + 1}`;
    return String(entry.comment || entry.name || entry.title || entry.key || `Entry ${index + 1}`);
  }

  function entryKeys(entry) {
    if (!entry || typeof entry !== "object") return [];
    const raw = [
      entry.key,
      entry.keys,
      entry.secondKey,
      entry.secondaryKey,
      entry.activationKeys,
      entry.regex,
    ];

    return raw
      .flatMap((value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") return value.split(/[,|\n]/g);
        return [];
      })
      .map((value) => String(value).trim())
      .filter(Boolean);
  }

  function isAlwaysActive(entry) {
    if (!entry || typeof entry !== "object") return false;
    return Boolean(entry.alwaysActive || entry.constant || entry.forceActivation || entry.insertAlways);
  }

  function selectLoreEntries(entries, contextText) {
    const normalizedContext = contextText.toLowerCase();
    const scored = (Array.isArray(entries) ? entries : []).map((entry, index) => {
      const keys = entryKeys(entry);
      const keyHits = keys.filter((key) => {
        const normalizedKey = key.toLowerCase();
        if (!normalizedKey) return false;
        try {
          if (entry?.regex) return new RegExp(key, "i").test(contextText);
        } catch (_) {
          return false;
        }
        return normalizedContext.includes(normalizedKey);
      });

      const always = isAlwaysActive(entry);
      return {
        entry,
        index,
        score: (always ? 100 : 0) + keyHits.length * 10,
        reason: always ? "always active" : keyHits.length ? `matched: ${keyHits.slice(0, 4).join(", ")}` : "",
      };
    });

    const selected = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index);

    return selected;
  }

  function compactMessages(messages, limit, roleFilter = defaultChatRoleFilter) {
    return messages
      .map((message, index) => {
      const textRef = getTextRef(message);
      return {
        index: index + 1,
        role: normalizeRole(message?.role || message?.type),
        text: textRef ? textRef.value : JSON.stringify(message),
      };
    })
      .filter((item) => shouldIncludeChatRole(item.role, roleFilter))
      .slice(-limit);
  }

  async function loadThread() {
    state.threadKey = await getCurrentThreadKey();
    const saved = await api.pluginStorage.getItem(state.threadKey);
    state.thread = Array.isArray(saved) ? saved : [];
  }

  async function saveThread() {
    if (!state.threadKey) state.threadKey = await getCurrentThreadKey();
    await api.pluginStorage.setItem(state.threadKey, state.thread.slice(-40));
  }

  async function getCurrentThreadKey() {
    const [character, charIndex, chatIndex] = await Promise.all([
      api.getCharacter().catch(() => null),
      api.getCurrentCharacterIndex().catch(() => -1),
      api.getCurrentChatIndex().catch(() => -1),
    ]);
    const characterId = String(character?.chaId || character?.id || charIndex);
    return `${storageKeyPrefix}:${encodeURIComponent(characterId)}:${chatIndex}`;
  }

  async function gatherContext(options = {}) {
    const contextLimit =
      options.contextLimit ?? readInt(await api.getArgument("context_messages"), defaultContextMessages, 4, 80);
    const parseCbs =
      options.parseCbs ?? readInt(await api.getArgument("parse_cbs_conditions"), 1, 0, 1) === 1;
    const includeLore =
      options.includeLore ?? readInt(await api.getArgument("include_lore_context"), defaultIncludeLoreContext, 0, 1) === 1;
    const chatRoleFilter = normalizeChatRoleFilter(options.chatRoleFilter ?? (await api.getArgument("chat_role_filter")));
    const [character, charIndex, chatIndex, db, loreEntries] = await Promise.all([
      api.getCharacter(),
      api.getCurrentCharacterIndex(),
      api.getCurrentChatIndex(),
      api.getDatabase("all"),
      api.getCurrentLorebookEntries().catch(() => []),
    ]);

    const chat = await api.getChatFromIndex(charIndex, chatIndex);
    const messages = findMessageArray(chat);
    const rawRecent = compactMessages(messages, contextLimit, chatRoleFilter);
    const persona = findSelectedPersona(db, character, chat);
    const alwaysActiveLoreCount = Array.isArray(loreEntries)
      ? loreEntries.filter((entry) => isAlwaysActive(entry)).length
      : 0;
    // Keep the legacy argument key so existing saved settings continue to work.
    if (parseCbs && typeof api.parseRisuChat !== "function") {
      throw new Error("PocketRisu CBS 파싱 API를 사용할 수 없습니다. PocketRisu를 업데이트하거나 CBS API 파싱 옵션을 꺼 주세요.");
    }
    const parseContextText = (value) => (parseCbs ? parseContextCbs(value) : String(value ?? ""));
    const recent = rawRecent;
    const recentText = recent.map((item) => `${roleLabel(item.role)}: ${item.text}`).join("\n\n");
    const selectedLore = includeLore ? selectLoreEntries(loreEntries, recentText) : [];

    const context = {
      characterName: character?.name || "Unknown character",
      characterDescription: await parseContextText(getCharacterDescription(character)),
      personaName: getPersonaName(persona),
      personaDescription: await parseContextText(getPersonaPrompt(persona)),
      recent,
      lore: await Promise.all(selectedLore.map(async (item) => ({
        title: entryTitle(item.entry, item.index),
        reason: item.reason,
        content: await parseContextText(entryText(item.entry)),
      }))),
      counts: {
        allMessages: messages.length,
        recentMessages: recent.length,
        rawLoreEntries: Array.isArray(loreEntries) ? loreEntries.length : 0,
        selectedLoreEntries: selectedLore.length,
        alwaysActiveLoreEntries: alwaysActiveLoreCount,
        parseCbs,
        includeLore,
        chatRoleFilter,
      },
    };

    if (options.commit !== false) state.context = context;
    return context;
  }

  function buildContextBlock(context) {
    const loreText = context.lore.length
      ? context.lore
          .map((entry) => entry.content)
          .join("\n\n")
      : "No lorebook content is available.";

    const recentText = context.recent.length
      ? context.recent
          .map((item) => `[${item.index}] ${roleLabel(item.role)}\n${item.text}`)
          .join("\n\n")
      : "No recent chat messages were found.";

    return [
      "# Current Context",
      "",
      "## Character",
      context.characterDescription || "(No character description was found.)",
      "",
      "## User Persona",
      context.personaDescription || "(No persona description was found.)",
      "",
      ...(context.counts.includeLore ? ["## Lorebook Entries", loreText, ""] : []),
      "## Recent Main Chat Context",
      recentText,
    ].join("\n");
  }

  function parseCustomParams(value) {
    const text = String(value || "").trim();
    if (!text) return {};

    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("커스텀 파라미터 JSON은 객체 형태여야 합니다.");
    }

    return parsed;
  }

  function extractResponseText(data, depth = 0) {
    if (typeof data === "string") return data;
    if (!data || typeof data !== "object") return "";
    if (depth > 5) return JSON.stringify(data);

    const choice = Array.isArray(data.choices) ? data.choices[0] : null;
    if (choice) {
      const choiceText = extractResponseText(choice.message?.content ?? choice.delta?.content ?? choice.text, depth + 1);
      if (choiceText) return choiceText;
    }

    if (data.success === true && "result" in data) return extractResponseText(data.result, depth + 1);
    if (data.success === true && "content" in data) return extractResponseText(data.content, depth + 1);
    if ("result" in data) return extractResponseText(data.result, depth + 1);
    if ("content" in data) return extractResponseText(data.content, depth + 1);
    if ("message" in data) return extractResponseText(data.message, depth + 1);
    if ("text" in data) return extractResponseText(data.text, depth + 1);
    if ("output" in data) return extractResponseText(data.output, depth + 1);
    if ("response" in data) return extractResponseText(data.response, depth + 1);

    if (typeof data.output_text === "string") return data.output_text;

    if (Array.isArray(data)) {
      const joined = data
        .map((item) => extractResponseText(item, depth + 1))
        .filter(Boolean)
        .join("\n");
      if (joined) return joined;
    }

    return JSON.stringify(data);
  }

  async function callCustomApi(messages) {
    const endpoint = String((await api.getArgument("custom_api_endpoint")) || "").trim();
    const model = String((await api.getArgument("custom_api_model")) || "").trim();
    const apiKey = String((await api.getArgument("custom_api_key")) || "").trim();
    const params = parseCustomParams(await api.getArgument("custom_api_params"));

    if (!endpoint) throw new Error("커스텀 API 엔드포인트를 입력해 주세요.");
    if (!model) throw new Error("커스텀 API 모델명을 입력해 주세요.");

    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await api.nativeFetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        ...params,
      }),
    });

    const text = await response.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }

    if (!response.ok) {
      const message = typeof data === "string" ? data : data?.error?.message || JSON.stringify(data);
      throw new Error(`커스텀 API 오류 (${response.status}): ${message}`);
    }

    return extractResponseText(data);
  }

  async function buildSideModelMessages(question, context, overrides = {}) {
    const aiPersona =
      overrides.aiPersona ?? String((await api.getArgument("ai_persona_prompt")) || "").trim();
    const extraInstruction =
      overrides.extraInstruction ?? String((await api.getArgument("system_prompt")) || "").trim();

    return [
      {
        role: "system",
        content: [
          defaultSidePrompt,
          aiPersona
            ? [
                "The following is the persona assigned to you by the user.",
                "You must roleplay as this character while acting as the RP side assistant.",
                "Maintain this persona's voice, attitude, and boundaries unless the user explicitly changes it.",
                "",
                aiPersona,
              ].join("\n")
            : "",
          extraInstruction,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      { role: "user", content: buildContextBlock(context) },
      ...state.thread.slice(-12).map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content,
      })),
      { role: "user", content: question },
    ];
  }

  function formatPromptPreview(messages) {
    return messages
      .map((message, index) => `--- ${index + 1}. ${message.role.toUpperCase()} ---\n${message.content}`)
      .join("\n\n");
  }

  async function askSideModel(question) {
    const currentKey = await getCurrentThreadKey();
    if (state.threadKey !== currentKey) {
      await loadThread();
      state.context = null;
      renderMessages();
    }
    const context = state.context || (await gatherContext());
    const mode = String((await api.getArgument("model_mode")) || "otherAx").trim() || "otherAx";
    const messages = await buildSideModelMessages(question, context);

    if (mode === "custom") return await callCustomApi(messages);

    const response = await api.runLLMModel({
      messages,
      mode,
      allowPlugins: false,
    });

    if (typeof response === "string") return response;
    if (response && typeof response.getReader === "function") return await readStream(response);
    return extractResponseText(response);
  }

  async function readStream(stream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += typeof value === "string" ? value : decoder.decode(value, { stream: true });
    }

    result += decoder.decode();
    return result;
  }

  const suggestionPrompts = [
    "지금까지 줄거리를 요약해줘",
    "이 캐릭터가 지금 무슨 생각을 하고 있을까?",
    "설정과 어긋난 부분이 있는지 확인해줘",
    "다음 전개 아이디어를 3가지 제안해줘",
  ];

  function renderMessages() {
    const list = document.getElementById("messages");
    if (!list) return;

    if (!state.thread.length) {
      list.innerHTML = `
        <div class="empty">
          <div class="emptyIcon">
            <svg class="ic" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 11h6M9 14h3"/></svg>
          </div>
          <h2>무엇이든 물어보세요</h2>
          <p>현재 캐릭터와 최근 채팅을 참고해 답해드려요.<br />이 대화는 본 채팅에 기록되지 않습니다.</p>
          <div class="suggestions">
            ${suggestionPrompts
              .map((text) => `<button class="suggestion" data-suggest="${escapeHtml(text)}">${escapeHtml(text)}</button>`)
              .join("")}
          </div>
        </div>
      `;
      return;
    }

    const last = state.thread[state.thread.length - 1];
    const typing =
      state.busy && last.role === "user"
        ? `<article class="msg assistant">
             <div class="msgRole">AI</div>
             <div class="msgText typing" aria-label="응답 작성 중"><i></i><i></i><i></i></div>
           </article>`
        : "";

    list.innerHTML =
      state.thread
        .map((item) => {
          const isError = item.role === "assistant" && String(item.content).startsWith("Error:");
          return `
            <article class="msg ${item.role}${isError ? " error" : ""}">
              <div class="msgRole">${item.role === "assistant" ? "AI" : "나"}</div>
              <div class="msgText">${escapeHtml(item.content)}</div>
            </article>
          `;
        })
        .join("") + typing;
    scrollMessagesToBottom();
  }

  function scrollMessagesToBottom() {
    const list = document.getElementById("messages");
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }

  function scheduleScrollMessagesToBottom() {
    scrollMessagesToBottom();
    window.requestAnimationFrame(scrollMessagesToBottom);
    [50, 150, 350].forEach((delay) => {
      window.setTimeout(scrollMessagesToBottom, delay);
    });
  }

  function renderContextSummary() {
    const target = document.getElementById("contextSummary");
    if (!target) return;
    if (!state.context) {
      target.innerHTML = `<span class="chip muted">아직 컨텍스트를 불러오지 않았습니다.</span>`;
      return;
    }

    const { counts, characterName, personaName } = state.context;
    const chips = [
      { text: characterName || "알 수 없는 캐릭터", cls: "accent" },
      { text: `최근 채팅 ${counts.recentMessages}/${counts.allMessages}` },
      { text: `역할 ${chatRoleFilterLabel(counts.chatRoleFilter)}` },
      counts.includeLore
        ? { text: `로어북 ${counts.selectedLoreEntries} · 상시 ${counts.alwaysActiveLoreEntries}` }
        : { text: "로어북 꺼짐", cls: "off" },
      counts.parseCbs ? { text: "CBS 파싱 켬" } : { text: "CBS 파싱 끔", cls: "off" },
      personaName ? { text: `페르소나 ${personaName}` } : { text: "페르소나 알 수 없음", cls: "off" },
    ];

    target.innerHTML = chips
      .map((chip) => `<span class="chip${chip.cls ? ` ${chip.cls}` : ""}">${escapeHtml(chip.text)}</span>`)
      .join("");
  }

  let statusTimer = null;

  function renderStatus(text, type = "") {
    const status = document.getElementById("status");
    if (!status) return;
    window.clearTimeout(statusTimer);
    status.textContent = text || "";
    status.className = `status ${type}`;
    status.hidden = !text;
    // Success messages fade out on their own; errors and progress stay until replaced.
    if (text && type === "success") {
      statusTimer = window.setTimeout(() => renderStatus(""), 3500);
    }
  }

  function setBusy(value) {
    state.busy = value;
    ["askBtn", "refreshBtn", "settingsBtn", "settingsSaveBtn", "promptPreviewBtn", "question"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.disabled = value;
    });
    renderMessages(); // shows/hides the typing indicator
  }

  async function handleAsk() {
    const input = document.getElementById("question");
    const question = input.value.trim();
    if (!question || state.busy) return;

    input.value = "";
    input.dispatchEvent(new Event("input"));
    state.thread.push({ role: "user", content: question });
    renderMessages();
    setBusy(true);
    renderStatus("AI에게 묻는 중...");

    try {
      const answer = await askSideModel(question);
      state.thread.push({ role: "assistant", content: answer || "(빈 응답입니다.)" });
      await saveThread();
      renderMessages();
      renderStatus("응답을 받았습니다.", "success");
    } catch (error) {
      state.thread.push({ role: "assistant", content: `Error: ${error.message}` });
      renderMessages();
      renderStatus(error.message, "error");
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  async function refreshContext() {
    if (state.busy) return;
    setBusy(true);
    renderStatus("현재 컨텍스트를 다시 읽는 중...");
    try {
      await gatherContext();
      renderContextSummary();
      renderStatus("컨텍스트를 새로고침했습니다.", "success");
    } catch (error) {
      renderStatus(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function clearThread() {
    const confirmed = window.confirm("현재 채팅의 Side Assistant 대화를 초기화할까요?");
    if (!confirmed) return;

    if (!state.threadKey) state.threadKey = await getCurrentThreadKey();
    state.thread = [];
    await api.pluginStorage.removeItem(state.threadKey);
    renderMessages();
    renderStatus("현재 채팅의 Side Assistant 대화를 초기화했습니다.", "success");
  }

  function setSettingsOpen(open) {
    state.settingsOpen = open;
    const panel = document.getElementById("settingsPanel");
    if (panel) panel.hidden = !open;
  }

  function syncCustomApiFields() {
    const mode = document.getElementById("settingModelMode")?.value || "otherAx";
    const fields = document.getElementById("customApiFields");
    if (fields) fields.hidden = mode !== "custom";
  }

  async function openSettings() {
    document.getElementById("settingContextMessages").value =
      readInt(await api.getArgument("context_messages"), defaultContextMessages, 4, 80);
    document.getElementById("settingModelMode").value = String((await api.getArgument("model_mode")) || "otherAx");
    document.getElementById("settingCustomEndpoint").value = String((await api.getArgument("custom_api_endpoint")) || "");
    document.getElementById("settingCustomModel").value = String((await api.getArgument("custom_api_model")) || "");
    document.getElementById("settingCustomKey").value = String((await api.getArgument("custom_api_key")) || "");
    document.getElementById("settingCustomParams").value = String((await api.getArgument("custom_api_params")) || "");
    document.getElementById("settingAiPersona").value = String((await api.getArgument("ai_persona_prompt")) || "");
    document.getElementById("settingSystemPrompt").value = String((await api.getArgument("system_prompt")) || "");
    document.getElementById("settingParseCbs").checked =
      readInt(await api.getArgument("parse_cbs_conditions"), 1, 0, 1) === 1;
    document.getElementById("settingIncludeLore").checked =
      readInt(await api.getArgument("include_lore_context"), defaultIncludeLoreContext, 0, 1) === 1;
    document.getElementById("settingChatRoleFilter").value = normalizeChatRoleFilter(await api.getArgument("chat_role_filter"));
    const previewOutput = document.getElementById("promptPreviewOutput");
    if (previewOutput) {
      previewOutput.value = "";
      previewOutput.hidden = true;
    }
    syncCustomApiFields();
    setSettingsOpen(true);
  }

  async function saveSettings() {
    const contextMessages = readInt(document.getElementById("settingContextMessages").value, defaultContextMessages, 4, 80);
    const modelMode = document.getElementById("settingModelMode").value.trim() || "otherAx";
    const customEndpoint = document.getElementById("settingCustomEndpoint").value.trim();
    const customModel = document.getElementById("settingCustomModel").value.trim();
    const customKey = document.getElementById("settingCustomKey").value.trim();
    const customParams = document.getElementById("settingCustomParams").value.trim();
    const aiPersona = document.getElementById("settingAiPersona").value.trim();
    const systemPrompt = document.getElementById("settingSystemPrompt").value.trim();
    const parseCbs = document.getElementById("settingParseCbs").checked ? 1 : 0;
    const includeLore = document.getElementById("settingIncludeLore").checked ? 1 : 0;
    const chatRoleFilter = normalizeChatRoleFilter(document.getElementById("settingChatRoleFilter").value);

    try {
      parseCustomParams(customParams);
    } catch (error) {
      renderStatus(error.message, "error");
      return;
    }

    await Promise.all([
      api.setArgument("context_messages", contextMessages),
      api.setArgument("model_mode", modelMode),
      api.setArgument("custom_api_endpoint", customEndpoint),
      api.setArgument("custom_api_model", customModel),
      api.setArgument("custom_api_key", customKey),
      api.setArgument("custom_api_params", customParams),
      api.setArgument("ai_persona_prompt", aiPersona),
      api.setArgument("system_prompt", systemPrompt),
      api.setArgument("parse_cbs_conditions", parseCbs),
      api.setArgument("include_lore_context", includeLore),
      api.setArgument("chat_role_filter", chatRoleFilter),
    ]);

    setSettingsOpen(false);
    await refreshContext();
    renderStatus("설정을 저장했습니다.", "success");
  }

  async function previewPrompt() {
    const output = document.getElementById("promptPreviewOutput");
    const button = document.getElementById("promptPreviewBtn");
    if (!output || state.busy) return;

    if (button) button.disabled = true;
    output.hidden = false;
    output.value = "미리보기를 만드는 중...";

    try {
      const context = await gatherContext({
        contextLimit: readInt(document.getElementById("settingContextMessages").value, defaultContextMessages, 4, 80),
        parseCbs: document.getElementById("settingParseCbs").checked,
        includeLore: document.getElementById("settingIncludeLore").checked,
        chatRoleFilter: document.getElementById("settingChatRoleFilter").value,
        commit: false,
      });
      const question = document.getElementById("question")?.value.trim() || "(The user's question will appear here.)";
      const messages = await buildSideModelMessages(question, context, {
        aiPersona: document.getElementById("settingAiPersona").value.trim(),
        extraInstruction: document.getElementById("settingSystemPrompt").value.trim(),
      });

      output.value = formatPromptPreview(messages);
      renderStatus("프롬프트 미리보기를 만들었습니다.", "success");
    } catch (error) {
      output.value = `Error: ${error.message}`;
      renderStatus(error.message, "error");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function forceTransparentContainer() {
    const setTransparent = (element) => {
      if (!element?.style?.setProperty) return;
      element.style.setProperty("background", "transparent", "important");
      element.style.setProperty("background-color", "transparent", "important");
    };

    setTransparent(document.documentElement);
    setTransparent(document.body);

    try {
      const frame = window.frameElement;
      setTransparent(frame);
      if (frame) frame.setAttribute("allowtransparency", "true");

      let parent = frame?.parentElement;
      for (let i = 0; parent && i < 8; i += 1) {
        setTransparent(parent);
        parent = parent.parentElement;
      }
    } catch {
      // Parent access can fail in some containers; the in-frame styles above still apply.
    }
  }

  function scheduleTransparentFix() {
    forceTransparentContainer();
    [0, 50, 200, 600].forEach((delay) => {
      window.setTimeout(forceTransparentContainer, delay);
    });
  }

  function renderUI() {
    document.body.innerHTML = `
      <style>
        :root {
          color-scheme: light dark;
          --accent: #4f6ef7;
          --accent-hover: #4060e6;
          --accent-soft: rgba(79, 110, 247, 0.12);
          --accent-ink: #ffffff;
          --ok: #1f9d55;
          --err: #e5484d;
          --bg: #f6f7fb;
          --surface: #ffffff;
          --surface-2: #f0f2f7;
          --ink: #16181d;
          --muted: #6b7280;
          --line: rgba(22, 24, 29, 0.10);
          --line-strong: rgba(22, 24, 29, 0.20);
          --bubble-ai: #ffffff;
          --scrim: rgba(15, 18, 25, 0.32);
          --shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
          --mono: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
          font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Noto Sans KR", "Segoe UI", system-ui, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --accent: #6b86ff;
            --accent-hover: #8298ff;
            --accent-soft: rgba(107, 134, 255, 0.16);
            --ok: #3ecf8e;
            --err: #ff6b70;
            --bg: #0f1115;
            --surface: #171a21;
            --surface-2: #1f232c;
            --ink: #eceef3;
            --muted: #9aa3b2;
            --line: rgba(255, 255, 255, 0.09);
            --line-strong: rgba(255, 255, 255, 0.20);
            --bubble-ai: #1f232c;
            --scrim: rgba(0, 0, 0, 0.5);
            --shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
          }
        }

        * { box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: transparent !important; }
        body { margin: 0; color: var(--ink); -webkit-font-smoothing: antialiased; }
        body::before, body::after { display: none !important; }
        button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
        button:disabled, input:disabled, textarea:disabled { opacity: 0.5; cursor: not-allowed; }
        :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        svg.ic { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
        [hidden] { display: none !important; }

        /* ---------- Layout ---------- */
        .app {
          position: fixed; inset: 0; display: grid; place-items: center; padding: 24px;
          background: var(--scrim);
        }
        .dialog {
          position: relative; width: min(960px, 100%); height: min(760px, 100%);
          display: grid; grid-template-rows: auto auto minmax(0, 1fr); overflow: hidden;
          background: var(--bg); border: 1px solid var(--line); border-radius: 22px; box-shadow: var(--shadow);
        }

        /* ---------- Header ---------- */
        .topbar {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 16px 14px 20px; background: var(--surface); border-bottom: 1px solid var(--line);
        }
        .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .brandIcon {
          width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; color: #fff;
          background: linear-gradient(135deg, #7c93ff, var(--accent));
        }
        .brandIcon .ic { width: 20px; height: 20px; }
        h1 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
        .subtitle { margin-top: 1px; font-size: 12px; color: var(--muted); }
        .headerActions { display: flex; align-items: center; gap: 2px; }
        .iconBtn {
          width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; color: var(--muted);
          transition: background 0.15s, color 0.15s;
        }
        .iconBtn:hover:not(:disabled) { background: var(--surface-2); color: var(--ink); }
        .headerActions .divider { width: 1px; height: 18px; margin: 0 6px; background: var(--line); }

        /* ---------- Context chips ---------- */
        .contextStrip {
          display: flex; align-items: center; gap: 10px; padding: 10px 20px;
          background: var(--surface); border-bottom: 1px solid var(--line);
        }
        .summaryTitle { flex: none; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; color: var(--muted); }
        .summary { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding: 1px 0; }
        .summary::-webkit-scrollbar { display: none; }
        .chip {
          flex: none; display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
          border-radius: 999px; background: var(--surface-2); color: var(--ink); font-size: 12px; white-space: nowrap;
        }
        .chip b { font-weight: 600; }
        .chip.accent { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
        .chip.off { color: var(--muted); }
        .chip.muted { color: var(--muted); background: transparent; padding-left: 0; }

        /* ---------- Messages ---------- */
        main { min-height: 0; display: grid; grid-template-rows: minmax(0, 1fr) auto auto; }
        #messages {
          min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;
          padding: 24px clamp(16px, 6vw, 64px); scroll-behavior: smooth;
        }
        .msg { display: flex; flex-direction: column; max-width: min(720px, 90%); }
        .msg.user { align-self: flex-end; align-items: flex-end; }
        .msg.assistant { align-self: flex-start; align-items: flex-start; }
        .msgRole { margin: 0 6px 4px; font-size: 11px; font-weight: 600; color: var(--muted); }
        .msgText {
          padding: 10px 14px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere;
          background: var(--bubble-ai); border: 1px solid var(--line); border-radius: 18px 18px 18px 6px;
        }
        .msg.user .msgText {
          background: var(--accent); color: var(--accent-ink); border-color: transparent; border-radius: 18px 18px 6px 18px;
        }
        .msg.error .msgText { border-color: var(--err); color: var(--err); }
        .typing { display: inline-flex; gap: 4px; padding: 14px 16px; }
        .typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: blink 1.2s infinite ease-in-out; }
        .typing i:nth-child(2) { animation-delay: 0.15s; }
        .typing i:nth-child(3) { animation-delay: 0.3s; }
        @keyframes blink { 0%, 80%, 100% { opacity: 0.25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }
        @media (prefers-reduced-motion: reduce) { .typing i { animation: none; opacity: 0.6; } #messages { scroll-behavior: auto; } }

        .empty { margin: auto; max-width: 460px; display: grid; justify-items: center; gap: 6px; text-align: center; padding: 12px; }
        .emptyIcon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 16px; background: var(--accent-soft); color: var(--accent); margin-bottom: 6px; }
        .emptyIcon .ic { width: 24px; height: 24px; }
        .empty h2 { margin: 0; font-size: 16px; font-weight: 700; }
        .empty p { margin: 0; font-size: 13px; line-height: 1.55; color: var(--muted); }
        .suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 14px; }
        .suggestion {
          padding: 8px 12px; font-size: 13px; border-radius: 12px; background: var(--surface);
          border: 1px solid var(--line); transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .suggestion:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }

        /* ---------- Status ---------- */
        .status { padding: 6px 20px; font-size: 12px; color: var(--muted); text-align: center; }
        .status.error { color: var(--err); }
        .status.success { color: var(--ok); }

        /* ---------- Composer ---------- */
        .composer { padding: 4px clamp(12px, 4vw, 48px) 14px; }
        .composerBox {
          display: flex; align-items: flex-end; gap: 8px; padding: 8px 8px 8px 16px;
          background: var(--surface); border: 1px solid var(--line-strong); border-radius: 22px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .composerBox:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
        .composerBox textarea {
          flex: 1; min-width: 0; min-height: 24px; max-height: 160px; margin: 6px 0; padding: 0;
          border: 0; outline: 0; resize: none; background: transparent; color: var(--ink);
          font: inherit; font-size: 14px; line-height: 1.5;
        }
        .composerBox textarea::placeholder { color: var(--muted); }
        .sendBtn {
          width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%;
          background: var(--accent); color: var(--accent-ink); transition: background 0.15s, transform 0.1s;
        }
        .sendBtn:hover:not(:disabled) { background: var(--accent-hover); }
        .sendBtn:active:not(:disabled) { transform: scale(0.94); }
        .composerHint { margin: 6px 6px 0; font-size: 11px; color: var(--muted); text-align: right; }

        /* ---------- Settings modal ---------- */
        .settingsPanel {
          position: absolute; inset: 0; z-index: 20; display: grid; place-items: center; padding: 16px;
          background: var(--scrim);
        }
        .settingsBox {
          width: min(640px, 100%); max-height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr) auto;
          overflow: hidden; background: var(--bg); border: 1px solid var(--line); border-radius: 18px; box-shadow: var(--shadow);
        }
        .settingsHead {
          display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 12px 20px;
          background: var(--surface); border-bottom: 1px solid var(--line);
        }
        .settingsHead h2 { margin: 0; font-size: 15px; font-weight: 700; }
        .settingsBody { overflow-y: auto; padding: 16px 20px 20px; display: grid; gap: 20px; align-content: start; }
        .section { display: grid; gap: 8px; }
        .sectionTitle { margin: 0 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; color: var(--muted); }
        .card { display: grid; gap: 16px; padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; }
        .settingGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .customApiFields { display: grid; gap: 16px; padding-top: 16px; border-top: 1px dashed var(--line-strong); }
        .settingField { display: grid; gap: 6px; align-content: start; min-width: 0; }
        .settingField > label, .promptPreviewActions label { font-size: 13px; font-weight: 600; }
        .settingHint { font-size: 12px; line-height: 1.45; color: var(--muted); font-weight: 400; }
        input[type="number"], input[type="text"], input[type="password"], select, .settingField textarea {
          width: 100%; min-height: 38px; padding: 8px 12px; font: inherit; font-size: 14px; color: var(--ink);
          background: var(--bg); border: 1px solid var(--line); border-radius: 10px; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .settingField textarea { min-height: 96px; resize: vertical; line-height: 1.5; }
        input:focus, select:focus, .settingField textarea:focus { outline: 0; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }

        .toggleField { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; cursor: pointer; }
        .toggleField > span { display: grid; gap: 3px; font-size: 13px; font-weight: 600; }
        .toggleField input {
          appearance: none; -webkit-appearance: none; flex: none; position: relative; width: 40px; height: 24px; margin: 0;
          border-radius: 999px; background: var(--line-strong); cursor: pointer; transition: background 0.2s;
        }
        .toggleField input::after {
          content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); transition: transform 0.2s;
        }
        .toggleField input:checked { background: var(--accent); }
        .toggleField input:checked::after { transform: translateX(16px); }

        .promptPreviewActions { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        #promptPreviewOutput { min-height: 220px; font-family: var(--mono); font-size: 12px; white-space: pre; resize: vertical; }

        .btn {
          min-height: 36px; padding: 0 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
          background: var(--surface); border: 1px solid var(--line-strong); transition: background 0.15s, border-color 0.15s;
        }
        .btn:hover:not(:disabled) { background: var(--surface-2); }
        .btn.sm { min-height: 30px; padding: 0 12px; font-size: 12px; }
        .btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
        .btn.primary:hover:not(:disabled) { background: var(--accent-hover); }
        .settingsActions {
          display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px;
          background: var(--surface); border-top: 1px solid var(--line);
        }

        /* ---------- Mobile ---------- */
        @media (max-width: 760px) {
          .app { padding: 0; }
          .dialog { width: 100%; height: 100%; border-radius: 0; border: 0; }
          .topbar { padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
          .subtitle { display: none; }
          .msg { max-width: 94%; }
          .composer { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }
          .composerHint { display: none; }
          .settingsPanel { padding: 0; align-items: end; }
          .settingsBox { width: 100%; max-height: 92%; border-radius: 18px 18px 0 0; }
          .settingGrid { grid-template-columns: 1fr; }
        }
      </style>

      <div class="app">
        <div class="dialog">
          <header class="topbar">
            <div class="brand">
              <div class="brandIcon">
                <svg class="ic" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 11h6M9 14h3"/></svg>
              </div>
              <div>
                <h1>Side Assistant</h1>
                <div class="subtitle">본 채팅을 건드리지 않고 따로 물어보기</div>
              </div>
            </div>
            <div class="headerActions">
              <button class="iconBtn" id="refreshBtn" title="컨텍스트 새로고침" aria-label="컨텍스트 새로고침">
                <svg class="ic" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>
              </button>
              <button class="iconBtn" id="clearBtn" title="대화 초기화" aria-label="대화 초기화">
                <svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>
              </button>
              <button class="iconBtn" id="settingsBtn" title="설정" aria-label="설정">
                <svg class="ic" viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>
              </button>
              <span class="divider"></span>
              <button class="iconBtn" id="closeBtn" title="닫기" aria-label="닫기">
                <svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
          </header>

          <section class="contextStrip">
            <div class="summaryTitle">참조</div>
            <div class="summary" id="contextSummary"><span class="chip muted">아직 컨텍스트를 불러오지 않았습니다.</span></div>
          </section>

          <main>
            <div id="messages"></div>
            <div id="status" class="status" role="status" aria-live="polite" hidden></div>
            <section class="composer">
              <div class="composerBox">
                <textarea id="question" rows="1" placeholder="본 채팅에 관해 질문하기..."></textarea>
                <button id="askBtn" class="sendBtn" title="묻기" aria-label="묻기">
                  <svg class="ic" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </button>
              </div>
              <div class="composerHint">Ctrl / ⌘ + Enter로 전송</div>
            </section>
          </main>

          <section class="settingsPanel" id="settingsPanel" hidden>
            <div class="settingsBox" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
              <div class="settingsHead">
                <h2 id="settingsTitle">설정</h2>
                <button class="iconBtn" id="settingsCloseBtn" title="설정 닫기" aria-label="설정 닫기">
                  <svg class="ic" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>

              <div class="settingsBody">
                <div class="section">
                  <h3 class="sectionTitle">컨텍스트</h3>
                  <div class="card">
                    <div class="settingGrid">
                      <div class="settingField">
                        <label for="settingContextMessages">최근 채팅 수</label>
                        <input id="settingContextMessages" type="number" min="4" max="80" step="1" />
                        <div class="settingHint">모델에 함께 보낼 본 채팅 메시지 수입니다.</div>
                      </div>
                      <div class="settingField">
                        <label for="settingChatRoleFilter">최근 채팅 역할</label>
                        <select id="settingChatRoleFilter">
                          <option value="all">유저+캐릭터</option>
                          <option value="user">유저만</option>
                          <option value="assistant">캐릭터만</option>
                        </select>
                        <div class="settingHint">보낼 최근 채팅의 발화자 역할을 고릅니다.</div>
                      </div>
                    </div>
                    <label class="toggleField">
                      <span>
                        로어북 컨텍스트 포함
                        <span class="settingHint">끄면 캐릭터/페르소나/선택한 최근 채팅만 보냅니다.</span>
                      </span>
                      <input id="settingIncludeLore" type="checkbox" checked />
                    </label>
                    <label class="toggleField">
                      <span>
                        CBS 파싱
                        <span class="settingHint">현재 캐릭터와 채팅 기준으로 캐릭터 설명·페르소나·로어북의 CBS를 처리합니다. 채팅 변수 쓰기와 정규식 스크립트는 실행하지 않습니다.</span>
                      </span>
                      <input id="settingParseCbs" type="checkbox" checked />
                    </label>
                  </div>
                </div>

                <div class="section">
                  <h3 class="sectionTitle">모델</h3>
                  <div class="card">
                    <div class="settingField">
                      <label for="settingModelMode">모델 호출 모드</label>
                      <select id="settingModelMode">
                        <option value="otherAx">보조 모델</option>
                        <option value="custom">커스텀 API</option>
                      </select>
                      <div class="settingHint">Risu에 설정된 보조 모델 또는 커스텀 API 호출을 사용합니다.</div>
                    </div>
                    <div class="customApiFields" id="customApiFields" hidden>
                      <div class="settingGrid">
                        <div class="settingField">
                          <label for="settingCustomEndpoint">엔드포인트</label>
                          <input id="settingCustomEndpoint" type="text" placeholder="https://api.example.com/v1/chat/completions" />
                          <div class="settingHint">OpenAI 호환 chat/completions 형식으로 POST합니다.</div>
                        </div>
                        <div class="settingField">
                          <label for="settingCustomModel">모델명</label>
                          <input id="settingCustomModel" type="text" placeholder="model-name" />
                        </div>
                        <div class="settingField">
                          <label for="settingCustomKey">API 키</label>
                          <input id="settingCustomKey" type="password" autocomplete="off" />
                          <div class="settingHint">입력하면 Authorization: Bearer 형식으로 보냅니다.</div>
                        </div>
                        <div class="settingField">
                          <label for="settingCustomParams">추가 파라미터 JSON</label>
                          <textarea id="settingCustomParams" placeholder='{"temperature":0.7,"max_tokens":800}'></textarea>
                          <div class="settingHint">model/messages와 함께 요청 body에 병합됩니다.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <h3 class="sectionTitle">프롬프트</h3>
                  <div class="card">
                    <div class="settingField">
                      <label for="settingAiPersona">AI 페르소나</label>
                      <textarea id="settingAiPersona"></textarea>
                      <div class="settingHint">AI가 어떤 태도와 말투로 도와줄지 정합니다.</div>
                    </div>
                    <div class="settingField">
                      <label for="settingSystemPrompt">추가 지시문</label>
                      <textarea id="settingSystemPrompt"></textarea>
                      <div class="settingHint">기본 역할과 AI 페르소나 뒤에 추가로 붙습니다.</div>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <h3 class="sectionTitle">미리보기</h3>
                  <div class="card">
                    <div class="settingField">
                      <div class="promptPreviewActions">
                        <label for="promptPreviewOutput">모델 프롬프트</label>
                        <button id="promptPreviewBtn" class="btn sm" type="button">미리보기</button>
                      </div>
                      <textarea id="promptPreviewOutput" readonly hidden></textarea>
                      <div class="settingHint">현재 설정창 값과 최근 Side Assistant 대화를 기준으로 실제 전송 메시지를 보여줍니다.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="settingsActions">
                <button id="settingsCancelBtn" class="btn">취소</button>
                <button id="settingsSaveBtn" class="btn primary">저장</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    scheduleTransparentFix();

    const question = document.getElementById("question");
    const autoGrow = () => {
      question.style.height = "auto";
      question.style.height = `${Math.min(question.scrollHeight, 160)}px`;
    };

    document.querySelector(".app").addEventListener("click", (event) => {
      if (event.target.classList.contains("app")) api.hideContainer();
    });
    document.querySelector(".dialog").addEventListener("click", (event) => event.stopPropagation());
    document.getElementById("settingsPanel").addEventListener("click", (event) => {
      if (event.target.id === "settingsPanel") setSettingsOpen(false);
    });
    document.getElementById("closeBtn").addEventListener("click", () => api.hideContainer());
    document.getElementById("refreshBtn").addEventListener("click", refreshContext);
    document.getElementById("clearBtn").addEventListener("click", clearThread);
    document.getElementById("settingsBtn").addEventListener("click", openSettings);
    document.getElementById("settingModelMode").addEventListener("change", syncCustomApiFields);
    document.getElementById("settingsCloseBtn").addEventListener("click", () => setSettingsOpen(false));
    document.getElementById("settingsCancelBtn").addEventListener("click", () => setSettingsOpen(false));
    document.getElementById("settingsSaveBtn").addEventListener("click", saveSettings);
    document.getElementById("promptPreviewBtn").addEventListener("click", previewPrompt);
    document.getElementById("askBtn").addEventListener("click", handleAsk);
    document.getElementById("messages").addEventListener("click", (event) => {
      const button = event.target.closest("[data-suggest]");
      if (!button) return;
      question.value = button.dataset.suggest;
      autoGrow();
      question.focus();
    });
    question.addEventListener("input", autoGrow);
    question.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleAsk();
      }
    });
    // Assigning (not adding) so reopening the UI never stacks duplicate handlers.
    document.onkeydown = (event) => {
      if (event.key !== "Escape") return;
      if (state.settingsOpen) setSettingsOpen(false);
      else api.hideContainer();
    };

    renderMessages();
    renderContextSummary();
  }

  async function openUI() {
    try {
      const granted = await api.requestPluginPermission("db");
      if (!granted) {
        console.log("Database permission was denied.");
        return;
      }

      await loadThread();
      renderUI();
      await api.showContainer("fullscreen");
      scheduleTransparentFix();
      scheduleScrollMessagesToBottom();
      await refreshContext();
      scheduleScrollMessagesToBottom();
      document.getElementById("question").focus();
    } catch (error) {
      renderStatus(error.message, "error");
    }
  }

  await api.registerButton(
    {
      name: "Side Assistant",
      icon: "💻️",
      iconType: "html",
      location: "chat",
      id: "side-context-assistant-open",
    },
    openUI
  );

  console.log("Side Assistant 플러그인이 로드되었습니다.");
})();