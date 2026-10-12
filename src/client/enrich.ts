/**
 * 浏览器这半边怎么拿到「目标 / 场景 / 背景 / 验收」这四条。
 *
 * 三条路，按代价从低到高：
 *   1. **规则推导**（`derive.ts`）—— 不联网、不花钱、立刻有，永远在。
 *   2. **人工改动** —— 用户自己填的，存在插件自己的文件里，压过一切。
 *   3. **模型归纳** —— 点按钮才发生，一次调用，结果缓存到指纹变了为止。
 *
 * 这个文件只管 2 和 3 的取送。**界面在任何一条路失败时都必须还能显示第 1 条**
 * —— 也就是说这里所有的失败都是「这一格退回规则推导」，不是「这一页空了」。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AiIntent } from '../enrich'
import type { Override } from './derive'
import type { TaskRecord } from './types'

const ENRICH_URL = '/api/dsh-plugin-task-board/enrich'
const OVERRIDES_URL = '/api/dsh-plugin-task-board/overrides'

/** 用户挑的模型记在这儿，下次不用再挑。 */
const MODEL_KEY = 'dsh-plugin-task-board:enrich-model'

export type EnrichFailureReason = 'no-model' | 'model-error' | 'timeout' | 'bad-request' | 'offline'

export interface EnrichError {
  reason: EnrichFailureReason
  detail: string
}

export interface Enrichment {
  /** taskId → 模型给的四条。 */
  ai: Record<string, AiIntent>
  /** taskId → 人改过的。 */
  overrides: Record<string, Override>
  /** 这几个任务正在问模型。 */
  running: readonly string[]
  /** 上一次失败。成功一次就清掉。 */
  error: EnrichError | null
  /** 上一次归纳是什么时候给的（用来在界面上写「几分钟前归纳的」）。 */
  at: Record<string, number>
  /** 能用的模型路由，`provider/model`。null = 这个部署问不出来。 */
  model: string | null
  setModel: (next: string) => void
  /**
   * 问模型。`force` 会无视缓存重问（用户点了「重新归纳」）。
   * `transcript` 是这次执行的会话内容，有的话一并喂给模型 —— 它是判断「这个任务
   * 到底要干什么」最直接的证据，比标题和说明都准。
   */
  run: (tasks: readonly TaskRecord[], options?: { force?: boolean; transcript?: string }) => Promise<void>
  /**
   * 自动归纳：没归纳过、也没人改过的那些，问一次。
   * 只在有模型路由时动手，而且同一个任务在一次页面生命周期里只问一次。
   */
  auto: (tasks: readonly TaskRecord[], transcript?: string) => void
  /** 存一次人工改动。传空对象等于删掉这条改动。 */
  save: (taskId: string, override: Override) => Promise<void>
  /** 人工改动存不下的原因（例如宿主路由不在）。 */
  saveError: string | null
}

export function useEnrichment(ctx: any): Enrichment {
  const [ai, setAi] = useState<Record<string, AiIntent>>({})
  const [overrides, setOverrides] = useState<Record<string, Override>>({})
  const [at, setAt] = useState<Record<string, number>>({})
  const [running, setRunning] = useState<string[]>([])
  const [error, setError] = useState<EnrichError | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [model, setModelState] = useState<string | null>(() => readStoredModel())
  /** 已经问过模型的任务（这一轮页面生命周期里）。防止反复自动调用。 */
  const asked = useRef(new Set<string>())

  // 人工改动存在宿主那边，进页面先拉一次
  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const response = await fetch(OVERRIDES_URL, { headers: { accept: 'application/json' } })
        const body = await response.json()
        if (!alive || body?.ok !== true) return
        setOverrides(typeof body.overrides === 'object' && body.overrides !== null ? body.overrides : {})
      } catch {
        // 宿主路由不在（老版本、或者跑在别的外壳里）时，人工改动这一层整个没有。
        // 不报错 —— 其余两层照常工作。
      }
    })()
    return () => { alive = false }
  }, [])

  // 模型路由：先看用户挑过的，再看任务自己绑的，最后问一遍宿主的模型目录
  useEffect(() => {
    if (model !== null) return
    let alive = true
    void (async () => {
      const found = await discoverModel(ctx)
      if (alive && found !== null) setModelState(found)
    })()
    return () => { alive = false }
  }, [ctx, model])

  const setModel = useCallback((next: string) => {
    setModelState(next)
    try {
      window.localStorage.setItem(MODEL_KEY, next)
    } catch {
      // 存不下就只在这一次会话里有效
    }
  }, [])

  const run = useCallback(async (tasks: readonly TaskRecord[], options?: { force?: boolean; transcript?: string }) => {
    if (tasks.length === 0) return
    const ids = tasks.map(task => task.id)
    setRunning(ids)
    setError(null)
    try {
      const response = await fetch(ENRICH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          // 模型路由：谁绑了用自己的，没绑用页面上选中的那个
          model: tasks.find(task => typeof task.model === 'string' && task.model.length > 0)?.model ?? model ?? undefined,
          force: options?.force === true,
          tasks: tasks.map((task, index) => toMaterial(task, index === 0 ? options?.transcript : undefined)),
        }),
      })
      // 宿主路由压根不在（插件装成了只有浏览器半体的样子、或者版本对不上）时，
      // 报的是「这条路由没通」，不是「模型出错」—— 后者会让人去查模型，
      // 而问题根本不在模型上。
      if (!response.ok) {
        setError({ reason: 'offline', detail: `归纳路由没通（HTTP ${response.status}）——宿主半体可能没装上` })
        return
      }
      const body = await response.json()
      if (body?.ok !== true) {
        setError({ reason: body?.reason ?? 'model-error', detail: String(body?.detail ?? '归纳失败') })
        return
      }
      const nextAi: Record<string, AiIntent> = {}
      const nextAt: Record<string, number> = {}
      for (const [id, entry] of Object.entries(body.results as Record<string, { ai: AiIntent; at?: number }>)) {
        if (entry.ai !== undefined && Object.keys(entry.ai).length > 0) {
          nextAi[id] = entry.ai
          nextAt[id] = entry.at ?? Date.now()
        }
      }
      setAi(current => ({ ...current, ...nextAi }))
      setAt(current => ({ ...current, ...nextAt }))
      if (Object.keys(nextAi).length === 0) {
        setError({ reason: 'model-error', detail: '模型回了话，但四条一条都没解析出来' })
      }
    } catch (cause) {
      setError({ reason: 'offline', detail: cause instanceof Error ? cause.message : String(cause) })
    } finally {
      setRunning([])
    }
  }, [model])

  const save = useCallback(async (taskId: string, override: Override) => {
    setOverrides(current => {
      const next = { ...current }
      if (Object.keys(override).length === 0) delete next[taskId]
      else next[taskId] = override
      return next
    })
    try {
      const response = await fetch(OVERRIDES_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskId, override }),
      })
      const body = await response.json()
      setSaveError(body?.ok === true ? null : String(body?.detail ?? '存不下'))
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  /**
   * 自动归纳：**只在有模型路由、而且这个任务一条都没有的时候**跑一次。
   *
   * 为什么自动：用户不会为了看四个字段专门去点按钮，而空着的字段等于没有这个功能。
   * 为什么只跑一次：模型的调用要花钱，反复自动调用是那种用户第二天才发现账单的事。
   * 手动重来永远有 —— 抽屉里那个「重新归纳」。
   */
  const auto = useCallback((tasks: readonly TaskRecord[], transcript?: string) => {
    if (model === null) return
    const fresh = tasks.filter(task => !asked.current.has(task.id) && ai[task.id] === undefined && overrides[task.id] === undefined)
    if (fresh.length === 0) return
    for (const task of fresh) asked.current.add(task.id)
    void run(fresh, { transcript })
  }, [ai, model, overrides, run])

  return useMemo(
    () => ({ ai, overrides, running, error, at, model, setModel, run, save, saveError, auto }),
    [ai, overrides, running, error, at, model, setModel, run, save, saveError, auto],
  )
}

/**
 * 问宿主要一个能用的模型路由。
 *
 * 两条路，都是看板自己在用的那两条（`remote.session.modelCatalog()` 和
 * `connection.api.llm.discoverModels()`）—— 谁先答上用谁。
 * 都答不上就返回 null，界面上写清楚「没找到模型」，而不是让那个按钮点了没反应。
 */
async function discoverModel(ctx: any): Promise<string | null> {
  const qualify = (provider: unknown, id: unknown): string | null =>
    typeof id === 'string' && id.length > 0
      ? typeof provider === 'string' && provider.length > 0 ? `${provider}/${id}` : id
      : null

  try {
    const remote = ctx?.get?.('remote')
    const catalog = await remote?.session?.modelCatalog?.()
    const groups = catalog?.ok === true ? catalog.value?.groups : undefined
    if (Array.isArray(groups)) {
      for (const group of groups) {
        const first = Array.isArray(group?.models) ? group.models[0] : undefined
        const route = qualify(group?.id ?? group?.provider, first?.id)
        if (route !== null) return route
      }
    }
  } catch {
    // 这条路不在场，试下一条
  }

  try {
    const connection = ctx?.get?.('connection')
    const discovered = await connection?.api?.llm?.discoverModels?.()
    const models = discovered?.result?.value?.models
    if (Array.isArray(models) && models.length > 0) {
      const route = qualify(models[0]?.provider, models[0]?.id)
      if (route !== null) return route
    }
  } catch {
    // 两条都不通
  }
  return null
}

function readStoredModel(): string | null {
  try {
    const value = window.localStorage.getItem(MODEL_KEY)
    return value !== null && value.length > 0 ? value : null
  } catch {
    return null
  }
}

/**
 * 一张卡 → 给模型的素材。
 *
 * **只发账本里真有的东西**：标题、说明、执行提示、状态、定时规则、执行结果、
 * 标签。会话 id 一类的东西不发 —— 模型看不见会话，发过去只会让它以为自己
 * 该知道里面写了什么。
 */
function toMaterial(task: TaskRecord, transcript?: string): unknown {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    prompt: task.prompt,
    status: task.status,
    schedule: task.schedule === undefined ? undefined : { enabled: task.schedule.enabled, cron: task.schedule.cron },
    tags: (task.tags ?? []).map(tag => tag.name),
    runs: task.executions.slice(-8).map(execution => ({
      result: execution.endedAt === undefined ? 'running' : execution.result ?? 'settled',
      error: execution.error,
      minutes: execution.endedAt === undefined ? null : Math.round((execution.endedAt - execution.startedAt) / 60000),
    })),
    // 会话内容**最有说服力，也最容易被误用**：它是任务真跑起来之后说的话，
    // 但里面混着大量过程细节（读了哪个文件、报了什么错）。所以它是补充，
    // 提示词里明说了「标题和说明优先」。
    transcript,
  }
}
