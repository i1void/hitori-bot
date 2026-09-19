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

const DEFAULT_TIMEZONE = 'Asia/Jakarta'

// Timezone used for the daily limit reset. Optional `timezone` key in config.js.
const getTimezone = (config) => config.timezone || DEFAULT_TIMEZONE

// Current date as YYYY-MM-DD in the configured timezone.
function today(config, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: getTimezone(config),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

// Reads (and creates) a user. The daily reset is lazy: the first time a user is
// read on a new day, their limit is topped up to the free amount (bonus limit
// above it is kept). No cron job is needed.
function getUser(id, config, now = new Date()) {
  const data = readAll()
  const day = today(config, now)
  if (!data[id]) {
    data[id] = { limit: config.limit.free, premium: false, lastReset: day }
    writeAll(data)
  } else if (data[id].lastReset !== day) {
    data[id].limit = Math.max(data[id].limit, config.limit.free)
    data[id].lastReset = day
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

module.exports = { readAll, writeAll, getUser, updateUser, getTimezone, today }
