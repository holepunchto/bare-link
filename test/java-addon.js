const test = require('brittle')
const path = require('path')
const link = require('..')
const { paths } = require('./helpers')

const fixtures = path.resolve(__dirname, 'fixtures')

test('java addon, android-arm64 + android-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'java-addon', 'index.js'), {
    out,
    hosts: ['android-arm64', 'android-x64']
  })) {
    result.push(path.relative(out, resource))
  }

  t.alike(
    result.sort(),
    paths([
      'arm64-v8a/libjava-addon.1.2.3.so',
      'java-addon.a_classes.classes.dex',
      'java-addon.a_classes.classes2.dex',
      'java-addon.a_classes.jar',
      'java-addon.b_classes.classes.dex',
      'java-addon.b_classes.jar',
      'x86_64/libjava-addon.1.2.3.so'
    ])
  )
})
