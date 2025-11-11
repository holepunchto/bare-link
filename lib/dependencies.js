const { fileURLToPath, pathToFileURL } = require('url')
const { lookupPackageRoot } = require('bare-module-resolve')
const fs = require('./fs')

module.exports = async function* dependencies(base, pkg) {
  const dependencies = {
    ...pkg.dependencies,
    ...pkg.optionalDependencies,
    ...pkg.peerDependencies,
    ...pkg.bundleDependencies
  }

  for (const dependency in dependencies) {
    for (const packageURL of lookupPackageRoot(dependency, pathToFileURL(base + '/'))) {
      const pkg = await readPackage(packageURL)

      if (typeof pkg !== 'object' || pkg === null) continue

      const name = pkg.name
      if (typeof name !== 'string' || name === '') continue

      const version = pkg.version
      if (typeof version !== 'string' || version === '') continue

      yield {
        url: new URL('.', packageURL),
        pkg,
        addon: pkg.addon === true,
        name: name.replace(/\//g, '__').replace(/^@/, ''),
        version
      }
    }
  }
}

async function readPackage(url) {
  try {
    return JSON.parse(await fs.readFile(fileURLToPath(url)))
  } catch {
    return null
  }
}
