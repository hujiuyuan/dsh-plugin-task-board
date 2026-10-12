window.__ModuleLoader__.load({ id: 'dsh-plugin-task-board', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  PANEL_ID: () => PANEL_ID,
  PANEL_ORDER: () => PANEL_ORDER,
  PlanPanelIcon: () => PlanPanelIcon,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// src/client/styles.ts
var STYLE_ID = "dsh-plugin-task-board-styles";
var CSS = `
.dsptb{
  /* \u2014\u2014 \u672C\u5730\u522B\u540D\uFF1A\u628A\u5BBF\u4E3B\u7684\u8BED\u4E49\u4EE4\u724C\u6536\u6210\u4E00\u7EC4\u77ED\u540D\u5B57\uFF0C\u6B63\u6587\u91CC\u53EA\u5199\u77ED\u540D\u5B57 \u2014\u2014 */
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

  /* position:relative \u800C**\u4E0D\u662F** absolute/inset:0\u3002
     \u5BBF\u4E3B\u7684\u4E2D\u592E\u680F\u5DF2\u7ECF\u7BA1\u597D\u4E86\u8FD9\u4E2A\u9762\u677F\u7684\u4F4D\u7F6E\u548C\u5C3A\u5BF8\uFF08\u5916\u58F3\u628A main \u5EA7\u4F4D\u6302\u8FDB\u53BB\uFF0C
     \u90A3\u4E00\u5217\u81EA\u5DF1\u5C31\u662F\u5B9A\u4F4D\u4E0A\u4E0B\u6587\uFF09\u3002\u5199\u6210 absolute \u7684\u540E\u679C\u662F\uFF1A\u627E\u4E0D\u5230\u5B9A\u4F4D\u7956\u5148\u65F6
     \u5B83\u4F1A\u4EE5**\u89C6\u53E3**\u4E3A\u57FA\u51C6\u94FA\u6EE1\u6574\u4E2A\u7A97\u53E3\uFF0C\u628A\u4FA7\u8FB9\u680F\u548C macOS \u5DE6\u4E0A\u89D2\u90A3\u4E09\u4E2A\u7A97\u53E3\u6309\u94AE
     \u4E00\u8D77\u76D6\u4F4F\u2014\u2014\u7528\u6237\u65E2\u56DE\u4E0D\u53BB\u4E5F\u70B9\u4E0D\u5230\u5173\u95ED\u3002\u8FD9\u662F\u771F\u51FA\u8FC7\u7684\u4E8B\u6545\uFF0C\u4E0D\u662F\u7406\u8BBA\u98CE\u9669\u3002 */
  position:relative;
  display:flex;
  flex-direction:column;
  width:100%;
  height:100%;
  min-width:0;
  min-height:0;
  background:var(--tb-bg);
  color:var(--tb-fg);
  font-size:var(--tb-fs-13);
  line-height:var(--tb-lh);
  overflow:hidden;
  /* \u4E0D\u989D\u5916\u7559 --dsh-frame-top-clearance\uFF1A\u7EA2\u9EC4\u7EFF\u4E09\u4E2A\u6309\u94AE\u6D6E\u5728**\u4FA7\u8FB9\u680F**\u4E0A\u65B9\uFF0C
     \u800C\u8FD9\u4E00\u680F\u5728\u4FA7\u8FB9\u680F\u53F3\u8FB9\uFF0C\u672C\u6765\u5C31\u591F\u4E0D\u7740\u5B83\u4EEC\u3002\u771F\u53BB\u7559 48px \u7684\u8BDD\uFF0C
     \u5E38\u89C1\u60C5\u51B5\u4E0B\u53EA\u662F\u767D\u767D\u591A\u51FA\u4E00\u6761\u7F1D\u3002 */
}
.dsptb *,.dsptb *::before,.dsptb *::after{box-sizing:border-box}
.dsptb button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.dsptb h2,.dsptb h3,.dsptb p{margin:0;font-weight:inherit}
.dsptb ul{margin:0;padding:0;list-style:none}
.dsptb :focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--tb-brand));outline-offset:1px}

/* \u2500\u2500 \u9876\u680F \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
/* \u5DE6\u5185\u8FB9\u8DDD\u8DDF\u7740\u5BBF\u4E3B\u7684\u300C\u524D\u5BFC\u7559\u767D\u300D\u53D8\u91CF\u8D70\uFF1A\u4FA7\u8FB9\u680F\u5C55\u5F00\u65F6\u8FD9\u4E2A\u53D8\u91CF\u662F 0\uFF08\u7B97\u51FA\u6765\u8FD8\u662F 0\uFF0C
   \u4E0D\u4EA7\u751F\u4EFB\u4F55\u591A\u4F59\u7F1D\u9699\uFF09\uFF0C\u4FA7\u8FB9\u680F\u4E00\u6536\u8D77\u6765\u5BBF\u4E3B\u628A\u5B83\u8BBE\u6210 160px\uFF0C\u8FD9\u4E00\u6761\u5C31\u81EA\u52A8\u628A
   \u5DE6\u4E0A\u89D2\u90A3\u4E09\u4E2A\u7A97\u53E3\u6309\u94AE\u8BA9\u51FA\u6765\u3002\u516C\u5F0F\u6284\u7684\u662F\u5BBF\u4E3B\u4F1A\u8BDD\u9875\u81EA\u5DF1\u7684\u5199\u6CD5\u3002 */
.dsptb-bar{flex:none;display:flex;align-items:center;gap:12px;padding:10px 16px 10px max(16px,calc(var(--dsh-frame-leading-clearance,0px) + 16px));border-bottom:1px solid var(--tb-line-1);background:var(--tb-l1)}
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

/* \u2500\u2500 \u901A\u7528\u63A7\u4EF6 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.dsptb-btn{padding:4px 10px;border-radius:var(--tb-radius-sm);border:1px solid var(--tb-line-2);color:var(--tb-fg-2);white-space:nowrap;transition:background .12s,color .12s}
.dsptb-btn:hover{background:var(--tb-hover);color:var(--tb-fg)}
.dsptb-btn[disabled]{opacity:.45;cursor:not-allowed}
.dsptb-btn[data-on="true"]{background:var(--tb-l3);color:var(--tb-fg);border-color:var(--tb-line-3)}
.dsptb-input{padding:4px 8px;border-radius:var(--tb-radius-sm);border:1px solid var(--tb-line-2);background:var(--tb-l2);color:var(--tb-fg);min-width:0}
.dsptb-input::placeholder{color:var(--tb-fg-3)}
.dsptb-body{flex:1;min-height:0;display:flex;flex-direction:column}

/* \u2500\u2500 \u770B\u677F \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 \u7518\u7279 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 \u8FDB\u5EA6 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
/* \u8FDB\u5EA6\u6761\u3002**\u4E0D\u80FD\u53EB .dsptb-bar**\u2014\u2014\u9876\u680F\u5DF2\u7ECF\u5360\u4E86\u8FD9\u4E2A\u540D\u5B57\uFF0C\u4E24\u6761\u89C4\u5219\u649E\u5728\u4E00\u8D77\uFF0C
   \u540E\u5199\u7684\u90A3\u6761\u4F1A\u628A\u9876\u680F\u538B\u6210\u4E00\u6839 8px \u7684\u80F6\u56CA\uFF08\u771F\u53D1\u751F\u8FC7\uFF0C\u9760\u5B9E\u6D4B\u6293\u51FA\u6765\u7684\uFF09\u3002 */
.dsptb-pbar{flex:1;height:8px;border-radius:999px;background:var(--tb-l3);overflow:hidden;display:flex}
.dsptb-pbar i{height:100%;display:block}
.dsptb-row .num{flex:none;width:74px;text-align:right;font-size:var(--tb-fs-11);color:var(--tb-fg-3);font-variant-numeric:tabular-nums}
.dsptb-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:var(--tb-fs-11);color:var(--tb-fg-3);margin-top:10px}
.dsptb-legend span{display:inline-flex;align-items:center;gap:5px}

/* \u2500\u2500 \u62BD\u5C49 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 \u7A7A / \u9519\u8BEF\u6001 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.dsptb-blank{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:40px 20px;text-align:center;color:var(--tb-fg-3)}
.dsptb-blank h3{font-size:var(--tb-fs-14);font-weight:600;color:var(--tb-fg-2)}
.dsptb-blank code{font-family:var(--dsh-font-mono,ui-monospace,Menlo,monospace);font-size:var(--tb-fs-11);color:var(--tb-fg-2);background:var(--tb-l2);padding:2px 6px;border-radius:4px;word-break:break-all}
`;

// src/client/data.ts
var import_react = require("react");
var LEDGER_URL = "/api/dsh-plugin-task-board/ledger";
var SERVICE_GRACE_MS = 4e3;
function readFace(ctx) {
  try {
    const face = ctx.get("taskBoard");
    if (face === void 0 || face === null) return void 0;
    if (typeof face.snapshot !== "function" || typeof face.subscribe !== "function") return void 0;
    return face;
  } catch {
    return void 0;
  }
}
async function fetchLedger(signal) {
  try {
    const response = await fetch(LEDGER_URL, { signal, headers: { accept: "application/json" } });
    if (!response.ok) {
      return { kind: "unavailable", tasks: [], reason: "ledger-http", detail: `HTTP ${response.status}`, at: Date.now() };
    }
    const body = await response.json();
    if (!body.ok) {
      return {
        kind: "unavailable",
        tasks: [],
        reason: body.reason ?? "ledger-unavailable",
        detail: body.detail,
        path: body.path,
        at: Date.now()
      };
    }
    return {
      kind: "ledger",
      tasks: body.tasks ?? [],
      path: body.path,
      at: body.readAt ?? Date.now()
    };
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return { kind: "unavailable", tasks: [], reason: "ledger-unreachable", detail: String(error), at: Date.now() };
  }
}
function useTaskSource(ctx) {
  const [snapshot, setSnapshot] = (0, import_react.useState)(() => ({ kind: "unavailable", tasks: [], reason: "starting", at: 0 }));
  const [refreshing, setRefreshing] = (0, import_react.useState)(false);
  const sawBoard = (0, import_react.useRef)(false);
  const [tick, setTick] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    let disposed = false;
    const abort = new AbortController();
    let unsubscribe;
    let graceTimer;
    const attach = () => {
      const face = readFace(ctx);
      if (face === void 0) return false;
      sawBoard.current = true;
      const publish = (mirror) => {
        if (disposed) return;
        setSnapshot({ kind: "board", tasks: [...mirror.tasks], boardEnabled: mirror.enabled, at: Date.now() });
      };
      try {
        publish(face.snapshot());
        unsubscribe = face.subscribe(publish);
      } catch (error) {
        sawBoard.current = false;
        setSnapshot({ kind: "unavailable", tasks: [], reason: "board-face-error", detail: String(error), at: Date.now() });
        return false;
      }
      return true;
    };
    const fallback = async () => {
      if (disposed || sawBoard.current) return;
      const next = await fetchLedger(abort.signal);
      if (disposed || sawBoard.current) return;
      setSnapshot(next);
    };
    if (!attach()) {
      void fallback();
      graceTimer = setTimeout(() => {
        if (!disposed && !sawBoard.current) void fallback();
      }, SERVICE_GRACE_MS);
    }
    const onService = (name2) => {
      if (disposed) return;
      if (name2 !== "taskBoard" || sawBoard.current) return;
      if (graceTimer !== void 0) clearTimeout(graceTimer);
      attach();
    };
    try {
      ctx.on?.("internal/service", onService);
    } catch {
    }
    return () => {
      disposed = true;
      abort.abort();
      if (graceTimer !== void 0) clearTimeout(graceTimer);
      unsubscribe?.();
      try {
        ctx.off?.("internal/service", onService);
      } catch {
      }
    };
  }, [ctx, tick]);
  const refresh = (0, import_react.useCallback)(() => {
    if (sawBoard.current) return;
    setRefreshing(true);
    setTick((value) => value + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);
  return (0, import_react.useMemo)(() => ({ snapshot, refresh, refreshing }), [snapshot, refresh, refreshing]);
}

// src/client/views/Panel.tsx
var import_react6 = require("react");

// src/client/model.ts
function buildIndex(tasks) {
  const all = tasks.slice();
  const byId = /* @__PURE__ */ new Map();
  for (const task of all) byId.set(task.id, task);
  const childrenOf = /* @__PURE__ */ new Map();
  for (const task of all) {
    if (task.parentId === void 0) continue;
    const bucket = childrenOf.get(task.parentId);
    if (bucket === void 0) childrenOf.set(task.parentId, [task]);
    else bucket.push(task);
  }
  for (const bucket of childrenOf.values()) bucket.sort(byCreatedAsc);
  const onBoard = all.filter(isOnBoard);
  const roots = onBoard.filter((task) => task.parentId === void 0 || !byId.has(task.parentId));
  roots.sort(byCreatedAsc);
  return { onBoard, all, byId, childrenOf, roots };
}
function isOnBoard(task) {
  return task.archivedAt === void 0 && task.hidden !== true;
}
function byCreatedAsc(a, b) {
  return a.createdAt - b.createdAt;
}
function subtreeOf(index, root) {
  const out = [];
  const walk = (task) => {
    out.push(task);
    for (const child of index.childrenOf.get(task.id) ?? []) walk(child);
  };
  walk(root);
  return out;
}
function rollupOf(index, root) {
  const subtree = subtreeOf(index, root);
  const byStatus = { backlog: 0, todo: 0, running: 0, done: 0, failed: 0 };
  let runs = 0;
  for (let i = 1; i < subtree.length; i += 1) {
    byStatus[subtree[i].status] += 1;
    runs += subtree[i].executions.length;
  }
  return { total: subtree.length - 1, byStatus, runs };
}
function lastExecution(task) {
  return task.executions.length === 0 ? void 0 : task.executions[task.executions.length - 1];
}
function isRunning(task) {
  const last = lastExecution(task);
  return last !== void 0 && last.endedAt === void 0;
}
function spanEnd(task, now) {
  let end = task.createdAt;
  for (const execution of task.executions) {
    const stop = execution.endedAt ?? now;
    if (stop > end) end = stop;
  }
  return end;
}
function triggerOf(execution) {
  return execution.initiatedBy === void 0 ? "schedule" : "manual";
}
function outcomeLabel(execution) {
  if (execution.endedAt === void 0) return "\u8FDB\u884C\u4E2D";
  switch (execution.result) {
    case "succeeded":
      return "\u6210\u529F";
    case "failed":
      return "\u5931\u8D25";
    case "cancelled":
      return "\u5DF2\u53D6\u6D88";
    default:
      return "\u5DF2\u7ED3\u675F";
  }
}
function durationOf(execution, now) {
  return (execution.endedAt ?? now) - execution.startedAt;
}
function humanDuration(ms) {
  if (ms < 0) return "\u2014";
  const sec = Math.round(ms / 1e3);
  if (sec < 60) return `${sec} \u79D2`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} \u5206\u949F`;
  const hour = Math.floor(min / 60);
  const rest = min % 60;
  if (hour < 24) return rest === 0 ? `${hour} \u5C0F\u65F6` : `${hour} \u5C0F\u65F6 ${rest} \u5206`;
  const day = Math.floor(hour / 24);
  const restHour = hour % 24;
  return restHour === 0 ? `${day} \u5929` : `${day} \u5929 ${restHour} \u5C0F\u65F6`;
}
function dayKey(ms) {
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
function groupByDay(tasks) {
  const buckets = /* @__PURE__ */ new Map();
  for (const task of tasks) {
    const key = dayKey(task.updatedAt);
    const bucket = buckets.get(key);
    if (bucket === void 0) buckets.set(key, [task]);
    else bucket.push(task);
  }
  return [...buckets.entries()].map(([key, items]) => {
    items.sort((a, b) => b.updatedAt - a.updatedAt);
    const weekday = (/* @__PURE__ */ new Date(`${key}T12:00:00`)).getDay();
    return { key, items, weekend: weekday === 0 || weekday === 6 };
  }).sort((a, b) => a.key < b.key ? 1 : -1);
}
function shortTime(ms, now) {
  const date = new Date(ms);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  if (dayKey(ms) === dayKey(now)) return `${hh}:${mm}`;
  if (date.getFullYear() === new Date(now).getFullYear()) {
    return `${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`;
  }
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`;
}
function every(count) {
  const match = /^\*\/(\d+)$/.exec(count.trim());
  if (match === null) return void 0;
  const value = Number(match[1]);
  return value > 0 ? value : void 0;
}
function humanCron(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [min, hour, dom, , dow] = parts;
  const everyMin = every(min);
  const everyHour = every(hour);
  if (everyMin !== void 0 && hour === "*") return everyMin === 1 ? "\u6BCF\u5206\u949F" : `\u6BCF ${everyMin} \u5206\u949F`;
  if (everyHour !== void 0 && dom === "*" && dow === "*") {
    const base = everyHour === 1 ? "\u6BCF\u5C0F\u65F6" : `\u6BCF ${everyHour} \u5C0F\u65F6`;
    return min === "*" ? base : /^\d+$/.test(min) ? `${base}\u7684\u7B2C ${min} \u5206` : base;
  }
  if (min === "*" && hour === "*") return "\u6BCF\u5206\u949F";
  if (hour === "*" && /^\d+$/.test(min)) return `\u6BCF\u5C0F\u65F6\u7684\u7B2C ${min} \u5206`;
  if (/^\d+$/.test(min) && /^\d+$/.test(hour)) {
    const clock = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    if (dom === "*" && dow === "*") return `\u6BCF\u5929 ${clock}`;
    if (dom !== "*" && dow === "*") return `\u6BCF\u6708 ${dom} \u65E5 ${clock}`;
    if (dom === "*" && dow !== "*") return `\u6BCF\u5468${"\u65E5\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D"[Number(dow)] ?? `(${dow})`} ${clock}`;
    return `${clock}\uFF08${cron}\uFF09`;
  }
  return cron;
}

// src/client/views/Board.tsx
var import_react2 = require("react");

// src/client/tokens.ts
var STATUS_ORDER = ["backlog", "todo", "running", "done", "failed"];
var STATUS = {
  backlog: {
    label: "\u5F85\u89C4\u5212",
    desc: "\u8FD8\u6CA1\u60F3\u6E05\u695A\u8981\u505A\u4EC0\u4E48",
    tone: "var(--dsw-alias-state-idle-primary)",
    varName: "--tb-tone-idle"
  },
  todo: {
    label: "\u5F85\u529E",
    desc: "\u60F3\u6E05\u695A\u4E86\uFF0C\u7B49\u4E00\u4E2A\u6267\u884C\u8005",
    tone: "var(--dsw-alias-state-business-primary)",
    varName: "--tb-tone-business"
  },
  running: {
    label: "\u8FDB\u884C\u4E2D",
    desc: "\u6709\u4E00\u4E2A\u6267\u884C\u8005\u6B63\u5728\u8DD1",
    tone: "var(--dsw-alias-state-warn-primary)",
    varName: "--tb-tone-warn"
  },
  done: {
    label: "\u5DF2\u5B8C\u6210",
    desc: "\u8DD1\u5B8C\u4E86\uFF0C\u7ED3\u679C\u662F\u6210\u529F\u7684",
    tone: "var(--dsw-alias-state-success-primary)",
    varName: "--tb-tone-success"
  },
  failed: {
    label: "\u5DF2\u5931\u8D25",
    desc: "\u8DD1\u5B8C\u4E86\uFF0C\u7ED3\u679C\u662F\u5931\u8D25\u7684",
    tone: "var(--dsw-alias-state-error-primary)",
    varName: "--tb-tone-error"
  }
};

// src/client/views/Board.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var GROUP_PAGE = 3;
function Board({ index, now, query, selectedId, onSelect }) {
  const [page, setPage] = (0, import_react2.useState)(0);
  const [groupOverride, setGroupOverride] = (0, import_react2.useState)(() => /* @__PURE__ */ new Map());
  const normalized = query.trim().toLowerCase();
  const filtering = normalized.length > 0;
  (0, import_react2.useEffect)(() => setPage(0), [normalized]);
  const columns = (0, import_react2.useMemo)(() => {
    const out = { backlog: [], todo: [], running: [], done: [], failed: [] };
    for (const task of index.roots) {
      if (filtering && !haystack(task).includes(normalized)) continue;
      out[task.status].push(task);
    }
    for (const status of STATUS_ORDER) {
      if (status === "done" || status === "failed") {
        out[status].sort((a, b) => b.updatedAt - a.updatedAt);
      } else {
        out[status].sort((a, b) => b.createdAt - a.createdAt);
      }
    }
    return out;
  }, [index.roots, filtering, normalized]);
  const allCount = (0, import_react2.useMemo)(() => {
    const out = { backlog: 0, todo: 0, running: 0, done: 0, failed: 0 };
    for (const task of index.roots) out[task.status] += 1;
    return out;
  }, [index.roots]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsptb-board", children: STATUS_ORDER.map((status) => {
    const meta = STATUS[status];
    const items = columns[status];
    const dated = (status === "done" || status === "failed") && !filtering;
    const days = dated ? groupByDay(items) : void 0;
    const shown = days?.slice(0, page * GROUP_PAGE + GROUP_PAGE) ?? [];
    const rest = days?.slice(shown.length) ?? [];
    const restCount = rest.reduce((sum, group) => sum + group.items.length, 0);
    const restWorkdays = rest.filter((group) => !group.weekend).length;
    const filtered = filtering && items.length !== allCount[status];
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsptb-col", "aria-label": meta.label, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsptb-col-head", title: `${meta.label}
${meta.desc}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-hdot", style: { background: meta.tone } }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: meta.label }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsptb-count", children: [
          items.length,
          filtered ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("i", { children: [
            "/",
            allCount[status]
          ] }) : null
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsptb-col-body", children: items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsptb-empty", children: filtering ? "\u8FD9\u4E00\u5217\u6CA1\u6709\u547D\u4E2D\u7684\u4EFB\u52A1" : "\u8FD9\u4E2A\u72B6\u6001\u8FD8\u6CA1\u6709\u4EFB\u52A1" }) : days === void 0 ? items.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { task, index, now, selectedId, onSelect }, task.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        shown.map((group, groupIndex) => {
          const key = `${status}:${group.key}`;
          const open = groupOverride.get(key) ?? groupIndex === 0;
          return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsptb-group", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "button",
                {
                  type: "button",
                  "aria-expanded": open,
                  onClick: () => setGroupOverride((current) => {
                    const next = new Map(current);
                    next.set(key, !open);
                    return next;
                  }),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-caret", "data-open": open ? "true" : "false", "aria-hidden": "true", children: "\u25B8" }),
                    group.key === dayKeyOf(now) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-hdot", style: { background: "var(--tb-brand)" }, title: "\u4ECA\u5929" }) : null,
                    groupLabel(group.key, now),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-count", children: group.items.length })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-rule" })
            ] }),
            open ? group.items.map((task) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { task, index, now, selectedId, onSelect }, task.id)) : null
          ] }, group.key);
        }),
        rest.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsptb-more", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            restWorkdays > 0 ? `\u8FD8\u6709 ${restWorkdays} \u4E2A\u5DE5\u4F5C\u65E5 \xB7 ` : "\u8FD8\u6709 ",
            restCount,
            " \u9879\u6CA1\u663E\u793A"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsptb-btn", onClick: () => setPage((value) => value + 1), children: "\u66F4\u591A" })
        ] }) : null
      ] }) })
    ] }, status);
  }) });
}
function haystack(task) {
  return [task.title, task.description, ...(task.tags ?? []).map((tag) => tag.name)].join("\n").toLowerCase();
}
function dayKeyOf(now) {
  const date = new Date(now);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
function groupLabel(key, now) {
  const date = /* @__PURE__ */ new Date(`${key}T12:00:00`);
  const weekday = "\u65E5\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D"[date.getDay()];
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  const base = `${date.getMonth() + 1} \u6708 ${date.getDate()} \u65E5`;
  return `${sameYear ? base : `${date.getFullYear()} \u5E74 ${base}`} \u5468${weekday}`;
}
function Card({ task, index, now, selectedId, onSelect }) {
  const rollup = (0, import_react2.useMemo)(() => rollupOf(index, task), [index, task]);
  const last = lastExecution(task);
  const running = isRunning(task);
  const tags = task.tags ?? [];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "button",
    {
      type: "button",
      className: "dsptb-card",
      "data-sel": task.id === selectedId ? "true" : "false",
      "data-running": running ? "true" : "false",
      onClick: () => onSelect(task),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-card-title", children: task.title }),
        task.description.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-card-desc", children: task.description }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsptb-card-meta", children: [
          rollup.total > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsptb-chip", "data-tone": rollup.byStatus.done === rollup.total ? "ok" : void 0, children: [
            "\u5B50\u4EFB\u52A1 ",
            rollup.byStatus.done,
            "/",
            rollup.total
          ] }) : null,
          task.schedule !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              className: "dsptb-chip",
              "data-tone": task.schedule.enabled ? "brand" : void 0,
              title: task.schedule.enabled ? `\u5B9A\u65F6\u5DF2\u542F\u7528
${task.schedule.cron}` : `\u5B9A\u65F6\u5DF2\u5173\uFF08\u89C4\u5219\u8FD8\u5728\uFF1A${task.schedule.cron}\uFF09`,
              children: task.schedule.enabled ? "\u5B9A\u65F6" : "\u5B9A\u65F6\u5DF2\u5173"
            }
          ) : null,
          task.teamRun === true ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-chip", title: "\u8FD9\u4E00\u6574\u4E2A\u5B50\u6811\u6309 Agent Team \u8DD1", children: "\u56E2\u961F" }) : null,
          task.goalRun === false ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-chip", title: "\u8FD9\u4E2A\u4EFB\u52A1\u53EA\u8DD1\u4E00\u8F6E\uFF0C\u4E0D\u542F /goal", children: "\u5355\u8F6E" }) : null,
          task.executions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            task.executions.length,
            " \u6B21\u6267\u884C"
          ] }) : null,
          last !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { title: running ? "\u6B64\u523B\u6709\u4EBA\u5728\u8DD1" : `\u6700\u540E\u4E00\u6B21\u5F00\u59CB\u4E8E ${new Date(last.startedAt).toLocaleString()}`, children: running ? "\u6B63\u5728\u8DD1" : `${shortTime(last.startedAt, now)} \u8DD1\u8FC7` }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            shortTime(task.createdAt, now),
            " \u5EFA\u7684"
          ] })
        ] }),
        tags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-card-meta", children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsptb-chip", title: tag.promptPrefix ?? void 0, children: tag.name }, tag.name)) }) : null
      ]
    }
  );
}

// src/client/views/Drawer.tsx
var import_react3 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function Drawer({ task, index, now, onClose, onNavigate, onOpenSession }) {
  const [tab, setTab] = (0, import_react3.useState)("goal");
  const rollup = (0, import_react3.useMemo)(() => rollupOf(index, task), [index, task]);
  const children = index.childrenOf.get(task.id) ?? [];
  const parent = task.parentId === void 0 ? void 0 : index.byId.get(task.parentId);
  const last = lastExecution(task);
  const running = isRunning(task);
  const sessionId = last?.sessionId;
  const [copied, setCopied] = (0, import_react3.useState)(false);
  const openSession = () => {
    if (sessionId === void 0) return;
    if (onOpenSession(sessionId)) return;
    void navigator.clipboard?.writeText(sessionId).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsptb-scrim", onClick: onClose, "aria-hidden": "true" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("aside", { className: "dsptb-drawer", role: "dialog", "aria-label": `\u4EFB\u52A1\u8BE6\u60C5\uFF1A${task.title}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-dr-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsptb-hdot", style: { background: STATUS[task.status].tone, flex: "none" } }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { title: task.title, children: task.title }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { marginLeft: "auto", display: "flex", gap: 6, flex: "none" }, children: [
          sessionId !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsptb-btn", onClick: openSession, title: sessionId, children: copied ? "\u4F1A\u8BDD id \u5DF2\u590D\u5236" : "\u6253\u5F00\u4F1A\u8BDD" }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "dsptb-btn", onClick: onClose, "aria-label": "\u5173\u95ED", children: "\u5173\u95ED" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-tabs", role: "tablist", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(TabButton, { id: "goal", current: tab, onPick: setTab, children: "\u4EFB\u52A1\u76EE\u6807" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(TabButton, { id: "subtasks", current: tab, onPick: setTab, children: [
          "\u5B50\u4EFB\u52A1",
          rollup.total > 0 ? ` ${rollup.byStatus.done}/${rollup.total}` : ""
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(TabButton, { id: "schedule", current: tab, onPick: setTab, children: [
          "\u5B9A\u65F6\u5386\u53F2",
          task.executions.length > 0 ? ` ${task.executions.length}` : ""
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-dr-body", children: [
        tab === "goal" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          parent !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-note", children: [
            "\u8FD9\u662F\u5B50\u4EFB\u52A1\uFF0C\u5C5E\u4E8E",
            " ",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "button",
              {
                type: "button",
                onClick: () => onNavigate(parent),
                style: { textDecoration: "underline", color: "var(--tb-business)" },
                children: parent.title
              }
            ),
            "\uFF08",
            STATUS[parent.status].label,
            "\uFF09"
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u72B6\u6001" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
              STATUS[task.status].label,
              " \xB7",
              " ",
              running && last !== void 0 ? `\u5DF2\u8DD1 ${humanDuration(now - last.startedAt)}` : STATUS[task.status].desc
            ] })
          ] }),
          task.description.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u8BF4\u660E" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: task.description })
          ] }) : null,
          task.prompt.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u6267\u884C\u65F6\u4F1A\u53D1\u7ED9 DSH \u7684 prompt" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: task.prompt })
          ] }) : null,
          (task.tags ?? []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u6807\u7B7E" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: (task.tags ?? []).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "dsptb-chip", title: tag.promptPrefix ?? "\u53EA\u662F\u663E\u793A\u7528\u7684\u6807\u7B7E", children: [
              tag.name,
              tag.promptPrefix !== void 0 ? " \u2691" : ""
            ] }, tag.name)) })
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u600E\u4E48\u8DD1" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: [
              task.mode !== void 0 ? `\u9884\u8BBE ${task.mode}` : void 0,
              task.model !== void 0 ? `\u6A21\u578B ${task.model}` : void 0,
              task.permission !== void 0 ? `\u6743\u9650 ${task.permission}` : void 0,
              task.reuseSession === true ? "\u590D\u7528\u4E0A\u4E00\u4E2A\u4F1A\u8BDD" : void 0,
              task.teamRun === true ? "\u6309 Agent Team \u8DD1\u6574\u4E2A\u5B50\u6811" : void 0,
              task.goalRun === false ? "\u53EA\u8DD1\u4E00\u8F6E\uFF08\u4E0D\u542F /goal\uFF09" : void 0
            ].filter((part) => part !== void 0).join(" \xB7 ") || "\u5168\u90E8\u8D70\u5BBF\u4E3B\u9ED8\u8BA4" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u65F6\u95F4" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
              "\u5EFA\u4E8E ",
              new Date(task.createdAt).toLocaleString(),
              " \xB7 \u6700\u540E\u52A8\u8FC7",
              " ",
              new Date(task.updatedAt).toLocaleString()
            ] })
          ] }),
          task.integrations === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u522B\u7684\u63D2\u4EF6\u6302\u5728\u8FD9\u5F20\u5361\u4E0A\u7684\u6570\u636E" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: Object.keys(task.integrations).join(" \xB7 ") })
          ] })
        ] }) : null,
        tab === "subtasks" ? children.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "dsptb-empty", children: "\u8FD9\u5F20\u5361\u4E0B\u9762\u6CA1\u6709\u5B50\u4EFB\u52A1" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dsptb-tree", children: subtreeRows(task, index).map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "button",
          {
            type: "button",
            className: "dsptb-tree-row",
            style: { paddingLeft: 6 + row.depth * 16 },
            onClick: () => onNavigate(row.task),
            title: row.task.title,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "span",
                {
                  className: "dsptb-hdot",
                  style: { background: STATUS[row.task.status].tone, flex: "none" },
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: row.task.title }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dsptb-chip", "data-tone": row.task.status === "failed" ? "err" : void 0, children: STATUS[row.task.status].label }),
              row.task.executions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { color: "var(--tb-fg-3)", fontSize: 11 }, children: [
                row.task.executions.length,
                " \u6B21"
              ] }) : null
            ]
          },
          row.task.id
        )) }) : null,
        tab === "schedule" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u5B9A\u65F6\u89C4\u5219" }),
            task.schedule === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u8FD9\u5F20\u5361\u6CA1\u6709\u5B9A\u65F6\u89C4\u5219" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
              task.schedule.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u5173\u6389\uFF08\u89C4\u5219\u8FD8\u7559\u7740\uFF09",
              " \xB7 ",
              humanCron(task.schedule.cron),
              task.schedule.timeZone !== void 0 ? ` \xB7 ${task.schedule.timeZone}` : "",
              task.schedule.nextRunAt !== void 0 ? ` \xB7 \u4E0B\u6B21 ${new Date(task.schedule.nextRunAt).toLocaleString()}` : "",
              task.schedule.lastTriggeredAt !== void 0 ? ` \xB7 \u4E0A\u6B21\u89E6\u53D1 ${new Date(task.schedule.lastTriggeredAt).toLocaleString()}` : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-field", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u6267\u884C\u5386\u53F2\uFF08\u65B0\u7684\u5728\u524D\uFF09" }),
            task.executions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u8FD9\u4E2A\u4EFB\u52A1\u8FD8\u6CA1\u8DD1\u8FC7" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: task.executions.slice().reverse().map((execution) => {
              const scheduled = triggerOf(execution) === "schedule";
              const open = execution.endedAt === void 0;
              return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dsptb-srow", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "when", title: new Date(execution.startedAt).toLocaleString(), children: shortTime(execution.startedAt, now) }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                  "span",
                  {
                    className: "dsptb-chip",
                    "data-tone": scheduled ? "brand" : void 0,
                    title: scheduled ? "\u8FD9\u6B21\u6CA1\u6709\u53D1\u8D77\u4F1A\u8BDD\uFF0C\u6309\u6765\u6E90\u63A8\u65AD\u662F\u5B9A\u65F6\u89E6\u53D1\u7684" : `\u7531\u4F1A\u8BDD ${execution.initiatedBy} \u53D1\u8D77`,
                    children: scheduled ? "\u5B9A\u65F6" : "\u624B\u52A8"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: execution.error ?? void 0, children: open ? "\u6B63\u5728\u8DD1\u2026" : execution.error ?? outcomeLabel(execution) }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dur", children: humanDuration(durationOf(execution, now)) })
              ] }, execution.id);
            }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "dsptb-note", children: [
            "\u300C\u5B9A\u65F6 / \u624B\u52A8\u300D\u662F",
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "\u63A8\u65AD" }),
            "\u4E0D\u662F\u8BB0\u5F55\uFF1A\u8D26\u672C\u91CC\u53EA\u5199\u4E86\u300C\u662F\u8C01\u53D1\u8D77\u7684\u300D\uFF0C\u5B9A\u65F6\u89E6\u53D1\u7684\u90A3\u4E00\u523B \u6CA1\u6709\u53D1\u8D77\u4F1A\u8BDD\uFF0C\u6240\u4EE5\u6CA1\u6709\u53D1\u8D77\u8005\u3002\u8FD9\u4E00\u6761\u4E0D\u5199\u8FDB\u4EFB\u4F55\u7EDF\u8BA1\u3002"
          ] })
        ] }) : null
      ] })
    ] })
  ] });
}
function TabButton({
  id,
  current,
  onPick,
  children
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", role: "tab", "aria-selected": current === id, onClick: () => onPick(id), children });
}
function subtreeRows(root, index) {
  const out = [];
  const walk = (task, depth) => {
    for (const child of index.childrenOf.get(task.id) ?? []) {
      out.push({ task: child, depth });
      walk(child, depth + 1);
    }
  };
  walk(root, 0);
  return out;
}

// src/client/views/Gantt.tsx
var import_react4 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var DAY_MS = 864e5;
var DAY_W = 44;
var NAME_W = 220;
var SPAN = 21;
var HEAD_H = 34;
var MIN_EXEC_W = 3;
var MIN_BAR_MS = DAY_MS / 6;
function Gantt({ index, now, selectedId, onSelect }) {
  const windowStart = (0, import_react4.useMemo)(() => {
    const today = new Date(now);
    return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - (SPAN - 1) * DAY_MS;
  }, [now]);
  const rows = (0, import_react4.useMemo)(() => {
    const out = [];
    for (const root of index.roots) {
      if (spanEnd(root, now) >= windowStart) out.push(root);
      for (const child of index.childrenOf.get(root.id) ?? []) {
        if (child.archivedAt !== void 0) continue;
        if (spanEnd(child, now) >= windowStart) out.push(child);
      }
    }
    return out;
  }, [index, now, windowStart]);
  const trackW = SPAN * DAY_W;
  const offsetOf = (ms) => (ms - windowStart) / DAY_MS * DAY_W;
  if (rows.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsptb-blank", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "\u8FD9 21 \u5929\u91CC\u6CA1\u6709\u6D3B\u52A8" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u7518\u7279\u53EA\u770B\u6700\u8FD1 21 \u5929\u3002\u66F4\u65E9\u7684\u4EFB\u52A1\u8FD8\u5728\u770B\u677F\u548C\u8FDB\u5EA6\u91CC\u3002" })
    ] });
  }
  const todayX = NAME_W + offsetOf(now);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsptb-gantt", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      className: "dsptb-g-inner",
      style: { ["--tb-dayw"]: `${DAY_W}px`, ["--tb-namw"]: `${NAME_W}px` },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsptb-g-head", style: { top: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsptb-g-corner", children: "\u4EFB\u52A1" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsptb-g-dates", children: Array.from({ length: SPAN }, (_, i) => {
            const date = new Date(windowStart + i * DAY_MS);
            const isToday = i === SPAN - 1;
            const show = i % 3 === 0 || isToday;
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "div",
              {
                className: "dsptb-g-cell",
                "data-today": isToday ? "true" : "false",
                style: { width: DAY_W },
                children: show ? `${date.getMonth() + 1}/${date.getDate()}` : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { opacity: 0.35 }, children: "\xB7" })
              },
              i
            );
          }) })
        ] }),
        rows.map((task) => {
          const isChild = task.parentId !== void 0;
          const end = Math.max(spanEnd(task, now), task.createdAt + MIN_BAR_MS);
          let x0 = offsetOf(task.createdAt);
          let x1 = offsetOf(end);
          const clipL = x0 < 0;
          const clipR = x1 > trackW;
          if (clipL) x0 = 0;
          if (clipR) x1 = trackW;
          let width = Math.max(x1 - x0, 8);
          if (x0 + width > trackW) x0 = Math.max(0, trackW - width);
          width = Math.min(width, trackW - x0);
          const running = isRunning(task);
          const tip = [
            task.title,
            `\u521B\u5EFA ${new Date(task.createdAt).toLocaleString()}`,
            running ? "\u6B64\u523B\u6709\u4EBA\u5728\u8DD1" : `\u6700\u8FD1\u6D3B\u52A8 ${new Date(end).toLocaleString()}`,
            `${task.executions.length} \u6B21\u6267\u884C`
          ].join("\n");
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsptb-g-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "button",
              {
                type: "button",
                className: "dsptb-g-name",
                "data-child": isChild ? "true" : "false",
                "data-sel": task.id === selectedId ? "true" : "false",
                onClick: () => onSelect(task),
                title: tip,
                style: { background: "none", border: 0, textAlign: "left", cursor: "pointer" },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    "span",
                    {
                      className: "dsptb-hdot",
                      style: { background: `var(--tb-tone-${toneKey(task)})`, flex: "none" },
                      "aria-hidden": "true"
                    }
                  ),
                  isChild ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { opacity: 0.5 }, "aria-hidden": "true", children: "\u2514" }) : null,
                  task.schedule?.enabled === true ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { title: `\u5B9A\u65F6\u5DF2\u542F\u7528 \xB7 ${task.schedule.cron}`, style: { flex: "none" }, children: "\u23F1" }) : null,
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "ttl", children: task.title })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dsptb-g-track", style: { width: trackW }, title: tip, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsptb-g-grid" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "div",
                {
                  className: "dsptb-g-bar",
                  "data-s": task.status,
                  style: { left: x0, width, opacity: clipL || clipR ? 0.75 : 1 },
                  children: task.executions.map((execution) => {
                    let a = offsetOf(execution.startedAt);
                    let b = offsetOf(execution.endedAt ?? now);
                    if (b < 0 || a > trackW) return null;
                    a = Math.max(a, 0);
                    b = Math.min(b, trackW);
                    const scheduled = triggerOf(execution) === "schedule";
                    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                      "i",
                      {
                        className: "dsptb-g-exec",
                        style: { left: a - x0, width: Math.max(b - a, MIN_EXEC_W), borderRadius: scheduled ? 0 : 3 },
                        title: `${scheduled ? "\u5B9A\u65F6\u89E6\u53D1\uFF08\u6309\u6765\u6E90\u63A8\u65AD\uFF09" : "\u624B\u52A8\u89E6\u53D1"} \xB7 ${new Date(execution.startedAt).toLocaleString()}`
                      },
                      execution.id
                    );
                  })
                }
              ),
              running ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dsptb-g-pulse", style: { left: x0 + width } }) : null
            ] })
          ] }, task.id);
        }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dsptb-g-today", style: { left: todayX, top: HEAD_H, height: rows.length * 30 } })
      ]
    }
  ) });
}
function toneKey(task) {
  switch (task.status) {
    case "todo":
      return "business";
    case "running":
      return "warn";
    case "done":
      return "success";
    case "failed":
      return "error";
    default:
      return "idle";
  }
}

// src/client/views/Progress.tsx
var import_react5 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var DAY_MS2 = 864e5;
var SPARK_DAYS = 14;
var STALE_RUN_MS = 2 * 60 * 60 * 1e3;
function Progress({ index, now, onSelect }) {
  const stats = (0, import_react5.useMemo)(() => {
    const byStatus = {};
    for (const status of STATUS_ORDER) byStatus[status] = 0;
    let subtasks = 0;
    let executions = 0;
    let openRuns = 0;
    let longestOpen = 0;
    const outcomes = { succeeded: 0, failed: 0, cancelled: 0, open: 0 };
    const spark = new Array(SPARK_DAYS).fill(0);
    const sparkBase = new Date(now);
    sparkBase.setHours(0, 0, 0, 0);
    const sparkStart = sparkBase.getTime() - (SPARK_DAYS - 1) * DAY_MS2;
    for (const task of index.onBoard) {
      if (task.parentId !== void 0) subtasks += 1;
      else byStatus[task.status] += 1;
      for (const execution of task.executions) {
        executions += 1;
        if (execution.endedAt === void 0) {
          outcomes.open += 1;
          openRuns += 1;
          longestOpen = Math.max(longestOpen, now - execution.startedAt);
        } else if (execution.result !== void 0) {
          outcomes[execution.result] += 1;
        }
        if (execution.startedAt >= sparkStart) {
          const day = Math.min(Math.floor((execution.startedAt - sparkStart) / DAY_MS2), SPARK_DAYS - 1);
          spark[day] += 1;
        }
      }
    }
    return { byStatus, subtasks, executions, openRuns, longestOpen, outcomes, spark, sparkStart };
  }, [index, now]);
  const roots = index.roots;
  const alerts = (0, import_react5.useMemo)(() => collectAlerts(index, now), [index, now]);
  const statusBuckets = STATUS_ORDER.map((status) => ({
    label: STATUS[status].label,
    tone: `var(--tb-tone-${toneOf(status)})`,
    count: stats.byStatus[status]
  }));
  const outcomeBuckets = [
    { label: "\u6210\u529F", tone: "var(--tb-tone-success)", count: stats.outcomes.succeeded },
    { label: "\u5931\u8D25", tone: "var(--tb-tone-error)", count: stats.outcomes.failed },
    { label: "\u5DF2\u53D6\u6D88", tone: "var(--tb-tone-idle)", count: stats.outcomes.cancelled },
    { label: "\u8FD8\u5728\u8DD1", tone: "var(--tb-tone-warn)", count: stats.outcomes.open }
  ];
  const tagBuckets = (0, import_react5.useMemo)(() => {
    const counts = /* @__PURE__ */ new Map();
    for (const task of index.onBoard) {
      for (const tag of task.tags ?? []) counts.set(tag.name, (counts.get(tag.name) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, tone: "var(--tb-business)", count })).sort((a, b) => b.count - a.count).slice(0, 12);
  }, [index.onBoard]);
  if (roots.length === 0 && stats.subtasks === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsptb-blank", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u8FD8\u6CA1\u6709\u4EFB\u52A1" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "\u4EFB\u52A1\u770B\u677F\u91CC\u5EFA\u4E00\u5F20\u5361\uFF0C\u8FD9\u91CC\u5C31\u4F1A\u957F\u51FA\u6570\u6765\u3002" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsptb-progress", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsptb-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u603B\u89C8" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsptb-kpis", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Kpi, { value: roots.length, label: "\u4E3B\u4EFB\u52A1" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Kpi, { value: stats.subtasks, label: "\u5B50\u4EFB\u52A1" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Kpi, { value: stats.byStatus.running, label: "\u8FDB\u884C\u4E2D", tone: "var(--tb-tone-warn)" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Kpi, { value: stats.executions, label: "\u7D2F\u8BA1\u6267\u884C" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          Kpi,
          {
            value: stats.openRuns,
            label: "\u5F00\u7740\u7684\u6267\u884C",
            tone: stats.openRuns > 0 ? "var(--tb-tone-warn)" : void 0
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          Kpi,
          {
            value: roots.length === 0 ? "\u2014" : `${Math.round(stats.byStatus.done / roots.length * 100)}%`,
            label: "\u4E3B\u4EFB\u52A1\u5B8C\u6210\u7387",
            tone: "var(--tb-tone-success)"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsptb-p-grid", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsptb-panel", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u72B6\u6001\u5206\u5E03" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(StackedBar, { buckets: statusBuckets, total: roots.length }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Legend, { buckets: statusBuckets })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsptb-panel", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u6267\u884C\u7ED3\u679C" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(StackedBar, { buckets: outcomeBuckets, total: stats.executions }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Legend, { buckets: outcomeBuckets })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsptb-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u6700\u8FD1\u4E24\u5468\u7684\u8DD1\u52A8" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Spark, { days: stats.spark, start: stats.sparkStart, now })
    ] }),
    alerts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsptb-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u9700\u8981\u7559\u610F" }),
      alerts.map((alert) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsptb-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "lbl", style: { color: alert.tone, width: 64 }, children: alert.tag }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            type: "button",
            onClick: () => onSelect(alert.task),
            style: { flex: 1, minWidth: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
            title: alert.why,
            children: alert.task.title
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "num", style: { width: 150 }, title: alert.why, children: alert.detail })
      ] }, alert.task.id))
    ] }) : null,
    tagBuckets.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "dsptb-panel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u6807\u7B7E\u5206\u5E03" }),
      tagBuckets.map((bucket) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Bar, { label: bucket.label, count: bucket.count, total: index.onBoard.length, tone: bucket.tone }, bucket.label))
    ] }) : null
  ] });
}
function toneOf(status) {
  switch (status) {
    case "todo":
      return "business";
    case "running":
      return "warn";
    case "done":
      return "success";
    case "failed":
      return "error";
    default:
      return "idle";
  }
}
function Kpi({ value, label, tone }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsptb-kpi", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { style: tone === void 0 ? void 0 : { color: tone }, children: value }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: label })
  ] });
}
function StackedBar({ buckets, total }) {
  if (total === 0) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "dsptb-empty", children: "\u8FD8\u6CA1\u6709\u6570\u636E" });
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dsptb-pbar", style: { height: 12 }, role: "img", "aria-label": buckets.map((b) => `${b.label} ${b.count}`).join("\uFF0C"), children: buckets.map(
    (bucket) => bucket.count === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "i",
      {
        style: { width: `${bucket.count / total * 100}%`, background: bucket.tone },
        title: `${bucket.label} ${bucket.count}\uFF08${Math.round(bucket.count / total * 100)}%\uFF09`
      },
      bucket.label
    )
  ) });
}
function Legend({ buckets }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dsptb-legend", children: buckets.map((bucket) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("i", { className: "dsptb-hdot", style: { background: bucket.tone, display: "inline-block" }, "aria-hidden": "true" }),
    bucket.label,
    " ",
    bucket.count
  ] }, bucket.label)) });
}
function Bar({ label, count, total, tone }) {
  const pct = total === 0 ? 0 : Math.round(count / total * 100);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dsptb-row", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "lbl", title: label, style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dsptb-pbar", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("i", { style: { width: `${pct}%`, background: tone } }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "num", children: [
      count,
      " \u4E2A \xB7 ",
      pct,
      "%"
    ] })
  ] });
}
var SPARK_TRACK_PX = 62;
function Spark({ days, start, now }) {
  const peak = Math.max(...days, 1);
  const total = days.reduce((sum, value) => sum + value, 0);
  if (total === 0) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "dsptb-empty", children: "\u6700\u8FD1\u4E24\u5468\u6CA1\u6709\u8DD1\u8FC7" });
  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { display: "flex", alignItems: "flex-end", gap: 3, width: "100%" }, children: days.map((count, index) => {
    const date = new Date(start + index * DAY_MS2);
    const isToday = start + index * DAY_MS2 === todayStart;
    const height = count === 0 ? 2 : Math.max(Math.round(count / peak * SPARK_TRACK_PX), 4);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "div",
      {
        style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
        title: `${date.getMonth() + 1} \u6708 ${date.getDate()} \u65E5 \xB7 ${count} \u6B21`,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: 11, lineHeight: "14px", color: "var(--tb-fg-3)", fontVariantNumeric: "tabular-nums" }, children: count === 0 ? "" : count }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "i",
            {
              style: {
                display: "block",
                width: "100%",
                height,
                borderRadius: 3,
                background: isToday ? "var(--tb-brand)" : "var(--tb-business)",
                opacity: count === 0 ? 0.2 : 1
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: 10, lineHeight: "13px", color: isToday ? "var(--tb-fg)" : "var(--tb-fg-3)" }, children: index % 2 === 0 || isToday ? date.getDate() : "" })
        ]
      },
      index
    );
  }) });
}
function collectAlerts(index, now) {
  const out = [];
  for (const task of index.roots) {
    const last = lastExecution(task);
    if (last !== void 0 && last.endedAt === void 0) {
      const open = now - last.startedAt;
      if (open > STALE_RUN_MS) {
        out.push({
          task,
          tag: "\u8DD1\u592A\u4E45",
          tone: "var(--tb-tone-warn)",
          detail: `\u5DF2\u8DD1 ${Math.round(open / 36e5)} \u5C0F\u65F6`,
          why: `\u8FD9\u6B21\u6267\u884C\u4ECE ${new Date(last.startedAt).toLocaleString()} \u5F00\u59CB\uFF0C\u5230\u73B0\u5728\u8FD8\u6CA1\u7ED3\u675F`
        });
      }
      continue;
    }
    if (isRunning(task)) continue;
    if (task.status === "running" && last !== void 0 && last.endedAt !== void 0) {
      out.push({
        task,
        tag: "\u72B6\u6001\u5BF9\u4E0D\u4E0A",
        tone: "var(--tb-tone-warn)",
        detail: "\u6807\u7740\u8FDB\u884C\u4E2D\uFF0C\u4F46\u6CA1\u6709\u5F00\u7740\u7684\u6267\u884C",
        why: "\u5361\u7247\u7684\u5217\u662F\u300C\u8FDB\u884C\u4E2D\u300D\uFF0C\u53EF\u662F\u5B83\u5E95\u4E0B\u6BCF\u4E00\u6B21\u6267\u884C\u90FD\u5DF2\u7ECF\u7ED3\u675F\u4E86"
      });
      continue;
    }
    if (task.status === "failed") {
      out.push({
        task,
        tag: "\u5931\u8D25",
        tone: "var(--tb-tone-error)",
        detail: last?.error ?? "\u6CA1\u6709\u9519\u8BEF\u4FE1\u606F",
        why: last?.error ?? "\u8FD9\u4E00\u6B21\u6267\u884C\u4EE5\u5931\u8D25\u7ED3\u675F\uFF0C\u8D26\u672C\u91CC\u6CA1\u6709\u7559\u4E0B\u9519\u8BEF\u6587\u672C"
      });
    }
  }
  return out.slice(0, 6);
}

// src/client/views/Panel.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var VIEWS = [
  { id: "board", label: "\u770B\u677F", hint: "\u6309\u72B6\u6001\u5206\u4E94\u5217\uFF0C\u4E00\u5F20\u5361\u4E00\u4E2A\u4EFB\u52A1" },
  { id: "gantt", label: "\u7518\u7279", hint: "\u6700\u8FD1 21 \u5929\uFF0C\u8C01\u8DD1\u4E86\u3001\u8DD1\u4E86\u591A\u4E45" },
  { id: "progress", label: "\u8FDB\u5EA6", hint: "\u6574\u4F53\u4EC0\u4E48\u72B6\u6001\u3001\u6709\u6CA1\u6709\u4E1C\u897F\u5361\u4F4F" }
];
var TICK_MS = 3e4;
function Panel({ ctx, source }) {
  const [view, setView] = (0, import_react6.useState)("board");
  const [query, setQuery] = (0, import_react6.useState)("");
  const [selectedId, setSelectedId] = (0, import_react6.useState)(void 0);
  const [now, setNow] = (0, import_react6.useState)(() => Date.now());
  (0, import_react6.useEffect)(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  const index = (0, import_react6.useMemo)(() => buildIndex(source.snapshot.tasks), [source.snapshot.tasks]);
  const selected = selectedId === void 0 ? void 0 : index.byId.get(selectedId);
  const backToConversation = () => {
    try {
      ctx.get("layout")?.selectPanel?.(null);
    } catch {
    }
  };
  const openSession = (sessionId) => {
    for (const name2 of ["uiWorkspace", "workspaceNavigation"]) {
      try {
        const face = ctx.get(name2);
        if (face !== void 0 && typeof face.openSession === "function") {
          face.openSession(sessionId);
          return true;
        }
      } catch {
      }
    }
    return false;
  };
  const isEmpty = index.all.length === 0;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsptb", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsptb-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsptb-btn", onClick: backToConversation, title: "\u56DE\u5230\u4F1A\u8BDD\u9875", children: "\u2190 \u8FD4\u56DE\u4F1A\u8BDD" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dsptb-title", children: "\u89C4\u5212\u89C6\u56FE" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "dsptb-seg", role: "group", "aria-label": "\u5207\u6362\u89C6\u56FE", children: VIEWS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          type: "button",
          title: item.hint,
          "aria-pressed": view === item.id,
          onClick: () => setView(item.id),
          children: item.label
        },
        item.id
      )) }),
      view === "board" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "input",
        {
          className: "dsptb-input",
          style: { flex: "0 1 220px" },
          placeholder: "\u7B5B\u9009\u4EFB\u52A1\u2026",
          value: query,
          onChange: (event) => setQuery(event.target.value),
          "aria-label": "\u7B5B\u9009\u4EFB\u52A1"
        }
      ) : null,
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dsptb-bar-grow" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SourceStatus, { source })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsptb-body", children: [
      isEmpty ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Blank, { source, ctx }) : null,
      !isEmpty && view === "board" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        Board,
        {
          index,
          now,
          query,
          selectedId,
          onSelect: (task) => setSelectedId(task.id)
        }
      ) : null,
      !isEmpty && view === "gantt" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Gantt, { index, now, selectedId, onSelect: (task) => setSelectedId(task.id) }) : null,
      !isEmpty && view === "progress" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Progress, { index, now, onSelect: (task) => setSelectedId(task.id) }) : null
    ] }),
    selected !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      Drawer,
      {
        task: selected,
        index,
        now,
        onClose: () => setSelectedId(void 0),
        onNavigate: (task) => setSelectedId(task.id),
        onOpenSession: openSession
      }
    ) : null
  ] });
}
function SourceStatus({ source }) {
  const { snapshot, refresh, refreshing } = source;
  if (snapshot.kind === "board") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "dsptb-src", title: "\u6570\u636E\u6765\u81EA\u4EFB\u52A1\u770B\u677F\u7684\u5185\u5B58\u955C\u50CF\uFF0C\u6539\u52A8\u4F1A\u7ACB\u523B\u53CD\u6620\u5230\u8FD9\u91CC", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dsptb-dot", "data-k": "board" }),
      "\u770B\u677F\u5B9E\u65F6",
      snapshot.boardEnabled === false ? "\uFF08\u770B\u677F\u7684\u6269\u5C55\u5F00\u5173\u5173\u7740\uFF09" : "",
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
        "\xB7 ",
        snapshot.tasks.length,
        " \u4E2A\u4EFB\u52A1"
      ] })
    ] });
  }
  if (snapshot.kind === "ledger") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "dsptb-src", title: `\u4EFB\u52A1\u770B\u677F\u6CA1\u5728\u573A\uFF0C\u8BFB\u7684\u662F\u8D26\u672C\u5FEB\u7167\uFF1A${snapshot.path ?? ""}
\u8D26\u672C\u53D8\u4E86\u8FD9\u91CC\u4E0D\u4F1A\u81EA\u5DF1\u66F4\u65B0\uFF0C\u70B9\u300C\u5237\u65B0\u300D\u91CD\u65B0\u8BFB`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dsptb-dot", "data-k": "ledger" }),
      "\u8D26\u672C\u5FEB\u7167 \xB7 \u53EA\u8BFB",
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
        "\xB7 ",
        snapshot.tasks.length,
        " \u4E2A\u4EFB\u52A1"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsptb-btn", onClick: refresh, disabled: refreshing, children: refreshing ? "\u8BFB\u53D6\u4E2D\u2026" : "\u5237\u65B0" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "dsptb-src", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "dsptb-dot", "data-k": "unavailable" }),
    "\u6CA1\u6709\u6570\u636E",
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsptb-btn", onClick: refresh, disabled: refreshing, children: refreshing ? "\u8BFB\u53D6\u4E2D\u2026" : "\u91CD\u8BD5" })
  ] });
}
function Blank({ source, ctx }) {
  const { snapshot } = source;
  if (snapshot.kind === "unavailable" && snapshot.reason === "starting") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsptb-blank", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: "\u6B63\u5728\u627E\u6570\u636E\u2026" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: "\u5148\u95EE\u4EFB\u52A1\u770B\u677F\uFF0C\u95EE\u4E0D\u5230\u518D\u8BFB\u8D26\u672C\u3002" })
    ] });
  }
  if (snapshot.kind === "unavailable") {
    const boardAlive = (() => {
      try {
        return ctx.get("taskBoard") !== void 0;
      } catch {
        return false;
      }
    })();
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsptb-blank", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: "\u62FF\u4E0D\u5230\u4EFB\u52A1\u6570\u636E" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: snapshot.reason === "ledger-missing" ? "\u8D26\u672C\u6587\u4EF6\u8FD8\u4E0D\u5B58\u5728\u2014\u2014\u4EFB\u52A1\u770B\u677F\u5927\u6982\u6CA1\u8DD1\u8FC7\u3002" : snapshot.reason === "schema-mismatch" ? `\u8D26\u672C\u683C\u5F0F\u5BF9\u4E0D\u4E0A\uFF08\u6587\u4EF6\u91CC\u662F ${String(snapshot.detail ?? "\u672A\u77E5\u7248\u672C")}\uFF09\uFF0C\u4E0D\u731C\u5B57\u6BB5\uFF0C\u6240\u4EE5\u4EC0\u4E48\u90FD\u4E0D\u753B\u3002` : "\u770B\u677F\u4E0D\u5728\u573A\uFF0C\u8D26\u672C\u4E5F\u8BFB\u4E0D\u5230\u3002" }),
      boardAlive ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: "\u4EFB\u52A1\u770B\u677F\u8FD9\u4E2A\u63D2\u4EF6\u73B0\u5728\u6CA1\u6709\u52A0\u8F7D\u3002" }),
      snapshot.path !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { children: snapshot.path }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "dsptb-btn", onClick: source.refresh, children: "\u518D\u8BD5\u4E00\u6B21" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "dsptb-blank", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: "\u8FD8\u6CA1\u6709\u4EFB\u52A1" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: snapshot.kind === "board" ? "\u5728\u4EFB\u52A1\u770B\u677F\u91CC\u5EFA\u4E00\u5F20\u5361\uFF0C\u8FD9\u91CC\u5C31\u6709\u4E86\u3002" : "\u8D26\u672C\u91CC\u4E00\u6761\u4EFB\u52A1\u90FD\u6CA1\u6709\u3002" })
  ] });
}

// src/client/index.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var name = "dsh-plugin-task-board";
var inject = ["slots"];
var PANEL_ID = "plan-views";
var PANEL_ORDER = 21;
function PlanPanelIcon({ size }) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "svg",
    {
      "data-dsh-panel-entry": PANEL_ID,
      viewBox: "0 0 16 16",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.3,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: 2, y: 3, width: 12, height: 2.4, rx: 1.2 }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: 2, y: 6.8, width: 7.5, height: 2.4, rx: 1.2 }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: 2, y: 10.6, width: 10, height: 2.4, rx: 1.2 })
      ]
    }
  );
}
function installStyles() {
  const existing = document.getElementById(STYLE_ID);
  if (existing !== null) {
    return () => {
    };
  }
  const element = document.createElement("style");
  element.id = STYLE_ID;
  element.textContent = CSS;
  document.head.appendChild(element);
  return () => element.remove();
}
function PlanPage({ ctx }) {
  const source = useTaskSource(ctx);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Panel, { ctx, source });
}
function apply(ctx) {
  const slots = ctx?.slots;
  if (slots === void 0 || typeof slots.inject !== "function" || typeof slots.register !== "function") {
    ctx?.logger?.warn?.("[dsh-plugin-task-board] ctx.slots \u4E0D\u53EF\u7528\uFF0C\u8FD9\u4E00\u884C\u4E0D\u4F1A\u51FA\u73B0");
    return () => {
    };
  }
  const disposers = [installStyles()];
  disposers.push(
    slots.inject(
      "sidebar.panellist",
      () => slots.register(
        {
          name: "sidebar.panellist",
          id: PANEL_ID,
          order: PANEL_ORDER,
          label: () => "\u89C4\u5212\u89C6\u56FE"
        },
        PlanPanelIcon
      )
    )
  );
  const MainPage = () => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PlanPage, { ctx });
  disposers.push(
    slots.inject(
      "main",
      () => slots.register(
        {
          name: "main",
          key: PANEL_ID
        },
        MainPage
      )
    )
  );
  return () => {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose();
      } catch {
      }
    }
  };
}
return module.exports; } });
