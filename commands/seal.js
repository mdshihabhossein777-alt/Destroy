const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    sleep 
} = require('../utils');

module.exports = {

    // ==================== 🔒 LOCKNAME ====================
    lockname: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        
        const isOn = args[0] === "on";
        db.groups[event.threadID].lockName = isOn;

        if (isOn) {
            let savedName = null;
            for (let i = 0; i < 3; i++) {
                try {
                    const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
                    if (info && info.threadName && info.threadName !== "Unknown" && info.threadName.trim() !== "") {
                        savedName = info.threadName;
                        break;
                    }
                    await sleep(1000);
                } catch (e) {}
            }

            if (savedName) {
                db.groups[event.threadID].lockedName = savedName;
                db.groups[event.threadID].name = savedName;
                console.log(`🔒 Locked name: ${savedName}`);
            } else {
                return api.sendMessage(`⚠️ 𝐔ɴᴀʙʟᴇ ᴛᴏ ꜰᴇᴛᴄʜ ɴᴀᴍᴇ!\n📌 ᴛʀʏ ᴀɢᴀɪɴ${timeFooter()}`, event.threadID);
            }
        }

        saveDB(db);
        const savedName = db.groups[event.threadID].lockedName || "Not set";
        
        api.sendMessage(
            `🔒 𝐋ᴏᴄᴋ 𝐍ᴀᴍᴇ: ${isOn ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
📌 𝐒ᴀᴠᴇᴅ: ${savedName}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔒 LOCKPHOTO ====================
    lockphoto: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].lockPhoto = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🔒 𝐋ᴏᴄᴋ 𝐏ʜᴏᴛᴏ: ${db.groups[event.threadID].lockPhoto ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔒 LOCKNICK ====================
    locknick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].lockNick = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🔒 𝐋ᴏᴄᴋ 𝐍ɪᴄᴋ: ${db.groups[event.threadID].lockNick ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔗 ANTLINK ====================
    antlink: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiLink = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🔗 𝐀ɴᴛɪ-𝐋ɪɴᴋ: ${db.groups[event.threadID].antiLink ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🤬 ANTIGALI ====================
    antigali: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiGali = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🤬 𝐀ɴᴛɪ-𝐆ᴀʟɪ: ${db.groups[event.threadID].antiGali ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🎨 ANTISTICKER ====================
    antisticker: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiSticker = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🎨 𝐀ɴᴛɪ-𝐒ᴛɪᴄᴋᴇʀ: ${db.groups[event.threadID].antiSticker ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🎬 ANTIGIF ====================
    antigif: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiGif = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🎬 𝐀ɴᴛɪ-𝐆ɪꜰ: ${db.groups[event.threadID].antiGif ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📱 ANTIPHONE ====================
    antiphone: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiPhone = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `📱 𝐀ɴᴛɪ-𝐏ʜᴏɴᴇ: ${db.groups[event.threadID].antiPhone ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🐌 SLOWMODE ====================
    slowmode: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        
        const sec = parseInt(args[0]) || 0;
        
        if (sec < 0 || sec > 60) {
            return api.sendMessage(`⚠️ ʀᴀɴɢᴇ: 0-60 ꜱᴇᴄᴏɴᴅꜱ${timeFooter()}`, event.threadID);
        }
        
        db.groups[event.threadID].slowMode = sec;
        saveDB(db);
        
        api.sendMessage(
            `🐌 𝐒ʟᴏᴡ𝐌ᴏᴅᴇ: ${sec}ꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
${sec > 0 ? `⚠️ ᴍᴇᴍʙᴇʀꜱ ᴍᴜꜱᴛ ᴡᴀɪᴛ ${sec}ꜱ ʙᴇᴛᴡᴇᴇɴ ᴍᴇꜱꜱᴀɢᴇꜱ` : `✅ ꜱʟᴏᴡ ᴍᴏᴅᴇ ᴅɪꜱᴀʙʟᴇᴅ`}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🚫 BLACKLIST ====================
    blacklist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.blacklist[event.threadID]) db.blacklist[event.threadID] = [];
        
        const action = args[0]?.toLowerCase();
        const target = Object.keys(event.mentions || {})[0];
        
        if (action === "add" && target) {
            if (!db.blacklist[event.threadID].includes(target)) {
                db.blacklist[event.threadID].push(target);
                saveDB(db);
            }
            
            const name = event.mentions[target]?.replace('@', '') || target;
            api.sendMessage(
                `✅ 𝐀ᴅᴅᴇᴅ ᴛᴏ 𝐁ʟᴀᴄᴋʟɪꜱᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🆔 ${target}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } else if (action === "remove" && target) {
            db.blacklist[event.threadID] = db.blacklist[event.threadID].filter(id => id !== target);
            saveDB(db);
            api.sendMessage(`✅ ʀᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
        } else if (action === "list") {
            let msg = `🚫 𝐁ʟᴀᴄᴋʟɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            
            if (db.blacklist[event.threadID].length === 0) {
                msg += `✅ ɴᴏ ʙʟᴀᴄᴋʟɪꜱᴛᴇᴅ ᴜꜱᴇʀꜱ`;
            } else {
                for (const id of db.blacklist[event.threadID]) {
                    try {
                        const user = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? null : ret[id])));
                        msg += `👤 ${user ? user.name : "Unknown"}\n`;
                    } catch (e) {
                        msg += `🆔 ${id}\n`;
                    }
                }
            }
            
            msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${db.blacklist[event.threadID].length}${timeFooter()}`;
            api.sendMessage(msg, event.threadID);
        } else {
            api.sendMessage(
                `🚫 𝐁ʟᴀᴄᴋʟɪꜱᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
ᴜꜱᴀɢᴇ:
/blacklist add @ᴜꜱᴇʀ
/blacklist remove @ᴜꜱᴇʀ
/blacklist list
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }
    },

    // ==================== 🔒 LOCKALL ====================
    lockall: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        
        const isOn = args[0] === "on";
        
        db.security[event.threadID].lockAll = isOn;
        db.groups[event.threadID].lockName = isOn;
        db.groups[event.threadID].lockPhoto = isOn;
        db.groups[event.threadID].lockNick = isOn;
        db.groups[event.threadID].antiLink = isOn;
        db.groups[event.threadID].antiGali = isOn;
        db.groups[event.threadID].antiSticker = isOn;
        db.groups[event.threadID].antiGif = isOn;
        db.groups[event.threadID].antiPhone = isOn;
        
        saveDB(db);
        
        api.sendMessage(
            `🔒 𝐋ᴏᴄᴋ 𝐀ʟʟ: ${isOn ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
${isOn ? `✅ Lock Name\n✅ Lock Photo\n✅ Lock Nick\n✅ Anti Link\n✅ Anti Gali\n✅ Anti Sticker\n✅ Anti GIF\n✅ Anti Phone` : `🔓 All Unlocked`}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔓 UNLOCKALL ====================
    unlockall: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        
        db.security[event.threadID].lockAll = false;
        db.groups[event.threadID].lockName = false;
        db.groups[event.threadID].lockPhoto = false;
        db.groups[event.threadID].lockNick = false;
        db.groups[event.threadID].antiLink = false;
        db.groups[event.threadID].antiGali = false;
        db.groups[event.threadID].antiSticker = false;
        db.groups[event.threadID].antiGif = false;
        db.groups[event.threadID].antiPhone = false;
        
        saveDB(db);
        
        api.sendMessage(
            `🔓 𝐀ʟʟ 𝐔ɴʟᴏᴄᴋᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Lock Name: OFF
✅ Lock Photo: OFF
✅ Lock Nick: OFF
✅ Anti Link: OFF
✅ Anti Gali: OFF
✅ Anti Sticker: OFF
✅ Anti GIF: OFF
✅ Anti Phone: OFF
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    }

};