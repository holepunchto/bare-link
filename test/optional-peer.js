const test = require('brittle')
const path = require('path')
const fs = require('fs')
const dependencies = require('../lib/dependencies')

async function names(base, pkg) {
  const result = []

  for await (const dependency of dependencies(base, pkg)) result.push(dependency.name)

  return result.sort()
}

async function setup(t) {
  const base = await t.tmp()

  for (const name of ['dep', 'peer', 'optional-peer']) {
    const dir = path.join(base, 'node_modules', name)

    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name, version: '1.0.0', addon: true })
    )
  }

  return base
}

test('optional peer dependencies are not followed', async (t) => {
  const base = await setup(t)

  t.alike(
    await names(base, {
      dependencies: { dep: '^1.0.0' },
      peerDependencies: { peer: '^1.0.0', 'optional-peer': '^1.0.0' },
      peerDependenciesMeta: { 'optional-peer': { optional: true } }
    }),
    ['dep', 'peer']
  )
})

test('an optional peer that is also a dependency is followed', async (t) => {
  const base = await setup(t)

  t.alike(
    await names(base, {
      dependencies: { 'optional-peer': '^1.0.0' },
      peerDependencies: { 'optional-peer': '^1.0.0' },
      peerDependenciesMeta: { 'optional-peer': { optional: true } }
    }),
    ['optional-peer']
  )
})

test('peer dependencies without meta are followed', async (t) => {
  const base = await setup(t)

  t.alike(await names(base, { peerDependencies: { peer: '^1.0.0' } }), ['peer'])
})
