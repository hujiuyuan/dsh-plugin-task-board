/**
 * 本文件 /** 的主体是从原型 (`prototype/index.html`) 机械移植过来的，见
 * `tools/port-css.mjs`。手改请改那个脚本再生成，别直接改这里 ——
 * 直接改的话下次重新生成会把你改的覆盖掉。
 *
 * 移植时做了四件事：加 `.dsptb ` 前缀隔离、令牌改指向宿主 `--dsw-*`、
 * 主题信号从原型的 `data-theme` 换成宿主的 `body[data-ds-dark-theme]`、
 * @keyframes 改名防撞。
 * 文件末尾的「本插件自己加的东西」一节是手写的。
 */

export const STYLE_ID = 'dsh-plugin-task-board-styles'

export const CSS = String.raw`
/* ═══════════════ 令牌别名 ═══════════════
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
  --on-accent:var(--dsw-alias-label-primary-foreground,#fff);
  --brand-hover:var(--dsw-alias-button-primary-hover,#43454a);
  --shadow-card:var(--dsw-shadow-lv2,0 4px 14px #00000059);
  --shadow-pop:var(--dsw-shadow-lv3,0 12px 32px #00000073);
}

.dsptb *,.dsptb *::before,.dsptb *::after{box-sizing:border-box}
.dsptb button,.dsptb input,.dsptb select{font:inherit;color:inherit}
.dsptb h1,.dsptb h2,.dsptb h3,.dsptb h4,.dsptb p{margin:0}
.dsptb ul{margin:0;padding:0;list-style:none}
.dsptb ::-webkit-scrollbar{width:10px;height:10px}
.dsptb ::-webkit-scrollbar-track{background:var(--interactive-bg-hover);border-radius:999px}
.dsptb ::-webkit-scrollbar-thumb{background:var(--border-l3);border-radius:999px}
.dsptb ::-webkit-scrollbar-thumb:hover{background:var(--border-l4)}
.dsptb ::-webkit-scrollbar-corner{background:transparent}
.dsptb :focus-visible{outline:2px solid var(--business-primary);outline-offset:2px;border-radius:6px}
.dsptb .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace}
.dsptb .app{display:flex;height:100%}
  flex:0 0 220px;width:220px;
  background:var(--bg-layer-1);
  border-right:1px solid var(--border-l1);
  display:flex;flex-direction:column;
  padding:0 8px 8px;gap:1px;
}
  flex:0 0 52px;height:52px;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 4px 0 8px;
}
  width:26px;height:26px;border-radius:7px;flex:0 0 26px;
  display:grid;place-items:center;background:none;border:0;
  color:var(--label-tertiary);cursor:pointer;
}
  display:flex;align-items:center;gap:8px;
  padding:0 8px 12px;
}
  width:24px;height:24px;border-radius:7px;flex:0 0 24px;
  background:var(--brand);color:#fff;display:grid;place-items:center;
}
  margin-left:auto;font-size:10px;line-height:1;
  padding:3px 6px;border-radius:5px;
  background:var(--bg-layer-3);color:var(--label-tertiary);
  border:1px solid var(--border-l2);white-space:nowrap;
}
  display:flex;align-items:center;gap:8px;
  height:30px;padding:0 8px;margin:0 0 4px;border-radius:8px;
  background:var(--bg-layer-3);border:1px solid var(--border-l2);
  color:var(--label-primary);width:100%;text-align:left;cursor:pointer;
  font-size:12px;font-weight:600;
}
  font-size:11px;color:var(--label-tertiary);
  padding:10px 8px 4px;letter-spacing:.04em;
}
  display:flex;align-items:center;gap:8px;
  height:28px;padding:0 8px;border-radius:8px;
  color:var(--label-secondary);font-size:12px;
  background:none;border:0;width:100%;text-align:left;cursor:pointer;
}
  display:flex;align-items:center;gap:8px;
  height:30px;padding:0 8px;border-radius:8px;
  color:var(--label-secondary);font-size:12px;
  background:none;border:0;width:100%;text-align:left;cursor:pointer;
  position:relative;
}
  background:var(--interactive-bg-hover);
  color:var(--label-primary);font-weight:600;
}
  content:"";position:absolute;left:-8px;top:6px;bottom:6px;
  width:3px;border-radius:0 3px 3px 0;background:var(--brand);
}
.dsptb .main{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--bg-base)}
.dsptb .panel-head{
  flex:0 0 auto;height:46px;
  display:flex;align-items:center;gap:10px;
  padding:0 16px;
  background:var(--bg-layer-1);
  border-bottom:1px solid var(--border-l1);
}
.dsptb .panel-head h1{font-size:16px;font-weight:700;letter-spacing:.01em}
.dsptb .panel-head .spacer{flex:1}
.dsptb .head-tools{display:flex;align-items:center;gap:8px}
.dsptb .src-badge{
  display:inline-flex;align-items:center;gap:6px;
  height:24px;padding:0 9px;border-radius:999px;
  background:var(--interactive-bg-hover);
  border:1px solid var(--border-l1);
  font-size:12px;cursor:default;
}
.dsptb .src-badge .dot{font-size:11px;line-height:1}
.dsptb .src-badge.live .dot{color:var(--state-success)}
.dsptb .src-badge.snapshot .dot{color:var(--state-warn)}
.dsptb .src-badge.stale{color:var(--warn-fg);border-color:var(--warn-border)}
.dsptb .src-note{font-size:12px;color:var(--warn-fg)}
.dsptb .seg{
  display:inline-flex;align-items:center;
  height:30px;padding:2px;gap:2px;
  background:var(--input-major);
  border:1px solid var(--border-l1);
  border-radius:8px;
}
.dsptb .seg button{
  height:24px;padding:0 10px;border:0;border-radius:6px;
  background:none;color:var(--label-secondary);
  cursor:pointer;white-space:nowrap;font-size:12px;
}
.dsptb .seg button:hover{color:var(--label-primary);background:var(--interactive-bg-hover)}
body[data-ds-dark-theme] .dsptb .seg button[aria-pressed="true"]{background:var(--bg-layer-3);color:var(--label-primary);font-weight:600;}
.dsptb .seg button[aria-pressed="true"]{background:#fff;box-shadow:0 1px 2px #0f11151a}
.dsptb .seg.seg-view button{font-size:13px;padding:0 14px}
.dsptb .icon-btn{
  width:30px;height:30px;border-radius:8px;
  display:grid;place-items:center;
  background:none;border:1px solid var(--border-l1);
  color:var(--label-secondary);cursor:pointer;
}
.dsptb .icon-btn:hover{background:var(--interactive-bg-hover);color:var(--label-primary)}
.dsptb .icon-btn:disabled{opacity:.45;cursor:not-allowed}
.dsptb .icon-btn:disabled:hover{background:none;color:var(--label-secondary)}
.dsptb .icon-add{border-color:var(--business-primary);color:var(--business-primary)}
.dsptb .page{flex:1;min-height:0;display:flex;flex-direction:column;padding:14px 16px 16px;gap:12px}
.dsptb .select-wrap{position:relative;display:inline-flex}
.dsptb .select-wrap select{
  height:30px;padding:0 26px 0 10px;border-radius:8px;
  background:var(--input-major);
  border:1px solid var(--border-l2);
  color:var(--label-primary);
  appearance:none;cursor:pointer;
}
.dsptb .select-wrap::after{
  content:"";position:absolute;right:10px;top:50%;width:6px;height:6px;
  border-right:1.5px solid var(--label-secondary);
  border-bottom:1.5px solid var(--label-secondary);
  transform:translateY(-70%) rotate(45deg);pointer-events:none;
}
.dsptb .search{
  position:relative;display:inline-flex;align-items:center;
  width:260px;height:30px;
}
.dsptb .search svg{position:absolute;left:9px;color:var(--label-tertiary);pointer-events:none}
.dsptb .search input{
  width:100%;height:100%;padding:0 10px 0 30px;
  border-radius:8px;
  background:var(--input-major);
  border:1px solid var(--border-l2);
  color:var(--label-primary);
}
.dsptb .search input::placeholder{color:var(--label-tertiary)}
.dsptb .switch{display:inline-flex;align-items:center;gap:7px;height:30px;cursor:pointer;user-select:none}
.dsptb .switch input{position:absolute;opacity:0;width:0;height:0}
.dsptb .switch .track{
  width:32px;height:18px;border-radius:999px;
  background:var(--input-major);border:1px solid var(--border-l3);
  position:relative;transition:background .16s;
}
.dsptb .switch .track::after{
  content:"";position:absolute;left:2px;top:2px;width:12px;height:12px;
  border-radius:50%;background:var(--label-secondary);
  transition:transform .16s,background .16s;
}
.dsptb .switch input:checked + .track{background:var(--brand);border-color:var(--brand)}
/* 滑块**不能写死白色**。--brand 不是品牌蓝，它是「高对比实底」——
   浅色主题下近黑、深色主题下近白。写死 #fff 的话，深色主题下就是
   白滑块压在近白的轨道上，**整个开关看不出是开是关**（真出过，而且是在
   把开关做成能点之后才发现：点不动的时候没人盯着它看）。
   跟着底色反过来才对：--on-accent 浅色下白、深色下近黑。 */
.dsptb .switch input:checked + .track::after{transform:translateX(14px);background:var(--on-accent)}
.dsptb .switch input:focus-visible + .track{outline:2px solid var(--business-primary);outline-offset:2px}
.dsptb .switch span.txt{font-size:13px;color:var(--label-secondary)}
.dsptb .btn{
  height:30px;padding:0 12px;border-radius:8px;
  border:1px solid transparent;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
  white-space:nowrap;
}
.dsptb .btn-primary{background:var(--brand);color:var(--on-accent);font-weight:600}
.dsptb .btn-primary:hover{background:var(--brand-hover)}
.dsptb .btn-secondary{
  background:var(--input-major);color:var(--label-primary);
  border-color:var(--border-l2);
}
.dsptb .btn-secondary:hover{background:var(--interactive-bg-hover)}
.dsptb .banner{
  flex:0 0 auto;display:flex;align-items:flex-start;gap:8px;
  padding:9px 12px;border-radius:10px;
  background:var(--warn-bg);border:1px solid var(--warn-border);
  color:var(--warn-fg);font-size:12px;
}
.dsptb .banner svg{flex:0 0 15px;margin-top:2px}
.dsptb [hidden]{display:none !important}
.dsptb .view{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}
.dsptb .view-note{font-size:12px;color:var(--label-tertiary);flex:0 0 auto}
.dsptb .board{
  flex:1;min-height:0;
  display:grid;grid-auto-flow:column;
  grid-auto-columns:minmax(220px,1fr);
  gap:12px;overflow-x:auto;overflow-y:hidden;
  padding-bottom:2px;
}
.dsptb .col{
  display:flex;flex-direction:column;min-height:0;
  background:var(--bg-layer-2);
  border:1px solid var(--border-l1);
  border-radius:12px;
  overflow:hidden;
}
.dsptb .col-head{
  flex:0 0 auto;display:flex;align-items:center;gap:8px;
  padding:10px 12px;
}
.dsptb .col-head h3{font-size:13px;font-weight:700}
.dsptb .col-head .hdot{width:8px;height:8px;border-radius:50%;flex:0 0 8px}
.dsptb .col-head .count{
  margin-left:auto;font-size:12px;color:var(--label-secondary);
  background:var(--interactive-bg-hover);
  border-radius:999px;padding:0 8px;height:18px;display:inline-flex;align-items:center;
}
.dsptb .col-body{flex:1;min-height:0;overflow-y:auto;padding:0 8px 10px;display:flex;flex-direction:column;gap:8px}
.dsptb .col-head .count i{font-style:normal;color:var(--label-tertiary);font-size:11px}
.dsptb .col-filters{
  flex:0 0 auto;display:flex;align-items:center;gap:5px;
  padding:0 10px 9px;border-bottom:1px solid var(--border-l1);
}
.dsptb .view-bar{flex:0 0 auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dsptb .view-bar .dd-mini{flex:0 0 118px;min-width:0}
.dsptb .view-bar .select-wrap.mini select{padding-right:22px}
.dsptb .dd-mini{flex:1 1 auto;min-width:64px}
.dsptb .dd-mini .dd-btn{
  height:24px;min-width:0;width:100%;padding:0 18px 0 6px;border-radius:6px;
  font-size:11px;gap:5px;
}
.dsptb .dd-mini .dd-btn::after{right:7px;width:5px;height:5px}
.dsptb .dd-mini .wdot{width:6px;height:6px;flex:0 0 6px}
.dsptb .dd-mini .dd-pop{font-size:12px}
.dsptb .icon-mini{
  flex:0 0 24px;width:24px;height:24px;border-radius:6px;display:grid;place-items:center;
  background:var(--input-major);border:1px solid var(--border-l2);
  color:var(--label-secondary);cursor:pointer;
}
.dsptb .icon-mini:hover{color:var(--label-primary);background:var(--interactive-bg-hover)}
.dsptb .icon-mini.on,.dsptb .search-mini.on,.dsptb .select-wrap.mini select.on{
  border-color:var(--business-primary);color:var(--business-primary);
}
.dsptb .search-mini{
  flex:1 1 auto;min-width:0;width:auto;height:24px;
  background:var(--input-major);border:1px solid var(--border-l2);border-radius:6px;
}
.dsptb .search-mini svg{left:6px}
.dsptb .search-mini input{
  padding:0 20px 0 22px;font-size:11px;border:0;background:none;border-radius:6px;
}
.dsptb .search-mini input[type="search"]::-webkit-search-cancel-button{display:none}
.dsptb .search-mini .sx{
  position:absolute;right:2px;top:50%;transform:translateY(-50%);
  width:18px;height:18px;border:0;border-radius:5px;background:none;
  color:var(--label-tertiary);font-size:10px;line-height:1;cursor:pointer;display:grid;place-items:center;
}
.dsptb .search-mini .sx:hover{color:var(--label-primary);background:var(--interactive-bg-hover)}
.dsptb .select-wrap.mini{flex:0 0 auto}
.dsptb .select-wrap.mini select{
  height:24px;padding:0 20px 0 7px;border-radius:6px;font-size:11px;
}
.dsptb .select-wrap.mini::after{right:7px;width:5px;height:5px}
.dsptb .col-empty{
  margin:8px 0 0;padding:14px 10px;text-align:center;border-radius:8px;
  font-size:12px;line-height:1.7;color:var(--label-tertiary);
  border:1px dashed var(--border-l2);
}
.dsptb .more-row{
  display:flex;flex-wrap:wrap;align-items:center;gap:8px;
  margin:8px 4px 2px;padding:8px 10px;border-radius:8px;
  border:1px dashed var(--border-l2);
}
.dsptb .more-row .more-txt{flex:1;min-width:0;font-size:11px;line-height:1.5;color:var(--label-tertiary)}
.dsptb .more-row .btn{height:24px;padding:0 10px;font-size:11px}
/* 一天的卡片。间距在这儿，不在 col-body 上 —— 分组之后 col-body 的直接
   子元素是「一天」，它的 gap 只管组和组之间；组内的卡片是这一层的子元素，
   没有这一条就是 0 间距，同一天的卡会粘成一整块。
   数字跟 col-body 那个 gap 保持一致，这样分组列和不分组列看起来是同一种疏密。 */
.dsptb .day-group{display:flex;flex-direction:column;gap:8px}
.dsptb .group-head{
  display:flex;align-items:center;gap:6px;
  font-size:13px;color:var(--label-secondary);
  /* 底下不留 padding：跟第一张卡之间那一截由 day-group 的 gap 出，
     两处都写会变成双倍 */
  padding:8px 4px 0;
}
.dsptb .group-head button{
  background:none;border:0;padding:1px 4px;margin-left:-4px;border-radius:6px;cursor:pointer;
  color:var(--label-secondary);display:inline-flex;align-items:center;gap:5px;
  font-weight:600;
}
.dsptb .group-head button:hover{color:var(--label-primary)}
.dsptb .group-head .caret{transition:transform .16s;display:inline-block}
.dsptb .group-head .caret.open{transform:rotate(90deg)}
.dsptb .group-head .rule{flex:1;height:1px;background:var(--border-l1)}
.dsptb .group-head .dot{
  width:6px;height:6px;border-radius:50%;background:var(--brand);flex:0 0 6px;
}
.dsptb .group-head .n{
  font-size:11px;font-weight:600;color:var(--label-tertiary);
  font-variant-numeric:tabular-nums;margin-left:2px;
}
.dsptb .card{
  position:relative;
  background:var(--bg-base);
  border:1px solid var(--border-l2);
  border-radius:10px;
  padding:9px 12px 9px 14px;
  cursor:pointer;
  overflow:hidden;
  display:grid;
  grid-template-rows:20px 17px 17px 17px;
  row-gap:5px;
  align-content:start;

  flex:0 0 auto;
  transition:transform .14s ease,box-shadow .14s ease,border-color .14s ease;
}
.dsptb .card>*{min-width:0}
.dsptb .card:hover{transform:translateY(-1px);box-shadow:var(--shadow-card);border-color:var(--border-l3)}
.dsptb .card::before{
  content:"";position:absolute;left:0;top:0;bottom:0;width:3px;
  background:var(--bar,transparent);z-index:1;
}
.dsptb .card.is-running{border-color:var(--state-warn)}
.dsptb .card.is-running:hover{border-color:var(--state-warn)}
/* 有颜色的是「为什么它还停在这儿」，优先级压过 is-running 那条 ——
   一条「它在等你批准」比「它开着」重要得多 */
.dsptb .card.tone{border-color:var(--tone)}
.dsptb .card.tone:hover{border-color:var(--tone)}
.dsptb .card.tone{border-width:2px;padding:8px 11px 8px 13px}
/* 橘红呼吸：**它下面还压着东西**。
   用渐变过渡而不是硬闪 —— 满屏卡片一起一亮一灭，眼睛受不了，
   看起来也像报警器坏了。颜色本身在两个色之间来回，亮度不变。 */
@keyframes dsptb-cascade{
  0%,100%{border-color:var(--state-error)}
  50%{border-color:var(--state-warn)}
}
.dsptb .card.tone-cascade{
  animation:dsptb-cascade 2.4s ease-in-out infinite;
  border-color:var(--state-error);
}
.dsptb .card.tone-cascade:hover{animation-play-state:paused}
/* 系统开着「减弱动态」：动画**整个关掉**，但颜色留着。
   关成没颜色就等于把这一类藏起来了 —— 而它恰恰是藏得最深的那一种。 */
@media (prefers-reduced-motion:reduce){
  .dsptb .card.tone-cascade{animation:none;border-color:var(--state-error)}
}

/* ── 边框上的跑马灯 ────────────────────────────────────────────────────────
   **每一种纯色的卡都有一道光沿着边框跑**（红 / 橙 / 绿 / 蓝）。
   底色仍然是那个色 —— 所以颜色本身还好认；跑的是压在底色上的一段更亮的、
   带渐隐尾巴的光。

   先说为什么不是「整条边一起亮暗」：那是上一版的做法，用户看过之后说
   「和我想要的效果不太一样，我想的是类似跑马灯的那种」。

   ## 怎么让一个角度动起来

   conic-gradient(from Xdeg, …) 里那个角度**没法直接动画** —— 得先用
   @property 把它注册成一个真正的 angle 类型，浏览器才知道怎么在两个角度
   之间插值。不注册的话它就是个字符串，动画会退化成硬切。
   属性名带 dsptb 前缀，免得跟宿主或别的插件撞。

   ## 为什么把边框画成背景，而不用 ::after

   本来最直观的是拿 ::after 盖在边框上。但 .card 上有 overflow:hidden
   （用来裁工作区那条斜带），而 overflow:hidden 是按 **padding box** 裁的 ——
   ::after 只要伸到边框那一圈就会被整个裁掉，看不见。
   所以改成背景两层：内芯裁到 padding-box、边框那一圈裁到 border-box，
   上面那层把中间盖住，露出来的正好就是边框那一条。
   真边框设成透明，不然它会盖在渐变上面。

   （这段注释里一个反引号都没有是**故意的**：整个文件是一个 String.raw 模板，
   注释里写反引号会把字面量提前收尾。已经踩过四次了，build.mjs 里有专门的检查。）

   ## 光往哪边「亮」是分主题的

   深色主题：往白走，这是「跑马灯」本来的样子。
   浅色主题：**反着往深走**。卡片底色在浅色下本来就是白的，往白渐变等于让
             那道光融进白底、跑起来什么也看不见。 */
@property --dsptb-turn{syntax:'<angle>';initial-value:0deg;inherits:false}
@keyframes dsptb-marquee{to{--dsptb-turn:360deg}}
.dsptb .card.tone:not(.tone-cascade){
  --tone-glow:color-mix(in srgb,var(--tone) 62%,#000);
  border-color:transparent;
  background-image:
    linear-gradient(var(--bg-base),var(--bg-base)),
    conic-gradient(from var(--dsptb-turn),
      var(--tone) 0deg 240deg,
      color-mix(in srgb,var(--tone-glow) 55%,var(--tone)) 300deg,
      var(--tone-glow) 340deg,
      var(--tone) 360deg);
  background-origin:padding-box,border-box;
  background-clip:padding-box,border-box;
  animation:dsptb-marquee 3s linear infinite;
}
body[data-ds-dark-theme] .dsptb .card.tone:not(.tone-cascade){
  --tone-glow:color-mix(in srgb,var(--tone) 34%,#fff);
}
/* 悬停时别让那条 hover 规则把真边框又画回来（它会盖住渐变）。
   跑马灯**不**跟着停 —— 停下来的光会变成边框上一块不动的色斑，看着像坏了。 */
.dsptb .card.tone:not(.tone-cascade):hover{border-color:transparent}
@media (prefers-reduced-motion:reduce){
  .dsptb .card.tone:not(.tone-cascade){
    animation:none;
    border-color:var(--tone);
    background-image:none;
  }
}
.dsptb .card h4{
  display:flex;align-items:baseline;gap:5px;
  padding-left:18px;
  font-size:13px;font-weight:600;line-height:20px;
  white-space:nowrap;
}
.dsptb .card h4 .ttl{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
.dsptb .card h4 .nogol{flex:0 0 auto}
.dsptb .card-tags{display:flex;flex-wrap:nowrap;align-items:center;gap:4px;overflow:hidden}
.dsptb .card-tags .badge{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .card-tags .prio,.dsptb .card-tags .badge-manual,.dsptb .card-tags .badge-sub{flex:0 0 auto}
.dsptb .badge-sub{
  font-size:11px;line-height:1;padding:3px 6px;border-radius:5px;
  color:var(--label-secondary);background:var(--bg-layer-3);
  border:1px solid var(--border-l3);font-variant-numeric:tabular-nums;
}
.dsptb .badge-manual{
  font-size:11px;line-height:1;padding:3px 6px;border-radius:5px;
  color:var(--label-secondary);background:var(--bg-layer-3);
  border:1px dashed var(--border-l4);
}
/* 「会话」角标：这一行不是账本里的卡，是没有挂卡的会话。
   虚线边框是**故意的** —— 实心边框的角标在这张卡上都是「账本里的一个属性」，
   而这一个说的是「这张卡本身不是账本里的东西」。 */
.dsptb .badge-session{
  flex:0 0 auto;font-size:10px;line-height:1;padding:3px 6px;border-radius:5px;
  color:var(--label-secondary);border:1px dashed var(--border-l3);
}
.dsptb .card.is-session{background:var(--bg-layer-2)}
.dsptb .card.is-session:hover{border-color:var(--border-l4)}
/* 甘特左侧任务名前面那枚「会话」小标 */
.dsptb .g-sess{
  flex:0 0 auto;font-size:9px;line-height:1;padding:2px 4px;border-radius:4px;
  color:var(--label-tertiary);border:1px dashed var(--border-l3);
}
/* 新建表单里的排期块。跟抽屉里那排控件长得像，但它是表单里的一个字段，
   所以左边不留那 52px 的标签列（标签在 .fl 上） */
.dsptb .sched-new{padding:10px 12px;border:1px solid var(--border-l2);border-radius:8px;background:var(--bg-layer-2)}
.dsptb .sched-cron-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.dsptb .sched-new .ro-reason{padding-top:0}
/* 排期控件禁用时看着就是禁用的，不用点下去才知道 */
.dsptb .sched-new .switch input[disabled]+.track{opacity:.45}
.dsptb .sched-new .switch input[disabled]~.txt{opacity:.6}
/* 排期改失败时那句原话。跟成功时一样占一行，颜色换成「没成」 */
.dsptb .ro-reason.err{color:var(--state-error)}
/* 排期控件禁用时看着就是禁用的，不用点下去才知道 */
.dsptb .sched-ro .switch input[disabled]+.track{opacity:.45}
.dsptb .sched-ro .switch input[disabled]~.txt{opacity:.6}
.dsptb .badge-period{
  flex:0 0 auto;font-size:11px;line-height:1;padding:3px 6px;border-radius:5px;
  color:var(--business-primary);border:1px solid var(--business-primary);background:none;
}
body[data-ds-dark-theme] .dsptb .badge{font-size:11px;line-height:1;padding:3px 6px;border-radius:5px;
  color:hsl(var(--hue) 62% 66%);
  background:hsl(var(--hue) 62% 55% / .16);}
.dsptb .badge{color:hsl(var(--hue) 58% 36%);
  background:hsl(var(--hue) 62% 45% / .12);}
.dsptb .card-sub{
  display:flex;align-items:center;gap:10px;overflow:hidden;
  font-size:11px;color:var(--label-tertiary);white-space:nowrap;
}
.dsptb .card-sub .cseg{display:flex;align-items:center;gap:4px;min-width:0}
.dsptb .card-sub .nowrap{flex:0 0 auto}
.dsptb .card-sub .c-orch{color:var(--business-primary)}
.dsptb .card-sub .c-orch .ttl2{flex:0 0 auto;max-width:9em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .card-sub .c-orch .ostp{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .card-meta{
  display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px;
  font-size:12px;color:var(--label-secondary);white-space:nowrap;
}
.dsptb .card-meta>*{min-width:0}
.dsptb .card-meta .when{font-variant-numeric:tabular-nums}
.dsptb .card-meta .when-slot{justify-self:end}
.dsptb .chip{
  flex:0 0 auto;margin-left:auto;
  font-size:11px;padding:2px 7px;border-radius:999px;
  background:var(--interactive-bg-hover);
  color:var(--label-secondary);
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  white-space:nowrap;
}
.dsptb .card:hover .chip{color:var(--label-primary)}
.dsptb .gantt{
  flex:1;min-height:0;
  background:var(--bg-layer-2);
  border:1px solid var(--border-l1);
  border-radius:12px;
  overflow:auto;
}
.dsptb .g-inner{position:relative;width:max-content;min-width:100%}
.dsptb .g-head{
  position:sticky;top:0;z-index:3;
  display:flex;height:34px;
  background:var(--bg-layer-2);
  border-bottom:1px solid var(--border-l2);
}
.dsptb .g-corner{
  flex:0 0 220px;width:220px;
  position:sticky;left:0;z-index:4;
  background:var(--bg-layer-2);
  border-right:1px solid var(--border-l2);
  display:flex;align-items:center;padding:0 10px;
  font-size:12px;color:var(--label-tertiary);
}
.dsptb .g-dates{display:flex;height:100%}
.dsptb .g-dates .cell{
  display:flex;align-items:center;justify-content:center;
  font-size:11px;color:var(--label-tertiary);
  border-right:1px solid var(--border-l1);
}
.dsptb .g-dates .cell.today{color:var(--brand);font-weight:700}
body[data-ds-dark-theme] .dsptb .g-dates .cell .tick{width:3px;height:3px;border-radius:50%;background:var(--border-l4)}
.dsptb .g-dates .cell .tick{background:var(--label-tertiary);opacity:.5}
.dsptb .g-row{display:flex;height:30px;border-bottom:1px solid var(--border-l1)}
.dsptb .g-row:last-child{border-bottom:0}
.dsptb .g-name{
  flex:0 0 220px;width:220px;
  position:sticky;left:0;z-index:2;
  background:var(--bg-layer-2);
  border-right:1px solid var(--border-l2);
  display:flex;align-items:center;gap:6px;padding:0 10px;
  font-size:12px;
}
.dsptb .g-name .wdot{width:7px;height:7px;border-radius:50%;flex:0 0 7px}
.dsptb .g-name .ttl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.dsptb .g-name.child{padding-left:26px}
.dsptb .g-name.child .br{color:var(--label-tertiary);flex:0 0 auto}
.dsptb .g-track{position:relative;flex:0 0 auto}
.dsptb .g-grid{
  position:absolute;inset:0;
  background-image:repeating-linear-gradient(to right,var(--border-l1) 0 1px,transparent 1px 44px);
}
.dsptb .g-bar{
  position:absolute;top:6px;height:18px;border-radius:5px;
  background:hsl(var(--bh) var(--bs) var(--bl) / .34);
  border:1px solid hsl(var(--bh) var(--bs) var(--bl) / .70);
  overflow:hidden;
}
.dsptb .g-bar.backlog{opacity:.30;border-style:dashed}
.dsptb .g-bar.clip-l{border-top-left-radius:0;border-bottom-left-radius:0;border-left:0}
.dsptb .g-bar.clip-r{border-top-right-radius:0;border-bottom-right-radius:0;border-right:0}
.dsptb .g-exec{
  position:absolute;top:50%;height:10px;transform:translateY(-50%);
  border-radius:3px;
  background:hsl(var(--bh) var(--bs) var(--bl));
  box-shadow:0 0 0 1px hsl(var(--bh) var(--bs) var(--bl) / .35);
}
.dsptb .g-pulse{
  position:absolute;top:50%;width:9px;height:9px;border-radius:50%;
  transform:translate(-50%,-50%);
  background:hsl(var(--bh) var(--bs) var(--bl));
  box-shadow:0 0 0 0 hsl(var(--bh) var(--bs) var(--bl) / .7);
  animation:dsptb-pulse 1.8s ease-out infinite;
}
@keyframes dsptb-pulse{
  0%{box-shadow:0 0 0 0 hsl(var(--bh) var(--bs) var(--bl) / .6)}
  70%{box-shadow:0 0 0 7px hsl(var(--bh) var(--bs) var(--bl) / 0)}
  100%{box-shadow:0 0 0 0 hsl(var(--bh) var(--bs) var(--bl) / 0)}
}
.dsptb .g-today{
  position:absolute;bottom:0;width:1px;background:var(--brand);
  opacity:.9;z-index:1;pointer-events:none;
}
@media (prefers-reduced-motion:reduce){.dsptb .g-pulse{animation:none}.dsptb .card{transition:none}
}
.dsptb .progress{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px}
.dsptb .p-top{display:flex;gap:12px;align-items:stretch;flex-wrap:wrap}
.dsptb .panel{
  background:var(--bg-layer-2);
  border:1px solid var(--border-l1);
  border-radius:12px;
}
.dsptb .p-donut{
  flex:0 0 auto;display:flex;align-items:center;justify-content:center;
  padding:18px 22px;
}
.dsptb .p-donut svg{display:block;width:210px;height:210px}
.dsptb .p-donut .big{font-size:38px;font-weight:700;fill:var(--label-primary)}
.dsptb .p-donut .sub{font-size:12px;fill:var(--label-secondary)}
.dsptb .p-list{flex:1;min-width:280px;padding:12px 14px;display:flex;flex-direction:column;gap:11px}
.dsptb .p-list h3{font-size:13px;font-weight:700}
.dsptb .p-row{display:grid;grid-template-columns:10px 62px 1fr 30px 40px;align-items:center;gap:9px}
.dsptb .p-row .pd{width:8px;height:8px;border-radius:50%}
.dsptb .p-row .pn{font-size:12px;color:var(--label-secondary)}
.dsptb .p-row .ptrack{display:block;height:8px;border-radius:999px;background:var(--interactive-bg-hover);overflow:hidden}
.dsptb .p-row .pfill{display:block;height:100%;border-radius:999px}
.dsptb .p-row .pc{font-size:12px;text-align:right;font-variant-numeric:tabular-nums}
.dsptb .p-row .pp{font-size:12px;color:var(--label-tertiary);text-align:right;font-variant-numeric:tabular-nums}
.dsptb .p-list .p-total{
  display:flex;justify-content:space-between;
  font-size:12px;color:var(--label-tertiary);
  border-top:1px solid var(--border-l1);padding-top:10px;margin-top:2px;
}
.dsptb .p-break{
  display:flex;gap:14px;flex-wrap:wrap;
  border-top:1px solid var(--border-l1);padding-top:10px;margin-top:2px;
}
.dsptb .p-break .bk{display:flex;align-items:baseline;gap:5px;font-size:12px}
.dsptb .p-break .bk .k{font-style:normal;color:var(--label-tertiary)}
.dsptb .p-break .bk b{font-weight:700;font-variant-numeric:tabular-nums}
.dsptb .p-break .bk .sub{font-size:11px;color:var(--label-tertiary)}
.dsptb .p-secttl{font-size:13px;font-weight:700;padding:2px 0 0}
.dsptb .p-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
.dsptb .p-ws{padding:12px 14px;display:flex;flex-direction:column;gap:11px}
.dsptb .p-ws-hd{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:700}
.dsptb .p-ws-hd .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .p-ws-hd .nm.unpin{color:var(--label-tertiary)}
.dsptb .p-ws-body{display:flex;align-items:center;gap:13px}
.dsptb .p-ws-ring{flex:0 0 auto}
.dsptb .p-ws-ring svg{display:block;width:88px;height:88px}
.dsptb .p-ws-ring .rbig{font-size:17px;font-weight:700;fill:var(--label-primary)}
.dsptb .p-ws-num{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--label-secondary);min-width:0}
.dsptb .p-ws-num b{font-size:13px;color:var(--label-primary)}
.dsptb .p-ws .p-break{margin-top:0;padding-top:9px;gap:11px}
.dsptb .p-date{display:inline-flex;align-items:center;gap:6px}
.dsptb .p-date input[type="date"]{
  height:24px;padding:0 7px;border-radius:6px;font-size:11px;
  background:var(--input-major);border:1px solid var(--border-l2);color:var(--label-primary);
}
.dsptb .p-date .to{font-size:11px;color:var(--label-tertiary)}
.dsptb .p-date input[type="date"].bad{border-color:var(--warn-border);background:var(--warn-bg);color:var(--warn-fg)}
.dsptb .p-err{flex:1 1 100%;font-size:12px;color:var(--warn-fg)}
/* 「口径」这个小标。它是被核的时候才看的东西，所以只占一个字的位置，
   正文一个字都不放 —— 原来那两段就摆在这儿，每次扫这一页都要先读过它们。 */
.dsptb .meter{
  margin-left:auto;flex:0 0 auto;
  font-size:11px;line-height:1;padding:4px 7px;border-radius:5px;
  color:var(--label-tertiary);border:1px dashed var(--border-l2);
  cursor:help;user-select:none;
}
.dsptb .meter:hover{color:var(--label-secondary);border-color:var(--border-l3)}
.dsptb .p-quick{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}
.dsptb .p-quick button{
  height:24px;padding:0 9px;border-radius:999px;font-size:11px;cursor:pointer;
  border:1px solid var(--border-l2);background:var(--input-major);color:var(--label-secondary);
}
.dsptb .p-quick button:hover{color:var(--label-primary)}
.dsptb .p-quick button[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:var(--on-accent);font-weight:600}
.dsptb .p-goal{padding:12px 14px;display:flex;flex-direction:column;gap:11px}
.dsptb .p-goal-hd{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.dsptb .p-goal-hd h3{font-size:13px;font-weight:700}
.dsptb .p-goal-hd .hint{font-size:11px}
.dsptb .pg-wrap{display:flex;flex-direction:column;gap:6px}
.dsptb .pg{display:grid;grid-template-columns:34px 1fr auto;align-items:baseline;gap:10px}
.dsptb .pg .k{font-size:12px;font-weight:700;color:var(--label-secondary)}
.dsptb .pg .rg{font-size:12px;color:var(--label-tertiary);font-variant-numeric:tabular-nums}
.dsptb .pg .nm{font-size:12px;color:var(--label-secondary);font-variant-numeric:tabular-nums;text-align:right}
.dsptb .pg .nm b{color:var(--label-primary);font-weight:700}
.dsptb .pg-track{display:block;height:8px;border-radius:999px;background:var(--interactive-bg-hover);overflow:hidden}
.dsptb .pg-fill{display:block;height:100%;border-radius:999px;background:var(--business-primary)}
.dsptb .pg-left{font-size:12px;color:var(--label-tertiary)}
.dsptb .pg-left.warn{color:var(--warn-fg)}
.dsptb .pg-left b{font-weight:700;font-variant-numeric:tabular-nums}
.dsptb .stk{display:flex;height:8px;border-radius:999px;overflow:hidden;background:var(--interactive-bg-hover)}
.dsptb .stk .sg{display:block;height:100%}
.dsptb .stk .sg+.sg{box-shadow:-1px 0 0 var(--bg-layer-2)}
.dsptb .stk-lg{display:flex;flex-wrap:wrap;gap:3px 10px;font-size:11px;color:var(--label-secondary)}
.dsptb .stk-lg .lg{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.dsptb .stk-lg .lg i{width:7px;height:7px;border-radius:50%;flex:0 0 7px}
.dsptb .stk-lg .lg b{font-weight:700;color:var(--label-primary);font-variant-numeric:tabular-nums}
.dsptb .p-ws-goal{
  font-size:12px;color:var(--label-secondary);
  border-top:1px solid var(--border-l1);padding-top:9px;
}
.dsptb .p-ws-goal.none{color:var(--label-tertiary)}
.dsptb .p-ws-goal b{color:var(--label-primary);font-weight:700;font-variant-numeric:tabular-nums}
.dsptb .p-range-empty{padding:26px 16px;text-align:center;font-size:13px;color:var(--label-tertiary)}
.dsptb .board.is-empty,.dsptb .gantt.is-empty,.dsptb .progress.is-empty{
  display:flex;align-items:center;justify-content:center;
}
.dsptb .empty{
  flex:1;min-height:220px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:6px;
  color:var(--label-secondary);text-align:center;padding:40px 16px;
}
.dsptb .empty .ico{color:var(--label-tertiary);opacity:.7;margin-bottom:6px}
.dsptb .empty h3{font-size:15px;font-weight:700;color:var(--label-primary)}
.dsptb .empty p{font-size:13px;color:var(--label-tertiary)}
.dsptb .empty .btn{margin-top:10px}
body[data-ds-dark-theme] .dsptb .mask{position:fixed;inset:0;background:var(--dsw-alias-bg-mask-1);z-index:50;
  opacity:0;pointer-events:none;transition:opacity .2s ease;}
.dsptb .mask{background:var(--dsw-alias-bg-mask-1)}
.dsptb .mask.open{opacity:1;pointer-events:auto}
.dsptb .drawer{
  position:fixed;top:0;right:0;bottom:0;width:min(980px,94vw);z-index:60;
  background:var(--bg-layer-1);
  border-left:1px solid var(--border-l2);
  display:flex;flex-direction:column;
  transform:translateX(100%);visibility:hidden;
  transition:transform .22s cubic-bezier(.2,.8,.3,1),visibility 0s linear .22s;
  box-shadow:var(--shadow-pop);
}
.dsptb .drawer.open{transform:none;visibility:visible;transition:transform .22s cubic-bezier(.2,.8,.3,1),visibility 0s}
.dsptb .drawer-head{
  flex:0 0 auto;display:flex;align-items:flex-start;gap:10px;
  padding:14px 16px;border-bottom:1px solid var(--border-l1);
}
.dsptb .drawer-head h2{font-size:16px;font-weight:700;line-height:1.45;flex:1;word-break:break-word}
.dsptb .drawer-head .st{flex:0 0 auto;align-self:center}
.dsptb .d-back{
  flex:0 0 auto;padding:9px 16px;border-bottom:1px solid var(--border-l1);
  background:var(--bg-layer-2);
}
.dsptb .d-back button{
  display:flex;align-items:center;gap:7px;width:100%;
  background:none;border:0;padding:0;cursor:pointer;text-align:left;
  font-size:13px;color:var(--label-secondary);
}
.dsptb .d-back button:hover{color:var(--label-primary)}
.dsptb .d-back .arw{flex:0 0 auto;font-size:15px;line-height:1}
.dsptb .d-back .bl{flex:0 0 auto;white-space:nowrap}
.dsptb .d-back .bt{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  color:var(--label-primary);font-weight:600}
.dsptb .drawer-body{
  flex:1;min-height:0;display:flex;flex-direction:column;
  padding:0;overflow:hidden;
}
.dsptb .d-conv{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
.dsptb .d-pane{
  flex:1 1 auto;min-height:0;overflow-y:auto;
  padding:14px 16px 18px;display:flex;flex-direction:column;gap:16px;
}
.dsptb .drawer-tabs{
  flex:0 0 auto;display:flex;flex-wrap:nowrap;align-items:stretch;
  padding:0 10px;border-bottom:1px solid var(--border-l1);
  overflow-x:auto;overflow-y:hidden;scrollbar-width:none;
}
.dsptb .drawer-tabs::-webkit-scrollbar{height:0;display:none}
.dsptb .dtab{
  flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;
  height:38px;padding:0 11px;margin-bottom:-1px;
  background:none;border:0;border-bottom:2px solid transparent;
  cursor:pointer;white-space:nowrap;
  font-size:13px;color:var(--label-secondary);
}
.dsptb .dtab:hover{color:var(--label-primary)}
.dsptb .dtab[aria-selected="true"]{color:var(--label-primary);font-weight:600;border-bottom-color:var(--business-primary)}
.dsptb .dtab .n{font-size:11px;color:var(--label-tertiary);font-variant-numeric:tabular-nums}
.dsptb .dtab[aria-selected="true"] .n{color:var(--label-secondary)}
.dsptb .dtab.dtab-off{color:var(--label-tertiary)}
.dsptb .dtab.dtab-off .n{color:var(--label-tertiary);opacity:.65}
.dsptb .d-sec>h3{
  font-size:12px;font-weight:700;color:var(--label-secondary);
  letter-spacing:.03em;margin-bottom:8px;
}
.dsptb .d-kv{display:flex;flex-direction:column;gap:7px}
.dsptb .d-kv .row{display:flex;gap:10px;font-size:13px}
.dsptb .d-kv .k{flex:0 0 62px;color:var(--label-tertiary)}
.dsptb .d-kv .v{color:var(--label-primary);word-break:break-word}
.dsptb .st{
  display:inline-flex;align-items:center;gap:6px;
  height:22px;padding:0 9px;border-radius:999px;font-size:12px;
  background:var(--interactive-bg-hover);
}
.dsptb .st .dot{width:7px;height:7px;border-radius:50%}
.dsptb .d-sub{display:flex;flex-direction:column;gap:6px}
.dsptb .d-sub .item{
  display:flex;align-items:center;gap:8px;width:100%;text-align:left;
  font-size:13px;padding:7px 10px;border-radius:8px;
  background:var(--bg-base);border:1px solid var(--border-l1);
  cursor:pointer;color:inherit;
}
.dsptb .d-sub .item:hover{border-color:var(--border-l3)}
.dsptb .d-sub .item .dot{width:7px;height:7px;border-radius:50%;flex:0 0 7px}
.dsptb .d-sub .item .ttl{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .d-sub .item .sid{font-size:11px;color:var(--label-tertiary)}
.dsptb .d-sub .item .sid,.dsptb .d-sub .item .chev{flex:0 0 auto}
.dsptb .d-sub .item .chev{color:var(--label-tertiary);font-size:15px;line-height:1}
.dsptb .d-sub .item:hover .chev{color:var(--label-primary)}
.dsptb .d-sub .item .up{color:var(--label-tertiary);flex:0 0 auto}
.dsptb .d-empty{font-size:12px;color:var(--label-tertiary)}
.dsptb .d-sec-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.dsptb .d-sec-head h3{margin-bottom:0}
.dsptb .d-sec-head .spacer{flex:1}
.dsptb .d-sec-head button{
  background:none;border:0;padding:0;cursor:pointer;
  font-size:12px;color:var(--business-primary);
}
.dsptb .d-sec-head button:hover{text-decoration:underline}
.dsptb .d-goal{font-size:14px;line-height:1.65;color:var(--label-primary);word-break:break-word}
.dsptb .d-goal.none{font-size:12px;color:var(--label-tertiary)}
.dsptb .d-rest{margin-top:12px}
.dsptb .d-exlist{display:flex;flex-direction:column;gap:6px}
.dsptb .d-ex{
  display:flex;flex-direction:column;gap:4px;width:100%;text-align:left;
  padding:7px 10px;border-radius:8px;cursor:pointer;color:inherit;
  background:var(--bg-base);border:1px solid var(--border-l1);
}
.dsptb .d-ex:hover{border-color:var(--border-l3)}
.dsptb .d-ex.on{border-color:var(--business-primary);background:var(--bg-layer-2)}
.dsptb .d-ex .r1{display:flex;align-items:center;gap:8px;font-size:12px;min-width:0}
.dsptb .d-ex .ord{flex:0 0 auto;color:var(--label-tertiary);font-variant-numeric:tabular-nums}
.dsptb .d-ex .dot{width:7px;height:7px;border-radius:50%;flex:0 0 7px}
.dsptb .d-ex .when{flex:0 0 auto;color:var(--label-secondary);font-variant-numeric:tabular-nums}
.dsptb .d-ex .res{flex:0 0 auto;font-weight:600}
.dsptb .d-ex .dur,.dsptb .d-ex .trig{flex:0 0 auto;color:var(--label-tertiary)}
.dsptb .d-ex .sid{
  flex:0 1 auto;min-width:0;margin-left:auto;font-size:11px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  color:var(--business-primary);
}
body[data-ds-dark-theme] .dsptb .d-ex .esub{font-size:11px;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  color:var(--state-error);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dsptb .d-ex .esub{color:var(--state-error)}
.dsptb .ag-kids{margin-left:16px;padding-left:3px}
.dsptb .ag-kids>.ag-node{position:relative}
.dsptb .ag-kids>.ag-node:before{
  content:"";position:absolute;left:-3px;top:0;bottom:0;
  border-left:.5px solid var(--border-l2);
}
.dsptb .ag-kids>.ag-node:last-child:before{height:15px;bottom:auto}
.dsptb .ag-kids>.ag-node>.ag-row:before{
  content:"";position:absolute;top:14px;left:-3px;width:12px;
  border-top:.5px solid var(--border-l2);
}
.dsptb .ag-row{
  display:flex;align-items:center;gap:8px;position:relative;
  height:28px;padding:0 8px;border-radius:7px;min-width:0;
}
.dsptb .ag-row:hover{background:var(--interactive-bg-hover)}
.dsptb .ag-arw{
  flex:0 0 16px;width:16px;height:16px;padding:0;border:0;background:none;
  cursor:pointer;color:var(--label-tertiary);font-size:10px;line-height:16px;
  display:flex;align-items:center;justify-content:center;
}
.dsptb .ag-arw:hover{color:var(--label-primary)}
.dsptb .ag-arw[aria-expanded="true"]{transform:rotate(90deg)}
.dsptb .ag-arw.none{visibility:hidden;cursor:default}
.dsptb .ag-row .dot{width:7px;height:7px;border-radius:50%;flex:0 0 7px}
.dsptb .ag-name{
  flex:0 1 auto;min-width:0;font-size:13px;color:var(--label-primary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dsptb .ag-role{
  flex:0 0 auto;font-size:11px;color:var(--label-tertiary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:22em;
}
.dsptb .ag-ms{margin-left:auto;flex:0 0 auto;display:flex;flex-direction:column;align-items:flex-end}
.dsptb .ag-m{
  font-size:11px;line-height:13px;color:var(--label-tertiary);
  font-variant-numeric:tabular-nums;white-space:nowrap;
}
.dsptb .d-conv-head{flex:0 0 auto;border-bottom:1px solid var(--border-l1)}
.dsptb .d-conv-ht{
  display:flex;align-items:center;gap:10px;padding:11px 16px 9px;
  border-bottom:1px solid var(--border-l1);
}
.dsptb .d-conv-ht .h-ttl{
  flex:1 1 auto;min-width:0;font-size:13px;font-weight:600;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dsptb .d-conv-ht .h-meta{
  flex:0 0 auto;font-size:11px;color:var(--label-tertiary);
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.dsptb .d-conv-bar{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding:9px 16px 10px}
.dsptb .d-conv-bar h3{font-size:12px;font-weight:700;color:var(--label-secondary);letter-spacing:.03em}
.dsptb .d-conv-note{font-size:11px;color:var(--label-tertiary);flex:1 1 auto;min-width:0}
.dsptb .d-conv-body{
  flex:1 1 auto;min-height:0;overflow-y:auto;
  padding:14px 16px;display:flex;flex-direction:column;gap:12px;
}
.dsptb .d-conv-foot{flex:0 0 auto;padding:10px 16px 14px;border-top:1px solid var(--border-l1)}
.dsptb .fake-input{
  border:1px solid var(--border-l2);border-radius:10px;background:var(--bg-base);
  padding:9px 11px;font-size:13px;color:var(--label-tertiary);
}
.dsptb .d-conv-hint{font-size:11px;color:var(--label-tertiary);margin-top:7px}
.dsptb .msg{display:flex;flex-direction:column;gap:5px;max-width:100%}
.dsptb .msg .who{font-size:11px;color:var(--label-tertiary)}
.dsptb .msg .bub{
  border-radius:10px;padding:8px 11px;font-size:13px;line-height:1.65;
  max-width:84%;word-break:break-word;white-space:pre-wrap;
}
.dsptb .msg.u{align-items:flex-end}
.dsptb .msg.u .who{align-self:flex-end}
.dsptb .msg.u .bub{background:var(--business-primary);color:var(--on-accent)}
.dsptb .msg.a .bub{background:var(--bg-layer-2);border:1px solid var(--border-l1)}
.dsptb .tcall{
  background:var(--bg-base);border:1px solid var(--border-l2);border-radius:8px;
  padding:7px 10px;font-size:12px;max-width:96%;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
.dsptb .tcall .tn{color:var(--business-primary);font-weight:600}
.dsptb .tcall .cmd{color:var(--label-primary);word-break:break-all}
.dsptb .tcall .tr{color:var(--label-tertiary);margin-top:3px;word-break:break-word;white-space:pre-wrap}
.dsptb .tcall.fail{border-color:hsl(0 84% 60% / .38)}
.dsptb .tcall.fail .tn{color:var(--state-error)}
.dsptb .typing{display:inline-flex;align-items:center;gap:3px}
.dsptb .typing i{width:4px;height:4px;border-radius:50%;background:var(--state-warn);animation:dsptb-tp 1.1s infinite}
.dsptb .typing i:nth-child(2){animation-delay:.18s}
.dsptb .typing i:nth-child(3){animation-delay:.36s}
@keyframes dsptb-tp{0%,60%,100%{opacity:.25}30%{opacity:1}}
@media (prefers-reduced-motion:reduce){.dsptb .typing i{animation:none;opacity:1}}
.dsptb .conv-empty{margin:auto;text-align:center;padding:20px 0}
.dsptb .conv-empty .t{font-size:13px;color:var(--label-secondary)}
.dsptb .conv-empty .s{font-size:12px;color:var(--label-tertiary);margin-top:6px}
.dsptb .cmark,.dsptb .g-wsmark{
  --wsr:hsl(var(--hue,0) 58% 42%);
}
.dsptb .cmark.unpin,.dsptb .g-wsmark.unpin{--wsr:hsl(220 9% 42%)}
.dsptb .cmark{position:absolute;left:0;top:0;width:0;height:0;z-index:2;pointer-events:none}
.dsptb .cmark .cm-txt{pointer-events:auto;
  position:absolute;left:-25px;top:3px;width:76px;height:20px;   
  display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;
  font-size:10px;font-weight:600;line-height:20px;letter-spacing:.02em;
  background:var(--wsr);color:#fff;
  transform:rotate(-45deg);            

}
.dsptb .g-wsmark{
  flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;
  height:15px;padding:0 5px;border-radius:3px;overflow:hidden;
  font-size:9px;line-height:1;font-weight:600;letter-spacing:.02em;
  color:#fff;background:var(--wsr);transform:skewX(-14deg);
}
.dsptb .g-wsmark i{font-style:normal;display:block;max-width:36px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transform:skewX(14deg)}
body[data-ds-dark-theme] .dsptb .tip{position:fixed;left:0;top:0;z-index:120;pointer-events:none;
  max-width:300px;padding:6px 9px;border-radius:6px;
  background:var(--bg-layer-3);color:var(--label-primary);
  border:1px solid var(--border-l3);
  box-shadow:0 6px 18px rgba(0,0,0,.4);
  font-size:12px;line-height:1.5;
  white-space:pre-line;overflow-wrap:anywhere;
  opacity:0;transition:opacity .1s ease;}
.dsptb .tip{box-shadow:0 6px 18px rgba(0,0,0,.14)}
.dsptb .tip.on{opacity:1}
@media (prefers-reduced-motion:reduce){.dsptb .tip{transition:none} }
.dsptb .wdot{width:6px;height:6px;border-radius:50%;flex:0 0 6px;display:inline-block}
.dsptb .wdot.lg{width:7px;height:7px;flex:0 0 7px}
.dsptb .wswrap{display:inline-flex;align-items:center;gap:5px;min-width:0;max-width:100%}
.dsptb .wswrap .wsn{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .wsn.unpin{color:var(--label-tertiary)}
.dsptb .nogol{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--state-warn)}
.dsptb .sched{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
.dsptb .sched svg{flex:0 0 12px}
.dsptb .sched.off{color:var(--label-tertiary)}
.dsptb .sched.off svg{opacity:.65}
.dsptb .prio{font-size:11px;padding:2px 6px;border-radius:5px;line-height:1.3}
.dsptb .prio.p-high{color:var(--state-warn);background:var(--warn-bg)}
.dsptb .prio.p-urgent{color:var(--state-error);background:hsl(0 84% 60% / .14)}
.dsptb .dd{position:relative;display:inline-flex}
.dsptb .dd-btn{
  height:30px;padding:0 26px 0 10px;border-radius:8px;
  background:var(--input-major);border:1px solid var(--border-l2);
  color:var(--label-primary);cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;min-width:132px;text-align:left;
}
.dsptb .dd-btn:hover{background:var(--interactive-bg-hover)}
.dsptb .dd-btn .lab{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.dsptb .dd-btn::after{
  content:"";position:absolute;right:10px;top:50%;width:6px;height:6px;
  border-right:1.5px solid var(--label-secondary);
  border-bottom:1.5px solid var(--label-secondary);
  transform:translateY(-70%) rotate(45deg);pointer-events:none;
}
.dsptb .dd.full{display:block}
.dsptb .dd.full .dd-btn{width:100%}
.dsptb .dd-pop{
  position:absolute;left:0;top:calc(100% + 4px);z-index:5;min-width:100%;
  background:var(--bg-layer-3);border:1px solid var(--border-l3);border-radius:10px;
  box-shadow:var(--shadow-pop);padding:4px;display:flex;flex-direction:column;gap:2px;
}
.dsptb .dd-opt{
  display:flex;align-items:center;gap:7px;width:100%;
  padding:6px 9px;border:0;border-radius:7px;background:none;
  color:var(--label-primary);font-size:13px;text-align:left;cursor:pointer;white-space:nowrap;
}
.dsptb .dd-opt:hover{background:var(--interactive-bg-hover)}
.dsptb .dd-opt[aria-selected="true"]{font-weight:600}
.dsptb .dd-opt .tick{margin-left:auto;color:var(--brand);opacity:0}
.dsptb .dd-opt[aria-selected="true"] .tick{opacity:1}
body[data-ds-dark-theme] .dsptb .mmask{position:fixed;inset:0;background:var(--dsw-alias-bg-mask-1);z-index:90;
  opacity:0;pointer-events:none;transition:opacity .18s ease;}
.dsptb .mmask{background:var(--dsw-alias-bg-mask-1)}
.dsptb .mmask.open{opacity:1;pointer-events:auto}
.dsptb .modal{
  position:fixed;left:50%;top:50%;z-index:91;
  width:640px;max-width:calc(100vw - 40px);max-height:80vh;
  display:flex;flex-direction:column;
  background:var(--bg-layer-1);border:1px solid var(--border-l3);border-radius:14px;
  box-shadow:var(--shadow-pop);
  opacity:0;visibility:hidden;pointer-events:none;
  transform:translate(-50%,-46%);
  transition:opacity .18s ease,transform .18s ease,visibility 0s linear .18s;
}
.dsptb .modal.open{
  opacity:1;visibility:visible;pointer-events:auto;transform:translate(-50%,-50%);
  transition:opacity .18s ease,transform .18s ease,visibility 0s;
}
.dsptb .modal.narrow{width:520px}
.dsptb .modal-head{
  flex:0 0 auto;display:flex;align-items:center;gap:10px;
  padding:13px 16px;border-bottom:1px solid var(--border-l1);
}
.dsptb .modal-head h2{font-size:15px;font-weight:700;flex:1}
.dsptb .modal-body{flex:1;min-height:0;overflow-y:auto;padding:14px 16px}
.dsptb .modal-foot{
  flex:0 0 auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  padding:12px 16px;border-top:1px solid var(--border-l1);
}
.dsptb .modal-foot .spacer{flex:1}
.dsptb .ro-note{font-size:12px;color:var(--label-tertiary)}
.dsptb .warnbar{
  flex:1 1 100%;font-size:12px;color:var(--warn-fg);
  background:var(--warn-bg);border:1px solid var(--warn-border);
  border-radius:8px;padding:6px 10px;
}
.dsptb .btn[disabled]{opacity:.5;cursor:not-allowed}
.dsptb .has-tip{display:inline-flex}
.dsptb .parse{
  background:var(--bg-layer-2);border:1px solid var(--border-l1);
  border-radius:10px;padding:11px 12px;margin-bottom:14px;
}
.dsptb .parse-row{display:flex;gap:8px;align-items:stretch}
.dsptb .parse-row textarea{flex:1;min-height:54px}
.dsptb .parse-row .btn{flex:0 0 auto;align-self:flex-start}
.dsptb .parse-note{font-size:12px;color:var(--label-tertiary);margin-top:8px}
.dsptb .modal input[type="text"],.dsptb .modal input[type="date"],.dsptb .modal input[type="number"],.dsptb .modal textarea,.dsptb .modal select,.dsptb .sched-ed input[type="text"],.dsptb .sched-ed input[type="date"],.dsptb .sched-ed input[type="number"],.dsptb .sched-ed textarea,.dsptb .sched-ed select{
  width:100%;padding:5px 9px;border-radius:8px;
  background:var(--input-major);border:1px solid var(--border-l2);
  color:var(--label-primary);font:inherit;line-height:1.55;
}
.dsptb .modal textarea,.dsptb .sched-ed textarea{resize:vertical}
.dsptb .modal select,.dsptb .sched-ed select{height:30px;padding:0 26px 0 10px;appearance:none;cursor:pointer}
.dsptb .modal input[type="date"],.dsptb .sched-ed input[type="date"]{height:30px;padding:0 9px}
body[data-ds-dark-theme] .dsptb input[type="date"]{color-scheme:dark}
.dsptb input[type="date"]{color-scheme:light}
.dsptb .modal .dd-btn{min-width:0}
.dsptb .modal input.err,.dsptb .modal textarea.err,.dsptb .modal select.err{border-color:var(--state-error)}
.dsptb .sec{
  background:var(--bg-base);border:1px solid var(--border-l1);
  border-radius:10px;margin-bottom:10px;overflow:hidden;
}
.dsptb .sec-head{
  display:flex;align-items:center;gap:8px;width:100%;
  padding:10px 12px;background:none;border:0;cursor:pointer;text-align:left;
}
.dsptb .sec-head:hover{background:var(--interactive-bg-hover)}
.dsptb .sec-head .caret{
  color:var(--label-tertiary);font-size:10px;display:inline-block;
  transition:transform .16s;transform-origin:50% 50%;
}
.dsptb .sec.open .sec-head .caret{transform:rotate(90deg)}
.dsptb .sec-name{font-size:13px;font-weight:700}
.dsptb .sec-sum{
  margin-left:auto;max-width:62%;font-size:12px;color:var(--label-tertiary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dsptb .sec.open .sec-sum{display:none}
.dsptb .sec-body{padding:12px;border-top:1px solid var(--border-l1)}
.dsptb .sec:not(.open) .sec-body{display:none}
.dsptb .fld{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.dsptb .fld:last-child{margin-bottom:0}
.dsptb .fld > .fl{font-size:12px;color:var(--label-secondary)}
.dsptb .fld .req{color:var(--state-error);margin-left:2px}
.dsptb .hint{font-size:12px;color:var(--label-tertiary)}
.dsptb .fld-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.dsptb .fld-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.dsptb .segbtn{display:inline-flex;gap:6px}
.dsptb .segbtn button{
  height:26px;padding:0 10px;border-radius:7px;font-size:12px;cursor:pointer;
  border:1px solid var(--border-l2);background:var(--input-major);color:var(--label-secondary);
}
.dsptb .segbtn button:hover{color:var(--label-primary)}
.dsptb .segbtn button[aria-pressed="true"]{
  background:var(--brand);border-color:var(--brand);color:var(--on-accent);font-weight:600;
}
.dsptb .tagpick{display:flex;flex-wrap:wrap;gap:6px}
.dsptb .tagpick button{
  border:0;cursor:pointer;font-size:11px;line-height:1;padding:4px 7px;border-radius:5px;
  color:var(--label-tertiary);background:var(--interactive-bg-hover);
}
body[data-ds-dark-theme] .dsptb .tagpick button[aria-pressed="true"]{color:hsl(var(--hue) 62% 66%);background:hsl(var(--hue) 62% 55% / .16);}
.dsptb .tagpick button[aria-pressed="true"]{color:hsl(var(--hue) 58% 36%);background:hsl(var(--hue) 62% 45% / .12);}
.dsptb .sched-ed{background:var(--bg-layer-2);border:1px solid var(--border-l1);border-radius:10px;padding:10px 12px}
.dsptb .sched-top{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--label-secondary)}
.dsptb .sched-top .spacer{flex:1}
.dsptb .presets{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.dsptb .presets button{
  height:24px;padding:0 9px;border-radius:999px;font-size:12px;cursor:pointer;
  border:1px solid var(--border-l2);background:var(--input-major);color:var(--label-secondary);
}
.dsptb .presets button:hover{color:var(--label-primary)}
.dsptb .presets button[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:var(--on-accent);font-weight:600}
.dsptb .sched-ro{
  display:flex;gap:7px;align-items:flex-start;
  margin:0 0 10px;padding:8px 10px;border-radius:8px;
  font-size:12px;line-height:1.6;
  color:var(--warn-fg);background:var(--warn-bg);border:1px solid var(--warn-border);
}
.dsptb .sched-ro .ro-ico{
  flex:0 0 14px;width:14px;height:14px;margin-top:1px;border-radius:50%;
  display:grid;place-items:center;font-size:10px;font-weight:700;line-height:1;
  background:var(--warn-fg);color:var(--warn-bg);
}
.dsptb .sched-ed .presets button[disabled],.dsptb .sched-ed .switch input[disabled]{cursor:not-allowed}
.dsptb .sched-ed .switch input[disabled] + .track{opacity:.45}
.dsptb .sched-ed .presets button[disabled]{opacity:.7}
.dsptb .sched-ed input[readonly]{opacity:.75}
.dsptb .sched-tr{display:flex;align-items:baseline;gap:6px;margin-top:8px;font-size:12px;color:var(--label-secondary)}
.dsptb .sched-tr .trv{color:var(--label-primary)}
.dsptb .d-def{display:grid;grid-template-columns:62px 1fr;gap:9px 10px;font-size:13px}
.dsptb .d-def .k{font-size:12px;color:var(--label-secondary);padding-top:1px}
.dsptb .d-def .v{color:var(--label-primary);white-space:pre-wrap;word-break:break-word}
.dsptb .d-check{display:flex;flex-direction:column;gap:6px}
.dsptb .d-check .ci{display:flex;gap:7px;align-items:flex-start;font-size:13px;cursor:pointer;text-align:left;background:none;border:0;padding:0;color:inherit}
.dsptb .d-check .box{
  flex:0 0 14px;width:14px;height:14px;margin-top:2px;border-radius:4px;
  border:1px solid var(--border-l4);display:grid;place-items:center;
  font-size:10px;line-height:1;color:transparent;
}
.dsptb .d-check .ci.on .box{background:var(--brand);border-color:var(--brand);color:var(--on-accent)}
.dsptb .d-sec-head{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.dsptb .d-sec-head h3{font-size:12px;font-weight:700;color:var(--label-secondary);letter-spacing:.03em;margin:0}
.dsptb .d-sec-head button{
  margin-left:auto;background:none;border:0;padding:0;cursor:pointer;
  font-size:12px;color:var(--label-secondary);display:inline-flex;align-items:center;gap:4px;
}
.dsptb .d-sec-head button:hover{color:var(--label-primary)}
.dsptb .ws-path{
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-size:12px;color:var(--label-secondary);word-break:break-all;user-select:text;
}
.dsptb .orch{flex:1;min-height:0;display:flex;gap:12px;align-items:stretch}
.dsptb .o-list{
  flex:1;min-height:0;padding:6px;
  background:var(--bg-layer-2);border:1px solid var(--border-l1);border-radius:12px;
  overflow-y:auto;
}
.dsptb .o-item{
  position:relative;display:flex;flex-direction:column;gap:3px;width:100%;
  padding:9px 10px;border:0;border-radius:8px;background:none;text-align:left;cursor:pointer;
  color:var(--label-primary);
}
.dsptb .o-item:hover{background:var(--interactive-bg-hover)}
.dsptb .o-item.on{background:var(--interactive-bg-hover)}
.dsptb .o-item.on::before{
  content:"";position:absolute;left:0;top:8px;bottom:8px;width:2px;border-radius:0 2px 2px 0;background:var(--brand);
}
.dsptb .o-item .nm{font-size:13px;font-weight:700}
.dsptb .o-item .ds{font-size:12px;color:var(--label-secondary);line-height:1.45}
.dsptb .o-item .mt{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--label-tertiary);margin-top:1px}
.dsptb .o-item .mt .used{margin-left:auto}
.dsptb .obadge{
  font-size:11px;line-height:1;padding:3px 6px;border-radius:5px;
  background:var(--interactive-bg-hover);color:var(--label-secondary);white-space:nowrap;
}
.dsptb .obadge.br{color:var(--business-primary)}
.dsptb .o-detail{
  flex:1;min-width:0;padding:14px 16px 18px;
  background:var(--bg-layer-2);border:1px solid var(--border-l1);border-radius:12px;
  overflow-y:auto;
}
.dsptb .o-head{display:flex;align-items:flex-start;gap:12px}
.dsptb .o-head .tt{flex:1;min-width:0}
.dsptb .o-head h2{font-size:16px;font-weight:700}
.dsptb .o-head p{font-size:12px;color:var(--label-secondary);margin-top:4px}
.dsptb .orch-wrap{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:10px}
.dsptb .seg-sub{align-self:flex-start;height:26px}
.dsptb .flow-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:10px}
.dsptb .seg-sub button{height:24px;padding:0 12px;font-size:12px}
.dsptb .orch-body{flex:1;min-width:0;min-height:0;display:flex}
.dsptb .acts-count{font-size:12px;color:var(--label-tertiary)}
.dsptb .acts-count b{color:var(--label-primary);font-weight:700}
.dsptb .acts-empty{
  padding:40px 0;text-align:center;
  font-size:13px;color:var(--label-tertiary);
}
.dsptb .src-badge{
  flex:0 0 auto;font-size:10px;line-height:1;padding:3px 5px;border-radius:4px;
  border:1px solid var(--border-l2);color:var(--label-tertiary);white-space:nowrap;
}
.dsptb .src-badge.own{color:var(--business-primary);border-color:var(--business-primary)}
@keyframes dsptb-actFlash{
  0%{box-shadow:0 0 0 4px var(--business-primary)}
  100%{box-shadow:0 0 0 14px transparent}
}
.dsptb .arow.flash{animation:dsptb-actFlash 1.1s ease-out 2;border-color:var(--business-primary)}
@media (prefers-reduced-motion:reduce){.dsptb .arow.flash{animation:none;border-color:var(--business-primary);
    box-shadow:0 0 0 1px var(--business-primary)}
}
.dsptb .a-prow{
  display:grid;grid-template-columns:1fr 96px 62px 22px;align-items:center;gap:6px;
  margin-bottom:6px;
}
.dsptb .a-prow input[type="text"],.dsptb .a-prow select{height:28px;padding:0 8px;font-size:12px;border-radius:7px}
.dsptb .a-prow input[type="checkbox"]{width:13px;height:13px;accent-color:var(--brand);flex:0 0 auto}
.dsptb .a-prow .ck{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--label-secondary);cursor:pointer}
.dsptb .a-prow .del,.dsptb .f-prow .del,.dsptb .o-prow .del{
  width:22px;height:22px;border:0;border-radius:6px;background:none;color:var(--label-tertiary);
  font-size:11px;line-height:1;cursor:pointer;display:grid;place-items:center;
}
.dsptb .a-prow .del:hover,.dsptb .f-prow .del:hover,.dsptb .o-prow .del:hover{color:var(--state-error);background:var(--interactive-bg-hover)}
.dsptb .a-empty{font-size:12px;color:var(--label-tertiary)}
.dsptb .f-prow{
  display:grid;grid-template-columns:1fr 1fr 96px 22px;align-items:center;gap:6px;
  margin-bottom:6px;
}
.dsptb .f-prow input,.dsptb .f-prow select{height:28px;padding:0 8px;font-size:12px;border-radius:7px}
.dsptb .o-prow{
  display:grid;grid-template-columns:1fr 1fr 92px 54px 1fr 22px;align-items:center;gap:6px;
  margin-bottom:6px;
}
.dsptb .o-prow input,.dsptb .o-prow select{height:28px;padding:0 8px;font-size:12px;border-radius:7px}
.dsptb .o-prow .ck{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--label-secondary);cursor:pointer}
.dsptb .o-prow input[type="checkbox"]{width:13px;height:13px;accent-color:var(--brand);flex:0 0 auto}
.dsptb .o-prow input.err{border-color:var(--state-error)}
.dsptb .flow{flex:1;min-width:0;min-height:0;display:flex;gap:12px}
.dsptb .canvas{
  flex:1;min-width:0;position:relative;overflow:auto;
  background-color:var(--bg-base);
  background-image:radial-gradient(circle at 1px 1px, var(--border-l2) 1px, transparent 0);
  background-size:16px 16px;
  border:1px solid var(--border-l1);border-radius:12px;
}
.dsptb .canvas-inner{position:relative}
.dsptb .flow-edges{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
.dsptb .flow-edges path.edge{fill:none;stroke:var(--border-l4);stroke-width:1.5}
.dsptb .flow-edges path.arrow{fill:var(--border-l4);stroke:none}
.dsptb .edge-lab{
  position:absolute;transform:translate(-50%,-50%);pointer-events:none;
  font-size:11px;line-height:1;padding:3px 7px;border-radius:999px;white-space:nowrap;
  background:var(--bg-layer-3);border:1px solid var(--border-l2);color:var(--label-secondary);
}
.dsptb .node{
  position:absolute;width:176px;height:56px;
  display:flex;align-items:center;gap:7px;padding:0 11px;
  background:var(--bg-layer-2);border:1px solid var(--border-l2);border-radius:10px;
  color:var(--label-primary);font-size:12px;line-height:1.3;text-align:left;cursor:pointer;
}
.dsptb .node:hover{border-color:var(--border-l4)}
.dsptb .node.on{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand)}
.dsptb .node .cat{width:8px;height:8px;border-radius:2px;flex:0 0 8px;background:hsl(var(--hue,0) 62% 60%)}
.dsptb .node .nl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.dsptb .node.k-start,.dsptb .node.k-end{
  justify-content:center;text-align:center;border-radius:999px;
  border-color:var(--border-l3);color:var(--label-secondary);font-weight:600;
}
.dsptb .node.k-gate{border-color:var(--warn-border);box-shadow:0 0 0 1px var(--warn-border)}
.dsptb .node.k-gate .lk{flex:0 0 auto;display:flex;color:var(--warn-fg)}
.dsptb .node.k-gate.on{box-shadow:0 0 0 1px var(--warn-border),0 0 0 3px hsl(38 92% 50% / .28)}
.dsptb .node .shape{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.dsptb .node .shape polygon{fill:var(--bg-layer-2);stroke:var(--business-primary);stroke-width:1.4}
.dsptb .node.k-condition{border-color:transparent;color:var(--business-primary);background:none;padding:9px 14px 22px}
.dsptb .node.k-condition:hover{border-color:transparent}
.dsptb .node.k-condition.on{border-color:transparent;box-shadow:none}
.dsptb .node.k-condition.on .shape polygon{fill:var(--bg-layer-3);stroke-width:2}
.dsptb .node .nl{position:relative;z-index:1}
.dsptb .node .nc-expr{
  position:absolute;left:6px;right:6px;bottom:6px;z-index:1;
  font-size:11px;font-weight:400;line-height:1.2;color:var(--label-tertiary);
  text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.dsptb .node .nc-expr.nc-empty{color:var(--warn-fg)}
.dsptb .zoom{
  position:absolute;right:12px;bottom:12px;display:flex;align-items:center;
  background:var(--bg-layer-2);border:1px solid var(--border-l2);border-radius:8px;
  box-shadow:var(--shadow-card);overflow:hidden;
}
.dsptb .zoom button{
  width:26px;height:26px;display:grid;place-items:center;
  background:none;border:0;color:var(--label-tertiary);cursor:default;font-size:14px;line-height:1;
}
.dsptb .zoom .z{
  font-size:11px;color:var(--label-tertiary);padding:0 8px;height:26px;display:flex;align-items:center;
  border-left:1px solid var(--border-l1);border-right:1px solid var(--border-l1);
  font-variant-numeric:tabular-nums;
}
.dsptb .o-col{flex:0 0 280px;width:280px;display:flex;flex-direction:column;gap:8px;min-height:0}
.dsptb .o-newbar{padding:0 6px}
.dsptb .statusbar{
  flex:0 0 auto;display:flex;align-items:flex-start;gap:8px;
  padding:8px 12px;border-radius:10px;font-size:12px;line-height:1.6;
  background:var(--bg-layer-2);border:1px solid var(--border-l1);
  color:var(--label-secondary);

  max-height:160px;overflow-y:auto;
}
.dsptb .statusbar .st-dot{flex:0 0 7px;width:7px;height:7px;border-radius:50%;margin-top:6px}
.dsptb .statusbar.ok .st-dot{background:var(--state-success)}
.dsptb .statusbar.ok .st-txt{color:var(--label-primary);font-weight:600}
.dsptb .statusbar.bad .st-dot{background:var(--state-warn)}
.dsptb .statusbar.bad .st-txt{color:var(--warn-fg);font-weight:600}
.dsptb .statusbar .st-body{min-width:0}
.dsptb .statusbar .st-list{margin:2px 0 0;padding:0;list-style:none}
.dsptb .statusbar .st-list li{position:relative;padding-left:10px}
.dsptb .statusbar .st-list li::before{
  content:"·";position:absolute;left:2px;color:var(--label-tertiary);font-weight:700;
}
.dsptb .canvas-guide{
  position:absolute;left:50%;top:170px;transform:translateX(-50%);
  font-size:12px;color:var(--label-tertiary);white-space:nowrap;
  padding:7px 13px;border:1px dashed var(--border-l3);border-radius:999px;
}
.dsptb .node.has-prod{padding-bottom:17px}
.dsptb .node .nprod{
  position:absolute;left:11px;right:11px;bottom:5px;z-index:1;
  font-size:10px;font-weight:400;line-height:1.2;color:var(--label-tertiary);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.dsptb .node.k-condition .nprod{color:var(--label-tertiary);font-size:10px}
.dsptb .node.k-slot{
  justify-content:center;text-align:center;background:none;
  border-style:dashed;border-color:var(--border-l3);color:var(--label-tertiary);
}
.dsptb .node.k-slot:hover{border-color:var(--business-primary);color:var(--business-primary)}
.dsptb .node.k-slot.on{
  border-color:var(--business-primary);color:var(--business-primary);
  box-shadow:0 0 0 1px var(--business-primary);
}
.dsptb .pad-acts{display:flex;flex-direction:column;gap:7px;margin-top:16px}
.dsptb .pad-acts .btn{width:100%;justify-content:center}
.dsptb .bind-cell{display:flex;gap:6px;align-items:center}
.dsptb .bind-cell .bindin{flex:1;min-width:0}
.dsptb .ref-btn{
  flex:0 0 auto;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;
  background:none;border:1px solid var(--border-l2);color:var(--label-secondary);
  font-size:12px;line-height:1;cursor:pointer;
}
.dsptb .ref-btn:hover{border-color:var(--business-primary);color:var(--business-primary)}
.dsptb .ref-btn[aria-expanded="true"]{border-color:var(--business-primary);color:var(--business-primary)}
.dsptb .bindin.has-ref{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
  border-color:var(--business-primary);background:hsl(221 98% 67% / .10);
}
.dsptb .ref-pop{
  margin-top:5px;padding:5px;border-radius:9px;max-height:210px;overflow-y:auto;
  background:var(--bg-layer-3);border:1px solid var(--border-l3);
  display:flex;flex-direction:column;gap:2px;
}
.dsptb .ref-pop{word-break:normal}
.dsptb .ref-pop .grp{
  font-size:10px;color:var(--label-tertiary);padding:5px 8px 2px;letter-spacing:.04em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.dsptb .ref-pop .none,.dsptb .ref-pop .foot{
  font-size:11px;color:var(--label-tertiary);padding:5px 8px 6px;line-height:1.55;
}
.dsptb .ref-opt{
  display:flex;align-items:center;gap:7px;width:100%;padding:5px 8px;
  border:0;border-radius:6px;background:none;cursor:pointer;text-align:left;
  color:var(--label-primary);font-size:11px;white-space:nowrap;
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
}
.dsptb .ref-opt:hover{background:var(--interactive-bg-hover)}
.dsptb .ref-opt .from{
  margin-left:auto;flex:0 0 auto;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;
  font-size:10px;color:var(--label-tertiary);white-space:nowrap;
}
.dsptb .dd-pop.wrap .dd-opt{white-space:normal;line-height:1.45}
.dsptb .dd-note{
  min-width:230px;padding:6px 9px 5px;margin-top:2px;border-top:1px solid var(--border-l1);
  font-size:11px;line-height:1.55;color:var(--label-tertiary);white-space:normal;
  display:flex;gap:7px;align-items:flex-start;
}
.dsptb code.ph{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
  padding:1px 4px;border-radius:4px;
  background:var(--interactive-bg-hover);color:var(--business-primary);
}
.dsptb .prop{
  flex:0 0 340px;width:340px;padding:12px 14px 16px;overflow-y:auto;
  background:var(--bg-layer-2);border:1px solid var(--border-l1);border-radius:12px;
}
.dsptb .prop .hd{display:flex;align-items:center;gap:7px}
.dsptb .dot-sq{
  display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;
  vertical-align:middle;background:hsl(var(--hue,0) 62% 60%);
}
.dsptb .prop .kind{
  font-size:11px;line-height:1;padding:3px 6px;border-radius:5px;
  background:var(--interactive-bg-hover);color:var(--label-secondary);white-space:nowrap;
}
.dsptb .prop h3{font-size:14px;font-weight:700;margin:9px 0 0;line-height:1.4}
.dsptb .prop .p-sec{font-size:12px;font-weight:700;color:var(--label-secondary);letter-spacing:.03em;margin:15px 0 7px}
.dsptb .prop .p-desc{font-size:12px;color:var(--label-secondary);line-height:1.55;margin-top:5px}
.dsptb .linklike{
  background:none;border:0;padding:0;cursor:pointer;text-align:left;
  color:var(--business-primary);font-size:12px;line-height:1.5;
}
.dsptb .linklike:hover{text-decoration:underline}
.dsptb .prop .p-hint{font-size:11px;color:var(--label-tertiary);line-height:1.5;margin-top:7px}
.dsptb .bt{width:100%;border-collapse:collapse}
.dsptb .bt td{font-size:12px;padding:6px 0;border-bottom:1px solid var(--border-l1);vertical-align:top;line-height:1.5}
.dsptb .bt tr:last-child td{border-bottom:0}
.dsptb .bindin{
  width:100%;padding:4px 7px;border-radius:7px;font-size:12px;
  background:var(--input-major);border:1px solid var(--border-l2);color:var(--label-primary);
}
.dsptb .bindin::placeholder{color:var(--label-tertiary)}
.dsptb .bt td.k{width:64px;padding-right:8px;color:var(--label-secondary);white-space:nowrap}
.dsptb .bt td.v{color:var(--label-primary);word-break:break-all}
.dsptb .bt td.v .none{color:var(--label-tertiary)}
.dsptb .expr{display:flex;flex-direction:column;gap:7px}
.dsptb .expr .r{display:flex;gap:6px;align-items:center}
.dsptb .expr .r .lab{flex:0 0 34px;font-size:11px;color:var(--label-tertiary)}
.dsptb .expr .r.col{flex-direction:column;align-items:stretch;gap:5px}
.dsptb .expr .r.col .lab{flex:0 0 auto}
.dsptb .expr select,.dsptb .expr input{
  height:28px;min-width:0;border-radius:7px;font-size:12px;padding:0 8px;
  background:var(--input-major);border:1px solid var(--border-l2);color:var(--label-primary);
}
.dsptb .expr select{flex:1}
.dsptb .expr input{flex:1}
.dsptb .expr-out{
  margin-top:10px;padding:9px 10px;border-radius:8px;
  background:var(--bg-base);border:1px solid var(--border-l1);
  font-size:12px;line-height:1.6;color:var(--label-primary);
}
.dsptb .d-hint{font-size:11px;color:var(--label-tertiary);line-height:1.6;margin:0 0 8px}
.dsptb .o-path{display:flex;flex-wrap:wrap;align-items:center;gap:5px 4px;font-size:12px;line-height:1.6}
.dsptb .o-path .sep{color:var(--label-tertiary);opacity:.55}
.dsptb .o-path .pn{color:var(--label-tertiary)}
.dsptb .o-path .pn.done{color:var(--label-secondary)}
.dsptb .o-path .pn.cur{
  color:var(--label-primary);font-weight:700;
  padding:1px 7px;border-radius:6px;background:var(--interactive-bg-hover);
}
.dsptb .o-path .pn.gate{color:var(--warn-fg)}
.dsptb .g-name .clk{color:var(--label-tertiary);flex:0 0 auto}
.dsptb .g-lane{display:flex;height:28px;background:var(--bg-layer-3);border-bottom:1px solid var(--border-l2)}
.dsptb .g-lane .g-name{
  background:var(--bg-layer-3);font-size:12px;font-weight:700;
  color:var(--label-secondary);gap:7px;
}
.dsptb .g-lane .g-rest{flex:0 0 auto;background:var(--bg-layer-3)}
.dsptb .g-exec.is-trig{border-radius:1px;height:9px}
.dsptb .g-note{display:flex;align-items:center;gap:10px}
.dsptb .statusrow{flex:0 0 auto;display:flex;align-items:flex-start;gap:10px}
.dsptb .statusrow .statusbar{flex:1;min-width:0}
.dsptb .undogroup{flex:0 0 auto;display:flex;gap:6px;align-items:center}
.dsptb .undobtn{max-width:232px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;justify-content:flex-start}
.dsptb .undobtn.rd{max-width:132px}
.dsptb .drop{
  position:absolute;transform:translate(-50%,-50%);z-index:3;
  width:18px;height:18px;padding:0;border-radius:50%;
  display:grid;place-items:center;font-size:12px;line-height:1;
  background:var(--bg-layer-3);border:1px solid var(--border-l3);color:var(--label-secondary);
  cursor:pointer;
}
.dsptb .drop:hover,.dsptb .drop:focus-visible{
  border-color:var(--business-primary);color:var(--business-primary);background:var(--bg-layer-2);
}
.dsptb body.dragging{cursor:grabbing;user-select:none}
.dsptb body.dragging .drop{
  border-color:var(--business-primary);color:var(--business-primary);background:var(--bg-layer-2);
}
.dsptb body.dragging .drop.hot{
  background:var(--business-primary);border-color:var(--business-primary);color:var(--on-accent);
}
.dsptb body.dragging path.edge{stroke:var(--business-primary);opacity:.45}
.dsptb body.dragging path.arrow{fill:var(--business-primary);opacity:.45}
.dsptb body.dragging path.edge.hot{stroke:var(--business-primary);opacity:1;stroke-width:2.5}
.dsptb body.dragging path.arrow.hot{fill:var(--business-primary);opacity:1}
.dsptb body.dragging .node{cursor:grabbing}
.dsptb .node.dragging{opacity:.45;border-style:dashed}
.dsptb .drag-ghost{
  position:fixed;left:0;top:0;z-index:85;display:none;align-items:center;gap:7px;
  max-width:240px;padding:5px 9px;border-radius:7px;
  background:var(--bg-layer-2);border:1px solid var(--border-l3);
  box-shadow:var(--shadow-pop);opacity:.92;
  pointer-events:none;font-size:12px;line-height:1.25;color:var(--label-primary);
}
.dsptb .drag-ghost.on{display:flex}
.dsptb .drag-ghost .g-cat{flex:0 0 8px;width:8px;height:8px;border-radius:2px;background:hsl(var(--hue,0) 62% 60%)}
.dsptb .drag-ghost .g-cat.g-none{background:var(--label-tertiary)}
.dsptb .drag-ghost .g-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .drag-ghost .g-plus{
  display:none;position:absolute;top:-8px;right:-8px;width:17px;height:17px;border-radius:50%;
  place-items:center;background:var(--business-primary);color:var(--on-accent);
  font-size:12px;line-height:1;
}
.dsptb .drag-ghost.ok{border-color:var(--business-primary)}
.dsptb .drag-ghost.ok .g-plus{display:grid}
.dsptb .prop.acts-pane{padding:0;overflow:hidden;display:flex;flex-direction:column}
.dsptb .acts-pane .ap-head{
  flex:0 0 auto;display:flex;flex-direction:column;gap:9px;
  padding:12px 14px 10px;border-bottom:1px solid var(--border-l1);
}
.dsptb .acts-pane .ap-list{flex:1;min-height:0;overflow-y:auto;padding:6px 8px 12px}
.dsptb .acts-pane .ap-row{display:flex;align-items:center;gap:8px}
.dsptb .acts-pane .search{flex:1;min-width:0;width:auto}
.dsptb .ap-cond{padding:14px 14px 18px;overflow-y:auto}
.dsptb .ap-cond h4{font-size:13px;font-weight:700;color:var(--label-primary);margin:0 0 9px}
.dsptb .ap-cond p{font-size:12px;line-height:1.7;color:var(--label-secondary);margin:0 0 10px}
.dsptb .ap-cond p.hint{font-size:11px;line-height:1.6;color:var(--label-tertiary)}
.dsptb .ap-cond .btn{margin-top:2px}
.dsptb .prop-switch{
  display:flex;gap:2px;padding:2px;border-radius:8px;
  background:var(--input-major);border:1px solid var(--border-l2);
}
.dsptb .prop-switch button{
  flex:1;height:24px;border:0;border-radius:6px;background:none;cursor:pointer;
  font-size:12px;color:var(--label-secondary);white-space:nowrap;
}
.dsptb .prop-switch button:hover{color:var(--label-primary)}
.dsptb .prop-switch button[aria-pressed="true"]{
  background:var(--interactive-bg-hover);color:var(--label-primary);font-weight:600;
}
.dsptb .chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}
.dsptb .chips::-webkit-scrollbar{height:6px}
.dsptb .chip{
  flex:0 0 auto;height:24px;padding:0 9px;border-radius:999px;
  display:inline-flex;align-items:center;gap:5px;cursor:pointer;
  background:none;border:1px solid var(--border-l2);color:var(--label-secondary);font-size:12px;
}
.dsptb .chip:hover{color:var(--label-primary);border-color:var(--border-l3)}
.dsptb .chip[aria-pressed="true"]{
  background:var(--interactive-bg-hover);border-color:var(--label-tertiary);color:var(--label-primary);font-weight:600;
}
.dsptb .chip .sq{width:8px;height:8px;border-radius:2px;flex:0 0 8px;background:hsl(var(--hue,0) 62% 60%)}
.dsptb .chip .n{font-size:11px;color:var(--label-tertiary);font-variant-numeric:tabular-nums}
.dsptb .arow{
  display:flex;gap:8px;align-items:flex-start;width:100%;padding:7px 8px;
  border:1px solid transparent;border-radius:8px;background:none;text-align:left;
  color:var(--label-primary);cursor:pointer;
}
.dsptb .arow:hover{background:var(--interactive-bg-hover);border-color:var(--border-l2)}
.dsptb .arow .cat{flex:0 0 8px;width:8px;height:8px;border-radius:2px;margin-top:5px;background:hsl(var(--hue,0) 62% 60%)}
.dsptb .arow .tx{flex:1;min-width:0}
.dsptb .arow .l1{display:flex;align-items:center;gap:6px;min-width:0}
.dsptb .arow .nm{
  min-width:0;font-size:13px;font-weight:600;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dsptb .arow .ds{
  margin-top:3px;font-size:11px;color:var(--label-secondary);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.dsptb .arow .m{
  flex:0 0 auto;font-size:10px;line-height:1;padding:3px 5px;border-radius:4px;
  background:var(--interactive-bg-hover);color:var(--label-tertiary);white-space:nowrap;
}
.dsptb .arow .m.dead{background:none;border:1px dashed var(--border-l4)}
.dsptb .arow .m.own{color:var(--business-primary)}
.dsptb .pickband{
  display:flex;align-items:flex-start;gap:8px;
  padding:8px 10px;border-radius:10px;
  background:var(--bg-layer-3);border:1px solid var(--business-primary);
  font-size:12px;line-height:1.5;color:var(--label-primary);
}
.dsptb .pickband .pb-tx{flex:1;min-width:0}
.dsptb .pickband .pb-sub{display:block;margin-top:2px;font-size:11px;color:var(--label-secondary)}
.dsptb .pickband .btn{flex:0 0 auto;height:24px;padding:0 9px;font-size:12px}
.dsptb .pad-acts .btn.danger{color:var(--state-error);border-color:var(--state-error)}
.dsptb .pad-acts .btn.danger:hover{background:hsl(0 84% 60% / .12)}
.dsptb .toast{
  position:fixed;left:50%;bottom:28px;transform:translate(-50%,8px);
  z-index:80;
  background:var(--bg-layer-3);color:var(--label-primary);
  border:1px solid var(--border-l3);border-radius:8px;
  padding:8px 14px;font-size:13px;
  box-shadow:var(--shadow-pop);
  opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;
  max-width:80vw;
}
.dsptb .toast.show{opacity:1;transform:translate(-50%,0)}

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

/* ── 推导出来的字段（原型里是写死的样例，这里是算出来的） ────────────────
   这一节的每一块都在回答同一个问题：**这个值凭什么能信**。 */

/* 「这个值是从哪来的」。四色分得很开是故意的：用户扫一眼就得知道
   哪句话是从他自己写的东西里来的、哪句是模型编的。 */
.dsptb .src-tag{
  flex:0 0 auto;font-size:10px;line-height:1;padding:2px 5px;border-radius:4px;
  border:1px solid transparent;white-space:nowrap;
}
.dsptb .src-tag.tag-raw{color:var(--label-secondary);border-color:var(--border-l3)}
.dsptb .src-tag.tag-derived{color:var(--state-success);border-color:var(--state-success)}
.dsptb .src-tag.tag-ai{color:var(--business-primary);border-color:var(--business-primary)}
.dsptb .src-tag.tag-edited{color:var(--state-warn);border-color:var(--warn-border);background:var(--warn-bg)}

.dsptb .fblock{padding:10px 0;border-bottom:1px solid var(--border-l1)}
.dsptb .fblock:last-child{border-bottom:0}
.dsptb .fb-head{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.dsptb .fb-head .k{font-size:11px;font-weight:700;color:var(--label-secondary);letter-spacing:.03em}
.dsptb .fb-hint{font-size:11px;color:var(--label-tertiary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .fb-edit{
  margin-left:auto;font-size:11px;color:var(--label-secondary);background:none;border:0;
  cursor:pointer;padding:2px 4px;border-radius:4px;
}
.dsptb .fb-edit:hover{color:var(--label-primary);background:var(--interactive-bg-hover)}
.dsptb .fb-value{margin:0;font-size:14px;line-height:1.6}
.dsptb .fb-value.thin{color:var(--label-secondary)}
.dsptb .fb-missing{margin:0;font-size:12px;color:var(--label-tertiary);font-style:italic}
.dsptb .fb-error{
  margin:0 0 10px;padding:8px 10px;border-radius:8px;font-size:12px;line-height:1.6;
  color:var(--warn-fg);background:var(--warn-bg);border:1px solid var(--warn-border);
}
.dsptb .fb-error .thin{color:var(--label-secondary)}
.dsptb .fb-edit-area{display:flex;flex-direction:column;gap:8px}
.dsptb .fb-edit-area textarea{
  width:100%;box-sizing:border-box;padding:8px 10px;border-radius:8px;resize:vertical;
  background:var(--input-major);border:1px solid var(--border-l2);color:var(--label-primary);
  font:inherit;font-size:13px;line-height:1.6;
}
.dsptb .fb-edit-area textarea:focus{outline:none;border-color:var(--brand)}
.dsptb .fb-actions{display:flex;gap:8px}

/* 验收清单：可勾。勾的是人的判断，条目本身是账本里的事实，两者分开标。 */
.dsptb .acc-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px}
.dsptb .acc-list li{display:flex;align-items:flex-start;gap:8px;font-size:13px;line-height:1.6}
.dsptb .acc-list li label{display:flex;align-items:flex-start;gap:7px;cursor:pointer;min-width:0}
.dsptb .acc-list li input{margin:4px 0 0;flex:0 0 auto;accent-color:var(--brand)}
.dsptb .acc-list li.done span:not(.src-tag){color:var(--label-tertiary);text-decoration:line-through}
.dsptb .acc-list li .src-tag{margin-top:3px}

/* 优先级四档。中/低两档原型没有（它的样例只有高和紧急），按同一套语言补的。 */

/* p-high 的字色换成宿主**专门给警示文字**的那个令牌。原型这里用的是 --state-warn，
   那是**底色**令牌（浅色主题下是 amber-500），压在 12% 同色底上只有 2.1:1 ——
   浅色主题里那几个字几乎糊在底色上。--warn-fg 指向 state-warn-label，
   才是宿主为「琥珀色文字」准备的那一个。 */
.dsptb .prio.p-high{color:var(--warn-fg)}
.dsptb .prio.p-medium{color:var(--business-primary);background:hsl(221 98% 67% / .14)}
.dsptb .prio.p-low{color:var(--label-tertiary);background:var(--bg-layer-3)}
.dsptb .prio-row{display:inline-flex;gap:6px}
.dsptb .prio-row .prio{cursor:pointer;border:1px solid transparent;opacity:.55}
.dsptb .prio-row .prio:hover{opacity:.85}
.dsptb .prio-row .prio.on{opacity:1;border-color:currentColor}

/* 卡片上「团队 / 单轮」这类中性小标 —— 不是优先级也不是周期，别用它们那套颜色。 */
.dsptb .badge-plain{
  font-size:11px;line-height:1;padding:3px 6px;border-radius:5px;
  color:var(--label-secondary);background:var(--bg-layer-3);border:1px solid var(--border-l1);
}

/* 周期目标那条进度轨：实际跑得比应跑少时整条变琥珀，一眼看得见。 */
.dsptb .pg-track.warn .pg-fill{background:var(--state-warn)}
.dsptb .nm b.short{color:var(--state-warn)}
.dsptb .pg-sub{grid-column:1 / -1;color:var(--label-tertiary)}
.dsptb .pg-note{margin-top:6px;font-size:11px;color:var(--label-tertiary)}
.dsptb .thin{color:var(--label-tertiary);font-weight:400}

/* 排期的「只读控件」展开区。控件是真的禁用控件，不是画出来的样子。 */
.dsptb .sched-toggle{
  display:inline-flex;align-items:center;gap:5px;margin-top:10px;
  font-size:11px;color:var(--label-secondary);background:none;border:0;cursor:pointer;padding:2px 0;
}
.dsptb .sched-toggle:hover{color:var(--label-primary)}
.dsptb .sched-ro{
  margin-top:8px;padding:10px 12px;border-radius:8px;
  background:var(--bg-base);border:1px dashed var(--border-l3);
  display:flex;flex-direction:column;gap:10px;
}
.dsptb .sro-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.dsptb .sro-row .k{flex:0 0 52px;font-size:11px;color:var(--label-tertiary)}
.dsptb .sro-presets{display:flex;gap:6px;flex-wrap:wrap}
.dsptb .sched-ro .btn[disabled]{opacity:.45;cursor:not-allowed}
.dsptb .sched-ro .btn.on{border-color:var(--brand);color:var(--brand)}
.dsptb .sro-cron{
  width:170px;padding:4px 8px;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:12px;background:var(--input-major);border:1px solid var(--border-l2);color:var(--label-secondary);
}
.dsptb .sro-human{font-size:12px;color:var(--label-tertiary)}

/* 会话内容。**这不是宿主的会话页**，是我们自己画的一份只读记录：
   所以样式上刻意朴素（没有头像、没有气泡尾巴、没有工具卡片），
   一眼看得出来它跟宿主那个不是同一个东西。 */
.dsptb .tr-list{display:flex;flex-direction:column;gap:8px;max-height:420px;overflow:auto;padding-right:2px}
.dsptb .tr-line{display:flex;gap:8px;font-size:13px;line-height:1.65}
.dsptb .tr-who{
  flex:0 0 42px;font-size:10px;line-height:20px;color:var(--label-tertiary);
  text-align:right;user-select:none;
}
.dsptb .tr-body{min-width:0;white-space:pre-wrap;word-break:break-word}
/* 用户说的那几句加一道左侧的线：一屏里大部分是助手的长段文字，
   不把「人说了什么」拎出来，扫的时候找不到自己发过的话 */
.dsptb .tr-user .tr-body{
  border-left:2px solid var(--brand);padding-left:9px;color:var(--label-primary);
}
.dsptb .tr-assistant .tr-body{color:var(--label-secondary)}

/* ── 拖卡片换列 ────────────────────────────────────────────────────────
   原型里没有拖拽（它没有任何改状态的入口），这一节是接上写入口之后新加的。 */
/* 鼠标的手感。**只在能写的时候挂** —— 账本兜底读来的数据拖了也白拖，
   给出「可拖」的手感等于在骗人。 */
.dsptb .card.can-move{cursor:grab}
.dsptb .card.can-move:active{cursor:grabbing}
/* 正在拖的那张：半透明留在原地，让人还看得见它是从哪来的 */
.dsptb .card.is-dragging{opacity:.4}
/* 能放的列整列亮起来。**整列而不只是卡片区** —— 往列的空白处松手也得算数 */
.dsptb .col.drop-on{
  background:var(--interactive-bg-hover);
  box-shadow:inset 0 0 0 1px var(--brand);
  border-radius:10px;
}
/* 被拒绝的那颗提示条换个色。同一个位置、同一句话，红的是「没成」。 */
.dsptb .toast.err{border-color:var(--state-error);color:var(--state-error)}

/* 内嵌的宿主会话页。高度**必须由外面给死**：宿主那套布局是「消息区 flex:1 +
   底部输入框」，不给高度它会把自己压成一条线。所以这里是「把抽屉剩下的高度全吃掉」
   而不是写一个像素值 —— 写死 560px 的时候，抽屉越高浪费越多，而抽屉存在的理由
   恰恰是把聊天区放大。flex:1 + min-height:0 让它跟着抽屉一起长。 */
.dsptb .embed-frame{
  flex:1 1 auto;min-height:260px;display:flex;flex-direction:column;
  border:1px solid var(--border-l2);border-radius:10px;overflow:hidden;
  background:var(--bg-base);
}
/* 会话那一页不套抽屉的内边距：那一圈留白全是从聊天区身上割下来的 */
.dsptb .d-pane.is-conv{padding:12px 12px 14px;gap:0}
.dsptb .d-conv>.d-sec{padding:2px 4px 4px}

/* 「会话」那一页正在看的那一次执行，在这一列里标出来 */
.dsptb .d-ex.on{border-color:var(--brand);background:var(--bg-layer-2)}
.dsptb .d-ex .cur-mark{
  font-size:10px;line-height:1;padding:2px 5px;border-radius:4px;
  color:var(--brand);border:1px solid var(--brand);
}
`
