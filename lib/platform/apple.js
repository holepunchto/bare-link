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
      prebuilds.push(path.join(base, 'prebuilds', host))
    }

    frameworks.push(await framework(os, base, pkg, name, version, prebuilds, opts))
  }

  if (frameworks.length === 0) return

  try {
    await xcframework(name, version, frameworks, opts)
  } finally {
    for (const framework of frameworks) await fs.rm(framework)
  }
}

// https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle
async function framework(os, base, pkg, name, version, prebuilds, opts = {}) {
  const isMac = os === 'macos'

  const out = await fs.tempDir()

  const framework = path.join(out, `${name}.${version}.framework`)

  await fs.makeDir(framework)

  const main = isMac ? path.join(framework, 'Versions/A') : framework

  await fs.makeDir(main)

  if (isMac) {
    await fs.symlink('A', path.join(framework, 'Versions/Current'))
  }

  const resources = isMac ? path.join(main, 'Resources') : main

  await fs.makeDir(resources)

  const executable = path.join(main, `${name}.${version}`)

  const inputs = prebuilds.map((prebuild) => path.join(prebuild, `${name}.bare`))

  await run('lipo', ['-create', '-output', executable, ...inputs], opts)

  const extra = new Map()

  for (const base of prebuilds) {
    try {
      for await (const file of await fs.openDir(path.join(base, name))) {
        switch (path.extname(file.name)) {
          case '.dylib':
            let files = extra.get(file.name)

            if (files === undefined) {
              files = []
              extra.set(file.name, files)
            }

            files.push(path.join(file.parentPath, file.name))
        }
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }

  const frameworks = path.join(main, 'Frameworks')

  if (extra.size > 0) {
    await fs.makeDir(frameworks)

    for (const [name, inputs] of extra) {
      await run('lipo', ['-create', '-output', path.join(frameworks, name), ...inputs], opts)
    }
  }

  if (isMac) {
    await fs.symlink(
      `Versions/Current/${name}.${version}`,
      path.join(framework, `${name}.${version}`)
    )
  }

  const replacements = [
    '-id',
    `@rpath/${name}.${version}.framework/${name}.${version}`,
    '-add_rpath',
    '@loader_path/Frameworks'
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

  await run('install_name_tool', [...replacements, executable], opts)

  await fs.writeFile(path.join(resources, 'Info.plist'), plist(os, name, version))

  return framework
}

async function xcframework(name, version, inputs, opts = {}) {
  const { out = path.resolve('.') } = opts

  const xcframework = path.join(out, `${name}.${version}.xcframework`)

  await fs.rm(xcframework)

  const frameworks = []

  for (const framework of inputs) frameworks.push('-framework', framework)

  await run('xcodebuild', ['-create-xcframework', '-output', xcframework, ...frameworks], opts)

  return xcframework
}

// https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier
const invalidBundleIdentifierCharacter = /[^A-Za-z0-9.-]/g

function plist(os, name, version) {
  const isMac = os === 'macos'
  const cleanedVersion = version.match(/^\d+(\.\d+){0,2}/).at(0)

  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${name.replace(invalidBundleIdentifierCharacter, '-')}.${version}</string>
  <key>CFBundleVersion</key>
  <string>${cleanedVersion}</string>
  <key>CFBundleShortVersionString</key>
  <string>${cleanedVersion}</string>
  <key>CFBundleExecutable</key>
  <string>${name}.${version}</string>
  <key>CFBundlePackageType</key>
  <string>FMWK</string>
  <key>CFBundleSignature</key>
  <string>????</string>
  <key>${isMac ? 'LSMinimumSystemVersion' : 'MinimumOSVersion'}</key>
  <string>${isMac ? '12.0' : '14.0'}</string>
</dict>
</plist>
`
}
