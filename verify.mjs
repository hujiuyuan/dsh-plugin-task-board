/**
 * 提交前自检。三个门槛，每个都对应一次「真出过事」。
 *
 *   1. **浏览器半体的工厂包装**：`window.__ModuleLoader__.load({ id, factory })`
 *      里 id 必须等于包名，且 `load` 只能调一次。写错 id 的后果是页面上一片空白、
 *      控制台一声不响——最难查的那种失败。
 *   2. **lib/ 比 src/ 新**：lib/ 是提交进仓库的（用户装下来就要能跑，没有构建步骤），
 *      所以「改了 src 忘了构建」会直接把旧代码发出去。比时间戳是最省事又够用的检查。
 *   3. **宿主半体真能跑**：拿一个假的 webServer 调一遍 apply，确认两条路由注册上了、
 *      账本读得出来。这一步用真实账本，不用假数据。
 */
import { build } from 'esbuild'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'))

const failures = []
const ok = (name, detail = '') => console.log(`ok    ${name}${detail ? '  ' + detail : ''}`)
const bad = (name, detail) => {
  failures.push(name)
  console.log(`FAIL  ${name}  → ${detail}`)
}

// ── 门槛 1：浏览器半体的工厂包装 ──────────────────────────────
{
  const source = readFileSync(join(here, 'lib/client.js'), 'utf8')
  const loads = source.match(/__ModuleLoader__\.load\(/g) ?? []
  if (loads.length !== 1) bad('client.js: load 恰好调用一次', `实际 ${loads.length} 次`)
  else ok('client.js: load 恰好调用一次')

  const idMatch = /__ModuleLoader__\.load\(\{\s*id:\s*'([^']+)'/.exec(source)
  if (idMatch === null) bad('client.js: 能解出注册 id', '没找到 id 字段')
  else if (idMatch[1] !== pkg.name) bad('client.js: 注册 id 等于包名', `id=${idMatch[1]}，包名=${pkg.name}`)
  else ok('client.js: 注册 id 等于包名', idMatch[1])

  // 打进来的 React 会让宿主出现两份 React；这两条 require 必须留成 external
  const requires = [...new Set([...source.matchAll(/require\("([^"]+)"\)/g)].map(m => m[1]))]
  const bundled = requires.filter(name => !['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'].includes(name))
  if (bundled.length > 0) bad('client.js: 只 require 宿主的模块表', `多出来了：${bundled.join(', ')}`)
  else ok('client.js: 只 require 宿主的模块表', `(${requires.join(', ')})`)
}

// ── 门槛 2：lib/ 比 src/ 新 ───────────────────────────────────
{
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
  const newestSrc = Math.max(...walk(join(here, 'src')).map(file => statSync(file).mtimeMs))
  const oldestLib = Math.min(
    statSync(join(here, 'lib/index.js')).mtimeMs,
    statSync(join(here, 'lib/client.js')).mtimeMs,
  )
  if (newestSrc > oldestLib) {
    bad('lib/ 比 src/ 新', `src 最新改动 ${new Date(newestSrc).toLocaleString()}，lib 构建于 ${new Date(oldestLib).toLocaleString()} —— 先 npm run build`)
  } else {
    ok('lib/ 比 src/ 新')
  }
}

// ── 门槛 3：宿主半体真能跑 ────────────────────────────────────
{
  const clientSource = readFileSync(join(here, 'lib/client.js'), 'utf8')
  const dist = await build({
    entryPoints: [join(here, 'src/index.ts')],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: ['node22'],
    define: { __PLUGIN_VERSION__: JSON.stringify(pkg.version) },
    external: ['@deepseek-ai/*', 'node:*'],
  })
  const code = dist.outputFiles[0].text
  const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

  const routes = new Map()
  const warnings = []
  /** 假 llm：记下被怎么调的，然后流式回一段模型样子的文本。 */
  const llmCalls = []
  const fakeLlm = {
    stream(options) {
      llmCalls.push(options)
      const reply = JSON.stringify({ goal: '自检目标', scenario: '自检场景', background: '自检背景', acceptance: ['自检验收'], confidence: 'high' })
      return (async function* () {
        yield { type: 'text-delta', text: '```json\n' }
        yield { type: 'text-delta', text: `${reply}\n` }
        yield { type: 'text-delta', text: '```' }
      })()
    },
  }
  /**
   * 假的任务看板宿主服务。**同时验契约**：扩展声明的 `apiVersion` 必须是 1，
   * id 必须等于包名（它是 `integrations` 那份数据的键，写错就挂到别人名下）。
   * 三个写方法都记下被怎么调的，再由路由那几条断言去核形状。
   */
  const boardCalls = []
  const boardFace = {
    create: (draft, options) => { boardCalls.push({ op: 'create', draft, options }); return { id: 'new-1', title: draft.title, status: draft.status ?? 'todo' } },
    patchContent: (taskId, patch) => { boardCalls.push({ op: 'patch', taskId, patch }) },
    setStatus: (taskId, status) => { boardCalls.push({ op: 'status', taskId, status }) },
  }
  /**
   * 假的会话事件网关。**这一块是「能不能分清它为什么停下来」的全部地基**：
   * 宿主把答案记在每一轮的 `turn/end` 事件里，而那个字段不在任何投影里，
   * 浏览器半体根本拿不到 —— 只能从这儿读。
   *
   * 三个会话各摆一种形状：
   *   s-two  两轮都结束了 → 要取**后**那条（取错就永远显示上一轮的原因）
   *   s-none 一轮都没跑完   → 没有 turn/end，**不是读失败**
   *   s-boom page 抛错      → 读失败，要跟「没跑过」分开报
   *   s-goal 建过目标并宣布达成 → `goalPhase: 'complete'`，绿色那条唯一的来源
   */
  const gatewayCalls = []
  const factFixtures = {
    's-two': [
      { event: { type: 'turn/end', seq: 10, time: 1000, data: { turn: 1, reason: { kind: 'completed' } } } },
      { event: { type: 'user/message', seq: 11, time: 1100, data: {} } },
      { event: { type: 'turn/end', seq: 20, time: 2000, data: { turn: 2, reason: { kind: 'error', error: { message: 'insufficient balance', code: 'QUOTA' } } } } },
    ],
    's-none': [{ event: { type: 'turn/start', seq: 5, time: 500, data: { turn: 1 } } }],
    's-ok': [{ event: { type: 'turn/end', seq: 9, time: 900, data: { turn: 1, reason: { kind: 'aborted', reason: { kind: 'hook', reason: 'deepseek-account/signed-out' } } } } }],
    /*
     * 目标的**最后一条变化排在最后一次 turn/end 之前** —— 真机日志里就是这个顺序：
     * 先宣布目标达成，那一轮才结束。扫到 turn/end 就停会把它整个漏掉，
     * 所以这一条同时也是「别提前 break」的守卫。
     */
    's-goal': [
      { event: { type: 'goal/change', seq: 30, time: 3000, data: { kind: 'goal/change', operation: 'create', goal: { id: 'g1', revision: 1, phase: 'active' } } } },
      { event: { type: 'goal/change', seq: 40, time: 4000, data: { kind: 'goal/change', operation: 'complete', goal: { id: 'g1', revision: 2, phase: 'complete' } } } },
      { event: { type: 'turn/end', seq: 50, time: 5000, data: { turn: 1, reason: { kind: 'completed' } } } },
    ],
    // 目标被 clear 掉的会话：最后一条 goal/change 里没有 goal，只能看到 cleared
    's-cleared': [
      { event: { type: 'goal/change', seq: 30, time: 3000, data: { kind: 'goal/change', operation: 'create', goal: { id: 'g2', revision: 1, phase: 'active' } } } },
      { event: { type: 'turn/end', seq: 40, time: 4000, data: { turn: 1, reason: { kind: 'completed' } } } },
      { event: { type: 'goal/change', seq: 50, time: 5000, data: { kind: 'goal/change', operation: 'clear', cleared: { id: 'g2', revision: 2 } } } },
    ],
  }
  const fakeGateway = {
    invoke: async ({ namespace, method, args }) => {
      gatewayCalls.push({ namespace, method })
      // 真网关的原话。**替身必须照抄这一条**：不然「该走 stream 却走了 invoke」
      // 这个错在单测里是静默的
      if (method === 'follow') throw new Error("typert gateway: session/follow: stream Remote methods must be opened through the stream carrier")
      if (method !== 'page') throw new Error(`意外的网关方法 ${method}`)
      const id = args.request.address.sessionId
      if (id === 's-boom') throw new Error('读事件炸了')
      if (id === '__follow_only__') throw new Error('不该走 invoke，follow 是流')
      return { records: factFixtures[id] ?? [], hasMore: false }
    },
    /**
     * **`stream` 是 async 的** —— 真网关返回的是 `Promise<AsyncIterable>`。
     * 这里早先写成了同步返回，于是「忘了 await」这个 bug 在单测里看不出来，
     * 一直到本地真机加载才炸：`session/follow: stream Remote methods must be
     * opened through the stream carrier`。假替身跟真东西的形状对不上，
     * 验出来的就是假的绿。
     */
    stream: async ({ namespace, method, args }) => {
      gatewayCalls.push({ namespace, method })
      const id = args.request.address.sessionId
      const frame = id === 's-boom'
        ? { type: 'snapshot', cursor: 7, records: [], hasMore: false }
        : { type: 'snapshot', cursor: 20, records: [], hasMore: false }
      return (async function* () {
        yield frame
        // 流必须被关掉 —— 这里 yield 第二次，如果调用方没 return() 就会读到它，
        // 拿到一个「不是快照」的帧，于是那次读会退化成「没跑过」
        yield { type: 'update', records: [] }
      })()
    },
  }

  let registered
  const board = {
    registerExtension: extension => { registered = extension; extension.start?.({ tasks: boardFace }); return () => { extension.stop?.() } },
  }

  const ctx = {
    webServer: { register: route => { routes.set(route.path, route); return () => {} } },
    logger: { warn: message => warnings.push(message) },
    llm: fakeLlm,
    // cordis 的注入：这里直接同步回调，模拟「服务都已经在了」。
    // 两个服务各回调各的 —— 它们本来就是分开注册的，链式写会漏掉一个。
    // 注入进来的 scope 是**子上下文**，除了新服务还继承着父上下文的全部东西
    // （webServer / logger 都在）。这里照这个来，不然会验出一个不存在的 bug。
    inject: (names, callback) => callback({
      webServer: { register: route => { routes.set(route.path, route); return () => {} } },
      logger: { warn: message => warnings.push(message) },
      get: name => (name === 'taskBoard' ? board : name === 'llm' ? fakeLlm : name === 'typertGateway' ? fakeGateway : undefined),
      llm: names.includes('llm') ? fakeLlm : undefined,
    }),
    get: name => (name === 'taskBoard' ? board : name === 'llm' ? fakeLlm : name === 'typertGateway' ? fakeGateway : undefined),
  }
  const dispose = mod.apply(ctx)
  for (const [name, path] of [['health', mod.HEALTH_PATH], ['ledger', mod.LEDGER_PATH], ['enrich', mod.ENRICH_PATH], ['overrides', mod.OVERRIDES_PATH], ['session-facts', mod.SESSION_FACTS_PATH], ['session-archive', mod.SESSION_ARCHIVE_PATH]]) {
    if (!routes.has(path)) bad(`host: 注册了 ${name} 路由`, [...routes.keys()].join(', '))
    else ok(`host: 注册了 ${name} 路由`)
  }

  const call = async (spec, { method = 'GET', body } = {}) => {
    // 路由按**路径**注册，查询串是 handler 自己从 `req.url` 里读的
    const path = spec.split('?')[0]
    let text = ''
    let status = 0
    const req = {
      method,
      url: spec,
      async *[Symbol.asyncIterator]() {
        if (body !== undefined) yield Buffer.from(JSON.stringify(body))
      },
    }
    await routes.get(path).handler(req, {
      writeHead(code) { status = code },
      end(chunk) { text = chunk },
    })
    return { status, body: JSON.parse(text) }
  }
  const health = await call(mod.HEALTH_PATH)
  if (health.status !== 200 || health.body.ok !== true || health.body.version !== pkg.version) {
    bad('host: health 返回自身版本', JSON.stringify(health))
  } else ok('host: health 返回自身版本', health.body.version)

  const ledger = await call(mod.LEDGER_PATH)
  if (ledger.status !== 200) bad('host: ledger 返回 200', `HTTP ${ledger.status}`)
  else if (ledger.body.ok === true) {
    ok('host: 读到真实账本', `${ledger.body.tasks.length} 个任务 · schemaVersion ${ledger.body.schemaVersion}`)
    // 真实账本升代之后兜底那条路悄悄失效过一次：这里写死 5，用户升级到 6 之后
    // 只有「看板不在场」时才看得出来 —— 而那正是最需要兜底的时候
    if (ledger.body.schemaVersion >= 6) ok('host: 认得当前这一代账本（v6 不能拒）', `v${ledger.body.schemaVersion}`)
  } else {
    // 账本不在（新机器、看板没跑过）不是失败，是降级——但要说出来
    ok('host: 账本不可用，按降级返回', ledger.body.reason)
  }

  // 认不出的那一代必须**明说是几**。只回一句「对不上」的话，用户不知道该升级谁
  {
    const fake = mkdtempSync(join(tmpdir(), 'dsptb-schema-'))
    mkdirSync(join(fake, 'task-board'), { recursive: true })
    const seen = []
    for (const [version, shouldPass] of [[6, true], [5, true], [2, true], [99, false], [undefined, false]]) {
      writeFileSync(
        join(fake, 'task-board', 'ledger-v2.json'),
        JSON.stringify({ schemaVersion: version, revision: 1, tasks: [] }),
      )
      const previous = process.env.DSH_HOME
      process.env.DSH_HOME = fake
      const probe = await call(mod.LEDGER_PATH)
      process.env.DSH_HOME = previous
      const label = version === undefined ? '没有 schemaVersion' : `v${version}`
      if (shouldPass) {
        if (probe.body.ok === true) ok(`host: ${label} 的账本读得出来`, '')
        else bad(`host: ${label} 的账本读得出来`, JSON.stringify(probe.body))
      } else {
        if (probe.body.ok !== true && probe.body.reason === 'schema-mismatch' && probe.body.actual === (version ?? null)) {
          seen.push(probe.body)
        } else bad(`host: ${label} 的账本要被拒、且说清是几`, JSON.stringify(probe.body))
      }
    }
    if (seen.length === 2) {
      const supported = seen[0].supported ?? []
      if (Array.isArray(supported) && supported.includes(6)) ok('host: 被拒时带回了「我认得哪几代」', supported.join('/'))
      else bad('host: 被拒时带回了「我认得哪几代」', JSON.stringify(seen[0]))
    }
    rmSync(fake, { recursive: true, force: true })
  }

  // ── 归纳那条路：形状、缓存、以及「模型乱回话」时的兜底 ──────────────
  //
  // **从这里开始把 DSH_HOME 换成一个临时目录。** 底下那两条路由会真的往磁盘上
  // 写文件（归纳缓存、人工改动）。不换根目录的话，跑一次自检就会往用户真实的
  // `~/.dsh` 里塞一个 `dsh-plugin-task-board/enrichment.json` —— 自检不该有副作用。
  // 账本那条在上面已经跑完了（读没有副作用，而且读真实数据才有意义）。
  const sandbox = mkdtempSync(join(tmpdir(), 'dsptb-verify-'))
  process.env.DSH_HOME = sandbox

  const material = {
    id: 't1', title: '自检任务', description: '说明', prompt: '把这件事做完。',
    status: 'todo', tags: [], runs: [],
  }

  const enrich = await call(mod.ENRICH_PATH, { method: 'POST', body: { model: 'x/y', tasks: [material] } })
  if (enrich.body.ok !== true) bad('host: 归纳返回 ok', JSON.stringify(enrich.body))
  else if (enrich.body.results.t1.ai.goal !== '自检目标') {
    bad('host: 从带代码围栏的回复里抠出了 JSON', JSON.stringify(enrich.body.results.t1.ai))
  } else ok('host: 从带代码围栏的回复里抠出了 JSON', JSON.stringify(enrich.body.results.t1.ai))

  if (llmCalls.length !== 1) bad('host: 一次请求只调一次模型', `实际 ${llmCalls.length} 次`)
  else ok('host: 一次请求只调一次模型')
  const sentMessage = llmCalls[0]?.messages?.[0]
  if (sentMessage?.role !== 'user' || sentMessage?.content?.[0]?.type !== 'text') {
    bad('host: 发出去的消息形状对得上宿主 llm', JSON.stringify(sentMessage))
  } else if (!/标题：自检任务/.test(sentMessage.content[0].text)) {
    bad('host: 素材拼进了消息里', sentMessage.content[0].text.slice(0, 80))
  } else ok('host: 消息形状和素材都对')

  const again = await call(mod.ENRICH_PATH, { method: 'POST', body: { model: 'x/y', tasks: [material] } })
  if (llmCalls.length !== 1) bad('host: 素材没变就不重复问模型', `第二次又问了一遍（${llmCalls.length} 次）`)
  else ok('host: 素材没变就不重复问模型', `cached=${again.body.results?.t1?.cached}`)

  // 模型回一堆废话：不能报错，只能回空——前端靠这个退回规则推导
  fakeLlm.stream = () => (async function* () { yield { type: 'text-delta', text: '我觉得这个任务挺好的。' } })()
  const junk = await call(mod.ENRICH_PATH, { method: 'POST', body: { model: 'x/y', force: true, tasks: [{ ...material, title: '改过标题' }] } })
  if (junk.body.ok !== true || Object.keys(junk.body.results.t1.ai).length !== 0) {
    bad('host: 模型胡说时返回空的 ai（前端退回规则推导）', JSON.stringify(junk.body))
  } else ok('host: 模型胡说时返回空的 ai（前端退回规则推导）')

  // 没有模型路由：明说，不猜
  const noRoute = await call(mod.ENRICH_PATH, { method: 'POST', body: { tasks: [material] } })
  if (noRoute.body.ok !== false || noRoute.body.reason !== 'no-model') {
    bad('host: 没给模型路由时报 no-model', JSON.stringify(noRoute.body))
  } else ok('host: 没给模型路由时报 no-model')

  // 请求体是外部输入：超长、类型不对的都得被挡下来
  const dirty = await call(mod.OVERRIDES_PATH, {
    method: 'POST',
    body: { taskId: 't1', override: { goal: 'x'.repeat(5000), priority: '不存在的档位', acceptanceDone: 'not-an-array', 别的字段: 1 } },
  })
  const back = await call(mod.OVERRIDES_PATH)
  const saved = back.body.overrides.t1
  if (dirty.body.ok !== true) bad('host: 存人工改动能成功', JSON.stringify(dirty.body))
  else if (saved.goal.length > 400) bad('host: 超长的值被截断', `长度 ${saved.goal.length}`)
  else if (saved.priority !== undefined) bad('host: 认不出的优先级被丢掉', JSON.stringify(saved.priority))
  else if (saved.acceptanceDone !== undefined) bad('host: 类型不对的字段被丢掉', JSON.stringify(saved.acceptanceDone))
  else if ('别的字段' in saved) bad('host: 不认识的键被丢掉', JSON.stringify(saved))
  else ok('host: 浏览器发上来的脏值被挡在盘外', JSON.stringify(saved))

  // ── 写操作 ────────────────────────────────────────────────────────
  //
  // 这一块要验的是**三个边界**：走的是看板给的口子（不是直接改账本文件）、
  // 看板不在场时说清楚、以及浏览器发上来的东西不会被当成合法动作。
  if (registered === undefined) {
    bad('host: 向任务看板注册了扩展', 'registerExtension 没被调用')
  } else {
    if (registered.apiVersion !== 1) bad('host: 扩展声明的 apiVersion 是 1', String(registered.apiVersion))
    else if (registered.id !== pkg.name) bad('host: 扩展 id 等于包名', `id=${registered.id}`)
    else ok('host: 向任务看板注册了扩展', `id=${registered.id} · apiVersion=${registered.apiVersion}`)
  }

  const ready = await call(mod.WRITE_PATH)
  if (ready.body.ok !== true || ready.body.ready !== true) bad('host: 有看板时写入口是就绪的', JSON.stringify(ready.body))
  else ok('host: 有看板时写入口是就绪的')

  const created = await call(mod.WRITE_PATH, { method: 'POST', body: { op: 'create', draft: { title: '从自检建的卡', description: 'd', prompt: 'p', status: 'todo' } } })
  if (created.body.ok !== true || created.body.task?.id !== 'new-1') bad('host: create 转给了看板', JSON.stringify(created.body))
  else if (boardCalls.at(-1)?.draft?.title !== '从自检建的卡') bad('host: create 的 draft 原样传过去', JSON.stringify(boardCalls.at(-1)))
  else ok('host: create 转给了看板并拿回 id', created.body.task.id)

  const patched = await call(mod.WRITE_PATH, { method: 'POST', body: { op: 'patch', taskId: 't9', patch: { title: '改过的' } } })
  if (patched.body.ok !== true || boardCalls.at(-1)?.op !== 'patch' || boardCalls.at(-1)?.taskId !== 't9') {
    bad('host: patch 转给了看板', JSON.stringify([patched.body, boardCalls.at(-1)]))
  } else ok('host: patch 转给了看板', JSON.stringify(boardCalls.at(-1).patch))

  const moved = await call(mod.WRITE_PATH, { method: 'POST', body: { op: 'status', taskId: 't9', status: 'done' } })
  if (moved.body.ok !== true || boardCalls.at(-1)?.op !== 'status') bad('host: setStatus 转给了看板', JSON.stringify([moved.body, boardCalls.at(-1)]))
  else ok('host: setStatus 转给了看板', `${boardCalls.at(-1).taskId} → ${boardCalls.at(-1).status}`)

  // 认不出的 op 要明确拒绝，**不能当没看见** —— 前端会以为成功了
  const bogus = await call(mod.WRITE_PATH, { method: 'POST', body: { op: '删库', taskId: 't9' } })
  if (bogus.body.ok !== false || bogus.body.reason !== 'refused' || !bogus.body.detail.includes('认不出')) {
    bad('host: 认不出的操作被拒绝', JSON.stringify(bogus.body))
  } else ok('host: 认不出的操作被拒绝', bogus.body.detail)

  // 看板拒绝时把它的原话带回去（不是我们转述一遍）
  boardFace.patchContent = () => { throw new Error('这张卡已经开始跑过了，它的标题/说明/提示不能再改') }
  const refused = await call(mod.WRITE_PATH, { method: 'POST', body: { op: 'patch', taskId: 't9', patch: { title: 'x' } } })
  if (refused.body.ok !== false || !refused.body.detail.includes('已经开始跑过了')) {
    bad('host: 看板拒绝时原话带回去', JSON.stringify(refused.body))
  } else ok('host: 看板拒绝时原话带回去')

  // 看板不在场：写入口整个关掉，而且**不是错误** —— 看板本来就可能没装。
  // 这里重新 import 一份（加个注释打散 URL 缓存），用另一个什么都不提供的 ctx 跑一遍。
  const lonely = await import(`data:text/javascript;base64,${Buffer.from(`${code}\n// lonely`).toString('base64')}`)
  const lonelyRoutes = new Map()
  lonely.apply({
    webServer: { register: route => { lonelyRoutes.set(route.path, route); return () => {} } },
    logger: { warn: () => {} },
    // 服务永远不出现：模拟看板没装
    inject: () => {},
    get: () => undefined,
  })
  // 归纳那条只接 POST（浏览器半体就是这么调它的），所以探它得带 body。
  const probe = async (path, body) => {
    let text = ''
    await lonelyRoutes.get(path).handler(
      {
        method: body === undefined ? 'GET' : 'POST',
        async *[Symbol.asyncIterator]() {
          if (body !== undefined) yield Buffer.from(JSON.stringify(body))
        },
      },
      { writeHead() {}, end(chunk) { text = chunk } },
    )
    return JSON.parse(text)
  }
  if (!lonelyRoutes.has(mod.WRITE_PATH)) {
    bad('host: 看板不在场时也注册写路由', [...lonelyRoutes.keys()].join(', '))
  } else {
    const gate = await probe(mod.WRITE_PATH)
    if (gate.ready !== false) bad('host: 看板不在场时写入口是关的', JSON.stringify(gate))
    else ok('host: 看板不在场时写入口是关的并给了原因', gate.detail)
  }
  if (!lonelyRoutes.has(mod.ENRICH_PATH)) {
    // 路由整个不在 = 浏览器拿到 404，于是报「宿主半体可能没装上」——
    // 完全指错方向的结论。所以这条断言盯的是「路由在不在」，不是它答什么。
    bad('host: 没有 llm 服务时也注册归纳路由', [...lonelyRoutes.keys()].join(', '))
  } else {
    const gate = await probe(mod.ENRICH_PATH, { model: 'x/y', tasks: [{ id: 't1', title: '自检任务' }] })
    if (gate.ok !== false || gate.reason !== 'no-model') bad('host: 没有 llm 时归纳报 no-model', JSON.stringify(gate))
    else ok('host: 没有 llm 时归纳报 no-model', gate.detail)
  }

  // ── 会话事实：**「它为什么停下来」只能从这儿读** ──────────────────────
  //
  // 界面上那四种颜色全吊在这个字段上。宿主把答案记在每一轮的 `turn/end` 里，
  // 而那个字段**不在任何投影里**（投影只有 turnOutline / turnBoundary /
  // subagentCatalog），浏览器半体拿不到。看板的宿主半体读到同一个字段，
  // 但读完就压成一句 "agent turn ended with an error" 写进账本 ——
  // 真实账本里那条就是这个字符串，`QUOTA` 和 `SERVER` 全被抹平了。
  {
    const facts = await call(`${mod.SESSION_FACTS_PATH}?ids=s-two,s-none,s-ok,s-boom,s-goal,s-cleared`)
    if (facts.status !== 200 || facts.body.ok !== true) bad('host: 会话事实路由回 200+ok', JSON.stringify(facts.body))
    else ok('host: 会话事实路由回 200+ok')

    // **取最后一条 turn/end**。取第一条的话，一个跑了两轮的任务永远显示第一轮的原因
    const two = facts.body.facts?.['s-two']?.turn
    if (two?.kind !== 'error' || two?.code !== 'QUOTA') {
      bad('host: 取的是最后一条 turn/end（不是第一条）', JSON.stringify(two))
    } else ok('host: 取的是最后一条 turn/end', `${two.kind}/${two.code}`)

    // 错误码原样带出来，**一个字符的错误文本都不解析**
    if (two?.message !== 'insufficient balance') bad('host: 错误原文一起带回来（给人看，不用于判断）', JSON.stringify(two))
    else ok('host: 错误原文一起带回来')

    /*
     * 绿色（目标达成）唯一的来源。**两件事一起验**：
     * ① 读到了 `goalPhase`；② 它没被「先扫到 turn/end 就停」漏掉 ——
     * 真机日志里目标的最后一条变化就排在最后一次 turn/end 之前。
     */
    const goalFact = facts.body.facts?.['s-goal']
    if (goalFact?.goalPhase !== 'complete') {
      bad('host: 目标的最后阶段读出来了（goal/change）', JSON.stringify(goalFact))
    } else ok('host: 目标的最后阶段读出来了', goalFact.goalPhase)
    if (goalFact?.turn?.kind !== 'completed') {
      bad('host: 目标那条会话的 turn 也没被挤掉', JSON.stringify(goalFact))
    } else ok('host: 同一趟里 turn 和 goal 都拿到了')

    // 目标被 clear：最后一条 goal/change 里**没有 goal**，只能看到 cleared ——
    // 这时要报「没有目标」，不能把上一轮还活着的 active 留着（会一直绿着）
    const clearedFact = facts.body.facts?.['s-cleared']
    if (clearedFact?.goalPhase !== undefined) {
      bad('host: 目标被 clear 掉之后不再报阶段', JSON.stringify(clearedFact))
    } else ok('host: 目标被 clear 掉之后不再报阶段')

    // `aborted` 带次级原因：登出是它下面的一种，跟「你按了停止」不是一回事
    const okFact = facts.body.facts?.['s-ok']?.turn
    if (okFact?.kind !== 'aborted' || okFact?.abortKind !== 'hook') {
      bad('host: aborted 带下次级原因', JSON.stringify(okFact))
    } else ok('host: aborted 带下次级原因', okFact.abortKind)

    // **没跑过不是读失败**。这两件事在下游长得一样（都没颜色），
    // 但意思完全不同：一个是「它还没跑过一轮」，一个是「我读不出来，你别信我」
    if (facts.body.facts?.['s-none']?.turn !== undefined || facts.body.facts?.['s-none']?.unreadable === true) {
      bad('host: 没有 turn/end 的会话既不报结论也不报失败', JSON.stringify(facts.body.facts?.['s-none']))
    } else ok('host: 没有 turn/end 的会话既不报结论也不报失败')

    if (facts.body.facts?.['s-boom']?.unreadable !== true) {
      bad('host: 读事件失败时带 unreadable 标记', JSON.stringify(facts.body.facts?.['s-boom']))
    } else ok('host: 读事件失败时带 unreadable 标记')

    // 只要一帧快照，**流必须被关掉** —— 不关的话每次轮询漏一个挂着的迭代器
    const streams = gatewayCalls.filter(c => c.method === 'follow').length
    if (streams === 0) bad('host: 走的是 follow 流（拿最新序号）', JSON.stringify(gatewayCalls))
    else ok('host: 走的是 follow 流', `${streams} 次`)

    /*
     * 缓存：序号没变就不重读**那一页事件**。
     *
     * 那个 `follow`（拿最新序号的那一帧）省不掉 —— 不先问一句「它动了没」，
     * 就不知道缓存还作不作数。它只取一帧、读的是事件流的开头，比往回翻
     * 两百条便宜得多。所以这里卡的是 `page` 的次数，不是网关调用总数。
     */
    const pagesBefore = gatewayCalls.filter(c => c.method === 'page').length
    const repeat = await call(`${mod.SESSION_FACTS_PATH}?ids=s-two`)
    const pagesAfter = gatewayCalls.filter(c => c.method === 'page').length
    if (pagesAfter !== pagesBefore) {
      bad('host: 序号没变就不重读事件（缓存生效）', `又翻了一遍，多了 ${pagesAfter - pagesBefore} 次`)
    } else ok('host: 序号没变就不重读事件', `结论照旧：${repeat.body.facts?.['s-two']?.turn?.code}`)

    // 空 ids：**不碰网关**，直接空表
    const empty = await call(`${mod.SESSION_FACTS_PATH}?ids=`)
    if (empty.body.ok !== true || Object.keys(empty.body.facts ?? {}).length !== 0) {
      bad('host: 空 ids 直接回空表', JSON.stringify(empty.body))
    } else ok('host: 空 ids 直接回空表')
  }

  // 网关不在场：**答 no-gateway，不能是 404**。
  // 404 会被界面读成「插件没装上」，那是完全指错方向的结论 ——
  // 插件装着呢，只是这个部署没有那层网关。同 `no-model` 那次踩过的坑。
  {
    const mod3 = await import(`data:text/javascript;base64,${Buffer.from(`${code}\n// no-gateway`).toString('base64')}`)
    const routes3 = new Map()
    const noGw = {
      webServer: { register: route => { routes3.set(route.path, route); return () => {} } },
      logger: { warn: () => {} },
      get: () => undefined,
      inject: (names, callback) => callback({ webServer: { register: () => () => {} }, logger: { warn: () => {} }, get: () => undefined }),
    }
    const off3 = mod3.apply(noGw)
    if (typeof off3 === 'function') off3()
    const live3 = new Map()
    const strict3 = { register(route) { live3.set(route.path, route); return () => {} } }
    const ctx3 = { ...noGw, webServer: strict3, inject: (names, callback) => callback({ webServer: strict3, logger: { warn: () => {} }, get: () => undefined }) }
    mod3.apply(ctx3)
    let text3 = ''
    await live3.get(mod3.SESSION_FACTS_PATH).handler(
      { method: 'GET', url: '/api/dsh-plugin-task-board/session-facts?ids=a', [Symbol.asyncIterator]: async function* () {} },
      { writeHead() {}, end(chunk) { text3 = chunk } },
    )
    const body3 = JSON.parse(text3)
    if (body3.ok !== false || body3.reason !== 'no-gateway') bad('host: 没有网关时答 no-gateway（不是 404）', text3)
    else ok('host: 没有网关时答 no-gateway', body3.detail)
  }

  // ── 会话归档：**只有这一处会写会话状态** ────────────────────────────────
  // 会话不是账本里的东西，「我收工了」这句话没有别人能替我们存。
  {
    const empty = await call(mod.SESSION_ARCHIVE_PATH)
    if (empty.body.ok !== true || Object.keys(empty.body.archived ?? {}).length !== 0) {
      bad('host: 归档表初始是空的', JSON.stringify(empty.body))
    } else ok('host: 归档表初始是空的')

    const put = await call(mod.SESSION_ARCHIVE_PATH, { method: 'POST', body: { sessionId: 'sess-1', archived: true } })
    if (put.body.ok !== true || typeof put.body.archived?.['sess-1'] !== 'number') {
      bad('host: 归档一条会话', JSON.stringify(put.body))
    } else ok('host: 归档一条会话')

    // **落盘了**。读一次新进程才算数 —— 同一个内存对象不算
    const reread = JSON.parse(readFileSync(join(sandbox, 'dsh-plugin-task-board', 'sessions.json'), 'utf8'))
    if (reread.archived?.['sess-1'] === undefined) bad('host: 归档真的写进了盘', JSON.stringify(reread))
    else ok('host: 归档真的写进了盘')

    const undo = await call(mod.SESSION_ARCHIVE_PATH, { method: 'POST', body: { sessionId: 'sess-1', archived: false } })
    if (undo.body.archived?.['sess-1'] !== undefined) bad('host: 撤销归档真的删掉了', JSON.stringify(undo.body))
    else ok('host: 撤销归档真的删掉了')

    // 脏输入挡在盘外：sessionId 必填、有长度上限
    for (const [name, body] of [['空 sessionId', { sessionId: '' }], ['不是字符串', { sessionId: 42 }], ['超长', { sessionId: 'x'.repeat(500) }]]) {
      const r = await call(mod.SESSION_ARCHIVE_PATH, { method: 'POST', body })
      if (r.body.ok !== false || r.body.reason !== 'bad-request') bad(`host: 归档拒绝${name}`, JSON.stringify(r.body))
      else ok(`host: 归档拒绝${name}`)
    }
    const after = JSON.parse(readFileSync(join(sandbox, 'dsh-plugin-task-board', 'sessions.json'), 'utf8'))
    if (Object.keys(after.archived ?? {}).length !== 0) bad('host: 脏输入一个都没落盘', JSON.stringify(after))
    else ok('host: 脏输入一个都没落盘')
  }

  // ── 卸载：**apply 必须把每一处副作用还回来** ──────────────────────────
  //
  // 这一块是真出过事的：apply 早先返回 void，卸载时一条路由都没摘掉，
  // 重新启用时 webserver.register 撞上自己上次留下的那条，报
  // 「duplicate exact route "/api/dsh-plugin-task-board/health"」，
  // 插件的启用直接失败。cordis 什么时候卸载再重跑？**被注入服务（webserver）的
  // fiber uid 一变就会** —— 也就是宿主重启 webserver、或者改配置的时候。
  // 所以这不是边缘情况，是迟早会撞上的。
  if (typeof dispose !== 'function') {
    bad('host: apply 返回卸载函数（不返回就等于永不清理）', String(typeof dispose))
  } else {
    ok('host: apply 返回卸载函数')
    // 假的 webServer 要真的把路由存起来，才验得出「摘没摘」
    const live = new Map()
    const strict = {
      register(route) {
        if (live.has(route.path)) throw new Error(`webserver: duplicate exact route "${route.path}"`)
        live.set(route.path, route)
        return () => { live.delete(route.path) }
      },
    }
    const boardCalls2 = []
    const routes2 = []
    const mod2 = await import(`data:text/javascript;base64,${Buffer.from(`${code}\n// strict`).toString('base64')}`)
    const ctx2 = {
      webServer: strict,
      logger: { warn: m => warnings.push(m) },
      get: n => (n === 'taskBoard' ? { registerExtension: () => () => { boardCalls2.push('off') } } : undefined),
      inject: (names, callback) => callback({
        webServer: strict,
        logger: { warn: m => warnings.push(m) },
        get: n => (n === 'taskBoard' ? { registerExtension: () => () => { boardCalls2.push('off') } } : undefined),
      }),
    }
    const off = mod2.apply(ctx2)
    const first = live.size
    if (typeof off === 'function') off()
    const after = live.size
    if (after !== 0) bad('host: 卸载后路由全摘干净', `还剩 ${after} 条：${[...live.keys()].join(', ')}`)
    else ok('host: 卸载后路由全摘干净', `摘掉 ${first} 条`)

    // **卸载之后能重新装一遍** —— 这就是用户看到的那次失败的原样复现
    try {
      const off2 = mod2.apply(ctx2)
      if (live.size !== first) bad('host: 卸载后能重新注册（走一遍 cordis 的卸载→重跑）', `重新注册了 ${live.size} 条，第一次是 ${first} 条`)
      else ok('host: 卸载后能重新注册（走一遍 cordis 的卸载→重跑）', `${live.size} 条`)
      if (typeof off2 === 'function') off2()
    } catch (error) {
      bad('host: 卸载后能重新注册（走一遍 cordis 的卸载→重跑）', String(error))
    }
    void routes2
    // 扩展注册也要还回去，不然同一个看板会被注册第二遍
    if (!boardCalls2.includes('off')) {
      bad('host: 卸载时把看板扩展也注销掉', JSON.stringify(boardCalls2))
    } else ok('host: 卸载时把看板扩展也注销掉')

    // 装到一半炸了不能留残骸：cordis 那次 collect 根本没发生（execute 抛了就没有
    // 返回值可收），留下的路由会让下一次重试再撞一次 —— 失败一次就再也起不来
    const half = new Map()
    let calls = 0
    const grumpy = {
      register(route) {
        calls += 1
        // 第三条开始拒绝：模拟「装到一半出错」。
        // **故意不是 duplicate** —— duplicate 现在是容错的（跳过那一条继续装），
        // 拿它来测回滚会测成另一件事
        if (calls >= 3) throw new Error('route 表坏了')
        half.set(route.path, route)
        return () => { half.delete(route.path) }
      },
    }
    const mod3 = await import(`data:text/javascript;base64,${Buffer.from(`${code}\n// half`).toString('base64')}`)
    let threw = false
    try {
      mod3.apply({
        webServer: grumpy,
        logger: { warn: () => {} },
        inject: () => {},
        get: () => undefined,
      })
    } catch {
      threw = true
    }
    if (!threw) bad('host: 装到一半出错会抛出去（不能装作没事）', '没抛')
    else if (half.size !== 0) bad('host: 装到一半出错时把已装的摘干净', `还剩 ${[...half.keys()].join(', ')}`)
    else ok('host: 装到一半出错时把已装的摘干净')

    // 进程里已经留着一条我们自己的老路由（旧版本没摘干净，而 webServer 没有
    // unregister，谁都摘不掉）——**这不能让整个插件激活失败**。
    // 那条路由的 handler 还是我们自己的，功能照常；跳过它、把其余装上就行。
    const stale = new Map()
    stale.set(mod.HEALTH_PATH, { kind: 'exact', path: mod.HEALTH_PATH, handler: () => {} })
    const staleWarnings = []
    const staleRoutes = new Map(stale)
    const withStale = {
      register(route) {
        if (staleRoutes.has(route.path)) throw new Error(`webserver: duplicate exact route "${route.path}"`)
        staleRoutes.set(route.path, route)
        return () => { staleRoutes.delete(route.path) }
      },
    }
    const mod4 = await import(`data:text/javascript;base64,${Buffer.from(`${code}\n// stale`).toString('base64')}`)
    let staleThrew = null
    try {
      mod4.apply({
        webServer: withStale,
        logger: { warn: m => staleWarnings.push(m) },
        inject: () => {},
        get: () => undefined,
      })
    } catch (error) {
      staleThrew = error
    }
    if (staleThrew !== null) bad('host: 撞上自己留下的老路由时不炸（跳过那一条继续装）', String(staleThrew))
    else if (!staleRoutes.has(mod.LEDGER_PATH) || !staleRoutes.has(mod.ENRICH_PATH) || !staleRoutes.has(mod.WRITE_PATH)) {
      bad('host: 撞车后其余路由照常装上', [...staleRoutes.keys()].join(', '))
    } else if (!staleWarnings.some(m => m.includes('已经被占着'))) {
      bad('host: 撞车时说清楚是「被占着」', JSON.stringify(staleWarnings))
    } else ok('host: 撞上自己留下的老路由时不炸', `跳过 1 条，装上 ${staleRoutes.size} 条`)

    // 反向：**真的跟别人撞了**（非 duplicate 的错）不能也被吞掉 ——
    // 那种是配置写错了，得看得见
    const broken = { register() { throw new TypeError('route 参数不对') } }
    let brokenThrew = false
    try {
      const mod5 = await import(`data:text/javascript;base64,${Buffer.from(`${code}\n// broken`).toString('base64')}`)
      mod5.apply({ webServer: broken, logger: { warn: () => {} }, inject: () => {}, get: () => undefined })
    } catch {
      brokenThrew = true
    }
    if (!brokenThrew) bad('host: 别的错照旧抛出去（不能被「撞车容错」一起吞掉）', '没抛')
    else ok('host: 别的错照旧抛出去（不能被「撞车容错」一起吞掉）')
  }

  await rm(sandbox, { recursive: true, force: true })

  if (warnings.length > 0) bad('host: apply 期间没有告警', warnings.join(' / '))
  else ok('host: apply 期间没有告警')

  if (!clientSource.includes('dsptb')) bad('client.js: 内容看起来是空的', '')
}

console.log()
if (failures.length > 0) {
  console.log(`${failures.length} 项没过：${failures.join('、')}`)
  process.exit(1)
}
console.log('全部通过')
