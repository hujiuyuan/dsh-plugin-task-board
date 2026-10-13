/**
 * 新建 / 编辑任务。
 *
 * ## 这个模态框为什么比原型小得多
 *
 * 原型那个表单有六个分节、二十来个字段（优先级、周期标记、目标 / 场景 / 背景 /
 * 验收、编排模板和模板参数……）。真实账本能收的就这几个：
 * **标题、说明、执行提示、工作区、父任务**（`TaskBoardTaskDraft`），
 * 加上「开在哪一列」和**排期**（排期是建完之后补第二次调用，见下）。
 *
 * 剩下那些硬塞进去只有两种下场：要么写不进去（看板直接拒绝），
 * 要么我们自己在本地存一份，然后账本和界面对不上。两种都比字段少更糟。
 * 所以这里就这五个，**每一个都能真的落盘**。
 *
 * ## 编辑走的是两条不同的路
 *
 * 内容和状态在看板那边是两套闸，所以这里也是两个动作：
 *   - 标题 / 说明 / 执行提示 → `patchContent`。**跑过的卡改不了内容**
 *     （看板自己的规矩，原话：a task that has started executing keeps its
 *     recorded title/description/prompt），拒绝时把它的话原样显示出来。
 *   - 列 → `setStatus`。有运行锁，跑着的卡移不动。
 *
 * 合在一个「保存」按钮里，但发两个请求，各自报各自的错。
 *
 * ## 排期为什么是「建完再排」
 *
 * 看板的新建接口（`TaskBoardTaskDraft`）只收标题、说明、执行提示、列、工作区、
 * 父任务这几个字段，**排期不在里面** —— 加规则的动作只存在于它自己的 action 通道
 * 上（见 `write.ts` 顶上那段）。所以新建时排期是**两次调用**：先建卡拿到 id，
 * 再拿这个 id 去排期。
 *
 * 两次调用就有「第一次成了、第二次没成」的中间态，这里**不藏它**：
 * 卡是真建出来了，那就照实说卡建好了、排期没排上、为什么，并且照样把它打开 ——
 * 卡在手里，去抽屉里再排一次就行。假装整个都失败了会让人以为卡没建出来，
 * 于是再建一张，留下一张谁也不认识的孤儿卡。
 */
import { useEffect, useMemo, useState } from 'react'
import { STATUS, STATUS_ORDER } from '../tokens'
import type { TaskIndex } from '../model'
import { humanCron } from '../model'
import type { TaskRecord, TaskStatus } from '../types'
import type { WorkspaceIndex } from '../workspaces'
import type { BoardWrite, SchedulePatch } from '../write'
import { writeSchedule } from '../write'
import { CRON_PRESETS, Dropdown, type Option } from './controls'

/** 新建时能选的初始列。**不含「进行中」**——那一列是执行器划的，手工放进去没有意义。 */
const CREATE_COLUMNS: readonly TaskStatus[] = ['backlog', 'todo']

/** 打开排期开关时的第一份默认值。每天 9 点是排期里最常见的那一种。 */
const DEFAULT_CRON = '0 9 * * *'

/** 排期那条路走不通时的统一说法。路由探不到、或者控件被禁用，写的都是它。 */
const SCHEDULE_WHY = '排期要走任务看板自己的写入通道，但现在走不通 —— 卡照样建得出来，排期得去任务看板里设'

interface TaskFormProps {
  /** 有值＝编辑那张卡；没有＝新建。 */
  editing?: TaskRecord
  index: TaskIndex
  workspaces: WorkspaceIndex
  write: BoardWrite
  /** 排期那条通道通不通。跟 `write` 不是一回事，见 `write.ts`。 */
  canSchedule: boolean
  /** 新建时的默认归属：当前看板筛选的工作区、或父任务。 */
  defaultWorkspaceId?: string
  onClose: () => void
  /**
   * @param tone - `err` 是「做了一半」。新建带排期是两次调用，第二次失败时
   *   卡已经建出来了 —— 那是**没全成**，不能给一颗绿的提示条说「一切正常」。
   */
  onDone: (message: string, openId?: string, tone?: 'ok' | 'err') => void
}

export function TaskForm({ editing, index, workspaces, write, canSchedule, defaultWorkspaceId, onClose, onDone }: TaskFormProps) {
  const isEdit = editing !== undefined
  const [title, setTitle] = useState(editing?.title ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [prompt, setPrompt] = useState(editing?.prompt ?? '')
  const [workspaceId, setWorkspaceId] = useState(editing?.workspaceId ?? defaultWorkspaceId ?? '')
  const [parentId, setParentId] = useState(editing?.parentId ?? '')
  const [status, setStatus] = useState<TaskStatus>(editing?.status ?? 'todo')
  /**
   * 排期。**空字符串 = 不排期**，是这个字段唯一的「关」的写法。
   *
   * 用字符串而不是布尔加字符串：卡到一半的空输入框（用户正在敲）和「不要排期」
   * 必须是两回事，混起来会变成「打开开关之后不填表达式就建出一张不排期的卡」。
   */
  const [cron, setCron] = useState('')
  const [touched, setTouched] = useState(false)
  /**
   * 提交中。**不用 `write.busy` 代替** —— 那是 `useBoardWrite` 自己的状态，
   * 只覆盖它那一条路；新建带排期是两次调用，第二次它管不着。用作代替的话，
   * 第一次回来（busy 变 false）按钮就亮了，用户能在第二次还在飞的时候再点一次。
   */
  const [busy, setBusy] = useState(false)

  // Esc 关。和抽屉一致 —— 这一类浮层的默认期待
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const workspaceOptions: Option[] = useMemo(
    () => [
      { value: '', label: '不指定（跟着看板的继承规则走）' },
      ...workspaces.groups.filter(id => id !== '').map(id => ({ value: id, label: workspaces.nameOf(id) })),
    ],
    [workspaces],
  )

  /** 父任务候选：只能挂主任务（看板自己也只允许挂到主任务上）。 */
  const parentOptions: Option[] = useMemo(
    () => [
      { value: '', label: '不挂（这是一张主任务）' },
      ...index.roots
        .filter(task => task.id !== editing?.id)
        .map(task => ({ value: task.id, label: `${task.title} · ${task.id}` })),
    ],
    [index.roots, editing?.id],
  )

  const titleMissing = title.trim().length === 0
  // 标题是唯一硬性的：账本里 title 是必填，空标题会被看板直接拒绝。
  // 与其发过去等它报错，不如在本地就把按钮灰掉并说清为什么
  const blocked = titleMissing ? '标题不能为空' : null

  const submit = async (): Promise<void> => {
    setTouched(true)
    if (blocked !== null) return
    // 点了之后整段只跑一次。两次调用中间那次失败**不释放**锁 —— 松开的瞬间
    // 用户能再点一下，于是第二张卡也建出来了
    setBusy(true)
    try {
      await run()
    } finally {
      setBusy(false)
    }
  }

  const run = async (): Promise<void> => {
    if (isEdit) {
      // 内容变了才发；没变就不发——避免一次「打开又关掉」产生一条假的修改
      const contentChanged =
        title.trim() !== editing.title || description !== editing.description || prompt !== editing.prompt
      if (contentChanged) {
        const result = await write.send({
          op: 'patch',
          taskId: editing.id,
          patch: { title: title.trim(), description, prompt },
        })
        if (!result.ok) return
      }
      if (status !== editing.status) {
        const result = await write.send({ op: 'status', taskId: editing.id, status })
        if (!result.ok) return
      }
      onDone(contentChanged || status !== editing.status ? '改好了' : '什么都没改', editing.id)
      return
    }

    const result = await write.send({
      op: 'create',
      draft: {
        title: title.trim(),
        description,
        prompt,
        status,
        ...(workspaceId.length > 0 ? { workspaceId } : {}),
        ...(parentId.length > 0 ? { parentId } : {}),
      },
    })
    if (!result.ok) return

    const when = cron.trim()
    // 没排期，或者看板那边没有 id 回来（真出过：宿主半体只回了 ok）——
    // 第一种是正常路径，第二种**说清楚排期没排上**，不能当没这回事
    if (when.length === 0) {
      onDone(`建好了：${title.trim()}`, result.id)
      return
    }
    if (result.id === undefined) {
      onDone(
        `「${title.trim()}」建好了，但宿主没把它的 id 回来，排期没排上。去看板里找这张卡，在「任务目标」那一页排`,
        undefined,
        'err',
      )
      return
    }

    const scheduled = await writeSchedule(result.id, { enabled: true, mode: 'cron', cron: when })
    if (!scheduled.ok) {
      // 卡是真的建出来了。照实说，并且照样打开它 —— 假装整个失败会让人再建一张
      onDone(`「${title.trim()}」建好了，但排期没排上：${scheduled.error}`, result.id, 'err')
      return
    }
    onDone(`建好了：${title.trim()}（${humanCron(when)} 自动跑）`, result.id)
  }

  return (
    <>
      <div className="mmask open" onClick={onClose} aria-hidden="true" />
      <div className="modal open" role="dialog" aria-modal="true" aria-label={isEdit ? '编辑任务' : '新建任务'}>
        <div className="modal-head">
          <h2>
            {isEdit ? '编辑任务' : '新建任务'}
            {isEdit ? <span className="mono" style={{ color: 'var(--label-tertiary)', fontWeight: 400 }}> · {editing.id}</span> : null}
          </h2>
          <button type="button" className="btn btn-secondary" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className="modal-body">
          <p className="parse-note" style={{ marginTop: 0, marginBottom: 14 }}>
            {isEdit
              ? '内容和列是两回事：改内容走看板的内容闸（跑过的卡改不了），换列走状态闸（跑着的卡移不动）。哪个不行会说哪个。'
              : '这里只收账本真有的字段。原型里那张表单上的优先级 / 周期 / 验收标准账本里没有对应字段，硬填进去只会两边对不上。'}
          </p>

          <div className="fld">
            <span className="fl">标题<span className="req">*</span></span>
            <input
              type="text"
              value={title}
              autoFocus
              className={touched && titleMissing ? 'err' : undefined}
              placeholder="一句话说清这张卡要干什么"
              onChange={event => setTitle(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void submit() }}
            />
            {touched && titleMissing ? <span className="ro-reason" style={{ color: 'var(--state-error)' }}>标题不能为空</span> : null}
          </div>

          <div className="fld">
            <span className="fl">说明</span>
            <textarea
              rows={3}
              value={description}
              placeholder="背景、约束、为什么要做。可以不填。"
              onChange={event => setDescription(event.target.value)}
            />
          </div>

          <div className="fld">
            <span className="fl">执行提示</span>
            <textarea
              rows={3}
              value={prompt}
              placeholder="跑起来时真正发给 DSH 的那段话。留空的话，执行时拿到的是空提示。"
              onChange={event => setPrompt(event.target.value)}
            />
            {!isEdit && prompt.trim().length === 0 ? (
              <span className="ro-reason">
                留空了也建得出来，但卡片上会亮一个「缺目标」的小黄点 —— 那是提醒你它跑起来没话说。
              </span>
            ) : null}
          </div>

          <div className="fld-row">
            <div className="fld">
              <span className="fl">工作区</span>
              <Dropdown
                className="full"
                value={workspaceId}
                options={workspaceOptions}
                ariaLabel="工作区"
                onChange={setWorkspaceId}
              />
            </div>
            <div className="fld">
              <span className="fl">{isEdit ? '所在列' : '建在哪一列'}</span>
              <Dropdown
                className="full"
                value={status}
                options={(isEdit ? STATUS_ORDER : CREATE_COLUMNS).map(id => ({ value: id, label: STATUS[id].label }))}
                ariaLabel="所在列"
                onChange={next => setStatus(next as TaskStatus)}
              />
            </div>
          </div>

          {!isEdit ? (
            <div className="fld">
              <span className="fl">父任务</span>
              <Dropdown
                className="full"
                value={parentId}
                options={parentOptions}
                ariaLabel="父任务"
                onChange={setParentId}
              />
              <span className="ro-reason">挂在别的卡下面就成了它的子任务 —— 子任务不上看板，从那张家卡的「子任务」页进。</span>
            </div>
          ) : null}

          {!isEdit ? (
            <div className="fld">
              <span className="fl">排期</span>
              <div className="sched-new">
                <label
                  className={`switch${canSchedule ? '' : ' is-ro'}`}
                  title={canSchedule ? '到点自动跑；不勾就是一张要人手动开的卡' : SCHEDULE_WHY}
                >
                  <input
                    type="checkbox"
                    checked={cron.trim().length > 0}
                    disabled={!canSchedule || busy}
                    onChange={event => setCron(event.target.checked ? DEFAULT_CRON : '')}
                  />
                  <span className="track" aria-hidden="true" />
                  <span className="txt">{cron.trim().length > 0 ? '到点自动跑' : '不定时'}</span>
                </label>

                {cron.trim().length > 0 ? (
                  <>
                    <div className="sro-presets" style={{ marginTop: 8 }}>
                      {CRON_PRESETS.map(item => (
                        <button
                          key={item.cron}
                          type="button"
                          className={`btn btn-secondary${item.cron === cron.trim() ? ' on' : ''}`}
                          disabled={!canSchedule || busy}
                          title={canSchedule ? `改成「${item.label}」` : SCHEDULE_WHY}
                          aria-pressed={item.cron === cron.trim()}
                          onClick={() => setCron(item.cron)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="sched-cron-row">
                      <input
                        className="sro-cron"
                        value={cron}
                        disabled={!canSchedule || busy}
                        placeholder="分 时 日 月 周，例如 0 9 * * *"
                        title={canSchedule ? '五段 cron，按「分 时 日 月 周」的顺序写' : SCHEDULE_WHY}
                        aria-label="cron 表达式"
                        onChange={event => setCron(event.target.value)}
                      />
                      <span className="sro-human">{humanCron(cron.trim())}</span>
                    </div>
                  </>
                ) : null}
              </div>
              <span className="ro-reason">
                {canSchedule
                  ? '看板的新建接口不收排期，所以这是两步：先把卡建出来，再给它排上。第二步没成会照实说。'
                  : SCHEDULE_WHY}
              </span>
            </div>
          ) : null}

          {write.error !== null ? (
            <p className="fb-error" role="alert">看板拒绝了这次修改：{write.error}</p>
          ) : null}
        </div>

        <div className="modal-foot">
          {blocked !== null ? <span className="ro-reason">{blocked}</span> : null}
          <span className="spacer" />
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || blocked !== null}
            title={blocked ?? undefined}
            onClick={() => void submit()}
          >
            {busy ? '提交中…' : isEdit ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </>
  )
}
