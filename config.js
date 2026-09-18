const fs = require('fs')
const chalk = require('chalk')

global.mess = {
  wait: '[ Loading ] Please Wait',
  done: '[ Loaded Success ]',
  error: '[ System Failed ] Error, please contact the owner',
  groupOnly: '[ System Notice ] Use this in group chat!',
  privateOnly: '[ System Notice ] Use this in private chat!',
  adminOnly: '[ System Notice ] for admin! not npc',
  botAdminNeeded: '[ System Notice ] please add bot admin',
  ownerOnly: '[ System Access Failed ] Access Denied',
  limitHabis: 'Your limit is used up',
  banned: '[ System Access Failed ] you are banned by the owner',
}

module.exports = {
  sessionName: 'hitori',
  usePairingCode: true,
  // Full number with country code, digits only, no + or spaces.
  // e.g. 14155552671 (US), 447911123456 (UK), 6281234567890 (Indonesia)
  botNumber: 'XXXXXXXXXXX',
  owner: ['XXXXXXXXXXX'],
  ownerName: 'Owner',
  botName: 'Hitori Bot',
  packName: 'Hitori', //pack+author for sticker 
  authorName: 'Void',
  prefixes: ['#', '.', '!', '/'],
  isPublic: true,
  limit: {
    free: 15,
    premium: 10000,
  },
  messages: global.mess,
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update '${__filename}'`))
  delete require.cache[file]
  require(file)
})
