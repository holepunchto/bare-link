const path = require('path')
const { pathToFileURL } = require('url')

exports.paths = function paths(list) {
  return list.map(path.normalize)
}

exports.tryLoadAddon = function tryLoadAddon(path, hosts = []) {
  if (typeof Bare === 'undefined' || !hosts.includes(Bare.Addon.host)) {
    return null
  }

  return Bare.Addon.load(pathToFileURL(path))
}
