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
import { readFile } from 'node:fs/promises'
import { join, resolve as pathResolve } from 'node:path'
import { homedir } from 'node:os'

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
}

export const name = 'dsh-plugin-task-board'
export const inject = ['webServer']

/** 账本里我们认得的 schemaVersion。不匹配就降级，不猜。 */
const KNOWN_SCHEMA_VERSION = 5

/** 账本相对 DSH 数据根的路径（看板自己的私有文件）。 */
const LEDGER_RELATIVE_PATH = join('task-board', 'ledger-v2.json')

export const HEALTH_PATH = '/api/dsh-plugin-task-board/health'
export const LEDGER_PATH = '/api/dsh-plugin-task-board/ledger'

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
}
