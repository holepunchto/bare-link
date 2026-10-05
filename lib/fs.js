const path = require('path')
const fs = require('fs')
const os = require('os')
const { fileURLToPath } = require('url')

exports.exists = async function exists(name) {
  return new Promise((resolve) => {
    fs.access(name, (err) => {
      resolve(err === null)
    })
  })
}

exports.rm = async function rm(name) {
  return new Promise((resolve, reject) => {
    fs.rm(name, { force: true, recursive: true }, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.cp = async function cp(src, dest) {
  return new Promise((resolve, reject) => {
    fs.cp(src, dest, { force: true, recursive: true, verbatimSymlinks: true, filter }, (err) => {
      err ? reject(err) : resolve()
    })
  })

  function filter(src, dest) {
    switch (path.basename(src)) {
      case 'node_modules':
      case 'build':
      case 'prebuilds':
        return false
    }

    return true
  }
}

exports.copyFile = async function copyFile(src, dest) {
  return new Promise((resolve, reject) => {
    fs.copyFile(src, dest, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.writeFile = async function writeFile(name, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(name, data, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.readFile = async function readFile(name) {
  return new Promise((resolve, reject) => {
    fs.readFile(name, (err, data) => {
      err ? reject(err) : resolve(data)
    })
  })
}

exports.symlink = async function symlink(target, path) {
  return new Promise((resolve, reject) => {
    fs.symlink(target, path, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.makeDir = async function makeDir(name) {
  return new Promise((resolve, reject) => {
    fs.mkdir(name, { recursive: true }, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.openDir = async function openDir(name) {
  return new Promise((resolve, reject) => {
    fs.opendir(name, (err, dir) => {
      err ? reject(err) : resolve(dir)
    })
  })
}

exports.tempDir = async function tempDir() {
  const name = Math.random().toString(16).slice(2)

  return new Promise((resolve, reject) => {
    fs.realpath(os.tmpdir(), (err, dir) => {
      if (err) return reject(err)

      dir = path.join(dir, `bare-link-${name}`)

      fs.mkdir(dir, { recursive: true }, (err) => {
        err ? reject(err) : resolve(dir)
      })
    })
  })
}

exports.isFile = function isFile(name) {
  return new Promise((resolve) => {
    fs.stat(name, (err, stat) => {
      resolve(err === null && stat.isFile())
    })
  })
}

exports.readModule = async function readModule(url) {
  try {
    return await exports.readFile(fileURLToPath(url))
  } catch {
    return null
  }
}

exports.listPrefix = async function* listPrefix(url) {
  const name = fileURLToPath(url)

  if (await exports.isFile(name)) return yield url

  if (url.pathname[url.pathname.length - 1] !== '/') url = new URL(url.pathname + '/', url)

  let dir

  try {
    dir = await exports.openDir(name)
  } catch {
    return
  }

  for await (const entry of dir) {
    if (entry.isDirectory()) yield* listPrefix(new URL(entry.name, url))
    else yield new URL(entry.name, url)
  }
}

exports.realPath = function realPath(name) {
  return new Promise((resolve, reject) => {
    fs.realpath(name, (err, resolved) => {
      err ? reject(err) : resolve(resolved)
    })
  })
}
