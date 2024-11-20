const { fileURLToPath, pathToFileURL } = require('url')
const resolve = require('bare-module-resolve')
const fs = require('./fs')

module.exports = async function * dependencies (base, pkg) {
  for (const dependency in pkg.dependencies) {
    for await (const resolution of resolve(`${dependency}/package`, pathToFileURL(base + '/'), {
      extensions: ['.json']
    }, readPackage)) {
      try {
        const pkg = await readPackage(resolution)

        if (typeof pkg !== 'object' || pkg === null) continue

        if (pkg.addon !== true) continue

        const name = pkg.name
        if (typeof name !== 'string' || name === '') continue

        const version = pkg.version
        if (typeof version !== 'string' || version === '') continue

        yield {
          name: name.replace(/\//g, '+'),
          version
        }
      } catch {
        continue
      }
    }
  }
}

async function readPackage (url) {
  try {
    return JSON.parse(await fs.readFile(fileURLToPath(url)))
  } catch {
    return null
  }
}
