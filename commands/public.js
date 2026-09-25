const axios = require('axios');
const { getDB, saveDB, timeFooter, sendWithGif, fetchAnimeGif, guessGender } = require('../utils');

module.exports = {

    register: async (api, event, args, config) => {
        try {
            const db = getDB();
            if (!db.groups) db.groups = {};
            
            if (!db.groups[event.threadID]) {
                db.groups[event.threadID] = {
                    firstSeen: Date.now(),
                    lastSeen: Date.now(),
                    name: event.threadName || "Unknown"
                };
                saveDB(db);
                api.sendMessage(`✅ ᴛʜɪꜱ ɢʀᴏᴜᴘ ʀᴇɢɪꜱᴛᴇʀᴇᴅ ꜰᴏʀ ᴜᴘᴅᴀᴛᴇꜱ!\n🆔 ${event.threadID}${timeFooter()}`, event.threadID);
            } else {
                api.sendMessage(`ℹ️ ᴛʜɪꜱ ɢʀᴏᴜᴘ ɪꜱ ᴀʟʀᴇᴀᴅʏ ʀᴇɢɪꜱᴛᴇʀᴇᴅ!${timeFooter()}`, event.threadID);
            }
        } catch (e) {
            api.sendMessage("❌ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ============ আপনার অন্যান্য কমান্ড এখানে ============
    help: async (api, event, args, config) => { /* ... */ },
    ping: (api, event) => { /* ... */ },
    // ... বাকি কমান্ড ...

};