const path = require('path')
const { ELF, constants } = require('bare-lief')
const fs = require('../fs')
const dependencies = require('../dependencies')

const {
  elf: {
    dynamicEntry: { SONAME, RUNPATH }
  }
} = constants

module.exports = async function* android(base, pkg, name, version, opts = {}) {
  const { hosts = [], needs = [], out = '.' } = opts

  const archs = new Map()

  for (const host of hosts) {
    let arch

    switch (host) {
      case 'android-arm64':
        arch = 'arm64-v8a'
        break
      case 'android-arm':
        arch = 'armeabi-v7a'
        break
      case 'android-ia32':
        arch = 'x86'
        break
      case 'android-x64':
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
    const dir = path.resolve(out, arch)
    await fs.makeDir(dir)

    const so = path.join(dir, `lib${name}.${version}.so`)

    result.push(so)

    const binary = new ELF.Binary(
      await fs.readFile(path.resolve(base, 'prebuilds', host, `${name}.bare`))
    )

    const soname = binary.getDynamicEntry(SONAME)

    if (soname) {
      soname.name = `lib${name}.${version}.so`
    } else {
      binary.addDynamicEntry(new ELF.DynamicEntry.SharedObject(`lib${name}.${version}.so`))
    }

    const runpath = binary.getDynamicEntry(RUNPATH)

    if (runpath) {
      runpath.runpath = '$ORIGIN'
    } else {
      binary.addDynamicEntry(new ELF.DynamicEntry.RunPath('$ORIGIN'))
    }

    for (const lib of needs) binary.addLibrary(lib)

    for (const [from, to] of replacements) {
      const library = binary.getLibrary(from)

      if (library) library.name = to
      else binary.addLibrary(to)
    }

    binary.toDisk(so)

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
  }

  return result
}
