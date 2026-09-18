const fs = require('fs')
const path = require('path')
const os = require('os')
const chalk = require('chalk')
const moment = require('moment-timezone')
const config = require('./config')
const { runtime, sleep, getGroupAdmins, formatp } = require('./lib/myfunc')
require('./lib/menu')
const { getUser, updateUser, readAll: readUsers } = require('./lib/db')
const { ytmp3, ytmp4, igdl } = require('ruhend-scraper')
const yts = require('yt-search')

const BANNED_FILE = path.join(__dirname, 'storage', 'database', 'banned.json')
const PREMIUM_FILE = path.join(__dirname, 'storage', 'database', 'premium.json')

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file))
  } catch {
    return fallback
  }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

module.exports = async (sock, m) => {
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
    const isCreator = config.owner.map((v) => v.replace(/\D/g, '')).includes(senderNumber)

    const banned = readJson(BANNED_FILE, [])
    if (banned.includes(sender) && !isCreator) return

    const premium = readJson(PREMIUM_FILE, [])
    const isPremium = isCreator || premium.includes(sender)

    const user = getUser(sender, config)
    if (isPremium) user.premium = true

    const isGroup = m.chat.endsWith('@g.us')
    const groupMetadata = isGroup ? await sock.groupMetadata(m.chat).catch(() => null) : null
    const groupAdmins = isGroup && groupMetadata ? getGroupAdmins(groupMetadata.participants) : []
    const botNumber = sock.decodeJid(sock.user.id)
    const isBotAdmin = isGroup ? groupAdmins.includes(botNumber) : false
    const isAdmin = isGroup ? groupAdmins.includes(sender) : false

    const reply = (teks, opts = {}) => sock.sendMessage(m.chat, { text: teks, ...opts }, { quoted: m })

    const mentionedJid =
      m.mentionedJid && m.mentionedJid.length
        ? m.mentionedJid
        : m.quoted
        ? [m.quoted.sender]
        : args[0]
        ? [args[0].replace(/\D/g, '') + '@s.whatsapp.net']
        : []

    const requireGroup = () => {
      if (!isGroup) {
        reply(config.messages.groupOnly)
        return false
      }
      return true
    }
    const requireAdmin = () => {
      if (!isAdmin && !isCreator) {
        reply(config.messages.adminOnly)
        return false
      }
      return true
    }
    const requireBotAdmin = () => {
      if (!isBotAdmin) {
        reply(config.messages.botAdminNeeded)
        return false
      }
      return true
    }
    const requireOwner = () => {
      if (!isCreator) {
        reply(config.messages.ownerOnly)
        return false
      }
      return true
    }
    const useLimit = () => {
      if (isPremium) return true
      if (user.limit < 1) {
        reply(config.messages.limitHabis)
        return false
      }
      updateUser(sender, { limit: user.limit - 1 })
      return true
    }

    switch (command) {
      case 'menu':
      case 'help': {
        const uptime = runtime(process.uptime())
        const statusUser = isCreator ? 'Owner 🎴' : isPremium ? 'Premium 💎' : 'Free 😺'
        const ownerNumber = config.owner[0].replace(/\D/g, '')
        const botMode = sock.public ? 'public' : 'self'
        const list = [
          global.menuHeader(ownerNumber, uptime, botMode, statusUser),
          global.menuDownloader(prefix),
          global.menuTools(prefix),
          global.menuOwner(prefix),
          global.menuGroup(prefix),
        ].join('\n\n')
        reply(list, { mentions: [`${ownerNumber}@s.whatsapp.net`] })
        break
      }

      case 'ping': {
        const start = Date.now()
        const sent = await reply('Pinging...')
        const latency = Date.now() - start
        await sock.sendMessage(
          m.chat,
          { text: `🏓 Pong! ${latency}ms\nUptime: ${runtime(process.uptime())}` },
          { quoted: m }
        )
        break
      }

      case 'ytmp3':
      case 'ytmp4': {
        if (!text) return reply(`Enter a YouTube link.\nExample: ${prefix}${command} https://youtu.be/xxxx`)
        if (!useLimit()) return
        try {
          await reply(config.messages.wait)
          if (command === 'ytmp3') {
            const data = await ytmp3(text)
            await sock.sendMessage(
              m.chat,
              { audio: { url: data.audio }, mimetype: 'audio/mpeg', fileName: `${data.title || 'audio'}.mp3` },
              { quoted: m }
            )
          } else {
            const data = await ytmp4(text)
            const videoUrl = data.video || data.audio
            await sock.sendMessage(m.chat, { video: { url: videoUrl }, caption: data.title || '' }, { quoted: m })
          }
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'play': {
        if (!text) return reply(`Example: ${prefix}play song title`)
        if (!useLimit()) return
        try {
          await reply(config.messages.wait)
          const search = await yts(text)
          const video = search.videos[0]
          if (!video) return reply('Song not found.')
          const data = await ytmp3(video.url)
          await sock.sendMessage(
            m.chat,
            { audio: { url: data.audio }, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` },
            { quoted: m }
          )
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'tiktok':
      case 'tt': {
        if (!text) return reply(`Enter a TikTok link.\nExample: ${prefix}tiktok https://vt.tiktok.com/xxxx`)
        if (!useLimit()) return
        try {
          await reply(config.messages.wait)
          const fetch = require('node-fetch')
          const res = await fetch(`https://api.i1void.is-a.dev/downloader/tiktok?url=${encodeURIComponent(text)}`)
          const json = await res.json()
          if (!json?.status || !json.result) return reply(config.messages.error)
          const { type, media, title } = json.result
          if (type === 'image' && media.images?.length) {
            for (let i = 0; i < media.images.length; i++) {
              await sock.sendMessage(
                m.chat,
                { image: { url: media.images[i] }, caption: `[Image ${i + 1}/${media.images.length}]` },
                { quoted: m }
              )
              await sleep(500)
            }
          } else {
            const videoUrl = media.video_hd || media.video
            if (!videoUrl) return reply('Video not found / invalid link.')
            await sock.sendMessage(m.chat, { video: { url: videoUrl }, caption: title || '' }, { quoted: m })
          }
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'ig':
      case 'igdl':
      case 'instagram': {
        if (!text) return reply(`Enter an Instagram link.\nExample: ${prefix}ig https://instagram.com/p/xxxx`)
        if (!useLimit()) return
        try {
          await reply(config.messages.wait)
          const res = await igdl(text)
          const data = res.data || []
          if (!data.length) return reply('Media not found / invalid link.')
          for (const media of data) {
            const isVideo = /\.mp4($|\?)/i.test(media.url) || media.type === 'video'
            await sock.sendMessage(m.chat, isVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {
              quoted: m,
            })
            await sleep(500)
          }
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'fb':
      case 'facebook': {
        if (!text) return reply(`Enter a Facebook link.\nExample: ${prefix}fb https://facebook.com/watch/xxxx`)
        if (!useLimit()) return
        try {
          await reply(config.messages.wait)
          const fetch = require('node-fetch')
          const res = await fetch(`https://api.i1void.is-a.dev/downloader/facebook?url=${encodeURIComponent(text)}`)
          const json = await res.json()
          if (!json?.status || !json.result) return reply(config.messages.error)
          const videoUrl = json.result.media?.video || json.result.media?.video_sd
          if (!videoUrl) return reply('Video not found / invalid link.')
          await sock.sendMessage(m.chat, { video: { url: videoUrl }, caption: json.result.title || '' }, { quoted: m })
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'sticker':
      case 's': {
        const target = m.quoted && /image|video/.test(m.quoted.mtype) ? m.quoted : m
        const mime = (target.msg || target).mimetype || ''
        if (!/image|video/.test(mime)) return reply(`Reply/send an image or short video with the caption ${prefix}sticker`)
        try {
          const buffer = await sock.downloadMediaMessage(target)
          const opts = { packname: config.packName, author: config.authorName }
          if (/video/.test(mime)) await sock.sendVideoAsSticker(m.chat, buffer, m, opts)
          else await sock.sendImageAsSticker(m.chat, buffer, m, opts)
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'toimg': {
        if (!m.quoted || m.quoted.mtype !== 'stickerMessage') return reply(`Reply to a sticker with the caption ${prefix}toimg`)
        try {
          const buffer = await sock.downloadMediaMessage(m.quoted)
          await sock.sendMessage(m.chat, { image: buffer }, { quoted: m })
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'tomp3':
      case 'toaudio': {
        if (!m.quoted || !/video|audio/.test(m.quoted.mtype)) return reply(`Reply to a video/audio with the caption ${prefix}tomp3`)
        try {
          await reply(config.messages.wait)
          const buffer = await sock.downloadMediaMessage(m.quoted)
          const { convertToMp3 } = require('./lib/convert')
          const audio = await convertToMp3(buffer)
          await sock.sendMessage(m.chat, { audio, mimetype: 'audio/mpeg' }, { quoted: m })
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'tovn': {
        if (!m.quoted || !/audio/.test(m.quoted.mtype)) return reply(`Reply to an audio with the caption ${prefix}tovn`)
        try {
          const buffer = await sock.downloadMediaMessage(m.quoted)
          const { convertToOpus } = require('./lib/convert')
          const audio = await convertToOpus(buffer)
          await sock.sendMessage(m.chat, { audio, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m })
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'tourl': {
        const target = m.quoted || m
        const mime = (target.msg || target).mimetype || ''
        if (!mime) return reply(`Reply/send media with the caption ${prefix}tourl`)
        try {
          await reply(config.messages.wait)
          const buffer = await sock.downloadMediaMessage(target)
          const upload = require('./lib/uploadFile')
          const url = await upload(buffer)
          reply(`🔗 ${url}`)
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'shorturl': {
        if (!text) return reply(`Example: ${prefix}shorturl https://example.com`)
        try {
          const fetch = require('node-fetch')
          const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`)
          const short = await res.text()
          reply(`🔗 ${short}`)
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'carbon': {
        if (!text) return reply(`Example: ${prefix}carbon console.log("hello")`)
        try {
          const fetch = require('node-fetch')
          await reply(config.messages.wait)
          const res = await fetch(`https://meitang.xyz/carbon?text=${encodeURIComponent(text)}`)
          const json = await res.json()
          if (!json?.result) return reply(config.messages.error)
          await sock.sendMessage(m.chat, { image: { url: json.result } }, { quoted: m })
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'restart': {
        if (!requireOwner()) return
        await reply('♻️ Restarting bot...')
        process.exit(0)
      }

      case 'ban': {
        if (!requireOwner()) return
        if (!mentionedJid.length) return reply(`Tag/reply the user you want to ban.`)
        const list = readJson(BANNED_FILE, [])
        const target = mentionedJid[0]
        if (!list.includes(target)) list.push(target)
        writeJson(BANNED_FILE, list)
        reply(`🚫 @${target.split('@')[0]} has been banned.`, { mentions: [target] })
        break
      }

      case 'unban': {
        if (!requireOwner()) return
        if (!mentionedJid.length) return reply(`Tag/reply the user you want to unban.`)
        const target = mentionedJid[0]
        const list = readJson(BANNED_FILE, []).filter((v) => v !== target)
        writeJson(BANNED_FILE, list)
        reply(`✅ @${target.split('@')[0]} has been unbanned.`, { mentions: [target] })
        break
      }

      case 'addprem': {
        if (!requireOwner()) return
        if (!mentionedJid.length) return reply(`Tag/reply the user you want to make premium.`)
        const list = readJson(PREMIUM_FILE, [])
        const target = mentionedJid[0]
        if (!list.includes(target)) list.push(target)
        writeJson(PREMIUM_FILE, list)
        reply(`⭐ @${target.split('@')[0]} is now premium.`, { mentions: [target] })
        break
      }

      case 'delprem': {
        if (!requireOwner()) return
        if (!mentionedJid.length) return reply(`Tag/reply the user you want to remove from premium.`)
        const target = mentionedJid[0]
        const list = readJson(PREMIUM_FILE, []).filter((v) => v !== target)
        writeJson(PREMIUM_FILE, list)
        reply(`✅ @${target.split('@')[0]} is no longer premium.`, { mentions: [target] })
        break
      }

      case 'listprem': {
        if (!requireOwner()) return
        const list = readJson(PREMIUM_FILE, [])
        reply(list.length ? list.map((v, i) => `${i + 1}. @${v.split('@')[0]}`).join('\n') : 'No premium users yet.', {
          mentions: list,
        })
        break
      }

      case 'addlimit': {
        if (!requireOwner()) return
        if (!mentionedJid.length || !args[args.length - 1]?.match(/^\d+$/))
          return reply(`Example: ${prefix}addlimit @user 50`)
        const amount = parseInt(args[args.length - 1], 10)
        const target = mentionedJid[0]
        const targetUser = getUser(target, config)
        updateUser(target, { limit: targetUser.limit + amount })
        reply(`✅ @${target.split('@')[0]}'s limit increased by ${amount}.`, { mentions: [target] })
        break
      }

      case 'broadcast':
      case 'bc': {
        if (!requireOwner()) return
        if (!text) return reply(`Example: ${prefix}broadcast Announcement...`)
        try {
          const groups = await sock.groupFetchAllParticipating()
          const ids = Object.keys(groups)
          await reply(`📢 Sending broadcast to ${ids.length} groups...`)
          for (const id of ids) {
            await sock.sendMessage(id, { text: `📢 *Broadcast*\n\n${text}` }).catch(() => {})
            await sleep(700)
          }
        } catch (err) {
          console.error(err)
          reply(config.messages.error)
        }
        break
      }

      case 'join': {
        if (!requireOwner()) return
        if (!text) return reply(`Example: ${prefix}join https://chat.whatsapp.com/xxxx`)
        try {
          const code = text.split('https://chat.whatsapp.com/')[1]
          await sock.groupAcceptInvite(code)
          reply('✅ Successfully joined the group.')
        } catch (err) {
          console.error(err)
          reply('❌ Failed to join, the link may be invalid.')
        }
        break
      }

      case 'setbio': {
        if (!requireOwner()) return
        if (!text) return reply(`Example: ${prefix}setbio Hi, I'm a bot!`)
        await sock.updateProfileStatus(text)
        reply(config.messages.done)
        break
      }

      case 'setname': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!requireBotAdmin()) return
        if (!text) return reply(`Example: ${prefix}setname New Group Name`)
        await sock.groupUpdateSubject(m.chat, text)
        reply(config.messages.done)
        break
      }

      case 'setdesc': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!requireBotAdmin()) return
        if (!text) return reply(`Example: ${prefix}setdesc New group description`)
        await sock.groupUpdateDescription(m.chat, text)
        reply(config.messages.done)
        break
      }

      case 'kick': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!requireBotAdmin()) return
        if (!mentionedJid.length) return reply(`Tag/reply the user you want to remove.`)
        await sock.groupParticipantsUpdate(m.chat, mentionedJid, 'remove')
        reply(config.messages.done)
        break
      }

      case 'add': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!requireBotAdmin()) return
        if (!text) return reply(`Example: ${prefix}add 6281234567890`)
        const jid = text.replace(/\D/g, '') + '@s.whatsapp.net'
        await sock.groupParticipantsUpdate(m.chat, [jid], 'add')
        reply(config.messages.done)
        break
      }

      case 'promote': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!requireBotAdmin()) return
        if (!mentionedJid.length) return reply(`Tag/reply the user you want to promote.`)
        await sock.groupParticipantsUpdate(m.chat, mentionedJid, 'promote')
        reply(config.messages.done)
        break
      }

      case 'demote': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!requireBotAdmin()) return
        if (!mentionedJid.length) return reply(`Tag/reply the user you want to demote.`)
        await sock.groupParticipantsUpdate(m.chat, mentionedJid, 'demote')
        reply(config.messages.done)
        break
      }

      case 'tagall': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!groupMetadata) return reply('Failed to fetch group info, please try again.')
        const list = groupMetadata.participants.map((p) => p.id)
        const teks = list.map((v) => `@${v.split('@')[0]}`).join(' ')
        reply(`${text ? text + '\n\n' : ''}${teks}`, { mentions: list })
        break
      }

      case 'hidetag': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!groupMetadata) return reply('Failed to fetch group info, please try again.')
        const list = groupMetadata.participants.map((p) => p.id)
        reply(text || '‎', { mentions: list })
        break
      }

      case 'antilink': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        const { readAntiLinkSettings, writeAntiLinkSettings } = require('./lib/antilink')
        const mode = args[0]?.toLowerCase()
        const list = readAntiLinkSettings()
        if (mode === 'on') {
          if (!list.includes(m.chat)) list.push(m.chat)
          writeAntiLinkSettings(list)
          reply('✅ Antilink enabled in this group.')
        } else if (mode === 'off') {
          writeAntiLinkSettings(list.filter((v) => v !== m.chat))
          reply('✅ Antilink disabled in this group.')
        } else {
          reply(`Example: ${prefix}antilink on / ${prefix}antilink off`)
        }
        break
      }

      case 'welcome':
      case 'left': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        const { setWelcomeStatus, setLeftStatus } = require('./lib/welcome')
        const mode = args[0]?.toLowerCase()
        if (!['on', 'off'].includes(mode)) return reply(`Example: ${prefix}${command} on / ${prefix}${command} off`)
        if (command === 'welcome') setWelcomeStatus(m.chat, mode === 'on')
        else setLeftStatus(m.chat, mode === 'on')
        reply(config.messages.done)
        break
      }

      case 'setwelcome':
      case 'setleft': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!text) return reply(`Example: ${prefix}${command} Welcome @user to @group!`)
        const { setWelcome, setLeft } = require('./lib/welcome')
        if (command === 'setwelcome') setWelcome(m.chat, text)
        else setLeft(m.chat, text)
        reply(config.messages.done)
        break
      }

      case 'link':
      case 'linkgc': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!requireBotAdmin()) return
        const code = await sock.groupInviteCode(m.chat)
        reply(`🔗 https://chat.whatsapp.com/${code}`)
        break
      }

      case 'revoke': {
        if (!requireGroup()) return
        if (!requireAdmin()) return
        if (!requireBotAdmin()) return
        const code = await sock.groupRevokeInvite(m.chat)
        reply(`✅ New group link: https://chat.whatsapp.com/${code}`)
        break
      }

      case 'groupinfo': {
        if (!requireGroup()) return
        if (!groupMetadata) return reply('Failed to fetch group info, please try again.')
        reply(
          `*${groupMetadata.subject}*\nID: ${m.chat}\nMembers: ${groupMetadata.participants.length}\nCreated: ${moment(
            groupMetadata.creation * 1000
          ).format('DD/MM/YYYY')}`
        )
        break
      }

      default:
        break
    }
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
