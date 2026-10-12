/**
 * 这个插件的主页面：顶栏 + 三个视图 + 抽屉。
 *
 * 顶栏上从左到右是：标题、视图切换、筛选框、**数据来源指示灯**。最后一个不是装饰——
 * 这个插件有两种数据来源，一种实时一种不实时，分不清的话用户会以为看板坏了。
 */
import { useEffect, useMemo, useState } from 'react'
import { buildIndex } from '../model'
import type { TaskRecord } from '../types'
import type { TaskSource } from '../data'
import { Board } from './Board'
import { Drawer } from './Drawer'
import { Gantt } from './Gantt'
import { Progress } from './Progress'

type View = 'board' | 'gantt' | 'progress'

const VIEWS: ReadonlyArray<{ id: View; label: string; hint: string }> = [
  { id: 'board', label: '看板', hint: '按状态分五列，一张卡一个任务' },
  { id: 'gantt', label: '甘特', hint: '最近 21 天，谁跑了、跑了多久' },
  { id: 'progress', label: '进度', hint: '整体什么状态、有没有东西卡住' },
]

/** 「正在跑」那几个字要自己会动，不然看不出还在跑。 */
const TICK_MS = 30_000

interface PanelProps {
  ctx: any
  source: TaskSource
}

export function Panel({ ctx, source }: PanelProps) {
  const [view, setView] = useState<View>('board')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const index = useMemo(() => buildIndex(source.snapshot.tasks), [source.snapshot.tasks])

  // 选中的任务可能在下一次刷新里没了（被删、被归档）。索引里找得到才开抽屉——
  // 找不到就自然关掉，比留一个指向空气的抽屉好。
  const selected = selectedId === undefined ? undefined : index.byId.get(selectedId)

  /**
   * 回会话页。
   *
   * **这个按钮是必须的，不是锦上添花。** 这个面板占了中间那一栏，
   * 用户进来之后如果没有一条明确的回头路，就只能靠侧边栏——而侧边栏那一行
   * 在窄窗口里可能被折起来。宿主提供 `ctx.layout.selectPanel(null)`
   * 就是「回到会话」这个动作本身。
   */
  const backToConversation = (): void => {
    try {
      ctx.get('layout')?.selectPanel?.(null)
    } catch {
      // layout 不在场（换了外壳组合）时不做任何事，也不报错
    }
  }

  const openSession = (sessionId: string): boolean => {
    for (const name of ['uiWorkspace', 'workspaceNavigation']) {
      try {
        const face = ctx.get(name)
        if (face !== undefined && typeof face.openSession === 'function') {
          face.openSession(sessionId)
          return true
        }
      } catch {
        // 服务不在场，试下一个
      }
    }
    return false
  }

  const isEmpty = index.all.length === 0

  return (
    <div className="dsptb">
      <div className="dsptb-bar">
        <button type="button" className="dsptb-btn" onClick={backToConversation} title="回到会话页">
          ← 返回会话
        </button>
        <span className="dsptb-title">规划视图</span>
        <div className="dsptb-seg" role="group" aria-label="切换视图">
          {VIEWS.map(item => (
            <button
              key={item.id}
              type="button"
              title={item.hint}
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {view === 'board' ? (
          <input
            className="dsptb-input"
            style={{ flex: '0 1 220px' }}
            placeholder="筛选任务…"
            value={query}
            onChange={event => setQuery(event.target.value)}
            aria-label="筛选任务"
          />
        ) : null}
        <span className="dsptb-bar-grow" />
        <SourceStatus source={source} />
      </div>

      <div className="dsptb-body">
        {isEmpty ? <Blank source={source} ctx={ctx} /> : null}
        {!isEmpty && view === 'board' ? (
          <Board
            index={index}
            now={now}
            query={query}
            selectedId={selectedId}
            onSelect={task => setSelectedId(task.id)}
          />
        ) : null}
        {!isEmpty && view === 'gantt' ? (
          <Gantt index={index} now={now} selectedId={selectedId} onSelect={task => setSelectedId(task.id)} />
        ) : null}
        {!isEmpty && view === 'progress' ? (
          <Progress index={index} now={now} onSelect={task => setSelectedId(task.id)} />
        ) : null}
      </div>

      {selected !== undefined ? (
        <Drawer
          task={selected}
          index={index}
          now={now}
          onClose={() => setSelectedId(undefined)}
          onNavigate={task => setSelectedId(task.id)}
          onOpenSession={openSession}
        />
      ) : null}
    </div>
  )
}

/** 顶栏右端那颗灯：数据从哪来、是不是实时的、要不要手动刷。 */
function SourceStatus({ source }: { source: TaskSource }) {
  const { snapshot, refresh, refreshing } = source
  if (snapshot.kind === 'board') {
    return (
      <span className="dsptb-src" title="数据来自任务看板的内存镜像，改动会立刻反映到这里">
        <span className="dsptb-dot" data-k="board" />
        看板实时
        {snapshot.boardEnabled === false ? '（看板的扩展开关关着）' : ''}
        <span>· {snapshot.tasks.length} 个任务</span>
      </span>
    )
  }
  if (snapshot.kind === 'ledger') {
    return (
      <span className="dsptb-src" title={`任务看板没在场，读的是账本快照：${snapshot.path ?? ''}\n账本变了这里不会自己更新，点「刷新」重新读`}>
        <span className="dsptb-dot" data-k="ledger" />
        账本快照 · 只读
        <span>· {snapshot.tasks.length} 个任务</span>
        <button type="button" className="dsptb-btn" onClick={refresh} disabled={refreshing}>
          {refreshing ? '读取中…' : '刷新'}
        </button>
      </span>
    )
  }
  return (
    <span className="dsptb-src">
      <span className="dsptb-dot" data-k="unavailable" />
      没有数据
      <button type="button" className="dsptb-btn" onClick={refresh} disabled={refreshing}>
        {refreshing ? '读取中…' : '重试'}
      </button>
    </span>
  )
}

/** 一个任务都没有时占满整页，并说清为什么。 */
function Blank({ source, ctx }: { source: TaskSource; ctx: any }) {
  const { snapshot } = source
  if (snapshot.kind === 'unavailable' && snapshot.reason === 'starting') {
    return (
      <div className="dsptb-blank">
        <h3>正在找数据…</h3>
        <p>先问任务看板，问不到再读账本。</p>
      </div>
    )
  }
  if (snapshot.kind === 'unavailable') {
    const boardAlive = (() => {
      try {
        return ctx.get('taskBoard') !== undefined
      } catch {
        return false
      }
    })()
    return (
      <div className="dsptb-blank">
        <h3>拿不到任务数据</h3>
        <p>
          {snapshot.reason === 'ledger-missing'
            ? '账本文件还不存在——任务看板大概没跑过。'
            : snapshot.reason === 'schema-mismatch'
              ? `账本格式对不上（文件里是 ${String((snapshot as { detail?: string }).detail ?? '未知版本')}），不猜字段，所以什么都不画。`
              : '看板不在场，账本也读不到。'}
        </p>
        {boardAlive ? null : <p>任务看板这个插件现在没有加载。</p>}
        {snapshot.path !== undefined ? <code>{snapshot.path}</code> : null}
        <button type="button" className="dsptb-btn" onClick={source.refresh}>
          再试一次
        </button>
      </div>
    )
  }
  return (
    <div className="dsptb-blank">
      <h3>还没有任务</h3>
      <p>{snapshot.kind === 'board' ? '在任务看板里建一张卡，这里就有了。' : '账本里一条任务都没有。'}</p>
    </div>
  )
}
