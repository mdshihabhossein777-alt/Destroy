const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    sendAdvancedGif, sleep, SLOW_MODE 
} = require('../utils');

module.exports = {

    // ==================== 📊 GROUPINFO ====================
    groupinfo: async (api, event) => {
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("❌ 𝐅ᴀɪʟᴇᴅ ᴛᴏ ʟᴏᴀᴅ" + timeFooter(), event.threadID);

            const msg = `📊 𝐆ʀᴏᴜᴘ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
📌 𝐍ᴀᴍᴇ: ${info.threadName}
👥 𝐌ᴇᴍʙᴇʀꜱ: ${info.participantIDs.length}
👑 𝐀ᴅᴍɪɴꜱ: ${info.adminIDs.length}
🆔 𝐆ʀᴏᴜᴘ 𝐈ᴅ: ${event.threadID}
📅 𝐂ʀᴇᴀᴛᴇᴅ: ${info.timestamp ? new Date(info.timestamp * 1000).toLocaleDateString() : "Unknown"}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;

            api.sendMessage(msg, event.threadID);
        } catch (e) {
            api.sendMessage("❌ 𝐄ʀʀᴏʀ" + timeFooter(), event.threadID);
        }
    },

    // ==================== 👥 MEMBERS ====================
    members: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;

            const msg = `👥 𝐌ᴇᴍʙᴇʀ 𝐒ᴛᴀᴛɪꜱᴛɪᴄꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
📊 𝐓ᴏᴛᴀʟ 𝐌ᴇᴍʙᴇʀꜱ: ${info.participantIDs.length}
👑 𝐓ᴏᴛᴀʟ 𝐀ᴅᴍɪɴꜱ: ${info.adminIDs.length}
👤 𝐑ᴇɢᴜʟᴀʀ: ${info.participantIDs.length - info.adminIDs.length}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;

            api.sendMessage(msg, event.threadID);
        } catch (e) {}
    },

    // ==================== 👑 ADMINS ====================
    admins: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;

            let msg = `👑 𝐀ᴅᴍɪɴ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            const mentions = [];
            const botID = api.getCurrentUserID();

            for (let i = 0; i < info.adminIDs.length; i++) {
                const adminID = info.adminIDs[i].id;
                try {
                    const user = await new Promise(r => api.getUserInfo(adminID, (e, ret) => r(e ? null : ret[adminID])));
                    const name = user ? user.name : "Unknown";
                    
                    if (adminID === botID) {
                        msg += `${i + 1}. 🤖 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ (ʙᴏᴛ)\n`;
                    } else {
                        msg += `${i + 1}. 👑 @${name}\n`;
                        mentions.push({ tag: name, id: adminID });
                    }
                } catch (e) {
                    msg += `${i + 1}. 🆔 ${adminID}\n`;
                }
            }

            msg += `━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${info.adminIDs.length}${timeFooter()}`;

            api.sendMessage({ body: msg, mentions }, event.threadID);
        } catch (e) {}
    },

    // ==================== 📋 ADMINLIST ====================
    adminlist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;

            let msg = `📋 𝐀ᴅᴍɪɴ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            const mentions = [];

            for (const admin of info.adminIDs) {
                try {
                    const user = await new Promise(r => api.getUserInfo(admin.id, (e, ret) => r(e ? null : ret[admin.id])));
                    const name = user ? user.name : "Unknown";
                    msg += `👑 @${name}\n`;
                    mentions.push({ tag: name, id: admin.id });
                } catch (e) {}
            }

            msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;

            api.sendMessage({ body: msg, mentions }, event.threadID);
        } catch (e) {}
    },

    // ==================== 📢 TAGALL ====================
    tagall: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;

            const botID = api.getCurrentUserID();
            const members = info.participantIDs.filter(id => id !== botID);
            const mentions = [];

            let msg = `📢 𝐀ᴛᴛᴇɴᴛɪᴏɴ 𝐄ᴠᴇʀʏᴏɴᴇ!\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;

            for (const memberID of members) {
                try {
                    const user = await new Promise(r => api.getUserInfo(memberID, (e, ret) => r(e ? null : ret[memberID])));
                    if (user) {
                        msg += `@${user.name} `;
                        mentions.push({ tag: user.name, id: memberID });
                    }
                } catch (e) {}
            }

            msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `👥 𝐓ᴏᴛᴀʟ: ${info.participantIDs.length}\n`;
            msg += `📌 𝐆ʀᴏᴜᴘ: ${info.threadName}${timeFooter()}`;

            api.sendMessage({ body: msg, mentions }, event.threadID);
        } catch (e) {
            api.sendMessage("❌ 𝐓ᴀɢ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ==================== 👑 TAGADMIN ====================
    tagadmin: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;

            const mentions = [];
            let msg = `👑 𝐀ᴛᴛᴇɴᴛɪᴏɴ 𝐀ᴅᴍɪɴꜱ!\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;

            for (const admin of info.adminIDs) {
                try {
                    const user = await new Promise(r => api.getUserInfo(admin.id, (e, ret) => r(e ? null : ret[admin.id])));
                    if (user) {
                        msg += `@${user.name} `;
                        mentions.push({ tag: user.name, id: admin.id });
                    }
                } catch (e) {}
            }

            msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `📌 𝐆ʀᴏᴜᴘ: ${info.threadName}${timeFooter()}`;

            api.sendMessage({ body: msg, mentions }, event.threadID);
        } catch (e) {
            api.sendMessage("❌ 𝐓ᴀɢ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ==================== 📜 RULES ====================
    rules: (api, event) => {
        const db = getDB();
        const rules = db.groups[event.threadID]?.rules || 
`╔══════════════════════════════════╗
   🌸 𝐆𝐑𝐎𝐔𝐏 𝐑𝐔𝐋𝐄𝐒 🌸
╚══════════════════════════════════╝

1️⃣ 𝐑ᴇꜱᴘᴇᴄᴛ ᴇᴠᴇʀʏᴏɴᴇ
2️⃣ 𝐍ᴏ ꜱᴘᴀᴍᴍɪɴɢ
3️⃣ 𝐍ᴏ ʙᴀᴅ ᴡᴏʀᴅꜱ
4️⃣ 𝐍ᴏ ʟɪɴᴋꜱ ᴡɪᴛʜᴏᴜᴛ ᴘᴇʀᴍɪꜱꜱɪᴏɴ
5️⃣ 𝐅ᴏʟʟᴏᴡ ᴀᴅᴍɪɴ ɪɴꜱᴛʀᴜᴄᴛɪᴏɴꜱ

🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ`;

        api.sendMessage(
            `📜 𝐆ʀᴏᴜᴘ 𝐑ᴜʟᴇꜱ\n━━━━━━━━━━━━━━━━━━━━━━━━\n${rules}\n━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 👤 WHOIS ====================
    whois: async (api, event, args) => {
        const t = Object.keys(event.mentions || {})[0] || event.senderID;
        
        try {
            const user = await new Promise(r => api.getUserInfo(t, (e, ret) => r(e ? null : ret[t])));
            if (!user) return api.sendMessage("❌ 𝐔ꜱᴇʀ ɴᴏᴛ ꜰᴏᴜɴᴅ" + timeFooter(), event.threadID);

            const db = getDB();
            const userData = db.users?.[t] || { points: 0, coins: 0 };
            
            // রোল চেক
            let role = "👤 Member";
            if (t === config.owner) role = "👑 Owner";
            else if (config.botAdmins?.includes(t)) role = "🛡️ Bot Admin";
            else if (db.vips[event.threadID]?.includes(t)) role = "💎 VIP";
            else if (db.brothers[event.threadID]?.includes(t)) role = "🤝 Brother";
            else if (db.army[event.threadID]?.includes(t)) role = "🎖️ Army";

            const msg = `👤 𝐔ꜱᴇʀ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
📛 𝐍ᴀᴍᴇ: ${user.name}
🆔 𝐔ɪᴅ: ${t}
🎭 𝐑ᴏʟᴇ: ${role}
⭐ 𝐏ᴏɪɴᴛꜱ: ${userData.points || 0}
💰 𝐂ᴏɪɴꜱ: ${userData.coins || 0}
🔗 𝐋ɪɴᴋ: https://facebook.com/${t}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;

            api.sendMessage(msg, event.threadID);
        } catch (e) {
            api.sendMessage("❌ 𝐄ʀʀᴏʀ" + timeFooter(), event.threadID);
        }
    }

};