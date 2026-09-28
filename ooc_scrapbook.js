//@name ooc_scrapbook
//@api 3.0
//@version 1.25.0
//@display-name OOC Scrapbook

(async () => {
  'use strict';

  const api = globalThis.Risuai || globalThis.risuai;
  if (!api) {
    console.error('[OOC Scrapbook] RisuAI API를 찾을 수 없습니다.');
    return;
  }

  const PLUGIN_NAME = 'OOC Scrapbook';
  const PLUGIN_VERSION = '1.25.0';
  const DEFAULT_OOC_TEXT = '(ooc: pause the currently ongoing storyline. And write a complete episode based on the instructions given)';
  const STORAGE_KEY = 'ooc-scrapbook:data:v1';   // 예전 통짜 저장 키 (자동 이전 후 정리)
  const NOTES_KEY = 'ooc-scrapbook:notes:v1';    // 메모 본문 (용량의 99.9%)
  const SETTINGS_KEY = 'ooc-scrapbook:settings:v1'; // 설정 (1KB 미만)
  const LOCAL_AI_KEY = 'ooc-scrapbook:local-ai:v1';
  const MENU_ID = 'ooc-scrapbook-flat-chat-menu';
  const HAMBURGER_ID = 'ooc-scrapbook-flat-hamburger-menu';
  const SETTINGS_ID = 'ooc-scrapbook-flat-settings';
  // 버튼 표시 위치: 0=없음, 1=햄버거, 2=채팅(기본), 3=둘 다
  const BUTTON_PLACEMENTS = {
    0: [],
    1: [{ location: 'hamburger', id: HAMBURGER_ID }],
    2: [{ location: 'chat', id: MENU_ID }],
    3: [{ location: 'hamburger', id: HAMBURGER_ID }, { location: 'chat', id: MENU_ID }],
  };
  const BUTTON_PLACEMENT_LABELS = { 0: '없음', 1: '햄버거 메뉴', 2: '채팅 메뉴', 3: '둘 다' };
  const SCHEMA_VERSION = 6;
  const MAX_MEMO_TABS = 4;
  const OOC_TAB = '__ooc';
  const PAGE_SIZES = [15, 30, 45, 0]; // 0 = 무제한
  const BASE_LANGUAGES = [
    { code: 'ko', label: '한국어' },
    { code: 'en', label: 'English' },
  ];
  const LANGUAGE_CODE_HINTS = {
    '일본어': 'ja', '日本語': 'ja', 'japanese': 'ja',
    '중국어': 'zh', '中文': 'zh', 'chinese': 'zh',
    '스페인어': 'es', 'spanish': 'es',
    '프랑스어': 'fr', 'french': 'fr',
    '독일어': 'de', 'german': 'de',
    '러시아어': 'ru', 'russian': 'ru',
  };
  const LANG_PROMPT_NAMES = {
    ko: 'Korean', en: 'English', ja: 'Japanese', zh: 'Chinese',
    es: 'Spanish', fr: 'French', de: 'German', ru: 'Russian',
  };

  const DEFAULT_TRANSLATION_PROMPT = [
    'Translate the following content from {{source_language}} to {{target_language}}.',
    'Preserve the original meaning, tone, paragraph structure, and Markdown.',
    'Return only the translated text without commentary or a preface.',
    '',
    '{{source}}',
  ].join('\n');

  const state = {
    data: createDefaultData(),
    localAI: { apiKey: '', bodyJson: '{}' },
    deviceStorage: null,
    screen: 'list',
    selectedId: null,
    page: 1,
    tagFilter: '',
    sortMode: 'recent',
    activeMemoTabId: null,
    activeLang: 'ko',
    search: '',
    draft: null,
    renamingMemoTabId: null,
    renamingMemoTabOriginalName: null,
    translating: '',
    sending: false,
    searchTimer: null,
    defaultOocTimer: null,
    langChipTimer: null,
    badgeTimers: {},
    tagSuggestIndex: -1,
    deleteModalOpen: false,
    customCopyOpen: false,
    pressTarget: null,
    listScroll: 0,
    restoreListScroll: false,
    importCandidate: null,
    eventsBound: false,
    toastTimer: null,
    menuParts: [],
    settingsPart: null,
    savedNotesJson: null,
    savedSettingsJson: null,
    loadFailed: false,
  };

  function createDefaultData() {
    return {
      schema: SCHEMA_VERSION,
      notes: [],
      settings: {
        theme: 'light',
        provider: 'risu',
        viewMode: 'grid',
        pageSize: 15,
        languages: BASE_LANGUAGES.map((lang) => ({ ...lang })),
        groupTags: [],
        knownTags: [],
        customCopy: { user: '', char: '' },
        buttonPlacement: 2,
        defaultOoc: { enabled: false, text: '' },
        translationPrompt: DEFAULT_TRANSLATION_PROMPT,
        customApi: {
          endpoint: '',
          model: '',
          temperature: 0.2,
          maxTokens: 3000,
        },
      },
    };
  }

  function makeId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `ooc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function languages() {
    return state.data?.settings?.languages || BASE_LANGUAGES;
  }

  function langLabel(code) {
    return languages().find((lang) => lang.code === code)?.label || code;
  }

  function langChipText(lang) {
    if (typeof lang.chip === 'string' && lang.chip.trim()) return lang.chip.trim();
    if (lang.code === 'ko') return 'KO';
    if (lang.code === 'en') return 'EN';
    return lang.label.slice(0, 4);
  }

  function promptLanguageName(code) {
    if (LANG_PROMPT_NAMES[code]) return LANG_PROMPT_NAMES[code];
    const label = langLabel(code);
    const hint = LANGUAGE_CODE_HINTS[label] || LANGUAGE_CODE_HINTS[label.toLowerCase()];
    return hint && LANG_PROMPT_NAMES[hint] ? LANG_PROMPT_NAMES[hint] : label;
  }

  function languageCodeForLabel(label) {
    const norm = String(label || '').trim();
    const hint = LANGUAGE_CODE_HINTS[norm] || LANGUAGE_CODE_HINTS[norm.toLowerCase()];
    if (hint && !languages().some((lang) => lang.code === hint)) return hint;
    // 이름 기반 결정적 코드: 같은 이름 재추가 시 같은 코드가 부여되어 기존 번역이 다시 연결됨
    let h = 2166136261;
    for (const ch of norm.toLowerCase()) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return `lang-${h.toString(36)}`;
  }

  function addDraftTag(value) {
    if (!state.draft) return;
    const clean = String(value || '').trim().replace(/^#+/, '');
    if (!state.draft.tags) state.draft.tags = [];
    if (!clean || state.draft.tags.includes(clean)) {
      renderTagRow();
      return;
    }
    if (state.draft.tags.length >= 20) {
      toast('태그는 최대 20개까지 추가할 수 있습니다.', 'error');
      renderTagRow();
      return;
    }
    state.draft.tags.push(clean);
    state.draft.tags.sort((a, b) => compareTags(a, b));
    state.tagSuggestIndex = -1;
    renderTagRow();
  }

  function removeDraftTag(tag) {
    if (!state.draft?.tags) return;
    state.draft.tags = state.draft.tags.filter((item) => item !== tag);
    state.tagSuggestIndex = -1;
    renderTagRow();
  }

  function tagSuggestions(query) {
    const q = String(query || '').trim().toLocaleLowerCase();
    const existing = new Set(state.draft?.tags || []);
    return allTags().filter((tag) => !existing.has(tag) && (!q || tag.toLocaleLowerCase().includes(q))).slice(0, 8);
  }

  function renderTagRow(focus = true) {
    const host = document.getElementById('tag-editor');
    if (!host || !state.draft) return;
    const tags = state.draft.tags || [];
    host.innerHTML = `${sortedTags(tags).map((tag) => `<span class="tag-chip editable${isGroupTag(tag) ? ' group' : ''}">#${escapeHtml(tag)}<button type="button" data-action="remove-tag" data-tag="${escapeAttribute(tag)}" aria-label="${escapeAttribute(tag)} 태그 삭제">×</button></span>`).join('')}<input id="note-tag-input" placeholder="${tags.length ? '' : '태그 입력 후 Enter'}" maxlength="40" autocomplete="off" aria-label="태그 입력">`;
    const input = document.getElementById('note-tag-input');
    if (input && focus) input.focus();
    renderTagSuggestions();
  }

  function renderTagSuggestions() {
    const box = document.getElementById('tag-suggest');
    const input = document.getElementById('note-tag-input');
    if (!box || !input) return;
    const items = document.activeElement === input ? tagSuggestions(input.value) : [];
    if (!items.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    if (state.tagSuggestIndex >= items.length) state.tagSuggestIndex = items.length - 1;
    box.hidden = false;
    box.innerHTML = items.map((tag, index) => `<button type="button" class="tag-suggest-item${isGroupTag(tag) ? ' group' : ''}${index === state.tagSuggestIndex ? ' active' : ''}" data-action="pick-tag" data-tag="${escapeAttribute(tag)}">#${escapeHtml(tag)}</button>`).join('');
  }

  function allTags() {
    const tags = new Set();
    for (const t of (state.data?.settings?.knownTags || [])) tags.add(t);
    for (const note of state.data.notes) { if (note.deletedAt) continue; for (const tag of note.tags) tags.add(tag); }
    return [...tags].sort((a, b) => compareTags(a, b));
  }

  // 전역 태그 편집 (모든 메모 + 레지스트리 + 그룹 지정에 반영)
  function renameTagGlobal(oldTag, newTag) {
    oldTag = String(oldTag || '').trim();
    newTag = String(newTag || '').trim().replace(/^#+/, '');
    if (!oldTag || !newTag || oldTag === newTag) return false;
    for (const note of state.data.notes) {
      if (!Array.isArray(note.tags)) continue;
      const idx = note.tags.indexOf(oldTag);
      if (idx < 0) continue;
      if (note.tags.includes(newTag)) note.tags.splice(idx, 1);
      else note.tags[idx] = newTag;
      note.tags = note.tags.sort((a, b) => compareTags(a, b));
    }
    const kt = state.data.settings.knownTags || (state.data.settings.knownTags = []);
    const ki = kt.indexOf(oldTag);
    if (ki >= 0) { if (kt.includes(newTag)) kt.splice(ki, 1); else kt[ki] = newTag; }
    const gt = state.data.settings.groupTags;
    const gi = gt.indexOf(oldTag);
    if (gi >= 0) { if (gt.includes(newTag)) gt.splice(gi, 1); else gt[gi] = newTag; }
    return true;
  }
  function deleteTagGlobal(tag) {
    tag = String(tag || '').trim();
    if (!tag) return;
    for (const note of state.data.notes) {
      if (Array.isArray(note.tags)) note.tags = note.tags.filter((t) => t !== tag);
    }
    if (state.data.settings.knownTags) state.data.settings.knownTags = state.data.settings.knownTags.filter((t) => t !== tag);
    state.data.settings.groupTags = state.data.settings.groupTags.filter((t) => t !== tag);
  }

  function groupTagList() {
    return state.data?.settings?.groupTags || [];
  }

  function isGroupTag(tag, groupTags = groupTagList()) {
    return groupTags.includes(tag);
  }

  function compareTags(a, b, groupTags = groupTagList()) {
    const ga = isGroupTag(a, groupTags);
    const gb = isGroupTag(b, groupTags);
    if (ga !== gb) return ga ? -1 : 1;
    return a.localeCompare(b, 'ko');
  }

  function sortedTags(tags) {
    return [...(tags || [])].sort((a, b) => compareTags(a, b));
  }

  function tabText(tab, code) {
    return typeof tab?.texts?.[code] === 'string' ? tab.texts[code] : '';
  }

  function noteHasLang(note, code) {
    return note.tabs.some((tab) => tabText(tab, code).trim());
  }

  function pickDefaultLang(note, tab = null) {
    const codes = languages().map((lang) => lang.code);
    const has = (code) => (tab ? Boolean(tabText(tab, code).trim()) : noteHasLang(note, code));
    if (note.defaultLang && codes.includes(note.defaultLang) && has(note.defaultLang)) return note.defaultLang;
    const found = codes.find(has);
    if (found) return found;
    if (note.defaultLang && codes.includes(note.defaultLang)) return note.defaultLang;
    return codes[0] || 'ko';
  }

  function createDefaultMemoTab(index = 0, named = true) {
    const texts = {};
    for (const lang of languages()) texts[lang.code] = '';
    return {
      id: makeId(),
      name: named ? `탭 ${index + 1}` : '',
      texts,
    };
  }

  function normalizeMemoTab(value, index = 0, langs = null) {
    const codes = (langs || languages()).map((lang) => lang.code);
    const sourceTexts = value?.texts && typeof value.texts === 'object' ? value.texts : {};
    const texts = {};
    for (const code of codes) {
      const legacy = code === 'ko' ? value?.ko : code === 'en' ? value?.en : undefined;
      texts[code] = typeof sourceTexts[code] === 'string' ? sourceTexts[code] : typeof legacy === 'string' ? legacy : '';
    }
    for (const [code, text] of Object.entries(sourceTexts)) {
      if (!(code in texts) && typeof text === 'string') texts[code] = text;
    }
    return {
      id: typeof value?.id === 'string' && value.id ? value.id : makeId(),
      name: typeof value?.name === 'string' ? value.name.trim() : '',
      texts,
    };
  }

  function normalizeNote(value, langs = null, groupTags = null) {
    const now = Date.now();
    const list = langs || languages();
    const tabs = Array.isArray(value?.tabs) && value.tabs.length
      ? value.tabs.map((tab, index) => normalizeMemoTab(tab, index, list))
      : [normalizeMemoTab({ name: '', ko: value?.ko, en: value?.en }, 0, list)];
    if (tabs.length > 1) tabs.forEach((tab, index) => { if (!tab.name) tab.name = `탭 ${index + 1}`; });
    const codes = list.map((lang) => lang.code);
    const tags = Array.isArray(value?.tags)
      ? [...new Set(value.tags.map((tag) => String(tag || '').trim()).filter(Boolean))].slice(0, 20).sort((a, b) => compareTags(a, b, groupTags || groupTagList()))
      : [];
    return {
      id: typeof value?.id === 'string' && value.id ? value.id : makeId(),
      title: typeof value?.title === 'string' && value.title.trim() ? value.title.trim() : '제목 없는 메모',
      tabs,
      tags,
      oocPrefix: typeof value?.oocPrefix === 'string' ? value.oocPrefix : '',
      noDefaultOoc: value?.noDefaultOoc === true,
      defaultLang: typeof value?.defaultLang === 'string' && codes.includes(value.defaultLang) ? value.defaultLang : '',
      deletedAt: Number.isFinite(Number(value?.deletedAt)) && Number(value?.deletedAt) > 0 ? Number(value.deletedAt) : null,
      isOriginal: value?.isOriginal === true,
      sourceUrl: normalizeStoredSourceUrl(value?.sourceUrl),
      createdAt: Number.isFinite(Number(value?.createdAt)) ? Number(value.createdAt) : now,
      updatedAt: Number.isFinite(Number(value?.updatedAt)) ? Number(value.updatedAt) : now,
    };
  }

  function normalizeStoredSourceUrl(value) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return '';
    try {
      const url = new URL(text);
      return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  }

  function validateSourceUrl(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    let url;
    try { url = new URL(text); } catch { throw new Error('출처 링크의 URL 형식이 올바르지 않습니다.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('출처 링크는 HTTP 또는 HTTPS 주소여야 합니다.');
    return url.toString();
  }

  function normalizeLanguages(value) {
    const list = [];
    if (Array.isArray(value)) {
      for (const lang of value) {
        if (!lang || typeof lang.code !== 'string' || !lang.code) continue;
        if (typeof lang.label !== 'string' || !lang.label.trim()) continue;
        if (list.some((item) => item.code === lang.code)) continue;
        list.push({ code: lang.code, label: lang.label.trim(), chip: typeof lang.chip === 'string' ? lang.chip.trim() : '' });
      }
    }
    for (const base of BASE_LANGUAGES) {
      if (!list.some((item) => item.code === base.code)) list.push({ ...base, chip: '' });
    }
    return list;
  }

  function normalizeData(value) {
    const settings = value?.settings || {};
    const custom = settings.customApi || {};
    const languagesList = normalizeLanguages(settings.languages);
    const groupTagsList = Array.isArray(settings.groupTags)
      ? [...new Set(settings.groupTags.map((tag) => String(tag || '').trim()).filter(Boolean))]
      : [];
    return {
      schema: SCHEMA_VERSION,
      notes: Array.isArray(value?.notes) ? value.notes.map((note) => normalizeNote(note, languagesList, groupTagsList)) : [],
      settings: {
        theme: settings.theme === 'dark' ? 'dark' : 'light',
        provider: settings.provider === 'custom' ? 'custom' : 'risu',
        viewMode: settings.viewMode === 'rows' ? 'rows' : 'grid',
        pageSize: PAGE_SIZES.includes(Number(settings.pageSize)) ? Number(settings.pageSize) : 15,
        languages: languagesList,
        groupTags: groupTagsList,
        customCopy: {
          user: typeof settings.customCopy?.user === 'string' ? settings.customCopy.user : '',
          char: typeof settings.customCopy?.char === 'string' ? settings.customCopy.char : '',
        },
        knownTags: Array.isArray(settings.knownTags)
          ? [...new Set(settings.knownTags.map((t) => String(t || '').trim()).filter(Boolean))]
          : [],
        buttonPlacement: Object.prototype.hasOwnProperty.call(BUTTON_PLACEMENTS, Number(settings.buttonPlacement))
          ? Number(settings.buttonPlacement)
          : 2,
        defaultOoc: {
          enabled: settings.defaultOoc?.enabled === true,
          text: typeof settings.defaultOoc?.text === 'string' ? settings.defaultOoc.text : '',
        },
        translationPrompt: typeof settings.translationPrompt === 'string' && settings.translationPrompt.trim()
          ? settings.translationPrompt
          : DEFAULT_TRANSLATION_PROMPT,
        customApi: {
          endpoint: typeof custom.endpoint === 'string' ? custom.endpoint : '',
          model: typeof custom.model === 'string' ? custom.model : '',
          temperature: Number.isFinite(Number(custom.temperature)) ? Number(custom.temperature) : 0.2,
          maxTokens: Number.isFinite(Number(custom.maxTokens)) ? Number(custom.maxTokens) : 3000,
        },
      },
    };
  }

  const parseStored = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

  // ── 저장 시 gzip 압축 (메모 본문 전용) ──
  // 브라우저 내장 CompressionStream 사용. 미지원 환경에서는 평문으로 저장한다.
  const PACK_PREFIX = 'gz1:';
  const canCompress = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

  function bytesToBase64(bytes) {
    let bin = '';
    const CHUNK = 0x8000; // 큰 배열을 한 번에 넘기면 스택이 넘치므로 분할
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }
  function base64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function packValue(text) {
    if (!canCompress()) return text;
    try {
      const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      return PACK_PREFIX + bytesToBase64(new Uint8Array(buf));
    } catch (error) {
      console.warn('[OOC Scrapbook] 압축에 실패해 평문으로 저장합니다.', error);
      return text;
    }
  }
  // 평문/압축본 모두 읽을 수 있다. 압축 해제 실패는 손상으로 보고 예외를 올린다.
  async function unpackValue(value) {
    if (typeof value !== 'string' || !value.startsWith(PACK_PREFIX)) return value;
    const stream = new Blob([base64ToBytes(value.slice(PACK_PREFIX.length))])
      .stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }

  // 저장된 내용의 스냅샷. 바뀐 부분만 다시 쓰기 위해 사용한다.
  function markSaved(notesJson, settingsJson) {
    state.savedNotesJson = notesJson;
    state.savedSettingsJson = settingsJson;
  }
  const serializeNotes = () => JSON.stringify(state.data.notes);
  const serializeSettings = () => JSON.stringify({ schema: SCHEMA_VERSION, settings: state.data.settings });

  async function loadData() {
    try {
      const [rawNotes, rawSettings] = await Promise.all([
        api.pluginStorage.getItem(NOTES_KEY),
        api.pluginStorage.getItem(SETTINGS_KEY),
      ]);
      if (rawNotes || rawSettings) {
        const notes = rawNotes ? parseStored(await unpackValue(rawNotes)) : [];
        const parsedSettings = rawSettings ? parseStored(await unpackValue(rawSettings)) : {};
        const settings = parsedSettings?.settings || parsedSettings;
        state.data = normalizeData({ notes, settings });
        state.loadFailed = false;
        markSaved(serializeNotes(), serializeSettings());
        return;
      }
      // 예전 통짜 키(ooc-scrapbook:data:v1) → notes/settings 분리 저장으로 이전
      const legacy = await api.pluginStorage.getItem(STORAGE_KEY);
      state.data = legacy ? normalizeData(parseStored(await unpackValue(legacy))) : createDefaultData();
      state.loadFailed = false;
      if (legacy) await migrateToSplitStorage();
      else markSaved(serializeNotes(), serializeSettings());
    } catch (error) {
      console.error('[OOC Scrapbook] 데이터를 불러오지 못했습니다.', error);
      state.data = createDefaultData();
      markSaved(null, null);
      // 읽기에 실패했을 때 빈 데이터로 덮어써 버리면 복구가 불가능하므로 저장을 막는다.
      state.loadFailed = true;
      toast('저장 데이터를 읽지 못했습니다. 데이터 보호를 위해 저장이 잠겼습니다. (JSON 불러오기로 복구 가능)', 'error');
    }
  }

  // 분리 저장으로 이전: 새 키에 쓰고 정상 기록을 확인한 뒤에만 예전 키를 정리한다.
  async function migrateToSplitStorage() {
    const notesJson = serializeNotes();
    const settingsJson = serializeSettings();
    try {
      await api.pluginStorage.setItem(NOTES_KEY, await packValue(notesJson));
      await api.pluginStorage.setItem(SETTINGS_KEY, settingsJson);
      const verify = await api.pluginStorage.getItem(NOTES_KEY);
      const ok = verify && JSON.stringify(parseStored(await unpackValue(verify))) === notesJson;
      if (!ok) throw new Error('이전 후 검증 실패');
      markSaved(notesJson, settingsJson);
      try { await api.pluginStorage.removeItem(STORAGE_KEY); } catch { /* 남아 있어도 동작에는 지장 없음 */ }
      console.log('[OOC Scrapbook] 저장 구조를 notes/settings 분리 방식으로 이전했습니다.');
    } catch (error) {
      // 실패 시 예전 키를 그대로 두어 데이터를 보존한다.
      console.error('[OOC Scrapbook] 저장 구조 이전에 실패했습니다. 기존 저장본을 유지합니다.', error);
      markSaved(null, null);
    }
  }

  // 바뀐 쪽만 저장한다. 설정만 바뀌면 메모(수백 KB)는 다시 쓰지 않는다.
  async function saveData() {
    if (state.loadFailed) {
      console.warn('[OOC Scrapbook] 데이터 읽기에 실패한 상태라 저장을 건너뜁니다.');
      return;
    }
    state.data.schema = SCHEMA_VERSION;
    const notesJson = serializeNotes();
    const settingsJson = serializeSettings();
    const tasks = [];
    if (notesJson !== state.savedNotesJson) {
      // 메모 본문만 압축한다. 설정은 1KB 미만이라 압축 이득이 없다.
      tasks.push(packValue(notesJson)
        .then((packed) => api.pluginStorage.setItem(NOTES_KEY, packed))
        .then(() => { state.savedNotesJson = notesJson; }));
    }
    if (settingsJson !== state.savedSettingsJson) {
      tasks.push(api.pluginStorage.setItem(SETTINGS_KEY, settingsJson).then(() => { state.savedSettingsJson = settingsJson; }));
    }
    if (tasks.length) await Promise.all(tasks);
  }

  async function getDeviceStorage() {
    if (state.deviceStorage) return state.deviceStorage;
    try {
      state.deviceStorage = await api.getLocalPluginStorage();
    } catch {
      state.deviceStorage = api.safeLocalStorage;
    }
    return state.deviceStorage;
  }

  async function loadLocalAISettings() {
    try {
      const storage = await getDeviceStorage();
      const stored = await storage?.getItem(LOCAL_AI_KEY);
      const parsed = stored ? (typeof stored === 'string' ? JSON.parse(stored) : stored) : {};
      state.localAI = {
        apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
        bodyJson: typeof parsed.bodyJson === 'string' ? parsed.bodyJson : '{}',
      };
    } catch (error) {
      console.error('[OOC Scrapbook] 기기별 API 설정을 불러오지 못했습니다.', error);
      state.localAI = { apiKey: '', bodyJson: '{}' };
    }
  }

  async function saveLocalAISettings() {
    const storage = await getDeviceStorage();
    await storage?.setItem(LOCAL_AI_KEY, JSON.stringify(state.localAI));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function formatDate(timestamp, includeTime = false) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(date);
  }

  function relativeDate(timestamp) {
    const diff = Date.now() - Number(timestamp || 0);
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
    return formatDate(timestamp);
  }

  // 성능: 노트 객체는 저장/불러오기 시 새로 생성되므로 WeakMap 캐시가 자동으로 무효화됨
  const previewCache = new WeakMap();
  const searchCorpusCache = new WeakMap();

  function previewText(note) {
    let preview = previewCache.get(note);
    if (preview === undefined) {
      const source = note.tabs.flatMap((tab) => Object.values(tab.texts || {})).find((part) => String(part).trim()) || '';
      preview = source.slice(0, 400).replace(/\s+/g, ' ').trim().slice(0, 140) || '아직 내용이 없습니다.';
      previewCache.set(note, preview);
    }
    return preview;
  }

  function noteCorpus(note) {
    let corpus = searchCorpusCache.get(note);
    if (corpus === undefined) {
      corpus = [note.title, ...note.tags, ...note.tabs.flatMap((tab) => [tab.name, ...Object.values(tab.texts || {})])]
        .join('\n')
        .toLocaleLowerCase();
      searchCorpusCache.set(note, corpus);
    }
    return corpus;
  }

  function currentNote() {
    return state.data.notes.find((note) => note.id === state.selectedId) || null;
  }

  function currentMemoTab(note = currentNote()) {
    if (!note?.tabs?.length) return null;
    const tab = note.tabs.find((item) => item.id === state.activeMemoTabId) || note.tabs[0];
    state.activeMemoTabId = tab.id;
    return tab;
  }

  function currentDraftTab() {
    if (!state.draft?.tabs?.length) return null;
    const tab = state.draft.tabs.find((item) => item.id === state.activeMemoTabId) || state.draft.tabs[0];
    state.activeMemoTabId = tab.id;
    return tab;
  }

  function sortedNotes() {
    const query = state.search.trim().toLocaleLowerCase();
    const notes = [...state.data.notes].filter((note) => {
      if (note.deletedAt) return false;
      if (state.tagFilter === '__nosource') {
        if (note.sourceUrl || note.isOriginal) return false;
      } else if (state.tagFilter === '__noooc') {
        if (effectivePrefix(note)) return false;
      } else if (state.tagFilter && !note.tags.includes(state.tagFilter)) return false;
      return !query || noteCorpus(note).includes(query);
    });
    if (state.sortMode === 'title') notes.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    else if (state.sortMode === 'tag') {
      notes.sort((a, b) => (a.tags[0] || '￿').localeCompare(b.tags[0] || '￿', 'ko') || a.title.localeCompare(b.title, 'ko'));
    } else notes.sort((a, b) => b.updatedAt - a.updatedAt);
    return notes;
  }

  function trashedNotes() {
    return state.data.notes.filter((note) => note.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt);
  }

  // 화면에 고정 배치되는 커스텀 툴팁 (overflow 컨테이너에서도 잘리지 않음)
  function hideTip() {
    const el = document.getElementById('cbs-tip');
    if (el) el.style.display = 'none';
  }
  function showTip(target) {
    const text = target.getAttribute('data-tip');
    if (!text) return;
    let el = document.getElementById('cbs-tip');
    if (!el) { el = document.createElement('div'); el.id = 'cbs-tip'; el.className = 'cbs-tip'; document.body.appendChild(el); }
    el.textContent = text;
    el.style.display = 'block';
    const r = target.getBoundingClientRect();
    const tr = el.getBoundingClientRect();
    const margin = 8;
    let top = r.top - tr.height - margin;
    if (top < 6) top = r.bottom + margin;                 // 위 공간 없으면 아래로
    if (top + tr.height > window.innerHeight - 6) top = Math.max(6, window.innerHeight - tr.height - 6);
    let left = r.left + r.width / 2 - tr.width / 2;
    left = Math.max(6, Math.min(left, window.innerWidth - tr.width - 6));
    el.style.top = `${Math.round(top)}px`;
    el.style.left = `${Math.round(left)}px`;
  }

  function toast(message, type = 'info') {
    const host = document.getElementById('toast-host');
    if (!host) return;
    clearTimeout(state.toastTimer);
    host.innerHTML = `<div class="toast ${escapeAttribute(type)}">${escapeHtml(message)}</div>`;
    state.toastTimer = setTimeout(() => {
      if (host) host.innerHTML = '';
    }, 3200);
  }

  function flashAutoBadge(key) {
    const badge = document.querySelector(`.auto-badge[data-badge="${key}"]`);
    if (!badge) return;
    badge.classList.add('saved');
    badge.textContent = '자동 저장됨';
    clearTimeout(state.badgeTimers[key]);
    state.badgeTimers[key] = setTimeout(() => {
      const current = document.querySelector(`.auto-badge[data-badge="${key}"]`);
      if (current) {
        current.classList.remove('saved');
        current.textContent = '자동 저장';
      }
    }, 2000);
  }

  function buttonIcon(icon, label) {
    return `<span aria-hidden="true">${icon}</span><span>${escapeHtml(label)}</span>`;
  }

  function renderShell() {
    document.documentElement.lang = 'ko';
    document.title = PLUGIN_NAME;
    applyTheme();
    document.body.innerHTML = `
      <style>
        :root {
          color-scheme: light;
          --ink: #292625;
          --muted: #766f6b;
          --paper: #fbfaf7;
          --paper-2: #f2efea;
          --surface: #ffffff;
          --surface-solid: #ffffff;
          --surface-hover: #ffffff;
          --field: #ffffff;
          --line: rgba(69,60,55,.16);
          --line-strong: rgba(69,60,55,.28);
          --accent: #956575;
          --accent-strong: #734858;
          --accent-soft: #f2e7eb;
          --blue: #587181;
          --blue-soft: #e6eef2;
          --danger: #a44e55;
          --focus: rgba(149,101,117,.18);
          --overlay: rgba(28,25,24,.34);
          --topbar: #fbfaf7;
          --paper-glow: transparent;
          --paper-sheen: transparent;
          --shadow: 0 10px 28px rgba(32,25,23,.16);
          --shadow-soft: 0 1px 2px rgba(44,35,31,.05);
        }
        * { box-sizing: border-box; }
        html, body { width: 100%; height: 100%; margin: 0; }
        html { background: transparent; }
        body {
          overflow: hidden;
          font-family: Inter, Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: var(--ink);
          background: var(--overlay);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        button, input, textarea, select { font: inherit; }
        button { color: inherit; }
        ::selection { color: var(--ink); background: var(--accent-soft); }
        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { border: 3px solid transparent; border-radius: 999px; background: var(--line-strong); background-clip: padding-box; }
        ::-webkit-scrollbar-thumb:hover { background: var(--muted); background-clip: padding-box; }
        .backdrop {
          width: 100%; height: 100%; padding: 18px;
          display: grid; place-items: center;
        }
        .scrapbook {
          position: relative;
          width: min(920px, calc(100vw - 36px));
          height: min(820px, calc(100vh - 36px));
          min-height: 480px;
          display: flex; flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--line-strong);
          border-radius: 22px;
          background: var(--paper);
          box-shadow: var(--shadow);
        }
        .topbar {
          position: relative; z-index: 2;
          display: flex; align-items: center; gap: 10px;
          min-height: 72px; padding: 14px 18px;
          border-bottom: 1px solid var(--line);
          background: var(--topbar);
          
        }
        .brand { min-width: 0; flex: 1; }
        .brand h1 { margin: 0; font-family: ui-serif, "Noto Serif KR", Georgia, serif; font-size: 21px; font-weight: 700; letter-spacing: -.025em; }
        .brand-ver { color: var(--muted); font-family: Inter, Pretendard, sans-serif; font-size: 11px; font-weight: 700; vertical-align: 2px; }
        .brand p { margin: 3px 0 0; color: var(--muted); font-size: 12px; }
        .toolbar { display: flex; gap: 8px; align-items: center; }
        .icon-btn, .btn, .tab, .memo-card {
          border: 1px solid var(--line); cursor: pointer;
          transition: border-color .15s ease, background-color .15s ease, color .15s ease;
        }
        .icon-btn, .btn {
          min-height: 38px; padding: 8px 12px; border-radius: 11px;
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          background: var(--surface);
          font-weight: 700; font-size: 13px;
        }
        .icon-btn { width: 38px; padding: 0; font-size: 17px; }
        .icon-btn:hover, .btn:hover, .tab:hover { border-color: var(--line-strong); background: var(--surface-hover); }
        .icon-btn:focus-visible, .btn:focus-visible, .tab:focus-visible, .memo-card:focus-visible, .memo-tab:focus-visible, .memo-tab-icon:focus-visible, .source-link:focus-visible {
          outline: 3px solid var(--focus); outline-offset: 2px;
        }
        .btn.primary { color: #fff; background: var(--accent); border-color: var(--accent); }
        .btn.primary:hover { color: #fff; background: var(--accent-strong); border-color: var(--accent-strong); }
        .btn.blue { color: #fff; background: var(--blue); border-color: var(--blue); }
        .btn.blue:hover { color: #fff; filter: brightness(.94); }
        .btn.danger { color: var(--danger); }
        .btn.danger:hover { border-color: rgba(164,78,85,.3); background: rgba(164,78,85,.08); }
        .btn:disabled, .icon-btn:disabled { opacity: .48; cursor: not-allowed; transform: none; box-shadow: none; }
        .content { position: relative; z-index: 1; flex: 1; min-height: 0; padding: 24px 26px; overflow: auto; }
        .content.screen-view { display: flex; flex-direction: column; overflow: hidden; }
        .content.screen-edit { display: flex; flex-direction: column; overflow: hidden; }
        .list-tools { display: flex; gap: 10px; width: min(100%, 540px); margin-bottom: 20px; }
        .search-wrap { position: relative; flex: 1; }
        .search-wrap span { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: .72; }
        .field, .textarea, .select {
          width: 100%; border: 1px solid var(--line); border-radius: 12px;
          color: var(--ink); background: var(--field); outline: none;
          
          transition: border-color .15s ease, background-color .15s ease;
        }
        .field::placeholder, .textarea::placeholder { color: var(--muted); opacity: .62; }
        .field { height: 42px; padding: 9px 12px; }
        .search-wrap .field { padding-left: 38px; }
        .field:hover, .textarea:hover, .select:hover { border-color: var(--line-strong); }
        .field:focus, .textarea:focus, .select:focus { border-color: var(--accent); background: var(--surface-solid); box-shadow: 0 0 0 4px var(--focus); }
        .memo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: 1fr; align-items: stretch; gap: 14px; }
        .memo-card {
          position: relative; min-height: 148px; padding: 17px 18px;
          display: flex; flex-direction: column;
          text-align: left; color: var(--ink);
          border-radius: 15px; background: var(--surface); box-shadow: var(--shadow-soft);
        }
        .memo-card::after { content: ''; position: absolute; top: 0; left: 17px; right: 17px; height: 2px; border-radius: 0 0 999px 999px; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: .46; }
        .memo-card:hover { border-color: var(--line-strong); background: var(--surface-hover); }
        .memo-card h2 { margin: 0 0 9px; font-family: ui-serif, "Noto Serif KR", Georgia, serif; font-size: 17px; font-weight: 700; letter-spacing: -.018em; line-height: 1.35; }
        .memo-card p { flex: 1; margin: 0; color: var(--muted); font-size: 13px; line-height: 1.58; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .memo-meta { display: flex; align-items: center; gap: 7px; margin-top: auto; padding-top: 13px; color: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
        .lang-chip { padding: 3px 7px; border: 1px solid rgba(149,101,117,.12); border-radius: 999px; background: var(--accent-soft); color: var(--accent-strong); font-size: 10px; font-weight: 800; letter-spacing: .035em; }
        .empty { min-height: 300px; display: grid; place-items: center; text-align: center; color: var(--muted); }
        .empty-mark { font-size: 48px; margin-bottom: 12px; opacity: .55; filter: saturate(.65); }
        .empty h2 { margin: 0 0 6px; color: var(--ink); font-family: ui-serif, "Noto Serif KR", Georgia, serif; letter-spacing: -.02em; }
        .empty-message { margin: 0; font-size: 14px; }
        .page-head { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
        .page-head-main { flex: 1; min-width: 0; }
        .page-head h2 { margin: 0 0 5px; font-family: ui-serif, "Noto Serif KR", Georgia, serif; font-size: 23px; font-weight: 700; letter-spacing: -.025em; overflow-wrap: anywhere; }
        .page-head p { margin: 0; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
        .source-link { display: inline-flex; margin-top: 7px; padding: 0; border: 0; color: var(--blue); background: transparent; font-size: 12px; font-weight: 750; text-decoration: none; cursor: pointer; }
        .source-link:hover { text-decoration: underline; text-underline-offset: 3px; }
        .tabs { display: flex; gap: 3px; padding: 3px; width: fit-content; border: 1px solid var(--line); border-radius: 12px; background: var(--paper-2);  }
        .viewer-head { align-items: flex-start; margin-bottom: 10px; }
        .viewer-head .tabs { flex: 0 0 auto; margin: 1px 0 0 auto; }
        .tab.empty { opacity: .35; cursor: not-allowed; }
        .tab.empty:hover { border-color: var(--line); background: transparent; transform: none; box-shadow: none; }
        .tab { min-width: 96px; min-height: 36px; padding: 7px 12px; border-radius: 9px; color: var(--muted); background: transparent; font-size: 12px; font-weight: 750; }
        .tab.active { color: var(--accent-strong); border-color: var(--line); background: var(--surface-solid); }
        .memo-tabs-row { display: flex; align-items: center; gap: 7px; min-width: 0; margin-bottom: 12px; padding: 7px; flex: 0 0 auto; border: 1px solid var(--line); border-radius: 14px; background: var(--paper-2); box-shadow: inset 0 1px 2px rgba(44,35,31,.035); }
        .memo-tabs { flex: 1 1 auto; display: flex; align-items: center; gap: 5px; min-width: 0; overflow-x: auto; scrollbar-width: thin; padding: 0 1px 1px 0; }
        .memo-tab-item { position: relative; flex: 0 0 auto; display: flex; align-items: stretch; min-height: 36px; max-width: 270px; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); transition: border-color .15s ease, background-color .15s ease; }
        .memo-tab-item.active { color: var(--accent-strong); border-color: rgba(149,101,117,.35); background: var(--accent-soft); }
        .memo-tab-item.active::after { content: ''; position: absolute; z-index: 2; left: 10px; right: 10px; bottom: 0; height: 2px; border-radius: 999px 999px 0 0; background: var(--accent); pointer-events: none; }
        .memo-tab-item:not(.active):hover { border-color: var(--line-strong); background: var(--surface-hover); }
        .memo-tab { min-width: 86px; max-width: 190px; padding: 8px 12px; overflow: hidden; border: 0; color: inherit; background: transparent; font-size: 12px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
        .memo-tab:hover { background: rgba(255,255,255,.38); }
        .memo-tab-actions { display: flex; align-items: stretch; border-left: 1px solid var(--line); }
        .memo-tab-icon { width: 29px; min-height: 34px; padding: 0; border: 0; color: var(--muted); background: transparent; font-size: 14px; cursor: pointer; transition: color .16s ease, background-color .16s ease; }
        .memo-tab-icon:hover { color: var(--accent-strong); background: rgba(255,255,255,.48); }
        .memo-tab-icon.danger:hover { color: var(--danger); }
        .memo-tab-icon:disabled { opacity: .32; cursor: not-allowed; }
        .memo-tab-name-input { width: 135px; min-width: 82px; padding: 7px 9px; border: 0; outline: none; color: var(--ink); background: transparent; font-size: 12px; font-weight: 750; }
        .memo-tab-name-input:focus { box-shadow: inset 0 -2px 0 var(--accent); }
        .memo-tab-add { flex: 0 0 auto; min-width: 36px; min-height: 36px; padding: 7px 10px; border-radius: 10px; font-size: 16px; line-height: 1; }
        .memo-tab-add:disabled { cursor: not-allowed; }
        .memo-tabs-row.solo { margin-bottom: 10px; padding: 0; border: 0; background: transparent; box-shadow: none; }
        .memo-tabs-row.solo .memo-tab-add { min-height: 34px; padding: 6px 12px; border-style: dashed; background: transparent; color: var(--muted); font-size: 12px; font-weight: 750; }
        .memo-tabs-row.solo .memo-tab-add:hover { color: var(--accent-strong); border-color: var(--line-strong); background: var(--surface); }
        .note-paper { min-height: 330px; margin-top: 0; padding: 24px; border: 1px solid var(--line); border-radius: 15px; background: var(--surface); box-shadow: none; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.74; }
        .note-paper.placeholder { color: var(--muted); font-style: italic; }
        .note-paper, .editor-textarea { font-size: 14.5px; }
        .note-paper.lang-en, .editor-textarea.lang-en { font-size: 14.5px; }
        .viewer-head, .viewer-tabs, .viewer-actions { flex: 0 0 auto; }
        .viewer-note { flex: 1 1 auto; min-height: 0; overflow: auto; }
        .viewer-actions { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
        .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .actions .spacer { flex: 1; }
        .form-group { margin-bottom: 13px; }
        .form-group label { display: block; margin: 0 0 7px; color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .035em; }
        .editor-meta-row { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 3fr) minmax(0, 3fr); gap: 12px; align-items: start; }
        .editor-meta-row .field { height: 44px; }
        .title-field { font-size: 17px; font-family: ui-serif, "Noto Serif KR", Georgia, serif; font-weight: 700; letter-spacing: -.015em; }
        .editor-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 10px; padding: 7px; border: 1px solid var(--line); border-radius: 14px; background: var(--paper-2); box-shadow: inset 0 1px 2px rgba(44,35,31,.035); }
        .editor-row .tabs { flex: 0 0 auto; padding: 0; border: 0; background: transparent; box-shadow: none; }
        .editor-row .tab.active { border-color: var(--line); }
        .translation-tools { display: flex; gap: 6px; flex-wrap: nowrap; align-items: center; justify-content: flex-end; }
        .translation-tools .btn { min-height: 36px; background: var(--surface-solid); }
        .lang-tabs-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .lang-tabs-group .default-lang-check { flex: 0 0 auto; }
        .trans-field { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; }
        .trans-label { color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .03em; white-space: nowrap; }
        #translate-source { width: 86px; flex: 0 0 auto; }
        .trans-target { display: inline-flex; align-items: center; justify-content: center; width: 86px; height: 36px; padding: 6px 9px; border: 1px solid var(--line); border-radius: 11px; background: var(--paper-2); color: var(--muted); font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; box-sizing: border-box; }
        .translation-tools [data-action="translate"] { flex: 0 0 auto; min-height: 36px; white-space: nowrap; }
        .textarea { min-height: 300px; padding: 16px; resize: vertical; line-height: 1.68; }
        .editor-textarea { min-height: 400px; }
        .screen-edit .editor-meta-row, .screen-edit .memo-tabs-row, .screen-edit .editor-row { flex: 0 0 auto; }
        .screen-edit .editor-textarea { flex: 1 1 auto; min-height: 260px; resize: none; }
        .screen-edit > .actions { flex: 0 0 auto; justify-content: flex-end; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .setting-card { padding: 16px; border: 1px solid var(--line); border-radius: 15px; background: var(--surface); box-shadow: var(--shadow-soft); }
        .setting-card.full { grid-column: 1 / -1; }
        .setting-card h3 { margin: 0 0 5px; font-size: 15px; letter-spacing: -.01em; }
        .setting-card > p { margin: 0 0 14px; color: var(--muted); font-size: 12px; line-height: 1.55; }
        .mini-textarea { min-height: 150px; }
        .api-fields { display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; }
        .data-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .content.screen-settings { display: flex; flex-direction: column; overflow: hidden; }
        .screen-settings .page-head { flex: 0 0 auto; }
        .settings-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; padding-bottom: 4px; }
        .settings-grid > .actions { grid-column: 1 / -1; justify-content: flex-end; margin-top: 0; }
        .auto-badge { display: inline-block; margin-left: 6px; padding: 2px 7px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper-2); color: var(--muted); font-size: 10px; font-weight: 800; vertical-align: 2px; transition: background-color .2s ease, color .2s ease, border-color .2s ease; }
        .auto-badge.saved { border-color: rgba(61,105,79,.4); background: rgba(61,105,79,.12); color: #3d694f; }
        :root[data-theme="dark"] .auto-badge.saved { border-color: rgba(97,169,126,.4); background: rgba(97,169,126,.16); color: #8fc7a5; }
        .hint { margin-top: 6px; color: var(--muted); font-size: 11px; line-height: 1.45; }
        .secret-note { color: var(--blue); }
        .toast-host { position: fixed; z-index: 20; left: 50%; bottom: 32px; transform: translateX(-50%); pointer-events: none; }
        .toast { max-width: min(520px, calc(100vw - 40px)); padding: 11px 16px; border: 1px solid rgba(255,255,255,.12); border-radius: 13px; color: #fff; background: rgba(45,41,39,.96); box-shadow: 0 12px 34px rgba(0,0,0,.25); font-size: 13px; font-weight: 700; }
        .toast.success { background: rgba(61,105,79,.95); }
        .toast.error { background: rgba(151,58,67,.95); }
        .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.38); border-top-color: currentColor; border-radius: 50%; animation: spin .8s linear infinite; }
        .internal-modal-backdrop {
          position: absolute; z-index: 12; inset: 0;
          display: grid; place-items: center; padding: 20px;
          background: rgba(27,23,22,.5);
        }
        .internal-modal {
          width: min(400px, 100%); padding: 22px;
          border: 1px solid var(--line-strong); border-radius: 18px;
          background: var(--surface-solid); box-shadow: 0 24px 64px rgba(24,18,17,.3);
        }
        .internal-modal h3 { margin: 0 0 8px; font-family: ui-serif, "Noto Serif KR", Georgia, serif; font-size: 19px; letter-spacing: -.02em; }
        .internal-modal p { margin: 0; color: var(--muted); line-height: 1.58; overflow-wrap: anywhere; }
        .internal-modal .actions { justify-content: flex-end; margin-top: 20px; }
        .btn.danger-fill { color: #fff; background: var(--danger); border-color: var(--danger);  }
        .btn.danger-fill:hover { color: #fff; background: #8f4148; border-color: #8f4148; }
        .list-tools { width: 100%; flex-wrap: wrap; align-items: center; }
        .list-tools .search-wrap { flex: 1 1 220px; }
        .select.slim { width: auto; height: 36px; padding: 6px 9px; flex: 0 0 auto; font-size: 12px; }
        .list-tools { margin-bottom: 16px; }
        .list-tools .search-wrap .field { height: 36px; padding-left: 34px; font-size: 12.5px; }
        .list-tools .search-wrap span { left: 11px; font-size: 13px; }
        .list-tools .icon-btn { width: 36px; min-height: 36px; font-size: 15px; }
        .memo-grid.rows { grid-template-columns: 1fr; grid-auto-rows: auto; gap: 7px; }
        .memo-grid.rows .memo-card { flex-direction: row; align-items: center; gap: 12px; min-height: 0; padding: 10px 16px; }
        .memo-grid.rows .memo-card::after { display: none; }
        .memo-grid.rows .memo-card:hover { transform: none; }
        .memo-grid.rows .memo-card h2 { flex: 1; min-width: 0; margin: 0; font-size: 14.5px; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .memo-grid.rows .memo-card p { display: none; }
        .memo-grid.rows .memo-meta { flex: 0 0 auto; margin: 0; padding: 0; }
        .memo-index { color: var(--muted); font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums; opacity: .75; }
        .memo-grid:not(.rows) .memo-index { align-self: flex-start; margin-bottom: 5px; }
        .memo-grid.rows .memo-index { flex: 0 0 auto; min-width: 26px; text-align: right; }
        .card-tags { display: flex; flex-wrap: wrap; gap: 5px; margin: 0 0 8px; }
        .memo-grid.rows .card-tags { flex: 0 0 auto; flex-wrap: nowrap; margin: 0; }
        .tag-chip { padding: 3px 7px; border: 1px solid rgba(88,113,129,.16); border-radius: 999px; background: var(--blue-soft); color: var(--blue); font-size: 10px; font-weight: 800; letter-spacing: .02em; }
        .nosrc-chip { padding: 3px 7px; border: 1px dashed rgba(164,78,85,.4); border-radius: 999px; background: transparent; color: var(--danger); font-size: 10px; font-weight: 800; }
        .nosrc-text { color: var(--danger); opacity: .85; }
        .orig-chip { padding: 3px 7px; border: 1px solid rgba(61,105,79,.4); border-radius: 999px; background: rgba(61,105,79,.12); color: #3d694f; font-size: 10px; font-weight: 800; }
        :root[data-theme="dark"] .orig-chip { border-color: rgba(97,169,126,.4); background: rgba(97,169,126,.16); color: #8fc7a5; }
        .orig-text { color: #3d694f; font-weight: 750; }
        :root[data-theme="dark"] .orig-text { color: #8fc7a5; }
        .source-label-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 7px; }
        .source-label-row label { margin: 0; }
        .orig-check { display: inline-flex; align-items: center; gap: 0; color: var(--muted); font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .orig-check input { margin: 0 5px 0 0; accent-color: var(--accent); }
        #note-source-url { font-size: 12px; }
        #setting-translation-prompt, #setting-default-ooc-text { font-size: 13.5px; }
        .editor-meta-row > .form-group > label { height: 15px; line-height: 15px; margin: 0 0 8px; box-sizing: border-box; }
        .editor-meta-row .source-label-row { height: 15px; margin: 0 0 8px; }
        .editor-meta-row .source-label-row > label { height: auto; margin: 0; }
        .lang-chip-label { margin-left: 6px; color: var(--muted); font-size: 10px; font-weight: 700; opacity: .8; }
        .lang-chip-input { width: 56px; min-width: 44px; margin: 0 2px; padding: 3px 6px; border: 1px solid var(--line); border-radius: 7px; background: var(--field); color: var(--ink); font-size: 11px; font-weight: 700; text-align: center; }
        .lang-chip-input:focus { outline: none; border-color: var(--accent); }
        .noooc-chip { padding: 3px 7px; border: 1px dashed rgba(88,113,129,.4); border-radius: 999px; background: transparent; color: var(--blue); font-size: 10px; font-weight: 800; }
        .noooc-text { color: var(--blue); opacity: .85; }
        .ooc-def-chip { padding: 3px 7px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper-2); color: var(--muted); font-size: 10px; font-weight: 800; }
        .tag-chip.more { border-style: dashed; border-color: rgba(88,113,129,.25); background: var(--blue-soft); color: var(--blue); }
        .tag-chip.group { border-color: rgba(178,134,58,.28); background: rgba(178,134,58,.13); color: #8a6430; }
        :root[data-theme="dark"] .tag-chip.group { border-color: rgba(217,178,110,.35); background: rgba(217,178,110,.14); color: #d9b26e; }
        .tag-suggest-item.group { color: #8a6430; }
        :root[data-theme="dark"] .tag-suggest-item.group { color: #d9b26e; }
        .note-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
        .pagination { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 18px; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
        .default-lang-check { display: inline-flex; align-items: center; gap: 6px; padding: 0 6px; color: var(--muted); font-size: 12px; font-weight: 750; cursor: pointer; white-space: nowrap; }
        .default-lang-check input { margin: 0; accent-color: var(--accent); }
        .ooc-block { flex: 0 0 auto; margin-bottom: 12px; padding: 10px 14px; border: 1px solid rgba(88,113,129,.25); border-radius: 12px; background: var(--blue-soft); }
        .ooc-block-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
        .ooc-label { color: var(--blue); font-size: 11px; font-weight: 800; letter-spacing: .04em; }
        .ooc-block-body { max-height: 120px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--muted); font-size: 12.5px; line-height: 1.6; }
        .ooc-textarea { min-height: 96px; padding: 9px 12px; font-size: 12.5px; }
        .ooc-field .ooc-optout { display: inline-flex; width: auto; align-items: center; gap: 0; margin: 7px 0 0; color: var(--muted); font-size: 12px; font-weight: 750; letter-spacing: normal; cursor: pointer; }
        .ooc-field .ooc-optout input { margin: 0 5px 0 0; accent-color: var(--accent); }
        .ooc-enable-check { display: inline-flex; align-items: center; gap: 7px; margin-bottom: 10px; font-size: 13px; font-weight: 750; cursor: pointer; }
        .ooc-enable-check input { margin: 0; accent-color: var(--accent); }
        .ooc-default-badge { margin-left: 4px; padding: 1px 6px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper-2); color: var(--muted); font-size: 9px; font-weight: 800; vertical-align: 1px; }
        .screen-edit .ooc-field { flex: 0 0 auto; margin-bottom: 10px; }
        .lang-manage { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .lang-row { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); font-size: 12px; font-weight: 750; }
        .lang-row button { padding: 0; border: 0; background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
        .lang-row button:hover { color: var(--accent-strong); }
        .lang-row button.danger:hover { color: var(--danger); }
        .lang-row button:disabled { opacity: .3; cursor: default; }
        .lang-rank { color: var(--muted); font-size: 10px; font-weight: 800; }
        .custom-copy-fields { display: grid; gap: 10px; margin-top: 14px; }
        .custom-copy-fields .form-group { margin: 0; }
        .custom-copy-fields label { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
        .placement-chips { flex-wrap: wrap; }
        .placement-chips .tab { min-width: 88px; }
        .tag-manage { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .tag-manage-row { display: inline-flex; align-items: center; border: 1px solid rgba(88,113,129,.2); border-radius: 999px; background: var(--blue-soft); overflow: hidden; }
        .tag-manage-row.group { border-color: rgba(178,134,58,.28); background: rgba(178,134,58,.13); }
        .tag-manage-input { width: 84px; min-width: 40px; padding: 5px 10px; border: 0; background: transparent; color: var(--blue); font-size: 12px; font-weight: 750; }
        .tag-manage-row.group .tag-manage-input { color: #8a6430; }
        :root[data-theme="dark"] .tag-manage-row.group .tag-manage-input { color: #d9b26e; }
        .tag-manage-input:focus { outline: none; background: var(--surface-solid); }
        .tag-manage-del { padding: 0 8px; align-self: stretch; border: 0; border-left: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
        .tag-manage-del:hover { color: var(--danger); background: rgba(164,78,85,.08); }
        .lang-add { display: flex; gap: 8px; max-width: 420px; }
        .lang-add .field { flex: 1; }
        .tag-editor-wrap { position: relative; }
        .editor-meta-row .tag-editor { height: auto; }
        .tag-editor { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 44px; padding: 6px 10px; cursor: text; }
        .tag-chip.editable { display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; font-size: 12px; }
        .tag-chip.editable button { padding: 0; border: 0; background: transparent; color: inherit; font-size: 13px; line-height: 1; cursor: pointer; opacity: .65; }
        .tag-chip.editable button:hover { opacity: 1; color: var(--danger); }
        #note-tag-input { flex: 1; min-width: 90px; padding: 4px 2px; border: 0; outline: none; background: transparent; color: var(--ink); font: inherit; font-size: 13px; }
        #note-tag-input::placeholder { color: var(--muted); opacity: .62; }
        .tag-suggest { position: absolute; z-index: 8; top: calc(100% + 4px); left: 0; right: 0; max-height: 190px; overflow: auto; padding: 5px; border: 1px solid var(--line-strong); border-radius: 11px; background: var(--surface-solid); box-shadow: var(--shadow); }
        .tag-suggest-item { display: block; width: 100%; padding: 7px 10px; border: 0; border-radius: 8px; background: transparent; color: var(--ink); text-align: left; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .tag-suggest-item:hover, .tag-suggest-item.active { background: var(--accent-soft); color: var(--accent-strong); }
        .trash-list { display: flex; flex-direction: column; gap: 8px; }
        .trash-row { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); }
        .trash-main { flex: 1; min-width: 0; }
        .trash-main h3 { margin: 0 0 3px; font-size: 14px; letter-spacing: -.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .trash-main p { margin: 0; color: var(--muted); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .trash-row .btn { flex: 0 0 auto; min-height: 34px; padding: 6px 11px; font-size: 12px; }
        .cbs-tip { position: fixed; z-index: 9999; display: none; max-width: 280px; padding: 7px 11px; border-radius: 9px; background: rgba(45,41,39,.97); color: #fff; font-size: 11.5px; font-weight: 650; line-height: 1.5; white-space: pre-line; box-shadow: 0 6px 18px rgba(0,0,0,.24); pointer-events: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        :root[data-theme="dark"] {
          color-scheme: light;
          --ink: #f0ece8;
          --muted: #aaa29c;
          --paper: #211f1e;
          --paper-2: #2a2725;
          --surface: #2e2b29;
          --surface-solid: #34302e;
          --surface-hover: #3a3532;
          --field: #2e2b29;
          --line: rgba(255,255,255,.1);
          --line-strong: rgba(255,255,255,.18);
          --accent: #c88d9d;
          --accent-strong: #edb2c0;
          --accent-soft: rgba(190,119,137,.16);
          --blue: #7898aa;
          --blue-soft: rgba(120,152,170,.15);
          --danger: #e58b92;
          --focus: rgba(200,141,157,.2);
          --overlay: rgba(10,9,9,.3);
          --topbar: #211f1e;
          --paper-glow: transparent;
          --paper-sheen: transparent;
          --shadow: 0 10px 28px rgba(0,0,0,.4);
          --shadow-soft: 0 1px 2px rgba(0,0,0,.2);
        }
        :root[data-theme="dark"] .memo-tab:hover, :root[data-theme="dark"] .memo-tab-icon:hover { background: rgba(255,255,255,.06); }
        @media (max-width: 820px) {
          .backdrop { padding: 10px; }
          .scrapbook { width: calc(100vw - 20px); height: calc(100vh - 20px); min-height: 0; }
          .content { padding: 20px 20px 22px; }
          .memo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 620px) {
          .backdrop { padding: 8px; }
          .scrapbook { width: calc(100vw - 16px); height: calc(100vh - 16px); }
          .topbar { min-height: 64px; padding: 10px 12px; }
          .brand p { display: none; }
          .content { padding: 16px 14px 18px; }
          .memo-grid, .settings-grid, .api-fields { grid-template-columns: 1fr; }
          .setting-card.full { grid-column: auto; }
          .btn .optional-label { display: none; }
          .editor-row { width: 100%; align-items: stretch; flex-direction: column; gap: 7px; }
          .editor-row .tabs, .translation-tools { width: 100%; }
          .editor-row .tab, .translation-tools .btn { flex: 1 1 0; }
          .editor-meta-row { grid-template-columns: 1fr; gap: 0; }
          .content.screen-edit { display: block; overflow: auto; }
          .screen-edit .editor-textarea { min-height: 400px; resize: vertical; }
          .screen-edit > .actions, .screen-settings > .actions { position: static; justify-content: flex-start; }
          .translation-tools { justify-content: flex-start; }
          .viewer-head { flex-wrap: wrap; }
          .viewer-head .tabs { width: 100%; margin: 8px 0 0; }
          .viewer-head .tab { flex: 1 1 0; }
          .memo-tabs-row { padding: 6px; }
          .tab { min-width: 88px; }
        }
        @media (max-height: 650px) {
          .content.screen-edit { display: block; overflow: auto; }
          .screen-edit .editor-textarea { min-height: 320px; resize: vertical; }
          .screen-edit > .actions { justify-content: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
        }
      </style>
      <div class="backdrop" data-action="backdrop-close">
        <section class="scrapbook" role="dialog" aria-modal="true" aria-label="OOC Scrapbook">
          <header class="topbar">
            <div class="brand"><h1>ooc scrapbook <span class="brand-ver">v${PLUGIN_VERSION}</span></h1></div>
            <div class="toolbar" id="top-toolbar"></div>
          </header>
          <main class="content" id="main-content"></main>
        </section>
      </div>
      <div class="toast-host" id="toast-host" aria-live="polite"></div>
    `;
    bindEvents();
    render();
  }

  function renderTopToolbar() {
    const toolbar = document.getElementById('top-toolbar');
    if (!toolbar) return;
    const dark = state.data.settings.theme === 'dark';
    const themeButton = `<button class="icon-btn" data-action="toggle-theme" data-tip="${dark ? '라이트모드로 전환' : '다크모드로 전환'}" aria-label="${dark ? '라이트모드로 전환' : '다크모드로 전환'}">${dark ? '☀' : '☾'}</button>`;
    if (state.screen === 'list') {
      toolbar.innerHTML = `
        <button class="icon-btn" data-action="open-trash" data-tip="휴지통" aria-label="휴지통">🗑</button>
        <button class="btn" data-action="open-settings">${buttonIcon('⚙', '설정')}</button>
        <button class="btn primary" data-action="new-note">${buttonIcon('＋', '새 메모')}</button>
        ${themeButton}
        <button class="icon-btn" data-action="close" data-tip="닫기" aria-label="닫기">×</button>
      `;
    } else {
      toolbar.innerHTML = `
        <button class="btn" data-action="back">${buttonIcon('←', '목록')}</button>
        ${themeButton}
        <button class="icon-btn" data-action="close" data-tip="닫기" aria-label="닫기">×</button>
      `;
    }
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.data.settings.theme === 'dark' ? 'dark' : 'light';
  }

  async function toggleTheme() {
    state.data.settings.theme = state.data.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    renderTopToolbar();
    try { await saveData(); }
    catch (error) {
      console.error('[OOC Scrapbook] 테마 저장에 실패했습니다.', error);
      toast('테마 설정을 저장하지 못했습니다.', 'error');
    }
  }

  function render() {
    hideTip();
    renderTopToolbar();
    const main = document.getElementById('main-content');
    if (!main) return;
    main.className = `content screen-${state.screen}`;
    if (state.screen === 'list') renderList(main);
    else if (state.screen === 'view') renderViewer(main);
    else if (state.screen === 'edit') renderEditor(main);
    else if (state.screen === 'trash') renderTrash(main);
    else renderSettings(main);
  }

  function renderList(main) {
    const tags = allTags();
    if (state.tagFilter && !['__nosource', '__noooc'].includes(state.tagFilter) && !tags.includes(state.tagFilter)) state.tagFilter = '';
    const settings = state.data.settings;
    const rows = settings.viewMode === 'rows';
    main.innerHTML = `
      <div class="list-tools">
        <div class="search-wrap"><span>⌕</span><input id="list-search" class="field" type="search" placeholder="제목·내용·태그 검색" value="${escapeAttribute(state.search)}"></div>
        <select id="list-tag-filter" class="select field slim" aria-label="필터">
          <option value="">전체</option>
          <option value="__nosource" ${state.tagFilter === '__nosource' ? 'selected' : ''}>출처 없음만</option>
          <option value="__noooc" ${state.tagFilter === '__noooc' ? 'selected' : ''}>말머리 없음만</option>
          ${tags.map((tag) => `<option value="${escapeAttribute(tag)}" ${state.tagFilter === tag ? 'selected' : ''}>#${escapeHtml(tag)}</option>`).join('')}
        </select>
        <select id="list-sort" class="select field slim" aria-label="정렬">
          <option value="recent" ${state.sortMode === 'recent' ? 'selected' : ''}>최신순</option>
          <option value="title" ${state.sortMode === 'title' ? 'selected' : ''}>제목순</option>
          <option value="tag" ${state.sortMode === 'tag' ? 'selected' : ''}>태그순</option>
        </select>
        <select id="list-page-size" class="select field slim" aria-label="페이지당 개수">
          ${PAGE_SIZES.map((size) => `<option value="${size}" ${settings.pageSize === size ? 'selected' : ''}>${size === 0 ? '무제한' : `${size}개씩`}</option>`).join('')}
        </select>
        <button class="icon-btn" data-action="toggle-view" data-tip="${rows ? '그리드 보기로 전환' : '목록 보기로 전환'}" aria-label="${rows ? '그리드 보기로 전환' : '목록 보기로 전환'}">${rows ? '▦' : '☰'}</button>
      </div>
      <div id="memo-list"></div>
    `;
    renderMemoCards();
    // 메모를 보고 돌아온 경우에만 이전 스크롤 위치로 되돌린다.
    // innerHTML 직후에는 레이아웃이 없어 scrollTop이 0으로 잘리므로 강제 리플로우 + rAF로 재시도한다.
    if (state.restoreListScroll) {
      state.restoreListScroll = false;
      const target = state.listScroll;
      if (target > 0) {
        const tryApply = () => {
          void main.scrollHeight;
          main.scrollTop = target;
          return Math.abs(main.scrollTop - target) < 2;
        };
        if (!tryApply()) {
          const raf = globalThis.requestAnimationFrame || ((fn) => setTimeout(fn, 16));
          raf(() => { if (!tryApply()) raf(tryApply); });
        }
      }
    }
  }

  function renderMemoCards() {
    const host = document.getElementById('memo-list');
    if (!host) return;
    const notes = sortedNotes();
    if (!notes.length) {
      const searching = Boolean(state.search.trim());
      host.innerHTML = searching
        ? '<div class="empty"><div><div class="empty-mark">⌕</div><h2>찾은 스크랩이 없어요</h2><p>다른 검색어를 입력해 보세요.</p></div></div>'
        : '<div class="empty"><p class="empty-message">스크랩북이 비어 있습니다.</p></div>';
      return;
    }
    const pageSize = PAGE_SIZES.includes(state.data.settings.pageSize) ? state.data.settings.pageSize : 15;
    const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(notes.length / pageSize)) : 1;
    state.page = Math.min(Math.max(1, state.page), totalPages);
    const pageNotes = pageSize > 0 ? notes.slice((state.page - 1) * pageSize, state.page * pageSize) : notes;
    const rows = state.data.settings.viewMode === 'rows';
    const pagination = totalPages > 1 ? `
      <div class="pagination">
        <button class="icon-btn" data-action="page-nav" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''} aria-label="이전 페이지">‹</button>
        <span>${state.page} / ${totalPages} · ${notes.length.toLocaleString('ko-KR')}개</span>
        <button class="icon-btn" data-action="page-nav" data-page="${state.page + 1}" ${state.page >= totalPages ? 'disabled' : ''} aria-label="다음 페이지">›</button>
      </div>` : '';
    const indexBase = pageSize > 0 ? (state.page - 1) * pageSize : 0; // 페이지가 넘어가도 번호는 이어짐
    host.innerHTML = `<div class="memo-grid ${rows ? 'rows' : ''}">${pageNotes.map((note, i) => {
      const langChips = languages()
        .filter((lang) => noteHasLang(note, lang.code))
        .map((lang) => `<span class="lang-chip">${escapeHtml(langChipText(lang))}</span>`)
        .join('');
      const visibleTags = sortedTags(note.tags);
      const hiddenTagCount = Math.max(0, visibleTags.length - 3);
      const tagChips = visibleTags.slice(0, 3).map((tag) => `<span class="tag-chip${isGroupTag(tag) ? ' group' : ''}">#${escapeHtml(tag)}</span>`).join('')
        + (hiddenTagCount ? `<span class="tag-chip more" data-tip="${escapeAttribute(visibleTags.slice(3).map((tag) => `#${tag}`).join('  '))}">+${hiddenTagCount}</span>` : '');
      return `
        <button class="memo-card" data-action="view-note" data-id="${escapeAttribute(note.id)}">
          <span class="memo-index">${indexBase + i + 1}</span>
          ${tagChips ? `<div class="card-tags">${tagChips}</div>` : ''}
          <h2>${escapeHtml(note.title)}</h2>
          ${rows ? '' : `<p>${escapeHtml(previewText(note))}</p>`}
          <div class="memo-meta">${note.isOriginal ? '<span class="orig-chip" data-tip="자작 메모입니다">자작</span>' : (note.sourceUrl ? '' : '<span class="nosrc-chip" data-tip="출처 링크가 등록되지 않았습니다">출처 없음</span>')}${effectivePrefix(note)
            ? (usesDefaultOoc(note) ? '<span class="ooc-def-chip" data-tip="설정의 디폴트 말머리가 적용됩니다">디폴트 말머리</span>' : '')
            : '<span class="noooc-chip" data-tip="말머리가 등록되지 않았습니다">말머리 없음</span>'}${langChips}<span>${escapeHtml(relativeDate(note.updatedAt))}</span></div>
        </button>`;
    }).join('')}</div>${pagination}`;
  }

  function renderLangTabs(note = null, memoTab = null) {
    return `
      <div class="tabs" role="tablist" aria-label="메모 언어">
        ${languages().map((lang) => {
          const empty = note ? (memoTab ? !tabText(memoTab, lang.code).trim() : !noteHasLang(note, lang.code)) : false;
          return `<button class="tab ${state.activeLang === lang.code ? 'active' : ''}${empty ? ' empty' : ''}" data-action="switch-tab" data-lang="${escapeAttribute(lang.code)}" role="tab" aria-selected="${state.activeLang === lang.code}" ${empty ? 'data-empty="1" aria-disabled="true" data-tip="이 언어에는 내용이 없습니다"' : ''}>${escapeHtml(lang.label)}</button>`;
        }).join('')}
      </div>`;
  }

  function renderMemoTabs(tabs, editing = false) {
    if (tabs.length <= 1 && !editing) return '';
    if (tabs.length <= 1 && editing) {
      return `
      <div class="memo-tabs-row solo">
        <button class="btn memo-tab-add" data-action="add-memo-tab" data-tip="탭 추가" aria-label="탭 추가">＋ 탭 추가</button>
      </div>`;
    }
    const reachedTabLimit = tabs.length >= MAX_MEMO_TABS;
    return `
      <div class="memo-tabs-row">
        <div class="memo-tabs" role="tablist" aria-label="메모 탭">
          ${tabs.map((tab, ti) => {
            const active = tab.id === state.activeMemoTabId;
            const renaming = editing && tab.id === state.renamingMemoTabId;
            return `
              <div class="memo-tab-item ${active ? 'active' : ''}">
                ${renaming
                  ? `<input id="memo-tab-name-inline" class="memo-tab-name-input" data-tab-id="${escapeAttribute(tab.id)}" maxlength="80" aria-label="탭 이름" value="${escapeAttribute(tab.name)}">`
                  : `<button class="memo-tab" data-action="switch-memo-tab" data-tab-id="${escapeAttribute(tab.id)}" role="tab" aria-selected="${active}" data-tip="${escapeAttribute(tab.name)}">${escapeHtml(tab.name)}</button>`}
                ${editing ? `
                  <span class="memo-tab-actions">
                    ${renaming
                      ? `<button class="memo-tab-icon" data-action="confirm-memo-tab-rename" data-tab-id="${escapeAttribute(tab.id)}" data-tip="이름 저장" aria-label="이름 저장">✓</button>
                         <button class="memo-tab-icon" data-action="cancel-memo-tab-rename" data-tip="이름 변경 취소" aria-label="이름 변경 취소">×</button>`
                      : `${tabs.length > 1 ? `<button class="memo-tab-icon" data-action="move-memo-tab" data-tab-id="${escapeAttribute(tab.id)}" data-dir="-1" data-tip="탭 왼쪽으로" aria-label="${escapeAttribute(tab.name)} 왼쪽으로" ${ti === 0 ? 'disabled' : ''}>◀</button>
                         <button class="memo-tab-icon" data-action="move-memo-tab" data-tab-id="${escapeAttribute(tab.id)}" data-dir="1" data-tip="탭 오른쪽으로" aria-label="${escapeAttribute(tab.name)} 오른쪽으로" ${ti === tabs.length - 1 ? 'disabled' : ''}>▶</button>` : ''}
                         <button class="memo-tab-icon" data-action="rename-memo-tab" data-tab-id="${escapeAttribute(tab.id)}" data-tip="탭 이름 바꾸기" aria-label="${escapeAttribute(tab.name)} 이름 바꾸기">✎</button>
                         <button class="memo-tab-icon danger" data-action="delete-memo-tab" data-tab-id="${escapeAttribute(tab.id)}" data-tip="탭 삭제" aria-label="${escapeAttribute(tab.name)} 삭제" ${tabs.length <= 1 ? 'disabled' : ''}>⌫</button>`}
                  </span>` : ''}
              </div>`;
          }).join('')}
        </div>
        ${editing ? `<button class="btn memo-tab-add" data-action="add-memo-tab" data-tip="${reachedTabLimit ? '탭은 최대 4개까지 만들 수 있습니다' : '탭 추가'}" aria-label="${reachedTabLimit ? '탭 최대 개수 도달' : '탭 추가'}" ${reachedTabLimit ? 'disabled' : ''}>＋</button>` : ''}
      </div>`;
  }

  function renderViewer(main) {
    const note = currentNote();
    if (!note) {
      state.screen = 'list';
      render();
      return;
    }
    const memoTab = currentMemoTab(note);
    if (state.activeLang === OOC_TAB) state.activeLang = pickDefaultLang(note, memoTab);
    const content = memoTab ? tabText(memoTab, state.activeLang) : '';
    main.innerHTML = `
      <div class="page-head viewer-head">
        <div class="page-head-main">
          <h2>${escapeHtml(note.title)}</h2><p>수정 ${escapeHtml(formatDate(note.updatedAt, true))}${note.isOriginal ? ' · <span class="orig-text">자작</span>' : (note.sourceUrl ? '' : ' · <span class="nosrc-text">출처 없음</span>')}${effectivePrefix(note) ? '' : ' · <span class="noooc-text">말머리 없음</span>'}</p>
          ${note.tags.length ? `<div class="note-tags">${sortedTags(note.tags).map((tag) => `<span class="tag-chip${isGroupTag(tag) ? ' group' : ''}">#${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
          ${note.sourceUrl ? `<button class="source-link" data-action="copy-source" data-url="${escapeAttribute(note.sourceUrl)}">출처 링크 복사</button>` : ''}
        </div>
        ${renderLangTabs(note, memoTab)}
      </div>
      ${effectivePrefix(note) ? `
      <div class="ooc-block">
        <div class="ooc-block-head"><span class="ooc-label">말머리 · 공통${usesDefaultOoc(note) ? ' <span class="ooc-default-badge">디폴트</span>' : ''}</span><button class="memo-tab-icon" data-action="copy-ooc" data-tip="말머리만 복사" aria-label="말머리만 복사">⧉</button></div>
        <div class="ooc-block-body">${escapeHtml(effectivePrefix(note))}</div>
      </div>` : ''}
      ${renderMemoTabs(note.tabs)}
      <article class="note-paper viewer-note${state.activeLang === 'en' ? ' lang-en' : ''}">${escapeHtml(content)}</article>
      <div class="actions viewer-actions">
        <button class="btn" data-action="edit-note">${buttonIcon('✎', '편집')}</button>
        <button class="btn" data-action="copy-current">${buttonIcon('⧉', '복사')}</button>
        <button class="btn" data-action="open-custom-copy" data-tip="{{user}}·{{char}}를 원하는 이름으로 바꿔서 복사합니다 (시뮬봇용)">${buttonIcon('⇄', '커스텀 복사')}</button>
        <button class="btn blue" data-action="send-current" ${state.sending ? 'disabled' : ''}>${state.sending ? '<span class="spinner"></span><span>전송 중…</span>' : buttonIcon('➤', '채팅에 전송')}</button>
        <span class="spacer"></span>
        <button class="btn danger" data-action="delete-note">${buttonIcon('⌫', '삭제')}</button>
      </div>
      ${state.deleteModalOpen ? `
        <div class="internal-modal-backdrop" data-action="delete-modal-backdrop">
          <section class="internal-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-modal-title" aria-describedby="delete-modal-description">
            <h3 id="delete-modal-title">메모를 삭제할까요?</h3>
            <p id="delete-modal-description">“${escapeHtml(note.title)}”을(를) 휴지통으로 이동합니다. 휴지통에서 언제든 복원할 수 있습니다.</p>
            <div class="actions">
              <button class="btn" data-action="cancel-delete">취소</button>
              <button class="btn danger-fill" data-action="confirm-delete">삭제</button>
            </div>
          </section>
        </div>` : ''}
      ${state.customCopyOpen ? `
        <div class="internal-modal-backdrop" data-action="custom-copy-backdrop">
          <section class="internal-modal" role="dialog" aria-modal="true" aria-labelledby="custom-copy-title">
            <h3 id="custom-copy-title">커스텀 복사</h3>
            <p>본문의 <code>{{user}}</code>·<code>{{char}}</code>를 아래 이름으로 바꿔서 복사합니다. 비워두면 그대로 복사됩니다.</p>
            <div class="custom-copy-fields">
              <div class="form-group">
                <label for="custom-copy-user">{{user}} →</label>
                <input id="custom-copy-user" class="field" maxlength="60" placeholder="바꾸지 않음" value="${escapeAttribute(state.data.settings.customCopy?.user || '')}">
              </div>
              <div class="form-group">
                <label for="custom-copy-char">{{char}} →</label>
                <input id="custom-copy-char" class="field" maxlength="60" placeholder="바꾸지 않음" value="${escapeAttribute(state.data.settings.customCopy?.char || '')}">
              </div>
            </div>
            <div class="actions">
              <button class="btn" data-action="cancel-custom-copy">취소</button>
              <button class="btn primary" data-action="confirm-custom-copy">${buttonIcon('⧉', '복사')}</button>
            </div>
          </section>
        </div>` : ''}
    `;
  }

  function captureDraftFromDOM(captureTabName = true) {
    if (!state.draft) return;
    const title = document.getElementById('note-title');
    const sourceUrl = document.getElementById('note-source-url');
    const memoTabName = document.getElementById('memo-tab-name-inline');
    const content = document.getElementById('note-content');
    if (title) state.draft.title = title.value;
    if (sourceUrl) state.draft.sourceUrl = sourceUrl.value;
    if (captureTabName && memoTabName) {
      const renamedTab = state.draft.tabs.find((tab) => tab.id === memoTabName.dataset.tabId);
      if (renamedTab) renamedTab.name = memoTabName.value;
    }
    const ooc = document.getElementById('note-ooc');
    if (ooc) state.draft.oocPrefix = ooc.value;
    const noDef = document.getElementById('editor-no-default-ooc');
    if (noDef) state.draft.noDefaultOoc = noDef.checked;
    const isOrig = document.getElementById('note-is-original');
    if (isOrig) state.draft.isOriginal = isOrig.checked;
    if (content) {
      const memoTab = currentDraftTab();
      if (memoTab) {
        if (!memoTab.texts || typeof memoTab.texts !== 'object') memoTab.texts = {};
        memoTab.texts[state.activeLang] = content.value;
      }
    }
  }

  function renderEditor(main) {
    if (!state.draft) {
      state.screen = 'list';
      render();
      return;
    }
    const memoTab = currentDraftTab();
    const content = memoTab ? tabText(memoTab, state.activeLang) : '';
    main.innerHTML = `
      <div class="editor-meta-row">
        <div class="form-group">
          <label for="note-title">제목</label>
          <input id="note-title" class="field title-field" maxlength="180" placeholder="제목 없음" value="${escapeAttribute(state.draft.title)}">
        </div>
        <div class="form-group">
          <div class="source-label-row">
            <label for="note-source-url">출처 <span class="hint">(선택)</span></label>
            <label class="orig-check" data-tip="자작 메모로 표시합니다. 출처가 없어도 '출처 없음'으로 표시되지 않습니다."><input type="checkbox" id="note-is-original" ${state.draft.isOriginal ? 'checked' : ''}><span>자작</span></label>
          </div>
          <input id="note-source-url" class="field" type="url" inputmode="url" placeholder="https://example.com" value="${escapeAttribute(state.draft.sourceUrl || '')}">
        </div>
        <div class="form-group">
          <label for="note-tag-input">태그</label>
          <div class="tag-editor-wrap">
            <div id="tag-editor" class="field tag-editor" data-action="focus-tag-input"></div>
            <div id="tag-suggest" class="tag-suggest" hidden></div>
          </div>
        </div>
      </div>
      <div class="form-group ooc-field">
        <label for="note-ooc">말머리 <span class="hint">(탭·언어 공통 — 복사/전송 시 내용 앞에 자동으로 붙음)</span></label>
        <textarea id="note-ooc" class="textarea ooc-textarea" placeholder="(ooc: …) 지시문">${escapeHtml(state.draft.oocPrefix || '')}</textarea>
        ${state.data.settings.defaultOoc?.enabled ? `<label class="ooc-optout" data-tip="이 메모는 말머리를 비워도 디폴트 말머리가 붙지 않습니다"><input type="checkbox" id="editor-no-default-ooc" ${state.draft.noDefaultOoc ? 'checked' : ''}><span>디폴트 말머리 미사용</span></label>` : ''}
      </div>
      ${renderMemoTabs(state.draft.tabs, true)}
      <div class="editor-row">
        <div class="lang-tabs-group">
          ${renderLangTabs()}
          <label class="default-lang-check" data-tip="체크하면 이 메모에서는 전역 우선순위 대신 이 언어를 먼저 표시합니다"><input type="checkbox" id="editor-default-lang" ${state.draft.defaultLang === state.activeLang ? 'checked' : ''}><span>기본 표시</span></label>
        </div>
        ${languages().length > 1 ? `
        <div class="translation-tools">
          <span class="trans-field"><span class="trans-label">출발</span>
            <select id="translate-source" class="select field slim" data-tip="번역할 출발(원본) 언어" aria-label="출발 언어">
              ${languages().filter((lang) => lang.code !== state.activeLang).map((lang) => `<option value="${escapeAttribute(lang.code)}">${escapeHtml(lang.label)}</option>`).join('')}
            </select></span>
          <span class="trans-field"><span class="trans-label">도착</span>
            <span class="trans-target" data-tip="현재 편집 중인 언어 탭으로 번역됩니다">${escapeHtml(langLabel(state.activeLang))}</span></span>
          <button class="btn" data-action="translate" data-tip="출발 언어 → ${escapeAttribute(langLabel(state.activeLang))} 번역" ${state.translating ? 'disabled' : ''}>${state.translating ? '<span class="spinner"></span>' : '번역 →'}</button>
        </div>` : ''}
      </div>
      <textarea id="note-content" class="textarea editor-textarea${state.activeLang === 'en' ? ' lang-en' : ''}">${escapeHtml(content)}</textarea>
      <div class="actions">
        <button class="btn primary" data-action="save-note">${buttonIcon('✓', '저장')}</button>
        <button class="btn" data-action="cancel-edit">취소</button>
      </div>
    `;
    renderTagRow(false);
    setTimeout(() => {
      if (!state.draft?.id && !state.draft?.title) document.getElementById('note-title')?.focus();
      else document.getElementById('note-content')?.focus();
    }, 0);
  }

  function renderSettings(main) {
    const settings = state.data.settings;
    const custom = settings.customApi;
    // 재렌더링 시 스크롤 위치 보존 (설정 항목 변경 후 최상단으로 튀는 문제 방지)
    // innerHTML 교체 직후에는 레이아웃이 없어 scrollTop이 0으로 잘리므로, 강제 리플로우 + rAF로 재시도한다.
    const prevScroll = main.querySelector('.settings-scroll')?.scrollTop || 0;
    const restoreScroll = () => {
      if (!prevScroll) return;
      const tryApply = () => {
        const box = main.querySelector('.settings-scroll');
        if (!box) return false;
        void box.scrollHeight; // 레이아웃 강제 계산
        box.scrollTop = prevScroll;
        return Math.abs(box.scrollTop - prevScroll) < 2;
      };
      if (tryApply()) return;
      const raf = globalThis.requestAnimationFrame || ((fn) => setTimeout(fn, 16));
      raf(() => { if (!tryApply()) raf(() => tryApply()); });
    };
    main.innerHTML = `
      <div class="page-head"><div class="page-head-main"><h2>설정</h2><p>번역 모델, 언어 탭, 데이터 관리를 설정합니다.</p></div></div>
      <div class="settings-scroll">
      <div class="settings-grid">
        <section class="setting-card full">
          <h3>번역 제공자</h3><p>RisuAI의 번역 보조 모델을 사용하거나 OpenAI 호환 API를 직접 연결할 수 있습니다.</p>
          <select id="setting-provider" class="select field">
            <option value="risu" ${settings.provider === 'risu' ? 'selected' : ''}>RisuAI 번역 보조 모델</option>
            <option value="custom" ${settings.provider === 'custom' ? 'selected' : ''}>커스텀 OpenAI 호환 API</option>
          </select>
        </section>
        <section id="custom-api-settings" class="setting-card full" ${settings.provider === 'custom' ? '' : 'hidden'}>
          <h3>커스텀 API 연결</h3><p>OpenAI Chat Completions 호환 엔드포인트를 입력하세요. 커스텀 제공자를 선택했을 때만 사용됩니다.</p>
          <div class="api-fields">
            <div class="form-group"><label for="setting-endpoint">엔드포인트</label><input id="setting-endpoint" class="field" placeholder="https://api.example.com/v1/chat/completions" value="${escapeAttribute(custom.endpoint)}"></div>
            <div class="form-group"><label for="setting-model">모델</label><input id="setting-model" class="field" placeholder="model-name" value="${escapeAttribute(custom.model)}"></div>
            <div class="form-group"><label for="setting-api-key">API 키</label><input id="setting-api-key" class="field" type="password" autocomplete="off" placeholder="sk-…" value="${escapeAttribute(state.localAI.apiKey)}"><div class="hint secret-note">API 키는 동기화되지 않고 이 기기에만 저장됩니다.</div></div>
            <div class="form-group"><label for="setting-temperature">Temperature</label><input id="setting-temperature" class="field" type="number" min="0" max="2" step="0.1" value="${escapeAttribute(custom.temperature)}"></div>
            <div class="form-group"><label for="setting-max-tokens">최대 출력 토큰</label><input id="setting-max-tokens" class="field" type="number" min="64" max="32000" step="1" value="${escapeAttribute(custom.maxTokens)}"></div>
            <div class="form-group"><label for="setting-body-json">추가 Body JSON</label><input id="setting-body-json" class="field" placeholder="{}" value="${escapeAttribute(state.localAI.bodyJson)}"><div class="hint">기본 요청 body에 병합할 선택 설정입니다.</div></div>
          </div>
        </section>
        <section class="setting-card full">
          <h3>번역 프롬프트</h3><p>AI 번역에 사용되는 프롬프트입니다. <code>{{source}}</code>, <code>{{source_language}}</code>, <code>{{target_language}}</code>를 사용할 수 있습니다.</p>
          <textarea id="setting-translation-prompt" class="textarea mini-textarea">${escapeHtml(settings.translationPrompt)}</textarea>
        </section>
        <div class="actions translation-actions">
          <button class="btn primary" data-action="save-settings">${buttonIcon('✓', '번역 설정 저장')}</button>
          <button class="btn" data-action="reset-prompts">기본 프롬프트 복원</button>
        </div>
        <section class="setting-card full">
          <h3>그룹 태그 <span class="auto-badge" data-badge="group-tags">자동 저장</span></h3><p>여기 등록된 태그(예: 분석, 에피소드)는 어느 메모에서든 항상 맨 앞에 정렬되고 다른 색으로 표시됩니다.</p>
          <div class="lang-manage">
            ${groupTagList().length ? groupTagList().map((tag) => `<span class="lang-row">#${escapeHtml(tag)}<button class="danger" data-action="delete-group-tag" data-tag="${escapeAttribute(tag)}" data-tip="그룹 지정 해제" aria-label="${escapeAttribute(tag)} 그룹 지정 해제">×</button></span>`).join('') : '<span class="hint">등록된 그룹 태그가 없습니다.</span>'}
          </div>
          <div class="lang-add">
            <input id="new-group-tag" class="field" maxlength="40" placeholder="예: 분석">
            <button class="btn" data-action="add-group-tag">${buttonIcon('＋', '그룹 태그 추가')}</button>
          </div>
        </section>
        <section class="setting-card full">
          <h3>태그 관리 <span class="auto-badge" data-badge="tags">자동 저장</span></h3><p>태그 이름을 바꾸면 모든 메모에 일괄 반영됩니다(예: 순애 → 달달). ×로 삭제하면 모든 메모에서 제거됩니다. 새 태그를 추가하면 메모 작성 시 자동완성에 나타납니다.</p>
          <div class="tag-manage">
            ${allTags().length ? allTags().map((tag) => `<span class="tag-manage-row${isGroupTag(tag) ? ' group' : ''}"><input class="tag-manage-input" data-tag="${escapeAttribute(tag)}" maxlength="40" value="${escapeAttribute(tag)}" aria-label="${escapeAttribute(tag)} 이름 변경"><button class="tag-manage-del" data-action="delete-tag-global" data-tag="${escapeAttribute(tag)}" data-tip="태그 삭제(모든 메모에서 제거)" aria-label="${escapeAttribute(tag)} 삭제">×</button></span>`).join('') : '<span class="hint">아직 태그가 없습니다.</span>'}
          </div>
          <div class="lang-add">
            <input id="new-managed-tag" class="field" maxlength="40" placeholder="새 태그 이름">
            <button class="btn" data-action="add-managed-tag">${buttonIcon('＋', '태그 추가')}</button>
          </div>
        </section>
        <section class="setting-card full">
          <h3>언어 관리 <span class="auto-badge" data-badge="languages">자동 저장</span></h3><p>왼쪽일수록 우선순위가 높습니다. 메모를 열 때 우선순위 순서대로 내용이 있는 첫 언어 탭이 자동 표시됩니다. '미리보기'는 메모 카드에 표시되는 언어 칩 글자입니다(비우면 기본값). 한국어와 English는 삭제할 수 없습니다.</p>
          <div class="lang-manage">
            ${languages().map((lang, index, list) => {
              const fixed = BASE_LANGUAGES.some((base) => base.code === lang.code);
              return `<span class="lang-row"><b class="lang-rank">${index + 1}</b>${escapeHtml(lang.label)}<span class="lang-chip-label">미리보기</span><input class="lang-chip-input" data-code="${escapeAttribute(lang.code)}" maxlength="6" placeholder="${escapeAttribute(langChipText(lang))}" data-tip="카드 미리보기 칩 글자" aria-label="${escapeAttribute(lang.label)} 미리보기 칩" value="${escapeAttribute(lang.chip || '')}"><button data-action="move-language" data-code="${escapeAttribute(lang.code)}" data-dir="-1" data-tip="우선순위 올리기" aria-label="${escapeAttribute(lang.label)} 우선순위 올리기" ${index === 0 ? 'disabled' : ''}>◀</button><button data-action="move-language" data-code="${escapeAttribute(lang.code)}" data-dir="1" data-tip="우선순위 내리기" aria-label="${escapeAttribute(lang.label)} 우선순위 내리기" ${index === list.length - 1 ? 'disabled' : ''}>▶</button>${fixed ? '' : `<button class="danger" data-action="delete-language" data-code="${escapeAttribute(lang.code)}" data-tip="언어 삭제" aria-label="${escapeAttribute(lang.label)} 삭제">×</button>`}</span>`;
            }).join('')}
          </div>
          <div class="lang-add">
            <input id="new-language-label" class="field" maxlength="20" placeholder="예: 日本語">
            <button class="btn" data-action="add-language">${buttonIcon('＋', '언어 추가')}</button>
          </div>
        </section>
        <section class="setting-card full">
          <h3>디폴트 말머리 <span class="auto-badge" data-badge="default-ooc">자동 저장</span></h3><p>켜면, 말머리가 비어 있는 메모에 아래 문구가 자동으로 붙습니다(복사·전송 시). 개별 메모 편집 화면의 '디폴트 말머리 미사용' 체크로 메모 단위 제외가 가능합니다.</p>
          <label class="ooc-enable-check"><input type="checkbox" id="setting-default-ooc-enabled" ${settings.defaultOoc?.enabled ? 'checked' : ''}><span>디폴트 말머리 사용</span></label>
          <textarea id="setting-default-ooc-text" class="textarea mini-textarea" placeholder="${escapeAttribute(DEFAULT_OOC_TEXT)}" ${settings.defaultOoc?.enabled ? '' : 'disabled'}>${escapeHtml(settings.defaultOoc?.text || '')}</textarea>
          <div class="hint">사용을 켠 뒤 이 칸을 비워두면 아래 기본 문구가 자동으로 채워집니다:<br>“${escapeHtml(DEFAULT_OOC_TEXT)}”</div>
        </section>
        <section class="setting-card full">
          <h3>버튼 표시 위치 <span class="auto-badge" data-badge="placement">자동 저장</span></h3><p>플러그인을 여는 버튼을 어디에 표시할지 정합니다. 선택하면 즉시 적용됩니다. '없음'으로 두어도 Risu 설정 메뉴의 'ooc scrapbook' 항목으로 열 수 있습니다.</p>
          <div class="tabs placement-chips" role="group" aria-label="버튼 표시 위치">
            ${Object.entries(BUTTON_PLACEMENT_LABELS).map(([value, label]) => `<button class="tab ${currentPlacement() === Number(value) ? 'active' : ''}" data-action="set-placement" data-value="${value}" aria-pressed="${currentPlacement() === Number(value)}">${escapeHtml(label)}</button>`).join('')}
          </div>
        </section>
        <section class="setting-card full">
          <h3>데이터 관리</h3><p>데이터를 JSON 파일로 백업하거나 복원합니다.</p>
          <div class="data-actions">
            <button class="btn" data-action="export-json">JSON 내보내기</button>
            <button class="btn" data-action="choose-import-json">JSON 불러오기</button>
          </div>
          <input id="scrapbook-import-file" type="file" accept="application/json,.json" hidden>
        </section>
      </div>
      </div>
      ${state.importCandidate ? `
        <div class="internal-modal-backdrop" data-action="import-modal-backdrop">
          <section class="internal-modal" role="alertdialog" aria-modal="true" aria-labelledby="import-modal-title" aria-describedby="import-modal-description">
            <h3 id="import-modal-title">JSON 백업을 불러올까요?</h3>
            <p id="import-modal-description">현재 스크랩북을 백업의 메모 ${state.importCandidate.notes.length.toLocaleString('ko-KR')}개와 설정으로 교체합니다.</p>
            <div class="actions">
              <button class="btn" data-action="cancel-import">취소</button>
              <button class="btn primary" data-action="confirm-import">불러오기</button>
            </div>
          </section>
        </div>` : ''}
    `;
    restoreScroll();
  }

  function renderTrash(main) {
    const notes = trashedNotes();
    main.innerHTML = `
      <div class="page-head">
        <div class="page-head-main"><h2>휴지통</h2><p>${notes.length ? `${notes.length.toLocaleString('ko-KR')}개의 메모가 보관되어 있습니다.` : '삭제한 메모가 여기에 보관됩니다.'}</p></div>
        ${notes.length ? `<button class="btn danger" data-action="purge-all">${buttonIcon('⌫', '전체 비우기')}</button>` : ''}
      </div>
      ${notes.length ? `<div class="trash-list">${notes.map((note) => `
        <div class="trash-row">
          <div class="trash-main">
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(formatDate(note.deletedAt, true))} 삭제 · ${escapeHtml(previewText(note).slice(0, 80))}</p>
          </div>
          <button class="btn" data-action="restore-note" data-id="${escapeAttribute(note.id)}">복원</button>
          <button class="btn danger" data-action="purge-note" data-id="${escapeAttribute(note.id)}">영구 삭제</button>
        </div>`).join('')}</div>`
      : '<div class="empty"><div><div class="empty-mark">🗑</div><h2>휴지통이 비어 있어요</h2><p class="empty-message">메모를 삭제하면 여기로 이동합니다.</p></div></div>'}
    `;
  }

  function exportScrapbookJSON() {
    const payload = {
      format: `ooc scrapbook v${PLUGIN_VERSION}`,
      version: PLUGIN_VERSION,
      exportedAt: new Date().toISOString(),
      data: state.data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const now = new Date();
    const p2 = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())} ${p2(now.getHours())}-${p2(now.getMinutes())}-${p2(now.getSeconds())}`;
    anchor.download = `ooc scrapbook v${PLUGIN_VERSION} backup ${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('스크랩북 JSON을 내보냈습니다.', 'success');
  }

  async function prepareImportJSON(file) {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) throw new Error('JSON 파일은 20MB 이하여야 합니다.');
    let parsed;
    try { parsed = JSON.parse(await file.text()); }
    catch (error) { throw new Error(`JSON 파일을 읽지 못했습니다: ${error.message}`); }
    const source = typeof parsed?.format === 'string' && parsed.format.toLowerCase().startsWith('ooc scrapbook') && parsed?.data ? parsed.data : parsed;
    if (!source || typeof source !== 'object' || !Array.isArray(source.notes)) {
      throw new Error('OOC Scrapbook 백업 JSON 형식이 아닙니다.');
    }
    state.importCandidate = normalizeData(source);
    renderSettings(document.getElementById('main-content'));
  }

  async function confirmImportJSON() {
    if (!state.importCandidate) return;
    const count = state.importCandidate.notes.length;
    state.data = state.importCandidate;
    state.importCandidate = null;
    state.loadFailed = false; // 백업으로 복구했으므로 저장 잠금 해제
    await saveData();
    applyTheme();
    renderTopToolbar();
    renderSettings(document.getElementById('main-content'));
    toast(`메모 ${count.toLocaleString('ko-KR')}개를 불러왔습니다.`, 'success');
  }

  function openEditor(note) {
    state.draft = note
      ? {
          id: note.id,
          title: note.title,
          tabs: note.tabs.map((tab) => ({ ...tab, texts: { ...(tab.texts || {}) } })),
          sourceUrl: note.sourceUrl || '',
          isOriginal: note.isOriginal === true,
          createdAt: note.createdAt,
          tags: [...(note.tags || [])],
          oocPrefix: note.oocPrefix || '',
          noDefaultOoc: note.noDefaultOoc === true,
          defaultLang: note.defaultLang || '',
        }
      : { id: null, title: '', tabs: [createDefaultMemoTab(0, false)], sourceUrl: '', isOriginal: false, createdAt: Date.now(), tags: [], oocPrefix: '', noDefaultOoc: false, defaultLang: '' };
    state.selectedId = note?.id || null;
    state.activeMemoTabId = state.draft.tabs[0].id;
    state.renamingMemoTabId = null;
    state.renamingMemoTabOriginalName = null;
    state.activeLang = note ? pickDefaultLang(note, note.tabs[0]) : (languages()[0]?.code || 'ko');
    state.screen = 'edit';
    render();
  }

  function addDraftMemoTab() {
    if (!state.draft) return;
    if (state.draft.tabs.length >= MAX_MEMO_TABS) {
      toast('탭은 최대 4개까지 만들 수 있습니다.', 'error');
      return;
    }
    captureDraftFromDOM();
    if (state.draft.tabs.length === 1 && !String(state.draft.tabs[0].name || '').trim()) {
      state.draft.tabs[0].name = '탭 1';
    }
    const tab = createDefaultMemoTab(state.draft.tabs.length);
    state.draft.tabs.push(tab);
    state.activeMemoTabId = tab.id;
    state.renamingMemoTabId = tab.id;
    state.renamingMemoTabOriginalName = tab.name;
    render();
    setTimeout(() => document.getElementById('memo-tab-name-inline')?.select(), 0);
  }

  function moveDraftMemoTab(tabId, dir) {
    if (!state.draft || !Number.isFinite(dir)) return;
    captureDraftFromDOM();
    const tabs = state.draft.tabs;
    const idx = tabs.findIndex((tab) => tab.id === tabId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= tabs.length) return;
    [tabs[idx], tabs[swap]] = [tabs[swap], tabs[idx]];
    state.renamingMemoTabId = null;
    state.renamingMemoTabOriginalName = null;
    render();
  }

  function beginDraftMemoTabRename(tabId) {
    if (!state.draft?.tabs.some((tab) => tab.id === tabId)) return;
    captureDraftFromDOM();
    state.activeMemoTabId = tabId;
    state.renamingMemoTabId = tabId;
    state.renamingMemoTabOriginalName = state.draft.tabs.find((tab) => tab.id === tabId)?.name || '';
    render();
    setTimeout(() => document.getElementById('memo-tab-name-inline')?.select(), 0);
  }

  function confirmDraftMemoTabRename() {
    if (!state.draft || !state.renamingMemoTabId) return;
    captureDraftFromDOM();
    const index = state.draft.tabs.findIndex((tab) => tab.id === state.renamingMemoTabId);
    if (index >= 0) {
      const tab = state.draft.tabs[index];
      tab.name = String(tab.name || '').trim() || `탭 ${index + 1}`;
    }
    state.renamingMemoTabId = null;
    state.renamingMemoTabOriginalName = null;
    render();
  }

  function cancelDraftMemoTabRename() {
    if (!state.draft || !state.renamingMemoTabId) return;
    captureDraftFromDOM(false);
    const tab = state.draft.tabs.find((item) => item.id === state.renamingMemoTabId);
    if (tab && state.renamingMemoTabOriginalName !== null) tab.name = state.renamingMemoTabOriginalName;
    state.renamingMemoTabId = null;
    state.renamingMemoTabOriginalName = null;
    render();
  }

  function deleteDraftMemoTab(tabId = state.activeMemoTabId) {
    if (!state.draft || state.draft.tabs.length <= 1) return;
    captureDraftFromDOM();
    const index = state.draft.tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) return;
    state.draft.tabs.splice(index, 1);
    if (state.activeMemoTabId === tabId) {
      state.activeMemoTabId = state.draft.tabs[Math.min(index, state.draft.tabs.length - 1)].id;
    }
    state.renamingMemoTabId = null;
    state.renamingMemoTabOriginalName = null;
    render();
  }

  async function saveNote() {
    captureDraftFromDOM();
    const draft = state.draft;
    if (!draft) return;
    const pendingTag = document.getElementById('note-tag-input')?.value;
    if (pendingTag && pendingTag.trim()) addDraftTag(pendingTag);
    const tabs = draft.tabs.map((tab, index) => normalizeMemoTab({
      ...tab,
      name: String(tab.name || '').trim(),
      texts: Object.fromEntries(Object.entries(tab.texts || {}).map(([code, text]) => [code, String(text || '').trimEnd()])),
    }, index));
    const oocPrefix = String(draft.oocPrefix || '').trim();
    const fallbackContent = tabs.flatMap((tab) => Object.values(tab.texts)).find((part) => part.trim()) || '';
    if (!fallbackContent && !oocPrefix) {
      toast('내용을 입력해 주세요.', 'error');
      return;
    }
    const fallbackTitle = (fallbackContent || oocPrefix).trim().split(/\r?\n/)[0].slice(0, 60);
    let sourceUrl;
    try { sourceUrl = validateSourceUrl(draft.sourceUrl); }
    catch (error) { toast(String(error?.message || error), 'error'); return; }
    const note = normalizeNote({
      id: draft.id || makeId(),
      title: String(draft.title || '').trim() || fallbackTitle || '제목 없음',
      tabs,
      tags: draft.tags || [],
      oocPrefix,
      noDefaultOoc: draft.noDefaultOoc === true,
      defaultLang: draft.defaultLang || '',
      sourceUrl,
      isOriginal: draft.isOriginal === true,
      createdAt: draft.createdAt,
      updatedAt: Date.now(),
    });
    const index = state.data.notes.findIndex((item) => item.id === note.id);
    if (index >= 0) state.data.notes[index] = note;
    else state.data.notes.push(note);
    await saveData();
    state.selectedId = note.id;
    state.activeMemoTabId = note.tabs.some((tab) => tab.id === state.activeMemoTabId)
      ? state.activeMemoTabId
      : note.tabs[0].id;
    state.draft = null;
    state.renamingMemoTabId = null;
    state.renamingMemoTabOriginalName = null;
    state.screen = 'view';
    render();
    toast('저장했습니다.', 'success');
  }

  async function deleteCurrentNote() {
    const note = currentNote();
    if (!note) return;
    note.deletedAt = Date.now();
    await saveData();
    state.deleteModalOpen = false;
    state.selectedId = null;
    state.activeMemoTabId = null;
    state.restoreListScroll = true;
    state.renamingMemoTabId = null;
    state.renamingMemoTabOriginalName = null;
    state.screen = 'list';
    render();
    toast('휴지통으로 이동했습니다.', 'success');
  }

  async function copyText(text) {
    let clipboardError = null;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        clipboardError = error;
        console.warn('[OOC Scrapbook] Clipboard API 복사 실패, 대체 방식을 시도합니다.', error);
      }
    }
    const activeElement = document.activeElement;
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.left = '-9999px';
    helper.style.top = '0';
    helper.style.opacity = '0.01';
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    helper.setSelectionRange(0, helper.value.length);
    // execCommand는 text/plain과 text/html을 함께 올려서, 붙여넣는 쪽이 서식을 따라갈 수 있다.
    // 복사 이벤트를 가로채 평문만 기록한다.
    const onCopy = (event) => {
      try {
        const cd = event.clipboardData;
        if (!cd) return;
        cd.clearData();
        cd.setData('text/plain', text);
        event.preventDefault();
      } catch (error) {
        console.warn('[OOC Scrapbook] 평문 강제에 실패했습니다.', error);
      }
    };
    document.addEventListener('copy', onCopy, true);
    try {
      const copied = typeof document.execCommand === 'function' && document.execCommand('copy');
      if (!copied) throw clipboardError || new Error('브라우저가 클립보드 복사를 허용하지 않았습니다.');
    } finally {
      document.removeEventListener('copy', onCopy, true);
      helper.remove();
      if (activeElement && typeof activeElement.focus === 'function') activeElement.focus();
    }
  }

  // 디폴트 말머리로 실제 적용되는 문구. 사용이 켜져 있고 칸이 비어 있으면 기본 문구가 쓰인다.
  function defaultOocText() {
    const def = state.data?.settings?.defaultOoc;
    if (!def?.enabled) return '';
    return String(def.text || '').trim() || DEFAULT_OOC_TEXT;
  }

  // 실제 적용되는 말머리: 메모에 있으면 그것, 없으면 (기능 켜짐+미사용 아님) 디폴트 말머리
  function effectivePrefix(note) {
    const own = String(note?.oocPrefix || '').trim();
    if (own) return own;
    if (note?.noDefaultOoc) return '';
    return defaultOocText();
  }

  function usesDefaultOoc(note) {
    return !String(note?.oocPrefix || '').trim() && !note?.noDefaultOoc && Boolean(defaultOocText());
  }

  function composeOutput(note, memoTab) {
    const prefix = effectivePrefix(note);
    const body = memoTab ? tabText(memoTab, state.activeLang) : '';
    return prefix && body.trim() ? `${prefix}\n\n${body}` : body;
  }

  // {{user}}/{{char}} 치환. 값이 비어 있으면 해당 매크로는 그대로 둔다.
  function applyCustomNames(text, userName, charName) {
    let out = String(text ?? '');
    if (userName) out = out.replace(/\{\{\s*user\s*\}\}/gi, userName);
    if (charName) out = out.replace(/\{\{\s*char\s*\}\}/gi, charName);
    return out;
  }

  async function runCustomCopy() {
    const note = currentNote();
    if (!note) return;
    const userName = String(document.getElementById('custom-copy-user')?.value || '').trim();
    const charName = String(document.getElementById('custom-copy-char')?.value || '').trim();
    // 다음에도 같은 이름을 쓰는 경우가 많으므로 기억해 둔다.
    state.data.settings.customCopy = { user: userName, char: charName };
    try { await saveData(); } catch (error) { console.warn('[OOC Scrapbook] 커스텀 복사 설정 저장 실패', error); }

    const memoTab = currentMemoTab(note);
    const content = applyCustomNames(composeOutput(note, memoTab), userName, charName);
    if (!content.trim()) {
      toast('비어 있습니다.', 'error');
      return;
    }
    try {
      await copyText(content);
      state.customCopyOpen = false;
      renderViewer(document.getElementById('main-content'));
      const changed = [userName && `{{user}}→${userName}`, charName && `{{char}}→${charName}`].filter(Boolean).join(', ');
      toast(changed ? `복사했습니다. (${changed})` : '복사했습니다. (치환 없음)', 'success');
    } catch (error) {
      console.error('[OOC Scrapbook] 복사에 실패했습니다.', error);
      toast('클립보드 복사에 실패했습니다.', 'error');
    }
  }

  async function copyCurrentLanguage() {
    const note = currentNote();
    if (!note) return;
    const memoTab = currentMemoTab(note);
    const content = composeOutput(note, memoTab);
    if (!content.trim()) {
      toast('비어 있습니다.', 'error');
      return;
    }
    try {
      await copyText(content);
      toast('복사했습니다.', 'success');
    } catch (error) {
      console.error('[OOC Scrapbook] 복사에 실패했습니다.', error);
      toast('클립보드 복사에 실패했습니다.', 'error');
    }
  }

  async function sendCurrentLanguage() {
    if (state.sending) return;
    const note = currentNote();
    if (!note) return;
    const memoTab = currentMemoTab(note);
    const content = composeOutput(note, memoTab);
    if (!content.trim()) {
      toast('내용이 비어 있습니다.', 'error');
      return;
    }
    state.sending = true;
    renderViewer(document.getElementById('main-content'));
    try {
      const characterIndex = await api.getCurrentCharacterIndex();
      const chatIndex = await api.getCurrentChatIndex();
      if (!Number.isInteger(characterIndex) || characterIndex < 0 || !Number.isInteger(chatIndex) || chatIndex < 0) {
        throw new Error('현재 채팅을 찾을 수 없습니다.');
      }
      const chat = await api.getChatFromIndex(characterIndex, chatIndex);
      if (!chat || typeof chat !== 'object') throw new Error('현재 채팅 데이터를 불러오지 못했습니다.');
      const now = Date.now();
      chat.message = Array.isArray(chat.message) ? [...chat.message] : [];
      chat.message.push({ role: 'user', data: content, time: now, chatId: makeId() });
      chat.lastDate = now;
      await api.setChatToIndex(characterIndex, chatIndex, chat);
      toast('선택된 언어의 내용을 현재 채팅에 추가했습니다.', 'success');
    } catch (error) {
      console.error('[OOC Scrapbook] 채팅 전송에 실패했습니다.', error);
      toast(String(error?.message || '채팅 전송에 실패했습니다.'), 'error');
    } finally {
      state.sending = false;
      if (state.screen === 'view') renderViewer(document.getElementById('main-content'));
    }
  }

  async function copySourceLink(value) {
    const url = normalizeStoredSourceUrl(value);
    if (!url) {
      toast('링크가 올바르지 않습니다.', 'error');
      return;
    }
    try {
      await copyText(url);
      toast('링크를 복사했습니다.', 'success');
    } catch (error) {
      console.error('[OOC Scrapbook] 링크 복사에 실패했습니다.', error);
      toast('링크를 복사하지 못했습니다.', 'error');
    }
  }

  function parseJSONObject(value, label) {
    const text = String(value || '').trim();
    if (!text) return {};
    let parsed;
    try { parsed = JSON.parse(text); } catch (error) {
      throw new Error(`${label} JSON 형식이 올바르지 않습니다: ${error.message}`);
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${label}는 JSON 객체여야 합니다.`);
    return parsed;
  }

  function validateEndpoint(value) {
    const endpoint = String(value || '').trim();
    if (!endpoint) throw new Error('커스텀 API 엔드포인트를 설정해 주세요.');
    let url;
    try { url = new URL(endpoint); } catch { throw new Error('엔드포인트 URL 형식이 올바르지 않습니다.'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('엔드포인트는 HTTP 또는 HTTPS 주소여야 합니다.');
    return url.toString();
  }

  function extractAIText(value, seen = new Set(), depth = 0) {
    if (typeof value === 'string') return value;
    if (value == null || typeof value !== 'object' || depth > 10 || seen.has(value)) return '';
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => extractAIText(item, seen, depth + 1)).filter(Boolean).join('\n');
    }

    const priorityKeys = [
      'content', 'text', 'output_text', 'result', 'response', 'message',
      'data', 'output', 'completion', 'generated_text', 'choices', 'candidates',
    ];
    for (const key of priorityKeys) {
      if (!(key in value)) continue;
      const extracted = extractAIText(value[key], seen, depth + 1);
      if (extracted) return extracted;
    }
    return '';
  }

  function extractCustomAPIText(data) {
    return extractAIText(data);
  }

  async function normalizeAIResponse(response) {
    if (typeof response === 'string') return response;
    if (response?.success === false) {
      const detail = extractAIText(response.error) || extractAIText(response.message);
      throw new Error(detail || '번역 모델 요청에 실패했습니다.');
    }
    const stream = response?.getReader ? response : response?.content?.getReader ? response.content : null;
    if (stream) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let output = '';
      while (true) {
        const item = await reader.read();
        if (item.done) break;
        output += typeof item.value === 'string' ? item.value : decoder.decode(item.value, { stream: true });
      }
      output += decoder.decode();
      return output;
    }
    if (response == null) return '';
    const extracted = extractAIText(response);
    if (extracted) return extracted;
    console.error('[OOC Scrapbook] 해석할 수 없는 번역 응답:', response);
    throw new Error('번역 응답에서 텍스트를 찾지 못했습니다. 개발자 콘솔에서 응답 형식을 확인해 주세요.');
  }

  function buildTranslationPrompt(sourceCode, targetCode, source) {
    const template = state.data.settings.translationPrompt;
    const sourceLanguage = promptLanguageName(sourceCode);
    const targetLanguage = promptLanguageName(targetCode);
    let prompt = template
      .replace(/\{\{source_language\}\}/g, sourceLanguage)
      .replace(/\{\{target_language\}\}/g, targetLanguage);
    if (/\{\{source\}\}/.test(prompt)) prompt = prompt.replace(/\{\{source\}\}/g, () => source);
    else prompt += `\n\n${source}`;
    return prompt;
  }

  async function callCustomAPI(messages) {
    const config = state.data.settings.customApi;
    const endpoint = validateEndpoint(config.endpoint);
    const extraBody = parseJSONObject(state.localAI.bodyJson, '추가 Body');
    const headers = { 'Content-Type': 'application/json' };
    if (state.localAI.apiKey) headers.Authorization = `Bearer ${state.localAI.apiKey}`;
    const response = await api.nativeFetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        stream: false,
        temperature: Number(config.temperature),
        max_tokens: Number(config.maxTokens),
        ...(config.model ? { model: config.model } : {}),
        ...extraBody,
      }),
    });
    const rawText = await response.text();
    if (!response.ok) throw new Error(`API 오류 ${response.status}: ${rawText.slice(0, 400) || response.statusText || '요청 실패'}`);
    let parsed;
    try { parsed = JSON.parse(rawText); } catch { parsed = rawText; }
    const result = extractCustomAPIText(parsed);
    if (!result) throw new Error('API 응답에서 번역문을 찾지 못했습니다.');
    return result;
  }

  async function translateDraft() {
    if (state.translating || !state.draft) return;
    captureDraftFromDOM();
    const memoTab = currentDraftTab();
    if (!memoTab) return;
    const sourceKey = document.getElementById('translate-source')?.value || '';
    const targetKey = state.activeLang;
    if (!sourceKey || sourceKey === targetKey) return;
    const source = String(tabText(memoTab, sourceKey)).trim();
    if (!source) {
      toast(`${langLabel(sourceKey)} 내용이 비어 있습니다.`, 'error');
      return;
    }
    if (String(tabText(memoTab, targetKey)).trim() && !globalThis.confirm('현재 언어 탭의 기존 내용을 번역문으로 덮어쓸까요?')) return;

    state.translating = `${sourceKey}-${targetKey}`;
    render();
    try {
      const messages = [
        { role: 'system', content: 'You are a precise bilingual translation engine. Follow the user instructions exactly and return only the translated text.' },
        { role: 'user', content: buildTranslationPrompt(sourceKey, targetKey, source) },
      ];
      const response = state.data.settings.provider === 'custom'
        ? await callCustomAPI(messages)
        : await api.runLLMModel({ messages, mode: 'translate', allowPlugins: true });
      const translated = (await normalizeAIResponse(response)).trim()
        .replace(/^```(?:text|markdown|md)?\s*/i, '')
        .replace(/\s*```$/i, '');
      if (!translated) throw new Error('번역 모델이 빈 응답을 반환했습니다.');
      memoTab.texts[targetKey] = translated;
      state.activeLang = targetKey;
      toast('번역이 완료되었습니다. 저장 전에 결과를 확인해 주세요.', 'success');
    } catch (error) {
      console.error('[OOC Scrapbook] 번역에 실패했습니다.', error);
      toast(`번역 실패: ${String(error?.message || error)}`, 'error');
    } finally {
      state.translating = '';
      if (state.screen === 'edit') render();
    }
  }

  async function saveSettings() {
    try {
      const provider = document.getElementById('setting-provider')?.value === 'custom' ? 'custom' : 'risu';
      const translationPrompt = document.getElementById('setting-translation-prompt')?.value.trim();
      const endpoint = document.getElementById('setting-endpoint')?.value.trim() || '';
      const model = document.getElementById('setting-model')?.value.trim() || '';
      const temperature = Number(document.getElementById('setting-temperature')?.value);
      const maxTokens = Number(document.getElementById('setting-max-tokens')?.value);
      const apiKey = document.getElementById('setting-api-key')?.value || '';
      const bodyJson = document.getElementById('setting-body-json')?.value.trim() || '{}';
      if (!translationPrompt) throw new Error('번역 프롬프트를 입력해 주세요.');
      if (!Number.isFinite(temperature) || temperature < 0 || temperature > 2) throw new Error('Temperature는 0~2 사이여야 합니다.');
      if (!Number.isFinite(maxTokens) || maxTokens < 64 || maxTokens > 32000) throw new Error('최대 출력 토큰은 64~32000 사이여야 합니다.');
      parseJSONObject(bodyJson, '추가 Body');
      if (provider === 'custom') validateEndpoint(endpoint);

      state.data.settings = {
        ...state.data.settings,
        theme: state.data.settings.theme === 'dark' ? 'dark' : 'light',
        provider,
        translationPrompt,
        customApi: { endpoint, model, temperature, maxTokens: Math.floor(maxTokens) },
      };
      state.localAI = { apiKey, bodyJson };
      await Promise.all([saveData(), saveLocalAISettings()]);
      toast('번역 설정을 저장했습니다.', 'success');
    } catch (error) {
      toast(String(error?.message || error), 'error');
    }
  }

  function goBack() {
    state.deleteModalOpen = false;
    state.customCopyOpen = false;
    state.importCandidate = null;
    if (state.screen === 'edit') {
      state.draft = null;
      state.renamingMemoTabId = null;
      state.renamingMemoTabOriginalName = null;
      state.screen = state.selectedId ? 'view' : 'list';
    } else {
      state.screen = 'list';
      state.selectedId = null;
      state.activeMemoTabId = null;
      state.restoreListScroll = true;
    }
    render();
  }

  function bindEvents() {
    if (state.eventsBound) return;
    state.eventsBound = true;

    document.body.addEventListener('mouseover', (event) => {
      const t = event.target.closest?.('[data-tip]');
      if (t) showTip(t); else hideTip();
    });
    document.body.addEventListener('mouseout', (event) => {
      if (event.target.closest?.('[data-tip]')) hideTip();
    });
    window.addEventListener('scroll', hideTip, true);

    // 텍스트를 드래그하다 배경에서 손을 떼면 click이 배경(공통 조상)에서 발생해 창이 닫히는 문제가 있다.
    // 눌리기 시작한 지점을 기억해 두고, 배경에서 눌러 배경에서 뗀 경우에만 닫기로 처리한다.
    document.addEventListener('pointerdown', (event) => { state.pressTarget = event.target; }, true);
    const isBackdropClick = (event, target) => event.target === target && state.pressTarget === target;

    document.body.addEventListener('click', async (event) => {
      if (!event.target.closest('.tag-editor-wrap')) {
        const suggest = document.getElementById('tag-suggest');
        if (suggest && !suggest.hidden) {
          suggest.hidden = true;
          state.tagSuggestIndex = -1;
        }
      }
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'backdrop-close' && isBackdropClick(event, target)) await api.hideContainer();
      else if (action === 'close') await api.hideContainer();
      else if (action === 'new-note') openEditor(null);
      else if (action === 'toggle-theme') await toggleTheme();
      else if (action === 'open-settings') { state.screen = 'settings'; render(); }
      else if (action === 'open-trash') { state.screen = 'trash'; render(); }
      else if (action === 'restore-note') {
        const note = state.data.notes.find((item) => item.id === target.dataset.id);
        if (!note) return;
        note.deletedAt = null;
        await saveData();
        renderTrash(document.getElementById('main-content'));
        toast('복원했습니다.', 'success');
      }
      else if (action === 'purge-note') {
        if (!globalThis.confirm('이 메모를 영구 삭제할까요? 되돌릴 수 없습니다.')) return;
        state.data.notes = state.data.notes.filter((item) => item.id !== target.dataset.id);
        await saveData();
        renderTrash(document.getElementById('main-content'));
        toast('영구 삭제했습니다.', 'success');
      }
      else if (action === 'purge-all') {
        if (!globalThis.confirm('휴지통을 비울까요? 모든 항목이 영구 삭제되며 되돌릴 수 없습니다.')) return;
        state.data.notes = state.data.notes.filter((item) => !item.deletedAt);
        await saveData();
        renderTrash(document.getElementById('main-content'));
        toast('휴지통을 비웠습니다.', 'success');
      }
      else if (action === 'back' || action === 'cancel-edit') goBack();
      else if (action === 'view-note') {
        // 목록으로 돌아왔을 때 같은 위치를 보여주기 위해 현재 스크롤을 기억한다.
        state.listScroll = document.getElementById('main-content')?.scrollTop || 0;
        state.selectedId = target.dataset.id;
        const viewNote = currentNote();
        state.activeMemoTabId = viewNote?.tabs?.[0]?.id || null;
        state.activeLang = viewNote ? pickDefaultLang(viewNote, viewNote.tabs[0]) : 'ko';
        state.screen = 'view';
        render();
      } else if (action === 'switch-tab') {
        if (target.dataset.empty) return;
        if (state.screen === 'edit') captureDraftFromDOM();
        state.activeLang = target.dataset.lang || 'ko';
        render();
      } else if (action === 'switch-memo-tab') {
        if (state.screen === 'edit') captureDraftFromDOM();
        state.renamingMemoTabId = null;
        state.renamingMemoTabOriginalName = null;
        state.activeMemoTabId = target.dataset.tabId || null;
        if (state.screen === 'view') {
          const viewNote = currentNote();
          const memoTab = currentMemoTab(viewNote);
          if (viewNote && memoTab && !tabText(memoTab, state.activeLang).trim()) {
            state.activeLang = pickDefaultLang(viewNote, memoTab);
          }
        }
        render();
      } else if (action === 'add-memo-tab') {
        addDraftMemoTab();
      } else if (action === 'rename-memo-tab') {
        beginDraftMemoTabRename(target.dataset.tabId);
      } else if (action === 'confirm-memo-tab-rename') {
        confirmDraftMemoTabRename();
      } else if (action === 'cancel-memo-tab-rename') {
        cancelDraftMemoTabRename();
      } else if (action === 'delete-memo-tab') {
        deleteDraftMemoTab(target.dataset.tabId);
      } else if (action === 'move-memo-tab') {
        moveDraftMemoTab(target.dataset.tabId, Number(target.dataset.dir));
      } else if (action === 'edit-note') openEditor(currentNote());
      else if (action === 'save-note') await saveNote();
      else if (action === 'delete-note') {
        state.deleteModalOpen = true;
        renderViewer(document.getElementById('main-content'));
      }
      else if (action === 'cancel-delete') {
        state.deleteModalOpen = false;
        renderViewer(document.getElementById('main-content'));
      }
      else if (action === 'delete-modal-backdrop' && isBackdropClick(event, target)) {
        state.deleteModalOpen = false;
        renderViewer(document.getElementById('main-content'));
      }
      else if (action === 'confirm-delete') await deleteCurrentNote();
      else if (action === 'copy-current') await copyCurrentLanguage();
      else if (action === 'open-custom-copy') {
        state.customCopyOpen = true;
        renderViewer(document.getElementById('main-content'));
        setTimeout(() => document.getElementById('custom-copy-user')?.focus(), 0);
      }
      else if (action === 'cancel-custom-copy' || (action === 'custom-copy-backdrop' && isBackdropClick(event, target))) {
        state.customCopyOpen = false;
        renderViewer(document.getElementById('main-content'));
      }
      else if (action === 'confirm-custom-copy') await runCustomCopy();
      else if (action === 'copy-ooc') {
        const note = currentNote();
        const prefix = String(note?.oocPrefix || '').trim();
        if (!prefix) return;
        try { await copyText(prefix); toast('말머리를 복사했습니다.', 'success'); }
        catch { toast('클립보드 복사에 실패했습니다.', 'error'); }
      }
      else if (action === 'send-current') await sendCurrentLanguage();
      else if (action === 'copy-source') await copySourceLink(target.dataset.url);
      else if (action === 'translate') await translateDraft();
      else if (action === 'remove-tag') removeDraftTag(target.dataset.tag);
      else if (action === 'pick-tag') addDraftTag(target.dataset.tag);
      else if (action === 'focus-tag-input') {
        document.getElementById('note-tag-input')?.focus();
        renderTagSuggestions();
      }
      else if (action === 'toggle-view') {
        state.data.settings.viewMode = state.data.settings.viewMode === 'rows' ? 'grid' : 'rows';
        await saveData();
        renderList(document.getElementById('main-content'));
      }
      else if (action === 'page-nav') {
        state.page = Number(target.dataset.page) || 1;
        renderMemoCards();
      }
      else if (action === 'add-language') {
        const input = document.getElementById('new-language-label');
        const label = String(input?.value || '').trim();
        if (!label) { toast('추가할 언어 이름을 입력해 주세요.', 'error'); return; }
        if (languages().some((lang) => lang.label === label)) { toast('이미 있는 언어입니다.', 'error'); return; }
        state.data.settings.languages.push({ code: languageCodeForLabel(label), label });
        await saveData();
        renderSettings(document.getElementById('main-content'));
        flashAutoBadge('languages');
        toast(`'${label}' 언어 탭을 추가했습니다.`, 'success');
      }
      else if (action === 'set-placement') {
        const value = Number(target.dataset.value);
        if (!Object.prototype.hasOwnProperty.call(BUTTON_PLACEMENTS, value)) return;
        state.data.settings.buttonPlacement = value;
        // 전체 재렌더링 없이 칩 상태만 갱신 → 스크롤 위치가 전혀 흔들리지 않음
        for (const chip of document.querySelectorAll('[data-action="set-placement"]')) {
          const on = Number(chip.dataset.value) === value;
          chip.classList.toggle('active', on);
          chip.setAttribute('aria-pressed', String(on));
        }
        await saveData();
        await applyButtonPlacement();
        flashAutoBadge('placement');
        toast(`버튼 위치: ${BUTTON_PLACEMENT_LABELS[value]}`, 'success');
      }
      else if (action === 'add-managed-tag') {
        const input = document.getElementById('new-managed-tag');
        const tag = String(input?.value || '').trim().replace(/^#+/, '');
        if (!tag) { toast('추가할 태그 이름을 입력해 주세요.', 'error'); return; }
        if (allTags().includes(tag)) { toast('이미 있는 태그입니다.', 'error'); return; }
        if (!state.data.settings.knownTags) state.data.settings.knownTags = [];
        state.data.settings.knownTags.push(tag);
        await saveData();
        renderSettings(document.getElementById('main-content'));
        flashAutoBadge('tags');
        toast(`'${tag}' 태그를 추가했습니다.`, 'success');
      }
      else if (action === 'delete-tag-global') {
        const tag = target.dataset.tag;
        if (!globalThis.confirm(`'${tag}' 태그를 모든 메모에서 삭제할까요? 되돌릴 수 없습니다.`)) return;
        deleteTagGlobal(tag);
        await saveData();
        renderSettings(document.getElementById('main-content'));
        flashAutoBadge('tags');
        toast(`'${tag}' 태그를 삭제했습니다.`, 'success');
      }
      else if (action === 'add-group-tag') {
        const input = document.getElementById('new-group-tag');
        const tag = String(input?.value || '').trim().replace(/^#+/, '');
        if (!tag) { toast('그룹으로 지정할 태그 이름을 입력해 주세요.', 'error'); return; }
        if (groupTagList().includes(tag)) { toast('이미 그룹 태그입니다.', 'error'); return; }
        state.data.settings.groupTags.push(tag);
        state.data.settings.groupTags.sort((a, b) => a.localeCompare(b, 'ko'));
        await saveData();
        renderSettings(document.getElementById('main-content'));
        flashAutoBadge('group-tags');
        toast(`'${tag}'을(를) 그룹 태그로 지정했습니다.`, 'success');
      }
      else if (action === 'delete-group-tag') {
        const tag = target.dataset.tag;
        state.data.settings.groupTags = groupTagList().filter((item) => item !== tag);
        await saveData();
        renderSettings(document.getElementById('main-content'));
        flashAutoBadge('group-tags');
        toast(`'${tag}' 그룹 지정을 해제했습니다.`, 'success');
      }
      else if (action === 'move-language') {
        const code = target.dataset.code;
        const dir = Number(target.dataset.dir);
        const langs = state.data.settings.languages;
        const idx = langs.findIndex((lang) => lang.code === code);
        const swap = idx + dir;
        if (idx < 0 || swap < 0 || swap >= langs.length) return;
        [langs[idx], langs[swap]] = [langs[swap], langs[idx]];
        await saveData();
        renderSettings(document.getElementById('main-content'));
        flashAutoBadge('languages');
      }
      else if (action === 'delete-language') {
        const code = target.dataset.code;
        if (BASE_LANGUAGES.some((base) => base.code === code)) return;
        const label = langLabel(code);
        if (!globalThis.confirm(`'${label}' 언어 탭을 삭제할까요? 해당 언어로 저장된 내용은 목록에 표시되지 않습니다.`)) return;
        state.data.settings.languages = state.data.settings.languages.filter((lang) => lang.code !== code);
        for (const note of state.data.notes) if (note.defaultLang === code) note.defaultLang = '';
        if (state.activeLang === code) state.activeLang = 'ko';
        await saveData();
        renderSettings(document.getElementById('main-content'));
        flashAutoBadge('languages');
        toast(`'${label}' 언어 탭을 삭제했습니다.`, 'success');
      }
      else if (action === 'save-settings') await saveSettings();
      else if (action === 'export-json') exportScrapbookJSON();
      else if (action === 'choose-import-json') document.getElementById('scrapbook-import-file')?.click();
      else if (action === 'cancel-import') {
        state.importCandidate = null;
        renderSettings(document.getElementById('main-content'));
      }
      else if (action === 'import-modal-backdrop' && isBackdropClick(event, target)) {
        state.importCandidate = null;
        renderSettings(document.getElementById('main-content'));
      }
      else if (action === 'confirm-import') await confirmImportJSON();
      else if (action === 'reset-prompts') {
        if (!globalThis.confirm('번역 프롬프트를 기본값으로 되돌릴까요?')) return;
        const prompt = document.getElementById('setting-translation-prompt');
        if (prompt) prompt.value = DEFAULT_TRANSLATION_PROMPT;
      }
    });

    document.body.addEventListener('input', (event) => {
      if (event.target.id === 'list-search') {
        state.search = event.target.value;
        state.page = 1;
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(() => renderMemoCards(), 120);
      } else if (event.target.id === 'note-tag-input') {
        state.tagSuggestIndex = -1;
        renderTagSuggestions();
      } else if (event.target.id === 'setting-default-ooc-text') {
        state.data.settings.defaultOoc.text = event.target.value;
        clearTimeout(state.defaultOocTimer);
        state.defaultOocTimer = setTimeout(async () => { await saveData(); flashAutoBadge('default-ooc'); }, 400);
      } else if (event.target.classList.contains('lang-chip-input')) {
        const lang = state.data.settings.languages.find((l) => l.code === event.target.dataset.code);
        if (lang) {
          lang.chip = event.target.value.trim();
          clearTimeout(state.langChipTimer);
          state.langChipTimer = setTimeout(async () => { await saveData(); flashAutoBadge('languages'); }, 400);
        }
      }
    });

    document.body.addEventListener('change', async (event) => {
      if (event.target.classList.contains('tag-manage-input')) {
        const oldTag = event.target.dataset.tag;
        const newTag = String(event.target.value || '').trim().replace(/^#+/, '');
        if (!newTag || newTag === oldTag) { renderSettings(document.getElementById('main-content')); return; }
        renameTagGlobal(oldTag, newTag);
        await saveData();
        renderSettings(document.getElementById('main-content'));
        flashAutoBadge('tags');
        toast(`'${oldTag}' → '${newTag}' 로 모든 메모에 반영했습니다.`, 'success');
        return;
      }
      if (event.target.id === 'setting-provider') {
        const customSettings = document.getElementById('custom-api-settings');
        if (customSettings) customSettings.hidden = event.target.value !== 'custom';
      } else if (event.target.id === 'list-page-size') {
        const size = Number(event.target.value);
        state.data.settings.pageSize = PAGE_SIZES.includes(size) ? size : 15;
        state.page = 1;
        await saveData();
        renderMemoCards();
      } else if (event.target.id === 'list-tag-filter') {
        state.tagFilter = event.target.value;
        state.page = 1;
        renderMemoCards();
      } else if (event.target.id === 'list-sort') {
        state.sortMode = event.target.value;
        state.page = 1;
        renderMemoCards();
      } else if (event.target.id === 'editor-default-lang') {
        if (state.draft) {
          state.draft.defaultLang = event.target.checked ? state.activeLang : '';
        }
      } else if (event.target.id === 'editor-no-default-ooc') {
        if (state.draft) state.draft.noDefaultOoc = event.target.checked;
      } else if (event.target.id === 'setting-default-ooc-enabled') {
        state.data.settings.defaultOoc.enabled = event.target.checked;
        const ta = document.getElementById('setting-default-ooc-text');
        // 켰는데 문구가 비어 있으면 기본 문구 자동 채움
        if (event.target.checked && !String(state.data.settings.defaultOoc.text || '').trim()) {
          state.data.settings.defaultOoc.text = DEFAULT_OOC_TEXT;
          if (ta) ta.value = DEFAULT_OOC_TEXT;
        }
        if (ta) ta.disabled = !event.target.checked;
        await saveData();
        flashAutoBadge('default-ooc');
      } else if (event.target.id === 'scrapbook-import-file') {
        try { await prepareImportJSON(event.target.files?.[0]); }
        catch (error) { toast(String(error?.message || error), 'error'); }
        finally { event.target.value = ''; }
      }
    });

    document.addEventListener('keydown', async (event) => {
      if (event.target.id === 'note-tag-input') {
        const input = event.target;
        const suggest = document.getElementById('tag-suggest');
        const items = suggest && !suggest.hidden ? [...suggest.querySelectorAll('.tag-suggest-item')] : [];
        if (event.key === 'ArrowDown' && items.length) {
          event.preventDefault();
          state.tagSuggestIndex = (state.tagSuggestIndex + 1) % items.length;
          renderTagSuggestions();
          return;
        }
        if (event.key === 'ArrowUp' && items.length) {
          event.preventDefault();
          state.tagSuggestIndex = (state.tagSuggestIndex - 1 + items.length) % items.length;
          renderTagSuggestions();
          return;
        }
        if (event.key === 'Enter' || event.key === ',') {
          event.preventDefault();
          const picked = state.tagSuggestIndex >= 0 ? items[state.tagSuggestIndex] : null;
          addDraftTag(picked ? picked.dataset.tag : input.value);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          if (suggest) suggest.hidden = true;
          state.tagSuggestIndex = -1;
          return;
        }
        if (event.key === 'Backspace' && !input.value && state.draft?.tags?.length) {
          event.preventDefault();
          removeDraftTag(state.draft.tags[state.draft.tags.length - 1]);
          return;
        }
      }
      if (event.target.id === 'memo-tab-name-inline') {
        if (event.key === 'Enter') {
          event.preventDefault();
          confirmDraftMemoTabRename();
          return;
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancelDraftMemoTabRename();
          return;
        }
      }
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 's' && state.screen === 'edit') {
        event.preventDefault();
        await saveNote();
      } else if (event.key === 'Escape') {
        if (state.importCandidate && state.screen === 'settings') {
          state.importCandidate = null;
          renderSettings(document.getElementById('main-content'));
        } else if (state.customCopyOpen && state.screen === 'view') {
          state.customCopyOpen = false;
          renderViewer(document.getElementById('main-content'));
        } else if (state.deleteModalOpen && state.screen === 'view') {
          state.deleteModalOpen = false;
          renderViewer(document.getElementById('main-content'));
        } else if (state.screen === 'list') await api.hideContainer();
        else goBack();
      }
    });
  }

  async function openScrapbook(initialScreen = 'list') {
    await Promise.all([loadData(), loadLocalAISettings()]);
    state.screen = initialScreen;
    state.selectedId = null;
    state.activeMemoTabId = null;
    state.renamingMemoTabId = null;
    state.renamingMemoTabOriginalName = null;
    state.activeLang = languages()[0]?.code || 'ko';
    state.search = '';
    state.page = 1;
    state.listScroll = 0;
    state.restoreListScroll = false;
    state.tagFilter = '';
    state.sortMode = 'recent';
    state.draft = null;
    state.deleteModalOpen = false;
    state.importCandidate = null;
    renderShell();
    await api.showContainer('fullscreen');
  }

  function currentPlacement() {
    const n = Number(state.data?.settings?.buttonPlacement);
    return Object.prototype.hasOwnProperty.call(BUTTON_PLACEMENTS, n) ? n : 2;
  }

  // 등록된 버튼을 모두 해제하고 현재 설정에 맞춰 다시 등록 (설정 변경 시 즉시 반영)
  async function applyButtonPlacement() {
    for (const id of state.menuParts) {
      try { if (id) await api.unregisterUIPart(id); } catch { /* 이미 해제됨 */ }
    }
    state.menuParts = [];
    for (const spec of BUTTON_PLACEMENTS[currentPlacement()]) {
      try {
        const part = await api.registerButton({
          name: PLUGIN_NAME,
          icon: '🗒️',
          iconType: 'html',
          location: spec.location,
          id: spec.id,
        }, () => openScrapbook('list'));
        state.menuParts.push(part?.id || part || spec.id);
      } catch (error) {
        console.error('[OOC Scrapbook] 버튼 등록에 실패했습니다.', error);
      }
    }
  }

  try {
    await loadData();               // 저장된 설정을 먼저 읽어야 버튼 위치가 반영됨
    await applyButtonPlacement();
    const placement = currentPlacement();

    state.settingsPart = await api.registerSetting(
      'ooc scrapbook',
      () => openScrapbook('list'),
      '🗒️',
      'html',
      SETTINGS_ID,
    );

    await api.onUnload(async () => {
      clearTimeout(state.toastTimer);
      for (const id of state.menuParts) {
        if (id) await api.unregisterUIPart(id);
      }
      state.menuParts = [];
      const settingsId = state.settingsPart?.id || state.settingsPart || SETTINGS_ID;
      if (settingsId) await api.unregisterUIPart(settingsId);
    });

    console.log(`[OOC Scrapbook] v${PLUGIN_VERSION} loaded (buttonPlacement=${placement})`);
  } catch (error) {
    console.error('[OOC Scrapbook] 초기화에 실패했습니다.', error);
  }
})();