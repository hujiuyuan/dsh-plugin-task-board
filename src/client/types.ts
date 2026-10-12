/**
 * 我们**读到**的任务形状。
 *
 * 为什么自己声明而不 import 看板的类型：看板是另一个第三方插件，可以不在场。
 * 一个 `import type` 虽然编译后会被抹掉，但只要写了就得把它加进依赖，
 * 于是「看板没装」这件事在安装期就变成了硬错误——而我们恰恰要能在看板不在场时
 * 靠账本兜底。所以这里只抄我们真正读的字段，来源是
 * `@linxin666/dsh-client-ui-task-board` 的 `src/core/tasks.ts`（v0.2.x）。
 *
 * 抄错字段名的代价是那一格显示为空——不会崩，也不会误报。所以宁可少抄不猜：
 * 每个字段都对着源码抄的，源码里没有的东西（原型里的 `goal` / `scenario` /
 * `background` / `acceptance` 那批）这里一个都没有。
 */

/** 看板的状态机，一列一个。 */
export type TaskStatus = 'backlog' | 'todo' | 'running' | 'done' | 'failed'

/** 一次执行的结局。 */
export type ExecutionOutcome = 'succeeded' | 'failed' | 'cancelled'

/** 一次真实的执行尝试。 */
export interface ExecutionRecord {
  id: string
  /** 跑这次的那个 DSH 会话；创建还没完成时没有。 */
  sessionId: string | undefined
  startedAt: number
  /** 还没结束就是 undefined。 */
  endedAt: number | undefined
  result: ExecutionOutcome | undefined
  error: string | undefined
  /**
   * 发起这次执行的会话 id。**定时触发时没有**（源码注释：cron 触发的来源未知）——
   * 所以「这次是定时跑的还是人点的」只能靠这个字段推：有就是人点的，没有就是定时。
   */
  initiatedBy?: string
  /** 级联执行共用的组 id；单任务执行没有。 */
  runGroupId?: string
  /** 级联父任务自己的结局（子任务还没跑完时先记在这里）。 */
  ownResult?: ExecutionOutcome
}

/** 一条定时规则。 */
export interface ScheduleRule {
  enabled: boolean
  /** 5 段 cron：分 时 日 月 周。 */
  cron: string
  timeZone?: string
  nextRunAt: number | undefined
  lastTriggeredAt: number | undefined
}

/** 任务上的一个标签。 */
export interface TaskTag {
  name: string
  /** 有值时会被拼到执行 prompt 前面；没有就纯粹是显示用的。 */
  promptPrefix?: string
}

/** 一张任务卡。 */
export interface TaskRecord {
  id: string
  title: string
  description: string
  prompt: string
  /** 只有子任务才有。 */
  parentId?: string
  status: TaskStatus
  createdAt: number
  updatedAt: number
  executions: ExecutionRecord[]
  schedule?: ScheduleRule
  workspaceId?: string
  /** 执行会话的 agent 预设 id。 */
  mode?: string
  permission?: string
  model?: string
  reuseSession?: boolean
  teamRun?: boolean
  goalRun?: boolean
  tags?: TaskTag[]
  archivedAt?: number
  hidden?: boolean
  /**
   * 别的插件挂在这张卡上的不透明数据，按扩展 id 分组。看板只存不解释——
   * 我们同理，只把 key 列出来告诉用户「有东西挂在这儿」。
   */
  integrations?: Record<string, unknown>
}

/** 子任务最多嵌几层——看板自己的上限，我们只用来判断深度。 */
export const DEFAULT_MAX_DEPTH = 4
