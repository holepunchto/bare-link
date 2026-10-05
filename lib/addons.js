const path = require('path')
const { fileURLToPath, pathToFileURL } = require('url')
const traverse = require('bare-module-traverse')
const dependencies = require('./dependencies')
const fs = require('./fs')
const references = require('./references')

module.exports = async function* addons(entries, hosts) {
  const artifacts = { addons: [], assets: [] }
  const visited = new Set()
  const deferred = []

  // Resolution reads the same manifests repeatedly.
  const reads = new Map()

  const opts = {
    hosts,
    resolve: traverse.resolve.bare,
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

  for (const url of artifacts.addons) {
    const root = await packageRoot(path.dirname(fileURLToPath(url)))

    if (root !== null) roots.add(root)
  }

  // An addon can link against an addon that the module graph never loads.
  for (const root of roots) {
    yield root

    const pkg = require(path.join(root, 'package.json'))

    const linked = new Map()

    for await (const dependency of dependencies(root, pkg)) {
      if (!dependency.addon) continue

      const major = dependency.version.substring(0, dependency.version.indexOf('.'))

      linked.set(`${dependency.name}@${major}.bare`, dependency.url)
    }

    if (linked.size === 0) continue

    const name = pkg.name.replace(/\//g, '__').replace(/^@/, '')

    for (const library of await references(root, name, hosts, [...linked.keys()])) {
      roots.add(await fs.realPath(fileURLToPath(linked.get(library))))
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
        next = generator.next(await fs.isFile(fileURLToPath(value.probe)))
      } else if (value.resolution) {
        next = generator.next(value.resolution)
      } else if (value.prefix) {
        const result = []

        for await (const url of fs.listPrefix(value.prefix)) result.push(url)

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
      read = fs.readModule(url)
      reads.set(url.href, read)
    }

    return read
  }
}

// A package reached through a symbolic link is the same package.
async function packageRoot(dir) {
  while (true) {
    if (await fs.exists(path.join(dir, 'package.json'))) return fs.realPath(dir)

    const parent = path.dirname(dir)

    if (parent === dir) return null

    dir = parent
  }
}
