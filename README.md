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

- `index.js` — WhatsApp connection
- `handler.js` — command logic
- `lib/` — helper functions
- `storage/` — database & media

## Deploy

Works on any VPS with Node.js 18+ and FFmpeg installed. Run with PM2 for auto-restart on crash.

## Disclaimer

Built on Baileys, an unofficial WhatsApp Web API. Using it may violate WhatsApp's Terms of Service and can result in account restrictions or bans. Use at your own risk.
