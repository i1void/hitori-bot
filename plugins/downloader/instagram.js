const { igdl } = require('ruhend-scraper')

module.exports = {
  name: 'instagram',
  aliases: ['ig', 'igdl'],
  category: 'downloader',
  description: 'Download Instagram post / reel',
  usage: '<instagram link>',
  limit: true,
  execute: async ({ sock, m, config, prefix, text, reply, sleep, useLimit }) => {
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
  },
}
