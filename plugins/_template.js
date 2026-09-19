// Plugin template. Files/folders starting with "_" are ignored by the loader.
// To make a new command: copy this file to plugins/<category>/<name>.js
// (without the underscore) and edit it.
module.exports = {
  name: 'example',
  aliases: [],
  category: 'utility', // utility | downloader | media | converter | owner | group
  description: 'Short description',
  usage: '<text>',
  ownerOnly: false, // only config.owner
  groupOnly: false, // group chat only
  adminOnly: false, // group admin (owner passes); implies groupOnly
  botAdmin: false, // bot must be a group admin (owner does NOT bypass); implies groupOnly
  limit: false, // metadata only: the plugin calls ctx.useLimit() itself after validating args
  execute: async (ctx) => {
    const { reply, text, prefix, command } = ctx
    if (!text) return reply(`Example: ${prefix}${command} hello`)
    reply(text)
  },
}
