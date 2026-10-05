const path = require('path')
const { ELF, MachO, PE } = require('bare-lief')
const fs = require('./fs')

module.exports = async function references(base, name, hosts, names) {
  const found = new Set()

  for (const host of hosts) {
    if (found.size === names.length) break

    const prebuild = path.resolve(base, 'prebuilds', host, `${name}.bare`)

    if (!(await fs.exists(prebuild))) continue

    const referenced = libraries(host, await fs.readFile(prebuild))

    for (const name of names) {
      if (referenced(name)) found.add(name)
    }
  }

  return found
}

function libraries(host, data) {
  const [platform] = host.split('-', 1)

  switch (platform) {
    case 'darwin':
    case 'ios': {
      const fat = MachO.FatBinary.parse(data)

      return (name) => {
        for (let i = 0; i < fat.size; i++) {
          if (fat.at(i).findLibrary(name) !== null) return true
        }

        return false
      }
    }
    case 'android':
    case 'linux': {
      const binary = ELF.Binary.parse(data)

      return (name) => binary.hasLibrary(name)
    }
    case 'win32': {
      const binary = PE.Binary.parse(data)

      const imports = new Set()

      for (const entry of binary.imports) imports.add(entry.name)
      for (const entry of binary.delayImports) imports.add(entry.name)

      return (name) => imports.has(name)
    }
    default:
      throw new Error(`Unknown host '${host}'`)
  }
}
