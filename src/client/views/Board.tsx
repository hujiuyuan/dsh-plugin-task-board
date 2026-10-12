/**
 * 看板视图：五列，只挂主任务。
 *
 * 「只挂主任务」是定死的：子任务的入口只有一条——父卡片上的「子任务 N/M」，点开抽屉看。
 * 所以这里不插子任务行、不参与列头计数、不参与分组。
 *
 * 已完成 / 已失败两列按天分组（新的在前），一次显示几组，剩下的折在「更多」后面；
 * 这两列的任务是**永不减少**的，不折的话两个月以后要滚屏半小时才能看到今天的。
 * 其余三列不分组，顺序是「创建时间倒序」——那三列的任务本来就少，而且随时会动。
 */
import { useEffect, useMemo, useState } from 'react'
import { STATUS, STATUS_ORDER } from '../tokens'
import type { TaskIndex } from '../model'
import { groupByDay, isRunning, lastExecution, rollupOf, shortTime } from '../model'
import type { TaskRecord, TaskStatus } from '../types'

/** 已完成/已失败两列一次显示几组，剩下的折起来。 */
const GROUP_PAGE = 3

interface BoardProps {
  index: TaskIndex
  now: number
  query: string
  selectedId: string | undefined
  onSelect: (task: TaskRecord) => void
}

export function Board({ index, now, query, selectedId, onSelect }: BoardProps) {
  const [page, setPage] = useState(0)
  /**
   * 用户手动开/关过哪些日期组。**只记「手动改过」的那些**——没记过的走默认值
   * （每组里最新的一组默认开）。用 `Set` 记「开着的」是不行的：那样「默认开」
   * 和「被关掉」分不出来。
   */
  const [groupOverride, setGroupOverride] = useState<ReadonlyMap<string, boolean>>(() => new Map())

  const normalized = query.trim().toLowerCase()
  const filtering = normalized.length > 0

  // 换了筛选词就把「更多」翻回第一页：不翻的话筛完只剩 2 组、页码还停在 3，
  // 桌上看着就是「筛出来什么都没有」。
  useEffect(() => setPage(0), [normalized])

  const columns = useMemo(() => {
    const out: Record<TaskStatus, TaskRecord[]> = { backlog: [], todo: [], running: [], done: [], failed: [] }
    for (const task of index.roots) {
      if (filtering && !haystack(task).includes(normalized)) continue
      out[task.status].push(task)
    }
    for (const status of STATUS_ORDER) {
      if (status === 'done' || status === 'failed') {
        out[status].sort((a, b) => b.updatedAt - a.updatedAt)
      } else {
        out[status].sort((a, b) => b.createdAt - a.createdAt)
      }
    }
    return out
  }, [index.roots, filtering, normalized])

  const allCount = useMemo(() => {
    const out: Record<TaskStatus, number> = { backlog: 0, todo: 0, running: 0, done: 0, failed: 0 }
    for (const task of index.roots) out[task.status] += 1
    return out
  }, [index.roots])

  return (
    <div className="dsptb-board">
      {STATUS_ORDER.map(status => {
        const meta = STATUS[status]
        const items = columns[status]
        const dated = (status === 'done' || status === 'failed') && !filtering
        const days = dated ? groupByDay(items) : undefined
        // 最新那一组默认展开：用户点进这一列八成是来看最近跑完的那批
        const shown = days?.slice(0, page * GROUP_PAGE + GROUP_PAGE) ?? []
        const rest = days?.slice(shown.length) ?? []
        const restCount = rest.reduce((sum, group) => sum + group.items.length, 0)
        const restWorkdays = rest.filter(group => !group.weekend).length
        const filtered = filtering && items.length !== allCount[status]

        return (
          <section className="dsptb-col" key={status} aria-label={meta.label}>
            <div className="dsptb-col-head" title={`${meta.label}\n${meta.desc}`}>
              <span className="dsptb-hdot" style={{ background: meta.tone }} />
              <h3>{meta.label}</h3>
              <span className="dsptb-count">
                {items.length}
                {filtered ? <i>/{allCount[status]}</i> : null}
              </span>
            </div>
            <div className="dsptb-col-body">
              {items.length === 0 ? (
                <p className="dsptb-empty">{filtering ? '这一列没有命中的任务' : '这个状态还没有任务'}</p>
              ) : days === undefined ? (
                items.map(task => (
                  <Card key={task.id} task={task} index={index} now={now} selectedId={selectedId} onSelect={onSelect} />
                ))
              ) : (
                <>
                  {shown.map((group, groupIndex) => {
                    const key = `${status}:${group.key}`
                    // 最新那一组默认开；别的默认收。用户点过的以点过的为准。
                    const open = groupOverride.get(key) ?? groupIndex === 0
                    return (
                      <div key={group.key}>
                        <div className="dsptb-group">
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() =>
                              setGroupOverride(current => {
                                const next = new Map(current)
                                next.set(key, !open)
                                return next
                              })
                            }
                          >
                            <span className="dsptb-caret" data-open={open ? 'true' : 'false'} aria-hidden="true">▸</span>
                            {group.key === dayKeyOf(now) ? (
                              <span className="dsptb-hdot" style={{ background: 'var(--tb-brand)' }} title="今天" />
                            ) : null}
                            {groupLabel(group.key, now)}
                            <span className="dsptb-count">{group.items.length}</span>
                          </button>
                          <span className="dsptb-rule" />
                        </div>
                        {open
                          ? group.items.map(task => (
                              <Card key={task.id} task={task} index={index} now={now} selectedId={selectedId} onSelect={onSelect} />
                            ))
                          : null}
                      </div>
                    )
                  })}
                  {rest.length > 0 ? (
                    <div className="dsptb-more">
                      <span>
                        {restWorkdays > 0 ? `还有 ${restWorkdays} 个工作日 · ` : '还有 '}
                        {restCount} 项没显示
                      </span>
                      <button type="button" className="dsptb-btn" onClick={() => setPage(value => value + 1)}>
                        更多
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function haystack(task: TaskRecord): string {
  return [task.title, task.description, ...(task.tags ?? []).map(tag => tag.name)].join('\n').toLowerCase()
}

function dayKeyOf(now: number): string {
  const date = new Date(now)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function groupLabel(key: string, now: number): string {
  const date = new Date(`${key}T12:00:00`)
  const weekday = '日一二三四五六'[date.getDay()]
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  const base = `${date.getMonth() + 1} 月 ${date.getDate()} 日`
  return `${sameYear ? base : `${date.getFullYear()} 年 ${base}`} 周${weekday}`
}

interface CardProps {
  task: TaskRecord
  index: TaskIndex
  now: number
  selectedId: string | undefined
  onSelect: (task: TaskRecord) => void
}

function Card({ task, index, now, selectedId, onSelect }: CardProps) {
  const rollup = useMemo(() => rollupOf(index, task), [index, task])
  const last = lastExecution(task)
  const running = isRunning(task)
  const tags = task.tags ?? []

  return (
    <button
      type="button"
      className="dsptb-card"
      data-sel={task.id === selectedId ? 'true' : 'false'}
      data-running={running ? 'true' : 'false'}
      onClick={() => onSelect(task)}
    >
      <span className="dsptb-card-title">{task.title}</span>
      {task.description.length > 0 ? <span className="dsptb-card-desc">{task.description}</span> : null}
      <span className="dsptb-card-meta">
        {rollup.total > 0 ? (
          <span className="dsptb-chip" data-tone={rollup.byStatus.done === rollup.total ? 'ok' : undefined}>
            子任务 {rollup.byStatus.done}/{rollup.total}
          </span>
        ) : null}
        {task.schedule !== undefined ? (
          <span
            className="dsptb-chip"
            data-tone={task.schedule.enabled ? 'brand' : undefined}
            title={task.schedule.enabled ? `定时已启用\n${task.schedule.cron}` : `定时已关（规则还在：${task.schedule.cron}）`}
          >
            {task.schedule.enabled ? '定时' : '定时已关'}
          </span>
        ) : null}
        {task.teamRun === true ? <span className="dsptb-chip" title="这一整个子树按 Agent Team 跑">团队</span> : null}
        {task.goalRun === false ? <span className="dsptb-chip" title="这个任务只跑一轮，不启 /goal">单轮</span> : null}
        {task.executions.length > 0 ? <span>{task.executions.length} 次执行</span> : null}
        {last !== undefined ? (
          <span title={running ? '此刻有人在跑' : `最后一次开始于 ${new Date(last.startedAt).toLocaleString()}`}>
            {running ? '正在跑' : `${shortTime(last.startedAt, now)} 跑过`}
          </span>
        ) : (
          <span>{shortTime(task.createdAt, now)} 建的</span>
        )}
      </span>
      {tags.length > 0 ? (
        <span className="dsptb-card-meta">
          {tags.map(tag => (
            <span className="dsptb-chip" key={tag.name} title={tag.promptPrefix ?? undefined}>
              {tag.name}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  )
}
