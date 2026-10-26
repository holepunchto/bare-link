const path = require('path')
const { fileURLToPath, pathToFileURL } = require('url')
const traverse = require('bare-module-traverse')
const { lookupPackageScope } = require('bare-module-resolve')
const dependencies = require('./dependencies')
const fs = require('./fs')
const references = require('./references')

module.exports = async function* addons(entries, hosts, options = {}) {
  const {
    readModule = fs.readModule,
    listPrefix = fs.listPrefix,
    resolveModule = fs.resolveModule
  } = options

  const artifacts = { addons: [], assets: [] }
  const visited = new Set()
  const deferred = []

  // Resolution reads the same manifests repeatedly.
  const reads = new Map()

  const opts = {
    resolve: traverse.resolve.bare,
    ...options,
    hosts,
    deferUnresolved: true,
    packages: new Map(),
    prefixes: new Map(),
    types: new Map()
  }

  await Promise.all(
    entries.map((entry) =>
      drive(traverse.module(pathToFileURL(entry), null, null, artifacts, visited, opts))
    )
  )

  while (deferred.length > 0) await Promise.all(deferred.splice(0).map(drive))

  const roots = new Set()

  // The addons are found as resolved modules, so their packages are too.
  for (const url of artifacts.addons) {
    for (const packageURL of lookupPackageScope(url)) {
      if ((await read(packageURL)) === null) continue

      roots.add(fileURLToPath(new URL('.', packageURL)))

      break
    }
  }

  // Copies of an addon with the same name and version would link to the same
  // files, so only the first copy is linked.
  const linking = new Set()

  // An addon can link against an addon that the module graph never loads.
  for (const root of roots) {
    const pkg = require(path.join(root, 'package.json'))

    const name = pkg.name.replace(/\//g, '__').replace(/^@/, '')

    if (linking.has(`${name}@${pkg.version}`)) continue

    linking.add(`${name}@${pkg.version}`)

    yield root

    const linked = new Map()

    for await (const dependency of dependencies(root, pkg)) {
      if (!dependency.addon) continue

      const major = dependency.version.substring(0, dependency.version.indexOf('.'))

      linked.set(`${dependency.name}@${major}.bare`, dependency.url)
    }

    if (linked.size === 0) continue

    for (const library of await references(root, name, hosts, [...linked.keys()])) {
      roots.add(fileURLToPath(await resolveModule(linked.get(library))))
    }
  }

  // Addons are located by probing, so they are never read.
  async function drive(generator) {
    const children = []

    let next = generator.next()

    while (next.done !== true) {
      const value = next.value

      if (value.module) {
        next = generator.next(value.artifact ? null : await read(value.module))
      } else if (value.probe) {
        next = generator.next(await probe(value.probe))
      } else if (value.resolution) {
        next = generator.next(await resolveModule(value.resolution))
      } else if (value.prefix) {
        const result = []

        for await (const url of listPrefix(value.prefix)) result.push(url)

        next = generator.next(result)
      } else if (value.links) {
        await Promise.all(value.links.map(drive))

        next = generator.next()
      } else if (value.children) {
        if (value.deferred) deferred.push(value.children)
        else children.push(value.children)

        next = generator.next()
      } else {
        next = generator.next()
      }
    }

    await Promise.all(children.map(drive))
  }

  function read(url) {
    let read = reads.get(url.href)

    if (read === undefined) {
      read = readModule(url)
      reads.set(url.href, read)
    }

    return read
  }

  async function probe(url) {
    if (await fs.isFile(fileURLToPath(url))) return true

    return readModule !== fs.readModule && (await read(url)) !== null
  }
}
