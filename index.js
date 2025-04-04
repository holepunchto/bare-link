const { fileURLToPath } = require('url')
const path = require('path')
const fs = require('./lib/fs')
const dependencies = require('./lib/dependencies')
const apple = require('./lib/platform/apple')
const android = require('./lib/platform/android')
const preset = require('./lib/preset')

module.exports = async function link(
  base = '.',
  opts = {},
  pkg = null /* Internal */,
  visited = new Set() /* Internal */
) {
  if (typeof base === 'object' && base !== null) {
    opts = base
    base = '.'
  }

  base = path.resolve(base)

  if (visited.has(base)) return

  visited.add(base)

  opts = withPreset(opts)

  const { target = [] } = opts

  if (pkg === null) {
    pkg = JSON.parse(await fs.readFile(path.join(base, 'package.json')))

    if (typeof pkg !== 'object' || pkg === null) return
  }

  if (pkg.addon === true) {
    const name = pkg.name.replace(/\//g, '__').replace(/^@/, '')
    const version = pkg.version

    let platform = null

    for (const host of target) {
      switch (host) {
        case 'darwin-arm64':
        case 'darwin-x64':
        case 'ios-arm64':
        case 'ios-arm64-simulator':
        case 'ios-x64-simulator':
          platform = apple
          break
        case 'android-arm64':
        case 'android-arm':
        case 'android-ia32':
        case 'android-x64':
          platform = android
          break
        default:
          throw new Error(`Unknown target '${host}'`)
      }
    }

    if (platform === null) throw new Error('No target specified')

    await platform(base, pkg, name, version, opts)
  }

  for await (const dependency of dependencies(base, pkg)) {
    await link(fileURLToPath(dependency.url), opts, dependency.pkg, visited)
  }
}

function withPreset(opts = {}) {
  if (opts.preset) {
    if (opts.preset in preset === false) {
      throw new Error(`Unknown preset '${opts.preset}'`)
    }

    Object.assign(opts, preset[opts.preset])
  }

  return opts
}
