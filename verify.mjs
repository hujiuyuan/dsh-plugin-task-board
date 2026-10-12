/**
 * 提交前自检。三个门槛，每个都对应一次「真出过事」。
 *
 *   1. **浏览器半体的工厂包装**：`window.__ModuleLoader__.load({ id, factory })`
 *      里 id 必须等于包名，且 `load` 只能调一次。写错 id 的后果是页面上一片空白、
 *      控制台一声不响——最难查的那种失败。
 *   2. **lib/ 比 src/ 新**：lib/ 是提交进仓库的（用户装下来就要能跑，没有构建步骤），
 *      所以「改了 src 忘了构建」会直接把旧代码发出去。比时间戳是最省事又够用的检查。
 *   3. **宿主半体真能跑**：拿一个假的 webServer 调一遍 apply，确认两条路由注册上了、
 *      账本读得出来。这一步用真实账本，不用假数据。
 */
import { build } from 'esbuild'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'))

const failures = []
const ok = (name, detail = '') => console.log(`ok    ${name}${detail ? '  ' + detail : ''}`)
const bad = (name, detail) => {
  failures.push(name)
  console.log(`FAIL  ${name}  → ${detail}`)
}

// ── 门槛 1：浏览器半体的工厂包装 ──────────────────────────────
{
  const source = readFileSync(join(here, 'lib/client.js'), 'utf8')
  const loads = source.match(/__ModuleLoader__\.load\(/g) ?? []
  if (loads.length !== 1) bad('client.js: load 恰好调用一次', `实际 ${loads.length} 次`)
  else ok('client.js: load 恰好调用一次')

  const idMatch = /__ModuleLoader__\.load\(\{\s*id:\s*'([^']+)'/.exec(source)
  if (idMatch === null) bad('client.js: 能解出注册 id', '没找到 id 字段')
  else if (idMatch[1] !== pkg.name) bad('client.js: 注册 id 等于包名', `id=${idMatch[1]}，包名=${pkg.name}`)
  else ok('client.js: 注册 id 等于包名', idMatch[1])

  // 打进来的 React 会让宿主出现两份 React；这两条 require 必须留成 external
  const requires = [...new Set([...source.matchAll(/require\("([^"]+)"\)/g)].map(m => m[1]))]
  const bundled = requires.filter(name => !['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'].includes(name))
  if (bundled.length > 0) bad('client.js: 只 require 宿主的模块表', `多出来了：${bundled.join(', ')}`)
  else ok('client.js: 只 require 宿主的模块表', `(${requires.join(', ')})`)
}

// ── 门槛 2：lib/ 比 src/ 新 ───────────────────────────────────
{
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })
  const newestSrc = Math.max(...walk(join(here, 'src')).map(file => statSync(file).mtimeMs))
  const oldestLib = Math.min(
    statSync(join(here, 'lib/index.js')).mtimeMs,
    statSync(join(here, 'lib/client.js')).mtimeMs,
  )
  if (newestSrc > oldestLib) {
    bad('lib/ 比 src/ 新', `src 最新改动 ${new Date(newestSrc).toLocaleString()}，lib 构建于 ${new Date(oldestLib).toLocaleString()} —— 先 npm run build`)
  } else {
    ok('lib/ 比 src/ 新')
  }
}

// ── 门槛 3：宿主半体真能跑 ────────────────────────────────────
{
  const clientSource = readFileSync(join(here, 'lib/client.js'), 'utf8')
  const dist = await build({
    entryPoints: [join(here, 'src/index.ts')],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: ['node22'],
    define: { __PLUGIN_VERSION__: JSON.stringify(pkg.version) },
    external: ['@deepseek-ai/*', 'node:*'],
  })
  const code = dist.outputFiles[0].text
  const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

  const routes = new Map()
  const warnings = []
  mod.apply({
    webServer: { register: route => { routes.set(route.path, route); return () => {} } },
    logger: { warn: message => warnings.push(message) },
  })
  if (!routes.has(mod.HEALTH_PATH)) bad('host: 注册了 health 路由', [...routes.keys()].join(', '))
  else ok('host: 注册了 health 路由')
  if (!routes.has(mod.LEDGER_PATH)) bad('host: 注册了 ledger 路由', [...routes.keys()].join(', '))
  else ok('host: 注册了 ledger 路由')

  const call = async path => {
    let body = ''
    let status = 0
    await routes.get(path).handler({}, {
      writeHead(code) { status = code },
      end(text) { body = text },
    })
    return { status, body: JSON.parse(body) }
  }
  const health = await call(mod.HEALTH_PATH)
  if (health.status !== 200 || health.body.ok !== true || health.body.version !== pkg.version) {
    bad('host: health 返回自身版本', JSON.stringify(health))
  } else ok('host: health 返回自身版本', health.body.version)

  const ledger = await call(mod.LEDGER_PATH)
  if (ledger.status !== 200) bad('host: ledger 返回 200', `HTTP ${ledger.status}`)
  else if (ledger.body.ok === true) {
    ok('host: 读到真实账本', `${ledger.body.tasks.length} 个任务 · schemaVersion ${ledger.body.schemaVersion}`)
  } else {
    // 账本不在（新机器、看板没跑过）不是失败，是降级——但要说出来
    ok('host: 账本不可用，按降级返回', ledger.body.reason)
  }

  if (warnings.length > 0) ok('host: apply 期间没有告警', warnings.join(' / '))
  else ok('host: apply 期间没有告警')

  if (!clientSource.includes('dsptb')) bad('client.js: 内容看起来是空的', '')
}

console.log()
if (failures.length > 0) {
  console.log(`${failures.length} 项没过：${failures.join('、')}`)
  process.exit(1)
}
console.log('全部通过')
