const axios = require('axios');
const { getDB, saveDB, timeFooter, sendWithGif, fetchAnimeGif, guessGender, sendAdvancedGif } = require('../utils');

module.exports = {

    // ==================== HELP ====================
    help: async (api, event, args, config) => {
        const msg = `╔══════════════════════════════╗
   💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄𝐌
        HELP MENU
╚══════════════════════════════╝

📖 ᴘᴀɢᴇ 1 - ᴍᴇᴍʙᴇʀ
📖 ᴘᴀɢᴇ 2 - ꜰᴜɴ + ᴘʀᴀɴᴋ
📖 ᴘᴀɢᴇ 3 - ɢʀᴏᴜᴘ ᴀᴅᴍɪɴ
📖 ᴘᴀɢᴇ 4 - ꜱᴇᴄᴜʀɪᴛʏ

ᴜꜱᴇ: /page1 /page2 /page3 /page4

━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💻 ᴅᴇᴠ: ${config.developer}
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄𝐌${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    page1: async (api, event) => {
        const msg = `📖 PAGE 1 - MEMBER
━━━━━━━━━━━━━━━━━━━━━━━━
/help  /page1-4  /ping  /uid
/owner  /botinfo  /groupinfo
/rules  /rank  /leaderboard
/afk  /balance  /daily  /top
/pair  /ship  /meme  /8ball
/say  /poll  /vid

💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄𝐌${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    page2: async (api, event) => {
        const msg = `📖 PAGE 2 - FUN + PRANK
━━━━━━━━━━━━━━━━━━━━━━━━
/stalk  /info  /weather
/crack  /trace  /fbi  /hack
/darkweb  /expose  /bankhack
/camera  /gallery  /callhack
/ddos

⚠️ ᴀʟʟ ᴘʀᴀɴᴋꜱ 100% ꜰᴀᴋᴇ

💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    page3: async (api, event) => {
        const msg = `📖 PAGE 3 - GROUP ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━
/kick  /ban  /unban
/setrole  /removerole
/setrules  /warn  /warnlist
/lockname  /lockphoto  /locknick
/massnick  /autonick  /resetnick
/antlink  /antigali
/antisticker  /antigif  /antiphone
/blacklist  /slowmode

💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    page4: async (api, event) => {
        const msg = `📖 PAGE 4 - BRUTAL SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━
/security  /war
/antibot  /botscan  /botkill
/antiraid  /allmute  /allunmute
/lockall  /unlockall  /shield
/onlyadmin  /onlymod  /botlock
/botoff  /boton  /botlocklist
/addadmin  /removeadmin
/restart  /maintenance
/status  /active  /topignore
/welcome  /goodbye  /notify
/broadcast  /grouplist  /clearcache
/bothunt  /botdestroyer  /sayonara
/ainfo  /antibotauto  /sinfo  /sstatus

💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== CORE ====================
    ping: (api, event) => {
        const start = Date.now();
        api.sendMessage("🏓 ᴘᴏɴɢ", event.threadID, () => {
            api.sendMessage(`⚡ ʀᴇꜱᴘᴏɴꜱᴇ: ${Date.now() - start}ᴍꜱ${timeFooter()}`, event.threadID);
        });
    },

    uid: async (api, event) => {
        const mentions = Object.keys(event.mentions || {});
        if (mentions.length > 0) {
            for (const id of mentions) {
                const name = event.mentions[id].replace('@', '');
                api.sendMessage(`👤 ${name}\n🆔 ${id}\n🔗 https://facebook.com/${id}${timeFooter()}`, event.threadID);
            }
        } else {
            const info = await new Promise(r => api.getUserInfo(event.senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[event.senderID])));
            api.sendMessage(`👤 ${info.name}\n🆔 ${event.senderID}\n🔗 https://facebook.com/${event.senderID}${timeFooter()}`, event.threadID);
        }
    },

    owner: async (api, event, args, config) => {
        const msg = `👑 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Ariyan Shihab
🌹 কীট গোলাপ
🎂 21+ | 📚 Student
📍 Naoagon, Bangladesh
━━━━━━━━━━━━━━━━━━━━━━━━
📘 https://facebook.com/mdshihabofc
💬 https://m.me/mdshihabofc
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    botinfo: (api, event, args, config) => {
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60);
        const msg = `💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ ɪɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
🤖 ɴᴀᴍᴇ: ${config.botName}
⚙️ ᴠᴇʀꜱɪᴏɴ: ${config.version}
📦 ᴄᴏᴍᴍᴀɴᴅꜱ: 90+
⏱️ ᴜᴘᴛɪᴍᴇ: ${h}ʜ ${m}ᴍ
🛠️ ᴅᴇᴠ: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        api.sendMessage(msg, event.threadID);
    },

    groupinfo: async (api, event) => {
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return;
            api.sendMessage(`📊 𝐆𝐑𝐎𝐔𝐏 𝐈𝐍𝐅𝐎
━━━━━━━━━━━━━━━━━━━━━━━━
📌 ɴᴀᴍᴇ: ${info.threadName}
👥 ᴍᴇᴍʙᴇʀꜱ: ${info.participantIDs.length}
👑 ᴀᴅᴍɪɴꜱ: ${info.adminIDs.length}
🆔 ɪᴅ: ${event.threadID}${timeFooter()}`, event.threadID);
        });
    },

    rules: (api, event) => {
        const db = getDB();
        const rules = db.groups[event.threadID]?.rules || "ɴᴏ ʀᴜʟᴇꜱ ꜱᴇᴛ";
        api.sendMessage(`📜 𝐆𝐑𝐎𝐔𝐏 𝐑𝐔𝐋𝐄𝐒\n━━━━━━━━━━━━━━━━━━━━━━━━\n${rules}${timeFooter()}`, event.threadID);
    },

    rank: (api, event) => {
        const db = getDB();
        const user = db.users?.[event.senderID] || { points: 0 };
        api.sendMessage(`🏅 𝐘𝐎𝐔𝐑 𝐑𝐀𝐍𝐊\n━━━━━━━━━━━━━━━━━━━━━━━━\n👤 ᴘᴏɪɴᴛꜱ: ${user.points || 0}${timeFooter()}`, event.threadID);
    },

    leaderboard: (api, event) => {
        const db = getDB();
        const users = Object.entries(db.users || {}).sort((a, b) => (b[1].points || 0) - (a[1].points || 0)).slice(0, 10);
        let msg = "🏆 𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
        users.forEach((u, i) => { msg += `${i + 1}. ${u[0]}: ${u[1].points || 0}\n`; });
        api.sendMessage(msg + timeFooter(), event.threadID);
    },

    afk: async (api, event, args) => {
        const db = getDB();
        if (!db.afk) db.afk = {};
        const reason = args.join(" ") || "AFK";
        db.afk[event.senderID] = { reason, time: Date.now() };
        saveDB(db);
        api.sendMessage(`💤 𝐀𝐅𝐊 ᴀᴄᴛɪᴠᴀᴛᴇᴅ\n📝 ʀᴇᴀꜱᴏɴ: ${reason}${timeFooter()}`, event.threadID);
    },

    // ==================== ECONOMY ====================
    balance: (api, event) => {
        const db = getDB();
        const user = db.users?.[event.senderID] || { coins: 0 };
        api.sendMessage(`💰 𝐘𝐎𝐔𝐑 𝐁𝐀𝐋𝐀𝐍𝐂𝐄\n━━━━━━━━━━━━━━━━━━━━━━━━\n💎 ᴄᴏɪɴꜱ: ${user.coins || 0}${timeFooter()}`, event.threadID);
    },

    daily: async (api, event) => {
        const db = getDB();
        if (!db.users) db.users = {};
        if (!db.users[event.senderID]) db.users[event.senderID] = { coins: 0, lastDaily: 0 };
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - (db.users[event.senderID].lastDaily || 0) < oneDay) {
            const rem = Math.ceil((oneDay - (now - db.users[event.senderID].lastDaily)) / 3600000);
            return api.sendMessage(`⏳ ᴛʀʏ ᴀɢᴀɪɴ ɪɴ ${rem}ʜ${timeFooter()}`, event.threadID);
        }
        db.users[event.senderID].lastDaily = now;
        db.users[event.senderID].coins = (db.users[event.senderID].coins || 0) + 500;
        saveDB(db);
        api.sendMessage(`✅ ᴄʟᴀɪᴍᴇᴅ 500 ᴄᴏɪɴꜱ!\n💰 ᴛᴏᴛᴀʟ: ${db.users[event.senderID].coins}${timeFooter()}`, event.threadID);
    },

    top: (api, event) => {
        const db = getDB();
        const users = Object.entries(db.users || {}).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0)).slice(0, 5);
        let msg = "🏆 𝐓𝐎𝐏 𝐑𝐈𝐂𝐇\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
        users.forEach((u, i) => { msg += `${i + 1}. ${u[0]}: ${u[1].coins || 0} 💎\n`; });
        api.sendMessage(msg + timeFooter(), event.threadID);
    },

    // ==================== FUN ====================
    pair: async (api, event) => {
        try {
            const db = getDB();
            const tid = event.threadID;
            const sid = event.senderID;
            const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("❌ Failed" + timeFooter(), tid);

            const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            if (!db.groups[tid]) db.groups[tid] = {};
            if (!db.groups[tid].genders) db.groups[tid].genders = {};
            const genders = db.groups[tid].genders;

            const males = [], females = [];
            for (const m of members) {
                if (genders[m] === "male") males.push(m);
                else if (genders[m] === "female") females.push(m);
                else {
                    const u = await new Promise(r => api.getUserInfo(m, (e, ret) => r(e ? null : ret[m])));
                    let g = null;
                    if (u?.gender === 2) g = "male";
                    else if (u?.gender === 1) g = "female";
                    else if (u?.name) g = guessGender(u.name);
                    if (g) { genders[m] = g; if (g === "male") males.push(m); else females.push(m); }
                }
            }
            saveDB(db);

            const sG = genders[sid];
            const sInfo = await new Promise(r => api.getUserInfo(sid, (e, ret) => r(e ? { name: "You" } : ret[sid])));
            if (!sG) return api.sendMessage("⚠️ Cannot detect gender" + timeFooter(), tid);

            const partnerList = (sG === "male") ? females.filter(id => id !== sid) : males.filter(id => id !== sid);
            if (partnerList.length === 0) return api.sendMessage(`⚠️ No ${sG === "male" ? "girls" : "boys"}!${timeFooter()}`, tid);

            const partner = partnerList[Math.floor(Math.random() * partnerList.length)];
            const pInfo = await new Promise(r => api.getUserInfo(partner, (e, ret) => r(e ? { name: "Unknown" } : ret[partner])));
            const comp = Math.floor(Math.random() * 41) + 60;

            const e1 = sG === "male" ? "👦" : "👧";
            const e2 = sG === "male" ? "👧" : "👦";
            const msg = `💕 𝐌𝐀𝐓𝐂𝐇𝐌𝐀𝐊𝐈𝐍𝐆 💕
━━━━━━━━━━━━━━━━━━━━━━━━
${e1} ${sInfo.name}
       ❤️
${e2} ${pInfo.name}
━━━━━━━━━━━━━━━━━━━━━━━━
💖 ᴄᴏᴍᴘᴀᴛɪʙɪʟɪᴛʏ: ${comp}%
${comp >= 90 ? "🔥 ᴘᴇʀꜰᴇᴄᴛ ᴍᴀᴛᴄʜ!" : comp >= 75 ? "💕 ɢʀᴇᴀᴛ ᴍᴀᴛᴄʜ!" : "💖 ɢᴏᴏᴅ ᴍᴀᴛᴄʜ!"}${timeFooter()}`;

            await sendAdvancedGif(api, event, msg, 'love', [
                { tag: sInfo.name, id: sid },
                { tag: pInfo.name, id: partner }
            ]);
        } catch (e) {
            api.sendMessage("❌ Pair failed" + timeFooter(), event.threadID);
        }
    },

    ship: async (api, event) => {
        const mentions = Object.keys(event.mentions || {});
        let n1, n2;
        if (mentions.length >= 2) {
            const i1 = await new Promise(r => api.getUserInfo(mentions[0], (e, ret) => r(e ? { name: "Unknown" } : ret[mentions[0]])));
            const i2 = await new Promise(r => api.getUserInfo(mentions[1], (e, ret) => r(e ? { name: "Unknown" } : ret[mentions[1]])));
            n1 = i1.name; n2 = i2.name;
        } else {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;
            const m = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            const sh = m.sort(() => 0.5 - Math.random());
            const i1 = await new Promise(r => api.getUserInfo(sh[0], (e, ret) => r(e ? { name: "Unknown" } : ret[sh[0]])));
            const i2 = await new Promise(r => api.getUserInfo(sh[1], (e, ret) => r(e ? { name: "Unknown" } : ret[sh[1]])));
            n1 = i1.name; n2 = i2.name;
        }
        const p = Math.floor(Math.random() * 41) + 60;
        const msg = `💘 𝐋𝐎𝐕𝐄 𝐂𝐀𝐋𝐂𝐔𝐋𝐀𝐓𝐎𝐑 💘
━━━━━━━━━━━━━━━━━━━━━━━━
❤️ ${n1} + 💙 ${n2}
━━━━━━━━━━━━━━━━━━━━━━━━
💕 ʟᴏᴠᴇ: ${p}%${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'love');
    },

    meme: async (api, event) => {
        try {
            const res = await axios.get('https://meme-api.com/gimme', { timeout: 8000 });
            if (res.data?.url) {
                const img = await axios.get(res.data.url, { responseType: 'stream', timeout: 8000 });
                api.sendMessage({ body: `😂 ${res.data.title || "Meme"}${timeFooter()}`, attachment: img.data }, event.threadID);
            }
        } catch (e) {
            api.sendMessage("❌ Meme failed" + timeFooter(), event.threadID);
        }
    },

    '8ball': (api, event, args) => {
        const q = args.join(" ");
        if (!q) return api.sendMessage("Usage: /8ball [question]" + timeFooter(), event.threadID);
        const answers = ["Yes, definitely.", "No, not at all.", "Maybe...", "Ask again later.", "The stars say yes.", "Don't count on it.", "Most likely.", "Very doubtful."];
        const a = answers[Math.floor(Math.random() * answers.length)];
        api.sendMessage(`🎱 Q: ${q}\nA: ${a}${timeFooter()}`, event.threadID);
    },

    // ==================== PRANK ====================
    stalk: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🔍 ꜱᴛᴀʟᴋɪɴɢ ${name}...\n━━━━━━━━━━━━━━━━━━━━━━━━\n📍 ʟᴏᴄᴀᴛɪᴏɴ: ꜱᴇᴀʀᴄʜɪɴɢ...\n📱 ᴅᴇᴠɪᴄᴇ: ᴅᴇᴛᴇᴄᴛɪɴɢ...\n💻 ɪᴘ: ᴛʀᴀᴄɪɴɢ...\n\n⚠️ ᴛʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    info: async (api, event, args) => {
        const q = args.join(" ");
        if (!q) return api.sendMessage("Usage: /info [query]" + timeFooter(), event.threadID);
        try {
            const res = await axios.get(`https://api.popcat.xyz/wikipedia/${encodeURIComponent(q)}`, { timeout: 8000 });
            const text = res.data?.text?.slice(0, 400) || "Nᴏ ɪɴꜰᴏ";
            api.sendMessage(`📖 ${q}\n━━━━━━━━━━━━━━━━━━━━━━━━\n${text}...${timeFooter()}`, event.threadID);
        } catch (e) {
            api.sendMessage("❌ Info failed" + timeFooter(), event.threadID);
        }
    },

    weather: async (api, event, args) => {
        const city = args.join(" ") || "Dhaka";
        try {
            const res = await axios.get(`https://wttr.in/${city}?format=j1`, { timeout: 8000 });
            const c = res.data.current_condition[0];
            api.sendMessage(`🌤️ ᴡᴇᴀᴛʜᴇʀ - ${city}\n━━━━━━━━━━━━━━━━━━━━━━━━\n🌡️ ${c.temp_C}°C\n💧 ${c.humidity}%\n💨 ${c.windspeedKmph} km/h${timeFooter()}`, event.threadID);
        } catch (e) {
            api.sendMessage("❌ Weather failed" + timeFooter(), event.threadID);
        }
    },

    crack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`💻 ᴄʀᴀᴄᴋɪɴɢ ${name}...\n[████████░░] 80%\n🔓 Bypassing...\n✅ ᴘᴀꜱꜱᴡᴏʀᴅ: ********\n\n⚠️ ᴛʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    trace: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`📡 ᴛʀᴀᴄɪɴɢ ${name}...\n🌍 ɪᴘ: 192.***.***.***\n📍 ᴅʜᴀᴋᴀ, ʙᴅ\n\n⚠️ ᴛʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    fbi: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🚔 ꜰʙɪ ꜱᴇᴀʀᴄʜ\n🔍 ᴛᴀʀɢᴇᴛ: ${name}\n📁 ᴄᴀꜱᴇ: #${Math.floor(Math.random() * 999999)}\n🚨 ꜰʟᴀɢɢᴇᴅ\n\n⚠️ ᴛʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    hack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`💻 ʜᴀᴄᴋɪɴɢ ${name}...\n[██████░░░░] 60%\n🔓 Bypassing...\n✅ ᴄᴏᴍᴘʟᴇᴛᴇ\n\n⚠️ ᴛʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    darkweb: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🌑 ᴅᴀʀᴋ ᴡᴇʙ ꜱᴇᴀʀᴄʜ\n🔍 ${name}\n🌐 ᴇɴᴛᴇʀɪɴɢ ᴛᴏʀ...\n💀 ᴅᴀᴛᴀ: ɴᴏᴛ ꜰᴏᴜɴᴅ\n\n⚠️ ᴛʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    expose: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`😈 ᴇxᴘᴏꜱɪɴɢ ${name}...\n🔍 ꜱᴄᴀɴɴɪɴɢ...\n📸 ꜰɪɴᴅɪɴɢ ꜱᴇᴄʀᴇᴛꜱ...\n🚨 ɴᴏᴛʜɪɴɢ ꜰᴏᴜɴᴅ!\n\n⚠️ ᴛʜɪꜱ ɪꜱ ᴀ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    bankhack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🏦 ʙᴀɴᴋ ʜᴀᴄᴋ - ${name}\n💳 ****${Math.floor(Math.random() * 9999)}\n💰 $${Math.floor(Math.random() * 99999)}\n🔓 ᴅᴇɴɪᴇᴅ\n\n⚠️ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    camera: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`📸 ᴀᴄᴄᴇꜱꜱɪɴɢ ${name}'ꜱ ᴄᴀᴍᴇʀᴀ...\n🎥 ᴀᴄᴛɪᴠᴇ\n📷 ᴄᴀᴘᴛᴜʀɪɴɢ...\n❌ ᴅᴇɴɪᴇᴅ\n\n⚠️ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    gallery: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🖼️ ᴀᴄᴄᴇꜱꜱɪɴɢ ${name}'ꜱ ɢᴀʟʟᴇʀʏ...\n📁 ʟᴏᴀᴅɪɴɢ...\n🔒 ʟᴏᴄᴋᴇᴅ\n\n⚠️ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    callhack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`📞 ᴄᴀʟʟ ʜᴀᴄᴋ - ${name}\n📱 +880 1***-******\n📞 ᴛᴀᴘᴘɪɴɢ...\n\n⚠️ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    ddos: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`💥 ᴅᴅᴏꜱ - ${name}\n⚡ 1000/ꜱ\n🔥 ᴏᴠᴇʀʟᴏᴀᴅᴇᴅ\n\n⚠️ ᴘʀᴀɴᴋ${timeFooter()}`, event.threadID);
    },

    // ==================== UTILITY ====================
    say: async (api, event, args, config) => {
        const { hasPermission, permissionDenied } = require('../utils');
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const m = args.join(" ");
        if (!m) return api.sendMessage("Usage: /say [text]" + timeFooter(), event.threadID);
        api.sendMessage(m, event.threadID);
    },

    poll: (api, event, args) => {
        const q = args.join(" ") || "Your opinion?";
        api.sendMessage(`📊 ᴘᴏʟʟ\n━━━━━━━━━━━━━━━━━━━━━━━━\n❓ ${q}\n\n👍 ʏᴇꜱ\n👎 ɴᴏ${timeFooter()}`, event.threadID);
    },

    vid: async (api, event, args) => {
        if (!args[0]) return api.sendMessage("Usage: /vid [link]" + timeFooter(), event.threadID);
        api.sendMessage("📥 ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴠɪᴅᴇᴏ..." + timeFooter(), event.threadID);
    }

};