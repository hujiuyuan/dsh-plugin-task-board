/**
 * 五个看板状态的元数据。
 *
 * 每一条都带三样东西，各有各的用处：
 *   - `hue/sat/lig` —— 给 SVG 环形图、甘特条、标签徽章拼 `hsl()` 用。
 *     CSS 变量拼不出这三个数，只能带着走。
 *   - `css` —— 普通 HTML 里用的等价颜色，指向宿主令牌。
 *   - `desc/by/tip` —— 列头 tooltip 的三段解释。**这三段是产品的一部分**，
 *     不是注解：「已完成」那一列为什么旁边会有一条红色的色条，只有读了这段才知道。
 */
import type { TaskStatus } from './types'

export const STATUS_ORDER: readonly TaskStatus[] = ['backlog', 'todo', 'running', 'done', 'failed'] as const

export interface StatusMeta {
  label: string
  hue: number
  sat: string
  lig: string
  css: string
  /** 这一列是什么意思。 */
  desc: string
  /** 谁能把任务放进这一列。 */
  by: string
  /** 一条容易看错的地方。 */
  tip: string
}

export const STATUS: Record<TaskStatus, StatusMeta> = {
  backlog: {
    label: '待规划',
    hue: 220, sat: '9%', lig: '60%',
    css: 'var(--label-tertiary)',
    desc: '还没想清楚怎么做，不具备开跑条件',
    by: '只能手工',
    tip: '这一列不会有自动来源——执行器不会把卡结算到这里。',
  },
  todo: {
    label: '待办',
    hue: 221, sat: '98%', lig: '67%',
    css: 'var(--business-primary)',
    desc: '准备好了，可以跑',
    by: '手工设置；定时任务每次成功跑完会回到这一列',
    tip: '反直觉但重要：一个每天跑的定时任务，你多数时候是在「待办」看到它，不是「已完成」。',
  },
  running: {
    label: '进行中',
    hue: 38, sat: '92%', lig: '50%',
    css: 'var(--state-warn)',
    desc: '执行器正在跑（有还没结算的会话）',
    by: '手工或执行器',
    tip: '有会话在跑的卡在结算前不能被移动——锁属于那次执行，不属于这一列的名字。',
  },
  done: {
    label: '待审阅',
    hue: 142, sat: '69%', lig: '45%',
    css: 'var(--state-success)',
    desc: '跑完了，等你过目。人在界面上看到的这一列叫「待审阅」——「完成」是它的账本状态名，不是它现在的处境。',
    by: '手工或执行器',
    tip: '手工设的状态不产生执行记录，所以「待审阅」可以配一条失败的色条——列是账本的陈述，色条是最近一次运行的事实。',
  },
  failed: {
    label: '已失败',
    hue: 0, sat: '84%', lig: '60%',
    css: 'var(--state-error)',
    desc: '执行器结算失败，或人手工判为失败',
    by: '手工或执行器',
    tip: '同样可以配一条成功的色条——那是「自动跑绿了，但人手工把它打回」。',
  },
}

/**
 * 列。**这是给人看的口径，跟账本的状态不是一回事。**
 *
 * 账本的状态回答「这张卡在哪」（五个值，看板的规矩）；列回答「哪个窗口需要我」
 * （四个值，人的问题）。两者不是一一对应：
 *
 *   - 「待规划」和「待办」合成一列 —— 账本里除了那个 `status` 字段本身，
 *     没有任何事实能支撑「想清楚了没有」（没有目标字段、没有验收字段），
 *     扫一眼的人从这两列得到的是同一个信息：没在跑，也没结束。
 *   - 「已失败」不单独成列 —— 它描述的不是「卡在哪」，是「这东西需要你看一眼」，
 *     跟「跑完了」是同一件事的两面。
 *   - 「归档」在账本里不是状态，是 `archivedAt` 这个标记（看板自己的概念，
 *     归档会解除排期）。会话没有账本，它的归档记在我们自己这儿。
 */
export type ColumnId = 'running' | 'review' | 'todo' | 'archived'

export const COLUMN_ORDER: readonly ColumnId[] = ['running', 'review', 'todo', 'archived'] as const

export interface ColumnMeta {
  label: string
  desc: string
  by: string
  tip: string
  css: string
  hue: number
  sat: string
  lig: string
}

export const COLUMN: Record<ColumnId, ColumnMeta> = {
  running: {
    label: '进行中',
    hue: 38, sat: '92%', lig: '50%',
    css: 'var(--state-warn)',
    desc: '正在跑。不用你管，看一眼就行。',
    by: '自动：任何一列上一开跑就进这里，定时任务和人为都一样',
    tip: '有会话在跑的卡在结算前拖不动——锁属于那次执行，不属于这一列的名字。',
  },
  review: {
    label: '待审阅',
    hue: 262, sat: '72%', lig: '62%',
    css: 'var(--business-primary)',
    desc: '跑完了，等你过目：验收、判下一步、或者收工归档。',
    by: '自动：跑完就落这里。归档只能由你手动放。',
    tip: '带颜色的边框只在这一列出现。颜色说的是「它为什么停在这儿」，位置说的是「还没被收走」。',
  },
  todo: {
    label: '待办',
    hue: 221, sat: '98%', lig: '67%',
    css: 'var(--business-primary)',
    desc: '准备好了、还没开跑。定时任务多数时候在这里。',
    by: '手工设置；带排期的卡成功跑完会回到这里',
    tip: '账本里的「待规划」和「待办」合成了一列——对扫一眼的人来说，这两者给的是同一个信息。新卡默认落在「待办」。',
  },
  archived: {
    label: '归档',
    hue: 220, sat: '9%', lig: '60%',
    css: 'var(--label-tertiary)',
    desc: '你收工了。默认只展开最近 7 个工作日，更早的要点开。',
    by: '**只能手工**。会话永远不会自己掉进这里。',
    tip: '卡的归档走看板账本的 `archivedAt`（看板自己的 archive view 也能看到、也能恢复，归档会解除排期）；会话的归档记在本插件自己的文件里——会话不是账本里的东西。',
  },
}

/** 哪一列收哪些账本状态。 */
export const COLUMN_STATUSES: Record<ColumnId, readonly TaskStatus[]> = {
  running: ['running'],
  review: ['done', 'failed'],
  todo: ['backlog', 'todo'],
  archived: [],
}

/**
 * 一个账本状态**默认**落在哪一列。
 *
 * 「默认」这个词是认真的：一张 `backlog` 的卡在「待办」列里显示，
 * 它的真实状态还是 `backlog`。列是显示口径，状态是账本事实，两者不必相等。
 */
export const STATUS_COLUMN: Record<TaskStatus, ColumnId> = {
  backlog: 'todo',
  todo: 'todo',
  running: 'running',
  done: 'review',
  failed: 'review',
}

/**
 * 一个任务实际显示在哪一列。
 *
 * **归档压过一切**：一张卡归档之后，它账本里的状态还是原来那个（看板不擦掉它），
 * 但界面上它已经在「归档」里了。会话同理 —— 它的 `archivedAt` 装的是我们自己
 * 那份记录。
 */
export function columnOf(task: { status: TaskStatus; archivedAt?: number }): ColumnId {
  if (task.archivedAt !== undefined) return 'archived'
  return STATUS_COLUMN[task.status]
}

/**
 * 拖进这一列时**写下去**的状态。
 *
 * 「归档」没有对应状态——它不是状态，是另一个动作（`archivedAt` 或者我们自己
 * 那份会话归档记录）。合并列之后这个映射必然是多个状态对一个：
 * 拖进「待办」写 `todo`，一张原本是 `backlog` 的卡会被这一拖升成「可跑」。
 */
export const COLUMN_WRITE_STATUS: Record<ColumnId, TaskStatus | undefined> = {
  running: 'running',
  review: 'done',
  todo: 'todo',
  archived: undefined,
}

/**
 * 字符串 → 色相。工作区、标签、都走这一个哈希，所以同一个名字
 * 在哪里都是同一个颜色，不需要存颜色。
 */
export function hueOf(text: string): number {
  let hash = 0
  for (const char of text) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0
  return hash % 360
}

/** 最近一次执行结果 → 卡片左侧那条 3px 色条的颜色。 */
export function barColor(execution: { endedAt?: number; result?: string } | undefined): string {
  if (execution === undefined) return 'transparent'
  if (execution.endedAt === undefined) return 'var(--state-warn)'
  switch (execution.result) {
    case 'succeeded': return 'var(--state-success)'
    case 'failed': return 'var(--state-error)'
    case 'cancelled': return 'var(--label-tertiary)'
    default: return 'transparent'
  }
}
