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

/** 账本里我们认得的 schemaVersion。不匹配就降级，不猜。 */
const KNOWN_SCHEMA_VERSION = 5

/** 账本相对 DSH 数据根的路径（看板自己的私有文件）。 */
const LEDGER_RELATIVE_PATH = join('task-board', 'ledger-v2.json')

export const HEALTH_PATH = '/api/dsh-plugin-task-board/health'
export const LEDGER_PATH = '/api/dsh-plugin-task-board/ledger'
export const ENRICH_PATH = '/api/dsh-plugin-task-board/enrich'
export const OVERRIDES_PATH = '/api/dsh-plugin-task-board/overrides'

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

export function apply(ctx: HostContext): void {
  const webServer = ctx.webServer
  if (!webServer) {
    ctx.logger?.warn(`[${name}] ctx.webServer 不可用（headless profile？），跳过路由注册`)
    return
  }

  webServer.register({
    kind: 'exact',
    path: HEALTH_PATH,
    handler: (_req: any, res: any) => {
      json(res, 200, { plugin: name, version: PLUGIN_VERSION, ok: true })
    },
  })

  webServer.register({
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
      if (schemaVersion !== KNOWN_SCHEMA_VERSION || tasks === null) {
        json(res, 200, {
          ok: false,
          reason: 'schema-mismatch',
          expected: KNOWN_SCHEMA_VERSION,
          actual: schemaVersion,
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
  webServer.register({
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
   * 归纳那条路由要模型，所以挂在 `ctx.inject(['llm'], ...)` 里面。
   *
   * 这么挂的用意是**降级而不是失败**：这个部署没有 llm 服务时，这一段整个不跑，
   * 但账本和人工改动那几条路由照常在。用户看到的是「AI 补全这个按钮不能用」，
   * 不是「整个插件坏了」。
   */
  const registerEnrich = (scope: HostContext): void => {
    scope.webServer?.register({
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

        const llm = scope.llm ?? (scope.get?.('llm') as LlmFace | undefined)
        if (llm === undefined || typeof llm.stream !== 'function') {
          json(res, 200, { ok: false, reason: 'no-model', detail: '这个部署没有提供模型服务（llm）' })
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
            const ai = await enrichOnce(llm, route, renderMaterial(material), undefined)
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

  if (typeof ctx.inject === 'function') ctx.inject(['llm'], registerEnrich)
  else registerEnrich(ctx)
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
