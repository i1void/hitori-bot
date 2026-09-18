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
  var str = text.split('');
  var output = [];
  str.map((v) => {
    if (v.toUpperCase() !== v.toLowerCase() && v === v.toUpperCase()) {
      output.push(v);
    } else {
      const find = replacer.find((x) => x.original == v.toLowerCase());
      find ? output.push(find.convert) : output.push(v);
    }
  });
  return output.join('');
};

global.menuHeader = (ownerNumber, uptime, botMode, statusUser) => {
  return `━───「 *INFO BOT* 」───━

𖦹 creator : *@${ownerNumber}*
𖦹 runtime : *${uptime}*
𖦹 mode bot : *${botMode}*
𖦹 status : *${statusUser}*

━───「 *LIST MENU* 」───━`
}

global.menuDownloader = (prefix) => {
  return `━──「 *DOWNLOADER* 」───━
- ${prefix}ytmp3 <youtube link>
- ${prefix}ytmp4 <youtube link>
- ${prefix}play <song title>
- ${prefix}tiktok / tt <tiktok link>
- ${prefix}ig / igdl <instagram link>
- ${prefix}fb <facebook link>`
}

global.menuTools = (prefix) => {
  return `━────「 *TOOLS* 」────━
- ${prefix}sticker / s (reply image/video)
- ${prefix}toimg (reply sticker)
- ${prefix}tomp3 (reply video/audio)
- ${prefix}tovn (reply audio)
- ${prefix}tourl (reply media)
- ${prefix}shorturl <link>`
}

global.menuOwner = (prefix) => {
  return `━────「 *OWNER* 」────━
- ${prefix}ban / unban @user
- ${prefix}addprem / delprem @user
- ${prefix}listprem
- ${prefix}addlimit @user <amount>
- ${prefix}broadcast / bc <text>
- ${prefix}join <group link>
- ${prefix}setbio <text>
- ${prefix}restart`
}

global.menuGroup = (prefix) => {
  return `━────「 *GROUP* 」────━
- ${prefix}setname / setdesc <text>
- ${prefix}kick / add / promote / demote @user
- ${prefix}tagall / hidetag <text>
- ${prefix}antilink on/off
- ${prefix}welcome / left on/off
- ${prefix}setwelcome / setleft <text>
- ${prefix}link / revoke
- ${prefix}groupinfo`
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update '${__filename}'`))
  delete require.cache[file]
  require(file)
})
