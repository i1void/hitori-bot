const { getUser, updateUser } = require('../../lib/db')

module.exports = {
  name: 'addlimit',
  aliases: [],
  category: 'owner',
  description: 'Add limit to a user',
  usage: '@user <amount>',
  ownerOnly: true,
  execute: async ({ config, prefix, args, mentionedJid, reply }) => {
    if (!mentionedJid.length || !args[args.length - 1]?.match(/^\d+$/))
      return reply(`Example: ${prefix}addlimit @user 50`)
    const amount = parseInt(args[args.length - 1], 10)
    const target = mentionedJid[0]
    const targetUser = getUser(target, config)
    updateUser(target, { limit: targetUser.limit + amount })
    reply(`✅ @${target.split('@')[0]}'s limit increased by ${amount}.`, { mentions: [target] })
  },
}
