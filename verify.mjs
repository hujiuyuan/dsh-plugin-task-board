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
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs'
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
      get: name => (name === 'taskBoard' ? board : name === 'llm' ? fakeLlm : undefined),
      llm: names.includes('llm') ? fakeLlm : undefined,
    }),
    get: name => (name === 'taskBoard' ? board : name === 'llm' ? fakeLlm : undefined),
  }
  mod.apply(ctx)
  for (const [name, path] of [['health', mod.HEALTH_PATH], ['ledger', mod.LEDGER_PATH], ['enrich', mod.ENRICH_PATH], ['overrides', mod.OVERRIDES_PATH]]) {
    if (!routes.has(path)) bad(`host: 注册了 ${name} 路由`, [...routes.keys()].join(', '))
    else ok(`host: 注册了 ${name} 路由`)
  }

  const call = async (path, { method = 'GET', body } = {}) => {
    let text = ''
    let status = 0
    const req = {
      method,
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
  } else {
    // 账本不在（新机器、看板没跑过）不是失败，是降级——但要说出来
    ok('host: 账本不可用，按降级返回', ledger.body.reason)
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
