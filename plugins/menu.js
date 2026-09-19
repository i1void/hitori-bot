const { runtime } = require('../lib/myfunc')
const { listPlugins } = require('../lib/pluginLoader')
const { getDisabledPlugins } = require('../lib/settings')

module.exports = {
  name: 'menu',
  aliases: ['help'],
  category: 'utility',
  description: 'Show the command list',
  hidden: true,
  execute: async ({ sock, config, prefix, reply, isOwner, isPremium }) => {
    let disabled = getDisabledPlugins()
    let ownerNumber = config.owner[0].replace(/\D/g, '')
    let statusUser = isOwner ? 'Owner 🎴' : isPremium ? 'Premium 💎' : 'Free 😺'
    let botMode = sock.public ? 'public' : 'self'

    // group the commands by their category
    let category = {}
    for (let p of listPlugins()) {
      if (p.hidden || disabled.includes(p.name)) continue
      if (!category[p.category]) category[p.category] = []
      category[p.category].push(p)
    }

    // downloader first, owner + group last, any new category in between
    let first = ['downloader', 'media', 'converter', 'utility']
    let last = ['owner', 'group']
    let others = Object.keys(category).filter((v) => !first.includes(v) && !last.includes(v)).sort()

    // media / converter / utility share one TOOLS section
    let section = {}
    for (let k of [...first, ...others, ...last]) {
      if (!category[k]) continue
      let title = ['media', 'converter', 'utility'].includes(k) ? 'TOOLS' : k.toUpperCase()
      if (!section[title]) section[title] = []
      for (let p of category[k]) {
        section[title].push(`- ${prefix}${[p.name, ...p.aliases].join(' / ')}${p.usage ? ' ' + p.usage : ''}`)
      }
    }

    let print = `━───「 *INFO BOT* 」───━\n\n𖦹 creator : *@${ownerNumber}*\n𖦹 runtime : *${runtime(process.uptime())}*\n𖦹 mode bot : *${botMode}*\n𖦹 status : *${statusUser}*\n\n━───「 *LIST MENU* 」───━`
    for (let title in section) {
      let line = '─'.repeat(Math.max(2, 7 - Math.ceil(title.length / 2)))
      print += `\n\n━${line}「 *${title}* 」${line}━\n${section[title].join('\n')}`
    }
    reply(print, { mentions: [`${ownerNumber}@s.whatsapp.net`] })
  },
}
