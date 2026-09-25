const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    sleep, SLOW_MODE 
} = require('../utils');

module.exports = {

    // ==================== 👢 KICK ====================
    kick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /kick @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const reason = args.filter(a => !a.startsWith('@')).join(" ") || "ɴᴏ ʀᴇᴀꜱᴏɴ";
        
        await sleep(1000);
        
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            const botID = api.getCurrentUserID();
            if (!info?.adminIDs?.some(a => a.id === botID)) {
                return api.sendMessage(`❌ 𝐁ᴏᴛ ɪꜱ ɴᴏᴛ ᴀᴅᴍɪɴ!${timeFooter()}`, event.threadID);
            }
        } catch (e) {}
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.removeUserFromGroup(t, event.threadID, (err) => {
            if (err) return api.sendMessage(`❌ 𝐅ᴀɪʟᴇᴅ ᴛᴏ ᴋɪᴄᴋ${timeFooter()}`, event.threadID);
            api.sendMessage(
                `👢 𝐔ꜱᴇʀ 𝐊ɪᴄᴋᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
📝 ʀᴇᴀꜱᴏɴ: ${reason}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );
        });
    },

    // ==================== 🚫 BAN ====================
    ban: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /ban @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (!db.blacklist[event.threadID]) db.blacklist[event.threadID] = [];
        
        if (!db.blacklist[event.threadID].includes(t)) {
            db.blacklist[event.threadID].push(t);
            saveDB(db);
        }
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.removeUserFromGroup(t, event.threadID, () => {
            api.sendMessage(
                `🚫 𝐔ꜱᴇʀ 𝐁ᴀɴɴᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🆔 ${t}
📌 𝐀ᴅᴅᴇᴅ ᴛᴏ ʙʟᴀᴄᴋʟɪꜱᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );
        });
    },

    // ==================== ✅ UNBAN ====================
    unban: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /unban @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (db.blacklist[event.threadID]) {
            db.blacklist[event.threadID] = db.blacklist[event.threadID].filter(id => id !== t);
            saveDB(db);
        }
        
        api.sendMessage(
            `✅ 𝐔ꜱᴇʀ 𝐔ɴʙᴀɴɴᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
🆔 ${t}
📌 𝐑ᴇᴍᴏᴠᴇᴅ ꜰʀᴏᴍ ʙʟᴀᴄᴋʟɪꜱᴛ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📋 BANLIST ====================
    banlist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        const banList = db.blacklist[event.threadID] || [];
        
        let msg = `📋 𝐁ᴀɴ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (banList.length === 0) {
            msg += `✅ ɴᴏ ʙᴀɴɴᴇᴅ ᴜꜱᴇʀꜱ`;
        } else {
            for (let i = 0; i < banList.length; i++) {
                try {
                    const user = await new Promise(r => api.getUserInfo(banList[i], (e, ret) => r(e ? null : ret[banList[i]])));
                    msg += `${i + 1}. ${user ? user.name : "Unknown"}\n`;
                } catch (e) {
                    msg += `${i + 1}. 🆔 ${banList[i]}\n`;
                }
            }
        }
        
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${banList.length}${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== ⚠️ WARN ====================
    warn: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /warn @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (!db.warnings[event.threadID]) db.warnings[event.threadID] = {};
        db.warnings[event.threadID][t] = (db.warnings[event.threadID][t] || 0) + 1;
        const count = db.warnings[event.threadID][t];
        saveDB(db);
        
        const name = event.mentions[t]?.replace('@', '') || t;
        const warnLimit = db.groups[event.threadID]?.warnLimit || 3;
        
        api.sendMessage(
            `⚠️ 𝐖ᴀʀɴɪɴɢ 𝐈ꜱꜱᴜᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
📊 ᴛᴏᴛᴀʟ: ${count}/${warnLimit}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
        
        if (count >= warnLimit) {
            await sleep(2000);
            api.removeUserFromGroup(t, event.threadID, () => {
                api.sendMessage(
                    `🚫 𝐔ꜱᴇʀ 𝐊ɪᴄᴋᴇᴅ (${warnLimit} ᴡᴀʀɴɪɴɢꜱ)${timeFooter()}`,
                    event.threadID
                );
            });
        }
    },

    // ==================== 📋 WARNLIST ====================
    warnlist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        const warnings = db.warnings[event.threadID] || {};
        
        let msg = `📋 𝐖ᴀʀɴɪɴɢ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        let count = 0;
        
        for (const uid in warnings) {
            if (warnings[uid] > 0) {
                try {
                    const user = await new Promise(r => api.getUserInfo(uid, (e, ret) => r(e ? null : ret[uid])));
                    msg += `👤 ${user ? user.name : "Unknown"}: ${warnings[uid]}\n`;
                    count++;
                } catch (e) {}
            }
        }
        
        if (count === 0) msg += `✅ ɴᴏ ᴡᴀʀɴɪɴɢꜱ`;
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${count}${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🧹 CLEARWARN ====================
    clearwarn: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /clearwarn @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (db.warnings[event.threadID]) {
            db.warnings[event.threadID][t] = 0;
            saveDB(db);
        }
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.sendMessage(
            `✅ 𝐖ᴀʀɴɪɴɢ 𝐂ʟᴇᴀʀᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== ⚙️ WARnLIMIT ====================
    warnlimit: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const limit = parseInt(args[0]) || 3;
        
        if (limit < 1 || limit > 10) {
            return api.sendMessage(`⚠️ ʀᴀɴɢᴇ: 1-10${timeFooter()}`, event.threadID);
        }
        
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].warnLimit = limit;
        saveDB(db);
        
        api.sendMessage(
            `⚙️ 𝐖ᴀʀɴ 𝐋ɪᴍɪᴛ 𝐒ᴇᴛ: ${limit}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔨 MUTE ====================
    mute: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /mute @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        if (!db.security[event.threadID].muted) db.security[event.threadID].muted = [];
        
        if (!db.security[event.threadID].muted.includes(t)) {
            db.security[event.threadID].muted.push(t);
            saveDB(db);
        }
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.sendMessage(
            `🔇 𝐔ꜱᴇʀ 𝐌ᴜᴛᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔊 UNMUTE ====================
    unmute: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /unmute @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (db.security[event.threadID]?.muted) {
            db.security[event.threadID].muted = db.security[event.threadID].muted.filter(id => id !== t);
            saveDB(db);
        }
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.sendMessage(
            `🔊 𝐔ꜱᴇʀ 𝐔ɴᴍᴜᴛᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🗑️ PURGE ====================
    purge: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const count = parseInt(args[0]) || 5;
        
        if (count > 20) {
            return api.sendMessage(`⚠️ ᴍᴀx 20 ᴍᴇꜱꜱᴀɢᴇꜱ${timeFooter()}`, event.threadID);
        }
        
        api.sendMessage(
            `🗑️ 𝐏ᴜʀɢᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
📌 ᴅᴇʟᴇᴛɪɴɢ ʟᴀꜱᴛ ${count} ᴍᴇꜱꜱᴀɢᴇꜱ...
⚠️ ᴛʜɪꜱ ꜰᴇᴀᴛᴜʀᴇ ɪꜱ ʟɪᴍɪᴛᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📊 MODLOG ====================
    modlog: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        const logs = db.groups[event.threadID]?.modLog || [];
        
        let msg = `📊 𝐌ᴏᴅ 𝐋ᴏɢ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (logs.length === 0) {
            msg += `✅ ɴᴏ ᴍᴏᴅᴇʀᴀᴛɪᴏɴ ʟᴏɢꜱ`;
        } else {
            const recent = logs.slice(-10);
            for (const log of recent) {
                msg += `${log}\n`;
            }
        }
        
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 📋 KICKLOG ====================
    kicklog: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        const logs = db.groups[event.threadID]?.kickLog || [];
        
        let msg = `📋 𝐊ɪᴄᴋ 𝐋ᴏɢ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (logs.length === 0) {
            msg += `✅ ɴᴏ ᴋɪᴄᴋ ʟᴏɢꜱ`;
        } else {
            const recent = logs.slice(-10);
            for (const log of recent) {
                msg += `${log}\n`;
            }
        }
        
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🚫 KICKDETECT ====================
    kickdetect: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].kickDetect = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🚫 𝐊ɪᴄᴋ 𝐃ᴇᴛᴇᴄᴛ: ${db.security[event.threadID].kickDetect ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== ⚙️ KICKWARN ====================
    kickwarn: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].kickWarn = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `⚠️ 𝐊ɪᴄᴋ 𝐖ᴀʀɴ: ${db.security[event.threadID].kickWarn ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🤖 AUTOKICK ====================
    autokick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].autoKick = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🤖 𝐀ᴜᴛᴏ 𝐊ɪᴄᴋ: ${db.security[event.threadID].autoKick ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
💡 ɪɴᴀᴄᴛɪᴠᴇ ᴜꜱᴇʀꜱ ᴡɪʟʟ ʙᴇ ᴋɪᴄᴋᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔨 SETROLE ====================
    setrole: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /setrole @ᴜꜱᴇʀ ᴍᴏᴅ${timeFooter()}`, event.threadID);
        
        const role = args.filter(a => !a.startsWith('@'))[0]?.toLowerCase();
        if (!["public", "mod", "groupadmin", "botadmin", "vip", "brother", "army"].includes(role)) {
            return api.sendMessage(
                `ᴠᴀʟɪᴅ ʀᴏʟᴇꜱ:\nᴘᴜʙʟɪᴄ, ᴍᴏᴅ, ɢʀᴏᴜᴘᴀᴅᴍɪɴ, ʙᴏᴛᴀᴅᴍɪɴ, ᴠɪᴘ, ʙʀᴏᴛʜᴇʀ, ᴀʀᴍʏ${timeFooter()}`,
                event.threadID
            );
        }
        
        const db = getDB();
        if (!db.roles[event.threadID]) db.roles[event.threadID] = {};
        db.roles[event.threadID][t] = role;
        saveDB(db);
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.sendMessage(
            `✅ 𝐑ᴏʟᴇ 𝐒ᴇᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🎭 ʀᴏʟᴇ: ${role}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🗑️ REMOVEROLE ====================
    removerole: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /removerole @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (db.roles[event.threadID]) {
            delete db.roles[event.threadID][t];
            saveDB(db);
        }
        
        api.sendMessage(`✅ 𝐑ᴏʟᴇ 𝐑ᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
    }

};