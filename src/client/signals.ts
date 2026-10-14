/**
 * 「每个会话现在什么处境」—— 一个信号汇总层。
 *
 * 三路来源，性质完全不同，所以分开拿：
 *
 *   1. **`uiSession.sessionStatus`** —— 活的、免费的、宿主人手推给我们的。
 *      里面有 `running` / `pendingInteraction` / `completionUnread` 三样。
 *      这是「它此刻在等什么」最权威的来源。
 *   2. **`/session-facts`（我们自己的宿主半体）** —— 「上一轮是怎么结束的」。
 *      **这条只能从宿主读**：那个字段不在任何投影里（见 `src/sessionfacts.ts`），
 *      浏览器半体根本拿不到。
 *   3. **`/session-archive`（我们自己的宿主半体）** —— 你把哪些会话收工了。
 *      会话没有账本，这句话只能我们自己存。
 *
 * ## 为什么事实那条要「变了才重问」
 *
 * `session-facts` 在宿主那边每次都要跟网关要一次事件流的开头（只为拿最新序号），
 * 24 个会话就是 24 次网关调用。所以这里按**会话自己的 `updatedAt`** 记账：
 * 没动过的会话不重问，宿主那边的缓存也就不会被浪费。
 *
 * ## 拿不到不是错误
 *
 * `uiSession` 是 DSH 自己几个插件之间的线，不是公开给第三方的扩展面，**可能变**。
 * 变了之后这边一路 `undefined` 上去，界面退化成「没有颜色」——
 * 原来的功能一个都不少，只是少一层判断。绝不因为读不到就把页面弄空。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { TurnFact } from './tone'

/** 我们真正用到的那点 `sessionStatus` 形状。 */
interface SessionStatus {
  running?: boolean
  pendingInteraction?: { kind?: unknown } | null
  completionUnread?: boolean
}

export interface Signals {
  /** 会话 id → 它在等什么（`approval` / `question` / `plan-review`）。 */
  pending: ReadonlyMap<string, string>
  /** 会话 id → 跑完还没看。 */
  unread: ReadonlySet<string>
  /** 会话 id → 上一轮是怎么结束的。 */
  facts: ReadonlyMap<string, TurnFact>
  /** 会话 id → 目标处在哪个阶段（`complete` 才上绿色）。没有目标的会话不在表里。 */
  goalPhases: ReadonlyMap<string, string>
  /** 会话 id → 它下面挂着几个卡住的子代理（含更深层）。 */
  stuck: ReadonlyMap<string, number>
  /** 会话 id → 你什么时候把它归档的。 */
  archives: ReadonlyMap<string, number>
  /** 事实那条路通不通。不通时它是原因，界面照常画，只是没有颜色。 */
  factsWhy: string | null
  /**
   * `uiSession` 那条路通不通。**跟 `factsWhy` 是两回事**，要分开报：
   * 一个说的是「上一轮怎么结束的」（历史，宿主半体读会话日志），
   * 一个说的是「它此刻在等什么」（当下，宿主实时推给我们的）。
   * 缺了前者，颜色停在上一轮的结论上；缺了后者，「AI 在等你」这一类**整个看不见**——
   * 那是这个插件最想回答的问题，少一层颜色不能跟少一个答案混为一谈。
   */
  statusWhy: string | null
  /** 归档一个会话 / 取消归档。返回错误文案，成了就是 `null`。 */
  setArchived: (sessionId: string, archived: boolean) => Promise<string | null>
}

const EMPTY: Signals = {
  pending: new Map(),
  unread: new Set(),
  facts: new Map(),
  goalPhases: new Map(),
  stuck: new Map(),
  archives: new Map(),
  factsWhy: null,
  statusWhy: null,
  setArchived: async () => '归档通道没接上',
}

/** 事实多久回来看一次。会话停下来之后不会再变，所以不需要勤快。 */
const FACTS_POLL_MS = 15_000

export interface SignalInputs {
  /** 要问事实的会话 id（**含子代理**——判断层级要靠它们）。 */
  ids: readonly string[]
  /** 每个会话最后动过的时间。变了才重问。 */
  updatedAt: ReadonlyMap<string, number>
  /** 谁是谁的子代理。用来把卡住往上冒泡。 */
  parents: ReadonlyMap<string, string>
}

export function useSignals(ctx: any, inputs: SignalInputs): Signals {
  const { ids, updatedAt, parents } = inputs

  const [status, setStatus] = useState<ReadonlyMap<string, SessionStatus>>(() => new Map())
  const [facts, setFacts] = useState<ReadonlyMap<string, TurnFact>>(() => new Map())
  /*
   * 会话 id → 目标的阶段（`active` / `paused` / `blocked` / `complete`）。
   * 跟 `facts` 挤在同一条路由里只是因为**走同一条路、共用同一份缓存**：
   * 一个是「这一轮怎么结束的」，一个是「它想干的那件事现在什么状态」。
   * 在宿主那边是同一趟扫会话日志扫出来的，没多花一次读盘（见 src/sessionfacts.ts）。
   */
  const [goalPhases, setGoalPhases] = useState<ReadonlyMap<string, string>>(() => new Map())
  const [factsWhy, setFactsWhy] = useState<string | null>(null)
  const [statusWhy, setStatusWhy] = useState<string | null>(null)
  const [archives, setArchives] = useState<ReadonlyMap<string, number>>(() => new Map())

  // 1. 宿主推给我们的那份实时状态
  useEffect(() => {
    const service = safeGet(ctx, 'uiSession')
    const source = service?.sessionStatus
    if (source === undefined || typeof source.getSnapshot !== 'function') {
      setStatusWhy('宿主的会话状态服务（uiSession）不在场')
      return
    }
    setStatusWhy(null)
    const read = (): void => {
      const snapshot = source.getSnapshot()
      if (!(snapshot instanceof Map)) return
      const next = new Map<string, SessionStatus>()
      for (const [id, value] of snapshot) {
        if (typeof id !== 'string' || value === null || typeof value !== 'object') continue
        next.set(id, value as SessionStatus)
      }
      setStatus(next)
    }
    read()
    const off = typeof source.subscribe === 'function' ? source.subscribe(read) : undefined
    return () => { off?.() }
  }, [ctx])

  // 3. 归档记录（一次读到位，之后由这里的写操作自己维护）
  useEffect(() => {
    let alive = true
    void (async () => {
      const body = await getJson('/api/dsh-plugin-task-board/session-archive')
      if (!alive || body === undefined) return
      const raw = (body as { archived?: unknown }).archived
      if (raw === null || typeof raw !== 'object') return
      const next = new Map<string, number>()
      for (const [id, at] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof at === 'number' && Number.isFinite(at)) next.set(id, at)
      }
      setArchives(next)
    })()
    return () => { alive = false }
  }, [])

  // 2. 上一轮的结论。**没动过的会话不重问** —— 见文件头。
  const askedAt = useRef(new Map<string, number>())
  const inFlight = useRef(false)
  const key = useMemo(() => [...ids].sort().join(','), [ids])
  const stamp = useMemo(() => [...updatedAt].map(([id, at]) => `${id}@${at}`).sort().join('|'), [updatedAt])

  useEffect(() => {
    let alive = true
    const pull = async (): Promise<void> => {
      if (inFlight.current) return
      const stale = ids.filter(id => askedAt.current.get(id) !== updatedAt.get(id))
      if (stale.length === 0) return
      inFlight.current = true
      try {
        const body = await getJson(`/api/dsh-plugin-task-board/session-facts?ids=${encodeURIComponent(stale.join(','))}`)
        if (!alive) return
        if (body === undefined) { setFactsWhy('宿主半体没回应'); return }
        if ((body as { ok?: unknown }).ok !== true) {
          const detail = (body as { detail?: unknown; reason?: unknown })
          setFactsWhy(typeof detail.detail === 'string' ? detail.detail : String(detail.reason ?? '读不到'))
          return
        }
        setFactsWhy(null)
        // 问过了就记上，无论答案是什么 —— 答「没跑过」也是一个答案，
        // 下回它还是没动过，就不该再问一遍
        for (const id of stale) askedAt.current.set(id, updatedAt.get(id) ?? 0)
        const raw = (body as { facts?: unknown }).facts
        if (raw === null || typeof raw !== 'object') return
        setGoalPhases(current => {
          const next = new Map(current)
          for (const [id, fact] of Object.entries(raw as Record<string, any>)) {
            const phase = fact?.goalPhase
            // 认不出的当「没有目标」：删掉旧值，别把上一轮读到的留着 ——
            // 目标被 clear 掉之后卡片还挂个绿色，比不上色糟得多
            if (typeof phase === 'string' && phase.length > 0) next.set(id, phase)
            else next.delete(id)
          }
          return next
        })
        setFacts(current => {
          const next = new Map(current)
          for (const [id, fact] of Object.entries(raw as Record<string, any>)) {
            if (fact?.unreadable === true) { next.set(id, { kind: 'unknown', at: 0 }); continue }
            const turn = fact?.turn
            if (turn === null || typeof turn !== 'object' || typeof turn.kind !== 'string') continue
            next.set(id, {
              kind: turn.kind,
              at: typeof turn.at === 'number' ? turn.at : 0,
              ...(typeof turn.code === 'string' ? { code: turn.code } : {}),
              ...(typeof turn.message === 'string' ? { message: turn.message } : {}),
              ...(typeof turn.abortKind === 'string' ? { abortKind: turn.abortKind } : {}),
            })
          }
          return next
        })
      } finally {
        inFlight.current = false
      }
    }
    void pull()
    const timer = setInterval(() => { void pull() }, FACTS_POLL_MS)
    return () => { alive = false; clearInterval(timer) }
  }, [key, stamp, ids, updatedAt])

  const pending = useMemo(() => {
    const out = new Map<string, string>()
    for (const [id, value] of status) {
      const kind = value.pendingInteraction?.kind
      if (typeof kind === 'string' && kind.length > 0) out.set(id, kind)
    }
    return out
  }, [status])

  const unread = useMemo(() => {
    const out = new Set<string>()
    for (const [id, value] of status) if (value.completionUnread === true) out.add(id)
    return out
  }, [status])

  const stuck = useMemo(() => countStuck(parents, pending, facts), [parents, pending, facts])

  const setArchived = async (sessionId: string, archived: boolean): Promise<string | null> => {
    const body = await postJson('/api/dsh-plugin-task-board/session-archive', { sessionId, archived })
    if (body === undefined) return '宿主半体没回应'
    if ((body as { ok?: unknown }).ok !== true) {
      const detail = body as { detail?: unknown; reason?: unknown }
      return typeof detail.detail === 'string' ? detail.detail : String(detail.reason ?? '写入被拒')
    }
    const raw = (body as { archived?: unknown }).archived
    const next = new Map<string, number>()
    if (raw !== null && typeof raw === 'object') {
      for (const [id, at] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof at === 'number' && Number.isFinite(at)) next.set(id, at)
      }
    }
    setArchives(next)
    return null
  }

  return useMemo(
    () => ({ pending, unread, facts, goalPhases, stuck, archives, factsWhy, statusWhy, setArchived }),
    [pending, unread, facts, goalPhases, stuck, archives, factsWhy, statusWhy],
  )
}

/** 没有信号时用的空表。**恒等引用**，免得每次渲染都换新对象把下游的 memo 打穿。 */
export const NO_SIGNALS = EMPTY

/**
 * 谁下面压着卡住的东西。
 *
 * 「卡住」= **有东西在等**（`pendingInteraction`）**或者上一轮没正常结束**
 * （不在跑的会话，最后那一轮不是 `completed`）。注意不能只看子代理自己的状态：
 * 一个子代理在等权限，它自己的 `running` 大概是 true，光看 `running` 是看不出来的。
 *
 * 一层一层往上冒泡 —— 孙代理卡住，子代理和主会话都要跟着动。
 * **计数而不是布尔**：`3 个卡住了` 比 `有东西卡住了` 有用得多。
 */
export function countStuck(
  parents: ReadonlyMap<string, string>,
  pending: ReadonlyMap<string, string>,
  facts: ReadonlyMap<string, TurnFact>,
): Map<string, number> {
  const stuckSelf = new Set<string>()
  for (const id of pending.keys()) stuckSelf.add(id)
  for (const [id, fact] of facts) {
    if (fact.kind === 'completed') continue
    // `unknown` 当作「读不出来」，不当成卡住——那是我们自己的问题，不是它的问题
    if (fact.kind === 'unknown') continue
    stuckSelf.add(id)
  }

  const out = new Map<string, number>()
  for (const id of stuckSelf) {
    // 往上走，**走过的就不再走**（父子关系理论上不成环，但账本是外部数据，
    // 一个环会让这里转不出来）
    const seen = new Set<string>([id])
    let current = parents.get(id)
    while (current !== undefined && !seen.has(current)) {
      seen.add(current)
      out.set(current, (out.get(current) ?? 0) + 1)
      current = parents.get(current)
    }
  }
  return out
}

async function getJson(url: string): Promise<unknown | undefined> {
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) return undefined
    return await response.json()
  } catch {
    return undefined
  }
}

async function postJson(url: string, body: unknown): Promise<unknown | undefined> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) return undefined
    return await response.json()
  } catch {
    return undefined
  }
}

function safeGet(ctx: any, name: string): any {
  try {
    return ctx?.get?.(name)
  } catch {
    return undefined
  }
}
