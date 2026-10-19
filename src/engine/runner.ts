/**
 * 跟宿主会话打交道的那一层：建会话、发 prompt、看这一轮结束了没有。
 *
 * 走的全是 `typertGateway`，跟宿主自己的界面同一层。0.2.1 起网关要求每次调用
 * 都带一个 `peer`，说清「是谁在调」；我们是宿主进程里的插件，替本机用户干活，
 * 所以声明成 `owner`（原来的任务看板也是这么做的）。这个 peer 只在本进程里造，
 * 不接受浏览器传上来的身份。
 */
import type { TaskRecord } from '../client/types'

export interface GatewayRequest {
  namespace: string
  method: string
  args: unknown
  peer?: unknown
  signal?: AbortSignal
}

export interface RawGateway {
  invoke(request: GatewayRequest): Promise<any>
  stream?(request: GatewayRequest): any
}

/** 会话里的一条事件。只写我们读的字段。 */
interface SessionEvent {
  type?: string
  seq?: number
  time?: number
  data?: any
}

/**
 * 造一个 owner peer。`ctx` 卸载时它的 signal 跟着 abort，开着的流一起结束。
 */
export function createOwnerPeer(ctx: any): { peer: unknown; dispose: () => void } {
  const controller = new AbortController()
  const id = `dsh-plugin-task-board-owner:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
  const peer = {
    id,
    ctx,
    principal: { kind: 'owner' },
    signal: controller.signal,
    interactions: 'none',
    dispose() {
      controller.abort()
      return Promise.resolve()
    },
  }
  return { peer, dispose: () => controller.abort() }
}

/** 给网关的每次调用补上 peer。下游（包括 `sessionfacts.ts`）不用知道这回事。 */
export function withPeer(gateway: RawGateway, peer: unknown): RawGateway {
  return {
    invoke: request => gateway.invoke({ ...request, peer }),
    ...(typeof gateway.stream === 'function'
      ? { stream: (request: GatewayRequest) => gateway.stream!({ ...request, peer }) }
      : {}),
  }
}

/** `/permission` 走的是宿主的命令分发，不在网关上。 */
export interface CommandsFace {
  execute(sessionId: string, text: string, signal?: AbortSignal): Promise<{ kind: string; text?: string } | undefined>
}

export interface WorkspaceRegistryFace {
  list(): ReadonlyArray<{ id: string; updatedAt?: string }>
}

const address = (sessionId: string) => ({ kind: 'session', sessionId })

/** 没钉工作区的卡跑在最近用过的那个工作区里 —— 不然宿主会落到它自己的进程目录。 */
function recentWorkspaceId(registry: WorkspaceRegistryFace | undefined): string | undefined {
  if (registry === undefined) return undefined
  const items = registry.list()
  let best: string | undefined
  let bestAt = Number.NEGATIVE_INFINITY
  for (const item of items) {
    const at = Date.parse(item.updatedAt ?? '')
    if (Number.isFinite(at) && at > bestAt) {
      best = item.id
      bestAt = at
    }
  }
  return best ?? items[0]?.id
}

/** 拼执行 prompt：标签前缀 → 定时说明 → 正文。 */
export function promptText(task: TaskRecord, scheduled: string | undefined): string {
  const body = task.prompt.trim() !== '' ? task.prompt : task.title
  const parts: string[] = []
  const tags = (task.tags ?? []).filter(tag => typeof tag.promptPrefix === 'string' && tag.promptPrefix.trim() !== '')
  if (tags.length > 0) parts.push(`标签提示（每次执行前注入）：\n${tags.map(tag => `- [${tag.name}] ${tag.promptPrefix}`).join('\n')}`)
  if (scheduled !== undefined) parts.push(scheduled)
  parts.push(body)
  return parts.join('\n\n')
}

export class Runner {
  constructor(
    private readonly gateway: RawGateway,
    private readonly commands: () => CommandsFace | undefined,
    private readonly workspaces: () => WorkspaceRegistryFace | undefined,
  ) {}

  private invoke(namespace: string, method: string, request: Record<string, unknown>): Promise<any> {
    // session/list 的参数名是 `_request`，别的会话方法都是 `request`；参数多一个少一个网关都会拒
    const args = namespace === 'session' && method === 'list' ? { _request: request } : { request }
    return this.gateway.invoke({ namespace, method, args })
  }

  /**
   * 开一个新会话把卡跑起来。`onSession` 在会话建好、发 prompt 之前回调 ——
   * 这样就算后面哪一步失败了，执行记录上也已经有会话 id，界面能点进去看。
   */
  async launch(task: TaskRecord, scheduled: string | undefined, onSession: (sessionId: string) => void): Promise<string> {
    const workspaceId = task.workspaceId ?? recentWorkspaceId(this.workspaces())
    if (workspaceId !== undefined && task.workspaceId !== undefined) {
      const registry = this.workspaces()
      if (registry !== undefined && !registry.list().some(item => item.id === workspaceId)) {
        throw new Error(`工作区不存在了：${workspaceId}`)
      }
    }
    const created = await this.invoke('session', 'create', {
      ...(workspaceId === undefined ? {} : { workspaceId }),
      ...(task.mode === undefined || task.mode === '' ? {} : { agentPreset: task.mode }),
    })
    const sessionId = created?.sessionId
    if (typeof sessionId !== 'string' || sessionId === '') throw new Error('宿主建会话没返回会话 id')
    onSession(sessionId)

    await this.invoke('session', 'rename', { sessionId, title: task.title })

    if (task.permission !== undefined) {
      const commands = this.commands()
      if (commands === undefined) throw new Error('宿主没有命令分发服务，钉不上权限，所以没跑')
      const result = await commands.execute(sessionId, `/permission ${task.permission}`, AbortSignal.timeout(30_000))
      if (result === undefined) throw new Error('权限命令没有回音，所以没跑')
      if (result.kind !== 'success') throw new Error(result.text ?? '权限命令失败，所以没跑')
    }

    const model = task.model?.trim()
    if (model !== undefined && model !== '') {
      const slash = model.indexOf('/')
      const selection = slash < 0 ? { model } : { provider: model.slice(0, slash), model: model.slice(slash + 1) }
      try {
        await this.invoke('session', 'selectModel', { sessionId, ...selection })
      } catch (error) {
        // 换模型失败不丢这次执行：卡被要求跑了，按默认模型跑完比不跑强
        console.warn(`[dsh-plugin-task-board] 会话 ${sessionId} 换模型「${model}」失败，按默认模型跑：`, error)
      }
    }

    await this.invoke('session', 'prompt', {
      sessionId,
      requestId: `dsh-plugin-task-board-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      mode: 'queue',
      content: [{ type: 'text', text: promptText(task, scheduled) }],
    })
    return sessionId
  }

  /**
   * 这次执行（从 `startedAt` 起）有没有一条 `turn/end`。
   *
   * 读法：`follow` 的第一帧是尾巴上的快照，大多数时候结论就在里面；不在就往回翻页，
   * 翻到事件时间早于 `startedAt` 为止 —— 再往前的是别的执行的事了。
   *
   * @returns 找到了就是那条事件的 `data` 和时间；没找到是 `undefined`；读失败抛错。
   */
  async findTurnEnd(sessionId: string, startedAt: number): Promise<{ data: any; at: number } | undefined> {
    if (typeof this.gateway.stream !== 'function') throw new Error('网关没有流式通道，读不了会话尾巴')
    const iterable = await this.gateway.stream({
      namespace: 'session',
      method: 'follow',
      args: { request: { address: address(sessionId), maxMessages: 50 } },
    })
    const iterator = iterable[Symbol.asyncIterator]()
    let frame: any
    try {
      const next = await iterator.next()
      frame = next.done === true ? undefined : next.value
    } finally {
      try {
        await iterator.return?.()
      } catch {
        // 关不上不影响已经拿到的那一帧
      }
    }
    if (frame?.type !== 'snapshot' || typeof frame.cursor !== 'number') throw new Error('会话事件流没给出开头的快照')

    let records: any[] = Array.isArray(frame.records) ? frame.records : []
    let hasMore = frame.hasMore === true
    for (let page = 0; page < 20; page += 1) {
      let oldestTime = Number.POSITIVE_INFINITY
      for (let index = records.length - 1; index >= 0; index -= 1) {
        const event: SessionEvent | undefined = records[index]?.event
        if (typeof event?.time === 'number') oldestTime = Math.min(oldestTime, event.time)
        if (event?.type === 'turn/end' && typeof event.time === 'number' && event.time >= startedAt) {
          return { data: event.data, at: event.time }
        }
      }
      if (!hasMore || records.length === 0 || oldestTime < startedAt) return undefined
      const beforeSeq = records[0]?.event?.seq
      if (typeof beforeSeq !== 'number') return undefined
      const result = await this.invoke('session', 'page', {
        address: address(sessionId),
        throughSeq: frame.cursor,
        maxMessages: 100,
        beforeSeq,
      })
      records = Array.isArray(result?.records) ? result.records : []
      hasMore = result?.hasMore === true
    }
    return undefined
  }

  /**
   * 盯住一个会话：它一有新事件就回调 `onActivity`。
   *
   * 回调**不带内容**，只是「醒一下」—— 结论一律由 `findTurnEnd` 去读。这样流的帧长什么样
   * 我们不用猜，猜错了最多是醒得不及时，有定时巡检兜底，不会判错。
   *
   * @returns 停止盯的函数。流开不起来时返回空函数，交给巡检。
   */
  watch(sessionId: string, onActivity: () => void): () => void {
    if (typeof this.gateway.stream !== 'function') return () => {}
    const controller = new AbortController()
    void (async () => {
      try {
        const iterable = await this.gateway.stream!({
          namespace: 'session',
          method: 'follow',
          args: { request: { address: address(sessionId), maxMessages: 1 } },
          signal: controller.signal,
        })
        let first = true
        for await (const _frame of iterable) {
          if (controller.signal.aborted) break
          // 第一帧是快照，不算「有新动静」
          if (first) {
            first = false
            continue
          }
          onActivity()
        }
      } catch {
        // 流断了：巡检会接着看，这里不报错
      }
    })()
    return () => controller.abort()
  }
}
