/**
 * 进度视图：一眼扫过去的仪表盘。
 *
 * 这一页回答的不是「某个任务怎么样了」（那是看板和抽屉的事），而是
 * **「我这一摊子整体什么状态」**。所以三块，从上到下：
 *   ① 总览：环形图 + 按状态逐行 + 三个正交口径（定时 / 大任务 / 子任务）
 *   ② 本期跑动：本周和本月各跑了多少次、成功多少（**不随上面的日期范围变**）
 *   ③ 按工作区：一个工作区一张卡，环 + 堆叠条 + 百分比图例
 *
 * 宽度铺满整屏：这一页是拿来扫的，右半边空着比条子被拉长更糟。
 * 条子拉长之后靠**数字**认差别——每一行右边本来就写着条数和百分比。
 */
import { useMemo, useRef, useState } from 'react'
import { expectedRuns, runsIn } from '../derive'
import { COLUMN, COLUMN_ORDER, columnOf } from '../tokens'
import type { TaskIndex } from '../model'
import { dayKey, isSessionTask, modeOf, spanEnd } from '../model'
import type { TaskRecord } from '../types'
import type { WorkspaceIndex } from '../workspaces'
import { EmptyState, emptyTaskCopy } from './controls'

const DAY_MS = 86_400_000

interface ProgressProps {
  index: TaskIndex
  now: number
  workspaces: WorkspaceIndex
  onSelect: (task: TaskRecord) => void
  /** 数据来源。只影响「一条任务都没有」那句话。 */
  sourceKind: 'board' | 'ledger' | 'unavailable'
}

type Preset = 'week' | 'd7' | 'd30' | 'd90' | 'all'

const PRESETS: ReadonlyArray<{ id: Preset; label: string }> = [
  { id: 'week', label: '本周' },
  { id: 'd7', label: '近 7 天' },
  { id: 'd30', label: '近 30 天' },
  { id: 'd90', label: '近 90 天' },
  { id: 'all', label: '全部时间' },
]

const iso = (ms: number): string => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const startOfDay = (ms: number): number => new Date(ms).setHours(0, 0, 0, 0)
/** 周一为一周的开始（ISO 周）。 */
const startOfWeek = (ms: number): number => {
  const d = new Date(startOfDay(ms))
  const shift = (d.getDay() + 6) % 7
  return d.getTime() - shift * DAY_MS
}
const startOfMonth = (ms: number): number => new Date(new Date(ms).getFullYear(), new Date(ms).getMonth(), 1).getTime()

export function Progress({ index, now, workspaces, onSelect, sourceKind }: ProgressProps) {
  const [from, setFrom] = useState(() => startOfDay(now - 29 * DAY_MS))
  const [to, setTo] = useState(() => startOfDay(now))
  const [preset, setPreset] = useState<Preset | null>('d30')

  const bad = from > to

  /**
   * 止日早于起日时，统计**停在上一组有效区间上**，不是清空。
   *
   * 清空的话用户改日期改到一半（先把起日往后拖），整页数会瞬间全没，
   * 看起来像「这个区间真的一条都没跑过」而不是「你还没填完」。
   */
  const lastGood = useRef({ from: 0, to: 0 })
  if (!bad) lastGood.current = { from, to }

  const applyPreset = (id: Preset): void => {
    const today = startOfDay(now)
    setPreset(id)
    setTo(today)
    if (id === 'week') setFrom(startOfWeek(now))
    else if (id === 'd7') setFrom(today - 6 * DAY_MS)
    else if (id === 'd30') setFrom(today - 29 * DAY_MS)
    else if (id === 'd90') setFrom(today - 89 * DAY_MS)
    else {
      let earliest = today
      for (const task of index.onBoard) earliest = Math.min(earliest, startOfDay(task.createdAt))
      setFrom(earliest)
    }
  }

  const effective = bad ? lastGood.current : { from, to }
  const range = useMemo(
    () => ({ from: effective.from, to: effective.to + DAY_MS - 1 }),
    [effective.from, effective.to],
  )

  /**
   * 一个任务算不算进「这一期」的总数。
   *
   * **两处必须用同一个判据**：总览的「任务总数」和「按工作区」里各卡的总和
   * 对不上的话，这一页就不能信了 —— 而它们对不上过：总览剔掉了子任务、
   * 又按日期区间筛了，按工作区那边两样都没做。
   */
  const inScope = useMemo(() => {
    const ended = (task: TaskRecord): boolean => task.status === 'done' || task.status === 'failed'
    return (task: TaskRecord): boolean => {
      // 子任务单独统计，不进总数（它在两边都进「子任务」那一格）
      if (task.parentId !== undefined) return false
      // 结束了的按「最后活动时间」判区间；还开着的一律计入 —— 它们本来就没结束，
      // 按区间筛掉会得出「这段时间什么都没在做」这种假象
      if (!ended(task)) return true
      const at = spanEnd(task, now)
      return at >= range.from && at <= range.to
    }
  }, [now, range])

  const stats = useMemo(() => {
    const count: Record<string, number> = {}
    for (const column of COLUMN_ORDER) count[column] = 0
    let total = 0
    let scheduled = 0
    let scheduledOn = 0
    let bigTasks = 0
    let subtasks = 0
    let sessions = 0

    /*
     * 归档的也在统计里 —— 它是一列，不是「不存在」。早先这一页看不到归档的东西，
     * 于是「收工率」永远算不出来（分子恒为 0）。
     */
    for (const task of [...index.onBoard, ...index.archivedRoots]) {
      if (task.parentId !== undefined) { subtasks += 1; continue }
      // 「大任务」数的是**账本里的卡**，会话行不算 —— 它没有卡。
      // 但会话行照常进总数和状态分布，否则它们又变成看不见的了
      const session = isSessionTask(task)
      if (session) sessions += 1
      else {
        bigTasks += 1
        if (task.schedule !== undefined) {
          scheduled += 1
          if (task.schedule.enabled) scheduledOn += 1
        }
      }
      if (!inScope(task)) continue
      total += 1
      count[columnOf(task)] += 1
    }
    return { count, total, scheduled, scheduledOn, bigTasks, subtasks, sessions }
  }, [index.onBoard, index.archivedRoots, inScope])

  /**
   * 按工作区分桶。
   *
   * **每个宿主认得的工作区都出一张卡**，哪怕一条任务都没有 ——
   * 这一页是仪表盘，一个刚建好、还没往里放任务的工作区整个消失，
   * 看起来就像插件没读到它（真被这么问过）。
   * 「未钉工作区」是例外：它是我们造出来的，没有任务就不该出现。
   *
   * 每一桶里的数**跟总览同一套口径**（`inScope`），所以各卡的数字加起来
   * 正好等于上面的总数。这是这一页能不能被信的前提。
   */
  const byWorkspace = useMemo(() => {
    type Bucket = { main: TaskRecord[]; scoped: TaskRecord[]; subtasks: number }
    const empty = (): Bucket => ({ main: [], scoped: [], subtasks: 0 })
    const buckets = new Map<string, Bucket>()
    // 先把宿主认得的都摆上（一个任务都没有的也要有卡）
    for (const id of workspaces.all) buckets.set(id, empty())
    for (const task of index.onBoard) {
      const key = task.workspaceId ?? ''
      // **未钉的按需建桶**：它不在宿主清单里，所以上面没摆；真有未钉的任务时才出现。
      // 这条以前写反了（`if (key === '') continue`），后果是所有没钉工作区的任务
      // 在「按工作区」里整个消失，各卡加起来比总览少 —— 正是这个页面最不能出的错。
      let bucket = buckets.get(key)
      if (bucket === undefined) {
        bucket = empty()
        buckets.set(key, bucket)
      }
      if (task.parentId !== undefined) { bucket.subtasks += 1; continue }
      bucket.main.push(task)
      if (inScope(task)) bucket.scoped.push(task)
    }
    return [...buckets.entries()].sort((a, b) => {
      if (a[0] === '') return 1
      if (b[0] === '') return -1
      return workspaces.nameOf(a[0]).localeCompare(workspaces.nameOf(b[0]), 'zh')
    })
  }, [index.onBoard, inScope, workspaces])

  const period = useMemo(() => buildPeriod(index.onBoard, now), [index.onBoard, now])

  if (index.onBoard.length === 0) {
    return (
      <div className="progress is-empty">
        <EmptyState {...emptyTaskCopy(sourceKind)} />
      </div>
    )
  }

  /*
   * **收工率**，不是「完成率」。
   *
   * 分子的口径变过一次。原来数的是账本里 `done` 的卡，可那个状态的意思是
   * 「跑完了、等你过目」——它跟「这件事结束了」根本不是一回事。真正由人
   * 说了算的结束只有一个：**归档**。所以分子换成归档数。
   * 剩下的那些还在「待审阅」里排队，等你自己判。
   */
  const rate = stats.total === 0 ? 0 : Math.round((stats.count.archived / stats.total) * 100)

  return (
    <div className="progress">
      <div className="view-bar">
        <span className="p-date">
          <input
            type="date"
            aria-label="开始日期"
            className={bad ? 'bad' : undefined}
            value={iso(from)}
            onChange={event => { setFrom(new Date(`${event.target.value}T00:00:00`).getTime()); setPreset(null) }}
          />
          <span className="to">→</span>
          <input
            type="date"
            aria-label="结束日期"
            className={bad ? 'bad' : undefined}
            value={iso(to)}
            onChange={event => { setTo(new Date(`${event.target.value}T00:00:00`).getTime()); setPreset(null) }}
          />
        </span>
        <span className="p-quick">
          {PRESETS.map(item => (
            <button key={item.id} type="button" aria-pressed={preset === item.id} onClick={() => applyPreset(item.id)}>
              {item.label}
            </button>
          ))}
        </span>
        {bad ? (
          <span className="p-err">
            结束日期早于开始日期，下面这些数还是 {dayKey(effective.from)} ~ {dayKey(effective.to)} 的
          </span>
        ) : null}
        {/*
          这一页的口径（数的是卡还是会话、区间筛谁不筛谁）原来是正文里的一段字。
          它是**被问出来的**，不是被读出来的 —— 没人对不上数的时候根本不会看它。
          所以挂在一个悬停气泡上：想核的时候一悬停就有，其余时候不占地方。
        */}
        <span className="meter" title={[
          `已收工的任务数 ÷ 任务总数`,
          '**收工 = 归档**，只能由人手动做。跑完的卡停在「待审阅」，不算收工。',
          `统计范围 ${dayKey(effective.from)} ~ ${dayKey(effective.to)}`,
          '日期区间只筛已经结束的任务；还开着的（待办 / 进行中）永远计入',
          '定时 / 大任务 / 子任务分别统计，三者互不相同、也不相加',
          '',
          '数的是任务卡和「没有卡的会话」，不是会话次数：一张卡可以跑很多次，每次一个会话。',
          '同一张卡不会因为跑了十次就被数十遍。',
        ].join('\n')}>
          口径
        </span>
      </div>

      {stats.total === 0 ? (
        <div className="p-range-empty">这个日期区间里没有已经结束的任务。还开着的任务不会被区间筛掉，放宽一下止日试试。</div>
      ) : (
        <div className="p-top">
          <div className="panel p-donut">
            <Donut
              slices={COLUMN_ORDER.map(column => ({ value: stats.count[column], css: COLUMN[column].css, label: COLUMN[column].label }))}
              center={`${rate}%`}
              sub={`${stats.count.archived} / ${stats.total} 已收工`}
              ariaLabel={`按列分布的任务占比，收工率 ${rate}%`}
            />
          </div>

          <div className="panel p-list">
            <h3>按列</h3>
            {COLUMN_ORDER.map(column => {
              const n = stats.count[column]
              const pct = stats.total === 0 ? 0 : (n / stats.total) * 100
              return (
                <div className="p-row" key={column}>
                  <span className="pd" style={{ background: COLUMN[column].css }} aria-hidden="true" />
                  <span className="pn">{COLUMN[column].label}</span>
                  <span className="ptrack"><span className="pfill" style={{ width: `${pct}%`, background: COLUMN[column].css }} /></span>
                  <span className="pc">{n}</span>
                  <span className="pp">{Math.round(pct)}%</span>
                </div>
              )
            })}
            <div className="p-total"><span>任务总数</span><span>{stats.total}</span></div>
            <div className="p-break">
              <span className="bk" title="有定时规则的任务，其中已启用的会自动触发">
                <span className="k">定时</span>
                <b>{stats.scheduled}</b>
                {stats.scheduled > 0 ? <span className="sub">{stats.scheduledOn} 启用</span> : null}
              </span>
              <span className="bk" title="大任务＝账本里不带父任务的顶层卡（不含没有卡的会话）">
                <span className="k">大任务</span>
                <b>{stats.bigTasks}</b>
              </span>
              <span className="bk" title="子任务＝挂在大任务下面的任务">
                <span className="k">子任务</span>
                <b>{stats.subtasks}</b>
              </span>
              <span className="bk" title="没有任务卡的会话：它们也在上面的「任务总数」里。在跑的进「进行中」，其余全在「待审阅」等你收工">
                <span className="k">会话</span>
                <b>{stats.sessions}</b>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="panel p-goal">
        <div className="p-goal-hd">
          {/* 这两句是「目标」这个数的口径，不是内容。原来摆在标题右边占一整行 */}
          <h3 title={[
            '不随上面的日期范围变：这一块永远是本周 / 本月。',
            '目标不是谁设的 —— 它由已启用的定时规则算出来：「每天跑一次」就等于这一周该跑 7 次。',
            '没排期的、以及一天跑不止一次的，都没有目标，只看实跑。',
          ].join('\n')}>
            本期跑动
          </h3>
        </div>
        <div className="pg-wrap">
          <PeriodRow label="本周" range={period.week.range} data={period.week} />
          <PeriodRow label="本月" range={period.month.range} data={period.month} />
        </div>
        <div className={`pg-left${period.lastFailed > 0 ? ' warn' : ''}`} title="上一期（上周 / 上月）里失败过的执行数。写周报时要交代的就是这些">
          {period.lastFailed > 0 ? `⚠ 上期有 ${period.lastFailed} 次执行失败` : '上一期没有失败的执行'}
        </div>
        {period.unschedulable > 0 ? (
          <div className="pg-note" title="这些排期的 cron 写法比较少见，这个视图认不出来，所以没有把它们算进目标里——宁可少算，也不给一个错的目标">
            另有 {period.unschedulable} 条排期的 cron 写法认不出来，没算进目标
          </div>
        ) : null}
      </div>

      <div>
        <p
          className="p-secttl"
          title={'空工作区也留一张卡（这张卡上的数跟上面同一套口径，加起来正好等于「任务总数」）。'}
        >
          按工作区 · 每个工作区一张卡
        </p>
        <div className="p-grid" style={{ marginTop: 8 }}>
          {byWorkspace.map(([id, bucket]) => (
            <WorkspaceCard
              key={id || '__none__'}
              id={id}
              bucket={bucket}
              workspaces={workspaces}
              now={now}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

    </div>
  )
}

/**
 * 一行「本周 / 本月」。
 *
 * 进度条画的是**实际跑了多少次占应跑多少次**（有排期时），没有排期就画
 * 成功占已结算的比例。上面那行字永远同时写出「应跑 / 实跑 / 成功 / 失败」——
 * 光看条看不出是漏跑了还是跑了没成，这两件事要处理的方式完全不同。
 */
function PeriodRow({ label, range, data }: { label: string; range: string; data: PeriodData }) {
  const pct = data.expected > 0
    ? Math.min(100, (data.runs / data.expected) * 100)
    : data.settled === 0 ? 0 : (data.succeeded / data.settled) * 100
  const short = data.expected > 0 && data.runs < data.expected
  return (
    <div className="pg">
      <span className="k">{label}</span>
      <span className="rg">{range}</span>
      <span className="nm">
        {data.expected > 0
          ? <>应跑 <b>{data.expected}</b> 次 · 实跑 <b className={short ? 'short' : undefined}>{data.runs}</b> 次</>
          : <><b>{data.runs}</b> 次执行</>}
        {' · '}成功 <b>{data.succeeded}</b>
        {data.failed > 0 ? <> · 失败 <b>{data.failed}</b></> : null}
        {data.open > 0 ? <> · 在跑 <b>{data.open}</b></> : null}
      </span>
      <span className={`pg-track${short ? ' warn' : ''}`} style={{ gridColumn: '1 / -1' }}>
        <span className="pg-fill" style={{ width: `${pct}%` }} />
      </span>
      {data.expected > 0 ? (
        <span className="pg-sub view-note">
          {short
            ? `按已启用的排期，这一期应该跑 ${data.expected} 次，实际少了 ${data.expected - data.runs} 次`
            : data.runs > data.expected
              ? `比排期多跑了 ${data.runs - data.expected} 次（手动发的）`
              : '跟排期对上了'}
        </span>
      ) : null}
    </div>
  )
}

interface PeriodData {
  runs: number
  succeeded: number
  failed: number
  settled: number
  open: number
  /** 按已启用的排期算出来「这一期本该跑几次」。0 = 没有可算的排期。 */
  expected: number
  range: string
}

function buildPeriod(
  tasks: readonly TaskRecord[],
  now: number,
): { week: PeriodData; month: PeriodData; lastFailed: number; unschedulable: number } {
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)
  const lastWeekStart = weekStart - 7 * DAY_MS
  const lastMonthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - 1, 1).getTime()

  const blank = (range: string): PeriodData =>
    ({ runs: 0, succeeded: 0, failed: 0, settled: 0, open: 0, expected: 0, range })
  const week = blank(`${iso(weekStart).slice(5)} ~ ${iso(weekStart + 6 * DAY_MS).slice(5)}`)
  const month = blank(`${new Date(now).getFullYear()} 年 ${new Date(now).getMonth() + 1} 月`)
  let lastFailed = 0
  let unschedulable = 0

  for (const task of tasks) {
    const schedule = task.schedule
    if (schedule !== undefined && schedule.enabled) {
      // 这一期还没过完，所以只算到「现在」为止 —— 拿整周的目标去比半周的实际，
      // 每天都显示「还差 4 次」是纯粹的噪音
      //
      // 单次规则（mode==='once'）没有 cron，算不出「这一期该跑几次」——
      // 它不是认不出的表达式，是被**特意排除**的，所以不算进 unschedulable
      if (modeOf(schedule) === 'cron' && schedule.cron !== undefined) {
        const weekExpect = expectedRuns(schedule.cron, weekStart, now)
        const monthExpect = expectedRuns(schedule.cron, monthStart, now)
        if (weekExpect === undefined || monthExpect === undefined) unschedulable += 1
        else {
          week.expected += weekExpect
          month.expected += monthExpect
        }
      }
    }

    for (const execution of task.executions) {
      const at = execution.startedAt
      for (const [bucket, from, to] of [[week, weekStart, now], [month, monthStart, now]] as const) {
        if (at < from || at > to) continue
        bucket.runs += 1
        if (execution.endedAt === undefined) bucket.open += 1
        else {
          bucket.settled += 1
          if (execution.result === 'succeeded') bucket.succeeded += 1
          else if (execution.result === 'failed') bucket.failed += 1
        }
      }
      if (at >= lastWeekStart && at < weekStart && execution.result === 'failed') lastFailed += 1
      else if (at >= lastMonthStart && at < monthStart && execution.result === 'failed') lastFailed += 1
    }
  }

  return { week, month, lastFailed, unschedulable }
}

/** 一个工作区桶。口径跟总览同一套，见上面 `byWorkspace` 的注释。 */
interface Bucket {
  /** 这个工作区里全部主任务（不管日期区间）。 */
  main: TaskRecord[]
  /** 其中进了这一期统计的那些（总览「任务总数」的那一份）。 */
  scoped: TaskRecord[]
  subtasks: number
}

interface WorkspaceCardProps {
  id: string
  bucket: Bucket
  workspaces: WorkspaceIndex
  now: number
  onSelect: (task: TaskRecord) => void
}

function WorkspaceCard({ id, bucket, workspaces, now }: WorkspaceCardProps) {
  const { main, scoped, subtasks } = bucket
  const unpinned = id === ''
  // 「大任务」和「定时」跟总览同一套口径：**只数账本里的卡**，会话行不算
  // （它没有卡）。两个地方口径不一致的话，各卡加起来就跟上面的总数对不上，
  // 那一页的数字就整个不能信了 —— 这个错犯过一次。
  const big = main.filter(task => !isSessionTask(task)).length
  const scheduled = main.filter(task => task.schedule !== undefined).length
  const scheduledOn = main.filter(task => task.schedule?.enabled === true).length
  // 环、完成率、任务数都看**进了统计的那一份**；「大任务 / 定时」跟总览一样
  // 不按区间筛，所以读 main
  const tasks = scoped
  const count: Record<string, number> = {}
  for (const column of COLUMN_ORDER) count[column] = 0
  for (const task of tasks) count[columnOf(task)] += 1
  const total = tasks.length
  // 分子是**归档**不是 `done`，跟总览同一套口径 —— 两处不一致的话，
  // 各卡加起来就跟上面的总数对不上，整页数字就都不能信了
  const rate = total === 0 ? 0 : Math.round((count.archived / total) * 100)

  // 百分比用最大余数法补齐到正好 100 —— 各自四舍五入的话加起来常常是 99 或 101，
  // 图例上写出来就是错的
  const percents = largestRemainder(COLUMN_ORDER.map(column => count[column]), total)

  // 工作区卡底部那行：原型写「本周目标 2/3」。真实数据里没有目标，
  // 但**有排期** —— 有排期就写「应跑 / 实跑」，没排期就只写实跑。
  // 「本周跑动」看的是**这个工作区全部任务的本周执行**，不是 `scoped` 那一份 ——
  // scoped 是问「这段时间完成了些什么」，跟「这周跑了几次」不是一回事
  const weekStart = startOfWeek(now)
  const weekRuns = runsIn(main, weekStart, now)
  let expected = 0
  let computable = true
  for (const task of main) {
    const schedule = task.schedule
    if (schedule === undefined || !schedule.enabled) continue
    if (modeOf(schedule) !== 'cron' || schedule.cron === undefined) continue
    const want = expectedRuns(schedule.cron, weekStart, now)
    if (want === undefined) computable = false
    else expected += want
  }

  return (
    <div className="panel p-ws">
      <div className="p-ws-hd">
        <span
          className="wdot"
          style={{ width: 8, height: 8, borderRadius: '50%', flex: '0 0 8px', ['--hue' as string]: String(hueOfId(id)) }}
          aria-hidden="true"
        />
        <span className={`nm${unpinned ? ' unpin' : ''}`} title={workspaces.pathOf(id) ?? workspaces.nameOf(id)}>
          {workspaces.nameOf(id || undefined)}
        </span>
      </div>

      <div className="p-ws-body">
        <div className="p-ws-ring">
          <Donut
            size={88}
            thickness={10}
            slices={COLUMN_ORDER.map(column => ({ value: count[column], css: COLUMN[column].css, label: COLUMN[column].label }))}
            center={`${rate}%`}
            ariaLabel={`收工率 ${rate}%`}
          />
        </div>
        <div className="p-ws-num">
          <b>{total} 个任务</b>
          <span>收工 {count.archived} 个</span>
        </div>
      </div>

      <div>
        <span
          className="stk"
          role="img"
          aria-label={`按列的任务占比：${COLUMN_ORDER.map((c, i) => `${COLUMN[c].label} ${percents[i]}%`).join('，')}`}
        >
          {COLUMN_ORDER.map((column, i) =>
            count[column] === 0 ? null : (
              <span key={column} className="sg" style={{ width: `${percents[i]}%`, background: COLUMN[column].css }} />
            ),
          )}
        </span>
        <div className="stk-lg" style={{ marginTop: 7 }}>
          {COLUMN_ORDER.map((column, i) =>
            count[column] === 0 ? null : (
              <span className="lg" key={column}>
                <i style={{ background: COLUMN[column].css }} aria-hidden="true" />
                {COLUMN[column].label} <b>{percents[i]}%</b>
              </span>
            ),
          )}
        </div>
      </div>

      <div className="p-break">
        <span className="bk" title="有定时规则的任务，其中已启用的会自动触发。不按上面的日期范围筛">
          <span className="k">定时</span>
          <b>{scheduled}</b>
          {scheduledOn > 0 ? <span className="sub">{scheduledOn} 启用</span> : null}
        </span>
        <span className="bk" title="大任务＝账本里不带父任务的顶层卡（不含没有卡的会话）。不按上面的日期范围筛">
          <span className="k">大任务</span>
          <b>{big}</b>
        </span>
        <span className="bk" title="子任务＝挂在大任务下面的任务，单独统计、不进总数">
          <span className="k">子任务</span>
          <b>{subtasks}</b>
        </span>
      </div>

      <div
        className={`p-ws-goal${weekRuns.runs === 0 && expected === 0 ? ' none' : ''}`}
        title="这个工作区里的任务本周跑了几次；有已启用排期的话，前面还会写按排期该跑几次"
      >
        {expected > 0
          ? <>本周应跑 <b>{expected}</b> 次 · 实跑 <b>{weekRuns.runs}</b> 次</>
          : weekRuns.runs === 0
            ? '本周没跑过'
            : <>本周跑过 <b>{weekRuns.runs}</b> 次</>}
        {!computable ? <span className="thin">（有排期认不出来，没算进目标）</span> : null}
      </div>
    </div>
  )
}

function hueOfId(id: string): number {
  let hash = 0
  for (const char of id) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0
  return hash % 360
}

/**
 * 最大余数法：把一组整数按占比分到整数百分比，且**加起来正好 100**。
 * 各自四舍五入会得到 99 或 101，图例里写出来就是错的。
 */
function largestRemainder(values: readonly number[], total: number): number[] {
  if (total === 0) return values.map(() => 0)
  const exact = values.map(value => (value / total) * 100)
  const floored = exact.map(Math.floor)
  let rest = 100 - floored.reduce((sum, value) => sum + value, 0)
  const order = exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)
  const out = [...floored]
  for (const item of order) {
    if (rest <= 0) break
    out[item.index] += 1
    rest -= 1
  }
  return out
}

interface Slice {
  value: number
  css: string
  label: string
}

/**
 * 环形图。纯 SVG，无依赖。
 * 段与段之间留 2px 缝——五个状态里有两对色相挨得近，不留缝会糊成一条。
 */
function Donut({
  slices,
  center,
  sub,
  ariaLabel,
  size = 210,
  thickness = 26,
}: {
  slices: readonly Slice[]
  center: string
  sub?: string
  ariaLabel: string
  size?: number
  thickness?: number
}) {
  const visible = slices.filter(slice => slice.value > 0)
  const total = visible.reduce((sum, slice) => sum + slice.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const gap = 2

  let offset = 0
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={ariaLabel}>
      {total === 0 ? (
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={thickness} style={{ stroke: 'var(--interactive-bg-hover)' }} />
      ) : (
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {visible.map((slice, index) => {
            const length = (slice.value / total) * circumference
            const dash = Math.max(length - gap, 0.5)
            const element = (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                // **颜色必须走 style 而不是 stroke 属性**：`stroke="var(--x)"` 当属性写
                // 是无效值，SVG 会静默不画——环整个消失且控制台一声不响。变量只有在
                // CSS 属性里才会被解析。
                style={{ stroke: slice.css }}
              >
                <title>{`${slice.label} ${slice.value} 个`}</title>
              </circle>
            )
            offset += length
            return element
          })}
        </g>
      )}
      <text className={size > 120 ? 'big' : 'rbig'} x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
        {center}
      </text>
      {sub !== undefined ? (
        <text className="sub" x="50%" y="50%" dy="22" textAnchor="middle" dominantBaseline="central">{sub}</text>
      ) : null}
    </svg>
  )
}
