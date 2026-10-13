/**
 * 把宿主**真正的**会话页嵌进抽屉。
 *
 * ## 为什么这件事能做（以及上一版为什么以为不能）
 *
 * 早先的判断是「`conversation.content` 是单工厂座位，第三方注册不了，所以嵌不进来」。
 * 前半句对，后半句错在把「注册」当成了唯一入口。
 *
 * `conversation.content` 是一个 **Component Factory**：宿主定义一次，谁都可以
 * **渲染一份 occurrence**。渲染它的钥匙是 `renderFactorySlot`，这个函数不在 ctx 上、
 * 也不用 import —— 它是渲染器**白送给每一个座位组件的 kit prop**
 * （renderer 的 `standardKit` 里恒定注入）。宿主的 `ui-subagent` 就是这么把同一份
 * 会话页渲进右侧栏的，官方 README 原话是 renders the shared Factory。
 *
 * ## 唯一的门槛：会话身份只能从渲染位置继承
 *
 * 官方 README 的 Known Limitations 写死了这条：**factory 不接受一个独立的 sessionId**。
 * 想要指定看哪个会话，只能在外层套一个 `SessionProvider`，把会话引用喂给它。
 * 而 `SessionProvider` 也是 kit prop —— 但它**有条件**：只有注册的那个座位声明了
 * 非 root 的 session 作用域子座位时才发。
 *
 * 所以这里做了两件事：
 *   1. 注册 `main` 座位时多声明一个 session 作用域的子座位（**纯粹为了换到
 *      `SessionProvider`**，那个座位我们一个组件都不往里注册）；
 *   2. 这里 retain 出会话引用，套上 `SessionProvider`，再 `renderFactorySlot`。
 *
 * ## 为什么外面一定要包一层自己的错误边界
 *
 * 宿主的渲染器对 `SlotAssemblyError` 是**重新抛出**的（它的 error boundary 明确
 * `if (error instanceof SlotAssemblyError) throw error`），一路上去就是整片白屏。
 * 我们这一层边界比它靠外，所以最坏情况是**退回只读记录**，不会把抽屉带走。
 * 这不是多余的防御：几个会抛的路径（视图绑定缺失、input props 和注入的重名）
 * 都是我们自己拼错了才会踩到的，而拼错了不应该让用户看到一个白屏。
 */
import { Component, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * 座位组件拿到的那一小把 kit props。**只用这两个**，别的一个都不碰 ——
 * 用得越多，宿主改版时我们被带下去的面就越大。
 */
export interface SlotKit {
  /** 把一个已注册的 factory 渲染一份出来。宿主的会话页就是这么嵌的。 */
  renderFactorySlot?: (name: string, props: Record<string, unknown>) => ReactNode
  /** 给一个会话引用，把下面那棵子树的会话身份绑上。 */
  SessionProvider?: (props: { session: unknown; children: ReactNode }) => ReactNode
}

export type EmbedState =
  | { kind: 'ok'; reference: unknown }
  | { kind: 'loading' }
  /** 嵌不了，以及为什么。**每一种都要能说出来**，不能只剩一个空白框。 */
  | { kind: 'unavailable'; why: string }

/**
 * retain 一个会话引用，渲染期间一直活着。
 *
 * 跟 `session.ts` 里那个 `using` 的区别：`using` 是「读一下就走」（回调返回即释放），
 * 而这里要把引用**一直握在手里**给 `SessionProvider` 用。所以是手动的
 * `retain` / `release` 配对 —— 漏掉 release 的后果是那个会话永久驻留内存。
 */
export function useSessionReference(ctx: any, sessionId: string | undefined, enabled: boolean): EmbedState {
  const [held, setHeld] = useState<{ id: string | undefined; state: EmbedState }>({
    id: undefined,
    state: { kind: 'loading' },
  })

  useEffect(() => {
    if (!enabled) {
      setHeld({ id: sessionId, state: { kind: 'unavailable', why: '这个部署没有给到渲染会话页需要的东西' } })
      return
    }
    if (sessionId === undefined || sessionId.length === 0) {
      setHeld({ id: sessionId, state: { kind: 'unavailable', why: '这个任务还没有会话' } })
      return
    }

    const sessions = safeGet(ctx, 'sessions')
    if (sessions === undefined || typeof sessions.retain !== 'function') {
      setHeld({ id: sessionId, state: { kind: 'unavailable', why: '这个部署的会话服务没有 retain —— 拿不到可渲染的会话引用' } })
      return
    }

    const abort = new AbortController()
    let reference: any
    try {
      reference = sessions.retain(sessionId, { source: 'dsh-plugin-task-board', signal: abort.signal })
    } catch (error) {
      setHeld({ id: sessionId, state: { kind: 'unavailable', why: error instanceof Error ? error.message : String(error) } })
      return
    }
    setHeld({ id: sessionId, state: { kind: 'ok', reference } })

    return () => {
      // 两个都得给：abort 让还在飞的 open 停下，release 把引用还回去。
      // 顺序反过来的话，release 之后那次 open 完成时会去动一个已经还掉的东西
      abort.abort()
      try {
        reference?.release?.()
      } catch {
        // 已经释放过了（宿主自己收走的）不算错
      }
    }
  }, [ctx, sessionId, enabled])

  // id 对不上的那一帧一律当「还没好」—— 跟 `session.ts` 同一个道理：
  // 从 A 卡切到 B 卡时，这一帧拿着的还是 A 的引用，喂错会话比慢一帧糟得多
  if (held.id !== sessionId) return sessionId === undefined ? { kind: 'unavailable', why: '这个任务还没有会话' } : { kind: 'loading' }
  return held.state
}

/**
 * 嵌一份宿主会话页。
 *
 * `fallback` 拿到的是一句原因，调用方用它渲染退路（我们自己的只读记录）——
 * **嵌不进来不是错误状态**，是「这个部署/这次会话刚好不行」，退路照常有用。
 */
export function EmbeddedConversation({
  ctx,
  sessionId,
  kit,
  available,
  fallback,
}: {
  ctx: any
  sessionId: string | undefined
  kit: SlotKit
  available: boolean
  fallback: (why: string) => ReactNode
}): ReactNode {
  const state = useSessionReference(ctx, sessionId, available)

  if (state.kind === 'unavailable') return fallback(state.why)
  if (state.kind === 'loading') return <p className="d-empty">正在打开会话…</p>

  const renderFactorySlot = kit.renderFactorySlot as NonNullable<SlotKit['renderFactorySlot']>
  const SessionProvider = kit.SessionProvider as NonNullable<SlotKit['SessionProvider']>

  return (
    <SlotBoundary key={sessionId} fallback={fallback}>
      <SessionProvider session={state.reference}>
        <FactoryOccurrence render={renderFactorySlot} />
      </SessionProvider>
    </SlotBoundary>
  )
}

/**
 * 真正去装配那一份 occurrence 的组件。
 *
 * **它必须单独存在**，不能把 `renderFactorySlot(...)` 写在 `EmbeddedConversation`
 * 的 return 里 —— JSX 的子节点是在父组件渲染时求值的，写在那儿就等于在边界**外面**
 * 调用它，它抛出来会直接越过我们的边界。放进子组件里渲染，才真的被兜住。
 */
function FactoryOccurrence({ render }: { render: NonNullable<SlotKit['renderFactorySlot']> }): ReactNode {
  return (
    /*
      说清这是**真的那个**。不说的话，用户会以为跟上面那些字段一样是我们画的，
      于是不知道自己可以在这里接着跟它说话。

      这话放在悬停气泡里而不是页面上：它是**第一次看才需要**的一句提示，
      放在正文里就等于每次开抽屉都收一遍过路费，而这块地方正是要腾给聊天区的。
    */
    <div
      className="embed-frame"
      title="这是宿主的会话页本体，不是本插件画的 —— 可以直接在这里接着对话"
    >
      {/*
        第三个参数（局部组件 `slots.views`）**故意不传**。传了就等于声明
        「我这边有会话绑定」而 views 是 session 作用域的，绑定要是没接上，
        渲染器抛的是 SlotAssemblyError —— 那个会一路穿到最外层变白屏。
        不传就用宿主默认的视图，对我们来说没有损失。
      */}
      {render('conversation.content', { variant: 'embedded', phase: 'active', hero: false })}
    </div>
  )
}

interface BoundaryProps {
  fallback: (why: string) => ReactNode
  children: ReactNode
}

/**
 * 兜住渲染期抛出来的任何东西。
 *
 * 必须是 class —— React 没有函数式的错误边界。这里**不做重试**：
 * 抛一次就说明这条路在这个会话上走不通，反复重试只会反复闪。
 */
class SlotBoundary extends Component<BoundaryProps, { error?: Error }> {
  state: { error?: Error } = {}

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error }
  }

  componentDidCatch(error: Error): void {
    // 留在控制台，方便对宿主报问题时有东西可查
    console.warn('[dsh-plugin-task-board] 内嵌会话页渲染失败：', error)
  }

  render(): ReactNode {
    if (this.state.error !== undefined) {
      const message = this.state.error.message.length > 0 ? this.state.error.message : String(this.state.error)
      return this.props.fallback(`宿主会话页渲染时出错了：${message}`)
    }
    return this.props.children
  }
}

/** 调 `ctx.get` 但绝不让它把渲染带下去 —— 拿不到服务是常态，不是异常。 */
function safeGet(ctx: any, name: string): any {
  try {
    return ctx?.get?.(name)
  } catch {
    return undefined
  }
}
