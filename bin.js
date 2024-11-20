#!/usr/bin/env node
const process = require('process')
const { command, arg, flag, summary } = require('paparam')
const pkg = require('./package')
const link = require('.')

const cmd = command(
  pkg.name,
  summary(pkg.description),
  arg('<entry>', 'The path to the native addon'),
  flag('--target|-t <host>', 'The host to target').multiple(),
  flag('--needs <lib>', 'Additional link library dependencies').multiple(),
  flag('--out|-o <dir>', 'The output directory'),
  flag('--version|-v', 'Print the current version'),
  async (cmd) => {
    const { entry = '.' } = cmd.args
    const { version, target, needs, out } = cmd.flags

    if (version) return console.log(`v${pkg.version}`)

    try {
      await link(entry, {
        target,
        needs,
        out,
        stdio: 'inherit'
      })
    } catch {
      process.exitCode = 1
    }
  }
)

cmd.parse()
