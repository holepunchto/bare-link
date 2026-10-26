const test = require('brittle')
const fs = require('fs')
const path = require('path')
const { fileURLToPath, pathToFileURL } = require('url')
const tmp = require('test-tmp')
const link = require('..')
const { paths, tryLoadAddon } = require('./helpers')
const { listPrefix: fsListPrefix } = require('../lib/fs')

const fixtures = path.resolve(__dirname, 'fixtures')

test('addon, darwin-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'addon.1.2.3.framework/Versions/A/addon.1.2.3',
      'addon.1.2.3.framework/Versions/A/Resources/Info.plist',
      'addon.1.2.3.framework'
    ])
  )

  const addon = tryLoadAddon(path.join(out, 'addon.1.2.3.framework/Versions/A/addon.1.2.3'), [
    'darwin-arm64'
  ])

  if (addon) t.is(addon.exports, 'Hello from addon')
})

test('addon, darwin-arm64 + darwin-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['darwin-arm64', 'darwin-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'addon.1.2.3.framework/Versions/A/addon.1.2.3',
      'addon.1.2.3.framework/Versions/A/Resources/Info.plist',
      'addon.1.2.3.framework'
    ])
  )

  const addon = tryLoadAddon(path.join(out, 'addon.1.2.3.framework/Versions/A/addon.1.2.3'), [
    'darwin-arm64',
    'darwin-x64'
  ])

  if (addon) t.is(addon.exports, 'Hello from addon')
})

test('addon, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'addon.1.2.3.framework/addon.1.2.3',
      'addon.1.2.3.framework/Info.plist',
      'addon.1.2.3.framework'
    ])
  )
})

test('addon, ios-arm64-simulator', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['ios-arm64-simulator']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'addon.1.2.3.framework/addon.1.2.3',
      'addon.1.2.3.framework/Info.plist',
      'addon.1.2.3.framework'
    ])
  )
})

test('addon, ios-arm64-simulator + ios-x64-simulator', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['ios-arm64-simulator', 'ios-x64-simulator']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'addon.1.2.3.framework/addon.1.2.3',
      'addon.1.2.3.framework/Info.plist',
      'addon.1.2.3.framework'
    ])
  )
})

test('addon, ios-arm64, always multi-host', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['ios-arm64'],
    alwaysMultiHost: true
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result.slice(-2),
    paths(['addon.1.2.3.xcframework/Info.plist', 'addon.1.2.3.xcframework'])
  )
})

test('addon, darwin-arm64, entry read through readModule', async (t) => {
  const out = await t.tmp()
  const result = []

  const entry = path.join(fixtures, 'virtual', 'index.js')
  const imported = path.join(fixtures, 'virtual', 'imported.js')

  const sources = new Map([
    [entry, "require('./imported.js')"],
    [imported, "require('../addon')"]
  ])

  for await (const resource of await link(entry, {
    out,
    hosts: ['darwin-arm64'],
    async readModule(url) {
      const source = sources.get(fileURLToPath(url))

      if (source !== undefined) return source

      try {
        return await fs.promises.readFile(fileURLToPath(url))
      } catch {
        return null
      }
    }
  })) {
    result.push(path.relative(out, resource))
  }

  t.is(result[result.length - 1], 'addon.1.2.3.framework')
})

test('addon, darwin-arm64, resolved through resolveModule and listPrefix', async (t) => {
  const out = await t.tmp()
  const resolved = []
  const listed = []

  for await (const _ of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['darwin-arm64'],
    async resolveModule(url) {
      resolved.push(url.href)

      return url
    },
    async *listPrefix(url) {
      listed.push(url.href)

      yield* fsListPrefix(url)
    }
  })) {
    //
  }

  t.ok(resolved.length > 0, 'resolutions go through resolveModule')
  t.ok(listed.length > 0, 'prefixes are listed through listPrefix')
})

test('addon, darwin-arm64, imported through the imports option', async (t) => {
  const out = await t.tmp()
  const result = []

  const entry = path.join(fixtures, 'virtual', 'index.js')

  for await (const resource of await link(entry, {
    out,
    hosts: ['darwin-arm64'],
    imports: { 'the-addon': pathToFileURL(path.join(fixtures, 'addon', 'index.js')).href },
    async readModule(url) {
      if (fileURLToPath(url) === entry) return "require('the-addon')"

      try {
        return await fs.promises.readFile(fileURLToPath(url))
      } catch {
        return null
      }
    }
  })) {
    result.push(path.relative(out, resource))
  }

  t.is(result[result.length - 1], 'addon.1.2.3.framework')
})

test('addon, darwin-arm64, reached through a symbolic link', async (t) => {
  const dir = await t.tmp()
  const out = await t.tmp()
  const result = []

  await fs.promises.mkdir(path.join(dir, 'node_modules'))
  await fs.promises.symlink(path.join(fixtures, 'addon'), path.join(dir, 'node_modules', 'addon'))
  await fs.promises.writeFile(path.join(dir, 'index.js'), "require('addon')")

  for await (const resource of await link(path.join(dir, 'index.js'), {
    out,
    hosts: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.is(result[result.length - 1], 'addon.1.2.3.framework')
})

test('addon, ios-arm64 + ios-arm64-simulator + ios-x64-simulator', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['ios-arm64', 'ios-arm64-simulator', 'ios-x64-simulator']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result.slice(-2),
    paths(['addon.1.2.3.xcframework/Info.plist', 'addon.1.2.3.xcframework'])
  )
})

test('addon, android-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['android-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64-v8a/libaddon.1.2.3.so']))
})

test('addon, android-arm64 + android-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['android-arm64', 'android-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64-v8a/libaddon.1.2.3.so', 'x86_64/libaddon.1.2.3.so']))
})

test('addon, linux-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['lib/libaddon.1.2.3.so']))

  const addon = tryLoadAddon(path.join(out, 'lib/libaddon.1.2.3.so'), ['linux-arm64'])

  if (addon) t.is(addon.exports, 'Hello from addon')
})

test('addon, linux-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['linux-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['lib/libaddon.1.2.3.so']))

  const addon = tryLoadAddon(path.join(out, 'lib/libaddon.1.2.3.so'), ['linux-x64'])

  if (addon) t.is(addon.exports, 'Hello from addon')
})

test('addon, linux-arm64 + linux-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['linux-arm64', 'linux-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['aarch64/lib/libaddon.1.2.3.so', 'x86_64/lib/libaddon.1.2.3.so']))
})

test('addon, linux-arm64, always multi-host', async (t) => {
  const out = await tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['linux-arm64'],
    alwaysMultiHost: true
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['aarch64/lib/libaddon.1.2.3.so']))
})

test('addon, win32-arm64, always multi-host', async (t) => {
  const out = await tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['win32-arm64'],
    alwaysMultiHost: true
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64/addon-1.2.3.dll']))
})

test('addon, win32-arm64', async (t) => {
  const out = await tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['win32-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['addon-1.2.3.dll']))

  const addon = tryLoadAddon(path.join(out, 'addon-1.2.3.dll'), ['win32-arm64'])

  if (addon) t.is(addon.exports, 'Hello from addon')
})

test('addon, win32-x64', async (t) => {
  const out = await tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['win32-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['addon-1.2.3.dll']))

  const addon = tryLoadAddon(path.join(out, 'addon-1.2.3.dll'), ['win32-x64'])

  if (addon) t.is(addon.exports, 'Hello from addon')
})

test('addon, win32-arm64 + win32-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon', 'index.js'), {
    out,
    hosts: ['win32-arm64', 'win32-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64/addon-1.2.3.dll', 'x64/addon-1.2.3.dll']))
})
