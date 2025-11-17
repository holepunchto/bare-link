const { fileURLToPath } = require('url')
const path = require('path')
const fs = require('./lib/fs')
const dependencies = require('./lib/dependencies')
const apple = require('./lib/platform/apple')
const android = require('./lib/platform/android')
const linux = require('./lib/platform/linux')
const windows = require('./lib/platform/windows')
const preset = require('./lib/preset')

module.exports = async function* link(
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

  const { target = [], hosts = target } = opts

  if (pkg === null) {
    try {
      pkg = require(path.resolve(base, 'package.json'))
    } catch {
      return
    }
  }

  if (pkg.addon === true) {
    const name = pkg.name.replace(/\//g, '__').replace(/^@/, '')
    const version = pkg.version
    const groups = new Map()

    for (const host of hosts) {
      let platform

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
        case 'linux-arm64':
        case 'linux-x64':
          platform = linux
          break
        case 'win32-arm64':
        case 'win32-x64':
          platform = windows
          break
        default:
          throw new Error(`Unknown host '${host}'`)
      }

      let group = groups.get(platform)

      if (group === undefined) {
        group = []
        groups.set(platform, group)
      }

      group.push(host)
    }

    for (const [platform, hosts] of groups) {
      yield* platform(base, pkg, name, version, { ...opts, hosts })
    }
  }

  for await (const dependency of dependencies(base, pkg)) {
    yield* link(fileURLToPath(dependency.url), opts, dependency.pkg, visited)
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
