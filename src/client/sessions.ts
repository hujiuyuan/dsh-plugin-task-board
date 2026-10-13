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
 * 会话没有「已完成」这个概念，只有「在跑」和「停着」。映射是定过的：
 * **在跑 → 进行中，停着 → 已完成**。停着的那一类里混着「答完了」和「聊到一半
 * 你去干别的了」，本插件分不出来，也不假装分得出来 —— 卡片上的「会话」角标
 * 就是这句话的落点：它按会话的规矩算，不按卡的规矩算。
 *
 * ## 只读
 *
 * 这些行**没有账本**，所以：不能拖、不能编辑、没有执行记录、没有排期。
 * 界面上把该灰的都灰掉，而不是让人点了才发现不行。
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

/** 会话行投影成任务行时用的 id 前缀 —— 跟账本 id 不可能撞。 */
export const SESSION_ID_PREFIX = 'session:'

/**
 * 读宿主会话目录。
 *
 * 服务不在场（换了外壳组合）时返回空数组，**不是错误**：这一层的存在与否
 * 不该让页面空掉。宿主还没读完（`phase === 'pending'`）时也返回空，
 * 等它自己推下一帧过来。
 */
export function useSessionRows(ctx: any): SessionRow[] {
  const [rows, setRows] = useState<SessionRow[]>([])

  useEffect(() => {
    const store = safeGet(ctx, 'sessions')?.list
    if (store === undefined || typeof store.getSnapshot !== 'function') return

    let alive = true
    const read = (): void => {
      if (!alive) return
      const snapshot = store.getSnapshot()
      setRows(rowsOf(snapshot))
    }
    read()
    const off = typeof store.subscribe === 'function' ? store.subscribe(read) : undefined
    return () => {
      alive = false
      off?.()
    }
  }, [ctx])

  return rows
}

/** 快照 → 行。认不出的整条跳过，不猜。 */
function rowsOf(snapshot: any): SessionRow[] {
  const byId = snapshot?.byId
  if (byId === null || typeof byId !== 'object') return []
  const out: SessionRow[] = []
  for (const value of Object.values(byId) as any[]) {
    if (value === null || typeof value !== 'object') continue
    if (typeof value.id !== 'string' || value.id.length === 0) continue
    if (value.blank === true) continue
    if (value.parentId !== undefined || value.origin === 'subagent') continue
    out.push({
      id: value.id,
      displayTitle: typeof value.displayTitle === 'string' && value.displayTitle.length > 0
        ? value.displayTitle
        : value.id,
      running: value.running === true,
      updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
      ...(typeof value.cwd === 'string' && value.cwd.length > 0 ? { cwd: value.cwd } : {}),
    })
  }
  // 新在前。三个视图都会再排一次，但先把顺序定下来，免得同一份数据两个视图两种顺序
  out.sort((a, b) => b.updatedAt - a.updatedAt)
  return out
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
): TaskRecord[] {
  const out: TaskRecord[] = []
  for (const row of rows) {
    if (taken.has(row.id)) continue
    const workspaceId = row.cwd === undefined ? undefined : workspaces.idOfPath(row.cwd)
    out.push({
      id: `${SESSION_ID_PREFIX}${row.id}`,
      title: row.displayTitle,
      description: '',
      prompt: '',
      // 定过的映射：在跑 → 进行中，停着 → 已完成
      status: row.running ? 'running' : 'done',
      // 会话没有「创建时刻」这一说，只有最后活动。两个都填它，甘特的条就落在
      // 「最后一次动它」那一刻上，分组也落在同一天 —— 跟卡片上写的是一个时刻。
      createdAt: row.updatedAt,
      updatedAt: row.updatedAt,
      executions: [],
      fromSession: row.id,
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
