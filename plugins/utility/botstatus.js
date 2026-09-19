const os = require('os')
const { runtime, formatp } = require('../../lib/myfunc')
const { readAll } = require('../../lib/db')
const { getBanned, getPremium } = require('../../lib/access')
const { listPlugins } = require('../../lib/pluginLoader')
const { getDisabledPlugins } = require('../../lib/settings')

module.exports = {
  name: 'botstatus',
  aliases: ['botstat', 'stat'],
  category: 'utility',
  description: 'Show bot statistics',
  execute: async ({ sock, reply }) => {
    const groups = await sock
      .groupFetchAllParticipating()
      .then((all) => Object.keys(all).length)
      .catch(() => null)
    const plugins = listPlugins()
    const disabled = getDisabledPlugins().filter((name) => plugins.some((p) => p.name === name)).length

    reply(
      [
        '━──「 *BOT STATUS* 」──━',
        '',
        `𖦹 runtime : *${runtime(process.uptime())}*`,
        `𖦹 mode bot : *${sock.public ? 'public' : 'self'}*`,
        `𖦹 memory : *${formatp(process.memoryUsage().rss)}* / ${formatp(os.totalmem())}`,
        `𖦹 node : *${process.version}*`,
        `𖦹 groups : *${groups ?? '-'}*`,
        `𖦹 users : *${Object.keys(readAll()).length}*`,
        `𖦹 premium : *${getPremium().length}*`,
        `𖦹 banned : *${getBanned().length}*`,
        `𖦹 commands : *${plugins.length}* (${disabled} disabled)`,
      ].join('\n')
    )
  },
}
