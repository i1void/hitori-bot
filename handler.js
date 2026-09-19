// Command router. Commands themselves live in plugins/ (see lib/pluginLoader.js).
const fs = require('fs')
const chalk = require('chalk')
const config = require('./config')
const { sleep, getGroupAdmins } = require('./lib/myfunc')
const { getUser, updateUser, getTimezone } = require('./lib/db')
const { getBanned, getPremium } = require('./lib/access')
const { getDisabledPlugins } = require('./lib/settings')
const { suggestCommands } = require('./lib/suggest')
const { getPlugin, listPlugins } = require('./lib/pluginLoader')

// Returns the config.messages key to reply with, or null when allowed.
// adminOnly / botAdmin imply groupOnly. The owner bypasses adminOnly but NOT botAdmin.
function checkPermission(plugin, { isOwner, isGroup, isAdmin, isBotAdmin }) {
  if (plugin.ownerOnly && !isOwner) return 'ownerOnly'
  if ((plugin.groupOnly || plugin.adminOnly || plugin.botAdmin) && !isGroup) return 'groupOnly'
  if (plugin.adminOnly && !isAdmin && !isOwner) return 'adminOnly'
  if (plugin.botAdmin && !isBotAdmin) return 'botAdminNeeded'
  return null
}

// Replies with "Did you mean ...?" when a command is close to a real (enabled) one.
function typoHint(command, prefix, isOwner) {
  const disabled = getDisabledPlugins()
  const names = []
  for (const p of listPlugins()) {
    if (disabled.includes(p.name) || (p.ownerOnly && !isOwner)) continue // no hints for commands the sender cannot use
    names.push(p.name, ...p.aliases)
  }

  const seen = new Set()
  const hints = suggestCommands(command, names).filter((h) => {
    const owner = getPlugin(h.name).name
    if (seen.has(owner)) return false
    seen.add(owner)
    return true
  })
  if (!hints.length) return null

  const missing = `🚩 Command *${prefix}${command}* not found.`
  if (hints.length === 1) return `${missing}\nDid you mean *${prefix}${hints[0].name}*?`
  return `${missing} Did you mean:\n\n${hints.map((h, i) => `${i + 1}. ${prefix}${h.name} (${h.accuracy}%)`).join('\n')}`
}

module.exports = async (sock, m, store) => {
  try {
    if (!m.message) return
    const body = m.text || ''
    const prefixes = config.prefixes
    const usedPrefix = prefixes.find((p) => p && body.startsWith(p))
    const isCmd = usedPrefix !== undefined || (prefixes.includes('') && body.length > 0)
    if (!isCmd) return

    const prefix = usedPrefix || ''
    const [rawCmd, ...args] = body.slice(prefix.length).trim().split(/\s+/)
    const command = (rawCmd || '').toLowerCase()
    if (!command) return
    const text = args.join(' ')

    const sender = m.sender
    const senderNumber = sender.split('@')[0]
    const isOwner = config.owner.map((v) => v.replace(/\D/g, '')).includes(senderNumber)

    if (getBanned().includes(sender) && !isOwner) return

    const reply = (teks, opts = {}) => sock.sendMessage(m.chat, { text: teks, ...opts }, { quoted: m })

    const plugin = getPlugin(command)
    if (!plugin) {
      const hint = usedPrefix ? typoHint(command, prefix, isOwner) : null
      if (hint) await reply(hint)
      return
    }
    if (getDisabledPlugins().includes(plugin.name)) {
      return reply('[ System Notice ] This command is disabled by the owner')
    }

    const isPremium = isOwner || getPremium().includes(sender)
    const user = getUser(sender, config)
    if (isPremium) user.premium = true

    const isGroup = m.chat.endsWith('@g.us')
    const groupMetadata = isGroup ? await sock.groupMetadata(m.chat).catch(() => null) : null
    const groupAdmins = isGroup && groupMetadata ? getGroupAdmins(groupMetadata.participants) : []
    const botNumber = sock.decodeJid(sock.user.id)
    const isBotAdmin = isGroup ? groupAdmins.includes(botNumber) : false
    const isAdmin = isGroup ? groupAdmins.includes(sender) : false

    const denied = checkPermission(plugin, { isOwner, isGroup, isAdmin, isBotAdmin })
    if (denied) return reply(config.messages[denied])

    const mentionedJid =
      m.mentionedJid && m.mentionedJid.length
        ? m.mentionedJid
        : m.quoted
        ? [m.quoted.sender]
        : args[0]
        ? [args[0].replace(/\D/g, '') + '@s.whatsapp.net']
        : []

    // Reads the user fresh on every call, so two commands running at the same
    // time can never spend the same (stale) limit value twice.
    let spent = false
    const useLimit = () => {
      if (isPremium) return true
      const current = getUser(sender, config)
      if (current.limit < 1) {
        reply(`${config.messages.limitHabis}\nYour limit resets every day at 00:00 (${getTimezone(config)}).`)
        return false
      }
      updateUser(sender, { limit: current.limit - 1 })
      spent = true
      return true
    }

    // Gives back the limit spent by this command (once). Plugins call it when the
    // job failed before anything was delivered.
    const refundLimit = () => {
      if (!spent) return
      spent = false
      updateUser(sender, { limit: getUser(sender, config).limit + 1 })
    }

    await plugin.execute({
      sock,
      m,
      store,
      config,
      plugin,
      command,
      args,
      text,
      prefix,
      reply,
      sleep,
      mentionedJid,
      user,
      isOwner,
      isPremium,
      isGroup,
      isAdmin,
      isBotAdmin,
      groupMetadata,
      groupAdmins,
      useLimit,
      refundLimit,
    })
  } catch (err) {
    console.error(err)
  }
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update '${__filename}'`))
  delete require.cache[file]
  require(file)
})
