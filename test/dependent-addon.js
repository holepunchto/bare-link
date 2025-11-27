const test = require('brittle')
const path = require('path')
const link = require('..')

const fixtures = path.resolve(__dirname, 'fixtures')

test('dependent addon, darwin-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'dependent-addon/b'), {
    out,
    target: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, [
    'a.1.2.3.framework/Versions/A/a.1.2.3',
    'a.1.2.3.framework/Versions/A/Resources/Info.plist',
    'a.1.2.3.framework',
    'b.1.2.3.framework/Versions/A/b.1.2.3',
    'b.1.2.3.framework/Versions/A/Resources/Info.plist',
    'b.1.2.3.framework'
  ])
})

test('dependent addon, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'dependent-addon/b'), {
    out,
    target: ['ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, [
    'a.1.2.3.framework/a.1.2.3',
    'a.1.2.3.framework/Info.plist',
    'a.1.2.3.framework',
    'b.1.2.3.framework/b.1.2.3',
    'b.1.2.3.framework/Info.plist',
    'b.1.2.3.framework'
  ])
})

test('dependent addon, darwin-arm64 + ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'dependent-addon/b'), {
    out,
    target: ['darwin-arm64', 'ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result.slice(6, 8).concat(result.slice(-2)), [
    'a.1.2.3.xcframework/Info.plist',
    'a.1.2.3.xcframework',
    'b.1.2.3.xcframework/Info.plist',
    'b.1.2.3.xcframework'
  ])
})

test('dependent addon, android-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'dependent-addon/b'), {
    out,
    target: ['android-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, ['arm64-v8a/liba.1.2.3.so', 'arm64-v8a/libb.1.2.3.so'])
})

test('dependent addon, linux-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'dependent-addon/b'), {
    out,
    target: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, ['lib/liba.1.2.3.so', 'lib/libb.1.2.3.so'])
})

test('dependent addon, win32-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'dependent-addon/b'), {
    out,
    target: ['win32-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, ['a-1.2.3.dll', 'b-1.2.3.dll'])
})
