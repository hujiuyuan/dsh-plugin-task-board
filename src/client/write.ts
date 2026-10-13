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

export type WriteOp =
  | { op: 'create'; draft: TaskDraft }
  | { op: 'patch'; taskId: string; patch: { title?: string; description?: string; prompt?: string } }
  | { op: 'status'; taskId: string; status: string }

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
