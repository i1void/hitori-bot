const fetch = require('node-fetch')

module.exports = {
  name: 'facebook',
  aliases: ['fb'],
  category: 'downloader',
  description: 'Download Facebook video',
  usage: '<facebook link>',
  limit: true,
  execute: async ({ sock, m, config, prefix, text, reply, useLimit }) => {
    if (!text) return reply(`Enter a Facebook link.\nExample: ${prefix}fb https://facebook.com/watch/xxxx`)
    if (!useLimit()) return
    try {
      await reply(config.messages.wait)
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
  },
}
