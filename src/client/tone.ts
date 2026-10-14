/**
 * 「这张卡为什么停在这儿」—— 卡片外边框的颜色。
 *
 * ## 颜色的含义，一句话一条
 *
 * | 色 | 意思 | 谁造成的 |
 * |---|---|---|
 * | 红 | 这一轮没走完，你得看一眼 | 外力，或者你自己按的停止 |
 * | 橙 | 它**停住了**，等你做一个动作才能继续 | 它在等权限 / 等选择 / 等审计划 |
 * | 绿 | 它自己宣布目标达成 | 它 |
 * | 蓝 | 跑完一轮，轮到你了 | 它 |
 * | 橙红呼吸 | **它下面还压着东西**（子代理在等 / 子代理挂了） | 藏在里层，所以会动 |
 *
 * ## 判断只看机器码，不解析文本
 *
 * 宿主在 `turn/end` 里给的 `reason.kind` 和 `reason.error.code` 是**稳定的机器码**，
 * 源码注释原话："route on this, never by parsing `message`"。所以下面一个字符都
 * 不去猜错误文本——`message` 只用来显示，从来不用来判断。
 *
 * ## 为什么「怎么停的」和「在哪一列」是两件事
 *
 * 位置由列回答（还没被收走 / 在跑 / 等开跑），颜色由这里回答（为什么停）。
 * 一张被归档的卡就不再问「为什么停」了——你已经收工了，颜色归零。
 */
import type { ExecutionRecord, TaskRecord } from './types'

export type Tone = 'red' | 'orange' | 'green' | 'blue' | 'cascade'

/** 每种颜色一句话，给 title 气泡用。 */
export const TONE_LABEL: Record<Tone, string> = {
  red: '这一轮没走完',
  orange: '停住了，等你',
  green: '目标达成',
  blue: '跑完了，等你发话',
  cascade: '它下面还压着东西',
}

/**
 * 外力那几类：网络、额度、凭据、路由。**只用来把话说得更准**，
 * 颜色不另分——不管哪种，用户的动作都是「去看一眼、处理掉」。
 */
const CAUSE_LABEL: Record<string, string> = {
  SERVER: '服务端出错',
  TRANSPORT: '连不上，或者断网了',
  TIMEOUT: '请求超时',
  RATE_LIMIT: '被限流了',
  QUOTA: '额度用尽',
  ACCOUNT_QUOTA: '账户额度用尽',
  AUTH: '登录失效',
  INVALID_CREDENTIAL: '密钥不对',
  MISSING_CREDENTIAL: '没配密钥',
  NO_ADAPTER: '没有可用的模型路由',
  CONTEXT_WINDOW_EXCEEDED: '上下文超了，得开新会话',
  EMPTY_RESPONSE: '模型返回了空内容',
  FILES_API: '文件接口出错',
}

/** 一轮为什么结束。跟着宿主的 `turn/end` 事件走，不另起名字。 */
export interface TurnFact {
  kind: string
  code?: string
  message?: string
  abortKind?: string
  at: number
}

export interface ToneInput {
  /** 上一轮的结论。读不到就是 undefined——**读不到不是「没跑过」**。 */
  turn?: TurnFact
  /** 会话正在等什么：`approval` / `question` / `plan-review`。 */
  pendingKind?: string
  /** 目标阶段：`active` / `paused` / `blocked` / `complete`。多数会话没有。 */
  goalPhase?: string
  /** 它下面挂着几个「在等 / 挂了」的子代理。带层级的东西藏在这里，所以要动。 */
  stuckChildren?: number
  /** 跑完了、你还没看。宿主的 `completionUnread`。 */
  unread?: boolean
  /** 最近一次执行。卡走这条，会话没有。 */
  execution?: ExecutionRecord
  /** 排期该跑没跑成的原因。只有外力才留这个，人工关掉的压根不会「到点」。 */
  skippedReason?: string
}

/**
 * 判断一张卡 / 一个会话该是什么颜色。
 *
 * **顺序是有讲究的**，从上往下：
 *   1. 子代理压着——最优先。它是唯一一条「你看不见」的，其他几种好歹在卡片自己身上。
 *   2. 它停住了等你——有动作要做的排在没有动作的前面。
 *   3. 没走完 / 目标达成 / 跑完待判。
 *
 * 没停过、也没在等的返回 `undefined`，界面就画一条普通的边。
 */
export function toneOf(input: ToneInput): Tone | undefined {
  if ((input.stuckChildren ?? 0) > 0) return 'cascade'

  if (input.pendingKind !== undefined) return 'orange'
  // 目标被卡住是它自己说「我干不下去了」，带人话原因——本质还是「它在等你」
  if (input.goalPhase === 'blocked') return 'orange'

  // 排期到点没跑成。**只有外力才会留下这个**：人工关掉的排期压根到不了点。
  if (input.skippedReason !== undefined) return 'red'

  const outcome = input.execution?.result
  // 卡是失败结算的
  if (outcome === 'failed') return 'red'
  // 卡跑着跑着被取消：跟会话那边的 `aborted` 同一种事，同一种颜色
  if (outcome === 'cancelled') return 'red'

  const turn = input.turn
  if (turn !== undefined) {
    if (turn.kind === 'completed') {
      if (input.goalPhase === 'complete') return 'green'
      return input.unread === true ? 'blue' : undefined
    }
    /*
     * `unknown` 是**我们读不出来**，不是它出了事。这两个必须分开：
     * 上色等于替它宣布「这一轮没走完」，可我们压根没读到它怎么走的。
     * 读不到这件事由页面顶上的那条横幅去说，不能变成卡片上的一个假结论。
     *
     * （注意这跟看板那侧的原则不冲突。那边说的是「读不出来**不能当成成功**」，
     * 因为它们要拿这个判断要不要写一条结算记录 —— 写错了会留下假账。
     * 我们只是不上色，什么都没改。）
     */
    if (turn.kind === 'unknown') return undefined
    if (turn.kind === 'blocked') return 'orange'
    // 其余的（`error` / `max-tokens` / `aborted` / `interrupted` / 认不出的**具体值**）
    // 一律红 —— 认得出形状、认不出名字的那些，仍然是「这一轮没正常结束」
    return 'red'
  }

  return undefined
}

/**
 * 颜色旁边那句话。**说人话，不说机器码。**
 *
 * 机器码留在括号里——用户拿它去搜、去对照日志的时候有用，
 * 但第一眼要看到的是「额度用尽」而不是 `QUOTA`。
 */
export function toneReason(input: ToneInput): string | undefined {
  if ((input.stuckChildren ?? 0) > 0) {
    return `它派出去的子代理里有 ${input.stuckChildren} 个卡住了——展开才看得见`
  }
  if (input.pendingKind === 'approval') return 'AI 在等你批准一个操作'
  if (input.pendingKind === 'plan-review') return 'AI 出了个方案，等你审'
  if (input.pendingKind === 'question') return 'AI 在问你一个问题'
  if (input.pendingKind !== undefined) return `AI 在等你（${input.pendingKind}）`
  if (input.goalPhase === 'blocked') return 'AI 自己报告说这个目标走不下去了'
  if (input.skippedReason !== undefined) return `排期到点了没跑成：${input.skippedReason}`

  const outcome = input.execution?.result
  if (outcome === 'failed') return input.execution?.error ?? '上次执行失败结算'
  if (outcome === 'cancelled') return '上次执行被取消了'

  const turn = input.turn
  if (turn === undefined) return undefined
  if (turn.kind === 'unknown') return '这一轮是怎么结束的没读出来'
  if (turn.kind === 'completed') {
    if (input.goalPhase === 'complete') return 'AI 宣布目标达成'
    return input.unread === true ? '跑完一轮，你还没看' : undefined
  }
  if (turn.kind === 'blocked') return '被挡下来了，没走到下一步'
  if (turn.kind === 'max-tokens') return '上下文用尽了，这一轮没走完'
  if (turn.kind === 'aborted') {
    if (turn.abortKind === 'hook') return '被一个钩子中止了'
    // `disposed` 是**会话被宿主释放掉**（关应用 / 重启那一下），跟「人按了停止」
    // 是两回事：机器上真实存在这两种，`user` 和 `disposed` 各一个。
    // 早先这里一律写「你按了停止」，等于把自己的重启赖到用户头上 —— 真发生过。
    if (turn.abortKind === 'disposed') return 'DSH 关掉了这个会话，这一轮没走完'
    return '你按了停止，这一轮没走完'
  }
  if (turn.kind === 'interrupted') return 'DSH 重启打断了这一轮'
  if (turn.kind === 'error') {
    const cause = turn.code === undefined ? undefined : CAUSE_LABEL[turn.code]
    const base = cause ?? '这一轮报错结束了'
    return turn.code === undefined ? base : `${base}（${turn.code}）`
  }
  return `这一轮没正常结束：${turn.kind}`
}

/** 颜色值。走宿主令牌，不自己调色——见 memory 里那条「宿主设计令牌」。 */
export function toneColor(tone: Tone): string {
  switch (tone) {
    case 'red': return 'var(--state-error)'
    case 'orange': return 'var(--state-warn)'
    case 'green': return 'var(--state-success)'
    case 'blue': return 'var(--business-primary)'
    case 'cascade': return 'var(--state-error)'
  }
}

/**
 * 颜色在哪些列里显示。
 *
 * 用户定的规矩是「这些奇怪的边框只在待审阅出现」——**只有一处例外，而且是故意的**：
 * 子代理卡住的那种（`cascade`）在哪儿都显示。因为它的全部意义就是「你看不见它」，
 * 把它也关进待审阅列，就等于把它藏起来了——它恰恰是藏得最深的那一种，
 * 而且父会话通常还在「进行中」列上。
 */
export function toneShowsIn(tone: Tone | undefined, column: string): boolean {
  if (tone === undefined) return false
  return tone === 'cascade' || column === 'review'
}

/** 从一张任务上取出判断要的输入。 */
export function toneInputOf(
  task: TaskRecord,
  signals: {
    turn?: TurnFact
    pendingKind?: string
    goalPhase?: string
    stuckChildren?: number
    unread?: boolean
  },
): ToneInput {
  const last = task.executions.at(-1)
  return {
    turn: signals.turn,
    pendingKind: signals.pendingKind,
    goalPhase: signals.goalPhase,
    stuckChildren: signals.stuckChildren,
    unread: signals.unread,
    execution: last,
    skippedReason: task.schedule?.skippedReason,
  }
}
