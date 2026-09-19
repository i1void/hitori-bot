const { ytmp3 } = require('ruhend-scraper')
const yts = require('yt-search')

module.exports = {
  name: 'play',
  aliases: [],
  category: 'downloader',
  description: 'Search and send a song from YouTube',
  usage: '<song title>',
  limit: true,
  execute: async ({ sock, m, config, prefix, text, reply, useLimit, refundLimit }) => {
    if (!text) return reply(`Example: ${prefix}play song title`)
    if (!useLimit()) return
    try {
      await reply(config.messages.wait)
      const search = await yts(text)
      const video = search.videos[0]
      if (!video) {
        refundLimit()
        return reply('Song not found.')
      }
      const data = await ytmp3(video.url)
      await sock.sendMessage(
        m.chat,
        { audio: { url: data.audio }, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` },
        { quoted: m }
      )
    } catch (err) {
      console.error(err)
      refundLimit()
      reply(config.messages.error)
    }
  },
}
