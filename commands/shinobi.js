const axios = require('axios');
const { 
    getDB, saveDB, timeFooter, sendAdvancedGif, guessGender, getOwnerList
} = require('../utils');

module.exports = {

    // ==================== 💰 BALANCE ====================
    balance: (api, event) => {
        const db = getDB();
        const user = db.users?.[event.senderID] || { coins: 0 };
        
        api.sendMessage(
            `🌸 𝐘ᴏᴜʀ 𝐁ᴀʟᴀɴᴄᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
💎 𝐂ᴏɪɴꜱ: ${user.coins || 0}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🎁 DAILY ====================
    daily: async (api, event) => {
        const db = getDB();
        if (!db.users) db.users = {};
        if (!db.users[event.senderID]) {
            db.users[event.senderID] = { coins: 0, lastDaily: 0 };
        }
        
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (now - (db.users[event.senderID].lastDaily || 0) < oneDay) {
            const rem = Math.ceil((oneDay - (now - db.users[event.senderID].lastDaily)) / 3600000);
            return api.sendMessage(
                `⏳ 𝐀ʟʀᴇᴀᴅʏ 𝐂ʟᴀɪᴍᴇᴅ!
━━━━━━━━━━━━━━━━━━━━━━━━
🕐 ᴛʀʏ ᴀɢᴀɪɴ ɪɴ ${rem} ʜᴏᴜʀꜱ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }
        
        db.users[event.senderID].lastDaily = now;
        db.users[event.senderID].coins = (db.users[event.senderID].coins || 0) + 500;
        saveDB(db);
        
        api.sendMessage(
            `🎉 𝐃ᴀɪʟʏ 𝐑ᴇᴡᴀʀᴅ 𝐂ʟᴀɪᴍᴇᴅ!
━━━━━━━━━━━━━━━━━━━━━━━━
✅ +500 💎 ᴄᴏɪɴꜱ
💰 𝐓ᴏᴛᴀʟ: ${db.users[event.senderID].coins}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🏆 TOP ====================
    top: (api, event) => {
        const db = getDB();
        const users = Object.entries(db.users || {})
            .sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0))
            .slice(0, 5);
        
        let msg = `🏆 𝐓ᴏᴘ 𝐑ɪᴄʜ 𝐔ꜱᴇʀꜱ
━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        users.forEach((u, i) => {
            msg += `${i + 1}. ${u[0]}: ${u[1].coins || 0} 💎\n`;
        });
        
        if (users.length === 0) msg += `ɴᴏ ᴅᴀᴛᴀ ʏᴇᴛ`;
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🏅 RANK ====================
    rank: (api, event) => {
        const db = getDB();
        const user = db.users?.[event.senderID] || { points: 0 };
        
        let rank = "🥉 𝐁ʀᴏɴᴢᴇ";
        const points = user.points || 0;
        if (points >= 1000) rank = "💎 𝐃ɪᴀᴍᴏɴᴅ";
        else if (points >= 500) rank = "🥇 𝐆ᴏʟᴅ";
        else if (points >= 100) rank = "🥈 𝐒ɪʟᴠᴇʀ";
        
        api.sendMessage(
            `🌸 𝐘ᴏᴜʀ 𝐑ᴀɴᴋ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐏ᴏɪɴᴛꜱ: ${points}
🏅 𝐑ᴀɴᴋ: ${rank}
💎 𝐂ᴏɪɴꜱ: ${user.coins || 0}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📊 LEADERBOARD ====================
    leaderboard: (api, event) => {
        const db = getDB();
        const users = Object.entries(db.users || {})
            .sort((a, b) => (b[1].points || 0) - (a[1].points || 0))
            .slice(0, 10);
        
        let msg = `📊 𝐋ᴇᴀᴅᴇʀʙᴏᴀʀᴅ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        users.forEach((u, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            msg += `${medal} ${u[0]}: ${u[1].points || 0}\n`;
        });
        
        if (users.length === 0) msg += `ɴᴏ ᴅᴀᴛᴀ ʏᴇᴛ`;
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 💤 AFK ====================
    afk: async (api, event, args) => {
        const db = getDB();
        if (!db.afk) db.afk = {};
        
        const reason = args.join(" ") || "AFK";
        db.afk[event.senderID] = { reason, time: Date.now() };
        saveDB(db);
        
        api.sendMessage(
            `💤 𝐀𝐅𝐊 𝐌𝐨𝐝𝐞 𝐀ᴄᴛɪᴠᴀᴛᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
📝 𝐑ᴇᴀꜱᴏɴ: ${reason}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 💕 PAIR ====================
    pair: async (api, event) => {
        try {
            const db = getDB();
            const tid = event.threadID;
            const sid = event.senderID;
            const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("❌ 𝐅ᴀɪʟᴇᴅ" + timeFooter(), tid);

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
            if (!sG) return api.sendMessage("⚠️ 𝐂ᴀɴɴᴏᴛ ᴅᴇᴛᴇᴄᴛ ɢᴇɴᴅᴇʀ" + timeFooter(), tid);

            const partnerList = (sG === "male") ? females.filter(id => id !== sid) : males.filter(id => id !== sid);
            if (partnerList.length === 0) return api.sendMessage(`⚠️ 𝐍ᴏ ${sG === "male" ? "ɢɪʀʟꜱ" : "ʙᴏʏꜱ"}!${timeFooter()}`, tid);

            const partner = partnerList[Math.floor(Math.random() * partnerList.length)];
            const pInfo = await new Promise(r => api.getUserInfo(partner, (e, ret) => r(e ? { name: "Unknown" } : ret[partner])));
            const comp = Math.floor(Math.random() * 41) + 60;

            const e1 = sG === "male" ? "👦" : "👧";
            const e2 = sG === "male" ? "👧" : "👦";
            const msg = `💕 𝐌ᴀᴛᴄʜᴍᴀᴋɪɴɢ
━━━━━━━━━━━━━━━━━━━━━━━━
${e1} ${sInfo.name}
       ❤️
${e2} ${pInfo.name}
━━━━━━━━━━━━━━━━━━━━━━━━
💖 𝐂ᴏᴍᴘᴀᴛɪʙɪʟɪᴛʏ: ${comp}%
${comp >= 90 ? "🔥 𝐏ᴇʀꜰᴇᴄᴛ 𝐌ᴀᴛᴄʜ!" : comp >= 75 ? "💕 𝐆ʀᴇᴀᴛ 𝐌ᴀᴛᴄʜ!" : "💖 𝐆ᴏᴏᴅ 𝐌ᴀᴛᴄʜ!"}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;

            await sendAdvancedGif(api, event, msg, 'love', [
                { tag: sInfo.name, id: sid },
                { tag: pInfo.name, id: partner }
            ]);
        } catch (e) {
            api.sendMessage("❌ 𝐏ᴀɪʀ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ==================== 💘 SHIP ====================
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
        const hearts = p >= 90 ? "💖💖💖💖💖" : p >= 75 ? "💖💖💖💖" : "💖💖💖";
        
        const msg = `💘 𝐋ᴏᴠᴇ 𝐂ᴀʟᴄᴜʟᴀᴛᴏʀ
━━━━━━━━━━━━━━━━━━━━━━━━
❤️ ${n1}
        ➕
💙 ${n2}
━━━━━━━━━━━━━━━━━━━━━━━━
💕 𝐋ᴏᴠᴇ: ${p}%
${hearts}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        await sendAdvancedGif(api, event, msg, 'love');
    },

    // ==================== 😂 MEME ====================
    meme: async (api, event) => {
        try {
            const res = await axios.get('https://meme-api.com/gimme', { timeout: 8000 });
            if (res.data?.url) {
                const img = await axios.get(res.data.url, { responseType: 'stream', timeout: 8000 });
                api.sendMessage({
                    body: `😂 ${res.data.title || "Meme"}${timeFooter()}`,
                    attachment: img.data
                }, event.threadID);
            }
        } catch (e) {
            api.sendMessage("❌ 𝐌ᴇᴍᴇ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ==================== 🎱 8BALL ====================
    '8ball': (api, event, args) => {
        const q = args.join(" ");
        if (!q) return api.sendMessage("ᴜꜱᴀɢᴇ: /8ball [ǫᴜᴇꜱᴛɪᴏɴ]" + timeFooter(), event.threadID);
        
        const answers = [
            "✅ Yes, definitely.",
            "❌ No, not at all.",
            "🤔 Maybe...",
            "⏳ Ask again later.",
            "⭐ The stars say yes.",
            "🚫 Don't count on it.",
            "👍 Most likely.",
            "❓ Very doubtful."
        ];
        
        const a = answers[Math.floor(Math.random() * answers.length)];
        
        api.sendMessage(
            `🎱 𝐌ᴀɢɪᴄ 8-𝐁ᴀʟʟ
━━━━━━━━━━━━━━━━━━━━━━━━
❓ 𝐐: ${q}
💫 𝐀: ${a}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔥 ROAST ====================
    roast: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "you";
        
        const roasts = [
            `${name} is so slow that even a turtle would win a race against them! 🐢`,
            `${name} is like a cloud — when they disappear, it's a beautiful day! ☀️`,
            `${name} is the reason shampoo bottles have instructions! 🧴`,
            `${name} is so boring that even their shadow leaves them! 👻`,
            `${name}'s brain has too many tabs open and none of them are loading! 🧠`,
            `${name} is so ugly that when they were born, the doctor slapped their mother! 👶`,
            `${name} is so poor that they can't even pay attention! 💸`,
            `${name} is like a software update — when they appear, you think "not now"! 💻`,
            `${name} is so weird that even aliens say "We don't want to meet them!" 👽`,
            `${name} is so annoying that even Alexa says "I don't understand" to them! 🤖`
        ];
        
        const roast = roasts[Math.floor(Math.random() * roasts.length)];
        
        api.sendMessage({
            body: `🔥 𝐑ᴏᴀꜱᴛ 🔥\n━━━━━━━━━━━━━━━━━━━━━━━━\n${roast}\n━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            mentions: t ? [{ tag: name, id: t }] : []
        }, event.threadID);
    },

    // ==================== ❓ TRUTH ====================
    truth: (api, event) => {
        const truths = [
            "What is your biggest fear?",
            "Who do you love most?",
            "What is your hidden talent?",
            "Have you ever lied to your parents?",
            "What's your biggest secret?",
            "Who was your first crush?",
            "What's the most embarrassing thing you've done?",
            "What's your biggest regret?"
        ];
        
        const t = truths[Math.floor(Math.random() * truths.length)];
        
        api.sendMessage(
            `❓ 𝐓ʀᴜᴛʜ 𝐐ᴜᴇꜱᴛɪᴏɴ
━━━━━━━━━━━━━━━━━━━━━━━━
${t}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔥 DARE ====================
    dare: (api, event) => {
        const dares = [
            "Say your crush's name out loud",
            "Send a funny selfie",
            "Do 10 push-ups",
            "Sing a song in voice message",
            "Call someone and say I love you",
            "Send your most embarrassing photo",
            "Dance for 30 seconds",
            "Speak in a different accent for 5 minutes"
        ];
        
        const d = dares[Math.floor(Math.random() * dares.length)];
        
        api.sendMessage(
            `🔥 𝐃ᴀʀᴇ 𝐂ʜᴀʟʟᴇɴɢᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
${d}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    }

};