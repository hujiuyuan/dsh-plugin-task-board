/**
 * 数据来源：先问问任务看板，问不到就问账本，都问不到就明说。
 *
 * 两条路，优先级写死在代码里：
 *
 *   1. **看板的客户端服务**（cordis 服务名 `taskBoard`）。这是正路——看板自己维护的
 *      内存镜像，改一下界面立刻跟着变。`snapshot()` 拿当前，`subscribe()` 拿后续。
 *   2. **账本快照**（宿主半体的 `/api/dsh-plugin-task-board/ledger`）。看板是另一个
 *      插件，它可能没装、没启用、或者启动时降级了；那时这条路至少让三个视图有东西可看，
 *      代价是**只读、且要手动刷新**——账本变了我们收不到通知。
 *
 * 为什么不用 `ctx.inject(['taskBoard'], ...)` 直接把服务声明成依赖：那样看板不在场时
 * 我们这个插件**整个不启动**，用户看到的是「装了但什么都没发生」，比降级难查得多。
 * 所以这里用 `ctx.get` 试探 + 听 `internal/service` 事件（宿主自己的 dsh-api-gateway
 * 就是这么做的），服务晚到也能接上。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TaskRecord } from './types'

/** 数据从哪来。界面顶部那一条状态栏读的就是它。 */
export type SourceKind = 'board' | 'ledger' | 'unavailable'

export interface Snapshot {
  kind: SourceKind
  tasks: TaskRecord[]
  /** 看板的主开关是否正在跑扩展面（只有 kind==='board' 时有意义）。 */
  boardEnabled?: boolean
  /** 账本路径 / 失败原因，给状态栏显示用。 */
  path?: string
  reason?: string
  detail?: string
  /** 取到这份数据的时刻。 */
  at: number
}

/** 看板客户端服务的最小形状——只写我们要调的三个方法。 */
interface BoardClientFace {
  snapshot(): { enabled: boolean; tasks: readonly TaskRecord[] }
  subscribe(callback: (mirror: { enabled: boolean; tasks: readonly TaskRecord[] }) => void): () => void
}

const LEDGER_URL = '/api/dsh-plugin-task-board/ledger'

/** 看板服务晚到的等待上限。超过就认账本兜底，不再等。 */
const SERVICE_GRACE_MS = 4000

function readFace(ctx: any): BoardClientFace | undefined {
  try {
    const face = ctx.get('taskBoard')
    if (face === undefined || face === null) return undefined
    if (typeof face.snapshot !== 'function' || typeof face.subscribe !== 'function') return undefined
    return face as BoardClientFace
  } catch {
    // ctx.get 对没声明的服务可能抛——这不是错误，就是「不在场」
    return undefined
  }
}

interface LedgerResponse {
  ok: boolean
  reason?: string
  detail?: string
  path?: string
  revision?: number
  readAt?: number
  tasks?: TaskRecord[]
}

async function fetchLedger(signal: AbortSignal): Promise<Snapshot> {
  try {
    const response = await fetch(LEDGER_URL, { signal, headers: { accept: 'application/json' } })
    if (!response.ok) {
      return { kind: 'unavailable', tasks: [], reason: 'ledger-http', detail: `HTTP ${response.status}`, at: Date.now() }
    }
    const body = (await response.json()) as LedgerResponse
    if (!body.ok) {
      return {
        kind: 'unavailable',
        tasks: [],
        reason: body.reason ?? 'ledger-unavailable',
        detail: body.detail,
        path: body.path,
        at: Date.now(),
      }
    }
    return {
      kind: 'ledger',
      tasks: body.tasks ?? [],
      path: body.path,
      at: body.readAt ?? Date.now(),
    }
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error
    return { kind: 'unavailable', tasks: [], reason: 'ledger-unreachable', detail: String(error), at: Date.now() }
  }
}

export interface TaskSource {
  snapshot: Snapshot
  /** 手动重取。看板在时不做事（它自己会推），看板不在时重读账本。 */
  refresh: () => void
  /** 正在重新读。 */
  refreshing: boolean
}

/**
 * 解析数据源并持续跟随。
 *
 * @param ctx - 浏览器半体的 cordis 上下文。
 * @returns 当前快照 + 一个刷新函数。
 */
export function useTaskSource(ctx: any): TaskSource {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ kind: 'unavailable', tasks: [], reason: 'starting', at: 0 }))
  const [refreshing, setRefreshing] = useState(false)
  /** 看板服务一旦出现过，就再也不退回账本——账本是更差的数据，来回切会让界面闪。 */
  const sawBoard = useRef(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let disposed = false
    const abort = new AbortController()
    let unsubscribe: (() => void) | undefined
    let graceTimer: ReturnType<typeof setTimeout> | undefined

    const attach = (): boolean => {
      const face = readFace(ctx)
      if (face === undefined) return false
      sawBoard.current = true
      const publish = (mirror: { enabled: boolean; tasks: readonly TaskRecord[] }): void => {
        if (disposed) return
        setSnapshot({ kind: 'board', tasks: [...mirror.tasks], boardEnabled: mirror.enabled, at: Date.now() })
      }
      try {
        publish(face.snapshot())
        unsubscribe = face.subscribe(publish)
      } catch (error) {
        // 服务在，但拿不到镜像：当成不在场，走账本。不假装成功。
        sawBoard.current = false
        setSnapshot({ kind: 'unavailable', tasks: [], reason: 'board-face-error', detail: String(error), at: Date.now() })
        return false
      }
      return true
    }

    const fallback = async (): Promise<void> => {
      if (disposed || sawBoard.current) return
      const next = await fetchLedger(abort.signal)
      if (disposed || sawBoard.current) return
      setSnapshot(next)
    }

    if (!attach()) {
      void fallback()
      graceTimer = setTimeout(() => {
        if (!disposed && !sawBoard.current) void fallback()
      }, SERVICE_GRACE_MS)
    }

    const onService = (name: string): void => {
      if (disposed) return
      if (name !== 'taskBoard' || sawBoard.current) return
      if (graceTimer !== undefined) clearTimeout(graceTimer)
      attach()
    }
    try {
      ctx.on?.('internal/service', onService)
    } catch {
      // 事件通道不可用不影响主流程——上面的 graceTimer 仍然会再试一次
    }

    return () => {
      disposed = true
      abort.abort()
      if (graceTimer !== undefined) clearTimeout(graceTimer)
      unsubscribe?.()
      try {
        ctx.off?.('internal/service', onService)
      } catch {
        // 同上
      }
    }
    // tick 是手动刷新按钮的触发器：它一变，这个 effect 整个重跑一遍
  }, [ctx, tick])

  const refresh = useCallback(() => {
    if (sawBoard.current) return
    setRefreshing(true)
    setTick(value => value + 1)
    // 下一轮 effect 跑完就没有「正在读」这回事了；这里只是别让按钮一直转
    setTimeout(() => setRefreshing(false), 400)
  }, [])

  return useMemo(() => ({ snapshot, refresh, refreshing }), [snapshot, refresh, refreshing])
}
