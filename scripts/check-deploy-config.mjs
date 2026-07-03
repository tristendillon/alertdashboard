// Guards the single-source-of-truth contract between deploy.config.json and the
// wrangler configs (which must carry their own `name` fields — wrangler requires
// them, so they can drift). Run by the validate job in .github/workflows/deploy.yml.
import { readFileSync } from 'node:fs'
import { parse } from 'jsonc-parser'

const fail = (msg) => {
  console.error(`check-deploy-config: ${msg}`)
  process.exitCode = 1
}

const config = JSON.parse(readFileSync('deploy.config.json', 'utf8'))

for (const key of [
  'zoneName',
  'webWorkerName',
  'listenerWorkerName',
  'webHostname',
  'listenerHostname',
  'clerkInstanceSlug',
]) {
  if (typeof config[key] !== 'string' || config[key].length === 0) {
    fail(`deploy.config.json is missing a non-empty "${key}"`)
  }
}
for (const key of ['webHostname', 'listenerHostname']) {
  if (config[key] && !config[key].endsWith(`.${config.zoneName}`)) {
    fail(`"${key}" (${config[key]}) is not under zone ${config.zoneName}`)
  }
}

const readJsonc = (path) => parse(readFileSync(path, 'utf8'))

const web = readJsonc('apps/web/wrangler.jsonc')
if (web.name !== config.webWorkerName) {
  fail(
    `apps/web/wrangler.jsonc name "${web.name}" != webWorkerName "${config.webWorkerName}"`
  )
}

const listener = readJsonc('apps/firstdue-listener/wrangler.jsonc')
if (listener.name !== config.listenerWorkerName) {
  fail(
    `apps/firstdue-listener/wrangler.jsonc name "${listener.name}" != listenerWorkerName "${config.listenerWorkerName}"`
  )
}
// These are supplied by the deploy cascade (derived/secret), never as vars.
for (const banned of ['CONVEX_URL', 'WEATHER_UNITS']) {
  if (listener.vars && banned in listener.vars) {
    fail(
      `apps/firstdue-listener/wrangler.jsonc vars must not define ${banned} (it is derived at deploy time)`
    )
  }
}

if (process.exitCode) process.exit(process.exitCode)
console.log('check-deploy-config: OK')
