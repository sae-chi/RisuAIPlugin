//@name chat_find_replace
//@display-name 채팅 찾기/바꾸기
//@api 3.0
//@version 1.0.0

(async () => {
  const api = globalThis.Risuai || globalThis.risuai;
  if (!api) {
    console.log("Risuai API was not found.");
    return;
  }

  const state = {
    chat: null,
    charIndex: -1,
    chatIndex: -1,
    messagePath: [],
    messages: [],
    matches: [],
    currentMatch: 0,
    theme: "light",
    scope: "current",
    showAllPreview: false,
    fullTextMessages: new Set(),
    editingKey: null,
    editingMatch: null,
    globalStats: { characterCount: 0, chatCount: 0 },
  };

  const foldLimit = 900;
  const searchDebounceMs = 300;
  const maxRenderedSearchResults = 80;
  let searchTimer = null;
  const textKeys = ["data", "content", "message", "text", "value"];
  const arrayKeys = ["message", "messages", "chat", "chats", "data", "history", "items"];

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function getByPath(root, path) {
    return path.reduce((target, key) => (target == null ? undefined : target[key]), root);
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
    if (Array.isArray(root)) return { path: [], messages: root };

    const queue = [{ value: root, path: [], depth: 0 }];
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
        const path = [...item.path, key];
        const score = scoreMessageArray(child);

        if (score > 0 && (!best || score > best.score)) {
          best = { path, messages: child, score };
        }

        if (child && typeof child === "object" && !Array.isArray(child)) {
          queue.push({ value: child, path, depth: item.depth + 1 });
        }
      }
    }

    return best ? { path: best.path, messages: best.messages } : null;
  }

  function getMessageTextRef(message) {
    if (typeof message === "string") return { key: null, value: message };
    if (!message || typeof message !== "object") return null;

    for (const key of textKeys) {
      if (typeof message[key] === "string") return { key, value: message[key] };
    }

    return null;
  }

  function getRole(message) {
    if (!message || typeof message !== "object") return "unknown";
    const raw = String(message.role || message.type || "").toLowerCase();
    if (raw.includes("user")) return "user";
    if (raw.includes("char") || raw.includes("assistant") || raw.includes("bot")) return "assistant";
    if (raw.includes("system")) return "system";
    return "unknown";
  }

  function roleLabel(role) {
    if (role === "user") return "사용자";
    if (role === "assistant") return "캐릭터";
    return "";
  }

  function buildMatcher(findText, options) {
    if (!findText) return null;

    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = options.caseSensitive ? "g" : "gi";
    return new RegExp(escaped, flags);
  }

  function roleAllowed(role, options) {
    if (role === "user") return options.includeUser;
    if (role === "assistant") return options.includeAssistant;
    return false;
  }

  function collectMatches(findText, options) {
    const matcher = buildMatcher(findText, options);
    if (!matcher) return [];
    const range = readRange();
    if (range.error) throw new Error(range.error);
    if (range.empty) return [];

    const matches = [];
    state.messages.slice(range.startIndex, range.endIndex).forEach((message, offset) => {
      const messageIndex = range.startIndex + offset;
      const role = getRole(message);
      if (!roleAllowed(role, options)) return;

      const textRef = getMessageTextRef(message);
      if (!textRef) return;

      let match;
      const ranges = [];
      matcher.lastIndex = 0;
      while ((match = matcher.exec(textRef.value)) !== null) {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
        });

        if (match[0].length === 0) matcher.lastIndex += 1;
      }

      if (ranges.length) {
        const textRef = getMessageTextRef(message);
        matches.push({
          messageIndex,
          role,
          ranges,
          count: ranges.length,
          text: textRef ? textRef.value : "",
          label: `#${messageIndex + 1} - ${roleLabel(role)}`,
          fullKey: `current:${messageIndex}`,
        });
      }
    });

    return matches;
  }

  function collectMatchesFromMessages(messages, findText, options, meta) {
    const matcher = buildMatcher(findText, options);
    if (!matcher) return [];

    const matches = [];
    messages.forEach((message, messageIndex) => {
      const role = getRole(message);
      if (!roleAllowed(role, options)) return;

      const textRef = getMessageTextRef(message);
      if (!textRef) return;

      let match;
      const ranges = [];
      matcher.lastIndex = 0;
      while ((match = matcher.exec(textRef.value)) !== null) {
        ranges.push({
          start: match.index,
          end: match.index + match[0].length,
        });

        if (match[0].length === 0) matcher.lastIndex += 1;
      }

      if (ranges.length) {
        matches.push({
          ...meta,
          messageIndex,
          role,
          ranges,
          count: ranges.length,
          text: textRef.value,
          label: `${meta.characterName || "이름 없음"} · 채팅 #${(meta.chatIndex ?? 0) + 1} · 메시지 #${messageIndex + 1} - ${roleLabel(role)}`,
          fullKey: `global:${meta.characterIndex}:${meta.chatIndex}:${messageIndex}`,
        });
      }
    });

    return matches;
  }

  function getCharacterName(character, index) {
    return (
      character?.name ||
      character?.charName ||
      character?.nickname ||
      character?.data?.name ||
      `캐릭터 #${index + 1}`
    );
  }

  function findChatList(character) {
    if (!character || typeof character !== "object") return [];

    const preferredKeys = ["chats", "chat", "chatList", "chatHistory", "histories"];
    for (const key of preferredKeys) {
      const value = character[key];
      if (Array.isArray(value) && value.some((item) => findMessageArray(item))) {
        return value;
      }
    }

    const queue = [{ value: character, depth: 0 }];
    while (queue.length) {
      const item = queue.shift();
      if (!item.value || typeof item.value !== "object" || item.depth > 3) continue;

      for (const value of Object.values(item.value)) {
        if (Array.isArray(value) && value.some((entry) => findMessageArray(entry))) {
          return value;
        }
        if (value && typeof value === "object" && !Array.isArray(value)) {
          queue.push({ value, depth: item.depth + 1 });
        }
      }
    }

    return [];
  }

  async function loadChatsForCharacter(character, characterIndex) {
    const fromDatabase = findChatList(character);
    if (fromDatabase.length) return fromDatabase;

    const chats = [];
    let misses = 0;
    for (let chatIndex = 0; chatIndex < 100 && misses < 5; chatIndex += 1) {
      let chat = null;
      try {
        chat = await api.getChatFromIndex(characterIndex, chatIndex);
      } catch {
        chat = null;
      }
      if (chat && findMessageArray(chat)) {
        chats.push(chat);
        misses = 0;
      } else {
        misses += 1;
      }
    }

    return chats;
  }

  async function collectGlobalMatches(findText, options) {
    const db = await api.getDatabase(["characters"]);
    const characters = Array.isArray(db?.characters) ? db.characters : [];
    const matches = [];
    let searchedChats = 0;

    for (let characterIndex = 0; characterIndex < characters.length; characterIndex += 1) {
      const character = characters[characterIndex];
      const characterName = getCharacterName(character, characterIndex);
      const chats = await loadChatsForCharacter(character, characterIndex);

      for (let chatIndex = 0; chatIndex < chats.length; chatIndex += 1) {
        const chat = chats[chatIndex];
        const found = findMessageArray(chat);
        if (!found) continue;

        searchedChats += 1;
        matches.push(
          ...collectMatchesFromMessages(found.messages, findText, options, {
            characterIndex,
            characterName,
            chatIndex,
          })
        );
      }
    }

    state.globalStats = {
      characterCount: characters.length,
      chatCount: searchedChats,
    };

    return matches;
  }

  function highlightRanges(text, ranges) {
    let html = "";
    let cursor = 0;

    for (const range of ranges) {
      html += escapeHtml(text.slice(cursor, range.start));
      html += `<mark>${escapeHtml(text.slice(range.start, range.end))}</mark>`;
      cursor = range.end;
    }

    html += escapeHtml(text.slice(cursor));
    return html;
  }

  function buildSearchExcerpt(text, ranges, contextSize = 80) {
    if (!ranges.length) return escapeHtml(text);

    const windows = ranges
      .map((range) => ({
        start: Math.max(0, range.start - contextSize),
        end: Math.min(text.length, range.end + contextSize),
      }))
      .sort((a, b) => a.start - b.start);

    const merged = [];
    for (const window of windows) {
      const prev = merged[merged.length - 1];
      if (prev && window.start <= prev.end + 12) {
        prev.end = Math.max(prev.end, window.end);
      } else {
        merged.push({ ...window });
      }
    }

    return merged
      .map((window) => {
        const visibleRanges = ranges
          .filter((range) => range.end > window.start && range.start < window.end)
          .map((range) => ({
            start: Math.max(range.start, window.start) - window.start,
            end: Math.min(range.end, window.end) - window.start,
          }));
        const prefix = window.start > 0 ? "... " : "";
        const suffix = window.end < text.length ? " ..." : "";
        return prefix + highlightRanges(text.slice(window.start, window.end), visibleRanges) + suffix;
      })
      .join("\n\n");
  }

  function renderSnippet(html, plainText) {
    const shouldFold = String(plainText).length > foldLimit;
    const foldedClass = shouldFold ? " folded" : "";
    const button = shouldFold ? '<button class="foldToggle" type="button">더 보기</button>' : "";
    return `<span class="snippet${foldedClass}">${html}</span>${button}`;
  }

  function bindFoldToggles(root) {
    root.querySelectorAll(".foldToggle").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const snippet = button.previousElementSibling;
        const expanded = snippet.classList.toggle("expanded");
        snippet.classList.toggle("folded", !expanded);
        button.textContent = expanded ? "접기" : "더 보기";
      });
    });
  }

  function openEditModal(match) {
    state.editingMatch = match;
    state.editingKey = match.fullKey || `${match.messageIndex}`;

    const modal = document.getElementById("editModal");
    const title = document.getElementById("editModalTitle");
    const area = document.getElementById("editModalText");

    title.textContent = match.label || `#${match.messageIndex + 1} - ${roleLabel(match.role)}`;
    area.value = match.text || "";
    modal.classList.add("open");
    area.focus();
  }

  function closeEditModal() {
    state.editingMatch = null;
    state.editingKey = null;
    document.getElementById("editModal").classList.remove("open");
  }

  async function saveEditModal() {
    const match = state.editingMatch;
    if (!match) {
      renderStatus("수정할 메시지를 찾지 못했습니다.", "error");
      return;
    }

    try {
      await saveEditedMatch(match, document.getElementById("editModalText").value);
      state.fullTextMessages.delete(state.editingKey);
      closeEditModal();
      if (state.scope === "current") await refreshChat();
      await runSearch();
      renderStatus("메시지를 직접 수정했습니다.", "success");
    } catch (error) {
      renderStatus(`수정 실패: ${error.message}`, "error");
    }
  }

  function scrollResults(toBottom) {
    const results = document.querySelector(".results");
    const page = document.scrollingElement || document.documentElement;
    const target =
      results && results.scrollHeight > results.clientHeight + 2
        ? results
        : page;

    target.scrollTo({
      top: toBottom ? target.scrollHeight : 0,
      behavior: "smooth",
    });
  }

  function countOccurrences(text, findText, options) {
    const matcher = buildMatcher(findText, options);
    if (!matcher) return 0;

    let count = 0;
    let match;
    matcher.lastIndex = 0;
    while ((match = matcher.exec(text)) !== null) {
      count += 1;
      if (match[0].length === 0) matcher.lastIndex += 1;
    }

    return count;
  }

  async function refreshChat() {
    state.charIndex = await api.getCurrentCharacterIndex();
    state.chatIndex = await api.getCurrentChatIndex();
    state.chat = await api.getChatFromIndex(state.charIndex, state.chatIndex);

    const found = findMessageArray(state.chat);
    if (!found) throw new Error("현재 채팅에서 메시지 목록을 찾지 못했습니다.");

    state.messagePath = found.path;
    state.messages = found.messages;
    return state.messages.length;
  }

  async function saveChat(nextChat, summary) {
    await api.pluginStorage.setItem("lastBackup", {
      savedAt: new Date().toISOString(),
      charIndex: state.charIndex,
      chatIndex: state.chatIndex,
      chat: state.chat,
      summary,
    });

    await api.setChatToIndex(state.charIndex, state.chatIndex, nextChat);
    state.chat = nextChat;
    state.messages = getByPath(nextChat, state.messagePath);
  }

  async function saveEditedMatch(match, nextText) {
    if (state.scope === "global") {
      const chat = await api.getChatFromIndex(match.characterIndex, match.chatIndex);
      const found = findMessageArray(chat);
      if (!found) throw new Error("수정할 채팅 메시지를 찾지 못했습니다.");

      const nextChat = clone(chat);
      const nextMessages = getByPath(nextChat, found.path);
      const target = nextMessages[match.messageIndex];
      const textRef = getMessageTextRef(target);
      if (!textRef) throw new Error("수정할 메시지 텍스트를 찾지 못했습니다.");

      if (textRef.key === null) nextMessages[match.messageIndex] = nextText;
      else target[textRef.key] = nextText;

      await api.setChatToIndex(match.characterIndex, match.chatIndex, nextChat);
      return;
    }

    const nextChat = clone(state.chat);
    const nextMessages = getByPath(nextChat, state.messagePath);
    const target = nextMessages[match.messageIndex];
    const textRef = getMessageTextRef(target);
    if (!textRef) throw new Error("수정할 메시지 텍스트를 찾지 못했습니다.");

    if (textRef.key === null) nextMessages[match.messageIndex] = nextText;
    else target[textRef.key] = nextText;

    await saveChat(nextChat, "direct edit");
  }

  function readOptions() {
    return {
      caseSensitive: document.getElementById("caseSensitive").checked,
      includeUser: document.getElementById("includeUser").checked,
      includeAssistant: document.getElementById("includeAssistant").checked,
    };
  }

  function readRange() {
    const startRaw = document.getElementById("rangeStart").value.trim();
    const endRaw = document.getElementById("rangeEnd").value.trim();

    if (!startRaw && !endRaw) {
      return {
        active: false,
        start: 1,
        end: state.messages.length,
        startIndex: 0,
        endIndex: state.messages.length,
      };
    }

    let start = Number.parseInt(startRaw || "1", 10);
    let end = Number.parseInt(endRaw || startRaw, 10);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return { active: true, error: "범위는 숫자로 입력하세요." };
    }

    if (start > end) [start, end] = [end, start];

    const clampedStart = Math.max(1, start);
    const clampedEnd = Math.min(state.messages.length, end);

    if (!state.messages.length || clampedStart > state.messages.length || clampedEnd < 1) {
      return {
        active: true,
        empty: true,
        start: clampedStart,
        end: clampedEnd,
        startIndex: 0,
        endIndex: 0,
      };
    }

    return {
      active: true,
      start: clampedStart,
      end: clampedEnd,
      startIndex: clampedStart - 1,
      endIndex: clampedEnd,
    };
  }

  function renderStatus(message, kind = "info") {
    const status = document.getElementById("status");
    status.className = `status ${kind}`;
    status.textContent = message;
  }

  function applyTheme() {
    document.body.dataset.theme = state.theme;
    document.body.dataset.scope = state.scope;
    const themeBtn = document.getElementById("themeBtn");
    if (themeBtn) {
      themeBtn.textContent = state.theme === "dark" ? "☀️" : "🌙";
      themeBtn.title = state.theme === "dark" ? "라이트 모드로 변경" : "다크 모드로 변경";
    }
  }

  async function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
    await api.pluginStorage.setItem("theme", state.theme);
  }

  function renderMatches() {
    const list = document.getElementById("matchList");
    const count = document.getElementById("matchCount");
    const title = document.getElementById("resultTitle");
    const findText = document.getElementById("findText").value;

    if (state.scope === "global" && !findText) {
      title.textContent = "전체 채팅 검색";
      count.textContent = "";
      list.innerHTML = '<div class="empty">찾을 단어를 입력하면 모든 캐릭터의 모든 채팅에서 검색합니다.</div>';
      return;
    }

    if (!findText) {
      const range = readRange();
      title.textContent = range.active ? "범위 보기" : state.showAllPreview ? "전체 채팅" : "최근 채팅";

      if (range.error) {
        count.textContent = `전체 ${state.messages.length}개`;
        list.innerHTML = `<div class="empty">${escapeHtml(range.error)}</div>`;
        return;
      }

      if (!state.messages.length) {
        count.textContent = "0개 메시지";
        list.innerHTML = '<div class="empty">현재 채팅에 메시지가 없습니다.</div>';
        return;
      }

      if (range.empty) {
        count.textContent = `전체 ${state.messages.length}개`;
        list.innerHTML = '<div class="empty">해당 범위에 메시지가 없습니다.</div>';
        return;
      }

      const options = readOptions();
      const allRoleMessages = state.messages
        .map((message, messageIndex) => ({ message, messageIndex, role: getRole(message) }))
        .filter((item) => roleAllowed(item.role, options));

      const rangeMessages = range.active
        ? state.messages
            .slice(range.startIndex, range.endIndex)
            .map((message, messageIndex) => ({ message, messageIndex, role: getRole(message) }))
            .map((item) => ({ ...item, messageIndex: item.messageIndex + range.startIndex }))
            .filter((item) => roleAllowed(item.role, options))
        : state.showAllPreview
          ? allRoleMessages
          : allRoleMessages.slice(-20);

      count.textContent = range.active
        ? `${range.start}-${range.end}번 / 전체 ${state.messages.length}개`
        : state.showAllPreview
          ? `전체 ${rangeMessages.length}개 / 원본 ${state.messages.length}개`
          : `최근 ${rangeMessages.length}개 / 선택 역할 ${allRoleMessages.length}개`;
      if (!rangeMessages.length) {
        list.innerHTML = '<div class="empty">해당 범위에 표시할 사용자/캐릭터 메시지가 없습니다.</div>';
        return;
      }

      list.innerHTML = rangeMessages
        .map(({ message, messageIndex, role }) => {
          const textRef = getMessageTextRef(message);
          const text = textRef ? textRef.value : "";
          return `
            <div class="match" data-chat-message="${messageIndex}">
              <span class="meta">#${messageIndex + 1} - ${roleLabel(role)}</span>
              ${renderSnippet(escapeHtml(text || "(empty)"), text || "(empty)")}
            </div>
          `;
        })
        .join("");
      bindFoldToggles(list);
      return;
    }

    title.textContent = "검색 결과";
    const totalHits = state.matches.reduce((sum, match) => sum + match.count, 0);
    count.textContent =
      state.scope === "global"
        ? `${state.matches.length}개 메시지 / ${totalHits}개 일치 · ${state.globalStats.characterCount}개 캐릭터 / ${state.globalStats.chatCount}개 채팅`
        : `${state.matches.length}개 메시지 / ${totalHits}개 일치`;

    if (!state.matches.length) {
      list.innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
      return;
    }

    const visibleMatches = state.matches.slice(0, maxRenderedSearchResults);
    list.innerHTML = state.matches
      .slice(0, maxRenderedSearchResults)
      .map((match, visibleIndex) => {
        const text = match.text ?? "";
        const active = visibleIndex === state.currentMatch ? " active" : "";
        const countLabel = match.count > 1 ? ` · ${match.count}개 일치` : "";
        const fullKey = match.fullKey || `${match.messageIndex}`;
        const fullTextOpen = state.fullTextMessages.has(fullKey);
        const resultHtml = fullTextOpen ? highlightRanges(text, match.ranges) : buildSearchExcerpt(text, match.ranges);
        const resultText = fullTextOpen ? "" : resultHtml.replace(/<[^>]+>/g, "");
        const fullTextLabel = fullTextOpen ? "부분 보기" : "전문 보기";

        return `
          <div class="match${active}" data-match="${visibleIndex}">
            <span class="meta">${escapeHtml(match.label || `#${match.messageIndex + 1} - ${roleLabel(match.role)}`)}${countLabel}</span>
            ${renderSnippet(resultHtml, resultText)}
            <button class="fullTextToggle" type="button" data-full-match="${escapeHtml(fullKey)}">${fullTextLabel}</button>
            <button class="editToggle" type="button" data-edit-match="${escapeHtml(fullKey)}">직접 수정</button>
          </div>
        `;
      })
      .join("");

    if (state.matches.length > visibleMatches.length) {
      list.innerHTML += `<div class="empty">모바일 성능을 위해 ${visibleMatches.length}개까지만 먼저 표시했습니다. 범위를 좁히면 나머지도 더 빨리 찾을 수 있습니다.</div>`;
    }

    list.querySelectorAll("[data-match]").forEach((button) => {
      button.addEventListener("click", () => {
        state.currentMatch = Number(button.dataset.match);
        renderMatches();
      });
    });

    list.querySelectorAll(".fullTextToggle").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const messageKey = button.dataset.fullMatch;
        if (state.fullTextMessages.has(messageKey)) {
          state.fullTextMessages.delete(messageKey);
        } else {
          state.fullTextMessages.add(messageKey);
        }
        renderMatches();
      });
    });

    list.querySelectorAll(".editToggle").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const editKey = button.dataset.editMatch;
        const match = state.matches.find((item) => (item.fullKey || `${item.messageIndex}`) === editKey);
        if (!match) {
          renderStatus("수정할 메시지를 찾지 못했습니다.", "error");
          return;
        }
        openEditModal(match);
      });
    });

    bindFoldToggles(list);
  }

  async function runSearch() {
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }

    const findText = document.getElementById("findText").value;
    const options = readOptions();
    if (findText) state.showAllPreview = false;

    if (!findText) {
      state.matches = [];
      renderMatches();
      renderStatus("찾을 단어를 입력하거나 채팅 범위를 입력하세요.");
      return;
    }

    try {
      state.matches = state.scope === "global" ? await collectGlobalMatches(findText, options) : collectMatches(findText, options);
      state.currentMatch = Math.min(state.currentMatch, Math.max(0, state.matches.length - 1));
      renderMatches();
      renderStatus(
        state.scope === "global"
          ? `전체 검색 완료: ${state.globalStats.characterCount}개 캐릭터, ${state.globalStats.chatCount}개 채팅을 확인했습니다.`
          : `현재 채팅의 메시지 ${state.messages.length}개를 검색했습니다.`
      );
    } catch (error) {
      state.matches = [];
      renderMatches();
      renderStatus(`검색 오류: ${error.message}`, "error");
    }
  }

  function scheduleSearch() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTimer = null;
      runSearch();
    }, searchDebounceMs);
  }

  async function replaceCurrent() {
    const replaceText = document.getElementById("replaceText").value;
    const match = state.matches[state.currentMatch];

    if (!match) {
      renderStatus("바꿀 검색 결과가 선택되지 않았습니다.", "error");
      return;
    }

    const nextChat = clone(state.chat);
    const nextMessages = getByPath(nextChat, state.messagePath);
    const nextMessage = nextMessages[match.messageIndex];
    const textRef = getMessageTextRef(nextMessage);

    if (!textRef) {
      renderStatus("선택한 메시지의 텍스트를 읽지 못했습니다.", "error");
      return;
    }

    const firstRange = match.ranges && match.ranges[0];
    if (!firstRange) {
      renderStatus("선택한 메시지에 바꿀 항목이 없습니다.", "error");
      return;
    }

    const nextText = textRef.value.slice(0, firstRange.start) + replaceText + textRef.value.slice(firstRange.end);
    if (textRef.key === null) nextMessages[match.messageIndex] = nextText;
    else nextMessage[textRef.key] = nextText;

    await saveChat(nextChat, "replace current");
    await refreshChat();
    await runSearch();
    renderStatus("선택한 항목 1개를 바꿨습니다.", "success");
  }

  async function replaceAll() {
    const findText = document.getElementById("findText").value;
    const replaceText = document.getElementById("replaceText").value;
    const options = readOptions();

    if (!findText) {
      renderStatus("찾을 단어를 먼저 입력하세요.", "error");
      return;
    }

    const range = readRange();
    if (range.error) {
      renderStatus(range.error, "error");
      return;
    }
    if (range.empty) {
      renderStatus("해당 범위에 바꿀 항목이 없습니다.", "error");
      return;
    }

    const matcher = buildMatcher(findText, options);
    const nextChat = clone(state.chat);
    const nextMessages = getByPath(nextChat, state.messagePath);
    let replacements = 0;
    let changedMessages = 0;

    nextMessages.slice(range.startIndex, range.endIndex).forEach((message, offset) => {
      const messageIndex = range.startIndex + offset;
      const role = getRole(message);
      if (!roleAllowed(role, options)) return;

      const textRef = getMessageTextRef(message);
      if (!textRef) return;

      const foundCount = countOccurrences(textRef.value, findText, options);
      if (!foundCount) return;

      replacements += foundCount;
      changedMessages += 1;
      matcher.lastIndex = 0;

      const nextText = textRef.value.replace(matcher, replaceText);
      if (textRef.key === null) nextMessages[messageIndex] = nextText;
      else message[textRef.key] = nextText;
    });

    if (!replacements) {
      renderStatus("바꿀 항목이 없습니다.", "error");
      return;
    }

    await saveChat(nextChat, `replace all: ${replacements}`);
    await refreshChat();
    await runSearch();
    renderStatus(`${changedMessages}개 메시지에서 ${replacements}개 항목을 바꿨습니다.`, "success");
  }

  async function undoLast() {
    const backup = await api.pluginStorage.getItem("lastBackup");
    if (!backup || !backup.chat) {
      renderStatus("되돌릴 백업이 없습니다.", "error");
      return;
    }

    const sameChat = backup.charIndex === state.charIndex && backup.chatIndex === state.chatIndex;
    if (!sameChat) {
      renderStatus("마지막 백업이 현재 채팅의 백업이 아닙니다.", "error");
      return;
    }

    await api.setChatToIndex(state.charIndex, state.chatIndex, backup.chat);
    await api.pluginStorage.removeItem("lastBackup");
    await refreshChat();
    await runSearch();
    renderStatus("마지막 바꾸기를 되돌렸습니다.", "success");
  }

  function showFullPreview() {
    state.showAllPreview = true;
    state.matches = [];
    document.getElementById("findText").value = "";
    document.getElementById("rangeStart").value = "";
    document.getElementById("rangeEnd").value = "";
    renderMatches();
    renderStatus("전체 채팅을 표시했습니다.");
  }

  function showRecentPreview() {
    state.showAllPreview = false;
    state.matches = [];
    document.getElementById("findText").value = "";
    document.getElementById("rangeStart").value = "";
    document.getElementById("rangeEnd").value = "";
    renderMatches();
    renderStatus("최근 20개 채팅을 표시했습니다.");
  }

  function renderUI() {
    document.body.innerHTML = `
      <style>
        :root {
          color-scheme: light;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; background: #f7f7f4; color: #242424; }
        .app { min-height: 100vh; display: grid; grid-template-rows: auto 1fr; }
        header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: 16px 20px; border-bottom: 1px solid #d7d7d0; background: #ffffff;
        }
        h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0; }
        .headerActions { display: flex; align-items: center; gap: 8px; }
        .themeToggle {
          width: 36px; height: 36px; border: 1px solid #c8c8bf; background: #ffffff;
          color: #242424; border-radius: 6px; font-size: 18px; line-height: 1; cursor: pointer;
        }
        .close {
          width: 36px; height: 36px; border: 1px solid #c8c8bf; background: #ffffff;
          color: #242424; border-radius: 6px; font-size: 18px; cursor: pointer;
        }
        main { display: grid; grid-template-columns: minmax(320px, 420px) 1fr; min-height: 0; }
        .panel { padding: 18px; border-right: 1px solid #d7d7d0; background: #fbfbf8; overflow: auto; }
        .results { padding: 18px; overflow: auto; }
        .scrollWidget {
          position: fixed; right: 18px; bottom: 18px; z-index: 5000;
          display: grid; gap: 8px;
        }
        .scrollWidget button {
          width: 42px; height: 42px; min-height: 42px; border-radius: 8px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12); font-size: 18px;
        }
        label { display: block; margin: 0 0 6px; font-size: 13px; font-weight: 650; }
        input[type="text"] {
          width: 100%; height: 38px; border: 1px solid #bdbdb5; border-radius: 6px;
          padding: 0 10px; background: #ffffff; color: #242424; font-size: 14px;
        }
        .field { margin-bottom: 14px; }
        .rangeField { margin-top: 10px; }
        .rangeInputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .checks { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px; margin: 12px 0 16px; }
        .check { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 500; white-space: nowrap; }
        .actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .actions .wide { grid-column: 1 / -1; }
        .viewActions { display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 14px; }
        body[data-scope="global"] .currentOnly { display: none; }
        button {
          min-height: 36px; border: 1px solid #b9b9b0; border-radius: 6px; background: #ffffff;
          color: #242424; font-weight: 650; cursor: pointer;
        }
        button.primary { border-color: #315f72; background: #315f72; color: #ffffff; }
        button.danger { border-color: #9b5a4d; color: #8d3f33; }
        .status {
          margin-top: 14px; min-height: 34px; padding: 9px 10px; border: 1px solid #d2d2c9;
          border-radius: 6px; background: #ffffff; color: #4a4a45; font-size: 13px; line-height: 1.35;
        }
        .status.error { border-color: #d0a19a; color: #8d3f33; }
        .status.success { border-color: #9ab78d; color: #356a2f; }
        .resultHead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .resultHead h2 { margin: 0; font-size: 15px; }
        #matchCount { color: #5d5d56; font-size: 13px; }
        #matchList { display: grid; gap: 8px; }
        .match {
          width: 100%; min-height: 64px; padding: 10px 12px; text-align: left;
          background: #ffffff; border: 1px solid #d0d0c8; border-radius: 6px;
          cursor: text; user-select: text;
        }
        .match.active { border-color: #315f72; box-shadow: 0 0 0 2px rgba(49, 95, 114, 0.16); }
        .meta { display: block; margin-bottom: 5px; color: #62625b; font-size: 12px; font-weight: 700; }
        .snippet { display: block; overflow-wrap: anywhere; white-space: pre-wrap; font-size: 13px; line-height: 1.45; font-weight: 500; cursor: text; user-select: text; }
        .snippet.folded { max-height: 180px; overflow: hidden; border-bottom: 1px solid rgba(0, 0, 0, 0.08); }
        .snippet.expanded { max-height: none; overflow: visible; border-bottom: 0; }
        .foldToggle {
          margin-top: 8px; min-height: 30px; padding: 0 10px; border-color: #c8c8bf;
          background: #f7f7f4; color: #315f72; font-size: 12px; font-weight: 700;
        }
        .fullTextToggle {
          margin-top: 8px; min-height: 30px; padding: 0 10px; border-color: #c8c8bf;
          background: #ffffff; color: #315f72; font-size: 12px; font-weight: 700;
        }
        .editToggle {
          margin-top: 8px; margin-left: 6px; min-height: 30px; padding: 0 10px; border-color: #c8c8bf;
          background: #ffffff; color: #315f72; font-size: 12px; font-weight: 700;
        }
        .editArea {
          width: 100%; min-height: 220px; resize: vertical; border: 1px solid #bdbdb5; border-radius: 6px;
          padding: 10px; background: #ffffff; color: #242424; font: inherit; line-height: 1.45;
          white-space: pre-wrap;
        }
        .editActions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
        .editModal {
          position: fixed; inset: 0; display: none; place-items: center; padding: 18px;
          background: rgba(20, 20, 18, 0.45); z-index: 9999;
        }
        .editModal.open { display: grid; }
        .editDialog {
          width: min(860px, 100%); max-height: min(760px, 92vh); display: grid; grid-template-rows: auto 1fr auto;
          background: #ffffff; color: #242424; border: 1px solid #d0d0c8; border-radius: 8px; overflow: hidden;
        }
        .editDialogHead { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-bottom: 1px solid #d7d7d0; }
        .editDialogHead h2 { margin: 0; font-size: 15px; line-height: 1.3; }
        .editDialogClose { width: 34px; height: 34px; min-height: 34px; }
        .editDialogBody { padding: 14px; min-height: 0; }
        .editDialogBody .editArea { height: min(520px, 58vh); min-height: 260px; }
        .editDialogActions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 12px 14px; border-top: 1px solid #d7d7d0; }
        mark { padding: 0 2px; border-radius: 3px; background: #fff1a8; color: inherit; }
        .empty {
          padding: 20px; border: 1px dashed #c9c9c0; border-radius: 6px;
          color: #66665f; text-align: center; background: #ffffff;
        }
        @media (max-width: 760px) {
          main { grid-template-columns: 1fr; }
          .panel { border-right: 0; border-bottom: 1px solid #d7d7d0; }
          .scrollWidget { right: 12px; bottom: 12px; }
        }
        body[data-theme="dark"] { color-scheme: dark; background: #1c1d1d; color: #f1f1ed; }
        body[data-theme="dark"] header,
        body[data-theme="dark"] .panel,
        body[data-theme="dark"] .match,
        body[data-theme="dark"] .empty,
        body[data-theme="dark"] .status,
        body[data-theme="dark"] input[type="text"],
        body[data-theme="dark"] button {
          background: #252626; color: #f1f1ed;
        }
        body[data-theme="dark"] header,
        body[data-theme="dark"] .panel,
        body[data-theme="dark"] input[type="text"],
        body[data-theme="dark"] button,
        body[data-theme="dark"] .match,
        body[data-theme="dark"] .empty,
        body[data-theme="dark"] .status {
          border-color: #464743;
        }
        body[data-theme="dark"] button.primary { background: #3f7488 !important; border-color: #3f7488 !important; }
        body[data-theme="dark"] .status.error { border-color: #9b5a4d; color: #ffb4a8; }
        body[data-theme="dark"] .status.success { border-color: #698b5b; color: #bde6ad; }
        body[data-theme="dark"] .snippet.folded { border-bottom-color: rgba(255, 255, 255, 0.12); }
        body[data-theme="dark"] .foldToggle { background: #1f2020; color: #9ed2e5; }
        body[data-theme="dark"] .fullTextToggle { background: #252626; color: #9ed2e5; }
        body[data-theme="dark"] .editToggle { background: #252626; color: #9ed2e5; }
        body[data-theme="dark"] .editArea { background: #1f2020; color: #f1f1ed; border-color: #464743; }
        body[data-theme="dark"] .editDialog { background: #252626; color: #f1f1ed; border-color: #464743; }
        body[data-theme="dark"] .editDialogHead,
        body[data-theme="dark"] .editDialogActions { border-color: #464743; }
        body[data-theme="dark"] .scrollWidget button { box-shadow: 0 6px 18px rgba(0, 0, 0, 0.32); }
        body[data-theme="dark"] .meta,
        body[data-theme="dark"] #matchCount { color: #b7b7ae; }
        body[data-theme="dark"] mark { background: #775f20; color: #ffffff; }
      </style>

      <div class="app">
        <header>
          <h1>채팅 찾기/바꾸기</h1>
          <div class="headerActions">
            <button class="themeToggle" id="themeBtn" title="다크 모드로 변경">🌙</button>
            <button class="close" id="closeBtn" title="닫기">x</button>
          </div>
        </header>
        <main>
          <section class="panel">
            <div class="field">
              <label for="findText">찾을 단어</label>
              <input id="findText" type="text" autocomplete="off" />
            </div>
            <div class="field currentOnly">
              <label for="replaceText">바꿀 단어</label>
              <input id="replaceText" type="text" autocomplete="off" />
            </div>
            <div class="actions currentOnly">
              <button id="replaceCurrentBtn">하나 바꾸기</button>
              <button id="replaceAllBtn">모두 바꾸기</button>
              <button id="undoBtn" class="danger wide">되돌리기</button>
            </div>
            <div class="field rangeField currentOnly">
              <label>채팅 범위 보기</label>
              <div class="rangeInputs">
                <input id="rangeStart" type="text" inputmode="numeric" autocomplete="off" placeholder="시작" />
                <input id="rangeEnd" type="text" inputmode="numeric" autocomplete="off" placeholder="끝" />
              </div>
            </div>
            <div class="viewActions currentOnly">
              <button id="fullPreviewBtn">전체 보기</button>
              <button id="recentPreviewBtn">최근 20개 보기</button>
            </div>
            <div class="checks">
              <label class="check"><input id="caseSensitive" type="checkbox" /> 대소문자 구분</label>
              <label class="check"><input id="includeUser" type="checkbox" checked /> 사용자</label>
              <label class="check"><input id="includeAssistant" type="checkbox" checked /> 캐릭터</label>
            </div>
            <div id="status" class="status">현재 채팅을 불러오는 중입니다.</div>
          </section>
          <section class="results">
            <div class="resultHead">
              <h2 id="resultTitle">현재 채팅</h2>
              <span id="matchCount">0 matches</span>
            </div>
            <div id="matchList"></div>
          </section>
        </main>
        <div class="scrollWidget">
          <button id="scrollTopBtn" title="맨 위로">↑</button>
          <button id="scrollBottomBtn" title="맨 아래로">↓</button>
        </div>
        <div class="editModal" id="editModal">
          <div class="editDialog">
            <div class="editDialogHead">
              <h2 id="editModalTitle">메시지 직접 수정</h2>
              <button class="editDialogClose" id="editModalClose" title="닫기">x</button>
            </div>
            <div class="editDialogBody">
              <textarea class="editArea" id="editModalText"></textarea>
            </div>
            <div class="editDialogActions">
              <button id="editModalSave">저장</button>
              <button id="editModalCancel">취소</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("closeBtn").addEventListener("click", () => api.hideContainer());
    document.getElementById("themeBtn").addEventListener("click", toggleTheme);
    document.getElementById("replaceCurrentBtn").addEventListener("click", replaceCurrent);
    document.getElementById("replaceAllBtn").addEventListener("click", replaceAll);
    document.getElementById("undoBtn").addEventListener("click", undoLast);
    document.getElementById("fullPreviewBtn").addEventListener("click", showFullPreview);
    document.getElementById("recentPreviewBtn").addEventListener("click", showRecentPreview);
    document.getElementById("editModalSave").addEventListener("click", saveEditModal);
    document.getElementById("editModalCancel").addEventListener("click", closeEditModal);
    document.getElementById("editModalClose").addEventListener("click", closeEditModal);
    document.getElementById("editModal").addEventListener("pointerdown", (event) => {
      if (event.target.id === "editModal") closeEditModal();
    });
    document.getElementById("scrollTopBtn").addEventListener("click", () => scrollResults(false));
    document.getElementById("scrollBottomBtn").addEventListener("click", () => scrollResults(true));
    document.getElementById("findText").addEventListener("input", scheduleSearch);
    ["rangeStart", "rangeEnd"].forEach((id) => {
      document.getElementById(id).addEventListener("input", () => {
        state.showAllPreview = false;
        if (document.getElementById("findText").value) scheduleSearch();
        else renderMatches();
      });
    });

    ["caseSensitive", "includeUser", "includeAssistant"].forEach((id) => {
      document.getElementById(id).addEventListener("change", scheduleSearch);
    });
  }

  async function openUI(scope = "current") {
    try {
      const granted = await api.requestPluginPermission("db");
      if (!granted) {
        console.log("Database permission was denied.");
        return;
      }

      state.scope = scope;
      state.matches = [];
      state.currentMatch = 0;
      state.fullTextMessages.clear();
      state.showAllPreview = false;
      const savedTheme = await api.pluginStorage.getItem("theme");
      state.theme = savedTheme === "dark" ? "dark" : "light";
      renderUI();
      applyTheme();
      await api.showContainer("fullscreen");
      const count = state.scope === "current" ? await refreshChat() : 0;
      renderMatches();
      renderStatus(
        state.scope === "current"
          ? `현재 선택된 채팅을 불러왔습니다. 메시지 ${count}개.`
          : "전체 검색 모드입니다. 찾을 단어를 입력하세요."
      );
    } catch (error) {
      renderStatus(error.message, "error");
    }
  }

  await api.registerButton(
    {
      name: "찾기/바꾸기",
      icon: "🔍️",
      iconType: "html",
      location: "chat",
    },
    () => openUI("current")
  );

  await api.registerSetting("전체 채팅 검색", () => openUI("global"), "🔎", "html");

  console.log("Chat Find & Replace loaded.");
})();
