const test = require('brittle')
const patchelf = require('./lib/patchelf')

test('patchelf prebuild', (t) => {
  t.comment(patchelf)
})
