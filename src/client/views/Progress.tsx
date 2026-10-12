/**
 * 进度视图：一眼扫过去的仪表盘。
 *
 * 这一页回答的不是「某个任务怎么样了」（那是看板和抽屉的事），而是
 * **「我这一摊子整体什么状态」**。所以三块，从上到下：
 *   ① 总览：环形图 + 按状态逐行 + 三个正交口径（定时 / 大任务 / 子任务）
 *   ② 本期跑动：本周和本月各跑了多少次、成功多少（**不随上面的日期范围变**）
 *   ③ 按工作区：一个工作区一张卡，环 + 堆叠条 + 百分比图例
 *
 * 宽度铺满整屏：这一页是拿来扫的，右半边空着比条子被拉长更糟。
 * 条子拉长之后靠**数字**认差别——每一行右边本来就写着条数和百分比。
 */
import { useMemo, useRef, useState } from 'react'
import { STATUS, STATUS_ORDER } from '../tokens'
import type { TaskIndex } from '../model'
import { dayKey, spanEnd } from '../model'
import type { TaskRecord } from '../types'
import type { WorkspaceIndex } from '../workspaces'
import { EmptyState, emptyTaskCopy } from './controls'

const DAY_MS = 86_400_000

interface ProgressProps {
  index: TaskIndex
  now: number
  workspaces: WorkspaceIndex
  onSelect: (task: TaskRecord) => void
  /** 数据来源。只影响「一条任务都没有」那句话。 */
  sourceKind: 'board' | 'ledger' | 'unavailable'
}

type Preset = 'week' | 'd7' | 'd30' | 'd90' | 'all'

const PRESETS: ReadonlyArray<{ id: Preset; label: string }> = [
  { id: 'week', label: '本周' },
  { id: 'd7', label: '近 7 天' },
  { id: 'd30', label: '近 30 天' },
  { id: 'd90', label: '近 90 天' },
  { id: 'all', label: '全部时间' },
]

const iso = (ms: number): string => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const startOfDay = (ms: number): number => new Date(ms).setHours(0, 0, 0, 0)
/** 周一为一周的开始（ISO 周）。 */
const startOfWeek = (ms: number): number => {
  const d = new Date(startOfDay(ms))
  const shift = (d.getDay() + 6) % 7
  return d.getTime() - shift * DAY_MS
}
const startOfMonth = (ms: number): number => new Date(new Date(ms).getFullYear(), new Date(ms).getMonth(), 1).getTime()

export function Progress({ index, now, workspaces, onSelect, sourceKind }: ProgressProps) {
  const [from, setFrom] = useState(() => startOfDay(now - 29 * DAY_MS))
  const [to, setTo] = useState(() => startOfDay(now))
  const [preset, setPreset] = useState<Preset | null>('d30')

  const bad = from > to

  /**
   * 止日早于起日时，统计**停在上一组有效区间上**，不是清空。
   *
   * 清空的话用户改日期改到一半（先把起日往后拖），整页数会瞬间全没，
   * 看起来像「这个区间真的一条都没跑过」而不是「你还没填完」。
   */
  const lastGood = useRef({ from: 0, to: 0 })
  if (!bad) lastGood.current = { from, to }

  const applyPreset = (id: Preset): void => {
    const today = startOfDay(now)
    setPreset(id)
    setTo(today)
    if (id === 'week') setFrom(startOfWeek(now))
    else if (id === 'd7') setFrom(today - 6 * DAY_MS)
    else if (id === 'd30') setFrom(today - 29 * DAY_MS)
    else if (id === 'd90') setFrom(today - 89 * DAY_MS)
    else {
      let earliest = today
      for (const task of index.onBoard) earliest = Math.min(earliest, startOfDay(task.createdAt))
      setFrom(earliest)
    }
  }

  const effective = bad ? lastGood.current : { from, to }
  const range = useMemo(
    () => ({ from: effective.from, to: effective.to + DAY_MS - 1 }),
    [effective.from, effective.to],
  )

  const stats = useMemo(() => {
    const count: Record<string, number> = {}
    for (const status of STATUS_ORDER) count[status] = 0
    let total = 0
    let scheduled = 0
    let scheduledOn = 0
    let bigTasks = 0
    let subtasks = 0

    for (const task of index.onBoard) {
      if (task.parentId !== undefined) { subtasks += 1; continue }
      bigTasks += 1
      if (task.schedule !== undefined) {
        scheduled += 1
        if (task.schedule.enabled) scheduledOn += 1
      }
      const ended = task.status === 'done' || task.status === 'failed'
      if (ended) {
        // 结束了的按「最后活动时间」判区间；还开着的一律计入 —— 它们本来就没结束，
        // 按区间筛掉会得出「这段时间什么都没在做」这种假象
        const at = spanEnd(task, now)
        if (at < range.from || at > range.to) continue
      }
      total += 1
      count[task.status] += 1
    }
    return { count, total, scheduled, scheduledOn, bigTasks, subtasks }
  }, [index.onBoard, now, range])

  const workspacesWithTasks = useMemo(() => {
    const buckets = new Map<string, TaskRecord[]>()
    for (const task of index.onBoard) {
      const key = task.workspaceId ?? ''
      const bucket = buckets.get(key)
      if (bucket === undefined) buckets.set(key, [task])
      else bucket.push(task)
    }
    return [...buckets.entries()].sort((a, b) => {
      if (a[0] === '') return 1
      if (b[0] === '') return -1
      return workspaces.nameOf(a[0]).localeCompare(workspaces.nameOf(b[0]), 'zh')
    })
  }, [index.onBoard, workspaces])

  const period = useMemo(() => buildPeriod(index.onBoard, now), [index.onBoard, now])

  if (index.onBoard.length === 0) {
    return (
      <div className="progress is-empty">
        <EmptyState {...emptyTaskCopy(sourceKind)} />
      </div>
    )
  }

  const rate = stats.total === 0 ? 0 : Math.round((stats.count.done / stats.total) * 100)

  return (
    <div className="progress">
      <div className="view-bar">
        <span className="p-date">
          <input
            type="date"
            aria-label="开始日期"
            className={bad ? 'bad' : undefined}
            value={iso(from)}
            onChange={event => { setFrom(new Date(`${event.target.value}T00:00:00`).getTime()); setPreset(null) }}
          />
          <span className="to">→</span>
          <input
            type="date"
            aria-label="结束日期"
            className={bad ? 'bad' : undefined}
            value={iso(to)}
            onChange={event => { setTo(new Date(`${event.target.value}T00:00:00`).getTime()); setPreset(null) }}
          />
        </span>
        <span className="p-quick">
          {PRESETS.map(item => (
            <button key={item.id} type="button" aria-pressed={preset === item.id} onClick={() => applyPreset(item.id)}>
              {item.label}
            </button>
          ))}
        </span>
        {bad ? (
          <span className="p-err">
            结束日期早于开始日期，下面这些数还是 {dayKey(effective.from)} ~ {dayKey(effective.to)} 的
          </span>
        ) : null}
      </div>

      <p className="view-note">
        口径：已完成任务数 ÷ 总任务数 · 统计范围 {dayKey(effective.from)} ~ {dayKey(effective.to)} ·
        时间范围只筛已经结束的任务，还开着的（待规划 / 待办 / 进行中）永远计入 · 定时 / 大任务 / 子任务分别统计
      </p>

      {stats.total === 0 ? (
        <div className="p-range-empty">这个日期区间里没有已经结束的任务。还开着的任务不会被区间筛掉，放宽一下止日试试。</div>
      ) : (
        <div className="p-top">
          <div className="panel p-donut">
            <Donut
              slices={STATUS_ORDER.map(status => ({ value: stats.count[status], css: STATUS[status].css, label: STATUS[status].label }))}
              center={`${rate}%`}
              sub={`${stats.count.done} / ${stats.total} 已完成`}
              ariaLabel={`按状态分布的任务占比，完成率 ${rate}%`}
            />
          </div>

          <div className="panel p-list">
            <h3>按状态</h3>
            {STATUS_ORDER.map(status => {
              const n = stats.count[status]
              const pct = stats.total === 0 ? 0 : (n / stats.total) * 100
              return (
                <div className="p-row" key={status}>
                  <span className="pd" style={{ background: STATUS[status].css }} aria-hidden="true" />
                  <span className="pn">{STATUS[status].label}</span>
                  <span className="ptrack"><span className="pfill" style={{ width: `${pct}%`, background: STATUS[status].css }} /></span>
                  <span className="pc">{n}</span>
                  <span className="pp">{Math.round(pct)}%</span>
                </div>
              )
            })}
            <div className="p-total"><span>任务总数</span><span>{stats.total}</span></div>
            <div className="p-break">
              <span className="bk" title="有定时规则的任务，其中已启用的会自动触发">
                <span className="k">定时</span>
                <b>{stats.scheduled}</b>
                {stats.scheduled > 0 ? <span className="sub">{stats.scheduledOn} 启用</span> : null}
              </span>
              <span className="bk" title="大任务＝不带父任务的顶层任务">
                <span className="k">大任务</span>
                <b>{stats.bigTasks}</b>
              </span>
              <span className="bk" title="子任务＝挂在大任务下面的任务">
                <span className="k">子任务</span>
                <b>{stats.subtasks}</b>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="panel p-goal">
        <div className="p-goal-hd">
          <h3>本期跑动</h3>
          <span className="hint view-note">不随上面的日期范围变——它问的是「现在这一期跑了多少」，不是一个区间里的量</span>
        </div>
        <div className="pg-wrap">
          <PeriodRow label="本周" range={period.week.range} data={period.week} />
          <PeriodRow label="本月" range={period.month.range} data={period.month} />
        </div>
        <div className={`pg-left${period.lastFailed > 0 ? ' warn' : ''}`} title="上一期（上周 / 上月）里失败过的执行数。写周报时要交代的就是这些">
          {period.lastFailed > 0 ? `⚠ 上期有 ${period.lastFailed} 次执行失败` : '上一期没有失败的执行'}
        </div>
      </div>

      <div>
        <p className="p-secttl">按工作区 · 每个工作区一张卡</p>
        <div className="p-grid" style={{ marginTop: 8 }}>
          {workspacesWithTasks.map(([id, tasks]) => (
            <WorkspaceCard
              key={id || '__none__'}
              id={id}
              tasks={tasks}
              workspaces={workspaces}
              now={now}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

/** 一行「本周 / 本月」。进度条画的是成功占已结束执行的比例。 */
function PeriodRow({ label, range, data }: { label: string; range: string; data: PeriodData }) {
  const pct = data.settled === 0 ? 0 : (data.succeeded / data.settled) * 100
  return (
    <div className="pg">
      <span className="k">{label}</span>
      <span className="rg">{range}</span>
      <span className="nm">
        <b>{data.runs}</b> 次执行 · 成功 <b>{data.succeeded}</b>
        {data.failed > 0 ? <> · 失败 <b>{data.failed}</b></> : null}
      </span>
      <span className="pg-track" style={{ gridColumn: '1 / -1' }}>
        <span className="pg-fill" style={{ width: `${pct}%` }} />
      </span>
    </div>
  )
}

interface PeriodData {
  runs: number
  succeeded: number
  failed: number
  settled: number
  range: string
}

function buildPeriod(tasks: readonly TaskRecord[], now: number): { week: PeriodData; month: PeriodData; lastFailed: number } {
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)
  const lastWeekStart = weekStart - 7 * DAY_MS
  const lastMonthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - 1, 1).getTime()

  const blank = (range: string): PeriodData => ({ runs: 0, succeeded: 0, failed: 0, settled: 0, range })
  const week = blank(`${iso(weekStart).slice(5)} ~ ${iso(weekStart + 6 * DAY_MS).slice(5)}`)
  const month = blank(`${new Date(now).getFullYear()} 年 ${new Date(now).getMonth() + 1} 月`)
  let lastFailed = 0

  const tally = (bucket: PeriodData, from: number, to: number, countLast: boolean): void => {
    for (const task of tasks) {
      for (const execution of task.executions) {
        const at = execution.startedAt
        if (at >= from && at <= to) {
          bucket.runs += 1
          if (execution.endedAt !== undefined) {
            bucket.settled += 1
            if (execution.result === 'succeeded') bucket.succeeded += 1
            else if (execution.result === 'failed') bucket.failed += 1
          }
        } else if (countLast && at >= lastWeekStart && at < weekStart) {
          if (execution.result === 'failed') lastFailed += 1
        } else if (countLast && at >= lastMonthStart && at < monthStart) {
          if (execution.result === 'failed') lastFailed += 1
        }
      }
    }
  }

  tally(week, weekStart, now, true)
  tally(month, monthStart, now, false)
  return { week, month, lastFailed }
}

interface WorkspaceCardProps {
  id: string
  tasks: TaskRecord[]
  workspaces: WorkspaceIndex
  now: number
  onSelect: (task: TaskRecord) => void
}

function WorkspaceCard({ id, tasks, workspaces, now }: WorkspaceCardProps) {
  const unpinned = id === ''
  const count: Record<string, number> = {}
  for (const status of STATUS_ORDER) count[status] = 0
  for (const task of tasks) count[task.status] += 1
  const total = tasks.length
  const done = count.done
  const rate = total === 0 ? 0 : Math.round((done / total) * 100)

  // 百分比用最大余数法补齐到正好 100 —— 各自四舍五入的话加起来常常是 99 或 101，
  // 图例上写出来就是错的
  const percents = largestRemainder(STATUS_ORDER.map(status => count[status]), total)

  let weekRuns = 0
  const weekStart = startOfWeek(now)
  for (const task of tasks) for (const execution of task.executions) if (execution.startedAt >= weekStart) weekRuns += 1

  return (
    <div className="panel p-ws">
      <div className="p-ws-hd">
        <span
          className="wdot"
          style={{ width: 8, height: 8, borderRadius: '50%', flex: '0 0 8px', ['--hue' as string]: String(hueOfId(id)) }}
          aria-hidden="true"
        />
        <span className={`nm${unpinned ? ' unpin' : ''}`} title={workspaces.pathOf(id) ?? workspaces.nameOf(id)}>
          {workspaces.nameOf(id || undefined)}
        </span>
      </div>

      <div className="p-ws-body">
        <div className="p-ws-ring">
          <Donut
            size={88}
            thickness={10}
            slices={STATUS_ORDER.map(status => ({ value: count[status], css: STATUS[status].css, label: STATUS[status].label }))}
            center={`${rate}%`}
            ariaLabel={`完成率 ${rate}%`}
          />
        </div>
        <div className="p-ws-num">
          <b>{total} 个任务</b>
          <span>完成 {done} 个</span>
        </div>
      </div>

      <div>
        <span
          className="stk"
          role="img"
          aria-label={`按状态的任务占比：${STATUS_ORDER.map((s, i) => `${STATUS[s].label} ${percents[i]}%`).join('，')}`}
        >
          {STATUS_ORDER.map((status, i) =>
            count[status] === 0 ? null : (
              <span key={status} className="sg" style={{ width: `${percents[i]}%`, background: STATUS[status].css }} />
            ),
          )}
        </span>
        <div className="stk-lg" style={{ marginTop: 7 }}>
          {STATUS_ORDER.map((status, i) =>
            count[status] === 0 ? null : (
              <span className="lg" key={status}>
                <i style={{ background: STATUS[status].css }} aria-hidden="true" />
                {STATUS[status].label} <b>{percents[i]}%</b>
              </span>
            ),
          )}
        </div>
      </div>

      <div className="p-break">
        <span className="bk" title="有定时规则的任务，其中已启用的会自动触发">
          <span className="k">定时</span>
          <b>{tasks.filter(task => task.schedule !== undefined).length}</b>
          {tasks.some(task => task.schedule?.enabled === true) ? (
            <span className="sub">{tasks.filter(task => task.schedule?.enabled === true).length} 启用</span>
          ) : null}
        </span>
        <span className="bk" title="大任务＝不带父任务的顶层任务">
          <span className="k">大任务</span>
          <b>{tasks.filter(task => task.parentId === undefined).length}</b>
        </span>
        <span className="bk" title="子任务＝挂在大任务下面的任务">
          <span className="k">子任务</span>
          <b>{tasks.filter(task => task.parentId !== undefined).length}</b>
        </span>
      </div>

      {/* 原型这里写「本周目标 2/3」。真模型里没有「周期目标」这个概念，
          换成同一位置、同一形状、也真有的东西：这个工作区本周跑了几次。 */}
      <div className={`p-ws-goal${weekRuns === 0 ? ' none' : ''}`} title="这个工作区里的任务本周一共执行了几次">
        {weekRuns === 0 ? '本周没跑过' : <>本周跑过 <b>{weekRuns}</b> 次</>}
      </div>
    </div>
  )
}

function hueOfId(id: string): number {
  let hash = 0
  for (const char of id) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0
  return hash % 360
}

/**
 * 最大余数法：把一组整数按占比分到整数百分比，且**加起来正好 100**。
 * 各自四舍五入会得到 99 或 101，图例里写出来就是错的。
 */
function largestRemainder(values: readonly number[], total: number): number[] {
  if (total === 0) return values.map(() => 0)
  const exact = values.map(value => (value / total) * 100)
  const floored = exact.map(Math.floor)
  let rest = 100 - floored.reduce((sum, value) => sum + value, 0)
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)
  const out = [...floored]
  for (const item of order) {
    if (rest <= 0) break
    out[item.index] += 1
    rest -= 1
  }
  return out
}

interface Slice {
  value: number
  css: string
  label: string
}

/**
 * 环形图。纯 SVG，无依赖。
 * 段与段之间留 2px 缝——五个状态里有两对色相挨得近，不留缝会糊成一条。
 */
function Donut({
  slices,
  center,
  sub,
  ariaLabel,
  size = 210,
  thickness = 26,
}: {
  slices: readonly Slice[]
  center: string
  sub?: string
  ariaLabel: string
  size?: number
  thickness?: number
}) {
  const visible = slices.filter(slice => slice.value > 0)
  const total = visible.reduce((sum, slice) => sum + slice.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const gap = 2

  let offset = 0
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={ariaLabel}>
      {total === 0 ? (
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={thickness} style={{ stroke: 'var(--interactive-bg-hover)' }} />
      ) : (
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {visible.map((slice, index) => {
            const length = (slice.value / total) * circumference
            const dash = Math.max(length - gap, 0.5)
            const element = (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                // **颜色必须走 style 而不是 stroke 属性**：`stroke="var(--x)"` 当属性写
                // 是无效值，SVG 会静默不画——环整个消失且控制台一声不响。变量只有在
                // CSS 属性里才会被解析。
                style={{ stroke: slice.css }}
              >
                <title>{`${slice.label} ${slice.value} 个`}</title>
              </circle>
            )
            offset += length
            return element
          })}
        </g>
      )}
      <text className={size > 120 ? 'big' : 'rbig'} x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
        {center}
      </text>
      {sub !== undefined ? (
        <text className="sub" x="50%" y="50%" dy="22" textAnchor="middle" dominantBaseline="central">{sub}</text>
      ) : null}
    </svg>
  )
}
