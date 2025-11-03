const path = require('path')
const fs = require('../fs')

module.exports = async function windows(base, pkg, name, version, opts = {}) {
  const { target = [], out = path.resolve('.') } = opts

  const archs = new Map()

  for (const host of target) {
    let arch

    switch (host) {
      case 'win32-arm64':
        arch = 'arm64'
        break
      case 'win32-x64':
        arch = 'x64'
        break
      default:
        throw new Error(`Unknown target '${host}'`)
    }

    archs.set(arch, host)
  }

  for (const [arch, host] of archs) {
    const dir = path.join(out, arch)
    const dll = path.join(dir, `${name}-${version}.dll`)

    await fs.makeDir(dir)
    await fs.copyFile(path.join(base, 'prebuilds', host, `${name}.bare`), dll)

    try {
      await fs.cp(path.join(base, 'prebuilds', host, name), dir)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }
}
