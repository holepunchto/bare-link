const test = require('brittle')
const path = require('path')
const link = require('..')
const { paths, tryLoadAddon } = require('./helpers')

const fixtures = path.resolve(__dirname, 'fixtures')

test('addon, darwin-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['darwin-arm64']
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

  if (addon) t.alike(addon.exports, 'Hello from addon')
})

test('addon, darwin-arm64 + darwin-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['darwin-arm64', 'darwin-x64']
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

  if (addon) t.alike(addon.exports, 'Hello from addon')
})

test('addon, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['ios-arm64']
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

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['ios-arm64-simulator']
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

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['ios-arm64-simulator', 'ios-x64-simulator']
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

test('addon, ios-arm64 + ios-arm64-simulator + ios-x64-simulator', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['ios-arm64', 'ios-arm64-simulator', 'ios-x64-simulator']
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

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['android-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64-v8a/libaddon.1.2.3.so']))
})

test('addon, android-arm64 + android-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['android-arm64', 'android-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64-v8a/libaddon.1.2.3.so', 'x86_64/libaddon.1.2.3.so']))
})

test('addon, linux-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['lib/libaddon.1.2.3.so']))

  const addon = tryLoadAddon(path.join(out, 'lib/libaddon.1.2.3.so'), ['linux-arm64'])

  if (addon) t.alike(addon.exports, 'Hello from addon')
})

test('addon, linux-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['linux-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['lib/libaddon.1.2.3.so']))

  const addon = tryLoadAddon(path.join(out, 'lib/libaddon.1.2.3.so'), ['linux-x64'])

  if (addon) t.alike(addon.exports, 'Hello from addon')
})

test('addon, linux-arm64 + linux-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['linux-arm64', 'linux-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['aarch64/lib/libaddon.1.2.3.so', 'x86_64/lib/libaddon.1.2.3.so']))
})

test('addon, win32-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['win32-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['addon-1.2.3.dll']))

  const addon = tryLoadAddon(path.join(out, 'addon-1.2.3.dll'), ['win32-arm64'])

  if (addon) t.alike(addon.exports, 'Hello from addon')
})

test('addon, win32-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['win32-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['addon-1.2.3.dll']))

  const addon = tryLoadAddon(path.join(out, 'addon-1.2.3.dll'), ['win32-x64'])

  if (addon) t.alike(addon.exports, 'Hello from addon')
})

test('addon, win32-arm64 + win32-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'addon'), {
    out,
    target: ['win32-arm64', 'win32-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64/addon-1.2.3.dll', 'x64/addon-1.2.3.dll']))
})
