const test = require('brittle')
const fs = require('fs')
const path = require('path')
const link = require('..')
const { paths } = require('./helpers')

const fixtures = path.resolve(__dirname, 'fixtures')

const manifest = fs.readFileSync(path.join(fixtures, 'privacy-manifest', 'PrivacyInfo.xcprivacy'))

test('privacy manifest, darwin-arm64 + darwin-x64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'privacy-manifest', 'index.js'), {
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
      'addon.1.2.3.framework/Versions/A/Resources/PrivacyInfo.xcprivacy',
      'addon.1.2.3.framework'
    ])
  )

  t.alike(
    fs.readFileSync(
      path.join(out, 'addon.1.2.3.framework/Versions/A/Resources/PrivacyInfo.xcprivacy')
    ),
    manifest
  )
})

test('privacy manifest, ios-arm64', async (t) => {
  const out = await t.tmp()
  const result = []

  for await (const resource of await link(path.join(fixtures, 'privacy-manifest', 'index.js'), {
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
      'addon.1.2.3.framework/PrivacyInfo.xcprivacy',
      'addon.1.2.3.framework'
    ])
  )

  t.alike(fs.readFileSync(path.join(out, 'addon.1.2.3.framework/PrivacyInfo.xcprivacy')), manifest)
})

test('privacy manifest, ios-arm64 + ios-arm64-simulator + ios-x64-simulator', async (t) => {
  const out = await t.tmp()

  for await (const _ of await link(path.join(fixtures, 'privacy-manifest', 'index.js'), {
    out,
    hosts: ['ios-arm64', 'ios-arm64-simulator', 'ios-x64-simulator']
  })) {
    //
  }

  for (const identifier of ['ios-arm64', 'ios-arm64_x86_64-simulator']) {
    t.alike(
      fs.readFileSync(
        path.join(
          out,
          'addon.1.2.3.xcframework',
          identifier,
          'addon.1.2.3.framework/PrivacyInfo.xcprivacy'
        )
      ),
      manifest,
      identifier
    )
  }
})

test('privacy manifest, different between hosts', async (t) => {
  const dir = await t.tmp()
  const out = await t.tmp()

  fs.cpSync(path.join(fixtures, 'privacy-manifest'), dir, { recursive: true })

  fs.writeFileSync(
    path.join(dir, 'prebuilds/darwin-x64/addon/PrivacyInfo.xcprivacy'),
    manifest.toString().replace('<false/>', '<true/>')
  )

  await t.exception(async () => {
    for await (const _ of link(path.join(dir, 'index.js'), {
      out,
      hosts: ['darwin-arm64', 'darwin-x64']
    })) {
      //
    }
  }, /different privacy manifests/)
})

test('privacy manifest, missing from some hosts', async (t) => {
  const dir = await t.tmp()
  const out = await t.tmp()

  fs.cpSync(path.join(fixtures, 'privacy-manifest'), dir, { recursive: true })

  fs.rmSync(path.join(dir, 'prebuilds/darwin-x64/addon/PrivacyInfo.xcprivacy'))

  await t.exception(async () => {
    for await (const _ of link(path.join(dir, 'index.js'), {
      out,
      hosts: ['darwin-arm64', 'darwin-x64']
    })) {
      //
    }
  }, /different privacy manifests/)
})
