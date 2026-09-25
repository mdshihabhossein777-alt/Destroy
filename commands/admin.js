const fs = require('fs');
const { getDB, saveDB, timeFooter, hasPermission, permissionDenied, getUserRole } = require('../utils');

module.exports = {

    kick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /kick @ᴜꜱᴇʀ" + timeFooter(), event.threadID);

        const reason = args.filter(a => !a.startsWith('@')).join(" ") || "ɴᴏ ʀᴇᴀꜱᴏɴ";

        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            const botID = api.getCurrentUserID();
            const isBotAdmin = info?.adminIDs?.some(a => a.id === botID);

            if (!isBotAdmin) {
                return api.sendMessage(
                    "❌ ʙᴏᴛ ɪꜱ ɴᴏᴛ ɢʀᴏᴜᴘ ᴀᴅᴍɪɴ!\n⚠️ ᴍᴀᴋᴇ ʙᴏᴛ ᴀᴅᴍɪɴ ꜰɪʀꜱᴛ" + timeFooter(),
                    event.threadID
                );
            }
        } catch (e) {
            console.error("Kick permission check error:", e.message);
        }

        api.removeUserFromGroup(t, event.threadID, (err) => {
            if (err) {
                return api.sendMessage("❌ ꜰᴀɪʟᴇᴅ. ʙᴏᴛ ɴᴇᴇᴅꜱ ᴀᴅᴍɪɴ." + timeFooter(), event.threadID);
            }
            api.sendMessage(`👢 ᴜꜱᴇʀ ᴋɪᴄᴋᴇᴅ\n📝 ʀᴇᴀꜱᴏɴ: ${reason}${timeFooter()}`, event.threadID);
        });
    },

    ban: async (api, event, args, config) => {
        // ... ban কোড এখানে ...
    },

    // ... বাকি কমান্ড ...

};