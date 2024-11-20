const path = require('path')
const fs = require('fs')
const os = require('os')

exports.rm = async function rm (name) {
  return new Promise((resolve, reject) => {
    fs.rm(name, { force: true, recursive: true }, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.cp = async function cp (src, dest) {
  return new Promise((resolve, reject) => {
    fs.cp(src, dest, { force: true, recursive: true, filter }, (err) => {
      err ? reject(err) : resolve()
    })
  })

  function filter (src, dest) {
    switch (path.basename(src)) {
      case 'node_modules':
      case 'build':
      case 'prebuilds':
        return false
    }

    return true
  }
}

exports.writeFile = async function writeFile (name, data) {
  return new Promise((resolve) => {
    fs.writeFile(name, data, (err) => {
      resolve(!err)
    })
  })
}

exports.readFile = async function readFile (name) {
  return new Promise((resolve) => {
    fs.readFile(name, (err, data) => {
      resolve(err ? null : data)
    })
  })
}

exports.makeDir = async function makeDir (name) {
  return new Promise((resolve, reject) => {
    fs.mkdir(name, { recursive: true }, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

exports.openDir = async function openDir (name) {
  return new Promise((resolve) => {
    fs.opendir(name, (err, dir) => {
      resolve(err === null ? dir : null)
    })
  })
}

exports.tempDir = async function tempDir () {
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
