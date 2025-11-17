const path = require('path')
const fs = require('../fs')
const run = require('../run')
const dependencies = require('../dependencies')
const patchelf = require('../patchelf')

module.exports = async function* linux(base, pkg, name, version, opts = {}) {
  const { hosts = [], needs = [], out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'linux-arm64':
        arch = 'aarch64'
        break
      case 'linux-x64':
        arch = 'x86_64'
        break
      default:
        throw new Error(`Unknown host '${host}'`)
    }

    archs.set(arch, host)
  }

  const replacements = ['--set-soname', `lib${name}.${version}.so`, '--set-rpath', '$ORIGIN']

  for (const lib of needs) replacements.push('--add-needed', lib)

  for await (const { addon, name, version } of dependencies(base, pkg)) {
    if (addon) {
      const major = version.substring(0, version.indexOf('.'))

      replacements.push('--replace-needed', `${name}@${major}.bare`, `lib${name}.${version}.so`)
    }
  }

  const result = []

  for (const [arch, host] of archs) {
    const dir = archs.size === 1 ? path.resolve(out, 'lib') : path.resolve(out, arch, 'lib')
    await fs.makeDir(dir)

    const so = path.join(dir, `lib${name}.${version}.so`)

    result.push(so)

    await fs.copyFile(path.resolve(base, 'prebuilds', host, `${name}.bare`), so)

    yield so

    try {
      for await (const file of await fs.openDir(path.resolve(base, 'prebuilds', host, name))) {
        switch (path.extname(file.name)) {
          case '.so': {
            const so = path.join(dir, file.name)

            result.push(so)

            await fs.copyFile(path.join(file.parentPath, file.name), so)

            yield so
          }
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }

    await run(patchelf, [...replacements, so])
  }

  return result
}
