const axios = require('axios');
const { 
    getDB, saveDB, timeFooter, sendAdvancedGif, getDhakaTime,
    healthCheck, getOwnerList, getAdminList, getUserRole
} = require('../utils');

module.exports = {

    // ==================== 🌸 HELP ====================
    help: async (api, event, args, config) => {
        try {
            const threadInfo = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            const groupName = threadInfo?.threadName || config.groupName || "SAYONARA NO MERCY - さよなら";
            const userRole = await getUserRole(api, event, config);

            const msg = `╔══════════════════════════════════╗
   💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ 💀
        𝐇ᴇʟᴘ 𝐌ᴇɴᴜ
╚══════════════════════════════════╝

🏴 𝐆ʀᴏᴜᴘ: ${groupName}
👨‍💻 𝐃ᴇᴠ: ${config.developer}
🌸 𝐁ᴏᴛ: 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ
⚙️ 𝐕ᴇʀꜱɪᴏɴ: ${config.version}
🎭 𝐘ᴏᴜʀ 𝐑ᴏʟᴇ: ${userRole}

━━━━━━━━━━━━━━━━━━━━━━━━
📖 𝐏ᴀɢᴇ 𝐂ᴏᴍᴍᴀɴᴅꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
📄 /page1 - ᴄᴏʀᴇ ᴄᴍᴅꜱ
📄 /page2 - ᴍᴇᴍʙᴇʀ ᴄᴍᴅꜱ
📄 /page3 - ꜰᴜɴ ᴄᴍᴅꜱ
📄 /page4 - ᴘʀᴀɴᴋ ᴄᴍᴅꜱ
📄 /page5 - ɢʀᴏᴜᴘ ᴄᴍᴅꜱ
📄 /page6 - ᴍᴏᴅᴇʀᴀᴛɪᴏɴ
📄 /page7 - ꜱᴇᴄᴜʀɪᴛʏ
📄 /page8 - ʀᴏʟᴇ ᴄᴍᴅꜱ

━━━━━━━━━━━━━━━━━━━━━━━━
🚀 𝐐ᴜɪᴄᴋ 𝐂ᴏᴍᴍᴀɴᴅꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
/ping - ʙᴏᴛ ꜱᴛᴀᴛᴜꜱ
/uid - ʏᴏᴜʀ ɪᴅ
/time - ᴅʜᴀᴋᴀ ᴛɪᴍᴇ
/owner - ᴏᴡɴᴇʀ ɪɴꜰᴏ
/rules - ɢʀᴏᴜᴘ ʀᴜʟᴇꜱ

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ
👨‍💻 𝐃ᴇᴠ: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;

            await sendAdvancedGif(api, event, msg, 'itachi');
        } catch (e) {
            api.sendMessage("❌ Help failed" + timeFooter(), event.threadID);
        }
    },

    // ==================== 📖 PAGE 1 ====================
    page1: async (api, event) => {
        const msg = `📖 𝐏𝐀𝐆𝐄 𝟏 - 𝐂ᴏʀᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
🧩 𝐂ᴏʀᴇ
/help /ping /uid /time
/owner /botinfo /groupinfo
/rules /rank /leaderboard /afk

💰 𝐄ᴄᴏɴᴏᴍʏ
/balance /daily /top

🎮 𝐅ᴜɴ
/pair /ship /meme
/8ball /roast /truth /dare

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 📖 PAGE 2 ====================
    page2: async (api, event) => {
        const msg = `📖 𝐏𝐀𝐆𝐄 𝟐 - 𝐌ᴇᴍʙᴇʀ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐌ᴇᴍʙᴇʀ 𝐂ᴏᴍᴍᴀɴᴅꜱ
/balance - ᴄʜᴇᴄᴋ ᴄᴏɪɴꜱ
/daily - ᴅᴀɪʟʏ ʀᴇᴡᴀʀᴅ
/top - ᴛᴏᴘ ʀɪᴄʜ ᴜꜱᴇʀꜱ
/rank - ʏᴏᴜʀ ʀᴀɴᴋ
/leaderboard - ᴛᴏᴘ 10
/afk - ꜱᴇᴛ ᴀꜰᴋ

━━━━━━━━━━━━━━━━━━━━━━━━
💡 ᴛʏᴘᴇ /help ꜰᴏʀ ᴍᴏʀᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 📖 PAGE 3 ====================
    page3: async (api, event) => {
        const msg = `📖 𝐏𝐀𝐆𝐄 𝟑 - 𝐅ᴜɴ
━━━━━━━━━━━━━━━━━━━━━━━━
🎮 𝐅ᴜɴ 𝐂ᴏᴍᴍᴀɴᴅꜱ
/pair - ᴍᴀᴛᴄʜᴍᴀᴋɪɴɢ
/ship - ʟᴏᴠᴇ ᴄᴀʟᴄᴜʟᴀᴛᴏʀ
/meme - ʀᴀɴᴅᴏᴍ ᴍᴇᴍᴇ
/8ball - ᴍᴀɢɪᴄ 8-ʙᴀʟʟ
/roast - ʀᴏᴀꜱᴛ ᴜꜱᴇʀ
/truth - ᴛʀᴜᴛʜ Qᴜᴇꜱᴛɪᴏɴ
/dare - ᴅᴀʀᴇ ᴄʜᴀʟʟᴇɴɢᴇ

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 📖 PAGE 4 ====================
    page4: async (api, event) => {
        const msg = `📖 𝐏𝐀𝐆𝐄 𝟒 - 𝐏ʀᴀɴᴋ
━━━━━━━━━━━━━━━━━━━━━━━━
🎭 𝐏ʀᴀɴᴋ (100% FAKE)
/stalk - ᴛʀᴀᴄᴋ ᴜꜱᴇʀ
/crack - ᴄʀᴀᴄᴋ ᴘᴀꜱꜱᴡᴏʀᴅ
/trace - ᴛʀᴀᴄᴇ ɪᴘ
/fbi - ꜰʙɪ ꜱᴇᴀʀᴄʜ
/hack - ʜᴀᴄᴋ ᴀᴄᴄᴏᴜɴᴛ
/darkweb - ᴅᴀʀᴋ ᴡᴇʙ
/expose - ᴇxᴘᴏꜱᴇ ᴜꜱᴇʀ
/bankhack - ʙᴀɴᴋ ʜᴀᴄᴋ
/camera - ᴄᴀᴍᴇʀᴀ ᴀᴄᴄᴇꜱꜱ
/gallery - ɢᴀʟʟᴇʀʏ
/callhack - ᴄᴀʟʟ ʜᴀᴄᴋ
/ddos - ᴅᴅᴏꜱ ᴀᴛᴛᴀᴄᴋ

━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ᴀʟʟ ᴘʀᴀɴᴋꜱ 100% ꜰᴀᴋᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 📖 PAGE 5 ====================
    page5: async (api, event) => {
        const msg = `📖 𝐏𝐀𝐆𝐄 𝟓 - 𝐆ʀᴏᴜᴘ
━━━━━━━━━━━━━━━━━━━━━━━━
📊 𝐆ʀᴏᴜᴘ 𝐈ɴꜰᴏ
/members /adminlist
/tagall /tagadmin
/groupinfo /rules

⚔️ 𝐌ᴏᴅᴇʀᴀᴛɪᴏɴ
/kick /ban /unban
/warn /warnlist
/setrole /removerole

🔒 𝐋ᴏᴄᴋ 𝐒ʏꜱᴛᴇᴍ
/lockname /lockphoto /locknick
/antlink /antigali /antisticker
/antigif /antiphone
/slowmode /blacklist

🏷️ 𝐍ɪᴄᴋɴᴀᴍᴇ
/autonick /resetnick /massnick

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 📖 PAGE 6 ====================
    page6: async (api, event) => {
        const msg = `📖 𝐏𝐀𝐆𝐄 𝟔 - 𝐌ᴏᴅᴇʀᴀᴛɪᴏɴ
━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ 𝐊ɪᴄᴋ 𝐒ʏꜱᴛᴇᴍ
/kick @user - ᴋɪᴄᴋ ᴜꜱᴇʀ
/autokick on/off
/kickdetect on/off
/kickwarn on/off
/kicklog - ᴋɪᴄᴋ ʜɪꜱᴛᴏʀʏ

🔨 𝐖ᴀʀɴ 𝐒ʏꜱᴛᴇᴍ
/warn @user
/warnlist
/clearwarn @user
/warnlimit

🚫 𝐁ᴀɴ 𝐒ʏꜱᴛᴇᴍ
/ban @user
/unban @user
/banlist

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 📖 PAGE 7 ====================
    page7: async (api, event) => {
        const msg = `📖 𝐏𝐀𝐆𝐄 𝟕 - 𝐒ᴇᴄᴜʀɪᴛʏ
━━━━━━━━━━━━━━━━━━━━━━━━
🔥 𝐌ᴀꜱᴛᴇʀ
/security on/off
/war on/off

🛡️ 𝐒ᴇᴄᴜʀɪᴛʏ
/antispam /antiflood
/antilink /antitag
/antibot /antiraid
/antidup /capslock
/slowmode /warnlimit
/securitylog

🤖 𝐁ᴏᴛ 𝐃ᴇᴛᴇᴄᴛ
/botdetect /botcheck
/botlist /botlog
/botprotect
/botthreshold
/botreview
/botclear

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 📖 PAGE 8 ====================
    page8: async (api, event) => {
        const msg = `📖 𝐏𝐀𝐆𝐄 𝟖 - 𝐑ᴏʟᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
👥 𝐑ᴏʟᴇ 𝐒ʏꜱᴛᴇᴍ
/role - ꜱʜᴏᴡ ʀᴏʟᴇ
/roles - ᴀʟʟ ʀᴏʟᴇꜱ
/setrole @user [role]
/delrole @user
/roleinfo - ʀᴏʟᴇ ᴘᴇʀᴍꜱ
/whois @user - ᴜꜱᴇʀ ɪɴꜰᴏ

💎 𝐕𝐈𝐏 𝐒ʏꜱᴛᴇᴍ
/vip - ᴠɪᴘ ɪɴꜰᴏ
/addvip @user
/delvip @user
/vips - ᴠɪᴘ ʟɪꜱᴛ

🤝 𝐁𝐫𝐨𝐭𝐡𝐞𝐫 𝐒ʏꜱᴛᴇᴍ
/brother - ɪɴꜰᴏ
/addbrother @user
/delbrother @user
/brothers - ʟɪꜱᴛ

🎖️ 𝐀ʀᴍʏ 𝐒ʏꜱᴛᴇᴍ
/army - ɪɴꜰᴏ
/addarmy @user
/delarmy @user
/armylist - ʟɪꜱᴛ

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 🏓 PING ====================
    ping: (api, event) => {
        const start = Date.now();
        api.sendMessage("🏓 𝐏ᴏɴɢ", event.threadID, () => {
            api.sendMessage(
                `⚡ 𝐑ᴇꜱᴘᴏɴꜱᴇ: ${Date.now() - start}ᴍꜱ${timeFooter()}`,
                event.threadID
            );
        });
    },

    // ==================== 🆔 UID ====================
    uid: async (api, event) => {
        const mentions = Object.keys(event.mentions || {});
        if (mentions.length > 0) {
            for (const id of mentions) {
                const name = event.mentions[id].replace('@', '');
                api.sendMessage(
                    `🌸 𝐔ꜱᴇʀ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐍ᴀᴍᴇ: ${name}
🆔 𝐔ɪᴅ: ${id}
🔗 𝐋ɪɴᴋ: https://facebook.com/${id}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                    event.threadID
                );
            }
        } else {
            const info = await new Promise(r => api.getUserInfo(event.senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[event.senderID])));
            api.sendMessage(
                `🌸 𝐘ᴏᴜʀ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐍ᴀᴍᴇ: ${info.name}
🆔 𝐔ɪᴅ: ${event.senderID}
🔗 𝐋ɪɴᴋ: https://facebook.com/${event.senderID}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }
    },

    // ==================== 🕐 TIME ====================
    time: async (api, event) => {
        const time = getDhakaTime();
        api.sendMessage(
            `🌸 𝐃𝐇𝐀𝐊𝐀 𝐓𝐈𝐌𝐄
━━━━━━━━━━━━━━━━━━━━━━━━
⏰ ${time}
🗾 𝐓ɪᴍᴇᴢᴏɴᴇ: Asia/Dhaka
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 👑 OWNER ====================
    owner: async (api, event, args, config) => {
        const ownerList = getOwnerList(config);
        
        let ownerNames = [];
        for (const id of ownerList) {
            try {
                const info = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? null : ret[id])));
                if (info && info.name) ownerNames.push(`👑 ${info.name}\n   🆔 ${id}`);
            } catch (e) {}
        }

        const msg = `🌸 𝐎ᴡɴᴇʀ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐍ᴀᴍᴇ: Ariyan Shihab
🌹 𝐍ɪᴄᴋ: sexy shihab
🎂 𝐀ɢᴇ: 21+
📚 𝐏ʀᴏꜰᴇꜱꜱɪᴏɴ: Student
📍 𝐋ᴏᴄᴀᴛɪᴏɴ: Naoagon, BD

━━━━━━━━━━━━━━━━━━━━━━━━
📘 𝐅ᴀᴄᴇʙᴏᴏᴋ: fb.com/mdshihabofc
💬 𝐌ᴇꜱꜱᴇɴɢᴇʀ: m.me/mdshihabofc

━━━━━━━━━━━━━━━━━━━━━━━━
📊 𝐓ᴏᴛᴀʟ 𝐎ᴡɴᴇʀꜱ: ${ownerList.length}
━━━━━━━━━━━━━━━━━━━━━━━━
${ownerNames.join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 🤖 BOTINFO ====================
    botinfo: (api, event, args, config) => {
        const up = process.uptime();
        const h = Math.floor(up / 3600);
        const m = Math.floor((up % 3600) / 60);
        
        const msg = `🌸 𝐁ᴏᴛ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
🤖 𝐍ᴀᴍᴇ: ${config.botName}
⚙️ 𝐕ᴇʀꜱɪᴏɴ: ${config.version}
📦 𝐂ᴏᴍᴍᴀɴᴅꜱ: 110+
⏱️ 𝐔ᴘᴛɪᴍᴇ: ${h}ʜ ${m}ᴍ
🛠️ 𝐃ᴇᴠ: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 📊 BOTSTATUS ====================
    botstatus: async (api, event, args, config) => {
        const health = healthCheck();
        const secCount = Object.keys(getDB().security?.[event.threadID] || {}).length;
        
        const msg = `🌸 𝐁ᴏᴛ 𝐒ᴛᴀᴛᴜꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🟢 𝐒ᴛᴀᴛᴜꜱ: ${health.status.toUpperCase()}
⏱️ 𝐔ᴘᴛɪᴍᴇ: ${health.uptimeHuman}
💾 𝐌ᴇᴍᴏʀʏ: ${health.memoryUsed}MB / ${health.memoryTotal}MB
🛡️ 𝐒ᴇᴄᴜʀɪᴛʏ: ${secCount} ᴀᴄᴛɪᴠᴇ
🕐 𝐓ɪᴍᴇ: ${health.time}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== ⏱️ UPTIME ====================
    uptime: async (api, event) => {
        const health = healthCheck();
        api.sendMessage(
            `⏱️ 𝐔ᴘᴛɪᴍᴇ: ${health.uptimeHuman}
🕐 𝐓ɪᴍᴇ: ${health.time}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📌 VERSION ====================
    version: async (api, event, args, config) => {
        api.sendMessage(
            `🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ
━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ 𝐕ᴇʀꜱɪᴏɴ: ${config.version}
📌 𝐏ʀᴇᴠɪᴏᴜꜱ: ${config.previousVersion || "V1.1"}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐀ʟᴡᴀʏꜱ 𝐀ᴄᴛɪᴠᴇ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🛠️ PREFIX ====================
    prefix: async (api, event, args, config) => {
        api.sendMessage(
            `🌸 𝐂ᴜʀʀᴇɴᴛ 𝐏ʀᴇꜰɪx: ${config.prefix}${timeFooter()}`,
            event.threadID
        );
    }

};
