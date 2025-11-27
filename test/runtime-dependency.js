const test = require('brittle')
const path = require('path')
const link = require('..')

const fixtures = path.resolve(__dirname, 'fixtures')

test('runtime dependency, darwin-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    target: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, [
    'addon.1.2.3.framework/Versions/A/Frameworks/libfoo.dylib',
    'addon.1.2.3.framework/Versions/A/addon.1.2.3',
    'addon.1.2.3.framework/Versions/A/Resources/Info.plist',
    'addon.1.2.3.framework'
  ])
})

test('runtime dependency, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    target: ['ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, [
    'addon.1.2.3.framework/Frameworks/libfoo.dylib',
    'addon.1.2.3.framework/addon.1.2.3',
    'addon.1.2.3.framework/Info.plist',
    'addon.1.2.3.framework'
  ])
})

test('runtime dependency, android-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    target: ['android-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, ['arm64-v8a/libfoo.so', 'arm64-v8a/libaddon.1.2.3.so'])
})

test('runtime dependency, linux-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    target: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, ['lib/libfoo.so', 'lib/libaddon.1.2.3.so'])
})

test('runtime dependency, win32-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'runtime-dependency'), {
    out,
    target: ['win32-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, ['foo.dll', 'addon-1.2.3.dll'])
})
