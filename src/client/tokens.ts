/**
 * 宿主设计令牌的本地别名 + 任务状态的配色。
 *
 * 这一层存在的理由只有一个：**配色全部来自宿主的 `--dsw-*` 变量，一个色值都不自己写。**
 * 宿主 ui-theme 的 README 把话说死了——「token 样式表是颜色值的唯一权威来源」，
 * 第三方要加新值必须走设计负责人批准，所以这里一个 hex 都不出现。
 *
 * 附带的好处是深浅两套色**自动跟着走**：宿主把色板挂在 `body[data-ds-dark-theme]` 上，
 * 我们只读变量，用户切主题时不用重新挂载、不用监听任何东西。
 */
import type { TaskStatus } from './types'

/** 五种状态 → 宿主已有的五个语义状态令牌。不新增颜色。 */
export interface StatusMeta {
  /** 列头显示的名字。 */
  label: string
  /** 一句话说清这一列是什么意思（列头 tooltip 用）。 */
  desc: string
  /** 主色，取自宿主语义令牌。 */
  tone: string
  /** 状态点在列头里的 CSS 变量名。 */
  varName: string
}

export const STATUS_ORDER: readonly TaskStatus[] = ['backlog', 'todo', 'running', 'done', 'failed'] as const

export const STATUS: Record<TaskStatus, StatusMeta> = {
  backlog: {
    label: '待规划',
    desc: '还没想清楚要做什么',
    tone: 'var(--dsw-alias-state-idle-primary)',
    varName: '--tb-tone-idle',
  },
  todo: {
    label: '待办',
    desc: '想清楚了，等一个执行者',
    tone: 'var(--dsw-alias-state-business-primary)',
    varName: '--tb-tone-business',
  },
  running: {
    label: '进行中',
    desc: '有一个执行者正在跑',
    tone: 'var(--dsw-alias-state-warn-primary)',
    varName: '--tb-tone-warn',
  },
  done: {
    label: '已完成',
    desc: '跑完了，结果是成功的',
    tone: 'var(--dsw-alias-state-success-primary)',
    varName: '--tb-tone-success',
  },
  failed: {
    label: '已失败',
    desc: '跑完了，结果是失败的',
    tone: 'var(--dsw-alias-state-error-primary)',
    varName: '--tb-tone-error',
  },
}

/** 状态是不是一个「结束了的」状态（结束了的列要按日期分组）。 */
export function isSettled(status: TaskStatus): boolean {
  return status === 'done' || status === 'failed'
}
