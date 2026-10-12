//@name openrouter-claude-batch
//@display-name OpenRouter Claude Batch
//@api 3.0
//@version 1.1.0
//@link https://openrouter.ai/docs/batch-quickstart Batch API

/* Independent implementation. Provider Manager was consulted for workflow only.
 * No dependencies, automatic updates, external proxy, or direct chat database writes.
 */
(() => {
  'use strict';
  const BASE = 'https://openrouter.ai/api/v1/batches';
  const PREFIX = 'openrouter-claude-batch:v1:';
  const TERMINAL = new Set(['completed', 'failed', 'expired', 'cancelled']);
  const ACTIVE = new Set(['validating', 'in_progress', 'finalizing', 'cancelling']);
  const DEFAULTS = Object.freeze({model: '', mode: 'defer', pollSeconds: 30,
    waitMinutes: 30, provider: '', thinking: 'off', budget: 4096, effort: '', cache: false});
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
    for (const [k, min, max] of [['pollSeconds', 10, 600], ['waitMinutes', 1, 1440], ['budget', 1024, 128000]]) {
      c[k] = Number(c[k]);
      if (!Number.isInteger(c[k]) || c[k] < min || c[k] > max) throw Error(`${k}: ${min}~${max} 정수로 입력해.`);
    }
    c.provider = String(c.provider || '').trim();
    if (c.provider && !/^[a-zA-Z0-9._/-]+$/.test(c.provider)) throw Error('공급자 slug를 하나만 입력해.');
    if (!['off', 'enabled', 'adaptive'].includes(c.thinking)) throw Error('사고 모드를 확인해.');
    if (!['', 'low', 'medium', 'high', 'max'].includes(c.effort)) throw Error('사고 강도를 확인해.');
    c.cache = c.cache === true;
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
    if (!Number.isInteger(max) || max < 1) throw Error('리수의 최대 응답 토큰을 1 이상으로 설정해.');
    const body = {max_tokens: max, messages};
    if (system.length) {
      if (c.cache) system.at(-1).cache_control = {type: 'ephemeral'};
      body.system = system;
    }
    if (c.thinking !== 'off') {
      if (messages.at(-1).role === 'assistant') throw Error('사고 모드에서는 어시스턴트 프리필을 제거해.');
      if (c.thinking === 'enabled' && c.budget >= max) throw Error('사고 예산보다 최대 응답 토큰을 크게 설정해.');
      body.thinking = c.thinking === 'adaptive' ? {type: 'adaptive'} : {type: 'enabled', budget_tokens: c.budget};
    } else if (Number.isFinite(args.temperature)) {
      // Risu passes provider sampling arguments in API units, already divided by 100.
      body.temperature = Math.max(0, Math.min(1, args.temperature));
    }
    if (c.effort) body.output_config = {effort: c.effort};
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
    constructor({storage, fetcher, getKey, now = Date.now, digest = hash, uuid = () => crypto.randomUUID(), changed = () => {}}) {
      Object.assign(this, {storage, fetcher, getKey, now, digest, uuid, changed});
      this.jobs = []; this.presets = [{id: 'legacy', name: '기본 프리셋', config: {...DEFAULTS}}]; this.serial = Promise.resolve();
      this.running = new Set(); this.refreshing = new Map(); this.claiming = new Set();
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
      if (!p) throw Error('삭제된 프리셋이야. 리수 모델 목록에서 다른 프리셋을 선택해.');
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
          const error = Error(`OpenRouter HTTP ${r.status}: ${safeError(await r.text(), key)}`);
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
      const body = buildBody(args, c);
      const signature = await this.digest(canonical({scope: context.scope, mode: args.mode || '', keyHash,
        model: c.model, provider: c.provider, body, ...(presetId === 'legacy' ? {} : {presetId})}));
      const lock = JSON.stringify([context.scope, presetId]);
      if (this.running.has(lock)) throw Error('이 프리셋의 입력을 이미 접수 중이야. 잠시 뒤 다시 확인해.');
      this.running.add(lock);
      try {
        const previous = this.jobs.find(j => j.signature === signature && (j.presetId || 'legacy') === presetId && !j.released);
        if (previous) return previous;
        const outstanding = this.jobs.find(j => j.context.scope === context.scope && (j.presetId || 'legacy') === presetId && !j.released &&
          (ACTIVE.has(j.status) || ['unknown', 'submitting'].includes(j.status) || (j.result && !j.consumed)));
        if (outstanding) throw Error('이 채팅·프리셋에 처리 중이거나 아직 받지 않은 배치가 있어. 입력·모델·설정이 달라져서 자동으로 연결하지 않았어. 작업 목록에서 기존 결과를 확인해. 새 배치는 만들지 않았어.');
        stopped(signal);
        const id = this.uuid();
        const j = {id, customId: `orcb-${id}`, signature, keyHash, batchId: '', model: c.model,
          presetId, presetName: this.preset(presetId).name, pollSeconds: c.pollSeconds,
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
        } catch (e) {
          j.status = [400, 401, 402, 403, 404, 413, 422, 429].includes(e.status) ? 'failed' : 'unknown';
          j.error = safeError(e, key);
        }
        j.updatedAt = this.now(); await this.persist(); return j;
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
        if (TERMINAL.has(b.status)) {
          // Individual results are authoritative, even for partially cancelled/expired batches.
          const item = b.results?.find(r => r.custom_id === j.customId);
          if (b.status === 'completed' || item) {
            try { j.result = readResult(b, j.customId); j.status = 'completed'; }
            catch (e) { j.status = 'failed'; j.error = safeError(e, key); }
          } else j.error = safeError(b.error || `작업 ${b.status}`, key);
        }
        j.updatedAt = this.now(); await this.persist(); return j;
      } catch (e) {
        j.lastError = safeError(e, key); j.updatedAt = this.now(); await this.persist(); throw e;
      }
    }
    async claim(j, context, signal) {
      stopped(signal);
      if (j.context.scope !== context.scope) throw Error('채팅이 바뀌었어. 원래 채팅에서 다시 요청해.');
      if (j.consumed || this.claiming.has(j.id)) throw Error('이미 반환한 결과야. 새 작업은 작업 목록에서 재요청을 허용한 뒤 보내줘.');
      if (!j.result) throw Error('아직 결과가 없어.');
      this.claiming.add(j.id);
      try {
        j.consumed = true; j.consumedAt = this.now();
        try { await this.persist(); } catch (e) { j.consumed = false; throw e; }
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
          if (j.status === 'unknown' || j.status === 'submitting') throw Error(`접수 여부가 불명확해. 중복 제출을 막았어. 작업 목록에서 batch ID를 연결해.\n요청 ID: ${j.customId}`);
          if (j.consumed) throw Error('이미 반환한 결과야. 작업 목록에서 결과 확인 또는 새 작업 허용을 선택해.');
          if (j.batchId && !j.result && (!TERMINAL.has(j.status) || !j.checkedTerminal)) {
            await this.refresh(j); if (TERMINAL.has(j.status)) j.checkedTerminal = true;
          }
          stopped(signal);
          if (j.result) return await this.claim(j, await currentContext(), signal);
          if (TERMINAL.has(j.status)) throw Error(j.error || `작업 ${j.status}`);
          if (c.mode === 'defer') return fail(`배치 접수 완료 · ${j.batchId}\n완료 후 같은 입력으로 재요청하면 결과를 받아. 새 작업은 중복 생성하지 않아.\n설정 → OpenRouter Claude Batch에서 진행 상황을 확인해.`);
          if (this.now() >= deadline) return fail('대기 시간이 끝났어. 서버 작업은 유지돼. 같은 입력으로 다시 요청해.');
          await sleep(c.pollSeconds * 1000, signal);
        }
      } catch (e) { return fail(safeError(e)); }
    }
    async attach(j, batchId) {
      if (!['unknown', 'submitting'].includes(j.status)) throw Error('접수 확인이 필요한 작업만 연결할 수 있어.');
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
        if (j.batchId && !j.remoteDeleted && !j.result && ACTIVE.has(j.status) && this.now() - j.updatedAt >= (j.pollSeconds || 30) * 1000) {
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
    const engine = await new Engine({storage, fetcher: (...a) => Risuai.nativeFetch(...a), getKey: async () => key,
      changed: () => { if (opened) renderJobs(); }}).init();
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
    const providerTitle = p => p.id === 'legacy' ? 'OpenRouter Claude Batch' : `[OR Batch] ${p.name} · ${p.id.slice(0, 8)}`;
    const registered = new Set();
    async function registerPresets() {
      for (const preset of engine.presets) {
        const title = providerTitle(preset), id = preset.id;
        if (registered.has(title)) continue;
        await Risuai.addProvider(title, async (args, signal) => {
      const selected = engine.presets.find(p => p.id === id);
      if (!selected || providerTitle(selected) !== title) return fail('삭제되거나 이름이 바뀐 프리셋이야. 새 프리셋을 선택해. 이전 목록은 리수를 다시 열면 정리돼.');
      const controller = new AbortController();
      const cancel = () => controller.abort();
      signal?.addEventListener('abort', cancel, {once: true});
      if (signal?.aborted) cancel();
      waiters.add(controller);
      try { return await engine.provide(args, await context(), controller.signal, context, id); }
      catch (e) { return fail(safeError(e, key)); }
      finally { waiters.delete(controller); signal?.removeEventListener('abort', cancel); }
    }, {tokenizer: 'gpt-4'});
        registered.add(title);
      }
    }
    await registerPresets();
    let selectedId = engine.presets[0].id;
    const node = (tag, text, className) => {
      const e = document.createElement(tag); if (text != null) e.textContent = text; if (className) e.className = className; return e;
    };
    const root = node('main');
    const style = node('style');
    style.textContent = `:root{color-scheme:dark;font:15px/1.55 system-ui,sans-serif;color:#e5e7eb;background:#111827}*{box-sizing:border-box}body{margin:0}main{max-width:960px;margin:auto;padding:24px}h1{font-size:24px;margin:0}h2{font-size:18px;margin:0 0 14px}p{margin:8px 0 16px;color:#b8c1d1}header,.actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}header{justify-content:space-between;margin-bottom:18px}section,article{background:#1f2937;border:1px solid #475569;border-radius:10px;padding:18px;margin:14px 0}form{display:grid;grid-template-columns:1fr 1fr;gap:16px}label{display:flex;flex-direction:column;gap:6px;font-size:14px}input,select,textarea,button{font:inherit;color:inherit;background:#111827;border:1px solid #64748b;border-radius:6px;padding:9px 11px}input,select,textarea{width:100%;min-width:0}button{cursor:pointer;word-break:keep-all}button:hover{background:#334155}button:disabled{opacity:.5;cursor:default}button.primary{background:#334eb8;border-color:#7993ff}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #a5b4fc;outline-offset:2px}.wide{grid-column:1/-1}.hint,small{font-size:12px;color:#aebdd0}.notice{white-space:pre-wrap;overflow-wrap:anywhere;color:#c7d2fe;min-height:24px}.meta{font-size:12px;color:#aebdd0;overflow-wrap:anywhere}.error{color:#fca5a5;white-space:pre-wrap}.badge{display:inline-block;font-size:12px;background:#334155;border-radius:5px;padding:2px 8px;margin-right:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;font:14px/1.6 system-ui}details{margin-top:10px}summary{cursor:pointer}a{color:#b5c7ff}.check{flex-direction:row;align-items:center}.check input{width:auto}#jobs{margin-top:18px}@media(max-width:560px){main{padding:12px}form{grid-template-columns:1fr}h1{font-size:20px}section,article{padding:14px}.actions button{flex:1;min-width:130px}header button{padding:7px 10px}}`;
    document.head.append(style); document.body.append(root);
    const header = node('header'); header.append(node('h1', 'OpenRouter Claude Batch'));
    function button(text, fn, primary = false) {
      const b = node('button', text, primary ? 'primary' : ''); b.type = 'button';
      b.addEventListener('click', async () => {
        b.disabled = true;
        try { await fn(); } catch (e) { notice.textContent = safeError(e, key); }
        finally { b.disabled = false; }
      }); return b;
    }
    header.append(button('닫기', async () => { opened = false; apiInput.value = ''; await Risuai.hideContainer(); })); root.append(header);
    root.append(node('p', '채팅 한 번을 배치 작업 하나로 접수해. 완료 후 같은 입력으로 다시 요청하면 답변을 받아.'));
    const notice = node('div', '', 'notice'); notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite'); root.append(notice);
    const common = node('section'); common.append(node('h2', '공통 API 키')); root.append(common);
    const keyLabel = node('label', 'OpenRouter API 키 · 모든 프리셋에서 공통 사용');
    const apiInput = node('input'); apiInput.type = 'password'; apiInput.autocomplete = 'new-password'; keyLabel.append(apiInput); common.append(keyLabel);
    const keyActions = node('div', null, 'actions'); common.append(keyActions);
    keyActions.append(button('API 키 저장', async () => {
      const value = apiInput.value.trim(); if (!value) throw Error('저장할 API 키를 입력해.');
      await storage.setItem(PREFIX + 'key', value); key = value; apiInput.value = ''; apiInput.placeholder = '저장된 키 있음 · 변경하려면 입력'; notice.textContent = '공통 API 키를 저장했어.';
    }, true));
    keyActions.append(button('키 지우기', async () => { await storage.removeItem(PREFIX + 'key'); key = ''; apiInput.value = ''; apiInput.placeholder = 'sk-or-…'; notice.textContent = '이 기기에 저장된 API 키를 지웠어.'; }));
    const section = node('section'); section.append(node('h2', '모델 프리셋')); root.append(section);
    const presetLabel = node('label', '편집할 프리셋'); const picker = node('select'); presetLabel.append(picker); section.append(presetLabel);
    picker.addEventListener('change', () => { selectedId = picker.value; fill(); });
    section.append(node('p', '아래 설정은 프리셋마다 따로 저장돼. 실제 요청에는 리수 모델 목록에서 선택한 프리셋이 적용돼.', 'hint'));
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
      await engine.deletePreset(selectedId); selectedId = engine.presets[0].id; fill(); notice.textContent = '삭제했어. 리수를 다시 열면 이전 모델 목록도 정리돼.';
    }); presetActions.append(removePreset);
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
    field('mode', '수신 방식', 'select', [['defer', '접수 후 재요청으로 받기'], ['wait', '완료될 때까지 기다리기']]);
    field('provider', '공급자 고정 · 비워두면 자동', 'text').placeholder = '예: anthropic';
    for (const [name, title, min, max] of [['pollSeconds', '조회 간격 (초)', 10, 600], ['waitMinutes', '한 번에 기다릴 시간 (분)', 1, 1440], ['budget', '고정 사고 예산 (토큰)', 1024, 128000]]) {
      const e = field(name, title, 'number'); e.min = min; e.max = max; e.step = 1; e.required = true;
    }
    field('thinking', '사고 모드 · 모델별 지원 확인', 'select', [['off', '사용 안 함'], ['adaptive', 'Adaptive'], ['enabled', '고정 예산']]);
    field('effort', '사고 강도 · 모델별 지원 확인', 'select', [['', '모델 기본값'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['max', 'Max']]);
    const cacheLabel = node('label', '시스템 프롬프트 캐시 요청', 'check'); const cache = node('input'); cache.type = 'checkbox'; inputs.cache = cache; cacheLabel.append(cache); form.append(cacheLabel);
    const hint = node('p', '텍스트 전용 · 스트리밍 없음 · 최대 24시간 처리 창. 사고/캐시 지원과 할인율은 모델에 따라 달라. 키·설정·작업·결과는 이 기기의 플러그인 로컬 저장소에 보관돼.', 'hint wide'); form.append(hint);
    const actions = node('div', null, 'actions wide'); const save = node('button', '프리셋 저장', 'primary'); save.type = 'submit'; actions.append(save); form.append(actions);
    function readForm() { return Object.fromEntries(Object.keys(DEFAULTS).map(k => [k, k === 'cache' ? inputs[k].checked : inputs[k].value])); }
    form.addEventListener('submit', async event => {
      event.preventDefault(); save.disabled = true;
      try {
        const p = await engine.savePreset(selectedId, nameInput.value, readForm()); selectedId = p.id;
        await registerPresets(); fill(); notice.textContent = `저장했어. 리수 모델에서 ${providerTitle(p)}를 선택해.`;
      } catch (e) { notice.textContent = safeError(e, key); } finally { save.disabled = false; }
    });
    const toolbar = node('div', null, 'actions'); root.append(toolbar);
    toolbar.append(button('작업 새로고침', async () => {
      const errors = [];
      for (const j of engine.jobs) if (j.batchId && !j.result && !j.remoteDeleted) {
        try { await engine.refresh(j); } catch (e) { errors.push(safeError(e, key)); }
      }
      renderJobs(); notice.textContent = errors.length ? errors.join('\n') : '작업 상태를 갱신했어.';
    }));
    toolbar.append(button('현재 대기 중지', async () => { for (const c of waiters) c.abort(); notice.textContent = '리수의 대기만 중지했어. 서버에 접수된 작업은 계속 진행돼.'; }));
    toolbar.append(button('로컬 저장 재시도', async () => { await engine.persist(); notice.textContent = '작업 기록을 저장했어.'; }));
    const jobs = node('div'); jobs.id = 'jobs'; root.append(jobs);
    const attachDrafts = new Map();
    const labels = {submitting: '접수 중', unknown: '접수 확인 필요', validating: '검증 중', in_progress: '처리 중', finalizing: '마무리 중', cancelling: '서버 취소 중', completed: '완료', failed: '실패', expired: '만료', cancelled: '취소됨'};
    function renderJobs() {
      if (!jobs) return;
      const expanded = new Set(Array.from(jobs.querySelectorAll('details[open]')).map(d => d.dataset.identity));
      jobs.replaceChildren(node('h2', `작업 목록 · ${engine.jobs.length}`));
      if (!engine.jobs.length) { jobs.append(node('p', '아직 작업이 없어. 설정을 저장하고 리수에서 메시지를 보내봐.')); return; }
      for (const j of engine.jobs) {
        const card = node('article'); const heading = node('div'); heading.append(node('span', labels[j.status] || j.status, 'badge'), node('strong', j.context.name)); card.append(heading);
        card.append(node('div', `${j.presetName || '기본 프리셋'} · ${j.model} · ${new Date(j.createdAt).toLocaleString()}${j.consumed ? ' · 반환함' : ''}${j.released ? ' · 새 작업 허용됨' : ''}`, 'meta'));
        card.append(node('div', `Batch: ${j.batchId || '미확인'} / 요청: ${j.customId}`, 'meta'));
        if (j.result?.cost != null) card.append(node('div', `보고된 비용: $${j.result.cost}`, 'meta'));
        if (j.error || j.lastError) card.append(node('p', j.error || j.lastError, 'error'));
        if (j.result) {
          const details = node('details'); details.dataset.identity = j.id + ':text'; details.open = expanded.has(details.dataset.identity); details.append(node('summary', j.result.stopReason === 'max_tokens' ? '결과 확인 · 토큰 한도로 잘림' : '결과 확인'), node('pre', j.result.text)); card.append(details);
          if (j.result.thinking) { const d = node('details'); d.dataset.identity = j.id + ':thinking'; d.open = expanded.has(d.dataset.identity); d.append(node('summary', '사고 과정'), node('pre', j.result.thinking)); card.append(d); }
        }
        const row = node('div', null, 'actions'); card.append(row);
        if (j.batchId && !j.result && !j.remoteDeleted) row.append(button('조회', async () => { await engine.refresh(j); renderJobs(); }));
        if (j.result && j.consumed && !j.released) row.append(button('같은 결과 다시 받기', async () => { j.consumed = false; await engine.persist(); notice.textContent = '원래 채팅에서 같은 입력으로 재요청하면 이 결과를 다시 받아.'; }));
        if (!j.released && (TERMINAL.has(j.status) || j.status === 'unknown')) row.append(button('새 작업 허용', async () => {
          if (!confirm(j.status === 'unknown' ? '서버에 이미 접수됐을 수 있어. 다음 요청에서 중복 과금될 수 있어도 새 작업을 허용할까?' : '다음 동일 입력 요청을 새 유료 배치로 접수할 수 있게 할까?')) return;
          await engine.release(j); notice.textContent = '다음 동일 입력 요청부터 새 배치를 만들 수 있어.';
        }));
        if (j.batchId && TERMINAL.has(j.remoteStatus) && !j.remoteDeleted) row.append(button('서버 기록 삭제', async () => {
          if (confirm('이 배치의 서버 입력과 결과를 삭제할까? 로컬 결과는 남아.')) { await engine.deleteRemote(j); renderJobs(); }
        }));
        if (j.remoteDeleted) row.append(node('small', '서버 기록 삭제됨'));
        if (TERMINAL.has(j.status)) row.append(button('로컬 기록 삭제', async () => {
          if (confirm('로컬 결과와 중복 방지 기록을 삭제할까? 서버 기록은 유지돼. 같은 입력을 다시 보내면 새 작업으로 과금될 수 있어.')) await engine.removeLocal(j);
        }));
        if (j.status === 'unknown' || j.status === 'submitting') {
          const label = node('label', 'OpenRouter에서 확인한 batch ID'); const input = node('input'); input.placeholder = 'batch_…'; input.value = attachDrafts.get(j.id) || ''; input.addEventListener('input', () => attachDrafts.set(j.id, input.value)); label.append(input); card.append(label);
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
      for (const k of Object.keys(DEFAULTS)) { if (k === 'cache') inputs[k].checked = p.config[k]; else inputs[k].value = p.config[k]; }
    }
    const ui = await Risuai.registerSetting('OpenRouter Claude Batch', async () => {
      opened = true; fill(); apiInput.placeholder = key ? '저장된 키 있음 · 변경하려면 입력' : 'sk-or-…'; renderJobs(); await Risuai.showContainer('fullscreen');
    }, '📦', 'html');
    async function tick() {
      if (disposed) return;
      if (!busy) { busy = true; try { await engine.tick(); } finally { busy = false; } }
      if (!disposed) timer = setTimeout(tick, 10000);
    }
    timer = setTimeout(tick, 1000);
    await Risuai.onUnload(async () => {
      disposed = true; clearTimeout(timer); for (const c of waiters) c.abort();
      if (ui?.id) await Risuai.unregisterUIPart(ui.id);
      style.remove(); root.remove();
    });
  }
  start().catch(error => {
    console.error('[OpenRouter Claude Batch]', safeError(error));
    Risuai.registerSetting('OpenRouter Claude Batch · 초기화 오류', async () => {
      document.body.textContent = safeError(error); const close = document.createElement('button'); close.textContent = '닫기'; close.onclick = () => Risuai.hideContainer(); document.body.append(close); await Risuai.showContainer('fullscreen');
    }, '⚠️', 'html').catch(() => {});
  });
})();
