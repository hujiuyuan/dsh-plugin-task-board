/**
 * 把原型的设计 CSS 移植成插件的样式表。
 *
 * 为什么不重写：原型那套尺寸是量出来的（卡片四行 20/17/17/17 + 行距 5、
 * 标题给斜带让 18px、甘特 44/220/21/30/34/18……），照着重新推一遍只会推歪。
 * 机械移植才能保证「长得一样」。
 *
 * 四件必须做的事：
 *   1. 每条选择器前面加 `.dsptb ` —— 原型用的是 `.card`/`.chip`/`.panel` 这类通用名，
 *      不隔离会漏出去改掉宿主自己的卡片和按钮。
 *   2. 干掉原型的令牌块和 html/body 规则，令牌换成指向宿主 `--dsw-*` 的别名。
 *   3. **主题信号换源**。原型靠 `:root[data-theme=light]` 打补丁，插件里没有这个属性；
 *      宿主用的是 `body[data-ds-dark-theme]`。所以把原来「深色是底、浅色是补丁」
 *      翻过来：浅色当底，深色挂 `body[data-ds-dark-theme]`。
 *   4. 给 @keyframes 改名 —— `pulse` 这种名字宿主八成也有，重名互相覆盖。
 */
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = '/Users/hujiuyuan/studyspace/dsh/prototype/index.html'
const css = readFileSync(SRC, 'utf8').split('\n').slice(7, 1943).join('\n')

const renamed = new Map()
const renameKeyframes = name => {
  if (!renamed.has(name)) renamed.set(name, `dsptb-${name}`)
  return renamed.get(name)
}

/** 找配对的大括号结尾。 */
function blockEnd(text, from) {
  let depth = 0
  let started = false
  for (let k = from; k < text.length; k += 1) {
    if (text[k] === '{') { depth += 1; started = true }
    else if (text[k] === '}') { depth -= 1; if (started && depth === 0) return k + 1 }
  }
  return text.length
}

/** 统一加前缀。`:root` / `html` / `body` 打头的返回 null（由别名令牌或主题块接管）。 */
function scope(selector) {
  return selector
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map(part => {
      if (part.startsWith(':root') || part === 'html' || part === 'body') return null
      if (part.startsWith('html ') || part.startsWith('body ')) return null
      return `.dsptb ${part}`
    })
    .filter(part => part !== null)
    .join(',')
}

// ── 先把原型的浅色补丁收集起来，键＝去掉 :root[...] 那截之后的选择器 ──────────
const lightPatches = new Map()
{
  const re = /:root\[data-theme="light"\]\s*([^{]+)\{([^}]*)\}/g
  let m
  while ((m = re.exec(css)) !== null) {
    lightPatches.set(m[1].trim(), m[2].trim())
  }
}

const stripped = css
  .replace(/\/\*[\s\S]*?\*\//g, '')            // 注释：移植后不再解释原型的决策
  .replace(/:root\[[^\]]*\]\s*\{[^}]*\}/g, '')  // 浅色令牌块 / 外壳规则
  .replace(/:root\s*\{[^}]*\}/g, '')            // 深色令牌块
  // **必须锚在行首**。不锚的话 `\bbody\s*\{` 会命中 `.col-body{`、`.drawer-body{`、
  // `.p-ws-body{` 的尾巴，把整条规则静默删掉（真踩过：一处少了三条规则，
  // 表现是「列内容没有内边距、没有滚动」这种看着像忘了写样式的样子）。
  .replace(/^html\s*,\s*body\s*\{[^}]*\}/gm, '')
  .replace(/^body\s*\{[^}]*\}/gm, '')
  .replace(/^\s*\n/gm, '\n')

// ── 逐条规则重新生成 ────────────────────────────────────────────────────
const rules = []
let cursor = 0
while (cursor < stripped.length) {
  const open = stripped.indexOf('{', cursor)
  if (open < 0) break
  const prelude = stripped.slice(cursor, open).trim()
  const end = blockEnd(stripped, open)
  const body = stripped.slice(open, end)

  if (prelude.startsWith('@')) {
    const kf = prelude.match(/^@(-webkit-)?keyframes\s+([\w-]+)$/)
    const at = prelude.match(/^@(media|supports|container)\s*(.*)$/)
    if (kf) {
      rules.push(`@keyframes ${renameKeyframes(kf[2])}${body}`)
    } else if (at) {
      const inner = body.slice(1, -1)
      const innerScoped = inner.replace(/(^|\})\s*([^@{}][^{}]*?)\s*\{/g, (whole, brace, sel) => {
        const scoped = scope(sel)
        return scoped.length === 0 ? brace : `${brace}${scoped}{`
      })
      rules.push(`@${at[1]} ${at[2]}{${innerScoped}}`)
    } else {
      rules.push(`${prelude}${body}`)
    }
  } else {
    const scoped = scope(prelude)
    if (scoped.length > 0) {
      // 原型里这条有浅色补丁吗？有的话：浅色当底，深色挂属性选择器
      const light = lightPatches.get(prelude)
      if (light !== undefined) {
        const darkBody = body.slice(1, -1).trim()
        rules.push(`.dsptb-主题占位`)
        rules.push(`__THEME__${scoped}{${darkBody}}`)
        rules.push(`__LIGHT__${scoped}{${light}}`)
      } else {
        rules.push(`${scoped}${body}`)
      }
    }
  }
  cursor = end
}

let final = rules
  .filter(rule => rule !== '.dsptb-主题占位')
  .map(rule => {
    if (rule.startsWith('__THEME__')) return `body[data-ds-dark-theme] ${rule.slice(9)}`
    if (rule.startsWith('__LIGHT__')) return rule.slice(9)
    return rule
  })
  .join('\n')

for (const [oldName, newName] of renamed) {
  final = final.replace(new RegExp(`(animation:\\s*[^;]*?)\\b${oldName}\\b`, 'g'), `$1${newName}`)
}

// 深色块的 `body[data-ds-dark-theme] ` 后面可能跟着 `@media` 里的东西，不该有
final = final.replace(/body\[data-ds-dark-theme\] @/g, '@')

writeFileSync('/tmp/dsptb-ref/ported.css', final)
console.log('规则条数:', rules.length - 1)
console.log('浅色补丁:', lightPatches.size, '→', [...lightPatches.keys()].join(' | ').slice(0, 200))
console.log('改名:', [...renamed.entries()].map(([a, b]) => `${a}→${b}`).join(', '))
console.log('字节:', final.length)

// ── 组装成最终的 styles.ts ──────────────────────────────────────────────
const ALIAS = `/* ═══════════════ 令牌别名 ═══════════════
   原型那套令牌名（--bg-layer-1 / --label-primary …）**全部保留**，只是在这里
   逐条改指向宿主的 --dsw-* 语义令牌。这么做的原因：
   ① 移植过来的那 700 条规则一个字都不用改；
   ② 深浅两套色自动跟着宿主走 —— 宿主把色板挂在 body 上，我们只读变量；
   ③ 一个色值都不自己定（宿主 ui-theme 的 README 把这条说死了）。
   后面跟的十六进制是「宿主样式表还没加载」那半秒的兜底，不是第二套配色。
   注意 --warn-* 三项：宿主没有对应的琥珀底/边令牌，用 color-mix 从
   --dsw-alias-state-warn-primary 现算，这样它也自动跟主题。 */
.dsptb{
  --bg-base:var(--dsw-alias-bg-base,#151517);
  --bg-layer-1:var(--dsw-alias-bg-layer-1,#232324);
  --bg-layer-2:var(--dsw-alias-bg-layer-2,#2c2c2e);
  --bg-layer-3:var(--dsw-alias-bg-layer-3,#353638);
  --label-primary:var(--dsw-alias-label-primary,#f9fafb);
  --label-secondary:var(--dsw-alias-label-secondary,#adb2b8);
  --label-tertiary:var(--dsw-alias-label-tertiary,#979da6);
  --border-l1:var(--dsw-alias-border-l1,#ffffff0f);
  --border-l2:var(--dsw-alias-border-l2,#ffffff1f);
  --border-l3:var(--dsw-alias-border-l3,#ffffff29);
  --border-l4:var(--dsw-alias-border-l4,#ffffff29);
  --interactive-bg-hover:var(--dsw-alias-interactive-bg-hover,#ffffff14);
  --input-major:var(--dsw-alias-fill-l1,#ffffff0f);
  --state-success:var(--dsw-alias-state-success-primary,#22c55e);
  --state-warn:var(--dsw-alias-state-warn-primary,#f59e0b);
  --state-error:var(--dsw-alias-state-error-primary,#ef4444);
  --business-primary:var(--dsw-alias-state-business-primary,#5686fe);
  --brand:var(--dsw-alias-brand-primary,#4176e6);
  --warn-bg:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 12%,transparent);
  --warn-border:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#f59e0b) 35%,transparent);
  --warn-fg:var(--dsw-alias-state-warn-label,#f5c26b);
  --shadow-card:var(--dsw-shadow-lv2,0 4px 14px #00000059);
  --shadow-pop:var(--dsw-shadow-lv3,0 12px 32px #00000073);
}
`

const HEADER = `/**
 * 本文件 /** 的主体是从原型 (\`prototype/index.html\`) 机械移植过来的，见
 * \`tools/port-css.mjs\`。手改请改那个脚本再生成，别直接改这里 ——
 * 直接改的话下次重新生成会把你改的覆盖掉。
 *
 * 移植时做了四件事：加 \`.dsptb \` 前缀隔离、令牌改指向宿主 \`--dsw-*\`、
 * 主题信号从原型的 \`data-theme\` 换成宿主的 \`body[data-ds-dark-theme]\`、
 * @keyframes 改名防撞。
 * 文件末尾的「本插件自己加的东西」一节是手写的。
 */
`

const TAIL = `
/* ═══════════════ 本插件自己加的东西 ═══════════════
   （这一段是手写的，不参与原型移植） */

/* 面板容器。**必须是 position:relative 而不是 absolute/inset:0** ——
   宿主的中央栏自己就是定位上下文，写成 absolute 而找不到定位祖先时，
   inset:0 会以视口为基准铺满整个窗口，把侧边栏和 macOS 左上角那三个窗口按钮
   一起盖住（真出过的事故）。宽高交给宿主那一列。 */
.dsptb{
  position:relative;display:flex;flex-direction:column;
  width:100%;height:100%;min-width:0;min-height:0;
  background:var(--bg-base);color:var(--label-primary);
  font-size:13px;line-height:1.5;overflow:hidden;
}

/* 顶栏左内边距跟着宿主的「前导留白」走：侧边栏展开时它是 0（算出来还是 16px，
   不多留缝隙），侧边栏收起来宿主把它设成 160px，这一条就自动让开那三个窗口按钮。 */
.dsptb .panel-head{padding-left:max(10px,calc(var(--dsh-frame-leading-clearance,0px) + 10px))}

/* 只读模式：写入路径整条没有，相关控件一律实心禁用，不做「点了才拒绝」 */
.dsptb .is-ro{cursor:not-allowed;opacity:.45}
.dsptb .ro-reason{font-size:12px;color:var(--label-tertiary);padding:2px 0 0}

/* 数据来源徽标（顶栏右端那颗灯）。原型里三态各有颜色，这里照搬。 */
.dsptb .src-badge .dot{width:7px;height:7px;border-radius:50%;flex:0 0 7px}
.dsptb .src-badge.live .dot{background:var(--state-success)}
.dsptb .src-badge.snapshot .dot{background:var(--state-warn)}
.dsptb .src-badge.stale{opacity:.75}

/* 工作区色点/斜带/标签徽章共用一套哈希取色，色相由字符串决定 */
.dsptb .wdot{background:hsl(var(--hue) 62% 60%)}

/* 卡片被选中（抽屉开着的那一张）。原型没有这个态——它点开卡就盖住了，
   我们这边抽屉是侧栏，卡片还露着，得让人知道看的是哪一张。 */
.dsptb .card.on{border-color:var(--business-primary)}

/* 会话 chip 那一格：原型里右边是编排片段，我们换成最近一次会话。
   它要能撑满剩余宽度并让 chip 贴右。 */
.dsptb .card-sub .chip-slot{margin-left:auto;min-width:0;justify-content:flex-end}

/* 排期小标（第四行右格） */
.dsptb .sched{display:inline-flex;align-items:center;gap:4px;color:var(--label-tertiary)}
.dsptb .card.is-running .sched{color:var(--state-warn)}

/* prompt 原文块 */
.dsptb .d-pre{
  margin:0;padding:10px 12px;border-radius:8px;background:var(--bg-base);
  border:1px solid var(--border-l1);font-size:12px;line-height:1.6;
  white-space:pre-wrap;word-break:break-word;max-height:280px;overflow:auto;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
`

/**
 * 把主题块里那些 `body[data-ds-dark-theme]` 选择器原样保留。
 * 注意：宿主是把属性挂在 body 上，而我们这一支也在 body 里面，所以能命中。
 */
writeFileSync(
  '/Users/hujiuyuan/studyspace/dsh/plugin/src/client/styles.ts',
  `${HEADER}\nexport const STYLE_ID = 'dsh-plugin-task-board-styles'\n\nexport const CSS = String.raw\`\n${ALIAS}\n${final}\n${TAIL}\`\n`,
)
console.log('已写入 styles.ts')
