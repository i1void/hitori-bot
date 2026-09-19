module.exports = {
  name: 'toimg',
  aliases: [],
  category: 'media',
  description: 'Turn a sticker into an image',
  usage: '(reply sticker)',
  execute: async ({ sock, m, config, prefix, reply }) => {
    if (!m.quoted || m.quoted.mtype !== 'stickerMessage') return reply(`Reply to a sticker with the caption ${prefix}toimg`)
    try {
      const buffer = await sock.downloadMediaMessage(m.quoted)
      await sock.sendMessage(m.chat, { image: buffer }, { quoted: m })
    } catch (err) {
      console.error(err)
      reply(config.messages.error)
    }
  },
}
