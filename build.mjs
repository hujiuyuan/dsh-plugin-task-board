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
import { execFileSync } from 'node:child_process'
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

// 先过类型检查，**再**打包。
//
// esbuild 只转译不做类型检查，于是有些错它会照单全收、打出一个语法上完全合法的
// bundle：最坑的一种是 CSS 模板字符串里混进反引号（styles.ts 整个文件就是一个
// String.raw 模板），字面量被提前收尾，后面的 CSS 被当成 JS 表达式。
// 结果 —— tsc 报一堆莫名其妙的错，npm run build 却报成功，浏览器半体在运行时
// 抛异常，而报错现场离真正的源头十万八千里。本地踩过一次。
try {
  execFileSync(join(here, 'node_modules', '.bin', 'tsc'), ['--noEmit', '-p', join(here, 'tsconfig.json')], {
    stdio: 'pipe',
  })
} catch (error) {
  const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim()
  console.error(`[${PLUGIN_ID} build] 类型检查未通过，先修掉再打包：\n${out}`)
  process.exit(1)
}

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
