/**
 * dsh-plugin-task-board 构建：产出两个文件。
 *   lib/index.js    宿主半体（cordis 插件，ESM，platform: node）
 *   lib/client.js   浏览器半体（单文件 CJS，platform: browser）
 *
 * 浏览器半体不是普通 CJS 入口：它必须被包进 window.__ModuleLoader__.load({ id, factory })。
 * 两条硬约定（worktable 的 client-factory-gate 里立过）：
 *   1. 注册的 id **必须等于包名**——写错宿主认不出来，页面上一片空白且不报错；
 *   2. load **恰好调用一次**——多一次就重复注册。
 *
 * react / react-dom / @deepseek-ai/* 一律 external：宿主自己有那张冻结的模块表，
 * 打进去会出现两份 React。
 */
import { build } from 'esbuild'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
mkdirSync(join(here, 'lib'), { recursive: true })

const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'))
const manifest = JSON.parse(readFileSync(join(here, 'dsh.plugin.json'), 'utf8'))
if (manifest.version !== pkg.version) {
  throw new Error(
    `dsh-plugin-task-board: package.json version (${pkg.version}) != dsh.plugin.json version (${manifest.version}) — 先统一两处版本号`,
  )
}

const PLUGIN_ID = pkg.name

const clientBanner = {
  js: `window.__ModuleLoader__.load({ id: '${PLUGIN_ID}', factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
}
const clientFooter = { js: 'return module.exports; } });' }

await build({
  entryPoints: [join(here, 'src/index.ts')],
  outfile: 'lib/index.js',
  bundle: true,
  logLevel: 'info',
  platform: 'node',
  format: 'esm',
  target: ['node22'],
  define: { __PLUGIN_VERSION__: JSON.stringify(pkg.version) },
  external: ['@deepseek-ai/*', 'node:*'],
})

await build({
  entryPoints: [join(here, 'src/client/index.tsx')],
  outfile: 'lib/client.js',
  bundle: true,
  logLevel: 'info',
  platform: 'browser',
  format: 'cjs',
  target: ['es2022'],
  jsx: 'automatic',
  define: { __PLUGIN_VERSION__: JSON.stringify(pkg.version) },
  external: [
    '@deepseek-ai/*',
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'scheduler',
  ],
  banner: clientBanner,
  footer: clientFooter,
})

console.log(`[${PLUGIN_ID} build] done: lib/index.js, lib/client.js`)
