const fs = require('fs');
const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    getUserRole, SLOW_MODE, sleep, healthCheck 
} = require('../utils');

module.exports = {

    // ==================== KICK ====================
    kick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /kick @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const reason = args.filter(a => !a.startsWith('@')).join(" ") || "ɴᴏ ʀᴇᴀꜱᴏɴ";
        
        await sleep(1000);
        
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            const botID = api.getCurrentUserID();
            if (!info?.adminIDs?.some(a => a.id === botID)) {
                return api.sendMessage("❌ ʙᴏᴛ ɪꜱ ɴᴏᴛ ᴀᴅᴍɪɴ!" + timeFooter(), event.threadID);
            }
        } catch (e) {}
        
        api.removeUserFromGroup(t, event.threadID, (err) => {
            if (err) return api.sendMessage("❌ ꜰᴀɪʟᴇᴅ." + timeFooter(), event.threadID);
            api.sendMessage(`👢 ᴜꜱᴇʀ ᴋɪᴄᴋᴇᴅ\n📝 ʀᴇᴀꜱᴏɴ: ${reason}${timeFooter()}`, event.threadID);
        });
    },

    // ==================== BAN ====================
    ban: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /ban @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const db = getDB();
        if (!db.blacklist[event.threadID]) db.blacklist[event.threadID] = [];
        db.blacklist[event.threadID].push(t);
        saveDB(db);
        api.removeUserFromGroup(t, event.threadID, () => {
            api.sendMessage(`🚫 ᴜꜱᴇʀ ʙᴀɴɴᴇᴅ & ʀᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
        });
    },

    // ==================== UNBAN ====================
    unban: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /unban @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const db = getDB();
        if (db.blacklist[event.threadID]) {
            db.blacklist[event.threadID] = db.blacklist[event.threadID].filter(id => id !== t);
            saveDB(db);
        }
        api.sendMessage(`✅ ᴜɴʙᴀɴɴᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== SETROLE ====================
    setrole: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /setrole @ᴜꜱᴇʀ ᴍᴏᴅ" + timeFooter(), event.threadID);
        const role = args.filter(a => !a.startsWith('@'))[0]?.toLowerCase();
        if (!["public", "mod", "groupadmin", "botadmin"].includes(role)) {
            return api.sendMessage("ᴠᴀʟɪᴅ: ᴘᴜʙʟɪᴄ, ᴍᴏᴅ, ɢʀᴏᴜᴘᴀᴅᴍɪɴ, ʙᴏᴛᴀᴅᴍɪɴ" + timeFooter(), event.threadID);
        }
        const db = getDB();
        if (!db.roles[event.threadID]) db.roles[event.threadID] = {};
        db.roles[event.threadID][t] = role;
        saveDB(db);
        api.sendMessage(`✅ ʀᴏʟᴇ ꜱᴇᴛ: ${role}${timeFooter()}`, event.threadID);
    },

    // ==================== REMOVEROLE ====================
    removerole: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /removerole @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const db = getDB();
        if (db.roles[event.threadID]) {
            delete db.roles[event.threadID][t];
            saveDB(db);
        }
        api.sendMessage(`✅ ʀᴏʟᴇ ʀᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== SETRULES ====================
    setrules: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].rules = args.join(" ") || "ɴᴏ ʀᴜʟᴇꜱ";
        saveDB(db);
        api.sendMessage("✅ ʀᴜʟᴇꜱ ᴜᴘᴅᴀᴛᴇᴅ" + timeFooter(), event.threadID);
    },

    // ==================== WARN ====================
       // ==================== WARN ====================
    warn: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /warn @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        
        const db = getDB();
        if (!db.warnings[event.threadID]) db.warnings[event.threadID] = {};
        db.warnings[event.threadID][t] = (db.warnings[event.threadID][t] || 0) + 1;
        const count = db.warnings[event.threadID][t];
        saveDB(db);
        
        api.sendMessage(`⚠️ ᴡᴀʀɴɪɴɢ ɪꜱꜱᴜᴇᴅ\nᴛᴏᴛᴀʟ: ${count}/3${timeFooter()}`, event.threadID);
        
        // ✅ warnKill active থাকলে 3 warn = kick
        const warnKillActive = db.security[event.threadID]?.warnKill === true;
        if (warnKillActive && count >= 3) {
            api.removeUserFromGroup(t, event.threadID, () => {
                api.sendMessage(
                    `💀 ᴡᴀʀɴ ᴋɪʟʟ ᴀᴄᴛɪᴠᴀᴛᴇᴅ\n🚫 ᴜꜱᴇʀ ᴋɪᴄᴋᴇᴅ (3 ᴡᴀʀɴɪɴɢꜱ)${timeFooter()}`,
                    event.threadID
                );
            });
        }
    },

    // ==================== WARNLIST ====================
    warnlist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        const warnings = db.warnings[event.threadID] || {};
        let msg = "⚠️ ᴡᴀʀɴɪɴɢ ʟɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
        for (const uid in warnings) {
            const u = await new Promise(r => api.getUserInfo(uid, (e, ret) => r(e ? { name: "Unknown" } : ret[uid])));
            msg += `👤 ${u.name}: ${warnings[uid]}\n`;
        }
        if (Object.keys(warnings).length === 0) msg += "ɴᴏ ᴡᴀʀɴɪɴɢꜱ";
        api.sendMessage(msg + timeFooter(), event.threadID);
    },

    // ==================== LOCKNAME ====================
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
                console.log(`🔒 Locked name saved: ${savedName}`);
            } else {
                return api.sendMessage(`⚠️ ᴜɴᴀʙʟᴇ ᴛᴏ ꜰᴇᴛᴄʜ ɴᴀᴍᴇ!\n📌 ᴘʟᴇᴀꜱᴇ ᴛʀʏ ᴀɢᴀɪɴ${timeFooter()}`, event.threadID);
            }
        }

        saveDB(db);
        const savedName = db.groups[event.threadID].lockedName || "Not set";
        api.sendMessage(
            `🔒 ʟᴏᴄᴋ ɴᴀᴍᴇ: ${isOn ? "ON ✅" : "OFF ❌"}\n📌 ꜱᴀᴠᴇᴅ: ${savedName}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== LOCKPHOTO ====================
    lockphoto: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].lockPhoto = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔒 ʟᴏᴄᴋ ᴘʜᴏᴛᴏ: ${db.groups[event.threadID].lockPhoto ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== LOCKNICK ====================
    locknick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].lockNick = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔒 ʟᴏᴄᴋ ɴɪᴄᴋ: ${db.groups[event.threadID].lockNick ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== MASSNICK ====================
    massnick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const nick = args.join(" ").trim();
        if (!nick) return api.sendMessage("ᴜꜱᴀɢᴇ: /massnick [ɴᴀᴍᴇ]" + timeFooter(), event.threadID);
        const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
        if (!info) return;
        api.sendMessage(`⏳ ᴄʜᴀɴɢɪɴɢ ${info.participantIDs.length} ɴɪᴄᴋꜱ...${timeFooter()}`, event.threadID);
        let ok = 0, fail = 0;
        for (const id of info.participantIDs) {
            if (id === api.getCurrentUserID()) continue;
            await new Promise(resolve => {
                api.changeNickname(nick, event.threadID, id, (err) => {
                    if (err) fail++; else ok++;
                    setTimeout(resolve, SLOW_MODE.massActionDelay);
                });
            });
        }
        api.sendMessage(`✅ ᴏᴋ: ${ok}\n❌ ꜰᴀɪʟ: ${fail}${timeFooter()}`, event.threadID);
    },

    // ==================== AUTONICK ====================
    autonick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0];
        const nick = args.filter(a => !a.startsWith('@')).join(" ").trim();
        if (!t || !nick) return api.sendMessage("ᴜꜱᴀɢᴇ: /autonick @ᴜꜱᴇʀ [ɴᴀᴍᴇ]" + timeFooter(), event.threadID);
        api.changeNickname(nick, event.threadID, t, (err) => {
            if (err) return api.sendMessage("❌ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
            api.sendMessage(`✅ ɴɪᴄᴋ ꜱᴇᴛ${timeFooter()}`, event.threadID);
        });
    },

    // ==================== RESETNICK ====================
    resetnick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /resetnick @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        api.changeNickname("", event.threadID, t, (err) => {
            api.sendMessage(err ? "❌ ꜰᴀɪʟ" + timeFooter() : "✅ ʀᴇꜱᴇᴛ" + timeFooter(), event.threadID);
        });
    },

    // ==================== ANTLINK ====================
    antlink: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiLink = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔗 ᴀɴᴛɪ-ʟɪɴᴋ: ${db.groups[event.threadID].antiLink ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ANTIGALI ====================
    antigali: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiGali = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🤬 ᴀɴᴛɪ-ɢᴀʟɪ: ${db.groups[event.threadID].antiGali ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ANTISTICKER ====================
    antisticker: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiSticker = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🎨 ᴀɴᴛɪ-ꜱᴛɪᴄᴋᴇʀ: ${db.groups[event.threadID].antiSticker ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ANTIGIF ====================
    antigif: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiGif = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🎬 ᴀɴᴛɪ-ɢɪꜰ: ${db.groups[event.threadID].antiGif ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== ANTIPHONE ====================
    antiphone: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiPhone = args[0] === "on";
        saveDB(db);
        api.sendMessage(`📱 ᴀɴᴛɪ-ᴘʜᴏɴᴇ: ${db.groups[event.threadID].antiPhone ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    // ==================== BLACKLIST ====================
    blacklist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.blacklist[event.threadID]) db.blacklist[event.threadID] = [];
        const action = args[0]?.toLowerCase();
        const target = Object.keys(event.mentions || {})[0];

        if (action === "add" && target) {
            if (!db.blacklist[event.threadID].includes(target)) db.blacklist[event.threadID].push(target);
            saveDB(db);
            api.sendMessage(`✅ ᴀᴅᴅᴇᴅ ᴛᴏ ʙʟᴀᴄᴋʟɪꜱᴛ${timeFooter()}`, event.threadID);
        } else if (action === "remove" && target) {
            db.blacklist[event.threadID] = db.blacklist[event.threadID].filter(id => id !== target);
            saveDB(db);
            api.sendMessage(`✅ ʀᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
        } else if (action === "list") {
            let msg = "🚫 ʙʟᴀᴄᴋʟɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
            for (const id of db.blacklist[event.threadID]) {
                const u = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? { name: "Unknown" } : ret[id])));
                msg += `👤 ${u.name}\n`;
            }
            if (db.blacklist[event.threadID].length === 0) msg += "ɴᴏ ʙʟᴀᴄᴋʟɪꜱᴛᴇᴅ ᴜꜱᴇʀꜱ";
            api.sendMessage(msg + timeFooter(), event.threadID);
        } else {
            api.sendMessage("ᴜꜱᴀɢᴇ: /blacklist add/remove/list @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        }
    },

    // ==================== SLOWMODE ====================
    slowmode: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        const sec = parseInt(args[0]) || 0;
        db.groups[event.threadID].slowMode = sec;
        saveDB(db);
        api.sendMessage(`🐌 ꜱʟᴏᴡᴍᴏᴅᴇ: ${sec}ꜱ${timeFooter()}`, event.threadID);
    },

    // ==================== HEALTH CHECK ====================
    health: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");

        const health = healthCheck();
        const dayNight = health.isDay ? "☀️ Day" : "🌙 Night";

        const msg = `💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐇𝐄𝐀𝐋𝐓𝐇
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 ꜱᴛᴀᴛᴜꜱ: ${health.status.toUpperCase()}
⏱️ ᴜᴘᴛɪᴍᴇ: ${health.uptimeHuman}
💾 ᴍᴇᴍᴏʀʏ: ${health.memoryUsed}MB / ${health.memoryTotal}MB
📡 ᴀᴠɢ ᴘɪɴɢ: ${health.avgPing}ms
🕐 ᴛɪᴍᴇ: ${health.time}
${dayNight}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    },

    // ==================== UPTIME ====================
    uptime: async (api, event, args, config) => {
        const health = healthCheck();
        api.sendMessage(
            `⏱️ ᴜᴘᴛɪᴍᴇ: ${health.uptimeHuman}\n🕐 ᴛɪᴍᴇ: ${health.time}${timeFooter()}`,
            event.threadID
        );
    }

};