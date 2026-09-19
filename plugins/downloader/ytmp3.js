const { ytmp3, ytmp4 } = require('ruhend-scraper')

module.exports = {
  name: 'ytmp3',
  aliases: ['ytmp4'],
  category: 'downloader',
  description: 'Download YouTube audio / video',
  usage: '<youtube link>',
  limit: true, // metadata only: the plugin calls useLimit() itself after validating args
  execute: async ({ sock, m, config, prefix, command, text, reply, useLimit, refundLimit }) => {
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
      refundLimit()
      reply(config.messages.error)
    }
  },
}
