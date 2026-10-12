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
    label: '已完成',
    hue: 142, sat: '69%', lig: '45%',
    css: 'var(--state-success)',
    desc: '执行器结算成功，或人手工声明「结束了」',
    by: '手工或执行器',
    tip: '手工设的状态不产生执行记录，所以「已完成」可以配一条失败的色条——列是看板的陈述，色条是最近一次运行的事实。',
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
