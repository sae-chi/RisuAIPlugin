//@name lorebook_downloader
//@display-name 로어북 다운로더
//@api 3.0
//@version 1.1.1

// Standalone API v3 plugin. No network requests or database writes.
(() => {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const title = (entry, i) => entry.comment || `이름 없는 항목 ${i + 1}`;
  const uuid = () => globalThis.crypto.randomUUID();

  // Older/imported entries can omit fields that Risu's editor treats as empty.
  // Fill only absent fields on a copy; reject malformed values without deleting data.
  function normalizeEntries(value) {
    if (value == null) return [];
    if (!Array.isArray(value)) throw new Error('로어북 목록이 배열이 아닙니다.');
    return value.map((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error(`${index + 1}번째 로어북 항목이 올바른 객체가 아닙니다.`);
      }
      const out = clone(entry);
      out.mode ??= 'normal';
      out.key ??= '';
      out.content ??= '';
      out.comment ??= '';
      out.secondkey ??= '';
      out.insertorder ??= 100;
      out.alwaysActive ??= false;
      out.selective ??= false;
      try { validate([out]); } catch (error) {
        throw new Error(`${index + 1}번째 항목 “${String(out.comment || '이름 없음')}”: ${error.message}`);
      }
      return out;
    });
  }

  function validate(entries) {
    if (!Array.isArray(entries)) throw new Error('로어북 목록이 배열이 아닙니다.');
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || typeof entry.content !== 'string' ||
          typeof entry.key !== 'string' || typeof entry.mode !== 'string') {
        throw new Error('RisuAI 로어북 항목 형식이 올바르지 않습니다.');
      }
    }
    return entries;
  }

  function expandSelection(entries, selected) {
    const included = new Set(selected);
    const expandedFolders = new Set();
    for (const i of included) if (entries[i].mode === 'folder') expandedFolders.add(entries[i].key);
    let changed = true;
    while (changed) {
      changed = false;
      entries.forEach((entry, i) => {
        if (entry.folder && expandedFolders.has(entry.folder) && !included.has(i)) {
          included.add(i);
          if (entry.mode === 'folder') expandedFolders.add(entry.key);
          changed = true;
        }
      });
    }
    return included;
  }

  function buildTree(entries) {
    const folders = new Map();
    entries.forEach((e, i) => { if (e.mode === 'folder' && !folders.has(e.key)) folders.set(e.key, i); });
    const parents = entries.map(e => e.folder ? (folders.get(e.folder) ?? -1) : -1);
    // Keep malformed cyclic/orphan data reachable in the UI; export validates cycles.
    parents.forEach((_, i) => {
      const seen = new Set([i]);
      let cursor = parents[i];
      while (cursor !== -1) {
        if (seen.has(cursor)) { parents[i] = -1; break; }
        seen.add(cursor); cursor = parents[cursor];
      }
    });
    const children = new Map([[-1, []]]);
    parents.forEach((parent, i) => {
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent).push(i);
    });
    return { parents, children };
  }

  // Only explicitly selected folders are retained; never add ancestor folders.
  function buildExport(entries, selected, makeId = uuid) {
    validate(entries);
    if (!selected.size) throw new Error('내보낼 항목을 선택하세요.');
    for (const i of selected) {
      if (!Number.isInteger(i) || i < 0 || i >= entries.length) throw new Error('선택이 유효하지 않습니다. 새로고침하세요.');
    }
    const included = expandSelection(entries, selected);
    const folders = new Map();
    entries.forEach((entry, i) => {
      if (entry.mode === 'folder') {
        if (!entry.key || folders.has(entry.key)) throw new Error('중복되거나 비어 있는 폴더 식별자가 있습니다. 원본 폴더를 확인하세요.');
        folders.set(entry.key, i);
      }
    });
    const requestedCount = included.size;
    // Risu child entries borrow content from an earlier entry with the same id.
    for (const i of included) {
      let cursor = i;
      while (entries[cursor].mode === 'child') {
        const id = entries[cursor].id;
        const parent = entries.findIndex((e, j) => j < cursor && id != null && e.id === id);
        if (parent < 0) throw new Error(`“${title(entries[cursor], cursor)}”의 원본 종속 항목을 찾을 수 없습니다.`);
        included.add(parent);
        cursor = parent;
      }
    }
    for (const i of included) {
      const seen = new Set([i]);
      let parentKey = entries[i].folder;
      while (parentKey && folders.has(parentKey) && included.has(folders.get(parentKey))) {
        const parent = folders.get(parentKey);
        if (seen.has(parent)) throw new Error('폴더 관계가 순환합니다. 원본 폴더를 확인하세요.');
        seen.add(parent);
        parentKey = entries[parent].folder;
      }
    }
    const folderKeys = new Map();
    const ids = new Map();
    for (const i of included) {
      const entry = entries[i];
      if (entry.mode === 'folder') folderKeys.set(entry.key, '\uf000folder:' + makeId());
      if (entry.id != null && !ids.has(entry.id)) ids.set(entry.id, makeId());
    }
    const data = entries.filter((_, i) => included.has(i)).map(entry => {
      const out = clone(entry);
      if (out.mode === 'folder') out.key = folderKeys.get(out.key);
      if (out.folder && folderKeys.has(out.folder)) out.folder = folderKeys.get(out.folder);
      else delete out.folder;
      if (out.id != null) out.id = ids.get(out.id);
      return out;
    });
    return { payload: { type: 'risu', ver: 1, data }, extra: included.size - requestedCount };
  }

  function filename(name) {
    let safe = String(name || 'lorebook').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim().replace(/[. ]+$/g, '');
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe)) safe = '_' + safe;
    return (Array.from(safe || 'lorebook').slice(0, 90).join('')) + '.json';
  }

  // Node-only entry for format/round-trip tests; not used inside RisuAI.
  if (typeof module !== 'undefined' && module.exports && typeof document === 'undefined') {
    module.exports = { buildExport, filename, validate, normalizeEntries, expandSelection, buildTree };
    return;
  }

  const api = globalThis.Risuai || globalThis.risuai;
  const sources = [];
  const selected = new Set();
  const opened = new Set();
  const urls = new Map();
  const registrations = [];
  let sourceIndex = 0;
  let loading = false;
  let disposed = false;
  const $ = id => document.getElementById(id);
  const style = document.createElement('style');
  style.textContent = `
    /* ── 기본 설정 ─────────────────────────────────────── */
    :root {
      color-scheme: dark;
      font-family: system-ui, -apple-system, sans-serif;
      color: #dddee8;
      background: #13141a;
      --accent: #7c78e8;
      --accent-dim: #3d3a6e;
      --accent-glow: #5550ac;
      --surface-0: #13141a;
      --surface-1: #1b1c25;
      --surface-2: #22243100;
      --surface-3: #2a2c3c;
      --border: #2e3045;
      --border-bright: #454766;
      --text-main: #dddee8;
      --text-sub: #9294a8;
      --text-dim: #5c5e72;
      --red: #ff7b7b;
      --red-bg: #2d1a1a;
    }

    * { box-sizing: border-box; }
    body { margin: 0; }

    /* ── 레이아웃 ──────────────────────────────────────── */
    main {
      max-width: 860px;
      margin: auto;
      padding: 28px 24px 120px;
    }

    /* ── 타이포그래피 ───────────────────────────────────── */
    h1 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--text-main);
      margin: 0;
    }

    p {
      line-height: 1.65;
      color: var(--text-sub);
      margin: 6px 0 0;
      font-size: 13px;
    }

    /* ── 폼 공통 ───────────────────────────────────────── */
    button, input, select {
      font: inherit;
    }

    button,
    select,
    input[type=search],
    input[type=text] {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      background: var(--surface-1);
      color: var(--text-main);
      font-size: 13px;
      transition: border-color 0.15s, background 0.15s;
    }

    select {
      max-width: 100%;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239294a8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      padding-right: 28px;
    }

    input[type=search] { background: var(--surface-1); }
    input[type=search]::-webkit-search-cancel-button { opacity: 0.5; }

    button {
      cursor: pointer;
      color: var(--text-sub);
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      border-color: var(--border-bright);
      color: var(--text-main);
      background: var(--surface-3);
    }

    button:disabled {
      opacity: 0.4;
      cursor: default;
    }

    button:focus-visible,
    input:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }

    /* ── 헤더 ──────────────────────────────────────────── */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
    }

    .header-title { flex: 1; min-width: 0; }

    #close {
      padding: 7px 14px;
      font-size: 13px;
      flex-shrink: 0;
    }

    /* ── 컨트롤 패널 ────────────────────────────────────── */
    .panel {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }

    .panel-row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .panel-row + .panel-row {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }

    .panel label {
      font-size: 12px;
      color: var(--text-dim);
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 180px;
    }

    .grow { flex: 1; min-width: 0; }

    /* ── 상태 표시 ─────────────────────────────────────── */
    #status {
      font-size: 13px;
      white-space: pre-wrap;
      padding: 10px 14px;
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-left: 3px solid var(--border-bright);
      border-radius: 8px;
      min-height: 40px;
      margin: 10px 0 8px;
      color: var(--text-sub);
      line-height: 1.6;
    }

    #status.error {
      color: var(--red);
      border-left-color: var(--red);
      background: var(--red-bg);
    }

    /* ── 힌트 텍스트 ────────────────────────────────────── */
    .tree-help {
      font-size: 12px;
      color: var(--text-dim);
      margin: 0 0 12px;
    }

    /* ── 목록 ───────────────────────────────────────────── */
    #list { display: grid; gap: 6px; }

    /* ── 행 ─────────────────────────────────────────────── */
    .row {
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      background: var(--surface-1);
      transition: border-color 0.1s, background 0.1s;
    }

    .row:hover { border-color: var(--border-bright); }

    .row.selected {
      border-color: var(--accent);
      background: #1e1c33;
    }

    .row.included {
      border-color: var(--accent-dim);
      background: #1a1929;
    }

    .row input[type=checkbox] {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      accent-color: var(--accent);
      cursor: pointer;
    }

    /* ── 항목 텍스트 ───────────────────────────────────── */
    .entry-title {
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .name {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-main);
      overflow-wrap: anywhere;
      line-height: 1.4;
    }

    .meta {
      display: block;
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 3px;
      overflow-wrap: anywhere;
      line-height: 1.4;
    }

    /* ── 개별 다운로드 버튼 ─────────────────────────────── */
    .row > button {
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 6px;
      flex-shrink: 0;
    }

    /* ── 폴더 / 트리 ───────────────────────────────────── */
    .folder { margin: 0; }

    .folder > summary {
      list-style: none;
      background: #1e202e;
      border-radius: 8px;
    }

    .folder > summary::-webkit-details-marker { display: none; }

    .folder > summary:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
      border-radius: 8px;
    }

    .chevron {
      width: 12px;
      flex-shrink: 0;
      font-size: 11px;
      color: var(--text-dim);
      transition: transform 0.15s;
      user-select: none;
    }

    .folder[open] > summary .chevron { transform: rotate(90deg); }

    .children {
      display: grid;
      gap: 6px;
      margin: 6px 0 2px 20px;
      padding-left: 14px;
      border-left: 2px solid var(--accent-dim);
    }

    details { color: var(--text-sub); }
    summary { cursor: pointer; }

    /* ── 소형 텍스트 ────────────────────────────────────── */
    .small { font-size: 12px; }
    .muted { color: var(--text-sub); }

    /* ── 푸터 ──────────────────────────────────────────── */
    footer {
      position: sticky;
      bottom: 0;
      padding: 14px 0 10px;
      background: linear-gradient(to bottom, transparent, var(--surface-0) 16px);
      margin-top: 16px;
    }

    .footer-inner {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
    }

    .footer-row {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }

    .footer-row + .footer-row {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--border);
    }

    #count {
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 0.01em;
    }

    #count:empty { display: none; }

    #export {
      background: var(--accent-glow);
      border-color: var(--accent);
      color: #fff;
      font-weight: 600;
      padding: 8px 16px;
    }

    #export:hover:not(:disabled) {
      background: #6560c4;
      border-color: #a39bff;
      color: #fff;
    }

    .footer-hint {
      font-size: 12px;
      color: var(--text-dim);
      line-height: 1.55;
    }

    /* ── 사용 안내 ──────────────────────────────────────── */
    .guide {
      margin-top: 20px;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .guide > summary {
      padding: 10px 14px;
      font-size: 13px;
      color: var(--text-sub);
      background: var(--surface-1);
      user-select: none;
      list-style: none;
    }

    .guide > summary::-webkit-details-marker { display: none; }
    .guide > summary::before { content: '▸ '; font-size: 11px; color: var(--text-dim); }
    .guide[open] > summary::before { content: '▾ '; }

    .guide > p {
      padding: 12px 14px;
      margin: 0;
      font-size: 12px;
      color: var(--text-sub);
      background: var(--surface-0);
      border-top: 1px solid var(--border);
      line-height: 1.65;
    }

    /* ── 반응형 (560px 이하) ───────────────────────────── */
    @media (max-width: 560px) {
      main { padding: 16px 14px 100px; }

      .header { flex-wrap: wrap; }

      .panel-row { gap: 6px; }

      .row {
        gap: 8px;
        flex-wrap: wrap;
      }

      .entry-title { flex-basis: calc(100% - 100px); }

      .row > button {
        font-size: 11px;
        padding: 5px 8px;
        margin-left: auto;
      }

      .children {
        margin-left: 10px;
        padding-left: 8px;
      }

      footer { position: static; }

      .footer-row { gap: 6px; }

      #name { flex-basis: 100%; min-width: 0; }
      #export { flex-basis: 100%; text-align: center; }
    }
  `;
  document.head.appendChild(style);
  document.body.innerHTML = `<main>

    <div class="header">
      <div class="header-title">
        <h1>Lorebook Downloader</h1>
        <p>원하는 항목과 폴더를 RisuAI 가져오기용 JSON으로 저장합니다.</p>
      </div>
      <button id="close">닫기</button>
    </div>

    <div class="panel">
      <div class="panel-row">
        <label class="grow">로어북 위치
          <select id="source" aria-label="로어북 위치">
            <option value="0">캐릭터 로어북</option>
            <option value="1">현재 채팅 로어북</option>
          </select>
        </label>
        <button id="refresh" style="align-self:flex-end">새로고침</button>
      </div>
      <div class="panel-row">
        <input class="grow" id="search" type="search" placeholder="이름 · 키워드 · 내용 검색" aria-label="로어북 검색">
        <button id="selectVisible">전체 선택</button>
        <button id="clear">선택 해제</button>
        <button id="collapse">모두 접기</button>
      </div>
    </div>

    <div id="status" role="status" aria-live="polite">불러오는 중…</div>

    <p class="tree-help">폴더 이름을 누르면 펼쳐집니다. 폴더에 체크하면 내부 로어 전체가 선택됩니다.</p>

    <div id="list"></div>

    <footer>
      <div class="footer-inner">
        <div class="footer-row">
          <span id="count"></span>
          <input id="name" class="grow" type="text" placeholder="저장할 파일 이름 (선택)" aria-label="저장할 파일 이름" style="min-width:160px">
          <button id="export">다운로드</button>
        </div>
        <div class="footer-row">
          <span class="footer-hint">선택 항목을 JSON으로 저장합니다. 로어만 선택 시 상위 폴더는 포함되지 않습니다. 받은 파일은 RisuAI 로어북의 가져오기로 추가하세요.</span>
        </div>
      </div>
    </footer>

    <details class="guide">
      <summary>사용 안내</summary>
      <p>캐릭터·현재 채팅 로어북과 설치된 모든 모듈의 로어북을 지원합니다. 모듈은 활성화 여부와 관계없이 로어북 위치에서 각각 선택할 수 있습니다. 목록은 불러온 시점의 복사본이므로 캐릭터·채팅을 전환하거나 로어북·모듈을 편집한 뒤에는 새로고침하세요.</p>
    </details>

  </main>`;

  function status(message, error = false) {
    $('status').textContent = message;
    $('status').className = error ? 'error' : '';
  }
  function current() { return sources[sourceIndex]; }
  function displayEntry(entry) {
    if (entry.mode !== 'child') return entry;
    const parent = current()?.parents?.find(e => e.id != null && e.id === entry.id);
    return parent ? { ...entry, comment: parent.comment, content: parent.content } : entry;
  }
  function resetSelection() {
    selected.clear();
    opened.clear();
    $('name').value = '';
  }
  function updateCount() {
    const entries = current()?.entries || [];
    const effective = expandSelection(entries, selected);
    const folderCount = [...effective].filter(i => entries[i].mode === 'folder').length;
    $('count').textContent = effective.size ? `로어 ${effective.size - folderCount}개 · 폴더 ${folderCount}개 선택` : '선택한 항목 없음';
    $('export').disabled = loading || !selected.size;
  }
  function showSourceStatus() {
    const source = current();
    if (source?.error) status(`${source.name}: ${source.error}`, true);
    else status(`선택한 위치: ${source?.name || '로어북'}\n개별 저장하거나 항목·폴더를 선택하세요.`);
  }
  function visibleEntries() {
    const query = $('search').value.trim().toLocaleLowerCase();
    return (current()?.entries || []).map((entry, index) => ({ entry, index })).filter(({ entry }) =>
      !query || [displayEntry(entry).comment, entry.key, displayEntry(entry).content].some(v => String(v || '').toLocaleLowerCase().includes(query)));
  }
  function renderSources() {
    $('source').replaceChildren();
    sources.forEach((source, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${source.name} (${source.error ? '불러오지 못함' : source.entries.filter(e => e.mode !== 'folder').length + '개'})`;
      $('source').appendChild(option);
    });
    $('source').value = String(sourceIndex);
    renderList();
  }
  function renderList() {
    $('list').replaceChildren();
    const fragment = document.createDocumentFragment();
    const entries = current()?.entries || [];
    const tree = buildTree(entries);
    const matches = new Set(visibleEntries().map(({ index }) => index));
    const shown = expandSelection(entries, matches);
    for (const index of [...shown]) {
      let parent = tree.parents[index];
      while (parent !== -1) { shown.add(parent); parent = tree.parents[parent]; }
    }
    const searching = Boolean($('search').value.trim());
    $('selectVisible').textContent = searching ? '검색 결과 선택' : '전체 선택';
    function appendEntry(index, container) {
      if (!shown.has(index)) return;
      const entry = entries[index];
      const isFolder = entry.mode === 'folder';
      const displayed = displayEntry(entry);
      const row = document.createElement(isFolder ? 'summary' : 'div'); row.className = 'row'; row.dataset.index = String(index);
      const check = document.createElement('input'); check.type = 'checkbox'; check.id = `entry-${index}`;
      check.setAttribute('aria-label', `${title(displayed, index)} 선택`);
      check.addEventListener('click', event => event.stopPropagation());
      check.addEventListener('change', () => {
        if (check.checked) {
          if (isFolder) for (const child of expandSelection(entries, new Set([index]))) selected.delete(child);
          selected.add(index);
        } else selected.delete(index);
        updateSelectionState();
      });
      const label = document.createElement(isFolder ? 'span' : 'label'); label.className = 'entry-title';
      if (!isFolder) label.htmlFor = check.id;
      const name = document.createElement('span'); name.className = 'name';
      name.textContent = `${isFolder ? '📁 ' : ''}${title(displayed, index)}${entry.mode === 'child' ? ' (캐릭터 로어 참조)' : ''}`;
      const meta = document.createElement('span'); meta.className = 'meta';
      if (isFolder) {
        const descendants = expandSelection(entries, new Set([index]));
        const count = [...descendants].filter(i => entries[i].mode !== 'folder').length;
        meta.textContent = `로어 ${count}개 · 폴더 선택 시 전체 포함${searching ? ` · 검색 일치 ${[...descendants].filter(i => matches.has(i)).length}개` : ''}`;
      } else meta.textContent = entry.alwaysActive ? '항상 활성화' : `키워드: ${entry.key || '없음'}`;
      label.append(name, meta);
      const save = document.createElement('button'); save.textContent = isFolder ? '폴더 다운로드' : '개별 다운로드';
      save.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); saveSelection(new Set([index]), title(displayed, index)); });
      row.appendChild(check);
      if (isFolder) {
        const chevron = document.createElement('span'); chevron.className = 'chevron'; chevron.textContent = '▸'; chevron.setAttribute('aria-hidden', 'true');
        row.appendChild(chevron);
      }
      row.append(label, save);
      if (isFolder) {
        const details = document.createElement('details'); details.className = 'folder'; details.id = `folder-${index}`; details.open = opened.has(index);
        details.addEventListener('toggle', () => {
          if (!details.isConnected) return;
          if (details.open) opened.add(index); else opened.delete(index);
        });
        const children = document.createElement('div'); children.className = 'children';
        for (const child of tree.children.get(index) || []) appendEntry(child, children);
        if (!children.childNodes.length) { const empty = document.createElement('span'); empty.className = 'small muted'; empty.textContent = '폴더가 비어 있습니다.'; children.appendChild(empty); }
        details.append(row, children); container.appendChild(details);
      } else container.appendChild(row);
    }
    for (const index of tree.children.get(-1) || []) appendEntry(index, fragment);
    if (!fragment.childNodes.length) {
      const empty = document.createElement('p'); empty.textContent = '표시할 항목이 없습니다. 다른 위치를 선택하거나 검색어를 바꾸세요.'; fragment.appendChild(empty);
    }
    $('list').appendChild(fragment); updateSelectionState();
  }
  function updateSelectionState() {
    const entries = current()?.entries || [];
    const effective = expandSelection(entries, selected);
    for (const row of $('list').querySelectorAll('.row')) {
      const index = Number(row.dataset.index);
      const check = row.querySelector('input');
      const inherited = effective.has(index) && !selected.has(index);
      check.checked = effective.has(index);
      check.disabled = inherited;
      check.title = inherited ? '상위 폴더 선택에 포함되어 있습니다. 개별 선택하려면 상위 폴더의 체크를 해제하세요.' : '';
      check.indeterminate = entries[index].mode === 'folder' && !check.checked &&
        [...expandSelection(entries, new Set([index]))].some(i => i !== index && effective.has(i));
      row.classList.toggle('selected', selected.has(index));
      row.classList.toggle('included', inherited);
    }
    updateCount();
  }
  async function busy(action) {
    if (loading || disposed) return;
    loading = true;
    const controls = ['refresh', 'source'];
    controls.forEach(id => { $(id).disabled = true; }); updateCount();
    try { await action(); } catch (error) { status(error.message || String(error), true); }
    finally { loading = false; controls.forEach(id => { $(id).disabled = false; }); updateCount(); }
  }
  async function refresh() {
    await busy(async () => {
      // Clear stale data before any awaited read, even if the next read fails.
      const previousSourceKey = current()?.key;
      sourceIndex = 0;
      sources.splice(0, sources.length,
        { key: 'character', name: '캐릭터 로어북', entries: [], error: '불러오는 중…' },
        { key: 'chat', name: '현재 채팅 로어북', entries: [], error: '불러오는 중…' });
      resetSelection(); $('search').value = ''; renderSources();
      status('캐릭터·채팅·모듈 로어북을 불러오는 중…');
      let character;
      try {
        character = await api.getCharacter();
        if (!character) throw new Error('선택된 캐릭터가 없습니다. 캐릭터를 선택한 뒤 새로고침하세요.');
      } catch (error) {
        const message = `캐릭터 읽기 실패: ${error.message || String(error)}`;
        sources.forEach(source => { source.error = message; });
      }
      if (character) {
        const chat = character.chats?.[character.chatPage];
        sources[0].name = `${character.name || '캐릭터'} · 캐릭터 로어북`;
        sources[1].name = `${chat?.name || '현재 채팅'} · 채팅 로어북`;
        for (const [index, value] of [[0, character.globalLore], [1, chat?.localLore]]) {
          try {
            if (index === 1 && !chat) throw new Error('현재 채팅을 찾을 수 없습니다. 채팅을 선택한 뒤 새로고침하세요.');
            sources[index].entries = normalizeEntries(value);
            delete sources[index].error;
          } catch (error) { sources[index].error = error.message || String(error); }
        }
        sources[1].parents = sources[0].entries;
      }
      // Read modules independently so they remain available without a selected character.
      try {
        const database = await api.getDatabase(['modules']);
        if (!database) throw new Error('데이터베이스 접근이 허용되지 않았습니다. 권한을 허용한 뒤 새로고침하세요.');
        if (!Array.isArray(database.modules)) throw new Error('모듈 목록을 읽을 수 없습니다.');
        database.modules.forEach((module, index) => {
          const source = {
            key: `module:${module?.id || index}`,
            name: `${module?.name || `이름 없는 모듈 ${index + 1}`} · 모듈 로어북`,
            entries: []
          };
          try {
            if (!module || typeof module !== 'object' || Array.isArray(module)) throw new Error('모듈 형식이 올바르지 않습니다.');
            source.entries = normalizeEntries(module.lorebook);
          } catch (error) { source.error = error.message || String(error); }
          sources.push(source);
        });
      } catch (error) {
        sources.push({ key: 'modules-error', name: '모듈 로어북', entries: [], error: error.message || String(error) });
      }
      sourceIndex = Math.max(0, sources.findIndex(source => source.key === previousSourceKey));
      renderSources();
      const errors = sources.filter(source => source.error).map(source => `${source.name}: ${source.error}`);
      if (errors.length) status(errors.join('\n'), true);
      else showSourceStatus();
    });
  }
  function saveSelection(indices, name) {
    try {
      if (loading) return;
      if (!current()) throw new Error('먼저 로어북을 불러오세요.');
      if (current().error) throw new Error(current().error);
      const parents = current().parents || [];
      const combined = parents.concat(current().entries);
      const shifted = new Set([...indices].map(i => i + parents.length));
      const result = buildExport(combined, shifted);
      const blob = new Blob([JSON.stringify(result.payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename(name);
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      urls.set(url, setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); }, 60000));
      const loreCount = result.payload.data.filter(e => e.mode !== 'folder').length;
      status(`다운로드 요청: ${filename(name)}\n로어 ${loreCount}개 · 폴더 ${result.payload.data.length - loreCount}개${result.extra ? ` (참조에 필요한 원본 로어 ${result.extra}개 자동 포함)` : ''}. 브라우저 다운로드 목록을 확인하세요.`);
    } catch (error) { status(error.message || String(error), true); }
  }

  $('close').addEventListener('click', () => api.hideContainer().catch(error => status(String(error), true)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') $('close').click(); });
  $('refresh').addEventListener('click', refresh);
  $('source').addEventListener('change', () => { sourceIndex = Number($('source').value); resetSelection(); renderList(); showSourceStatus(); });
  $('search').addEventListener('input', renderList);
  $('selectVisible').addEventListener('click', () => { visibleEntries().forEach(({ index }) => selected.add(index)); renderList(); });
  $('clear').addEventListener('click', () => { selected.clear(); renderList(); });
  $('collapse').addEventListener('click', () => { opened.clear(); renderList(); });
  $('export').addEventListener('click', () => saveSelection(selected, $('name').value.trim() || `${current()?.name || '로어북'}_선택`));

  async function open() {
    if (loading || disposed) return;
    // Finish database permission prompts before the fullscreen UI can cover them.
    await refresh();
    if (!disposed) await api.showContainer('fullscreen');
  }
  (async () => {
    registrations.push(await api.registerSetting('로어북 다운로더', open, '📥', 'html'));
    registrations.push(await api.registerButton({ name: '로어북 다운로더', icon: '📥', iconType: 'html', location: 'hamburger' }, open));
    await api.onUnload(async () => {
      disposed = true;
      for (const [url, timer] of urls) { clearTimeout(timer); URL.revokeObjectURL(url); }
      urls.clear();
      for (const item of registrations) await api.unregisterUIPart(typeof item === 'string' ? item : item.id);
    });
  })().catch(error => { console.error('[로어북 선택 내보내기]', error); status(`플러그인 초기화 실패: ${error.message}`, true); });
})();
