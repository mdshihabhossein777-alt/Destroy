const { getDB, saveDB, timeFooter, hasPermission, permissionDenied } = require('../utils');

module.exports = {

    master: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "owner"))) return permissionDenied(api, event, "owner");

        const msg = `👑 ᴍᴀꜱᴛᴇʀ ᴄᴏɴᴛʀᴏʟ ᴘᴀɴᴇʟ
━━━━━━━━━━━━━━━━━━━━━━━━
🔥 /security on/off
⚔️ /war on/off
🔄 /restart
📢 /broadcast [ᴍꜱɢ]
📋 /grouplist
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    }

};