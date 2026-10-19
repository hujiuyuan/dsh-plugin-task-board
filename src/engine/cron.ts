/**
 * 5 段 cron（分 时 日 月 周）+ IANA 时区，算「下一次」。
 *
 * 为什么自己写不引库：宿主半体是单文件打包，规则又只有标准 Vixie 那一套，
 * 一百来行就够；引一个库换来的是体积和一个不受我们控制的方言。
 *
 * 认的写法：`*`、单值、`a-b`、`*\/n`、`a-b/n`、逗号列表。周 0 和 7 都是周日。
 * 日和周**都不是 `*`** 时按 Vixie 规矩取「任一匹配」，否则两个都要匹配。
 * 别的（`L` `W` `#`、英文名、`@daily`、6 段）一律拒绝，错误信息指出是哪一段。
 */

interface Field {
  values: Set<number>
  star: boolean
}

export interface CronSpec {
  minute: Field
  hour: Field
  day: Field
  month: Field
  weekday: Field
}

const RANGES: ReadonlyArray<[string, number, number]> = [
  ['分', 0, 59],
  ['时', 0, 23],
  ['日', 1, 31],
  ['月', 1, 12],
  ['周', 0, 7],
]

function parseField(raw: string, label: string, min: number, max: number): Field {
  const values = new Set<number>()
  for (const part of raw.split(',')) {
    if (part.length === 0) throw new Error(`cron 的「${label}」段有空项`)
    const [range, stepText] = part.split('/')
    const step = stepText === undefined ? 1 : Number(stepText)
    if (!Number.isInteger(step) || step < 1) throw new Error(`cron 的「${label}」段步长不对：${part}`)
    let from: number
    let to: number
    if (range === '*') {
      from = min
      to = max
    } else if (/^\d+-\d+$/.test(range)) {
      ;[from, to] = range.split('-').map(Number) as [number, number]
    } else if (/^\d+$/.test(range) && stepText === undefined) {
      from = to = Number(range)
    } else {
      throw new Error(`cron 的「${label}」段认不出：${part}`)
    }
    if (from < min || to > max || from > to) throw new Error(`cron 的「${label}」段超出范围 ${min}-${max}：${part}`)
    for (let value = from; value <= to; value += step) values.add(label === '周' && value === 7 ? 0 : value)
  }
  return { values, star: raw.startsWith('*') }
}

export function parseCron(expression: string): CronSpec {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) throw new Error(`cron 要 5 段（分 时 日 月 周），这里是 ${parts.length} 段`)
  const [minute, hour, day, month, weekday] = parts.map((part, index) => {
    const [label, min, max] = RANGES[index]!
    return parseField(part, label, min, max)
  }) as [Field, Field, Field, Field, Field]
  return { minute, hour, day, month, weekday }
}

/** 某个时区里这一刻的墙钟。 */
interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

const formatters = new Map<string, Intl.DateTimeFormat>()

function wallClock(ms: number, timeZone: string | undefined): WallClock {
  const key = timeZone ?? ''
  let format = formatters.get(key)
  if (format === undefined) {
    format = new Intl.DateTimeFormat('en-US', {
      ...(timeZone === undefined ? {} : { timeZone }),
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short',
    })
    formatters.set(key, format)
  }
  const parts: Record<string, string> = {}
  for (const part of format.formatToParts(ms)) parts[part.type] = part.value
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: weekdays.indexOf(parts.weekday ?? ''),
  }
}

/** 时区认不认得。认不出的不能存 —— 存了之后每次算下一次都会抛。 */
export function isTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

function dayMatches(spec: CronSpec, clock: WallClock): boolean {
  const byDay = spec.day.values.has(clock.day)
  const byWeekday = spec.weekday.values.has(clock.weekday)
  if (!spec.day.star && !spec.weekday.star) return byDay || byWeekday
  return byDay && byWeekday
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
/** 最多往后找一年零一天。2 月 30 号这种永远不来的规则在这里返回 undefined。 */
const HORIZON = 367 * 24 * HOUR

/**
 * 严格晚于 `fromMs` 的下一次触发时刻。
 *
 * 按分钟往前走，日或时不匹配时整段跳过，所以一般几十步就到。
 * 夏令时缺的那段墙钟自然跳过；重复的那段，同一分钟只会先碰到较早那次。
 */
export function nextRunAt(expression: string, fromMs: number, timeZone?: string): number | undefined {
  const spec = parseCron(expression)
  let at = Math.floor(fromMs / MINUTE) * MINUTE + MINUTE
  const end = fromMs + HORIZON
  while (at <= end) {
    const clock = wallClock(at, timeZone)
    if (!spec.month.values.has(clock.month) || !dayMatches(spec, clock)) {
      // 跳到这一天的下一个整点再看；墙钟和 UTC 差的不是整小时也没关系，下一圈会对齐
      at += HOUR - clock.minute * MINUTE
      continue
    }
    if (!spec.hour.values.has(clock.hour)) {
      at += HOUR - clock.minute * MINUTE
      continue
    }
    if (spec.minute.values.has(clock.minute)) return at
    at += MINUTE
  }
  return undefined
}
