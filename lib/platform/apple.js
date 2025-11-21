const path = require('path')
const fs = require('../fs')
const createFramework = require('./apple/create-framework')
const createXCFramework = require('./apple/create-xcframework')

module.exports = async function* apple(base, pkg, name, version, opts = {}) {
  const { hosts = [], out = '.' } = opts

  const archs = new Map([
    ['macos', []],
    ['ios', []],
    ['ios-simulator', []]
  ])

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'darwin-arm64':
      case 'darwin-x64':
        arch = archs.get('macos')
        break
      case 'ios-arm64':
        arch = archs.get('ios')
        break
      case 'ios-arm64-simulator':
      case 'ios-x64-simulator':
        arch = archs.get('ios-simulator')
        break
      default:
        throw new Error(`Unknown host '${host}'`)
    }

    arch.push(host)
  }

  const temp = []
  const frameworks = []

  try {
    for (const [, hosts] of archs) {
      if (hosts.length === 0) continue

      const out = await fs.tempDir()

      temp.push(out)

      const framework = yield* createFramework(base, pkg, name, version, hosts, out)

      frameworks.push(framework)
    }

    if (frameworks.length === 0) return []

    if (frameworks.length === 1) {
      const [framework] = frameworks

      const target = path.resolve(out, path.basename(framework))

      await fs.cp(framework, target)

      return [target]
    }

    return [yield* createXCFramework(name, version, frameworks, out)]
  } finally {
    for (const dir of temp) await fs.rm(dir)
  }
}
