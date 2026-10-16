/**
 * 工作区名字解析。
 *
 * 账本里每个任务只存一个 `workspaceId`，是一串内部 id，直接摆到界面上没人认得。
 * 宿主把工作区清单放在 cordis 服务 `workspaces` 上（`ui-workspace` 包自己也是
 * 这么读的），形状是 `list.getSnapshot().items`，每项 `{workspaceId, title, path}`。
 *
 * **拿不到不算错。** 服务可能不在场（换了外壳组合），那时退到用 id 本身当名字，
 * 界面照常出，只是名字难看——比整页空着强。
 */
import { useEffect, useMemo, useState } from 'react'

export interface Workspace {
  id: string
  title: string
  path?: string
}

/** 未钉工作区在界面上的名字。跟任务看板自己的说法保持一致。 */
export const UNPINNED = '未钉工作区'

export interface WorkspaceIndex {
  /** workspaceId → 名字（拿不到清单时 id 自己当名字）。 */
  nameOf: (id: string | undefined) => string
  /** 斜带/色点上显示的短名。 */
  abbrOf: (id: string | undefined) => string
  /** 工作区路径，没钉的没有。 */
  pathOf: (id: string | undefined) => string | undefined
  /**
   * 路径反查工作区 id。**没有任务卡的会话只有 `cwd`，没有 workspaceId** ——
   * 把它们对回工作区靠的就是这个。
   *
   * 认不出来返回 undefined，那时那一行按「未钉工作区」处理：与其猜一个，
   * 不如落在它真在的地方。
   */
  idOfPath: (path: string) => string | undefined
  /**
   * 筛选下拉里要列的工作区：**只列界面上真出现过的**。
   * 空的列进筛选器没有意义（选了它必然一条都没有）。
   */
  groups: string[]
  /**
   * 宿主认得**所有**工作区，不管有没有任务。
   *
   * 跟 `groups` 的区别正是「进度页按工作区」那一块要的：那里要的是一个
   * 完整的仪表盘 —— 一个工作区一张卡，哪怕这张卡上全是零。
   * 用 `groups` 的话，刚建好、还没往里放任务的工作区会整个消失，
   * 看起来就像插件没读到它。
   */
  all: string[]
  ready: boolean
}

function readList(ctx: any): Array<{ workspaceId?: unknown; title?: unknown; path?: unknown }> {
  try {
    const face = ctx?.get?.('workspaces')
    const items = face?.list?.getSnapshot?.()?.items
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

/**
 * @param ctx - 客户端上下文。
 * @param ids - 界面上出现过的 workspaceId（来自账本任务）。
 * @param paths - 只在会话里出现过的工作区路径。**筛选项要能选到它们** ——
 *   一个只跑过几个会话、一张卡都没有的工作区，如果不出现在项目下拉里，
 *   用户就没法把那些会话筛出来，只能当成插件漏读了。
 */
export function useWorkspaces(ctx: any, ids: readonly string[], paths: readonly string[] = []): WorkspaceIndex {
  const [items, setItems] = useState<Workspace[]>(() =>
    readList(ctx)
      .filter(item => typeof item.workspaceId === 'string')
      .map(item => ({
        id: String(item.workspaceId),
        title: typeof item.title === 'string' && item.title.length > 0 ? item.title : String(item.workspaceId),
        path: typeof item.path === 'string' ? item.path : undefined,
      })),
  )

  useEffect(() => {
    // 服务可能比我们晚到（它是另一个插件提供的），听到就到手
    let alive = true
    const pull = (): void => {
      const next = readList(ctx)
      if (!alive || next.length === 0) return
      const rows = next
        .filter(item => typeof item.workspaceId === 'string')
        .map(item => ({
          id: String(item.workspaceId),
          title: typeof item.title === 'string' && item.title.length > 0 ? item.title : String(item.workspaceId),
          path: typeof item.path === 'string' ? item.path : undefined,
        }))
      /*
       * **内容没变就别换新的数组。** 下面的记忆化挂在 `items` 上，换一个恒等引用
       * 就等于把任务索引、三个视图的排序分组全部重算一遍 —— 轮询之下这是每几秒一次的
       * 白烧。（`internal/service` 那条路本来就很少触发，所以以前没这问题。）
       */
      setItems(prev => (same(prev, rows) ? prev : rows))
    }
    pull()
    /*
     * **轻量轮询。** `internal/service` 只在「服务刚出现」时响一次，可工作区是**随时
     * 会新加的**：面板开着的时候新建一个，清单不变，那个工作区就一直选不到
     * （用户 2026-10-16 撞上的就是这个）。这里是纯内存读一个快照，不碰磁盘也不发请求，
     * 所以「勤快」不等于「贵」。
     */
    const timer = setInterval(pull, WORKSPACES_POLL_MS)
    const onService = (name: string): void => { if (name === 'workspaces') pull() }
    try {
      ctx?.on?.('internal/service', onService)
    } catch {
      // 事件通道不可用不影响主流程
    }
    return () => {
      alive = false
      clearInterval(timer)
      try {
        ctx?.off?.('internal/service', onService)
      } catch {
        // 同上
      }
    }
  }, [ctx])

  /**
   * 整个返回值**记忆化**。不记的话它每次都换一个新对象，而调用方是拿它当
   * `useMemo` 的依赖用的 —— 于是「任务索引」跟着每次渲染都重建一遍，
   * 三个视图的排序、分组、分桶也跟着白跑。不崩，但都是白烧的。
   *
   * 依赖里的 `ids` / `paths` 由调用方用 `useMemo` 稳定住（见 Panel）。
   */
  return useMemo(() => {
    const byId = new Map(items.map(item => [item.id, item]))

    const nameOf = (id: string | undefined): string => {
      if (id === undefined || id.length === 0) return UNPINNED
      return byId.get(id)?.title ?? id
    }
    const abbrOf = (id: string | undefined): string => {
      const name = nameOf(id)
      // 斜带放不下长名字：按「能认出来」而不是「能放下」来截。
      // 中文一个字顶两个字符位，所以按显示宽度算。
      return width(name) <= 7 ? name : `${clipTo(name, 6)}…`
    }

    /**
     * 路径 → 工作区 id。**同名路径只认第一条**：宿主清单里理论上不该有两条同路径
     * 的条目，真出现时按清单顺序取，不在这里编一套优先规则。
     */
    const byPath = new Map<string, string>()
    for (const item of items) {
      if (item.path !== undefined && !byPath.has(item.path)) byPath.set(item.path, item.id)
    }

    const seen = new Set<string>()
    for (const id of ids) if (id.length > 0) seen.add(id)
    // 只在会话里出现过的那些工作区，也要进筛选项
    for (const path of paths) {
      const id = byPath.get(path)
      if (id !== undefined) seen.add(id)
    }
    const groups = [...seen].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'zh'))
    groups.push('')

    // 清单拿不到（服务不在场）时退回「界面上出现过的那些」—— 那时我们本来也
    // 不知道还有哪些工作区，总比画一个空的地方好
    const all = (items.length > 0 ? items.map(item => item.id) : [...seen])
      .filter(id => id.length > 0)
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'zh'))

    return {
      nameOf,
      abbrOf,
      pathOf: (id: string | undefined) => (id === undefined ? undefined : byId.get(id)?.path),
      idOfPath: (path: string) => byPath.get(path),
      groups,
      all,
      ready: items.length > 0,
    }
  }, [items, ids, paths])
}

/**
 * 工作区清单多久回来看一眼。
 *
 * 5 秒 vs 别处那些 15 秒：这个读的是**内存里的快照**（`list.getSnapshot()`），
 * 不是磁盘也不是网络，快慢的代价跟 `session-facts` 那条完全不是一回事。
 * 而它的时效性要求反而更高 —— 「我刚建的工作区」这个动作就发生在面板开着的时候。
 */
const WORKSPACES_POLL_MS = 5_000

/** 两份清单说的是不是同一件事。挡的是「轮询读到一模一样的东西还去换引用」。 */
function same(left: readonly Workspace[], right: readonly Workspace[]): boolean {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index]
    const b = right[index]
    if (a.id !== b.id || a.title !== b.title || a.path !== b.path) return false
  }
  return true
}

/** 全角算 2、半角算 1 的显示宽度。 */
function width(text: string): number {
  let total = 0
  for (const char of text) total += char.codePointAt(0)! > 0x2e80 ? 2 : 1
  return total
}

/** 按显示宽度截断。 */
function clipTo(text: string, max: number): string {
  let total = 0
  let out = ''
  for (const char of text) {
    const w = char.codePointAt(0)! > 0x2e80 ? 2 : 1
    if (total + w > max) break
    total += w
    out += char
  }
  return out
}
