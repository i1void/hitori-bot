const fetch = require('node-fetch')

module.exports = {
  name: 'carbon',
  aliases: [],
  category: 'utility',
  description: 'Turn code into an image',
  usage: '<code>',
  execute: async ({ sock, m, config, prefix, text, reply }) => {
    if (!text) return reply(`Example: ${prefix}carbon console.log("hello")`)
    try {
      await reply(config.messages.wait)
      const res = await fetch(`https://meitang.xyz/carbon?text=${encodeURIComponent(text)}`)
      const json = await res.json()
      if (!json?.result) return reply(config.messages.error)
      await sock.sendMessage(m.chat, { image: { url: json.result } }, { quoted: m })
    } catch (err) {
      console.error(err)
      reply(config.messages.error)
    }
  },
}
