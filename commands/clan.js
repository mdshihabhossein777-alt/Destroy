const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, getOwnerList 
} = require('../utils');

module.exports = {

    // ==================== 👤 ROLE ====================
    role: async (api, event, args, config) => {
        const t = Object.keys(event.mentions || {})[0] || event.senderID;
        
        try {
            const user = await new Promise(r => api.getUserInfo(t, (e, ret) => r(e ? null : ret[t])));
            if (!user) return;
            
            const db = getDB();
            const ownerList = getOwnerList(config);
            
            let role = "👤 Member";
            if (ownerList.includes(t)) role = "👑 Owner";
            else if (config.botAdmins?.includes(t)) role = "🛡️ Bot Admin";
            else if (db.vips[event.threadID]?.includes(t)) role = "💎 VIP";
            else if (db.brothers[event.threadID]?.includes(t)) role = "🤝 Brother";
            else if (db.army[event.threadID]?.includes(t)) role = "🎖️ Army";
            else if (db.roles[event.threadID]?.[t]) role = db.roles[event.threadID][t];
            
            api.sendMessage(
                `👤 𝐔ꜱᴇʀ 𝐑ᴏʟᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐍ᴀᴍᴇ: ${user.name}
🎭 𝐑ᴏʟᴇ: ${role}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );
        } catch (e) {}
    },

    // ==================== 👥 ROLES ====================
    roles: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        const roles = db.roles[event.threadID] || {};
        
        let msg = `👥 𝐑ᴏʟᴇꜱ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        let count = 0;
        for (const uid in roles) {
            try {
                const user = await new Promise(r => api.getUserInfo(uid, (e, ret) => r(e ? null : ret[uid])));
                msg += `👤 ${user ? user.name : "Unknown"} → ${roles[uid]}\n`;
                count++;
            } catch (e) {}
        }
        
        if (count === 0) msg += `✅ ɴᴏ ᴄᴜꜱᴛᴏᴍ ʀᴏʟᴇꜱ`;
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${count}${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🎭 SETROLE ====================
    setrole: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /setrole @ᴜꜱᴇʀ ᴍᴏᴅ${timeFooter()}`, event.threadID);
        
        const role = args.filter(a => !a.startsWith('@'))[0]?.toLowerCase();
        if (!["mod", "vip", "brother", "army"].includes(role)) {
            return api.sendMessage(
                `ᴠᴀʟɪᴅ ʀᴏʟᴇꜱ: ᴍᴏᴅ, ᴠɪᴘ, ʙʀᴏᴛʜᴇʀ, ᴀʀᴍʏ${timeFooter()}`,
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
🎭 ${role.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🗑️ DELROLE ====================
    delrole: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /delrole @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (db.roles[event.threadID]) {
            delete db.roles[event.threadID][t];
            saveDB(db);
        }
        
        api.sendMessage(`✅ 𝐑ᴏʟᴇ 𝐑ᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== 🎭 ROLEINFO ====================
    roleinfo: async (api, event, args, config) => {
        const msg = `🎭 𝐑ᴏʟᴇ 𝐏ᴇʀᴍɪꜱꜱɪᴏɴꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
👑 𝐎ᴡɴᴇʀ - ꜰᴜʟʟ ᴀᴄᴄᴇꜱꜱ
🛡️ 𝐁ᴏᴛ 𝐀ᴅᴍɪɴ - ꜱᴇᴄᴜʀɪᴛʏ ᴄᴍᴅꜱ
⚔️ 𝐆ʀᴏᴜᴘ 𝐀ᴅᴍɪɴ - ɢʀᴏᴜᴘ ᴍᴀɴᴀɢᴇ
💎 𝐕ɪᴘ - ᴘʀᴇᴍɪᴜᴍ ꜰᴇᴀᴛᴜʀᴇꜱ
🤝 𝐁ʀᴏᴛʜᴇʀ - ꜱᴘᴇᴄɪᴀʟ ʀᴏʟᴇ
🎖️ 𝐀ʀᴍʏ - ꜱᴘᴇᴄɪᴀʟ ʀᴏʟᴇ
👤 𝐌ᴇᴍʙᴇʀ - ʙᴀꜱɪᴄ ᴀᴄᴄᴇꜱꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 💎 VIP ====================
    vip: async (api, event, args, config) => {
        const db = getDB();
        const vips = db.vips[event.threadID] || [];
        
        let msg = `💎 𝐕𝐈𝐏 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (vips.length === 0) {
            msg += `✅ ɴᴏ ᴠɪᴘ ᴜꜱᴇʀꜱ`;
        } else {
            for (const id of vips) {
                try {
                    const user = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? null : ret[id])));
                    msg += `💎 ${user ? user.name : "Unknown"}\n`;
                } catch (e) {}
            }
        }
        
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${vips.length}${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== ➕ ADDVIP ====================
    addvip: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /addvip @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (!db.vips[event.threadID]) db.vips[event.threadID] = [];
        
        if (db.vips[event.threadID].includes(t)) {
            return api.sendMessage(`⚠️ ᴀʟʀᴇᴀᴅʏ ᴀ ᴠɪᴘ${timeFooter()}`, event.threadID);
        }
        
        db.vips[event.threadID].push(t);
        saveDB(db);
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.sendMessage(
            `💎 𝐍ᴇᴡ 𝐕𝐈𝐏 𝐀ᴅᴅᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🆔 ${t}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🗑️ DELVIP ====================
    delvip: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /delvip @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (db.vips[event.threadID]) {
            db.vips[event.threadID] = db.vips[event.threadID].filter(id => id !== t);
            saveDB(db);
        }
        
        api.sendMessage(`✅ 𝐕𝐈𝐏 𝐑ᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== 🤝 BROTHER ====================
    brother: async (api, event, args, config) => {
        const db = getDB();
        const brothers = db.brothers[event.threadID] || [];
        
        let msg = `🤝 𝐁ʀᴏᴛʜᴇʀ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (brothers.length === 0) {
            msg += `✅ ɴᴏ ʙʀᴏᴛʜᴇʀꜱ`;
        } else {
            for (const id of brothers) {
                try {
                    const user = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? null : ret[id])));
                    msg += `🤝 ${user ? user.name : "Unknown"}\n`;
                } catch (e) {}
            }
        }
        
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${brothers.length}${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== ➕ ADDBROTHER ====================
    addbrother: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /addbrother @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (!db.brothers[event.threadID]) db.brothers[event.threadID] = [];
        
        if (db.brothers[event.threadID].includes(t)) {
            return api.sendMessage(`⚠️ ᴀʟʀᴇᴀᴅʏ ᴀ ʙʀᴏᴛʜᴇʀ${timeFooter()}`, event.threadID);
        }
        
        db.brothers[event.threadID].push(t);
        saveDB(db);
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.sendMessage(
            `🤝 𝐍ᴇᴡ 𝐁ʀᴏᴛʜᴇʀ 𝐀ᴅᴅᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🆔 ${t}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🗑️ DELBROTHER ====================
    delbrother: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /delbrother @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (db.brothers[event.threadID]) {
            db.brothers[event.threadID] = db.brothers[event.threadID].filter(id => id !== t);
            saveDB(db);
        }
        
        api.sendMessage(`✅ 𝐁ʀᴏᴛʜᴇʀ 𝐑ᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
    },

    // ==================== 🎖️ ARMY ====================
    army: async (api, event, args, config) => {
        const db = getDB();
        const army = db.army[event.threadID] || [];
        
        let msg = `🎖️ 𝐀ʀᴍʏ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (army.length === 0) {
            msg += `✅ ɴᴏ ᴀʀᴍʏ ᴍᴇᴍʙᴇʀꜱ`;
        } else {
            for (const id of army) {
                try {
                    const user = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? null : ret[id])));
                    msg += `🎖️ ${user ? user.name : "Unknown"}\n`;
                } catch (e) {}
            }
        }
        
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${army.length}${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== ➕ ADDARMY ====================
    addarmy: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /addarmy @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (!db.army[event.threadID]) db.army[event.threadID] = [];
        
        if (db.army[event.threadID].includes(t)) {
            return api.sendMessage(`⚠️ ᴀʟʀᴇᴀᴅʏ ɪɴ ᴀʀᴍʏ${timeFooter()}`, event.threadID);
        }
        
        db.army[event.threadID].push(t);
        saveDB(db);
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.sendMessage(
            `🎖️ 𝐍ᴇᴡ 𝐀ʀᴍʏ 𝐌ᴇᴍʙᴇʀ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🆔 ${t}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🗑️ DELARMY ====================
    delarmy: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /delarmy @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (db.army[event.threadID]) {
            db.army[event.threadID] = db.army[event.threadID].filter(id => id !== t);
            saveDB(db);
        }
        
        api.sendMessage(`✅ 𝐀ʀᴍʏ 𝐌ᴇᴍʙᴇʀ 𝐑ᴇᴍᴏᴠᴇᴅ${timeFooter()}`, event.threadID);
    }

};