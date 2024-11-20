const path = require('path')
const fs = require('./lib/fs')
const apple = require('./lib/platform/apple')
const android = require('./lib/platform/android')

module.exports = async function link (base = '.', opts = {}) {
  if (typeof base === 'object' && base !== null) {
    opts = base
    base = '.'
  }

  base = path.resolve(base)

  const {
    target = []
  } = opts

  const pkg = JSON.parse(await fs.readFile(path.join(base, 'package.json')))

  const name = pkg.name.replace(/\//g, '+')
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
