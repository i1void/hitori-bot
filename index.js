const {
  default: makeWASocket,
  Browsers,
  makeInMemoryStore,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadContentFromMessage,
  jidDecode,
  proto,
} = require('@whiskeysockets/baileys')
const fs = require('fs')
const pino = require('pino')
const chalk = require('chalk')
const readline = require('readline')
const { Boom } = require('@hapi/boom')
const config = require('./config')
const { smsg, getBuffer, sleep } = require('./lib/myfunc')
const { welcomeHandler } = require('./lib/welcome')
const { handleAntiLink } = require('./lib/antilink')
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} = require('./lib/exif')

const store = { contacts: {} }

const logger = pino({ level: 'silent' })

const question = (text) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(text, (answer) => {
      rl.close()
      resolve(answer)
    })
  })

function clearConsole() {
  console.clear()
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(`session/${config.sessionName}`)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: !config.usePairingCode,
    auth: state,
    markOnlineOnConnect: true,
    browser: Browsers.ubuntu('Chrome'),
  })

  if (config.usePairingCode && !sock.authState.creds.registered) {
    clearConsole()
    let numberInput = config.botNumber
    if (!numberInput || numberInput.includes('X')) {
      numberInput = await question('Masukkan nomor WhatsApp bot (contoh 6281234567890): ')
    }
    setTimeout(async () => {
      let code = await sock.requestPairingCode(numberInput.replace(/[^0-9]/g, ''))
      code = code?.match(/.{1,4}/g)?.join('-') || code
      console.log(chalk.green(`Kode Pairing: ${code}`))
    }, 3000)
  }

  sock.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const decoded = jidDecode(jid) || {}
      return (decoded.user && decoded.server && decoded.user + '@' + decoded.server) || jid
    }
    return jid
  }

  sock.getName = async (jid) => {
    const id = sock.decodeJid(jid)
    if (id.endsWith('@g.us')) {
      const meta = await sock.groupMetadata(id).catch(() => ({}))
      return meta.subject || id
    }
    return store.contacts[id]?.name || id.split('@')[0]
  }

  sock.downloadMediaMessage = async (message) => {
    const mime = (message.msg || message).mimetype || ''
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }

  sock.sendText = (jid, text, quoted, options = {}) =>
    sock.sendMessage(jid, { text, ...options }, { quoted })
  sock.sendMedia = (jid, buffer, _type, caption, quoted, options = {}) =>
    sock.sendMessage(jid, { document: buffer, caption, ...options }, { quoted })

  sock.sendImage = async (jid, buffer, caption = '', quoted, options = {}) =>
    sock.sendMessage(jid, { image: buffer, caption, ...options }, { quoted })

  sock.sendImageAsSticker = async (jid, buffer, quoted, options = {}) => {
    const sticker =
      options.packname || options.author
        ? await writeExifImg(buffer, options)
        : await imageToWebp(buffer)
    await sock.sendMessage(jid, { sticker: { url: sticker } }, { quoted })
    return sticker
  }

  sock.sendVideoAsSticker = async (jid, buffer, quoted, options = {}) => {
    const sticker =
      options.packname || options.author
        ? await writeExifVid(buffer, options)
        : await videoToWebp(buffer)
    await sock.sendMessage(jid, { sticker: { url: sticker } }, { quoted })
    return sticker
  }

  sock.serializeM = (m) => smsg(sock, m, store)

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const mek = chatUpdate.messages[0]
      if (!mek.message) return
      mek.message =
        Object.keys(mek.message)[0] === 'ephemeralMessage'
          ? mek.message.ephemeralMessage.message
          : mek.message
      if (mek.key?.remoteJid === 'status@broadcast') return
      if (!config.isPublic && !mek.key.fromMe && chatUpdate.type === 'notify') return
      if (mek.key.id?.startsWith('BAE5') && mek.key.id.length === 16) return

      const m = smsg(sock, mek, store)
      if (m.isGroup) {
        const handled = await handleAntiLink(sock, m, m.chat).catch(() => false)
        if (handled) return
      }
      require('./handler')(sock, m, store)
    } catch (err) {
      console.error(err)
    }
  })

  sock.ev.on('group-participants.update', async (update) => {
    try {
      await welcomeHandler(sock, update)
    } catch (err) {
      console.error('Error di group-participants.update:', err)
    }
  })

  sock.ev.on('contacts.update', (updates) => {
    for (const contact of updates) {
      const id = sock.decodeJid(contact.id)
      store.contacts[id] = { id, name: contact.notify }
    }
  })

  sock.public = config.isPublic

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      switch (reason) {
        case DisconnectReason.badSession:
          console.log(chalk.red('Sesi rusak. Hapus folder session/ lalu scan/pairing ulang.'))
          process.exit()
          break
        case DisconnectReason.connectionClosed:
        case DisconnectReason.connectionLost:
        case DisconnectReason.restartRequired:
        case DisconnectReason.timedOut:
          console.log(chalk.yellow('Koneksi terputus, menyambungkan ulang...'))
          connectToWhatsApp()
          break
        case DisconnectReason.connectionReplaced:
          console.log(chalk.red('Sesi dipakai di tempat lain. Restart bot ini kalau ini seharusnya jadi sesi aktif.'))
          process.exit()
          break
        case DisconnectReason.loggedOut:
          console.log(chalk.red('Logout dari device. Hapus folder session/ lalu scan/pairing ulang.'))
          process.exit()
          break
        default:
          console.log(chalk.yellow(`Terputus (${reason}), mencoba menyambung ulang...`))
          connectToWhatsApp()
      }
    } else if (connection === 'open') {
      clearConsole()
      console.log(chalk.green(`${config.botName} tersambung ✔`))
    }
  })

  return sock
}

connectToWhatsApp()

const file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})
