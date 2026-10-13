/**
 * dsh-plugin-task-board · 宿主半体（薄）。
 *
 * 它只做一件事：**在浏览器半体拿不到任务看板的客户端服务时，把账本读给它看**。
 *
 * 为什么需要：本插件的首选数据源是任务看板自己的客户端 face
 * （`resolveTaskBoardClientFace(ctx)` → `snapshot()` / `subscribe()`）。那条路
 * 只在看板活着时成立，而看板是**另一个第三方插件**——它会掉出 `dsh.profile.bundles`
 * （本机就掉过一次）。掉了之后浏览器半体读不到任何数据，页面只能空着。
 *
 * 所以这里读一份账本快照当兜底：`$DSH_HOME/task-board/ledger-v2.json`。**只读**，
 * 不写、不锁、不动别人的文件。
 *
 * 两条刻意划下的边界：
 *   1. **只读**。这个插件第一版是只读分析层，写只能走看板的公开契约
 *      （`taskBoard.registerExtension` 那条路），绝不直接改别人的账本。
 *   2. **schemaVersion 不符就明说**。账本是别人插件的私有文件，格式随对方版本漂移；
 *      版本对不上时返回 `degraded` 而不是硬猜字段——猜错出来的图比空白更糟。
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
  logger?: { warn(message: string): void }
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

/**
 * 插件自己的目录名，在 `$DSH_HOME` 下面。
 * 跟看板那个 `task-board/` 并列，**不往里塞任何东西**——那是人家的目录。
 */
const OWN_DIR = 'dsh-plugin-task-board'
const OVERRIDES_FILE = 'enrichment.json'
const OVERRIDES_SCHEMA = 1

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

  registerWriteRoute(ctx, route, keep)
}

/**
 * 任务看板的**宿主半体**提供的服务名。和它浏览器半体那个同名，但两个进程里
 * 是两回事：这边的面只有 `registerExtension` 和 `isExtensionEnabled`。
 */
const BOARD_SERVICE = 'taskBoard'

/** 我们作为一个扩展注册上去的 id。也是 `integrations` 里那份数据的键。 */
export const EXTENSION_ID = name

/** 看板自己声明的扩展契约版本。对不上它会**抛错**，不是降级。 */
const EXTENSION_API_VERSION = 1

/** 看板交给扩展的那把能力面。只写我们真正用到的三个方法。 */
interface BoardTasksFace {
  create(draft: Record<string, unknown>, options?: Record<string, unknown>): { id: string; title: string; status: string }
  patchContent(taskId: string, patch: Record<string, unknown>): void
  setStatus(taskId: string, status: string, initiator?: string): void
}

interface BoardFace {
  registerExtension(extension: Record<string, unknown>): () => void
}

/**
 * 写操作。
 *
 * ## 为什么绕这一圈，不直接改账本文件
 *
 * 账本是任务看板的私有文件。第三方插件直接往里写，绕过的是看板**自己的**
 * 两道闸：创建时的字段校验，和「已经跑过的卡不许改内容」这条规矩
 * （`patchContent` 的注释原话：a task that has started executing keeps its
 * recorded title/description/prompt）。绕过去写，出来的是一份看板自己都读不懂
 * 的账本——而且是在它下次启动时才炸。
 *
 * 所以走它给的口子：`ctx.get('taskBoard').registerExtension(...)`，
 * 拿到 `host.tasks`，所有写都经过它的闸。
 *
 * ## 三个必须说清的边界
 *
 * 1. **看板不在场就没有写**。它的宿主半体没加载时这条路由怎么都不通，
 *    界面上的写入口一律禁用并说明原因 —— 不做「点了才拒绝」。
 * 2. **一次只做一件事**。没有批量写、没有事务。看板那边每次调用都是一个完整的
 *    校验加落盘，我们不在中间插自己的逻辑。
 * 3. **扩展注册是可选的**：`ctx.inject([BOARD_SERVICE], ...)` 等到它出现才注册。
 *    看板晚加载也能接上，永远不加载就永远没有写入口。
 */
function registerWriteRoute(
  ctx: HostContext,
  route: (spec: WebServerRoute) => void,
  keep: Keep,
): void {
  /** 看板交出来的能力面；扩展没启动时是 undefined。 */
  let tasks: BoardTasksFace | undefined

  const attach = (scope: HostContext): void => {
    const board = (scope.get?.(BOARD_SERVICE) ?? (scope as { [k: string]: unknown })[BOARD_SERVICE]) as BoardFace | undefined
    if (board === undefined || typeof board.registerExtension !== 'function') return
    try {
      // 注册的返回值也要收着 —— 不收的话，卸载再启用会给同一个看板注册第二遍
      keep(board.registerExtension({
        id: EXTENSION_ID,
        apiVersion: EXTENSION_API_VERSION,
        // start/stop 是看板的开关控制的：它把扩展停掉之后，我们不持有失效的面
        start: (host: { tasks: BoardTasksFace }) => { tasks = host.tasks },
        stop: () => { tasks = undefined },
      }))
    } catch (error) {
      // 版本对不上时看板会抛。这是**真的出了问题**（我们和它不同版），要留痕
      ctx.logger?.warn(`[${name}] 注册扩展失败：${String(error)}`)
    }
  }

  if (typeof ctx.inject === 'function') ctx.inject([BOARD_SERVICE], attach)
  else attach(ctx)

  route({
    kind: 'exact',
    path: WRITE_PATH,
    handler: async (req: any, res: any) => {
      // GET = 「能不能写」。界面靠这个决定写入口是亮着还是禁用 ——
      // 不做「点了才拒绝」：一个能按但按下去只弹「不行」的按钮，比灰着更气人。
      if (req?.method !== 'POST') {
        json(res, 200, {
          ok: true,
          ready: tasks !== undefined,
          ...(tasks === undefined
            ? { detail: '任务看板的宿主半体没加载（或者它的扩展开关关着），所以没有写入口' }
            : {}),
        })
        return
      }

      let body: Record<string, unknown>
      try {
        body = JSON.parse(await readBody(req)) as Record<string, unknown>
      } catch (error) {
        json(res, 200, { ok: false, reason: 'bad-request', detail: String(error) })
        return
      }

      if (tasks === undefined) {
        json(res, 200, {
          ok: false,
          reason: 'board-absent',
          detail: '任务看板的宿主半体没加载（或者它的扩展开关关着），所以没有写入口。去任务看板里直接改。',
        })
        return
      }

      try {
        json(res, 200, { ok: true, ...performWrite(tasks, body) })
      } catch (error) {
        // 看板拒绝时抛的错**原样带回去**。它比我们清楚为什么不行
        // （标题为空、卡冻结了、跑过的卡不许改内容……），转述一遍只会丢信息。
        json(res, 200, {
          ok: false,
          reason: 'refused',
          detail: error instanceof Error ? error.message : String(error),
        })
      }
    },
  })
}

/**
 * 一次写。**动作名是白名单**：浏览器发上来的 op 认不出就拒绝，
 * 不做「当作没看见」——那样前端会以为成功了。
 */
function performWrite(tasks: BoardTasksFace, body: Record<string, unknown>): Record<string, unknown> {
  const op = body.op
  if (op === 'create') {
    const draft = body.draft
    if (typeof draft !== 'object' || draft === null) throw new Error('create 要带 draft')
    const created = tasks.create(draft as Record<string, unknown>)
    return { task: { id: created.id, title: created.title, status: created.status } }
  }

  const taskId = body.taskId
  if (typeof taskId !== 'string' || taskId.length === 0) throw new Error('这个动作要带 taskId')

  if (op === 'patch') {
    const patch = body.patch
    if (typeof patch !== 'object' || patch === null) throw new Error('patch 要带 patch')
    tasks.patchContent(taskId, patch as Record<string, unknown>)
    return { taskId }
  }

  if (op === 'status') {
    const status = body.status
    if (typeof status !== 'string') throw new Error('status 要带 status')
    tasks.setStatus(taskId, status)
    return { taskId, status }
  }

  throw new Error(`认不出的操作「${String(op)}」`)
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
