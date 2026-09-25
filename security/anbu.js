const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    sleep, SLOW_MODE 
} = require('../utils');

module.exports = {

    // ==================== 🔐 SECURITY MASTER ====================
    security: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};

        const isOn = args[0] === "on";

        db.security[event.threadID].antiBot = isOn;
        db.security[event.threadID].antiRaid = isOn;
        db.security[event.threadID].shield = isOn;
        db.security[event.threadID].antiSpam = isOn;
        db.security[event.threadID].guardian = isOn;
        db.security[event.threadID].capslock = isOn;
        db.security[event.threadID].antiDup = isOn;
        db.security[event.threadID].repeat = isOn;
        db.security[event.threadID].antiTag = isOn;
        db.security[event.threadID].autoKick = isOn;

        db.groups[event.threadID].lockName = isOn;
        db.groups[event.threadID].lockPhoto = isOn;
        db.groups[event.threadID].lockNick = isOn;
        db.groups[event.threadID].antiLink = isOn;
        db.groups[event.threadID].antiGali = isOn;
        db.groups[event.threadID].antiSticker = isOn;
        db.groups[event.threadID].antiGif = isOn;
        db.groups[event.threadID].antiPhone = isOn;

        if (isOn && !db.groups[event.threadID].lockedName) {
            try {
                const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
                if (info?.threadName) {
                    db.groups[event.threadID].lockedName = info.threadName;
                    db.groups[event.threadID].name = info.threadName;
                }
            } catch (e) {}
        }

        saveDB(db);

        const msg = `🔐 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒ᴇᴄᴜʀɪᴛʏ: ${isOn ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
${isOn ? "✅" : "❌"} Lock Name
${isOn ? "✅" : "❌"} Lock Photo
${isOn ? "✅" : "❌"} Lock Nick
${isOn ? "✅" : "❌"} Anti Link
${isOn ? "✅" : "❌"} Anti Gali
${isOn ? "✅" : "❌"} Anti Sticker
${isOn ? "✅" : "❌"} Anti GIF
${isOn ? "✅" : "❌"} Anti Phone
${isOn ? "✅" : "❌"} Anti Bot
${isOn ? "✅" : "❌"} Anti Raid
${isOn ? "✅" : "❌"} Shield
${isOn ? "✅" : "❌"} Anti Spam
${isOn ? "✅" : "❌"} Guardian
${isOn ? "✅" : "❌"} Capslock
${isOn ? "✅" : "❌"} Anti Dup
${isOn ? "✅" : "❌"} Anti Repeat
${isOn ? "✅" : "❌"} Anti Tag
${isOn ? "✅" : "❌"} Auto Kick
━━━━━━━━━━━━━━━━━━━━━━━━
${isOn ? "🔥 ᴀʟʟ 18 ᴘʀᴏᴛᴇᴄᴛɪᴏɴꜱ ᴀᴄᴛɪᴠᴇ" : "⚠️ ᴀʟʟ ᴘʀᴏᴛᴇᴄᴛɪᴏɴꜱ ᴏꜰꜰ"}${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    },

    // ==================== ⚔️ WAR MODE ====================
    war: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};

        const isOn = args[0] === "on";

        if (isOn) {
            // All protections
            db.security[event.threadID].antiBot = true;
            db.security[event.threadID].antiRaid = true;
            db.security[event.threadID].shield = true;
            db.security[event.threadID].allMute = true;
            db.security[event.threadID].onlyAdmin = true;
            db.security[event.threadID].botLock = true;
            db.security[event.threadID].antiSpam = true;
            db.security[event.threadID].guardian = true;
            db.security[event.threadID].capslock = true;
            db.security[event.threadID].antiDup = true;
            db.security[event.threadID].repeat = true;
            db.security[event.threadID].antiTag = true;
            db.security[event.threadID].autoKick = true;

            db.groups[event.threadID].lockName = true;
            db.groups[event.threadID].lockPhoto = true;
            db.groups[event.threadID].lockNick = true;
            db.groups[event.threadID].antiLink = true;
            db.groups[event.threadID].antiGali = true;
            db.groups[event.threadID].antiSticker = true;
            db.groups[event.threadID].antiGif = true;
            db.groups[event.threadID].antiPhone = true;
            db.groups[event.threadID].slowMode = 10;
        } else {
            for (const k in db.security[event.threadID]) db.security[event.threadID][k] = false;
            for (const k in db.groups[event.threadID]) {
                if (k.startsWith("lock") || k.startsWith("anti")) db.groups[event.threadID][k] = false;
            }
            db.groups[event.threadID].slowMode = 0;
        }

        saveDB(db);

        const msg = `⚔️ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐖𝐀𝐑 𝐌ᴏᴅᴇ: ${isOn ? "ON 🔥" : "OFF ✅"}
━━━━━━━━━━━━━━━━━━━━━━━━
${isOn ? `🔥 ᴜʟᴛʀᴀ ʙʀᴜᴛᴀʟ ᴍᴏᴅᴇ ᴀᴄᴛɪᴠᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ All 18 protections
🔍 Guardian active
🔇 All members muted
👑 Only admin mode
🔐 Bot locked
🐌 Slowmode 10s` : `✅ ɴᴏʀᴍᴀʟ ᴍᴏᴅᴇ ʀᴇꜱᴛᴏʀᴇᴅ`}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🚫 ANTISPAM ====================
    antispam: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiSpam = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`🚫 𝐀ɴᴛɪ-𝐒ᴘᴀᴍ: ${db.security[event.threadID].antiSpam ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 🌊 ANTIFLOOD ====================
    antiflood: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiFlood = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`🌊 𝐀ɴᴛɪ-𝐅ʟᴏᴏᴅ: ${db.security[event.threadID].antiFlood ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 🤖 ANTIBOT ====================
    antibot: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiBot = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`🤖 𝐀ɴᴛɪ-𝐁ᴏᴛ: ${db.security[event.threadID].antiBot ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 🛡️ ANTIRAID ====================
    antiraid: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiRaid = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`🛡️ 𝐀ɴᴛɪ-𝐑ᴀɪᴅ: ${db.security[event.threadID].antiRaid ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 🛡️ SHIELD ====================
    shield: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].shield = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`🛡️ 𝐒ʜɪᴇʟᴅ: ${db.security[event.threadID].shield ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 👑 ONLYADMIN ====================
    onlyadmin: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].onlyAdmin = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`👑 𝐎ɴʟʏ 𝐀ᴅᴍɪɴ: ${db.security[event.threadID].onlyAdmin ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 🔇 ALLMUTE ====================
    allmute: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].allMute = true;
        saveDB(db);
        
        api.sendMessage(`🔇 𝐀ʟʟ 𝐌ᴇᴍʙᴇʀꜱ 𝐌ᴜᴛᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== 🔊 ALLUNMUTE ====================
    allunmute: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].allMute = false;
        saveDB(db);
        
        api.sendMessage(`🔊 𝐀ʟʟ 𝐔ɴᴍᴜᴛᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== 🔒 BOTLOCK ====================
    botlock: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].botLock = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`🔐 𝐁ᴏᴛ 𝐋ᴏᴄᴋ: ${db.security[event.threadID].botLock ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ⛔ BOTOFF ====================
    botoff: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        const gid = args[0] || event.threadID;
        if (!db.security[gid]) db.security[gid] = {};
        db.security[gid].botOff = true;
        saveDB(db);
        
        api.sendMessage(`⛔ 𝐁ᴏᴛ 𝐎ꜰꜰ: ${gid}${timeFooter()}`, event.threadID);
    },

    // ==================== ✅ BOTON ====================
    boton: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        const gid = args[0] || event.threadID;
        if (!db.security[gid]) db.security[gid] = {};
        db.security[gid].botOff = false;
        saveDB(db);
        
        api.sendMessage(`✅ 𝐁ᴏᴛ 𝐎ɴ: ${gid}${timeFooter()}`, event.threadID);
    },

    // ==================== 📋 BOTLOCKLIST ====================
    botlocklist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        let msg = `🔐 𝐁ᴏᴛ 𝐋ᴏᴄᴋ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        let count = 0;
        for (const gid in db.security || {}) {
            if (db.security[gid].botLock) {
                count++;
                msg += `🔒 ${gid}\n`;
            }
        }
        
        if (count === 0) msg += `✅ ɴᴏ ʟᴏᴄᴋᴇᴅ ɢʀᴏᴜᴘꜱ`;
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${count}${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🛡️ ANTIBOTAUTO ====================
    antibotauto: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiBotAuto = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`🤖 𝐀ɴᴛɪ-𝐁ᴏᴛ 𝐀ᴜᴛᴏ: ${db.security[event.threadID].antiBotAuto ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== 🔍 BOTHUNT ====================
    bothunt: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const { scanBots } = require('../utils');
        
        api.sendMessage(`🔍 𝐒ᴄᴀɴɴɪɴɢ...${timeFooter()}`, event.threadID);
        
        await sleep(2000);
        
        try {
            const bots = await scanBots(api, event.threadID);
            
            let msg = `🤖 𝐁ᴏᴛ 𝐇ᴜɴᴛᴇʀ\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐅ᴏᴜɴᴅ: ${bots.length}\n\n`;
            
            for (const bot of bots) {
                msg += `⚠️ ${bot.name}\n🆔 ${bot.id}\n\n`;
            }
            
            if (bots.length === 0) msg += `✅ ɴᴏ ʙᴏᴛꜱ ᴅᴇᴛᴇᴄᴛᴇᴅ`;
            
            msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
            api.sendMessage(msg, event.threadID);
        } catch (e) {}
    },

    // ==================== 💀 BOTREMOVE ====================
    botremove: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /botremove @ʙᴏᴛ${timeFooter()}`, event.threadID);
        
        try {
            await new Promise(r => api.changeNickname("🚫 REMOVED", event.threadID, t, () => r()));
            await sleep(500);
            
            api.removeUserFromGroup(t, event.threadID, () => {
                api.sendMessage(
                    `✅ 𝐁ᴏᴛ 𝐑ᴇᴍᴏᴠᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
🔒 ᴛʜɪꜱ ɢʀᴏᴜᴘ ɪꜱ ᴘʀᴏᴛᴇᴄᴛᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                    event.threadID
                );
            });
        } catch (e) {}
    },

    // ==================== 🌸 SAYONARA ====================
    sayonara: async (api, event, args, config) => {
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /sayonara @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const name = event.mentions[t].replace('@', '');
        const msg = `🌸 ꜱᴀʏᴏɴᴀʀᴀ ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
💔 𝐆ᴏᴏᴅʙʏᴇ, ꜰʀɪᴇɴᴅ
🌙 ᴍᴀʏ ʏᴏᴜ ꜰɪɴᴅ ᴘᴇᴀᴄᴇ
⭐ ᴡᴇ ᴡɪʟʟ ɴᴇᴠᴇʀ ꜰᴏʀɢᴇᴛ ʏᴏᴜ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ`;
        
        await sendAdvancedGif(api, event, msg + timeFooter(), 'sayonara', [{ tag: name, id: t }]);
    },

    // ==================== 📊 STATUS ====================
    status: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const { healthCheck } = require('../utils');
        const health = healthCheck();
        const db = getDB();
        const totalGroups = Object.keys(db.groups || {}).length;
        
        api.sendMessage(
            `⚙️ 𝐒ʏꜱᴛᴇᴍ 𝐒ᴛᴀᴛᴜꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 𝐒ᴛᴀᴛᴜꜱ: ONLINE
⏱️ 𝐔ᴘᴛɪᴍᴇ: ${health.uptimeHuman}
💾 𝐌ᴇᴍᴏʀʏ: ${health.memoryUsed}MB
👥 𝐆ʀᴏᴜᴘꜱ: ${totalGroups}
🛡️ 𝐁ᴏᴛ 𝐀ᴅᴍɪɴꜱ: ${config.botAdmins?.length || 0}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🛠️ MAINTENANCE ====================
    maintenance: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.maintenance = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(`🔧 𝐌ᴀɪɴᴛᴇɴᴀɴᴄᴇ: ${db.settings.maintenance ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ✅ ACTIVE ====================
    active: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        api.sendMessage(`✅ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ ɪꜱ ᴀᴄᴛɪᴠᴇ ɪɴ ᴛʜɪꜱ ɢʀᴏᴜᴘ\n🆔 ${event.threadID}${timeFooter()}`, event.threadID);
    },

    // ==================== 🎁 WELCOME ====================
    welcome: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        if (args[0] === "set") {
            const msg = args.slice(1).join(" ");
            const db = getDB();
            if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
            db.groups[event.threadID].welcome = msg || "ᴡᴇʟᴄᴏᴍᴇ!";
            saveDB(db);
            
            api.sendMessage(`✅ 𝐖ᴇʟᴄᴏᴍᴇ 𝐒ᴇᴛ${timeFooter()}`, event.threadID);
        } else {
            api.sendMessage(`ᴜꜱᴀɢᴇ: /welcome ꜱᴇᴛ [ᴍᴇꜱꜱᴀɢᴇ]${timeFooter()}`, event.threadID);
        }
    },

    // ==================== 👋 GOODBYE ====================
    goodbye: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        if (args[0] === "set") {
            const msg = args.slice(1).join(" ");
            const db = getDB();
            if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
            db.groups[event.threadID].goodbye = msg || "ɢᴏᴏᴅʙʏᴇ!";
            saveDB(db);
            
            api.sendMessage(`✅ 𝐆ᴏᴏᴅʙʏᴇ 𝐒ᴇᴛ${timeFooter()}`, event.threadID);
        } else {
            api.sendMessage(`ᴜꜱᴀɢᴇ: /goodbye ꜱᴇᴛ [ᴍᴇꜱꜱᴀɢᴇ]${timeFooter()}`, event.threadID);
        }
    },

    // ==================== 🔔 NOTIFY ====================
    notify: async (api, event, args, config) => {
        const ownerList = getOwnerList(config);
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.lastNotifiedVersion = null;
        saveDB(db);
        
        api.sendMessage(`🔄 𝐍ᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ 𝐑ᴇꜱᴇᴛ${timeFooter()}`, event.threadID);
    },

    // ==================== 🧹 CLEARCACHE ====================
    clearcache: async (api, event, args, config) => {
        const ownerList = getOwnerList(config);
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        try {
            const db = getDB();
            const oldUsers = Object.keys(db.users || {}).length;
            const oldAFK = Object.keys(db.afk || {}).length;
            const oldWarnings = Object.keys(db.warnings || {}).length;
            
            db.users = {};
            db.afk = {};
            db.warnings = {};
            saveDB(db);
            
            api.sendMessage(
                `🧹 𝐂ᴀᴄʜᴇ 𝐂ʟᴇᴀʀᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👥 𝐔ꜱᴇʀꜱ: ${oldUsers} → 0
💤 𝐀ꜰᴋ: ${oldAFK} → 0
⚠️ 𝐖ᴀʀɴɪɴɢꜱ: ${oldWarnings} → 0
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } catch (e) {}
    },

    // ==================== 📢 BROADCAST ====================
    broadcast: async (api, event, args, config) => {
        const ownerList = getOwnerList(config);
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        const msg = args.join(" ");
        if (!msg) return api.sendMessage(`ᴜꜱᴀɢᴇ: /broadcast [ᴍᴇꜱꜱᴀɢᴇ]${timeFooter()}`, event.threadID);
        
        const db = getDB();
        const groupIDs = Object.keys(db.groups || {});
        
        if (groupIDs.length === 0) return api.sendMessage(`❌ ɴᴏ ɢʀᴏᴜᴘꜱ${timeFooter()}`, event.threadID);
        
        api.sendMessage(`📢 𝐁ʀᴏᴀᴅᴄᴀꜱᴛɪɴɢ ᴛᴏ ${groupIDs.length} ɢʀᴏᴜᴘꜱ...${timeFooter()}`, event.threadID);
        
        let sent = 0, failed = 0;
        for (const gid of groupIDs) {
            try {
                await new Promise(r => api.sendMessage(msg, gid, () => r()));
                sent++;
                await sleep(SLOW_MODE.broadcastDelay);
            } catch (e) { failed++; }
        }
        
        api.sendMessage(`✅ 𝐒ᴇɴᴛ: ${sent}/${groupIDs.length}\n❌ 𝐅ᴀɪʟᴇᴅ: ${failed}${timeFooter()}`, event.threadID);
    },

    // ==================== 📋 GROUPLIST ====================
    grouplist: async (api, event, args, config) => {
        const ownerList = getOwnerList(config);
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        const db = getDB();
        const groupIDs = Object.keys(db.groups || {});
        
        let msg = `📋 𝐆ʀᴏᴜᴘ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${groupIDs.length}\n\n`;
        
        for (const gid of groupIDs) {
            const name = db.groups[gid].name || "Unknown";
            msg += `📍 ${name}\n🆔 ${gid}\n\n`;
        }
        
        if (groupIDs.length === 0) msg += `✅ ɴᴏ ɢʀᴏᴜᴘꜱ ᴛʀᴀᴄᴋᴇᴅ`;
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 👑 ADDOWNER ====================
    addowner: async (api, event, args, config) => {
        const { getOwnerList } = require('../utils');
        const ownerList = getOwnerList(config);
        
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /addowner @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        if (ownerList.includes(t)) return api.sendMessage(`⚠️ ᴀʟʀᴇᴀᴅʏ ᴀɴ ᴏᴡɴᴇʀ${timeFooter()}`, event.threadID);
        
        try {
            const fs = require('fs');
            const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
            
            if (!Array.isArray(newConfig.owner)) {
                newConfig.owner = newConfig.owner.split(",").map(id => id.trim()).filter(id => id);
            }
            
            newConfig.owner.push(t);
            fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
            
            if (!Array.isArray(config.owner)) {
                config.owner = config.owner.split(",").map(id => id.trim()).filter(id => id);
            }
            config.owner.push(t);
            
            const name = event.mentions[t]?.replace('@', '') || t;
            
            api.sendMessage(
                `👑 𝐍ᴇᴡ 𝐎ᴡɴᴇʀ 𝐀ᴅᴅᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🆔 ${t}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } catch (e) {
            api.sendMessage(`❌ 𝐅ᴀɪʟᴇᴅ: ${e.message}${timeFooter()}`, event.threadID);
        }
    },

    // ==================== 🗑️ REMOVEOWNER ====================
    removeowner: async (api, event, args, config) => {
        const { getOwnerList } = require('../utils');
        const ownerList = getOwnerList(config);
        
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /removeowner @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        if (t === event.senderID) return api.sendMessage(`⚠️ ʏᴏᴜ ᴄᴀɴ'ᴛ ʀᴇᴍᴏᴠᴇ ʏᴏᴜʀꜱᴇʟꜰ${timeFooter()}`, event.threadID);
        if (!ownerList.includes(t)) return api.sendMessage(`⚠️ ɴᴏᴛ ᴀɴ ᴏᴡɴᴇʀ${timeFooter()}`, event.threadID);
        
        try {
            const fs = require('fs');
            const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
            
            if (!Array.isArray(newConfig.owner)) {
                newConfig.owner = newConfig.owner.split(",").map(id => id.trim()).filter(id => id);
            }
            
            newConfig.owner = newConfig.owner.filter(id => id !== t);
            fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
            
            if (!Array.isArray(config.owner)) {
                config.owner = config.owner.split(",").map(id => id.trim()).filter(id => id);
            }
            config.owner = config.owner.filter(id => id !== t);
            
            api.sendMessage(`✅ 𝐎ᴡɴᴇʀ 𝐑ᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
        } catch (e) {}
    },

    // ==================== 📋 OWNERLIST ====================
    ownerlist: async (api, event, args, config) => {
        const { getOwnerList } = require('../utils');
        const ownerList = getOwnerList(config);
        
        let msg = `👑 𝐎ᴡɴᴇʀ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${ownerList.length}\n\n`;
        
        for (let i = 0; i < ownerList.length; i++) {
            try {
                const user = await new Promise(r => api.getUserInfo(ownerList[i], (e, ret) => r(e ? null : ret[ownerList[i]])));
                msg += `${i + 1}. 👑 ${user ? user.name : "Unknown"}\n   🆔 ${ownerList[i]}\n`;
            } catch (e) {
                msg += `${i + 1}. 🆔 ${ownerList[i]}\n`;
            }
        }
        
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 👑 ADDADMIN ====================
    addadmin: async (api, event, args, config) => {
        const { getOwnerList, getAdminList } = require('../utils');
        const ownerList = getOwnerList(config);
        
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /addadmin @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const adminList = getAdminList(config);
        if (adminList.includes(t)) return api.sendMessage(`⚠️ ᴀʟʀᴇᴀᴅʏ ᴀɴ ᴀᴅᴍɪɴ${timeFooter()}`, event.threadID);
        
        try {
            const fs = require('fs');
            const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
            
            if (!Array.isArray(newConfig.botAdmins)) {
                newConfig.botAdmins = newConfig.botAdmins.split(",").map(id => id.trim()).filter(id => id);
            }
            
            newConfig.botAdmins.push(t);
            fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
            
            if (!Array.isArray(config.botAdmins)) {
                config.botAdmins = config.botAdmins.split(",").map(id => id.trim()).filter(id => id);
            }
            config.botAdmins.push(t);
            
            const name = event.mentions[t]?.replace('@', '') || t;
            
            api.sendMessage(
                `🛡️ 𝐍ᴇᴡ 𝐁ᴏᴛ 𝐀ᴅᴍɪɴ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🆔 ${t}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } catch (e) {}
    },

    // ==================== 🗑️ REMOVEADMIN ====================
    removeadmin: async (api, event, args, config) => {
        const { getOwnerList, getAdminList } = require('../utils');
        const ownerList = getOwnerList(config);
        
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /removeadmin @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        try {
            const fs = require('fs');
            const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
            
            if (!Array.isArray(newConfig.botAdmins)) {
                newConfig.botAdmins = newConfig.botAdmins.split(",").map(id => id.trim()).filter(id => id);
            }
            
            newConfig.botAdmins = newConfig.botAdmins.filter(id => id !== t);
            fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
            
            if (!Array.isArray(config.botAdmins)) {
                config.botAdmins = config.botAdmins.split(",").map(id => id.trim()).filter(id => id);
            }
            config.botAdmins = config.botAdmins.filter(id => id !== t);
            
            api.sendMessage(`✅ 𝐀ᴅᴍɪɴ 𝐑ᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
        } catch (e) {}
    },

    // ==================== 📋 ADMINLISTALL ====================
    adminlistall: async (api, event, args, config) => {
        const { getAdminList } = require('../utils');
        const adminList = getAdminList(config);
        
        let msg = `🛡️ 𝐁ᴏᴛ 𝐀ᴅᴍɪɴ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${adminList.length}\n\n`;
        
        for (let i = 0; i < adminList.length; i++) {
            try {
                const user = await new Promise(r => api.getUserInfo(adminList[i], (e, ret) => r(e ? null : ret[adminList[i]])));
                msg += `${i + 1}. 🛡️ ${user ? user.name : "Unknown"}\n   🆔 ${adminList[i]}\n`;
            } catch (e) {
                msg += `${i + 1}. 🆔 ${adminList[i]}\n`;
            }
        }
        
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🔄 RESTART ====================
    restart: async (api, event, args, config) => {
        const { getOwnerList } = require('../utils');
        const ownerList = getOwnerList(config);
        
        if (!ownerList.includes(event.senderID)) return permissionDenied(api, event, "owner");
        
        api.sendMessage(
            `🔄 𝐑ᴇꜱᴛᴀʀᴛɪɴɢ...
━━━━━━━━━━━━━━━━━━━━━━━━
⏳ 𝐏ʟᴇᴀꜱᴇ ᴡᴀɪᴛ...
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID,
            () => setTimeout(() => process.exit(0), 2000)
        );
    },

    // ==================== ⚡ NOTIFY (Old) ====================
    // Already exists above

};