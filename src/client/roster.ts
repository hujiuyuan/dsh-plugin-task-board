/**
 * 「这张卡可以用什么跑」—— 模式（Agent 预设）/ AI（模型）/ 权限，三份清单。
 *
 * ## 为什么这三样要看宿主，不能写死
 *
 * 前两样是**部署相关**的：模型清单取决于装了什么 provider、配了哪些 key；
 * Agent 预设是用户自己在设置里编的（`agentPresets.list`）。写死在插件里，
 * 换一台机器就是对不上的名字。只有权限那三档是账本里写死的枚举
 * （`TASK_PERMISSIONS`），所以它不出现在这个文件里 —— 在 `write.ts` 那边。
 *
 * ## 读法抄的是**看板自己**的那段
 *
 * 看板的新建表单也是这么读的（`client/index.ts` 里那个 `pushModelOptions`）：
 * 先 `remote.session.modelCatalog()`，空了再退到 `connection.api.llm.discoverModels()`，
 * 再退到 `connection.api.session.modelCatalog()`。三条都试过才算读不到。
 * 跟着它走而不是另发明一套，是因为**清单的形状是它定的**，我们只是少写一份映射。
 *
 * ## 读不到不是错
 *
 * 服务不在场（换了外壳组合、没配模型）时这三档**留空**，卡照建照跑 ——
 * 宿主那边会用它自己的默认。界面上写清楚「读不到，跟宿主默认走」，
 * 而不是给一个空的下拉让人以为插件坏了。
 */
import { useEffect, useState } from 'react'
import { PERMISSIONS, type ExecutionTargets } from './write'

export interface ModeOption {
  id: string
  /** 显示名。没给名字就用 id —— 认不出来总比认错强。 */
  name: string
  /** 这个预设为什么跑不起来（宿主自己给的），有它就别选。 */
  broken?: string
  /** 宿主标的默认预设。 */
  isDefault: boolean
}

export interface ModelOption {
  id: string
  name: string
  provider?: string
}

export interface ExecutionRoster {
  modes: readonly ModeOption[]
  models: readonly ModelOption[]
  permissions: typeof PERMISSIONS
  /** 模式 / 模型**各自的**读失败原因。分开报：一条通一条不通是常态。 */
  modesWhy: string | null
  modelsWhy: string | null
}

const EMPTY_ROSTER: ExecutionRoster = {
  modes: [],
  models: [],
  permissions: PERMISSIONS,
  modesWhy: null,
  modelsWhy: null,
}

/**
 * 读一批清单。**只读一次**（挂载时）——
 * 模型和预设是「设置里改的东西」，不是几秒一变的状态；面板开着的时候去改设置
 * 属于极端情况，为它挂个轮询不值得（真要改完了，重开一下面板就行）。
 */
export function useExecutionRoster(ctx: any): ExecutionRoster {
  const [roster, setRoster] = useState<ExecutionRoster>(EMPTY_ROSTER)

  useEffect(() => {
    let alive = true
    void (async () => {
      const [modes, models] = await Promise.all([readModes(ctx), readModels(ctx)])
      if (!alive) return
      setRoster({
        modes: modes.list,
        models: models.list,
        permissions: PERMISSIONS,
        modesWhy: modes.why,
        modelsWhy: models.why,
      })
    })()
    return () => { alive = false }
  }, [ctx])

  return roster
}

async function readModes(ctx: any): Promise<{ list: ModeOption[]; why: string | null }> {
  try {
    const remote = ctx?.get?.('remote')
    const response = await remote?.agentPresets?.list?.()
    if (response === undefined) return { list: [], why: '宿主这版没有 Agent 预设这个服务' }
    if (response.ok !== true) return { list: [], why: '宿主没能给出 Agent 预设清单' }
    const presets = response.value?.presets
    if (!Array.isArray(presets)) return { list: [], why: 'Agent 预设清单的形状不认识' }
    const list: ModeOption[] = []
    for (const preset of presets) {
      if (typeof preset?.id !== 'string' || preset.id.length === 0) continue
      list.push({
        id: preset.id,
        name: typeof preset.name === 'string' && preset.name.length > 0 ? preset.name : preset.id,
        ...(typeof preset.broken === 'string' && preset.broken.length > 0 ? { broken: preset.broken } : {}),
        isDefault: preset.isDefault === true,
      })
    }
    return { list, why: null }
  } catch (cause) {
    return { list: [], why: cause instanceof Error ? cause.message : String(cause) }
  }
}

async function readModels(ctx: any): Promise<{ list: ModelOption[]; why: string | null }> {
  // 一条路：远程命名空间（看板首选的就是它）
  try {
    const remote = ctx?.get?.('remote')
    const response = await remote?.session?.modelCatalog?.()
    const groups = response?.ok === true ? response.value?.groups : undefined
    const list = modelsOf(groups)
    if (list.length > 0) return { list, why: null }
  } catch {
    // 这条路不在场，试下一条
  }

  // 两条路：连接上的 llm / sessions（旧外壳组合把目录挂在这儿）
  try {
    const connection = ctx?.get?.('connection')
    const discovered = await connection?.api?.llm?.discoverModels?.()
    const raw = discovered?.result?.value?.models
    if (Array.isArray(raw)) {
      const list = raw
        .filter((m: any) => typeof m?.id === 'string' && m.id.length > 0)
        .map((m: any) => ({ id: m.id, name: typeof m.name === 'string' && m.name.length > 0 ? m.name : m.id }))
      if (list.length > 0) return { list, why: null }
    }
    const catalog = connection?.api?.session?.modelCatalog ?? connection?.api?.sessions?.modelCatalog
    if (typeof catalog === 'function') {
      const response = await catalog()
      const list = modelsOf(response?.result?.value?.groups)
      if (list.length > 0) return { list, why: null }
    }
  } catch {
    // 同上
  }

  return { list: [], why: '宿主没给出模型清单（可能没配 provider）' }
}

/**
 * 目录 → 选项。**id 要带 provider 前缀**（`provider/model`）—— 账本里存的
 * 就是这个形状，少一段的话跑起来会找不到模型。
 */
function modelsOf(groups: unknown): ModelOption[] {
  if (!Array.isArray(groups)) return []
  const out: ModelOption[] = []
  for (const group of groups) {
    const provider = typeof group?.id === 'string' ? group.id
      : typeof group?.provider === 'string' ? group.provider : undefined
    for (const model of Array.isArray(group?.models) ? group.models : []) {
      if (typeof model?.id !== 'string' || model.id.length === 0) continue
      out.push({
        id: provider === undefined || provider.length === 0 ? model.id : `${provider}/${model.id}`,
        name: typeof model.name === 'string' && model.name.length > 0 ? model.name : model.id,
        ...(provider === undefined ? {} : { provider }),
      })
    }
  }
  return out
}

/** 界面上一句话的默认档名字。三处下拉都用它，别各写各的。 */
export const FOLLOW_HOST_DEFAULT = '跟宿主默认走'

export type { ExecutionTargets }
