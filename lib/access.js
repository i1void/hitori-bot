// Ban list and premium list (arrays of JIDs), shared by the router and owner plugins.
const path = require('path')
const { readJson, writeJson } = require('./jsonFile')

const DB_DIR = path.join(__dirname, '..', 'storage', 'database')
const BANNED_FILE = path.join(DB_DIR, 'banned.json')
const PREMIUM_FILE = path.join(DB_DIR, 'premium.json')

module.exports = {
  getBanned: () => readJson(BANNED_FILE, []),
  setBanned: (list) => writeJson(BANNED_FILE, list),
  getPremium: () => readJson(PREMIUM_FILE, []),
  setPremium: (list) => writeJson(PREMIUM_FILE, list),
}
