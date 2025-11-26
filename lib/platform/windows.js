const path = require('path')
const fs = require('../fs')
const sign = require('./windows/sign')

module.exports = async function* windows(base, pkg, name, version, opts = {}) {
  const { hosts = [], out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'win32-arm64':
        arch = 'arm64'
        break
      case 'win32-x64':
        arch = 'x64'
        break
      default:
        throw new Error(`Unknown host '${host}'`)
    }

    archs.set(arch, host)
  }

  const result = []

  for (const [arch, host] of archs) {
    const prebuild = path.resolve(base, 'prebuilds', host, `${name}.bare`)

    if (!(await fs.exists(prebuild))) continue

    try {
      for await (const file of await fs.openDir(path.resolve(prebuild, '..', name))) {
        switch (path.extname(file.name)) {
          case '.dll': {
            const dll = path.join(dir, file.name)
            result.push(dll)
            await fs.copyFile(path.join(file.parentPath, file.name), dll)
            await sign(dll, opts)
            yield dll
          }
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }

    const dir = archs.size === 1 ? path.resolve(out) : path.resolve(out, arch)
    await fs.makeDir(dir)

    const dll = path.join(dir, `${name}-${version}.dll`)
    result.push(dll)
    await fs.copyFile(prebuild, dll)
    await sign(dll, opts)
    yield dll
  }

  return result
}
