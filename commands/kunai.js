const axios = require('axios');
const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    sendAdvancedGif 
} = require('../utils');

module.exports = {

    // ==================== 💬 SAY ====================
    say: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const m = args.join(" ");
        if (!m) return api.sendMessage(`ᴜꜱᴀɢᴇ: /say [ᴛᴇxᴛ]${timeFooter()}`, event.threadID);
        
        api.sendMessage(m, event.threadID);
    },

    // ==================== 📊 POLL ====================
    poll: (api, event, args) => {
        const q = args.join(" ") || "Your opinion?";
        
        api.sendMessage(
            `📊 𝐏ᴏʟʟ
━━━━━━━━━━━━━━━━━━━━━━━━
❓ ${q}
━━━━━━━━━━━━━━━━━━━━━━━━
👍 𝐘ᴇꜱ
👎 𝐍ᴏ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📥 VID ====================
    vid: async (api, event, args) => {
        if (!args[0]) return api.sendMessage(`ᴜꜱᴀɢᴇ: /vid [ʟɪɴᴋ]${timeFooter()}`, event.threadID);
        
        api.sendMessage(
            `📥 𝐕ɪᴅᴇᴏ 𝐃ᴏᴡɴʟᴏᴀᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
🔗 ${args[0]}
⏳ ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ...
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📖 INFO ====================
    info: async (api, event, args) => {
        const q = args.join(" ");
        if (!q) return api.sendMessage(`ᴜꜱᴀɢᴇ: /info [ǫᴜᴇʀʏ]${timeFooter()}`, event.threadID);
        
        try {
            const res = await axios.get(`https://api.popcat.xyz/wikipedia/${encodeURIComponent(q)}`, { timeout: 8000 });
            const text = res.data?.text?.slice(0, 400) || "ɴᴏ ɪɴꜰᴏ";
            
            api.sendMessage(
                `📖 𝐈ɴꜰᴏ: ${q}
━━━━━━━━━━━━━━━━━━━━━━━━
${text}...${timeFooter()}`,
                event.threadID
            );
        } catch (e) {
            api.sendMessage("❌ 𝐈ɴꜰᴏ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ==================== 🌤️ WEATHER ====================
    weather: async (api, event, args) => {
        const city = args.join(" ") || "Dhaka";
        
        try {
            const res = await axios.get(`https://wttr.in/${city}?format=j1`, { timeout: 8000 });
            const c = res.data.current_condition[0];
            
            api.sendMessage(
                `🌤️ 𝐖ᴇᴀᴛʜᴇʀ - ${city}
━━━━━━━━━━━━━━━━━━━━━━━━
🌡️ 𝐓ᴇᴍᴘ: ${c.temp_C}°C
💧 𝐇ᴜᴍɪᴅɪᴛʏ: ${c.humidity}%
💨 𝐖ɪɴᴅ: ${c.windspeedKmph} km/h
☁️ ${c.weatherDesc[0].value}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } catch (e) {
            api.sendMessage("❌ 𝐖ᴇᴀᴛʜᴇʀ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ==================== 📊 STATS ====================
    stats: async (api, event) => {
        const db = getDB();
        const totalUsers = Object.keys(db.users || {}).length;
        const totalGroups = Object.keys(db.groups || {}).length;
        const totalWarnings = Object.values(db.warnings || {}).reduce((sum, g) => sum + Object.keys(g).length, 0);
        
        api.sendMessage(
            `📊 𝐁ᴏᴛ 𝐒ᴛᴀᴛɪꜱᴛɪᴄꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
👥 𝐓ᴏᴛᴀʟ 𝐔ꜱᴇʀꜱ: ${totalUsers}
🏴 𝐓ᴏᴛᴀʟ 𝐆ʀᴏᴜᴘꜱ: ${totalGroups}
⚠️ 𝐓ᴏᴛᴀʟ 𝐖ᴀʀɴɪɴɢꜱ: ${totalWarnings}
⏱️ 𝐔ᴘᴛɪᴍᴇ: ${Math.floor(process.uptime() / 60)} ᴍɪɴᴜᴛᴇꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📊 MEMBERCOUNT ====================
    membercount: async (api, event) => {
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;
            
            api.sendMessage(
                `👥 𝐌ᴇᴍʙᴇʀ 𝐂ᴏᴜɴᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
📊 𝐓ᴏᴛᴀʟ: ${info.participantIDs.length}
👑 𝐀ᴅᴍɪɴꜱ: ${info.adminIDs.length}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } catch (e) {}
    },

    // ==================== 🆔 ID ====================
    id: async (api, event, args) => {
        const t = Object.keys(event.mentions || {})[0];
        
        if (t) {
            const user = await new Promise(r => api.getUserInfo(t, (e, ret) => r(e ? null : ret[t])));
            api.sendMessage(
                `🆔 𝐔ꜱᴇʀ 𝐈ᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${user ? user.name : "Unknown"}
🆔 ${t}
🔗 https://facebook.com/${t}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } else {
            api.sendMessage(
                `🆔 𝐆ʀᴏᴜᴘ 𝐈ᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
🏴 ${event.threadID}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }
    },

    // ==================== 📢 ANNOUNCE ====================
    announce: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const msg = args.join(" ");
        if (!msg) return api.sendMessage(`ᴜꜱᴀɢᴇ: /announce [ᴍᴇꜱꜱᴀɢᴇ]${timeFooter()}`, event.threadID);
        
        api.sendMessage(
            `📢 𝐀ɴɴᴏᴜɴᴄᴇᴍᴇɴᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
${msg}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    }

};