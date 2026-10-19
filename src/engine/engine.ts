/**
 * 规划视图自己的任务引擎。原来这些事是第三方「任务看板」插件干的，现在不依赖它了。
 *
 * 管四件事：
 *   1. **存任务**：`$DSH_HOME/dsh-plugin-task-board/tasks.json`。第一次启动时从旧账本
 *      `task-board/ledger-v2.json` 导入一次，之后只认自己的文件，旧账本一个字不碰。
 *   2. **跑任务**：开新会话、钉权限和模型、发 prompt（见 `runner.ts`）。
 *   3. **跟进度**：每个在跑的执行都盯着它的会话，有动静就去读有没有 `turn/end`；
 *      另有每 5 秒一次的巡检兜底。启动时先对一遍账（见 `reconcile`）。
 *   4. **定时**：一个计时器，指向最早该触发的那张卡。
 *
 * 所有改动排进同一个队列，一次一件，改完立刻落盘再通知界面。
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ExecutionOutcome, ExecutionRecord, ScheduleRule, TaskRecord, TaskStatus } from '../client/types'
import { isTimeZone, nextRunAt, parseCron } from './cron'
import type { Runner } from './runner'

const SCHEMA_VERSION = 1
/** 每张卡留最近多少次执行。再多界面也不看，文件却会一直涨。 */
const KEEP_EXECUTIONS = 50
const PATROL_MS = 5_000
/** 平台计时器最长 2^31-1 毫秒；远的规则每小时醒一次重算，顺带吸收时钟跳变。 */
const MAX_TIMER_MS = 60 * 60_000

const STATUSES: readonly TaskStatus[] = ['backlog', 'todo', 'running', 'done', 'failed']
const PERMISSIONS = ['read-only', 'workspace-write', 'danger-full-access'] as const

interface StoreFile {
  schemaVersion: number
  revision: number
  /** 从哪份旧账本导入的、什么时候。没导入过就没有。 */
  importedFrom?: { path: string; at: number; count: number }
  tasks: TaskRecord[]
}

export interface EngineSnapshot {
  revision: number
  tasks: readonly TaskRecord[]
  importedFrom?: StoreFile['importedFrom']
}

/** 拒绝一次写。`message` 原样显示给用户，所以写成人话。 */
export class Refusal extends Error {}

/**
 * 进程级的启动标记。cordis 会在不重启进程的情况下卸载、重装插件（换配置、webServer 重启）；
 * 那时会话**可能还在跑**，不能当成「App 被杀过」去收尾。只有这个进程里第一次启动引擎才算。
 */
const BOOT_KEY = Symbol.for('dsh-plugin-task-board/engine-booted')

function newId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`}`
}

function text(value: unknown, field: string, limit: number): string {
  if (typeof value !== 'string') throw new Refusal(`${field}要是文字`)
  if (value.length > limit) throw new Refusal(`${field}太长了（上限 ${limit} 字）`)
  return value
}

/** `turn/end` 的 reason → 这次执行的结局。只有 `completed` 算成功。 */
function outcomeOf(data: any): { outcome: ExecutionOutcome; error?: string } {
  const reason = data?.reason
  const kind = typeof reason?.kind === 'string' ? reason.kind : 'unknown'
  if (kind === 'completed') return { outcome: 'succeeded' }
  if (kind === 'aborted') {
    const by = typeof reason.reason?.kind === 'string' ? reason.reason.kind : undefined
    return { outcome: 'cancelled', error: by === undefined ? '被停止了' : `被停止了（${by}）` }
  }
  if (kind === 'error') {
    const code = typeof reason.error?.code === 'string' ? reason.error.code : undefined
    const message = typeof reason.error?.message === 'string' ? reason.error.message : undefined
    return { outcome: 'failed', error: [code, message].filter(Boolean).join('：') || '这一轮出错结束' }
  }
  if (kind === 'interrupted') return { outcome: 'failed', error: '这一轮被打断了（App 退出或重启时还没跑完）' }
  return { outcome: 'failed', error: `这一轮没有正常结束（${kind}）` }
}

/** 一次执行结束后，卡该去哪一列。定时卡跑成功了回「待办」等下一次。 */
function settledStatus(task: TaskRecord, outcome: ExecutionOutcome): TaskStatus {
  if (outcome === 'succeeded') return task.schedule?.enabled === true ? 'todo' : 'done'
  if (outcome === 'failed') return 'failed'
  return 'todo'
}

function openExecution(task: TaskRecord): ExecutionRecord | undefined {
  const last = task.executions[task.executions.length - 1]
  return last !== undefined && last.endedAt === undefined ? last : undefined
}

function cronOf(rule: ScheduleRule): string | undefined {
  return rule.mode === 'once' ? undefined : rule.cron
}

export interface SchedulePatch {
  enabled?: boolean
  mode?: 'cron' | 'once'
  cron?: string
  at?: number
  timeZone?: string | null
  maxRuns?: number | null
}

export class TaskEngine {
  private file: StoreFile = { schemaVersion: SCHEMA_VERSION, revision: 0, tasks: [] }
  private queue: Promise<unknown> = Promise.resolve()
  private readonly listeners = new Set<(snapshot: EngineSnapshot) => void>()
  private readonly watches = new Map<string, () => void>()
  private patrolTimer: ReturnType<typeof setInterval> | undefined
  private scheduleTimer: ReturnType<typeof setTimeout> | undefined
  private stopped = false
  /** 正在读的会话，防止同一个会话被几路同时去读。 */
  private readonly inspecting = new Set<string>()

  constructor(
    private readonly path: string,
    private readonly legacyLedgerPath: string,
    private readonly runner: () => Runner | undefined,
    private readonly log: (message: string) => void,
    /** 不是问题、只是留个记录的那种（导入了几张卡）。 */
    private readonly note: (message: string) => void = () => {},
  ) {}

  // ── 生命周期 ────────────────────────────────────────────

  async start(): Promise<void> {
    await this.load()
    const firstInProcess = (globalThis as any)[BOOT_KEY] !== true
    ;(globalThis as any)[BOOT_KEY] = true
    await this.reconcile(firstInProcess)
    this.patrolTimer = setInterval(() => this.patrol(), PATROL_MS)
    // 计时器不拖住进程退出：宿主要关的时候，不该因为我们还在等下一次巡检而关不掉
    this.patrolTimer.unref?.()
    this.armSchedule(true)
  }

  stop(): void {
    this.stopped = true
    if (this.patrolTimer !== undefined) clearInterval(this.patrolTimer)
    if (this.scheduleTimer !== undefined) clearTimeout(this.scheduleTimer)
    for (const stop of this.watches.values()) stop()
    this.watches.clear()
    this.listeners.clear()
  }

  snapshot(): EngineSnapshot {
    return {
      revision: this.file.revision,
      tasks: this.file.tasks,
      ...(this.file.importedFrom === undefined ? {} : { importedFrom: this.file.importedFrom }),
    }
  }

  subscribe(listener: (snapshot: EngineSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ── 存储 ────────────────────────────────────────────────

  private async load(): Promise<void> {
    let raw: string | undefined
    try {
      raw = await readFile(this.path, 'utf8')
    } catch {
      raw = undefined
    }
    if (raw !== undefined) {
      // 自己的文件坏了**不能**当成空的覆盖掉 —— 那是用户全部的任务。抛出去，插件起不来、日志里有原因
      const parsed = JSON.parse(raw) as StoreFile
      if (parsed.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.tasks)) {
        throw new Error(`${this.path} 的格式认不出（schemaVersion ${String(parsed.schemaVersion)}），没有动它`)
      }
      this.file = parsed
      return
    }
    await this.importLegacy()
  }

  /** 第一次启动：把旧账本里的卡搬过来。旧账本只读，搬完也不删。 */
  private async importLegacy(): Promise<void> {
    let tasks: TaskRecord[] = []
    try {
      const parsed = JSON.parse(await readFile(this.legacyLedgerPath, 'utf8'))
      if (Array.isArray(parsed?.tasks)) {
        tasks = parsed.tasks.filter((t: any) =>
          typeof t?.id === 'string' && typeof t?.title === 'string' && STATUSES.includes(t?.status))
          .map((t: any) => ({ ...t, executions: Array.isArray(t.executions) ? t.executions : [] }))
      }
    } catch {
      // 没有旧账本就是从零开始，正常情况
    }
    this.file = {
      schemaVersion: SCHEMA_VERSION,
      revision: 1,
      ...(tasks.length === 0 ? {} : { importedFrom: { path: this.legacyLedgerPath, at: Date.now(), count: tasks.length } }),
      tasks,
    }
    await this.persist()
    if (tasks.length > 0) this.note(`从旧账本导入了 ${tasks.length} 张卡：${this.legacyLedgerPath}`)
  }

  /** 先写临时文件再改名：写到一半断电，原文件还是完整的。 */
  private async persist(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    const temp = `${this.path}.tmp-${process.pid}`
    await writeFile(temp, `${JSON.stringify(this.file, null, 2)}\n`, 'utf8')
    await rename(temp, this.path)
  }

  /** 排队改一次。`mutate` 返回 false 表示没改，不落盘也不通知。 */
  private change<T>(mutate: (tasks: TaskRecord[]) => T | false): Promise<T> {
    const run = this.queue.then(async () => {
      const tasks = this.file.tasks.map(task => task)
      const result = mutate(tasks)
      if (result === false) return result as T
      this.file = { ...this.file, revision: this.file.revision + 1, tasks }
      await this.persist()
      const snapshot = this.snapshot()
      for (const listener of this.listeners) {
        try {
          listener(snapshot)
        } catch {
          // 一个界面连接坏了不影响别的
        }
      }
      return result
    })
    // 队列本身不能因为一次失败就断掉
    this.queue = run.catch(() => undefined)
    return run
  }

  private static find(tasks: TaskRecord[], taskId: unknown): number {
    if (typeof taskId !== 'string' || taskId === '') throw new Refusal('没指定是哪张卡')
    const index = tasks.findIndex(task => task.id === taskId)
    if (index < 0) throw new Refusal('这张卡不存在了（可能刚被删掉）')
    return index
  }

  // ── 写操作（界面发来的） ────────────────────────────────

  create(draft: Record<string, unknown>): Promise<TaskRecord> {
    const title = text(draft.title, '标题', 200).trim()
    if (title === '') throw new Refusal('标题不能为空')
    const description = draft.description === undefined ? '' : text(draft.description, '说明', 20_000)
    const prompt = draft.prompt === undefined ? '' : text(draft.prompt, '执行提示', 50_000)
    const status = draft.status === undefined ? 'todo' : draft.status
    if (status !== 'backlog' && status !== 'todo') throw new Refusal('新卡只能放进「待规划」或「待办」')
    return this.change(tasks => {
      const now = Date.now()
      if (draft.parentId !== undefined) TaskEngine.find(tasks, draft.parentId)
      const task: TaskRecord = {
        id: newId('task'),
        title,
        description,
        prompt,
        status,
        createdAt: now,
        updatedAt: now,
        executions: [],
        ...(typeof draft.parentId === 'string' ? { parentId: draft.parentId } : {}),
        ...(typeof draft.workspaceId === 'string' && draft.workspaceId !== '' ? { workspaceId: draft.workspaceId } : {}),
      }
      tasks.push(task)
      return task
    })
  }

  patch(taskId: unknown, patch: Record<string, unknown>): Promise<void> {
    return this.change(tasks => {
      const index = TaskEngine.find(tasks, taskId)
      const next = { ...tasks[index]! }
      if (patch.title !== undefined) {
        const title = text(patch.title, '标题', 200).trim()
        if (title === '') throw new Refusal('标题不能为空')
        next.title = title
      }
      if (patch.description !== undefined) next.description = text(patch.description, '说明', 20_000)
      if (patch.prompt !== undefined) next.prompt = text(patch.prompt, '执行提示', 50_000)
      next.updatedAt = Date.now()
      tasks[index] = next
    })
  }

  /** 手动挪列。挪进「进行中」得用「开始」；把在跑的卡挪走，这次执行记成取消。 */
  setStatus(taskId: unknown, status: unknown): Promise<void> {
    if (!STATUSES.includes(status as TaskStatus)) throw new Refusal(`认不出的列「${String(status)}」`)
    if (status === 'running') throw new Refusal('要让它跑起来请点「开始」，直接拖进「进行中」不会真的开跑')
    return this.change(tasks => {
      const index = TaskEngine.find(tasks, taskId)
      const task = tasks[index]!
      const now = Date.now()
      const open = openExecution(task)
      const executions = open === undefined
        ? task.executions
        : task.executions.map(e => (e === open ? { ...e, endedAt: now, result: 'cancelled' as const, error: '卡被手动挪走了' } : e))
      tasks[index] = { ...task, status: status as TaskStatus, updatedAt: now, executions }
      if (open?.sessionId !== undefined) this.unwatch(open.sessionId)
    })
  }

  archive(taskId: unknown, archived: boolean): Promise<void> {
    return this.change(tasks => {
      const index = TaskEngine.find(tasks, taskId)
      const task = tasks[index]!
      if (archived && openExecution(task) !== undefined) throw new Refusal('卡还在跑，跑完了才能收工')
      if (archived === (task.archivedAt !== undefined)) return false
      const next = { ...task, updatedAt: Date.now() }
      if (archived) next.archivedAt = Date.now()
      else delete next.archivedAt
      tasks[index] = next
    }).then(() => this.armSchedule(false))
  }

  setTargets(taskId: unknown, targets: Record<string, unknown>): Promise<void> {
    return this.change(tasks => {
      const index = TaskEngine.find(tasks, taskId)
      const next = { ...tasks[index]!, updatedAt: Date.now() }
      for (const key of ['mode', 'model'] as const) {
        const value = targets[key]
        if (value === undefined) continue
        const clean = text(value, key === 'mode' ? '模式' : 'AI', 200).trim()
        if (clean === '') delete next[key]
        else next[key] = clean
      }
      if (targets.permission !== undefined) {
        if (!PERMISSIONS.includes(targets.permission as any)) throw new Refusal('权限只能是只读、可写工作区、完全放开三档之一')
        next.permission = targets.permission as string
      }
      tasks[index] = next
    })
  }

  setSchedule(taskId: unknown, patch: SchedulePatch): Promise<void> {
    return this.change(tasks => {
      const index = TaskEngine.find(tasks, taskId)
      const task = tasks[index]!
      if (task.archivedAt !== undefined) throw new Refusal('卡已经收工了，先撤销收工再排期')
      const now = Date.now()
      const prev: ScheduleRule = task.schedule ?? { enabled: false, nextRunAt: undefined, lastTriggeredAt: undefined, runCount: 0 }
      const rule: ScheduleRule = { ...prev }
      if (patch.mode !== undefined) rule.mode = patch.mode
      if (patch.cron !== undefined) rule.cron = patch.cron.trim()
      if (patch.at !== undefined) rule.at = patch.at
      if (patch.timeZone !== undefined) {
        if (patch.timeZone === null || patch.timeZone === '') delete rule.timeZone
        else if (!isTimeZone(patch.timeZone)) throw new Refusal(`时区认不出：${patch.timeZone}`)
        else rule.timeZone = patch.timeZone
      }
      if (patch.maxRuns !== undefined) {
        if (patch.maxRuns === null) delete rule.maxRuns
        else if (!Number.isInteger(patch.maxRuns) || patch.maxRuns < 1) throw new Refusal('次数上限要是正整数')
        else rule.maxRuns = patch.maxRuns
      }
      if (patch.enabled !== undefined) rule.enabled = patch.enabled
      const mode = rule.mode ?? 'cron'
      rule.mode = mode

      if (rule.enabled) {
        if (mode === 'once') {
          if (typeof rule.at !== 'number' || !Number.isFinite(rule.at)) throw new Refusal('单次排期要给一个时间')
          if (rule.at <= now) throw new Refusal('单次排期的时间已经过去了')
          rule.nextRunAt = rule.at
          delete rule.maxRuns
        } else {
          if (rule.cron === undefined || rule.cron === '') throw new Refusal('重复排期要给 cron 表达式')
          try {
            parseCron(rule.cron)
          } catch (error) {
            throw new Refusal((error as Error).message)
          }
          rule.nextRunAt = nextRunAt(rule.cron, now, rule.timeZone)
          if (rule.nextRunAt === undefined) throw new Refusal('这条 cron 一年内都不会触发，检查一下日期')
        }
        // 重新打开一条停掉的规则：清掉「为什么停」，次数从头算
        if (!prev.enabled) {
          delete rule.endedAt
          delete rule.endedReason
          if (prev.endedAt !== undefined) rule.runCount = 0
        }
      } else {
        rule.nextRunAt = undefined
      }
      tasks[index] = { ...task, schedule: rule, updatedAt: now }
    }).then(() => this.armSchedule(false))
  }

  /** 「开始」：开会话跑这张卡。会话建好之前就返回，后面的进度靠盯会话。 */
  run(taskId: unknown, scheduled?: string): Promise<{ executionId: string }> {
    const runner = this.runner()
    if (runner === undefined) throw new Refusal('宿主的会话网关还没就绪，稍等几秒再点')
    return this.change(tasks => {
      const index = TaskEngine.find(tasks, taskId)
      const task = tasks[index]!
      if (task.archivedAt !== undefined) throw new Refusal('卡已经收工了，先撤销收工再跑')
      if (openExecution(task) !== undefined) throw new Refusal('这张卡已经在跑了')
      const now = Date.now()
      const execution: ExecutionRecord = {
        id: newId('exec'),
        sessionId: undefined,
        startedAt: now,
        endedAt: undefined,
        result: undefined,
        error: undefined,
        ...(scheduled === undefined ? { initiatedBy: 'user' } : {}),
      }
      tasks[index] = {
        ...task,
        status: 'running',
        updatedAt: now,
        executions: [...task.executions, execution].slice(-KEEP_EXECUTIONS),
      }
      return { executionId: execution.id, task: tasks[index]! }
    }).then(({ executionId, task }) => {
      void this.launch(runner, task, executionId, scheduled)
      return { executionId }
    })
  }

  private async launch(runner: Runner, task: TaskRecord, executionId: string, scheduled: string | undefined): Promise<void> {
    try {
      await runner.launch(task, scheduled, sessionId => {
        void this.updateExecution(task.id, executionId, e => ({ ...e, sessionId })).then(() => this.watch(sessionId))
      })
    } catch (error) {
      await this.settle(task.id, executionId, 'failed', `没跑起来：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private updateExecution(taskId: string, executionId: string, update: (e: ExecutionRecord) => ExecutionRecord): Promise<void> {
    return this.change(tasks => {
      const index = tasks.findIndex(task => task.id === taskId)
      if (index < 0) return false
      const task = tasks[index]!
      if (!task.executions.some(e => e.id === executionId)) return false
      tasks[index] = { ...task, executions: task.executions.map(e => (e.id === executionId ? update(e) : e)) }
    })
  }

  private settle(taskId: string, executionId: string, outcome: ExecutionOutcome, error: string | undefined): Promise<void> {
    return this.change(tasks => {
      const index = tasks.findIndex(task => task.id === taskId)
      if (index < 0) return false
      const task = tasks[index]!
      const execution = task.executions.find(e => e.id === executionId)
      if (execution === undefined || execution.endedAt !== undefined) return false
      const now = Date.now()
      tasks[index] = {
        ...task,
        status: settledStatus(task, outcome),
        updatedAt: now,
        executions: task.executions.map(e => (e.id === executionId ? { ...e, endedAt: now, result: outcome, error } : e)),
      }
      if (execution.sessionId !== undefined) this.unwatch(execution.sessionId)
    })
  }

  // ── 跟进度 ──────────────────────────────────────────────

  private watch(sessionId: string): void {
    if (this.stopped || this.watches.has(sessionId)) return
    const runner = this.runner()
    if (runner === undefined) return
    this.watches.set(sessionId, runner.watch(sessionId, () => void this.inspect(sessionId)))
  }

  private unwatch(sessionId: string): void {
    this.watches.get(sessionId)?.()
    this.watches.delete(sessionId)
  }

  /** 读一个会话：如果它对应的执行已经有了 `turn/end`，就收尾。 */
  private async inspect(sessionId: string): Promise<'settled' | 'open' | 'unreadable'> {
    const runner = this.runner()
    if (runner === undefined || this.inspecting.has(sessionId)) return 'open'
    const found = this.file.tasks.flatMap(task => {
      const open = openExecution(task)
      return open?.sessionId === sessionId ? [{ task, open }] : []
    })[0]
    if (found === undefined) {
      this.unwatch(sessionId)
      return 'settled'
    }
    this.inspecting.add(sessionId)
    try {
      const end = await runner.findTurnEnd(sessionId, found.open.startedAt)
      if (end === undefined) return 'open'
      const { outcome, error } = outcomeOf(end.data)
      await this.settle(found.task.id, found.open.id, outcome, error)
      return 'settled'
    } catch (error) {
      this.log(`读会话 ${sessionId} 失败，下一轮巡检再试：${error instanceof Error ? error.message : String(error)}`)
      return 'unreadable'
    } finally {
      this.inspecting.delete(sessionId)
    }
  }

  /** 巡检：所有开着的执行都看一眼。流没醒、或者根本开不起来时靠它。 */
  private patrol(): void {
    if (this.stopped) return
    for (const task of this.file.tasks) {
      const open = openExecution(task)
      if (open?.sessionId === undefined) continue
      this.watch(open.sessionId)
      void this.inspect(open.sessionId)
    }
  }

  /**
   * 启动对账。
   *
   * 每张「开着」的执行都先去会话日志里找结论：找到了就按结论收尾（App 重启后宿主会给
   * 硬杀时没跑完的那一轮补一条 `interrupted`，也会走到这里）。
   *
   * 找不到结论时分两种：
   *   - **这个进程里第一次启动**（App 刚启动）：之前那个进程已经没了，会话不可能还在跑，
   *     记成「被打断」；连会话都没建好的那种也一样。
   *   - **插件被重装**（进程没换）：会话可能还在跑，接着盯，不收尾。
   */
  private async reconcile(firstInProcess: boolean): Promise<void> {
    const open = this.file.tasks.flatMap(task => {
      const execution = openExecution(task)
      return execution === undefined ? [] : [{ task, execution }]
    })
    if (open.length === 0) return
    // 网关可能比我们晚到；等它最多 20 秒，不然对不了账
    for (let waited = 0; this.runner() === undefined && waited < 20_000; waited += 500) {
      await new Promise(resolve => setTimeout(resolve, 500))
      if (this.stopped) return
    }
    for (const { task, execution } of open) {
      if (execution.sessionId === undefined) {
        if (firstInProcess) await this.settle(task.id, execution.id, 'failed', '会话还没建好 App 就退出了，这次没跑')
        continue
      }
      const result = await this.inspect(execution.sessionId)
      if (result === 'open' && firstInProcess) {
        await this.settle(task.id, execution.id, 'failed', '这一轮被打断了（App 退出或重启时还没跑完）')
      } else if (result !== 'settled') {
        this.watch(execution.sessionId)
      }
    }
  }

  // ── 定时 ────────────────────────────────────────────────

  /**
   * 把计时器指到最早该触发的那张卡。
   *
   * `startup` 为真时，`nextRunAt` 已经过去的规则（App 关着的时候错过的）**只补跑一次**，
   * 然后从现在往后算下一次 —— 关了一周回来不会连跑七次。
   */
  private armSchedule(startup: boolean): void {
    if (this.stopped) return
    if (this.scheduleTimer !== undefined) clearTimeout(this.scheduleTimer)
    this.scheduleTimer = undefined
    let earliest = Number.POSITIVE_INFINITY
    for (const task of this.file.tasks) {
      const rule = task.schedule
      if (task.archivedAt !== undefined || rule?.enabled !== true || rule.nextRunAt === undefined) continue
      earliest = Math.min(earliest, rule.nextRunAt)
    }
    if (earliest === Number.POSITIVE_INFINITY) return
    const delay = Math.max(0, Math.min(earliest - Date.now(), MAX_TIMER_MS))
    this.scheduleTimer = setTimeout(() => void this.fire(startup), delay)
    this.scheduleTimer.unref?.()
  }

  private async fire(catchUp: boolean): Promise<void> {
    if (this.stopped) return
    const now = Date.now()
    const due = this.file.tasks.filter(task =>
      task.archivedAt === undefined && task.schedule?.enabled === true
      && task.schedule.nextRunAt !== undefined && task.schedule.nextRunAt <= now)
    for (const task of due) {
      try {
        await this.trigger(task.id, now, catchUp)
      } catch (error) {
        this.log(`定时触发「${task.title}」失败：${error instanceof Error ? error.message : String(error)}`)
      }
    }
    this.armSchedule(false)
  }

  /** 到点了：推进规则，再决定跑不跑。规则先推进再跑，跑失败了也不会卡在同一时刻反复触发。 */
  private async trigger(taskId: string, now: number, catchUp: boolean): Promise<void> {
    const decision = await this.change(tasks => {
      const index = tasks.findIndex(task => task.id === taskId)
      if (index < 0) return false
      const task = tasks[index]!
      const rule = { ...task.schedule! }
      const busy = openExecution(task) !== undefined
      const missed = catchUp && rule.nextRunAt !== undefined && now - rule.nextRunAt > 60_000
      const cron = cronOf(rule)
      if (busy) {
        rule.skippedAt = now
        rule.skippedReason = '到点时上一次还在跑，这次跳过'
      } else {
        rule.lastTriggeredAt = now
        rule.runCount = (rule.runCount ?? 0) + 1
      }
      if (cron === undefined) {
        rule.enabled = false
        rule.nextRunAt = undefined
        rule.endedAt = now
        rule.endedReason = busy ? '单次排期到点时卡还在跑，没有执行' : '单次排期已执行'
      } else if (rule.maxRuns !== undefined && rule.runCount >= rule.maxRuns) {
        rule.enabled = false
        rule.nextRunAt = undefined
        rule.endedAt = now
        rule.endedReason = `跑满了 ${rule.maxRuns} 次`
      } else {
        rule.nextRunAt = nextRunAt(cron, now, rule.timeZone)
      }
      tasks[index] = { ...task, schedule: rule, updatedAt: now }
      return { run: !busy, missed, cron }
    })
    if ((decision as unknown) === false || !decision.run) return
    const label = decision.cron === undefined ? '单次排期' : `定时规则 ${decision.cron}`
    const note = decision.missed
      ? `（这次是定时触发：${label}。App 关着时错过了，启动后补跑一次。）`
      : `（这次是定时触发：${label}。）`
    await this.run(taskId, note)
  }
}
