/**
 * 三个视图共用的推导层：纯函数，没有 React，没有 IO。
 *
 * 分开写的理由是三个视图问的是**同一批问题**的不同侧面（这个任务在哪个列、它下面有几个
 * 子任务、它最后一次跑是什么时候），三个地方各算一遍迟早会算出三个不同的答案。
 */
import type { ExecutionRecord, TaskRecord, TaskStatus } from './types'

/** 主任务 + 按创建时间排好的直接子任务。 */
export interface TaskIndex {
  /** 上板的任务：没归档、没被隐藏。 */
  onBoard: TaskRecord[]
  /** 所有任务，含归档的（抽屉里要能看到）。 */
  all: TaskRecord[]
  byId: Map<string, TaskRecord>
  /** parentId → 直接子任务（按创建时间升序）。 */
  childrenOf: Map<string, TaskRecord[]>
  /** 只要主任务，按创建时间升序。 */
  roots: TaskRecord[]
}

/**
 * 建索引。**一次遍历建完**——任务数不大，但三个视图各自 filter 一遍会得到
 * 三份顺序不一致的数组，卡片会跳。
 */
export function buildIndex(tasks: readonly TaskRecord[]): TaskIndex {
  const all = tasks.slice()
  const byId = new Map<string, TaskRecord>()
  for (const task of all) byId.set(task.id, task)

  const childrenOf = new Map<string, TaskRecord[]>()
  for (const task of all) {
    if (task.parentId === undefined) continue
    const bucket = childrenOf.get(task.parentId)
    if (bucket === undefined) childrenOf.set(task.parentId, [task])
    else bucket.push(task)
  }
  for (const bucket of childrenOf.values()) bucket.sort(byCreatedAsc)

  const onBoard = all.filter(isOnBoard)
  const roots = onBoard.filter(task => task.parentId === undefined || !byId.has(task.parentId))
  roots.sort(byCreatedAsc)

  return { onBoard, all, byId, childrenOf, roots }
}

/** 归档的和被 provider 隐藏的都不上板。 */
export function isOnBoard(task: TaskRecord): boolean {
  return task.archivedAt === undefined && task.hidden !== true
}

function byCreatedAsc(a: TaskRecord, b: TaskRecord): number {
  return a.createdAt - b.createdAt
}

/** 一个任务连它全部后代，深度优先。 */
export function subtreeOf(index: TaskIndex, root: TaskRecord): TaskRecord[] {
  const out: TaskRecord[] = []
  const walk = (task: TaskRecord): void => {
    out.push(task)
    for (const child of index.childrenOf.get(task.id) ?? []) walk(child)
  }
  walk(root)
  return out
}

/** 子任务汇总：一共几个、各个状态各几个。 */
export interface Rollup {
  total: number
  byStatus: Record<TaskStatus, number>
  /** 全部子任务（含孙任务）里的执行次数。 */
  runs: number
}

export function rollupOf(index: TaskIndex, root: TaskRecord): Rollup {
  const subtree = subtreeOf(index, root)
  const byStatus: Record<TaskStatus, number> = { backlog: 0, todo: 0, running: 0, done: 0, failed: 0 }
  let runs = 0
  // 从第 1 个开始：subtreeOf 的第 0 个是 root 自己，不算子任务
  for (let i = 1; i < subtree.length; i += 1) {
    byStatus[subtree[i].status] += 1
    runs += subtree[i].executions.length
  }
  return { total: subtree.length - 1, byStatus, runs }
}

/** 最后一次执行（按开始时间取最后一个）。 */
export function lastExecution(task: TaskRecord): ExecutionRecord | undefined {
  return task.executions.length === 0 ? undefined : task.executions[task.executions.length - 1]
}

/** 这个任务此刻是不是有人在跑。 */
export function isRunning(task: TaskRecord): boolean {
  const last = lastExecution(task)
  return last !== undefined && last.endedAt === undefined
}

/**
 * 一个任务的「时间跨度」右端，甘特条形画到哪。
 *
 * 取**全部执行里最晚的结束时间**，而不只是最后一次执行——因为复用会话（reuseSession）
 * 的第二次执行有可能比第一次早结束，只看最后一次会让条形往回缩。
 * 还在跑的返回 `now`，条形会一直长到当前时刻。
 */
export function spanEnd(task: TaskRecord, now: number): number {
  let end = task.createdAt
  for (const execution of task.executions) {
    const stop = execution.endedAt ?? now
    if (stop > end) end = stop
  }
  return end
}

/** 整个任务树里最晚的活动时刻，供甘特决定窗口右端。 */
export function latestActivity(tasks: readonly TaskRecord[], now: number): number {
  let end = 0
  for (const task of tasks) {
    const stop = spanEnd(task, now)
    if (stop > end) end = stop
  }
  return end
}

/** 一次执行的触发方式。 */
export type Trigger = 'schedule' | 'manual'

/**
 * 这次执行是定时跑的还是人点的。
 *
 * 判据是 `initiatedBy` 缺不缺——看板源码在 `ExecutionRecord.initiatedBy` 上写得很清楚：
 * 「cron 触发时不存在（来源未知）」。所以没有 `initiatedBy` 就是定时。这是**推断**不是
 * 声明，界面上会标成「定时（按来源推断）」，不假装是确切事实。
 */
export function triggerOf(execution: ExecutionRecord): Trigger {
  return execution.initiatedBy === undefined ? 'schedule' : 'manual'
}

/** 一次执行的结局文案。 */
export function outcomeLabel(execution: ExecutionRecord): string {
  if (execution.endedAt === undefined) return '进行中'
  switch (execution.result) {
    case 'succeeded':
      return '成功'
    case 'failed':
      return '失败'
    case 'cancelled':
      return '已取消'
    default:
      return '已结束'
  }
}

/** 一次执行实际跑了多久（毫秒）；还在跑的算到此刻。 */
export function durationOf(execution: ExecutionRecord, now: number): number {
  return (execution.endedAt ?? now) - execution.startedAt
}

/** 秒/分/小时/天的口语化时长。 */
export function humanDuration(ms: number): string {
  if (ms < 0) return '—'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec} 秒`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} 分钟`
  const hour = Math.floor(min / 60)
  const rest = min % 60
  if (hour < 24) return rest === 0 ? `${hour} 小时` : `${hour} 小时 ${rest} 分`
  const day = Math.floor(hour / 24)
  const restHour = hour % 24
  return restHour === 0 ? `${day} 天` : `${day} 天 ${restHour} 小时`
}

/** 把一批任务按状态分到五列。 */
export function columnsOf(tasks: readonly TaskRecord[]): Record<TaskStatus, TaskRecord[]> {
  const out: Record<TaskStatus, TaskRecord[]> = { backlog: [], todo: [], running: [], done: [], failed: [] }
  for (const task of tasks) out[task.status].push(task)
  return out
}

/** `YYYY-MM-DD`，本地时区。按天分组时用它当 key。 */
export function dayKey(ms: number): string {
  const date = new Date(ms)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** 一组按天分好的任务，新的在前。 */
export interface DayGroup {
  key: string
  items: TaskRecord[]
  /** 这一天是周末——周末那几组默认收着。 */
  weekend: boolean
}

/**
 * 把「已完成 / 已失败」那两列按天分组。
 *
 * 分的是**最后活动的那一天**（`updatedAt`）而不是创建时间：一个三个月前建、
 * 今天才跑完的任务出现在「三个月前」那一组里没有任何用处。
 */
export function groupByDay(tasks: readonly TaskRecord[]): DayGroup[] {
  const buckets = new Map<string, TaskRecord[]>()
  for (const task of tasks) {
    const key = dayKey(task.updatedAt)
    const bucket = buckets.get(key)
    if (bucket === undefined) buckets.set(key, [task])
    else bucket.push(task)
  }
  return [...buckets.entries()]
    .map(([key, items]) => {
      items.sort((a, b) => b.updatedAt - a.updatedAt)
      const weekday = new Date(`${key}T12:00:00`).getDay()
      return { key, items, weekend: weekday === 0 || weekday === 6 }
    })
    .sort((a, b) => (a.key < b.key ? 1 : -1))
}

/** 日期的中文写法；跨年才带年份。 */
export function dayLabel(key: string, now: number): string {
  const date = new Date(`${key}T12:00:00`)
  const weekday = '日一二三四五六'[date.getDay()]
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  const base = `${date.getMonth() + 1} 月 ${date.getDate()} 日`
  return `${sameYear ? base : `${date.getFullYear()} 年 ${base}`} 周${weekday}`
}

/** 时间戳的短写法：今天只写时分，其余写月日时分。 */
export function shortTime(ms: number, now: number): string {
  const date = new Date(ms)
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  if (dayKey(ms) === dayKey(now)) return `${hh}:${mm}`
  if (date.getFullYear() === new Date(now).getFullYear()) {
    return `${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`
  }
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`
}

/** cron 里的 `*​/N` 写法：是不是「每 N 个单位」。 */
function every(count: string): number | undefined {
  const match = /^\*\/(\d+)$/.exec(count.trim())
  if (match === null) return undefined
  const value = Number(match[1])
  return value > 0 ? value : undefined
}

/**
 * cron 五段的口语化说法。认不出来的**原样返回**，不猜——
 * 显示一句编错的「每天 9 点」比直接显示 `0 9 * * *` 危险得多。
 */
export function humanCron(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return cron
  const [min, hour, dom, , dow] = parts

  const everyMin = every(min)
  const everyHour = every(hour)

  // 「每 N 分钟」「每 N 小时」是排期里最常见的两种，先认它们
  if (everyMin !== undefined && hour === '*') return everyMin === 1 ? '每分钟' : `每 ${everyMin} 分钟`
  if (everyHour !== undefined && dom === '*' && dow === '*') {
    const base = everyHour === 1 ? '每小时' : `每 ${everyHour} 小时`
    return min === '*' ? base : /^\d+$/.test(min) ? `${base}的第 ${min} 分` : base
  }

  if (min === '*' && hour === '*') return '每分钟'
  if (hour === '*' && /^\d+$/.test(min)) return `每小时的第 ${min} 分`
  if (/^\d+$/.test(min) && /^\d+$/.test(hour)) {
    const clock = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    if (dom === '*' && dow === '*') return `每天 ${clock}`
    if (dom !== '*' && dow === '*') return `每月 ${dom} 日 ${clock}`
    if (dom === '*' && dow !== '*') return `每周${'日一二三四五六'[Number(dow)] ?? `(${dow})`} ${clock}`
    return `${clock}（${cron}）`
  }
  return cron
}
