const test = require('brittle')
const path = require('path')
const link = require('..')
const { paths } = require('./helpers')

const fixtures = path.resolve(__dirname, 'fixtures')

test('packages links the addons that their prebuilds load, once each', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of link.packages(
    [path.join(fixtures, 'dependent-addon/b'), path.join(fixtures, 'dependent-addon/a')],
    { out, hosts: ['android-arm64'] }
  )) {
    result.push(path.relative(out, resource))
  }

  t.alike(result.sort(), paths(['arm64-v8a/liba.1.2.3.so', 'arm64-v8a/libb.1.2.3.so']))
})

test('packages links the addons that a prebuild loads without them being given', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of link.packages(path.join(fixtures, 'dependent-addon/b'), {
    out,
    hosts: ['android-arm64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(result.sort(), paths(['arm64-v8a/liba.1.2.3.so', 'arm64-v8a/libb.1.2.3.so']))
})
