const path = require('path')
const fs = require('../fs')
const run = require('../run')
const dependencies = require('../dependencies')

module.exports = async function apple(base, pkg, name, version, opts = {}) {
  const { target = [] } = opts

  const archs = new Map([
    ['macos', []],
    ['ios', []],
    ['ios-simulator', []]
  ])

  for (const host of target) {
    let arch

    switch (host) {
      case 'darwin-arm64':
      case 'darwin-x64':
        arch = archs.get('macos')
        break
      case 'ios-arm64':
        arch = archs.get('ios')
        break
      case 'ios-arm64-simulator':
      case 'ios-x64-simulator':
        arch = archs.get('ios-simulator')
        break
      default:
        throw new Error(`Unknown target '${host}'`)
    }

    arch.push(host)
  }

  const frameworks = []

  for (const [os, target] of archs) {
    if (target.length === 0) continue

    const prebuilds = []

    for (const host of target) {
      prebuilds.push(path.join(base, 'prebuilds', host, `${name}.bare`))
    }

    frameworks.push(
      await framework(os, base, pkg, name, version, prebuilds, opts)
    )
  }

  if (frameworks.length === 0) return

  try {
    await xcframework(name, version, frameworks, opts)
  } finally {
    for (const framework of frameworks) await fs.rm(framework)
  }
}

async function framework(os, base, pkg, name, version, inputs, opts = {}) {
  const out = await fs.tempDir()

  const framework = path.join(out, `${name}.${version}.framework`)

  await fs.makeDir(framework)

  await run(
    'lipo',
    [
      '-create',
      '-output',
      path.join(framework, `${name}.${version}`),
      ...inputs
    ],
    opts
  )

  const replacements = [
    '-id',
    `@rpath/${name}.${version}.framework/${name}.${version}`
  ]

  for await (const { addon, name, version } of dependencies(base, pkg)) {
    if (addon) {
      const major = version.substring(0, version.indexOf('.'))

      replacements.push(
        '-change',
        `${name}@${major}.bare`,
        `@rpath/${name}.${version}.framework/${name}.${version}`
      )
    }
  }

  await run(
    'install_name_tool',
    [...replacements, path.join(framework, `${name}.${version}`)],
    opts
  )

  await fs.writeFile(
    path.join(framework, 'Info.plist'),
    plist(os, name, version)
  )

  return framework
}

async function xcframework(name, version, inputs, opts = {}) {
  const { out = path.resolve('.') } = opts

  const xcframework = path.join(out, `${name}.${version}.xcframework`)

  await fs.rm(xcframework)

  const frameworks = []

  for (const framework of inputs) frameworks.push('-framework', framework)

  await run(
    'xcodebuild',
    ['-create-xcframework', '-output', xcframework, ...frameworks],
    opts
  )

  return xcframework
}

function plist(os, name, version) {
  const isMac = os === 'macos'

  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${name}.${version}</string>
  <key>CFBundleVersion</key>
  <string>${version}</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleExecutable</key>
  <string>${name}.${version}</string>
  <key>CFBundlePackageType</key>
  <string>FMWK</string>
  <key>CFBundleSignature</key>
  <string>????</string>
  <key>${isMac ? 'LSMinimumSystemVersion' : 'MinimumOSVersion'}</key>
  <string>${isMac ? '11.0' : '14.0'}</string>
</dict>
</plist>
`
}
