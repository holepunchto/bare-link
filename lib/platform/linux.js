const path = require('path')
const { ELF } = require('bare-lief')
const fs = require('../fs')
const dependencies = require('../dependencies')

module.exports = async function* linux(base, pkg, name, version, opts = {}) {
  const { hosts = [], out = '.' } = opts

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

  const replacements = new Map()

  for await (const { addon, name, version } of dependencies(base, pkg)) {
    if (addon) {
      const major = version.substring(0, version.indexOf('.'))

      replacements.set(`${name}@${major}.bare`, `lib${name}.${version}.so`)
    }
  }

  const result = []

  for (const [arch, host] of archs) {
    const prebuild = path.resolve(base, 'prebuilds', host, `${name}.bare`)

    if (!(await fs.exists(prebuild))) continue

    try {
      for await (const file of await fs.openDir(path.resolve(prebuild, '..', name))) {
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

    const dir = archs.size === 1 ? path.resolve(out, 'lib') : path.resolve(out, arch, 'lib')
    await fs.makeDir(dir)

    const binary = new ELF.Binary(await fs.readFile(prebuild))

    const soname = binary.getDynamicEntry(ELF.DynamicEntry.TAG.SONAME)
    if (soname) soname.name = `lib${name}.${version}.so`

    const runpath = binary.getDynamicEntry(ELF.DynamicEntry.TAG.RUNPATH)
    if (runpath) runpath.runpath = '$ORIGIN'

    for (const [from, to] of replacements) {
      const library = binary.getLibrary(from)
      if (library) library.name = to
    }

    const so = path.join(dir, `lib${name}.${version}.so`)
    result.push(so)
    binary.toDisk(so)
    yield so
  }

  return result
}
