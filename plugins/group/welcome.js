const { setWelcomeStatus, setLeftStatus } = require('../../lib/welcome')

module.exports = {
  name: 'welcome',
  aliases: ['left'],
  category: 'group',
  description: 'Turn the welcome / goodbye message on or off',
  usage: 'on / off',
  groupOnly: true,
  adminOnly: true,
  execute: async ({ m, config, prefix, command, args, reply }) => {
    const mode = args[0]?.toLowerCase()
    if (!['on', 'off'].includes(mode)) return reply(`Example: ${prefix}${command} on / ${prefix}${command} off`)
    if (command === 'welcome') setWelcomeStatus(m.chat, mode === 'on')
    else setLeftStatus(m.chat, mode === 'on')
    reply(config.messages.done)
  },
}
