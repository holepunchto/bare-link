const { fileURLToPath, pathToFileURL } = require('url')
const resolve = require('bare-module-resolve')
const fs = require('./fs')

module.exports = async function* dependencies(base, pkg) {
  const dependencies = {
    ...pkg.dependencies,
    ...pkg.optionalDependencies,
    ...pkg.peerDependencies,
    ...pkg.bundleDependencies
  }

  for (const dependency in dependencies) {
    try {
      for await (const resolution of resolve(
        `${dependency}/package`,
        pathToFileURL(base + '/'),
        {
          extensions: ['.json']
        },
        readPackage
      )) {
        try {
          const pkg = await readPackage(resolution)

          if (typeof pkg !== 'object' || pkg === null) continue

          const name = pkg.name
          if (typeof name !== 'string' || name === '') continue

          const version = pkg.version
          if (typeof version !== 'string' || version === '') continue

          yield {
            url: new URL('.', resolution),
            pkg,
            addon: pkg.addon === true,
            name: name.replace(/\//g, '+').replace(/^@/, ''),
            version
          }
        } catch {
          continue
        }
      }
    } catch (err) {
      if (err && err.code === 'PACKAGE_PATH_NOT_EXPORTED') {
        console.warn(err.message)
      } else {
        throw err
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
