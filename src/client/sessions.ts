/**
 * 「没有任务卡的会话」也当成任务。
 *
 * ## 为什么
 *
 * 任务看板只管**账本里的卡**。可 DSH 里绝大多数的会话根本不挂卡 ——
 * 随手问一句、临时排查一个报错、在一个窗口里连着聊半天。这些窗口在三个视图里
 * 一条都不出现，于是「我到底开了些什么」这件事，恰恰在最需要它的那个插件里看不到。
 *
 * 所以这里把**宿主目录里的会话**读出来，投影成和账本卡同一种形状的行，混进
 * 同一份索引。三个视图不用知道它们的来历，照常画。
 *
 * ## 哪些会话算
 *
 * 全部减去三类：
 *   - **已经有卡的**：某张卡的执行记录里写着这个会话 id，那它已经以那张卡的身份
 *     出现过了。不去重的话同一件事会数两遍。
 *   - **空的**：`blank` 是宿主自己的判据 —— 「这一格还没有任何内容」。
 *     一个刚点开、什么都没发的草稿会话不是任务。
 *   - **子代理的**：`parentId` 有值、或者 `origin` 是 `subagent`。它们是某个会话
 *     内部派出去的分身，不是人开的窗口；而且它们归 `ui-subagent` 那棵树管。
 *
 * ## 状态怎么定
 *
 * 会话没有「已完成」这个概念，只有「在跑」和「停着」。所以映射是：
 * **在跑 → 进行中，其余的 → 待审阅**。
 *
 * 停着的那一类里混着「答完了」「聊到一半你去干别的了」「等你批准」，
 * 本插件分不出来 —— **那一层由颜色回答，不由位置回答**（见 `tone.ts`）。
 * 位置只说一件事：**这一格还没被你收走**。收走的方式只有一种，就是归档，
 * 而归档只能由人来做。
 *
 * ## 只读（除了归档）
 *
 * 这些行**没有账本**，所以：不能编辑、没有执行记录、没有排期。
 * 界面上把该灰的都灰掉，而不是让人点了才发现不行。
 * **唯一的例外是归档** —— 那句话没有别人能替我们存，所以它写在本插件自己的
 * 文件里（`$DSH_HOME/dsh-plugin-task-board/sessions.json`）。
 */
import { useEffect, useState } from 'react'
import type { TaskRecord } from './types'
import type { WorkspaceIndex } from './workspaces'

/** 宿主会话目录里的一行，只抄我们真正读的字段。 */
export interface SessionRow {
  id: string
  /** 宿主自己算好的显示名（没起过名字时是「没标题的会话」之类）。 */
  displayTitle: string
  running: boolean
  /** 最后活动时刻。没有更好的时间可用，它同时充当「创建」和「结算」。 */
  updatedAt: number
  cwd?: string
}

/**
 * 整个会话目录，**含子代理**。
 *
 * 跟 `rows` 分开是有原因的：上板子的只有人开的窗口，但**判断「谁下面压着东西」
 * 必须看全部**——子代理卡住了，看得见它的地方只有它爸。
 */
export interface SessionCatalog {
  /** 上板子的那些：人开的、有内容的。 */
  rows: SessionRow[]
  /** 全部会话的最后活动时刻（含子代理），用来决定要不要重新问事实。 */
  updatedAt: ReadonlyMap<string, number>
  /** 子 → 父。用来把「卡住」一层层往上冒泡。 */
  parents: ReadonlyMap<string, string>
  /** 全部会话 id（含子代理）。 */
  ids: string[]
}

/** 会话行投影成任务行时用的 id 前缀 —— 跟账本 id 不可能撞。 */
export const SESSION_ID_PREFIX = 'session:'

/**
 * 读宿主会话目录。
 *
 * 服务不在场（换了外壳组合）时返回空数组，**不是错误**：这一层的存在与否
 * 不该让页面空掉。宿主还没读完（`phase === 'pending'`）时也返回空，
 * 等它自己推下一帧过来。
 */
export function useSessionCatalog(ctx: any): SessionCatalog {
  const [catalog, setCatalog] = useState<SessionCatalog>(EMPTY_CATALOG)

  useEffect(() => {
    const store = safeGet(ctx, 'sessions')?.list
    if (store === undefined || typeof store.getSnapshot !== 'function') return

    let alive = true
    /**
     * 上一份。**一模一样就不换新对象。**
     *
     * 下游全是 `useMemo` 依赖着返回值，每次都换新的等于每次渲染把所有索引
     * 重算一遍——会话这个目录每一帧都可能推过来（`subscribe` 没有参数，
     * 分不出「哪变了」），不在这里挡一道就是白烧。
     */
    let previous: SessionCatalog | undefined
    const read = (): void => {
      if (!alive) return
      const next = catalogOf(store.getSnapshot())
      if (previous !== undefined && sameCatalog(previous, next)) return
      previous = next
      setCatalog(next)
    }
    read()
    const off = typeof store.subscribe === 'function' ? store.subscribe(read) : undefined
    return () => {
      alive = false
      off?.()
    }
  }, [ctx])

  return catalog
}

const EMPTY_CATALOG: SessionCatalog = { rows: [], updatedAt: new Map(), parents: new Map(), ids: [] }

/** 快照 → 目录。认不出的整条跳过，不猜。 */
export function catalogOf(snapshot: any): SessionCatalog {
  const byId = snapshot?.byId
  if (byId === null || typeof byId !== 'object') return EMPTY_CATALOG
  const rows: SessionRow[] = []
  const updatedAt = new Map<string, number>()
  const parents = new Map<string, string>()
  const ids: string[] = []
  for (const value of Object.values(byId) as any[]) {
    if (value === null || typeof value !== 'object') continue
    if (typeof value.id !== 'string' || value.id.length === 0) continue
    const id: string = value.id
    const at = typeof value.updatedAt === 'number' ? value.updatedAt : 0
    ids.push(id)
    updatedAt.set(id, at)
    // 子 → 父。**父可能是我们从来没见过的会话**（被清掉过），照样记下来：
    // 冒泡时找不到它就自然停在那一层，不需要先判断它存不存在
    if (typeof value.parentId === 'string' && value.parentId.length > 0) parents.set(id, value.parentId)
    else if (value.origin === 'subagent' && typeof value.parentSessionId === 'string') parents.set(id, value.parentSessionId)

    // 上板子的只有人开的窗口：空的、子代理都不上
    if (value.blank === true) continue
    if (parents.has(id)) continue
    if (value.origin === 'subagent') continue
    rows.push({
      id,
      displayTitle: typeof value.displayTitle === 'string' && value.displayTitle.length > 0
        ? value.displayTitle
        : id,
      running: value.running === true,
      updatedAt: at,
      ...(typeof value.cwd === 'string' && value.cwd.length > 0 ? { cwd: value.cwd } : {}),
    })
  }
  // 新在前。三个视图都会再排一次，但先把顺序定下来，免得同一份数据两个视图两种顺序
  rows.sort((a, b) => b.updatedAt - a.updatedAt)
  ids.sort()
  return { rows, updatedAt, parents, ids }
}

/** 两份目录是不是说的是同一件事。挡的是「宿主推了一帧但其实没变」。 */
function sameCatalog(left: SessionCatalog, right: SessionCatalog): boolean {
  if (left.rows.length !== right.rows.length) return false
  if (left.updatedAt.size !== right.updatedAt.size) return false
  for (let index = 0; index < left.rows.length; index += 1) {
    const a = left.rows[index]
    const b = right.rows[index]
    if (a.id !== b.id || a.running !== b.running || a.updatedAt !== b.updatedAt || a.displayTitle !== b.displayTitle) return false
  }
  for (const [id, at] of left.updatedAt) if (right.updatedAt.get(id) !== at) return false
  return true
}

/**
 * 会话行 → 任务行。
 *
 * @param rows - 会话目录。
 * @param taken - 已经被某张卡的执行记录占用的会话 id。**用全部任务算**，含归档的 ——
 *   一张归档卡占着的会话照样不该再单列一份。
 * @param workspaces - 用来把会话的 `cwd` 对回工作区 id。
 */
export function tasksFromSessions(
  rows: readonly SessionRow[],
  taken: ReadonlySet<string>,
  workspaces: WorkspaceIndex,
  archives: ReadonlyMap<string, number>,
  pending: ReadonlyMap<string, string> = new Map(),
): TaskRecord[] {
  const out: TaskRecord[] = []
  for (const row of rows) {
    if (taken.has(row.id)) continue
    const workspaceId = row.cwd === undefined ? undefined : workspaces.idOfPath(row.cwd)
    const archivedAt = archives.get(row.id)
    out.push({
      id: `${SESSION_ID_PREFIX}${row.id}`,
      title: row.displayTitle,
      description: '',
      prompt: '',
      /**
       * 归列：**有东西在等的落「待审阅」**，在跑的落「进行中」，其余也落「待审阅」。
       *
       * 这里改过两次。
       *
       * 最早停着的会话直接算「已完成」，等于替用户宣布「这个窗口聊完了」——
       * 可宿主根本不知道这件事，我们也一样：一个聊到一半走开的会话和一个真正
       * 收工的会话，在数据上长得一模一样。所以口径改成「**没归档的一切都还没
       * 收工**」，收工只能由人说了算。
       *
       * 第二次是「在等」压过「在跑」：一个弹着权限申请的会话，宿主的 `running`
       * 多半还是 true（那一轮没结束，只是停在那儿等你），照 `running` 归列的话
       * 它会待在「进行中」里 —— 而它恰恰是那一列里唯一需要你动手的东西。
       * 用户的原话是「卡住了的……移动到待审阅」。
       */
      status: row.running && !pending.has(row.id) ? 'running' : 'done',
      // 会话没有「创建时刻」这一说，只有最后活动。两个都填它，甘特的条就落在
      // 「最后一次动它」那一刻上，分组也落在同一天 —— 跟卡片上写的是一个时刻。
      createdAt: row.updatedAt,
      updatedAt: row.updatedAt,
      executions: [],
      fromSession: row.id,
      // 会话的归档**没有账本**，`archivedAt` 在这儿装的是我们自己那份记录。
      // 卡片的同名字段来自看板账本，两边不是一套存储（见 index.ts 里那段）。
      ...(archivedAt === undefined ? {} : { archivedAt }),
      ...(workspaceId === undefined ? {} : { workspaceId }),
    })
  }
  return out
}

/** 所有任务（含归档）执行记录里出现过的会话 id。 */
export function takenSessionIds(tasks: readonly TaskRecord[]): Set<string> {
  const out = new Set<string>()
  for (const task of tasks) {
    for (const execution of task.executions) {
      if (execution.sessionId !== undefined) out.add(execution.sessionId)
    }
  }
  return out
}

/** 调 `ctx.get` 但绝不让它把渲染带下去 —— 拿不到服务是常态，不是异常。 */
function safeGet(ctx: any, name: string): any {
  try {
    return ctx?.get?.(name)
  } catch {
    return undefined
  }
}
