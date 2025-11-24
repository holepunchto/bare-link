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
    for (const [os, hosts] of archs) {
      if (hosts.length === 0) archs.delete(os)
    }

    for (const [, hosts] of archs) {
      if (archs.size > 1) {
        const out = await fs.tempDir()

        temp.push(out)

        const framework = yield* createFramework(base, pkg, name, version, hosts, out, opts)

        frameworks.push({ hosts, framework })
      } else {
        return [yield* createFramework(base, pkg, name, version, hosts, out, opts)]
      }
    }

    return [yield* createXCFramework(name, version, frameworks, out, opts)]
  } finally {
    for (const dir of temp) await fs.rm(dir)
  }
}
