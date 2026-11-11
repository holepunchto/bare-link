const path = require('path')
const { MachO } = require('bare-lief')
const { Version } = require('bare-semver')
const hostParser = require('bare-host-parser')
const fs = require('../../fs')
const dependencies = require('../../dependencies')
const sign = require('./sign')

// https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle
module.exports = async function* createFramework(base, pkg, name, version, hosts, out, opts = {}) {
  const prebuilds = []
  const linked = []

  for (const host of hosts) {
    const prebuild = path.resolve(base, 'prebuilds', host, `${name}.bare`)

    if (!(await fs.exists(prebuild))) continue

    prebuilds.push(prebuild)
    linked.push(host)
  }

  if (prebuilds.length === 0) return null

  const [platform] = hostParser.conditions(hosts[0])

  const isMac = platform === 'darwin'

  const framework = path.resolve(out, `${name}.${version}.framework`)
  await fs.rm(framework)
  await fs.makeDir(framework)

  const main = isMac ? path.join(framework, 'Versions/A') : framework
  await fs.makeDir(main)

  const resources = isMac ? path.join(main, 'Resources') : main
  await fs.makeDir(resources)

  const frameworks = path.join(main, 'Frameworks')

  if (isMac) {
    await fs.symlink('A', path.join(framework, 'Versions/Current'))

    await fs.symlink(
      `Versions/Current/${name}.${version}`,
      path.join(framework, `${name}.${version}`)
    )
  }

  const extra = new Map()

  for (const prebuild of prebuilds) {
    try {
      for await (const file of await fs.openDir(path.resolve(prebuild, '..', name))) {
        if (/\.dylib(\.([0-9]+(\.[0-9]+)*))?$/.test(file.name)) {
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

  if (extra.size > 0) {
    await fs.makeDir(frameworks)

    for (const [name, inputs] of extra) {
      const binaries = []

      for (const input of inputs) {
        binaries.push(MachO.FatBinary.parse(await fs.readFile(input)))
      }

      const fat = MachO.FatBinary.merge(binaries)

      const dylib = path.join(frameworks, name)
      fat.toDisk(dylib)
      await sign(dylib, opts)
      yield dylib
    }
  }

  const binaries = []

  for (const prebuild of prebuilds) {
    binaries.push(MachO.FatBinary.parse(await fs.readFile(prebuild)))
  }

  const fat = MachO.FatBinary.merge(binaries)

  const replacements = new Map()

  for await (const { addon, name, version } of dependencies(base, pkg)) {
    if (addon) {
      const major = version.substring(0, version.indexOf('.'))

      replacements.set(
        `${name}@${major}.bare`,
        `@rpath/${name}.${version}.framework/${name}.${version}`
      )
    }
  }

  for (const binary of fat) {
    const id = binary.getLoadCommand(MachO.LoadCommand.TYPE.ID_DYLIB)

    if (id) {
      id.name = `@rpath/${name}.${version}.framework/${name}.${version}`
    } else {
      binary.addDylibCommand(
        MachO.DylibCommand.id(`@rpath/${name}.${version}.framework/${name}.${version}`)
      )
    }

    const rpath = binary.getLoadCommand(MachO.LoadCommand.TYPE.RPATH)

    if (rpath) rpath.path = '@loader_path/Frameworks'

    for (const [from, to] of replacements) {
      const library = binary.findLibrary(from)

      if (library) library.name = to
    }
  }

  const executable = path.join(main, `${name}.${version}`)
  // Signed along with the framework.
  fat.toDisk(executable)
  yield executable

  const info = path.join(resources, 'Info.plist')
  await fs.writeFile(info, createPropertyList(platform, minimumVersion(linked), name, version))
  yield info

  await sign(framework, opts)
  yield framework

  return framework
}

const minimumVersions = {
  darwin: '13.0',
  ios: '15.0',
  watchos: '10.0',
  // 64-bit code only runs on watchOS 26 and later.
  'watchos-arm64': '26.0'
}

// A framework runs wherever one of its slices does.
function minimumVersion(hosts) {
  return hosts
    .map((host) => minimumVersions[host] || minimumVersions[hostParser.parse(host).platform])
    .reduce((a, b) => (parseFloat(a) <= parseFloat(b) ? a : b))
}

function createPropertyList(platform, minimumVersion, name, version) {
  const executable = `${name}.${version}`

  const { major, minor, patch } = Version.parse(version)

  version = `${major}.${minor}.${patch}`

  return `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${toIdentifier(name)}.${version}</string>
  <key>CFBundleVersion</key>
  <string>${version}</string>
  <key>CFBundleShortVersionString</key>
  <string>${version}</string>
  <key>CFBundleExecutable</key>
  <string>${executable}</string>
  <key>CFBundlePackageType</key>
  <string>FMWK</string>
  <key>${platform === 'darwin' ? 'LSMinimumSystemVersion' : 'MinimumOSVersion'}</key>
  <string>${minimumVersion}</string>
</dict>
</plist>
`
}

// https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier
const invalidBundleIdentifierCharacter = /[^A-Za-z0-9.-]/g

function toIdentifier(input) {
  return input.replace(invalidBundleIdentifierCharacter, '-')
}
