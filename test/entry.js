const test = require('brittle')
const path = require('path')
const fs = require('fs')
const { MachO } = require('bare-lief')
const link = require('..')
const { paths } = require('./helpers')

const fixtures = path.resolve(__dirname, 'fixtures')

test('entry outside a package', async (t) => {
  const dir = await t.tmp()
  const out = await t.tmp()

  const entry = path.join(dir, 'entry.js')

  fs.writeFileSync(entry, `require(${JSON.stringify(path.join(fixtures, 'dependent-addon/b'))})\n`)

  const result = []

  for await (const resource of link(entry, { out, hosts: ['darwin-arm64'] })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'a.1.2.3.framework/Versions/A/a.1.2.3',
      'a.1.2.3.framework/Versions/A/Resources/Info.plist',
      'a.1.2.3.framework',
      'b.1.2.3.framework/Versions/A/b.1.2.3',
      'b.1.2.3.framework/Versions/A/Resources/Info.plist',
      'b.1.2.3.framework'
    ])
  )
})

test('addon that is not loaded', async (t) => {
  const dir = await t.tmp()
  const out = await t.tmp()

  const entry = path.join(dir, 'entry.js')

  fs.writeFileSync(entry, `require(${JSON.stringify(path.join(fixtures, 'dependent-addon/a'))})\n`)

  const result = []

  for await (const resource of link(entry, { out, hosts: ['darwin-arm64'] })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'a.1.2.3.framework/Versions/A/a.1.2.3',
      'a.1.2.3.framework/Versions/A/Resources/Info.plist',
      'a.1.2.3.framework'
    ])
  )
})

test('several entries', async (t) => {
  const out = await t.tmp()

  const result = []

  for await (const resource of link(
    [
      path.join(fixtures, 'dependent-addon/b/index.js'),
      path.join(fixtures, 'dependent-addon/a/index.js')
    ],
    { out, hosts: ['darwin-arm64'] }
  )) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'a.1.2.3.framework/Versions/A/a.1.2.3',
      'a.1.2.3.framework/Versions/A/Resources/Info.plist',
      'a.1.2.3.framework',
      'b.1.2.3.framework/Versions/A/b.1.2.3',
      'b.1.2.3.framework/Versions/A/Resources/Info.plist',
      'b.1.2.3.framework'
    ]),
    'each addon is linked once'
  )
})

test('addon dependency that is only linked natively', async (t) => {
  const dir = await t.tmp()
  const out = await t.tmp()

  const entry = path.join(dir, 'entry.js')

  fs.writeFileSync(
    entry,
    `module.exports = require.addon(${JSON.stringify(path.join(fixtures, 'dependent-addon/b'))})\n`
  )

  const result = []

  for await (const resource of link(entry, { out, hosts: ['darwin-arm64'] })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'b.1.2.3.framework/Versions/A/b.1.2.3',
      'b.1.2.3.framework/Versions/A/Resources/Info.plist',
      'b.1.2.3.framework',
      'a.1.2.3.framework/Versions/A/a.1.2.3',
      'a.1.2.3.framework/Versions/A/Resources/Info.plist',
      'a.1.2.3.framework'
    ])
  )
})

test('addon dependency that is not linked natively', async (t) => {
  const dir = await t.tmp()
  const out = await t.tmp()

  const pkg = path.join(dir, 'pkg')

  fs.mkdirSync(path.join(pkg, 'node_modules'), { recursive: true })

  fs.writeFileSync(
    path.join(pkg, 'package.json'),
    JSON.stringify({ name: 'a', version: '1.2.3', addon: true, dependencies: { b: '*' } })
  )

  fs.writeFileSync(path.join(pkg, 'index.js'), "module.exports = require.addon('.')\n")
  fs.symlinkSync(path.join(fixtures, 'dependent-addon/a/prebuilds'), path.join(pkg, 'prebuilds'))
  fs.symlinkSync(path.join(fixtures, 'dependent-addon/b'), path.join(pkg, 'node_modules', 'b'))

  const entry = path.join(dir, 'entry.js')

  fs.writeFileSync(entry, "require('./pkg')\n")

  const result = []

  for await (const resource of link(entry, { out, hosts: ['darwin-arm64'] })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'a.1.2.3.framework/Versions/A/a.1.2.3',
      'a.1.2.3.framework/Versions/A/Resources/Info.plist',
      'a.1.2.3.framework'
    ]),
    'the dependency is not linked'
  )

  const binary = MachO.FatBinary.parse(
    fs.readFileSync(path.join(out, 'a.1.2.3.framework/Versions/A/a.1.2.3'))
  ).at(0)

  t.alike(
    [...binary.libraries]
      .map((library) => library.name)
      .filter((name) => name.startsWith('b@') || name.startsWith('@rpath/b.')),
    [],
    'and no reference to it is added'
  )
})
