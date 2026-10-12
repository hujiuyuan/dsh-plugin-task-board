/**
 * 任务详情抽屉。
 *
 * 形态是定过的：**顶部标签栏，主体换页**（早先是上下堆叠，一屏塞三段，每段只剩三行）。
 *
 * 这一版有四个页：会话 / 任务目标 / 子任务 / 定时历史。
 * 「子代理会话」那一页还没做——它要读宿主的子代理树，跟「会话」页的内嵌是同一批事，
 * 一起做（见 README 的已知缺口）。
 */
import { useEffect, useMemo, useState } from 'react'
import { STATUS, hueOf } from '../tokens'
import type { TaskIndex } from '../model'
import { durationOf, humanCron, humanDuration, isRunning, lastExecution, outcomeLabel, rollupOf, shortTime, spanEnd, triggerOf } from '../model'
import type { TaskRecord } from '../types'
import type { WorkspaceIndex } from '../workspaces'
import { IconClock } from './controls'

type Tab = 'conversation' | 'goal' | 'subtasks' | 'schedule'

interface DrawerProps {
  task: TaskRecord
  index: TaskIndex
  now: number
  workspaces: WorkspaceIndex
  onClose: () => void
  onNavigate: (task: TaskRecord) => void
  /** 打开会话页。拿不到通道时返回 false，抽屉退回到「复制会话 id」。 */
  onOpenSession: (sessionId: string) => boolean
}

export function Drawer({ task, index, now, workspaces, onClose, onNavigate, onOpenSession }: DrawerProps) {
  const [tab, setTab] = useState<Tab>('conversation')
  const [copied, setCopied] = useState(false)

  // 换一张卡时回到第一页 —— 由外层 `key={task.id}` 重挂实现，见 Panel。
  // 用 effect 重置的话会先按旧页渲染一帧再跳，看得见闪。

  // Esc 关抽屉。这是所有浮层的默认期待，缺了会让人下意识多按几次。
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const rollup = useMemo(() => rollupOf(index, task), [index, task])
  const children = index.childrenOf.get(task.id) ?? []
  const parent = task.parentId === undefined ? undefined : index.byId.get(task.parentId)
  const last = lastExecution(task)
  const running = isRunning(task)

  // 换任务时，如果新任务没有那一页的内容，退回会话页——停在空白页上会让人以为坏了
  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'conversation', label: '会话' },
    { id: 'goal', label: '任务目标' },
    { id: 'subtasks', label: '子任务', count: rollup.total },
    { id: 'schedule', label: '定时历史', count: task.executions.length },
  ]
  const active = tabs.find(item => item.id === tab)!

  const openSession = (): void => {
    if (last?.sessionId === undefined) return
    if (onOpenSession(last.sessionId)) return
    void navigator.clipboard?.writeText(last.sessionId).then(() => setCopied(true), () => setCopied(false))
  }

  return (
    <>
      <div className="mask open" onClick={onClose} aria-hidden="true" />
      <aside className="drawer open" aria-label="任务详情">
        {parent !== undefined ? (
          <div className="d-back">
            <button type="button" onClick={() => onNavigate(parent)}>
              <span className="arw" aria-hidden="true">←</span>
              <span className="bl">返回</span>
              <span className="bt">{parent.title}</span>
            </button>
          </div>
        ) : null}

        <div className="drawer-head">
          <h2>
            {task.title}
            <span className="mono" style={{ color: 'var(--label-tertiary)', fontWeight: 400 }}> · {task.id}</span>
          </h2>
          <span className="st" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--label-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS[task.status].css }} aria-hidden="true" />
            {STATUS[task.status].label}
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className="drawer-tabs" role="tablist">
          {tabs.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              className={`dtab${item.count === 0 ? ' dtab-off' : ''}`}
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.count !== undefined && item.count > 0 ? <span className="n">{item.count}</span> : null}
            </button>
          ))}
        </div>

        <div className="drawer-body d-pane">
          {tab === 'conversation' ? (
            <div className="d-conv">
              <div className="d-sec">
                <h3>会话</h3>
                {last?.sessionId === undefined ? (
                  <p className="d-empty">这个任务还没跑过，还没有会话。</p>
                ) : (
                  <>
                    <div className="d-kv">
                      <div className="row"><span className="k">会话</span><span className="v mono">{last.sessionId}</span></div>
                      <div className="row"><span className="k">开始</span><span className="v">{new Date(last.startedAt).toLocaleString()}</span></div>
                      <div className="row"><span className="k">现状</span><span className="v">{running ? `正在跑，已跑 ${humanDuration(now - last.startedAt)}` : `${outcomeLabel(last)} · 耗时 ${humanDuration(durationOf(last, now))}`}</span></div>
                    </div>
                    <p className="view-note" style={{ marginTop: 10 }}>
                      真实的会话内容还没内嵌进来（要把宿主的会话页搬进这个抽屉）。
                      现在点下面的按钮先把宿主切到那个会话。
                    </p>
                    <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={openSession}>
                      {copied ? '会话 id 已复制' : '打开会话'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {tab === 'goal' ? (
            <>
              <div className="d-sec">
                <h3>说明</h3>
                {task.description.length > 0 ? (
                  <p style={{ fontSize: 14, lineHeight: 1.65 }}>{task.description}</p>
                ) : (
                  <p className="d-empty" style={{ fontSize: 12 }}>这张卡没有填说明</p>
                )}
                {task.prompt.length > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <p className="view-note" style={{ marginBottom: 6 }}>执行时会发给 DSH 的 prompt</p>
                    <pre className="d-pre">{task.prompt}</pre>
                  </div>
                ) : null}
              </div>

              <div className="d-sec">
                <h3>更多信息</h3>
                <div className="d-kv">
                  <div className="row">
                    <span className="k">工作区</span>
                    <span className="v">
                      <span
                        className="wdot"
                        style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', marginRight: 6, ['--hue' as string]: String(hueOf(task.workspaceId ?? '')) }}
                        aria-hidden="true"
                      />
                      {workspaces.nameOf(task.workspaceId)}
                      {workspaces.pathOf(task.workspaceId) !== undefined ? (
                        <div className="mono" style={{ fontSize: 11, color: 'var(--label-tertiary)' }}>{workspaces.pathOf(task.workspaceId)}</div>
                      ) : null}
                    </span>
                  </div>
                  <div className="row"><span className="k">创建</span><span className="v">{new Date(task.createdAt).toLocaleString()}</span></div>
                  <div className="row"><span className="k">更新</span><span className="v">{new Date(task.updatedAt).toLocaleString()}</span></div>
                  {task.status === 'done' || task.status === 'failed' ? (
                    <div className="row"><span className="k">结算</span><span className="v">{new Date(spanEnd(task, now)).toLocaleString()}</span></div>
                  ) : null}
                  {(task.tags ?? []).length > 0 ? (
                    <div className="row">
                      <span className="k">标签</span>
                      <span className="v" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(task.tags ?? []).map(tag => (
                          <span
                            key={tag.name}
                            className="badge"
                            style={{ ['--hue' as string]: String(hueOf(tag.name)) }}
                            title={tag.promptPrefix === undefined ? '只是显示用的标签' : `会把这个前缀拼到 prompt 前面：${tag.promptPrefix}`}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </span>
                    </div>
                  ) : null}
                  <div className="row">
                    <span className="k">执行</span>
                    <span className="v">
                      {[
                        task.mode !== undefined ? `预设 ${task.mode}` : undefined,
                        task.model !== undefined ? `模型 ${task.model}` : undefined,
                        task.permission !== undefined ? `权限 ${task.permission}` : undefined,
                        task.reuseSession === true ? '复用上一个会话' : undefined,
                        task.teamRun === true ? '按 Agent Team 跑整个子树' : undefined,
                        task.goalRun === false ? '只跑一轮（不启 /goal）' : undefined,
                      ].filter((part): part is string => part !== undefined).join(' · ') || '全部走宿主默认'}
                    </span>
                  </div>
                </div>
              </div>

              {task.schedule !== undefined ? (
                <div className="d-sec">
                  <h3>排期</h3>
                  <div className="d-kv">
                    <div className="row">
                      <span className="k">状态</span>
                      <span className="v" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <IconClock filled={task.schedule.enabled} />
                        {task.schedule.enabled ? '已启用' : '未启用'} · {humanCron(task.schedule.cron)}
                        {task.schedule.timeZone !== undefined ? ` · ${task.schedule.timeZone}` : ''}
                      </span>
                    </div>
                    <div className="row">
                      <span className="k">下次</span>
                      <span className="v">{task.schedule.nextRunAt === undefined ? '—' : new Date(task.schedule.nextRunAt).toLocaleString()}</span>
                    </div>
                    <div className="row">
                      <span className="k">上次触发</span>
                      <span className="v">{task.schedule.lastTriggeredAt === undefined ? '还没有触发过' : new Date(task.schedule.lastTriggeredAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="view-note" style={{ marginTop: 8 }}>
                    排期在这一版是只读的：改排期要写账本，而写只能走任务看板的公开契约。
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          {tab === 'subtasks' ? (
            <div className="d-sec">
              {children.length === 0 ? (
                <p className="d-empty">这个任务没有子任务</p>
              ) : (
                <>
                  <div className="d-sec-head">
                    <h3>子任务 {rollup.total} 个 · 完成 {rollup.byStatus.done}</h3>
                  </div>
                  <div className="d-sub">
                    {subtreeRows(task, index).map(row => {
                      const st = STATUS[row.task.status]
                      return (
                        <button
                          key={row.task.id}
                          type="button"
                          className="item"
                          style={{ marginLeft: row.depth * 16 }}
                          title={`${st.label} · ${row.task.executions.length} 次会话 · 打开「${row.task.title}」`}
                          onClick={() => onNavigate(row.task)}
                        >
                          <span className="dot" style={{ background: st.css }} aria-hidden="true" />
                          <span className="ttl">{row.task.title}</span>
                          <span className="sid">
                            {settledNote(row.task, now)} · {row.task.executions.length === 0 ? '没有会话' : `${row.task.executions.length} 次会话`}
                          </span>
                          <span className="chev" aria-hidden="true">›</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : null}

          {tab === 'schedule' ? (
            <div className="d-sec">
              {task.executions.length === 0 ? (
                <>
                  <p className="d-empty">这个任务还没跑过，一次历史都没有。</p>
                  {task.schedule !== undefined ? (
                    <p className="view-note" style={{ marginTop: 8 }}>
                      排期是排上了、还没到触发的时候——跑完第一次，这里就会有记录。
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="d-sec-head">
                    <h3>定时历史 {task.executions.length} 次</h3>
                    <span className="view-note" style={{ marginLeft: 'auto' }}>最新在上</span>
                  </div>
                  {/* 倒序显示，但「第 N 次」用的是真实次序，不跟着倒序变 */}
                  <div className="d-exlist">
                    {task.executions.slice().reverse().map((execution, offset) => {
                      const ordinal = task.executions.length - offset
                      const scheduled = triggerOf(execution) === 'schedule'
                      const open = execution.endedAt === undefined
                      const tone = open
                        ? 'var(--state-warn)'
                        : execution.result === 'succeeded'
                          ? 'var(--state-success)'
                          : execution.result === 'failed'
                            ? 'var(--state-error)'
                            : 'var(--label-tertiary)'
                      return (
                        <div className="d-ex" key={execution.id}>
                          <div className="r1" title={`第 ${ordinal} 次 · 开始 ${new Date(execution.startedAt).toLocaleString()}${execution.endedAt === undefined ? ' / 还在跑' : ` · 结束 ${new Date(execution.endedAt).toLocaleString()}`}`}>
                            <span className="ord">第 {ordinal} 次</span>
                            <span className="dot" style={{ background: tone }} aria-hidden="true" />
                            <span className="when">{shortTime(execution.startedAt, now)}</span>
                            <span className="res" style={{ color: tone }}>{open ? '运行中' : outcomeLabel(execution)}</span>
                            <span className="dur">{open ? `已运行 ${humanDuration(now - execution.startedAt)}` : humanDuration(durationOf(execution, now))}</span>
                            <span className="trig">{scheduled ? '定时' : '手动'}</span>
                            {execution.sessionId !== undefined ? (
                              <button type="button" className="sid" title={`打开会话 ${execution.sessionId}`} onClick={() => onOpenSession(execution.sessionId!)}>
                                {execution.sessionId}
                              </button>
                            ) : null}
                          </div>
                          {execution.error !== undefined ? <div className="esub mono" title={execution.error}>{execution.error}</div> : null}
                        </div>
                      )
                    })}
                  </div>
                  <p className="view-note" style={{ marginTop: 10 }}>
                    「定时 / 手动」是<strong>推断</strong>不是记录：账本里只写了「是谁发起的」，
                    定时触发的那一刻没有发起会话，所以没有发起者。
                  </p>
                </>
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}

/**
 * 子任务行右边那一小截尾注。
 * 跑完了写「结算 10-11」，还没跑完写状态名 —— 一个已经结束的子任务只写
 * 「2 次会话」，看不出它是哪天收的。
 */
function settledNote(task: TaskRecord, now: number): string {
  if (task.status !== 'done' && task.status !== 'failed') return STATUS[task.status].label
  return `结算 ${shortTime(spanEnd(task, now), now)}`
}

function subtreeRows(root: TaskRecord, index: TaskIndex): Array<{ task: TaskRecord; depth: number }> {
  const out: Array<{ task: TaskRecord; depth: number }> = []
  const walk = (task: TaskRecord, depth: number): void => {
    for (const child of index.childrenOf.get(task.id) ?? []) {
      out.push({ task: child, depth })
      walk(child, depth + 1)
    }
  }
  walk(root, 0)
  return out
}
