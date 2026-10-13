/**
 * 这个插件的主页面：顶栏 + 降级横幅 + 三个视图 + 抽屉。
 *
 * 顶栏从左到右：**返回会话**、标题、数据来源徽标；右边是视图切换。
 * 「去哪（视图）」是页面级动作所以放顶栏，「看什么（筛选）」下放到每一列的列头 ——
 * 这跟原型的分工一致。
 *
 * 返回会话那个按钮是**必须的**：这个面板占了中间那一栏，没有一条明确的回头路
 * 是不能接受的。宿主提供 `ctx.layout.selectPanel(null)` 就是「回到会话」本身。
 */
import { useEffect, useMemo, useState } from 'react'
import { deriveIntent } from '../derive'
import type { SlotKit } from '../embed'
import { useEnrichment } from '../enrich'
import { buildIndex, lastExecution } from '../model'
import { STATUS } from '../tokens'
import type { TaskRecord, TaskStatus } from '../types'
import type { TaskSource } from '../data'
import { tasksFromSessions, takenSessionIds, useSessionRows } from '../sessions'
import { transcriptForModel, useTranscript } from '../session'
import { useWorkspaces } from '../workspaces'
import { useBoardWrite, useScheduleReady } from '../write'
import { Board } from './Board'
import { Drawer } from './Drawer'
import { Gantt } from './Gantt'
import { Progress } from './Progress'
import { TaskForm } from './TaskForm'

type View = 'board' | 'gantt' | 'progress'

const VIEWS: ReadonlyArray<{ id: View; label: string }> = [
  { id: 'board', label: '看板' },
  { id: 'gantt', label: '甘特' },
  { id: 'progress', label: '进度' },
]

/** 「正在跑」那几个字要自己会动，不然看不出还在跑。 */
const TICK_MS = 30_000

interface PanelProps {
  ctx: any
  source: TaskSource
  /** 座位给的那把 kit props。抽屉要靠它嵌宿主的会话页，见 `embed.tsx`。 */
  kit: SlotKit
}

export function Panel({ ctx, source, kit }: PanelProps) {
  const [view, setView] = useState<View>('board')
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())
  const [hideSubtasks, setHideSubtasks] = useState(false)
  const [hideSessions, setHideSessions] = useState(false)
  const [lanes, setLanes] = useState(false)
  /** 甘特/进度自己的筛选被「清空全部」清掉时，靠这个数把它们重置。 */
  const [resetToken, setResetToken] = useState(0)
  /** 表单开着的时候是新建（`'new'`）还是编辑某一张卡。 */
  const [form, setForm] = useState<'new' | 'edit' | undefined>(undefined)
  /** `err` 那颗是「没成」。同一句话，颜色不一样，人不看字也知道结果。 */
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'err' } | undefined>(undefined)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  /**
   * 任务索引 = 账本里的卡 + **没有卡的会话**。
   *
   * 分三步是因为它们互相依赖，绕一圈：会话要先知道工作区才能对回工作区 id，
   * 而工作区清单又要先知道界面上有哪些工作区，后者本来是从任务里来的。
   * 断法是把账本索引先建出来喂给工作区，再拿工作区去把会话行补全 ——
   * 顺序反过来会变成「会话的工作区看不见」。
   */
  const ledgerIndex = useMemo(() => buildIndex(source.snapshot.tasks), [source.snapshot.tasks])
  const sessionRows = useSessionRows(ctx)
  const workspaceIds = useMemo(
    () => [...new Set(ledgerIndex.onBoard.map(task => task.workspaceId ?? ''))],
    [ledgerIndex.onBoard],
  )
  const sessionPaths = useMemo(
    () => [...new Set(sessionRows.map(row => row.cwd ?? '').filter(path => path.length > 0))],
    [sessionRows],
  )
  const workspaces = useWorkspaces(ctx, workspaceIds, sessionPaths)

  const index = useMemo(() => {
    const taken = takenSessionIds(source.snapshot.tasks)
    const sessionTasks = tasksFromSessions(sessionRows, taken, workspaces)
    return sessionTasks.length === 0
      ? ledgerIndex
      : buildIndex([...source.snapshot.tasks, ...sessionTasks])
  }, [ledgerIndex, sessionRows, source.snapshot.tasks, workspaces])

  const enrichment = useEnrichment(ctx)
  const write = useBoardWrite()
  /** 排期那条路跟 `write` 不是一条（见 `write.ts`），所以单独问一次。 */
  const scheduleReady = useScheduleReady()

  // 提示条自己会走。3 秒是量出来的：短于 2 秒读不完一句话，
  // 长于 4 秒就开始挡着下面的东西了
  useEffect(() => {
    if (toast === undefined) return
    const timer = setTimeout(() => setToast(undefined), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const selected = selectedId === undefined ? undefined : index.byId.get(selectedId)

  /**
   * 当前选中的那张卡的四条意图字段。
   * 三个来源在这里汇合：规则推导（永远在）→ 模型归纳 → 人改过的。
   */
  const intent = useMemo(
    () => (selected === undefined
      ? undefined
      : deriveIntent(selected, now, enrichment.ai[selected.id], enrichment.overrides[selected.id])),
    [selected, now, enrichment.ai, enrichment.overrides],
  )

  // 打开一张卡时自动归纳一次（只在有模型路由、且这张卡一条都没有的时候）。
  // 依赖里只放 id：`enrichment.auto` 每次渲染都是新函数，放进来会无限循环。
  /**
   * 最近一次执行的那个会话的内容。
   *
   * 只在抽屉开着的时候读 —— `sessions.using` 会把会话 retain 住，
   * 看板页面上十几张卡全都去 retain 一遍是没必要的开销。
   */
  // 会话行没有执行记录 —— 它自己就是那个会话，直接用它自己的 id
  const lastSessionId = selected === undefined
    ? undefined
    : selected.fromSession ?? lastExecution(selected)?.sessionId
  const transcript = useTranscript(ctx, selected === undefined ? undefined : lastSessionId)

  const autoEnrich = enrichment.auto
  const selectedTaskId = selected?.id
  const transcriptText = useMemo(() => transcriptForModel(transcript.lines), [transcript.lines])
  useEffect(() => {
    if (selected === undefined) return
    // 会话行不是卡，没有账本字段可归纳 —— 问模型它也只会照着标题编一句。
    // 抽屉里那一页本来就不给会话行显示，这一趟白花钱。
    if (selected.fromSession !== undefined) return
    // 会话还在读的时候不急着问模型：多等一会儿能带上会话内容，归纳质量差很多。
    // idle/unavailable 说明这个任务根本没有会话，那就直接问。
    if (transcript.state === 'loading') return
    autoEnrich([selected], transcriptText)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskId, transcript.state])

  /**
   * 拖一张卡换列。
   *
   * 这里**不做任何预判**（跑着的能不能移、这张卡归谁管），一律交给看板去判，
   * 它拒绝时把原话显示出来 —— 它对那张卡的了解比这张界面多。
   * 不做乐观更新：卡的位置由看板的数据说了算，自己先挪一下再被事实推翻，
   * 看起来就像插件在抽风。
   */
  const moveTask = (task: TaskRecord, status: TaskStatus): void => {
    void (async () => {
      const result = await write.send({ op: 'status', taskId: task.id, status })
      if (!result.ok) {
        // 原因跟着结果回来，不读 `write.error` —— 那是个 state，
        // await 回来时还是上一轮的值
        setToast({ text: `没挪成：${result.error}`, tone: 'err' })
        return
      }
      setToast({ text: `「${task.title}」挪到「${STATUS[status].label}」了`, tone: 'ok' })
    })()
  }

  const backToConversation = (): void => {
    try {
      ctx.get('layout')?.selectPanel?.(null)
    } catch {
      // layout 不在场（换了外壳组合）时什么都不做，也不报错
    }
  }

  /**
   * 跳到任务看板那个面板。面板 id 是任务看板自己定死的（`TASK_BOARD_PANEL_ID`），
   * 不是我们说了算 —— 所以它没装、或者宿主没给 layout 时，这个动作就不该出现。
   */
  const openBoard = source.snapshot.kind === 'board' && ctx.get('layout')?.selectPanel !== undefined
    ? (): void => {
        try {
          ctx.get('layout').selectPanel('task-board')
        } catch {
          // 面板 id 对不上时宿主自己会忽略，这里不重复报错
        }
      }
    : undefined

  const openSession = (sessionId: string): boolean => {
    for (const name of ['uiWorkspace']) {
      try {
        const face = ctx.get(name)
        if (face !== undefined && typeof face.openSession === 'function') {
          face.openSession(sessionId)
          return true
        }
      } catch {
        // 服务不在场
      }
    }
    return false
  }

  const clearAll = (): void => {
    setHideSubtasks(false)
    setHideSessions(false)
    setResetToken(token => token + 1)
  }

  return (
    <div className="dsptb">
      <header className="panel-head">
        <button type="button" className="icon-btn" onClick={backToConversation} title="回到会话页" aria-label="返回会话">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9.5 3.5 5 8l4.5 4.5" />
          </svg>
        </button>
        <h1>规划视图</h1>
        <SourceBadge source={source} />
        <span className="spacer" />
        <button
          type="button"
          className="icon-btn icon-add"
          // 没有写入口时按钮禁用，**原因写在按钮自己的 title 上**，
          // 不做「点了才弹窗说不行」
          disabled={!write.ready}
          title={write.ready ? '新建一张任务卡' : `新建要写账本，但现在写不了：${write.why ?? '未知原因'}`}
          aria-label="新建任务"
          onClick={() => setForm('new')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3.5v9M3.5 8h9" />
          </svg>
        </button>
        <div className="seg seg-view" role="group" aria-label="切换视图">
          {VIEWS.map(item => (
            <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="page">
        <Banner source={source} />

        <section className="view" aria-label="看板视图" hidden={view !== 'board'}>
          {view === 'board' ? (
            <Board
              index={index}
              now={now}
              workspaces={workspaces}
              selectedId={selectedId}
              onSelect={task => setSelectedId(task.id)}
              onClearAll={clearAll}
              sourceKind={source.snapshot.kind}
              onOpenBoard={openBoard}
              canMove={write.ready}
              onMove={moveTask}
            />
          ) : null}
        </section>

        <section className="view" aria-label="甘特视图" hidden={view !== 'gantt'}>
          {view === 'gantt' ? (
            <Gantt
              key={`gantt-${resetToken}`}
              index={index}
              now={now}
              workspaces={workspaces}
              selectedId={selectedId}
              onSelect={task => setSelectedId(task.id)}
              onClearAll={clearAll}
              hideSubtasks={hideSubtasks}
              onHideSubtasks={setHideSubtasks}
              hideSessions={hideSessions}
              onHideSessions={setHideSessions}
              lanes={lanes}
              onLanes={setLanes}
              sourceKind={source.snapshot.kind}
            />
          ) : null}
        </section>

        <section className="view" aria-label="进度视图" hidden={view !== 'progress'}>
          {view === 'progress' ? (
            <Progress
              key={`progress-${resetToken}`}
              index={index}
              now={now}
              workspaces={workspaces}
              onSelect={task => setSelectedId(task.id)}
              sourceKind={source.snapshot.kind}
            />
          ) : null}
        </section>
      </div>

      {selected !== undefined && intent !== undefined ? (
        <Drawer
          // 换任务就重挂：标签页回到第一格，不会停在上一个任务才有的那一页上
          key={selected.id}
          task={selected}
          index={index}
          now={now}
          workspaces={workspaces}
          onClose={() => setSelectedId(undefined)}
          onNavigate={task => setSelectedId(task.id)}
          onOpenSession={openSession}
          intent={intent}
          enrichment={enrichment}
          write={write}
          onEdit={() => setForm('edit')}
          canSchedule={scheduleReady.ready}
          onScheduled={message => setToast({ text: message, tone: 'ok' })}
          transcript={transcript}
          kit={kit}
          ctx={ctx}
          {...(transcriptText === undefined ? {} : { transcriptText })}
        />
      ) : null}

      {form !== undefined ? (
        <TaskForm
          // 换一张卡（或者从编辑切到新建）就重挂，表单不会带着上一张的内容
          key={form === 'edit' ? `edit-${selectedId}` : 'new'}
          {...(form === 'edit' && selected !== undefined ? { editing: selected } : {})}
          index={index}
          workspaces={workspaces}
          write={write}
          canSchedule={scheduleReady.ready}
          onClose={() => { write.clearError(); setForm(undefined) }}
          onDone={(message, openId, tone) => {
            setForm(undefined)
            setToast({ text: message, tone: tone ?? 'ok' })
            if (openId !== undefined) setSelectedId(openId)
          }}
        />
      ) : null}

      {toast !== undefined ? (
        <div className={`toast show${toast.tone === 'err' ? ' err' : ''}`} role="status">{toast.text}</div>
      ) : null}
    </div>
  )
}

/** 顶栏那颗灯：数据从哪来。三种状态各自说清楚，不含糊。 */
function SourceBadge({ source }: { source: TaskSource }) {
  const { snapshot, refresh, refreshing } = source
  if (snapshot.kind === 'board') {
    return (
      <span className="src-badge live" title="数据来自任务看板的客户端服务，改动会立刻反映到这里">
        <span className="dot" aria-hidden="true" />
        <span>实时</span>
        {snapshot.boardEnabled === false ? <span className="src-note">（看板的扩展开关关着）</span> : null}
      </span>
    )
  }
  if (snapshot.kind === 'ledger') {
    return (
      <span className="src-badge snapshot" title={`任务看板没在场，读的是账本快照：${snapshot.path ?? ''}\n账本变了这里不会自己更新`}>
        <span className="dot" aria-hidden="true" />
        <span>快照 · 只读</span>
        <button type="button" className="btn btn-secondary" style={{ height: 22, fontSize: 11 }} onClick={refresh} disabled={refreshing}>
          {refreshing ? '读取中…' : '刷新'}
        </button>
      </span>
    )
  }
  return (
    <span className="src-badge stale" title={snapshot.detail ?? snapshot.reason ?? ''}>
      <span className="dot" aria-hidden="true" />
      <span>没有数据</span>
    </span>
  )
}

/**
 * 降级横幅。**只在真的降级时出现**，写清楚读的是哪个文件、什么时候写的。
 * 这条不能省：用户看到的是同一张看板，但一份会实时变、一份不会——
 * 不说明白的话，他会以为插件坏了。
 */
function Banner({ source }: { source: TaskSource }) {
  const { snapshot } = source
  if (snapshot.kind === 'board') return null

  if (snapshot.kind === 'unavailable' && snapshot.reason === 'starting') {
    return <div className="banner" role="status">正在找数据…先问任务看板，问不到再读账本。</div>
  }

  if (snapshot.kind === 'unavailable') {
    const text =
      snapshot.reason === 'ledger-missing' ? '账本文件还不存在——任务看板大概没跑过。'
      : snapshot.reason === 'schema-mismatch'
        ? `账本格式对不上：文件里是第 ${snapshot.schema?.actual ?? '未知'} 代，本插件认得第 ${(snapshot.schema?.supported ?? []).join(' / ') || '未知'} 代。不猜字段，所以什么都不画 —— 升级本插件，或者把任务看板退回到那一代。`
      : '任务看板没在场，账本也读不到。'
    return (
      <div className="banner" role="status">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 2.4 14.2 13H1.8z" />
          <path d="M8 6.4v3.1" strokeLinecap="round" />
          <path d="M8 11.3v.6" strokeLinecap="round" />
        </svg>
        <span>
          {text}
          {snapshot.path !== undefined ? <> <span className="mono">{snapshot.path}</span></> : null}
        </span>
      </div>
    )
  }

  return (
    <div className="banner" role="status">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2.4 14.2 13H1.8z" />
        <path d="M8 6.4v3.1" strokeLinecap="round" />
        <path d="M8 11.3v.6" strokeLinecap="round" />
      </svg>
      <span>
        任务看板未挂载 —— 以下数据读自 <span className="mono">$DSH_HOME/task-board/ledger-v2.json</span>
        {' '}快照（schemaVersion {snapshot.schemaVersion ?? '未知'}），不含实时事件。
      </span>
    </div>
  )
}
