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
import type { Intent, Override } from '../derive'
import { PRIORITY_LABEL } from '../derive'
import { EmbeddedConversation, type SlotKit } from '../embed'
import type { Enrichment } from '../enrich'
import type { TaskIndex } from '../model'
import { durationOf, humanCron, humanDuration, isRunning, lastExecution, modeOf, outcomeLabel, planOf, rollupOf, runBudgetOf, shortTime, spanEnd, stopReasonOf, triggerOf } from '../model'
import type { Transcript } from '../session'
import type { TaskRecord } from '../types'
import type { WorkspaceIndex } from '../workspaces'
import type { BoardWrite, SchedulePatch } from '../write'
import { writeSchedule } from '../write'
import { FieldBlock, IconClock, SourceTag } from './controls'

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
  /** 四条推出来的意图字段 + 它们的来源与改动。 */
  intent: Intent
  enrichment: Enrichment
  /** 写入口。没有时「编辑」按钮禁用，原因写在按钮上。 */
  write: BoardWrite
  onEdit: () => void
  /**
   * 排期能不能改。走的是任务看板自己的 action 通道，**跟 `write` 不是一条路**
   * （见 `write.ts` 顶上那段），所以是单独一个信号。
   */
  canSchedule: boolean
  /** 排期改成功了。外层拿它弹一句 toast。 */
  onScheduled: (message: string) => void
  /** 最近一次执行的会话内容。 */
  transcript: Transcript
  /** 同一份内容，掐好长度给模型用。没有会话时是 undefined。 */
  transcriptText?: string
  /** 座位给的 kit props —— 嵌宿主会话页要靠它。 */
  kit: SlotKit
  ctx: any
}

/** 这个任务该用哪个模型：它自己绑的优先，没绑就用页面上选中的那个。 */
function modelFor(task: TaskRecord, fallback: string | null): string | null {
  return task.model !== undefined && task.model.length > 0 ? task.model : fallback
}

export function Drawer({ task, index, now, workspaces, onClose, onNavigate, onOpenSession, intent, enrichment, write, onEdit, canSchedule, onScheduled, transcript, transcriptText, kit, ctx }: DrawerProps) {
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
  /**
   * 这一行是「没有任务卡的会话」，不是账本里的卡。
   *
   * 它只剩「会话」那一页 —— 另外三页的内容（目标 / 子任务 / 执行历史）
   * 全都来自账本字段，会话一个都没有。留着它们是三个空页，
   * 点进去只会让人以为数据没读到。
   */
  const sessionId = task.fromSession
  const isSession = sessionId !== undefined

  const tabs: Array<{ id: Tab; label: string; count?: number }> = isSession
    ? [{ id: 'conversation', label: '会话' }]
    : [
        { id: 'conversation', label: '会话' },
        { id: 'goal', label: '任务目标' },
        { id: 'subtasks', label: '子任务', count: rollup.total },
        { id: 'schedule', label: '定时历史', count: task.executions.length },
      ]
  const active = tabs.find(item => item.id === tab) ?? tabs[0]

  /**
   * 能不能把宿主的会话页嵌进来。两个 kit prop 缺一个都不行 ——
   * 它们在宿主那里是**有条件发放**的（`SessionProvider` 只在我们声明了
   * session 子座位时才给），所以缺了不是异常，是「这个外壳组合没给」。
   */
  const canEmbed = typeof kit.renderFactorySlot === 'function' && typeof kit.SessionProvider === 'function'

  /** 要打开哪个会话：会话行是自己的那个，任务卡是最近一次执行的那个。 */
  const openId = isSession ? sessionId : last?.sessionId

  const openSession = (): void => {
    if (openId === undefined) return
    if (onOpenSession(openId)) return
    void navigator.clipboard?.writeText(openId).then(() => setCopied(true), () => setCopied(false))
  }

  /**
   * 标题上那个悬停气泡里的内容。
   *
   * 这些字原来占着抽屉正文一整块，可它们是**关于这个任务的静态事实**，
   * 不是内容 —— 每开一次抽屉都要从它们上面划过去才够得到聊天区。挪到气泡里，
   * 想看的人悬停一下就有，不想看的人一次都不用划。
   */
  const headTip = (isSession
    ? [
        `会话 ${sessionId}`,
        `最后活动 ${new Date(task.updatedAt).toLocaleString()}`,
        task.status === 'running' ? '正在跑' : '已经停下',
        '这一行是没有任务卡的会话：它没有账本，改不了，也不会有执行记录',
      ]
    : [
        `${task.title}`,
        `${task.id} · ${workspaces.nameOf(task.workspaceId)} · ${STATUS[task.status].label}`,
        openId === undefined ? '这个任务还没跑过，还没有会话' : `会话 ${openId}`,
        openId === undefined ? undefined : `开始 ${new Date(last!.startedAt).toLocaleString()}`,
        openId === undefined
          ? undefined
          : running
            ? `正在跑，已跑 ${humanDuration(now - last!.startedAt)}`
            : `${outcomeLabel(last!)} · 耗时 ${humanDuration(durationOf(last!, now))}`,
        task.description.length > 0 ? task.description : undefined,
      ]
  ).filter((line): line is string => line !== undefined).join('\n')

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
          <h2 title={headTip}>
            {task.title}
            <span className="mono" style={{ color: 'var(--label-tertiary)', fontWeight: 400 }}>
              {isSession ? ' · 会话' : ` · ${task.id}`}
            </span>
          </h2>
          <span className="st" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--label-secondary)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS[task.status].css }} aria-hidden="true" />
            {STATUS[task.status].label}
          </span>
          {/* 会话行没有账本，编辑按钮不是禁用而是根本不出现 ——
              灰着还留个位置，等于每次都在提醒「这里少了点什么」 */}
          {isSession ? null : (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!write.ready}
              title={write.ready
                ? '改标题 / 说明 / 执行提示，或者换一列'
                : `编辑要走任务看板的写入契约，但现在走不通：${write.why ?? '未知原因'}`}
              onClick={onEdit}
            >
              编辑
            </button>
          )}
          {openId === undefined ? null : (
            <button
              type="button"
              className="btn btn-secondary"
              title={copied ? '会话 id 已复制到剪贴板' : `在宿主的会话页里打开：${openId}`}
              onClick={openSession}
            >
              {copied ? '已复制' : '打开会话'}
            </button>
          )}
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

        <div className={`drawer-body d-pane${tab === 'conversation' ? ' is-conv' : ''}`}>
          {tab === 'conversation' ? (
            <div className="d-conv">
              {/*
                这一整块不再有「会话 id / 开始 / 现状」那三行 —— 它们进了标题上的气泡。
                留着的话，每开一次抽屉都要先划过一段静态事实才够得到聊天区，
                而这个抽屉存在的理由正是把聊天区放大。
              */}
              {openId === undefined ? (
                <p className="d-empty" style={{ padding: '14px 16px' }}>这个任务还没跑过，还没有会话。</p>
              ) : canEmbed ? (
                <EmbeddedConversation
                  ctx={ctx}
                  sessionId={openId}
                  kit={kit}
                  available={canEmbed}
                  fallback={why => (
                    <div className="d-sec">
                      <div className="d-sec-head">
                        <h3>这次跑了什么</h3>
                        <span className="view-note" style={{ marginLeft: 'auto' }}>只读，不是宿主的会话页</span>
                      </div>
                      {/* 嵌不进来说清为什么，别让人以为是我们不想做 */}
                      <p className="view-note" style={{ marginBottom: 8 }}>{why}，下面是本插件自己读的只读记录。</p>
                      <TranscriptView transcript={transcript} />
                    </div>
                  )}
                />
              ) : (
                <div className="d-sec">
                  <div className="d-sec-head">
                    <h3>这次跑了什么</h3>
                    <span className="view-note" style={{ marginLeft: 'auto' }}>只读，不是宿主的会话页</span>
                  </div>
                  <p className="view-note" style={{ marginBottom: 8 }}>
                    这个部署没给到渲染会话页需要的东西（座位的 kit props），下面是本插件自己读的只读记录。
                  </p>
                  <TranscriptView transcript={transcript} />
                </div>
              )}
            </div>
          ) : null}

          {tab === 'goal' ? (
            <>
              <IntentPane task={task} intent={intent} enrichment={enrichment} transcriptText={transcriptText} />

              <div className="d-sec">
                <h3>账本原文</h3>
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

              <ScheduleSection task={task} canWrite={canSchedule} onChanged={onScheduled} />
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
                      // 「会话」那一页显示的就是最近这一次 —— 在这一列里把它标出来，
                      // 两个页对得上，用户不用自己数「哪个才是刚才看的那个」
                      const current = last !== undefined && execution.id === last.id
                      return (
                        <div className={`d-ex${current ? ' on' : ''}`} key={execution.id}>
                          <div className="r1" title={`第 ${ordinal} 次 · 开始 ${new Date(execution.startedAt).toLocaleString()}${execution.endedAt === undefined ? ' / 还在跑' : ` · 结束 ${new Date(execution.endedAt).toLocaleString()}`}${current ? '（「会话」那一页显示的就是这一次）' : ''}`}>
                            <span className="ord">第 {ordinal} 次</span>
                            {current ? <span className="cur-mark" aria-label="当前查看的这一次">当前</span> : null}
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
 * 「任务目标」这一页的主体：目标 / 场景 / 背景 / 验收四条，外加源头那条说明。
 *
 * 这一页原来的样子是「说明 + prompt 原文」——两段账本原文，用户看一眼就知道
 * 这个任务是什么，但**看不出它要达成什么**。原型里那四条（目标/场景/背景/验收）
 * 对应的正是「一眼看出」这件事，而真实账本里一条都没有。
 *
 * 这里的做法是把它们**推出来**，并且逐条标出处。原件（说明和 prompt 原文）
 * 一个字不删，挪到下面「账本原文」里——推出来的东西永远不能盖掉原始记录。
 */
function IntentPane({ task, intent, enrichment, transcriptText }: { task: TaskRecord; intent: Intent; enrichment: Enrichment; transcriptText?: string }) {
  const [open, setOpen] = useState(true)
  const busy = enrichment.running.includes(task.id)
  const model = modelFor(task, enrichment.model)
  const edited = enrichment.overrides[task.id] ?? {}

  const save = (patch: Partial<Override>): void => {
    const next = { ...edited, ...patch }
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === '') delete (next as Record<string, unknown>)[key]
    }
    void enrichment.save(task.id, next)
  }

  return (
    <div className="d-sec">
      <div className="d-sec-head">
        <h3>任务目标</h3>
        <span className="view-note" style={{ marginLeft: 'auto' }}>
          {model === null ? '没找到可用的模型' : `模型：${model}`}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy || model === null}
          title={model === null
            ? '这个部署问不出模型路由（宿主的 llm 服务没接上，或者模型目录为空）。下面四条仍然按账本推出来。'
            : '让模型重读这张卡的标题、说明、执行提示、执行记录和会话内容，重新归纳四条。'}
          onClick={() => void enrichment.run([task], { force: true, ...(transcriptText === undefined ? {} : { transcript: transcriptText }) })}
        >
          {busy ? '归纳中…' : enrichment.ai[task.id] === undefined ? '用模型补全' : '重新归纳'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(value => !value)}>
          {open ? '收起' : '展开'}
        </button>
      </div>

      {enrichment.error !== null && enrichment.running.length === 0 ? (
        <p className="fb-error">
          模型那条路没走通（{enrichment.error.reason}）：{enrichment.error.detail}
          <br />
          <span className="thin">下面四条是按账本推的，不受影响。</span>
        </p>
      ) : null}

      {open ? (
        <>
          <FieldBlock
            label="目标"
            field={intent.goal}
            hint="这个任务要达成什么"
            onSave={next => save({ goal: next })}
          />
          <FieldBlock
            label="使用场景"
            field={intent.scenario}
            hint="什么时候会跑它"
            onSave={next => save({ scenario: next })}
          />
          <FieldBlock
            label="背景"
            field={intent.background}
            hint="这件事是怎么来的"
            onSave={next => save({ background: next })}
          />

          <div className="fblock">
            <div className="fb-head">
              <span className="k">验收</span>
              <SourceTag
                source={intent.acceptance[0]?.source ?? 'derived'}
                why="条目本身来自账本里的执行记录，勾没勾是人的判断"
              />
              <span className="fb-hint">凭哪些事实算它做完了</span>
            </div>
            <ul className="acc-list">
              {intent.acceptance.map(item => {
                const done = (edited.acceptanceDone ?? []).includes(item.id)
                return (
                  <li key={item.id} className={done ? 'done' : undefined}>
                    <label>
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => {
                          const current = edited.acceptanceDone ?? []
                          save({ acceptanceDone: done ? current.filter(id => id !== item.id) : [...current, item.id] })
                        }}
                      />
                      <span>{item.value}</span>
                    </label>
                    <SourceTag source={item.source} why={item.why} />
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="fblock">
            <div className="fb-head">
              <span className="k">优先级</span>
              <SourceTag source={intent.priority.source} why={intent.priority.why} />
            </div>
            <span className="prio-row">
              {(['urgent', 'high', 'medium', 'low'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  className={`prio p-${level}${intent.priority.level === level ? ' on' : ''}`}
                  aria-pressed={intent.priority.level === level}
                  onClick={() => save({ priority: level === intent.priority.level && edited.priority === level ? undefined : level })}
                >
                  {PRIORITY_LABEL[level]}
                </button>
              ))}
            </span>
          </div>

          <p className="view-note" style={{ marginTop: 10 }}>
            这四条账本里都没有，是推出来的：<b>「按账本推的」</b>每一句都能在下面「账本原文」里找到出处，
            <b>「模型归纳」</b>是模型读素材写的、可能不准，<b>「你改的」</b>优先于前两者、模型重跑也盖不掉。
            {enrichment.saveError !== null ? ` 改动存不下：${enrichment.saveError}` : ''}
          </p>
        </>
      ) : null}
    </div>
  )
}

/** 常见的五种 cron 写法。预设只是常用写法，不是全部 —— 认不出的一律留给手填。 */
const CRON_PRESETS: ReadonlyArray<{ label: string; cron: string }> = [
  { label: '每小时', cron: '0 * * * *' },
  { label: '每天 9 点', cron: '0 9 * * *' },
  { label: '每周一 9 点', cron: '0 9 * * 1' },
  { label: '每月 1 号 9 点', cron: '0 9 1 * *' },
  { label: '每 15 分钟', cron: '*/15 * * * *' },
]

/**
 * 排期。**这一块是真能改的**，不是摆一排点不动的控件。
 *
 * 改的动作走任务看板自己的同源 action 通道（见 `write.ts` 里 `writeSchedule`
 * 上面那段：看板交给第三方扩展的能力面上没有排期，只有那条通道有）。所以
 * 「改了能不能成」由看板说了算，我们**不做本地预判** —— 它拒绝时把它自己的
 * 原话显示出来，它对那条规则知道得比我们多。
 *
 * 这里也**不做乐观更新**：改完等看板的新快照回来，界面自然跟着变。自己先改一下
 * 再被事实推翻，看起来就像插件在抽风（跟看板拖拽同一个道理）。
 */
function ScheduleSection({ task, canWrite, onChanged }: {
  task: TaskRecord
  /** 能不能写。不能时控件全灰，原因写在每一件的 title 上。 */
  canWrite: boolean
  /** 改成功之后叫一声，让外层弹 toast。 */
  onChanged: (message: string) => void
}) {
  const schedule = task.schedule
  const [draft, setDraft] = useState(() => (schedule !== undefined && modeOf(schedule) === 'cron' ? schedule.cron ?? '' : ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (patch: SchedulePatch): Promise<void> => {
    setBusy(true)
    setError(null)
    const result = await writeSchedule(task.id, patch)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onChanged(`「${task.title}」的排期改好了`)
  }

  // 没排期的卡也能**开一条**出来 —— 「这个任务我想让它每天跑」是很自然的下一个念头，
  // 以前要去任务看板里才能做到
  if (schedule === undefined) {
    return (
      <div className="d-sec">
        <h3>排期</h3>
        <p className="d-empty" style={{ marginBottom: 10 }}>这张卡还没有排期，到点不会自己跑。</p>
        <ScheduleControls
          busy={busy}
          canWrite={canWrite}
          error={error}
          currentCron={undefined}
          draft={draft}
          onDraft={setDraft}
          enabled={false}
          onSubmit={patch => void submit(patch)}
        />
      </div>
    )
  }

  const plan = planOf(schedule)
  const stop = stopReasonOf(schedule.endedReason)
  const skipped = stopReasonOf(schedule.skippedReason)

  return (
    <div className="d-sec">
      <h3>排期</h3>
      <div className="d-kv">
        <div className="row">
          <span className="k">状态</span>
          <span className="v" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconClock filled={schedule.enabled} />
            {schedule.enabled ? '已启用' : '未启用'} · {plan}
            {schedule.timeZone !== undefined ? ` · ${schedule.timeZone}` : ''}
          </span>
        </div>
        <div className="row">
          <span className="k">下次</span>
          <span className="v">{schedule.nextRunAt === undefined ? '—' : new Date(schedule.nextRunAt).toLocaleString()}</span>
        </div>
        <div className="row">
          <span className="k">上次触发</span>
          <span className="v">{schedule.lastTriggeredAt === undefined ? '还没有触发过' : new Date(schedule.lastTriggeredAt).toLocaleString()}</span>
        </div>
        <div className="row">
          <span className="k">已跑</span>
          <span className="v">{runBudgetOf(schedule)}{modeOf(schedule) === 'once' ? '' : '（手动跑的另算）'}</span>
        </div>
        {stop === undefined ? null : <div className="row"><span className="k">已停</span><span className="v">{stop}</span></div>}
        {skipped === undefined ? null : (
          <div className="row">
            <span className="k">跳过</span>
            <span className="v" style={{ color: 'var(--warn-fg)' }}>{skipped}</span>
          </div>
        )}
      </div>

      <ScheduleControls
        busy={busy}
        canWrite={canWrite}
        error={error}
        currentCron={modeOf(schedule) === 'cron' ? schedule.cron : undefined}
        draft={draft}
        onDraft={setDraft}
        enabled={schedule.enabled}
        onSubmit={patch => void submit(patch)}
      />
    </div>
  )
}

/**
 * 排期的控件本体。**有规则和没规则两种情况下长得一样** —— 分开写两套只会让
 * 两边慢慢长歪，而它们本来就该是同一排东西。
 */
function ScheduleControls({ busy, canWrite, error, currentCron, draft, onDraft, enabled, onSubmit }: {
  busy: boolean
  canWrite: boolean
  error: string | null
  currentCron: string | undefined
  draft: string
  onDraft: (next: string) => void
  enabled: boolean
  onSubmit: (patch: SchedulePatch) => void
}) {
  const why = '排期要走任务看板自己的写入通道，但现在走不通 —— 去任务看板里直接改'
  const off = !canWrite || busy
  const matchesPreset = CRON_PRESETS.find(item => item.cron === currentCron)
  const dirty = draft.trim().length > 0 && draft.trim() !== currentCron

  return (
    <div className="sched-ro" aria-label="排期控件">
      <div className="sro-row">
        <span className="k">启用</span>
        <label
          className={`switch${canWrite ? '' : ' is-ro'}`}
          title={canWrite ? (enabled ? '关掉：到点也不会自己跑' : '打开：按下面这个时间自动跑') : why}
        >
          <input
            type="checkbox"
            checked={enabled}
            disabled={off}
            onChange={() => onSubmit({ enabled: !enabled, ...(currentCron === undefined ? {} : { mode: 'cron' as const, cron: currentCron }) })}
          />
          <span className="track" aria-hidden="true" />
          <span className="txt">{busy ? '…' : enabled ? '开' : '关'}</span>
        </label>
      </div>

      <div className="sro-row">
        <span className="k">预设</span>
        <span className="sro-presets">
          {CRON_PRESETS.map(item => (
            <button
              key={item.cron}
              type="button"
              className={`btn btn-secondary${item.cron === currentCron ? ' on' : ''}`}
              disabled={off}
              title={canWrite ? `改成「${item.label}」并启用` : why}
              aria-pressed={item.cron === currentCron}
              onClick={() => { onDraft(item.cron); onSubmit({ enabled: true, mode: 'cron', cron: item.cron }) }}
            >
              {item.label}
            </button>
          ))}
        </span>
      </div>

      <div className="sro-row">
        <span className="k">表达式</span>
        <input
          className="sro-cron"
          value={draft}
          disabled={off}
          placeholder="分 时 日 月 周，例如 0 9 * * *"
          title={canWrite ? '五段 cron，按「分 时 日 月 周」的顺序写' : why}
          aria-label="cron 表达式"
          onChange={event => onDraft(event.target.value)}
        />
        <span className="sro-human">{draft.trim().length === 0 ? '' : humanCron(draft.trim())}</span>
        <button
          type="button"
          className="btn btn-primary"
          disabled={off || !dirty}
          title={canWrite ? '把上面这个表达式写进任务看板' : why}
          onClick={() => onSubmit({ enabled: true, mode: 'cron', cron: draft.trim() })}
        >
          应用
        </button>
      </div>

      {currentCron !== undefined && matchesPreset === undefined ? (
        <p className="view-note">这个表达式不在上面五个预设里——预设只是常用写法，不是全部。</p>
      ) : null}
      {/* 看板拒绝的原话照抄。它比我们清楚是哪一条不合法 */}
      {error === null ? null : <p className="ro-reason err">没改成：{error}</p>}
    </div>
  )
}

/**
 * 会话内容的只读记录。
 *
 * 四种状态各自说自己的话，**没有一种是把这一块留空**：
 * 读到了就画，还在读就说在读，读不动就说为什么（宿主给的原话），
 * 读到了但是空的就说「这个会话里没有对话」。
 */
function TranscriptView({ transcript }: { transcript: Transcript }) {
  if (transcript.state === 'idle') {
    return <p className="d-empty">这个任务还没跑过，没有会话。</p>
  }
  if (transcript.state === 'loading') {
    return <p className="d-empty">正在读会话…</p>
  }
  if (transcript.state === 'unavailable') {
    return (
      <>
        <p className="fb-error" style={{ marginBottom: 0 }}>
          读不到会话内容：{transcript.why}
        </p>
        <p className="view-note" style={{ marginTop: 8 }}>
          抽屉其余部分不受影响。会话内容要宿主提供了会话服务才读得到——它不在场时，
          上面那个「在宿主里打开这个会话」还是能用的。
        </p>
      </>
    )
  }
  if (transcript.lines.length === 0) {
    return <p className="d-empty">这个会话里没有对话（可能刚开、或者只有工具调用）。</p>
  }
  return (
    <div className="tr-list">
      {transcript.hasMore ? <p className="view-note">更早的内容没读进来，这里只显示最近一段。</p> : null}
      {transcript.lines.map((line, index) => (
        <div key={`${line.at}-${index}`} className={`tr-line tr-${line.who}`}>
          <span className="tr-who">{line.who === 'user' ? '你说' : 'DSH'}</span>
          <span className="tr-body">{line.text}</span>
        </div>
      ))}
    </div>
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
