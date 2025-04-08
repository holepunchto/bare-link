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
  flag('--needs <lib>', 'Additional link library dependencies').multiple(),
  flag('--out|-o <dir>', 'The output directory'),
  flag('--preset <name>', 'Apply an option preset'),
  async (cmd) => {
    const { entry = '.' } = cmd.args
    const { version, target, needs, out, preset } = cmd.flags

    if (version) return console.log(`v${pkg.version}`)

    try {
      await link(entry, {
        target,
        needs,
        out,
        preset,
        stdio: 'inherit'
      })
    } catch {
      process.exitCode = 1
    }
  }
)

cmd.parse()
