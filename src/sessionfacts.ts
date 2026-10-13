/**
 * 「这个会话上一轮到底是怎么结束的」—— 去读会话事件日志。
 *
 * ## 为什么这件事非做不可
 *
 * 界面上要区分的四类，全都吊在这一个字段上：
 *
 *   - **外力打断**（API 不通、额度用尽、登录失效）—— 用户处理不了，得看见
 *   - **正常跑完**（等你判下一步）
 *   - **你自己按的停止**
 *   - **token 用尽**
 *
 * 宿主把答案记在每一轮的 `turn/end` 事件里：
 *
 * ```js
 * { turn, reason: { kind: 'completed' | 'error' | 'aborted' | 'blocked' | 'max-tokens' | 'interrupted' } }
 * ```
 *
 * `error` 时还带一个结构化的 `failure`，里面有宿主那套**稳定的机器码**
 * （`SERVER` / `TRANSPORT` / `TIMEOUT` / `RATE_LIMIT` / `QUOTA` / `AUTH` /
 * `INVALID_CREDENTIAL` / `NO_ADAPTER` / `CONTEXT_WINDOW_EXCEEDED` …）。
 * 源码注释原话："route on this, never by parsing `message`"。所以下面**一个字符
 * 都不解析错误文本** —— 判断一律走 `kind` 和 `code`。
 *
 * ## 为什么绕这么大一圈
 *
 * 任务看板的宿主半体**已经在读同一个字段了**，但它读完就扔了 ——
 * 只留一句 `"agent turn ended with an error"` 写进 `executions[].error`。
 * 所以我们从账本里读到的错误是不可区分的（真账本里那条就是这个字符串）。
 *
 * 浏览器半体也读不到：这个字段**不在任何一个投影里**。投影里只有 `turnOutline`
 * （每轮的提问和回复预览，不含结论）、`turnBoundary`（轮次边界）、
 * `subagentCatalog`。而且投影是**按需懒加载**的，重开一次连接只预热
 * 「有子会话的会话」，绝大多数会话根本没有数据。
 *
 * 所以只能从这里读。走的是宿主自己的 `typertGateway`，跟看板宿主半体同一层、
 * 同一个方法，没有更底层的做法。
 *
 * ## 读不到 ≠ 没跑过
 *
 * 这两件事在下游长得一样（都是「没有颜色」），但对用户的意思完全不同：
 * 一个是「它没跑过」，一个是「我读不出来，你别信我」。所以要分开报 ——
 * 见 `SessionFact.unreadable`。
 */

/** 网关调用里我们真正用到的那一小块。结构类型，不 import 宿主包。 */
export interface GatewayFace {
  invoke(request: { namespace: string; method: string; args: unknown; signal?: AbortSignal }): Promise<any>
  stream?(request: { namespace: string; method: string; args: unknown; signal?: AbortSignal }): any
}

/** 一轮的结论。字段名跟着宿主的 `turn/end` 事件走，不另起名字。 */
export interface TurnFact {
  /** 见上面那段注释里的枚举。认不出的原样带出来，由界面决定怎么显示。 */
  kind: string
  /** **只有 `error` 才有**。宿主那套稳定的机器码，判断只看它。 */
  code?: string
  /** 出错时的人话摘要。只用于显示。 */
  message?: string
  /** 中止的次级原因（`hook` / `user` …），只有 `aborted` 才有。 */
  abortKind?: string
  /** 这一轮记在哪一毫秒（事件自己的时间）。 */
  at: number
}

export interface SessionFact {
  /** 最后一次读到的 `turn/end`。**会话正在跑时它属于上一轮**，别当成当前状态用。 */
  turn?: TurnFact
  /** 是「读的过程失败了」，不是「没有这一轮」。这条为真时 `turn` 不可信。 */
  unreadable?: boolean
  /** 读不出来时的一句话原因，给界面显示。 */
  why?: string
}

/** 会话地址。子代理要用三段的那个形状，我们只用普通会话这一种。 */
export const addressOf = (sessionId: string): { kind: 'session'; sessionId: string } => ({
  kind: 'session',
  sessionId,
})

/**
 * 一次最多往回翻多少条事件找 `turn/end`。
 *
 * 一个**停下来的**会话，它最后一个事件几乎就是 `turn/end` 本身，所以正常情况下
 * 第一条就命中。翻这么多是为了兜住那些尾巴上还挂着别的东西的会话
 * （比如跑完又写了一轮 todo、或者被外部事件收尾的）。
 */
const TAIL_EVENTS = 200

/** 往回翻几页。跟上面一个道理：正常一页就够，多翻几页是为了不误报「没跑过」。 */
const MAX_PAGES = 3

/** 缓存：同一个会话、同一个最新序号，答案不会变。 */
interface CacheEntry {
  cursor: number
  fact: SessionFact
}

/**
 * 读一批会话的结论。
 *
 * @param gateway - 宿主的 `typertGateway`。
 * @param sessionIds - 要读的会话。空数组直接返回空表，不碰网关。
 * @param cache - 上次读到哪。命中（同一个 cursor）就不再读盘。**调用方持有它**，
 *   因为它的生命周期是「这个插件的这次运行」，不是「这一次请求」。
 * @param signal - 取消。
 */
export async function readFacts(
  gateway: GatewayFace,
  sessionIds: readonly string[],
  cache: Map<string, CacheEntry>,
  signal?: AbortSignal,
): Promise<Record<string, SessionFact>> {
  const out: Record<string, SessionFact> = {}
  // 一次请求里同一个会话只读一遍（前端可能同时从几个视图问）
  const wanted = [...new Set(sessionIds.filter(id => typeof id === 'string' && id.length > 0))]
  await Promise.all(
    wanted.map(async id => {
      out[id] = await readOne(gateway, id, cache, signal)
    }),
  )
  return out
}

async function readOne(
  gateway: GatewayFace,
  sessionId: string,
  cache: Map<string, CacheEntry>,
  signal?: AbortSignal,
): Promise<SessionFact> {
  let frame: any
  try {
    frame = await openingFrame(gateway, sessionId, signal)
  } catch (error) {
    return { unreadable: true, why: `打不开这个会话的事件流：${text(error)}` }
  }
  // 会话存在但一条事件都没有 —— 这不是读失败，是它真的没跑过
  if (frame === undefined) return {}

  const cursor = typeof frame.cursor === 'number' ? frame.cursor : undefined
  if (cursor === undefined) return { unreadable: true, why: '事件流没给出游标，读不了尾巴' }

  const hit = cache.get(sessionId)
  // 序号没变 = 它没再动过，上一轮的结论还是那个
  if (hit !== undefined && hit.cursor === cursor) return hit.fact

  let beforeSeq: number | undefined
  for (let page = 0; page < MAX_PAGES; page += 1) {
    let result: any
    try {
      result = await gateway.invoke({
        namespace: 'session',
        method: 'page',
        args: {
          request: {
            address: addressOf(sessionId),
            throughSeq: cursor,
            maxMessages: TAIL_EVENTS,
            ...(beforeSeq === undefined ? {} : { beforeSeq }),
          },
        },
        ...(signal === undefined ? {} : { signal }),
      })
    } catch (error) {
      return { unreadable: true, why: `读事件失败：${text(error)}` }
    }

    const records = Array.isArray(result?.records) ? result.records : []
    // 从后往前找 —— 要的是**最后**一次，不是第一次
    for (let index = records.length - 1; index >= 0; index -= 1) {
      const event = records[index]?.event
      if (event?.type !== 'turn/end') continue
      const fact: SessionFact = { turn: turnFactOf(event) }
      cache.set(sessionId, { cursor, fact })
      return fact
    }

    if (result?.hasMore !== true || records.length === 0) break
    const oldest = records[0]?.event?.seq
    if (typeof oldest !== 'number' || oldest === beforeSeq) break
    beforeSeq = oldest
  }

  // 翻到底也没有 `turn/end`：这个会话确实还没跑完过一整轮。
  // **这不缓存** —— 它下一轮跑完就该有结论了，而 cursor 在那之前不会变。
  return {}
}

/** 拿最新的一帧快照，只为要它的 `cursor`（= 最新序号）。 */
async function openingFrame(gateway: GatewayFace, sessionId: string, signal?: AbortSignal): Promise<any> {
  const request = {
    namespace: 'session',
    method: 'follow',
    args: { request: { address: addressOf(sessionId), maxMessages: 1 } },
    ...(signal === undefined ? {} : { signal }),
  }

  // 首选流：`follow` 是 stream 方法，第一帧就是快照。
  // **`stream()` 是 async 的**（返回 Promise<AsyncIterable>，不是 AsyncIterable），
  // 忘了 await 的话它会被当成「不可迭代」，于是掉到下面的 invoke 兜底上，
  // 而 invoke 对 stream 方法一律拒绝：原话是
  // 「stream Remote methods must be opened through the stream carrier」。
  // 本地真机加载时抓到的 —— 单测里那个假网关当时写成了同步的，所以全绿。
  if (typeof gateway.stream === 'function') {
    const iterable = await gateway.stream(request)
    if (iterable !== undefined && iterable !== null && typeof iterable[Symbol.asyncIterator] === 'function') {
      const iterator = iterable[Symbol.asyncIterator]()
      try {
        const next = await iterator.next()
        const value = next.done === true ? undefined : next.value
        if (value !== undefined && value !== null && value.type === 'snapshot') return value
        // 第一帧不是快照：这个形状我们没打算支持，交给下面的兜底
      } finally {
        // 只要一帧，**必须把这个流关掉** —— 不关它就一直挂着，每次轮询漏一个
        try {
          if (typeof iterator.return === 'function') await iterator.return()
        } catch {
          // 关不上不影响已经拿到的那一帧
        }
      }
    }
  }

  // 兜底：有些部署把 follow 挂在 invoke 上。**排在后面**，因为真网关的
  // `invoke` 对 stream 方法一律拒绝（它只走 `stream` 那条载体）
  const viaInvoke = await gateway.invoke(request)
  if (viaInvoke !== undefined && viaInvoke !== null && typeof viaInvoke[Symbol.asyncIterator] === 'function') {
    const iterator = viaInvoke[Symbol.asyncIterator]()
    try {
      const next = await iterator.next()
      const value = next.done === true ? undefined : next.value
      return value !== undefined && value !== null && value.type === 'snapshot' ? value : undefined
    } finally {
      try {
        if (typeof iterator.return === 'function') await iterator.return()
      } catch {
        // 同上
      }
    }
  }
  return undefined
}

/**
 * `turn/end` 事件 → 结论。**只认形状，不解析文本。**
 *
 * 认不出 `reason.kind` 时返回 `kind: 'unknown'` 而不是丢掉整条 —— 一个我们不认识的
 * 结束原因，对用户的意思仍然是「这一轮没正常结束」，把它当成没事发生才是错的
 * （看板那侧为同一件事吃过亏：注释原话「an unreadable one must be reported,
 * or the board stamps a failed run as `succeeded` and a schedule dies silently」）。
 */
export function turnFactOf(event: any): TurnFact {
  const at = typeof event?.time === 'number' ? event.time : 0
  const reason = event?.data?.reason
  if (reason === null || typeof reason !== 'object') return { kind: 'unknown', at }

  const kind = typeof reason.kind === 'string' && reason.kind.length > 0 ? reason.kind : 'unknown'
  if (kind !== 'error') {
    const abortKind = kind === 'aborted' ? nestedKind(reason.reason) : undefined
    return { kind, at, ...(abortKind === undefined ? {} : { abortKind }) }
  }

  const failure = reason.error
  if (failure === null || typeof failure !== 'object') return { kind, at }
  return {
    kind,
    at,
    ...(typeof failure.code === 'string' && failure.code.length > 0 ? { code: failure.code } : {}),
    ...(typeof failure.message === 'string' && failure.message.length > 0 ? { message: failure.message } : {}),
  }
}

function nestedKind(value: unknown): string | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const kind = (value as { kind?: unknown }).kind
  return typeof kind === 'string' && kind.length > 0 ? kind : undefined
}

function text(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
