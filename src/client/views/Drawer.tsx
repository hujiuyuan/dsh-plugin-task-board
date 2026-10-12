/**
 * 任务详情抽屉。
 *
 * 形态是定过的：**顶部标签栏，主体换页**。（早先是上下堆叠——目标在上、子任务在下、
 * 执行再在下——一屏塞三段，每段都只剩三行。）
 *
 * 第一版这里只有三页：任务目标 / 子任务 / 定时历史。
 * 按设计，`会话` 那一页要把宿主的会话页整个内嵌进来（`conversation.content` 工厂），
 * 那一步单独做——它依赖把我们的注册挂进会话作用域，跟这一版的风险不是一回事。
 * 在它能用之前，「打开会话」按钮先把宿主切到那个会话，别让人对着空白等着。
 */
import { useMemo, useState, type ReactNode } from 'react'
import { STATUS } from '../tokens'
import type { TaskIndex } from '../model'
import { durationOf, humanCron, humanDuration, isRunning, lastExecution, outcomeLabel, rollupOf, shortTime, triggerOf } from '../model'
import type { TaskRecord } from '../types'

type Tab = 'goal' | 'subtasks' | 'schedule'

interface DrawerProps {
  task: TaskRecord
  index: TaskIndex
  now: number
  onClose: () => void
  onNavigate: (task: TaskRecord) => void
  /** 打开某个会话。拿不到通道时返回 false，抽屉会退回到「复制会话 id」。 */
  onOpenSession: (sessionId: string) => boolean
}

export function Drawer({ task, index, now, onClose, onNavigate, onOpenSession }: DrawerProps) {
  const [tab, setTab] = useState<Tab>('goal')
  const rollup = useMemo(() => rollupOf(index, task), [index, task])
  const children = index.childrenOf.get(task.id) ?? []
  const parent = task.parentId === undefined ? undefined : index.byId.get(task.parentId)
  const last = lastExecution(task)
  const running = isRunning(task)
  const sessionId = last?.sessionId
  const [copied, setCopied] = useState(false)

  const openSession = (): void => {
    if (sessionId === undefined) return
    if (onOpenSession(sessionId)) return
    void navigator.clipboard?.writeText(sessionId).then(
      () => setCopied(true),
      () => setCopied(false),
    )
  }

  return (
    <>
      <div className="dsptb-scrim" onClick={onClose} aria-hidden="true" />
      <aside className="dsptb-drawer" role="dialog" aria-label={`任务详情：${task.title}`}>
        <div className="dsptb-dr-head">
          <span className="dsptb-hdot" style={{ background: STATUS[task.status].tone, flex: 'none' }} />
          <h3 title={task.title}>{task.title}</h3>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flex: 'none' }}>
            {sessionId !== undefined ? (
              <button type="button" className="dsptb-btn" onClick={openSession} title={sessionId}>
                {copied ? '会话 id 已复制' : '打开会话'}
              </button>
            ) : null}
            <button type="button" className="dsptb-btn" onClick={onClose} aria-label="关闭">
              关闭
            </button>
          </span>
        </div>

        <div className="dsptb-tabs" role="tablist">
          <TabButton id="goal" current={tab} onPick={setTab}>任务目标</TabButton>
          <TabButton id="subtasks" current={tab} onPick={setTab}>
            子任务{rollup.total > 0 ? ` ${rollup.byStatus.done}/${rollup.total}` : ''}
          </TabButton>
          <TabButton id="schedule" current={tab} onPick={setTab}>
            定时历史{task.executions.length > 0 ? ` ${task.executions.length}` : ''}
          </TabButton>
        </div>

        <div className="dsptb-dr-body">
          {tab === 'goal' ? (
            <>
              {parent !== undefined ? (
                <div className="dsptb-note">
                  这是子任务，属于{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate(parent)}
                    style={{ textDecoration: 'underline', color: 'var(--tb-business)' }}
                  >
                    {parent.title}
                  </button>
                  （{STATUS[parent.status].label}）
                </div>
              ) : null}

              <div className="dsptb-field">
                <b>状态</b>
                {/* 跑着的时候不重复说一遍「有执行者」——那两句话是一个意思 */}
                <p>
                  {STATUS[task.status].label} ·{' '}
                  {running && last !== undefined
                    ? `已跑 ${humanDuration(now - last.startedAt)}`
                    : STATUS[task.status].desc}
                </p>
              </div>

              {task.description.length > 0 ? (
                <div className="dsptb-field">
                  <b>说明</b>
                  <p>{task.description}</p>
                </div>
              ) : null}

              {task.prompt.length > 0 ? (
                <div className="dsptb-field">
                  <b>执行时会发给 DSH 的 prompt</b>
                  <pre>{task.prompt}</pre>
                </div>
              ) : null}

              {(task.tags ?? []).length > 0 ? (
                <div className="dsptb-field">
                  <b>标签</b>
                  <p style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(task.tags ?? []).map(tag => (
                      <span className="dsptb-chip" key={tag.name} title={tag.promptPrefix ?? '只是显示用的标签'}>
                        {tag.name}
                        {tag.promptPrefix !== undefined ? ' ⚑' : ''}
                      </span>
                    ))}
                  </p>
                </div>
              ) : null}

              <div className="dsptb-field">
                <b>怎么跑</b>
                <p>
                  {[
                    task.mode !== undefined ? `预设 ${task.mode}` : undefined,
                    task.model !== undefined ? `模型 ${task.model}` : undefined,
                    task.permission !== undefined ? `权限 ${task.permission}` : undefined,
                    task.reuseSession === true ? '复用上一个会话' : undefined,
                    task.teamRun === true ? '按 Agent Team 跑整个子树' : undefined,
                    task.goalRun === false ? '只跑一轮（不启 /goal）' : undefined,
                  ]
                    .filter((part): part is string => part !== undefined)
                    .join(' · ') || '全部走宿主默认'}
                </p>
              </div>

              <div className="dsptb-field">
                <b>时间</b>
                <p>
                  建于 {new Date(task.createdAt).toLocaleString()} · 最后动过{' '}
                  {new Date(task.updatedAt).toLocaleString()}
                </p>
              </div>

              {task.integrations === undefined ? null : (
                <div className="dsptb-field">
                  <b>别的插件挂在这张卡上的数据</b>
                  <p>{Object.keys(task.integrations).join(' · ')}</p>
                </div>
              )}
            </>
          ) : null}

          {tab === 'subtasks' ? (
            children.length === 0 ? (
              <p className="dsptb-empty">这张卡下面没有子任务</p>
            ) : (
              <div className="dsptb-tree">
                {subtreeRows(task, index).map(row => (
                  <button
                    key={row.task.id}
                    type="button"
                    className="dsptb-tree-row"
                    style={{ paddingLeft: 6 + row.depth * 16 }}
                    onClick={() => onNavigate(row.task)}
                    title={row.task.title}
                  >
                    <span
                      className="dsptb-hdot"
                      style={{ background: STATUS[row.task.status].tone, flex: 'none' }}
                      aria-hidden="true"
                    />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.task.title}
                    </span>
                    <span className="dsptb-chip" data-tone={row.task.status === 'failed' ? 'err' : undefined}>
                      {STATUS[row.task.status].label}
                    </span>
                    {row.task.executions.length > 0 ? (
                      <span style={{ color: 'var(--tb-fg-3)', fontSize: 11 }}>{row.task.executions.length} 次</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )
          ) : null}

          {tab === 'schedule' ? (
            <>
              <div className="dsptb-field">
                <b>定时规则</b>
                {task.schedule === undefined ? (
                  <p>这张卡没有定时规则</p>
                ) : (
                  <p>
                    {task.schedule.enabled ? '已启用' : '已关掉（规则还留着）'} · {humanCron(task.schedule.cron)}
                    {task.schedule.timeZone !== undefined ? ` · ${task.schedule.timeZone}` : ''}
                    {task.schedule.nextRunAt !== undefined
                      ? ` · 下次 ${new Date(task.schedule.nextRunAt).toLocaleString()}`
                      : ''}
                    {task.schedule.lastTriggeredAt !== undefined
                      ? ` · 上次触发 ${new Date(task.schedule.lastTriggeredAt).toLocaleString()}`
                      : ''}
                  </p>
                )}
              </div>

              <div className="dsptb-field">
                <b>执行历史（新的在前）</b>
                {task.executions.length === 0 ? (
                  <p>这个任务还没跑过</p>
                ) : (
                  <div>
                    {task.executions
                      .slice()
                      .reverse()
                      .map(execution => {
                        const scheduled = triggerOf(execution) === 'schedule'
                        const open = execution.endedAt === undefined
                        return (
                          <div className="dsptb-srow" key={execution.id}>
                            <span className="when" title={new Date(execution.startedAt).toLocaleString()}>
                              {shortTime(execution.startedAt, now)}
                            </span>
                            <span
                              className="dsptb-chip"
                              data-tone={scheduled ? 'brand' : undefined}
                              title={scheduled ? '这次没有发起会话，按来源推断是定时触发的' : `由会话 ${execution.initiatedBy} 发起`}
                            >
                              {scheduled ? '定时' : '手动'}
                            </span>
                            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={execution.error ?? undefined}>
                              {open ? '正在跑…' : (execution.error ?? outcomeLabel(execution))}
                            </span>
                            <span className="dur">{humanDuration(durationOf(execution, now))}</span>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>

              <p className="dsptb-note">
                「定时 / 手动」是<strong>推断</strong>不是记录：账本里只写了「是谁发起的」，定时触发的那一刻
                没有发起会话，所以没有发起者。这一条不写进任何统计。
              </p>
            </>
          ) : null}
        </div>
      </aside>
    </>
  )
}

function TabButton({
  id,
  current,
  onPick,
  children,
}: {
  id: Tab
  current: Tab
  onPick: (next: Tab) => void
  children: ReactNode
}) {
  return (
    <button type="button" role="tab" aria-selected={current === id} onClick={() => onPick(id)}>
      {children}
    </button>
  )
}

/** 一个任务的整棵子树，按深度铺平——抽屉里只做导航，不做折叠。 */
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
