/**
 * 进度视图：一眼扫过去的仪表盘。
 *
 * 这一页回答的问题不是「某个任务怎么样了」（那是看板和抽屉的事），而是
 * **「我这一摊子整体什么状态、有没有东西卡住了」**。所以它排的是：
 * 总数 → 状态分布 → 执行结果 → 最近两周的跑动 → 需要留意的任务。
 *
 * 宽度铺满整屏（一轮轮改下来的结论）：这一页是拿来扫的，右半边空着比条子被拉长更糟。
 * 条子拉长之后靠**数字**认差别——每一行右边本来就写着条数和百分比。
 */
import { useMemo } from 'react'
import { STATUS, STATUS_ORDER } from '../tokens'
import type { TaskIndex } from '../model'
import { isRunning, lastExecution } from '../model'
import type { ExecutionOutcome, TaskRecord } from '../types'

const DAY_MS = 86_400_000
/** 最近多少天的跑动画成柱子。 */
const SPARK_DAYS = 14
/** 跑多久算「可能卡住了」。 */
const STALE_RUN_MS = 2 * 60 * 60 * 1000

interface ProgressProps {
  index: TaskIndex
  now: number
  onSelect: (task: TaskRecord) => void
}

interface Bucket {
  label: string
  tone: string
  count: number
}

export function Progress({ index, now, onSelect }: ProgressProps) {
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {}
    for (const status of STATUS_ORDER) byStatus[status] = 0
    let subtasks = 0
    let executions = 0
    let openRuns = 0
    let longestOpen = 0
    const outcomes: Record<ExecutionOutcome | 'open', number> = { succeeded: 0, failed: 0, cancelled: 0, open: 0 }
    /** 最近 SPARK_DAYS 天每天开始的执行次数。 */
    const spark = new Array<number>(SPARK_DAYS).fill(0)
    const sparkBase = new Date(now)
    sparkBase.setHours(0, 0, 0, 0)
    const sparkStart = sparkBase.getTime() - (SPARK_DAYS - 1) * DAY_MS

    // 状态分布只数主任务（看板自己也是这么分的），**执行数一个不漏**——
    // 子任务跑的那几轮同样是真跑过的，不算进去的话「累计执行」会明显少一截，
    // 而少的那一截恰恰是干活最多的那部分。
    for (const task of index.onBoard) {
      if (task.parentId !== undefined) subtasks += 1
      else byStatus[task.status] += 1

      for (const execution of task.executions) {
        executions += 1
        if (execution.endedAt === undefined) {
          outcomes.open += 1
          openRuns += 1
          longestOpen = Math.max(longestOpen, now - execution.startedAt)
        } else if (execution.result !== undefined) {
          outcomes[execution.result] += 1
        }
        if (execution.startedAt >= sparkStart) {
          const day = Math.min(Math.floor((execution.startedAt - sparkStart) / DAY_MS), SPARK_DAYS - 1)
          spark[day] += 1
        }
      }
    }

    return { byStatus, subtasks, executions, openRuns, longestOpen, outcomes, spark, sparkStart }
  }, [index, now])

  const roots = index.roots
  const alerts = useMemo(() => collectAlerts(index, now), [index, now])

  const statusBuckets: Bucket[] = STATUS_ORDER.map(status => ({
    label: STATUS[status].label,
    tone: `var(--tb-tone-${toneOf(status)})`,
    count: stats.byStatus[status],
  }))
  const outcomeBuckets: Bucket[] = [
    { label: '成功', tone: 'var(--tb-tone-success)', count: stats.outcomes.succeeded },
    { label: '失败', tone: 'var(--tb-tone-error)', count: stats.outcomes.failed },
    { label: '已取消', tone: 'var(--tb-tone-idle)', count: stats.outcomes.cancelled },
    { label: '还在跑', tone: 'var(--tb-tone-warn)', count: stats.outcomes.open },
  ]

  const tagBuckets = useMemo(() => {
    const counts = new Map<string, number>()
    for (const task of index.onBoard) {
      for (const tag of task.tags ?? []) counts.set(tag.name, (counts.get(tag.name) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, tone: 'var(--tb-business)', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [index.onBoard])

  if (roots.length === 0 && stats.subtasks === 0) {
    return (
      <div className="dsptb-blank">
        <h3>还没有任务</h3>
        <p>任务看板里建一张卡，这里就会长出数来。</p>
      </div>
    )
  }

  return (
    <div className="dsptb-progress">
      <section className="dsptb-panel">
        <h3>总览</h3>
        <div className="dsptb-kpis">
          <Kpi value={roots.length} label="主任务" />
          <Kpi value={stats.subtasks} label="子任务" />
          <Kpi value={stats.byStatus.running} label="进行中" tone="var(--tb-tone-warn)" />
          <Kpi value={stats.executions} label="累计执行" />
          {/* 「开着的执行」而不是「正在跑的任务」：这个数含子任务的执行，
              跟上面那格「进行中」（只数主任务）口径不同，标签必须说清是哪个 */}
          <Kpi
            value={stats.openRuns}
            label="开着的执行"
            tone={stats.openRuns > 0 ? 'var(--tb-tone-warn)' : undefined}
          />
          <Kpi
            value={roots.length === 0 ? '—' : `${Math.round((stats.byStatus.done / roots.length) * 100)}%`}
            label="主任务完成率"
            tone="var(--tb-tone-success)"
          />
        </div>
      </section>

      <div className="dsptb-p-grid">
        <section className="dsptb-panel">
          <h3>状态分布</h3>
          <StackedBar buckets={statusBuckets} total={roots.length} />
          <Legend buckets={statusBuckets} />
        </section>

        <section className="dsptb-panel">
          <h3>执行结果</h3>
          <StackedBar buckets={outcomeBuckets} total={stats.executions} />
          <Legend buckets={outcomeBuckets} />
        </section>
      </div>

      <section className="dsptb-panel">
        <h3>最近两周的跑动</h3>
        <Spark days={stats.spark} start={stats.sparkStart} now={now} />
      </section>

      {alerts.length > 0 ? (
        <section className="dsptb-panel">
          <h3>需要留意</h3>
          {alerts.map(alert => (
            <div className="dsptb-row" key={alert.task.id}>
              <span className="lbl" style={{ color: alert.tone, width: 64 }}>
                {alert.tag}
              </span>
              <button
                type="button"
                onClick={() => onSelect(alert.task)}
                style={{ flex: 1, minWidth: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={alert.why}
              >
                {alert.task.title}
              </button>
              <span className="num" style={{ width: 150 }} title={alert.why}>
                {alert.detail}
              </span>
            </div>
          ))}
        </section>
      ) : null}

      {tagBuckets.length > 0 ? (
        <section className="dsptb-panel">
          <h3>标签分布</h3>
          {tagBuckets.map(bucket => (
            <Bar key={bucket.label} label={bucket.label} count={bucket.count} total={index.onBoard.length} tone={bucket.tone} />
          ))}
        </section>
      ) : null}
    </div>
  )
}

function toneOf(status: string): string {
  switch (status) {
    case 'todo':
      return 'business'
    case 'running':
      return 'warn'
    case 'done':
      return 'success'
    case 'failed':
      return 'error'
    default:
      return 'idle'
  }
}

function Kpi({ value, label, tone }: { value: number | string; label: string; tone?: string }) {
  return (
    <div className="dsptb-kpi">
      <b style={tone === undefined ? undefined : { color: tone }}>{value}</b>
      <span>{label}</span>
    </div>
  )
}

function StackedBar({ buckets, total }: { buckets: Bucket[]; total: number }) {
  if (total === 0) return <p className="dsptb-empty">还没有数据</p>
  return (
    <div className="dsptb-pbar" style={{ height: 12 }} role="img" aria-label={buckets.map(b => `${b.label} ${b.count}`).join('，')}>
      {buckets.map(bucket =>
        bucket.count === 0 ? null : (
          <i
            key={bucket.label}
            style={{ width: `${(bucket.count / total) * 100}%`, background: bucket.tone }}
            title={`${bucket.label} ${bucket.count}（${Math.round((bucket.count / total) * 100)}%）`}
          />
        ),
      )}
    </div>
  )
}

function Legend({ buckets }: { buckets: Bucket[] }) {
  return (
    <div className="dsptb-legend">
      {buckets.map(bucket => (
        <span key={bucket.label}>
          <i className="dsptb-hdot" style={{ background: bucket.tone, display: 'inline-block' }} aria-hidden="true" />
          {bucket.label} {bucket.count}
        </span>
      ))}
    </div>
  )
}

function Bar({ label, count, total, tone }: { label: string; count: number; total: number; tone: string }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100)
  return (
    <div className="dsptb-row">
      <span className="lbl" title={label} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span className="dsptb-pbar">
        <i style={{ width: `${pct}%`, background: tone }} />
      </span>
      <span className="num">
        {count} 个 · {pct}%
      </span>
    </div>
  )
}

/**
 * 最近 N 天的执行次数：一根一根的柱子，最高的那根当标尺。
 *
 * 柱子高度**必须按像素算**，不能用百分比。百分比在这个结构里是按整列（含上面那行数字、
 * 下面那行日期）的高度解析的，于是「2 次」和「4 次」画出来差不多高——实测的数字比例
 * 是 63px : 75px，而不是 1:2。柱子的比例失真就等于这张图没用，所以这里把它钉死在像素上。
 */
const SPARK_TRACK_PX = 62

function Spark({ days, start, now }: { days: number[]; start: number; now: number }) {
  const peak = Math.max(...days, 1)
  const total = days.reduce((sum, value) => sum + value, 0)
  if (total === 0) return <p className="dsptb-empty">最近两周没有跑过</p>
  const todayStart = new Date(now).setHours(0, 0, 0, 0)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%' }}>
      {days.map((count, index) => {
        const date = new Date(start + index * DAY_MS)
        const isToday = start + index * DAY_MS === todayStart
        const height = count === 0 ? 2 : Math.max(Math.round((count / peak) * SPARK_TRACK_PX), 4)
        return (
          <div
            key={index}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}
            title={`${date.getMonth() + 1} 月 ${date.getDate()} 日 · ${count} 次`}
          >
            <span style={{ fontSize: 11, lineHeight: '14px', color: 'var(--tb-fg-3)', fontVariantNumeric: 'tabular-nums' }}>
              {count === 0 ? '' : count}
            </span>
            <i
              style={{
                display: 'block',
                width: '100%',
                height,
                borderRadius: 3,
                background: isToday ? 'var(--tb-brand)' : 'var(--tb-business)',
                opacity: count === 0 ? 0.2 : 1,
              }}
            />
            <span style={{ fontSize: 10, lineHeight: '13px', color: isToday ? 'var(--tb-fg)' : 'var(--tb-fg-3)' }}>
              {index % 2 === 0 || isToday ? date.getDate() : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

interface Alert {
  task: TaskRecord
  tag: string
  tone: string
  detail: string
  why: string
}

/**
 * 「需要留意」那一栏。
 *
 * 挑的是三件真会让人吃亏的事，按吃亏的顺序排：
 *   1. 有个执行开着很久了——多半是卡住或者会话死了，没人看就一直占着「进行中」；
 *   2. 任务标记着进行中但底下没有任何执行——状态和执行对不上，八成是宿主重启时丢的；
 *   3. 失败过的最多列三条——失败的会一直躺在那一列，不看就忘了。
 */
function collectAlerts(index: TaskIndex, now: number): Alert[] {
  const out: Alert[] = []
  for (const task of index.roots) {
    const last = lastExecution(task)
    if (last !== undefined && last.endedAt === undefined) {
      const open = now - last.startedAt
      if (open > STALE_RUN_MS) {
        out.push({
          task,
          tag: '跑太久',
          tone: 'var(--tb-tone-warn)',
          detail: `已跑 ${Math.round(open / 3_600_000)} 小时`,
          why: `这次执行从 ${new Date(last.startedAt).toLocaleString()} 开始，到现在还没结束`,
        })
      }
      continue
    }
    if (isRunning(task)) continue
    if (task.status === 'running' && last !== undefined && last.endedAt !== undefined) {
      out.push({
        task,
        tag: '状态对不上',
        tone: 'var(--tb-tone-warn)',
        detail: '标着进行中，但没有开着的执行',
        why: '卡片的列是「进行中」，可是它底下每一次执行都已经结束了',
      })
      continue
    }
    if (task.status === 'failed') {
      out.push({
        task,
        tag: '失败',
        tone: 'var(--tb-tone-error)',
        detail: last?.error ?? '没有错误信息',
        why: last?.error ?? '这一次执行以失败结束，账本里没有留下错误文本',
      })
    }
  }
  // 最多六条：这一栏是「提醒」不是「清单」，铺满一屏就没人看了
  return out.slice(0, 6)
}
