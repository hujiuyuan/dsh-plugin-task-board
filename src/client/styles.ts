/**
 * 全部样式，一张表，只挂一次。
 *
 * 三条规矩：
 *   1. **颜色只读宿主的 `--dsw-*` 变量**，本地一个 hex 都没有（宿主 ui-theme 的
 *      README 说死了：token 样式表是颜色值的唯一权威来源）。变量后面跟的兜底值是
 *      给「宿主的样式表还没加载」那半秒用的，不是第二套配色。
 *   2. **选择器全部挂在 `.dsptb` 下面**。我们是往别人的页面里插东西，
 *      漏出去一条 `button {…}` 就可能改掉整个宿主的按钮。
 *   3. 圆角、阴影、字号也走宿主的尺度（`--dsw-radius-*` / `--dsw-shadow-lv*` /
 *      `--dsw-font-*`），这样宿主调设计系统时我们跟着动，不用改这里。
 */

export const STYLE_ID = 'dsh-plugin-task-board-styles'

export const CSS = `
.dsptb{
  /* —— 本地别名：把宿主的语义令牌收成一组短名字，正文里只写短名字 —— */
  --tb-bg:var(--dsw-alias-bg-base,#151517);
  --tb-l1:var(--dsw-alias-bg-layer-1,#232324);
  --tb-l2:var(--dsw-alias-bg-layer-2,#2c2c2e);
  --tb-l3:var(--dsw-alias-bg-layer-3,#353638);
  --tb-fg:var(--dsw-alias-label-primary,#f9fafb);
  --tb-fg-2:var(--dsw-alias-label-secondary,#adb2b8);
  --tb-fg-3:var(--dsw-alias-label-tertiary,#979da6);
  --tb-line-1:var(--dsw-alias-border-l1,#ffffff0f);
  --tb-line-2:var(--dsw-alias-border-l2,#ffffff1f);
  --tb-line-3:var(--dsw-alias-border-l3,#ffffff29);
  --tb-hover:var(--dsw-alias-interactive-bg-hover,#ffffff14);
  --tb-brand:var(--dsw-alias-brand-primary,#4176e6);
  --tb-business:var(--dsw-alias-state-business-primary,#5686fe);
  --tb-tone-idle:var(--dsw-alias-state-idle-primary,#8a8f98);
  --tb-tone-business:var(--dsw-alias-state-business-primary,#5686fe);
  --tb-tone-warn:var(--dsw-alias-state-warn-primary,#f59e0b);
  --tb-tone-success:var(--dsw-alias-state-success-primary,#22c55e);
  --tb-tone-error:var(--dsw-alias-state-error-primary,#ef4444);
  --tb-radius:var(--dsw-radius-lg,10px);
  --tb-radius-sm:var(--dsw-radius-sm,6px);
  --tb-card-shadow:var(--dsw-shadow-lv2,0 4px 14px #00000059);
  --tb-pop-shadow:var(--dsw-shadow-lv3,0 12px 32px #00000073);
  --tb-fs-11:var(--dsw-font-xxxs-11-font-size,11px);
  --tb-fs-12:var(--dsw-font-xxs-12-font-size,12px);
  --tb-fs-13:var(--dsw-font-xs-13-font-size,13px);
  --tb-fs-14:var(--dsw-font-s-14-font-size,14px);
  --tb-lh:1.5;

  position:absolute;
  inset:0;
  display:flex;
  flex-direction:column;
  min-height:0;
  background:var(--tb-bg);
  color:var(--tb-fg);
  font-size:var(--tb-fs-13);
  line-height:var(--tb-lh);
  overflow:hidden;
}
.dsptb *,.dsptb *::before,.dsptb *::after{box-sizing:border-box}
.dsptb button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.dsptb h2,.dsptb h3,.dsptb p{margin:0;font-weight:inherit}
.dsptb ul{margin:0;padding:0;list-style:none}
.dsptb :focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--tb-brand));outline-offset:1px}

/* ── 顶栏 ───────────────────────────────────────────── */
.dsptb-bar{flex:none;display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--tb-line-1);background:var(--tb-l1)}
.dsptb-title{font-size:var(--tb-fs-14);font-weight:600;white-space:nowrap}
.dsptb-seg{display:inline-flex;gap:2px;padding:2px;border-radius:var(--tb-radius-sm);background:var(--tb-l2);border:1px solid var(--tb-line-1)}
.dsptb-seg button{padding:4px 12px;border-radius:calc(var(--tb-radius-sm) - 1px);color:var(--tb-fg-2);white-space:nowrap;transition:background .12s,color .12s}
.dsptb-seg button:hover{background:var(--tb-hover);color:var(--tb-fg)}
.dsptb-seg button[aria-pressed="true"]{background:var(--tb-l3);color:var(--tb-fg);box-shadow:var(--tb-card-shadow)}
.dsptb-bar-grow{flex:1;min-width:0}
.dsptb-src{display:flex;align-items:center;gap:6px;font-size:var(--tb-fs-11);color:var(--tb-fg-3);white-space:nowrap}
.dsptb-dot{width:6px;height:6px;border-radius:50%;flex:none}
.dsptb-dot[data-k="board"]{background:var(--tb-tone-success)}
.dsptb-dot[data-k="ledger"]{background:var(--tb-tone-warn)}
.dsptb-dot[data-k="unavailable"]{background:var(--tb-tone-error)}

/* ── 通用控件 ────────────────────────────────────────── */
.dsptb-btn{padding:4px 10px;border-radius:var(--tb-radius-sm);border:1px solid var(--tb-line-2);color:var(--tb-fg-2);white-space:nowrap;transition:background .12s,color .12s}
.dsptb-btn:hover{background:var(--tb-hover);color:var(--tb-fg)}
.dsptb-btn[disabled]{opacity:.45;cursor:not-allowed}
.dsptb-btn[data-on="true"]{background:var(--tb-l3);color:var(--tb-fg);border-color:var(--tb-line-3)}
.dsptb-input{padding:4px 8px;border-radius:var(--tb-radius-sm);border:1px solid var(--tb-line-2);background:var(--tb-l2);color:var(--tb-fg);min-width:0}
.dsptb-input::placeholder{color:var(--tb-fg-3)}
.dsptb-body{flex:1;min-height:0;display:flex;flex-direction:column}

/* ── 看板 ───────────────────────────────────────────── */
.dsptb-board{flex:1;min-height:0;display:flex;gap:12px;padding:12px 16px 16px;overflow-x:auto;overflow-y:hidden}
.dsptb-col{flex:1 1 0;min-width:240px;display:flex;flex-direction:column;min-height:0;background:var(--tb-l1);border:1px solid var(--tb-line-1);border-radius:var(--tb-radius);overflow:hidden}
.dsptb-col-head{flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--tb-line-1)}
.dsptb-col-head h3{font-size:var(--tb-fs-13);font-weight:600}
.dsptb-hdot{width:8px;height:8px;border-radius:50%;flex:none}
.dsptb-count{margin-left:auto;font-size:var(--tb-fs-11);color:var(--tb-fg-3);font-variant-numeric:tabular-nums}
.dsptb-count i{font-style:normal;color:var(--tb-fg-3);opacity:.7}
.dsptb-col-body{flex:1;min-height:0;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:8px}

.dsptb-card{position:relative;display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:var(--tb-radius-sm);background:var(--tb-l2);border:1px solid var(--tb-line-1);cursor:pointer;text-align:left;width:100%;transition:border-color .12s,background .12s}
.dsptb-card:hover{background:var(--tb-l3);border-color:var(--tb-line-2)}
.dsptb-card[data-sel="true"]{border-color:var(--tb-brand);box-shadow:0 0 0 1px var(--tb-brand)}
.dsptb-card[data-running="true"]{border-left:2px solid var(--tb-tone-warn)}
.dsptb-card-title{font-size:var(--tb-fs-13);font-weight:500;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dsptb-card-desc{font-size:var(--tb-fs-11);color:var(--tb-fg-3);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dsptb-card-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:var(--tb-fs-11);color:var(--tb-fg-3)}
.dsptb-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 6px;border-radius:999px;background:var(--tb-l3);color:var(--tb-fg-2);font-size:var(--tb-fs-11);white-space:nowrap}
.dsptb-chip[data-tone="warn"]{color:var(--tb-tone-warn)}
.dsptb-chip[data-tone="ok"]{color:var(--tb-tone-success)}
.dsptb-chip[data-tone="err"]{color:var(--tb-tone-error)}
.dsptb-chip[data-tone="brand"]{color:var(--tb-business)}
.dsptb-empty{padding:20px 12px;text-align:center;color:var(--tb-fg-3);font-size:var(--tb-fs-12)}

.dsptb-group{display:flex;align-items:center;gap:8px;padding:6px 4px 2px;font-size:var(--tb-fs-11);color:var(--tb-fg-3)}
.dsptb-group button{display:flex;align-items:center;gap:6px;color:inherit}
.dsptb-caret{display:inline-block;transition:transform .12s}
.dsptb-caret[data-open="true"]{transform:rotate(90deg)}
.dsptb-rule{flex:1;height:1px;background:var(--tb-line-1)}
.dsptb-more{display:flex;align-items:center;gap:8px;padding:6px 4px;font-size:var(--tb-fs-11);color:var(--tb-fg-3)}

/* ── 甘特 ───────────────────────────────────────────── */
.dsptb-gantt{flex:1;min-height:0;overflow:auto;padding:12px 16px 16px}
.dsptb-g-inner{position:relative;display:inline-block;min-width:100%}
.dsptb-g-head{display:flex;position:sticky;top:0;z-index:2;background:var(--tb-bg)}
.dsptb-g-corner{flex:none;width:var(--tb-namw);padding:6px 8px;font-size:var(--tb-fs-11);color:var(--tb-fg-3);border-bottom:1px solid var(--tb-line-1)}
.dsptb-g-dates{display:flex;border-bottom:1px solid var(--tb-line-1)}
.dsptb-g-cell{flex:none;text-align:center;font-size:var(--tb-fs-11);color:var(--tb-fg-3);padding:6px 0;border-left:1px solid var(--tb-line-1);font-variant-numeric:tabular-nums}
.dsptb-g-cell[data-today="true"]{color:var(--tb-fg);font-weight:600}
.dsptb-g-row{display:flex;align-items:center;height:30px}
.dsptb-g-name{flex:none;width:var(--tb-namw);display:flex;align-items:center;gap:6px;padding-right:8px;font-size:var(--tb-fs-12);overflow:hidden}
.dsptb-g-name span.ttl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb-g-name[data-child="true"]{padding-left:14px;color:var(--tb-fg-2)}
.dsptb-g-track{position:relative;flex:none;height:100%}
.dsptb-g-grid{position:absolute;inset:0;background-image:repeating-linear-gradient(to right,var(--tb-line-1) 0 1px,transparent 1px var(--tb-dayw))}
.dsptb-g-bar{position:absolute;top:7px;height:16px;border-radius:4px;background:var(--tb-tone-idle);overflow:hidden}
.dsptb-g-bar[data-s="todo"]{background:var(--tb-tone-business)}
.dsptb-g-bar[data-s="running"]{background:var(--tb-tone-warn)}
.dsptb-g-bar[data-s="done"]{background:var(--tb-tone-success)}
.dsptb-g-bar[data-s="failed"]{background:var(--tb-tone-error)}
.dsptb-g-bar::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#ffffff2e)}
.dsptb-g-exec{position:absolute;top:0;bottom:0;background:#00000059}
.dsptb-g-pulse{position:absolute;top:12px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--tb-fg);box-shadow:0 0 0 0 var(--tb-tone-warn);animation:dsptb-pulse 1.8s ease-out infinite}
@keyframes dsptb-pulse{0%{box-shadow:0 0 0 0 #f59e0bcc}70%{box-shadow:0 0 0 7px #f59e0b00}100%{box-shadow:0 0 0 0 #f59e0b00}}
.dsptb-g-today{position:absolute;width:1px;background:var(--tb-tone-error);z-index:1;pointer-events:none;opacity:.7}
.dsptb-g-lane{height:26px}
.dsptb-g-lane .dsptb-g-name{font-weight:600;font-size:var(--tb-fs-12)}
@media (prefers-reduced-motion:reduce){.dsptb-g-pulse{animation:none}}

/* ── 进度 ───────────────────────────────────────────── */
.dsptb-progress{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:12px 16px 16px}
.dsptb-panel{background:var(--tb-l1);border:1px solid var(--tb-line-1);border-radius:var(--tb-radius);padding:14px}
.dsptb-panel > h3{font-size:var(--tb-fs-13);font-weight:600;margin-bottom:10px}
.dsptb-p-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
.dsptb-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}
.dsptb-kpi{background:var(--tb-l2);border:1px solid var(--tb-line-1);border-radius:var(--tb-radius-sm);padding:10px 12px}
.dsptb-kpi b{display:block;font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.2}
.dsptb-kpi span{font-size:var(--tb-fs-11);color:var(--tb-fg-3)}
.dsptb-row{display:flex;align-items:center;gap:10px;padding:5px 0}
.dsptb-row .lbl{flex:none;width:76px;font-size:var(--tb-fs-12);color:var(--tb-fg-2)}
/* 进度条。**不能叫 .dsptb-bar**——顶栏已经占了这个名字，两条规则撞在一起，
   后写的那条会把顶栏压成一根 8px 的胶囊（真发生过，靠实测抓出来的）。 */
.dsptb-pbar{flex:1;height:8px;border-radius:999px;background:var(--tb-l3);overflow:hidden;display:flex}
.dsptb-pbar i{height:100%;display:block}
.dsptb-row .num{flex:none;width:74px;text-align:right;font-size:var(--tb-fs-11);color:var(--tb-fg-3);font-variant-numeric:tabular-nums}
.dsptb-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:var(--tb-fs-11);color:var(--tb-fg-3);margin-top:10px}
.dsptb-legend span{display:inline-flex;align-items:center;gap:5px}

/* ── 抽屉 ───────────────────────────────────────────── */
.dsptb-scrim{position:absolute;inset:0;background:#00000052;z-index:8}
.dsptb-drawer{position:absolute;top:0;right:0;bottom:0;width:min(720px,72%);display:flex;flex-direction:column;background:var(--tb-l1);border-left:1px solid var(--tb-line-2);box-shadow:var(--tb-pop-shadow);z-index:9}
.dsptb-dr-head{flex:none;display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--tb-line-1)}
.dsptb-dr-head h3{font-size:var(--tb-fs-14);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb-tabs{flex:none;display:flex;gap:2px;padding:0 14px;border-bottom:1px solid var(--tb-line-1)}
.dsptb-tabs button{padding:8px 10px;color:var(--tb-fg-3);border-bottom:2px solid transparent;font-size:var(--tb-fs-12);white-space:nowrap}
.dsptb-tabs button:hover{color:var(--tb-fg)}
.dsptb-tabs button[aria-selected="true"]{color:var(--tb-fg);border-bottom-color:var(--tb-brand)}
.dsptb-dr-body{flex:1;min-height:0;overflow-y:auto;padding:14px}
.dsptb-field{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}
.dsptb-field > b{font-size:var(--tb-fs-11);font-weight:500;color:var(--tb-fg-3)}
.dsptb-field > p,.dsptb-field > pre{font-size:var(--tb-fs-12);color:var(--tb-fg-2);white-space:pre-wrap;word-break:break-word}
.dsptb-field > pre{margin:0;font-family:var(--dsh-font-mono,ui-monospace,SFMono-Regular,Menlo,monospace);background:var(--tb-l2);border:1px solid var(--tb-line-1);border-radius:var(--tb-radius-sm);padding:10px;max-height:280px;overflow:auto}
.dsptb-tree{display:flex;flex-direction:column;gap:2px}
.dsptb-tree-row{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:var(--tb-radius-sm);font-size:var(--tb-fs-12);text-align:left;width:100%}
.dsptb-tree-row:hover{background:var(--tb-hover)}
.dsptb-srow{display:flex;align-items:center;gap:10px;padding:7px 6px;border-bottom:1px solid var(--tb-line-1);font-size:var(--tb-fs-12)}
.dsptb-srow:last-child{border-bottom:0}
.dsptb-srow .when{flex:none;width:108px;color:var(--tb-fg-3);font-variant-numeric:tabular-nums}
.dsptb-srow .dur{flex:none;width:80px;color:var(--tb-fg-3);text-align:right;font-variant-numeric:tabular-nums}
.dsptb-note{font-size:var(--tb-fs-11);color:var(--tb-fg-3);padding:8px 10px;border:1px dashed var(--tb-line-2);border-radius:var(--tb-radius-sm);margin-bottom:12px}

/* ── 空 / 错误态 ────────────────────────────────────── */
.dsptb-blank{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 20px;text-align:center;color:var(--tb-fg-3)}
.dsptb-blank h3{font-size:var(--tb-fs-14);font-weight:600;color:var(--tb-fg-2)}
.dsptb-blank code{font-family:var(--dsh-font-mono,ui-monospace,Menlo,monospace);font-size:var(--tb-fs-11);color:var(--tb-fg-2);background:var(--tb-l2);padding:2px 6px;border-radius:4px;word-break:break-all}
`
