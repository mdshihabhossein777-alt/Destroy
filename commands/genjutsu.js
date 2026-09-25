const axios = require('axios');
const { 
    timeFooter, sendAdvancedGif 
} = require('../utils');

module.exports = {

    // ==================== 🔍 STALK ====================
    stalk: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `🔍 𝐒ᴛᴀʟᴋɪɴɢ ${name}...
━━━━━━━━━━━━━━━━━━━━━━━━
📍 𝐋ᴏᴄᴀᴛɪᴏɴ: ꜱᴇᴀʀᴄʜɪɴɢ...
📱 𝐃ᴇᴠɪᴄᴇ: ᴅᴇᴛᴇᴄᴛɪɴɢ...
💻 𝐈ᴘ: ᴛʀᴀᴄɪɴɢ...
🌐 𝐎ɴʟɪɴᴇ: ʏᴇꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 💻 CRACK ====================
    crack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `💻 𝐂ʀᴀᴄᴋɪɴɢ ${name}...
━━━━━━━━━━━━━━━━━━━━━━━━
[████████░░] 80%
🔓 𝐁ʏᴘᴀꜱꜱɪɴɢ ꜱᴇᴄᴜʀɪᴛʏ...
🔐 𝐆ᴇᴛᴛɪɴɢ ᴘᴀꜱꜱᴡᴏʀᴅ...
✅ 𝐏ᴀꜱꜱᴡᴏʀᴅ: ********
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 📡 TRACE ====================
    trace: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `📡 𝐓ʀᴀᴄɪɴɢ ${name}...
━━━━━━━━━━━━━━━━━━━━━━━━
🌍 𝐈ᴘ: 192.***.***.***
📍 𝐋ᴏᴄᴀᴛɪᴏɴ: ᴅʜᴀᴋᴀ, ʙᴅ
📱 𝐃ᴇᴠɪᴄᴇ: ᴀɴᴅʀᴏɪᴅ
🔌 𝐈ꜱᴘ: ᴜɴᴋɴᴏᴡɴ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🚔 FBI ====================
    fbi: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `🚔 𝐅𝐁𝐈 𝐒ᴇᴀʀᴄʜ
━━━━━━━━━━━━━━━━━━━━━━━━
🔍 𝐓ᴀʀɢᴇᴛ: ${name}
📁 𝐂ᴀꜱᴇ: #${Math.floor(Math.random() * 999999)}
🚨 𝐒ᴛᴀᴛᴜꜱ: 𝐅ʟᴀɢɢᴇᴅ
⚠️ 𝐋ᴇᴠᴇʟ: 𝐇ɪɢʜ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 💻 HACK ====================
    hack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `💻 𝐇ᴀᴄᴋɪɴɢ ${name}...
━━━━━━━━━━━━━━━━━━━━━━━━
[██████░░░░] 60%
🔓 𝐁ʏᴘᴀꜱꜱɪɴɢ ꜰɪʀᴇᴡᴀʟʟ...
🔐 𝐁ʀᴜᴛᴇ-ꜰᴏʀᴄɪɴɢ...
✅ 𝐂ᴏᴍᴘʟᴇᴛᴇ!
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🌑 DARKWEB ====================
    darkweb: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `🌑 𝐃ᴀʀᴋ 𝐖ᴇʙ 𝐒ᴇᴀʀᴄʜ
━━━━━━━━━━━━━━━━━━━━━━━━
🔍 𝐒ᴇᴀʀᴄʜɪɴɢ: ${name}
🌐 𝐄ɴᴛᴇʀɪɴɢ 𝐓ᴏʀ...
🔐 𝐇ɪᴅᴅᴇɴ ꜱᴇʀᴠɪᴄᴇ: 𝐅ᴏᴜɴᴅ
💀 𝐃ᴀᴛᴀ: ɴᴏᴛ ꜰᴏᴜɴᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 😈 EXPOSE ====================
    expose: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `😈 𝐄xᴘᴏꜱɪɴɢ ${name}...
━━━━━━━━━━━━━━━━━━━━━━━━
🔍 𝐒ᴄᴀɴɴɪɴɢ ᴍᴇꜱꜱᴀɢᴇꜱ...
📸 𝐅ɪɴᴅɪɴɢ ꜱᴇᴄʀᴇᴛꜱ...
💬 𝐂ʜᴀᴛ ᴀɴᴀʟʏꜱɪꜱ: 𝐃ᴏɴᴇ
🚨 𝐍ᴏᴛʜɪɴɢ ꜰᴏᴜɴᴅ!
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🏦 BANKHACK ====================
    bankhack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `🏦 𝐁ᴀɴᴋ 𝐇ᴀᴄᴋ - ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
💳 𝐀ᴄᴄᴏᴜɴᴛ: ****${Math.floor(Math.random() * 9999)}
💰 𝐁ᴀʟᴀɴᴄᴇ: $${Math.floor(Math.random() * 99999)}
🔓 𝐀ᴄᴄᴇꜱꜱ: 𝐃ᴇɴɪᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ
⚠️ ɪʟʟᴇɢᴀʟ ɪɴ ʀᴇᴀʟ ʟɪꜰᴇ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 📸 CAMERA ====================
    camera: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `📸 𝐀ᴄᴄᴇꜱꜱɪɴɢ ${name}'ꜱ 𝐂ᴀᴍᴇʀᴀ...
━━━━━━━━━━━━━━━━━━━━━━━━
🎥 𝐂ᴀᴍᴇʀᴀ: 𝐀ᴄᴛɪᴠᴇ
📷 𝐂ᴀᴘᴛᴜʀɪɴɢ...
❌ 𝐀ᴄᴄᴇꜱꜱ 𝐃ᴇɴɪᴇᴅ ʙʏ ꜱᴇᴄᴜʀɪᴛʏ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🖼️ GALLERY ====================
    gallery: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `🖼️ 𝐀ᴄᴄᴇꜱꜱɪɴɢ ${name}'ꜱ 𝐆ᴀʟʟᴇʀʏ...
━━━━━━━━━━━━━━━━━━━━━━━━
📁 𝐋ᴏᴀᴅɪɴɢ...
🖼️ 𝐆ᴀʟʟᴇʀʏ: 𝐋ᴏᴄᴋᴇᴅ
🔒 𝐄ɴᴄʀʏᴘᴛɪᴏɴ: 𝐇ɪɢʜ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 📞 CALLHACK ====================
    callhack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `📞 𝐂ᴀʟʟ 𝐇ᴀᴄᴋ - ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
📱 𝐍ᴜᴍʙᴇʀ: +880 1***-******
☎️ 𝐒ᴛᴀᴛᴜꜱ: 𝐀ᴄᴛɪᴠᴇ
📞 𝐓ᴀᴘᴘɪɴɢ: ɪɴ ᴘʀᴏɢʀᴇꜱꜱ...
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 💥 DDOS ====================
    ddos: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `💥 𝐃ᴅᴏꜱ 𝐀ᴛᴛᴀᴄᴋ - ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
🎯 𝐓ᴀʀɢᴇᴛ: 𝐋ᴏᴄᴋᴇᴅ
⚡ 𝐒ᴇɴᴅɪɴɢ ᴘᴀᴄᴋᴇᴛꜱ: 1000/ꜱ
🔥 𝐒ᴇʀᴠᴇʀ: 𝐎ᴠᴇʀʟᴏᴀᴅᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ
⚠️ ɪʟʟᴇɢᴀʟ ɪɴ ʀᴇᴀʟ ʟɪꜰᴇ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🎭 FAKEINFO ====================
    fakeinfo: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `🎭 𝐅ᴀᴋᴇ 𝐈ɴꜰᴏ - ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
📱 𝐏ʜᴏɴᴇ: +880 1***-${Math.floor(Math.random() * 999999)}
🏠 𝐀ᴅᴅʀᴇꜱꜱ: ʜɪᴅᴅᴇɴ
💼 𝐉ᴏʙ: ꜱᴇᴄʀᴇᴛ
🎓 𝐄ᴅᴜᴄᴀᴛɪᴏɴ: ᴜɴᴋɴᴏᴡɴ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🔮 FUTURE ====================
    future: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const futures = [
            "Rich & Famous 💰",
            "Software Engineer 💻",
            "Doctor 👨‍⚕️",
            "Business Owner 💼",
            "World Traveler ✈️",
            "Famous YouTuber 🎬",
            "Still Single 💔"
        ];
        
        const future = futures[Math.floor(Math.random() * futures.length)];
        
        const msg = `🔮 𝐅ᴜᴛᴜʀᴇ 𝐏ʀᴇᴅɪᴄᴛɪᴏɴ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}'ꜱ ꜰᴜᴛᴜʀᴇ:
✨ ${future}
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 💀 CURSE ====================
    curse: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const curses = [
            "☠️ 7 days of bad luck!",
            "👻 Ghost will visit tonight!",
            "🐍 Snakes in dreams!",
            "💀 30 days no love!",
            "🌪️ Storm coming your way!"
        ];
        
        const curse = curses[Math.floor(Math.random() * curses.length)];
        
        const msg = `💀 𝐂ᴜʀꜱᴇ - ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
${curse}
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        await sendAdvancedGif(api, event, msg, 'sasuke');
    },

    // ==================== 🌪️ HURRICANE ====================
    hurricane: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        
        const msg = `🌪️ 𝐇ᴜʀʀɪᴄᴀɴᴇ 𝐀ʟᴇʀᴛ!
━━━━━━━━━━━━━━━━━━━━━━━━
🌍 𝐑ᴇɢɪᴏɴ: ${name}'ꜱ ʟᴏᴄᴀᴛɪᴏɴ
💨 𝐖ɪɴᴅ 𝐒ᴘᴇᴇᴅ: 250 ᴋᴍ/ʜ
⚠️ 𝐋ᴇᴠᴇʟ: 𝐂ᴀᴛᴇɢᴏʀʏ 5
🚨 𝐄ᴠᴀᴄᴜᴀᴛᴇ ɪᴍᴍᴇᴅɪᴀᴛᴇʟʏ!
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐓ʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ (100% ꜰᴀᴋᴇ)
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    }

};