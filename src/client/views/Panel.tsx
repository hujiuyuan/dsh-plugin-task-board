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
import { buildIndex } from '../model'
import type { TaskRecord } from '../types'
import type { TaskSource } from '../data'
import { useWorkspaces } from '../workspaces'
import { Board } from './Board'
import { Drawer } from './Drawer'
import { Gantt } from './Gantt'
import { Progress } from './Progress'

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
}

export function Panel({ ctx, source }: PanelProps) {
  const [view, setView] = useState<View>('board')
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())
  const [hideSubtasks, setHideSubtasks] = useState(false)
  const [lanes, setLanes] = useState(false)
  /** 甘特/进度自己的筛选被「清空全部」清掉时，靠这个数把它们重置。 */
  const [resetToken, setResetToken] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const index = useMemo(() => buildIndex(source.snapshot.tasks), [source.snapshot.tasks])
  const workspaceIds = useMemo(
    () => [...new Set(index.onBoard.map(task => task.workspaceId ?? ''))],
    [index.onBoard],
  )
  const workspaces = useWorkspaces(ctx, workspaceIds)

  const selected = selectedId === undefined ? undefined : index.byId.get(selectedId)

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

      {selected !== undefined ? (
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
        />
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
      : snapshot.reason === 'schema-mismatch' ? `账本格式对不上（文件里是 ${String(snapshot.detail ?? '未知版本')}），不猜字段，所以什么都不画。`
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
        {' '}快照（schemaVersion 5），不含实时事件。
      </span>
    </div>
  )
}
