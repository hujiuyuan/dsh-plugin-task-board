// src/index.ts
import { mkdir as mkdir2, readFile as readFile2, writeFile as writeFile2 } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname as dirname2, join, resolve as pathResolve } from "node:path";
import { homedir } from "node:os";

// src/enrich.ts
var ENRICH_TIMEOUT_MS = 45e3;
var MAX_MATERIAL_CHARS = 6e3;
var EnrichError = class extends Error {
  reason;
  constructor(reason, message) {
    super(message);
    this.reason = reason;
    this.name = "EnrichError";
  }
};
var SYSTEM_PROMPT = [
  "\u4F60\u5728\u7ED9\u4E00\u4E2A\u4EFB\u52A1\u770B\u677F\u4E0A\u7684\u5361\u7247\u8865\u5199\u56DB\u4E2A\u5B57\u6BB5\u3002",
  "",
  "\u4F60\u4F1A\u6536\u5230\u4E00\u5F20\u5361\u7684\u771F\u5B9E\u7D20\u6750\uFF1A\u6807\u9898\u3001\u8BF4\u660E\u3001\u6267\u884C\u63D0\u793A\u3001\u72B6\u6001\u3001\u5B9A\u65F6\u89C4\u5219\u3001\u5386\u6B21\u6267\u884C\u7684\u7ED3\u679C\uFF0C",
  "\u4EE5\u53CA\uFF08\u5982\u679C\u6709\u7684\u8BDD\uFF09\u5B83\u4E0A\u4E00\u6B21\u8DD1\u7684\u65F6\u5019\u4F1A\u8BDD\u91CC\u8BF4\u8FC7\u7684\u8BDD\u3002",
  "",
  "\u4F60**\u53EA\u80FD**\u7528\u8FD9\u4E9B\u7D20\u6750\u91CC\u7684\u4FE1\u606F\u3002\u8FD9\u662F\u786C\u89C4\u77E9\uFF1A",
  "- \u7D20\u6750\u91CC\u6CA1\u6709\u7684\u4E8B\u5B9E\uFF0C\u4E00\u4E2A\u5B57\u90FD\u4E0D\u8BB8\u7F16\u3002\u4E0D\u8981\u63A8\u6D4B\u8FD9\u4E2A\u4EFB\u52A1\u300C\u5927\u6982\u662F\u4E3A\u4E86\u4EC0\u4E48\u300D\u3002",
  "- \u54EA\u4E00\u6761\u7D20\u6750\u4E0D\u591F\uFF0C\u5C31\u628A\u5BF9\u5E94\u7684\u952E\u7559\u7A7A\u5B57\u7B26\u4E32\u6216\u7A7A\u6570\u7EC4\u3002**\u7559\u7A7A\u6BD4\u778E\u586B\u597D\u5F97\u591A\u3002**",
  "- \u4E0D\u8981\u590D\u8FF0\u7D20\u6750\u539F\u6587\uFF0C\u8981\u628A\u5B83\u6574\u7406\u6210\u4E00\u53E5\u4EBA\u80FD\u76F4\u63A5\u8BFB\u61C2\u7684\u8BDD\u3002",
  "- \u4F1A\u8BDD\u5185\u5BB9\u6392\u6700\u540E\u3001\u4E5F\u6700\u4E0D\u53EF\u9760\uFF1A\u91CC\u9762\u6DF7\u7740\u5927\u91CF\u8FC7\u7A0B\u7EC6\u8282\uFF08\u8BFB\u4E86\u54EA\u4E2A\u6587\u4EF6\u3001\u62A5\u4E86\u4EC0\u4E48\u9519\uFF09\u3002",
  "  \u5B83\u53EA\u5728\u8DDF\u6807\u9898\u3001\u8BF4\u660E\u3001\u6267\u884C\u63D0\u793A\u5BF9\u5F97\u4E0A\u7684\u65F6\u5019\u624D\u7528\u3002**\u524D\u9762\u90A3\u4E9B\u5B57\u6BB5\u4F18\u5148\u3002**",
  "",
  "\u53EA\u56DE\u4E00\u4E2A JSON \u5BF9\u8C61\uFF0C\u522B\u7684\u4EC0\u4E48\u90FD\u4E0D\u8981\uFF0C\u952E\u56FA\u5B9A\u662F\u8FD9\u56DB\u4E2A\uFF1A",
  '{"goal": string, "scenario": string, "background": string, "acceptance": string[], "confidence": "low"|"medium"|"high"}',
  "",
  "- goal\uFF1A\u8FD9\u5F20\u5361\u8981\u8FBE\u6210\u4EC0\u4E48\u3002\u4E00\u53E5\u8BDD\uFF0C\u6700\u591A 40 \u5B57\u3002\u7D20\u6750\u4E0D\u591F\u5C31\u7559\u7A7A\u3002",
  "- scenario\uFF1A\u4EC0\u4E48\u65F6\u5019\u4F1A\u7528\u5230\u5B83 / \u4EC0\u4E48\u65F6\u5019\u8DD1\u3002\u4E00\u53E5\u8BDD\uFF0C\u6700\u591A 40 \u5B57\u3002\u6709\u5B9A\u65F6\u89C4\u5219\u5C31\u7167\u7740\u8BF4\u3002",
  "- background\uFF1A\u8FD9\u4EF6\u4E8B\u7684\u6765\u9F99\u53BB\u8109\u3002\u4E00\u5230\u4E24\u53E5\u8BDD\uFF0C\u6700\u591A 80 \u5B57\u3002\u53EA\u5199\u7D20\u6750\u91CC\u6709\u7684\u3002",
  "- acceptance\uFF1A\u600E\u4E48\u7B97\u505A\u5B8C\u4E86\u3002**\u53EA\u4ECE\u7D20\u6750\u91CC\u7684\u6267\u884C\u7ED3\u679C\u53CD\u63A8**\uFF0C\u6700\u591A 3 \u6761\u3002",
  "  \u4F8B\u5982\u7D20\u6750\u8BF4\u8DD1\u6210\u529F\u8FC7 3 \u6B21\uFF0C\u5C31\u5199\u300C\u5DF2\u6709 3 \u6B21\u6267\u884C\u8DD1\u6210\u529F\u300D\u3002",
  "  \u7D20\u6750\u91CC\u4E00\u6B21\u90FD\u6CA1\u8DD1\u8FC7\u5C31\u7559\u7A7A\u6570\u7EC4\u2014\u2014\u4E0D\u8981\u7F16\u300C\u5E94\u8BE5\u901A\u8FC7\u6D4B\u8BD5\u300D\u8FD9\u79CD\u8BDD\u3002",
  "- confidence\uFF1A\u4F60\u5BF9\u4E0A\u9762\u5185\u5BB9\u7684\u628A\u63E1\u3002\u7D20\u6750\u5C11\u5C31\u7ED9 low\u3002",
  "",
  "\u7528\u7D20\u6750\u672C\u8EAB\u7684\u8BED\u8A00\u56DE\u7B54\uFF08\u7D20\u6750\u662F\u4E2D\u6587\u5C31\u7528\u4E2D\u6587\uFF09\u3002"
].join("\n");
function renderMaterial(material) {
  const lines = [
    `\u6807\u9898\uFF1A${material.title}`,
    `\u72B6\u6001\uFF1A${material.status}`
  ];
  if (material.description.trim().length > 0) lines.push(`\u8BF4\u660E\uFF1A${material.description.trim()}`);
  if (material.prompt.trim().length > 0) lines.push(`\u6267\u884C\u63D0\u793A\uFF1A${material.prompt.trim()}`);
  if (material.tags !== void 0 && material.tags.length > 0) lines.push(`\u6807\u7B7E\uFF1A${material.tags.join("\u3001")}`);
  if (material.schedule !== void 0) {
    lines.push(`\u5B9A\u65F6\u89C4\u5219\uFF1A${material.schedule.plan}\uFF08${material.schedule.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}\uFF09`);
  }
  if (material.runs.length === 0) {
    lines.push("\u6267\u884C\u8BB0\u5F55\uFF1A\u4E00\u6B21\u90FD\u6CA1\u6709\u8DD1\u8FC7");
  } else {
    lines.push(`\u6267\u884C\u8BB0\u5F55\uFF1A\u5171 ${material.runs.length} \u6B21`);
    for (const run of material.runs.slice(-5)) {
      const took = run.minutes === null ? "\u8FD8\u6CA1\u7ED3\u675F" : `\u8017\u65F6 ${run.minutes} \u5206\u949F`;
      lines.push(`  - ${run.result}\uFF0C${took}${run.error === void 0 ? "" : `\uFF0C\u62A5\u9519\uFF1A${run.error}`}`);
    }
  }
  if (material.transcript !== void 0 && material.transcript.trim().length > 0) {
    lines.push("", "\u8FD9\u4E2A\u4EFB\u52A1\u4E0A\u4E00\u6B21\u8DD1\u7684\u65F6\u5019\uFF0C\u4F1A\u8BDD\u91CC\u8BF4\u4E86\u8FD9\u4E9B\uFF08\u4EC5\u4F9B\u53C2\u8003\uFF0C\u4E0A\u9762\u90A3\u4E9B\u5B57\u6BB5\u4F18\u5148\uFF09\uFF1A", material.transcript.trim());
  }
  const text3 = lines.join("\n");
  return text3.length > MAX_MATERIAL_CHARS ? `${text3.slice(0, MAX_MATERIAL_CHARS)}
\u2026\uFF08\u622A\u65AD\uFF09` : text3;
}
function parseReply(reply) {
  const text3 = reply.replace(/```(?:json)?/gi, "").trim();
  const start2 = text3.indexOf("{");
  if (start2 < 0) return {};
  let depth = 0;
  let end = -1;
  let inString = false;
  let escaped = false;
  for (let i = start2; i < text3.length; i += 1) {
    const char = text3[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return {};
  let parsed;
  try {
    parsed = JSON.parse(text3.slice(start2, end + 1));
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null) return {};
  const raw = parsed;
  const out = {};
  const line = (value, limit) => typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, limit) : void 0;
  out.goal = line(raw.goal, 120);
  out.scenario = line(raw.scenario, 120);
  out.background = line(raw.background, 240);
  if (Array.isArray(raw.acceptance)) {
    const items = raw.acceptance.map((item) => line(item, 120)).filter((item) => item !== void 0).slice(0, 4);
    if (items.length > 0) out.acceptance = items;
  }
  if (raw.confidence === "low" || raw.confidence === "medium" || raw.confidence === "high") {
    out.confidence = raw.confidence;
  }
  return out;
}
async function enrichOnce(llm, route, material, signal) {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), ENRICH_TIMEOUT_MS);
  const relay = () => timeout.abort();
  signal?.addEventListener("abort", relay, { once: true });
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
        role: "user",
        source: { kind: "user" },
        content: [{ type: "text", text: material }]
      }],
      signal: timeout.signal
    });
    let reply = "";
    for await (const chunk of stream) {
      if (chunk?.type === "text-delta" && typeof chunk.text === "string") reply += chunk.text;
    }
    return parseReply(reply);
  } catch (error) {
    if (timeout.signal.aborted && signal?.aborted !== true) {
      throw new EnrichError("timeout", `\u6A21\u578B ${ENRICH_TIMEOUT_MS / 1e3} \u79D2\u6CA1\u56DE\u8BDD`);
    }
    throw new EnrichError("model-error", error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", relay);
  }
}
function splitRoute(qualified) {
  if (qualified === void 0 || qualified.trim().length === 0) return void 0;
  const text3 = qualified.trim();
  const cut = text3.indexOf("/");
  if (cut <= 0 || cut === text3.length - 1) return void 0;
  return { provider: text3.slice(0, cut), model: text3.slice(cut + 1) };
}

// src/sessionfacts.ts
var addressOf = (sessionId) => ({
  kind: "session",
  sessionId
});
var TAIL_EVENTS = 200;
var MAX_PAGES = 8;
async function readFacts(gateway, sessionIds, cache, signal) {
  const out = {};
  const wanted = [...new Set(sessionIds.filter((id) => typeof id === "string" && id.length > 0))];
  await Promise.all(
    wanted.map(async (id) => {
      out[id] = await readOne(gateway, id, cache, signal);
    })
  );
  return out;
}
async function readOne(gateway, sessionId, cache, signal) {
  let frame;
  try {
    frame = await openingFrame(gateway, sessionId, signal);
  } catch (error) {
    return { unreadable: true, why: `\u6253\u4E0D\u5F00\u8FD9\u4E2A\u4F1A\u8BDD\u7684\u4E8B\u4EF6\u6D41\uFF1A${text(error)}` };
  }
  if (frame === void 0) return {};
  const cursor = typeof frame.cursor === "number" ? frame.cursor : void 0;
  if (cursor === void 0) return { unreadable: true, why: "\u4E8B\u4EF6\u6D41\u6CA1\u7ED9\u51FA\u6E38\u6807\uFF0C\u8BFB\u4E0D\u4E86\u5C3E\u5DF4" };
  const hit = cache.get(sessionId);
  if (hit !== void 0 && hit.cursor === cursor) return hit.fact;
  let beforeSeq;
  let goalPhase;
  let sawGoalChange = false;
  let unfinishedAt;
  let sawEnd = false;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    let result;
    try {
      result = await gateway.invoke({
        namespace: "session",
        method: "page",
        args: {
          request: {
            address: addressOf(sessionId),
            throughSeq: cursor,
            maxMessages: TAIL_EVENTS,
            ...beforeSeq === void 0 ? {} : { beforeSeq }
          }
        },
        ...signal === void 0 ? {} : { signal }
      });
    } catch (error) {
      return { unreadable: true, why: `\u8BFB\u4E8B\u4EF6\u5931\u8D25\uFF1A${text(error)}` };
    }
    const records = Array.isArray(result?.records) ? result.records : [];
    let turn;
    for (let index = records.length - 1; index >= 0; index -= 1) {
      const event = records[index]?.event;
      if (event?.type === "turn/end") {
        sawEnd = true;
        if (turn === void 0) turn = turnFactOf(event);
      }
      if (event?.type === "turn/start" && !sawEnd && unfinishedAt === void 0) {
        unfinishedAt = typeof event.time === "number" ? event.time : 0;
      }
      if (page === 0 && !sawGoalChange && event?.type === "goal/change") {
        sawGoalChange = true;
        goalPhase = goalPhaseOf(event);
      }
      if (turn !== void 0 && page > 0) break;
      if (turn !== void 0 && sawGoalChange) break;
    }
    if (turn !== void 0) {
      const fact = {
        turn,
        ...goalPhase === void 0 ? {} : { goalPhase },
        // 上一轮有结论、最新那一轮却没有 —— 两个都带上，由下游挑（见 `unfinishedAt`）
        ...unfinishedAt === void 0 ? {} : { unfinishedAt }
      };
      cache.set(sessionId, { cursor, fact });
      return fact;
    }
    if (result?.hasMore !== true || records.length === 0) break;
    const oldest = records[0]?.event?.seq;
    if (typeof oldest !== "number" || oldest === beforeSeq) break;
    beforeSeq = oldest;
  }
  if (sawGoalChange || unfinishedAt !== void 0) {
    const fact = {
      ...goalPhase === void 0 ? {} : { goalPhase },
      ...unfinishedAt === void 0 ? {} : { unfinishedAt }
    };
    cache.set(sessionId, { cursor, fact });
    return fact;
  }
  return {};
}
async function openingFrame(gateway, sessionId, signal) {
  const request = {
    namespace: "session",
    method: "follow",
    args: { request: { address: addressOf(sessionId), maxMessages: 1 } },
    ...signal === void 0 ? {} : { signal }
  };
  if (typeof gateway.stream === "function") {
    const iterable = await gateway.stream(request);
    if (iterable !== void 0 && iterable !== null && typeof iterable[Symbol.asyncIterator] === "function") {
      const iterator = iterable[Symbol.asyncIterator]();
      try {
        const next = await iterator.next();
        const value = next.done === true ? void 0 : next.value;
        if (value !== void 0 && value !== null && value.type === "snapshot") return value;
      } finally {
        try {
          if (typeof iterator.return === "function") await iterator.return();
        } catch {
        }
      }
    }
  }
  const viaInvoke = await gateway.invoke(request);
  if (viaInvoke !== void 0 && viaInvoke !== null && typeof viaInvoke[Symbol.asyncIterator] === "function") {
    const iterator = viaInvoke[Symbol.asyncIterator]();
    try {
      const next = await iterator.next();
      const value = next.done === true ? void 0 : next.value;
      return value !== void 0 && value !== null && value.type === "snapshot" ? value : void 0;
    } finally {
      try {
        if (typeof iterator.return === "function") await iterator.return();
      } catch {
      }
    }
  }
  return void 0;
}
function turnFactOf(event) {
  const at = typeof event?.time === "number" ? event.time : 0;
  const reason = event?.data?.reason;
  if (reason === null || typeof reason !== "object") return { kind: "unknown", at };
  const kind = typeof reason.kind === "string" && reason.kind.length > 0 ? reason.kind : "unknown";
  if (kind !== "error") {
    const abortKind = kind === "aborted" ? nestedKind(reason.reason) : void 0;
    return { kind, at, ...abortKind === void 0 ? {} : { abortKind } };
  }
  const failure = reason.error;
  if (failure === null || typeof failure !== "object") return { kind, at };
  return {
    kind,
    at,
    ...typeof failure.code === "string" && failure.code.length > 0 ? { code: failure.code } : {},
    ...typeof failure.message === "string" && failure.message.length > 0 ? { message: failure.message } : {}
  };
}
function goalPhaseOf(event) {
  const phase = event?.data?.goal?.phase;
  return typeof phase === "string" && phase.length > 0 ? phase : void 0;
}
function nestedKind(value) {
  if (value === null || typeof value !== "object") return void 0;
  const kind = value.kind;
  return typeof kind === "string" && kind.length > 0 ? kind : void 0;
}
function text(error) {
  return error instanceof Error ? error.message : String(error);
}

// src/engine/engine.ts
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// src/engine/cron.ts
var RANGES = [
  ["\u5206", 0, 59],
  ["\u65F6", 0, 23],
  ["\u65E5", 1, 31],
  ["\u6708", 1, 12],
  ["\u5468", 0, 7]
];
function parseField(raw, label, min, max) {
  const values = /* @__PURE__ */ new Set();
  for (const part of raw.split(",")) {
    if (part.length === 0) throw new Error(`cron \u7684\u300C${label}\u300D\u6BB5\u6709\u7A7A\u9879`);
    const [range, stepText] = part.split("/");
    const step = stepText === void 0 ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) throw new Error(`cron \u7684\u300C${label}\u300D\u6BB5\u6B65\u957F\u4E0D\u5BF9\uFF1A${part}`);
    let from;
    let to;
    if (range === "*") {
      from = min;
      to = max;
    } else if (/^\d+-\d+$/.test(range)) {
      ;
      [from, to] = range.split("-").map(Number);
    } else if (/^\d+$/.test(range) && stepText === void 0) {
      from = to = Number(range);
    } else {
      throw new Error(`cron \u7684\u300C${label}\u300D\u6BB5\u8BA4\u4E0D\u51FA\uFF1A${part}`);
    }
    if (from < min || to > max || from > to) throw new Error(`cron \u7684\u300C${label}\u300D\u6BB5\u8D85\u51FA\u8303\u56F4 ${min}-${max}\uFF1A${part}`);
    for (let value = from; value <= to; value += step) values.add(label === "\u5468" && value === 7 ? 0 : value);
  }
  return { values, star: raw.startsWith("*") };
}
function parseCron(expression) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`cron \u8981 5 \u6BB5\uFF08\u5206 \u65F6 \u65E5 \u6708 \u5468\uFF09\uFF0C\u8FD9\u91CC\u662F ${parts.length} \u6BB5`);
  const [minute, hour, day, month, weekday] = parts.map((part, index) => {
    const [label, min, max] = RANGES[index];
    return parseField(part, label, min, max);
  });
  return { minute, hour, day, month, weekday };
}
var formatters = /* @__PURE__ */ new Map();
function wallClock(ms, timeZone) {
  const key = timeZone ?? "";
  let format = formatters.get(key);
  if (format === void 0) {
    format = new Intl.DateTimeFormat("en-US", {
      ...timeZone === void 0 ? {} : { timeZone },
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short"
    });
    formatters.set(key, format);
  }
  const parts = {};
  for (const part of format.formatToParts(ms)) parts[part.type] = part.value;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: weekdays.indexOf(parts.weekday ?? "")
  };
}
function isTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
function dayMatches(spec, clock) {
  const byDay = spec.day.values.has(clock.day);
  const byWeekday = spec.weekday.values.has(clock.weekday);
  if (!spec.day.star && !spec.weekday.star) return byDay || byWeekday;
  return byDay && byWeekday;
}
var MINUTE = 6e4;
var HOUR = 60 * MINUTE;
var HORIZON = 367 * 24 * HOUR;
function nextRunAt(expression, fromMs, timeZone) {
  const spec = parseCron(expression);
  let at = Math.floor(fromMs / MINUTE) * MINUTE + MINUTE;
  const end = fromMs + HORIZON;
  while (at <= end) {
    const clock = wallClock(at, timeZone);
    if (!spec.month.values.has(clock.month) || !dayMatches(spec, clock)) {
      at += HOUR - clock.minute * MINUTE;
      continue;
    }
    if (!spec.hour.values.has(clock.hour)) {
      at += HOUR - clock.minute * MINUTE;
      continue;
    }
    if (spec.minute.values.has(clock.minute)) return at;
    at += MINUTE;
  }
  return void 0;
}

// src/engine/engine.ts
var SCHEMA_VERSION = 1;
var KEEP_EXECUTIONS = 50;
var PATROL_MS = 5e3;
var MAX_TIMER_MS = 60 * 6e4;
var STATUSES = ["backlog", "todo", "running", "done", "failed"];
var PERMISSIONS = ["read-only", "workspace-write", "danger-full-access"];
var Refusal = class extends Error {
};
var BOOT_KEY = Symbol.for("dsh-plugin-task-board/engine-booted");
function newId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`}`;
}
function text2(value, field, limit) {
  if (typeof value !== "string") throw new Refusal(`${field}\u8981\u662F\u6587\u5B57`);
  if (value.length > limit) throw new Refusal(`${field}\u592A\u957F\u4E86\uFF08\u4E0A\u9650 ${limit} \u5B57\uFF09`);
  return value;
}
function outcomeOf(data) {
  const reason = data?.reason;
  const kind = typeof reason?.kind === "string" ? reason.kind : "unknown";
  if (kind === "completed") return { outcome: "succeeded" };
  if (kind === "aborted") {
    const by = typeof reason.reason?.kind === "string" ? reason.reason.kind : void 0;
    return { outcome: "cancelled", error: by === void 0 ? "\u88AB\u505C\u6B62\u4E86" : `\u88AB\u505C\u6B62\u4E86\uFF08${by}\uFF09` };
  }
  if (kind === "error") {
    const code = typeof reason.error?.code === "string" ? reason.error.code : void 0;
    const message = typeof reason.error?.message === "string" ? reason.error.message : void 0;
    return { outcome: "failed", error: [code, message].filter(Boolean).join("\uFF1A") || "\u8FD9\u4E00\u8F6E\u51FA\u9519\u7ED3\u675F" };
  }
  if (kind === "interrupted") return { outcome: "failed", error: "\u8FD9\u4E00\u8F6E\u88AB\u6253\u65AD\u4E86\uFF08App \u9000\u51FA\u6216\u91CD\u542F\u65F6\u8FD8\u6CA1\u8DD1\u5B8C\uFF09" };
  return { outcome: "failed", error: `\u8FD9\u4E00\u8F6E\u6CA1\u6709\u6B63\u5E38\u7ED3\u675F\uFF08${kind}\uFF09` };
}
function settledStatus(task, outcome) {
  if (outcome === "succeeded") return task.schedule?.enabled === true ? "todo" : "done";
  if (outcome === "failed") return "failed";
  return "todo";
}
function openExecution(task) {
  const last = task.executions[task.executions.length - 1];
  return last !== void 0 && last.endedAt === void 0 ? last : void 0;
}
function cronOf(rule) {
  return rule.mode === "once" ? void 0 : rule.cron;
}
var TaskEngine = class _TaskEngine {
  constructor(path, legacyLedgerPath, runner, log, note = () => {
  }) {
    this.path = path;
    this.legacyLedgerPath = legacyLedgerPath;
    this.runner = runner;
    this.log = log;
    this.note = note;
  }
  file = { schemaVersion: SCHEMA_VERSION, revision: 0, tasks: [] };
  queue = Promise.resolve();
  listeners = /* @__PURE__ */ new Set();
  watches = /* @__PURE__ */ new Map();
  patrolTimer;
  scheduleTimer;
  stopped = false;
  /** 正在读的会话，防止同一个会话被几路同时去读。 */
  inspecting = /* @__PURE__ */ new Set();
  // ── 生命周期 ────────────────────────────────────────────
  async start() {
    await this.load();
    const firstInProcess = globalThis[BOOT_KEY] !== true;
    globalThis[BOOT_KEY] = true;
    await this.reconcile(firstInProcess);
    this.patrolTimer = setInterval(() => this.patrol(), PATROL_MS);
    this.patrolTimer.unref?.();
    this.armSchedule(true);
  }
  stop() {
    this.stopped = true;
    if (this.patrolTimer !== void 0) clearInterval(this.patrolTimer);
    if (this.scheduleTimer !== void 0) clearTimeout(this.scheduleTimer);
    for (const stop of this.watches.values()) stop();
    this.watches.clear();
    this.listeners.clear();
  }
  snapshot() {
    return {
      revision: this.file.revision,
      tasks: this.file.tasks,
      ...this.file.importedFrom === void 0 ? {} : { importedFrom: this.file.importedFrom }
    };
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  // ── 存储 ────────────────────────────────────────────────
  async load() {
    let raw;
    try {
      raw = await readFile(this.path, "utf8");
    } catch {
      raw = void 0;
    }
    if (raw !== void 0) {
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== SCHEMA_VERSION || !Array.isArray(parsed.tasks)) {
        throw new Error(`${this.path} \u7684\u683C\u5F0F\u8BA4\u4E0D\u51FA\uFF08schemaVersion ${String(parsed.schemaVersion)}\uFF09\uFF0C\u6CA1\u6709\u52A8\u5B83`);
      }
      this.file = parsed;
      return;
    }
    await this.importLegacy();
  }
  /** 第一次启动：把旧账本里的卡搬过来。旧账本只读，搬完也不删。 */
  async importLegacy() {
    let tasks = [];
    try {
      const parsed = JSON.parse(await readFile(this.legacyLedgerPath, "utf8"));
      if (Array.isArray(parsed?.tasks)) {
        tasks = parsed.tasks.filter((t) => typeof t?.id === "string" && typeof t?.title === "string" && STATUSES.includes(t?.status)).map((t) => ({ ...t, executions: Array.isArray(t.executions) ? t.executions : [] }));
      }
    } catch {
    }
    this.file = {
      schemaVersion: SCHEMA_VERSION,
      revision: 1,
      ...tasks.length === 0 ? {} : { importedFrom: { path: this.legacyLedgerPath, at: Date.now(), count: tasks.length } },
      tasks
    };
    await this.persist();
    if (tasks.length > 0) this.note(`\u4ECE\u65E7\u8D26\u672C\u5BFC\u5165\u4E86 ${tasks.length} \u5F20\u5361\uFF1A${this.legacyLedgerPath}`);
  }
  /** 先写临时文件再改名：写到一半断电，原文件还是完整的。 */
  async persist() {
    await mkdir(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp-${process.pid}`;
    await writeFile(temp, `${JSON.stringify(this.file, null, 2)}
`, "utf8");
    await rename(temp, this.path);
  }
  /** 排队改一次。`mutate` 返回 false 表示没改，不落盘也不通知。 */
  change(mutate) {
    const run = this.queue.then(async () => {
      const tasks = this.file.tasks.map((task) => task);
      const result = mutate(tasks);
      if (result === false) return result;
      this.file = { ...this.file, revision: this.file.revision + 1, tasks };
      await this.persist();
      const snapshot = this.snapshot();
      for (const listener of this.listeners) {
        try {
          listener(snapshot);
        } catch {
        }
      }
      return result;
    });
    this.queue = run.catch(() => void 0);
    return run;
  }
  static find(tasks, taskId) {
    if (typeof taskId !== "string" || taskId === "") throw new Refusal("\u6CA1\u6307\u5B9A\u662F\u54EA\u5F20\u5361");
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index < 0) throw new Refusal("\u8FD9\u5F20\u5361\u4E0D\u5B58\u5728\u4E86\uFF08\u53EF\u80FD\u521A\u88AB\u5220\u6389\uFF09");
    return index;
  }
  // ── 写操作（界面发来的） ────────────────────────────────
  create(draft) {
    const title = text2(draft.title, "\u6807\u9898", 200).trim();
    if (title === "") throw new Refusal("\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A");
    const description = draft.description === void 0 ? "" : text2(draft.description, "\u8BF4\u660E", 2e4);
    const prompt = draft.prompt === void 0 ? "" : text2(draft.prompt, "\u6267\u884C\u63D0\u793A", 5e4);
    const status = draft.status === void 0 ? "todo" : draft.status;
    if (status !== "backlog" && status !== "todo") throw new Refusal("\u65B0\u5361\u53EA\u80FD\u653E\u8FDB\u300C\u5F85\u89C4\u5212\u300D\u6216\u300C\u5F85\u529E\u300D");
    return this.change((tasks) => {
      const now = Date.now();
      if (draft.parentId !== void 0) _TaskEngine.find(tasks, draft.parentId);
      const task = {
        id: newId("task"),
        title,
        description,
        prompt,
        status,
        createdAt: now,
        updatedAt: now,
        executions: [],
        ...typeof draft.parentId === "string" ? { parentId: draft.parentId } : {},
        ...typeof draft.workspaceId === "string" && draft.workspaceId !== "" ? { workspaceId: draft.workspaceId } : {}
      };
      tasks.push(task);
      return task;
    });
  }
  patch(taskId, patch) {
    return this.change((tasks) => {
      const index = _TaskEngine.find(tasks, taskId);
      const next = { ...tasks[index] };
      if (patch.title !== void 0) {
        const title = text2(patch.title, "\u6807\u9898", 200).trim();
        if (title === "") throw new Refusal("\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A");
        next.title = title;
      }
      if (patch.description !== void 0) next.description = text2(patch.description, "\u8BF4\u660E", 2e4);
      if (patch.prompt !== void 0) next.prompt = text2(patch.prompt, "\u6267\u884C\u63D0\u793A", 5e4);
      next.updatedAt = Date.now();
      tasks[index] = next;
    });
  }
  /** 手动挪列。挪进「进行中」得用「开始」；把在跑的卡挪走，这次执行记成取消。 */
  setStatus(taskId, status) {
    if (!STATUSES.includes(status)) throw new Refusal(`\u8BA4\u4E0D\u51FA\u7684\u5217\u300C${String(status)}\u300D`);
    if (status === "running") throw new Refusal("\u8981\u8BA9\u5B83\u8DD1\u8D77\u6765\u8BF7\u70B9\u300C\u5F00\u59CB\u300D\uFF0C\u76F4\u63A5\u62D6\u8FDB\u300C\u8FDB\u884C\u4E2D\u300D\u4E0D\u4F1A\u771F\u7684\u5F00\u8DD1");
    return this.change((tasks) => {
      const index = _TaskEngine.find(tasks, taskId);
      const task = tasks[index];
      const now = Date.now();
      const open = openExecution(task);
      const executions = open === void 0 ? task.executions : task.executions.map((e) => e === open ? { ...e, endedAt: now, result: "cancelled", error: "\u5361\u88AB\u624B\u52A8\u632A\u8D70\u4E86" } : e);
      tasks[index] = { ...task, status, updatedAt: now, executions };
      if (open?.sessionId !== void 0) this.unwatch(open.sessionId);
    });
  }
  archive(taskId, archived) {
    return this.change((tasks) => {
      const index = _TaskEngine.find(tasks, taskId);
      const task = tasks[index];
      if (archived && openExecution(task) !== void 0) throw new Refusal("\u5361\u8FD8\u5728\u8DD1\uFF0C\u8DD1\u5B8C\u4E86\u624D\u80FD\u6536\u5DE5");
      if (archived === (task.archivedAt !== void 0)) return false;
      const next = { ...task, updatedAt: Date.now() };
      if (archived) next.archivedAt = Date.now();
      else delete next.archivedAt;
      tasks[index] = next;
    }).then(() => this.armSchedule(false));
  }
  setTargets(taskId, targets) {
    return this.change((tasks) => {
      const index = _TaskEngine.find(tasks, taskId);
      const next = { ...tasks[index], updatedAt: Date.now() };
      for (const key of ["mode", "model"]) {
        const value = targets[key];
        if (value === void 0) continue;
        const clean = text2(value, key === "mode" ? "\u6A21\u5F0F" : "AI", 200).trim();
        if (clean === "") delete next[key];
        else next[key] = clean;
      }
      if (targets.permission !== void 0) {
        if (!PERMISSIONS.includes(targets.permission)) throw new Refusal("\u6743\u9650\u53EA\u80FD\u662F\u53EA\u8BFB\u3001\u53EF\u5199\u5DE5\u4F5C\u533A\u3001\u5B8C\u5168\u653E\u5F00\u4E09\u6863\u4E4B\u4E00");
        next.permission = targets.permission;
      }
      tasks[index] = next;
    });
  }
  setSchedule(taskId, patch) {
    return this.change((tasks) => {
      const index = _TaskEngine.find(tasks, taskId);
      const task = tasks[index];
      if (task.archivedAt !== void 0) throw new Refusal("\u5361\u5DF2\u7ECF\u6536\u5DE5\u4E86\uFF0C\u5148\u64A4\u9500\u6536\u5DE5\u518D\u6392\u671F");
      const now = Date.now();
      const prev = task.schedule ?? { enabled: false, nextRunAt: void 0, lastTriggeredAt: void 0, runCount: 0 };
      const rule = { ...prev };
      if (patch.mode !== void 0) rule.mode = patch.mode;
      if (patch.cron !== void 0) rule.cron = patch.cron.trim();
      if (patch.at !== void 0) rule.at = patch.at;
      if (patch.timeZone !== void 0) {
        if (patch.timeZone === null || patch.timeZone === "") delete rule.timeZone;
        else if (!isTimeZone(patch.timeZone)) throw new Refusal(`\u65F6\u533A\u8BA4\u4E0D\u51FA\uFF1A${patch.timeZone}`);
        else rule.timeZone = patch.timeZone;
      }
      if (patch.maxRuns !== void 0) {
        if (patch.maxRuns === null) delete rule.maxRuns;
        else if (!Number.isInteger(patch.maxRuns) || patch.maxRuns < 1) throw new Refusal("\u6B21\u6570\u4E0A\u9650\u8981\u662F\u6B63\u6574\u6570");
        else rule.maxRuns = patch.maxRuns;
      }
      if (patch.enabled !== void 0) rule.enabled = patch.enabled;
      const mode = rule.mode ?? "cron";
      rule.mode = mode;
      if (rule.enabled) {
        if (mode === "once") {
          if (typeof rule.at !== "number" || !Number.isFinite(rule.at)) throw new Refusal("\u5355\u6B21\u6392\u671F\u8981\u7ED9\u4E00\u4E2A\u65F6\u95F4");
          if (rule.at <= now) throw new Refusal("\u5355\u6B21\u6392\u671F\u7684\u65F6\u95F4\u5DF2\u7ECF\u8FC7\u53BB\u4E86");
          rule.nextRunAt = rule.at;
          delete rule.maxRuns;
        } else {
          if (rule.cron === void 0 || rule.cron === "") throw new Refusal("\u91CD\u590D\u6392\u671F\u8981\u7ED9 cron \u8868\u8FBE\u5F0F");
          try {
            parseCron(rule.cron);
          } catch (error) {
            throw new Refusal(error.message);
          }
          rule.nextRunAt = nextRunAt(rule.cron, now, rule.timeZone);
          if (rule.nextRunAt === void 0) throw new Refusal("\u8FD9\u6761 cron \u4E00\u5E74\u5185\u90FD\u4E0D\u4F1A\u89E6\u53D1\uFF0C\u68C0\u67E5\u4E00\u4E0B\u65E5\u671F");
        }
        if (!prev.enabled) {
          delete rule.endedAt;
          delete rule.endedReason;
          if (prev.endedAt !== void 0) rule.runCount = 0;
        }
      } else {
        rule.nextRunAt = void 0;
      }
      tasks[index] = { ...task, schedule: rule, updatedAt: now };
    }).then(() => this.armSchedule(false));
  }
  /** 「开始」：开会话跑这张卡。会话建好之前就返回，后面的进度靠盯会话。 */
  run(taskId, scheduled) {
    const runner = this.runner();
    if (runner === void 0) throw new Refusal("\u5BBF\u4E3B\u7684\u4F1A\u8BDD\u7F51\u5173\u8FD8\u6CA1\u5C31\u7EEA\uFF0C\u7A0D\u7B49\u51E0\u79D2\u518D\u70B9");
    return this.change((tasks) => {
      const index = _TaskEngine.find(tasks, taskId);
      const task = tasks[index];
      if (task.archivedAt !== void 0) throw new Refusal("\u5361\u5DF2\u7ECF\u6536\u5DE5\u4E86\uFF0C\u5148\u64A4\u9500\u6536\u5DE5\u518D\u8DD1");
      if (openExecution(task) !== void 0) throw new Refusal("\u8FD9\u5F20\u5361\u5DF2\u7ECF\u5728\u8DD1\u4E86");
      const now = Date.now();
      const execution = {
        id: newId("exec"),
        sessionId: void 0,
        startedAt: now,
        endedAt: void 0,
        result: void 0,
        error: void 0,
        ...scheduled === void 0 ? { initiatedBy: "user" } : {}
      };
      tasks[index] = {
        ...task,
        status: "running",
        updatedAt: now,
        executions: [...task.executions, execution].slice(-KEEP_EXECUTIONS)
      };
      return { executionId: execution.id, task: tasks[index] };
    }).then(({ executionId, task }) => {
      void this.launch(runner, task, executionId, scheduled);
      return { executionId };
    });
  }
  async launch(runner, task, executionId, scheduled) {
    try {
      await runner.launch(task, scheduled, (sessionId) => {
        void this.updateExecution(task.id, executionId, (e) => ({ ...e, sessionId })).then(() => this.watch(sessionId));
      });
    } catch (error) {
      await this.settle(task.id, executionId, "failed", `\u6CA1\u8DD1\u8D77\u6765\uFF1A${error instanceof Error ? error.message : String(error)}`);
    }
  }
  updateExecution(taskId, executionId, update) {
    return this.change((tasks) => {
      const index = tasks.findIndex((task2) => task2.id === taskId);
      if (index < 0) return false;
      const task = tasks[index];
      if (!task.executions.some((e) => e.id === executionId)) return false;
      tasks[index] = { ...task, executions: task.executions.map((e) => e.id === executionId ? update(e) : e) };
    });
  }
  settle(taskId, executionId, outcome, error) {
    return this.change((tasks) => {
      const index = tasks.findIndex((task2) => task2.id === taskId);
      if (index < 0) return false;
      const task = tasks[index];
      const execution = task.executions.find((e) => e.id === executionId);
      if (execution === void 0 || execution.endedAt !== void 0) return false;
      const now = Date.now();
      tasks[index] = {
        ...task,
        status: settledStatus(task, outcome),
        updatedAt: now,
        executions: task.executions.map((e) => e.id === executionId ? { ...e, endedAt: now, result: outcome, error } : e)
      };
      if (execution.sessionId !== void 0) this.unwatch(execution.sessionId);
    });
  }
  // ── 跟进度 ──────────────────────────────────────────────
  watch(sessionId) {
    if (this.stopped || this.watches.has(sessionId)) return;
    const runner = this.runner();
    if (runner === void 0) return;
    this.watches.set(sessionId, runner.watch(sessionId, () => void this.inspect(sessionId)));
  }
  unwatch(sessionId) {
    this.watches.get(sessionId)?.();
    this.watches.delete(sessionId);
  }
  /** 读一个会话：如果它对应的执行已经有了 `turn/end`，就收尾。 */
  async inspect(sessionId) {
    const runner = this.runner();
    if (runner === void 0 || this.inspecting.has(sessionId)) return "open";
    const found = this.file.tasks.flatMap((task) => {
      const open = openExecution(task);
      return open?.sessionId === sessionId ? [{ task, open }] : [];
    })[0];
    if (found === void 0) {
      this.unwatch(sessionId);
      return "settled";
    }
    this.inspecting.add(sessionId);
    try {
      const end = await runner.findTurnEnd(sessionId, found.open.startedAt);
      if (end === void 0) return "open";
      const { outcome, error } = outcomeOf(end.data);
      await this.settle(found.task.id, found.open.id, outcome, error);
      return "settled";
    } catch (error) {
      this.log(`\u8BFB\u4F1A\u8BDD ${sessionId} \u5931\u8D25\uFF0C\u4E0B\u4E00\u8F6E\u5DE1\u68C0\u518D\u8BD5\uFF1A${error instanceof Error ? error.message : String(error)}`);
      return "unreadable";
    } finally {
      this.inspecting.delete(sessionId);
    }
  }
  /** 巡检：所有开着的执行都看一眼。流没醒、或者根本开不起来时靠它。 */
  patrol() {
    if (this.stopped) return;
    for (const task of this.file.tasks) {
      const open = openExecution(task);
      if (open?.sessionId === void 0) continue;
      this.watch(open.sessionId);
      void this.inspect(open.sessionId);
    }
  }
  /**
   * 启动对账。
   *
   * 每张「开着」的执行都先去会话日志里找结论：找到了就按结论收尾（App 重启后宿主会给
   * 硬杀时没跑完的那一轮补一条 `interrupted`，也会走到这里）。
   *
   * 找不到结论时分两种：
   *   - **这个进程里第一次启动**（App 刚启动）：之前那个进程已经没了，会话不可能还在跑，
   *     记成「被打断」；连会话都没建好的那种也一样。
   *   - **插件被重装**（进程没换）：会话可能还在跑，接着盯，不收尾。
   */
  async reconcile(firstInProcess) {
    const open = this.file.tasks.flatMap((task) => {
      const execution = openExecution(task);
      return execution === void 0 ? [] : [{ task, execution }];
    });
    if (open.length === 0) return;
    for (let waited = 0; this.runner() === void 0 && waited < 2e4; waited += 500) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (this.stopped) return;
    }
    for (const { task, execution } of open) {
      if (execution.sessionId === void 0) {
        if (firstInProcess) await this.settle(task.id, execution.id, "failed", "\u4F1A\u8BDD\u8FD8\u6CA1\u5EFA\u597D App \u5C31\u9000\u51FA\u4E86\uFF0C\u8FD9\u6B21\u6CA1\u8DD1");
        continue;
      }
      const result = await this.inspect(execution.sessionId);
      if (result === "open" && firstInProcess) {
        await this.settle(task.id, execution.id, "failed", "\u8FD9\u4E00\u8F6E\u88AB\u6253\u65AD\u4E86\uFF08App \u9000\u51FA\u6216\u91CD\u542F\u65F6\u8FD8\u6CA1\u8DD1\u5B8C\uFF09");
      } else if (result !== "settled") {
        this.watch(execution.sessionId);
      }
    }
  }
  // ── 定时 ────────────────────────────────────────────────
  /**
   * 把计时器指到最早该触发的那张卡。
   *
   * `startup` 为真时，`nextRunAt` 已经过去的规则（App 关着的时候错过的）**只补跑一次**，
   * 然后从现在往后算下一次 —— 关了一周回来不会连跑七次。
   */
  armSchedule(startup) {
    if (this.stopped) return;
    if (this.scheduleTimer !== void 0) clearTimeout(this.scheduleTimer);
    this.scheduleTimer = void 0;
    let earliest = Number.POSITIVE_INFINITY;
    for (const task of this.file.tasks) {
      const rule = task.schedule;
      if (task.archivedAt !== void 0 || rule?.enabled !== true || rule.nextRunAt === void 0) continue;
      earliest = Math.min(earliest, rule.nextRunAt);
    }
    if (earliest === Number.POSITIVE_INFINITY) return;
    const delay = Math.max(0, Math.min(earliest - Date.now(), MAX_TIMER_MS));
    this.scheduleTimer = setTimeout(() => void this.fire(startup), delay);
    this.scheduleTimer.unref?.();
  }
  async fire(catchUp) {
    if (this.stopped) return;
    const now = Date.now();
    const due = this.file.tasks.filter((task) => task.archivedAt === void 0 && task.schedule?.enabled === true && task.schedule.nextRunAt !== void 0 && task.schedule.nextRunAt <= now);
    for (const task of due) {
      try {
        await this.trigger(task.id, now, catchUp);
      } catch (error) {
        this.log(`\u5B9A\u65F6\u89E6\u53D1\u300C${task.title}\u300D\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
      }
    }
    this.armSchedule(false);
  }
  /** 到点了：推进规则，再决定跑不跑。规则先推进再跑，跑失败了也不会卡在同一时刻反复触发。 */
  async trigger(taskId, now, catchUp) {
    const decision = await this.change((tasks) => {
      const index = tasks.findIndex((task2) => task2.id === taskId);
      if (index < 0) return false;
      const task = tasks[index];
      const rule = { ...task.schedule };
      const busy = openExecution(task) !== void 0;
      const missed = catchUp && rule.nextRunAt !== void 0 && now - rule.nextRunAt > 6e4;
      const cron = cronOf(rule);
      if (busy) {
        rule.skippedAt = now;
        rule.skippedReason = "\u5230\u70B9\u65F6\u4E0A\u4E00\u6B21\u8FD8\u5728\u8DD1\uFF0C\u8FD9\u6B21\u8DF3\u8FC7";
      } else {
        rule.lastTriggeredAt = now;
        rule.runCount = (rule.runCount ?? 0) + 1;
      }
      if (cron === void 0) {
        rule.enabled = false;
        rule.nextRunAt = void 0;
        rule.endedAt = now;
        rule.endedReason = busy ? "\u5355\u6B21\u6392\u671F\u5230\u70B9\u65F6\u5361\u8FD8\u5728\u8DD1\uFF0C\u6CA1\u6709\u6267\u884C" : "\u5355\u6B21\u6392\u671F\u5DF2\u6267\u884C";
      } else if (rule.maxRuns !== void 0 && rule.runCount >= rule.maxRuns) {
        rule.enabled = false;
        rule.nextRunAt = void 0;
        rule.endedAt = now;
        rule.endedReason = `\u8DD1\u6EE1\u4E86 ${rule.maxRuns} \u6B21`;
      } else {
        rule.nextRunAt = nextRunAt(cron, now, rule.timeZone);
      }
      tasks[index] = { ...task, schedule: rule, updatedAt: now };
      return { run: !busy, missed, cron };
    });
    if (decision === false || !decision.run) return;
    const label = decision.cron === void 0 ? "\u5355\u6B21\u6392\u671F" : `\u5B9A\u65F6\u89C4\u5219 ${decision.cron}`;
    const note = decision.missed ? `\uFF08\u8FD9\u6B21\u662F\u5B9A\u65F6\u89E6\u53D1\uFF1A${label}\u3002App \u5173\u7740\u65F6\u9519\u8FC7\u4E86\uFF0C\u542F\u52A8\u540E\u8865\u8DD1\u4E00\u6B21\u3002\uFF09` : `\uFF08\u8FD9\u6B21\u662F\u5B9A\u65F6\u89E6\u53D1\uFF1A${label}\u3002\uFF09`;
    await this.run(taskId, note);
  }
};

// src/engine/runner.ts
function createOwnerPeer(ctx) {
  const controller = new AbortController();
  const id = `dsh-plugin-task-board-owner:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  const peer = {
    id,
    ctx,
    principal: { kind: "owner" },
    signal: controller.signal,
    interactions: "none",
    dispose() {
      controller.abort();
      return Promise.resolve();
    }
  };
  return { peer, dispose: () => controller.abort() };
}
function withPeer(gateway, peer) {
  return {
    invoke: (request) => gateway.invoke({ ...request, peer }),
    ...typeof gateway.stream === "function" ? { stream: (request) => gateway.stream({ ...request, peer }) } : {}
  };
}
var address = (sessionId) => ({ kind: "session", sessionId });
function recentWorkspaceId(registry) {
  if (registry === void 0) return void 0;
  const items = registry.list();
  let best;
  let bestAt = Number.NEGATIVE_INFINITY;
  for (const item of items) {
    const at = Date.parse(item.updatedAt ?? "");
    if (Number.isFinite(at) && at > bestAt) {
      best = item.id;
      bestAt = at;
    }
  }
  return best ?? items[0]?.id;
}
function promptText(task, scheduled) {
  const body = task.prompt.trim() !== "" ? task.prompt : task.title;
  const parts = [];
  const tags = (task.tags ?? []).filter((tag) => typeof tag.promptPrefix === "string" && tag.promptPrefix.trim() !== "");
  if (tags.length > 0) parts.push(`\u6807\u7B7E\u63D0\u793A\uFF08\u6BCF\u6B21\u6267\u884C\u524D\u6CE8\u5165\uFF09\uFF1A
${tags.map((tag) => `- [${tag.name}] ${tag.promptPrefix}`).join("\n")}`);
  if (scheduled !== void 0) parts.push(scheduled);
  parts.push(body);
  return parts.join("\n\n");
}
var Runner = class {
  constructor(gateway, commands, workspaces) {
    this.gateway = gateway;
    this.commands = commands;
    this.workspaces = workspaces;
  }
  invoke(namespace, method, request) {
    const args = namespace === "session" && method === "list" ? { _request: request } : { request };
    return this.gateway.invoke({ namespace, method, args });
  }
  /**
   * 开一个新会话把卡跑起来。`onSession` 在会话建好、发 prompt 之前回调 ——
   * 这样就算后面哪一步失败了，执行记录上也已经有会话 id，界面能点进去看。
   */
  async launch(task, scheduled, onSession) {
    const workspaceId = task.workspaceId ?? recentWorkspaceId(this.workspaces());
    if (workspaceId !== void 0 && task.workspaceId !== void 0) {
      const registry = this.workspaces();
      if (registry !== void 0 && !registry.list().some((item) => item.id === workspaceId)) {
        throw new Error(`\u5DE5\u4F5C\u533A\u4E0D\u5B58\u5728\u4E86\uFF1A${workspaceId}`);
      }
    }
    const created = await this.invoke("session", "create", {
      ...workspaceId === void 0 ? {} : { workspaceId },
      ...task.mode === void 0 || task.mode === "" ? {} : { agentPreset: task.mode }
    });
    const sessionId = created?.sessionId;
    if (typeof sessionId !== "string" || sessionId === "") throw new Error("\u5BBF\u4E3B\u5EFA\u4F1A\u8BDD\u6CA1\u8FD4\u56DE\u4F1A\u8BDD id");
    onSession(sessionId);
    await this.invoke("session", "rename", { sessionId, title: task.title });
    if (task.permission !== void 0) {
      const commands = this.commands();
      if (commands === void 0) throw new Error("\u5BBF\u4E3B\u6CA1\u6709\u547D\u4EE4\u5206\u53D1\u670D\u52A1\uFF0C\u9489\u4E0D\u4E0A\u6743\u9650\uFF0C\u6240\u4EE5\u6CA1\u8DD1");
      const result = await commands.execute(sessionId, `/permission ${task.permission}`, AbortSignal.timeout(3e4));
      if (result === void 0) throw new Error("\u6743\u9650\u547D\u4EE4\u6CA1\u6709\u56DE\u97F3\uFF0C\u6240\u4EE5\u6CA1\u8DD1");
      if (result.kind !== "success") throw new Error(result.text ?? "\u6743\u9650\u547D\u4EE4\u5931\u8D25\uFF0C\u6240\u4EE5\u6CA1\u8DD1");
    }
    const model = task.model?.trim();
    if (model !== void 0 && model !== "") {
      const slash = model.indexOf("/");
      const selection = slash < 0 ? { model } : { provider: model.slice(0, slash), model: model.slice(slash + 1) };
      try {
        await this.invoke("session", "selectModel", { sessionId, ...selection });
      } catch (error) {
        console.warn(`[dsh-plugin-task-board] \u4F1A\u8BDD ${sessionId} \u6362\u6A21\u578B\u300C${model}\u300D\u5931\u8D25\uFF0C\u6309\u9ED8\u8BA4\u6A21\u578B\u8DD1\uFF1A`, error);
      }
    }
    await this.invoke("session", "prompt", {
      sessionId,
      requestId: `dsh-plugin-task-board-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      mode: "queue",
      content: [{ type: "text", text: promptText(task, scheduled) }]
    });
    return sessionId;
  }
  /**
   * 这次执行（从 `startedAt` 起）有没有一条 `turn/end`。
   *
   * 读法：`follow` 的第一帧是尾巴上的快照，大多数时候结论就在里面；不在就往回翻页，
   * 翻到事件时间早于 `startedAt` 为止 —— 再往前的是别的执行的事了。
   *
   * @returns 找到了就是那条事件的 `data` 和时间；没找到是 `undefined`；读失败抛错。
   */
  async findTurnEnd(sessionId, startedAt) {
    if (typeof this.gateway.stream !== "function") throw new Error("\u7F51\u5173\u6CA1\u6709\u6D41\u5F0F\u901A\u9053\uFF0C\u8BFB\u4E0D\u4E86\u4F1A\u8BDD\u5C3E\u5DF4");
    const iterable = await this.gateway.stream({
      namespace: "session",
      method: "follow",
      args: { request: { address: address(sessionId), maxMessages: 50 } }
    });
    const iterator = iterable[Symbol.asyncIterator]();
    let frame;
    try {
      const next = await iterator.next();
      frame = next.done === true ? void 0 : next.value;
    } finally {
      try {
        await iterator.return?.();
      } catch {
      }
    }
    if (frame?.type !== "snapshot" || typeof frame.cursor !== "number") throw new Error("\u4F1A\u8BDD\u4E8B\u4EF6\u6D41\u6CA1\u7ED9\u51FA\u5F00\u5934\u7684\u5FEB\u7167");
    let records = Array.isArray(frame.records) ? frame.records : [];
    let hasMore = frame.hasMore === true;
    for (let page = 0; page < 20; page += 1) {
      let oldestTime = Number.POSITIVE_INFINITY;
      for (let index = records.length - 1; index >= 0; index -= 1) {
        const event = records[index]?.event;
        if (typeof event?.time === "number") oldestTime = Math.min(oldestTime, event.time);
        if (event?.type === "turn/end" && typeof event.time === "number" && event.time >= startedAt) {
          return { data: event.data, at: event.time };
        }
      }
      if (!hasMore || records.length === 0 || oldestTime < startedAt) return void 0;
      const beforeSeq = records[0]?.event?.seq;
      if (typeof beforeSeq !== "number") return void 0;
      const result = await this.invoke("session", "page", {
        address: address(sessionId),
        throughSeq: frame.cursor,
        maxMessages: 100,
        beforeSeq
      });
      records = Array.isArray(result?.records) ? result.records : [];
      hasMore = result?.hasMore === true;
    }
    return void 0;
  }
  /**
   * 盯住一个会话：它一有新事件就回调 `onActivity`。
   *
   * 回调**不带内容**，只是「醒一下」—— 结论一律由 `findTurnEnd` 去读。这样流的帧长什么样
   * 我们不用猜，猜错了最多是醒得不及时，有定时巡检兜底，不会判错。
   *
   * @returns 停止盯的函数。流开不起来时返回空函数，交给巡检。
   */
  watch(sessionId, onActivity) {
    if (typeof this.gateway.stream !== "function") return () => {
    };
    const controller = new AbortController();
    void (async () => {
      try {
        const iterable = await this.gateway.stream({
          namespace: "session",
          method: "follow",
          args: { request: { address: address(sessionId), maxMessages: 1 } },
          signal: controller.signal
        });
        let first = true;
        for await (const _frame of iterable) {
          if (controller.signal.aborted) break;
          if (first) {
            first = false;
            continue;
          }
          onActivity();
        }
      } catch {
      }
    })();
    return () => controller.abort();
  }
};

// src/index.ts
var PLUGIN_VERSION = false ? "dev" : "0.5.0";
var name = "dsh-plugin-task-board";
var inject = ["webServer"];
var KNOWN_SCHEMA_VERSIONS = [2, 3, 4, 5, 6];
var LEDGER_RELATIVE_PATH = join("task-board", "ledger-v2.json");
var HEALTH_PATH = "/api/dsh-plugin-task-board/health";
var LEDGER_PATH = "/api/dsh-plugin-task-board/ledger";
var ENRICH_PATH = "/api/dsh-plugin-task-board/enrich";
var OVERRIDES_PATH = "/api/dsh-plugin-task-board/overrides";
var WRITE_PATH = "/api/dsh-plugin-task-board/task";
var SESSION_FACTS_PATH = "/api/dsh-plugin-task-board/session-facts";
var SESSION_ARCHIVE_PATH = "/api/dsh-plugin-task-board/session-archive";
var TASKS_PATH = "/api/dsh-plugin-task-board/tasks";
var TASKS_EVENTS_PATH = "/api/dsh-plugin-task-board/tasks/events";
var OWN_DIR = "dsh-plugin-task-board";
var OVERRIDES_FILE = "enrichment.json";
var TASKS_FILE = "tasks.json";
var OVERRIDES_SCHEMA = 1;
var SESSION_ARCHIVE_FILE = "sessions.json";
var SESSION_ARCHIVE_SCHEMA = 1;
var emptyStore = () => ({ schemaVersion: OVERRIDES_SCHEMA, cache: {}, overrides: {} });
async function readStore(path) {
  let text3;
  try {
    text3 = await readFile2(path, "utf8");
  } catch {
    return emptyStore();
  }
  try {
    const parsed = JSON.parse(text3);
    if (parsed.schemaVersion !== OVERRIDES_SCHEMA) return emptyStore();
    return {
      schemaVersion: OVERRIDES_SCHEMA,
      cache: typeof parsed.cache === "object" && parsed.cache !== null ? parsed.cache : {},
      overrides: typeof parsed.overrides === "object" && parsed.overrides !== null ? parsed.overrides : {}
    };
  } catch {
    return emptyStore();
  }
}
async function writeStore(path, store) {
  await mkdir2(dirname2(path), { recursive: true });
  await writeFile2(path, `${JSON.stringify(store, null, 2)}
`, "utf8");
}
function fingerprintOf(material, model) {
  return createHash("sha256").update(`${model}\0${renderMaterial(material)}`).digest("hex").slice(0, 16);
}
async function readBody(req) {
  const limit = 1 << 20;
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new Error(`\u8BF7\u6C42\u4F53\u8D85\u8FC7 ${limit} \u5B57\u8282`);
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}
function dshHome() {
  const env = process.env.DSH_HOME;
  const raw = env !== void 0 && env.trim().length > 0 ? env : pathResolve(homedir(), ".dsh");
  if (raw === "~") return homedir();
  if (raw.startsWith("~/") || raw.startsWith("~\\")) return pathResolve(homedir(), raw.slice(2));
  return pathResolve(raw);
}
function json(res, status, body) {
  const text3 = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(text3);
}
function isTaskLike(value) {
  if (typeof value !== "object" || value === null) return false;
  const t = value;
  return typeof t.id === "string" && typeof t.title === "string" && typeof t.status === "string";
}
function apply(ctx) {
  const disposers = [];
  let disposed = false;
  const keep = (dispose) => {
    if (typeof dispose !== "function") return;
    let spent = false;
    const once = () => {
      if (spent) return;
      spent = true;
      try {
        ;
        dispose();
      } catch {
      }
    };
    if (disposed) {
      once();
      return;
    }
    disposers.push(once);
  };
  const webServer = ctx.webServer;
  if (!webServer) {
    ctx.logger?.warn(`[${name}] ctx.webServer \u4E0D\u53EF\u7528\uFF08headless profile\uFF1F\uFF09\uFF0C\u8DF3\u8FC7\u8DEF\u7531\u6CE8\u518C`);
    return () => {
    };
  }
  const route = (spec) => {
    try {
      keep(webServer.register(spec));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/duplicate/i.test(message)) throw error;
      ctx.logger?.warn(
        `[${name}] ${spec.path} \u5DF2\u7ECF\u88AB\u5360\u7740 \u2014\u2014 \u591A\u534A\u662F\u672C\u8FDB\u7A0B\u91CC\u4E0A\u4E00\u6B21\u7559\u4E0B\u7684\uFF08\u65E7\u7248\u672C\u6CA1\u6458\u5E72\u51C0\uFF0C\u800C webServer \u6458\u4E0D\u6389\u522B\u4EBA\u7684\u8DEF\u7531\uFF09\u3002\u8FD9\u4E00\u6761\u5148\u8DF3\u8FC7\uFF0C\u5176\u4F59\u7167\u5E38\uFF1B\u91CD\u542F DSH \u4E4B\u540E\u5C31\u6062\u590D\u6B63\u5E38\u4E86\u3002`
      );
    }
  };
  try {
    start(ctx, route, keep);
  } catch (error) {
    disposed = true;
    for (const dispose of disposers.splice(0).reverse()) dispose();
    throw error;
  }
  return () => {
    disposed = true;
    for (const dispose of disposers.splice(0).reverse()) dispose();
  };
}
function start(ctx, route, keep) {
  route({
    kind: "exact",
    path: HEALTH_PATH,
    handler: (_req, res) => {
      json(res, 200, { plugin: name, version: PLUGIN_VERSION, ok: true });
    }
  });
  route({
    kind: "exact",
    path: LEDGER_PATH,
    handler: async (_req, res) => {
      const path = join(dshHome(), LEDGER_RELATIVE_PATH);
      let text3;
      try {
        text3 = await readFile2(path, "utf8");
      } catch (err) {
        json(res, 200, {
          ok: false,
          reason: "ledger-missing",
          detail: String(err),
          path
        });
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(text3);
      } catch (err) {
        json(res, 200, { ok: false, reason: "ledger-unreadable", detail: String(err), path });
        return;
      }
      const schemaVersion = parsed?.schemaVersion;
      const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks.filter(isTaskLike) : null;
      const recognized = KNOWN_SCHEMA_VERSIONS.includes(schemaVersion);
      if (!recognized || tasks === null) {
        json(res, 200, {
          ok: false,
          reason: "schema-mismatch",
          // 界面上要能说出「文件里是几、我们认得几」，所以两个都带回去。
          // 光给一个 expected 的话，文案只能写「格式对不上」——用户不知道该怪谁
          supported: [...KNOWN_SCHEMA_VERSIONS],
          actual: schemaVersion ?? null,
          path
        });
        return;
      }
      json(res, 200, {
        ok: true,
        schemaVersion,
        revision: typeof parsed.revision === "number" ? parsed.revision : void 0,
        readAt: Date.now(),
        path,
        tasks
      });
    }
  });
  const where = () => join(dshHome(), OWN_DIR, OVERRIDES_FILE);
  route({
    kind: "exact",
    path: OVERRIDES_PATH,
    handler: async (req, res) => {
      const path = where();
      if (req?.method !== "POST") {
        const store = await readStore(path);
        json(res, 200, { ok: true, overrides: store.overrides, path });
        return;
      }
      try {
        const body = JSON.parse(await readBody(req));
        if (typeof body.taskId !== "string" || body.taskId.length === 0) {
          json(res, 200, { ok: false, reason: "bad-request", detail: "taskId \u662F\u5FC5\u586B\u7684" });
          return;
        }
        const store = await readStore(path);
        const next = sanitizeOverride(body.override);
        if (Object.keys(next).length === 0) delete store.overrides[body.taskId];
        else store.overrides[body.taskId] = next;
        await writeStore(path, store);
        json(res, 200, { ok: true, path });
      } catch (error) {
        json(res, 200, { ok: false, reason: "write-failed", detail: String(error) });
      }
    }
  });
  let llm;
  if (typeof ctx.inject === "function") {
    ctx.inject(["llm"], (scope) => {
      llm = scope.llm ?? scope.get?.("llm");
    });
  } else {
    llm = ctx.llm;
  }
  const registerEnrich = (scope) => {
    route({
      kind: "exact",
      path: ENRICH_PATH,
      handler: async (req, res) => {
        const path = where();
        if (req?.method !== "POST") {
          json(res, 200, { ok: false, reason: "bad-request", detail: "\u8FD9\u6761\u8DEF\u7531\u53EA\u63A5 POST" });
          return;
        }
        let body;
        try {
          body = JSON.parse(await readBody(req));
        } catch (error) {
          json(res, 200, { ok: false, reason: "bad-request", detail: String(error) });
          return;
        }
        const materials = Array.isArray(body.tasks) ? body.tasks.filter(isMaterialLike) : [];
        if (materials.length === 0) {
          json(res, 200, { ok: false, reason: "bad-request", detail: "\u6CA1\u6709\u53EF\u5F52\u7EB3\u7684\u4EFB\u52A1" });
          return;
        }
        if (materials.length > 20) {
          json(res, 200, { ok: false, reason: "bad-request", detail: "\u4E00\u6B21\u6700\u591A\u5F52\u7EB3 20 \u4E2A\u4EFB\u52A1" });
          return;
        }
        if (llm === void 0 || typeof llm.stream !== "function") {
          json(res, 200, {
            ok: false,
            reason: "no-model",
            detail: "\u8FD9\u4E2A\u90E8\u7F72\u6CA1\u6709\u63D0\u4F9B\u6A21\u578B\u670D\u52A1\uFF08llm\uFF09\u3002\u4E0B\u9762\u56DB\u6761\u4ECD\u7136\u6309\u8D26\u672C\u63A8\u51FA\u6765\uFF0C\u4E0D\u53D7\u5F71\u54CD\u3002"
          });
          return;
        }
        const model = typeof body.model === "string" ? body.model : "";
        const route2 = splitRoute(model);
        if (route2 === void 0) {
          json(res, 200, {
            ok: false,
            reason: "no-model",
            detail: "\u6CA1\u7ED9\u6A21\u578B\u8DEF\u7531\u3002\u8FD9\u4E2A\u4EFB\u52A1\u6CA1\u6709\u7ED1\u6A21\u578B\uFF0C\u5148\u53BB\u4EFB\u52A1\u770B\u677F\u7ED9\u5B83\u9009\u4E00\u4E2A\uFF0C\u6216\u8005\u5728\u770B\u677F\u8BBE\u7F6E\u91CC\u6311\u4E00\u4E2A\u9ED8\u8BA4\u6A21\u578B\u3002"
          });
          return;
        }
        const store = await readStore(path);
        const force = body.force === true;
        const results = {};
        let changed = false;
        let firstError;
        for (const material of materials) {
          const fingerprint = fingerprintOf(material, model);
          const hit = store.cache[material.id];
          if (!force && hit !== void 0 && hit.fingerprint === fingerprint) {
            results[material.id] = { ai: hit.ai, cached: true, at: hit.at };
            continue;
          }
          try {
            const ai = await enrichOnce(llm, route2, renderMaterial(material), void 0);
            store.cache[material.id] = { fingerprint, ai, at: Date.now(), model };
            changed = true;
            results[material.id] = { ai, cached: false };
          } catch (error) {
            if (error instanceof EnrichError) {
              results[material.id] = { ai: {}, cached: false };
              if (firstError === void 0) firstError = error;
            } else throw error;
          }
        }
        if (changed) {
          try {
            await writeStore(path, store);
          } catch {
          }
        }
        const usable = Object.values(results).some((entry) => Object.keys(entry.ai).length > 0);
        if (!usable && firstError !== void 0) {
          json(res, 200, {
            ok: false,
            reason: firstError.reason,
            detail: firstError.message,
            timeoutMs: ENRICH_TIMEOUT_MS
          });
          return;
        }
        json(res, 200, { ok: true, model, results, path });
      }
    });
  };
  registerEnrich(ctx);
  registerEngine(ctx, route, keep);
}
async function performWrite(engine, body) {
  const op = body.op;
  const object = (value, what) => {
    if (typeof value !== "object" || value === null) throw new Refusal(`${what}\u8981\u5E26\u5185\u5BB9`);
    return value;
  };
  switch (op) {
    case "create": {
      const created = await engine.create(object(body.draft, "\u65B0\u5EFA"));
      return { task: { id: created.id, title: created.title, status: created.status } };
    }
    case "patch":
      await engine.patch(body.taskId, object(body.patch, "\u4FEE\u6539"));
      return { taskId: body.taskId };
    case "status":
      await engine.setStatus(body.taskId, body.status);
      return { taskId: body.taskId, status: body.status };
    case "archive":
    case "restore":
      await engine.archive(body.taskId, op === "archive");
      return { taskId: body.taskId };
    case "targets":
      await engine.setTargets(body.taskId, object(body.targets, "\u6267\u884C\u76EE\u6807"));
      return { taskId: body.taskId };
    case "schedule":
      await engine.setSchedule(body.taskId, object(body.patch, "\u6392\u671F"));
      return { taskId: body.taskId };
    case "run":
      return { taskId: body.taskId, ...await engine.run(body.taskId) };
    default:
      throw new Refusal(`\u8BA4\u4E0D\u51FA\u7684\u64CD\u4F5C\u300C${String(op)}\u300D`);
  }
}
function commandsOf(ctx) {
  const commands = ctx.get?.("commands");
  if (typeof commands?.execute !== "function") return void 0;
  return {
    async execute(sessionId, line, signal) {
      const agents = ctx.get?.("agents");
      let agent = agents?.get?.(sessionId);
      if (agent === void 0) {
        const controller = ctx.get?.("sessionController");
        const resolved = await controller?.resolveAgent?.(sessionId);
        agent = resolved?.agent;
        if (agent === void 0) throw new Error(`\u4F1A\u8BDD ${sessionId} \u62FF\u4E0D\u5230\u6D3B\u7684 Agent${resolved?.error?.message ? `\uFF1A${resolved.error.message}` : ""}`);
      }
      return (await commands.execute(agent, line, [], signal))?.result;
    }
  };
}
function registerEngine(ctx, route, keep) {
  let gateway;
  let runner;
  const owner = createOwnerPeer(ctx);
  keep(owner.dispose);
  const takeGateway = (scope) => {
    const found = scope.get?.("typertGateway") ?? scope.typertGateway;
    if (found === void 0 || typeof found.invoke !== "function") return;
    const wrapped = withPeer(found, owner.peer);
    gateway = wrapped;
    runner = new Runner(
      wrapped,
      () => commandsOf(ctx),
      () => ctx.get?.("workspaceRegistry")
    );
  };
  if (typeof ctx.inject === "function") ctx.inject(["typertGateway"], takeGateway);
  else takeGateway(ctx);
  const engine = new TaskEngine(
    join(dshHome(), OWN_DIR, TASKS_FILE),
    join(dshHome(), LEDGER_RELATIVE_PATH),
    () => runner,
    (message) => ctx.logger?.warn(`[${name}] ${message}`),
    (message) => ctx.logger?.info?.(`[${name}] ${message}`)
  );
  keep(() => engine.stop());
  let failure;
  let ready = false;
  const started = engine.start().then(
    () => {
      ready = true;
    },
    (error) => {
      failure = error instanceof Error ? error.message : String(error);
      ctx.logger?.warn(`[${name}] \u4EFB\u52A1\u5F15\u64CE\u542F\u52A8\u5931\u8D25\uFF1A${failure}`);
    }
  );
  route({
    kind: "exact",
    path: TASKS_PATH,
    handler: async (_req, res) => {
      await started;
      if (!ready) {
        json(res, 200, { ok: false, reason: "engine-failed", detail: failure });
        return;
      }
      json(res, 200, { ok: true, ...engine.snapshot(), gateway: runner !== void 0 });
    }
  });
  route({
    kind: "exact",
    path: TASKS_EVENTS_PATH,
    handler: async (req, res) => {
      await started;
      if (!ready) {
        json(res, 503, { ok: false, reason: "engine-failed", detail: failure });
        return;
      }
      res.writeHead(200, {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        connection: "keep-alive"
      });
      const send = (snapshot) => {
        res.write(`data: ${JSON.stringify({ ...snapshot, gateway: runner !== void 0 })}

`);
      };
      send(engine.snapshot());
      const unsubscribe = engine.subscribe(send);
      const heartbeat = setInterval(() => res.write(": ping\n\n"), 25e3);
      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
      req?.on?.("close", close);
      res?.on?.("close", close);
      keep(() => {
        close();
        try {
          res.end();
        } catch {
        }
      });
    }
  });
  route({
    kind: "exact",
    path: WRITE_PATH,
    handler: async (req, res) => {
      await started;
      if (req?.method !== "POST") {
        json(res, 200, {
          ok: true,
          ready,
          gateway: runner !== void 0,
          ...ready ? {} : { detail: `\u4EFB\u52A1\u5F15\u64CE\u6CA1\u8D77\u6765\uFF1A${failure ?? "\u539F\u56E0\u672A\u77E5"}` }
        });
        return;
      }
      if (!ready) {
        json(res, 200, { ok: false, reason: "engine-failed", detail: `\u4EFB\u52A1\u5F15\u64CE\u6CA1\u8D77\u6765\uFF1A${failure ?? "\u539F\u56E0\u672A\u77E5"}` });
        return;
      }
      let body;
      try {
        body = JSON.parse(await readBody(req));
      } catch (error) {
        json(res, 200, { ok: false, reason: "bad-request", detail: String(error) });
        return;
      }
      try {
        json(res, 200, { ok: true, ...await performWrite(engine, body) });
      } catch (error) {
        json(res, 200, {
          ok: false,
          reason: error instanceof Refusal ? "refused" : "write-failed",
          detail: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
  const factCache = /* @__PURE__ */ new Map();
  route({
    kind: "exact",
    path: SESSION_FACTS_PATH,
    handler: async (req, res) => {
      if (gateway === void 0) {
        json(res, 200, {
          ok: false,
          reason: "no-gateway",
          detail: "\u8FD9\u4E2A\u90E8\u7F72\u91CC\u6CA1\u6709 typertGateway\uFF0C\u8BFB\u4E0D\u4E86\u4F1A\u8BDD\u4E8B\u4EF6\uFF0C\u6240\u4EE5\u5224\u65AD\u4E0D\u51FA\u6BCF\u4E00\u8F6E\u662F\u600E\u4E48\u7ED3\u675F\u7684"
        });
        return;
      }
      const ids = parseIds(new URL(req?.url ?? "/", "http://localhost").searchParams.get("ids"));
      if (ids.length === 0) {
        json(res, 200, { ok: true, facts: {} });
        return;
      }
      try {
        json(res, 200, { ok: true, facts: await readFacts(gateway, ids, factCache) });
      } catch (error) {
        json(res, 200, { ok: false, reason: "read-failed", detail: String(error) });
      }
    }
  });
  const archivePath = () => join(dshHome(), OWN_DIR, SESSION_ARCHIVE_FILE);
  route({
    kind: "exact",
    path: SESSION_ARCHIVE_PATH,
    handler: async (req, res) => {
      const path = archivePath();
      if (req?.method !== "POST") {
        const store = await readArchive(path);
        json(res, 200, { ok: true, archived: store.archived });
        return;
      }
      let body;
      try {
        body = JSON.parse(await readBody(req));
      } catch (error) {
        json(res, 200, { ok: false, reason: "bad-request", detail: String(error) });
        return;
      }
      const sessionId = body.sessionId;
      if (typeof sessionId !== "string" || sessionId.length === 0 || sessionId.length > 200) {
        json(res, 200, { ok: false, reason: "bad-request", detail: "sessionId \u662F\u5FC5\u586B\u7684" });
        return;
      }
      try {
        const store = await readArchive(path);
        if (body.archived === false) delete store.archived[sessionId];
        else store.archived[sessionId] = Date.now();
        await writeArchive(path, store);
        json(res, 200, { ok: true, archived: store.archived });
      } catch (error) {
        json(res, 200, { ok: false, reason: "write-failed", detail: String(error) });
      }
    }
  });
}
function parseIds(raw) {
  if (raw === null || raw.length === 0) return [];
  return [...new Set(raw.split(",").map((part) => part.trim()).filter((part) => part.length > 0 && part.length <= 200))].slice(0, 500);
}
async function readArchive(path) {
  try {
    const parsed = JSON.parse(await readFile2(path, "utf8"));
    if (parsed.schemaVersion !== SESSION_ARCHIVE_SCHEMA) return { schemaVersion: SESSION_ARCHIVE_SCHEMA, archived: {} };
    const archived = {};
    for (const [id, at] of Object.entries(parsed.archived ?? {})) {
      if (typeof at === "number" && Number.isFinite(at)) archived[id] = at;
    }
    return { schemaVersion: SESSION_ARCHIVE_SCHEMA, archived };
  } catch {
    return { schemaVersion: SESSION_ARCHIVE_SCHEMA, archived: {} };
  }
}
async function writeArchive(path, store) {
  await mkdir2(dirname2(path), { recursive: true });
  await writeFile2(path, `${JSON.stringify(store, null, 2)}
`, "utf8");
}
function isMaterialLike(value) {
  if (typeof value !== "object" || value === null) return false;
  const m = value;
  return typeof m.id === "string" && typeof m.title === "string";
}
function sanitizeOverride(value) {
  if (typeof value !== "object" || value === null) return {};
  const raw = value;
  const out = {};
  const text3 = (input, limit) => typeof input === "string" && input.trim().length > 0 ? input.trim().slice(0, limit) : void 0;
  const goal = text3(raw.goal, 400);
  if (goal !== void 0) out.goal = goal;
  const scenario = text3(raw.scenario, 400);
  if (scenario !== void 0) out.scenario = scenario;
  const background = text3(raw.background, 1e3);
  if (background !== void 0) out.background = background;
  if (Array.isArray(raw.acceptanceDone)) {
    out.acceptanceDone = raw.acceptanceDone.filter((id) => typeof id === "string").slice(0, 20);
  }
  if (raw.priority === "urgent" || raw.priority === "high" || raw.priority === "medium" || raw.priority === "low") {
    out.priority = raw.priority;
  }
  return out;
}
export {
  ENRICH_PATH,
  HEALTH_PATH,
  LEDGER_PATH,
  OVERRIDES_PATH,
  SESSION_ARCHIVE_PATH,
  SESSION_FACTS_PATH,
  TASKS_EVENTS_PATH,
  TASKS_PATH,
  WRITE_PATH,
  apply,
  inject,
  name,
  parseIds
};
