//@name openrouter-claude-batch
//@display-name OpenRouter Claude Batch
//@api 3.0
//@version 1.1.12
//@update-url https://raw.githubusercontent.com/sae-chi/RisuAIPlugin/refs/heads/main/openrouter-claude-batch.js

(() => {
  'use strict';
  const BASE = 'https://openrouter.ai/api/v1/batches';
  const PREFIX = 'openrouter-claude-batch:v1:';
  // Recovery helper: a POST 404 can contain an ID allocated inside OpenRouter.
  // Treat it only as a candidate, never as proof of a successful submission.
  const batchIdFromNotFound = message => /Batch job\s+(batch[-_][a-zA-Z0-9_-]+)\s+not found/i.exec(String(message || ''))?.[1] || '';

  const TERMINAL = new Set(['completed', 'failed', 'expired', 'cancelled']);
  const ACTIVE = new Set(['validating', 'in_progress', 'finalizing', 'cancelling']);
  const DEFAULTS = Object.freeze({model: '', mode: 'defer', pollSeconds: 30,
    waitMinutes: 30, provider: '', thinking: 'high', cache: 'off'});
  const copy = value => JSON.parse(JSON.stringify(value));
  const fail = message => ({success: false, content: message});
  const record = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const canonical = x => JSON.stringify(x, (_, v) => record(v)
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
  async function hash(text) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
  }
  function safeError(error, key = '') {
    let text = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
    if (key) text = text.split(key).join('[키 숨김]');
    return (text || '알 수 없는 오류').replace(/sk-or-[\w-]+/g, '[키 숨김]').slice(0, 1400);
  }
  function config(input, requireModel = true) {
    const c = {...DEFAULTS, ...input};
    c.model = String(c.model || '').trim();
    if ((requireModel || c.model) && !/^anthropic\/claude-[a-zA-Z0-9._-]+(?::batch)?$/.test(c.model))
      throw Error('모델 ID는 anthropic/claude-… 형식으로 입력해. 배치 지원 모델인지도 확인해.');
    if (!['wait', 'defer'].includes(c.mode)) throw Error('수신 모드를 확인해.');
    for (const [k, min, max] of [['pollSeconds', 10, 600], ['waitMinutes', 1, 1440]]) {
      c[k] = Number(c[k]);
      if (!Number.isInteger(c[k]) || c[k] < min || c[k] > max) throw Error(`${k}: ${min}~${max} 정수로 입력해.`);
    }
    c.provider = String(c.provider || '').trim();
    if (c.provider && !/^[a-zA-Z0-9._/-]+$/.test(c.provider)) throw Error('공급자 slug를 하나만 입력해.');
    // Older presets stored cache as a boolean and thinking as off/enabled/adaptive.
    if (c.cache === true) c.cache = '5m'; else if (c.cache === false || c.cache == null || c.cache === '') c.cache = 'off';
    if (!['off', '5m', '1h'].includes(c.cache)) throw Error('프롬프트 캐시 설정을 확인해.');
    // thinking = none | low | medium | high | max. Anything but none sends adaptive thinking with that effort.
    // Legacy values: off -> none; adaptive/enabled -> the old separate effort, else high (the API default).
    const levels = ['low', 'medium', 'high', 'max'];
    if (c.thinking === 'off') c.thinking = 'none';
    else if (!['none', ...levels].includes(c.thinking)) c.thinking = levels.includes(c.effort) ? c.effort : 'high';
    return Object.fromEntries(Object.keys(DEFAULTS).map(k => [k, c[k]]));
  }
  function buildBody(args, c) {
    if (!Array.isArray(args.prompt_chat) || !args.prompt_chat.length) throw Error('전송할 대화가 없어.');
    const system = [], messages = [];
    for (const m of args.prompt_chat) {
      if (!m || !['system', 'developer', 'user', 'assistant'].includes(m.role)) throw Error('텍스트 대화만 지원해. 도구 메시지는 사용할 수 없어.');
      if (typeof m.content !== 'string' || m.multimodals?.length || m.images?.length || /\{\{inlayed::/.test(m.content))
        throw Error('이 버전은 텍스트 전용이야. 이미지·파일·인레이 첨부를 제거해.');
      if (!m.content.trim()) continue;
      if (m.role === 'system' || m.role === 'developer') {
        // Leading instructions stay in Anthropic's system field; later instructions
        // keep their place in the conversation instead of being reordered globally.
        if (!messages.length) { system.push({type: 'text', text: m.content}); continue; }
      }
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      const text = m.name ? `${m.name}: ${m.content}` : m.content;
      const previous = messages.at(-1);
      if (previous?.role === role) previous.content.push({type: 'text', text});
      else messages.push({role, content: [{type: 'text', text}]});
    }
    if (!messages.length) throw Error('사용자 또는 어시스턴트 메시지가 필요해.');
    if (messages[0].role !== 'user') messages.unshift({role: 'user', content: [{type: 'text', text: 'Continue the conversation.'}]});
    const max = Number(args.max_tokens);
    if (!Number.isInteger(max) || max < 1) throw Error('Risu의 최대 응답 토큰을 1 이상으로 설정해.');
    const body = {max_tokens: max, messages};
    if (system.length) {
      if (c.cache !== 'off') system.at(-1).cache_control = c.cache === '1h' ? {type: 'ephemeral', ttl: '1h'} : {type: 'ephemeral'};
      body.system = system;
    }
    if (c.thinking === 'none') {
      // Risu passes provider sampling arguments in API units, already divided by 100.
      if (Number.isFinite(args.temperature)) body.temperature = Math.max(0, Math.min(1, args.temperature));
    } else {
      // Anthropic rejects sampling overrides and assistant prefill with thinking on.
      if (messages.at(-1).role === 'assistant') throw Error('사고 모드(Adaptive)에서는 어시스턴트 프리필을 제거해.');
      body.thinking = {type: 'adaptive'};
      body.output_config = {effort: c.thinking};
    }
    return body;
  }
  function envelope(c, body, customId) {
    // OpenRouter stream-parses this JSON: routing fields MUST precede requests.
    return {endpoint: '/v1/messages', model: c.model,
      ...(c.provider ? {provider: {only: [c.provider]}} : {}), completion_window: '24h',
      requests: [{custom_id: customId, body}]};
  }
  function readResult(batch, customId) {
    const item = batch.results?.find(r => r.custom_id === customId);
    if (!item) throw Error('완료된 작업에서 요청 ID에 맞는 결과를 찾지 못했어.');
    if (item.error) throw Error(safeError(item.error));
    if (item.response?.status_code !== 200) throw Error(`개별 요청 실패: ${item.response?.status_code ?? '응답 없음'}`);
    const b = item.response.body;
    if (b?.error) throw Error(safeError(b.error));
    if (!Array.isArray(b?.content)) throw Error('Anthropic Messages 결과 형식이 아니야.');
    if (b.stop_reason === 'refusal') throw Error('모델이 요청을 거절했어.');
    if (b.content.some(p => p.type === 'tool_use')) throw Error('도구 실행 결과는 이 버전에서 지원하지 않아.');
    const text = b.content.filter(p => p.type === 'text').map(p => p.text || '').join('');
    if (!text.trim()) throw Error('반환할 텍스트가 없어.');
    return {text, thinking: b.content.filter(p => p.type === 'thinking').map(p => p.thinking || '').join('\n'),
      usage: b.usage || null, cost: batch.usage?.cost ?? null, stopReason: b.stop_reason || '', generationId: b.id || ''};
  }
  const stopped = signal => { if (signal?.aborted) throw Error('대기를 중지했어. 접수된 서버 작업은 유지돼.'); };
  function sleep(ms, signal) {
    return new Promise(resolve => {
      if (signal?.aborted) return resolve();
      const done = () => { clearTimeout(timer); signal?.removeEventListener('abort', done); resolve(); };
      const timer = setTimeout(done, ms);
      signal?.addEventListener('abort', done, {once: true});
    });
  }
  class Engine {
    constructor({storage, fetcher, getKey, now = Date.now, digest = hash, uuid = () => crypto.randomUUID(), changed = () => {}, onNotice = () => {}}) {
      Object.assign(this, {storage, fetcher, getKey, now, digest, uuid, changed, onNotice});
      this.jobs = []; this.presets = [{id: 'legacy', name: '기본 프리셋', config: {...DEFAULTS}}]; this.serial = Promise.resolve();
      this.running = new Set(); this.refreshing = new Map(); this.claiming = new Set();
    }
    // Notices are best-effort UI only. A UI failure must never affect the
    // billing, submission, retrieval, or single-claim state machine.
    announce(payload) {
      try {
        const response = this.onNotice(payload);
        if (response?.catch) response.catch(() => {});
      } catch { /* Never modify a job's outcome because a notice failed. */ }
    }
    async init() {
      const raw = await this.storage.getItem(PREFIX + 'state');
      if (raw != null) {
        const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (![1, 2].includes(s.version) || !Array.isArray(s.jobs) || s.jobs.some(j => !j.id || !j.signature || !j.customId || !j.keyHash))
          throw Error('저장된 작업 형식을 읽을 수 없어. 원본 저장소는 변경하지 않았어.');
        if (s.version === 1) this.settings = config(s.settings, false);
        else {
          if (!Array.isArray(s.presets) || !s.presets.length || s.presets.some(p => !p.id || typeof p.name !== 'string' || !p.name.trim()) || new Set(s.presets.map(p => p.id)).size !== s.presets.length)
            throw Error('저장된 프리셋 형식을 읽을 수 없어.');
          this.presets = s.presets.map(p => ({id: p.id, name: p.name, config: config(p.config, false)}));
        }
        this.jobs = s.jobs;
        for (const j of this.jobs) { j.presetId ??= 'legacy'; j.pollSeconds ??= this.settings.pollSeconds; }
        for (const j of this.jobs) if (j.status === 'submitting') j.status = 'unknown';
      }
      return this;
    }
    get settings() { return this.presets[0].config; }
    set settings(value) { this.presets[0].config = value; }
    preset(id) {
      const p = this.presets.find(p => p.id === id);
      if (!p) throw Error('삭제된 프리셋이야. Risu 모델 목록에서 다른 프리셋을 선택해.');
      return p;
    }
    persist() {
      const snapshot = JSON.stringify({version: 2, presets: this.presets, jobs: this.jobs});
      const op = this.serial.catch(() => {}).then(() => this.storage.setItem(PREFIX + 'state', snapshot));
      this.serial = op;
      return op.then(() => { this.changed(); });
    }
    async saveSettings(value) { this.settings = config(value); await this.persist(); }
    async savePreset(id, name, value) {
      name = String(name || '').trim();
      if (!name || name.length > 60) throw Error('프리셋 이름을 1~60자로 입력해.');
      if (this.presets.some(p => p.id !== id && p.name === name)) throw Error('이미 사용 중인 프리셋 이름이야.');
      const next = {id: id || this.uuid(), name, config: config(value)};
      const old = this.presets;
      this.presets = id ? old.map(p => p.id === this.preset(id).id ? next : p) : [...old, next];
      try { await this.persist(); } catch(e) { this.presets = old; throw e; }
      return next;
    }
    async deletePreset(id) {
      if (this.presets.length < 2) throw Error('프리셋은 하나 이상 남겨야 해.');
      if (this.jobs.some(j => (j.presetId || 'legacy') === id && !j.released &&
          (ACTIVE.has(j.status) || ['unknown', 'submitting'].includes(j.status) || (j.result && !j.consumed))))
        throw Error('이 프리셋의 진행 중이거나 미수령인 작업을 먼저 처리해.');
      const old = this.presets; this.presets = old.filter(p => p.id !== id);
      try { await this.persist(); } catch(e) { this.presets = old; throw e; }
    }
    async credentials(job) {
      const key = String(await this.getKey() || '').trim();
      if (!key) throw Error('설정에서 OpenRouter API 키를 저장해.');
      const keyHash = await this.digest(key);
      if (job && keyHash !== job.keyHash) throw Error('이 작업을 접수할 때 사용한 API 키를 다시 설정해.');
      return {key, keyHash};
    }
    async api(path, method, key, body) {
      const control = new AbortController();
      const timer = setTimeout(() => control.abort(), 60000);
      try {
        const r = await this.fetcher(BASE + path, {method, headers: {'Content-Type': 'application/json', Authorization: `Bearer ${key}`},
          ...(body ? {body: JSON.stringify(body)} : {}), signal: control.signal});
        if (!r.ok) {
          const error = Error(`OpenRouter ${method} /api/v1/batches${path} HTTP ${r.status}: ${safeError(await r.text(), key)}`);
          error.status = r.status; throw error;
        }
        return await r.json();
      } catch (e) {
        const clean = Error(safeError(e, key)); clean.status = e.status; throw clean;
      } finally { clearTimeout(timer); }
    }
    async getOrSubmit(args, context, c, signal, presetId = this.presets[0].id) {
      stopped(signal);
      const {key, keyHash} = await this.credentials();
      // Explicit UI consent takes priority over regenerated prompt content.
      // The saved result must never cause another paid batch submission.
      const armed = this.jobs.find(j => j.manualClaimArmed === true && j.result && !j.consumed &&
        !j.released && j.keyHash === keyHash && j.context.scope === context.scope &&
        (j.presetId || 'legacy') === presetId);
      if (armed) return armed;
      const body = buildBody(args, c);
      // Preserve the legacy signature for saved jobs and add a mode-independent
      // fingerprint. Regeneration may set args.mode differently from generation.
      const identity = {scope: context.scope, keyHash,
        model: c.model, provider: c.provider, body,
        ...(presetId === 'legacy' ? {} : {presetId})};
      const signature = await this.digest(canonical({...identity, mode: args.mode || ''}));
      const contentSignature = await this.digest(canonical(identity));
      const lock = JSON.stringify([context.scope, presetId]);
      if (this.running.has(lock)) throw Error('이 프리셋의 입력을 이미 접수 중이야. 잠시 뒤 다시 확인해.');
      this.running.add(lock);
      try {
        const previous = this.jobs.find(j => j.signature === signature && (j.presetId || 'legacy') === presetId && !j.released);
        if (previous) return previous;
        // Match new jobs even if only args.mode changes between send and regenerate.
        const sameContent = this.jobs.find(j => j.contentSignature === contentSignature && j.keyHash === keyHash &&
          j.context.scope === context.scope && (j.presetId || 'legacy') === presetId && !j.released);
        if (sameContent) return sameContent;
        const outstanding = this.jobs.find(j => j.context.scope === context.scope && (j.presetId || 'legacy') === presetId && !j.released &&
          (ACTIVE.has(j.status) || ['unknown', 'submitting'].includes(j.status) || (j.result && !j.consumed)));
        if (outstanding) {
          if (outstanding.result && !outstanding.consumed) {
            if (outstanding.keyHash !== keyHash) throw Error('미수령 배치를 접수한 OpenRouter API 키를 다시 설정해. 새 배치는 만들지 않았어.');
            // Prompt or settings may have changed. Retrieval still requires
            // the explicit UI action instead of an exact request fingerprint.
            return outstanding;
          }
          throw Error('이 채팅·프리셋에 처리 중이거나 접수가 불명확한 배치가 있어. 플러그인 작업 목록에서 상태를 확인해. 새 배치는 만들지 않았어.');
        }
        stopped(signal);
        const id = this.uuid();
        const j = {id, customId: `orcb-${id}`, signature, contentSignature, keyHash, batchId: '', model: c.model,
          presetId, presetName: this.preset(presetId).name, pollSeconds: c.pollSeconds, responseMode: c.mode,
          context: copy(context), status: 'submitting', remoteStatus: '', createdAt: this.now(), updatedAt: this.now(),
          consumed: false, released: false, remoteDeleted: false, error: '', result: null};
        this.jobs.unshift(j);
        // Durable intent BEFORE POST. A lost response must never trigger an automatic second POST.
        await this.persist();
        try {
          const b = await this.api('', 'POST', key, envelope(c, body, j.customId));
          if (typeof b.id !== 'string' || !b.id) throw Error('접수 응답에 batch ID가 없어.');
          j.batchId = b.id; j.status = ACTIVE.has(b.status) || TERMINAL.has(b.status) ? b.status : 'validating';
          j.remoteStatus = j.status;
          // Acceptance and availability for GET need not be simultaneous.
          // Delay the first automatic lookup rather than immediately querying POST's ID.
          j.acceptedAt = this.now(); j.nextPollAt = j.acceptedAt + c.pollSeconds * 1000;
        } catch (e) {
          const candidate = e.status === 404 ? batchIdFromNotFound(e.message) : '';
          if (candidate) {
            // 404 occurred during POST but the response references an allocated
            // batch ID. Preserve it, poll GET only, NEVER automatically POST again.
            j.batchId = candidate;
            j.status = 'unknown';
            j.remoteStatus = '';
            j.nextPollAt = this.now() + c.pollSeconds * 1000;
            j.lastError = `POST가 404로 끝났지만 서버 오류에 배치 ID ${candidate}가 들어 있어 보존했어. 접수 성공은 미확인이야. 같은 ID를 조회만 재시도하고, 새 POST는 자동 실행하지 않아.\n${safeError(e, key)}`;
            j.error = '';
          } else {
            j.status = [400, 401, 402, 403, 404, 413, 422, 429].includes(e.status) ? 'failed' : 'unknown';
            j.error = safeError(e, key);
          }
        }
        j.updatedAt = this.now(); await this.persist();
        if (c.mode === 'defer' && j.batchId) {
          // Show a separate, non-chat notice only for a NEW submission.
          this.announce({kind: j.status === 'unknown' ? 'uncertain' : j.status === 'failed' ? 'failed' : 'submitted',
            batchId: j.batchId, chatName: context.name, error: j.status === 'unknown' ? j.lastError : ''});
        }
        return j;
      } finally { this.running.delete(lock); }
    }
    async refresh(j) {
      if (!j.batchId || j.remoteDeleted || j.result) return j;
      if (this.refreshing.has(j.id)) return this.refreshing.get(j.id);
      const promise = this.doRefresh(j).finally(() => this.refreshing.delete(j.id));
      this.refreshing.set(j.id, promise); return promise;
    }
    async doRefresh(j) {
      const {key} = await this.credentials(j);
      try {
        const b = await this.api('/' + encodeURIComponent(j.batchId), 'GET', key);
        if (b.id !== j.batchId) throw Error('조회한 batch ID가 일치하지 않아.');
        if (!ACTIVE.has(b.status) && !TERMINAL.has(b.status)) throw Error(`알 수 없는 작업 상태: ${b.status}`);
        j.remoteStatus = b.status; j.status = b.status; j.error = ''; j.lastError = '';
        j.lookupNotice = ''; j.lookupFailures = 0; delete j.firstNotFoundAt;
        j.nextPollAt = this.now() + (j.pollSeconds || 30) * 1000;
        if (TERMINAL.has(b.status)) {
          // Individual results are authoritative, even for partially cancelled/expired batches.
          const item = b.results?.find(r => r.custom_id === j.customId);
          if (b.status === 'completed' || item) {
            try { j.result = readResult(b, j.customId); j.status = 'completed'; }
            catch (e) { j.status = 'failed'; j.error = safeError(e, key); }
          } else j.error = safeError(b.error || `작업 ${b.status}`, key);
        }
        j.updatedAt = this.now(); await this.persist();
        if (j.result && j.responseMode !== 'wait') {
          this.announce({kind: 'completed', batchId: j.batchId, chatName: j.context.name});
        }
        return j;
      } catch (e) {
        j.updatedAt = this.now();
        j.nextPollAt = j.updatedAt + (j.pollSeconds || 30) * 1000;
        if (e.status === 404) {
          // GET after a successful POST or after recovering an ID mentioned in
          // a POST 404: retry only GET, never create/delete an upstream batch.
          j.firstNotFoundAt ??= j.updatedAt;
          j.lookupFailures = (j.lookupFailures || 0) + 1;
          const delay = Math.max((j.pollSeconds || 30) * 1000, Math.min(120000, 10000 * 2 ** Math.min(j.lookupFailures - 1, 4)));
          j.nextPollAt = j.updatedAt + delay;
          if (j.updatedAt - j.firstNotFoundAt < 300000) {
            j.lastError = '';
            j.lookupNotice = `조회 대기 · 서버가 아직 이 작업을 찾지 못했어(404). 일시적인 반영 지연일 수 있어. 약 ${Math.ceil(delay / 1000)}초 뒤 같은 ID로 조회만 재시도해. 새 배치는 만들지 않아.`;
            await this.persist(); return j;
          }
          j.lookupNotice = '';
          j.lastError = `같은 배치 ID의 조회가 5분 이상 404로 응답했어. 단순 반영 지연으로 단정할 수 없어. OpenRouter의 배치 기록과 작업 ID를 확인해. 기존 작업은 유지하고 자동 재접수하지 않아.\n${safeError(e, key)}`;
          await this.persist(); throw Error(j.lastError);
        }
        j.lookupNotice = ''; j.lastError = safeError(e, key); await this.persist(); throw e;
      }
    }
    async setManualClaim(j, enabled) {
      if (enabled && (!j.result || j.consumed || j.released))
        throw Error('수령하지 않은 완료 결과만 선택할 수 있어.');
      if (enabled) await this.credentials(j);
      const affected = this.jobs.filter(x => x.context.scope === j.context.scope &&
        (x.presetId || 'legacy') === (j.presetId || 'legacy'));
      const states = affected.map(x => [x, x.manualClaimArmed]);
      for (const x of affected) x.manualClaimArmed = enabled && x.id === j.id;
      try { await this.persist(); }
      catch (e) { for (const [x, old] of states) x.manualClaimArmed = old; throw e; }
    }
    async claim(j, context, signal) {
      stopped(signal);
      if (j.context.scope !== context.scope) throw Error('채팅이 바뀌었어. 원래 채팅에서 다시 요청해.');
      if (j.consumed || this.claiming.has(j.id)) throw Error('이미 반환한 결과야. 새 작업은 작업 목록에서 재요청을 허용한 뒤 보내줘.');
      if (!j.result) throw Error('아직 결과가 없어.');
      if (j.responseMode !== 'wait' && !j.manualClaimArmed)
        throw Error('먼저 플러그인 작업 목록에서 이 배치의 「수령」 버튼을 누른 뒤 원래 채팅에서 재생성해.');
      this.claiming.add(j.id);
      try {
        const prior = {consumed: j.consumed, consumedAt: j.consumedAt, manualClaimArmed: j.manualClaimArmed};
        j.consumed = true; j.consumedAt = this.now(); j.manualClaimArmed = false;
        try { await this.persist(); } catch (e) { Object.assign(j, prior); throw e; }
        return {success: true, content: j.result.text};
      } finally { this.claiming.delete(j.id); }
    }
    async provide(args, context, signal, currentContext = async () => context, presetId = this.presets[0].id) {
      try {
        const c = config(this.preset(presetId).config);
        const j = await this.getOrSubmit(args, context, c, signal, presetId);
        const deadline = this.now() + c.waitMinutes * 60000;
        for (;;) {
          stopped(signal);
          if ((await currentContext()).scope !== context.scope) throw Error('채팅이 바뀌어서 대기를 끝냈어. 원래 채팅에서 이어서 확인해.');
          if (j.status === 'submitting' || (j.status === 'unknown' && !j.batchId)) throw Error(`접수 여부가 불명확해. 중복 제출을 막았어. 작업 목록에서 batch ID를 연결해.\n요청 ID: ${j.customId}`);
          if (j.consumed) throw Error('이미 반환한 결과야. 작업 목록에서 결과 확인 또는 새 작업 허용을 선택해.');
          if (j.batchId && !j.result && this.now() >= (j.nextPollAt || 0) && (!TERMINAL.has(j.status) || !j.checkedTerminal)) {
            await this.refresh(j); if (TERMINAL.has(j.status)) j.checkedTerminal = true;
          }
          stopped(signal);
          if (j.result) {
            if (j.responseMode !== 'wait' && !j.manualClaimArmed) {
              this.announce({kind: 'claim_required', batchId: j.batchId, chatName: j.context.name});
              return fail('배치 결과는 준비됐지만 아직 수령을 선택하지 않았어.\n설정 → OpenRouter Claude Batch → 해당 작업의 「수령」을 누르고, 원래 채팅에서 다시 재생성해.\n새 유료 배치는 만들지 않았어.');
            }
            return await this.claim(j, await currentContext(), signal);
          }
          if (TERMINAL.has(j.status)) throw Error(j.error || `작업 ${j.status}`);
          if (c.mode === 'defer') return fail(`${j.status === 'unknown' ? 'OpenRouter 배치 접수 확인 중' : 'OpenRouter 배치 접수 안내'}\n배치 ID: ${j.batchId}\n${j.lookupNotice || j.lastError || '정상적으로 접수됐어. 완료 후 플러그인 작업 목록에서 「수령」을 선택하고 원래 채팅에서 재생성해야 결과를 받을 수 있어.'}\n이 메시지는 Claude 응답이 아니야. 새 사용자 메시지를 보내거나 새 작업 허용을 누르지 마.\n설정 → OpenRouter Claude Batch에서도 확인할 수 있어.`);
          if (this.now() >= deadline) return fail('대기 시간이 끝났어. 서버 작업은 유지돼. 같은 입력으로 다시 요청해.');
          await sleep(Math.min(Math.max(1000, (j.nextPollAt || this.now() + c.pollSeconds * 1000) - this.now()), deadline - this.now()), signal);
        }
      } catch (e) { return fail(safeError(e)); }
    }
    async attach(j, batchId) {
      if (!['unknown', 'submitting'].includes(j.status) && !(j.status === 'failed' && batchIdFromNotFound(j.error)))
        throw Error('POST 404에서 ID가 확인된 작업 또는 접수 불명확 작업만 연결할 수 있어.');
      if (!/^[a-zA-Z0-9_-]+$/.test(batchId)) throw Error('올바른 batch ID를 입력해.');
      const {key} = await this.credentials(j);
      const b = await this.api('/' + encodeURIComponent(batchId), 'GET', key);
      if (b.endpoint !== '/v1/messages' || b.model?.replace(/:batch$/, '') !== j.model.replace(/:batch$/, ''))
        throw Error('모델 또는 요청 형식이 일치하지 않아.');
      if (TERMINAL.has(b.status) && !b.results?.some(r => r.custom_id === j.customId)) throw Error('이 작업의 요청 ID가 없는 batch야.');
      j.batchId = batchId; j.status = 'validating'; j.checkedTerminal = false;
      await this.persist(); await this.refresh(j);
    }
    async release(j) {
      if (ACTIVE.has(j.status) || j.status === 'submitting' || this.refreshing.has(j.id)) throw Error('진행 중인 작업은 재요청을 허용할 수 없어.');
      j.released = true; await this.persist();
    }
    async removeLocal(j) {
      if (ACTIVE.has(j.status) || ['unknown', 'submitting'].includes(j.status) || this.refreshing.has(j.id) || this.claiming.has(j.id))
        throw Error('진행 중이거나 접수가 불명확한 작업은 로컬에서 삭제할 수 없어.');
      this.jobs = this.jobs.filter(x => x.id !== j.id); await this.persist();
    }
    async deleteRemote(j) {
      if (!j.batchId || !TERMINAL.has(j.remoteStatus)) throw Error('서버에서 종료된 작업만 삭제할 수 있어.');
      const {key} = await this.credentials(j);
      // Ensure local result is durably stored before deleting its server copy.
      await this.persist();
      try { await this.api('/' + encodeURIComponent(j.batchId), 'DELETE', key); }
      catch (e) { if (e.status !== 404) throw e; }
      j.remoteDeleted = true; await this.persist();
    }
    async tick() {
      for (const j of this.jobs) {
        if (j.batchId && !j.remoteDeleted && !j.result && (ACTIVE.has(j.status) || j.status === 'unknown') && this.now() >= (j.nextPollAt || j.updatedAt + (j.pollSeconds || 30) * 1000)) {
          try { await this.refresh(j); } catch { /* Manual refresh exposes the saved error. */ }
        }
      }
    }
  }

  const Core = {Engine, DEFAULTS, PREFIX, config, buildBody, envelope, readResult, hash, canonical, safeError, ACTIVE, TERMINAL};
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  if (typeof Risuai === 'undefined') return;

  // UI and Risu bridge follow below.
  async function start() {
    const storage = await Risuai.getLocalPluginStorage();
    let key = String(await storage.getItem(PREFIX + 'key') || '');
    let opened = false, disposed = false, timer, busy = false;
    const waiters = new Set();
    let floatingNotice = null;
    let floatingNoticeHandlers = [];
    let noticeQueue = Promise.resolve();
    // SafeElement attaches click handlers to document, not to the button.
    // Verify the click coordinates and remove each listener with its toast.
    async function dismissFloatingNotice() {
      const banner = floatingNotice;
      floatingNotice = null;
      const handlers = floatingNoticeHandlers;
      floatingNoticeHandlers = [];
      for (const [element, id] of handlers) {
        try { await element.removeEventListener('click', id); } catch { /* best effort */ }
      }
      if (banner) { try { await banner.remove(); } catch { /* best effort */ } }
    }
    async function toastButtonHit(button, event) {
      const x = event?.clientX, y = event?.clientY;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      const rect = await button.getBoundingClientRect();
      return !!rect && rect.width > 0 && rect.height > 0 &&
        x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
    }
    // The plugin iframe is hidden during chatting. Draw in RisuAI's main DOM
    // using the documented SafeDocument API, not in the hidden settings iframe.
    function showChatNotice(payload) {
      noticeQueue = noticeQueue.catch(() => {}).then(async () => {
        if (disposed) return;
        const rootDoc = await Risuai.getRootDocument();
        const body = await rootDoc.querySelector('body');
        if (!body) return;
        if (floatingNotice) await dismissFloatingNotice();
        const banner = await rootDoc.createElement('div');
        const handlers = [];
        async function attachToastClick(button, action) {
          const id = await button.addEventListener('click', async event => {
            if (floatingNotice !== banner || !(await toastButtonHit(button, event))) return;
            await action();
          });
          handlers.push([button, id]);
        }
        await banner.setStyleAttribute('position:fixed;top:16px;right:16px;z-index:9999;width:360px;max-width:calc(100vw - 32px);background:#1a1e27;color:#e7e9ef;border:1px solid #2e3546;border-left:3px solid #e9b872;border-radius:10px;padding:16px 18px;box-shadow:0 10px 32px rgba(0,0,0,.4);font:14px/1.6 system-ui,sans-serif;overflow-wrap:anywhere');
        const heading = await rootDoc.createElement('div');
        const titles = {submitted:'📦 OpenRouter 배치 접수 완료', uncertain:'⚠️ 배치 접수 여부 확인 중', completed:'✅ Claude 배치 결과 준비 완료', claim_required:'📦 수령 버튼을 먼저 눌러줘'};
        await heading.setTextContent(titles[payload.kind] || 'OpenRouter Claude Batch');
        await heading.setStyleAttribute('font-weight:700;font-size:16px;margin-bottom:8px');
        await banner.appendChild(heading);
        const detail = await rootDoc.createElement('div');
        const messages = {
          submitted: '배치 작업을 접수했어. 완료 후 설정 → OpenRouter Claude Batch의 작업 목록에서 「수령」을 누른 다음 원래 채팅에서 재생성해. 새 메시지를 보내지 마.',
          uncertain: 'OpenRouter가 배치 ID를 언급했지만 접수 성공을 확인하지 못했어. 같은 ID로 조회만 재시도 중이야. 중복 제출을 피하려면 새 작업을 만들지 마.',
          completed: '배치 결과가 저장됐어! 설정 → OpenRouter Claude Batch에서 해당 작업의 「수령」을 먼저 누른 뒤, 원래 채팅으로 돌아가 응답 재생성을 눌러.',
          claim_required: '아직 수령을 선택하지 않았어. 설정 → OpenRouter Claude Batch → 작업 목록에서 해당 배치의 「수령」 버튼을 누르고, 원래 채팅으로 돌아가 재생성해. 새 배치는 접수하지 않았어.'
        };
        await detail.setTextContent(`${messages[payload.kind] || ''}\n채팅: ${payload.chatName || '원래 채팅'}\n배치 ID: ${payload.batchId || '확인 중'}`);
        await detail.setStyleAttribute('white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:12px');
        await banner.appendChild(detail);
        const actions = await rootDoc.createElement('div');
        await actions.setStyleAttribute('display:flex;gap:8px;flex-wrap:wrap;align-items:center');
        if (payload.kind === 'completed' || payload.kind === 'claim_required') {
          const open = await rootDoc.createElement('button');
          await open.setTextContent('플러그인 UI 열기');
          await open.setStyleAttribute('background:#e9b872;color:#1b1408;font-weight:650;border:0;border-radius:6px;padding:7px 12px;cursor:pointer;font:inherit');
          await attachToastClick(open, async () => {
            try {
              await openBatchUI(true);
              if (floatingNotice === banner) await dismissFloatingNotice();
            } catch (e) {
              console.warn('[OpenRouter Claude Batch] UI 바로 열기 실패', safeError(e));
              await detail.setTextContent(`${messages[payload.kind] || ''}\n플러그인 UI를 열지 못했어. Risu 설정에서 OpenRouter Claude Batch를 직접 열어줘.\n채팅: ${payload.chatName || '원래 채팅'}\n배치 ID: ${payload.batchId || '확인 중'}`);
            }
          });
          await actions.appendChild(open);
        }
        const close = await rootDoc.createElement('button');
        await close.setTextContent('확인 · 닫기');
        await close.setStyleAttribute('background:transparent;color:#e7e9ef;border:1px solid #2e3546;border-radius:6px;padding:7px 12px;cursor:pointer;font:inherit');
        await attachToastClick(close, async () => {
          if (floatingNotice === banner) await dismissFloatingNotice();
        });
        await actions.appendChild(close);
        await banner.appendChild(actions);
        await body.appendChild(banner);
        floatingNotice = banner;
        floatingNoticeHandlers = handlers;
      }).catch(e => { console.warn('[OpenRouter Claude Batch] 별도 안내 패널 표시 실패', safeError(e)); });
      return noticeQueue;
    }
    const engine = await new Engine({storage, fetcher: (...a) => Risuai.nativeFetch(...a), getKey: async () => key,
      changed: () => { if (opened) renderJobs(); }, onNotice: showChatNotice}).init();
    async function context() {
      const ci = await Risuai.getCurrentCharacterIndex();
      const hi = await Risuai.getCurrentChatIndex();
      const char = await Risuai.getCharacterFromIndex(ci);
      const chat = char?.chats?.[hi];
      const charId = char?.chaId ?? char?.id, chatId = chat?.id ?? chat?.chatId;
      if (charId == null || chatId == null) throw Error('채팅의 고유 ID를 읽을 수 없어. 채팅을 저장하고 다시 열어줘.');
      if (ci !== await Risuai.getCurrentCharacterIndex() || hi !== await Risuai.getCurrentChatIndex()) throw Error('채팅 전환 중이야. 다시 요청해.');
      return {scope: JSON.stringify([charId, chatId]), name: `${char.name || '캐릭터'} / ${chat.name || '채팅'}`};
    }
    const providerTitle = p => p.name;
    const registered = new Map();
    async function registerPresets() {
      for (const preset of engine.presets) {
        const title = providerTitle(preset), id = preset.id;
        if (registered.get(title) === id) continue;
        await Risuai.addProvider(title, async (args, signal) => {
      const selected = engine.presets.find(p => p.id === id);
      if (!selected || providerTitle(selected) !== title) return fail('삭제되거나 이름이 바뀐 프리셋이야. 새 프리셋을 선택해. 이전 목록은 Risu를 다시 열면 정리돼.');
      const controller = new AbortController();
      const cancel = () => controller.abort();
      signal?.addEventListener('abort', cancel, {once: true});
      if (signal?.aborted) cancel();
      waiters.add(controller);
      try { return await engine.provide(args, await context(), controller.signal, context, id); }
      catch (e) { return fail(safeError(e, key)); }
      finally { waiters.delete(controller); signal?.removeEventListener('abort', cancel); }
    }, {tokenizer: 'claude', model: {tokenizer: 6}});
        registered.set(title, id);
      }
    }
    await registerPresets();
    let selectedId = engine.presets[0].id;
    const node = (tag, text, className) => {
      const e = document.createElement(tag); if (text != null) e.textContent = text; if (className) e.className = className; return e;
    };
    const root = node('main');
    const style = node('style');
    style.textContent = `:root{--bg:#13161c;--panel:#1a1e27;--raised:#232938;--line:#2e3546;--text:#e7e9ef;--muted:#98a1b4;--accent:#e9b872;--accent-ink:#1b1408;--danger:#f08a8a;--ok:#78c796;--info:#7fb0f0;font:15px/1.6 Pretendard,system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;color:var(--text);background:transparent}
*{box-sizing:border-box}
body{margin:0}
html,body{height:100%;background:transparent}
.backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(6,8,12,.62)}
main{color-scheme:dark;color:var(--text);width:min(720px,100%);max-height:min(88vh,880px);overflow:auto;overscroll-behavior:contain;background:var(--bg);border:1px solid var(--line);border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,.55);padding:0 22px 24px}
h1{font-size:19px;font-weight:700;margin:0;letter-spacing:-.01em}
h2{font-size:15px;font-weight:650;margin:0 0 14px}
p{margin:8px 0 14px;color:var(--muted)}
header{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:16px 0 14px;margin-bottom:16px;background:var(--bg);border-bottom:1px solid var(--line)}
header p{margin:2px 0 0;font-size:13px}
.actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
section,article{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin:14px 0}
form{display:grid;grid-template-columns:1fr 1fr;gap:14px 16px;margin-top:16px;padding-top:16px;border-top:1px solid var(--line)}
label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--muted)}
input,select,textarea,button{font:inherit;color:var(--text);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:8px 11px}
input,select,textarea{width:100%;min-width:0}
input:hover,select:hover{border-color:#44506a}
button{cursor:pointer;word-break:keep-all;background:transparent;transition:background .15s,border-color .15s}
button:hover{background:var(--raised)}
button:disabled{opacity:.45;cursor:default}
button.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:650}
button.primary:hover{filter:brightness(1.08);background:var(--accent)}
button.danger{color:var(--danger);border-color:#4b3039}
button.danger:hover{background:#2a1d23}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.wide{grid-column:1/-1}
.hint,small{font-size:12px;color:var(--muted)}
.hint{margin:0}
.notice,.error{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;margin:12px 0;padding:10px 14px;border-radius:6px;background:var(--raised);border-left:3px solid var(--accent);color:var(--text)}
.notice:empty{display:none}
.error{border-left-color:var(--danger);color:#fbc1c1}
.meta{font-size:12px;color:var(--muted);overflow-wrap:anywhere;margin-top:2px}
.job-head{display:flex;align-items:center;gap:10px;min-width:0}
.job-head strong{font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.badge{--c:var(--muted);flex:none;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);border-radius:999px;padding:2px 10px 2px 8px}
.badge::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
article{border-left:3px solid var(--line)}
article[data-status=completed]{border-left-color:var(--ok)}
article[data-status=validating],article[data-status=in_progress],article[data-status=finalizing],article[data-status=submitting]{border-left-color:var(--info)}
article[data-status=unknown],article[data-status=cancelling]{border-left-color:var(--accent)}
article[data-status=failed],article[data-status=expired]{border-left-color:var(--danger)}
article[data-status=completed] .badge{--c:var(--ok)}
article[data-status=validating] .badge,article[data-status=in_progress] .badge,article[data-status=finalizing] .badge,article[data-status=submitting] .badge{--c:var(--info)}
article[data-status=in_progress] .badge::before,article[data-status=submitting] .badge::before{animation:pulse 1.6s ease-in-out infinite}
article[data-status=unknown] .badge,article[data-status=cancelling] .badge{--c:var(--accent)}
article[data-status=failed] .badge,article[data-status=expired] .badge{--c:var(--danger)}
article .actions{margin-top:14px}
article .actions button{padding:5px 11px;font-size:13px}
article>label{margin-top:12px}
article>button{margin-top:10px}
@keyframes pulse{50%{opacity:.3}}
@media(prefers-reduced-motion:reduce){.badge::before{animation:none!important}}
pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;margin:8px 0 0;padding:12px 14px;background:var(--bg);border:1px solid var(--line);border-radius:6px;font:14px/1.65 inherit}
details{margin-top:10px}
summary{cursor:pointer;color:var(--muted);font-size:13px}
summary:hover{color:var(--text)}
a{color:var(--info)}
.check{flex-direction:row;align-items:center;gap:10px;color:var(--text)}
.check input{width:auto;accent-color:var(--accent)}
#jobs{margin-top:28px}
#jobs>h2{margin-bottom:0}
@media(max-width:560px){.backdrop{padding:8px}main{max-height:96vh;border-radius:12px;padding:0 12px 24px}form{grid-template-columns:1fr}section,article{padding:14px}.actions button{flex:1;min-width:120px}header p{display:none}}`;
    const backdrop = node('div', null, 'backdrop'); backdrop.append(root);
    document.head.append(style); document.body.append(backdrop);
    const header = node('header'); const brand = node('div'); brand.append(node('h1', 'OpenRouter Claude Batch'), node('p', 'Claude 배치 요청 설정 · 작업 수령')); header.append(brand);
    function button(text, fn, variant = false) {
      const b = node('button', text, variant === true ? 'primary' : variant || ''); b.type = 'button';
      b.addEventListener('click', async () => {
        b.disabled = true;
        try { await fn(); } catch (e) { notice.textContent = safeError(e, key); }
        finally { b.disabled = false; }
      }); return b;
    }
    async function closeUI() { if (!opened) return; opened = false; apiInput.value = ''; await Risuai.hideContainer(); }
    header.append(button('닫기', closeUI)); root.append(header);
    backdrop.addEventListener('mousedown', event => { if (event.target === backdrop) void closeUI(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && opened) void closeUI(); });
    const notice = node('div', '', 'notice'); notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite'); root.append(notice);
    const common = node('section'); common.append(node('h2', 'API 키')); root.append(common);
    const keyLabel = node('label', 'OpenRouter API 키 (모든 프리셋 공통)');
    const apiInput = node('input'); apiInput.type = 'password'; apiInput.autocomplete = 'new-password'; keyLabel.append(apiInput); common.append(keyLabel);
    const keyActions = node('div', null, 'actions'); common.append(keyActions);
    keyActions.append(button('API 키 저장', async () => {
      const value = apiInput.value.trim(); if (!value) throw Error('저장할 API 키를 입력해.');
      await storage.setItem(PREFIX + 'key', value); key = value; apiInput.value = ''; apiInput.placeholder = '저장된 키 있음 · 변경하려면 입력'; notice.textContent = '공통 API 키를 저장했어.';
    }, true));
    keyActions.append(button('키 지우기', async () => { await storage.removeItem(PREFIX + 'key'); key = ''; apiInput.value = ''; apiInput.placeholder = 'sk-or-…'; notice.textContent = '이 기기에 저장된 API 키를 지웠어.'; }, 'danger'));
    const section = node('section'); section.append(node('h2', '모델 프리셋')); root.append(section);
    const presetLabel = node('label', '편집할 프리셋'); const picker = node('select'); presetLabel.append(picker); section.append(presetLabel);
    picker.addEventListener('change', () => { selectedId = picker.value; fill(); });
    section.append(node('p', '아래 설정은 프리셋마다 따로 저장돼. 실제 요청에는 Risu 모델 목록에서 선택한 프리셋이 적용돼.', 'hint'));
    const presetActions = node('div', null, 'actions'); section.append(presetActions);
    presetActions.append(button('새 프리셋', async () => { selectedId = ''; fill(); notice.textContent = '이름과 모델을 입력하고 프리셋 저장을 눌러줘.'; }));
    presetActions.append(button('프리셋 복제', async () => {
      const values = readForm(); let name = inputs.presetName.value.trim() + ' 복사';
      while (engine.presets.some(p => p.name === name)) name += ' 복사';
      const p = await engine.savePreset('', name, values); selectedId = p.id; await registerPresets(); fill(); notice.textContent = '프리셋을 복제했어. API 키는 공통 키를 사용해.';
    }));
    const removePreset = button('프리셋 삭제', async () => {
      if (!selectedId) return;
      if (!confirm('선택한 프리셋을 삭제할까? 공통 API 키와 작업 기록은 유지돼.')) return;
      await engine.deletePreset(selectedId); selectedId = engine.presets[0].id; fill(); notice.textContent = '삭제했어. Risu를 다시 열면 이전 모델 목록도 정리돼.';
    }, 'danger'); presetActions.append(removePreset);
    const form = node('form'); section.append(form); const inputs = {};
    function field(name, title, type, values) {
      const label = node('label', title), e = node(type === 'select' ? 'select' : 'input');
      e.name = name;
      if (type === 'select') for (const [value, text] of values) { const o = node('option', text); o.value = value; e.append(o); }
      else e.type = type;
      label.append(e); form.append(label); inputs[name] = e; return e;
    }
    const nameInput = field('presetName', '프리셋 이름', 'text'); nameInput.required = true; nameInput.maxLength = 60;
    const modelInput = field('model', 'Claude 모델 ID', 'text'); modelInput.placeholder = 'anthropic/claude-…'; modelInput.required = true;
    field('mode', '수신 방식', 'select', [['defer', '접수 → UI 수령 → 재생성'], ['wait', '완료될 때까지 기다리기']]);
    field('provider', '공급자 고정 · 비워두면 자동', 'text').placeholder = '예: anthropic';
    for (const [name, title, min, max] of [['pollSeconds', '조회 간격 (초)', 10, 600], ['waitMinutes', '한 번에 기다릴 시간 (분)', 1, 1440]]) {
      const e = field(name, title, 'number'); e.min = min; e.max = max; e.step = 1; e.required = true;
    }
    field('thinking', '사고 · 모델별 지원 확인', 'select', [['none', '끄기 (none)'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['max', 'Max']]);
    field('cache', '시스템 프롬프트 캐시 · 모델별 지원 확인', 'select', [['off', '끄기'], ['5m', '5분'], ['1h', '1시간']]);
    const hint = node('p', '텍스트 전용 · 스트리밍 없음 · 최대 24시간 처리 창. 사고를 켜면(Low~Max) 온도 설정을 보내지 않고 어시스턴트 프리필도 쓸 수 없어. 사고/캐시 지원과 할인율은 모델에 따라 달라. 키·설정·작업·결과는 이 기기의 플러그인 로컬 저장소에 보관돼.', 'hint wide'); form.append(hint);
    // Risu's sandbox can omit allow-forms. Native submit is blocked BEFORE the
    // submit event, even when that handler calls preventDefault. Use a click.
    const actions = node('div', null, 'actions wide'); const save = node('button', '프리셋 저장', 'primary'); save.type = 'button'; actions.append(save); form.append(actions);
    const saveStatus = node('div', '', 'notice wide'); saveStatus.setAttribute('aria-live', 'polite'); form.append(saveStatus);
    function readForm() { return Object.fromEntries(Object.keys(DEFAULTS).map(k => [k, inputs[k].value])); }
    async function savePresetForm() {
      if (save.disabled) return;
      save.disabled = true; saveStatus.textContent = '프리셋을 저장 중이야…';
      try {
        const p = await engine.savePreset(selectedId, nameInput.value, readForm()); selectedId = p.id;
        fill();
        try { await registerPresets(); }
        catch (e) { throw Error(`프리셋은 저장됐지만 모델 등록에 실패했어. Risu를 다시 열어줘. ${safeError(e, key)}`); }
        notice.textContent = saveStatus.textContent = `저장했어. Risu 모델에서 ${providerTitle(p)}를 선택해.`;
      } catch (e) {
        notice.textContent = saveStatus.textContent = safeError(e, key);
      } finally { save.disabled = false; }
    }
    save.addEventListener('click', savePresetForm);
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.isComposing && event.target.tagName === 'INPUT' && event.target.type !== 'checkbox') {
        event.preventDefault(); void savePresetForm();
      }
    });
    const toolbar = node('div', null, 'actions'); root.append(toolbar);
    toolbar.append(button('작업 새로고침', async () => {
      const errors = [];
      for (const j of engine.jobs) if (j.batchId && !j.result && !j.remoteDeleted) {
        try { await engine.refresh(j); } catch (e) { errors.push(safeError(e, key)); }
      }
      renderJobs(); notice.textContent = errors.length ? errors.join('\n') : '작업 상태를 갱신했어.';
    }));
    toolbar.append(button('서버 배치 목록 대조', async () => {
      const {key} = await engine.credentials();
      const remote = await engine.api('?limit=100', 'GET', key);
      if (!Array.isArray(remote.data)) throw Error('서버 목록 응답에 data 배열이 없어.');
      const found = new Map(remote.data.map(x => [x.id, x]));
      const summary = engine.jobs.filter(j => j.batchId).map(j =>
        `${j.batchId}: ${found.has(j.batchId) ? '서버 목록에 있음 (' + found.get(j.batchId).status + ')' : '최근 100개 목록에는 없음'}`);
      notice.textContent = [`현재 API 키의 작업 공간 배치 목록: ${remote.data.length}개 확인`,
        ...summary, remote.has_more ? '이전 페이지에도 작업이 있을 수 있어.' : '',
        '목록에 있는 ID가 개별 GET에서 계속 404라면 OpenRouter에 문의해.'].filter(Boolean).join('\n');
    }));
    toolbar.append(button('현재 대기 중지', async () => { for (const c of waiters) c.abort(); notice.textContent = 'Risu의 대기만 중지했어. 서버에 접수된 작업은 계속 진행돼.'; }));
    toolbar.append(button('로컬 저장 재시도', async () => { await engine.persist(); notice.textContent = '작업 기록을 저장했어.'; }));
    const jobs = node('div'); jobs.id = 'jobs'; root.append(jobs);
    const attachDrafts = new Map();
    const labels = {submitting: '접수 중', unknown: '접수 확인 필요', validating: '검증 중', in_progress: '처리 중', finalizing: '마무리 중', cancelling: '서버 취소 중', completed: '완료', failed: '실패', expired: '만료', cancelled: '취소됨'};
    function renderJobs() {
      if (!jobs) return;
      const expanded = new Set(Array.from(jobs.querySelectorAll('details[open]')).map(d => d.dataset.identity));
      jobs.replaceChildren(node('h2', `작업 목록 · ${engine.jobs.length}`));
      if (!engine.jobs.length) { jobs.append(node('p', '아직 작업이 없어. 설정을 저장하고 Risu에서 메시지를 보내봐.')); return; }
      for (const j of engine.jobs) {
        const card = node('article'); card.dataset.status = j.status; const heading = node('div', null, 'job-head'); heading.append(node('span', labels[j.status] || j.status, 'badge'), node('strong', j.context.name)); card.append(heading);
        card.append(node('div', `${j.presetName || '기본 프리셋'} · ${j.model} · ${new Date(j.createdAt).toLocaleString()}${j.consumed ? ' · 반환함' : ''}${j.released ? ' · 새 작업 허용됨' : ''}`, 'meta'));
        card.append(node('div', `Batch: ${j.batchId || '미확인'} / 요청: ${j.customId}`, 'meta'));
        if (j.result?.cost != null) card.append(node('div', `보고된 비용: ${j.result.cost}`, 'meta'));
        if (j.manualClaimArmed && j.result && !j.consumed) card.append(node('p', '이 작업의 결과를 다음 재생성에서 수령하도록 선택했어. 원래 채팅에서 재생성해.', 'notice'));
        if (j.error || j.lastError) card.append(node('p', j.error || j.lastError, 'error'));
        if (j.lookupNotice) card.append(node('p', j.lookupNotice, 'notice'));
        if (j.result) {
          const details = node('details'); details.dataset.identity = j.id + ':text'; details.open = expanded.has(details.dataset.identity); details.append(node('summary', j.result.stopReason === 'max_tokens' ? '결과 확인 · 토큰 한도로 잘림' : '결과 확인'), node('pre', j.result.text)); card.append(details);
          if (j.result.thinking) { const d = node('details'); d.dataset.identity = j.id + ':thinking'; d.open = expanded.has(d.dataset.identity); d.append(node('summary', '사고 과정'), node('pre', j.result.thinking)); card.append(d); }
        }
        const row = node('div', null, 'actions'); card.append(row);
        if (j.batchId && !j.result && !j.remoteDeleted) row.append(button('조회', async () => { await engine.refresh(j); renderJobs(); }));
        if (j.result && j.consumed && !j.released) row.append(button('같은 결과 다시 받기', async () => {
          j.consumed = false; j.manualClaimArmed = false; await engine.persist();
          notice.textContent = '이 결과를 다시 수령할 수 있게 됐어. 아래 「수령」을 누른 뒤 원래 채팅에서 재생성해.';
        }));
        if (j.result && !j.consumed && !j.released) row.append(button(
          j.manualClaimArmed ? '수령 선택 취소' : '수령', async () => {
            if (!j.manualClaimArmed && !confirm(
              `이 배치의 결과를 수령 준비할까?\n\n채팅: ${j.context.name}\n모델: ${j.model}\n배치: ${j.batchId}\n\n확인 후 원래 채팅에서 응답 재생성을 눌러줘. 새 유료 요청은 보내지 않아.`)) return;
            await engine.setManualClaim(j, !j.manualClaimArmed);
            renderJobs();
            notice.textContent = j.manualClaimArmed
              ? '수령 준비 완료! 해당 채팅으로 돌아가 응답 재생성을 눌러줘. 같은 채팅·프리셋·API 키에서만 적용돼.'
              : '결과 선택을 취소했어.';
          }, !j.manualClaimArmed));
        if (!j.released && (TERMINAL.has(j.status) || j.status === 'unknown')) row.append(button('새 작업 허용', async () => {
          if (!confirm(j.status === 'unknown' ? '서버에 이미 접수됐을 수 있어. 다음 요청에서 중복 과금될 수 있어도 새 작업을 허용할까?' : '다음 동일 입력 요청을 새 유료 배치로 접수할 수 있게 할까?')) return;
          await engine.release(j); notice.textContent = '다음 동일 입력 요청부터 새 배치를 만들 수 있어.';
        }));
        if (j.batchId && TERMINAL.has(j.remoteStatus) && !j.remoteDeleted) row.append(button('서버 기록 삭제', async () => {
          if (confirm('이 배치의 서버 입력과 결과를 삭제할까? 로컬 결과는 남아.')) { await engine.deleteRemote(j); renderJobs(); }
        }, 'danger'));
        if (j.remoteDeleted) row.append(node('small', '서버 기록 삭제됨'));
        if (TERMINAL.has(j.status)) row.append(button('로컬 기록 삭제', async () => {
          if (confirm('로컬 결과와 중복 방지 기록을 삭제할까? 서버 기록은 유지돼. 같은 입력을 다시 보내면 새 작업으로 과금될 수 있어.')) await engine.removeLocal(j);
        }, 'danger'));
        if (j.status === 'unknown' || j.status === 'submitting' || (j.status === 'failed' && batchIdFromNotFound(j.error))) {
          const label = node('label', 'OpenRouter에서 확인한 batch ID'); const input = node('input'); input.placeholder = 'batch_… 또는 batch-…'; input.value = attachDrafts.get(j.id) || j.batchId || batchIdFromNotFound(j.error); input.addEventListener('input', () => attachDrafts.set(j.id, input.value)); label.append(input); card.append(label);
          card.append(button('기존 작업 연결', async () => { await engine.attach(j, input.value.trim()); renderJobs(); }));
        }
        jobs.append(card);
      }
    }
    function fill() {
      picker.replaceChildren();
      if (!selectedId) { const option = node('option', '새 프리셋 작성 중'); option.value = ''; picker.append(option); }
      for (const p of engine.presets) { const option = node('option', p.name); option.value = p.id; picker.append(option); }
      picker.value = selectedId; removePreset.disabled = !selectedId || engine.presets.length < 2;
      const p = selectedId ? engine.preset(selectedId) : {name: '', config: DEFAULTS};
      nameInput.value = p.name;
      for (const k of Object.keys(DEFAULTS)) inputs[k].value = p.config[k];
    }
    async function openBatchUI(focusJobs = false) {
      if (disposed) return;
      opened = true;
      fill();
      apiInput.placeholder = key ? '저장된 키 있음 · 변경하려면 입력' : 'sk-or-…';
      renderJobs();
      await Risuai.showContainer('fullscreen');
      if (focusJobs) jobs.scrollIntoView?.({block: 'start'});
    }
    const ui = await Risuai.registerSetting('OpenRouter Claude Batch', () => openBatchUI(), '📦', 'html');
    const hamburgerUI = await Risuai.registerButton({
      name: 'OpenRouter Claude Batch', icon: '📦', iconType: 'html', location: 'hamburger'
    }, () => openBatchUI());
    async function tick() {
      if (disposed) return;
      if (!busy) { busy = true; try { await engine.tick(); } finally { busy = false; } }
      if (!disposed) timer = setTimeout(tick, 10000);
    }
    timer = setTimeout(tick, 1000);
    await Risuai.onUnload(async () => {
      disposed = true; clearTimeout(timer); for (const c of waiters) c.abort();
      if (ui?.id) await Risuai.unregisterUIPart(ui.id);
      if (hamburgerUI?.id) await Risuai.unregisterUIPart(hamburgerUI.id);
      try { await noticeQueue; await dismissFloatingNotice(); } catch { /* optional UI */ }
      style.remove(); backdrop.remove();
    });
  }
  start().catch(error => {
    console.error('[OpenRouter Claude Batch]', safeError(error));
    Risuai.registerSetting('OpenRouter Claude Batch · 초기화 오류', async () => {
      document.body.textContent = safeError(error); const close = document.createElement('button'); close.textContent = '닫기'; close.onclick = () => Risuai.hideContainer(); document.body.append(close); await Risuai.showContainer('fullscreen');
    }, '⚠️', 'html').catch(() => {});
  });
})();
