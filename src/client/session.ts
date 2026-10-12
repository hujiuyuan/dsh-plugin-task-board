/**
 * 把一次执行对应的会话内容读出来。
 *
 * ## 为什么是这个做法，不是嵌宿主的会话页
 *
 * 真正的「嵌进来」是把宿主自己的 `conversation.content` 工厂在我们这边再渲染一份
 * （`ui-subagent` 的侧边栏聊天就是这么干的）。那条路有两个硬门槛：
 *   1. `renderFactorySlot` **不在 ctx 上**，它只出现在「被座位渲染的组件」的 kit props 里，
 *      而且要配一个 `SessionProvider` 把目标会话的作用域绑上；
 *   2. 整条链上任何一环对不上，**报错发生在 React 渲染期**，表现出来是整个抽屉白屏。
 *
 * 代价和收益不成比例：抽屉要的是「看一眼这次跑说了什么」，不是「在这里继续对话」。
 * 所以这里只做一件事：**把会话的事件流读出来，自己画成一份只读记录。**
 * 读不动的时候说清楚为什么，抽屉其余部分照常。
 *
 * ## 读的是哪一层
 *
 * `ctx.sessions.using(id, ..., fn)` —— 它负责 retain（把会话留在内存里）、等历史窗
 * 装好、事后 release，是我们唯一该用的入口。里面拿 `eventSource` 的快照，
 * 那是一条**连续的会话事件流**，每条长这样：
 *
 * ```
 * { type: 'event', event: { type: 'user/message' | 'assistant/message', seq, time, data } }
 * ```
 *
 * 文案在 `data` 里，但两边的形状**不一样**：用户消息是 `data.content`，
 * 助手那侧是 `data.blocks`，后者用 `kind` 不用 `type`。这是宿主自己的两套，
 * 抄错一个字段名的后果是那一侧永远是空的——所以两边分开写，且都做了兜底。
 */
import { useEffect, useState } from 'react'

/** 会话里的一句话。 */
export interface Line {
  who: 'user' | 'assistant' | 'other'
  text: string
  at: number
}

export type TranscriptState = 'idle' | 'loading' | 'ready' | 'unavailable'

export interface Transcript {
  state: TranscriptState
  lines: Line[]
  /** 读不出来的原因，直接显示给用户。 */
  why: string | null
  /** 这个会话还有更早的历史没读进来。 */
  hasMore: boolean
}

const IDLE: Transcript = { state: 'idle', lines: [], why: null, hasMore: false }
const LOADING: Transcript = { state: 'loading', lines: [], why: null, hasMore: false }

/** 一次读多少条事件就停。会话可能很长，抽屉里只需要最近这一段。 */
const MAX_ENTRIES = 400

/**
 * 读某个会话。
 *
 * @param ctx - 客户端上下文。`sessions` 不在场时返回 unavailable，不抛。
 * @param sessionId - 执行记录里的那个会话 id。没有就跑 idle。
 */
export function useTranscript(ctx: any, sessionId: string | undefined): Transcript {
  /**
   * 状态里**带着它说的是哪个会话**。
   *
   * 不带的话会漏一次：从 A 卡切到 B 卡的那一帧，effect 还没跑，`state` 里还是
   * A 的会话内容。调用方（`Panel` 的自动归纳）正好在这一帧读它，就会把 A 的
   * 会话当成 B 的喂给模型 —— 而且因为归纳只问一次，喂错了永远不会纠正。
   * 所以 id 对不上的时候一律当「还没读到」。
   */
  const [held, setHeld] = useState<{ id: string | undefined; transcript: Transcript }>({
    id: undefined,
    transcript: IDLE,
  })
  const setState = (id: string | undefined, transcript: Transcript): void => setHeld({ id, transcript })
  const state = held.id === sessionId ? held.transcript : sessionId === undefined ? IDLE : LOADING

  useEffect(() => {
    if (sessionId === undefined || sessionId.length === 0) {
      setState(sessionId, IDLE)
      return
    }

    const sessions = safeGet(ctx, 'sessions')
    if (sessions === undefined || typeof sessions.using !== 'function') {
      setState(sessionId, {
        state: 'unavailable',
        lines: [],
        why: '这个部署没有会话服务（sessions），读不了会话内容。',
        hasMore: false,
      })
      return
    }

    const abort = new AbortController()
    let unsubscribe: (() => void) | undefined
    setState(sessionId, LOADING)

    void (async () => {
      try {
        await sessions.using(
          sessionId,
          { source: 'dsh-plugin-task-board', signal: abort.signal },
          (reference: any) => {
            if (abort.signal.aborted) return
            const source = reference?.binding?.session?.eventSource
            const read = (): void => {
              if (abort.signal.aborted) return
              const snapshot = source?.getSnapshot?.()
              const entries = Array.isArray(snapshot?.entries) ? snapshot.entries : []
              setState(sessionId, {
                state: 'ready',
                lines: linesOf(entries),
                why: null,
                hasMore: snapshot?.hasMore === true,
              })
            }
            read()
            // 还在跑的会话会继续往里追加，跟着走 —— 但只在这个抽屉开着的时候
            if (typeof source?.subscribe === 'function') {
              unsubscribe = source.subscribe(() => read())
            }
          },
        )
      } catch (error) {
        if (abort.signal.aborted) return
        setState(sessionId, {
          state: 'unavailable',
          lines: [],
          // 宿主给的原文照抄。它比我们清楚为什么读不到
          // （会话不在目录里、控制器已经 dispose、连接断了……）
          why: error instanceof Error ? error.message : String(error),
          hasMore: false,
        })
      }
    })()

    return () => {
      abort.abort()
      unsubscribe?.()
    }
  }, [ctx, sessionId])

  return state
}

/** 事件流 → 一句话列表。认不出的形状整条跳过，不猜。 */
function linesOf(entries: readonly any[]): Line[] {
  const out: Line[] = []
  const start = Math.max(0, entries.length - MAX_ENTRIES)
  for (let i = start; i < entries.length; i += 1) {
    const entry = entries[i]
    if (entry?.type !== 'event') continue
    const event = entry.event
    const kind = event?.type
    if (kind !== 'user/message' && kind !== 'assistant/message') continue
    const text = kind === 'user/message' ? fromContent(event.data?.content) : fromBlocks(event.data?.blocks)
    if (text === undefined || text.trim().length === 0) continue
    out.push({
      who: kind === 'user/message' ? 'user' : 'assistant',
      text: text.trim(),
      at: typeof event.time === 'number' ? event.time : 0,
    })
  }
  return out
}

/** 用户那一侧：`data.content`，块用 `type`。 */
function fromContent(content: unknown): string | undefined {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return undefined
  const parts: string[] = []
  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string') parts.push(block.text)
    else if (typeof block?.type === 'string' && block.type !== 'text') parts.push(`［${block.type}］`)
  }
  return parts.length === 0 ? undefined : parts.join('\n')
}

/** 助手那一侧：`data.blocks`，块用 `kind`。**和上面那个不是同一套字段名。** */
function fromBlocks(blocks: unknown): string | undefined {
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return undefined
  const parts: string[] = []
  for (const block of blocks) {
    if (block?.kind === 'text' && typeof block.text === 'string') parts.push(block.text)
    else if (typeof block?.kind === 'string' && block.kind !== 'text') parts.push(`［${block.kind}］`)
  }
  return parts.length === 0 ? undefined : parts.join('\n')
}

/** 调 `ctx.get` 但绝不让它把渲染带下去 —— 拿不到服务是常态，不是异常。 */
function safeGet(ctx: any, name: string): any {
  try {
    return ctx?.get?.(name)
  } catch {
    return undefined
  }
}

/**
 * 把一份会话内容压成一段给模型看的素材。
 *
 * 掐两个头：只取最近的若干句、每句最多若干字。模型的上下文不是免费的，
 * 而一张卡跑了很多次的话，第一次和最后一次之间那几十轮对「这个任务是干什么的」
 * 几乎没有增量。
 */
export function transcriptForModel(lines: readonly Line[], maxChars = 4000): string | undefined {
  if (lines.length === 0) return undefined
  const parts: string[] = []
  let used = 0
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]
    const body = line.text.length > 600 ? `${line.text.slice(0, 600)}…` : line.text
    const piece = `${line.who === 'user' ? '用户' : '助手'}：${body}`
    if (used + piece.length > maxChars) break
    parts.unshift(piece)
    used += piece.length
  }
  return parts.length === 0 ? undefined : parts.join('\n')
}
