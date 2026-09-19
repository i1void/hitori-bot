# HITORI BOT (Base)

> Base WhatsApp bot built with Baileys.

[![GitHub stars](https://img.shields.io/github/stars/i1void/hitori-bot?style=flat-square&color=ff5e5b)](https://github.com/i1void/hitori-bot/stargazers) [![GitHub forks](https://img.shields.io/github/forks/i1void/hitori-bot?style=flat-square)](https://github.com/i1void/hitori-bot/network/members) [![License](https://img.shields.io/github/license/i1void/hitori-bot?style=flat-square)](https://github.com/i1void/hitori-bot/blob/main/LICENSE)

## Features

- Downloader (YouTube, TikTok, Instagram, Facebook)
- Sticker maker + converter (image/video to sticker, sticker to image)
- Media converter (to mp3, to voice note)
- Group management (kick, promote, tagall, antilink, welcome message, etc)
- Owner tools (ban, premium, limit, broadcast)

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

All settings live in `config.js` — bot number, owner, prefixes, etc. Edit as needed.

## Structure

- `index.js` — WhatsApp connection, loads the plugins on startup
- `handler.js` — command router (prefix parsing, ban check, permissions, context)
- `plugins/` — one file per command, grouped by category
  (`utility`, `downloader`, `media`, `converter`, `owner`, `group`)
- `lib/` — helper functions (`pluginLoader.js` loads and validates plugins)
- `storage/` — database & media

## Adding a command

Copy `plugins/_template.js` to `plugins/<category>/<name>.js` (or straight into `plugins/`, like `menu.js`) and edit it. Restart the bot.
Files or folders starting with `_` are ignored by the loader.

```js
module.exports = {
  name: 'hello',          // command name
  aliases: ['hi'],        // optional extra names
  category: 'utility',
  ownerOnly: false,       // only config.owner
  groupOnly: false,       // group chat only
  adminOnly: false,       // group admin (owner passes), implies groupOnly
  botAdmin: false,        // bot must be admin (owner does NOT bypass), implies groupOnly
  limit: false,           // metadata only; call ctx.useLimit() yourself after validating args
  execute: async (ctx) => {
    ctx.reply('Hello!')
  },
}
```

`ctx` contains: `sock, m, store, config, plugin, command, args, text, prefix, reply, sleep,
mentionedJid, user, isOwner, isPremium, isGroup, isAdmin, isBotAdmin, groupMetadata,
groupAdmins, useLimit, refundLimit`.

A broken plugin (syntax error, missing field) or a duplicate command name is skipped and
reported in the console; the bot keeps running.

The menu is generated automatically from `category`, `name`, `aliases` and `usage` of every plugin.
A new plugin, or a whole new folder/category (e.g. `plugins/tools/`), shows up in the menu by itself.
Set `hidden: true` to keep a command out of the menu.

## Limit

Free users get `config.limit.free` per day. The limit is topped up lazily the first time a user
sends a command on a new day (default timezone `Asia/Jakarta`; add `timezone: 'UTC'` etc. to
`config.js` to change it). Bonus limit above the free amount (`addlimit`) is kept.
A plugin calls `ctx.useLimit()` after validating its arguments and `ctx.refundLimit()` when the
job fails before anything was delivered.

## Owner tools

- `.plugin` lists commands, `.plugin off <cmd>` / `.plugin on <cmd>` switches one off/on
  (stored in `storage/database/settings.json`; a disabled command is also hidden from the menu).
- Mistyped commands get a hint, e.g. `.tktok` -> `Did you mean .tiktok?`
- `.botstatus` shows uptime, memory, groups, users and command counts.

## Deploy

Works on any VPS with Node.js 18+ and FFmpeg installed. Run with PM2 for auto-restart on crash.

## Disclaimer

Built on Baileys, an unofficial WhatsApp Web API. Using it may violate WhatsApp's Terms of Service and can result in account restrictions or bans. Use at your own risk.
