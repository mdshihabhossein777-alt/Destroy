const { getDB, saveDB, timeFooter, hasPermission, permissionDenied } = require('../utils');

module.exports = {

    // ==================== ANTI-BOT (1) ====================
    antibot: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiBot = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🤖 ᴀɴᴛɪ-ʙᴏᴛ: ${db.security[event.threadID].antiBot ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== BOT-SCAN (2) ====================
    botscan: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        api.sendMessage(`🔍 ꜱᴄᴀɴɴɪɴɢ ɢʀᴏᴜᴘ ꜰᴏʀ ʙᴏᴛꜱ...\n━━━━━━━━━━━━━━━━━━━━━━━━\n⏳ Please wait 5 seconds...${timeFooter()}`, event.threadID);
        setTimeout(async () => {
            try {
                const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
                if (!info) return api.sendMessage("❌ Scan failed" + timeFooter(), event.threadID);
                let suspicious = 0;
                let report = `🔍 ʙᴏᴛ ꜱᴄᴀɴ ʀᴇᴘᴏʀᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                for (const id of info.participantIDs) {
                    try {
                        const u = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? null : ret[id])));
                        if (u && u.name && /bot|Bot|BOT/i.test(u.name)) {
                            suspicious++;
                            report += `⚠️ ${u.name} - ${id}\n`;
                        }
                    } catch (e) {}
                }
                report += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                report += suspicious > 0 ? `⚠️ ${suspicious} ꜱᴜꜱᴘɪᴄɪᴏᴜꜱ ʙᴏᴛꜱ ꜰᴏᴜɴᴅ` : `✅ ɴᴏ ʙᴏᴛꜱ ᴅᴇᴛᴇᴄᴛᴇᴅ`;
                report += timeFooter();
                api.sendMessage(report, event.threadID);
            } catch (e) {
                api.sendMessage("❌ Scan error" + timeFooter(), event.threadID);
            }
        }, 5000);
    },

    // ==================== BOT-KILL (3) ====================
    botkill: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /botkill @ʙᴏᴛ" + timeFooter(), event.threadID);
        api.removeUserFromGroup(t, event.threadID, (err) => {
            if (err) return api.sendMessage("❌ ꜰᴀɪʟᴇᴅ. ʙᴏᴛ ɴᴇᴇᴅꜱ ᴀᴅᴍɪɴ." + timeFooter(), event.threadID);
            api.sendMessage(`💀 ʙᴏᴛ ᴋɪʟʟᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ${timeFooter()}`, event.threadID);
        });
    },

    // ==================== ANTI-RAID (4) ====================
    antiraid: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiRaid = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🛡️ ᴀɴᴛɪ-ʀᴀɪᴅ: ${db.security[event.threadID].antiRaid ? "ON ✅" : "OFF ❌"}\n💡 Auto-lock if 5+ joins in 1 min${timeFooter()}`, event.threadID);
    },

    // ==================== ALL-MUTE (5) ====================
    allmute: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].allMute = true;
        saveDB(db);
        api.sendMessage(`🔇 ᴀʟʟ ᴍᴇᴍʙᴇʀꜱ ᴍᴜᴛᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== ALL-UNMUTE (6) ====================
    allunmute: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].allMute = false;
        saveDB(db);
        api.sendMessage(`🔊 ᴀʟʟ ᴍᴇᴍʙᴇʀꜱ ᴜɴᴍᴜᴛᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== LOCK-ALL (7) ====================
    lockall: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].lockAll = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔒 ʟᴏᴄᴋ ᴀʟʟ: ${db.security[event.threadID].lockAll ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== UNLOCK-ALL (8) ====================
    unlockall: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].lockAll = false;
        saveDB(db);
        api.sendMessage(`🔓 ᴀʟʟ ᴜɴʟᴏᴄᴋᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== SHIELD (9) ====================
    shield: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].shield = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🛡️ ꜱʜɪᴇʟᴅ: ${db.security[event.threadID].shield ? "ON ✅" : "OFF ❌"}\n💡 Auto-kick attackers${timeFooter()}`, event.threadID);
    },

    // ==================== ONLY-ADMIN (10) ====================
    onlyadmin: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].onlyAdmin = args[0] === "on";
        saveDB(db);
        api.sendMessage(`👑 ᴏɴʟʏ ᴀᴅᴍɪɴ: ${db.security[event.threadID].onlyAdmin ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ONLY-MOD (11) ====================
    onlymod: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].onlyMod = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🎭 ᴏɴʟʏ ᴍᴏᴅ: ${db.security[event.threadID].onlyMod ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== BOTLOCK (12) ====================
    botlock: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].botLock = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔐 ʙᴏᴛ ʟᴏᴄᴋ: ${db.security[event.threadID].botLock ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== BOT-OFF (13) ====================
    botoff: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        const gid = args[0] || event.threadID;
        if (!db.security[gid]) db.security[gid] = {};
        db.security[gid].botOff = true;
        saveDB(db);
        api.sendMessage(`⛔ ʙᴏᴛ ᴏꜰꜰ ɪɴ ɢʀᴏᴜᴘ: ${gid}${timeFooter()}`, event.threadID);
    },

    // ==================== BOT-ON (14) ====================
    boton: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        const gid = args[0] || event.threadID;
        if (!db.security[gid]) db.security[gid] = {};
        db.security[gid].botOff = false;
        saveDB(db);
        api.sendMessage(`✅ ʙᴏᴛ ᴏɴ ɪɴ ɢʀᴏᴜᴘ: ${gid}${timeFooter()}`, event.threadID);
    },

    // ==================== BOTLOCKLIST (15) ====================
    botlocklist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        let msg = `🔐 ʙᴏᴛ ʟᴏᴄᴋ ʟɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        let count = 0;
        for (const gid in db.security || {}) {
            if (db.security[gid].botLock) {
                count++;
                msg += `🔒 ${gid}\n`;
            }
        }
        if (count === 0) msg += `ɴᴏ ʟᴏᴄᴋᴇᴅ ɢʀᴏᴜᴘꜱ`;
        api.sendMessage(msg + timeFooter(), event.threadID);
    },

    // ==================== ADD-ADMIN (16) ====================
    addadmin: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /addadmin @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const newConfig = JSON.parse(require('fs').readFileSync('./config.json', 'utf8'));
        if (!newConfig.botAdmins) newConfig.botAdmins = [];
        if (newConfig.botAdmins.includes(t)) return api.sendMessage("ᴀʟʀᴇᴀᴅʏ ᴀᴅᴍɪɴ" + timeFooter(), event.threadID);
        newConfig.botAdmins.push(t);
        require('fs').writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
        const name = event.mentions[t].replace('@', '');
        api.sendMessage(`✅ ${name} ɪꜱ ɴᴏᴡ ʙᴏᴛ ᴀᴅᴍɪɴ${timeFooter()}`, event.threadID);
    },

    // ==================== REMOVE-ADMIN (17) ====================
    removeadmin: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /removeadmin @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const newConfig = JSON.parse(require('fs').readFileSync('./config.json', 'utf8'));
        if (!newConfig.botAdmins) newConfig.botAdmins = [];
        newConfig.botAdmins = newConfig.botAdmins.filter(id => id !== t);
        require('fs').writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
        const name = event.mentions[t].replace('@', '');
        api.sendMessage(`✅ ${name} ʀᴇᴍᴏᴠᴇᴅ ꜰʀᴏᴍ ʙᴏᴛ ᴀᴅᴍɪɴ${timeFooter()}`, event.threadID);
    },

    // ==================== RESTART (18) ====================
    restart: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        api.sendMessage(`🔄 ʀᴇꜱᴛᴀʀᴛɪɴɢ ʙᴏᴛ...${timeFooter()}`, event.threadID, () => {
            setTimeout(() => process.exit(0), 2000);
        });
    },

    // ==================== MAINTENANCE (19) ====================
    maintenance: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.maintenance = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔧 ᴍᴀɪɴᴛᴇɴᴀɴᴄᴇ: ${db.settings.maintenance ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== STATUS (20) ====================
    status: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60);
        const db = getDB();
        const totalGroups = Object.keys(db.groups || {}).length;
        const msg = `⚙️ ꜱʏꜱᴛᴇᴍ ꜱᴛᴀᴛᴜꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 ꜱᴛᴀᴛᴜꜱ: ONLINE
⏱️ ᴜᴘᴛɪᴍᴇ: ${h}ʜ ${m}ᴍ
📦 ᴄᴏᴍᴍᴀɴᴅꜱ: ${Object.keys(require('../commands/public') || {}).length + Object.keys(require('../commands/admin') || {}).length}
👥 ɢʀᴏᴜᴘꜱ: ${totalGroups}
🛡️ ʙᴏᴛ ᴀᴅᴍɪɴꜱ: ${config.botAdmins?.length || 0}
💀 ᴠᴇʀꜱɪᴏɴ: ${config.version}${timeFooter()}`;
        api.sendMessage(msg, event.threadID);
    },

    // ==================== ACTIVE (21) ====================
    active: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        api.sendMessage(`✅ ʙᴏᴛ ɪꜱ ᴀᴄᴛɪᴠᴇ ɪɴ ᴛʜɪꜱ ɢʀᴏᴜᴘ\n🆔 ${event.threadID}${timeFooter()}`, event.threadID);
    },

    // ==================== TOP-IGNORE (22) ====================
    topignore: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        const t = Object.keys(event.mentions || {})[0];
        if (!db.groups[event.threadID].ignored) db.groups[event.threadID].ignored = [];
        if (t && !db.groups[event.threadID].ignored.includes(t)) {
            db.groups[event.threadID].ignored.push(t);
            saveDB(db);
            api.sendMessage("✅ ᴜꜱᴇʀ ɪɢɴᴏʀᴇᴅ ꜰʀᴏᴍ ᴛᴏᴘ" + timeFooter(), event.threadID);
        } else {
            api.sendMessage("ᴜꜱᴀɢᴇ: /topignore @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        }
    },

    // ==================== WELCOME SET (23) ====================
    welcome: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        if (args[0] === "set") {
            const msg = args.slice(1).join(" ");
            const db = getDB();
            if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
            db.groups[event.threadID].welcome = msg || "ᴡᴇʟᴄᴏᴍᴇ!";
            saveDB(db);
            api.sendMessage("✅ ᴡᴇʟᴄᴏᴍᴇ ᴍᴇꜱꜱᴀɢᴇ ꜱᴇᴛ" + timeFooter(), event.threadID);
        } else {
            api.sendMessage("ᴜꜱᴀɢᴇ: /welcome ꜱᴇᴛ [ᴍᴇꜱꜱᴀɢᴇ]" + timeFooter(), event.threadID);
        }
    },

    // ==================== GOODBYE SET (24) ====================
    goodbye: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        if (args[0] === "set") {
            const msg = args.slice(1).join(" ");
            const db = getDB();
            if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
            db.groups[event.threadID].goodbye = msg || "ɢᴏᴏᴅʙʏᴇ!";
            saveDB(db);
            api.sendMessage("✅ ɢᴏᴏᴅʙʏᴇ ᴍᴇꜱꜱᴀɢᴇ ꜱᴇᴛ" + timeFooter(), event.threadID);
        } else {
            api.sendMessage("ᴜꜱᴀɢᴇ: /goodbye ꜱᴇᴛ [ᴍᴇꜱꜱᴀɢᴇ]" + timeFooter(), event.threadID);
        }
    },

    // ==================== ANTI-SPAM (25) ====================
    antispam: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiSpam = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🚫 ᴀɴᴛɪ-ꜱᴘᴀᴍ: ${db.security[event.threadID].antiSpam ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== SECURITY MASTER (26) ====================
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

        db.groups[event.threadID].lockName = isOn;
        db.groups[event.threadID].lockPhoto = isOn;
        db.groups[event.threadID].lockNick = isOn;
        db.groups[event.threadID].antiLink = isOn;
        db.groups[event.threadID].antiGali = isOn;
        db.groups[event.threadID].antiSticker = isOn;
        db.groups[event.threadID].antiGif = isOn;
        db.groups[event.threadID].antiPhone = isOn;

        saveDB(db);

        const msg = `🔐 ꜱᴇᴄᴜʀɪᴛʏ ᴍᴀꜱᴛᴇʀ ${isOn ? "ON ✅" : "OFF ❌"}
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
━━━━━━━━━━━━━━━━━━━━━━━━
${isOn ? "🔥 ᴀʟʟ 12 ᴘʀᴏᴛᴇᴄᴛɪᴏɴꜱ ᴀᴄᴛɪᴠᴇ" : "⚠️ ᴀʟʟ ᴘʀᴏᴛᴇᴄᴛɪᴏɴꜱ ᴏꜰꜰ"}${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    },

    // ==================== WAR MASTER (27) ====================
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

        const msg = `⚔️ ᴡᴀʀ ᴍᴏᴅᴇ ${isOn ? "ON 🔥" : "OFF ✅"}
━━━━━━━━━━━━━━━━━━━━━━━━
${isOn ? `🔥 ᴜʟᴛʀᴀ ʙʀᴜᴛᴀʟ ᴍᴏᴅᴇ ᴀᴄᴛɪᴠᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ All 12 protections
🔍 Bot scan enabled
💀 Bot kill ready
🔇 All members muted
👑 Only admin mode
🔐 Bot locked
🐌 Slowmode 10s` : `✅ ɴᴏʀᴍᴀʟ ᴍᴏᴅᴇ ʀᴇꜱᴛᴏʀᴇᴅ
All members can chat freely`}${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    },

    // ==================== NOTIFY RESET (28) ====================
    notify: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.lastNotifiedVersion = null;
        saveDB(db);
        api.sendMessage(`🔄 ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ ʀᴇꜱᴇᴛ. ʀᴇꜱᴛᴀʀᴛ ʙᴏᴛ ᴛᴏ ꜱᴇɴᴅ ᴀɢᴀɪɴ${timeFooter()}`, event.threadID);
    },

    // ==================== BROADCAST (29) ====================
    broadcast: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const msg = args.join(" ");
        if (!msg) return api.sendMessage("ᴜꜱᴀɢᴇ: /broadcast [ᴍᴇꜱꜱᴀɢᴇ]" + timeFooter(), event.threadID);
        const db = getDB();
        const groupIDs = Object.keys(db.groups || {});
        if (groupIDs.length === 0) return api.sendMessage("ɴᴏ ɢʀᴏᴜᴘꜱ ꜰᴏᴜɴᴅ" + timeFooter(), event.threadID);
        api.sendMessage(`📢 ʙʀᴏᴀᴅᴄᴀꜱᴛɪɴɢ ᴛᴏ ${groupIDs.length} ɢʀᴏᴜᴘꜱ...${timeFooter()}`, event.threadID);
        let sent = 0;
        for (const gid of groupIDs) {
            try {
                await new Promise(r => api.sendMessage(`📢 ʙʀᴏᴀᴅᴄᴀꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n${msg}${timeFooter()}`, gid, () => r()));
                sent++;
                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {}
        }
        api.sendMessage(`✅ ꜱᴇɴᴛ ᴛᴏ ${sent}/${groupIDs.length} ɢʀᴏᴜᴘꜱ${timeFooter()}`, event.threadID);
    },

    // ==================== GROUP LIST (30) ====================
    grouplist: async (api, event, args, config) => {
        if (event.senderID !== config.owner) return permissionDenied(api, event, "owner");
        const db = getDB();
        const groupIDs = Object.keys(db.groups || {});
        let msg = `📋 ɢʀᴏᴜᴘ ʟɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📊 ᴛᴏᴛᴀʟ: ${groupIDs.length}\n\n`;
        for (const gid of groupIDs) {
            const name = db.groups[gid].name || "Unknown";
            msg += `📍 ${name}\n🆔 ${gid}\n\n`;
        }
        if (groupIDs.length === 0) msg += `ɴᴏ ɢʀᴏᴜᴘꜱ ᴛʀᴀᴄᴋᴇᴅ`;
        api.sendMessage(msg + timeFooter(), event.threadID);
    }

};