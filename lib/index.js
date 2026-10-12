// src/index.ts
import { readFile } from "node:fs/promises";
import { join, resolve as pathResolve } from "node:path";
import { homedir } from "node:os";
var PLUGIN_VERSION = false ? "dev" : "0.1.0";
var name = "dsh-plugin-task-board";
var inject = ["webServer"];
var KNOWN_SCHEMA_VERSION = 5;
var LEDGER_RELATIVE_PATH = join("task-board", "ledger-v2.json");
var HEALTH_PATH = "/api/dsh-plugin-task-board/health";
var LEDGER_PATH = "/api/dsh-plugin-task-board/ledger";
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
  const webServer = ctx.webServer;
  if (!webServer) {
    ctx.logger?.warn(`[${name}] ctx.webServer \u4E0D\u53EF\u7528\uFF08headless profile\uFF1F\uFF09\uFF0C\u8DF3\u8FC7\u8DEF\u7531\u6CE8\u518C`);
    return;
  }
  webServer.register({
    kind: "exact",
    path: HEALTH_PATH,
    handler: (_req, res) => {
      json(res, 200, { plugin: name, version: PLUGIN_VERSION, ok: true });
    }
  });
  webServer.register({
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
}
export {
  HEALTH_PATH,
  LEDGER_PATH,
  apply,
  inject,
  name
};
