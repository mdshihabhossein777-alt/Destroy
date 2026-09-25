const fs = require('fs');
const { getDB, saveDB, timeFooter, hasPermission, permissionDenied, getUserRole } = require('../utils');

module.exports = {

    kick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /kick @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const reason = args.filter(a => !a.startsWith('@')).join(" ") || "ɴᴏ ʀᴇᴀꜱᴏɴ";
        api.removeUserFromGroup(t, event.threadID, (err) => {
            if (err) return api.sendMessage("❌ ꜰᴀɪʟᴇᴅ. ʙᴏᴛ ɴᴇᴇᴅꜱ ᴀᴅᴍɪɴ." + timeFooter(), event.threadID);
            api.sendMessage(`👢 ᴜꜱᴇʀ ᴋɪᴄᴋᴇᴅ\n📝 ʀᴇᴀꜱᴏɴ: ${reason}${timeFooter()}`, event.threadID);
        });
    },

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

    unban: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /unban @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        const db = getDB();
        if (db.blacklist[event.threadID]) {
            db.blacklist[event.threadID] = db.blacklist[event.threadID].filter(id => id !== t);
            saveDB(db);
        }
        api.sendMessage(`✅ ᴜꜱᴇʀ ᴜɴʙᴀɴɴᴇᴅ${timeFooter()}`, event.threadID);
    },

    setrole: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /setrole @ᴜꜱᴇʀ ᴍᴏᴅ" + timeFooter(), event.threadID);
        const role = args.filter(a => !a.startsWith('@'))[0]?.toLowerCase();
        if (!["public", "mod", "groupadmin", "botadmin"].includes(role)) {
            return api.sendMessage("ᴠᴀʟɪᴅ ʀᴏʟᴇꜱ: ᴘᴜʙʟɪᴄ, ᴍᴏᴅ, ɢʀᴏᴜᴘᴀᴅᴍɪɴ, ʙᴏᴛᴀᴅᴍɪɴ" + timeFooter(), event.threadID);
        }
        const db = getDB();
        if (!db.roles[event.threadID]) db.roles[event.threadID] = {};
        db.roles[event.threadID][t] = role;
        saveDB(db);
        const name = event.mentions[t].replace('@', '');
        api.sendMessage(`✅ ${name} → ${role}${timeFooter()}`, event.threadID);
    },

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

    setrules: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].rules = args.join(" ") || "ɴᴏ ʀᴜʟᴇꜱ";
        saveDB(db);
        api.sendMessage("✅ ʀᴜʟᴇꜱ ᴜᴘᴅᴀᴛᴇᴅ" + timeFooter(), event.threadID);
    },

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
        if (count >= 3) {
            api.removeUserFromGroup(t, event.threadID, () => {
                api.sendMessage(`🚫 ᴜꜱᴇʀ ᴋɪᴄᴋᴇᴅ (3 ᴡᴀʀɴɪɴɢꜱ)${timeFooter()}`, event.threadID);
            });
        }
    },

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

    lockname: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].lockName = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔒 Lock Name: ${db.groups[event.threadID].lockName ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    lockphoto: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].lockPhoto = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔒 Lock Photo: ${db.groups[event.threadID].lockPhoto ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    locknick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].lockNick = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔒 Lock Nick: ${db.groups[event.threadID].lockNick ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

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
                    setTimeout(resolve, 300);
                });
            });
        }
        api.sendMessage(`✅ ᴏᴋ: ${ok}\n❌ ꜰᴀɪʟ: ${fail}${timeFooter()}`, event.threadID);
    },

    autonick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0];
        const nick = args.filter(a => !a.startsWith('@')).join(" ").trim();
        if (!t || !nick) return api.sendMessage("ᴜꜱᴀɢᴇ: /autonick @ᴜꜱᴇʀ [ɴᴀᴍᴇ]" + timeFooter(), event.threadID);
        api.changeNickname(nick, event.threadID, t, (err) => {
            if (err) return api.sendMessage("❌ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
            api.sendMessage(`✅ ɴɪᴄᴋ ꜱᴇᴛ: ${nick}${timeFooter()}`, event.threadID);
        });
    },

    resetnick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("ᴜꜱᴀɢᴇ: /resetnick @ᴜꜱᴇʀ" + timeFooter(), event.threadID);
        api.changeNickname("", event.threadID, t, (err) => {
            api.sendMessage(err ? "❌ ꜰᴀɪʟ" + timeFooter() : "✅ ɴɪᴄᴋ ʀᴇꜱᴇᴛ" + timeFooter(), event.threadID);
        });
    },

    antlink: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiLink = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔗 Anti-Link: ${db.groups[event.threadID].antiLink ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    antigali: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiGali = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🤬 Anti-Gali: ${db.groups[event.threadID].antiGali ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    antisticker: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiSticker = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🎨 Anti-Sticker: ${db.groups[event.threadID].antiSticker ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    antigif: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiGif = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🎬 Anti-GIF: ${db.groups[event.threadID].antiGif ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    antiphone: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiPhone = args[0] === "on";
        saveDB(db);
        api.sendMessage(`📱 Anti-Phone: ${db.groups[event.threadID].antiPhone ? "ON ✅" : "OFF ❌"}${timeFooter()}`, event.threadID);
    },

    blacklist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.blacklist[event.threadID]) db.blacklist[event.threadID] = [];
        const action = args[0]?.toLowerCase();
        const target = Object.keys(event.mentions || {})[0];

        if (action === "add" && target) {
            if (!db.blacklist[event.threadID].includes(target)) db.blacklist[event.threadID].push(target);
            saveDB(db);
            api.sendMessage(`✅ ᴜꜱᴇʀ ᴀᴅᴅᴇᴅ ᴛᴏ ʙʟᴀᴄᴋʟɪꜱᴛ${timeFooter()}`, event.threadID);
        } else if (action === "remove" && target) {
            db.blacklist[event.threadID] = db.blacklist[event.threadID].filter(id => id !== target);
            saveDB(db);
            api.sendMessage(`✅ ᴜꜱᴇʀ ʀᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
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

    slowmode: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        const sec = parseInt(args[0]) || 0;
        db.groups[event.threadID].slowMode = sec;
        saveDB(db);
        api.sendMessage(`🐌 Slowmode: ${sec}s${timeFooter()}`, event.threadID);
    }

};