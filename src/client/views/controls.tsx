/**
 * 几个反复出现的小控件：自绘下拉、列内搜索框、迷你图标按钮、开关。
 *
 * 抽出来的理由不是省代码，是**尺寸必须一致**：原型里这些控件全是 24px 高、11px 字、
 * 6px 圆角，散在三个视图里各写一遍，调一处就会有一处漏掉，一列里两个控件差 2px
 * 肉眼看得出来。
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Field, FieldSource } from '../derive'
import { hueOf } from '../tokens'

export interface Option {
  value: string
  label: string
  /** 有值时前面画一个色点（工作区选择器用）。 */
  hue?: number
  /** 选中项右边那个勾。 */
  hint?: string
}

interface DropdownProps {
  value: string
  options: readonly Option[]
  onChange: (next: string) => void
  ariaLabel: string
  /** 迷你档：列筛选那种 24px 高的。 */
  mini?: boolean
  className?: string
  title?: string
}

export function Dropdown({ value, options, onChange, ariaLabel, mini = false, className = '', title }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  // 点外面关掉。原型里也是这套。
  useEffect(() => {
    if (!open) return
    const away = (event: MouseEvent): void => {
      if (root.current !== null && !root.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [open])

  const selected = options.find(option => option.value === value) ?? options[0]

  return (
    <div className={`dd ${mini ? 'dd-mini' : ''} ${className}`} ref={root}>
      <button
        type="button"
        className={`dd-btn ${mini ? '' : 'btn btn-secondary'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={title}
        onClick={() => setOpen(current => !current)}
      >
        {selected?.hue !== undefined ? (
          <span className="wdot" style={{ ['--hue' as string]: String(selected.hue) }} aria-hidden="true" />
        ) : null}
        <span className="lab">{selected?.label ?? '—'}</span>
      </button>
      {open ? (
        <div className="dd-pop" role="listbox" aria-label={ariaLabel}>
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              role="option"
              className="dd-opt"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              {option.hue !== undefined ? (
                <span className="wdot" style={{ ['--hue' as string]: String(option.hue) }} aria-hidden="true" />
              ) : null}
              <span>{option.label}</span>
              <span className="tick" aria-hidden="true">✓</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** 迷你图标按钮（放大镜那种）。`on` 时点亮成主色 —— 筛过之后一眼看得出来。 */
export function IconMini({
  on = false,
  label,
  title,
  onClick,
  children,
}: {
  on?: boolean
  label: string
  title?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className={`icon-mini${on ? ' on' : ''}`} aria-label={label} title={title} onClick={onClick}>
      {children}
    </button>
  )
}

export function IconMag() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="7" cy="7" r="4.2" />
      <path d="M10.2 10.2 14 14" />
    </svg>
  )
}

export function IconClock({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" fill="currentColor" />
      <path d="M8 4.4V8l2.4 1.6" stroke="var(--bg-layer-2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.4V8l2.4 1.6" />
    </svg>
  )
}

/** 列内搜索框：展开时整行让给它。 */
export function MiniSearch({
  value,
  placeholder,
  ariaLabel,
  onChange,
  onClose,
}: {
  value: string
  placeholder: string
  ariaLabel: string
  onChange: (next: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className={`search search-mini${value.length > 0 ? ' on' : ''}`}>
      <IconMag />
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={event => onChange(event.target.value)}
      />
      <button type="button" className="sx" aria-label="收起搜索" onClick={onClose}>
        ✕
      </button>
    </div>
  )
}

/** 复选式开关（甘特那两个）。 */
export function Toggle({
  checked,
  label,
  title,
  onChange,
}: {
  checked: boolean
  label: string
  title?: string
  onChange: (next: boolean) => void
}) {
  return (
    <label className="switch" title={title}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span className="track" aria-hidden="true" />
      <span className="txt">{label}</span>
    </label>
  )
}

/**
 * 「一条任务都没有」那句话得看数据是从哪来的。
 *
 * 读的是账本快照时，屏幕上根本没有「任务看板」这个东西（多半是没装、或者没加载），
 * 这时候让用户「去任务看板里建一张卡」等于让人去一个不存在的地方。
 */
export function emptyTaskCopy(kind: 'board' | 'ledger' | 'unavailable'): { title: string; body: string } {
  return kind === 'board'
    ? { title: '还没有任务', body: '在任务看板里建一张卡，这里就有了。' }
    : { title: '账本里一条任务都没有', body: '这个视图读的是账本快照本身；账本是空的，就没有可画的。' }
}

/**
 * 「这个值是从哪来的」。
 *
 * 这一小块是整个推导层能不能被信任的关键：同一个位置上，一句从账本算出来的话
 * 和一句模型编出来的话，用户必须**一眼**分得清。分不清的话，他要么全信
 * （于是被模型带偏），要么全不信（于是这个功能白做）。
 */
export function SourceTag({ source, why }: { source: FieldSource; why: string }) {
  const meta: Record<FieldSource, { text: string; cls: string }> = {
    raw: { text: '账本原文', cls: 'tag-raw' },
    derived: { text: '按账本推的', cls: 'tag-derived' },
    ai: { text: '模型归纳', cls: 'tag-ai' },
    edited: { text: '你改的', cls: 'tag-edited' },
  }
  const item = meta[source]
  return (
    <span className={`src-tag ${item.cls}`} title={why}>
      {item.text}
    </span>
  )
}

/**
 * 一条「标签 + 值 + 出处」。
 *
 * 双形态：平时是只读的一段话，点「改」变成 textarea，存下去就成了 `edited`，
 * 从此模型再也盖不掉它。**改不了的值不值得显示** —— 用户看着一个模型写的、
 * 明显不对的「目标」，唯一能做的就是不再打开这个页面。
 */
export function FieldBlock({
  label,
  field,
  hint,
  onSave,
}: {
  label: string
  field: Field
  hint?: string
  onSave?: (next: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(field.value)

  // 外部换了值（模型重跑完、或者换了任务）时把草稿跟上——不然点开编辑框
  // 看到的是上一张卡的原文
  useEffect(() => {
    if (!editing) setDraft(field.value)
  }, [field.value, editing])

  const commit = (): void => {
    setEditing(false)
    if (draft.trim() !== field.value.trim()) onSave?.(draft.trim())
  }

  return (
    <div className="fblock">
      <div className="fb-head">
        <span className="k">{label}</span>
        <SourceTag source={field.source} why={field.why} />
        {hint !== undefined ? <span className="fb-hint">{hint}</span> : null}
        {onSave !== undefined && !editing ? (
          <button type="button" className="fb-edit" onClick={() => setEditing(true)}>改</button>
        ) : null}
      </div>
      {editing ? (
        <div className="fb-edit-area">
          <textarea
            value={draft}
            autoFocus
            rows={Math.min(6, Math.max(2, Math.ceil(draft.length / 48)))}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') { setDraft(field.value); setEditing(false) }
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) commit()
            }}
          />
          <div className="fb-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setDraft(field.value); setEditing(false) }}>取消</button>
            <button type="button" className="btn btn-primary" onClick={commit}>存下</button>
            {field.source === 'edited' ? (
              <button type="button" className="btn btn-secondary" onClick={() => { setDraft(''); onSave?.('') }}>
                恢复成推的
              </button>
            ) : null}
          </div>
        </div>
      ) : field.missing === true && field.value.length === 0 ? (
        <p className="fb-missing">账本里没有能推的素材。{onSave !== undefined ? '可以直接写一条。' : ''}</p>
      ) : (
        <p className={`fb-value${field.missing === true ? ' thin' : ''}`}>{field.value}</p>
      )}
    </div>
  )
}

/** 空态。看板 / 甘特 / 进度共用同一套文案规则。 */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="empty">
      <svg className="ico" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M3 9h18M9 9v11" />
      </svg>
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel !== undefined && onAction !== undefined ? (
        <button type="button" className="btn btn-secondary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

/**
 * 五个常用的 cron 写法。**预设只是常用写法，不是全部** —— 认不出的一律留给手填，
 * 界面上从来不假装只有这五种。
 *
 * 放在这里而不是抽屉里：新建表单和抽屉各要一份，抄两遍迟早会不一样。
 */
export const CRON_PRESETS: ReadonlyArray<{ label: string; cron: string }> = [
  { label: '每小时', cron: '0 * * * *' },
  { label: '每天 9 点', cron: '0 9 * * *' },
  { label: '每周一 9 点', cron: '0 9 * * 1' },
  { label: '每月 1 号 9 点', cron: '0 9 1 * *' },
  { label: '每 15 分钟', cron: '*/15 * * * *' },
]
