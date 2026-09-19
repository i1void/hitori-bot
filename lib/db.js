const fs = require('fs')
const path = require('path')
const { readJson, writeJson } = require('./jsonFile')

const FILE = path.join(__dirname, '..', 'storage', 'database', 'users.json')

if (!fs.existsSync(path.dirname(FILE))) fs.mkdirSync(path.dirname(FILE), { recursive: true })
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}')

function readAll() {
  return readJson(FILE, {})
}

function writeAll(data) {
  writeJson(FILE, data)
}

function getUser(id, config) {
  const data = readAll()
  if (!data[id]) {
    data[id] = { limit: config.limit.free, premium: false }
    writeAll(data)
  }
  return data[id]
}

function updateUser(id, patch) {
  const data = readAll()
  data[id] = { ...data[id], ...patch }
  writeAll(data)
  return data[id]
}

module.exports = { readAll, writeAll, getUser, updateUser }
