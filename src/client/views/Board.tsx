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
import { COLUMN, COLUMN_ORDER, COLUMN_WRITE_STATUS, STATUS_COLUMN, barColor, hueOf, type ColumnId } from '../tokens'
import type { TaskIndex } from '../model'
import { dayKey, groupByDay, isRunning, isSessionTask, lastExecution, paginateByWorkday, planOf, rollupOf, runBudgetOf, shortTime, spanEnd, stopReasonOf, triggerOf } from '../model'
import { TONE_LABEL, toneColor, toneInputOf, toneOf, toneReason, toneShowsIn, type Tone } from '../tone'
import type { TaskRecord, TaskStatus } from '../types'
import type { Signals } from '../signals'
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
  onMove?: (task: TaskRecord, column: ColumnId) => void
  /**
   * 会话事实。**判断用**——不参与布局，所以缺省是一张空表也照常画。
   * 拿不到的时候界面退化成「没有颜色」，其余的（列、排序、筛选）一个都不少。
   */
  signals: Signals
  /** 归档 / 取消归档。**只有这一种操作能落到会话上。** */
  onArchive?: (task: TaskRecord, archived: boolean) => void
  /**
   * 把一张「待办」的卡跑起来（发起对话）。
   *
   * 「待办」的意思是「准备好了、还没开跑」，卡停在那儿不会自己动 ——
   * 这个按钮就是它等的那个动作。没有写入口时不给（`undefined`），
   * 卡片上就干脆不出现这个按钮：灰着还留个位置，等于每次都在提醒「这里少了点什么」。
   */
  onRun?: (task: TaskRecord) => void
}

export function Board({ index, now, workspaces, selectedId, onSelect, onClearAll, sourceKind, onOpenBoard, canMove = false, onMove, signals, onArchive, onRun }: BoardProps) {
  /**
   * 正在拖的那张卡 / 悬停在哪一列。
   *
   * 这两个都不进 props、也不进账本 —— 它们是**手指的位置**，不是数据。
   * 移交的动作由 `onMove` 交出去，父级再把结果变成一句 toast。
   */
  const [dragging, setDragging] = useState<TaskRecord | undefined>(undefined)
  const [over, setOver] = useState<ColumnId | undefined>(undefined)
  const [filters, setFilters] = useState<Record<ColumnId, ColFilter>>(() => ({
    running: EMPTY_FILTER, review: EMPTY_FILTER, todo: EMPTY_FILTER, archived: EMPTY_FILTER,
  }))
  const [searchOpen, setSearchOpen] = useState<Record<ColumnId, boolean>>(() => ({
    running: false, review: false, todo: false, archived: false,
  }))
  const [pages, setPages] = useState<Record<ColumnId, number>>(() => ({
    running: 1, review: 1, todo: 1, archived: 1,
  }))
  /** 用户手动开/关过哪些日期组。没记过的走默认（最新那组开）。 */
  const [override, setOverride] = useState<ReadonlyMap<string, boolean>>(() => new Map())

  const setFilter = (column: ColumnId, patch: Partial<ColFilter>): void =>
    setFilters(current => ({ ...current, [column]: { ...current[column], ...patch } }))

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
    const out: Record<ColumnId, TaskRecord[]> = { running: [], review: [], todo: [], archived: [] }
    for (const task of index.roots) out[STATUS_COLUMN[task.status]].push(task)
    /*
     * 归档单独一份（`archivedRoots`），**不是从 `roots` 里筛出来的** ——
     * 归档的卡压根不在 `roots` 里（`isOnBoard` 把它们排掉了）。
     * 卡片的归档来自看板账本，会话的归档来自我们自己那份记录，
     * 到了这儿不分彼此，都是「你收工了」。
     */
    out.archived.push(...index.archivedRoots)
    for (const column of COLUMN_ORDER) {
      if (column === 'archived') {
        // 最近收工的在前
        out.archived.sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0))
        continue
      }
      /*
       * 待审阅：**最早停下来的排最前面**。
       *
       * 这一列问的是「哪个窗口我还没收工」，而最容易被忘掉的恰恰是最早停下来
       * 那个 —— 倒序（最近的在上面）等于把最该看的压到最底下。
       *
       * 用的时刻就是卡片第四行写出来的那个：会话写「活动」、任务卡写「结算」，
       * 两者都走 `spanEnd`。会话没有执行记录，`spanEnd` 会落到它的 `createdAt`，
       * 而会话在投影时就把 `createdAt` 填成了 `updatedAt`（会话没有「创建时刻」，
       * 只有最后活动）—— 所以两边落在同一个数上，卡上写的和排的顺序是一致的。
       *
       * 另外两列：**先按优先级，再按创建时间倒序**（原型是「有目标的在前」，
       * 这里换成一条真能从账本算出来的：快炸的、正在跑的、会自己动的排前面）。
       */
      out[column].sort(column === 'review'
        ? (a, b) => spanEnd(a, now) - spanEnd(b, now)
        : (a, b) => ruleRank(b) - ruleRank(a) || b.createdAt - a.createdAt)
      /*
       * 会话行沉到本列最后 —— **但「待审阅」列不沉**。
       *
       * 这条规矩原来是全列统一的，理由是「一堆会话压在真正的卡上面，这一列就不
       * 再回答『哪个窗口在等我』了」。现在这句话反过来了：待审阅列问的正是
       * 「哪些窗口还没收工」，会话是这个问题的**正主**，把它们沉到底才是答非所问。
       * 另外两列（在跑 / 待办）里它们是顺带看看的东西，照旧沉底。
       */
      if (column !== 'review') {
        out[column].sort((a, b) => Number(isSessionTask(a)) - Number(isSessionTask(b)))
      }
    }
    return out
  }, [index.roots, index.archivedRoots, now])

  const filtered = useMemo(() => {
    const out = {} as Record<ColumnId, TaskRecord[]>
    for (const column of COLUMN_ORDER) {
      const filter = filters[column]
      const needle = filter.q.trim().toLowerCase()
      out[column] = columns[column].filter(task => {
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
  /** 一个任务的信号输入。会话按会话 id 查，卡按它最后一次执行的会话 id 查。 */
  const signalsOf = (task: TaskRecord): {
    turn?: import('../tone').TurnFact
    pendingKind?: string
    goalPhase?: string
    stuckChildren?: number
    unread?: boolean
  } => {
    const sessionId = task.fromSession ?? lastExecution(task)?.sessionId
    if (sessionId === undefined) return {}
    return {
      ...(signals.facts.get(sessionId) === undefined ? {} : { turn: signals.facts.get(sessionId) }),
      ...(signals.pending.get(sessionId) === undefined ? {} : { pendingKind: signals.pending.get(sessionId) }),
      ...(signals.stuck.get(sessionId) === undefined ? {} : { stuckChildren: signals.stuck.get(sessionId) }),
      // 「它自己宣布目标达成了」—— 只有这一条能让卡变绿。
      // 从会话事件日志里读的（最后一条 `goal/change`），不是投影，见 sessionfacts.ts
      ...(signals.goalPhases.get(sessionId) === undefined ? {} : { goalPhase: signals.goalPhases.get(sessionId) }),
      unread: signals.unread.has(sessionId),
    }
  }

  /**
   * 一张卡要的全部东西。
   *
   * **得知道是哪一列**：「待审阅」里没有具体理由的卡也要上一个中性的闲着色
   * （用户的要求是「待审阅中的每个卡片都应该有自己的边框颜色」）。
   * 别的列没有这个兜底 —— 「进行中」是还在跑、「待办」还没开跑，
   * 那时候「闲着」根本不是一种状态。
   */
  const cardProps = (task: TaskRecord, column: ColumnId) => {
    const input = toneInputOf(task, { ...signalsOf(task), column, blind: signals.factsWhy !== null })
    const tone = task.archivedAt === undefined ? toneOf(input) : undefined
    return {
      task, index, now, workspaces, selectedId, onSelect,
      /*
       * 会话行**也能拖**，但只有「归档」那一列收它 —— 见下面 `droppable` 的算法。
       * 早先这里是 `canMove && !isSessionTask(task)`，会话一律拖不动；
       * 现在「收工」那句话只有人说了算，而拖是说出那句话的最直接的方式。
       */
      canMove,
      dragging: dragging?.id === task.id,
      onDragBegin: setDragging,
      onDragEnd: () => setDragging(undefined),
      /* 「开始」只在「待办」列出现 —— 见 CardProps 里那段 */
      ...(onRun === undefined ? {} : { onRun: () => onRun(task) }),
      tone,
      toneWhy: tone === undefined ? undefined : toneReason(input),
      /*
       * 「能不能收工」要单独给下来，不能在卡片里自己猜 ——
       * 猜的话，一张在跑的会话卡上会写着「拖到归档就是收工」，
       * 而它拖过去根本不会被接收（在跑的不许收工）。
       * 真正说了算的是 `dropTarget`，这里只是把它的结论转述给卡片。
       */
      canArchive: canMove && dropTarget(task, 'archived') === 'archive',
      canRestore: canMove && dropTarget(task, 'review') === 'restore',
    }
  }

  /**
   * 这个任务能不能放进这一列。
   *
   * 会话行**只认「归档」**：其余三列对它是算出来的（在跑 / 没在跑），
   * 拖过去没有东西可写——一个「接受了但什么也没发生」的放置区，
   * 比不让放更让人困惑。卡片则相反：四列里除了归档都对应一个账本状态，
   * 归档对应账本的 `archivedAt`。
   */
  const dropTarget = (task: TaskRecord, column: ColumnId): 'move' | 'archive' | 'restore' | undefined => {
    const archived = task.archivedAt !== undefined

    // 收工过的：只能往「归档」外面拖（= 撤销归档）
    if (archived) return column === 'archived' ? undefined : 'restore'
    if (column === 'archived') {
      /*
       * **在跑的不许收工。** 看板那边对卡也是这个规矩（原话
       * `running task cannot be archived`），会话这边由我们自己把住。
       * 收一件还在动的事，等于把它的后半段藏起来 —— 它跑完时你已经
       * 看不到它了，而它恰恰是那时候最需要你看的。
       *
       * 会话行**没有执行记录**，`isRunning` 在它身上恒为 false，
       * 所以要看它自己的 `status` —— 那个值是我们按宿主的 `running` 推出来的。
       */
      const live = isSessionTask(task) ? task.status === 'running' : isRunning(task)
      return live ? undefined : 'archive'
    }

    // 会话行只认归档。其余三列对它是算出来的（在跑 / 没在跑），拖过去没有东西可写
    if (isSessionTask(task)) return undefined
    // 拖回自己原来那一列不算有地方可放：接收了也只是原地不动
    return STATUS_COLUMN[task.status] === column ? undefined : 'move'
  }

  const anyFilter = COLUMN_ORDER.some(column => {
    const filter = filters[column]
    return filter.ws !== '' || filter.q.trim().length > 0 || filter.trig !== 'all'
  })

  const totalVisible = COLUMN_ORDER.reduce((sum, column) => sum + filtered[column].length, 0)
  if (totalVisible === 0) {
    if (anyFilter) {
      return (
        <div className="board is-empty">
          <EmptyState
            title="没有匹配的任务"
            body="筛选条件把账本滤空了，清一下试试。"
            actionLabel="清空全部筛选"
            onAction={() => {
              setFilters({ running: EMPTY_FILTER, review: EMPTY_FILTER, todo: EMPTY_FILTER, archived: EMPTY_FILTER })
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
      {COLUMN_ORDER.map(column => {
        const meta = COLUMN[column]
        const all = columns[column]
        const items = filtered[column]
        const filter = filters[column]
        const filteredNow = filter.ws !== '' || filter.q.trim().length > 0 || filter.trig !== 'all'
        /*
         * **只有「归档」按天分组。**
         *
         * 「待审阅」原本也分，用户看过之后说不要：「待审阅这栏不需要根据时间
         * 分节，排序条件应该是根据更新时间正序（最早的放最前面）」。
         * 分组和「最早的在最上面」本来就是打架的 —— 按天分完，组内再怎么排，
         * 跨过组边界就断了。这一列要的是一条从头到尾的队列。
         *
         * 归档保留分组：那一列是只增不减的历史，按天折 + 只放 7 个工作日
         * 才收得住。「进行中」和「待办」是有多少看多少，折起来只是多一次点击。
         *
         * 注意：**筛过之后照样按天分组**（筛完退回一长条平铺列表的话，
         * 用户每打一个字列表结构就变一次，找东西反而更难）。
         */
        const dated = column === 'archived'
        const days = dated ? groupByDay(items, now) : undefined
        const shown = days === undefined ? undefined : paginateByWorkday(days, pages[column] * WORKDAYS_PER_PAGE)
        const rest = days === undefined ? [] : days.slice(shown!.length)
        const restCount = rest.reduce((sum, group) => sum + group.items.length, 0)
        const restWorkdays = rest.filter(group => !group.weekend).length

        const droppable = canMove && dragging !== undefined && dropTarget(dragging, column) !== undefined

        return (
          <section
            className={`col${over === column && droppable ? ' drop-on' : ''}`}
            key={column}
            aria-label={meta.label}
            onDragOver={canMove
              ? event => {
                  // 不 preventDefault 的话浏览器不认这是放置区，drop 根本不会触发
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setOver(column)
                }
              : undefined}
            onDragLeave={canMove
              ? event => {
                  // 移到自己的子元素上也会触发 dragleave。不排掉的话，
                  // 鼠标从列的空白处挪到卡片上，整列的高亮就闪一下没了
                  if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
                  setOver(current => (current === column ? undefined : current))
                }
              : undefined}
            onDrop={canMove
              ? event => {
                  event.preventDefault()
                  const task = dragging
                  setOver(undefined)
                  setDragging(undefined)
                  if (task === undefined || !droppable) return
                  switch (dropTarget(task, column)) {
                    case 'archive': onArchive?.(task, true); return
                    case 'restore': onArchive?.(task, false); return
                    case 'move': onMove?.(task, column); return
                    default: return
                  }
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
              {searchOpen[column] ? (
                <MiniSearch
                  value={filter.q}
                  placeholder={`在「${meta.label}」列里搜名称 / 标签…`}
                  ariaLabel={`在「${meta.label}」列里搜索`}
                  onChange={next => setFilter(column, { q: next })}
                  onClose={() => {
                    setSearchOpen(current => ({ ...current, [column]: false }))
                    setFilter(column, { q: '' })
                  }}
                />
              ) : (
                <>
                  <Dropdown
                    mini
                    value={filter.ws}
                    options={wsOptions}
                    ariaLabel={`「${meta.label}」列的项目筛选`}
                    onChange={next => setFilter(column, { ws: next })}
                  />
                  <IconMini
                    on={filter.q.length > 0}
                    label={`在「${meta.label}」列里搜索`}
                    title={filter.q.length > 0 ? `正在筛选：${filter.q}` : `在「${meta.label}」列里搜索`}
                    onClick={() => setSearchOpen(current => ({ ...current, [column]: true }))}
                  >
                    <IconMag />
                  </IconMini>
                  <div className="select-wrap mini">
                    <select
                      className={filter.trig === 'all' ? undefined : 'on'}
                      aria-label={`「${meta.label}」列的触发方式筛选`}
                      value={filter.trig}
                      onChange={event => setFilter(column, { trig: event.target.value as ColFilter['trig'] })}
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
                        onClick={() => setFilter(column, EMPTY_FILTER)}
                      >
                        清空本列筛选
                      </button>
                    </>
                  ) : (
                    COLUMN_EMPTY[column]
                  )}
                </p>
              ) : shown === undefined ? (
                items.map(task => (
                  <Card key={task.id} column={column} {...cardProps(task, column)} />
                ))
              ) : (
                <>
                  {shown.map((group, groupIndex) => {
                    const key = `${column}:${group.key}`
                    const open = override.get(key) ?? groupIndex === 0
                    /*
                     * 这个 div **必须有样式**：`.col-body` 的 8px 间距只作用在
                     * 它的直接子元素上，而按天分组时卡片全在这个 div 里面 ——
                     * 不给它 `day-group`，组内就是 0 间距，同一天的卡会粘成一块。
                     */
                    return (
                      <div className="day-group" key={group.key}>
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
                              <Card key={task.id} column={column} {...cardProps(task, column)} />
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
                        onClick={() => setPages(current => ({ ...current, [column]: current[column] + 1 }))}
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

/** 各列空着时那句话。分开写是有用的：「归档」空着是好事，「进行中」空着不是。 */
const COLUMN_EMPTY: Record<ColumnId, string> = {
  running: '现在没有在跑的',
  review: '没有等你过目的 —— 都收工了',
  todo: '没有排着队的事',
  archived: '还没收工过任何一件',
}

interface CardProps {
  task: TaskRecord
  /** 它现在显示在哪一列。**颜色只有「待审阅」列显示**（`cascade` 除外）。 */
  column: ColumnId
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
  tone?: Tone
  /** 颜色旁边那句话，进 title 气泡。 */
  toneWhy?: string
  /** 拖到「归档」这一列会被接收。由 `dropTarget` 算，卡片自己不改判。 */
  canArchive: boolean
  /** 拖出「归档」会被接收（= 撤销归档）。 */
  canRestore: boolean
  /**
   * 把这张卡跑起来。**只有待办列那张卡会渲染它** —— 别的列要么已经在跑、
   * 要么已经跑完（那时候该问的是「结果怎么样」，不是「再开一次」）。
   */
  onRun?: () => void
}

/**
 * 一张卡。**四行永远都渲染**（没内容就是空 div）——少一行的话 grid 会把后面的
 * 提上来，「第几行是什么」这条对齐就断了。
 */
function Card({ task, column, index, now, workspaces, selectedId, onSelect, canMove, dragging, onDragBegin, onDragEnd, tone, toneWhy, canArchive, canRestore, onRun }: CardProps) {
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
      ? `会话 ${task.fromSession} · ${wsName} · ${COLUMN[column].label}`
      : `${task.id} · ${wsName} · ${COLUMN[column].label}`,
    // **颜色那句话排在最前面。** 它是这张卡上唯一一条「为什么现在要看它」的信息，
    // 排在描述后面就等于没说
    tone === undefined ? undefined : `【${TONE_LABEL[tone]}】${toneWhy ?? ''}`,
    task.description.length > 0 ? task.description : undefined,
    session ? `这一行是没有任务卡的会话。点开可以直接接着聊${canArchive ? '；拖到「归档」就是收工' : ''}` : undefined,
    // 说在动手之前。跑到一半的卡移不动是看板的规矩，等拖完再弹一句「不行」
    // 是把一句话该在前面的信息放到了后面
    canMove && !session && running ? '跑着的时候移不动：锁属于那次执行，不属于这一列的名字' : undefined,
    // 说「能拖到归档」之前先确认它真能被接收 —— 见 `canArchive` 的注释
    canArchive ? '拖到「归档」就是收工' : undefined,
    canArchive && !session ? '拖到别的列可以换状态' : undefined,
    canRestore ? '拖回左边任意一列就是撤销归档' : undefined,
  ].filter(Boolean).join('\n')

  const showsTone = tone !== undefined && toneShowsIn(tone, column)

  return (
    <article
      className={`card${running || task.status === 'running' ? ' is-running' : ''}${session ? ' is-session' : ''}${task.id === selectedId ? ' on' : ''}${dragging ? ' is-dragging' : ''}${canMove ? ' can-move' : ''}${showsTone ? ` tone tone-${tone}` : ''}`}
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
      style={{
        ['--bar' as string]: barColor(last),
        // 边框色走变量，呼吸动画才能只改这一个值 —— 见 styles.ts 里那条 `tone-breathe`
        ...(showsTone ? { ['--tone' as string]: toneColor(tone!) } : {}),
      }}
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
          {/* 这里原来摆一个会话 id 的缩写 chip。用户 2026-10-14 说不要：
              「不需要展示 sessionId 在卡片上」—— 一串十六进制对人没有任何用，
              想认哪个会话看标题就够了。要看 id 去悬停气泡或者抽屉里（那两处的
              是**给人复制用的**，不是摆在脸上当装饰的）。 */}
        </span>
      </div>

      <div className="card-meta">
        <span className="when">{when.k} {when.v}</span>
        <span className="when-slot">
          {/*
            **开始** —— 待办的卡等的就是这一下。
            摆在这一格（而不是卡片上别处）是因为它跟排期钟是同一类东西：
            「这张卡接下来会怎么动」。位置固定、行高不变，卡片的四行模板不受影响。
            点它不能顺带把抽屉打开，所以要把冒泡掐掉。
          */}
          {onRun !== undefined && column === 'todo' && !isSessionTask(task) ? (
            <button
              type="button"
              className="card-run"
              title="开始：在工作区里开一个会话，把执行提示词发过去。卡片会自己挪到「进行中」"
              onClick={event => { event.stopPropagation(); onRun() }}
            >
              ▶ 开始
            </button>
          ) : null}
          {scheduleMark(task, now)}
        </span>
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
