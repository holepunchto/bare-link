const test = require('brittle')
const path = require('path')
const tmp = require('test-tmp')
const link = require('..')
const { paths, tryLoadAddon } = require('./helpers')

const fixtures = path.resolve(__dirname, 'fixtures')

test('runtime dependency, darwin-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    hosts: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'addon.1.2.3.framework/Versions/A/Frameworks/libfoo.dylib',
      'addon.1.2.3.framework/Versions/A/addon.1.2.3',
      'addon.1.2.3.framework/Versions/A/Resources/Info.plist',
      'addon.1.2.3.framework'
    ])
  )

  const addon = tryLoadAddon(path.join(out, 'addon.1.2.3.framework/Versions/A/addon.1.2.3'), [
    'darwin-arm64'
  ])

  if (addon) t.is(addon.exports, 42)
})

test('runtime dependency, darwin-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    hosts: ['darwin-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'addon.1.2.3.framework/Versions/A/Frameworks/libfoo.dylib',
      'addon.1.2.3.framework/Versions/A/addon.1.2.3',
      'addon.1.2.3.framework/Versions/A/Resources/Info.plist',
      'addon.1.2.3.framework'
    ])
  )

  const addon = tryLoadAddon(path.join(out, 'addon.1.2.3.framework/Versions/A/addon.1.2.3'), [
    'darwin-x64'
  ])

  if (addon) t.is(addon.exports, 42)
})

test('runtime dependency, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    hosts: ['ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'addon.1.2.3.framework/Frameworks/libfoo.dylib',
      'addon.1.2.3.framework/addon.1.2.3',
      'addon.1.2.3.framework/Info.plist',
      'addon.1.2.3.framework'
    ])
  )
})

test('runtime dependency, android-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    hosts: ['android-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64-v8a/libfoo.so', 'arm64-v8a/libaddon.1.2.3.so']))
})

test('runtime dependency, linux-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    hosts: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['lib/libfoo.so', 'lib/libaddon.1.2.3.so']))

  const addon = tryLoadAddon(path.join(out, 'lib/libaddon.1.2.3.so'), ['linux-arm64'])

  if (addon) t.is(addon.exports, 42)
})

test('runtime dependency, linux-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    hosts: ['linux-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['lib/libfoo.so', 'lib/libaddon.1.2.3.so']))

  const addon = tryLoadAddon(path.join(out, 'lib/libaddon.1.2.3.so'), ['linux-x64'])

  if (addon) t.is(addon.exports, 42)
})

test('runtime dependency, win32-arm64', async (t) => {
  const out = await tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    hosts: ['win32-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['foo.dll', 'addon-1.2.3.dll']))

  const addon = tryLoadAddon(path.join(out, 'addon-1.2.3.dll'), ['win32-arm64'])

  if (addon) t.is(addon.exports, 42)
})

test('runtime dependency, win32-x64', async (t) => {
  const out = await tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    hosts: ['win32-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['foo.dll', 'addon-1.2.3.dll']))

  const addon = tryLoadAddon(path.join(out, 'addon-1.2.3.dll'), ['win32-x64'])

  if (addon) t.is(addon.exports, 42)
})
