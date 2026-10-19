/**
 * dsh-plugin-task-board · 宿主半体。
 *
 * 规划视图**自己就是任务引擎**：存任务、开会话跑任务、盯会话进度、定时触发，
 * 全在 `engine/` 里。原来这些靠第三方的「任务看板」插件，现在不依赖它了；
 * 它留下的账本 `$DSH_HOME/task-board/ledger-v2.json` 只在第一次启动时导入一次，
 * 之后不再读，也从不写。
 *
 * 另外几条路由是分析层的：模型归纳、人工改动、会话结论、会话归档，存在插件自己的目录里。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join, resolve as pathResolve } from 'node:path'
import { homedir } from 'node:os'
import {
  ENRICH_TIMEOUT_MS,
  EnrichError,
  enrichOnce,
  renderMaterial,
  splitRoute,
  type AiIntent,
  type LlmFace,
  type Material,
} from './enrich'
import { readFacts, type GatewayFace, type SessionFact } from './sessionfacts'
import { Refusal, TaskEngine, type EngineSnapshot, type SchedulePatch } from './engine/engine'
import { createOwnerPeer, Runner, withPeer, type CommandsFace, type RawGateway, type WorkspaceRegistryFace } from './engine/runner'

declare const __PLUGIN_VERSION__: string
const PLUGIN_VERSION = typeof __PLUGIN_VERSION__ === 'undefined' ? 'dev' : __PLUGIN_VERSION__

/**
 * 我们真正用到的那一小块 cordis 上下文。
 *
 * 不 import `@deepseek-ai/cordis` 的类型，是**故意的**：那个包只在宿主进程里存在，
 * 本地装不到，为了几个类型去加一个装不上的依赖，换来的是一份永远飘红的 tsconfig。
 * 这里写结构类型，宿主给的东西对得上就用得上——对不上会在运行时被下面的守卫拦下。
 */
interface WebServerRoute {
  kind: 'exact' | 'prefix'
  path: string
  handler: (req: any, res: any) => void | Promise<void>
}

interface HostContext {
  webServer?: { register(route: WebServerRoute): () => void }
  logger?: { warn(message: string): void; info?(message: string): void }
  /** 宿主注入的模型服务。装没装、什么时候到，都不是我们说得了算的。 */
  llm?: LlmFace
  /**
   * cordis 的「等某个服务出现再跑这段」。用它注册模型那条路由，是为了
   * **llm 不在场时其余路由照常工作** —— 没有模型只是少一个功能，不是整个插件坏掉。
   */
  inject?: (names: string[], callback: (scope: HostContext) => void) => void
  get?: (name: string) => unknown
}

export const name = 'dsh-plugin-task-board'
export const inject = ['webServer']

/**
 * 我们认得的账本 schemaVersion。
 *
 * **是一个区间不是某一个值。** 看板自己会把老账本逐代迁移上来，当前那一代是 6；
 * 而它迁移时我们**读到的还是盘上那份原文**（退回读快照那条路根本不等它），
 * 所以 5 和 6 都得认。
 *
 * 之前这里写死 5，结果用户真实账本升到 6 之后，兜底那条路整体失效 ——
 * 而且**看不出来**：看板在场时走的是实时镜像，一点毛病没有；只有看板不在场、
 * 真要兜底的时候，界面上才出现「账本格式对不上」。本地加载时抓到的。
 *
 * 每一代我读的字段都在（v6 只加了 `mode` / `runCount`，那两处已经按「可能没有」
 * 写了），所以认下这几代是安全的。**不认的一律降级，不猜字段。**
 */
const KNOWN_SCHEMA_VERSIONS = [2, 3, 4, 5, 6] as const

/** 账本相对 DSH 数据根的路径（看板自己的私有文件）。 */
const LEDGER_RELATIVE_PATH = join('task-board', 'ledger-v2.json')

export const HEALTH_PATH = '/api/dsh-plugin-task-board/health'
export const LEDGER_PATH = '/api/dsh-plugin-task-board/ledger'
export const ENRICH_PATH = '/api/dsh-plugin-task-board/enrich'
export const OVERRIDES_PATH = '/api/dsh-plugin-task-board/overrides'
export const WRITE_PATH = '/api/dsh-plugin-task-board/task'
export const SESSION_FACTS_PATH = '/api/dsh-plugin-task-board/session-facts'
export const SESSION_ARCHIVE_PATH = '/api/dsh-plugin-task-board/session-archive'
export const TASKS_PATH = '/api/dsh-plugin-task-board/tasks'
export const TASKS_EVENTS_PATH = '/api/dsh-plugin-task-board/tasks/events'

/**
 * 插件自己的目录名，在 `$DSH_HOME` 下面。
 * 跟看板那个 `task-board/` 并列，**不往里塞任何东西**——那是人家的目录。
 */
const OWN_DIR = 'dsh-plugin-task-board'
const OVERRIDES_FILE = 'enrichment.json'
/** 任务本体。规划视图自己的引擎读写它（见 `engine/engine.ts`）。 */
const TASKS_FILE = 'tasks.json'
const OVERRIDES_SCHEMA = 1
/**
 * 会话归档。**只能存在我们自己这儿。**
 *
 * 任务看板的账本里没有会话这种东西——会话是宿主的，账本只管卡。所以「这个会话
 * 我收工了」这句话没有别人能替我们存。卡走账本的 `archivedAt`（能被看板自己的
 * archive view 看见、能恢复），会话走这个文件，**两边不是一套存储**。
 */
const SESSION_ARCHIVE_FILE = 'sessions.json'
const SESSION_ARCHIVE_SCHEMA = 1

/**
 * 归纳结果的缓存和人工改动，存在**插件自己的文件**里。
 *
 * 为什么不写回账本的 `integrations`：写账本要走看板的写入契约，而这个包是
 * 纯只读的（见文件头那两条边界）。只读的插件偷偷改人家的账本，是那种
 * 出问题之后完全说不清的事。等真要做写入路径了再迁过去。
 */
interface OverrideEntry {
  goal?: string
  scenario?: string
  background?: string
  acceptanceDone?: string[]
  priority?: 'urgent' | 'high' | 'medium' | 'low'
}

interface Store {
  schemaVersion: number
  /** taskId → { 指纹, 模型给的, 什么时候给的, 用的哪个模型 } */
  cache: Record<string, { fingerprint: string; ai: AiIntent; at: number; model: string }>
  /** taskId → 人改过的。人改的永远压过模型。 */
  overrides: Record<string, OverrideEntry>
}

const emptyStore = (): Store => ({ schemaVersion: OVERRIDES_SCHEMA, cache: {}, overrides: {} })

async function readStore(path: string): Promise<Store> {
  let text: string
  try {
    text = await readFile(path, 'utf8')
  } catch {
    return emptyStore()
  }
  try {
    const parsed = JSON.parse(text) as Partial<Store>
    if (parsed.schemaVersion !== OVERRIDES_SCHEMA) return emptyStore()
    return {
      schemaVersion: OVERRIDES_SCHEMA,
      cache: typeof parsed.cache === 'object' && parsed.cache !== null ? parsed.cache : {},
      overrides: typeof parsed.overrides === 'object' && parsed.overrides !== null ? parsed.overrides : {},
    }
  } catch {
    // 文件坏了就当没有——这是缓存加一点人工输入，丢了能重建，不值得因此报错
    return emptyStore()
  }
}

async function writeStore(path: string, store: Store): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
}

/**
 * 素材指纹。**任务变了才重新问模型** —— 模型的调用是要花钱的，
 * 同一张卡每打开一次抽屉就问一遍，用户很快就再也不会点那个按钮了。
 */
function fingerprintOf(material: Material, model: string): string {
  return createHash('sha256').update(`${model}\u0000${renderMaterial(material)}`).digest('hex').slice(0, 16)
}

/** 收集一个 POST 请求的正文，带长度上限。 */
async function readBody(req: any): Promise<string> {
  const limit = 1 << 20
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > limit) throw new Error(`请求体超过 ${limit} 字节`)
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * DSH 数据根目录。优先用官方 `@deepseek-ai/dsh-home-paths`，拿不到就按同一套规则自己算：
 * `DSH_HOME` 优先（空/全空白视为未设置），否则 `~/.dsh`。
 *
 * 自己算的那条**不是**备份代码那么简单——隔离测试和桌面版会设自定义 DSH_HOME，
 * 直接拼 `homedir()/.dsh` 会读到错的账本，而且错得没有声音。
 */
function dshHome(): string {
  const env = process.env.DSH_HOME
  const raw = env !== undefined && env.trim().length > 0 ? env : pathResolve(homedir(), '.dsh')
  if (raw === '~') return homedir()
  if (raw.startsWith('~/') || raw.startsWith('~\\')) return pathResolve(homedir(), raw.slice(2))
  return pathResolve(raw)
}

function json(res: any, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(text)
}

/** 账本里我们真正用到的字段。别的照原样带着走，不解释也不丢。 */
function isTaskLike(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Record<string, unknown>
  return typeof t.id === 'string' && typeof t.title === 'string' && typeof t.status === 'string'
}

/**
 * 把每一处副作用都收起来，最后一起还回去。
 *
 * **这不是可选的。** cordis 用一个「epoch」判断插件该不该重跑：epoch 由被注入服务的
 * fiber uid 拼出来，**webserver 的 uid 一变（重启、配置改、换了个实例），
 * 这个插件就会先被整体卸载、再重新 apply 一遍**。卸载时它跑的是
 * `apply` 返回的那个函数（`_execute` 里写着：返回值是函数就 collect 成 disposer）。
 *
 * 早先这个函数返回 void —— 于是卸载时一个路由都没摘掉，重跑时
 * `webserver.register` 撞上自己上次留下的那条，报
 * 「duplicate exact route "/api/dsh-plugin-task-board/health"」，插件的启用直接失败。
 * 真出过（用户看到的「启用失败」）。
 */
type Keep = (dispose: unknown) => void

export function apply(ctx: HostContext): () => void {
  const disposers: Array<() => void> = []
  let disposed = false

  /**
   * 收一个 disposer。**同一个只跑一次**：注入回调里注册的东西会同时被
   * 我们和 cordis 的子 fiber 收集，摘两遍得是无害的，但没必要赌它无害。
   */
  const keep: Keep = (dispose) => {
    if (typeof dispose !== 'function') return
    let spent = false
    const once = (): void => {
      if (spent) return
      spent = true
      try {
        ;(dispose as () => void)()
      } catch {
        // 摘除阶段的异常不该把别的 disposer 也带走
      }
    }
    // 已经卸载完了才姗姗来迟的（注入回调晚到）：当场摘掉，不留着
    if (disposed) {
      once()
      return
    }
    disposers.push(once)
  }

  const webServer = ctx.webServer
  if (!webServer) {
    ctx.logger?.warn(`[${name}] ctx.webServer 不可用（headless profile？），跳过路由注册`)
    return () => {}
  }

  /**
   * 注册一条路由。**撞车时不炸。**
   *
   * 撞车只可能有一个来源：这个进程里还留着**我们自己上一辈子**注册的同名路由 ——
   * 那条是在「apply 还不返回卸载函数」的版本里留下的，而 webServer 没有 unregister，
   * 谁都摘不掉它。为这个让整个插件**激活失败**，是拿最差的结果去换一个本来不严重的
   * 问题：那条路由的 handler 还是我们自己的，功能照常。
   *
   * 所以撞了就记一条明确的告警、跳过这一条、继续装剩下的。别的错照旧抛出去
   * （真冲突、参数写错那些，不能让它们被吞掉）。
   */
  const route = (spec: WebServerRoute): void => {
    try {
      keep(webServer.register(spec))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/duplicate/i.test(message)) throw error
      ctx.logger?.warn(
        `[${name}] ${spec.path} 已经被占着 —— 多半是本进程里上一次留下的（旧版本没摘干净，` +
          `而 webServer 摘不掉别人的路由）。这一条先跳过，其余照常；重启 DSH 之后就恢复正常了。`,
      )
    }
  }

  /**
   * 装到一半炸了怎么办：**先把已经装上的摘干净，再把错抛出去**。
   *
   * 不摘的话，cordis 那次 collect 根本没发生（`_execute` 是 `const effect =
   * runner.execute(...)`，抛了就没有返回值可收），于是那几条留在 webserver 的表里 ——
   * 下一次重试撞上自己，再漏一次。失败一次就再也起不来了。
   */
  try {
    start(ctx, route, keep)
  } catch (error) {
    disposed = true
    for (const dispose of disposers.splice(0).reverse()) dispose()
    throw error
  }

  return () => {
    disposed = true
    for (const dispose of disposers.splice(0).reverse()) dispose()
  }
}

/** 真正去装的那一段。单独拎出来，是为了让上面那个 try 能把它整个罩住。 */
function start(ctx: HostContext, route: (spec: WebServerRoute) => void, keep: Keep): void {
  route({
    kind: 'exact',
    path: HEALTH_PATH,
    handler: (_req: any, res: any) => {
      json(res, 200, { plugin: name, version: PLUGIN_VERSION, ok: true })
    },
  })

  route({
    kind: 'exact',
    path: LEDGER_PATH,
    handler: async (_req: any, res: any) => {
      const path = join(dshHome(), LEDGER_RELATIVE_PATH)
      let text: string
      try {
        text = await readFile(path, 'utf8')
      } catch (err) {
        // 账本不存在是**正常状态**（看板没装过/没跑过），不是错误。前端按「不可用」画。
        json(res, 200, {
          ok: false,
          reason: 'ledger-missing',
          detail: String(err),
          path,
        })
        return
      }

      let parsed: any
      try {
        parsed = JSON.parse(text)
      } catch (err) {
        json(res, 200, { ok: false, reason: 'ledger-unreadable', detail: String(err), path })
        return
      }

      const schemaVersion = parsed?.schemaVersion
      const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks.filter(isTaskLike) : null
      const recognized = (KNOWN_SCHEMA_VERSIONS as readonly number[]).includes(schemaVersion)
      if (!recognized || tasks === null) {
        json(res, 200, {
          ok: false,
          reason: 'schema-mismatch',
          // 界面上要能说出「文件里是几、我们认得几」，所以两个都带回去。
          // 光给一个 expected 的话，文案只能写「格式对不上」——用户不知道该怪谁
          supported: [...KNOWN_SCHEMA_VERSIONS],
          actual: schemaVersion ?? null,
          path,
        })
        return
      }

      json(res, 200, {
        ok: true,
        schemaVersion,
        revision: typeof parsed.revision === 'number' ? parsed.revision : undefined,
        readAt: Date.now(),
        path,
        tasks,
      })
    },
  })

  const where = (): string => join(dshHome(), OWN_DIR, OVERRIDES_FILE)

  // 人工改动那两条路由**不需要模型**，所以注册在最外层：没装模型也能改、能存。
  route({
    kind: 'exact',
    path: OVERRIDES_PATH,
    handler: async (req: any, res: any) => {
      const path = where()
      if (req?.method !== 'POST') {
        const store = await readStore(path)
        json(res, 200, { ok: true, overrides: store.overrides, path })
        return
      }
      try {
        const body = JSON.parse(await readBody(req)) as { taskId?: unknown; override?: unknown }
        if (typeof body.taskId !== 'string' || body.taskId.length === 0) {
          json(res, 200, { ok: false, reason: 'bad-request', detail: 'taskId 是必填的' })
          return
        }
        const store = await readStore(path)
        const next = sanitizeOverride(body.override)
        if (Object.keys(next).length === 0) delete store.overrides[body.taskId]
        else store.overrides[body.taskId] = next
        await writeStore(path, store)
        json(res, 200, { ok: true, path })
      } catch (error) {
        json(res, 200, { ok: false, reason: 'write-failed', detail: String(error) })
      }
    },
  })

  /**
   * 宿主注入的模型服务。**可能永远不到**（这个部署就没有），所以它是可选的：
   * 下面用 `ctx.inject` 等它，等到了就记下来。
   */
  let llm: LlmFace | undefined
  if (typeof ctx.inject === 'function') {
    ctx.inject(['llm'], (scope: HostContext) => {
      llm = scope.llm ?? (scope.get?.('llm') as LlmFace | undefined)
    })
  } else {
    llm = ctx.llm
  }

  /**
   * 归纳那条路由。
   *
   * **它是无条件注册的**，哪怕模型服务永远不出现。这一点改过一次：
   * 早先把整条路由挂在 `ctx.inject(['llm'], ...)` 里面，没有模型的部署上
   * 那条路由根本不存在，浏览器拿到的是 404，于是报「宿主半体可能没装上」——
   * 一个完全指错方向的结论（半体装着呢，只是没有模型）。
   *
   * 注册路由和有没有模型是两件事：路由负责**把话说清楚**，
   * 模型在不在只决定它说什么。没有模型就答 `no-model` 并说明原因，
   * 界面上是「这个部署没有模型服务」，不是一个 404。
   */
  const registerEnrich = (scope: HostContext): void => {
    route({
      kind: 'exact',
      path: ENRICH_PATH,
      handler: async (req: any, res: any) => {
        const path = where()
        if (req?.method !== 'POST') {
          json(res, 200, { ok: false, reason: 'bad-request', detail: '这条路由只接 POST' })
          return
        }

        let body: { tasks?: unknown; model?: unknown; force?: unknown }
        try {
          body = JSON.parse(await readBody(req))
        } catch (error) {
          json(res, 200, { ok: false, reason: 'bad-request', detail: String(error) })
          return
        }

        const materials = Array.isArray(body.tasks) ? body.tasks.filter(isMaterialLike) : []
        if (materials.length === 0) {
          json(res, 200, { ok: false, reason: 'bad-request', detail: '没有可归纳的任务' })
          return
        }
        if (materials.length > 20) {
          json(res, 200, { ok: false, reason: 'bad-request', detail: '一次最多归纳 20 个任务' })
          return
        }

        if (llm === undefined || typeof llm.stream !== 'function') {
          json(res, 200, {
            ok: false,
            reason: 'no-model',
            detail: '这个部署没有提供模型服务（llm）。下面四条仍然按账本推出来，不受影响。',
          })
          return
        }

        const model = typeof body.model === 'string' ? body.model : ''
        const route = splitRoute(model)
        if (route === undefined) {
          json(res, 200, {
            ok: false,
            reason: 'no-model',
            detail: '没给模型路由。这个任务没有绑模型，先去任务看板给它选一个，或者在看板设置里挑一个默认模型。',
          })
          return
        }

        const store = await readStore(path)
        const force = body.force === true
        const results: Record<string, { ai: AiIntent; cached: boolean; at?: number }> = {}
        let changed = false
        // 第一个出错的原因。全部任务都失败时把它带回去当整体结论——
        // 只说「失败了」而不说为什么，用户没有任何办法自己解决。
        let firstError: EnrichError | undefined

        for (const material of materials) {
          const fingerprint = fingerprintOf(material, model)
          const hit = store.cache[material.id]
          if (!force && hit !== undefined && hit.fingerprint === fingerprint) {
            results[material.id] = { ai: hit.ai, cached: true, at: hit.at }
            continue
          }
          try {
            // 上面已经确认过 llm 在，这里断言一下类型
            const ai = await enrichOnce(llm as LlmFace, route, renderMaterial(material), undefined)
            store.cache[material.id] = { fingerprint, ai, at: Date.now(), model }
            changed = true
            results[material.id] = { ai, cached: false }
          } catch (error) {
            // 一个任务失败不该拖垮另外几个。这里记下原因、继续下一个，
            // 全部失败时下面再把第一个原因带回去当整体结论。
            if (error instanceof EnrichError) {
              results[material.id] = { ai: {}, cached: false }
              if (firstError === undefined) firstError = error
            } else throw error
          }
        }

        if (changed) {
          try {
            await writeStore(path, store)
          } catch {
            // 存不下只是下次还得再问一遍模型，不该把这一轮的结果丢掉
          }
        }

        const usable = Object.values(results).some(entry => Object.keys(entry.ai).length > 0)
        if (!usable && firstError !== undefined) {
          json(res, 200, {
            ok: false,
            reason: firstError.reason,
            detail: firstError.message,
            timeoutMs: ENRICH_TIMEOUT_MS,
          })
          return
        }
        json(res, 200, { ok: true, model, results, path })
      },
    })
  }

  // **无条件注册**，不等 llm。等的话，没有模型的部署上这条路由根本不存在，
  // 浏览器拿到的会是 404（「宿主半体没装上」），而不是「没有模型服务」。
  registerEnrich(ctx)

  registerEngine(ctx, route, keep)
}

/** 引擎可调的写操作。**动作名是白名单**，认不出就拒绝 —— 不能让前端以为成功了。 */
async function performWrite(engine: TaskEngine, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const op = body.op
  const object = (value: unknown, what: string): Record<string, unknown> => {
    if (typeof value !== 'object' || value === null) throw new Refusal(`${what}要带内容`)
    return value as Record<string, unknown>
  }
  switch (op) {
    case 'create': {
      const created = await engine.create(object(body.draft, '新建'))
      return { task: { id: created.id, title: created.title, status: created.status } }
    }
    case 'patch':
      await engine.patch(body.taskId, object(body.patch, '修改'))
      return { taskId: body.taskId }
    case 'status':
      await engine.setStatus(body.taskId, body.status)
      return { taskId: body.taskId, status: body.status }
    case 'archive':
    case 'restore':
      await engine.archive(body.taskId, op === 'archive')
      return { taskId: body.taskId }
    case 'targets':
      await engine.setTargets(body.taskId, object(body.targets, '执行目标'))
      return { taskId: body.taskId }
    case 'schedule':
      await engine.setSchedule(body.taskId, object(body.patch, '排期') as SchedulePatch)
      return { taskId: body.taskId }
    case 'run':
      return { taskId: body.taskId, ...(await engine.run(body.taskId)) }
    default:
      throw new Refusal(`认不出的操作「${String(op)}」`)
  }
}

/**
 * 宿主的斜杠命令（我们只用 `/permission`）。
 *
 * 宿主的 `commands.execute` 要的是**活的 Agent 对象**，不是会话 id：
 * `execute(agent, line, args, signal)`，结果在返回值的 `result` 上。刚建的会话已经在
 * `agents` 里；不在的（冷会话）交给 `sessionController.resolveAgent` 唤醒。
 */
function commandsOf(ctx: HostContext): CommandsFace | undefined {
  const commands = ctx.get?.('commands') as { execute?: (...args: unknown[]) => Promise<any> } | undefined
  if (typeof commands?.execute !== 'function') return undefined
  return {
    async execute(sessionId, line, signal) {
      const agents = ctx.get?.('agents') as { get?: (id: string) => unknown } | undefined
      let agent = agents?.get?.(sessionId)
      if (agent === undefined) {
        const controller = ctx.get?.('sessionController') as { resolveAgent?: (id: string) => Promise<any> } | undefined
        const resolved = await controller?.resolveAgent?.(sessionId)
        agent = resolved?.agent
        if (agent === undefined) throw new Error(`会话 ${sessionId} 拿不到活的 Agent${resolved?.error?.message ? `：${resolved.error.message}` : ''}`)
      }
      return (await commands.execute!(agent, line, [], signal))?.result
    },
  }
}

/**
 * 引擎和它的三条路由：读全量、推变化、写。
 *
 * 引擎本身不等网关就启动 —— 读写任务不需要会话；只有「开始」和盯进度要网关，
 * 网关没到时那两件事会明确拒绝或等着，不会让整个插件起不来。
 */
function registerEngine(
  ctx: HostContext,
  route: (spec: WebServerRoute) => void,
  keep: Keep,
): void {
  /**
   * 会话事件网关。**可能永远不到**（headless 部署、或者那一层还没起来），
   * 所以是可选的：路由无条件注册，拿不到就答 `no-gateway` 并说清，
   * **不能变成 404** —— 404 会被读成「插件没装上」，那是完全指错方向的结论。
   *
   * 拿到之后包一层 owner peer：0.2.1 起不带 peer 的调用一律被拒。
   */
  let gateway: GatewayFace | undefined
  let runner: Runner | undefined
  const owner = createOwnerPeer(ctx)
  keep(owner.dispose)
  const takeGateway = (scope: HostContext): void => {
    const found = (scope.get?.('typertGateway') ?? (scope as Record<string, unknown>).typertGateway) as RawGateway | undefined
    if (found === undefined || typeof found.invoke !== 'function') return
    const wrapped = withPeer(found, owner.peer)
    gateway = wrapped as GatewayFace
    runner = new Runner(
      wrapped,
      () => commandsOf(ctx),
      () => ctx.get?.('workspaceRegistry') as WorkspaceRegistryFace | undefined,
    )
  }
  if (typeof ctx.inject === 'function') ctx.inject(['typertGateway'], takeGateway)
  else takeGateway(ctx)

  const engine = new TaskEngine(
    join(dshHome(), OWN_DIR, TASKS_FILE),
    join(dshHome(), LEDGER_RELATIVE_PATH),
    () => runner,
    message => ctx.logger?.warn(`[${name}] ${message}`),
    message => ctx.logger?.info?.(`[${name}] ${message}`),
  )
  keep(() => engine.stop())
  /** 引擎起不来时的原因。界面拿它说清楚，而不是一直转圈。 */
  let failure: string | undefined
  let ready = false
  const started = engine.start().then(
    () => { ready = true },
    error => {
      failure = error instanceof Error ? error.message : String(error)
      ctx.logger?.warn(`[${name}] 任务引擎启动失败：${failure}`)
    },
  )

  route({
    kind: 'exact',
    path: TASKS_PATH,
    handler: async (_req: any, res: any) => {
      await started
      if (!ready) {
        json(res, 200, { ok: false, reason: 'engine-failed', detail: failure })
        return
      }
      json(res, 200, { ok: true, ...engine.snapshot(), gateway: runner !== undefined })
    },
  })

  /**
   * 推送。Server-Sent Events：连上先给一份全量，之后每改一次推一份全量。
   * 全量而不是增量：卡就几十张，全量最不容易出「前端和后端对不上」的毛病。
   */
  route({
    kind: 'exact',
    path: TASKS_EVENTS_PATH,
    handler: async (req: any, res: any) => {
      await started
      if (!ready) {
        json(res, 503, { ok: false, reason: 'engine-failed', detail: failure })
        return
      }
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-store',
        connection: 'keep-alive',
      })
      const send = (snapshot: EngineSnapshot): void => {
        res.write(`data: ${JSON.stringify({ ...snapshot, gateway: runner !== undefined })}\n\n`)
      }
      send(engine.snapshot())
      const unsubscribe = engine.subscribe(send)
      // 每 25 秒一个注释行，别让中间哪一层把空闲连接掐了
      const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000)
      const close = (): void => {
        clearInterval(heartbeat)
        unsubscribe()
      }
      req?.on?.('close', close)
      res?.on?.('close', close)
      keep(() => {
        close()
        try {
          res.end()
        } catch {
          // 连接已经断了
        }
      })
    },
  })

  route({
    kind: 'exact',
    path: WRITE_PATH,
    handler: async (req: any, res: any) => {
      await started
      // GET = 「能不能写」。界面靠这个决定写入口亮不亮
      if (req?.method !== 'POST') {
        json(res, 200, {
          ok: true,
          ready,
          gateway: runner !== undefined,
          ...(ready ? {} : { detail: `任务引擎没起来：${failure ?? '原因未知'}` }),
        })
        return
      }
      if (!ready) {
        json(res, 200, { ok: false, reason: 'engine-failed', detail: `任务引擎没起来：${failure ?? '原因未知'}` })
        return
      }
      let body: Record<string, unknown>
      try {
        body = JSON.parse(await readBody(req)) as Record<string, unknown>
      } catch (error) {
        json(res, 200, { ok: false, reason: 'bad-request', detail: String(error) })
        return
      }
      try {
        json(res, 200, { ok: true, ...(await performWrite(engine, body)) })
      } catch (error) {
        json(res, 200, {
          ok: false,
          reason: error instanceof Refusal ? 'refused' : 'write-failed',
          detail: error instanceof Error ? error.message : String(error),
        })
      }
    },
  })
  const factCache = new Map<string, { cursor: number; fact: SessionFact }>()

  route({
    kind: 'exact',
    path: SESSION_FACTS_PATH,
    handler: async (req: any, res: any) => {
      if (gateway === undefined) {
        json(res, 200, {
          ok: false,
          reason: 'no-gateway',
          detail: '这个部署里没有 typertGateway，读不了会话事件，所以判断不出每一轮是怎么结束的',
        })
        return
      }
      const ids = parseIds(new URL(req?.url ?? '/', 'http://localhost').searchParams.get('ids'))
      if (ids.length === 0) {
        json(res, 200, { ok: true, facts: {} })
        return
      }
      try {
        json(res, 200, { ok: true, facts: await readFacts(gateway, ids, factCache) })
      } catch (error) {
        json(res, 200, { ok: false, reason: 'read-failed', detail: String(error) })
      }
    },
  })

  const archivePath = (): string => join(dshHome(), OWN_DIR, SESSION_ARCHIVE_FILE)

  /**
   * 会话归档。GET 读、POST 改、`DELETE` 撤销。
   *
   * 这是**唯一**一处我们会写会话状态的地方 —— 因为「我收工了」这件事宿主管不着，
   * 也没别人管。写的东西只有「哪些会话被收起了、什么时候」，不碰会话本身。
   */
  route({
    kind: 'exact',
    path: SESSION_ARCHIVE_PATH,
    handler: async (req: any, res: any) => {
      const path = archivePath()
      if (req?.method !== 'POST') {
        const store = await readArchive(path)
        json(res, 200, { ok: true, archived: store.archived })
        return
      }
      let body: { sessionId?: unknown; archived?: unknown }
      try {
        body = JSON.parse(await readBody(req)) as { sessionId?: unknown; archived?: unknown }
      } catch (error) {
        json(res, 200, { ok: false, reason: 'bad-request', detail: String(error) })
        return
      }
      const sessionId = body.sessionId
      if (typeof sessionId !== 'string' || sessionId.length === 0 || sessionId.length > 200) {
        json(res, 200, { ok: false, reason: 'bad-request', detail: 'sessionId 是必填的' })
        return
      }
      try {
        const store = await readArchive(path)
        if (body.archived === false) delete store.archived[sessionId]
        else store.archived[sessionId] = Date.now()
        await writeArchive(path, store)
        json(res, 200, { ok: true, archived: store.archived })
      } catch (error) {
        json(res, 200, { ok: false, reason: 'write-failed', detail: String(error) })
      }
    },
  })
}

/** 会话 id 表。前端按逗号传；认不出的整条丢掉，不做「猜一个」。 */
export function parseIds(raw: string | null): string[] {
  if (raw === null || raw.length === 0) return []
  return [...new Set(raw.split(',').map(part => part.trim()).filter(part => part.length > 0 && part.length <= 200))].slice(0, 500)
}

interface ArchiveStore {
  schemaVersion: number
  archived: Record<string, number>
}

async function readArchive(path: string): Promise<ArchiveStore> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as Partial<ArchiveStore>
    if (parsed.schemaVersion !== SESSION_ARCHIVE_SCHEMA) return { schemaVersion: SESSION_ARCHIVE_SCHEMA, archived: {} }
    const archived: Record<string, number> = {}
    for (const [id, at] of Object.entries(parsed.archived ?? {})) {
      if (typeof at === 'number' && Number.isFinite(at)) archived[id] = at
    }
    return { schemaVersion: SESSION_ARCHIVE_SCHEMA, archived }
  } catch {
    // 文件不在、坏了、格式不对：都当「一个都没归档」。丢的是「我收起过」这个标记，
    // 会话本身一根毛都没动 —— 所以不值得因此报错。
    return { schemaVersion: SESSION_ARCHIVE_SCHEMA, archived: {} }
  }
}

async function writeArchive(path: string, store: ArchiveStore): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
}

/** 只收我们认得的形状。模型的入参来自浏览器，是外部输入。 */
function isMaterialLike(value: unknown): value is Material {
  if (typeof value !== 'object' || value === null) return false
  const m = value as Record<string, unknown>
  return typeof m.id === 'string' && typeof m.title === 'string'
}

/**
 * 人工改的那份也要过一遍。浏览器发上来的东西**不能直接落盘** ——
 * 这份文件下次会被原样读回来，写进去一个几兆的字符串就是自己给自己下毒。
 */
function sanitizeOverride(value: unknown): OverrideEntry {
  if (typeof value !== 'object' || value === null) return {}
  const raw = value as Record<string, unknown>
  const out: OverrideEntry = {}
  const text = (input: unknown, limit: number): string | undefined =>
    typeof input === 'string' && input.trim().length > 0 ? input.trim().slice(0, limit) : undefined

  const goal = text(raw.goal, 400)
  if (goal !== undefined) out.goal = goal
  const scenario = text(raw.scenario, 400)
  if (scenario !== undefined) out.scenario = scenario
  const background = text(raw.background, 1000)
  if (background !== undefined) out.background = background
  if (Array.isArray(raw.acceptanceDone)) {
    out.acceptanceDone = raw.acceptanceDone.filter((id): id is string => typeof id === 'string').slice(0, 20)
  }
  if (raw.priority === 'urgent' || raw.priority === 'high' || raw.priority === 'medium' || raw.priority === 'low') {
    out.priority = raw.priority
  }
  return out
}
