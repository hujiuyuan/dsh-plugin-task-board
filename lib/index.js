// src/index.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve as pathResolve } from "node:path";
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
    lines.push(`\u5B9A\u65F6\u89C4\u5219\uFF1A${material.schedule.cron}\uFF08${material.schedule.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}\uFF09`);
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
  const text = lines.join("\n");
  return text.length > MAX_MATERIAL_CHARS ? `${text.slice(0, MAX_MATERIAL_CHARS)}
\u2026\uFF08\u622A\u65AD\uFF09` : text;
}
function parseReply(reply) {
  const text = reply.replace(/```(?:json)?/gi, "").trim();
  const start2 = text.indexOf("{");
  if (start2 < 0) return {};
  let depth = 0;
  let end = -1;
  let inString = false;
  let escaped = false;
  for (let i = start2; i < text.length; i += 1) {
    const char = text[i];
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
    parsed = JSON.parse(text.slice(start2, end + 1));
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
  const text = qualified.trim();
  const cut = text.indexOf("/");
  if (cut <= 0 || cut === text.length - 1) return void 0;
  return { provider: text.slice(0, cut), model: text.slice(cut + 1) };
}

// src/index.ts
var PLUGIN_VERSION = false ? "dev" : "0.1.2";
var name = "dsh-plugin-task-board";
var inject = ["webServer"];
var KNOWN_SCHEMA_VERSION = 5;
var LEDGER_RELATIVE_PATH = join("task-board", "ledger-v2.json");
var HEALTH_PATH = "/api/dsh-plugin-task-board/health";
var LEDGER_PATH = "/api/dsh-plugin-task-board/ledger";
var ENRICH_PATH = "/api/dsh-plugin-task-board/enrich";
var OVERRIDES_PATH = "/api/dsh-plugin-task-board/overrides";
var WRITE_PATH = "/api/dsh-plugin-task-board/task";
var OWN_DIR = "dsh-plugin-task-board";
var OVERRIDES_FILE = "enrichment.json";
var OVERRIDES_SCHEMA = 1;
var emptyStore = () => ({ schemaVersion: OVERRIDES_SCHEMA, cache: {}, overrides: {} });
async function readStore(path) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch {
    return emptyStore();
  }
  try {
    const parsed = JSON.parse(text);
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
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(store, null, 2)}
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
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(text);
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
      let text;
      try {
        text = await readFile(path, "utf8");
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
        parsed = JSON.parse(text);
      } catch (err) {
        json(res, 200, { ok: false, reason: "ledger-unreadable", detail: String(err), path });
        return;
      }
      const schemaVersion = parsed?.schemaVersion;
      const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks.filter(isTaskLike) : null;
      if (schemaVersion !== KNOWN_SCHEMA_VERSION || tasks === null) {
        json(res, 200, {
          ok: false,
          reason: "schema-mismatch",
          expected: KNOWN_SCHEMA_VERSION,
          actual: schemaVersion,
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
  registerWriteRoute(ctx, route, keep);
}
var BOARD_SERVICE = "taskBoard";
var EXTENSION_ID = name;
var EXTENSION_API_VERSION = 1;
function registerWriteRoute(ctx, route, keep) {
  let tasks;
  const attach = (scope) => {
    const board = scope.get?.(BOARD_SERVICE) ?? scope[BOARD_SERVICE];
    if (board === void 0 || typeof board.registerExtension !== "function") return;
    try {
      keep(board.registerExtension({
        id: EXTENSION_ID,
        apiVersion: EXTENSION_API_VERSION,
        // start/stop 是看板的开关控制的：它把扩展停掉之后，我们不持有失效的面
        start: (host) => {
          tasks = host.tasks;
        },
        stop: () => {
          tasks = void 0;
        }
      }));
    } catch (error) {
      ctx.logger?.warn(`[${name}] \u6CE8\u518C\u6269\u5C55\u5931\u8D25\uFF1A${String(error)}`);
    }
  };
  if (typeof ctx.inject === "function") ctx.inject([BOARD_SERVICE], attach);
  else attach(ctx);
  route({
    kind: "exact",
    path: WRITE_PATH,
    handler: async (req, res) => {
      if (req?.method !== "POST") {
        json(res, 200, {
          ok: true,
          ready: tasks !== void 0,
          ...tasks === void 0 ? { detail: "\u4EFB\u52A1\u770B\u677F\u7684\u5BBF\u4E3B\u534A\u4F53\u6CA1\u52A0\u8F7D\uFF08\u6216\u8005\u5B83\u7684\u6269\u5C55\u5F00\u5173\u5173\u7740\uFF09\uFF0C\u6240\u4EE5\u6CA1\u6709\u5199\u5165\u53E3" } : {}
        });
        return;
      }
      let body;
      try {
        body = JSON.parse(await readBody(req));
      } catch (error) {
        json(res, 200, { ok: false, reason: "bad-request", detail: String(error) });
        return;
      }
      if (tasks === void 0) {
        json(res, 200, {
          ok: false,
          reason: "board-absent",
          detail: "\u4EFB\u52A1\u770B\u677F\u7684\u5BBF\u4E3B\u534A\u4F53\u6CA1\u52A0\u8F7D\uFF08\u6216\u8005\u5B83\u7684\u6269\u5C55\u5F00\u5173\u5173\u7740\uFF09\uFF0C\u6240\u4EE5\u6CA1\u6709\u5199\u5165\u53E3\u3002\u53BB\u4EFB\u52A1\u770B\u677F\u91CC\u76F4\u63A5\u6539\u3002"
        });
        return;
      }
      try {
        json(res, 200, { ok: true, ...performWrite(tasks, body) });
      } catch (error) {
        json(res, 200, {
          ok: false,
          reason: "refused",
          detail: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
}
function performWrite(tasks, body) {
  const op = body.op;
  if (op === "create") {
    const draft = body.draft;
    if (typeof draft !== "object" || draft === null) throw new Error("create \u8981\u5E26 draft");
    const created = tasks.create(draft);
    return { task: { id: created.id, title: created.title, status: created.status } };
  }
  const taskId = body.taskId;
  if (typeof taskId !== "string" || taskId.length === 0) throw new Error("\u8FD9\u4E2A\u52A8\u4F5C\u8981\u5E26 taskId");
  if (op === "patch") {
    const patch = body.patch;
    if (typeof patch !== "object" || patch === null) throw new Error("patch \u8981\u5E26 patch");
    tasks.patchContent(taskId, patch);
    return { taskId };
  }
  if (op === "status") {
    const status = body.status;
    if (typeof status !== "string") throw new Error("status \u8981\u5E26 status");
    tasks.setStatus(taskId, status);
    return { taskId, status };
  }
  throw new Error(`\u8BA4\u4E0D\u51FA\u7684\u64CD\u4F5C\u300C${String(op)}\u300D`);
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
  const text = (input, limit) => typeof input === "string" && input.trim().length > 0 ? input.trim().slice(0, limit) : void 0;
  const goal = text(raw.goal, 400);
  if (goal !== void 0) out.goal = goal;
  const scenario = text(raw.scenario, 400);
  if (scenario !== void 0) out.scenario = scenario;
  const background = text(raw.background, 1e3);
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
  EXTENSION_ID,
  HEALTH_PATH,
  LEDGER_PATH,
  OVERRIDES_PATH,
  WRITE_PATH,
  apply,
  inject,
  name
};
