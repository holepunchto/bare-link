const run = require('../../run')

module.exports = async function sign(resource, opts = {}) {
  const { sign = false, identity = 'Apple Development', keychain } = opts

  if (sign) {
    const args = ['--timestamp', '--force', '--sign', identity]

    if (keychain) args.push('--keychain', keychain)

    args.push(resource)

    await run('codesign', args)
  } else {
    await run('codesign', ['--timestamp=none', '--force', '--sign', '-', resource])
  }
}
