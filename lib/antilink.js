const fs = require('fs')
const path = require('path')
const { writeJson } = require('./jsonFile')

const ANTILINK_PATH = path.join(__dirname, '..', 'storage', 'database', 'antilink.json')
const GROUP_LINK_REGEX = /https?:\/\/(chat\.whatsapp\.com|wa\.me|www\.whatsapp\.com\/invite)\/[a-zA-Z0-9]+/i

function readAntiLinkSettings() {
  try {
    if (!fs.existsSync(ANTILINK_PATH)) {
      writeJson(ANTILINK_PATH, [])
      return []
    }
    return JSON.parse(fs.readFileSync(ANTILINK_PATH, 'utf8'))
  } catch (err) {
    console.error('Error reading anti-link settings:', err)
    return []
  }
}

function writeAntiLinkSettings(settings) {
  try {
    writeJson(ANTILINK_PATH, settings)
  } catch (err) {
    console.error('Error writing anti-link settings:', err)
  }
}

function isWhatsAppGroupLink(message) {
  return GROUP_LINK_REGEX.test(message)
}

async function handleAntiLink(conn, m, from) {
  const activeGroups = readAntiLinkSettings()
  if (!activeGroups.includes(from)) return false
  if (!isWhatsAppGroupLink(m.text)) return false

  try {
    const groupMetadata = await conn.groupMetadata(from)
    const sender = groupMetadata.participants.find((p) => p.id.split('@')[0] === m.sender.split('@')[0])
    if (sender && ['admin', 'superadmin'].includes(sender.admin)) return false

    await conn.groupParticipantsUpdate(from, [m.sender], 'remove')
    await conn.sendMessage(from, {
      text: `@${m.sender.split('@')[0]} was removed for sending a group invite link`,
      mentions: [m.sender],
    })
    return true
  } catch (err) {
    console.error('Error handling antilink:', err)
    return false
  }
}

module.exports = { readAntiLinkSettings, writeAntiLinkSettings, handleAntiLink }
