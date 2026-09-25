const axios = require('axios');
const { getDB, saveDB, timeFooter, sendWithGif, fetchAnimeGif, guessGender } = require('../utils');

module.exports = {

    register: async (api, event, args, config) => {
        try {
            const db = getDB();
            if (!db.groups) db.groups = {};
            if (!db.groups[event.threadID]) {
                db.groups[event.threadID] = {
                    firstSeen: Date.now(),
                    lastSeen: Date.now(),
                    name: event.threadName || "Unknown"
                };
                saveDB(db);
                api.sendMessage(`✅ ᴛʜɪꜱ ɢʀᴏᴜᴘ ʀᴇɢɪꜱᴛᴇʀᴇᴅ!\n🆔 ${event.threadID}${timeFooter()}`, event.threadID);
            } else {
                api.sendMessage(`ℹ️ ᴀʟʀᴇᴀᴅʏ ʀᴇɢɪꜱᴛᴇʀᴇᴅ!${timeFooter()}`, event.threadID);
            }
        } catch (e) {
            api.sendMessage("❌ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    help: async (api, event, args, config) => {
        const msg = `╔══════════════════════════════╗
   💀 DEAD DESTROYER - HELP
╚══════════════════════════════╝

📖 ᴘᴀɢᴇ 1 - ᴍᴇᴍʙᴇʀ
📖 ᴘᴀɢᴇ 2 - ꜰᴜɴ + ᴘʀᴀɴᴋ
📖 ᴘᴀɢᴇ 3 - ɢʀᴏᴜᴘ ᴀᴅᴍɪɴ
📖 ᴘᴀɢᴇ 4 - ꜱᴇᴄᴜʀɪᴛʏ

ᴜꜱᴇ: /page1 /page2 /page3 /page4

━━━━━━━━━━━━━━━━━━━━━━━━
ʀᴏʟᴇꜱ: ᴘᴜʙʟɪᴄ < ᴍᴏᴅ < ɢʀᴏᴜᴘᴀᴅᴍɪɴ < ʙᴏᴛᴀᴅᴍɪɴ < ᴏᴡɴᴇʀ${timeFooter()}`;
        await sendWithGif(api, event, msg, 'wave');
    },

    page1: async (api, event) => {
        const msg = `📖 PAGE 1 - MEMBER
━━━━━━━━━━━━━━━━━━━━━━━━
/help /page1-4 /ping /uid /owner
/botinfo /groupinfo /rules /rank
/leaderboard /afk /pair /ship
/aura /meme /8ball /ai /register${timeFooter()}`;
        await sendWithGif(api, event, msg, 'wave');
    },

    page2: async (api, event) => {
        const msg = `📖 PAGE 2 - FUN + PRANK
━━━━━━━━━━━━━━━━━━━━━━━━
/vid /say /poll /info /stalk
/weather /tagall /tagadmin /members
/adminlist /roles /roleinfo
/crack /trace /fbi /darkweb
/expose /bankhack /camera
/gallery /callhack /ddos /hack

⚠️ ᴀʟʟ ᴘʀᴀɴᴋ 100% ꜰᴀᴋᴇ${timeFooter()}`;
        await sendWithGif(api, event, msg, 'wave');
    },

    page3: async (api, event) => {
        const msg = `📖 PAGE 3 - GROUP ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━
/kick /ban /unban /setrole
/removerole /setrules /warn
/warnlist /lockname /lockphoto
/locknick /massnick /autonick
/resetnick /antlink /antigali
/antisticker /antigif /antiphone
/blacklist /slowmode${timeFooter()}`;
        await sendWithGif(api, event, msg, 'wave');
    },

    page4: async (api, event) => {
        const msg = `📖 PAGE 4 - BRUTAL SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━
/antibot /botscan /botkill /antiraid
/allmute /allunmute /lockall /unlockall
/shield /onlyadmin /onlymod /botlock
/botoff /boton /botlocklist
/addadmin /removeadmin /restart
/maintenance /status /active /topignore
/welcome set /goodbye set

🔥 MASTER:
/security on/off
/war on/off${timeFooter()}`;
        await sendWithGif(api, event, msg, 'wave');
    },

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
        const msg = `👑 ᴏᴡɴᴇʀ ɪɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Ariyan Shihab
🌹 কীট গোলাপ
🎂 21+ | 📚 Student
📍 Naoagon, Bangladesh
━━━━━━━━━━━━━━━━━━━━━━━━
📘 https://facebook.com/mdshihabofc
💬 https://m.me/mdshihabofc
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendWithGif(api, event, msg, 'smile');
    },

    botinfo: (api, event, args, config) => {
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60);
        const msg = `💀 ʙᴏᴛ ɪɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
🤖 ${config.botName}
⚙️ ᴠᴇʀꜱɪᴏɴ: ${config.version}
📦 ᴄᴏᴍᴍᴀɴᴅꜱ: 92
⏱️ ᴜᴘᴛɪᴍᴇ: ${h}ʜ ${m}ᴍ
🛠️ ᴅᴇᴠ: ${config.developer}${timeFooter()}`;
        api.sendMessage(msg, event.threadID);
    },

    groupinfo: async (api, event) => {
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return;
            api.sendMessage(`📊 ɢʀᴏᴜᴘ ɪɴꜰᴏ
━━━━━━━━━━━━━━━━━━━━━━━━
📌 ${info.threadName}
👥 ${info.participantIDs.length} ᴍᴇᴍʙᴇʀꜱ
👑 ${info.adminIDs.length} ᴀᴅᴍɪɴꜱ
🆔 ${event.threadID}${timeFooter()}`, event.threadID);
        });
    },

    rules: (api, event) => {
        const db = getDB();
        const rules = db.groups[event.threadID]?.rules || "ɴᴏ ʀᴜʟᴇꜱ ꜱᴇᴛ";
        api.sendMessage(`📜 ɢʀᴏᴜᴘ ʀᴜʟᴇꜱ\n━━━━━━━━━━━━━━━━━━━━━━━━\n${rules}${timeFooter()}`, event.threadID);
    },

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
            if (!sG) return api.sendMessage("⚠️ Cannot detect gender. Use /setrole" + timeFooter(), tid);

            const partnerList = (sG === "male") ? females.filter(id => id !== sid) : males.filter(id => id !== sid);
            if (partnerList.length === 0) return api.sendMessage(`⚠️ No ${sG === "male" ? "girls" : "boys"}!${timeFooter()}`, tid);

            const partner = partnerList[Math.floor(Math.random() * partnerList.length)];
            const pInfo = await new Promise(r => api.getUserInfo(partner, (e, ret) => r(e ? { name: "Unknown" } : ret[partner])));
            const comp = Math.floor(Math.random() * 41) + 60;

            const e1 = sG === "male" ? "👦" : "👧";
            const e2 = sG === "male" ? "👧" : "👦";
            const msg = `💕 Matchmaking Complete 💕
━━━━━━━━━━━━━━━━━━━━━━━━
${e1} ${sInfo.name}
       ❤️
${e2} ${pInfo.name}
━━━━━━━━━━━━━━━━━━━━━━━━
💖 Compatibility: ${comp}%
${comp >= 90 ? "🔥 PERFECT MATCH!" : comp >= 75 ? "💕 GREAT MATCH!" : "💖 GOOD MATCH!"}${timeFooter()}`;

            await sendWithGif(api, event, msg, 'cuddle', [
                { tag: sInfo.name, id: sid },
                { tag: pInfo.name, id: partner }
            ]);
        } catch (e) {
            console.error(e);
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
        const msg = `💘 Love Calculator 💘
━━━━━━━━━━━━━━━━━━━━━━━━
❤️ ${n1} + 💙 ${n2}
━━━━━━━━━━━━━━━━━━━━━━━━
💕 Love: ${p}%${timeFooter()}`;
        await sendWithGif(api, event, msg, 'kiss');
    },

    tagall: async (api, event, args, config) => {
        const { hasPermission, permissionDenied } = require('../utils');
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
        if (!info) return;
        const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
        const mentions = [];
        let body = "📢 Attention Everyone\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
        for (const m of members) {
            const u = await new Promise(r => api.getUserInfo(m, (e, ret) => r(e ? { name: "Unknown" } : ret[m])));
            body += `@${u.name} `;
            mentions.push({ tag: u.name, id: m });
        }
        body += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n👥 Total: ${info.participantIDs.length}${timeFooter()}`;
        api.sendMessage({ body, mentions }, event.threadID);
    },

    tagadmin: async (api, event, args, config) => {
        const { hasPermission, permissionDenied } = require('../utils');
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
        if (!info) return;
        const mentions = [];
        let body = "👑 Attention Admins\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
        for (const a of info.adminIDs) {
            const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
            body += `@${u.name} `;
            mentions.push({ tag: u.name, id: a.id });
        }
        body += timeFooter();
        api.sendMessage({ body, mentions }, event.threadID);
    },

    members: async (api, event) => {
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return;
            api.sendMessage(`👥 Total members: ${info.participantIDs.length}${timeFooter()}`, event.threadID);
        });
    },

    adminlist: async (api, event, args, config) => {
        const { hasPermission, permissionDenied } = require('../utils');
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
        if (!info) return;
        const mentions = [];
        let body = "👑 Admin List\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
        for (const a of info.adminIDs) {
            const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
            body += `👑 @${u.name}\n`;
            mentions.push({ tag: u.name, id: a.id });
        }
        body += timeFooter();
        api.sendMessage({ body, mentions }, event.threadID);
    },

    roles: async (api, event, args, config) => {
        const { hasPermission, permissionDenied } = require('../utils');
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const db = getDB();
        const roles = db.roles[event.threadID] || {};
        let msg = "👥 Roles\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
        for (const uid in roles) {
            const u = await new Promise(r => api.getUserInfo(uid, (e, ret) => r(e ? { name: "Unknown" } : ret[uid])));
            msg += `👤 ${u.name} → ${roles[uid]}\n`;
        }
        if (Object.keys(roles).length === 0) msg += "No custom roles";
        api.sendMessage(msg + timeFooter(), event.threadID);
    },

    roleinfo: async (api, event, args, config) => {
        const t = Object.keys(event.mentions || {})[0] || event.senderID;
        const db = getDB();
        const role = db.roles[event.threadID]?.[t] || "public";
        const u = await new Promise(r => api.getUserInfo(t, (e, ret) => r(e ? { name: "Unknown" } : ret[t])));
        api.sendMessage(`👤 ${u.name}\n🎭 Role: ${role}${timeFooter()}`, event.threadID);
    },

    say: async (api, event, args, config) => {
        const { hasPermission, permissionDenied } = require('../utils');
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        const m = args.join(" ");
        if (!m) return api.sendMessage("Usage: /say [text]" + timeFooter(), event.threadID);
        api.sendMessage(m, event.threadID);
    },

    poll: async (api, event, args) => {
        const q = args.join(" ") || "Your opinion?";
        api.sendMessage(`📊 Poll\n━━━━━━━━━━━━━━━━━━━━━━━━\n❓ ${q}\n\n👍 Yes\n👎 No${timeFooter()}`, event.threadID);
    },

    afk: async (api, event, args) => {
        const db = getDB();
        if (!db.afk) db.afk = {};
        const reason = args.join(" ") || "AFK";
        db.afk[event.senderID] = { reason, time: Date.now() };
        saveDB(db);
        api.sendMessage(`💤 AFK activated\n📝 Reason: ${reason}${timeFooter()}`, event.threadID);
    },

    aura: (api, event) => {
        const aura = Math.floor(Math.random() * 1000) + 500;
        api.sendMessage(`✨ Aura Check ✨\n━━━━━━━━━━━━━━━━━━━━━━━━\n🔮 ${aura}\n${aura > 1200 ? "🌟 MASSIVE AURA!" : "✨ DECENT AURA"}${timeFooter()}`, event.threadID);
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

    ai: async (api, event, args) => {
        const q = args.join(" ");
        if (!q) return api.sendMessage("Usage: /ai [query]" + timeFooter(), event.threadID);
        try {
            const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(q)}&owner=SHIHAB&botname=DEAD+DESTROYER`, { timeout: 10000 });
            api.sendMessage(`🤖 AI: ${res.data?.response || "No response"}${timeFooter()}`, event.threadID);
        } catch (e) {
            api.sendMessage("❌ AI failed" + timeFooter(), event.threadID);
        }
    },

    vid: async (api, event, args) => {
        if (!args[0]) return api.sendMessage("Usage: /vid [link]" + timeFooter(), event.threadID);
        api.sendMessage("📥 Downloading video..." + timeFooter(), event.threadID);
    },

    info: async (api, event, args) => {
        const q = args.join(" ");
        if (!q) return api.sendMessage("Usage: /info [query]" + timeFooter(), event.threadID);
        try {
            const res = await axios.get(`https://api.popcat.xyz/wikipedia/${encodeURIComponent(q)}`, { timeout: 8000 });
            const text = res.data?.text?.slice(0, 500) || "No info";
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
            api.sendMessage(`🌤️ Weather - ${city}\n━━━━━━━━━━━━━━━━━━━━━━━━\n🌡️ ${c.temp_C}°C\n💧 ${c.humidity}%\n💨 ${c.windspeedKmph} km/h${timeFooter()}`, event.threadID);
        } catch (e) {
            api.sendMessage("❌ Weather failed" + timeFooter(), event.threadID);
        }
    },

    stalk: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🔍 Stalking ${name}...\n━━━━━━━━━━━━━━━━━━━━━━━━\n📍 Location: Searching...\n📱 Device: Detecting...\n💻 IP: Tracing...\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    crack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`💻 Cracking ${name}...\n[████████░░] 80%\n🔓 Bypassing...\n✅ PASSWORD: ********\n\n⚠️ PRANK - 100% FAKE${timeFooter()}`, event.threadID);
    },

    fbi: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🚔 FBI SEARCH\n🔍 Target: ${name}\n📁 Case: #${Math.floor(Math.random() * 999999)}\n🚨 FLAGGED\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    hack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`💻 Hacking ${name}...\n[██████░░░░] 60%\n🔓 Bypassing...\n✅ COMPLETE\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    trace: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`📡 Tracing ${name}...\n🌍 IP: 192.***.***.***\n📍 Dhaka, BD\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    darkweb: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🌑 Dark Web Search\n🔍 ${name}\n🌐 Entering TOR...\n💀 Data: NOT FOUND\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    expose: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`😈 Exposing ${name}...\n🔍 Scanning...\n📸 Finding secrets...\n🚨 Nothing found!\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    bankhack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🏦 Bank Hack - ${name}\n💳 ****${Math.floor(Math.random() * 9999)}\n💰 $${Math.floor(Math.random() * 99999)}\n🔓 DENIED\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    camera: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`📸 Accessing ${name}'s camera...\n🎥 Active\n📷 Capturing...\n❌ DENIED\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    gallery: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`🖼️ Accessing ${name}'s gallery...\n📁 Loading...\n🔒 LOCKED\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    callhack: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`📞 Call Hack - ${name}\n📱 +880 1***-******\n📞 Tapping...\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    ddos: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "user";
        api.sendMessage(`💥 DDoS - ${name}\n⚡ 1000/s\n🔥 OVERLOADED\n\n⚠️ PRANK${timeFooter()}`, event.threadID);
    },

    rank: (api, event) => {
        const db = getDB();
        const user = db.users?.[event.senderID] || { points: 0 };
        api.sendMessage(`🏅 Your Rank\n━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Points: ${user.points || 0}${timeFooter()}`, event.threadID);
    },

    leaderboard: (api, event) => {
        const db = getDB();
        const users = Object.entries(db.users || {}).sort((a, b) => (b[1].points || 0) - (a[1].points || 0)).slice(0, 10);
        let msg = "🏆 Leaderboard\n━━━━━━━━━━━━━━━━━━━━━━━━\n";
        users.forEach((u, i) => { msg += `${i + 1}. ${u[0]}: ${u[1].points || 0}\n`; });
        api.sendMessage(msg + timeFooter(), event.threadID);
    }

};