/**
 * 写操作的客户端。
 *
 * 所有写都 POST 到本插件宿主半体的一条路由（`/api/dsh-plugin-task-board/task`），
 * 由规划视图自己的任务引擎执行（见 `src/engine/engine.ts`）。引擎拒绝时给的是人话，
 * 原样显示，不转述。
 *
 * 挂载时问一次「能不能写」：引擎没起来时写入口一律禁用并写明原因 ——
 * 先让人按下去再弹窗说不行，比灰着更气人。
 */
import { useCallback, useEffect, useState } from 'react'

const WRITE_URL = '/api/dsh-plugin-task-board/task'

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

/** 发一个写动作，失败时把引擎的原话带回来。 */
async function post(action: Record<string, unknown>): Promise<WriteResult> {
  try {
    const response = await fetch(WRITE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(action),
    })
    const body = await response.json().catch(() => undefined) as Record<string, unknown> | undefined
    if (!response.ok || body?.ok !== true) {
      return { ok: false, error: String(body?.detail ?? `写失败（HTTP ${response.status}）`) }
    }
    const task = body.task as { id?: unknown } | undefined
    return { ok: true, id: typeof task?.id === 'string' ? task.id : undefined }
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) }
  }
}

/** 改一条排期。表达式不合法、时区认不出、单次时间已过，引擎都会说清。 */
export async function writeSchedule(taskId: string, patch: SchedulePatch): Promise<WriteResult> {
  return await post({ op: 'schedule', taskId, patch })
}

/** 跑这张卡时用的执行目标。 */
export interface ExecutionTargets {
  /**
   * Agent 预设 id（`agentPresets.list` 那一套）。**空串 = 清掉**，卡退回宿主默认。
   */
  mode?: string
  /** `provider/model`（或裸模型 id）。空串 = 清掉。 */
  model?: string
  /**
   * 权限预设。**只有这三档，而且钉上之后清不掉** —— 引擎只认这三个字符串，
   * 别的值整条动作被拒。所以界面上不提供「跟随宿主默认」这一档，只在没钉过时留空。
   */
  permission?: 'read-only' | 'workspace-write' | 'danger-full-access'
}

/** 权限那三档，名字和解释都在这里，界面别另写一份。 */
export const PERMISSIONS: ReadonlyArray<{ value: NonNullable<ExecutionTargets['permission']>; label: string; why: string }> = [
  { value: 'read-only', label: '只读', why: '只能看，不能改任何文件' },
  { value: 'workspace-write', label: '可写工作区', why: '能在工作区里读写，工作区外面不行' },
  { value: 'danger-full-access', label: '完全放开', why: '不做限制，它会自己决定改什么' },
]

/** 钉住 / 改掉一张卡的执行目标（模式 / AI / 权限）。 */
export async function writeTargets(taskId: string, targets: ExecutionTargets): Promise<WriteResult> {
  if (Object.keys(targets).length === 0) return { ok: true, id: taskId }
  return await post({ op: 'targets', taskId, targets })
}

/**
 * 把一张卡跑起来 —— 也就是**发起对话**。引擎在工作区里开一个会话、把执行提示词发过去，
 * 卡自己挪到「进行中」，这一轮结束后按结果挪到「待审阅」或「已失败」。
 *
 * 会被拒的情况（引擎原话带回）：卡正在跑、卡被归档了、会话网关还没就绪。
 */
export async function writeRun(taskId: string): Promise<WriteResult> {
  return await post({ op: 'run', taskId })
}

export type WriteOp =
  | { op: 'create'; draft: TaskDraft }
  | { op: 'patch'; taskId: string; patch: { title?: string; description?: string; prompt?: string } }
  | { op: 'status'; taskId: string; status: string }
  /** 收工 / 撤销收工。 */
  | { op: 'archive'; taskId: string }
  | { op: 'restore'; taskId: string }
  /** 钉住执行目标（模式 / AI / 权限）。 */
  | { op: 'targets'; taskId: string; targets: ExecutionTargets }
  /** 把卡跑起来（发起对话）。见 `writeRun`。 */
  | { op: 'run'; taskId: string }
  /** 改排期。见 `writeSchedule`。 */
  | { op: 'schedule'; taskId: string; patch: SchedulePatch }

/** 新建时引擎收的字段。 */
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
  /** 上一次写失败的原因。引擎拒绝时给的是它的原话。 */
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

/** 排期能不能改。跟别的写同一个引擎，所以就是写入口在不在。 */
export function useScheduleReady(): { ready: boolean; why: string | null } {
  const write = useBoardWrite()
  return { ready: write.ready, why: write.why }
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
      const result = await post(action as unknown as Record<string, unknown>)
      if (!result.ok) setError(result.error)
      return result
    } finally {
      setBusy(false)
    }
  }, [])

  return { ready, why, busy, error, clearError: () => setError(null), send }
}
