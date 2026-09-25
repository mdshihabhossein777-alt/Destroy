const fs = require('fs');
const { 
    getDB, saveDB, timeFooter, getOwnerList, 
    sleep, SLOW_MODE, sendAdvancedGif 
} = require('../utils');

function isSudo(event, config) {
    const ownerList = getOwnerList(config);
    return ownerList.includes(String(event.senderID).trim());
}

function sudoDenied(api, event) {
    api.sendMessage(
        `🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸
       ⛔ 𝐀ᴄᴄᴇꜱꜱ 𝐃ᴇɴɪᴇᴅ
🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸

👑 𝐎ᴡɴᴇʀ 𝐎ɴʟʏ 𝐂ᴏᴍᴍᴀɴᴅ!

🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
        event.threadID
    );
}

module.exports = {

    // ==================== 🚪 BOTOUT ====================
    botout: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        api.sendMessage(
            `👋 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐋ᴇᴀᴠɪɴɢ...
━━━━━━━━━━━━━━━━━━━━━━━━
🚪 𝐁ᴏᴛ ᴡɪʟʟ ᴇxɪᴛ ɪɴ 3 ꜱᴇᴄᴏɴᴅꜱ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID,
            () => setTimeout(() => api.removeUserFromGroup(api.getCurrentUserID(), event.threadID), 3000)
        );
    },

    // ==================== 👢 MASSKICK ====================
    masskick: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const mentions = Object.keys(event.mentions || {});
        if (mentions.length === 0) {
            return api.sendMessage(
                `💀 𝐌ᴀꜱꜱ 𝐊ɪᴄᴋ\n━━━━━━━━━━━━━━━━━━━━━━━━\nᴜꜱᴀɢᴇ: /masskick @ᴜꜱᴇʀ1 @ᴜꜱᴇʀ2 ...\n\n⚠️ ᴍᴀx 10 ᴜꜱᴇʀꜱ${timeFooter()}`,
                event.threadID
            );
        }

        api.sendMessage(`💀 𝐌ᴀꜱꜱ 𝐊ɪᴄᴋ ɪɴɪᴛɪᴀᴛᴇᴅ...${timeFooter()}`, event.threadID);

        let kicked = 0, failed = 0;
        for (const uid of mentions.slice(0, 10)) {
            try {
                await new Promise(r => api.removeUserFromGroup(uid, event.threadID, () => r()));
                kicked++;
                await sleep(1500);
            } catch (e) { failed++; }
        }

        api.sendMessage(`✅ 𝐊ɪᴄᴋᴇᴅ: ${kicked}\n❌ 𝐅ᴀɪʟᴇᴅ: ${failed}${timeFooter()}`, event.threadID);
    },

    // ==================== 🏷️ MASSNICK ====================
    massnick: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const nick = args.join(" ").trim();
        if (!nick) return api.sendMessage(`ᴜꜱᴀɢᴇ: /massnick [ɴᴀᴍᴇ]${timeFooter()}`, event.threadID);

        const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
        if (!info) return;

        api.sendMessage(`⏳ 𝐂ʜᴀɴɢɪɴɢ ${info.participantIDs.length} ɴɪᴄᴋꜱ...${timeFooter()}`, event.threadID);

        let ok = 0, fail = 0;
        const botID = api.getCurrentUserID();
        for (const id of info.participantIDs) {
            if (id === botID) continue;
            await new Promise(resolve => {
                api.changeNickname(nick, event.threadID, id, (err) => {
                    if (err) fail++; else ok++;
                    setTimeout(resolve, 500);
                });
            });
        }

        api.sendMessage(`✅ 𝐎ᴋ: ${ok}\n❌ 𝐅ᴀɪʟ: ${fail}${timeFooter()}`, event.threadID);
    },

    // ==================== 💥 NUKE ====================
    nuke: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        const tid = event.threadID;
        if (!db.security[tid]) db.security[tid] = {};
        if (!db.groups[tid]) db.groups[tid] = {};

        db.security[tid].allMute = true;
        db.security[tid].onlyAdmin = true;
        db.security[tid].lockAll = true;
        db.security[tid].antiBot = true;
        db.security[tid].antiRaid = true;
        db.security[tid].shield = true;
        db.security[tid].guardian = true;

        db.groups[tid].lockName = true;
        db.groups[tid].lockPhoto = true;
        db.groups[tid].lockNick = true;
        db.groups[tid].antiLink = true;
        db.groups[tid].antiGali = true;
        db.groups[tid].antiSticker = true;
        db.groups[tid].antiGif = true;
        db.groups[tid].antiPhone = true;
        db.groups[tid].slowMode = 5;

        saveDB(db);

        api.sendMessage(
            `💥 𝐍𝐔𝐊𝐄 𝐄xᴇᴄᴜᴛᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Lock Name
🔒 Lock Photo
🔒 Lock Nick
🔇 All Mute
👑 Only Admin
🔗 Anti Link
🤬 Anti Gali
🎨 Anti Sticker
🎬 Anti GIF
📱 Anti Phone
🤖 Anti Bot
🛡️ Anti Raid
🛡️ Shield
👁️ Guardian
🐌 Slow Mode: 5s
━━━━━━━━━━━━━━━━━━━━━━━━
⛔ 𝐆ʀᴏᴜᴘ ɴᴜᴄʟᴇᴀʀ ᴇxᴇᴄᴜᴛᴇᴅ
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            tid
        );
    },

    // ==================== 👑 CLEANADMIN ====================
    cleanadmin: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;

            const botID = api.getCurrentUserID();
            const toRemove = info.adminIDs.filter(a => a.id !== botID && a.id !== event.senderID);

            if (toRemove.length === 0) {
                return api.sendMessage(`ℹ️ 𝐍ᴏ ᴀᴅᴍɪɴꜱ ᴛᴏ ʀᴇᴍᴏᴠᴇ${timeFooter()}`, event.threadID);
            }

            api.sendMessage(`⏳ 𝐑ᴇᴍᴏᴠɪɴɢ ${toRemove.length} ᴀᴅᴍɪɴꜱ...${timeFooter()}`, event.threadID);

            let removed = 0;
            for (const admin of toRemove) {
                try {
                    await new Promise(r => api.changeAdminStatus(event.threadID, admin.id, false, () => r()));
                    removed++;
                    await sleep(1500);
                } catch (e) {}
            }

            api.sendMessage(
                `👑 𝐂ʟᴇᴀɴ 𝐀ᴅᴍɪɴ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ 𝐑ᴇᴍᴏᴠᴇᴅ: ${removed}/${toRemove.length}
👑 𝐎ɴʟʏ 𝐎ᴡɴᴇʀ ʀᴇᴍᴀɪɴꜱ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } catch (e) {}
    },

    // ==================== 🔄 GROUPRESET ====================
    groupreset: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        const tid = event.threadID;

        api.sendMessage(`⏳ 𝐑ᴇꜱᴇᴛᴛɪɴɢ ɢʀᴏᴜᴘ...${timeFooter()}`, tid);

        try {
            const newName = config.groupName || "SAYONARA NO MERCY - さよなら";
            
            await new Promise(r => api.setTitle(newName, tid, () => r()));
            await sleep(1500);

            if (db.groups[tid]) {
                db.groups[tid].lockName = false;
                db.groups[tid].lockPhoto = false;
                db.groups[tid].lockNick = false;
                db.groups[tid].name = newName;
                db.groups[tid].lockedName = newName;
            }
            saveDB(db);

            const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
            let nicksReset = 0;
            const botID = api.getCurrentUserID();

            if (info && info.participantIDs) {
                for (const id of info.participantIDs) {
                    if (id === botID) continue;
                    await new Promise(resolve => {
                        api.changeNickname("", tid, id, () => {
                            nicksReset++;
                            setTimeout(resolve, 400);
                        });
                    });
                }
            }

            api.sendMessage(
                `🔄 𝐆ʀᴏᴜᴘ 𝐑ᴇꜱᴇᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ 𝐍ᴀᴍᴇ: ${newName}
✅ 𝐏ʜᴏᴛᴏ 𝐔ɴʟᴏᴄᴋᴇᴅ
✅ ${nicksReset} 𝐍ɪᴄᴋꜱ 𝐑ᴇꜱᴇᴛ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                tid
            );
        } catch (e) {
            api.sendMessage(`❌ 𝐑ᴇꜱᴇᴛ ꜰᴀɪʟᴇᴅ: ${e.message}${timeFooter()}`, tid);
        }
    },

    // ==================== 👻 GHOSTKICK ====================
    ghostkick: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /ghostkick @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);

        api.sendMessage(`👻 𝐆ʜᴏꜱᴛ 𝐊ɪᴄᴋ ɪɴɪᴛɪᴀᴛᴇᴅ...${timeFooter()}`, event.threadID);
        await sleep(1000);

        for (let i = 0; i < 3; i++) {
            await new Promise(r => api.removeUserFromGroup(t, event.threadID, () => r()));
            await sleep(800);
        }

        api.sendMessage(`💀 𝐆ʜᴏꜱᴛ 𝐊ɪᴄᴋ ᴄᴏᴍᴘʟᴇᴛᴇᴅ!${timeFooter()}`, event.threadID);
    },

    // ==================== ⚔️ NICKWAR ====================
    nickwar: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /nickwar @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);

        const name = event.mentions[t].replace('@', '');
        const nicknames = ["💀 SAYONARA", "💀 KILLED", "💀 DESTROYED", "💀 NO MERCY", "💀 GONE"];

        api.sendMessage(`⚔️ 𝐍ɪᴄᴋ 𝐖ᴀʀ ꜱᴛᴀʀᴛᴇᴅ ᴀɢᴀɪɴꜱᴛ ${name}...${timeFooter()}`, event.threadID);

        for (let i = 0; i < 5; i++) {
            await new Promise(r => api.changeNickname(nicknames[i % nicknames.length], event.threadID, t, () => r()));
            await sleep(1000);
        }

        api.sendMessage(`💀 𝐍ɪᴄᴋ 𝐖ᴀʀ ᴄᴏᴍᴘʟᴇᴛᴇᴅ!${timeFooter()}`, event.threadID);
    },

    // ==================== ⚠️ WARNKILL ====================
    warnkill: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].warnKill = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `⚠️ 𝐖ᴀʀɴ 𝐊ɪʟʟ: ${db.security[event.threadID].warnKill ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔄 AUTOREJOIN ====================
    autorejoin: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.autoRejoin = args[0] === "on";
        saveDB(db);

        api.sendMessage(`🔄 𝐀ᴜᴛᴏ 𝐑ᴇᴊᴏɪɴ: ${db.settings.autoRejoin ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 💀 ANTIDEAD ====================
    antidead: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.antiDead = args[0] === "on";
        saveDB(db);

        api.sendMessage(`💀 𝐀ɴᴛɪ-𝐃ᴇᴀᴅ: ${db.settings.antiDead ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 🛡️ SHIELDMAX ====================
    shieldmax: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].shieldMax = args[0] === "on";
        saveDB(db);

        api.sendMessage(`🛡️ 𝐒ʜɪᴇʟᴅ 𝐌ᴀx: ${db.security[event.threadID].shieldMax ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 👻 SELFHIDE ====================
    selfhide: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.selfHide = args[0] === "on";
        saveDB(db);

        api.sendMessage(`👻 𝐒ᴇʟꜰ 𝐇ɪᴅᴇ: ${db.settings.selfHide ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 🧹 CLEAN ====================
    clean: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        try {
            const db = getDB();
            const oldUsers = Object.keys(db.users || {}).length;
            const oldAFK = Object.keys(db.afk || {}).length;

            db.users = {};
            db.afk = {};
            saveDB(db);

            api.sendMessage(
                `🧹 𝐂ᴀᴄʜᴇ 𝐂ʟᴇᴀɴᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👥 𝐔ꜱᴇʀꜱ: ${oldUsers} → 0
💤 𝐀ꜰᴋ: ${oldAFK} → 0
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } catch (e) {}
    },

    // ==================== ⏱️ COOLDOWN ====================
    cooldown: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const seconds = parseInt(args[0]) || 5;
        if (seconds < 1 || seconds > 60) {
            return api.sendMessage(`⚠️ ʀᴀɴɢᴇ: 1-60${timeFooter()}`, event.threadID);
        }
        
        SLOW_MODE.commandDelay = seconds * 1000;
        
        api.sendMessage(`⏱️ 𝐂ᴏᴏʟᴅᴏᴡɴ: ${seconds}ꜱ${timeFooter()}`, event.threadID);
    },

    // ==================== 💀 SELFKILL ====================
    selfkill: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.selfKill = args[0] === "on";
        saveDB(db);

        api.sendMessage(`💀 𝐒ᴇʟꜰ 𝐊ɪʟʟ: ${db.settings.selfKill ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    }

};