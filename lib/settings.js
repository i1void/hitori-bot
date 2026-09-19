// Bot-wide settings stored in storage/database/settings.json.
const path = require('path')
const { readJson, writeJson } = require('./jsonFile')

const FILE = path.join(__dirname, '..', 'storage', 'database', 'settings.json')
const read = () => readJson(FILE, {})

module.exports = {
  // Names of plugins the owner switched off with the "plugin" command.
  getDisabledPlugins: () => {
    const list = read().disabledPlugins
    return Array.isArray(list) ? list : []
  },
  setDisabledPlugins: (list) => writeJson(FILE, { ...read(), disabledPlugins: list }),
}
