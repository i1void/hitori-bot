const fetch = require('node-fetch')

module.exports = {
  name: 'shorturl',
  aliases: [],
  category: 'utility',
  description: 'Shorten a link',
  usage: '<link>',
  execute: async ({ config, prefix, text, reply }) => {
    if (!text) return reply(`Example: ${prefix}shorturl https://example.com`)
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`)
      const short = await res.text()
      reply(`🔗 ${short}`)
    } catch (err) {
      console.error(err)
      reply(config.messages.error)
    }
  },
}
