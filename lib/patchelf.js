const fs = require('fs')

require.asset = require('require-asset')

const patchelf = require.asset('patchelf', __filename)

try {
  fs.accessSync(patchelf, fs.constants.X_OK)
} catch {
  fs.chmodSync(patchelf, 0o755)
}

module.exports = patchelf
