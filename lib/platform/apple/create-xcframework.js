const path = require('path')
const fs = require('../../fs')
const sign = require('./sign')

// https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle
module.exports = async function* createXCFramework(name, version, inputs, out, opts = {}) {
  const xcframework = path.resolve(out, `${name}.${version}.xcframework`)
  await fs.makeDir(xcframework)

  const info = path.join(xcframework, 'Info.plist')

  const frameworks = []

  for (const { hosts, framework } of inputs) {
    let os
    let variant = null
    const archs = []

    for (const host of hosts) {
      switch (host) {
        case 'darwin-arm64':
          os = 'macos'
          archs.push('arm64')
          break
        case 'darwin-x64':
          os = 'macos'
          archs.push('x86_64')
          break
        case 'ios-arm64':
          os = 'ios'
          archs.push('arm64')
          break
        case 'ios-arm64-simulator':
          os = 'ios'
          variant = 'simulator'
          archs.push('arm64')
          break
        case 'ios-x64-simulator':
          os = 'ios'
          variant = 'simulator'
          archs.push('x86_64')
          break
      }
    }

    const identifier = `${os}-${archs.join('_')}${variant ? '-' + variant : ''}`

    frameworks.push({
      os,
      variant,
      archs,
      identifier,
      binary:
        os === 'macos'
          ? `${name}.${version}.framework/Versions/A/${name}.${version}`
          : `${name}.${version}.framework/${name}.${version}`
    })

    await fs.cp(framework, path.join(xcframework, identifier, path.basename(framework)))
  }

  await fs.writeFile(info, createPropertyList(frameworks))

  yield info

  await sign(xcframework, opts)

  yield xcframework

  return xcframework
}

function createPropertyList(frameworks) {
  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>AvailableLibraries</key>
  <array>
${frameworks
  .map(
    ({ os, variant, archs, identifier, binary }) => `\
    <dict>
      <key>BinaryPath</key>
      <string>${binary}</string>
      <key>LibraryIdentifier</key>
      <string>${identifier}</string>
      <key>LibraryPath</key>
      <string>${path.basename(binary)}.framework</string>
      <key>SupportedArchitectures</key>
      <array>
${archs
  .map(
    (arch) => `\
        <string>${arch}</string>`
  )
  .join('\n')}
      </array>
      <key>SupportedPlatform</key>
      <string>${os}</string>${
        variant
          ? `
      <key>SupportedPlatformVariant</key>
      <string>${variant}</string>`
          : ''
      }
    </dict>`
  )
  .join('\n')}
  </array>
  <key>CFBundlePackageType</key>
  <string>XFWK</string>
  <key>XCFrameworkFormatVersion</key>
  <string>1.0</string>
</dict>
</plist>
`
}
