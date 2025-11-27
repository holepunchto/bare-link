#!/usr/bin/env node
const process = require('process')
const { command, arg, flag, summary } = require('paparam')
const pkg = require('./package')
const link = require('.')

const cmd = command(
  pkg.name,
  summary(pkg.description),
  arg('[entry]', 'The path to the native addon'),
  flag('--version|-v', 'Print the current version'),
  flag('--target|-t <host>', 'The host to target').multiple(),
  flag('--out|-o <dir>', 'The output directory'),
  flag('--preset <name>', 'Apply an option preset'),
  flag('--sign', 'Sign the library'),
  flag('--identity <id>', 'The macOS signing identity'),
  flag('--keychain <name>', 'The macOS signing keychain'),
  flag('--subject <id>', 'The Windows signing subject'),
  flag('--subject-name <name>', 'The Windows signing subject friendly name'),
  flag('--thumbprint <sha1>', 'The Windows signing subject thumbprint'),
  async (cmd) => {
    const { entry = '.' } = cmd.args
    const {
      version,
      target,
      out,
      preset,
      sign,
      identity,
      keychain,
      subject,
      subjectName,
      thumbprint
    } = cmd.flags

    if (version) return console.log(`v${pkg.version}`)

    try {
      for await (const _ of link(entry, {
        target,
        out,
        preset,
        sign,
        identity,
        keychain,
        subject,
        subjectName,
        thumbprint
      })) {
      }
    } catch (err) {
      if (err) console.error(err)
      process.exitCode = 1
    }
  }
)

cmd.parse()
