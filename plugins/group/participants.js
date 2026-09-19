// kick / promote / demote share the same flow, only the Baileys action differs.
const ACTIONS = {
  kick: { update: 'remove', verb: 'remove' },
  promote: { update: 'promote', verb: 'promote' },
  demote: { update: 'demote', verb: 'demote' },
}

module.exports = {
  name: 'kick',
  aliases: ['promote', 'demote'],
  category: 'group',
  description: 'Remove, promote or demote a member',
  usage: '@user',
  groupOnly: true,
  adminOnly: true,
  botAdmin: true,
  execute: async ({ sock, m, config, command, mentionedJid, reply }) => {
    const { update, verb } = ACTIONS[command]
    if (!mentionedJid.length) return reply(`Tag/reply the user you want to ${verb}.`)
    await sock.groupParticipantsUpdate(m.chat, mentionedJid, update)
    reply(config.messages.done)
  },
}
