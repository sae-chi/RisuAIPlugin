//@name gigatrans_utility
//@display-name GigaTrans Utility
//@api 3.0
//@version 1.6.1
//@update-url https://raw.githubusercontent.com/sae-chi/RisuAIPlugin/refs/heads/main/GigaTrans-utility.js

;(async function () {
  'use strict';
  const R = typeof Risuai !== 'undefined' ? Risuai : typeof risuai !== 'undefined' ? risuai : null;
  if (!R) return;
  const GT = '<GigaTrans>', END = '</GigaTrans>', SEP = '<GT-SEP/>';
  const CTRL = /<GT-CTRL[^/]*\/>/g;
  const STRUCTURAL = ['memo', 'RP-Guide', 'Metatron', 'CMLS', 'WorldManager', 'Prototype', 'Fold'];
  const ALL_TAGS = ['Thoughts', 'Before_Response', ...STRUCTURAL];
  const blockRE = names => new RegExp('<(' + names.join('|') + ')>[\\s\\S]*?<\\/\\1>', 'g');
  const stripCtrl = s => s.replace(CTRL, '');

  // Preserve untouched bytes around both editable ranges. Do not parse user text as HTML.
  function splitMessage(raw) {
    const start = raw.indexOf(GT), end = raw.indexOf(END);
    if (start < 0 && end < 0) return {raw, paired:false, original:stripCtrl(raw).trim(), translation:'', head:'', tail:''};
    if (start < 0 || end < start || raw.indexOf(GT, start + GT.length) >= 0 || raw.indexOf(END, end + END.length) >= 0)
      throw new Error('GigaTrans 태그가 손상되었거나 여러 개입니다. 채팅에서 태그를 확인하세요.');
    let transStart = 0, legacy = false;
    const sep = raw.indexOf(SEP);
    if (sep >= 0 && sep < start) transStart = sep + SEP.length;
    else {
      // Old Relay omitted SEP: recognize only a contiguous known protected prefix.
      const prefix = /^(?:\s*(?:<(Thoughts|Before_Response|memo|RP-Guide|Metatron|CMLS|WorldManager|Prototype|Fold)>[\s\S]*?<\/\1>|<details class="hidden-story">[\s\S]*?<\/details>))+/;
      const m = raw.slice(0,start).match(prefix);
      if (m) { transStart = m[0].length; legacy = true; }
    }
    function range(a,b) {
      const part = raw.slice(a,b), leading = part.match(/^\s*/)[0].length;
      const trailing = part.match(/\s*$/)[0].length;
      return [a + leading, Math.max(a + leading, b - trailing)];
    }
    const tr = range(transStart,start), orig = range(start+GT.length,end);
    return {raw, paired:true, original:raw.slice(...orig), translation:raw.slice(...tr),
      originalRange:orig, translationRange:tr, head:raw.slice(0,transStart), tail:raw.slice(end+END.length), legacy};
  }
  function validateText(s) {
    if (/<\/?GigaTrans>|<GT-SEP\/>|<GT-CTRL[^/]*\/>/.test(s)) throw new Error('본문에는 GigaTrans 제어 태그를 넣을 수 없습니다.');
  }
  function findMatches(text,query) {
    if(!query)return [];
    const escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return [...text.matchAll(new RegExp(escaped,'gi'))].map(m=>({start:m.index,end:m.index+m[0].length}));
  }
  // Deliberately heuristic presets, not vendor tokenizers or measured model accuracy.
  const TOKEN_PROFILES={openai:{label:'OpenAI 호환',ascii:4,hangul:1.2,cjk:1.3},gemini:{label:'Gemini',ascii:4,hangul:1,cjk:1.1},claude:{label:'Claude',ascii:3.8,hangul:1.3,cjk:1.4}};
  function estimateTokens(text,profile='openai') {
    const p=TOKEN_PROFILES[profile]||TOKEN_PROFILES.openai;let total=0;
    for(const ch of text) {
      const cp=ch.codePointAt(0);
      if(cp<128)total+=1/p.ascii;
      else if(/[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]/u.test(ch))total+=p.hangul;
      else if(/[\u3040-\u30ff\u3400-\u9fff]/u.test(ch))total+=p.cjk;
      else total+=cp>0xffff?2:1;
    }
    return Math.ceil(total);
  }
  function tokenText(text,includeProtected) {
    let s=stripCtrl(text).replace(/<GT-SEP\/>/g,'');
    if(!includeProtected)s=s.replace(blockRE(ALL_TAGS),'').replace(/<details class="hidden-story">[\s\S]*?<\/details>/g,'').replace(/(?:---\s*)?\[LBDATA START\][\s\S]*?\[LBDATA END\](?:\s*---)?/g,'');
    return s.trim();
  }
  function estimateChat(chat,profile,includeProtected=false) {
    let originals=0,users=0,characters=0,skipped=0;
    for(const m of chat.message||[]) {
      if(m.role==='user'){users+=estimateTokens(tokenText(m.data||'',includeProtected),profile);continue;}
      if(m.role!=='char')continue;
      try {const p=splitMessage(m.data||'');const text=p.paired?p.original+(includeProtected?'\n'+p.head+'\n'+p.tail:''):p.original;
        originals+=estimateTokens(tokenText(text,includeProtected),profile);characters++;
      }catch{skipped++;}
    }
    return {originals,users,total:originals+users,characters,skipped};
  }
  function replacePair(pair, original, translation) {
    validateText(original); validateText(translation);
    if (!pair.paired) {
      if (!translation.trim()) {
        if(original===pair.original)return pair.raw;
        if(!pair.original || !pair.raw.includes(pair.original))throw new Error('원문 영역을 안전하게 찾을 수 없습니다. 채팅에서 먼저 편집하세요.');
        return pair.raw.replace(pair.original, () => original);
      }
      return [translation, GT, original, END, '<GT-CTRL/>'].join('\n');
    }
    const [oa,ob]=pair.originalRange, [ta,tb]=pair.translationRange;
    return pair.raw.slice(0,ta)+translation+pair.raw.slice(tb,oa)+original+pair.raw.slice(ob);
  }
  function protectedValues(pair) {
    return {head:stripCtrl(pair.head).replace(SEP,'').trim(),tail:stripCtrl(pair.tail).trim()};
  }
  function replaceAllAreas(pair,original,translation,head,tail) {
    validateText(head);validateText(tail);
    let raw=replacePair(pair,original,translation);
    const before=protectedValues(pair);
    if(!pair.paired) {
      if(head!==before.head||tail!==before.tail)throw new Error('번역된 메시지에서 보호 영역을 편집할 수 있습니다.');
      return raw;
    }
    if(head!==before.head) {
      const parsed=splitMessage(raw),controls=(pair.head.match(CTRL)||[]).join('\n');
      raw=(controls?controls+'\n':'')+(head.trim()?head+'\n'+SEP+'\n':'')+raw.slice(parsed.translationRange[0]);
    }
    if(tail!==before.tail) {
      const end=raw.indexOf(END)+END.length,controls=(pair.tail.match(CTRL)||[]).join('\n');
      raw=raw.slice(0,end)+(tail?'\n'+tail:'')+(controls?'\n'+controls:'');
    }
    return raw;
  }
  let stopped=false, uiBusy=false, watchTimer=null, view=null;
  let scrollSyncEnabled=true;
  async function current() {
    const ci=await R.getCurrentCharacterIndex(), hi=await R.getCurrentChatIndex();
    const char=await R.getCharacterFromIndex(ci), chat=await R.getChatFromIndex(ci,hi);
    if(!char || !chat || !Array.isArray(chat.message)) throw new Error('먼저 캐릭터의 채팅을 열어 주세요.');
    if(ci!==await R.getCurrentCharacterIndex() || hi!==await R.getCurrentChatIndex()) throw new Error('채팅이 바뀌었습니다. 다시 열어 주세요.');
    return {ci,hi,char,chat,charId:char.chaId,chatId:chat.id};
  }
  async function readTarget(target) {
    const char=await R.getCharacterFromIndex(target.ci);
    const chat=await R.getChatFromIndex(target.ci,target.hi);
    if(!char||!chat|| (target.charId && char.chaId!==target.charId) || (target.chatId && chat.id!==target.chatId))
      throw new Error('대상 캐릭터/채팅이 이동하거나 삭제되었습니다. 다시 열어 주세요.');
    if(!target.chatId && chat.name!==target.chat.name) throw new Error('채팅이 변경되었습니다. 다시 열어 주세요.');
    return chat;
  }
  function locate(chat, snap) {
    let i=snap.index;
    if(snap.id) {
      const found=chat.message.map((m,j)=>m.chatId===snap.id?j:-1).filter(j=>j>=0);
      if(found.length!==1) throw new Error('대상 메시지가 삭제되었거나 ID가 중복됩니다.');
      i=found[0];
    } else if(chat.message.length!==snap.length) throw new Error('메시지 목록이 변경되었습니다. 다시 불러오세요.');
    const m=chat.message[i];
    if(!m || m.role!=='char' || m.data!==snap.raw) throw new Error('메시지가 외부에서 변경되었습니다. 편집 내용을 복사한 뒤 다시 불러오세요.');
    return i;
  }
  const snapshot=(chat,i)=>({index:i,id:chat.message[i].chatId,raw:chat.message[i].data||'',length:chat.message.length});
  function ensureIdle(chat,index) {
    const s=chat.scriptstate||{};
    if(['pending','processing'].includes(s.$__gt_status)||s['$__gt_busy_'+index]==='1') throw new Error('모듈이 번역 중입니다. 완료 후 다시 시도하세요.');
  }
  async function saveDraft(target,snap,raw) {
    const chat=await readTarget(target), i=locate(chat,snap); ensureIdle(chat,i);
    chat.message[i].data=raw;
    await R.setChatToIndex(target.ci,target.hi,chat);
    const verify=await readTarget(target);
    if(verify.message[i]?.data!==raw) throw new Error('저장 결과가 다른 작업으로 변경되었습니다. 다시 불러오세요.');
    return {chat:verify,index:i};
  }
  // Generium: white surfaces, numbered navigation, an 8px spacing scale and flat teal actions.
  const CSS=`
    /* ═══════════════════════════════════════════
       디자인 토큰
    ═══════════════════════════════════════════ */
    :root{
      color-scheme:light;
      --surface:#FFFFFF;
      --sidebar:#F5F9F9;
      --input:#FFFFFF;
      --disabled:#EDF3F3;
      --notice:#E8F6F4;
      --warning:#FDF0F8;
      --on-primary:#FFFFFF;
      --primary-hover:#006D7C;
      --teal:#52BBB1;
      --dark-teal:#006D7C;
      --light-teal:#D4EDEB;
      --ink:#0A1F22;
      --muted:#5E8085;
      --subtle:#A0BABd;
      --line:#DDE8E9;
      --gray:#B8CECF;
      --pink:#B7128D;
      --r:5px;
      font:15px/1.6 'PF DinText Pro',system-ui,'Malgun Gothic',sans-serif;
      color:var(--ink);background:var(--surface)
    }

    /* ═══════════════════════════════════════════
       기본 리셋
    ═══════════════════════════════════════════ */
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-width:320px;height:100dvh;overflow:hidden;display:flex;flex-direction:column}
    button,input,select,textarea{font:inherit}
    p{margin:0}
    h2{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    pre{white-space:pre-wrap;overflow-wrap:anywhere}
    ::selection{background:var(--light-teal);color:var(--ink)}

    /* ═══════════════════════════════════════════
       버튼
    ═══════════════════════════════════════════ */
    button{
      cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;
      padding:8px 16px;min-height:36px;
      border:1px solid var(--line);border-radius:var(--r);
      background:var(--surface);color:var(--dark-teal);
      font-size:13px;font-weight:500;white-space:nowrap;
      transition:background .12s,border-color .12s,color .12s
    }
    button:hover{background:var(--light-teal);border-color:var(--teal)}
    button.primary{
      background:var(--teal);border-color:var(--teal);color:var(--on-primary);font-weight:600
    }
    button.primary:hover{background:var(--primary-hover);border-color:var(--primary-hover)}
    button:disabled{opacity:.38;cursor:default;pointer-events:none}
    :is(button,input,select,textarea,summary):focus-visible{
      outline:2px solid var(--teal);outline-offset:2px
    }

    /* ═══════════════════════════════════════════
       입력 필드
    ═══════════════════════════════════════════ */
    input,select{
      width:100%;padding:8px 12px;min-height:36px;
      border:1px solid var(--gray);border-radius:var(--r);
      color:var(--ink);background:var(--input);
      transition:border-color .12s
    }
    input:focus,select:focus{border-color:var(--teal);outline:none}
    input::placeholder{color:var(--subtle)}
    textarea{
      width:100%;padding:16px 18px;
      border:1px solid var(--line);border-radius:var(--r);
      color:var(--ink);background:var(--input);
      resize:none;line-height:1.75;tab-size:2;
      transition:border-color .12s
    }
    textarea:focus{border-color:var(--teal);outline:none}
    textarea:disabled{background:var(--disabled);color:var(--muted)}

    /* ═══════════════════════════════════════════
       앱 셸 — 고정 사이드바 + 스크롤 메인
       구조: body > .app-frame > .sidebar + .main-wrap
    ═══════════════════════════════════════════ */
    .shell{
      display:grid;
      grid-template-columns:240px minmax(0,1fr);
      grid-template-rows:1fr;
      flex:1;min-height:0;overflow:hidden
    }

    /* ── 사이드바 ── */
    .top{
      grid-column:1;grid-row:1;
      display:flex;flex-direction:column;
      background:var(--sidebar);
      border-right:1px solid var(--line);
      height:100%;overflow-y:auto;
      padding:0 0 24px
    }
    .brand{
      display:flex;align-items:center;gap:10px;
      padding:20px 20px 16px;
      border-bottom:1px solid var(--line);
      flex-shrink:0
    }
    .brand-mark{
      width:32px;height:32px;flex-shrink:0;
      display:grid;place-items:center;
      background:var(--teal);color:var(--on-primary);
      font-size:16px;font-weight:800;border-radius:var(--r)
    }
    .top h1{font-size:14px;font-weight:700;letter-spacing:-.2px;color:var(--ink);line-height:1.2}
    .top-actions{
      display:flex;flex-direction:column;gap:4px;
      padding:16px 12px 0;flex-shrink:0
    }
    .theme-toggle{
      width:100%;justify-content:flex-start;
      background:transparent;border-color:transparent;
      color:var(--muted);font-size:13px;padding:8px 10px;border-radius:var(--r)
    }
    .theme-toggle:hover{
      background:var(--light-teal);color:var(--dark-teal);border-color:transparent
    }
    .close-button{
      width:auto;margin-left:auto;justify-content:center;
      background:var(--warning);border-color:var(--pink);
      color:var(--pink);font-weight:700
    }
    .close-button:hover{background:var(--pink);border-color:var(--pink);color:var(--surface)}
    .theme-toggle:before{content:'☾ ';font-size:14px}
    .theme-toggle[aria-pressed=true]:before{content:'☀ '}

    /* ── 사이드바 탭 내비 ── */
    .tabs{
      display:flex;flex-direction:column;gap:2px;
      padding:20px 12px 0;flex-shrink:0
    }
    .tabs button{
      width:100%;justify-content:flex-start;gap:10px;
      padding:9px 10px;border-radius:var(--r);
      background:transparent;border-color:transparent;
      color:var(--muted);font-size:13px;font-weight:500
    }
    .tabs button:before{
      content:counter(nav,decimal-leading-zero);
      counter-increment:nav;
      font-size:11px;color:var(--subtle);font-variant-numeric:tabular-nums;min-width:18px
    }
    .tabs{counter-reset:nav}
    .tabs button[aria-selected=true]{
      background:var(--light-teal);color:var(--dark-teal);border-color:transparent;font-weight:600
    }
    .tabs button:hover:not([aria-selected=true]){
      background:var(--line);color:var(--ink);border-color:transparent
    }

    .sidebar-controls{
      display:flex;flex-direction:column;gap:8px;
      padding:20px 16px 0;min-width:0;flex-shrink:0
    }
    .sidebar-controls select{width:100%;min-width:0;font-size:13px}
    .sidebar-controls .small{overflow-wrap:anywhere}
    .top>.notice{margin:16px 16px 0;padding:10px 12px;border-bottom:0;overflow-wrap:anywhere}

    /* ── 메인 영역 ── */
    #tab-content{
      grid-column:2;grid-row:1;
      display:flex;flex-direction:column;
      height:100%;overflow-y:auto;
      background:var(--surface);min-width:0
    }

    /* ── 알림 배너 — 메인 상단 고정 ── */
    .notice{
      flex-shrink:0;
      font-size:12px;line-height:1.5;white-space:pre-wrap;
      padding:10px 20px 10px 16px;
      border-bottom:1px solid var(--line);
      border-left:3px solid var(--teal);
      background:var(--notice);color:var(--dark-teal)
    }
    .notice:empty{display:none}
    .notice.warn{border-color:var(--pink);color:var(--pink);background:var(--warning)}
    .hidden{display:none!important}

    /* ── 메인 내용 패딩 ── */
    .small{font-size:12px;line-height:1.55;color:var(--muted)}
    #tab-content>.small{
      flex-shrink:0;
      padding:12px 24px;border-bottom:1px solid var(--line);
      color:var(--dark-teal);font-size:12px
    }

    /* ═══════════════════════════════════════════
       대조·편집 탭 — 툴바
    ═══════════════════════════════════════════ */
    .toolbar{
      flex-shrink:0;
      display:flex;gap:6px;align-items:center;flex-wrap:nowrap;
      padding:10px 16px;border-bottom:1px solid var(--line);
      background:var(--sidebar)
    }
    .toolbar select{flex:1;min-width:0;font-size:13px}
    .toolbar button{flex-shrink:0}

    /* ── 검색바 ── */
    .search-panel{flex-shrink:0;min-width:0}
    .search-toggle{display:none}
    .searchbar{
      flex-shrink:0;
      display:grid;
      grid-template-columns:1fr 148px auto auto;
      gap:6px;align-items:center;
      padding:8px 16px;border-bottom:1px solid var(--line);
      background:var(--sidebar)
    }
    .searchbar select{min-width:0;font-size:13px}
    .searchbar input{font-size:13px}
    .searchbar #search-count{
      grid-column:1/-1;font-size:11px;color:var(--muted);min-height:16px;padding:0 2px
    }

    /* ═══════════════════════════════════════════
       에디터 2열 — 화면을 가득 채움
    ═══════════════════════════════════════════ */
    .cols{
      flex:1;display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      min-height:0
    }
    .card{
      display:flex;flex-direction:column;min-width:0;min-height:0;
      background:var(--surface)
    }
    .cols>.card+.card{border-left:1px solid var(--line)}

    /* 카드 상단 헤더바 */
    .label{
      flex-shrink:0;
      display:flex;justify-content:space-between;align-items:center;
      gap:12px;padding:10px 16px;
      border-bottom:1px solid var(--line);
      background:var(--sidebar)
    }
    .cols>.card:first-child .label{border-top:3px solid var(--gray)}
    .cols>.card:last-child .label{border-top:3px solid var(--teal)}
    .label h2{font-size:12px;font-weight:700;letter-spacing:.07em;color:var(--muted);text-transform:uppercase}
    .label button{
      min-height:28px;padding:4px 10px;
      font-size:11px;font-weight:600
    }

    /* 에디터 — 남은 공간 전부 */
    .editor{
      flex:1;display:block;width:100%;
      min-height:200px;padding:20px;
      font-size:14px;line-height:1.8;
      border:none;border-radius:0;
      resize:none
    }
    .editor:focus{border-color:transparent;outline:none;
      box-shadow:inset 2px 0 0 var(--teal)}
    .cols>.card:last-child .editor:focus{box-shadow:inset 2px 0 0 var(--teal)}

    /* ═══════════════════════════════════════════
       저장 액션 바 — 하단 고정
    ═══════════════════════════════════════════ */
    .actions{
      flex-shrink:0;
      display:flex;justify-content:flex-end;gap:8px;
      padding:10px 16px;border-top:1px solid var(--line);
      background:var(--sidebar)
    }
    .actions .primary{min-width:120px}

    /* ═══════════════════════════════════════════
       보호 데이터 — 접기/펼치기 (메인 아래)
    ═══════════════════════════════════════════ */
    details{
      flex-shrink:0;border-top:1px solid var(--line)
    }
    summary{
      cursor:pointer;list-style:none;
      display:flex;justify-content:space-between;align-items:center;
      gap:16px;padding:12px 16px;
      font-size:12px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
      color:var(--muted);
      background:var(--sidebar);
      user-select:none
    }
    summary::-webkit-details-marker{display:none}
    summary:after{
      content:'＋';font-size:16px;font-weight:300;color:var(--teal);line-height:1
    }
    details[open]>summary:after{content:'－'}
    details>p.small{padding:12px 16px 0}
    details>.cols{
      flex:none;
      grid-template-columns:repeat(2,minmax(0,1fr));
      min-height:0
    }
    details>.cols .card{border-top:none}
    details>.cols .card+.card{border-left:1px solid var(--line)}
    .field{display:flex;flex-direction:column;gap:6px;padding:12px 16px 16px}
    .field span{
      font-size:11px;font-weight:700;letter-spacing:.06em;
      text-transform:uppercase;color:var(--muted)
    }
    .field textarea{min-height:120px;font-size:13px}

    /* ═══════════════════════════════════════════
       토큰 계산기 탭
    ═══════════════════════════════════════════ */
    .card.token-card{
      flex-shrink:0;margin:16px 24px 24px;
      border:1px solid var(--line);border-radius:var(--r);overflow:hidden
    }
    .token-card-head{
      padding:16px 20px;border-bottom:1px solid var(--line);
      background:var(--sidebar)
    }
    .token-card-head h2{font-size:12px;font-weight:700;letter-spacing:.06em;color:var(--muted);margin-bottom:4px}
    .token-card-head .small{font-size:12px;max-width:680px}
    .token-controls{
      display:flex;align-items:center;gap:10px;flex-wrap:wrap;
      padding:12px 20px;border-bottom:1px solid var(--line)
    }
    .token-controls select{width:180px;font-size:13px}
    .token-controls label{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer}
    .token-controls input[type=checkbox]{
      width:15px;min-height:15px;height:15px;
      accent-color:var(--dark-teal);cursor:pointer
    }
    .token-controls button{margin-left:auto}
    .token-results{
      display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
      padding:0 20px 20px
    }
    .token-results:empty{display:none}
    .token-stat{padding:20px 20px 16px 0;min-width:0}
    .token-stat:not(:first-child){
      padding-left:20px;border-left:1px solid var(--line)
    }
    .token-stat span{
      font-size:11px;font-weight:700;letter-spacing:.06em;
      text-transform:uppercase;color:var(--muted)
    }
    .token-stat strong{
      display:block;margin-top:8px;
      font-size:clamp(24px,2.8vw,40px);line-height:1.1;
      letter-spacing:-1px;font-weight:700;color:var(--dark-teal);
      overflow-wrap:anywhere
    }
    .token-results>p{
      grid-column:1/-1;padding-top:12px;
      border-top:1px solid var(--line);margin-top:4px
    }
    .token-results>p.small{font-size:12px}

    /* ═══════════════════════════════════════════
       반응형
    ═══════════════════════════════════════════ */
    @media(max-width:900px){
      body{overflow:auto}
      .shell{
        display:flex;flex-direction:column;
        height:auto;overflow:visible
      }
      .top{
        flex-direction:row;flex-wrap:wrap;align-items:center;
        height:auto;padding:0;overflow:visible;
        border-right:none;border-bottom:1px solid var(--line)
      }
      .brand{border-bottom:none;flex:1;min-width:0;padding:12px 16px}
      .top-actions{
        flex-direction:row;align-items:center;padding:0 12px 0 0;
        order:1;width:auto;border-top:none
      }
      .theme-toggle{width:40px;height:40px;padding:0;justify-content:center;font-size:0;gap:0}
      .theme-toggle:before{font-size:22px}
      .close-button{width:auto}
      .top-actions .close-button{margin-left:0;padding:8px 10px;min-height:40px}
      .top>#view-toolbar{order:3;width:100%;border-top:none}
      .top>#view-toolbar:empty{display:none}
      #view-toolbar{flex-wrap:nowrap;gap:6px;padding:8px 12px}
      #view-toolbar button{padding:8px 10px;font-size:12px;min-height:40px}
      .sidebar-controls{order:4;width:100%;padding:12px 16px}
      .top>.notice{order:5;width:calc(100% - 32px);margin:0 16px 12px}
      .tabs{
        flex-direction:row;padding:0;order:2;width:100%;
        border-left:none;border-bottom:1px solid var(--line)
      }
      .tabs button{width:auto;border-radius:0}
      .tabs button[aria-selected=true]{
        background:transparent;border-bottom:3px solid var(--teal);
        border-radius:0;color:var(--dark-teal)
      }
      #tab-content{height:auto;overflow:visible}
      .cols{grid-template-columns:1fr;min-height:auto}
      .cols>.card+.card{border-left:none;border-top:1px solid var(--line)}
      .editor{min-height:40vh;resize:vertical}
      .searchbar{grid-template-columns:1fr 1fr}
      .search-toggle{
        display:flex;width:100%;justify-content:space-between;
        padding:10px 16px;min-height:44px;border:0;
        border-bottom:1px solid var(--line);border-radius:0;
        background:var(--sidebar);color:var(--dark-teal);font-weight:600
      }
      .search-toggle:after{content:'＋'}
      .search-toggle[aria-expanded=true]:after{content:'－'}
      .search-panel.is-collapsed>.searchbar{display:none}
      .searchbar input{grid-column:1/-1}
      .searchbar select{grid-column:1/-1}
      .token-results{grid-template-columns:1fr}
      .token-stat:not(:first-child){padding-left:0;border-left:none;border-top:1px solid var(--line)}
      .card.token-card{margin:12px 16px 16px}
      details>.cols{grid-template-columns:1fr}
      details>.cols .card+.card{border-left:none;border-top:1px solid var(--line)}
    }
    @media(max-width:600px){
      .toolbar{flex-wrap:wrap}
      .toolbar select{flex:1 1 100%}
      .searchbar{grid-template-columns:1fr}
      .searchbar select,.searchbar button{width:100%}
      .actions{flex-wrap:wrap}
      .actions .primary{flex:1}
      .token-controls{gap:8px}
      .token-controls select,.token-controls button{width:100%}
    }

    /* ═══════════════════════════════════════════
       다크 모드
    ═══════════════════════════════════════════ */
    :root[data-theme="dark"]{
      color-scheme:dark;
      --surface:#0F1A1C;
      --sidebar:#141F22;
      --input:#182326;
      --disabled:#1C2A2E;
      --notice:#163130;
      --warning:#2E1828;
      --ink:#E8F2F1;
      --muted:#8DADB0;
      --subtle:#4E7074;
      --line:#243235;
      --gray:#2E4448;
      --teal:#52BBB1;
      --dark-teal:#8CD9D1;
      --light-teal:#1A3735;
      --pink:#F18AD5;
      --on-primary:#082724;
      --primary-hover:#8CD9D1
    }
    :root[data-theme="dark"] .editor{caret-color:var(--teal)}

    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
  `;
  const $=id=>document.getElementById(id);
  function el(tag,props={},children=[]) {
    const n=document.createElement(tag);Object.assign(n,props);for(const c of children)n.append(c);return n;
  }
  function button(text,fn,primary=false) {
    const b=el('button',{textContent:text,className:primary?'primary':''});
    b.addEventListener('click',()=>Promise.resolve().then(fn).catch(e=>notice(e.message,true)));return b;
  }
  function notice(text,error=false) {
    const n=$('notice');if(n){n.textContent=text;n.classList.toggle('warn',error);}else console.log(text);
  }
  const THEME_KEY='gigatrans-utility-theme';
  let theme='light';
  // Load once per plugin session; a missing preference keeps the original light theme.
  const themeReady=(async()=>{
    try {
      const saved=await R.pluginStorage.getItem(THEME_KEY);
      if(saved==='dark'||saved==='light')theme=saved;
    } catch(e) {console.warn('[GigaTrans Utility] 테마 설정을 불러오지 못했습니다:',e.message);}
  })();
  function applyTheme() {
    document.documentElement.dataset.theme=theme;
    const toggle=$('theme-toggle');
    if(toggle){
      toggle.textContent=theme==='dark'?'라이트 모드':'다크 모드';
      toggle.setAttribute('aria-label','다크 모드');
      toggle.setAttribute('aria-pressed',String(theme==='dark'));
      toggle.title=theme==='dark'?'라이트 모드로 전환':'다크 모드로 전환';
    }
  }
  async function toggleTheme() {
    theme=theme==='dark'?'light':'dark';
    applyTheme();
    const toggle=$('theme-toggle');
    if(toggle)toggle.disabled=true;
    try {await R.pluginStorage.setItem(THEME_KEY,theme);}
    catch(e){notice('화면 모드는 변경했지만 설정을 저장하지 못했습니다. 다음 실행에는 유지되지 않을 수 있습니다.',true);}
    finally{if(toggle)toggle.disabled=uiBusy;}
  }
  function dirty() {return view && $('original') && ($('original').value!==view.pair.original||$('translation').value!==view.pair.translation||$('protected-head')?.value!==protectedValues(view.pair).head||$('protected-tail')?.value!==protectedValues(view.pair).tail);}
  function canLeave() {return !uiBusy && (!dirty()||confirm('저장하지 않은 편집 내용을 버릴까요?'));}
  let cleanupResponsiveLayout=null;
  function layout(active='editor') {
    cleanupResponsiveLayout?.();
    document.head.querySelector('#gt-style')?.remove();
    document.head.append(el('style',{id:'gt-style',textContent:CSS}));
    document.body.replaceChildren();
    const shell=el('main',{className:'shell'});
    const sidebar=el('header',{className:'top'});
    sidebar.append(el('div',{className:'brand'},[
      el('span',{className:'brand-mark',textContent:'G'}),
      el('h1',{textContent:'GigaTrans Utility'})
    ]));
    const nav=el('nav',{className:'tabs',role:'tablist',ariaLabel:'GigaTrans 메뉴'});
    for(const[id,label,fn]of [['editor','대조 · 편집',openViewer],['tokens','토큰 계산기',openCalculator]]) {
      const tab=button(label,async()=>{if(id!==active&&canLeave())await fn();});
      tab.id='tab-'+id;
      tab.setAttribute('role','tab');
      tab.setAttribute('aria-selected',String(id===active));
      tab.setAttribute('aria-controls','tab-content');
      tab.tabIndex=id===active?0:-1;
      tab.addEventListener('keydown',e=>{
        if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){
          e.preventDefault();
          const list=[...nav.children];
          const next=e.key==='Home'?list[0]:e.key==='End'?list.at(-1):list[(list.indexOf(tab)+(e.key==='ArrowDown'?1:-1)+list.length)%list.length];
          next.focus();
        }
      });
      nav.append(tab);
    }
    const themeToggle=button('다크 모드',toggleTheme);
    themeToggle.id='theme-toggle';themeToggle.className='theme-toggle';
    const close=button('✕ 닫기',async()=>{if(canLeave()){view=null;await R.hideContainer();}});
    close.className='close-button';
    sidebar.append(nav);
    sidebar.append(el('div',{id:'sidebar-controls',className:'sidebar-controls'}));
    const status=el('div',{id:'notice',className:'notice',role:'status'});
    if(active==='editor')sidebar.append(status);
    const topActions=el('div',{className:'top-actions'},[themeToggle]);
    sidebar.append(topActions);
    const content=el('section',{id:'tab-content',role:'tabpanel'});
    content.setAttribute('aria-labelledby','tab-'+active);
    if(active!=='editor')content.append(status);
    const toolbar=el('div',{id:'view-toolbar',className:'toolbar'},[close]);
    content.append(toolbar);
    shell.append(sidebar,content);
    document.body.append(shell);
    const mobile=window.matchMedia('(max-width:900px)');
    const arrangeToolbar=()=>{
      if(mobile.matches){
        topActions.append(close);
        nav.after(toolbar);
      }else{
        toolbar.append(close);
        content.prepend(toolbar);
      }
    };
    arrangeToolbar();
    mobile.addEventListener('change',arrangeToolbar);
    cleanupResponsiveLayout=()=>mobile.removeEventListener('change',arrangeToolbar);
    applyTheme();
    return content;
  }
  async function copy(id) {
    const input=$(id);
    try{await navigator.clipboard.writeText(input.value);notice('복사했습니다.');}
    catch{input.focus();input.select();notice('텍스트를 선택했습니다. Ctrl+C 또는 기기의 복사 기능을 사용하세요.');}
  }
  function bindScrollSync(original,translation) {
    const pending=new WeakMap();
    let lastSource=original;
    function sync(source) {
      if(!scrollSyncEnabled)return;
      const range=source.scrollHeight-source.clientHeight;
      if(range<=0)return;
      const target=source===original?translation:original;
      const ratio=Math.max(0,Math.min(1,source.scrollTop/range));
      const next=ratio*Math.max(0,target.scrollHeight-target.clientHeight);
      if(Math.abs(target.scrollTop-next)<1)return;
      target.scrollTop=next;
      // Ignore the resulting asynchronous scroll event, including browser rounding.
      pending.set(target,target.scrollTop);
    }
    for(const input of [original,translation])input.addEventListener('scroll',()=>{
      const expected=pending.get(input);
      pending.delete(input);
      if(expected!==undefined&&Math.abs(input.scrollTop-expected)<1)return;
      lastSource=input;
      sync(input);
    },{passive:true});
    return ()=>{pending.delete(original);pending.delete(translation);sync(lastSource);};
  }
  async function openViewer(index, searchQuery='') {
    await themeReady;
    const target=await current();view=null;
    const shell=layout(),bar=$('view-toolbar'),sel=el('select',{id:'messages','ariaLabel':'메시지 선택'});
    $('sidebar-controls').append(el('p',{className:'small',textContent:(target.char.name||'캐릭터')+' / '+(target.chat.name||'채팅')}));
    const indices=[];
    target.chat.message.forEach((m,i)=>{
      if(m.role!=='char')return;indices.push(i);
      sel.append(el('option',{value:String(i),textContent:'#'+(i+1)}));
    });
    const move=async delta=>{if(!canLeave())return;const pos=indices.indexOf(Number(sel.value));const next=indices[pos+delta];if(next!==undefined)await openViewer(next,$('search-query')?.value||'');};
    $('sidebar-controls').append(sel);
    bar.prepend(button('← 이전',()=>move(-1)),button('다음 →',()=>move(1)),button('새로고침',async()=>{if(canLeave())await openViewer(Number(sel.value));}));
    sel.addEventListener('change',()=>{const i=Number(sel.value);if(canLeave())openViewer(i).catch(e=>notice(e.message,true));else sel.value=String(view.snap.index);});
    if(!indices.length){notice('현재 채팅에 캐릭터 메시지가 없습니다.');await R.showContainer('fullscreen');return;}
    const i=indices.includes(index)?index:indices.at(-1);sel.value=String(i);
    let pair;
    try{pair=splitMessage(target.chat.message[i].data||'');}catch(e){notice(e.message,true);await R.showContainer('fullscreen');return;}
    view={target,snap:snapshot(target.chat,i),pair};
    const search=el('div',{className:'toolbar searchbar'}),query=el('input',{id:'search-query',type:'search',placeholder:'현재 원문·번역문에서 검색',ariaLabel:'검색어'}),scope=el('select',{id:'search-scope',ariaLabel:'검색 범위'}),count=el('span',{id:'search-count',className:'small',role:'status'});
    query.value=searchQuery;
    for(const [value,label]of [['both','원문 + 번역문'],['original','원문'],['translation','번역문']])scope.append(el('option',{value,textContent:label}));
    let matches=[],matchIndex=-1;
    function updateSearch(){matches=[];matchIndex=-1;for(const id of ['original','translation'])if(scope.value==='both'||scope.value===id)for(const m of findMatches($(id)?.value||'',query.value))matches.push({...m,id});count.textContent=query.value?(matches.length+'개 결과'):'검색어를 입력하세요';}
    function moveMatch(delta){if(!matches.length)return;matchIndex=matchIndex<0?(delta<0?matches.length-1:0):(matchIndex+delta+matches.length)%matches.length;const m=matches[matchIndex],input=$(m.id);input.focus();input.setSelectionRange(m.start,m.end);const style=getComputedStyle(input),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=style.font;const width=Math.max(1,input.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));const lines=input.value.slice(0,m.start).split('\n').reduce((n,line)=>n+Math.max(1,Math.ceil(ctx.measureText(line).width/width)),0);input.scrollTop=Math.max(0,(lines-1)*parseFloat(style.lineHeight)-input.clientHeight/2);count.textContent=(matchIndex+1)+' / '+matches.length+' · '+(m.id==='original'?'원문':'번역문');}
    query.addEventListener('input',updateSearch);scope.addEventListener('change',updateSearch);
    search.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();moveMatch(e.shiftKey?-1:1);}});
    search.append(query,scope,button('이전 결과',()=>moveMatch(-1)),button('다음 결과',()=>moveMatch(1)),count);
    search.id='search-fields';
    const searchPanel=el('div',{className:'search-panel is-collapsed'});
    const searchToggle=button('검색',()=>{
      const collapsed=searchPanel.classList.toggle('is-collapsed');
      searchToggle.setAttribute('aria-expanded',String(!collapsed));
    });
    searchToggle.className='search-toggle';
    searchToggle.setAttribute('aria-expanded','false');
    searchToggle.setAttribute('aria-controls','search-fields');
    searchPanel.append(searchToggle,search);shell.append(searchPanel);
    const cols=el('div',{className:'cols'});
    for(const [id,title,value] of [['original','원문',pair.original],['translation','번역문',pair.translation]]) {
      const card=el('section',{className:'card'}),head=el('div',{className:'label'}),input=el('textarea',{id,className:'editor',value,ariaLabel:title,spellcheck:false});
      head.append(el('h2',{textContent:title}),button('복사',()=>copy(id)));card.append(head,input);cols.append(card);
      input.addEventListener('input',()=>{
        updateSearch();
        notice(id==='original'?'원문이 변경되었습니다. 기존 번역문과 맞지 않을 수 있습니다.':'저장하지 않은 변경 사항이 있습니다.');
      });
    }
    shell.append(cols);updateSearch();
    const resync=bindScrollSync($('original'),$('translation'));
    const syncToggle=button('',()=>{
      scrollSyncEnabled=!scrollSyncEnabled;
      updateSyncToggle();
      if(scrollSyncEnabled)resync();
    });
    function updateSyncToggle(){
      syncToggle.textContent='스크롤 동기화 '+(scrollSyncEnabled?'켜짐':'꺼짐');
      syncToggle.setAttribute('aria-label','스크롤 동기화');
      syncToggle.setAttribute('aria-pressed',String(scrollSyncEnabled));
      syncToggle.title='원문과 번역문을 전체 스크롤 범위의 같은 비율로 이동';
    }
    updateSyncToggle();
    $('sidebar-controls').append(syncToggle);
    const advanced=el('details'),sumEl=el('summary',{textContent:'보호 데이터'});
    advanced.append(sumEl,el('p',{className:'small',textContent:pair.paired?'앞부분과 뒷부분을 편집한 뒤 변경 저장을 누르세요. 메모·상태 태그를 포함해 입력하며, GigaTrans 제어 태그는 자동으로 유지합니다.':'번역되지 않은 메시지는 보호 영역을 구별할 수 없습니다. 원문에서 편집하세요.'}));
    const protectedCols=el('div',{className:'cols'}),pv=protectedValues(pair);
    for(const [key,title] of [['head','앞부분'],['tail','뒷부분']]) {
      const card=el('section',{className:'card'});
      const input=el('textarea',{id:'protected-'+key,value:pv[key],ariaLabel:title,disabled:!pair.paired,spellcheck:false});
      input.addEventListener('input',()=>notice('보호된 데이터에 저장하지 않은 변경 사항이 있습니다.'));
      card.append(el('label',{className:'field'},[el('span',{textContent:title}),input]));
      protectedCols.append(card);
    }
    advanced.append(protectedCols);
    const actions=el('div',{className:'actions'});
    actions.append(button('변경 저장',saveEditors,true));
    shell.append(advanced,actions);
    notice(pair.legacy?'이전 Relay 형식: 알려진 보호 태그를 분리했습니다. 사용자 정의 앞부분은 번역문에 포함될 수 있습니다.':pair.paired?'':'아직 번역되지 않은 메시지입니다.');
    await R.showContainer('fullscreen');
  }
  async function openCalculator() {
    await themeReady;
    const preferred=view?.snap.index;
    const target=await current();view=null;
    const shell=layout('tokens');
    $('sidebar-controls').append(el('p',{className:'small',textContent:(target.char.name||'캐릭터')+' / '+(target.chat.name||'채팅')}));
    const messageSelect=el('select',{id:'token-message',ariaLabel:'계산할 원문 메시지'});
    target.chat.message.forEach((m,i)=>{if(m.role==='char')messageSelect.append(el('option',{value:String(i),textContent:'#'+(i+1)}));});
    $('sidebar-controls').append(messageSelect);
    if(!messageSelect.options.length){notice('현재 채팅에 캐릭터 메시지가 없습니다.');await R.showContainer('fullscreen');return;}
    messageSelect.value=Array.from(messageSelect.options).some(o=>Number(o.value)===preferred)?String(preferred):messageSelect.options[messageSelect.options.length-1].value;
    const calculator=el('section',{className:'card token-card'});
    const cardHead=el('div',{className:'token-card-head'});
    cardHead.append(el('h2',{textContent:'토큰 계산기'}),el('p',{className:'small',textContent:'글자 종류와 길이로 계산하는 로컬 추정치입니다. 계열별 계수는 편의상 정한 가정이며 실제 모델과 오차가 있습니다. API 호출이나 원문 전송은 없습니다.'}));
    calculator.append(cardHead);
    const profile=el('select',{id:'token-profile',ariaLabel:'토큰 추정 기준'}),include=el('input',{id:'token-protected',type:'checkbox'}),result=el('div',{id:'token-result',className:'token-results',role:'status'});
    for(const [key,p] of Object.entries(TOKEN_PROFILES))profile.append(el('option',{value:key,textContent:p.label}));
    const calculate=async()=>{
      const latest=await readTarget(target);
      const summary=estimateChat(latest,profile.value,include.checked);
      const selectedIndex=locate(latest,snapshot(target.chat,Number(messageSelect.value)));
      const pair=splitMessage(latest.message[selectedIndex].data||'');
      const draft=pair.original+(include.checked?'\n'+pair.head+'\n'+pair.tail:'');
      const currentTokens=estimateTokens(tokenText(draft,include.checked),profile.value);
      result.replaceChildren();
      for(const [title,n]of [['선택한 원문 · 저장됨',currentTokens],['캐릭터 원문 합계 · 저장됨',summary.originals],['대화 합계 · 원문 + 사용자',summary.total]])result.append(el('div',{className:'token-stat'},[el('span',{textContent:title}),el('strong',{textContent:'약 '+n.toLocaleString()+' 토큰'})]));
      result.append(el('p',{className:'small',textContent:'저장된 캐릭터 메시지 '+summary.characters+'개 · 사용자 메시지 약 '+summary.users.toLocaleString()+' 토큰'+(summary.skipped?' · 태그가 손상된 메시지 '+summary.skipped+'개 제외':'')}));
    };
    const clearEstimate=()=>result.replaceChildren(el('p',{className:'small',textContent:'내용 또는 기준이 변경되었습니다. 다시 계산하세요.'}));
    profile.addEventListener('change',clearEstimate);include.addEventListener('change',clearEstimate);
    calculator.append(el('div',{className:'token-controls'},[profile,el('label',{},[include,el('span',{textContent:'보호 데이터 포함'})]),button('토큰 계산 / 새로고침',calculate,true)]),result);shell.append(calculator);
    messageSelect.addEventListener('change',clearEstimate);
    await R.showContainer('fullscreen');
  }
  function busy(on) {
    document.querySelectorAll('button,select,textarea').forEach(n=>n.disabled=on);
  }
  async function saveEditors() {
    if(!view||uiBusy)return;
    const v=view,original=$('original').value,translation=$('translation').value;
    const raw=replaceAllAreas(v.pair,original,translation,$('protected-head').value,$('protected-tail').value);
    uiBusy=true;busy(true);
    try{const saved=await saveDraft(v.target,v.snap,raw);await openViewer(saved.index);notice('채팅에 저장했습니다.');}
    finally{uiBusy=false;busy(false);if(view&&!view.pair.paired){$('protected-head').disabled=true;$('protected-tail').disabled=true;}}
  }
  async function watch() {
    if(stopped)return;
    try {
      if(view&&!uiBusy) {
        const v=view, ci=await R.getCurrentCharacterIndex(),hi=await R.getCurrentChatIndex();
        if(v.target.ci!==ci||v.target.hi!==hi){notice('다른 채팅으로 이동했습니다. 새로고침하면 현재 채팅을 엽니다. 편집본은 자동으로 덮어쓰지 않습니다.',true);return;}
        const chat=await readTarget(v.target);
        try{locate(chat,v.snap);}catch(e){notice(e.message,true);return;}
        if(chat.message.length!==v.target.chat.message.length)notice('새 메시지가 있습니다. 새로고침으로 목록을 갱신하세요.');
      }
    } catch(e){notice(e.message,true);}
    finally{if(!stopped)watchTimer=setTimeout(watch,2000);}
  }
  // Test seam is reachable only in the local VM harness; no Risu API is altered.
  if(typeof __GT_TEST__!=='undefined') {
    Object.assign(__GT_TEST__,{splitMessage,replacePair,replaceAllAreas,protectedValues,findMatches,estimateTokens,estimateChat,locate,saveDraft,openViewer,openCalculator});
    return;
  }
  const registrations=[];
  registrations.push(await R.registerButton({name:'GigaTrans Utility',icon:'⚡',iconType:'html',location:'chat'},openViewer));
  await R.onUnload(async()=>{
    stopped=true;clearTimeout(watchTimer);
    for(const part of registrations)await R.unregisterUIPart(typeof part==='string'?part:part.id);
  });
  watchTimer=setTimeout(watch,2000);
  console.log('[GigaTrans Utility] v1.6.0 준비 완료');
})().catch(e=>console.error('[GigaTrans Utility] 초기화 실패:',e.message));
