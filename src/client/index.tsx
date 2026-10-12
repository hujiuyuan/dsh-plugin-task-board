/**
 * dsh-plugin-task-board · 浏览器半体。
 *
 * 往侧边栏插一行「规划视图」，并在中间那一栏注册它对应的页面。
 * 页面里是三个视图：看板 / 甘特 / 进度（编排还没做，见 README 的「已知缺口」）。
 *
 * 两个座位都用 `ctx.slots.inject` 包着注册——
 * 侧边栏和主区域是**外壳插件**声明的座位，而外壳不在的话（换了个宿主组合、
 * 或者某个外壳插件启动失败），我们这边的正确行为是**这一行不存在**，
 * 而不是整个插件启动失败把别人的页面也带下去。
 *
 * 图标和数据源都走公开路径：座位、标签、视图全是自己的，数据先问任务看板的
 * 客户端服务、问不到再读账本快照（详见 `data.ts`）。
 */
import { CSS, STYLE_ID } from './styles'
import { useTaskSource } from './data'
import { Panel } from './views/Panel'

export const name = 'dsh-plugin-task-board'

/** 只声明真正需要的服务：座位表。别的都走 `ctx.get` 试探，不硬依赖。 */
export const inject = ['slots']

/** 侧边栏那一行的 id，同时也是主区域页面的 key——**两处必须一致**，写错就是点了没反应。 */
export const PANEL_ID = 'plan-views'

/**
 * 侧边栏里的位置。现有占用：插件管理 0、任务管理 10、任务看板 20。
 * 21 让它紧挨着任务看板——这两个面板是同一件事的两种看法，中间夹一个别的很怪。
 */
export const PANEL_ORDER = 21

/** 侧边栏那一行的小图标。签名跟宿主的其他面板保持一致：`{ size, active }`。 */
export function PlanPanelIcon({ size }: { size: number; active: boolean }) {
  return (
    <svg
      data-dsh-panel-entry={PANEL_ID}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 三条长短不一的横线 = 甘特的三根条，同时不跟任务看板的方块图标撞脸 */}
      <rect x={2} y={3} width={12} height={2.4} rx={1.2} />
      <rect x={2} y={6.8} width={7.5} height={2.4} rx={1.2} />
      <rect x={2} y={10.6} width={10} height={2.4} rx={1.2} />
    </svg>
  )
}

/** 把样式表挂进 document，只挂一次。返回摘除函数。 */
function installStyles(): () => void {
  const existing = document.getElementById(STYLE_ID)
  if (existing !== null) {
    // 上一次没摘干净（HMR / 重复 apply）：留着它，别插第二份
    return () => {}
  }
  const element = document.createElement('style')
  element.id = STYLE_ID
  element.textContent = CSS
  document.head.appendChild(element)
  return () => element.remove()
}

/** 页面本体。数据源在这里解析一次，三个视图共用同一份。 */
function PlanPage({ ctx }: { ctx: any }) {
  const source = useTaskSource(ctx)
  return <Panel ctx={ctx} source={source} />
}

export function apply(ctx: any): () => void {
  const slots = ctx?.slots
  if (slots === undefined || typeof slots.inject !== 'function' || typeof slots.register !== 'function') {
    ctx?.logger?.warn?.('[dsh-plugin-task-board] ctx.slots 不可用，这一行不会出现')
    return () => {}
  }

  const disposers: Array<() => void> = [installStyles()]

  disposers.push(
    slots.inject('sidebar.panellist', () =>
      slots.register(
        {
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: PANEL_ORDER,
          label: () => '规划视图',
        },
        PlanPanelIcon,
      ),
    ),
  )

  // 宿主把注册的组件当普通 React 组件渲染，多出来的 kit props（t / renderSlot …）
  // 我们一个都不用，只需要闭包里那个 ctx——数据源要靠它去问任务看板。
  const MainPage = () => <PlanPage ctx={ctx} />

  disposers.push(
    slots.inject('main', () =>
      slots.register(
        {
          name: 'main',
          key: PANEL_ID,
        },
        MainPage as never,
      ),
    ),
  )

  return () => {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose()
      } catch {
        // 摘除阶段的异常不该把别的 disposer 也带走
      }
    }
  }
}
