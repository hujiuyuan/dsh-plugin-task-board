/**
 * 数据来源：规划视图自己的任务引擎（宿主半体，见 `src/engine/`）。
 *
 * 连上 `/api/dsh-plugin-task-board/tasks/events`（Server-Sent Events）：先收一份全量，
 * 之后引擎每改一次推一份全量。断线了浏览器会自己重连；重连期间每 3 秒拉一次
 * `/tasks` 兜底，界面不会停在旧数据上。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TaskRecord } from './types'

/** 数据从哪来。界面顶部那一条状态栏读的就是它。 */
export type SourceKind = 'board' | 'ledger' | 'unavailable'

export interface Snapshot {
  kind: SourceKind
  tasks: TaskRecord[]
  /** 宿主的会话网关到了没有（只有 kind==='board' 时有意义）。没到时能看能改，不能「开始」。 */
  boardEnabled?: boolean
  /** 引擎的版本号，每改一次加一。 */
  revision?: number
  /** 账本路径 / 失败原因，给状态栏显示用。 */
  path?: string
  reason?: string
  detail?: string
  /** 快照读的账本是第几代（只有 kind==='ledger' 时有意义）。 */
  schemaVersion?: number
  /** 格式对不上时：文件里是几、我们认得几。 */
  schema?: { actual: number | null; supported: number[] }
  /** 取到这份数据的时刻。 */
  at: number
}

const TASKS_URL = '/api/dsh-plugin-task-board/tasks'
const EVENTS_URL = '/api/dsh-plugin-task-board/tasks/events'
const POLL_MS = 3_000

interface EngineBody {
  ok?: boolean
  reason?: string
  detail?: string
  revision?: number
  tasks?: TaskRecord[]
  gateway?: boolean
}

function toSnapshot(body: EngineBody): Snapshot {
  if (body.ok === false) {
    return { kind: 'unavailable', tasks: [], reason: body.reason ?? 'engine-failed', detail: body.detail, at: Date.now() }
  }
  return {
    kind: 'board',
    tasks: body.tasks ?? [],
    boardEnabled: body.gateway !== false,
    ...(typeof body.revision === 'number' ? { revision: body.revision } : {}),
    at: Date.now(),
  }
}

async function fetchTasks(signal: AbortSignal): Promise<Snapshot> {
  try {
    const response = await fetch(TASKS_URL, { signal, headers: { accept: 'application/json' } })
    if (!response.ok) {
      return { kind: 'unavailable', tasks: [], reason: 'engine-http', detail: `HTTP ${response.status}`, at: Date.now() }
    }
    return toSnapshot((await response.json()) as EngineBody)
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error
    return { kind: 'unavailable', tasks: [], reason: 'engine-unreachable', detail: String(error), at: Date.now() }
  }
}

export interface TaskSource {
  snapshot: Snapshot
  /** 手动重取一次全量。 */
  refresh: () => void
  /** 正在重新读。 */
  refreshing: boolean
}

/**
 * 解析数据源并持续跟随。
 *
 * @param _ctx - 浏览器半体的 cordis 上下文（现在用不上，留着签名不动调用方）。
 * @returns 当前快照 + 一个刷新函数。
 */
export function useTaskSource(_ctx: any): TaskSource {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ kind: 'unavailable', tasks: [], reason: 'starting', at: 0 }))
  const [refreshing, setRefreshing] = useState(false)
  const [tick, setTick] = useState(0)
  /** 最新收到的版本号。推送和轮询可能交错到达，旧的不许盖掉新的。 */
  const revision = useRef(-1)

  useEffect(() => {
    let disposed = false
    const abort = new AbortController()
    let poll: ReturnType<typeof setInterval> | undefined

    const publish = (next: Snapshot): void => {
      if (disposed) return
      if (next.kind === 'board' && next.revision !== undefined) {
        if (next.revision < revision.current) return
        revision.current = next.revision
      }
      setSnapshot(next)
    }
    const pull = (): void => {
      void fetchTasks(abort.signal).then(publish, () => undefined)
    }
    const startPolling = (): void => {
      if (poll === undefined) poll = setInterval(pull, POLL_MS)
    }
    const stopPolling = (): void => {
      if (poll !== undefined) clearInterval(poll)
      poll = undefined
    }

    let events: EventSource | undefined
    if (typeof EventSource === 'function') {
      events = new EventSource(EVENTS_URL)
      events.onmessage = message => {
        stopPolling()
        try {
          publish(toSnapshot({ ok: true, ...(JSON.parse(message.data) as EngineBody) }))
        } catch {
          // 一帧坏了就等下一帧
        }
      }
      events.onerror = () => {
        // 浏览器会自己重连；连上之前靠轮询
        startPolling()
        pull()
      }
    } else {
      startPolling()
    }
    pull()

    return () => {
      disposed = true
      abort.abort()
      stopPolling()
      events?.close()
    }
    // tick 是手动刷新按钮的触发器：它一变，这个 effect 整个重跑一遍
  }, [tick])

  const refresh = useCallback(() => {
    setRefreshing(true)
    setTick(value => value + 1)
    setTimeout(() => setRefreshing(false), 400)
  }, [])

  return useMemo(() => ({ snapshot, refresh, refreshing }), [snapshot, refresh, refreshing])
}
