/**
 * 写操作的客户端。
 *
 * 浏览器**不直接**碰任务看板，也不碰账本：它 POST 到本插件宿主半体的一条路由，
 * 那条路由再经看板自己的闸去写（见 `src/index.ts` 的 `registerWriteRoute`）。
 *
 * ## 为什么界面上的写入口会灰着
 *
 * 宿主那条路由在**看板的宿主半体没加载**时会答 `board-absent`。这不是异常，
 * 是常见情况（看板可以没装、可以启动时降级）。这种情况下界面上的「新建任务」、
 * 「编辑」一律**禁用并把原因写在按钮上**——先让用户按下去、再弹窗说不行，
 * 是更差的体验，而且会让人以为是插件坏了。
 *
 * 挂载时探测一次；写成功之后不重新探测（看板不会写着写着就没了，
 * 真没了那次写自己会报错）。
 */
import { useCallback, useEffect, useState } from 'react'

const WRITE_URL = '/api/dsh-plugin-task-board/task'

/**
 * 排期走的是**另一条路**：任务看板自己的同源 action 通道。
 *
 * ## 为什么不能跟新建/改内容走同一条
 *
 * 看板交给第三方扩展的能力面（`host.tasks`）上只有三个动作：
 * `create` / `patchContent` / `setStatus`。**排期不在里面**，加一条规则的
 * 动作只存在于它自己的 action 通道上，扩展契约没有开这个口。
 *
 * ## 为什么直接用浏览器发是正当的，不是绕闸
 *
 * 那条通道本来就有两个平等的调用方 —— 看板源码里
 * `applyBoardAction` 的注释原话是「Provider capability calls and the same-origin
 * wire both land here, so the two surfaces can never disagree about a card」，
 * 两条路进的是**同一个校验函数**。而且它有自己的闸：`browserSameOriginMarker`
 * 要求请求带着浏览器的同源标记，非回环地址还会再查 Host 和代理令牌
 * （源码注释：「a bare local curl without any browser signal cannot exercise the
 * agent control plane」）。我们在浏览器里发，这些头部是浏览器自己加的，
 * 不是伪造的。
 *
 * ## 代价，说清楚
 *
 * 这是**比扩展契约更低一层**的接口：字段名对不上、或者看板哪天改了路径，
 * 我们这一块就会失灵。所以：
 *   - 只发 `set-schedule` 这一个动作，别的什么都不发；
 *   - 失败时把看板自己的原话带回来（它比我们清楚为什么拒绝）；
 *   - 拿不到就说清楚「去任务看板里直接改」，而不是留个点了没反应的按钮。
 */
const BOARD_ACTION_URL = '/api/task-board/action'

/** 看板收的排期改动。字段名对着它的 `SetSchedulePatch` 抄，一个不多一个不少。 */
export interface SchedulePatch {
  enabled?: boolean
  mode?: 'cron' | 'once'
  cron?: string
  /** 单次触发的时刻（ms epoch），整数。 */
  at?: number
  /** IANA 时区；`null` 是「清掉，跟宿主时区」。 */
  timeZone?: string | null
  /** 重复规则的次数上限；`null` 是「清掉，不限」。 */
  maxRuns?: number | null
}

/** 请求 id：看板拿它去重。用不出来时退回一个够随机的串。 */
function requestId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    // 非安全上下文里 randomUUID 可能不在，下面兜底
  }
  return `dsptb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

/**
 * 往看板那条同源通道发一个动作，把几种失败翻译成一句人话。
 *
 * @param action - 动作本体，字段名对着看板的 `TaskBoardAction` 抄。
 * @param what - 补在「去任务看板自己那里做」前面的那两个字（「排期」「开始」…）。
 *   这句话是说给一个**按了按钮没反应**的人听的：得告诉他去哪儿能办成。
 */
async function boardAction(action: Record<string, unknown>, what: string): Promise<WriteResult> {
  let response: Response
  try {
    response = await fetch(BOARD_ACTION_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requestId: requestId(), action }),
    })
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) }
  }

  // 403 = 它那道同源闸没放行；404 = 它的路由根本不在（没装 / 启动时降级）
  if (response.status === 403) {
    return { ok: false, error: `任务看板没有接受这次请求（它只认同源的浏览器调用）。${what}得去任务看板自己那里做。` }
  }
  if (response.status === 404) {
    return { ok: false, error: `任务看板的路由不在（它没装，或者启动时降级了）。${what}得去任务看板自己那里做。` }
  }

  const body = await response.json().catch(() => undefined) as Record<string, unknown> | undefined
  if (!response.ok || body?.ok === false) {
    return { ok: false, error: String(body?.error ?? `任务看板拒绝了这次改动（HTTP ${response.status}）`) }
  }
  return { ok: true }
}

/**
 * 改一条排期。
 *
 * 返回看板自己的话，**不做翻译**：它拒绝的理由（表达式不合法、时区认不出、
 * 单次时间已经过去了、卡被归档了……）比我们转述一遍准确。
 */
export async function writeSchedule(taskId: string, patch: SchedulePatch): Promise<WriteResult> {
  return await boardAction({ kind: 'set-schedule', taskId, patch }, '排期')
}

/** 跑这张卡时用的执行目标 —— 也走同源通道，理由见上面那段。 */
export interface ExecutionTargets {
  /**
   * Agent 预设 id（`agentPresets.list` 那一套）。**空串 = 清掉**，卡退回宿主默认：
   * 看板自己的 `normalizeTargetId` 把空串当成「没钉」。
   */
  mode?: string
  /** `provider/model`（或裸模型 id）。空串 = 清掉。 */
  model?: string
  /**
   * 权限预设。**只有这三档，而且钉上之后清不掉** —— 看板那条路的校验
   * （`isTaskPermission`）只认这三个字符串，空串和 null 都会让**整条动作**被拒
   * （不是「清空这个字段」，是「这个请求不合法」）。所以界面上不提供
   * 「跟随宿主默认」这一档来清除已钉的值，只在没钉过时留空。
   */
  permission?: 'read-only' | 'workspace-write' | 'danger-full-access'
}

/** 权限那三档，名字和解释都在这里，界面别另写一份。 */
export const PERMISSIONS: ReadonlyArray<{ value: NonNullable<ExecutionTargets['permission']>; label: string; why: string }> = [
  { value: 'read-only', label: '只读', why: '只能看，不能改任何文件' },
  { value: 'workspace-write', label: '可写工作区', why: '能在工作区里读写，工作区外面不行' },
  { value: 'danger-full-access', label: '完全放开', why: '不做限制，它会自己决定改什么' },
]

/**
 * 钉住 / 改掉一张卡的执行目标（模式 / AI / 权限）。
 *
 * 走看板自己的 `update` 动作。**扩展面（`host.tasks.create` / `patchContent`）上
 * 根本没有这三个字段** —— 只有标题、说明、执行提示、列、父任务、工作区。
 * 所以跟排期一样只能走同源通道；看板自己的新建表单写进去的也是这三个字段名。
 */
export async function writeTargets(taskId: string, targets: ExecutionTargets): Promise<WriteResult> {
  const patch: Record<string, string> = {}
  if (targets.mode !== undefined) patch.mode = targets.mode
  if (targets.model !== undefined) patch.model = targets.model
  if (targets.permission !== undefined) patch.permission = targets.permission
  if (Object.keys(patch).length === 0) return { ok: true, id: taskId }
  return await boardAction({ kind: 'update', taskId, patch }, '模式 / AI / 权限')
}

/**
 * 把一张卡跑起来 —— 也就是**发起对话**。
 *
 * 「待办」的意思是「准备好了、还没开跑」，它不会自己动。这个动作就是那一下：
 * 看板会在工作区里开一个会话、把执行提示词发过去，卡自己挪到「进行中」。
 *
 * 会被拒的情况（看板原话带回）：卡正在跑（运行锁）、工作区选不出来、卡被归档了。
 */
export async function writeRun(taskId: string): Promise<WriteResult> {
  return await boardAction({ kind: 'run', taskId }, '开始')
}

/**
 * 收工 / 撤销收工一张卡。
 *
 * 走看板自己的同源 action 通道，跟排期同一条 —— **因为扩展面上没有这个动作**。
 * 看板那条路由的白名单里 `archive` 和 `restore` 就在 `set-schedule` 隔壁，
 * 所以这条路是它有意开出来的，不是我们绕进去的。
 *
 * 会被拒的情况：任务在跑（原话 `running task cannot be archived`）、
 * 已经归档过了（no-op）、目标不存在。
 */
export async function writeArchive(taskId: string, archived: boolean): Promise<WriteResult> {
  let response: Response
  try {
    response = await fetch(BOARD_ACTION_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        requestId: requestId(),
        action: { kind: archived ? 'archive' : 'restore', taskId },
      }),
    })
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) }
  }
  if (response.status === 403) {
    return { ok: false, error: '任务看板没有接受这次请求（它只认同源的浏览器调用）' }
  }
  if (response.status === 404) {
    return { ok: false, error: '任务看板的路由不在（它没装，或者启动时降级了）' }
  }
  const body = await response.json().catch(() => undefined) as Record<string, unknown> | undefined
  if (!response.ok || body?.ok === false) {
    return { ok: false, error: String(body?.error ?? `任务看板拒绝了这次改动（HTTP ${response.status}）`) }
  }
  return { ok: true, id: taskId }
}

export type WriteOp =
  | { op: 'create'; draft: TaskDraft }
  | { op: 'patch'; taskId: string; patch: { title?: string; description?: string; prompt?: string } }
  | { op: 'status'; taskId: string; status: string }
  /**
   * 收工 / 撤销收工。**不走扩展面** —— `host.tasks` 上只有
   * `create` / `patchContent` / `setStatus` 三个动作，归档不在里面。
   * 所以它跟排期一样走看板自己的同源 action 通道，见 `writeArchive`。
   */
  | { op: 'archive'; taskId: string }
  | { op: 'restore'; taskId: string }
  /**
   * 钉住执行目标（模式 / AI / 权限）。同样**不走扩展面** ——
   * `TaskBoardTaskDraft` 和 `patchContent` 都不收这三个字段。
   */
  | { op: 'targets'; taskId: string; targets: ExecutionTargets }
  /** 把卡跑起来（发起对话）。见 `writeRun`。 */
  | { op: 'run'; taskId: string }

/** 新建时看板收的字段，一个不多一个不少（`TaskBoardTaskDraft`）。 */
export interface TaskDraft {
  title: string
  description: string
  prompt: string
  status?: string
  parentId?: string
  workspaceId?: string
}

export interface BoardWrite {
  /** 有写入口。没探到之前是 false —— 宁可先灰着，也不要让人按了没反应。 */
  ready: boolean
  /** 不能写的原因，直接显示给用户。 */
  why: string | null
  busy: boolean
  /** 上一次写失败的原因。看板拒绝时给的是它的原话。 */
  error: string | null
  clearError: () => void
  /**
   * 失败时**把原因跟着结果一起返回**，不指望调用方事后去读 `error` ——
   * 那是个 state，`await` 回来的时候还是上一轮的值，读到的是错的。
   */
  send: (action: WriteOp) => Promise<WriteResult>
}

export type WriteResult =
  | { ok: true; id?: string }
  | { ok: false; error: string }

/**
 * 排期能不能改：**直接问任务看板的那条路由在不在**。
 *
 * 为什么不拿 `useBoardWrite().ready` 代替：那个问的是「看板交给扩展的能力面
 * 通不通」，跟「它自己的 action 通道在不在」是两件事 —— 账本被另一个 DSH 进程
 * 占着的时候，服务在、路由不在（看板把这个降级叫 `ledger-locked`）。
 * 借一个近似的信号去决定一个具体的按钮亮不亮，会在这种时候把人引到错的地方。
 */
export function useScheduleReady(): { ready: boolean; why: string | null } {
  const [state, setState] = useState<{ ready: boolean; why: string | null }>({ ready: false, why: null })

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await fetch('/api/task-board/state', { headers: { accept: 'application/json' } })
        if (!alive) return
        if (response.ok) { setState({ ready: true, why: null }); return }
        setState({
          ready: false,
          why: response.status === 403
            ? '任务看板没认这次调用（它只认同源的浏览器调用）'
            : `任务看板没在跑（HTTP ${response.status}）`,
        })
      } catch (cause) {
        if (alive) setState({ ready: false, why: cause instanceof Error ? cause.message : String(cause) })
      }
    })()
    return () => { alive = false }
  }, [])

  return state
}

export function useBoardWrite(): BoardWrite {
  const [ready, setReady] = useState(false)
  const [why, setWhy] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await fetch(WRITE_URL, { headers: { accept: 'application/json' } })
        if (!response.ok) {
          if (alive) { setReady(false); setWhy(`写入口没通（HTTP ${response.status}）——宿主半体可能没装上`) }
          return
        }
        const body = await response.json()
        if (!alive) return
        setReady(body?.ready === true)
        setWhy(body?.ready === true ? null : String(body?.detail ?? '没有写入口'))
      } catch (cause) {
        if (alive) { setReady(false); setWhy(cause instanceof Error ? cause.message : String(cause)) }
      }
    })()
    return () => { alive = false }
  }, [])

  const send = useCallback(async (action: WriteOp): Promise<WriteResult> => {
    setBusy(true)
    setError(null)
    try {
      /**
       * 归档走**另一条路**（看板自己的同源 action 通道），因为扩展面的
       * `host.tasks` 上根本没有归档这个动作。放在这里分流而不是让调用方自己选，
       * 是为了让「写」这件事对上层只有一个入口 —— 调用方不需要知道
       * 哪个动作走哪条线。
       */
      if (action.op === 'archive' || action.op === 'restore') {
        const result = await writeArchive(action.taskId, action.op === 'archive')
        if (!result.ok) setError(result.error)
        return result
      }
      if (action.op === 'targets') {
        const result = await writeTargets(action.taskId, action.targets)
        if (!result.ok) setError(result.error)
        return result
      }
      if (action.op === 'run') {
        const result = await writeRun(action.taskId)
        if (!result.ok) setError(result.error)
        return result
      }
      const response = await fetch(WRITE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(action),
      })
      const body = await response.json()
      if (body?.ok !== true) {
        const error = String(body?.detail ?? '写失败')
        setError(error)
        return { ok: false, error }
      }
      return { ok: true, id: typeof body.task?.id === 'string' ? body.task.id : undefined }
    } catch (cause) {
      const error = cause instanceof Error ? cause.message : String(cause)
      setError(error)
      return { ok: false, error }
    } finally {
      setBusy(false)
    }
  }, [])

  return { ready, why, busy, error, clearError: () => setError(null), send }
}
