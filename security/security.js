const fs = require('fs');
const { getDB, saveDB, timeFooter, hasPermission, permissionDenied, isBot, sleep, SLOW_MODE } = require('../utils');

module.exports = {

    // ==================== SECURITY MASTER ====================
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

        const msg = `🔐 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱᴇᴄᴜʀɪᴛʏ ${isOn ? "ON ✅" : "OFF ❌"}
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
${isOn ? "✅" : "❌"} Auto Kick
━━━━━━━━━━━━━━━━━━━━━━━━
${isOn ? "🔥 ᴀʟʟ 13 ᴘʀᴏᴛᴇᴄᴛɪᴏɴꜱ ᴀᴄᴛɪᴠᴇ" : "⚠️ ᴀʟʟ ᴘʀᴏᴛᴇᴄᴛɪᴏɴꜱ ᴏꜰꜰ"}${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    },

    // ==================== WAR MASTER ====================
    war: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};

        const isOn = args[0] === "on";

        if (isOn) {
            db.security[event.threadID].antiBot = true;
            db.security[event.threadID].antiRaid = true;
            db.security[event.threadID].shield = true;
            db.security[event.threadID].allMute = true;
            db.security[event.threadID].onlyAdmin = true;
            db.security[event.threadID].botLock = true;
            db.security[event.threadID].antiSpam = true;
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

            if (!db.groups[event.threadID].lockedName) {
                try {
                    const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
                    if (info?.threadName) {
                        db.groups[event.threadID].lockedName = info.threadName;
                        db.groups[event.threadID].name = info.threadName;
                    }
                } catch (e) {}
            }
        } else {
            for (const k in db.security[event.threadID]) db.security[event.threadID][k] = false;
            db.groups[event.threadID].lockName = false;
            db.groups[event.threadID].lockPhoto = false;
            db.groups[event.threadID].lockNick = false;
            db.groups[event.threadID].antiLink = false;
            db.groups[event.threadID].antiGali = false;
            db.groups[event.threadID].antiSticker = false;
            db.groups[event.threadID].antiGif = false;
            db.groups[event.threadID].antiPhone = false;
            db.groups[event.threadID].slowMode = 0;
        }

        saveDB(db);

        const msg = `⚔️ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴡᴀʀ ᴍᴏᴅᴇ ${isOn ? "ON 🔥" : "OFF ✅"}
━━━━━━━━━━━━━━━━━━━━━━━━
${isOn ? `🔥 ᴜʟᴛʀᴀ ʙʀᴜᴛᴀʟ ᴍᴏᴅᴇ ᴀᴄᴛɪᴠᴇ` : `✅ ɴᴏʀᴍᴀʟ ᴍᴏᴅᴇ ʀᴇꜱᴛᴏʀᴇᴅ`}${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    },

    // ==================== ANTI-BOT ====================
    antibot: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiBot = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🤖 ᴀɴᴛɪ-ʙᴏᴛ: ${db.security[event.threadID].antiBot ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== BOT-SCAN ====================
    botscan: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        api.sendMessage(`🔍 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱᴄᴀɴɴɪɴɢ ꜰᴏʀ ʙᴏᴛꜱ...${timeFooter()}`, event.threadID);
        
        setTimeout(async () => {
            try {
                const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
                if (!info) return api.sendMessage("❌ Scan failed" + timeFooter(), event.threadID);
                let bots = [];
                for (const id of info.participantIDs) {
                    if (id === api.getCurrentUserID()) continue;
                    try {
                        const u = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? null : ret[id])));
                        if (u && isBot(u.name)) bots.push({ id, name: u.name });
                    } catch (e) {}
                }
                let msg = `🤖 ʙᴏᴛ ꜱᴄᴀɴ ʀᴇᴘᴏʀᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                msg += `📊 ᴛᴏᴛᴀʟ: ${info.participantIDs.length}\n`;
                msg += `🤖 ʙᴏᴛꜱ: ${bots.length}\n\n`;
                for (const b of bots) msg += `⚠️ ${b.name}\n🆔 ${b.id}\n\n`;
                if (bots.length === 0) msg += `✅ ɴᴏ ʙᴏᴛꜱ ᴅᴇᴛᴇᴄᴛᴇᴅ`;
                api.sendMessage(msg + timeFooter(), event.threadID);
            } catch (e) {}
        }, SLOW_MODE.botScanDelay);
    },

    // ==================== BOT-KILL ====================
    botkill: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /botkill @ʙᴏᴛ" + timeFooter(), event.threadID);
        api.removeUserFromGroup(t, event.threadID, (err) => {
            api.sendMessage(err ? "❌ ꜰᴀɪʟ" + timeFooter() : "💀 ʙᴏᴛ ᴋɪʟʟᴇᴅ" + timeFooter(), event.threadID);
        });
    },

    // ==================== ANTI-RAID ====================
    antiraid: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiRaid = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🛡️ ᴀɴᴛɪ-ʀᴀɪᴅ: ${db.security[event.threadID].antiRaid ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ALLMUTE ====================
    allmute: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].allMute = true;
        saveDB(db);
        api.sendMessage(`🔇 ᴀʟʟ ᴍᴇᴍʙᴇʀꜱ ᴍᴜᴛᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== ALLUNMUTE ====================
    allunmute: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].allMute = false;
        saveDB(db);
        api.sendMessage(`🔊 ᴀʟʟ ᴜɴᴍᴜᴛᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== LOCKALL ====================
    lockall: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].lockAll = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔒 ʟᴏᴄᴋ ᴀʟʟ: ${db.security[event.threadID].lockAll ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== UNLOCKALL ====================
    unlockall: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].lockAll = false;
        saveDB(db);
        api.sendMessage(`🔓 ᴀʟʟ ᴜɴʟᴏᴄᴋᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== SHIELD ====================
    shield: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].shield = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🛡️ ꜱʜɪᴇʟᴅ: ${db.security[event.threadID].shield ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ONLYADMIN ====================
    onlyadmin: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].onlyAdmin = args[0] === "on";
        saveDB(db);
        api.sendMessage(`👑 ᴏɴʟʏ ᴀᴅᴍɪɴ: ${db.security[event.threadID].onlyAdmin ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ONLYMOD ====================
    onlymod: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].onlyMod = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🎭 ᴏɴʟʏ ᴍᴏᴅ: ${db.security[event.threadID].onlyMod ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== BOTLOCK ====================
    botlock: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].botLock = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔐 ʙᴏᴛ ʟᴏᴄᴋ: ${db.security[event.threadID].botLock ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== BOTOFF ====================
    botoff: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        const gid = args[0] || event.threadID;
        if (!db.security[gid]) db.security[gid] = {};
        db.security[gid].botOff = true;
        saveDB(db);
        api.sendMessage(`⛔ ʙᴏᴛ ᴏꜰꜰ: ${gid}${timeFooter()}`, event.threadID);
    },

    // ==================== BOTON ====================
    boton: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        const gid = args[0] || event.threadID;
        if (!db.security[gid]) db.security[gid] = {};
        db.security[gid].botOff = false;
        saveDB(db);
        api.sendMessage(`✅ ʙᴏᴛ ᴏɴ: ${gid}${timeFooter()}`, event.threadID);
    },

    // ==================== BOTLOCKLIST ====================
    botlocklist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        let msg = `🔐 ʙᴏᴛ ʟᴏᴄᴋ ʟɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        let count = 0;
        for (const gid in db.security || {}) {
            if (db.security[gid].botLock) { count++; msg += `🔒 ${gid}\n`; }
        }
        if (count === 0) msg += `ɴᴏ ʟᴏᴄᴋᴇᴅ ɢʀᴏᴜᴘꜱ`;
        api.sendMessage(msg + timeFooter(), event.threadID);
    },

    // ==================== ADD-ADMIN ====================
    addadmin: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /addadmin @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        try {
            const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
            if (!newConfig.botAdmins) newConfig.botAdmins = [];
            if (newConfig.botAdmins.includes(t)) return api.sendMessage("ᴀʟʀᴇᴀᴅʏ ᴀᴅᴍɪɴ" + timeFooter(), event.threadID);
            newConfig.botAdmins.push(t);
            fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
            if (!config.botAdmins) config.botAdmins = [];
            config.botAdmins.push(t);
            const name = event.mentions[t].replace('@', '');
            api.sendMessage(`✅ ${name} ɪꜱ ɴᴏᴡ ʙᴏᴛ ᴀᴅᴍɪɴ${timeFooter()}`, event.threadID);
        } catch (e) {
            api.sendMessage("❌ ꜰᴀɪʟᴇᴅ: " + e.message + timeFooter(), event.threadID);
        }
    },

    // ==================== REMOVE-ADMIN ====================
    removeadmin: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /removeadmin @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        try {
            const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
            if (!newConfig.botAdmins) newConfig.botAdmins = [];
            newConfig.botAdmins = newConfig.botAdmins.filter(id => id !== t);
            fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
            if (config.botAdmins) config.botAdmins = config.botAdmins.filter(id => id !== t);
            api.sendMessage(`✅ ʙᴏᴛ ᴀᴅᴍɪɴ ʀᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
        } catch (e) {
            api.sendMessage("❌ ꜰᴀɪʟᴇᴅ: " + e.message + timeFooter(), event.threadID);
        }
    },

    // ==================== RESTART ====================
    restart: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        api.sendMessage(`🔄 ʀᴇꜱᴛᴀʀᴛɪɴɢ...${timeFooter()}`, event.threadID, () => {
            setTimeout(() => process.exit(0), 2000);
        });
    },

    // ==================== MAINTENANCE ====================
    maintenance: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.maintenance = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔧 ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ: ${db.settings.maintenance ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== STATUS ====================
    status: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60);
        const db = getDB();
        const totalGroups = Object.keys(db.groups || {}).length;
        const msg = `⚙️ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ ꜱᴛᴀᴛᴜꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 ꜱᴛᴀᴛᴜꜱ: ONLINE
⏱️ ᴜᴘᴛɪᴍᴇ: ${h}ʜ ${m}ᴍ
📦 ᴄᴏᴍᴍᴀɴᴅꜱ: ${Object.keys(require('../commands/public') || {}).length + Object.keys(require('../commands/admin') || {}).length}
👥 ɢʀᴏᴜᴘꜱ: ${totalGroups}
🛡️ ʙᴏᴛ ᴀᴅᴍɪɴꜱ: ${config.botAdmins?.length || 0}
💀 ᴠᴇʀꜱɪᴏɴ: ${config.version}${timeFooter()}`;
        api.sendMessage(msg, event.threadID);
    },

    // ==================== ACTIVE ====================
    active: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        api.sendMessage(`✅ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ɪꜱ ᴀᴄᴛɪᴠᴇ ɪɴ ᴛʜɪꜱ ɢʀᴏᴜᴘ\n🆔 ${event.threadID}${timeFooter()}`, event.threadID);
    },

    // ==================== TOP-IGNORE ====================
    topignore: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        const t = Object.keys(event.mentions || {})[0];
        if (!db.groups[event.threadID].ignored) db.groups[event.threadID].ignored = [];
        if (t && !db.groups[event.threadID].ignored.includes(t)) {
            db.groups[event.threadID].ignored.push(t);
            saveDB(db);
            api.sendMessage("✅ ᴜꜱᴇʀ ɪɢɴᴏʀᴇᴅ" + timeFooter(), event.threadID);
        } else {
            api.sendMessage("ᴜꜱᴀɢᴇ: /topignore @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        }
    },

    // ==================== WELCOME SET ====================
    welcome: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        if (args[0] === "set") {
            const msg = args.slice(1).join(" ");
            const db = getDB();
            if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
            db.groups[event.threadID].welcome = msg || "ᴡᴇʟᴄᴏᴍᴇ!";
            saveDB(db);
            api.sendMessage("✅ ᴡᴇʟᴄᴏᴍᴇ ꜱᴇᴛ" + timeFooter(), event.threadID);
        } else {
            api.sendMessage("ᴜꜱᴀɢᴇ: /welcome ꜱᴇᴛ [ᴍᴇꜱꜱᴀɢᴇ]" + timeFooter(), event.threadID);
        }
    },

    // ==================== GOODBYE SET ====================
    goodbye: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        if (args[0] === "set") {
            const msg = args.slice(1).join(" ");
            const db = getDB();
            if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
            db.groups[event.threadID].goodbye = msg || "ɢᴏᴏᴅʙʏᴇ!";
            saveDB(db);
            api.sendMessage("✅ ɢᴏᴏᴅʙʏᴇ ꜱᴇᴛ" + timeFooter(), event.threadID);
        } else {
            api.sendMessage("ᴜꜱᴀɢᴇ: /goodbye ꜱᴇᴛ [ᴍᴇꜱꜱᴀɢᴇ]" + timeFooter(), event.threadID);
        }
    },

    // ==================== NOTIFY RESET ====================
    notify: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.lastNotifiedVersion = null;
        saveDB(db);
        api.sendMessage(`🔄 ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ ʀᴇꜱᴇᴛ${timeFooter()}`, event.threadID);
    },

    // ==================== BROADCAST ====================
    broadcast: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const msg = args.join(" ");
        if (!msg) return api.sendMessage("ᴜꜱᴀɢᴇ: /broadcast [ᴍᴇꜱꜱᴀɢᴇ]" + timeFooter(), event.threadID);
        const db = getDB();
        const groupIDs = Object.keys(db.groups || {});
        if (groupIDs.length === 0) return api.sendMessage("ɴᴏ ɢʀᴏᴜᴘꜱ" + timeFooter(), event.threadID);
        api.sendMessage(`📢 ʙʀᴏᴀᴅᴄᴀꜱᴛɪɴɢ ᴛᴏ ${groupIDs.length} ɢʀᴏᴜᴘꜱ...${timeFooter()}`, event.threadID);
        let sent = 0;
        for (const gid of groupIDs) {
            try {
                await new Promise(r => api.sendMessage(`📢 ʙʀᴏᴀᴅᴄᴀꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n${msg}${timeFooter()}`, gid, () => r()));
                sent++;
                await sleep(SLOW_MODE.broadcastDelay);
            } catch (e) {}
        }
        api.sendMessage(`✅ ꜱᴇɴᴛ ᴛᴏ ${sent}/${groupIDs.length}${timeFooter()}`, event.threadID);
    },

    // ==================== GROUP LIST ====================
    grouplist: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const db = getDB();
        const groupIDs = Object.keys(db.groups || {});
        let msg = `📋 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📊 ᴛᴏᴛᴀʟ: ${groupIDs.length}\n\n`;
        for (const gid of groupIDs) {
            const name = db.groups[gid].name || "Unknown";
            msg += `📍 ${name}\n🆔 ${gid}\n\n`;
        }
        if (groupIDs.length === 0) msg += `ɴᴏ ɢʀᴏᴜᴘꜱ ᴛʀᴀᴄᴋᴇᴅ`;
        api.sendMessage(msg + timeFooter(), event.threadID);
    },

    // ==================== CLEAR CACHE (NEW) ====================
    clearcache: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        
        api.sendMessage(`⏳ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴄʟᴇᴀʀɪɴɢ ᴄᴀᴄʜᴇ...${timeFooter()}`, event.threadID);
        
        try {
            const db = getDB();
            const oldCount = Object.keys(db.users || {}).length;
            
            // Clear users, warnings, activity data
            db.users = {};
            db.warnings = {};
            db.afk = {};
            
            saveDB(db);
            
            api.sendMessage(
                `✅ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴄᴀᴄʜᴇ ᴄʟᴇᴀʀᴇᴅ!\n━━━━━━━━━━━━━━━━━━━━━━━━\n👥 ᴜꜱᴇʀ ᴅᴀᴛᴀ ᴄʟᴇᴀʀᴇᴅ\n⚠️ ᴡᴀʀɴɪɴɢꜱ ᴄʟᴇᴀʀᴇᴅ\n💤 ᴀꜰᴋ ᴄʟᴇᴀʀᴇᴅ\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 ᴏʟᴅ ᴜꜱᴇʀꜱ: ${oldCount}\n📊 ɴᴇᴡ ᴜꜱᴇʀꜱ: 0${timeFooter()}`,
                event.threadID
            );
        } catch (e) {
            api.sendMessage("❌ ꜰᴀɪʟᴇᴅ: " + e.message + timeFooter(), event.threadID);
        }
    },

    // ==================== BOT HUNTER (ADVANCED) ====================
    bothunt: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        api.sendMessage(`🔍 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱᴄᴀɴɴɪɴɢ...${timeFooter()}`, event.threadID);
        setTimeout(async () => {
            try {
                const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
                if (!info) return;
                let bots = [];
                for (const id of info.participantIDs) {
                    if (id === api.getCurrentUserID()) continue;
                    try {
                        const u = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? null : ret[id])));
                        if (u && isBot(u.name)) bots.push({ id, name: u.name });
                    } catch (e) {}
                }
                let msg = `🤖 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ʙᴏᴛ ꜱᴄᴀɴ\n━━━━━━━━━━━━━━━━━━━━━━━━\n🤖 ʙᴏᴛꜱ: ${bots.length}\n\n`;
                for (const b of bots) msg += `⚠️ ${b.name}\n🆔 ${b.id}\n\n`;
                if (bots.length === 0) msg += `✅ ɴᴏ ʙᴏᴛꜱ`;
                api.sendMessage(msg + timeFooter(), event.threadID);
            } catch (e) {}
        }, 3000);
    },

    // ==================== BOT DESTROYER ====================
    botdestroyer: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /botdestroyer @ʙᴏᴛ" + timeFooter(), event.threadID);
        try {
            await new Promise(r => api.changeNickname("💀 SAYONARA KILLED 💀", event.threadID, t, () => r()));
            await sleep(500);
            api.removeUserFromGroup(t, event.threadID, () => {
                api.sendMessage(`💀 ʙᴏᴛ ᴅᴇꜱᴛʀᴏʏᴇᴅ ʙʏ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀${timeFooter()}`, event.threadID);
            });
        } catch (e) {
            api.sendMessage("❌ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ==================== SAYONARA ====================
    sayonara: async (api, event, args, config) => {
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /sayonara @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const name = event.mentions[t].replace('@', '');
        const msg = `🌸 ꜱᴀʏᴏɴᴀʀᴀ ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
💔 ᴛʜɪꜱ ɪꜱ ɢᴏᴏᴅʙʏᴇ
🌙 ᴍᴀʏ ʏᴏᴜ ꜰɪɴᴅ ᴘᴇᴀᴄᴇ
⭐ ᴡᴇ ᴡɪʟʟ ɴᴇᴠᴇʀ ꜰᴏʀɢᴇᴛ ʏᴏᴜ
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ`;
        const { sendAdvancedGif } = require('../utils');
        await sendAdvancedGif(api, event, msg + timeFooter(), 'sayonara', [{ tag: name, id: t }]);
    },

    // ==================== ADVANCED INFO ====================
    ainfo: async (api, event, args, config) => {
        const mentions = Object.keys(event.mentions || {});
        const target = mentions[0] || event.senderID;
        try {
            const user = await new Promise(r => api.getUserInfo(target, (e, ret) => r(e ? null : ret[target])));
            if (!user) return api.sendMessage("❌ Failed" + timeFooter(), event.threadID);
            const db = getDB();
            const userData = db.users?.[target] || { points: 0, coins: 0 };
            const msg = `👤 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴜꜱᴇʀ ɪɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
📛 ɴᴀᴍᴇ: ${user.name}
🆔 ᴜɪᴅ: ${target}
🤖 ʙᴏᴛ: ${isBot(user.name) ? "✅ ʏᴇꜱ" : "❌ ɴᴏ"}
💰 ᴄᴏɪɴꜱ: ${userData.coins || 0}
⭐ ᴘᴏɪɴᴛꜱ: ${userData.points || 0}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ${timeFooter()}`;
            api.sendMessage(msg, event.threadID);
        } catch (e) {}
    },

    // ==================== ANTI-BOT AUTO ====================
    antibotauto: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        const isOn = args[0] === "on";
        db.security[event.threadID].antiBotAuto = isOn;
        saveDB(db);
        api.sendMessage(`🤖 ᴀɴᴛɪ-ʙᴏᴛ ᴀᴜᴛᴏ: ${isOn ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== SAYONARA INFO ====================
    sinfo: async (api, event, args, config) => {
        const msg = `💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ
━━━━━━━━━━━━━━━━━━━━━━━━
🤖 ᴛʏᴘᴇ: ꜰᴀᴄᴇʙᴏᴏᴋ ᴍᴇꜱꜱᴇɴɢᴇʀ ʙᴏᴛ
⚙️ ᴠᴇʀꜱɪᴏɴ: ${config.version}
💀 ɴᴀᴍᴇ: 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ
👨‍💻 ᴅᴇᴠ: ${config.developer}
🏴 ɢʀᴏᴜᴘ: ${config.groupName || "SAYONARA NO MERCY"}
━━━━━━━━━━━━━━━━━━━━━━━━
🔐 ꜰᴜʟʟ ꜱᴇᴄᴜʀɪᴛʏ
🎬 ᴀᴅᴠᴀɴᴄᴇᴅ ɢɪꜰ ʟɪʙʀᴀʀʏ
🤖 ᴀᴜᴛᴏ ʙᴏᴛ ᴅᴇᴛᴇᴄᴛɪᴏɴ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        api.sendMessage(msg, event.threadID);
    },

    // ==================== SAYONARA STATUS ====================
    sstatus: async (api, event, args, config) => {
        const up = process.uptime();
        const h = Math.floor(up / 3600);
        const m = Math.floor((up % 3600) / 60);
        const db = getDB();
        const totalGroups = Object.keys(db.groups || {}).length;
        const msg = `💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ ꜱᴛᴀᴛᴜꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 ꜱᴛᴀᴛᴜꜱ: ONLINE
⏱️ ᴜᴘᴛɪᴍᴇ: ${h}ʜ ${m}ᴍ
👥 ɢʀᴏᴜᴘꜱ: ${totalGroups}
💀 ᴠᴇʀꜱɪᴏɴ: ${config.version}
👨‍💻 ᴅᴇᴠ: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ${timeFooter()}`;
        api.sendMessage(msg, event.threadID);
    }

};