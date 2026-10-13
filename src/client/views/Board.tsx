/**
 * 看板视图。
 *
 * 三条定死的规矩，都能在界面上看出来：
 *  1. **只挂主任务**。子任务的入口只有父卡第二行那个「子任务 N/M」，点开抽屉看。
 *     列里、计数里、分组里都不出现子任务。
 *  2. **卡片是固定模板**：四行、行高写死、每行只占一行字。代价是没内容时留空行，
 *     好处是扫一列的时候第几行是什么信息，横着看都对得齐。
 *  3. **已完成 / 已失败按天分组**，其余三列不分。这两列的任务只增不减，
 *     不分组的话两个月以后要滚屏半小时才看得到今天的。
 */
import { useEffect, useMemo, useState } from 'react'
import { deriveIntent, manualSettled, periodOf, priorityOf, ruleRank } from '../derive'
import { STATUS, STATUS_ORDER, barColor, hueOf } from '../tokens'
import type { TaskIndex } from '../model'
import { dayKey, groupByDay, isSessionTask, lastExecution, paginateByWorkday, planOf, rollupOf, runBudgetOf, shortTime, spanEnd, stopReasonOf, triggerOf } from '../model'
import type { TaskRecord, TaskStatus } from '../types'
import type { WorkspaceIndex } from '../workspaces'
import { Dropdown, EmptyState, IconClock, IconMag, IconMini, MiniSearch, emptyTaskCopy, type Option } from './controls'

/** 每次「更多」放出几个工作日组。 */
const WORKDAYS_PER_PAGE = 7

/** 一列自己的筛选。**各列独立**——筛了这一列不影响别的列。 */
interface ColFilter {
  ws: string
  q: string
  trig: 'all' | 'schedule' | 'manual'
}

const EMPTY_FILTER: ColFilter = { ws: '', q: '', trig: 'all' }

interface BoardProps {
  index: TaskIndex
  now: number
  workspaces: WorkspaceIndex
  selectedId: string | undefined
  onSelect: (task: TaskRecord) => void
  /** 整板都被筛空了 —— 由外层统一清空所有筛选。 */
  onClearAll: () => void
  /** 数据来源。只影响「一条任务都没有」那句话 —— 读账本时没有任务看板可去。 */
  sourceKind: 'board' | 'ledger' | 'unavailable'
  /** 去任务看板建卡。只有看板在场时才给 —— 否则那是让人去一个不存在的地方。 */
  onOpenBoard?: () => void
  /**
   * 能不能拖卡片换列。**没有写入口时一律不能** —— 账本兜底读来的数据拖了也白拖，
   * 而且会让人以为插件把卡弄丢了。给 false 的时候连 `draggable` 都不挂，
   * 卡片根本不会出现「可以拖」的手感。
   */
  canMove?: boolean
  /** 拖到某一列。真去写、以及把结果告诉用户，都是父级的事。 */
  onMove?: (task: TaskRecord, status: TaskStatus) => void
}

export function Board({ index, now, workspaces, selectedId, onSelect, onClearAll, sourceKind, onOpenBoard, canMove = false, onMove }: BoardProps) {
  /**
   * 正在拖的那张卡 / 悬停在哪一列。
   *
   * 这两个都不进 props、也不进账本 —— 它们是**手指的位置**，不是数据。
   * 移交的动作由 `onMove` 交出去，父级再把结果变成一句 toast。
   */
  const [dragging, setDragging] = useState<TaskRecord | undefined>(undefined)
  const [over, setOver] = useState<TaskStatus | undefined>(undefined)
  const [filters, setFilters] = useState<Record<TaskStatus, ColFilter>>(() => ({
    backlog: EMPTY_FILTER, todo: EMPTY_FILTER, running: EMPTY_FILTER, done: EMPTY_FILTER, failed: EMPTY_FILTER,
  }))
  const [searchOpen, setSearchOpen] = useState<Record<TaskStatus, boolean>>(() => ({
    backlog: false, todo: false, running: false, done: false, failed: false,
  }))
  const [pages, setPages] = useState<Record<TaskStatus, number>>(() => ({
    backlog: 1, todo: 1, running: 1, done: 1, failed: 1,
  }))
  /** 用户手动开/关过哪些日期组。没记过的走默认（最新那组开）。 */
  const [override, setOverride] = useState<ReadonlyMap<string, boolean>>(() => new Map())

  const setFilter = (status: TaskStatus, patch: Partial<ColFilter>): void =>
    setFilters(current => ({ ...current, [status]: { ...current[status], ...patch } }))

  const wsOptions: Option[] = useMemo(
    () => [
      { value: '', label: '项目' },
      ...workspaces.groups
        .filter(id => id !== '')
        .map(id => ({ value: id, label: workspaces.nameOf(id), hue: hueOf(id) })),
      { value: '__none__', label: '未钉', hue: 220 },
    ],
    [workspaces],
  )

  const columns = useMemo(() => {
    const out: Record<TaskStatus, TaskRecord[]> = { backlog: [], todo: [], running: [], done: [], failed: [] }
    for (const task of index.roots) out[task.status].push(task)
    for (const status of STATUS_ORDER) {
      // 结束了的按「结算时间」倒序 —— 跟卡片第四行写出来、跟分组用的都是同一个时刻，
      // 三者不一致的话列表顺序看起来就是随机的。
      // 没结束的三列：**先按优先级，再按创建时间倒序**（原型是「有目标的在前」，
      // 这里换成一条真能从账本算出来的：快炸的、正在跑的、会自己动的排前面）。
      out[status].sort(status === 'done' || status === 'failed'
        ? (a, b) => spanEnd(b, now) - spanEnd(a, now)
        : (a, b) => ruleRank(b) - ruleRank(a) || b.createdAt - a.createdAt)
      // 会话行**沉到本列最后**。它们是「顺带看看」的东西，一堆会话压在真正的卡上面，
      // 这一列就不再回答「哪个窗口在等我」了 —— 那正是这个插件存在的理由。
      out[status].sort((a, b) => Number(isSessionTask(a)) - Number(isSessionTask(b)))
    }
    return out
  }, [index.roots, now])

  const filtered = useMemo(() => {
    const out = {} as Record<TaskStatus, TaskRecord[]>
    for (const status of STATUS_ORDER) {
      const filter = filters[status]
      const needle = filter.q.trim().toLowerCase()
      out[status] = columns[status].filter(task => {
        if (filter.ws === '__none__' && task.workspaceId !== undefined) return false
        if (filter.ws !== '' && filter.ws !== '__none__' && task.workspaceId !== filter.ws) return false
        if (filter.trig !== 'all') {
          const last = lastExecution(task)
          if (last === undefined) return false
          if (triggerOf(last) !== filter.trig) return false
        }
        if (needle.length > 0 && !haystack(task).includes(needle)) return false
        return true
      })
    }
    return out
  }, [columns, filters])

  /**
   * 一张卡要的全部 props。两处渲染点（平铺 / 按天分组）共用，免得改了这处漏那处。
   *
   * 会话行一律 `canMove: false`：它没有账本可写，拖了也无处可落。
   * 给 false 时连 `draggable` 都不挂，卡片根本不会出现「可以拖」的手感。
   */
  const cardProps = (task: TaskRecord) => ({
    task, index, now, workspaces, selectedId, onSelect,
    canMove: canMove && !isSessionTask(task),
    dragging: dragging?.id === task.id,
    onDragBegin: setDragging,
    onDragEnd: () => setDragging(undefined),
  })

  const anyFilter = STATUS_ORDER.some(status => {
    const filter = filters[status]
    return filter.ws !== '' || filter.q.trim().length > 0 || filter.trig !== 'all'
  })

  const totalVisible = STATUS_ORDER.reduce((sum, status) => sum + filtered[status].length, 0)
  if (totalVisible === 0) {
    if (anyFilter) {
      return (
        <div className="board is-empty">
          <EmptyState
            title="没有匹配的任务"
            body="筛选条件把账本滤空了，清一下试试。"
            actionLabel="清空全部筛选"
            onAction={() => {
              setFilters({ backlog: EMPTY_FILTER, todo: EMPTY_FILTER, running: EMPTY_FILTER, done: EMPTY_FILTER, failed: EMPTY_FILTER })
              onClearAll()
            }}
          />
        </div>
      )
    }
    if (index.roots.length === 0) {
      return (
        <div className="board is-empty">
          <EmptyState
            {...emptyTaskCopy(sourceKind)}
            {...(onOpenBoard === undefined ? {} : { actionLabel: '去任务看板', onAction: onOpenBoard })}
          />
        </div>
      )
    }
  }

  return (
    <div className="board">
      {STATUS_ORDER.map(status => {
        const meta = STATUS[status]
        const all = columns[status]
        const items = filtered[status]
        const filter = filters[status]
        const filteredNow = filter.ws !== '' || filter.q.trim().length > 0 || filter.trig !== 'all'
        // **筛过之后照样按天分组**。筛完就退回一长条平铺列表的话，
        // 用户每打一个字列表结构就变一次，找东西反而更难。
        const dated = status === 'done' || status === 'failed'
        const days = dated ? groupByDay(items, now) : undefined
        const shown = days === undefined ? undefined : paginateByWorkday(days, pages[status] * WORKDAYS_PER_PAGE)
        const rest = days === undefined ? [] : days.slice(shown!.length)
        const restCount = rest.reduce((sum, group) => sum + group.items.length, 0)
        const restWorkdays = rest.filter(group => !group.weekend).length

        // 拖着自己原来那一列不算「有地方可放」：接收了也只是原地不动，
        // 高亮起来反而是在承诺一件不会发生的事
        const droppable = canMove && dragging !== undefined && dragging.status !== status

        return (
          <section
            className={`col${over === status && droppable ? ' drop-on' : ''}`}
            key={status}
            aria-label={meta.label}
            onDragOver={canMove
              ? event => {
                  // 不 preventDefault 的话浏览器不认这是放置区，drop 根本不会触发
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setOver(status)
                }
              : undefined}
            onDragLeave={canMove
              ? event => {
                  // 移到自己的子元素上也会触发 dragleave。不排掉的话，
                  // 鼠标从列的空白处挪到卡片上，整列的高亮就闪一下没了
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
                  setOver(current => (current === status ? undefined : current))
                }
              : undefined}
            onDrop={canMove
              ? event => {
                  event.preventDefault()
                  const task = dragging
                  setOver(undefined)
                  setDragging(undefined)
                  if (task === undefined || onMove === undefined || task.status === status) return
                  onMove(task, status)
                }
              : undefined}
          >
            <div className="col-head" title={`${meta.label}\n${meta.desc}\n\n由谁设置：${meta.by}\n${meta.tip}`}>
              <span className="hdot" style={{ background: meta.css }} />
              <h3>{meta.label}</h3>
              <span
                className="count"
                title={filteredNow ? `筛过：本列 ${all.length} 个，命中 ${items.length} 个` : undefined}
              >
                {items.length}
                {filteredNow ? <i>/{all.length}</i> : null}
              </span>
            </div>

            <div className="col-filters">
              {searchOpen[status] ? (
                <MiniSearch
                  value={filter.q}
                  placeholder={`在「${meta.label}」列里搜名称 / 标签…`}
                  ariaLabel={`在「${meta.label}」列里搜索`}
                  onChange={next => setFilter(status, { q: next })}
                  onClose={() => {
                    setSearchOpen(current => ({ ...current, [status]: false }))
                    setFilter(status, { q: '' })
                  }}
                />
              ) : (
                <>
                  <Dropdown
                    mini
                    value={filter.ws}
                    options={wsOptions}
                    ariaLabel={`「${meta.label}」列的项目筛选`}
                    onChange={next => setFilter(status, { ws: next })}
                  />
                  <IconMini
                    on={filter.q.length > 0}
                    label={`在「${meta.label}」列里搜索`}
                    title={filter.q.length > 0 ? `正在筛选：${filter.q}` : `在「${meta.label}」列里搜索`}
                    onClick={() => setSearchOpen(current => ({ ...current, [status]: true }))}
                  >
                    <IconMag />
                  </IconMini>
                  <div className="select-wrap mini">
                    <select
                      className={filter.trig === 'all' ? undefined : 'on'}
                      aria-label={`「${meta.label}」列的触发方式筛选`}
                      value={filter.trig}
                      onChange={event => setFilter(status, { trig: event.target.value as ColFilter['trig'] })}
                    >
                      <option value="all">触发</option>
                      <option value="schedule">仅定时</option>
                      <option value="manual">仅手动</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="col-body">
              {items.length === 0 ? (
                <p className="col-empty">
                  {filteredNow ? (
                    <>
                      这一列没有符合条件的任务
                      <br />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setFilter(status, EMPTY_FILTER)}
                      >
                        清空本列筛选
                      </button>
                    </>
                  ) : (
                    '这一列还没有任务'
                  )}
                </p>
              ) : shown === undefined ? (
                items.map(task => (
                  <Card key={task.id} {...cardProps(task)} />
                ))
              ) : (
                <>
                  {shown.map((group, groupIndex) => {
                    const key = `${status}:${group.key}`
                    const open = override.get(key) ?? groupIndex === 0
                    return (
                      <div key={group.key}>
                        <div className={`group-head${open ? ' open' : ''}`}>
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOverride(current => {
                              const next = new Map(current)
                              next.set(key, !open)
                              return next
                            })}
                          >
                            <span className={`caret${open ? ' open' : ''}`} aria-hidden="true">▸</span>
                            {group.key === dayKey(now) ? <span className="dot" title="今天" /> : null}
                            {dayLabelOf(group.key, now)}
                            <span className="n">{group.items.length}</span>
                          </button>
                          <span className="rule" />
                        </div>
                        {open
                          ? group.items.map(task => (
                              <Card key={task.id} {...cardProps(task)} />
                            ))
                          : null}
                      </div>
                    )
                  })}
                  {rest.length > 0 ? (
                    <div className="more-row">
                      <span className="more-txt">
                        {restWorkdays > 0 ? `还有 ${restWorkdays} 个工作日 · ` : '还有 '}
                        {restCount} 项没显示
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setPages(current => ({ ...current, [status]: current[status] + 1 }))}
                      >
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
  return [task.title, task.id, ...(task.tags ?? []).map(tag => tag.name)].join('\n').toLowerCase()
}

function dayLabelOf(key: string, now: number): string {
  const date = new Date(`${key}T12:00:00`)
  const weekday = '日一二三四五六'[date.getDay()]
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  return `${sameYear ? `${mm}-${dd}` : `${date.getFullYear()}-${mm}-${dd}`} · 周${weekday}`
}

interface CardProps {
  task: TaskRecord
  index: TaskIndex
  now: number
  workspaces: WorkspaceIndex
  selectedId: string | undefined
  onSelect: (task: TaskRecord) => void
  /** 能拖的话把这两个给下来。`canMove` 为假时一个都不挂。 */
  canMove: boolean
  dragging: boolean
  onDragBegin: (task: TaskRecord) => void
  onDragEnd: () => void
}

/**
 * 一张卡。**四行永远都渲染**（没内容就是空 div）——少一行的话 grid 会把后面的
 * 提上来，「第几行是什么」这条对齐就断了。
 */
function Card({ task, index, now, workspaces, selectedId, onSelect, canMove, dragging, onDragBegin, onDragEnd }: CardProps) {
  const rollup = useMemo(() => rollupOf(index, task), [index, task])
  const last = lastExecution(task)
  const running = last !== undefined && last.endedAt === undefined
  const tags = task.tags ?? []
  const wsName = workspaces.nameOf(task.workspaceId)
  const unpinned = task.workspaceId === undefined || task.workspaceId.length === 0
  /**
   * 会话行：没有账本，也没有执行记录 —— 它自己就是那次会话。
   *
   * `index` 里这一行的 id 是 `session:<会话 id>`，跟账本 id 不可能撞；
   * 抽屉认的也是这个前缀（见 `sessions.ts`）。
   */
  const session = task.fromSession !== undefined

  // 这几个都只看账本字段，不看模型 —— 卡片上不能出现「等模型回来才显示」的格子。
  const priority = useMemo(() => priorityOf(task), [task])
  const period = useMemo(() => (session ? undefined : periodOf(task)), [task, session])
  // `manualSettled` 的判据是「结束了却没有执行记录」= 人手工判过的。
  // 会话行正好符合这个形状，但那不是它的意思 —— 不拍掉的话每张会话卡上
  // 都会挂一枚「手动结算」，而它根本没结算过
  const manual = useMemo(() => (session ? undefined : manualSettled(task)), [task, session])
  const goal = useMemo(() => { const i = deriveIntent(task, now); return i.goal }, [task, now])

  // 第四行左边那一格：按状态换口径。一个跑着的任务写「创建时间」没有意义，
  // 一个跑完的任务写「开始时间」也不如「结算」有用。
  // 会话行没有开始也没有结算，只有「最后动它是什么时候」。
  const when = session
    ? { k: '活动', v: shortTime(task.updatedAt, now) }
    : running
      ? { k: '开始', v: shortTime(last!.startedAt, now) }
      : task.status === 'done' || task.status === 'failed'
        ? { k: '结算', v: shortTime(spanEnd(task, now), now) }
        : { k: '创建', v: shortTime(task.createdAt, now) }

  const tip = [
    task.title,
    session
      ? `会话 ${task.fromSession} · ${wsName} · ${STATUS[task.status].label}`
      : `${task.id} · ${wsName} · ${STATUS[task.status].label}`,
    task.description.length > 0 ? task.description : undefined,
    session
      ? '这一行是没有任务卡的会话，按它在不在跑归列。点开可以直接接着聊'
      : undefined,
    // 说在动手之前。跑到一半的卡移不动是看板的规矩，等拖完再弹一句「不行」
    // 是把一句话该在前面的信息放到了后面
    canMove && running ? '跑着的时候移不动：锁属于那次执行，不属于这一列的名字' : undefined,
    canMove ? '拖到别的列可以换状态' : undefined,
  ].filter(Boolean).join('\n')

  return (
    <article
      className={`card${running || task.status === 'running' ? ' is-running' : ''}${session ? ' is-session' : ''}${task.id === selectedId ? ' on' : ''}${dragging ? ' is-dragging' : ''}${canMove ? ' can-move' : ''}`}
      role="button"
      tabIndex={0}
      draggable={canMove}
      onDragStart={canMove
        ? event => {
            // 必须塞一点数据，不然 Firefox 系不认这是一次拖拽。
            // 真正用的是 state 里那张卡 —— dataTransfer 在 dragover 阶段读不到
            event.dataTransfer.setData('text/plain', task.id)
            event.dataTransfer.effectAllowed = 'move'
            onDragBegin(task)
          }
        : undefined}
      onDragEnd={canMove ? () => onDragEnd() : undefined}
      style={{ ['--bar' as string]: barColor(last) }}
      aria-label={`任务 ${task.title}`}
      title={tip}
      onClick={() => onSelect(task)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(task)
        }
      }}
    >
      <span className={`cmark${unpinned ? ' unpin' : ''}`} style={{ ['--hue' as string]: String(hueOf(task.workspaceId ?? '')) }}>
        <span className="cm-txt" title={workspaces.pathOf(task.workspaceId) ?? wsName}>
          {workspaces.abbrOf(task.workspaceId)}
        </span>
      </span>

      <h4>
        {/* 缺目标：执行提示和说明都空着 —— 这种卡跑起来会拿到一个空的 prompt。
            原型里是个小黄点，这里照做，提示词写清为什么。
            会话行没有 prompt 是**本该如此**，不是缺了什么，不点这个灯。 */}
        {!session && goal.value === '' ? (
          <span className="nogol" title="这张卡没有填执行提示，也没有说明 —— 跑起来发给 DSH 的是空的" aria-label="缺目标" />
        ) : null}
        <span className="ttl">{task.title}</span>
      </h4>

      <div className="card-tags">
        {session ? (
          <span
            className="badge-session"
            title="这不是任务看板里的卡，是一个没有挂卡的会话。它按「在跑 / 停着」归列，也改不了"
          >
            会话
          </span>
        ) : (
          <span className={`prio p-${priority.level}`} title={`优先级：${priority.value} · ${priority.why}`}>
            {priority.value}
          </span>
        )}
        {period !== undefined ? (
          <span className="badge-period" title={`${period.label} · ${period.why}`}>{period.label}</span>
        ) : null}
        {manual !== undefined ? (
          <span className="badge-manual" title={manual}>手动结算</span>
        ) : null}
        {task.teamRun === true ? <span className="badge-plain" title="这一整个子树按 Agent Team 跑">团队</span> : null}
        {task.goalRun === false ? <span className="badge-plain" title="只跑一轮，不启 /goal">单轮</span> : null}
        {tags.map(tag => (
          <span
            key={tag.name}
            className="badge"
            style={{ ['--hue' as string]: String(hueOf(tag.name)) }}
            title={tag.promptPrefix === undefined ? `${tag.name}（只是显示用的标签）` : `${tag.name} · 会把这个前缀拼到 prompt 前面：${tag.promptPrefix}`}
          >
            {tag.name}
          </span>
        ))}
        {rollup.total > 0 ? (
          <span className="badge-sub" title={`这个任务有 ${rollup.total} 个子任务（已完成 ${rollup.byStatus.done} 个）· 点开卡片在「子任务」里看`}>
            子任务 {rollup.byStatus.done}/{rollup.total}
          </span>
        ) : null}
      </div>

      <div className="card-sub">
        {/* 原型这里放的是编排片段。真模型里没有编排（这一版也没做编排视图），
            换成同样「这条任务是怎么配的」的一句话：预设 / 模型 / 权限。 */}
        <span className="cseg nowrap" title={executionSummary(task) ?? '执行时全部走宿主默认'}>
          {executionSummary(task) ?? ''}
        </span>
        <span className="cseg chip-slot">
          {/* 会话行把**它自己**那个会话 id 摆在这儿 —— 卡上第二行本来就是放会话 chip 的
              位置，空着的话这一行整条是白的，看起来像没读到的数据 */}
          {(session ? task.fromSession : last?.sessionId) !== undefined ? (
            <span
              className="chip"
              title={session ? `这个会话：${task.fromSession}` : `最近一次执行会话 ${last!.sessionId}`}
            >
              {shortSession((session ? task.fromSession : last!.sessionId)!)}
            </span>
          ) : null}
        </span>
      </div>

      <div className="card-meta">
        <span className="when">{when.k} {when.v}</span>
        <span className="when-slot">{scheduleMark(task, now)}</span>
      </div>
    </article>
  )
}

function executionSummary(task: TaskRecord): string | undefined {
  const parts = [
    task.mode !== undefined ? task.mode : undefined,
    task.model !== undefined ? task.model : undefined,
    task.permission !== undefined ? task.permission : undefined,
  ].filter((part): part is string => part !== undefined)
  return parts.length === 0 ? undefined : parts.join(' · ')
}

/** 会话 id 是一串哈希，掐头去尾就认不出来了 —— 只从尾巴截。 */
function shortSession(sessionId: string): string {
  return sessionId.length <= 14 ? sessionId : `${sessionId.slice(0, 13)}…`
}

/**
 * 第四行右边：排期。启用了写下次触发时间，没启用只留一个空心钟。
 *
 * 说的是**规则本身**（`planOf`），不直接读 `schedule.cron` —— 单次规则没有这个字段，
 * 读出来的是 undefined，气泡里就是「定时未启用 · undefined」。
 */
function scheduleMark(task: TaskRecord, now: number) {
  if (task.schedule === undefined) return null
  const { enabled, nextRunAt } = task.schedule
  const plan = planOf(task.schedule)
  const extra = [
    runBudgetOf(task.schedule),
    enabled && nextRunAt !== undefined ? `下次 ${new Date(nextRunAt).toLocaleString()}` : undefined,
    enabled ? undefined : '关着：到点也不会跑，只能人手动开',
    stopReasonOf(task.schedule.endedReason),
    stopReasonOf(task.schedule.skippedReason),
  ].filter((part): part is string => part !== undefined)
  if (!enabled) {
    return (
      <span className="sched" title={[`定时未启用 · ${plan}`, ...extra].join('\n')} style={{ color: 'var(--label-tertiary)' }}>
        <IconClock filled={false} />
      </span>
    )
  }
  return (
    <span className="sched" title={[`定时已启用 · ${plan}`, ...extra].join('\n')}>
      <IconClock filled />
      <span>{nextRunAt === undefined ? '已启用' : shortTime(nextRunAt, now)}</span>
    </span>
  )
}
