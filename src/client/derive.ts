/**
 * 「目标 / 场景 / 背景 / 验收 / 优先级」这几个字段，怎么从真实账本里长出来。
 *
 * ## 为什么要这一层
 *
 * 高保真原型里这些字段是写死的样例数据，而真实 `TaskRecord` 里**一个都没有**
 * （见 `types.ts` 顶上那段）。原样照搬就只能显示空白，而空白比没有更糟：
 * 用户会以为卡片坏了。
 *
 * 但「真实账本里没有」不等于「补不出来」。这个文件按一条梯子取值，**每一个值都
 * 带着它是从哪一级来的**，界面上照实标出来：
 *
 * | 级别 | 标记 | 意思 |
 * |---|---|---|
 * | ① | `raw` | 账本里真有这个字段，原样显示 |
 * | ② | `derived` | 从真实数据按写死的规则推出来的。**不需要模型、离线可用、结果稳定** |
 * | ③ | `ai` | 拿这个任务的素材让模型归纳的，可能不准 |
 * | ④ | `edited` | 人手工改过，压过前面三级 |
 *
 * **二级是保底，不是凑数。** 没装模型、模型挂了、用户不想花钱 —— 这一层永远在，
 * 而且它给出的每一句话都能追溯到账本里的一条真实记录，不是编的。
 *
 * ## 一条硬规矩
 *
 * 这个文件里**不许出现任何账本里没有的事实**。可以概括、可以换算、可以拼接，
 * 但不能凭空说「这个任务是为了 XX」。凡是需要那种判断的，标 `ai`，
 * 由用户在界面上决定信不信。
 */
import type { ExecutionRecord, TaskRecord } from './types'
import { humanDuration, isRunning, lastExecution, modeOf, outcomeLabel, planOf, spanEnd, triggerOf } from './model'

/** 这个值是从哪来的。 */
export type FieldSource = 'raw' | 'derived' | 'ai' | 'edited'

export interface Field {
  value: string
  source: FieldSource
  /** 一句话说清是怎么来的。鼠标停上去要能看到，不然「推出来的」和「编出来的」分不清。 */
  why: string
  /** 推不出来（账本里确实没有素材）。界面上要显式说「没有」，不能显示空白。 */
  missing?: boolean
}

/** 原型里优先级是四档。 */
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low'

export interface PriorityField extends Field {
  level: PriorityLevel
}

/** 一条验收项。带 id 是为了让人能勾上——勾选状态存在插件自己的文件里，不写账本。 */
export interface AcceptanceItem extends Field {
  id: string
  checked?: boolean
}

export interface Intent {
  goal: Field
  scenario: Field
  background: Field
  acceptance: AcceptanceItem[]
  priority: PriorityField
}

/** 优先级四档的排序权重（数字大的排前面）。 */
export const PRIORITY_RANK: Record<PriorityLevel, number> = { urgent: 3, high: 2, medium: 1, low: 0 }

/**
 * 只按规则算的优先级权重，**不看模型也不看人工改动**。
 *
 * 单独拿出来是给列表排序用的：排序每次渲染都要算，这里只读账本字段、纯函数、
 * 结果稳定。用带 AI 的那一版排的话，模型一回来整个列表就会重排一次 ——
 * 用户正在找的那张卡会自己跑掉。
 */
export function priorityOf(task: TaskRecord): PriorityField {
  return priorityField(task, undefined, undefined)
}

export function ruleRank(task: TaskRecord): number {
  const last = lastExecution(task)
  if (task.status === 'failed' || last?.result === 'failed') return PRIORITY_RANK.urgent
  if (task.status === 'running') return PRIORITY_RANK.high
  if (task.schedule?.enabled === true) return PRIORITY_RANK.medium
  return PRIORITY_RANK.low
}

export const PRIORITY_LABEL: Record<PriorityLevel, string> = { urgent: '紧急', high: '高', medium: '中', low: '低' }

/**
 * 全部意图字段。
 *
 * @param task - 任务本身。
 * @param now - 当前时刻（算跑了多久、多久没动要用）。
 * @param ai - 模型归纳出来的那一层，没有就传 undefined，整条退回规则推导。
 */
export function deriveIntent(task: TaskRecord, now: number, ai?: AiIntent, override?: Override): Intent {
  return {
    goal: pick(goalField(task), override?.goal, ai?.goal),
    scenario: pick(scenarioField(task), override?.scenario, ai?.scenario),
    background: pick(backgroundField(task, now), override?.background, ai?.background),
    acceptance: acceptanceItems(task, now, ai?.acceptance, override?.acceptanceDone),
    priority: priorityField(task, override?.priority, ai?.priority),
  }
}

/** 模型那一层返回的形状。字段全是可选的——少一个不算失败，那一格退回规则推导。 */
export interface AiIntent {
  goal?: string
  scenario?: string
  background?: string
  acceptance?: string[]
  priority?: PriorityLevel
  /** 模型自己说的把握有多大，只用来在界面上提示，不参与取舍。 */
  confidence?: 'low' | 'medium' | 'high'
}

export interface Override {
  goal?: string
  scenario?: string
  background?: string
  /** 被勾上的验收项 id。 */
  acceptanceDone?: string[]
  priority?: PriorityLevel
}

/**
 * 三级取舍：**人改的 > 模型归纳的 > 规则推的**。
 *
 * 人改的排最前是硬要求：模型每次重跑结果都可能不一样，如果它能盖掉人写的东西，
 * 用户改完一次、下次打开又变回去了 —— 那就没人会去改。
 */
function pick(fallback: Field, edited: string | undefined, generated: string | undefined): Field {
  if (edited !== undefined && edited.trim().length > 0) {
    return { value: edited.trim(), source: 'edited', why: '你自己改过的，模型和规则都不会覆盖它' }
  }
  if (generated !== undefined && generated.trim().length > 0) {
    return {
      value: generated.trim(),
      source: 'ai',
      why: '模型读了这个任务的标题、说明、执行提示和执行记录之后归纳的——可能不准，可以改',
    }
  }
  return fallback
}

// ── ① 目标 ───────────────────────────────────────────────────────────────

/**
 * 目标 = 「这个任务要达成什么」。
 *
 * 优先级：执行提示的第一句 → 说明的第一句 → 标题。
 * 为什么先看 prompt：执行时真正发给 DSH 的就是它，它比说明和标题都更接近「要做什么」。
 */
function goalField(task: TaskRecord): Field {
  const fromPrompt = firstSentence(task.prompt)
  if (fromPrompt !== undefined) {
    return { value: fromPrompt, source: 'derived', why: '取执行提示的第一句（执行时真正发出去的就是它）' }
  }
  const fromDescription = firstSentence(task.description)
  if (fromDescription !== undefined) {
    return { value: fromDescription, source: 'derived', why: '没有执行提示，退回取说明的第一句' }
  }
  if (task.title.trim().length > 0) {
    return {
      value: task.title.trim(),
      source: 'derived',
      why: '执行提示和说明都是空的，只能用标题顶上',
      missing: true,
    }
  }
  return { value: '', source: 'derived', why: '这个任务什么都没写', missing: true }
}

// ── ② 使用场景 ───────────────────────────────────────────────────────────

/**
 * 场景 = 「什么时候该用它」。
 *
 * 这个完全能从真实数据推出来，而且推得比模型准：定时规则和历次执行记录
 * 就是「它什么时候跑」的确切答案，不需要猜。
 */
function scenarioField(task: TaskRecord): Field {
  const kinds = new Set(task.executions.map(triggerOf))

  if (task.schedule !== undefined) {
    const when = planOf(task.schedule)
    if (task.schedule.enabled) {
      return {
        value: `按「${when}」自动触发${kinds.has('manual') ? '，也可以随时手动跑一次' : ''}`,
        source: 'derived',
        why: `账本里的定时规则：${when}`,
      }
    }
    return {
      value: `定时规则写着「${when}」，但**没启用**——现在只能人手动跑`,
      source: 'derived',
      why: `账本里的定时规则：${when}（enabled=false）`,
    }
  }

  if (task.executions.length === 0) {
    return {
      value: '还没有跑过，也没有定时规则',
      source: 'derived',
      why: '账本里这条任务一次执行记录都没有',
      missing: true,
    }
  }
  if (!kinds.has('manual')) {
    return {
      value: '由定时任务自动跑',
      source: 'derived',
      why: `${task.executions.length} 次执行里没有一次是会话发起的`,
    }
  }
  return {
    value: '在会话里手工发起',
    source: 'derived',
    why: `${task.executions.length} 次执行都记着发起会话`,
  }
}

// ── ③ 背景 ───────────────────────────────────────────────────────────────

/** 背景 = 「这件事是怎么来的」——从创建时间、结算时间、历史执行拼。 */
function backgroundField(task: TaskRecord, now: number): Field {
  const parts = [`${stamp(task.createdAt)} 创建`]
  if (task.status === 'done' || task.status === 'failed') parts.push(`${stamp(spanEnd(task, now))} 结算`)

  const runs = task.executions.length
  if (runs === 0) {
    parts.push('一次都没跑过')
  } else {
    const ok = task.executions.filter(execution => execution.result === 'succeeded').length
    const bad = task.executions.filter(execution => execution.result === 'failed').length
    parts.push(`跑过 ${runs} 次（成功 ${ok}，失败 ${bad}，其余没结算）`)
  }

  return {
    value: parts.join(' · '),
    source: 'derived',
    why: '账本里的创建时间、结算时间和执行记录拼出来的',
  }
}

// ── ④ 验收标准 ───────────────────────────────────────────────────────────

/**
 * 验收 = 「凭什么说它成了」。
 *
 * 这里有个诚实性问题：账本里**没有**人写下的验收标准，只有真实发生过的结果。
 * 所以推出来的条目一律是**已经发生的事实**，措辞写成「已有 N 次执行成功」
 * 而不是「应该通过测试」—— 后者是人写的目标，前者是记录。分不清这一点，
 * 用户会以为这些条目是任务创建时定下的。
 */
function acceptanceItems(task: TaskRecord, now: number, ai?: string[], done?: string[]): AcceptanceItem[] {
  if (ai !== undefined && ai.length > 0) {
    return ai.filter(line => line.trim().length > 0).map((line, index) => ({
      id: `ai-${index}`,
      value: line.trim(),
      source: 'ai' as const,
      why: '模型根据这个任务的素材拟的，不是账本里记着的',
      ...(done !== undefined && done.includes(`ai-${index}`) ? { checked: true } : {}),
    }))
  }

  const out: AcceptanceItem[] = []
  const failure = task.executions.filter(execution => execution.result === 'failed').length
  const success = task.executions.filter(execution => execution.result === 'succeeded').length

  if (success > 0) {
    out.push({
      id: 'runs-ok',
      value: `已有 ${success} 次执行跑成功`,
      source: 'derived',
      why: '数的是账本里 result=succeeded 的执行记录',
    })
  }
  if (failure > 0) {
    const latest = [...task.executions].reverse().find(execution => execution.result === 'failed')
    out.push({
      id: 'runs-bad',
      value: latest?.error === undefined ? `有过 ${failure} 次执行失败` : `最近一次失败：${firstSentence(latest.error) ?? latest.error}`,
      source: 'derived',
      why: '数的是账本里 result=failed 的执行记录，后面跟的是它记下的 error 原文',
    })
  }
  if (isRunning(task)) {
    const last = lastExecution(task)!
    out.push({
      id: 'running',
      value: `这一次已经跑了 ${humanDuration(now - last.startedAt)}，还没结算`,
      source: 'derived',
      why: '账本里最后一次执行有开始时间、没有结束时间',
    })
  }
  if (out.length === 0) {
    out.push({
      id: 'none',
      value: '还没有任何执行记录，验收标准只能人来定',
      source: 'derived',
      why: '账本里这条任务一次都没跑过',
      missing: true,
    })
  }
  return out
}

// ── ⑤ 优先级 ─────────────────────────────────────────────────────────────

/**
 * 优先级**不用模型**。四个档位全部由真实状态决定，规则写死：
 *
 * - 紧急：有失败（列状态是已失败，或者最近一次执行失败）
 * - 高：正在跑
 * - 中：有已启用的定时规则（会自己动，得有人看着）
 * - 低：其余
 *
 * 为什么不问模型：模型看不到「跑没跑、失败没失败」这些它真正该依据的东西，
 * 问它只会得到一个听起来合理但和事实无关的答案。
 */
function priorityField(task: TaskRecord, edited?: PriorityLevel, ai?: PriorityLevel): PriorityField {
  const last = lastExecution(task)
  const failed = task.status === 'failed' || last?.result === 'failed'

  if (edited !== undefined) {
    return { level: edited, value: PRIORITY_LABEL[edited], source: 'edited', why: '你自己设的' }
  }
  if (ai !== undefined) {
    return { level: ai, value: PRIORITY_LABEL[ai], source: 'ai', why: '模型给的（它看不到执行记录，这条不太可靠）' }
  }
  if (failed) {
    return {
      level: 'urgent',
      value: '紧急',
      source: 'derived',
      why: task.status === 'failed' ? '这一列是「已失败」' : '列不是失败，但最近一次执行失败了',
    }
  }
  if (task.status === 'running') {
    return { level: 'high', value: '高', source: 'derived', why: '这会儿正有会话在跑' }
  }
  if (task.schedule?.enabled === true) {
    return { level: 'medium', value: '中', source: 'derived', why: '有已启用的定时规则，它会自己动' }
  }
  return { level: 'low', value: '低', source: 'derived', why: '没失败、没在跑、也没有启用的定时规则' }
}

// ── 派生的小事实（卡片和抽屉都用） ───────────────────────────────────────

/**
 * 「手动结算」——列里的状态和最近一次执行的结果**对不上**。
 *
 * 这是原型里最有用的一个徽章，而且它是真的能从账本推出来的：
 * 一个卡在「已完成」列、最近一次执行却失败的卡片，要么是人手工把它判过了，
 * 要么是执行完又出了事。两种都得让人看见。
 */
export function manualSettled(task: TaskRecord): string | undefined {
  if (task.status !== 'done' && task.status !== 'failed') return undefined
  const last = lastExecution(task)
  if (last === undefined) {
    return '这张卡没有执行记录——它的状态是人手工设的，不是执行器结算的'
  }
  if (last.endedAt === undefined) return undefined
  const succeeded = last.result === 'succeeded'
  if (task.status === 'done' && !succeeded) {
    return `列在「已完成」，最近一次执行却是${outcomeLabel(last)}——大概率是人手工判过的`
  }
  if (task.status === 'failed' && succeeded) {
    return '最近一次执行跑成功了，但人手工把它打回了「已失败」'
  }
  return undefined
}

/**
 * 卡片上那枚「每天 / 每周」的周期小标，由排期的频率反推。
 *
 * 单次规则**没有周期**，所以返回 undefined —— 它不该挂「每周」这种标。
 * （`schedule.cron` 在单次规则上是 undefined，直接 trim 会抛。）
 */
export function periodOf(task: TaskRecord): { label: string; why: string } | undefined {
  const schedule = task.schedule
  if (schedule === undefined || !schedule.enabled) return undefined
  if (modeOf(schedule) !== 'cron' || schedule.cron === undefined) return undefined
  const fields = schedule.cron.trim().split(/\s+/)
  if (fields.length !== 5) return undefined
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields

  if (dayOfMonth === '*' && dayOfWeek === '*') {
    return { label: '每天', why: `cron 的日和周都是通配：${schedule.cron}` }
  }
  if (dayOfMonth === '*' && dayOfWeek !== '*') {
    return { label: '每周', why: `cron 只在周几上有约束：${schedule.cron}` }
  }
  if (dayOfMonth !== '*') {
    return { label: '每月', why: `cron 在几号上有约束：${schedule.cron}` }
  }
  if (month !== '*') return { label: '每年', why: `cron 在月份上有约束：${schedule.cron}` }
  if (minute !== '*' && hour !== '*') return { label: '每天', why: `cron 定在固定时刻：${schedule.cron}` }
  return { label: '高频', why: `cron 每小时内触发多次：${schedule.cron}` }
}

/**
 * 「这一期本该跑几次」——**从已启用的 cron 规则算出来的目标**。
 *
 * 这是原型里「周期目标」那个概念唯一说得通的一个真实替身：用户从来没有
 * 在别处设过什么周目标，但他设过定时规则，而定时规则本身就隐含了一个期望
 * ——「每天 9 点跑一次」的意思就是这个星期该跑 7 次。**目标不是编的，
 * 是从他已经写下的东西里读出来的。**
 *
 * 认不出来的表达式返回 undefined，界面上就只说实际跑了几次，不编目标。
 * 宁可没有目标，也不要一个算错的目标 —— 后者会让人得出「我这周少跑了」
 * 这种完全错误的结论。
 *
 * 夏令时、闰月、跨月补跑这些一律不处理：这是给人看的估算，差一次两次
 * 不影响它要回答的那个问题（「这周是不是漏跑了」）。代码里写清楚，
 * 免得以后有人拿它去当排期器用。
 */
export function expectedRuns(cron: string, from: number, to: number): number | undefined {
  const fields = cron.trim().split(/\s+/)
  if (fields.length !== 5) return undefined
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields

  const fixed = (field: string): number | undefined => (/^\d+$/.test(field) ? Number(field) : undefined)
  const every = (field: string): boolean => field === '*'

  /**
   * **一天跑不止一次的排期不算目标。**
   *
   * 这条线是量出来的：一个每 15 分钟跑一次的看门任务，一周的「应跑」是 672 次，
   * 于是卡片上会写「应跑 672 次 · 实跑 4 次，实际少了 668 次」—— 这是纯噪音，
   * 而且会把人引到一个完全错误的结论上（以为排期坏了）。那种频率的任务，
   * 「跑够没跑够」根本不是它的衡量方式。
   *
   * 所以目标只在**一天至多一次**的排期上成立。其余的返回 undefined，
   * 界面就只说实跑了几次。
   */
  if (minute === '*' || minute.includes('*/') || minute.includes(',')) return undefined
  if (hour === '*' || hour.includes('*/') || hour.includes(',')) return undefined
  if (fixed(minute) === undefined || fixed(hour) === undefined) return undefined

  const days = daysBetween(from, to)
  if (days <= 0) return 0

  // 每天一次
  if (every(dayOfMonth) && every(month) && every(dayOfWeek)) {
    return days
  }

  // 每周某几天。cron 的 0 是周日，和 JS 的 getDay() 一致
  if (every(dayOfMonth) && every(month) && !every(dayOfWeek)) {
    const wanted = new Set(dayOfWeek.split(',').map(Number).filter(value => Number.isInteger(value) && value >= 0 && value <= 6))
    if (wanted.size === 0) return undefined
    let count = 0
    for (let i = 0; i < days; i += 1) if (wanted.has(new Date(from + i * 86_400_000).getDay())) count += 1
    return count
  }

  // 每月某一天
  if (fixed(dayOfMonth) !== undefined && every(month) && every(dayOfWeek)) {
    const day = fixed(dayOfMonth)!
    let count = 0
    for (let i = 0; i < days; i += 1) if (new Date(from + i * 86_400_000).getDate() === day) count += 1
    return count
  }

  return undefined
}

/** 两个时刻之间隔了几个整天（向上取整到自然日）。 */
function daysBetween(from: number, to: number): number {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

/**
 * 一个任务在**某一个时间区间内**跑了几次、成了几次。
 *
 * 进度视图的「本周目标 x/y」用这个：原型那里是人为设定的目标进度，
 * 真实数据里没有目标，**有的是实际跑动**——写实际发生的数，比编一个目标强。
 */
export interface PeriodRun {
  runs: number
  succeeded: number
  failed: number
  open: number
}

export function runsIn(tasks: readonly TaskRecord[], from: number, to: number): PeriodRun {
  const out: PeriodRun = { runs: 0, succeeded: 0, failed: 0, open: 0 }
  for (const task of tasks) {
    for (const execution of task.executions) {
      if (execution.startedAt < from || execution.startedAt > to) continue
      out.runs += 1
      if (execution.endedAt === undefined) out.open += 1
      else if (execution.result === 'succeeded') out.succeeded += 1
      else if (execution.result === 'failed') out.failed += 1
    }
  }
  return out
}

// ── 小工具 ───────────────────────────────────────────────────────────────

/**
 * 取第一句。中文的句号、问号、叹号、分号，加上换行，都算断句。
 *
 * 只取第一句是因为这些字段显示的地方只有一行到两行；整段 prompt 贴上去会把
 * 整页撑开，用户反而什么都读不到。原文在「更多信息」里能看全。
 */
export function firstSentence(text: string): string | undefined {
  const trimmed = text.trim()
  if (trimmed.length === 0) return undefined
  const cut = trimmed.search(/[。！？；\n]|[.!?;]\s/)
  const head = (cut < 0 ? trimmed : trimmed.slice(0, cut)).trim()
  if (head.length === 0) return undefined
  return head.length > 120 ? `${head.slice(0, 120)}…` : head
}

function stamp(ms: number): string {
  const date = new Date(ms)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 最近一次执行的一句话摘要，卡片的悬停提示和抽屉都用。 */
export function lastRunLine(task: TaskRecord, now: number): string {
  const last: ExecutionRecord | undefined = lastExecution(task)
  if (last === undefined) return '一次都没跑过'
  if (last.endedAt === undefined) return `正在跑，已跑 ${humanDuration(now - last.startedAt)}`
  return `${outcomeLabel(last)} · 耗时 ${humanDuration(last.endedAt - last.startedAt)} · ${triggerOf(last) === 'schedule' ? '定时触发' : '手工发起'}`
}
