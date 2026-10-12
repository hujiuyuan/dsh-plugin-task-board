/**
 * 让模型读一张任务卡、把「目标 / 场景 / 背景 / 验收」四条归纳出来。
 *
 * ## 为什么在宿主这半边
 *
 * 浏览器半体**不直接跟模型说话**（这是宿主定的规矩，看板自己的 `host-ai.ts`
 * 也是这么写的）。浏览器把素材 POST 上来，这边调一次宿主注入的 `llm` 服务，
 * 把结果原样送回去。
 *
 * ## 三件必须做对的事
 *
 * 1. **模型的回复是不可信文本。** 可能带代码围栏、带前言、带解释、干脆是坏的。
 *    所以解析是防御性的：剥围栏 → 取第一个 JSON 对象 → 字段逐个校验类型。
 *    解析不出来**不是错误**：照样回一个空的 `ai`，前端退回规则推导那一层。
 * 2. **一次调用只问一次。** 提示词写死成严格的 JSON 契约，不要多轮、不要工具。
 * 3. **超时和取消都要有。** 模型卡住不能把浏览器的连接吊在那里。
 *
 * ## 最重要的一条
 *
 * **提示词里明确禁止它编造账本里没有的事实。** 模型的活儿是「把已经写在
 * prompt 和说明里的东西整理成人话」，不是「替用户想一个目标出来」——
 * 后者产出的东西看起来很像那么回事，但和这个任务真实要干的事没有关系，
 * 而用户没有任何办法分辨。所以提示词里给了它全部可用的素材，
 * 并且明说：素材不够就留空，留空比瞎填好。
 */

/** 一次归纳允许跑多久。跟看板自己的解析一致。 */
export const ENRICH_TIMEOUT_MS = 45_000

/** 素材最长多少字符。超了截断——一张卡的 prompt 不该有几千字。 */
export const MAX_MATERIAL_CHARS = 6000

/** 归纳失败的原因。前端按这个决定说什么话。 */
export type EnrichFailure = 'no-model' | 'model-error' | 'timeout'

export class EnrichError extends Error {
  readonly reason: EnrichFailure
  constructor(reason: EnrichFailure, message: string) {
    super(message)
    this.reason = reason
    this.name = 'EnrichError'
  }
}

/** 模型归纳出来的四条。**全是可选的**：少一条不算失败，那一格退回规则推导。 */
export interface AiIntent {
  goal?: string
  scenario?: string
  background?: string
  acceptance?: string[]
  confidence?: 'low' | 'medium' | 'high'
}

/**
 * 提示词。写死的部分：
 *   - 只输出一个 JSON 对象，别的什么都不要
 *   - 四个键的名字和含义
 *   - **素材里没有的就留空**（这是整条设计的命门）
 *   - 用素材本身的语言回答（用户用中文写任务，答案就该是中文）
 */
export const SYSTEM_PROMPT = [
  '你在给一个任务看板上的卡片补写四个字段。',
  '',
  '你会收到一张卡的真实素材：标题、说明、执行提示、状态、定时规则、历次执行的结果。',
  '你**只能**用这些素材里的信息。这是硬规矩：',
  '- 素材里没有的事实，一个字都不许编。不要推测这个任务「大概是为了什么」。',
  '- 哪一条素材不够，就把对应的键留空字符串或空数组。**留空比瞎填好得多。**',
  '- 不要复述素材原文，要把它整理成一句人能直接读懂的话。',
  '',
  '只回一个 JSON 对象，别的什么都不要，键固定是这四个：',
  '{"goal": string, "scenario": string, "background": string, "acceptance": string[], "confidence": "low"|"medium"|"high"}',
  '',
  '- goal：这张卡要达成什么。一句话，最多 40 字。素材不够就留空。',
  '- scenario：什么时候会用到它 / 什么时候跑。一句话，最多 40 字。有定时规则就照着说。',
  '- background：这件事的来龙去脉。一到两句话，最多 80 字。只写素材里有的。',
  '- acceptance：怎么算做完了。**只从素材里的执行结果反推**，最多 3 条。',
  '  例如素材说跑成功过 3 次，就写「已有 3 次执行跑成功」。',
  '  素材里一次都没跑过就留空数组——不要编「应该通过测试」这种话。',
  '- confidence：你对上面内容的把握。素材少就给 low。',
  '',
  '用素材本身的语言回答（素材是中文就用中文）。',
].join('\n')

/** 一张卡攒给模型的素材。 */
export interface Material {
  id: string
  title: string
  description: string
  prompt: string
  status: string
  schedule?: { enabled: boolean; cron: string }
  runs: Array<{ result: string; error?: string; minutes: number | null }>
  tags?: string[]
}

/**
 * 把素材拼成一段话。
 *
 * 为什么用带标签的纯文本而不是 JSON：模型对「字段名：值」这种格式的跟随
 * 比嵌套 JSON 稳定得多，而且素材是给人写的东西（prompt / error 原文）里
 * 本来就常有引号和大括号，塞进 JSON 还得转义，转义错了模型看到的就是乱码。
 */
export function renderMaterial(material: Material): string {
  const lines = [
    `标题：${material.title}`,
    `状态：${material.status}`,
  ]
  if (material.description.trim().length > 0) lines.push(`说明：${material.description.trim()}`)
  if (material.prompt.trim().length > 0) lines.push(`执行提示：${material.prompt.trim()}`)
  if (material.tags !== undefined && material.tags.length > 0) lines.push(`标签：${material.tags.join('、')}`)

  if (material.schedule !== undefined) {
    lines.push(`定时规则：${material.schedule.cron}（${material.schedule.enabled ? '已启用' : '未启用'}）`)
  }

  if (material.runs.length === 0) {
    lines.push('执行记录：一次都没有跑过')
  } else {
    lines.push(`执行记录：共 ${material.runs.length} 次`)
    // 只带最近 5 次。再往前的对「这个任务是什么」没有增量，只会把上下文撑长
    for (const run of material.runs.slice(-5)) {
      const took = run.minutes === null ? '还没结束' : `耗时 ${run.minutes} 分钟`
      lines.push(`  - ${run.result}，${took}${run.error === undefined ? '' : `，报错：${run.error}`}`)
    }
  }

  const text = lines.join('\n')
  return text.length > MAX_MATERIAL_CHARS ? `${text.slice(0, MAX_MATERIAL_CHARS)}\n…（截断）` : text
}

/**
 * 把模型的回复解析成四条。
 *
 * 防御顺序：剥代码围栏 → 找第一个平衡的 `{}` → JSON.parse → 逐个字段查类型。
 * 任何一步失败都返回空对象（不是抛错）——调用方会把空对象当成
 * 「模型没给出有用的东西」，退回规则推导那一层继续工作。
 */
export function parseReply(reply: string): AiIntent {
  const text = reply.replace(/```(?:json)?/gi, '').trim()

  const start = text.indexOf('{')
  if (start < 0) return {}
  let depth = 0
  let end = -1
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i += 1) {
    const char = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) { end = i; break }
    }
  }
  if (end < 0) return {}

  let parsed: unknown
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    return {}
  }
  if (typeof parsed !== 'object' || parsed === null) return {}

  const raw = parsed as Record<string, unknown>
  const out: AiIntent = {}
  const line = (value: unknown, limit: number): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, limit) : undefined

  out.goal = line(raw.goal, 120)
  out.scenario = line(raw.scenario, 120)
  out.background = line(raw.background, 240)
  if (Array.isArray(raw.acceptance)) {
    const items = raw.acceptance
      .map(item => line(item, 120))
      .filter((item): item is string => item !== undefined)
      .slice(0, 4)
    if (items.length > 0) out.acceptance = items
  }
  if (raw.confidence === 'low' || raw.confidence === 'medium' || raw.confidence === 'high') {
    out.confidence = raw.confidence
  }
  return out
}

/** 我们真正用到的那一小块 `llm` 服务。 */
export interface LlmFace {
  stream(options: {
    provider: string
    model: string
    system?: string
    messages: unknown[]
    signal?: AbortSignal
  }): AsyncIterable<{ type?: string; text?: string }>
}

/**
 * 调一次模型，拿回四条。
 *
 * @param llm - 宿主的 llm 服务。
 * @param route - `provider` 和 `model`，两个都不能省（服务按 provider 找适配器）。
 * @param material - 已经拼好的素材文本。
 * @param signal - 调用方的取消（浏览器断开），和内部超时合并。
 */
export async function enrichOnce(
  llm: LlmFace,
  route: { provider: string; model: string },
  material: string,
  signal?: AbortSignal,
): Promise<AiIntent> {
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), ENRICH_TIMEOUT_MS)
  const relay = (): void => timeout.abort()
  signal?.addEventListener('abort', relay, { once: true })

  try {
    const stream = llm.stream({
      provider: route.provider,
      model: route.model,
      system: SYSTEM_PROMPT,
      // 消息按宿主 llm 的形状手搭。这里**没有** import `createUserMessage` 是故意的：
      // 那个包只在宿主进程里存在，为了一个构造函数把整个包加进依赖，
      // 会让本地装不上、tsconfig 永远飘红。形状对不上时下面的 catch 会把
      // 真实报错原样带到界面上，不会静默失败。
      messages: [{
        id: `enrich-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: 'user',
        source: { kind: 'user' },
        content: [{ type: 'text', text: material }],
      }],
      signal: timeout.signal,
    })

    let reply = ''
    for await (const chunk of stream) {
      if (chunk?.type === 'text-delta' && typeof chunk.text === 'string') reply += chunk.text
    }
    return parseReply(reply)
  } catch (error) {
    if (timeout.signal.aborted && signal?.aborted !== true) {
      throw new EnrichError('timeout', `模型 ${ENRICH_TIMEOUT_MS / 1000} 秒没回话`)
    }
    throw new EnrichError('model-error', error instanceof Error ? error.message : String(error))
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', relay)
  }
}

/**
 * 把 `provider/model` 拆开。看板自己也是这么拆的（`splitModelRoute`），
 * 所以两边对同一个字符串的理解一致。
 */
export function splitRoute(qualified: string | undefined): { provider: string; model: string } | undefined {
  if (qualified === undefined || qualified.trim().length === 0) return undefined
  const text = qualified.trim()
  const cut = text.indexOf('/')
  if (cut <= 0 || cut === text.length - 1) return undefined
  return { provider: text.slice(0, cut), model: text.slice(cut + 1) }
}
