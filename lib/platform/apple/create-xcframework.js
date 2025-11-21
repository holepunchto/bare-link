const path = require('path')
const fs = require('../../fs')
const run = require('../../run')

// https://developer.apple.com/documentation/xcode/creating-a-multi-platform-binary-framework-bundle
module.exports = async function* createXCFramework(name, version, inputs, out) {
  const xcframework = path.resolve(out, `${name}.${version}.xcframework`)

  await fs.rm(xcframework)

  const frameworks = []

  for (const framework of inputs) frameworks.push('-framework', framework)

  await run('xcodebuild', ['-create-xcframework', '-output', xcframework, ...frameworks])

  yield xcframework

  return xcframework
}
