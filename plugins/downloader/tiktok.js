const fetch = require('node-fetch')

module.exports = {
  name: 'tiktok',
  aliases: ['tt'],
  category: 'downloader',
  description: 'Download TikTok video / slideshow',
  usage: '<tiktok link>',
  limit: true,
  execute: async ({ sock, m, config, prefix, text, reply, sleep, useLimit }) => {
    if (!text) return reply(`Enter a TikTok link.\nExample: ${prefix}tiktok https://vt.tiktok.com/xxxx`)
    if (!useLimit()) return
    try {
      await reply(config.messages.wait)
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
  },
}
