const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, '..', 'storage', 'database', 'users.json')

if (!fs.existsSync(path.dirname(FILE))) fs.mkdirSync(path.dirname(FILE), { recursive: true })
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}')

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeAll(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
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
