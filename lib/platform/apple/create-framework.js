const path = require('path')
const { MachO, constants } = require('bare-lief')
const fs = require('../../fs')
const dependencies = require('../../dependencies')
const sign = require('./sign')

const {
  macho: {
    loadCommand: { ID_DYLIB, RPATH }
  }
} = constants

// https://developer.apple.com/documentation/bundleresources/placing-content-in-a-bundle
module.exports = async function* createFramework(base, pkg, name, version, hosts, out, opts = {}) {
  const isMac = hosts.some((host) => host.startsWith('darwin'))

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

  const prebuilds = hosts.map((host) => path.resolve(base, 'prebuilds', host))

  const extra = new Map()

  for (const base of prebuilds) {
    try {
      for await (const file of await fs.openDir(path.resolve(base, name))) {
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

  if (extra.size > 0) {
    await fs.makeDir(frameworks)

    for (const [name, inputs] of extra) {
      const binaries = []

      for (const input of inputs) binaries.push(new MachO.FatBinary(await fs.readFile(input)))

      const fat = MachO.FatBinary.merge(binaries)

      const dylib = path.join(frameworks, name)
      fat.toDisk(dylib)
      await sign(dylib, opts)
      yield dylib
    }
  }

  const inputs = prebuilds.map((prebuild) => path.join(prebuild, `${name}.bare`))

  const binaries = []

  for (const input of inputs) binaries.push(new MachO.FatBinary(await fs.readFile(input)))

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
    const id = binary.getLoadCommand(ID_DYLIB)
    if (id) binary.removeLoadCommand(id)
    binary.addDylibCommand(
      MachO.DylibCommand.id(`@rpath/${name}.${version}.framework/${name}.${version}`)
    )

    const rpath = binary.getLoadCommand(RPATH)
    if (rpath) binary.removeLoadCommand(id)
    binary.addDylibCommand(new MachO.RPathCommand('@loader_path/Frameworks'))

    for (const [from, to] of replacements) {
      const library = binary.findLibrary(from)

      if (library) library.name = to
      else binary.addLibrary(to)
    }
  }

  const executable = path.join(main, `${name}.${version}`)
  fat.toDisk(executable)
  await sign(executable, opts)
  yield executable

  const info = path.join(resources, 'Info.plist')
  await fs.writeFile(info, createPropertyList(isMac, name, version))
  yield info

  await sign(main, opts)
  yield main

  return framework
}

function createPropertyList(isMac, name, version) {
  const executable = `${name}.${version}`

  version = version.match(/^\d+(\.\d+){0,2}/).at(0)

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
  <key>CFBundleSignature</key>
  <string>????</string>
  <key>${isMac ? 'LSMinimumSystemVersion' : 'MinimumOSVersion'}</key>
  <string>${isMac ? '12.0' : '14.0'}</string>
</dict>
</plist>
`
}

// https://developer.apple.com/documentation/bundleresources/information-property-list/cfbundleidentifier
const invalidBundleIdentifierCharacter = /[^A-Za-z0-9.-]/g

function toIdentifier(input) {
  return input.replace(invalidBundleIdentifierCharacter, '-')
}
