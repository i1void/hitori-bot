const fs = require('fs')

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

// Write to a temp file first, then rename over the target. A crash in the
// middle of a write can no longer leave a half-written JSON file behind.
function writeJson(file, data) {
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

module.exports = { readJson, writeJson }
