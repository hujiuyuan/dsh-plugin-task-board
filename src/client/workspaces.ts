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
import { useEffect, useState } from 'react'

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

export function useWorkspaces(ctx: any, ids: readonly string[]): WorkspaceIndex {
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
      setItems(
        next
          .filter(item => typeof item.workspaceId === 'string')
          .map(item => ({
            id: String(item.workspaceId),
            title: typeof item.title === 'string' && item.title.length > 0 ? item.title : String(item.workspaceId),
            path: typeof item.path === 'string' ? item.path : undefined,
          })),
      )
    }
    pull()
    const onService = (name: string): void => { if (name === 'workspaces') pull() }
    try {
      ctx?.on?.('internal/service', onService)
    } catch {
      // 事件通道不可用不影响主流程
    }
    return () => {
      alive = false
      try {
        ctx?.off?.('internal/service', onService)
      } catch {
        // 同上
      }
    }
  }, [ctx])

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

  const seen = new Set<string>()
  for (const id of ids) if (id.length > 0) seen.add(id)
  const groups = [...seen].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'zh'))
  groups.push('')

  // 清单拿不到（服务不在场）时退回「界面上出现过的那些」—— 那时我们本来也
  // 不知道还有哪些工作区，总比画一个空的地方好
  const all = (items.length > 0 ? items.map(item => item.id) : [...seen])
    .filter(id => id.length > 0)
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'zh'))

  return { nameOf, abbrOf, pathOf: id => (id === undefined ? undefined : byId.get(id)?.path), groups, all, ready: items.length > 0 }
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
