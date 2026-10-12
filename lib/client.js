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
var CSS = String.raw`
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
.dsptb .rail{
  flex:0 0 220px;width:220px;
  background:var(--bg-layer-1);
  border-right:1px solid var(--border-l1);
  display:flex;flex-direction:column;
  padding:0 8px 8px;gap:1px;
}
.dsptb .rail-top{
  flex:0 0 52px;height:52px;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 4px 0 8px;
}
.dsptb .rail-top .lights{display:flex;gap:8px}
.dsptb .rail-top .lights i{width:12px;height:12px;border-radius:50%;display:block}
.dsptb .rail-top .lights i:nth-child(1){background:#ff5f57}
.dsptb .rail-top .lights i:nth-child(2){background:#febc2e}
.dsptb .rail-top .lights i:nth-child(3){background:#28c840}
.dsptb .rail-icon{
  width:26px;height:26px;border-radius:7px;flex:0 0 26px;
  display:grid;place-items:center;background:none;border:0;
  color:var(--label-tertiary);cursor:pointer;
}
.dsptb .rail-icon:hover{background:var(--interactive-bg-hover);color:var(--label-primary)}
.dsptb .rail-brand{
  display:flex;align-items:center;gap:8px;
  padding:0 8px 12px;
}
.dsptb .rail-brand .fish{
  width:24px;height:24px;border-radius:7px;flex:0 0 24px;
  background:var(--brand);color:#fff;display:grid;place-items:center;
}
.dsptb .rail-brand .name{font-size:13px;font-weight:700;letter-spacing:.02em}
.dsptb .rail-brand .build{
  margin-left:auto;font-size:10px;line-height:1;
  padding:3px 6px;border-radius:5px;
  background:var(--bg-layer-3);color:var(--label-tertiary);
  border:1px solid var(--border-l2);white-space:nowrap;
}
.dsptb .rail-cta{
  display:flex;align-items:center;gap:8px;
  height:30px;padding:0 8px;margin:0 0 4px;border-radius:8px;
  background:var(--bg-layer-3);border:1px solid var(--border-l2);
  color:var(--label-primary);width:100%;text-align:left;cursor:pointer;
  font-size:12px;font-weight:600;
}
.dsptb .rail-cta:hover{background:var(--interactive-bg-hover)}
.dsptb .rail-cta svg{flex:0 0 14px;opacity:.85}
.dsptb .rail-sec{
  font-size:11px;color:var(--label-tertiary);
  padding:10px 8px 4px;letter-spacing:.04em;
}
.dsptb .rail-ws{
  display:flex;align-items:center;gap:8px;
  height:28px;padding:0 8px;border-radius:8px;
  color:var(--label-secondary);font-size:12px;
  background:none;border:0;width:100%;text-align:left;cursor:pointer;
}
.dsptb .rail-ws:hover{background:var(--interactive-bg-hover);color:var(--label-primary)}
.dsptb .rail-ws .wdot{width:8px;height:8px;border-radius:50%;flex:0 0 8px}
.dsptb .rail-ws .txt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsptb .rail-item{
  display:flex;align-items:center;gap:8px;
  height:30px;padding:0 8px;border-radius:8px;
  color:var(--label-secondary);font-size:12px;
  background:none;border:0;width:100%;text-align:left;cursor:pointer;
  position:relative;
}
.dsptb .rail-item:hover{background:var(--interactive-bg-hover);color:var(--label-primary)}
.dsptb .rail-item svg{flex:0 0 16px;opacity:.85}
.dsptb .rail-item.on{
  background:var(--interactive-bg-hover);
  color:var(--label-primary);font-weight:600;
}
.dsptb .rail-item.on::before{
  content:"";position:absolute;left:-8px;top:6px;bottom:6px;
  width:3px;border-radius:0 3px 3px 0;background:var(--brand);
}
.dsptb .rail-foot{margin-top:auto;padding-top:8px;border-top:1px solid var(--border-l1)}
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
.dsptb .panel-head .rail-toggle{display:none}
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
.dsptb .switch input:checked + .track::after{transform:translateX(14px);background:#fff}
.dsptb .switch input:focus-visible + .track{outline:2px solid var(--business-primary);outline-offset:2px}
.dsptb .switch span.txt{font-size:13px;color:var(--label-secondary)}
.dsptb .btn{
  height:30px;padding:0 12px;border-radius:8px;
  border:1px solid transparent;cursor:pointer;
  display:inline-flex;align-items:center;gap:6px;
  white-space:nowrap;
}
.dsptb .btn-primary{background:var(--brand);color:#fff;font-weight:600}
.dsptb .btn-primary:hover{background:#5083ec}
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
.dsptb .group-head{
  display:flex;align-items:center;gap:6px;
  font-size:13px;color:var(--label-secondary);
  padding:8px 4px 2px;
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
.dsptb .p-quick{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}
.dsptb .p-quick button{
  height:24px;padding:0 9px;border-radius:999px;font-size:11px;cursor:pointer;
  border:1px solid var(--border-l2);background:var(--input-major);color:var(--label-secondary);
}
.dsptb .p-quick button:hover{color:var(--label-primary)}
.dsptb .p-quick button[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:#fff;font-weight:600}
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
body[data-ds-dark-theme] .dsptb .mask{position:fixed;inset:0;background:#00000059;z-index:50;
  opacity:0;pointer-events:none;transition:opacity .2s ease;}
.dsptb .mask{background:#0f111529}
.dsptb .mask.open{opacity:1;pointer-events:auto}
.dsptb .drawer{
  position:fixed;top:0;right:0;bottom:0;width:min(760px,92vw);z-index:60;
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
.dsptb .d-ex .esub{color:#a51d1d}
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
.dsptb .msg.u .bub{background:var(--business-primary);color:#fff}
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
body[data-ds-dark-theme] .dsptb .mmask{position:fixed;inset:0;background:#00000059;z-index:90;
  opacity:0;pointer-events:none;transition:opacity .18s ease;}
.dsptb .mmask{background:#0f111529}
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
  background:var(--brand);border-color:var(--brand);color:#fff;font-weight:600;
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
.dsptb .presets button[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:#fff;font-weight:600}
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
.dsptb .d-check .ci.on .box{background:var(--brand);border-color:var(--brand);color:#fff}
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
  background:var(--business-primary);border-color:var(--business-primary);color:#fff;
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
  place-items:center;background:var(--business-primary);color:#fff;
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

/* 「会话」那一页正在看的那一次执行，在这一列里标出来 */
.dsptb .d-ex.on{border-color:var(--brand);background:var(--bg-layer-2)}
.dsptb .d-ex .cur-mark{
  font-size:10px;line-height:1;padding:2px 5px;border-radius:4px;
  color:var(--brand);border:1px solid var(--brand);
}
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
var import_react9 = require("react");

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
function groupByDay(tasks, now) {
  const buckets = /* @__PURE__ */ new Map();
  for (const task of tasks) {
    const key = dayKey(spanEnd(task, now));
    const bucket = buckets.get(key);
    if (bucket === void 0) buckets.set(key, [task]);
    else bucket.push(task);
  }
  return [...buckets.entries()].map(([key, items]) => {
    items.sort((a, b) => spanEnd(b, now) - spanEnd(a, now));
    const weekday = (/* @__PURE__ */ new Date(`${key}T12:00:00`)).getDay();
    return { key, items, weekend: weekday === 0 || weekday === 6 };
  }).sort((a, b) => a.key < b.key ? 1 : -1);
}
function paginateByWorkday(groups, workdays) {
  const out = [];
  let counted = 0;
  for (const group of groups) {
    if (counted >= workdays) break;
    out.push(group);
    if (!group.weekend) counted += 1;
  }
  return out;
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

// src/client/derive.ts
var PRIORITY_RANK = { urgent: 3, high: 2, medium: 1, low: 0 };
function priorityOf(task) {
  return priorityField(task, void 0, void 0);
}
function ruleRank(task) {
  const last = lastExecution(task);
  if (task.status === "failed" || last?.result === "failed") return PRIORITY_RANK.urgent;
  if (task.status === "running") return PRIORITY_RANK.high;
  if (task.schedule?.enabled === true) return PRIORITY_RANK.medium;
  return PRIORITY_RANK.low;
}
var PRIORITY_LABEL = { urgent: "\u7D27\u6025", high: "\u9AD8", medium: "\u4E2D", low: "\u4F4E" };
function deriveIntent(task, now, ai, override) {
  return {
    goal: pick(goalField(task), override?.goal, ai?.goal),
    scenario: pick(scenarioField(task), override?.scenario, ai?.scenario),
    background: pick(backgroundField(task, now), override?.background, ai?.background),
    acceptance: acceptanceItems(task, now, ai?.acceptance, override?.acceptanceDone),
    priority: priorityField(task, override?.priority, ai?.priority)
  };
}
function pick(fallback, edited, generated) {
  if (edited !== void 0 && edited.trim().length > 0) {
    return { value: edited.trim(), source: "edited", why: "\u4F60\u81EA\u5DF1\u6539\u8FC7\u7684\uFF0C\u6A21\u578B\u548C\u89C4\u5219\u90FD\u4E0D\u4F1A\u8986\u76D6\u5B83" };
  }
  if (generated !== void 0 && generated.trim().length > 0) {
    return {
      value: generated.trim(),
      source: "ai",
      why: "\u6A21\u578B\u8BFB\u4E86\u8FD9\u4E2A\u4EFB\u52A1\u7684\u6807\u9898\u3001\u8BF4\u660E\u3001\u6267\u884C\u63D0\u793A\u548C\u6267\u884C\u8BB0\u5F55\u4E4B\u540E\u5F52\u7EB3\u7684\u2014\u2014\u53EF\u80FD\u4E0D\u51C6\uFF0C\u53EF\u4EE5\u6539"
    };
  }
  return fallback;
}
function goalField(task) {
  const fromPrompt = firstSentence(task.prompt);
  if (fromPrompt !== void 0) {
    return { value: fromPrompt, source: "derived", why: "\u53D6\u6267\u884C\u63D0\u793A\u7684\u7B2C\u4E00\u53E5\uFF08\u6267\u884C\u65F6\u771F\u6B63\u53D1\u51FA\u53BB\u7684\u5C31\u662F\u5B83\uFF09" };
  }
  const fromDescription = firstSentence(task.description);
  if (fromDescription !== void 0) {
    return { value: fromDescription, source: "derived", why: "\u6CA1\u6709\u6267\u884C\u63D0\u793A\uFF0C\u9000\u56DE\u53D6\u8BF4\u660E\u7684\u7B2C\u4E00\u53E5" };
  }
  if (task.title.trim().length > 0) {
    return {
      value: task.title.trim(),
      source: "derived",
      why: "\u6267\u884C\u63D0\u793A\u548C\u8BF4\u660E\u90FD\u662F\u7A7A\u7684\uFF0C\u53EA\u80FD\u7528\u6807\u9898\u9876\u4E0A",
      missing: true
    };
  }
  return { value: "", source: "derived", why: "\u8FD9\u4E2A\u4EFB\u52A1\u4EC0\u4E48\u90FD\u6CA1\u5199", missing: true };
}
function scenarioField(task) {
  const kinds = new Set(task.executions.map(triggerOf));
  if (task.schedule !== void 0) {
    const when = humanCron(task.schedule.cron);
    if (task.schedule.enabled) {
      return {
        value: `\u6309\u300C${when}\u300D\u81EA\u52A8\u89E6\u53D1${kinds.has("manual") ? "\uFF0C\u4E5F\u53EF\u4EE5\u968F\u65F6\u624B\u52A8\u8DD1\u4E00\u6B21" : ""}`,
        source: "derived",
        why: `\u8D26\u672C\u91CC\u7684\u5B9A\u65F6\u89C4\u5219\uFF1A${task.schedule.cron}`
      };
    }
    return {
      value: `\u5B9A\u65F6\u89C4\u5219\u5199\u7740\u300C${when}\u300D\uFF0C\u4F46**\u6CA1\u542F\u7528**\u2014\u2014\u73B0\u5728\u53EA\u80FD\u4EBA\u624B\u52A8\u8DD1`,
      source: "derived",
      why: `\u8D26\u672C\u91CC\u7684\u5B9A\u65F6\u89C4\u5219\uFF1A${task.schedule.cron}\uFF08enabled=false\uFF09`
    };
  }
  if (task.executions.length === 0) {
    return {
      value: "\u8FD8\u6CA1\u6709\u8DD1\u8FC7\uFF0C\u4E5F\u6CA1\u6709\u5B9A\u65F6\u89C4\u5219",
      source: "derived",
      why: "\u8D26\u672C\u91CC\u8FD9\u6761\u4EFB\u52A1\u4E00\u6B21\u6267\u884C\u8BB0\u5F55\u90FD\u6CA1\u6709",
      missing: true
    };
  }
  if (!kinds.has("manual")) {
    return {
      value: "\u7531\u5B9A\u65F6\u4EFB\u52A1\u81EA\u52A8\u8DD1",
      source: "derived",
      why: `${task.executions.length} \u6B21\u6267\u884C\u91CC\u6CA1\u6709\u4E00\u6B21\u662F\u4F1A\u8BDD\u53D1\u8D77\u7684`
    };
  }
  return {
    value: "\u5728\u4F1A\u8BDD\u91CC\u624B\u5DE5\u53D1\u8D77",
    source: "derived",
    why: `${task.executions.length} \u6B21\u6267\u884C\u90FD\u8BB0\u7740\u53D1\u8D77\u4F1A\u8BDD`
  };
}
function backgroundField(task, now) {
  const parts = [`${stamp(task.createdAt)} \u521B\u5EFA`];
  if (task.status === "done" || task.status === "failed") parts.push(`${stamp(spanEnd(task, now))} \u7ED3\u7B97`);
  const runs = task.executions.length;
  if (runs === 0) {
    parts.push("\u4E00\u6B21\u90FD\u6CA1\u8DD1\u8FC7");
  } else {
    const ok = task.executions.filter((execution) => execution.result === "succeeded").length;
    const bad = task.executions.filter((execution) => execution.result === "failed").length;
    parts.push(`\u8DD1\u8FC7 ${runs} \u6B21\uFF08\u6210\u529F ${ok}\uFF0C\u5931\u8D25 ${bad}\uFF0C\u5176\u4F59\u6CA1\u7ED3\u7B97\uFF09`);
  }
  return {
    value: parts.join(" \xB7 "),
    source: "derived",
    why: "\u8D26\u672C\u91CC\u7684\u521B\u5EFA\u65F6\u95F4\u3001\u7ED3\u7B97\u65F6\u95F4\u548C\u6267\u884C\u8BB0\u5F55\u62FC\u51FA\u6765\u7684"
  };
}
function acceptanceItems(task, now, ai, done) {
  if (ai !== void 0 && ai.length > 0) {
    return ai.filter((line) => line.trim().length > 0).map((line, index) => ({
      id: `ai-${index}`,
      value: line.trim(),
      source: "ai",
      why: "\u6A21\u578B\u6839\u636E\u8FD9\u4E2A\u4EFB\u52A1\u7684\u7D20\u6750\u62DF\u7684\uFF0C\u4E0D\u662F\u8D26\u672C\u91CC\u8BB0\u7740\u7684",
      ...done !== void 0 && done.includes(`ai-${index}`) ? { checked: true } : {}
    }));
  }
  const out = [];
  const failure = task.executions.filter((execution) => execution.result === "failed").length;
  const success = task.executions.filter((execution) => execution.result === "succeeded").length;
  if (success > 0) {
    out.push({
      id: "runs-ok",
      value: `\u5DF2\u6709 ${success} \u6B21\u6267\u884C\u8DD1\u6210\u529F`,
      source: "derived",
      why: "\u6570\u7684\u662F\u8D26\u672C\u91CC result=succeeded \u7684\u6267\u884C\u8BB0\u5F55"
    });
  }
  if (failure > 0) {
    const latest = [...task.executions].reverse().find((execution) => execution.result === "failed");
    out.push({
      id: "runs-bad",
      value: latest?.error === void 0 ? `\u6709\u8FC7 ${failure} \u6B21\u6267\u884C\u5931\u8D25` : `\u6700\u8FD1\u4E00\u6B21\u5931\u8D25\uFF1A${firstSentence(latest.error) ?? latest.error}`,
      source: "derived",
      why: "\u6570\u7684\u662F\u8D26\u672C\u91CC result=failed \u7684\u6267\u884C\u8BB0\u5F55\uFF0C\u540E\u9762\u8DDF\u7684\u662F\u5B83\u8BB0\u4E0B\u7684 error \u539F\u6587"
    });
  }
  if (isRunning(task)) {
    const last = lastExecution(task);
    out.push({
      id: "running",
      value: `\u8FD9\u4E00\u6B21\u5DF2\u7ECF\u8DD1\u4E86 ${humanDuration(now - last.startedAt)}\uFF0C\u8FD8\u6CA1\u7ED3\u7B97`,
      source: "derived",
      why: "\u8D26\u672C\u91CC\u6700\u540E\u4E00\u6B21\u6267\u884C\u6709\u5F00\u59CB\u65F6\u95F4\u3001\u6CA1\u6709\u7ED3\u675F\u65F6\u95F4"
    });
  }
  if (out.length === 0) {
    out.push({
      id: "none",
      value: "\u8FD8\u6CA1\u6709\u4EFB\u4F55\u6267\u884C\u8BB0\u5F55\uFF0C\u9A8C\u6536\u6807\u51C6\u53EA\u80FD\u4EBA\u6765\u5B9A",
      source: "derived",
      why: "\u8D26\u672C\u91CC\u8FD9\u6761\u4EFB\u52A1\u4E00\u6B21\u90FD\u6CA1\u8DD1\u8FC7",
      missing: true
    });
  }
  return out;
}
function priorityField(task, edited, ai) {
  const last = lastExecution(task);
  const failed = task.status === "failed" || last?.result === "failed";
  if (edited !== void 0) {
    return { level: edited, value: PRIORITY_LABEL[edited], source: "edited", why: "\u4F60\u81EA\u5DF1\u8BBE\u7684" };
  }
  if (ai !== void 0) {
    return { level: ai, value: PRIORITY_LABEL[ai], source: "ai", why: "\u6A21\u578B\u7ED9\u7684\uFF08\u5B83\u770B\u4E0D\u5230\u6267\u884C\u8BB0\u5F55\uFF0C\u8FD9\u6761\u4E0D\u592A\u53EF\u9760\uFF09" };
  }
  if (failed) {
    return {
      level: "urgent",
      value: "\u7D27\u6025",
      source: "derived",
      why: task.status === "failed" ? "\u8FD9\u4E00\u5217\u662F\u300C\u5DF2\u5931\u8D25\u300D" : "\u5217\u4E0D\u662F\u5931\u8D25\uFF0C\u4F46\u6700\u8FD1\u4E00\u6B21\u6267\u884C\u5931\u8D25\u4E86"
    };
  }
  if (task.status === "running") {
    return { level: "high", value: "\u9AD8", source: "derived", why: "\u8FD9\u4F1A\u513F\u6B63\u6709\u4F1A\u8BDD\u5728\u8DD1" };
  }
  if (task.schedule?.enabled === true) {
    return { level: "medium", value: "\u4E2D", source: "derived", why: "\u6709\u5DF2\u542F\u7528\u7684\u5B9A\u65F6\u89C4\u5219\uFF0C\u5B83\u4F1A\u81EA\u5DF1\u52A8" };
  }
  return { level: "low", value: "\u4F4E", source: "derived", why: "\u6CA1\u5931\u8D25\u3001\u6CA1\u5728\u8DD1\u3001\u4E5F\u6CA1\u6709\u542F\u7528\u7684\u5B9A\u65F6\u89C4\u5219" };
}
function manualSettled(task) {
  if (task.status !== "done" && task.status !== "failed") return void 0;
  const last = lastExecution(task);
  if (last === void 0) {
    return "\u8FD9\u5F20\u5361\u6CA1\u6709\u6267\u884C\u8BB0\u5F55\u2014\u2014\u5B83\u7684\u72B6\u6001\u662F\u4EBA\u624B\u5DE5\u8BBE\u7684\uFF0C\u4E0D\u662F\u6267\u884C\u5668\u7ED3\u7B97\u7684";
  }
  if (last.endedAt === void 0) return void 0;
  const succeeded = last.result === "succeeded";
  if (task.status === "done" && !succeeded) {
    return `\u5217\u5728\u300C\u5DF2\u5B8C\u6210\u300D\uFF0C\u6700\u8FD1\u4E00\u6B21\u6267\u884C\u5374\u662F${outcomeLabel(last)}\u2014\u2014\u5927\u6982\u7387\u662F\u4EBA\u624B\u5DE5\u5224\u8FC7\u7684`;
  }
  if (task.status === "failed" && succeeded) {
    return "\u6700\u8FD1\u4E00\u6B21\u6267\u884C\u8DD1\u6210\u529F\u4E86\uFF0C\u4F46\u4EBA\u624B\u5DE5\u628A\u5B83\u6253\u56DE\u4E86\u300C\u5DF2\u5931\u8D25\u300D";
  }
  return void 0;
}
function periodOf(task) {
  const schedule = task.schedule;
  if (schedule === void 0 || !schedule.enabled) return void 0;
  const fields = schedule.cron.trim().split(/\s+/);
  if (fields.length !== 5) return void 0;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
  if (dayOfMonth === "*" && dayOfWeek === "*") {
    return { label: "\u6BCF\u5929", why: `cron \u7684\u65E5\u548C\u5468\u90FD\u662F\u901A\u914D\uFF1A${schedule.cron}` };
  }
  if (dayOfMonth === "*" && dayOfWeek !== "*") {
    return { label: "\u6BCF\u5468", why: `cron \u53EA\u5728\u5468\u51E0\u4E0A\u6709\u7EA6\u675F\uFF1A${schedule.cron}` };
  }
  if (dayOfMonth !== "*") {
    return { label: "\u6BCF\u6708", why: `cron \u5728\u51E0\u53F7\u4E0A\u6709\u7EA6\u675F\uFF1A${schedule.cron}` };
  }
  if (month !== "*") return { label: "\u6BCF\u5E74", why: `cron \u5728\u6708\u4EFD\u4E0A\u6709\u7EA6\u675F\uFF1A${schedule.cron}` };
  if (minute !== "*" && hour !== "*") return { label: "\u6BCF\u5929", why: `cron \u5B9A\u5728\u56FA\u5B9A\u65F6\u523B\uFF1A${schedule.cron}` };
  return { label: "\u9AD8\u9891", why: `cron \u6BCF\u5C0F\u65F6\u5185\u89E6\u53D1\u591A\u6B21\uFF1A${schedule.cron}` };
}
function expectedRuns(cron, from, to) {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) return void 0;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
  const fixed = (field) => /^\d+$/.test(field) ? Number(field) : void 0;
  const every2 = (field) => field === "*";
  if (minute === "*" || minute.includes("*/") || minute.includes(",")) return void 0;
  if (hour === "*" || hour.includes("*/") || hour.includes(",")) return void 0;
  if (fixed(minute) === void 0 || fixed(hour) === void 0) return void 0;
  const days = daysBetween(from, to);
  if (days <= 0) return 0;
  if (every2(dayOfMonth) && every2(month) && every2(dayOfWeek)) {
    return days;
  }
  if (every2(dayOfMonth) && every2(month) && !every2(dayOfWeek)) {
    const wanted = new Set(dayOfWeek.split(",").map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6));
    if (wanted.size === 0) return void 0;
    let count = 0;
    for (let i = 0; i < days; i += 1) if (wanted.has(new Date(from + i * 864e5).getDay())) count += 1;
    return count;
  }
  if (fixed(dayOfMonth) !== void 0 && every2(month) && every2(dayOfWeek)) {
    const day = fixed(dayOfMonth);
    let count = 0;
    for (let i = 0; i < days; i += 1) if (new Date(from + i * 864e5).getDate() === day) count += 1;
    return count;
  }
  return void 0;
}
function daysBetween(from, to) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 864e5) + 1;
}
function runsIn(tasks, from, to) {
  const out = { runs: 0, succeeded: 0, failed: 0, open: 0 };
  for (const task of tasks) {
    for (const execution of task.executions) {
      if (execution.startedAt < from || execution.startedAt > to) continue;
      out.runs += 1;
      if (execution.endedAt === void 0) out.open += 1;
      else if (execution.result === "succeeded") out.succeeded += 1;
      else if (execution.result === "failed") out.failed += 1;
    }
  }
  return out;
}
function firstSentence(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return void 0;
  const cut = trimmed.search(/[。！？；\n]|[.!?;]\s/);
  const head = (cut < 0 ? trimmed : trimmed.slice(0, cut)).trim();
  if (head.length === 0) return void 0;
  return head.length > 120 ? `${head.slice(0, 120)}\u2026` : head;
}
function stamp(ms) {
  const date = new Date(ms);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// src/client/enrich.ts
var import_react2 = require("react");
var ENRICH_URL = "/api/dsh-plugin-task-board/enrich";
var OVERRIDES_URL = "/api/dsh-plugin-task-board/overrides";
var MODEL_KEY = "dsh-plugin-task-board:enrich-model";
function useEnrichment(ctx) {
  const [ai, setAi] = (0, import_react2.useState)({});
  const [overrides, setOverrides] = (0, import_react2.useState)({});
  const [at, setAt] = (0, import_react2.useState)({});
  const [running, setRunning] = (0, import_react2.useState)([]);
  const [error, setError] = (0, import_react2.useState)(null);
  const [saveError, setSaveError] = (0, import_react2.useState)(null);
  const [model, setModelState] = (0, import_react2.useState)(() => readStoredModel());
  const asked = (0, import_react2.useRef)(/* @__PURE__ */ new Set());
  (0, import_react2.useEffect)(() => {
    let alive = true;
    void (async () => {
      try {
        const response = await fetch(OVERRIDES_URL, { headers: { accept: "application/json" } });
        const body = await response.json();
        if (!alive || body?.ok !== true) return;
        setOverrides(typeof body.overrides === "object" && body.overrides !== null ? body.overrides : {});
      } catch {
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  (0, import_react2.useEffect)(() => {
    if (model !== null) return;
    let alive = true;
    void (async () => {
      const found = await discoverModel(ctx);
      if (alive && found !== null) setModelState(found);
    })();
    return () => {
      alive = false;
    };
  }, [ctx, model]);
  const setModel = (0, import_react2.useCallback)((next) => {
    setModelState(next);
    try {
      window.localStorage.setItem(MODEL_KEY, next);
    } catch {
    }
  }, []);
  const run = (0, import_react2.useCallback)(async (tasks, force = false) => {
    if (tasks.length === 0) return;
    const ids = tasks.map((task) => task.id);
    setRunning(ids);
    setError(null);
    try {
      const response = await fetch(ENRICH_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // 模型路由：谁绑了用自己的，没绑用页面上选中的那个
          model: tasks.find((task) => typeof task.model === "string" && task.model.length > 0)?.model ?? model ?? void 0,
          force,
          tasks: tasks.map(toMaterial)
        })
      });
      if (!response.ok) {
        setError({ reason: "offline", detail: `\u5F52\u7EB3\u8DEF\u7531\u6CA1\u901A\uFF08HTTP ${response.status}\uFF09\u2014\u2014\u5BBF\u4E3B\u534A\u4F53\u53EF\u80FD\u6CA1\u88C5\u4E0A` });
        return;
      }
      const body = await response.json();
      if (body?.ok !== true) {
        setError({ reason: body?.reason ?? "model-error", detail: String(body?.detail ?? "\u5F52\u7EB3\u5931\u8D25") });
        return;
      }
      const nextAi = {};
      const nextAt = {};
      for (const [id, entry] of Object.entries(body.results)) {
        if (entry.ai !== void 0 && Object.keys(entry.ai).length > 0) {
          nextAi[id] = entry.ai;
          nextAt[id] = entry.at ?? Date.now();
        }
      }
      setAi((current) => ({ ...current, ...nextAi }));
      setAt((current) => ({ ...current, ...nextAt }));
      if (Object.keys(nextAi).length === 0) {
        setError({ reason: "model-error", detail: "\u6A21\u578B\u56DE\u4E86\u8BDD\uFF0C\u4F46\u56DB\u6761\u4E00\u6761\u90FD\u6CA1\u89E3\u6790\u51FA\u6765" });
      }
    } catch (cause) {
      setError({ reason: "offline", detail: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setRunning([]);
    }
  }, [model]);
  const save = (0, import_react2.useCallback)(async (taskId, override) => {
    setOverrides((current) => {
      const next = { ...current };
      if (Object.keys(override).length === 0) delete next[taskId];
      else next[taskId] = override;
      return next;
    });
    try {
      const response = await fetch(OVERRIDES_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId, override })
      });
      const body = await response.json();
      setSaveError(body?.ok === true ? null : String(body?.detail ?? "\u5B58\u4E0D\u4E0B"));
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : String(cause));
    }
  }, []);
  const auto = (0, import_react2.useCallback)((tasks) => {
    if (model === null) return;
    const fresh = tasks.filter((task) => !asked.current.has(task.id) && ai[task.id] === void 0 && overrides[task.id] === void 0);
    if (fresh.length === 0) return;
    for (const task of fresh) asked.current.add(task.id);
    void run(fresh);
  }, [ai, model, overrides, run]);
  return (0, import_react2.useMemo)(
    () => ({ ai, overrides, running, error, at, model, setModel, run, save, saveError, auto }),
    [ai, overrides, running, error, at, model, setModel, run, save, saveError, auto]
  );
}
async function discoverModel(ctx) {
  const qualify = (provider, id) => typeof id === "string" && id.length > 0 ? typeof provider === "string" && provider.length > 0 ? `${provider}/${id}` : id : null;
  try {
    const remote = ctx?.get?.("remote");
    const catalog = await remote?.session?.modelCatalog?.();
    const groups = catalog?.ok === true ? catalog.value?.groups : void 0;
    if (Array.isArray(groups)) {
      for (const group of groups) {
        const first = Array.isArray(group?.models) ? group.models[0] : void 0;
        const route = qualify(group?.id ?? group?.provider, first?.id);
        if (route !== null) return route;
      }
    }
  } catch {
  }
  try {
    const connection = ctx?.get?.("connection");
    const discovered = await connection?.api?.llm?.discoverModels?.();
    const models = discovered?.result?.value?.models;
    if (Array.isArray(models) && models.length > 0) {
      const route = qualify(models[0]?.provider, models[0]?.id);
      if (route !== null) return route;
    }
  } catch {
  }
  return null;
}
function readStoredModel() {
  try {
    const value = window.localStorage.getItem(MODEL_KEY);
    return value !== null && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}
function toMaterial(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    prompt: task.prompt,
    status: task.status,
    schedule: task.schedule === void 0 ? void 0 : { enabled: task.schedule.enabled, cron: task.schedule.cron },
    tags: (task.tags ?? []).map((tag) => tag.name),
    runs: task.executions.slice(-8).map((execution) => ({
      result: execution.endedAt === void 0 ? "running" : execution.result ?? "settled",
      error: execution.error,
      minutes: execution.endedAt === void 0 ? null : Math.round((execution.endedAt - execution.startedAt) / 6e4)
    }))
  };
}

// src/client/workspaces.ts
var import_react3 = require("react");
var UNPINNED = "\u672A\u9489\u5DE5\u4F5C\u533A";
function readList(ctx) {
  try {
    const face = ctx?.get?.("workspaces");
    const items = face?.list?.getSnapshot?.()?.items;
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}
function useWorkspaces(ctx, ids) {
  const [items, setItems] = (0, import_react3.useState)(
    () => readList(ctx).filter((item) => typeof item.workspaceId === "string").map((item) => ({
      id: String(item.workspaceId),
      title: typeof item.title === "string" && item.title.length > 0 ? item.title : String(item.workspaceId),
      path: typeof item.path === "string" ? item.path : void 0
    }))
  );
  (0, import_react3.useEffect)(() => {
    let alive = true;
    const pull = () => {
      const next = readList(ctx);
      if (!alive || next.length === 0) return;
      setItems(
        next.filter((item) => typeof item.workspaceId === "string").map((item) => ({
          id: String(item.workspaceId),
          title: typeof item.title === "string" && item.title.length > 0 ? item.title : String(item.workspaceId),
          path: typeof item.path === "string" ? item.path : void 0
        }))
      );
    };
    pull();
    const onService = (name2) => {
      if (name2 === "workspaces") pull();
    };
    try {
      ctx?.on?.("internal/service", onService);
    } catch {
    }
    return () => {
      alive = false;
      try {
        ctx?.off?.("internal/service", onService);
      } catch {
      }
    };
  }, [ctx]);
  const byId = new Map(items.map((item) => [item.id, item]));
  const nameOf = (id) => {
    if (id === void 0 || id.length === 0) return UNPINNED;
    return byId.get(id)?.title ?? id;
  };
  const abbrOf = (id) => {
    const name2 = nameOf(id);
    return width(name2) <= 7 ? name2 : `${clipTo(name2, 6)}\u2026`;
  };
  const seen = /* @__PURE__ */ new Set();
  for (const id of ids) if (id.length > 0) seen.add(id);
  const groups = [...seen].sort((a, b) => nameOf(a).localeCompare(nameOf(b), "zh"));
  groups.push("");
  return { nameOf, abbrOf, pathOf: (id) => id === void 0 ? void 0 : byId.get(id)?.path, groups, ready: items.length > 0 };
}
function width(text) {
  let total = 0;
  for (const char of text) total += char.codePointAt(0) > 11904 ? 2 : 1;
  return total;
}
function clipTo(text, max) {
  let total = 0;
  let out = "";
  for (const char of text) {
    const w = char.codePointAt(0) > 11904 ? 2 : 1;
    if (total + w > max) break;
    total += w;
    out += char;
  }
  return out;
}

// src/client/views/Board.tsx
var import_react5 = require("react");

// src/client/tokens.ts
var STATUS_ORDER = ["backlog", "todo", "running", "done", "failed"];
var STATUS = {
  backlog: {
    label: "\u5F85\u89C4\u5212",
    hue: 220,
    sat: "9%",
    lig: "60%",
    css: "var(--label-tertiary)",
    desc: "\u8FD8\u6CA1\u60F3\u6E05\u695A\u600E\u4E48\u505A\uFF0C\u4E0D\u5177\u5907\u5F00\u8DD1\u6761\u4EF6",
    by: "\u53EA\u80FD\u624B\u5DE5",
    tip: "\u8FD9\u4E00\u5217\u4E0D\u4F1A\u6709\u81EA\u52A8\u6765\u6E90\u2014\u2014\u6267\u884C\u5668\u4E0D\u4F1A\u628A\u5361\u7ED3\u7B97\u5230\u8FD9\u91CC\u3002"
  },
  todo: {
    label: "\u5F85\u529E",
    hue: 221,
    sat: "98%",
    lig: "67%",
    css: "var(--business-primary)",
    desc: "\u51C6\u5907\u597D\u4E86\uFF0C\u53EF\u4EE5\u8DD1",
    by: "\u624B\u5DE5\u8BBE\u7F6E\uFF1B\u5B9A\u65F6\u4EFB\u52A1\u6BCF\u6B21\u6210\u529F\u8DD1\u5B8C\u4F1A\u56DE\u5230\u8FD9\u4E00\u5217",
    tip: "\u53CD\u76F4\u89C9\u4F46\u91CD\u8981\uFF1A\u4E00\u4E2A\u6BCF\u5929\u8DD1\u7684\u5B9A\u65F6\u4EFB\u52A1\uFF0C\u4F60\u591A\u6570\u65F6\u5019\u662F\u5728\u300C\u5F85\u529E\u300D\u770B\u5230\u5B83\uFF0C\u4E0D\u662F\u300C\u5DF2\u5B8C\u6210\u300D\u3002"
  },
  running: {
    label: "\u8FDB\u884C\u4E2D",
    hue: 38,
    sat: "92%",
    lig: "50%",
    css: "var(--state-warn)",
    desc: "\u6267\u884C\u5668\u6B63\u5728\u8DD1\uFF08\u6709\u8FD8\u6CA1\u7ED3\u7B97\u7684\u4F1A\u8BDD\uFF09",
    by: "\u624B\u5DE5\u6216\u6267\u884C\u5668",
    tip: "\u6709\u4F1A\u8BDD\u5728\u8DD1\u7684\u5361\u5728\u7ED3\u7B97\u524D\u4E0D\u80FD\u88AB\u79FB\u52A8\u2014\u2014\u9501\u5C5E\u4E8E\u90A3\u6B21\u6267\u884C\uFF0C\u4E0D\u5C5E\u4E8E\u8FD9\u4E00\u5217\u7684\u540D\u5B57\u3002"
  },
  done: {
    label: "\u5DF2\u5B8C\u6210",
    hue: 142,
    sat: "69%",
    lig: "45%",
    css: "var(--state-success)",
    desc: "\u6267\u884C\u5668\u7ED3\u7B97\u6210\u529F\uFF0C\u6216\u4EBA\u624B\u5DE5\u58F0\u660E\u300C\u7ED3\u675F\u4E86\u300D",
    by: "\u624B\u5DE5\u6216\u6267\u884C\u5668",
    tip: "\u624B\u5DE5\u8BBE\u7684\u72B6\u6001\u4E0D\u4EA7\u751F\u6267\u884C\u8BB0\u5F55\uFF0C\u6240\u4EE5\u300C\u5DF2\u5B8C\u6210\u300D\u53EF\u4EE5\u914D\u4E00\u6761\u5931\u8D25\u7684\u8272\u6761\u2014\u2014\u5217\u662F\u770B\u677F\u7684\u9648\u8FF0\uFF0C\u8272\u6761\u662F\u6700\u8FD1\u4E00\u6B21\u8FD0\u884C\u7684\u4E8B\u5B9E\u3002"
  },
  failed: {
    label: "\u5DF2\u5931\u8D25",
    hue: 0,
    sat: "84%",
    lig: "60%",
    css: "var(--state-error)",
    desc: "\u6267\u884C\u5668\u7ED3\u7B97\u5931\u8D25\uFF0C\u6216\u4EBA\u624B\u5DE5\u5224\u4E3A\u5931\u8D25",
    by: "\u624B\u5DE5\u6216\u6267\u884C\u5668",
    tip: "\u540C\u6837\u53EF\u4EE5\u914D\u4E00\u6761\u6210\u529F\u7684\u8272\u6761\u2014\u2014\u90A3\u662F\u300C\u81EA\u52A8\u8DD1\u7EFF\u4E86\uFF0C\u4F46\u4EBA\u624B\u5DE5\u628A\u5B83\u6253\u56DE\u300D\u3002"
  }
};
function hueOf(text) {
  let hash = 0;
  for (const char of text) hash = hash * 31 + (char.codePointAt(0) ?? 0) >>> 0;
  return hash % 360;
}
function barColor(execution) {
  if (execution === void 0) return "transparent";
  if (execution.endedAt === void 0) return "var(--state-warn)";
  switch (execution.result) {
    case "succeeded":
      return "var(--state-success)";
    case "failed":
      return "var(--state-error)";
    case "cancelled":
      return "var(--label-tertiary)";
    default:
      return "transparent";
  }
}

// src/client/views/controls.tsx
var import_react4 = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function Dropdown({ value, options, onChange, ariaLabel, mini = false, className = "", title }) {
  const [open, setOpen] = (0, import_react4.useState)(false);
  const root = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    if (!open) return;
    const away = (event) => {
      if (root.current !== null && !root.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);
  const selected = options.find((option) => option.value === value) ?? options[0];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `dd ${mini ? "dd-mini" : ""} ${className}`, ref: root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: `dd-btn ${mini ? "" : "btn btn-secondary"}`,
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        "aria-label": ariaLabel,
        title,
        onClick: () => setOpen((current) => !current),
        children: [
          selected?.hue !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wdot", style: { ["--hue"]: String(selected.hue) }, "aria-hidden": "true" }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "lab", children: selected?.label ?? "\u2014" })
        ]
      }
    ),
    open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dd-pop", role: "listbox", "aria-label": ariaLabel, children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        role: "option",
        className: "dd-opt",
        "aria-selected": option.value === value,
        onClick: () => {
          onChange(option.value);
          setOpen(false);
        },
        children: [
          option.hue !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "wdot", style: { ["--hue"]: String(option.hue) }, "aria-hidden": "true" }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: option.label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "tick", "aria-hidden": "true", children: "\u2713" })
        ]
      },
      option.value
    )) }) : null
  ] });
}
function IconMini({
  on = false,
  label,
  title,
  onClick,
  children
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: `icon-mini${on ? " on" : ""}`, "aria-label": label, title, onClick, children });
}
function IconMag() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "12", height: "12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "7", cy: "7", r: "4.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.2 10.2 14 14" })
  ] });
}
function IconClock({ filled }) {
  return filled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.2", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 4.4V8l2.4 1.6", stroke: "var(--bg-layer-2)", strokeWidth: "1.5", fill: "none", strokeLinecap: "round" })
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "12", height: "12", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 4.4V8l2.4 1.6" })
  ] });
}
function MiniSearch({
  value,
  placeholder,
  ariaLabel,
  onChange,
  onClose
}) {
  const ref = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    ref.current?.focus();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: `search search-mini${value.length > 0 ? " on" : ""}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconMag, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "input",
      {
        ref,
        type: "search",
        value,
        placeholder,
        "aria-label": ariaLabel,
        onChange: (event) => onChange(event.target.value)
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "sx", "aria-label": "\u6536\u8D77\u641C\u7D22", onClick: onClose, children: "\u2715" })
  ] });
}
function Toggle({
  checked,
  label,
  title,
  onChange
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "switch", title, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked, onChange: (event) => onChange(event.target.checked) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "track", "aria-hidden": "true" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "txt", children: label })
  ] });
}
function emptyTaskCopy(kind) {
  return kind === "board" ? { title: "\u8FD8\u6CA1\u6709\u4EFB\u52A1", body: "\u5728\u4EFB\u52A1\u770B\u677F\u91CC\u5EFA\u4E00\u5F20\u5361\uFF0C\u8FD9\u91CC\u5C31\u6709\u4E86\u3002" } : { title: "\u8D26\u672C\u91CC\u4E00\u6761\u4EFB\u52A1\u90FD\u6CA1\u6709", body: "\u8FD9\u4E2A\u89C6\u56FE\u8BFB\u7684\u662F\u8D26\u672C\u5FEB\u7167\u672C\u8EAB\uFF1B\u8D26\u672C\u662F\u7A7A\u7684\uFF0C\u5C31\u6CA1\u6709\u53EF\u753B\u7684\u3002" };
}
function SourceTag({ source, why }) {
  const meta = {
    raw: { text: "\u8D26\u672C\u539F\u6587", cls: "tag-raw" },
    derived: { text: "\u6309\u8D26\u672C\u63A8\u7684", cls: "tag-derived" },
    ai: { text: "\u6A21\u578B\u5F52\u7EB3", cls: "tag-ai" },
    edited: { text: "\u4F60\u6539\u7684", cls: "tag-edited" }
  };
  const item = meta[source];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `src-tag ${item.cls}`, title: why, children: item.text });
}
function FieldBlock({
  label,
  field,
  hint,
  onSave
}) {
  const [editing, setEditing] = (0, import_react4.useState)(false);
  const [draft, setDraft] = (0, import_react4.useState)(field.value);
  (0, import_react4.useEffect)(() => {
    if (!editing) setDraft(field.value);
  }, [field.value, editing]);
  const commit = () => {
    setEditing(false);
    if (draft.trim() !== field.value.trim()) onSave?.(draft.trim());
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "fblock", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "fb-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "k", children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SourceTag, { source: field.source, why: field.why }),
      hint !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "fb-hint", children: hint }) : null,
      onSave !== void 0 && !editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "fb-edit", onClick: () => setEditing(true), children: "\u6539" }) : null
    ] }),
    editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "fb-edit-area", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          value: draft,
          autoFocus: true,
          rows: Math.min(6, Math.max(2, Math.ceil(draft.length / 48))),
          onChange: (event) => setDraft(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Escape") {
              setDraft(field.value);
              setEditing(false);
            }
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) commit();
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "fb-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "btn btn-secondary", onClick: () => {
          setDraft(field.value);
          setEditing(false);
        }, children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "btn btn-primary", onClick: commit, children: "\u5B58\u4E0B" }),
        field.source === "edited" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "btn btn-secondary", onClick: () => {
          setDraft("");
          onSave?.("");
        }, children: "\u6062\u590D\u6210\u63A8\u7684" }) : null
      ] })
    ] }) : field.missing === true && field.value.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "fb-missing", children: [
      "\u8D26\u672C\u91CC\u6CA1\u6709\u80FD\u63A8\u7684\u7D20\u6750\u3002",
      onSave !== void 0 ? "\u53EF\u4EE5\u76F4\u63A5\u5199\u4E00\u6761\u3002" : ""
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: `fb-value${field.missing === true ? " thin" : ""}`, children: field.value })
  ] });
}
function EmptyState({
  title,
  body,
  actionLabel,
  onAction
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "empty", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "ico", viewBox: "0 0 24 24", width: "34", height: "34", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "4", width: "18", height: "16", rx: "3" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 9h18M9 9v11" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: body }),
    actionLabel !== void 0 && onAction !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "btn btn-secondary", onClick: onAction, children: actionLabel }) : null
  ] });
}

// src/client/views/Board.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var WORKDAYS_PER_PAGE = 7;
var EMPTY_FILTER = { ws: "", q: "", trig: "all" };
function Board({ index, now, workspaces, selectedId, onSelect, onClearAll, sourceKind, onOpenBoard }) {
  const [filters, setFilters] = (0, import_react5.useState)(() => ({
    backlog: EMPTY_FILTER,
    todo: EMPTY_FILTER,
    running: EMPTY_FILTER,
    done: EMPTY_FILTER,
    failed: EMPTY_FILTER
  }));
  const [searchOpen, setSearchOpen] = (0, import_react5.useState)(() => ({
    backlog: false,
    todo: false,
    running: false,
    done: false,
    failed: false
  }));
  const [pages, setPages] = (0, import_react5.useState)(() => ({
    backlog: 1,
    todo: 1,
    running: 1,
    done: 1,
    failed: 1
  }));
  const [override, setOverride] = (0, import_react5.useState)(() => /* @__PURE__ */ new Map());
  const setFilter = (status, patch) => setFilters((current) => ({ ...current, [status]: { ...current[status], ...patch } }));
  const wsOptions = (0, import_react5.useMemo)(
    () => [
      { value: "", label: "\u9879\u76EE" },
      ...workspaces.groups.filter((id) => id !== "").map((id) => ({ value: id, label: workspaces.nameOf(id), hue: hueOf(id) })),
      { value: "__none__", label: "\u672A\u9489", hue: 220 }
    ],
    [workspaces]
  );
  const columns = (0, import_react5.useMemo)(() => {
    const out = { backlog: [], todo: [], running: [], done: [], failed: [] };
    for (const task of index.roots) out[task.status].push(task);
    for (const status of STATUS_ORDER) {
      out[status].sort(status === "done" || status === "failed" ? (a, b) => spanEnd(b, now) - spanEnd(a, now) : (a, b) => ruleRank(b) - ruleRank(a) || b.createdAt - a.createdAt);
    }
    return out;
  }, [index.roots, now]);
  const filtered = (0, import_react5.useMemo)(() => {
    const out = {};
    for (const status of STATUS_ORDER) {
      const filter = filters[status];
      const needle = filter.q.trim().toLowerCase();
      out[status] = columns[status].filter((task) => {
        if (filter.ws === "__none__" && task.workspaceId !== void 0) return false;
        if (filter.ws !== "" && filter.ws !== "__none__" && task.workspaceId !== filter.ws) return false;
        if (filter.trig !== "all") {
          const last = lastExecution(task);
          if (last === void 0) return false;
          if (triggerOf(last) !== filter.trig) return false;
        }
        if (needle.length > 0 && !haystack(task).includes(needle)) return false;
        return true;
      });
    }
    return out;
  }, [columns, filters]);
  const anyFilter = STATUS_ORDER.some((status) => {
    const filter = filters[status];
    return filter.ws !== "" || filter.q.trim().length > 0 || filter.trig !== "all";
  });
  const totalVisible = STATUS_ORDER.reduce((sum, status) => sum + filtered[status].length, 0);
  if (totalVisible === 0) {
    if (anyFilter) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "board is-empty", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        EmptyState,
        {
          title: "\u6CA1\u6709\u5339\u914D\u7684\u4EFB\u52A1",
          body: "\u7B5B\u9009\u6761\u4EF6\u628A\u8D26\u672C\u6EE4\u7A7A\u4E86\uFF0C\u6E05\u4E00\u4E0B\u8BD5\u8BD5\u3002",
          actionLabel: "\u6E05\u7A7A\u5168\u90E8\u7B5B\u9009",
          onAction: () => {
            setFilters({ backlog: EMPTY_FILTER, todo: EMPTY_FILTER, running: EMPTY_FILTER, done: EMPTY_FILTER, failed: EMPTY_FILTER });
            onClearAll();
          }
        }
      ) });
    }
    if (index.roots.length === 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "board is-empty", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        EmptyState,
        {
          ...emptyTaskCopy(sourceKind),
          ...onOpenBoard === void 0 ? {} : { actionLabel: "\u53BB\u4EFB\u52A1\u770B\u677F", onAction: onOpenBoard }
        }
      ) });
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "board", children: STATUS_ORDER.map((status) => {
    const meta = STATUS[status];
    const all = columns[status];
    const items = filtered[status];
    const filter = filters[status];
    const filteredNow = filter.ws !== "" || filter.q.trim().length > 0 || filter.trig !== "all";
    const dated = status === "done" || status === "failed";
    const days = dated ? groupByDay(items, now) : void 0;
    const shown = days === void 0 ? void 0 : paginateByWorkday(days, pages[status] * WORKDAYS_PER_PAGE);
    const rest = days === void 0 ? [] : days.slice(shown.length);
    const restCount = rest.reduce((sum, group) => sum + group.items.length, 0);
    const restWorkdays = rest.filter((group) => !group.weekend).length;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "col", "aria-label": meta.label, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "col-head", title: `${meta.label}
${meta.desc}

\u7531\u8C01\u8BBE\u7F6E\uFF1A${meta.by}
${meta.tip}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "hdot", style: { background: meta.css } }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: meta.label }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "span",
          {
            className: "count",
            title: filteredNow ? `\u7B5B\u8FC7\uFF1A\u672C\u5217 ${all.length} \u4E2A\uFF0C\u547D\u4E2D ${items.length} \u4E2A` : void 0,
            children: [
              items.length,
              filteredNow ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("i", { children: [
                "/",
                all.length
              ] }) : null
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "col-filters", children: searchOpen[status] ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        MiniSearch,
        {
          value: filter.q,
          placeholder: `\u5728\u300C${meta.label}\u300D\u5217\u91CC\u641C\u540D\u79F0 / \u6807\u7B7E\u2026`,
          ariaLabel: `\u5728\u300C${meta.label}\u300D\u5217\u91CC\u641C\u7D22`,
          onChange: (next) => setFilter(status, { q: next }),
          onClose: () => {
            setSearchOpen((current) => ({ ...current, [status]: false }));
            setFilter(status, { q: "" });
          }
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          Dropdown,
          {
            mini: true,
            value: filter.ws,
            options: wsOptions,
            ariaLabel: `\u300C${meta.label}\u300D\u5217\u7684\u9879\u76EE\u7B5B\u9009`,
            onChange: (next) => setFilter(status, { ws: next })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          IconMini,
          {
            on: filter.q.length > 0,
            label: `\u5728\u300C${meta.label}\u300D\u5217\u91CC\u641C\u7D22`,
            title: filter.q.length > 0 ? `\u6B63\u5728\u7B5B\u9009\uFF1A${filter.q}` : `\u5728\u300C${meta.label}\u300D\u5217\u91CC\u641C\u7D22`,
            onClick: () => setSearchOpen((current) => ({ ...current, [status]: true })),
            children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(IconMag, {})
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "select-wrap mini", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "select",
          {
            className: filter.trig === "all" ? void 0 : "on",
            "aria-label": `\u300C${meta.label}\u300D\u5217\u7684\u89E6\u53D1\u65B9\u5F0F\u7B5B\u9009`,
            value: filter.trig,
            onChange: (event) => setFilter(status, { trig: event.target.value }),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "all", children: "\u89E6\u53D1" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "schedule", children: "\u4EC5\u5B9A\u65F6" }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "manual", children: "\u4EC5\u624B\u52A8" })
            ]
          }
        ) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "col-body", children: items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "col-empty", children: filteredNow ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        "\u8FD9\u4E00\u5217\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4EFB\u52A1",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("br", {}),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "button",
          {
            type: "button",
            className: "btn btn-secondary",
            onClick: () => setFilter(status, EMPTY_FILTER),
            children: "\u6E05\u7A7A\u672C\u5217\u7B5B\u9009"
          }
        )
      ] }) : "\u8FD9\u4E00\u5217\u8FD8\u6CA1\u6709\u4EFB\u52A1" }) : shown === void 0 ? items.map((task) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { ...{ task, index, now, workspaces, selectedId, onSelect } }, task.id)) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        shown.map((group, groupIndex) => {
          const key = `${status}:${group.key}`;
          const open = override.get(key) ?? groupIndex === 0;
          return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: `group-head${open ? " open" : ""}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                "button",
                {
                  type: "button",
                  "aria-expanded": open,
                  onClick: () => setOverride((current) => {
                    const next = new Map(current);
                    next.set(key, !open);
                    return next;
                  }),
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `caret${open ? " open" : ""}`, "aria-hidden": "true", children: "\u25B8" }),
                    group.key === dayKey(now) ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "dot", title: "\u4ECA\u5929" }) : null,
                    dayLabelOf(group.key, now),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "n", children: group.items.length })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rule" })
            ] }),
            open ? group.items.map((task) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Card, { ...{ task, index, now, workspaces, selectedId, onSelect } }, task.id)) : null
          ] }, group.key);
        }),
        rest.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "more-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "more-txt", children: [
            restWorkdays > 0 ? `\u8FD8\u6709 ${restWorkdays} \u4E2A\u5DE5\u4F5C\u65E5 \xB7 ` : "\u8FD8\u6709 ",
            restCount,
            " \u9879\u6CA1\u663E\u793A"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              type: "button",
              className: "btn btn-secondary",
              onClick: () => setPages((current) => ({ ...current, [status]: current[status] + 1 })),
              children: "\u66F4\u591A"
            }
          )
        ] }) : null
      ] }) })
    ] }, status);
  }) });
}
function haystack(task) {
  return [task.title, task.id, ...(task.tags ?? []).map((tag) => tag.name)].join("\n").toLowerCase();
}
function dayLabelOf(key, now) {
  const date = /* @__PURE__ */ new Date(`${key}T12:00:00`);
  const weekday = "\u65E5\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D"[date.getDay()];
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return `${sameYear ? `${mm}-${dd}` : `${date.getFullYear()}-${mm}-${dd}`} \xB7 \u5468${weekday}`;
}
function Card({ task, index, now, workspaces, selectedId, onSelect }) {
  const rollup = (0, import_react5.useMemo)(() => rollupOf(index, task), [index, task]);
  const last = lastExecution(task);
  const running = last !== void 0 && last.endedAt === void 0;
  const tags = task.tags ?? [];
  const wsName = workspaces.nameOf(task.workspaceId);
  const unpinned = task.workspaceId === void 0 || task.workspaceId.length === 0;
  const priority = (0, import_react5.useMemo)(() => priorityOf(task), [task]);
  const period = (0, import_react5.useMemo)(() => periodOf(task), [task]);
  const manual = (0, import_react5.useMemo)(() => manualSettled(task), [task]);
  const goal = (0, import_react5.useMemo)(() => {
    const i = deriveIntent(task, now);
    return i.goal;
  }, [task, now]);
  const when = running ? { k: "\u5F00\u59CB", v: shortTime(last.startedAt, now) } : task.status === "done" || task.status === "failed" ? { k: "\u7ED3\u7B97", v: shortTime(spanEnd(task, now), now) } : { k: "\u521B\u5EFA", v: shortTime(task.createdAt, now) };
  const tip = [
    task.title,
    `${task.id} \xB7 ${wsName} \xB7 ${STATUS[task.status].label}`,
    task.description.length > 0 ? task.description : void 0
  ].filter(Boolean).join("\n");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "article",
    {
      className: `card${running ? " is-running" : ""}${task.id === selectedId ? " on" : ""}`,
      role: "button",
      tabIndex: 0,
      style: { ["--bar"]: barColor(last) },
      "aria-label": `\u4EFB\u52A1 ${task.title}`,
      title: tip,
      onClick: () => onSelect(task),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(task);
        }
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `cmark${unpinned ? " unpin" : ""}`, style: { ["--hue"]: String(hueOf(task.workspaceId ?? "")) }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cm-txt", title: workspaces.pathOf(task.workspaceId) ?? wsName, children: workspaces.abbrOf(task.workspaceId) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h4", { children: [
          goal.value === "" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "nogol", title: "\u8FD9\u5F20\u5361\u6CA1\u6709\u586B\u6267\u884C\u63D0\u793A\uFF0C\u4E5F\u6CA1\u6709\u8BF4\u660E \u2014\u2014 \u8DD1\u8D77\u6765\u53D1\u7ED9 DSH \u7684\u662F\u7A7A\u7684", "aria-label": "\u7F3A\u76EE\u6807" }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "ttl", children: task.title })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "card-tags", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `prio p-${priority.level}`, title: `\u4F18\u5148\u7EA7\uFF1A${priority.value} \xB7 ${priority.why}`, children: priority.value }),
          period !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "badge-period", title: `${period.label} \xB7 ${period.why}`, children: period.label }) : null,
          manual !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "badge-manual", title: manual, children: "\u624B\u52A8\u7ED3\u7B97" }) : null,
          task.teamRun === true ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "badge-plain", title: "\u8FD9\u4E00\u6574\u4E2A\u5B50\u6811\u6309 Agent Team \u8DD1", children: "\u56E2\u961F" }) : null,
          task.goalRun === false ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "badge-plain", title: "\u53EA\u8DD1\u4E00\u8F6E\uFF0C\u4E0D\u542F /goal", children: "\u5355\u8F6E" }) : null,
          tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "span",
            {
              className: "badge",
              style: { ["--hue"]: String(hueOf(tag.name)) },
              title: tag.promptPrefix === void 0 ? `${tag.name}\uFF08\u53EA\u662F\u663E\u793A\u7528\u7684\u6807\u7B7E\uFF09` : `${tag.name} \xB7 \u4F1A\u628A\u8FD9\u4E2A\u524D\u7F00\u62FC\u5230 prompt \u524D\u9762\uFF1A${tag.promptPrefix}`,
              children: tag.name
            },
            tag.name
          )),
          rollup.total > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "badge-sub", title: `\u8FD9\u4E2A\u4EFB\u52A1\u6709 ${rollup.total} \u4E2A\u5B50\u4EFB\u52A1\uFF08\u5DF2\u5B8C\u6210 ${rollup.byStatus.done} \u4E2A\uFF09\xB7 \u70B9\u5F00\u5361\u7247\u5728\u300C\u5B50\u4EFB\u52A1\u300D\u91CC\u770B`, children: [
            "\u5B50\u4EFB\u52A1 ",
            rollup.byStatus.done,
            "/",
            rollup.total
          ] }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "card-sub", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cseg nowrap", title: executionSummary(task) ?? "\u6267\u884C\u65F6\u5168\u90E8\u8D70\u5BBF\u4E3B\u9ED8\u8BA4", children: executionSummary(task) ?? "" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "cseg chip-slot", children: last?.sessionId !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "chip", title: `\u6700\u8FD1\u4E00\u6B21\u6267\u884C\u4F1A\u8BDD ${last.sessionId}`, children: shortSession(last.sessionId) }) : null })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "card-meta", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "when", children: [
            when.k,
            " ",
            when.v
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "when-slot", children: scheduleMark(task, now) })
        ] })
      ]
    }
  );
}
function executionSummary(task) {
  const parts = [
    task.mode !== void 0 ? task.mode : void 0,
    task.model !== void 0 ? task.model : void 0,
    task.permission !== void 0 ? task.permission : void 0
  ].filter((part) => part !== void 0);
  return parts.length === 0 ? void 0 : parts.join(" \xB7 ");
}
function shortSession(sessionId) {
  return sessionId.length <= 14 ? sessionId : `${sessionId.slice(0, 13)}\u2026`;
}
function scheduleMark(task, now) {
  if (task.schedule === void 0) return null;
  const { enabled, cron, nextRunAt } = task.schedule;
  if (!enabled) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "sched", title: `\u5B9A\u65F6\u672A\u542F\u7528 \xB7 ${cron}`, style: { color: "var(--label-tertiary)" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(IconClock, { filled: false }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "sched", title: `\u5B9A\u65F6\u5DF2\u542F\u7528 \xB7 ${cron}${nextRunAt === void 0 ? "" : ` \xB7 \u4E0B\u6B21 ${new Date(nextRunAt).toLocaleString()}`}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(IconClock, { filled: true }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: nextRunAt === void 0 ? "\u5DF2\u542F\u7528" : shortTime(nextRunAt, now) })
  ] });
}

// src/client/views/Drawer.tsx
var import_react6 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function modelFor(task, fallback) {
  return task.model !== void 0 && task.model.length > 0 ? task.model : fallback;
}
function Drawer({ task, index, now, workspaces, onClose, onNavigate, onOpenSession, intent, enrichment }) {
  const [tab, setTab] = (0, import_react6.useState)("conversation");
  const [copied, setCopied] = (0, import_react6.useState)(false);
  (0, import_react6.useEffect)(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const rollup = (0, import_react6.useMemo)(() => rollupOf(index, task), [index, task]);
  const children = index.childrenOf.get(task.id) ?? [];
  const parent = task.parentId === void 0 ? void 0 : index.byId.get(task.parentId);
  const last = lastExecution(task);
  const running = isRunning(task);
  const tabs = [
    { id: "conversation", label: "\u4F1A\u8BDD" },
    { id: "goal", label: "\u4EFB\u52A1\u76EE\u6807" },
    { id: "subtasks", label: "\u5B50\u4EFB\u52A1", count: rollup.total },
    { id: "schedule", label: "\u5B9A\u65F6\u5386\u53F2", count: task.executions.length }
  ];
  const active = tabs.find((item) => item.id === tab);
  const openSession = () => {
    if (last?.sessionId === void 0) return;
    if (onOpenSession(last.sessionId)) return;
    void navigator.clipboard?.writeText(last.sessionId).then(() => setCopied(true), () => setCopied(false));
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mask open", onClick: onClose, "aria-hidden": "true" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "drawer open", "aria-label": "\u4EFB\u52A1\u8BE6\u60C5", children: [
      parent !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "d-back", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", onClick: () => onNavigate(parent), children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "arw", "aria-hidden": "true", children: "\u2190" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "bl", children: "\u8FD4\u56DE" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "bt", children: parent.title })
      ] }) }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "drawer-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h2", { children: [
          task.title,
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "mono", style: { color: "var(--label-tertiary)", fontWeight: 400 }, children: [
            " \xB7 ",
            task.id
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "st", style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--label-secondary)" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { width: 7, height: 7, borderRadius: "50%", background: STATUS[task.status].css }, "aria-hidden": "true" }),
          STATUS[task.status].label
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "btn btn-secondary", onClick: onClose, "aria-label": "\u5173\u95ED", children: "\u2715" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "drawer-tabs", role: "tablist", children: tabs.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "button",
        {
          type: "button",
          role: "tab",
          className: `dtab${item.count === 0 ? " dtab-off" : ""}`,
          "aria-selected": tab === item.id,
          onClick: () => setTab(item.id),
          children: [
            item.label,
            item.count !== void 0 && item.count > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "n", children: item.count }) : null
          ]
        },
        item.id
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "drawer-body d-pane", children: [
        tab === "conversation" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "d-conv", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-sec", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "\u4F1A\u8BDD" }),
          last?.sessionId === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "d-empty", children: "\u8FD9\u4E2A\u4EFB\u52A1\u8FD8\u6CA1\u8DD1\u8FC7\uFF0C\u8FD8\u6CA1\u6709\u4F1A\u8BDD\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-kv", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u4F1A\u8BDD" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v mono", children: last.sessionId })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u5F00\u59CB" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", children: new Date(last.startedAt).toLocaleString() })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u73B0\u72B6" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", children: running ? `\u6B63\u5728\u8DD1\uFF0C\u5DF2\u8DD1 ${humanDuration(now - last.startedAt)}` : `${outcomeLabel(last)} \xB7 \u8017\u65F6 ${humanDuration(durationOf(last, now))}` })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "view-note", style: { marginTop: 10 }, children: "\u771F\u5B9E\u7684\u4F1A\u8BDD\u5185\u5BB9\u8FD8\u6CA1\u5185\u5D4C\u8FDB\u6765\uFF08\u8981\u628A\u5BBF\u4E3B\u7684\u4F1A\u8BDD\u9875\u642C\u8FDB\u8FD9\u4E2A\u62BD\u5C49\uFF09\u3002 \u73B0\u5728\u70B9\u4E0B\u9762\u7684\u6309\u94AE\u5148\u628A\u5BBF\u4E3B\u5207\u5230\u90A3\u4E2A\u4F1A\u8BDD\u3002" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "btn btn-secondary", style: { marginTop: 8 }, onClick: openSession, children: copied ? "\u4F1A\u8BDD id \u5DF2\u590D\u5236" : "\u6253\u5F00\u4F1A\u8BDD" })
          ] })
        ] }) }) : null,
        tab === "goal" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(IntentPane, { task, intent, enrichment }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-sec", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "\u8D26\u672C\u539F\u6587" }),
            task.description.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { style: { fontSize: 14, lineHeight: 1.65 }, children: task.description }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "d-empty", style: { fontSize: 12 }, children: "\u8FD9\u5F20\u5361\u6CA1\u6709\u586B\u8BF4\u660E" }),
            task.prompt.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { marginTop: 14 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "view-note", style: { marginBottom: 6 }, children: "\u6267\u884C\u65F6\u4F1A\u53D1\u7ED9 DSH \u7684 prompt" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { className: "d-pre", children: task.prompt })
            ] }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-sec", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "\u66F4\u591A\u4FE1\u606F" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-kv", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u5DE5\u4F5C\u533A" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "v", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    "span",
                    {
                      className: "wdot",
                      style: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", marginRight: 6, ["--hue"]: String(hueOf(task.workspaceId ?? "")) },
                      "aria-hidden": "true"
                    }
                  ),
                  workspaces.nameOf(task.workspaceId),
                  workspaces.pathOf(task.workspaceId) !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "mono", style: { fontSize: 11, color: "var(--label-tertiary)" }, children: workspaces.pathOf(task.workspaceId) }) : null
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u521B\u5EFA" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", children: new Date(task.createdAt).toLocaleString() })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u66F4\u65B0" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", children: new Date(task.updatedAt).toLocaleString() })
              ] }),
              task.status === "done" || task.status === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u7ED3\u7B97" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", children: new Date(spanEnd(task, now)).toLocaleString() })
              ] }) : null,
              (task.tags ?? []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u6807\u7B7E" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", style: { display: "flex", gap: 5, flexWrap: "wrap" }, children: (task.tags ?? []).map((tag) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "span",
                  {
                    className: "badge",
                    style: { ["--hue"]: String(hueOf(tag.name)) },
                    title: tag.promptPrefix === void 0 ? "\u53EA\u662F\u663E\u793A\u7528\u7684\u6807\u7B7E" : `\u4F1A\u628A\u8FD9\u4E2A\u524D\u7F00\u62FC\u5230 prompt \u524D\u9762\uFF1A${tag.promptPrefix}`,
                    children: tag.name
                  },
                  tag.name
                )) })
              ] }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u6267\u884C" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", children: [
                  task.mode !== void 0 ? `\u9884\u8BBE ${task.mode}` : void 0,
                  task.model !== void 0 ? `\u6A21\u578B ${task.model}` : void 0,
                  task.permission !== void 0 ? `\u6743\u9650 ${task.permission}` : void 0,
                  task.reuseSession === true ? "\u590D\u7528\u4E0A\u4E00\u4E2A\u4F1A\u8BDD" : void 0,
                  task.teamRun === true ? "\u6309 Agent Team \u8DD1\u6574\u4E2A\u5B50\u6811" : void 0,
                  task.goalRun === false ? "\u53EA\u8DD1\u4E00\u8F6E\uFF08\u4E0D\u542F /goal\uFF09" : void 0
                ].filter((part) => part !== void 0).join(" \xB7 ") || "\u5168\u90E8\u8D70\u5BBF\u4E3B\u9ED8\u8BA4" })
              ] })
            ] })
          ] }),
          task.schedule !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ScheduleSection, { schedule: task.schedule }) : null
        ] }) : null,
        tab === "subtasks" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "d-sec", children: children.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "d-empty", children: "\u8FD9\u4E2A\u4EFB\u52A1\u6CA1\u6709\u5B50\u4EFB\u52A1" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "d-sec-head", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h3", { children: [
            "\u5B50\u4EFB\u52A1 ",
            rollup.total,
            " \u4E2A \xB7 \u5B8C\u6210 ",
            rollup.byStatus.done
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "d-sub", children: subtreeRows(task, index).map((row) => {
            const st = STATUS[row.task.status];
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "button",
              {
                type: "button",
                className: "item",
                style: { marginLeft: row.depth * 16 },
                title: `${st.label} \xB7 ${row.task.executions.length} \u6B21\u4F1A\u8BDD \xB7 \u6253\u5F00\u300C${row.task.title}\u300D`,
                onClick: () => onNavigate(row.task),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dot", style: { background: st.css }, "aria-hidden": "true" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "ttl", children: row.task.title }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "sid", children: [
                    settledNote(row.task, now),
                    " \xB7 ",
                    row.task.executions.length === 0 ? "\u6CA1\u6709\u4F1A\u8BDD" : `${row.task.executions.length} \u6B21\u4F1A\u8BDD`
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "chev", "aria-hidden": "true", children: "\u203A" })
                ]
              },
              row.task.id
            );
          }) })
        ] }) }) : null,
        tab === "schedule" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "d-sec", children: task.executions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "d-empty", children: "\u8FD9\u4E2A\u4EFB\u52A1\u8FD8\u6CA1\u8DD1\u8FC7\uFF0C\u4E00\u6B21\u5386\u53F2\u90FD\u6CA1\u6709\u3002" }),
          task.schedule !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "view-note", style: { marginTop: 8 }, children: "\u6392\u671F\u662F\u6392\u4E0A\u4E86\u3001\u8FD8\u6CA1\u5230\u89E6\u53D1\u7684\u65F6\u5019\u2014\u2014\u8DD1\u5B8C\u7B2C\u4E00\u6B21\uFF0C\u8FD9\u91CC\u5C31\u4F1A\u6709\u8BB0\u5F55\u3002" }) : null
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-sec-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h3", { children: [
              "\u5B9A\u65F6\u5386\u53F2 ",
              task.executions.length,
              " \u6B21"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "view-note", style: { marginLeft: "auto" }, children: "\u6700\u65B0\u5728\u4E0A" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "d-exlist", children: task.executions.slice().reverse().map((execution, offset) => {
            const ordinal = task.executions.length - offset;
            const scheduled = triggerOf(execution) === "schedule";
            const open = execution.endedAt === void 0;
            const tone = open ? "var(--state-warn)" : execution.result === "succeeded" ? "var(--state-success)" : execution.result === "failed" ? "var(--state-error)" : "var(--label-tertiary)";
            const current = last !== void 0 && execution.id === last.id;
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: `d-ex${current ? " on" : ""}`, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "r1", title: `\u7B2C ${ordinal} \u6B21 \xB7 \u5F00\u59CB ${new Date(execution.startedAt).toLocaleString()}${execution.endedAt === void 0 ? " / \u8FD8\u5728\u8DD1" : ` \xB7 \u7ED3\u675F ${new Date(execution.endedAt).toLocaleString()}`}${current ? "\uFF08\u300C\u4F1A\u8BDD\u300D\u90A3\u4E00\u9875\u663E\u793A\u7684\u5C31\u662F\u8FD9\u4E00\u6B21\uFF09" : ""}`, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "ord", children: [
                  "\u7B2C ",
                  ordinal,
                  " \u6B21"
                ] }),
                current ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "cur-mark", "aria-label": "\u5F53\u524D\u67E5\u770B\u7684\u8FD9\u4E00\u6B21", children: "\u5F53\u524D" }) : null,
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dot", style: { background: tone }, "aria-hidden": "true" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "when", children: shortTime(execution.startedAt, now) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "res", style: { color: tone }, children: open ? "\u8FD0\u884C\u4E2D" : outcomeLabel(execution) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dur", children: open ? `\u5DF2\u8FD0\u884C ${humanDuration(now - execution.startedAt)}` : humanDuration(durationOf(execution, now)) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "trig", children: scheduled ? "\u5B9A\u65F6" : "\u624B\u52A8" }),
                execution.sessionId !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "sid", title: `\u6253\u5F00\u4F1A\u8BDD ${execution.sessionId}`, onClick: () => onOpenSession(execution.sessionId), children: execution.sessionId }) : null
              ] }),
              execution.error !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "esub mono", title: execution.error, children: execution.error }) : null
            ] }, execution.id);
          }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "view-note", style: { marginTop: 10 }, children: [
            "\u300C\u5B9A\u65F6 / \u624B\u52A8\u300D\u662F",
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u63A8\u65AD" }),
            "\u4E0D\u662F\u8BB0\u5F55\uFF1A\u8D26\u672C\u91CC\u53EA\u5199\u4E86\u300C\u662F\u8C01\u53D1\u8D77\u7684\u300D\uFF0C \u5B9A\u65F6\u89E6\u53D1\u7684\u90A3\u4E00\u523B\u6CA1\u6709\u53D1\u8D77\u4F1A\u8BDD\uFF0C\u6240\u4EE5\u6CA1\u6709\u53D1\u8D77\u8005\u3002"
          ] })
        ] }) }) : null
      ] })
    ] })
  ] });
}
function IntentPane({ task, intent, enrichment }) {
  const [open, setOpen] = (0, import_react6.useState)(true);
  const busy = enrichment.running.includes(task.id);
  const model = modelFor(task, enrichment.model);
  const edited = enrichment.overrides[task.id] ?? {};
  const save = (patch) => {
    const next = { ...edited, ...patch };
    for (const [key, value] of Object.entries(next)) {
      if (value === void 0 || value === "") delete next[key];
    }
    void enrichment.save(task.id, next);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-sec", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-sec-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "\u4EFB\u52A1\u76EE\u6807" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "view-note", style: { marginLeft: "auto" }, children: model === null ? "\u6CA1\u627E\u5230\u53EF\u7528\u7684\u6A21\u578B" : `\u6A21\u578B\uFF1A${model}` }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: "btn btn-secondary",
          disabled: busy || model === null,
          title: model === null ? "\u8FD9\u4E2A\u90E8\u7F72\u95EE\u4E0D\u51FA\u6A21\u578B\u8DEF\u7531\uFF08\u5BBF\u4E3B\u7684 llm \u670D\u52A1\u6CA1\u63A5\u4E0A\uFF0C\u6216\u8005\u6A21\u578B\u76EE\u5F55\u4E3A\u7A7A\uFF09\u3002\u4E0B\u9762\u56DB\u6761\u4ECD\u7136\u6309\u8D26\u672C\u63A8\u51FA\u6765\u3002" : "\u8BA9\u6A21\u578B\u91CD\u8BFB\u8FD9\u5F20\u5361\u7684\u6807\u9898\u3001\u8BF4\u660E\u3001\u6267\u884C\u63D0\u793A\u548C\u6267\u884C\u8BB0\u5F55\uFF0C\u91CD\u65B0\u5F52\u7EB3\u56DB\u6761\u3002",
          onClick: () => void enrichment.run([task], true),
          children: busy ? "\u5F52\u7EB3\u4E2D\u2026" : enrichment.ai[task.id] === void 0 ? "\u7528\u6A21\u578B\u8865\u5168" : "\u91CD\u65B0\u5F52\u7EB3"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "btn btn-secondary", onClick: () => setOpen((value) => !value), children: open ? "\u6536\u8D77" : "\u5C55\u5F00" })
    ] }),
    enrichment.error !== null && enrichment.running.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "fb-error", children: [
      "\u6A21\u578B\u90A3\u6761\u8DEF\u6CA1\u8D70\u901A\uFF08",
      enrichment.error.reason,
      "\uFF09\uFF1A",
      enrichment.error.detail,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("br", {}),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "thin", children: "\u4E0B\u9762\u56DB\u6761\u662F\u6309\u8D26\u672C\u63A8\u7684\uFF0C\u4E0D\u53D7\u5F71\u54CD\u3002" })
    ] }) : null,
    open ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        FieldBlock,
        {
          label: "\u76EE\u6807",
          field: intent.goal,
          hint: "\u8FD9\u4E2A\u4EFB\u52A1\u8981\u8FBE\u6210\u4EC0\u4E48",
          onSave: (next) => save({ goal: next })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        FieldBlock,
        {
          label: "\u4F7F\u7528\u573A\u666F",
          field: intent.scenario,
          hint: "\u4EC0\u4E48\u65F6\u5019\u4F1A\u8DD1\u5B83",
          onSave: (next) => save({ scenario: next })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        FieldBlock,
        {
          label: "\u80CC\u666F",
          field: intent.background,
          hint: "\u8FD9\u4EF6\u4E8B\u662F\u600E\u4E48\u6765\u7684",
          onSave: (next) => save({ background: next })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "fblock", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "fb-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u9A8C\u6536" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            SourceTag,
            {
              source: intent.acceptance[0]?.source ?? "derived",
              why: "\u6761\u76EE\u672C\u8EAB\u6765\u81EA\u8D26\u672C\u91CC\u7684\u6267\u884C\u8BB0\u5F55\uFF0C\u52FE\u6CA1\u52FE\u662F\u4EBA\u7684\u5224\u65AD"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "fb-hint", children: "\u51ED\u54EA\u4E9B\u4E8B\u5B9E\u7B97\u5B83\u505A\u5B8C\u4E86" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { className: "acc-list", children: intent.acceptance.map((item) => {
          const done = (edited.acceptanceDone ?? []).includes(item.id);
          return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { className: done ? "done" : void 0, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "input",
                {
                  type: "checkbox",
                  checked: done,
                  onChange: () => {
                    const current = edited.acceptanceDone ?? [];
                    save({ acceptanceDone: done ? current.filter((id) => id !== item.id) : [...current, item.id] });
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: item.value })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SourceTag, { source: item.source, why: item.why })
          ] }, item.id);
        }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "fblock", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "fb-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u4F18\u5148\u7EA7" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SourceTag, { source: intent.priority.source, why: intent.priority.why })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "prio-row", children: ["urgent", "high", "medium", "low"].map((level) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            type: "button",
            className: `prio p-${level}${intent.priority.level === level ? " on" : ""}`,
            "aria-pressed": intent.priority.level === level,
            onClick: () => save({ priority: level === intent.priority.level && edited.priority === level ? void 0 : level }),
            children: PRIORITY_LABEL[level]
          },
          level
        )) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "view-note", style: { marginTop: 10 }, children: [
        "\u8FD9\u56DB\u6761\u8D26\u672C\u91CC\u90FD\u6CA1\u6709\uFF0C\u662F\u63A8\u51FA\u6765\u7684\uFF1A",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: "\u300C\u6309\u8D26\u672C\u63A8\u7684\u300D" }),
        "\u6BCF\u4E00\u53E5\u90FD\u80FD\u5728\u4E0B\u9762\u300C\u8D26\u672C\u539F\u6587\u300D\u91CC\u627E\u5230\u51FA\u5904\uFF0C",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: "\u300C\u6A21\u578B\u5F52\u7EB3\u300D" }),
        "\u662F\u6A21\u578B\u8BFB\u7D20\u6750\u5199\u7684\u3001\u53EF\u80FD\u4E0D\u51C6\uFF0C",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: "\u300C\u4F60\u6539\u7684\u300D" }),
        "\u4F18\u5148\u4E8E\u524D\u4E24\u8005\u3001\u6A21\u578B\u91CD\u8DD1\u4E5F\u76D6\u4E0D\u6389\u3002",
        enrichment.saveError !== null ? ` \u6539\u52A8\u5B58\u4E0D\u4E0B\uFF1A${enrichment.saveError}` : ""
      ] })
    ] }) : null
  ] });
}
var CRON_PRESETS = [
  { label: "\u6BCF\u5C0F\u65F6", cron: "0 * * * *" },
  { label: "\u6BCF\u5929 9 \u70B9", cron: "0 9 * * *" },
  { label: "\u6BCF\u5468\u4E00 9 \u70B9", cron: "0 9 * * 1" },
  { label: "\u6BCF\u6708 1 \u53F7 9 \u70B9", cron: "0 9 1 * *" },
  { label: "\u6BCF 15 \u5206\u949F", cron: "*/15 * * * *" }
];
function ScheduleSection({ schedule }) {
  const [open, setOpen] = (0, import_react6.useState)(false);
  const why = "\u8FD9\u4E00\u7248\u662F\u53EA\u8BFB\u7684\uFF1A\u6539\u6392\u671F\u8981\u5199\u8D26\u672C\uFF0C\u800C\u5199\u53EA\u80FD\u8D70\u4EFB\u52A1\u770B\u677F\u7684\u516C\u5F00\u5951\u7EA6";
  const matchesPreset = CRON_PRESETS.find((item) => item.cron === schedule.cron);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-sec", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "\u6392\u671F" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "d-kv", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u72B6\u6001" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "v", style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(IconClock, { filled: schedule.enabled }),
          schedule.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528",
          " \xB7 ",
          humanCron(schedule.cron),
          schedule.timeZone !== void 0 ? ` \xB7 ${schedule.timeZone}` : ""
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u4E0B\u6B21" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", children: schedule.nextRunAt === void 0 ? "\u2014" : new Date(schedule.nextRunAt).toLocaleString() })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u4E0A\u6B21\u89E6\u53D1" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "v", children: schedule.lastTriggeredAt === void 0 ? "\u8FD8\u6CA1\u6709\u89E6\u53D1\u8FC7" : new Date(schedule.lastTriggeredAt).toLocaleString() })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "sched-toggle", "aria-expanded": open, onClick: () => setOpen((value) => !value), children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: `caret${open ? " open" : ""}`, "aria-hidden": "true", children: "\u25B8" }),
      open ? "\u6536\u8D77\u53EA\u8BFB\u63A7\u4EF6" : "\u770B\u53EA\u8BFB\u63A7\u4EF6"
    ] }),
    open ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sched-ro", "aria-label": "\u6392\u671F\u63A7\u4EF6\uFF08\u53EA\u8BFB\uFF09", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sro-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u542F\u7528" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "switch is-ro", title: why, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: "checkbox", checked: schedule.enabled, disabled: true, readOnly: true }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "track", "aria-hidden": "true" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "txt", children: schedule.enabled ? "\u5F00" : "\u5173" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sro-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u9884\u8BBE" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sro-presets", children: CRON_PRESETS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            type: "button",
            className: `btn btn-secondary${item.cron === schedule.cron ? " on" : ""}`,
            disabled: true,
            title: why,
            "aria-pressed": item.cron === schedule.cron,
            children: item.label
          },
          item.cron
        )) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "sro-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "k", children: "\u8868\u8FBE\u5F0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { className: "sro-cron", value: schedule.cron, disabled: true, readOnly: true, title: why, "aria-label": "cron \u8868\u8FBE\u5F0F\uFF08\u53EA\u8BFB\uFF09" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "sro-human", children: humanCron(schedule.cron) })
      ] }),
      matchesPreset === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "view-note", children: "\u8FD9\u4E2A\u8868\u8FBE\u5F0F\u4E0D\u5728\u4E0A\u9762\u4E94\u4E2A\u9884\u8BBE\u91CC\u2014\u2014\u9884\u8BBE\u53EA\u662F\u5E38\u7528\u5199\u6CD5\uFF0C\u4E0D\u662F\u5168\u90E8\u3002" }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "ro-reason", children: [
        why,
        "\u3002"
      ] })
    ] }) : null
  ] });
}
function settledNote(task, now) {
  if (task.status !== "done" && task.status !== "failed") return STATUS[task.status].label;
  return `\u7ED3\u7B97 ${shortTime(spanEnd(task, now), now)}`;
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
var import_react7 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var DAY_MS = 864e5;
var DAY_W = 44;
var NAME_W = 220;
var SPAN = 21;
var HEAD_H = 34;
var ROW_H = 30;
var MIN_EXEC_W = 4;
var MIN_BAR_MS = DAY_MS / 6;
function Gantt({
  index,
  now,
  workspaces,
  selectedId,
  onSelect,
  onClearAll,
  hideSubtasks,
  onHideSubtasks,
  lanes,
  onLanes,
  sourceKind
}) {
  const [ws, setWs] = (0, import_react7.useState)("");
  const [trig, setTrig] = (0, import_react7.useState)("all");
  const windowStart = (0, import_react7.useMemo)(() => {
    const today = new Date(now);
    return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - (SPAN - 1) * DAY_MS;
  }, [now]);
  const wsOptions = (0, import_react7.useMemo)(
    () => [
      { value: "", label: "\u9879\u76EE" },
      ...workspaces.groups.filter((id) => id !== "").map((id) => ({ value: id, label: workspaces.nameOf(id), hue: hueOf(id) })),
      { value: "__none__", label: "\u672A\u9489", hue: 220 }
    ],
    [workspaces]
  );
  const visible = (0, import_react7.useMemo)(() => {
    const match = (task) => {
      if (ws === "__none__" && task.workspaceId !== void 0) return false;
      if (ws !== "" && ws !== "__none__" && task.workspaceId !== ws) return false;
      if (trig !== "all") {
        const last = lastExecution(task);
        if (last === void 0 || triggerOf(last) !== trig) return false;
      }
      return true;
    };
    const rows = [];
    for (const root of index.roots) {
      if (match(root) && spanEnd(root, now) >= windowStart) rows.push(root);
      if (hideSubtasks) continue;
      for (const child of index.childrenOf.get(root.id) ?? []) {
        if (child.archivedAt !== void 0) continue;
        if (match(child) && spanEnd(child, now) >= windowStart) rows.push(child);
      }
    }
    return rows;
  }, [index, now, windowStart, ws, trig, hideSubtasks]);
  const filtering = ws !== "" || trig !== "all";
  if (visible.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "view", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "view-bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Dropdown, { mini: true, className: "dd-gantt-ws", value: ws, options: wsOptions, ariaLabel: "\u7518\u7279\u7684\u9879\u76EE\u7B5B\u9009", onChange: setWs }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "select-wrap mini", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "select",
          {
            className: trig === "all" ? void 0 : "on",
            "aria-label": "\u7518\u7279\u7684\u89E6\u53D1\u65B9\u5F0F\u7B5B\u9009",
            value: trig,
            onChange: (event) => setTrig(event.target.value),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "all", children: "\u89E6\u53D1" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "schedule", children: "\u4EC5\u5B9A\u65F6" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "manual", children: "\u4EC5\u624B\u52A8" })
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gantt is-empty", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        EmptyState,
        {
          ...filtering ? { title: "\u6CA1\u6709\u5339\u914D\u7684\u4EFB\u52A1", body: "\u7B5B\u9009\u6761\u4EF6\u628A\u8D26\u672C\u6EE4\u7A7A\u4E86\uFF0C\u6E05\u4E00\u4E0B\u8BD5\u8BD5\u3002", actionLabel: "\u6E05\u7A7A\u5168\u90E8\u7B5B\u9009", onAction: () => {
            setWs("");
            setTrig("all");
            onClearAll();
          } } : index.roots.length === 0 ? emptyTaskCopy(sourceKind) : { title: "\u8FD9 21 \u5929\u91CC\u6CA1\u6709\u6D3B\u52A8", body: "\u7518\u7279\u53EA\u770B\u6700\u8FD1 21 \u5929\uFF0C\u66F4\u65E9\u7684\u4EFB\u52A1\u8FD8\u5728\u770B\u677F\u548C\u8FDB\u5EA6\u91CC\u3002" }
        }
      ) })
    ] });
  }
  const trackW = SPAN * DAY_W;
  const offsetOf = (ms) => (ms - windowStart) / DAY_MS * DAY_W;
  const laneList = lanes ? [...new Set(visible.map((task) => task.workspaceId))].sort((a, b) => a === void 0 ? 1 : b === void 0 ? -1 : workspaces.nameOf(a).localeCompare(workspaces.nameOf(b), "zh")).map((id) => ({ id, rows: visible.filter((task) => task.workspaceId === id) })) : [{ id: void 0, rows: visible }];
  let rowCount = 0;
  for (const lane of laneList) rowCount += lane.rows.length + (lanes ? 1 : 0);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "view", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "view-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Dropdown, { mini: true, className: "dd-gantt-ws", value: ws, options: wsOptions, ariaLabel: "\u7518\u7279\u7684\u9879\u76EE\u7B5B\u9009", onChange: setWs }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "select-wrap mini", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "select",
        {
          className: trig === "all" ? void 0 : "on",
          "aria-label": "\u7518\u7279\u7684\u89E6\u53D1\u65B9\u5F0F\u7B5B\u9009",
          value: trig,
          onChange: (event) => setTrig(event.target.value),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "all", children: "\u89E6\u53D1" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "schedule", children: "\u4EC5\u5B9A\u65F6" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "manual", children: "\u4EC5\u624B\u52A8" })
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "g-note", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: "view-note", children: "\u53E3\u5F84\uFF1A\u4EFB\u52A1\u4ECE\u521B\u5EFA\u5230\u6700\u8FD1\u4E00\u6B21\u6D3B\u52A8\u7684\u65F6\u95F4\u8DE8\u5EA6 \xB7 \u7AD6\u7EBF\uFF1D\u4ECA\u5929 \xB7 \u5B9E\u5FC3\u65B9\u5757\uFF1D\u5B9A\u65F6\u89E6\u53D1\uFF08\u6309\u6765\u6E90\u63A8\u65AD\uFF09" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Toggle, { checked: hideSubtasks, label: "\u9690\u85CF\u5B50\u4EFB\u52A1", title: "\u5B50\u4EFB\u52A1\u8DDF\u4E0D\u8DDF\u5728\u7236\u4EFB\u52A1\u540E\u9762\u663E\u793A\u3002\u53EA\u5F71\u54CD\u8FD9\u5F20\u7518\u7279\u56FE", onChange: onHideSubtasks }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Toggle, { checked: lanes, label: "\u6309\u5DE5\u4F5C\u533A\u5206\u6CF3\u9053", onChange: onLanes })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "gantt", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "g-inner", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "g-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "g-corner", children: "\u4EFB\u52A1" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "g-dates", children: Array.from({ length: SPAN }, (_, i) => {
          const date = new Date(windowStart + i * DAY_MS);
          const isToday = i === SPAN - 1;
          return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `cell${isToday ? " today" : ""}`, style: { width: DAY_W }, children: i % 3 === 0 || isToday ? `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tick" }) }, i);
        }) })
      ] }),
      laneList.map((lane, laneIndex) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
        lanes ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "g-row g-lane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "g-name", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "wdot", style: { ["--hue"]: String(hueOf(lane.id ?? "")) }, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "ttl", children: workspaces.nameOf(lane.id) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { marginLeft: "auto", fontWeight: 400, color: "var(--label-tertiary)" }, children: lane.rows.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "g-rest", style: { width: trackW } })
        ] }) : null,
        lane.rows.map((task) => {
          const isChild = task.parentId !== void 0;
          const end = Math.max(spanEnd(task, now), task.createdAt + MIN_BAR_MS);
          let x0 = offsetOf(task.createdAt);
          let x1 = offsetOf(end);
          const clipL = x0 < 0;
          const clipR = x1 > trackW;
          if (clipL) x0 = 0;
          if (clipR) x1 = trackW;
          let width2 = Math.max(x1 - x0, 8);
          if (x0 + width2 > trackW) x0 = Math.max(0, trackW - width2);
          width2 = Math.min(width2, trackW - x0);
          const running = isRunning(task);
          const last = lastExecution(task);
          const st = STATUS[task.status];
          const tip = `${task.title} \xB7 \u521B\u5EFA ${new Date(task.createdAt).toLocaleString()} \u2192 ${running ? "\u81F3\u4ECA" : new Date(end).toLocaleString()}`;
          return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "g-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              "button",
              {
                type: "button",
                className: `g-name${isChild ? " child" : ""}`,
                onClick: () => onSelect(task),
                title: tip,
                children: [
                  isChild ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "br", "aria-hidden": "true", children: "\u2514" }) : null,
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "span",
                    {
                      className: `g-wsmark${task.workspaceId === void 0 ? " unpin" : ""}`,
                      style: { ["--hue"]: String(hueOf(task.workspaceId ?? "")) },
                      title: workspaces.pathOf(task.workspaceId) ?? workspaces.nameOf(task.workspaceId),
                      children: workspaces.abbrOf(task.workspaceId)
                    }
                  ),
                  task.schedule !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "span",
                    {
                      className: "clk",
                      title: task.schedule.enabled ? `\u5B9A\u65F6\u5DF2\u542F\u7528 \xB7 ${task.schedule.cron}` : `\u5B9A\u65F6\u672A\u542F\u7528 \xB7 ${task.schedule.cron}`,
                      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(IconClock, { filled: task.schedule.enabled })
                    }
                  ) : null,
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "ttl", title: task.title, children: task.title })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
              "div",
              {
                className: "g-track",
                style: { width: trackW, ["--bh"]: String(st.hue), ["--bs"]: st.sat, ["--bl"]: st.lig },
                title: tip,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "g-grid" }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                    "div",
                    {
                      className: `g-bar ${task.status}${clipL ? " clip-l" : ""}${clipR ? " clip-r" : ""}`,
                      style: { left: x0, width: width2 },
                      children: task.executions.map((execution) => {
                        let a = offsetOf(execution.startedAt);
                        let b = offsetOf(execution.endedAt ?? now);
                        if (b < 0 || a > trackW) return null;
                        a = Math.max(a, 0);
                        b = Math.min(b, trackW);
                        const scheduled = triggerOf(execution) === "schedule";
                        return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                          "i",
                          {
                            className: `g-exec${scheduled ? " is-trig" : ""}`,
                            style: { left: a - x0, width: Math.max(b - a, scheduled ? 8 : MIN_EXEC_W) },
                            title: `${scheduled ? "\u5B9A\u65F6\u89E6\u53D1\uFF08\u6309\u6765\u6E90\u63A8\u65AD\uFF09" : "\u624B\u52A8\u89E6\u53D1"} ${new Date(execution.startedAt).toLocaleString()}`
                          },
                          execution.id
                        );
                      })
                    }
                  ),
                  last !== void 0 && last.endedAt === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "g-pulse", style: { left: x0 + width2 } }) : null
                ]
              }
            )
          ] }, task.id);
        })
      ] }, `lane-${laneIndex}`)),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "g-today", style: { left: NAME_W + offsetOf(now), top: HEAD_H, height: rowCount * ROW_H } })
    ] }) })
  ] });
}

// src/client/views/Progress.tsx
var import_react8 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var DAY_MS2 = 864e5;
var PRESETS = [
  { id: "week", label: "\u672C\u5468" },
  { id: "d7", label: "\u8FD1 7 \u5929" },
  { id: "d30", label: "\u8FD1 30 \u5929" },
  { id: "d90", label: "\u8FD1 90 \u5929" },
  { id: "all", label: "\u5168\u90E8\u65F6\u95F4" }
];
var iso = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
var startOfDay = (ms) => new Date(ms).setHours(0, 0, 0, 0);
var startOfWeek = (ms) => {
  const d = new Date(startOfDay(ms));
  const shift = (d.getDay() + 6) % 7;
  return d.getTime() - shift * DAY_MS2;
};
var startOfMonth = (ms) => new Date(new Date(ms).getFullYear(), new Date(ms).getMonth(), 1).getTime();
function Progress({ index, now, workspaces, onSelect, sourceKind }) {
  const [from, setFrom] = (0, import_react8.useState)(() => startOfDay(now - 29 * DAY_MS2));
  const [to, setTo] = (0, import_react8.useState)(() => startOfDay(now));
  const [preset, setPreset] = (0, import_react8.useState)("d30");
  const bad = from > to;
  const lastGood = (0, import_react8.useRef)({ from: 0, to: 0 });
  if (!bad) lastGood.current = { from, to };
  const applyPreset = (id) => {
    const today = startOfDay(now);
    setPreset(id);
    setTo(today);
    if (id === "week") setFrom(startOfWeek(now));
    else if (id === "d7") setFrom(today - 6 * DAY_MS2);
    else if (id === "d30") setFrom(today - 29 * DAY_MS2);
    else if (id === "d90") setFrom(today - 89 * DAY_MS2);
    else {
      let earliest = today;
      for (const task of index.onBoard) earliest = Math.min(earliest, startOfDay(task.createdAt));
      setFrom(earliest);
    }
  };
  const effective = bad ? lastGood.current : { from, to };
  const range = (0, import_react8.useMemo)(
    () => ({ from: effective.from, to: effective.to + DAY_MS2 - 1 }),
    [effective.from, effective.to]
  );
  const stats = (0, import_react8.useMemo)(() => {
    const count = {};
    for (const status of STATUS_ORDER) count[status] = 0;
    let total = 0;
    let scheduled = 0;
    let scheduledOn = 0;
    let bigTasks = 0;
    let subtasks = 0;
    for (const task of index.onBoard) {
      if (task.parentId !== void 0) {
        subtasks += 1;
        continue;
      }
      bigTasks += 1;
      if (task.schedule !== void 0) {
        scheduled += 1;
        if (task.schedule.enabled) scheduledOn += 1;
      }
      const ended = task.status === "done" || task.status === "failed";
      if (ended) {
        const at = spanEnd(task, now);
        if (at < range.from || at > range.to) continue;
      }
      total += 1;
      count[task.status] += 1;
    }
    return { count, total, scheduled, scheduledOn, bigTasks, subtasks };
  }, [index.onBoard, now, range]);
  const workspacesWithTasks = (0, import_react8.useMemo)(() => {
    const buckets = /* @__PURE__ */ new Map();
    for (const task of index.onBoard) {
      const key = task.workspaceId ?? "";
      const bucket = buckets.get(key);
      if (bucket === void 0) buckets.set(key, [task]);
      else bucket.push(task);
    }
    return [...buckets.entries()].sort((a, b) => {
      if (a[0] === "") return 1;
      if (b[0] === "") return -1;
      return workspaces.nameOf(a[0]).localeCompare(workspaces.nameOf(b[0]), "zh");
    });
  }, [index.onBoard, workspaces]);
  const period = (0, import_react8.useMemo)(() => buildPeriod(index.onBoard, now), [index.onBoard, now]);
  if (index.onBoard.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "progress is-empty", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(EmptyState, { ...emptyTaskCopy(sourceKind) }) });
  }
  const rate = stats.total === 0 ? 0 : Math.round(stats.count.done / stats.total * 100);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "progress", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "view-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "p-date", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "date",
            "aria-label": "\u5F00\u59CB\u65E5\u671F",
            className: bad ? "bad" : void 0,
            value: iso(from),
            onChange: (event) => {
              setFrom((/* @__PURE__ */ new Date(`${event.target.value}T00:00:00`)).getTime());
              setPreset(null);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "to", children: "\u2192" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "date",
            "aria-label": "\u7ED3\u675F\u65E5\u671F",
            className: bad ? "bad" : void 0,
            value: iso(to),
            onChange: (event) => {
              setTo((/* @__PURE__ */ new Date(`${event.target.value}T00:00:00`)).getTime());
              setPreset(null);
            }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "p-quick", children: PRESETS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", "aria-pressed": preset === item.id, onClick: () => applyPreset(item.id), children: item.label }, item.id)) }),
      bad ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "p-err", children: [
        "\u7ED3\u675F\u65E5\u671F\u65E9\u4E8E\u5F00\u59CB\u65E5\u671F\uFF0C\u4E0B\u9762\u8FD9\u4E9B\u6570\u8FD8\u662F ",
        dayKey(effective.from),
        " ~ ",
        dayKey(effective.to),
        " \u7684"
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "view-note", children: [
      "\u53E3\u5F84\uFF1A\u5DF2\u5B8C\u6210\u4EFB\u52A1\u6570 \xF7 \u603B\u4EFB\u52A1\u6570 \xB7 \u7EDF\u8BA1\u8303\u56F4 ",
      dayKey(effective.from),
      " ~ ",
      dayKey(effective.to),
      " \xB7 \u65F6\u95F4\u8303\u56F4\u53EA\u7B5B\u5DF2\u7ECF\u7ED3\u675F\u7684\u4EFB\u52A1\uFF0C\u8FD8\u5F00\u7740\u7684\uFF08\u5F85\u89C4\u5212 / \u5F85\u529E / \u8FDB\u884C\u4E2D\uFF09\u6C38\u8FDC\u8BA1\u5165 \xB7 \u5B9A\u65F6 / \u5927\u4EFB\u52A1 / \u5B50\u4EFB\u52A1\u5206\u522B\u7EDF\u8BA1"
    ] }),
    stats.total === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "p-range-empty", children: "\u8FD9\u4E2A\u65E5\u671F\u533A\u95F4\u91CC\u6CA1\u6709\u5DF2\u7ECF\u7ED3\u675F\u7684\u4EFB\u52A1\u3002\u8FD8\u5F00\u7740\u7684\u4EFB\u52A1\u4E0D\u4F1A\u88AB\u533A\u95F4\u7B5B\u6389\uFF0C\u653E\u5BBD\u4E00\u4E0B\u6B62\u65E5\u8BD5\u8BD5\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-top", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "panel p-donut", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        Donut,
        {
          slices: STATUS_ORDER.map((status) => ({ value: stats.count[status], css: STATUS[status].css, label: STATUS[status].label })),
          center: `${rate}%`,
          sub: `${stats.count.done} / ${stats.total} \u5DF2\u5B8C\u6210`,
          ariaLabel: `\u6309\u72B6\u6001\u5206\u5E03\u7684\u4EFB\u52A1\u5360\u6BD4\uFF0C\u5B8C\u6210\u7387 ${rate}%`
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "panel p-list", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: "\u6309\u72B6\u6001" }),
        STATUS_ORDER.map((status) => {
          const n = stats.count[status];
          const pct = stats.total === 0 ? 0 : n / stats.total * 100;
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "pd", style: { background: STATUS[status].css }, "aria-hidden": "true" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "pn", children: STATUS[status].label }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "ptrack", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "pfill", style: { width: `${pct}%`, background: STATUS[status].css } }) }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "pc", children: n }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "pp", children: [
              Math.round(pct),
              "%"
            ] })
          ] }, status);
        }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-total", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "\u4EFB\u52A1\u603B\u6570" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: stats.total })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-break", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "bk", title: "\u6709\u5B9A\u65F6\u89C4\u5219\u7684\u4EFB\u52A1\uFF0C\u5176\u4E2D\u5DF2\u542F\u7528\u7684\u4F1A\u81EA\u52A8\u89E6\u53D1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "k", children: "\u5B9A\u65F6" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: stats.scheduled }),
            stats.scheduled > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "sub", children: [
              stats.scheduledOn,
              " \u542F\u7528"
            ] }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "bk", title: "\u5927\u4EFB\u52A1\uFF1D\u4E0D\u5E26\u7236\u4EFB\u52A1\u7684\u9876\u5C42\u4EFB\u52A1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "k", children: "\u5927\u4EFB\u52A1" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: stats.bigTasks })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "bk", title: "\u5B50\u4EFB\u52A1\uFF1D\u6302\u5728\u5927\u4EFB\u52A1\u4E0B\u9762\u7684\u4EFB\u52A1", children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "k", children: "\u5B50\u4EFB\u52A1" }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: stats.subtasks })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "panel p-goal", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-goal-hd", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: "\u672C\u671F\u8DD1\u52A8" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "hint view-note", children: [
          "\u4E0D\u968F\u4E0A\u9762\u7684\u65E5\u671F\u8303\u56F4\u53D8\u3002",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: "\u76EE\u6807\u4E0D\u662F\u8C01\u8BBE\u7684" }),
          "\u2014\u2014\u5B83\u7531\u5DF2\u542F\u7528\u7684\u5B9A\u65F6\u89C4\u5219\u7B97\u51FA\u6765\uFF1A \u300C\u6BCF\u5929\u8DD1\u4E00\u6B21\u300D\u5C31\u7B49\u4E8E\u8FD9\u4E00\u5468\u8BE5\u8DD1 7 \u6B21\u3002\u6CA1\u6392\u671F\u7684\u3001\u4EE5\u53CA\u4E00\u5929\u8DD1\u4E0D\u6B62\u4E00\u6B21\u7684\uFF0C\u90FD\u6CA1\u6709\u76EE\u6807\uFF0C\u53EA\u770B\u5B9E\u8DD1\u3002"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "pg-wrap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PeriodRow, { label: "\u672C\u5468", range: period.week.range, data: period.week }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PeriodRow, { label: "\u672C\u6708", range: period.month.range, data: period.month })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: `pg-left${period.lastFailed > 0 ? " warn" : ""}`, title: "\u4E0A\u4E00\u671F\uFF08\u4E0A\u5468 / \u4E0A\u6708\uFF09\u91CC\u5931\u8D25\u8FC7\u7684\u6267\u884C\u6570\u3002\u5199\u5468\u62A5\u65F6\u8981\u4EA4\u4EE3\u7684\u5C31\u662F\u8FD9\u4E9B", children: period.lastFailed > 0 ? `\u26A0 \u4E0A\u671F\u6709 ${period.lastFailed} \u6B21\u6267\u884C\u5931\u8D25` : "\u4E0A\u4E00\u671F\u6CA1\u6709\u5931\u8D25\u7684\u6267\u884C" }),
      period.unschedulable > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "pg-note", title: "\u8FD9\u4E9B\u6392\u671F\u7684 cron \u5199\u6CD5\u6BD4\u8F83\u5C11\u89C1\uFF0C\u8FD9\u4E2A\u89C6\u56FE\u8BA4\u4E0D\u51FA\u6765\uFF0C\u6240\u4EE5\u6CA1\u6709\u628A\u5B83\u4EEC\u7B97\u8FDB\u76EE\u6807\u91CC\u2014\u2014\u5B81\u53EF\u5C11\u7B97\uFF0C\u4E5F\u4E0D\u7ED9\u4E00\u4E2A\u9519\u7684\u76EE\u6807", children: [
        "\u53E6\u6709 ",
        period.unschedulable,
        " \u6761\u6392\u671F\u7684 cron \u5199\u6CD5\u8BA4\u4E0D\u51FA\u6765\uFF0C\u6CA1\u7B97\u8FDB\u76EE\u6807"
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "p-secttl", children: "\u6309\u5DE5\u4F5C\u533A \xB7 \u6BCF\u4E2A\u5DE5\u4F5C\u533A\u4E00\u5F20\u5361" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "p-grid", style: { marginTop: 8 }, children: workspacesWithTasks.map(([id, tasks]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        WorkspaceCard,
        {
          id,
          tasks,
          workspaces,
          now,
          onSelect
        },
        id || "__none__"
      )) })
    ] })
  ] });
}
function PeriodRow({ label, range, data }) {
  const pct = data.expected > 0 ? Math.min(100, data.runs / data.expected * 100) : data.settled === 0 ? 0 : data.succeeded / data.settled * 100;
  const short = data.expected > 0 && data.runs < data.expected;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "pg", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "k", children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "rg", children: range }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "nm", children: [
      data.expected > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        "\u5E94\u8DD1 ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: data.expected }),
        " \u6B21 \xB7 \u5B9E\u8DD1 ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { className: short ? "short" : void 0, children: data.runs }),
        " \u6B21"
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: data.runs }),
        " \u6B21\u6267\u884C"
      ] }),
      " \xB7 ",
      "\u6210\u529F ",
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: data.succeeded }),
      data.failed > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        " \xB7 \u5931\u8D25 ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: data.failed })
      ] }) : null,
      data.open > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        " \xB7 \u5728\u8DD1 ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: data.open })
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `pg-track${short ? " warn" : ""}`, style: { gridColumn: "1 / -1" }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "pg-fill", style: { width: `${pct}%` } }) }),
    data.expected > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "pg-sub view-note", children: short ? `\u6309\u5DF2\u542F\u7528\u7684\u6392\u671F\uFF0C\u8FD9\u4E00\u671F\u5E94\u8BE5\u8DD1 ${data.expected} \u6B21\uFF0C\u5B9E\u9645\u5C11\u4E86 ${data.expected - data.runs} \u6B21` : data.runs > data.expected ? `\u6BD4\u6392\u671F\u591A\u8DD1\u4E86 ${data.runs - data.expected} \u6B21\uFF08\u624B\u52A8\u53D1\u7684\uFF09` : "\u8DDF\u6392\u671F\u5BF9\u4E0A\u4E86" }) : null
  ] });
}
function buildPeriod(tasks, now) {
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const lastWeekStart = weekStart - 7 * DAY_MS2;
  const lastMonthStart = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - 1, 1).getTime();
  const blank = (range) => ({ runs: 0, succeeded: 0, failed: 0, settled: 0, open: 0, expected: 0, range });
  const week = blank(`${iso(weekStart).slice(5)} ~ ${iso(weekStart + 6 * DAY_MS2).slice(5)}`);
  const month = blank(`${new Date(now).getFullYear()} \u5E74 ${new Date(now).getMonth() + 1} \u6708`);
  let lastFailed = 0;
  let unschedulable = 0;
  for (const task of tasks) {
    const schedule = task.schedule;
    if (schedule !== void 0 && schedule.enabled) {
      const weekExpect = expectedRuns(schedule.cron, weekStart, now);
      const monthExpect = expectedRuns(schedule.cron, monthStart, now);
      if (weekExpect === void 0 || monthExpect === void 0) unschedulable += 1;
      else {
        week.expected += weekExpect;
        month.expected += monthExpect;
      }
    }
    for (const execution of task.executions) {
      const at = execution.startedAt;
      for (const [bucket, from, to] of [[week, weekStart, now], [month, monthStart, now]]) {
        if (at < from || at > to) continue;
        bucket.runs += 1;
        if (execution.endedAt === void 0) bucket.open += 1;
        else {
          bucket.settled += 1;
          if (execution.result === "succeeded") bucket.succeeded += 1;
          else if (execution.result === "failed") bucket.failed += 1;
        }
      }
      if (at >= lastWeekStart && at < weekStart && execution.result === "failed") lastFailed += 1;
      else if (at >= lastMonthStart && at < monthStart && execution.result === "failed") lastFailed += 1;
    }
  }
  return { week, month, lastFailed, unschedulable };
}
function WorkspaceCard({ id, tasks, workspaces, now }) {
  const unpinned = id === "";
  const count = {};
  for (const status of STATUS_ORDER) count[status] = 0;
  for (const task of tasks) count[task.status] += 1;
  const total = tasks.length;
  const done = count.done;
  const rate = total === 0 ? 0 : Math.round(done / total * 100);
  const percents = largestRemainder(STATUS_ORDER.map((status) => count[status]), total);
  const weekStart = startOfWeek(now);
  const weekRuns = runsIn(tasks, weekStart, now);
  let expected = 0;
  let computable = true;
  for (const task of tasks) {
    if (task.schedule === void 0 || !task.schedule.enabled) continue;
    const want = expectedRuns(task.schedule.cron, weekStart, now);
    if (want === void 0) computable = false;
    else expected += want;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "panel p-ws", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-ws-hd", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "span",
        {
          className: "wdot",
          style: { width: 8, height: 8, borderRadius: "50%", flex: "0 0 8px", ["--hue"]: String(hueOfId(id)) },
          "aria-hidden": "true"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `nm${unpinned ? " unpin" : ""}`, title: workspaces.pathOf(id) ?? workspaces.nameOf(id), children: workspaces.nameOf(id || void 0) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-ws-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "p-ws-ring", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        Donut,
        {
          size: 88,
          thickness: 10,
          slices: STATUS_ORDER.map((status) => ({ value: count[status], css: STATUS[status].css, label: STATUS[status].label })),
          center: `${rate}%`,
          ariaLabel: `\u5B8C\u6210\u7387 ${rate}%`
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-ws-num", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("b", { children: [
          total,
          " \u4E2A\u4EFB\u52A1"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
          "\u5B8C\u6210 ",
          done,
          " \u4E2A"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "span",
        {
          className: "stk",
          role: "img",
          "aria-label": `\u6309\u72B6\u6001\u7684\u4EFB\u52A1\u5360\u6BD4\uFF1A${STATUS_ORDER.map((s, i) => `${STATUS[s].label} ${percents[i]}%`).join("\uFF0C")}`,
          children: STATUS_ORDER.map(
            (status, i) => count[status] === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sg", style: { width: `${percents[i]}%`, background: STATUS[status].css } }, status)
          )
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "stk-lg", style: { marginTop: 7 }, children: STATUS_ORDER.map(
        (status, i) => count[status] === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "lg", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("i", { style: { background: STATUS[status].css }, "aria-hidden": "true" }),
          STATUS[status].label,
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("b", { children: [
            percents[i],
            "%"
          ] })
        ] }, status)
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "p-break", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "bk", title: "\u6709\u5B9A\u65F6\u89C4\u5219\u7684\u4EFB\u52A1\uFF0C\u5176\u4E2D\u5DF2\u542F\u7528\u7684\u4F1A\u81EA\u52A8\u89E6\u53D1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "k", children: "\u5B9A\u65F6" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: tasks.filter((task) => task.schedule !== void 0).length }),
        tasks.some((task) => task.schedule?.enabled === true) ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "sub", children: [
          tasks.filter((task) => task.schedule?.enabled === true).length,
          " \u542F\u7528"
        ] }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "bk", title: "\u5927\u4EFB\u52A1\uFF1D\u4E0D\u5E26\u7236\u4EFB\u52A1\u7684\u9876\u5C42\u4EFB\u52A1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "k", children: "\u5927\u4EFB\u52A1" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: tasks.filter((task) => task.parentId === void 0).length })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "bk", title: "\u5B50\u4EFB\u52A1\uFF1D\u6302\u5728\u5927\u4EFB\u52A1\u4E0B\u9762\u7684\u4EFB\u52A1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "k", children: "\u5B50\u4EFB\u52A1" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: tasks.filter((task) => task.parentId !== void 0).length })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "div",
      {
        className: `p-ws-goal${weekRuns.runs === 0 && expected === 0 ? " none" : ""}`,
        title: "\u8FD9\u4E2A\u5DE5\u4F5C\u533A\u91CC\u7684\u4EFB\u52A1\u672C\u5468\u8DD1\u4E86\u51E0\u6B21\uFF1B\u6709\u5DF2\u542F\u7528\u6392\u671F\u7684\u8BDD\uFF0C\u524D\u9762\u8FD8\u4F1A\u5199\u6309\u6392\u671F\u8BE5\u8DD1\u51E0\u6B21",
        children: [
          expected > 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
            "\u672C\u5468\u5E94\u8DD1 ",
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: expected }),
            " \u6B21 \xB7 \u5B9E\u8DD1 ",
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: weekRuns.runs }),
            " \u6B21"
          ] }) : weekRuns.runs === 0 ? "\u672C\u5468\u6CA1\u8DD1\u8FC7" : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
            "\u672C\u5468\u8DD1\u8FC7 ",
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("b", { children: weekRuns.runs }),
            " \u6B21"
          ] }),
          !computable ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "thin", children: "\uFF08\u6709\u6392\u671F\u8BA4\u4E0D\u51FA\u6765\uFF0C\u6CA1\u7B97\u8FDB\u76EE\u6807\uFF09" }) : null
        ]
      }
    )
  ] });
}
function hueOfId(id) {
  let hash = 0;
  for (const char of id) hash = hash * 31 + (char.codePointAt(0) ?? 0) >>> 0;
  return hash % 360;
}
function largestRemainder(values, total) {
  if (total === 0) return values.map(() => 0);
  const exact = values.map((value) => value / total * 100);
  const floored = exact.map(Math.floor);
  let rest = 100 - floored.reduce((sum, value) => sum + value, 0);
  const order = exact.map((value, index) => ({ index, frac: value - Math.floor(value) })).sort((a, b) => b.frac - a.frac);
  const out = [...floored];
  for (const item of order) {
    if (rest <= 0) break;
    out[item.index] += 1;
    rest -= 1;
  }
  return out;
}
function Donut({
  slices,
  center,
  sub,
  ariaLabel,
  size = 210,
  thickness = 26
}) {
  const visible = slices.filter((slice) => slice.value > 0);
  const total = visible.reduce((sum, slice) => sum + slice.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 2;
  let offset = 0;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, role: "img", "aria-label": ariaLabel, children: [
    total === 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", strokeWidth: thickness, style: { stroke: "var(--interactive-bg-hover)" } }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("g", { transform: `rotate(-90 ${size / 2} ${size / 2})`, children: visible.map((slice, index) => {
      const length = slice.value / total * circumference;
      const dash = Math.max(length - gap, 0.5);
      const element = /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "circle",
        {
          cx: size / 2,
          cy: size / 2,
          r: radius,
          fill: "none",
          strokeWidth: thickness,
          strokeDasharray: `${dash} ${circumference - dash}`,
          strokeDashoffset: -offset,
          style: { stroke: slice.css },
          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("title", { children: `${slice.label} ${slice.value} \u4E2A` })
        },
        index
      );
      offset += length;
      return element;
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("text", { className: size > 120 ? "big" : "rbig", x: "50%", y: "50%", textAnchor: "middle", dominantBaseline: "central", children: center }),
    sub !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("text", { className: "sub", x: "50%", y: "50%", dy: "22", textAnchor: "middle", dominantBaseline: "central", children: sub }) : null
  ] });
}

// src/client/views/Panel.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var VIEWS = [
  { id: "board", label: "\u770B\u677F" },
  { id: "gantt", label: "\u7518\u7279" },
  { id: "progress", label: "\u8FDB\u5EA6" }
];
var TICK_MS = 3e4;
function Panel({ ctx, source }) {
  const [view, setView] = (0, import_react9.useState)("board");
  const [selectedId, setSelectedId] = (0, import_react9.useState)(void 0);
  const [now, setNow] = (0, import_react9.useState)(() => Date.now());
  const [hideSubtasks, setHideSubtasks] = (0, import_react9.useState)(false);
  const [lanes, setLanes] = (0, import_react9.useState)(false);
  const [resetToken, setResetToken] = (0, import_react9.useState)(0);
  (0, import_react9.useEffect)(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  const index = (0, import_react9.useMemo)(() => buildIndex(source.snapshot.tasks), [source.snapshot.tasks]);
  const workspaceIds = (0, import_react9.useMemo)(
    () => [...new Set(index.onBoard.map((task) => task.workspaceId ?? ""))],
    [index.onBoard]
  );
  const workspaces = useWorkspaces(ctx, workspaceIds);
  const enrichment = useEnrichment(ctx);
  const selected = selectedId === void 0 ? void 0 : index.byId.get(selectedId);
  const intent = (0, import_react9.useMemo)(
    () => selected === void 0 ? void 0 : deriveIntent(selected, now, enrichment.ai[selected.id], enrichment.overrides[selected.id]),
    [selected, now, enrichment.ai, enrichment.overrides]
  );
  const selectedTaskId = selected?.id;
  const autoEnrich = enrichment.auto;
  (0, import_react9.useEffect)(() => {
    if (selected === void 0) return;
    autoEnrich([selected]);
  }, [selectedTaskId]);
  const backToConversation = () => {
    try {
      ctx.get("layout")?.selectPanel?.(null);
    } catch {
    }
  };
  const openBoard = source.snapshot.kind === "board" && ctx.get("layout")?.selectPanel !== void 0 ? () => {
    try {
      ctx.get("layout").selectPanel("task-board");
    } catch {
    }
  } : void 0;
  const openSession = (sessionId) => {
    for (const name2 of ["uiWorkspace"]) {
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
  const clearAll = () => {
    setHideSubtasks(false);
    setResetToken((token) => token + 1);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dsptb", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "panel-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "icon-btn", onClick: backToConversation, title: "\u56DE\u5230\u4F1A\u8BDD\u9875", "aria-label": "\u8FD4\u56DE\u4F1A\u8BDD", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M9.5 3.5 5 8l4.5 4.5" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { children: "\u89C4\u5212\u89C6\u56FE" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SourceBadge, { source }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "spacer" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "seg seg-view", role: "group", "aria-label": "\u5207\u6362\u89C6\u56FE", children: VIEWS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-pressed": view === item.id, onClick: () => setView(item.id), children: item.label }, item.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "page", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Banner, { source }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("section", { className: "view", "aria-label": "\u770B\u677F\u89C6\u56FE", hidden: view !== "board", children: view === "board" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        Board,
        {
          index,
          now,
          workspaces,
          selectedId,
          onSelect: (task) => setSelectedId(task.id),
          onClearAll: clearAll,
          sourceKind: source.snapshot.kind,
          onOpenBoard: openBoard
        }
      ) : null }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("section", { className: "view", "aria-label": "\u7518\u7279\u89C6\u56FE", hidden: view !== "gantt", children: view === "gantt" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        Gantt,
        {
          index,
          now,
          workspaces,
          selectedId,
          onSelect: (task) => setSelectedId(task.id),
          onClearAll: clearAll,
          hideSubtasks,
          onHideSubtasks: setHideSubtasks,
          lanes,
          onLanes: setLanes,
          sourceKind: source.snapshot.kind
        },
        `gantt-${resetToken}`
      ) : null }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("section", { className: "view", "aria-label": "\u8FDB\u5EA6\u89C6\u56FE", hidden: view !== "progress", children: view === "progress" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        Progress,
        {
          index,
          now,
          workspaces,
          onSelect: (task) => setSelectedId(task.id),
          sourceKind: source.snapshot.kind
        },
        `progress-${resetToken}`
      ) : null })
    ] }),
    selected !== void 0 && intent !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      Drawer,
      {
        task: selected,
        index,
        now,
        workspaces,
        onClose: () => setSelectedId(void 0),
        onNavigate: (task) => setSelectedId(task.id),
        onOpenSession: openSession,
        intent,
        enrichment
      },
      selected.id
    ) : null
  ] });
}
function SourceBadge({ source }) {
  const { snapshot, refresh, refreshing } = source;
  if (snapshot.kind === "board") {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "src-badge live", title: "\u6570\u636E\u6765\u81EA\u4EFB\u52A1\u770B\u677F\u7684\u5BA2\u6237\u7AEF\u670D\u52A1\uFF0C\u6539\u52A8\u4F1A\u7ACB\u523B\u53CD\u6620\u5230\u8FD9\u91CC", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dot", "aria-hidden": "true" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u5B9E\u65F6" }),
      snapshot.boardEnabled === false ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "src-note", children: "\uFF08\u770B\u677F\u7684\u6269\u5C55\u5F00\u5173\u5173\u7740\uFF09" }) : null
    ] });
  }
  if (snapshot.kind === "ledger") {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "src-badge snapshot", title: `\u4EFB\u52A1\u770B\u677F\u6CA1\u5728\u573A\uFF0C\u8BFB\u7684\u662F\u8D26\u672C\u5FEB\u7167\uFF1A${snapshot.path ?? ""}
\u8D26\u672C\u53D8\u4E86\u8FD9\u91CC\u4E0D\u4F1A\u81EA\u5DF1\u66F4\u65B0`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dot", "aria-hidden": "true" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u5FEB\u7167 \xB7 \u53EA\u8BFB" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "btn btn-secondary", style: { height: 22, fontSize: 11 }, onClick: refresh, disabled: refreshing, children: refreshing ? "\u8BFB\u53D6\u4E2D\u2026" : "\u5237\u65B0" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "src-badge stale", title: snapshot.detail ?? snapshot.reason ?? "", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "dot", "aria-hidden": "true" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u6CA1\u6709\u6570\u636E" })
  ] });
}
function Banner({ source }) {
  const { snapshot } = source;
  if (snapshot.kind === "board") return null;
  if (snapshot.kind === "unavailable" && snapshot.reason === "starting") {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "banner", role: "status", children: "\u6B63\u5728\u627E\u6570\u636E\u2026\u5148\u95EE\u4EFB\u52A1\u770B\u677F\uFF0C\u95EE\u4E0D\u5230\u518D\u8BFB\u8D26\u672C\u3002" });
  }
  if (snapshot.kind === "unavailable") {
    const text = snapshot.reason === "ledger-missing" ? "\u8D26\u672C\u6587\u4EF6\u8FD8\u4E0D\u5B58\u5728\u2014\u2014\u4EFB\u52A1\u770B\u677F\u5927\u6982\u6CA1\u8DD1\u8FC7\u3002" : snapshot.reason === "schema-mismatch" ? `\u8D26\u672C\u683C\u5F0F\u5BF9\u4E0D\u4E0A\uFF08\u6587\u4EF6\u91CC\u662F ${String(snapshot.detail ?? "\u672A\u77E5\u7248\u672C")}\uFF09\uFF0C\u4E0D\u731C\u5B57\u6BB5\uFF0C\u6240\u4EE5\u4EC0\u4E48\u90FD\u4E0D\u753B\u3002` : "\u4EFB\u52A1\u770B\u677F\u6CA1\u5728\u573A\uFF0C\u8D26\u672C\u4E5F\u8BFB\u4E0D\u5230\u3002";
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "banner", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round", "aria-hidden": "true", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 2.4 14.2 13H1.8z" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 6.4v3.1", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 11.3v.6", strokeLinecap: "round" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
        text,
        snapshot.path !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
          " ",
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "mono", children: snapshot.path })
        ] }) : null
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "banner", role: "status", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round", "aria-hidden": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 2.4 14.2 13H1.8z" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 6.4v3.1", strokeLinecap: "round" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 11.3v.6", strokeLinecap: "round" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
      "\u4EFB\u52A1\u770B\u677F\u672A\u6302\u8F7D \u2014\u2014 \u4EE5\u4E0B\u6570\u636E\u8BFB\u81EA ",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "mono", children: "$DSH_HOME/task-board/ledger-v2.json" }),
      " ",
      "\u5FEB\u7167\uFF08schemaVersion 5\uFF09\uFF0C\u4E0D\u542B\u5B9E\u65F6\u4E8B\u4EF6\u3002"
    ] })
  ] });
}

// src/client/index.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var name = "dsh-plugin-task-board";
var inject = ["slots"];
var PANEL_ID = "plan-views";
var PANEL_ORDER = 21;
function PlanPanelIcon({ size }) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("rect", { x: 2, y: 3, width: 12, height: 2.4, rx: 1.2 }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("rect", { x: 2, y: 6.8, width: 7.5, height: 2.4, rx: 1.2 }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("rect", { x: 2, y: 10.6, width: 10, height: 2.4, rx: 1.2 })
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
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Panel, { ctx, source });
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
  const MainPage = () => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(PlanPage, { ctx });
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
