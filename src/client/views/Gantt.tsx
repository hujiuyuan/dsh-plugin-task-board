/**
 * 甘特视图：最近 21 天，一任务一行。
 *
 * 一行画两根东西——**底下的条形**是任务本身（从创建到最近一次活动），
 * **条形里的实心小段**是每一次真实的执行。两者分开画，是因为「任务挂了三天」
 * 和「任务只跑了三分钟」是两件事，合成一根条就都看不出来了。
 *
 * 窗口固定 21 天、以今天结尾，**不给横向滚动条**：这个看板最重要的用途是
 * 「我该看哪个窗口」，滚来滚去的甘特恰恰是最看不出来的那种。
 */
import { useMemo, useState } from 'react'
import { STATUS, barColor, hueOf } from '../tokens'
import type { TaskIndex } from '../model'
import { isRunning, lastExecution, spanEnd, triggerOf } from '../model'
import type { TaskRecord } from '../types'
import type { WorkspaceIndex } from '../workspaces'
import { Dropdown, EmptyState, IconClock, Toggle, emptyTaskCopy, type Option } from './controls'

const DAY_MS = 86_400_000
const DAY_W = 44
const NAME_W = 220
const SPAN = 21
const HEAD_H = 34
const ROW_H = 30
/** 一次执行往往只有一两小时，在整条上不到 3px —— 给个最小可见宽度。 */
const MIN_EXEC_W = 4
/** 从没跑过的任务也得留一截，不然条形宽 0 看不见。 */
const MIN_BAR_MS = DAY_MS / 6

interface GanttProps {
  index: TaskIndex
  now: number
  workspaces: WorkspaceIndex
  selectedId: string | undefined
  onSelect: (task: TaskRecord) => void
  onClearAll: () => void
  hideSubtasks: boolean
  onHideSubtasks: (next: boolean) => void
  lanes: boolean
  onLanes: (next: boolean) => void
  /** 数据来源。只影响「一条任务都没有」那句话。 */
  sourceKind: 'board' | 'ledger' | 'unavailable'
}

export function Gantt({
  index, now, workspaces, selectedId, onSelect, onClearAll,
  hideSubtasks, onHideSubtasks, lanes, onLanes, sourceKind,
}: GanttProps) {
  const [ws, setWs] = useState('')
  const [trig, setTrig] = useState<'all' | 'schedule' | 'manual'>('all')

  const windowStart = useMemo(() => {
    const today = new Date(now)
    return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - (SPAN - 1) * DAY_MS
  }, [now])

  const wsOptions: Option[] = useMemo(
    () => [
      { value: '', label: '项目' },
      ...workspaces.groups.filter(id => id !== '').map(id => ({ value: id, label: workspaces.nameOf(id), hue: hueOf(id) })),
      { value: '__none__', label: '未钉', hue: 220 },
    ],
    [workspaces],
  )

  const visible = useMemo(() => {
    const match = (task: TaskRecord): boolean => {
      if (ws === '__none__' && task.workspaceId !== undefined) return false
      if (ws !== '' && ws !== '__none__' && task.workspaceId !== ws) return false
      if (trig !== 'all') {
        const last = lastExecution(task)
        if (last === undefined || triggerOf(last) !== trig) return false
      }
      return true
    }
    const rows: TaskRecord[] = []
    for (const root of index.roots) {
      if (match(root) && spanEnd(root, now) >= windowStart) rows.push(root)
      if (hideSubtasks) continue
      for (const child of index.childrenOf.get(root.id) ?? []) {
        if (child.archivedAt !== undefined) continue
        if (match(child) && spanEnd(child, now) >= windowStart) rows.push(child)
      }
    }
    return rows
  }, [index, now, windowStart, ws, trig, hideSubtasks])

  const filtering = ws !== '' || trig !== 'all'

  if (visible.length === 0) {
    return (
      <div className="view">
        <div className="view-bar">
          <Dropdown mini className="dd-gantt-ws" value={ws} options={wsOptions} ariaLabel="甘特的项目筛选" onChange={setWs} />
          <div className="select-wrap mini">
            <select
              className={trig === 'all' ? undefined : 'on'}
              aria-label="甘特的触发方式筛选"
              value={trig}
              onChange={event => setTrig(event.target.value as typeof trig)}
            >
              <option value="all">触发</option>
              <option value="schedule">仅定时</option>
              <option value="manual">仅手动</option>
            </select>
          </div>
        </div>
        <div className="gantt is-empty">
          <EmptyState
            {...(filtering
              ? { title: '没有匹配的任务', body: '筛选条件把账本滤空了，清一下试试。', actionLabel: '清空全部筛选', onAction: () => { setWs(''); setTrig('all'); onClearAll() } }
              // 一条任务都没有时，说「这 21 天里没有活动」是误导 —— 它不是被时间窗滤掉的
              : index.roots.length === 0
                ? emptyTaskCopy(sourceKind)
                : { title: '这 21 天里没有活动', body: '甘特只看最近 21 天，更早的任务还在看板和进度里。' })}
          />
        </div>
      </div>
    )
  }

  const trackW = SPAN * DAY_W
  const offsetOf = (ms: number): number => ((ms - windowStart) / DAY_MS) * DAY_W

  /** 泳道打开时按工作区分组，未钉的排最后。 */
  const laneList: Array<{ id: string | undefined; rows: TaskRecord[] }> = lanes
    ? [...new Set(visible.map(task => task.workspaceId))]
        .sort((a, b) => (a === undefined ? 1 : b === undefined ? -1 : workspaces.nameOf(a).localeCompare(workspaces.nameOf(b), 'zh')))
        .map(id => ({ id, rows: visible.filter(task => task.workspaceId === id) }))
    : [{ id: undefined, rows: visible }]

  let rowCount = 0
  for (const lane of laneList) rowCount += lane.rows.length + (lanes ? 1 : 0)

  return (
    <div className="view">
      <div className="view-bar">
        <Dropdown mini className="dd-gantt-ws" value={ws} options={wsOptions} ariaLabel="甘特的项目筛选" onChange={setWs} />
        <div className="select-wrap mini">
          <select
            className={trig === 'all' ? undefined : 'on'}
            aria-label="甘特的触发方式筛选"
            value={trig}
            onChange={event => setTrig(event.target.value as typeof trig)}
          >
            <option value="all">触发</option>
            <option value="schedule">仅定时</option>
            <option value="manual">仅手动</option>
          </select>
        </div>
      </div>

      <div className="g-note">
        <p className="view-note">口径：任务从创建到最近一次活动的时间跨度 · 竖线＝今天 · 实心方块＝定时触发（按来源推断）</p>
        <Toggle checked={hideSubtasks} label="隐藏子任务" title="子任务跟不跟在父任务后面显示。只影响这张甘特图" onChange={onHideSubtasks} />
        <Toggle checked={lanes} label="按工作区分泳道" onChange={onLanes} />
      </div>

      <div className="gantt">
        <div className="g-inner">
          <div className="g-head">
            <div className="g-corner">任务</div>
            <div className="g-dates">
              {Array.from({ length: SPAN }, (_, i) => {
                const date = new Date(windowStart + i * DAY_MS)
                const isToday = i === SPAN - 1
                return (
                  <div key={i} className={`cell${isToday ? ' today' : ''}`} style={{ width: DAY_W }}>
                    {i % 3 === 0 || isToday
                      ? `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                      : <span className="tick" />}
                  </div>
                )
              })}
            </div>
          </div>

          {laneList.map((lane, laneIndex) => (
            <div key={`lane-${laneIndex}`}>
              {lanes ? (
                <div className="g-row g-lane">
                  <div className="g-name">
                    <span className="wdot" style={{ ['--hue' as string]: String(hueOf(lane.id ?? '')) }} aria-hidden="true" />
                    <span className="ttl">{workspaces.nameOf(lane.id)}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 400, color: 'var(--label-tertiary)' }}>{lane.rows.length}</span>
                  </div>
                  <div className="g-rest" style={{ width: trackW }} />
                </div>
              ) : null}

              {lane.rows.map(task => {
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
                const last = lastExecution(task)
                const st = STATUS[task.status]
                const tip = `${task.title} · 创建 ${new Date(task.createdAt).toLocaleString()} → ${running ? '至今' : new Date(end).toLocaleString()}`

                return (
                  <div className="g-row" key={task.id}>
                    <button
                      type="button"
                      className={`g-name${isChild ? ' child' : ''}`}
                      onClick={() => onSelect(task)}
                      title={tip}
                    >
                      {isChild ? <span className="br" aria-hidden="true">└</span> : null}
                      <span
                        className={`g-wsmark${task.workspaceId === undefined ? ' unpin' : ''}`}
                        style={{ ['--hue' as string]: String(hueOf(task.workspaceId ?? '')) }}
                        title={workspaces.pathOf(task.workspaceId) ?? workspaces.nameOf(task.workspaceId)}
                      >
                        {workspaces.abbrOf(task.workspaceId)}
                      </span>
                      {task.schedule !== undefined ? (
                        <span
                          className="clk"
                          title={task.schedule.enabled ? `定时已启用 · ${task.schedule.cron}` : `定时未启用 · ${task.schedule.cron}`}
                        >
                          <IconClock filled={task.schedule.enabled} />
                        </span>
                      ) : null}
                      <span className="ttl" title={task.title}>{task.title}</span>
                    </button>

                    <div
                      className="g-track"
                      style={{ width: trackW, ['--bh' as string]: String(st.hue), ['--bs' as string]: st.sat, ['--bl' as string]: st.lig }}
                      title={tip}
                    >
                      <div className="g-grid" />
                      <div
                        className={`g-bar ${task.status}${clipL ? ' clip-l' : ''}${clipR ? ' clip-r' : ''}`}
                        style={{ left: x0, width }}
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
                              className={`g-exec${scheduled ? ' is-trig' : ''}`}
                              style={{ left: a - x0, width: Math.max(b - a, scheduled ? 8 : MIN_EXEC_W) }}
                              title={`${scheduled ? '定时触发（按来源推断）' : '手动触发'} ${new Date(execution.startedAt).toLocaleString()}`}
                            />
                          )
                        })}
                      </div>
                      {last !== undefined && last.endedAt === undefined ? (
                        <span className="g-pulse" style={{ left: x0 + width }} />
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          <div className="g-today" style={{ left: NAME_W + offsetOf(now), top: HEAD_H, height: rowCount * ROW_H }} />
        </div>
      </div>
    </div>
  )
}
