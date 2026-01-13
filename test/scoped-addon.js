const test = require('brittle')
const path = require('path')
const link = require('..')
const { paths } = require('./helpers')

const fixtures = path.resolve(__dirname, 'fixtures')

test('scoped addon, darwin-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'scoped-addon'), {
    out,
    hosts: ['darwin-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'bare__addon.1.2.3.framework/Versions/A/bare__addon.1.2.3',
      'bare__addon.1.2.3.framework/Versions/A/Resources/Info.plist',
      'bare__addon.1.2.3.framework'
    ])
  )
})

test('scoped addon, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'scoped-addon'), {
    out,
    hosts: ['ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result,
    paths([
      'bare__addon.1.2.3.framework/bare__addon.1.2.3',
      'bare__addon.1.2.3.framework/Info.plist',
      'bare__addon.1.2.3.framework'
    ])
  )
})

test('scoped addon, darwin-arm64 + ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'scoped-addon'), {
    out,
    hosts: ['darwin-arm64', 'ios-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result.slice(-2),
    paths(['bare__addon.1.2.3.xcframework/Info.plist', 'bare__addon.1.2.3.xcframework'])
  )
})

test('scoped addon, android-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'scoped-addon'), {
    out,
    hosts: ['android-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['arm64-v8a/libbare__addon.1.2.3.so']))
})

test('scoped addon, linux-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'scoped-addon'), {
    out,
    hosts: ['linux-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['lib/libbare__addon.1.2.3.so']))
})

test('scoped addon, win32-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'scoped-addon'), {
    out,
    hosts: ['win32-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result, paths(['bare__addon-1.2.3.dll']))
})
