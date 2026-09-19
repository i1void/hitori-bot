const { runtime } = require('../../lib/myfunc')
require('../../lib/menu') // defines global.menuHeader / menuDownloader / ...

module.exports = {
  name: 'menu',
  aliases: ['help'],
  category: 'utility',
  description: 'Show the command list',
  execute: async ({ sock, config, prefix, reply, isOwner, isPremium }) => {
    const uptime = runtime(process.uptime())
    const statusUser = isOwner ? 'Owner 🎴' : isPremium ? 'Premium 💎' : 'Free 😺'
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
  },
}
