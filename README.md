# HITORI BOT (Base)

> Base WhatsApp bot built with Baileys.
> ⭐ Don't forget to star this repo if you find it useful!

[![GitHub stars](https://img.shields.io/github/stars/i1void/hitori-bot?style=flat-square&color=ff5e5b)](https://github.com/i1void/hitori-bot/stargazers) [![GitHub forks](https://img.shields.io/github/forks/i1void/hitori-bot?style=flat-square)](https://github.com/i1void/hitori-bot/network/members) [![License](https://img.shields.io/github/license/i1void/hitori-bot?style=flat-square)](https://github.com/i1void/hitori-bot/blob/main/LICENSE)

## Features

- Downloader (YouTube, TikTok, Instagram, Facebook)
- Sticker maker + converter (image/video to sticker, sticker to image)
- Media converter (to mp3, to voice note)
- Group management (kick, promote, tagall, antilink, welcome message, etc)
- Owner tools (ban, premium, limit, broadcast, enable/disable commands)
- Plugin system: one file per command, menu is generated automatically

## How To

```
# Clone repository
git clone https://github.com/i1void/hitori-bot.git
cd hitori-bot

# Install dependencies
npm install

# Run the bot
npm start
```

On first run, enter your WhatsApp number when prompted, then input the pairing code shown in the console into WhatsApp > Linked Devices > Link with phone number.

## Config

All settings live in `config.js`: bot number, owner, prefixes, sticker pack/author name, free/premium limit.

Optional keys:

- `timezone` — daily limit reset at 00:00 in this timezone (default `Asia/Jakarta`)
- `logChat: false` — turn off the one-line-per-message log in the console

## Structure

- `index.js` — WhatsApp connection
- `handler.js` — command router
- `plugins/` — one file per command
- `lib/` — helper functions
- `storage/` — database & media

## Add a command

Create `plugins/<category>/<name>.js` (copy `plugins/_template.js`) and restart the bot.
It appears in the menu by itself, even inside a brand new category folder.

```js
module.exports = {
  name: 'hello',
  aliases: ['hi'],
  category: 'utility',
  usage: '<name>', // shown in the menu
  // optional: ownerOnly, groupOnly, adminOnly, botAdmin, hidden (all true/false)
  execute: async ({ reply, text }) => reply(`Hello ${text}`),
}
```

Available in the argument: `sock, m, config, command, args, text, prefix, reply, sleep, mentionedJid,
user, isOwner, isPremium, isGroup, isAdmin, isBotAdmin, groupMetadata, groupAdmins, useLimit, refundLimit`.

For commands that cost limit, call `useLimit()` after checking the arguments and `refundLimit()` if the job fails.
A broken plugin or a duplicate command name is skipped and reported in the console; the bot keeps running.

## Owner commands

- `.plugin` — list commands, `.plugin off <cmd>` / `.plugin on <cmd>` to disable / enable one
- `.botstatus` — uptime, memory, groups, users, command count
- `.ban` `.unban` `.addprem` `.delprem` `.listprem` `.addlimit` `.broadcast` `.join` `.setbio` `.restart`

## Deploy

Works on any VPS with Node.js 18+ and FFmpeg installed. Run with PM2 for auto-restart on crash.

## Disclaimer

Built on Baileys, an unofficial WhatsApp Web API. Using it may violate WhatsApp's Terms of Service and can result in account restrictions or bans. Use at your own risk.
