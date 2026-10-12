/**
 * 甘特视图：最近 21 天，一个任务一行。
 *
 * 一行画两根东西——**底下的条形**是任务本身（从创建到最近一次活动），
 * **条形里的深色小段**是每一次真实的执行。两者分开画是因为「任务挂了三天」
 * 和「任务跑了三分钟」是两件事，合成一根条就都看不出来了。
 *
 * 窗口是固定的 21 天、以今天结尾，**不给横向滚动条**：任务看板最重要的用途是
 * 「我该看哪个窗口」，滚来滚去的甘特恰恰是最看不出来的那种。
 */
import { useMemo } from 'react'
import type { TaskIndex } from '../model'
import { isRunning, spanEnd, triggerOf } from '../model'
import type { TaskRecord } from '../types'

const DAY_MS = 86_400_000
const DAY_W = 44
const NAME_W = 220
const SPAN = 21
const HEAD_H = 34
/** 一次执行最短画多宽——瞬时执行（跑完就走）否则会细到看不见。 */
const MIN_EXEC_W = 3
/** 一个任务一次都没跑过时，条形也得有一截。 */
const MIN_BAR_MS = DAY_MS / 6

interface GanttProps {
  index: TaskIndex
  now: number
  selectedId: string | undefined
  onSelect: (task: TaskRecord) => void
}

export function Gantt({ index, now, selectedId, onSelect }: GanttProps) {
  const windowStart = useMemo(() => {
    const today = new Date(now)
    return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - (SPAN - 1) * DAY_MS
  }, [now])

  /**
   * 上甘特的是主任务 + 它们的直接子任务。
   * 孙任务不画——画了行数会炸，而且「哪个窗口在等我」从来不需要看到第三层。
   */
  const rows = useMemo(() => {
    const out: TaskRecord[] = []
    for (const root of index.roots) {
      // 整段都落在窗口左边的任务不画：它会占一行名字，却一根条都画不出来，看着像坏了。
      // 只要还沾着窗口一点（哪怕起点更早）就留着，左端自然被裁。
      if (spanEnd(root, now) >= windowStart) out.push(root)
      for (const child of index.childrenOf.get(root.id) ?? []) {
        if (child.archivedAt !== undefined) continue
        if (spanEnd(child, now) >= windowStart) out.push(child)
      }
    }
    return out
  }, [index, now, windowStart])

  const trackW = SPAN * DAY_W
  const offsetOf = (ms: number): number => ((ms - windowStart) / DAY_MS) * DAY_W

  if (rows.length === 0) {
    return (
      <div className="dsptb-blank">
        <h3>这 21 天里没有活动</h3>
        <p>甘特只看最近 21 天。更早的任务还在看板和进度里。</p>
      </div>
    )
  }

  const todayX = NAME_W + offsetOf(now)

  return (
    <div className="dsptb-gantt">
      <div
        className="dsptb-g-inner"
        style={{ ['--tb-dayw' as string]: `${DAY_W}px`, ['--tb-namw' as string]: `${NAME_W}px` }}
      >
        <div className="dsptb-g-head" style={{ top: 0 }}>
          <div className="dsptb-g-corner">任务</div>
          <div className="dsptb-g-dates">
            {Array.from({ length: SPAN }, (_, i) => {
              const date = new Date(windowStart + i * DAY_MS)
              const isToday = i === SPAN - 1
              // 每三天写一个日期，其余画刻度；最后一天一定写（那就是今天）
              const show = i % 3 === 0 || isToday
              return (
                <div
                  key={i}
                  className="dsptb-g-cell"
                  data-today={isToday ? 'true' : 'false'}
                  style={{ width: DAY_W }}
                >
                  {show ? `${date.getMonth() + 1}/${date.getDate()}` : <span style={{ opacity: 0.35 }}>·</span>}
                </div>
              )
            })}
          </div>
        </div>

        {rows.map(task => {
          const isChild = task.parentId !== undefined
          const end = Math.max(spanEnd(task, now), task.createdAt + MIN_BAR_MS)
          let x0 = offsetOf(task.createdAt)
          let x1 = offsetOf(end)
          const clipL = x0 < 0
          const clipR = x1 > trackW
          if (clipL) x0 = 0
          if (clipR) x1 = trackW
          let width = Math.max(x1 - x0, 8)
          if (x0 + width > trackW) x0 = Math.max(0, trackW - width)
          width = Math.min(width, trackW - x0)

          const running = isRunning(task)
          const tip = [
            task.title,
            `创建 ${new Date(task.createdAt).toLocaleString()}`,
            running ? '此刻有人在跑' : `最近活动 ${new Date(end).toLocaleString()}`,
            `${task.executions.length} 次执行`,
          ].join('\n')

          return (
            <div className="dsptb-g-row" key={task.id}>
              <button
                type="button"
                className="dsptb-g-name"
                data-child={isChild ? 'true' : 'false'}
                data-sel={task.id === selectedId ? 'true' : 'false'}
                onClick={() => onSelect(task)}
                title={tip}
                style={{ background: 'none', border: 0, textAlign: 'left', cursor: 'pointer' }}
              >
                <span
                  className="dsptb-hdot"
                  style={{ background: `var(--tb-tone-${toneKey(task)})`, flex: 'none' }}
                  aria-hidden="true"
                />
                {isChild ? <span style={{ opacity: 0.5 }} aria-hidden="true">└</span> : null}
                {task.schedule?.enabled === true ? (
                  <span title={`定时已启用 · ${task.schedule.cron}`} style={{ flex: 'none' }}>
                    ⏱
                  </span>
                ) : null}
                <span className="ttl">{task.title}</span>
              </button>

              <div className="dsptb-g-track" style={{ width: trackW }} title={tip}>
                <div className="dsptb-g-grid" />
                <div
                  className="dsptb-g-bar"
                  data-s={task.status}
                  style={{ left: x0, width, opacity: clipL || clipR ? 0.75 : 1 }}
                >
                  {task.executions.map(execution => {
                    let a = offsetOf(execution.startedAt)
                    let b = offsetOf(execution.endedAt ?? now)
                    if (b < 0 || a > trackW) return null
                    a = Math.max(a, 0)
                    b = Math.min(b, trackW)
                    const scheduled = triggerOf(execution) === 'schedule'
                    return (
                      <i
                        key={execution.id}
                        className="dsptb-g-exec"
                        style={{ left: a - x0, width: Math.max(b - a, MIN_EXEC_W), borderRadius: scheduled ? 0 : 3 }}
                        title={`${scheduled ? '定时触发（按来源推断）' : '手动触发'} · ${new Date(execution.startedAt).toLocaleString()}`}
                      />
                    )
                  })}
                </div>
                {running ? <span className="dsptb-g-pulse" style={{ left: x0 + width }} /> : null}
              </div>
            </div>
          )
        })}

        <div className="dsptb-g-today" style={{ left: todayX, top: HEAD_H, height: rows.length * 30 }} />
      </div>
    </div>
  )
}

/** 状态 → 本地色别名后缀。 */
function toneKey(task: TaskRecord): string {
  switch (task.status) {
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
