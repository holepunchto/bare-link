const path = require('path')
const fs = require('../fs')
const run = require('../run')
const dependencies = require('../dependencies')
const patchelf = require('../patchelf')

module.exports = async function linux(base, pkg, name, version, opts = {}) {
  const { target = [], needs = [], out = path.resolve('.') } = opts

  const archs = new Map()

  for (const host of target) {
    let arch

    switch (host) {
      case 'linux-arm64':
        arch = 'arm64'
        break
      case 'linux-x64':
        arch = 'x64'
        break
      default:
        throw new Error(`Unknown target '${host}'`)
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

  for (const [arch, host] of archs) {
    const dir = path.join(out, arch)
    const so = path.join(dir, `lib${name}.${version}.so`)

    await fs.makeDir(dir)
    await fs.copyFile(path.join(base, 'prebuilds', host, `${name}.bare`), so)

    try {
      for await (const file of await fs.openDir(path.join(base, 'prebuilds', host, name))) {
        switch (path.extname(file.name)) {
          case '.so':
            await fs.copyFile(path.join(file.parentPath, file.name), path.join(dir, file.name))
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }

    await run(patchelf, [...replacements, so], opts)
  }
}
