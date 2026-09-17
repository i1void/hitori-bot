const fs = require('fs')
const chalk = require('chalk')

const ctext = (text, style = 1) => {
  var abc = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');
  var xyz = {
    1: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ1234567890'
  };
  var replacer = [];
  abc.map((v, i) =>
    replacer.push({
      original: v,
      convert: xyz[style].split('')[i]
    })
  );
  var str = text.toLowerCase().split('');
  var output = [];
  str.map((v) => {
    const find = replacer.find((x) => x.original == v);
    find ? output.push(find.convert) : output.push(v);
  });
  return output.join('');
};

global.mess = {
  wait: ctext('[ Loading ] Please Wait'),
  done: ctext('[ Loaded Success ]'),
  error: ctext('[ System Failed ] Error, please contact the owner'),
  groupOnly: ctext('[ System Notice ] Use this in group chat!'),
  privateOnly: ctext('[ System Notice ] Use this in private chat!'),
  adminOnly: ctext('[ System Notice ] for admin! not npc'),
  botAdminNeeded: ctext('[ System Notice ] please add bot admin'),
  ownerOnly: ctext('[ System Access Failed ] Access Denied'),
  limitHabis: ctext('Your limit is used up'),
  banned: ctext('[ System Access Failed ] you are banned by the owner'),
}

module.exports = {
  ctext,
  sessionName: 'hitori',
  usePairingCode: true,
  botNumber: '628XXXXXXXXXX',
  owner: ['628XXXXXXXXXX'],
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
