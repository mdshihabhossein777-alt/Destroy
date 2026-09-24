const fs = require('fs');
const axios = require('axios');
const dbFile = './database.json';

// ==================== 🗄️ Database Helpers ====================
function getDB() {
    try {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    } catch (e) {
        return { groups: {}, users: {}, warnings: {}, banned: {}, settings: {} };
    }
}
function saveDB(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}
function getUser(db, id) {
    if (!db.users[id]) {
        db.users[id] = { coins: 1000, shield: false, lastDaily: 0 };
        saveDB(db);
    }
    return db.users[id];
}

// ==================== 🔐 Permission Checker ====================
async function checkPermission(api, event, config, requiredLevel) {
    const senderID = event.senderID;
    const threadID = event.threadID;
    let userLevel = 0;
    let userRole = "👤 User";

    if (senderID === config.owner) {
        userLevel = 3;
        userRole = "👑 Owner";
    } else if (config.botAdmins && config.botAdmins.includes(senderID)) {
        userLevel = 2;
        userRole = "🛡️ Bot Admin";
    } else {
        try {
            const info = await new Promise(r => api.getThreadInfo(threadID, (e, i) => r(e ? null : i)));
            if (info && info.adminIDs && info.adminIDs.some(a => a.id === senderID)) {
                userLevel = 1;
                userRole = "👑 Group Admin";
            }
        } catch (e) {}
    }

    return { allowed: userLevel >= requiredLevel, userLevel, userRole };
}

function sendPermissionDenied(api, event, requiredLevel) {
    const levelNames = { 1: "👑 Group Admin", 2: "🛡️ Bot Admin", 3: "👑 Owner" };
    api.sendMessage(
        `🚫 আপনি এই কমান্ড ব্যবহারের অনুমতি রাখেন না!\n\n🔒 প্রয়োজনীয়: ${levelNames[requiredLevel]}\n👤 আপনার রোল: সাধারণ সদস্য\n💡 অ্যাডমিনের সাথে যোগাযোগ করুন।`,
        event.threadID
    );
}

// ==================== 🎬 GIF Libraries ====================
const gifLib = {
    help: ["https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif", "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"],
    hug: ["https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif", "https://media.giphy.com/media/3o7abB06u9bNzA8lu8/giphy.gif"],
    kiss: ["https://media.giphy.com/media/G3va31o04lMKM/giphy.gif", "https://media.giphy.com/media/11k3uN9S0F7Xy8/giphy.gif"],
    slap: ["https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif", "https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif"],
    pat: ["https://media.giphy.com/media/109ltuoSQT212w/giphy.gif", "https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif"],
    dance: ["https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif", "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif"],
    cry: ["https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif", "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif"],
    laugh: ["https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif", "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"],
    pair: ["https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif", "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif"],
    ship: ["https://media.giphy.com/media/G3va31o04lMKM/giphy.gif", "https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif"]
};

function pickGif(key) {
    const arr = gifLib[key] || gifLib.help;
    return arr[Math.floor(Math.random() * arr.length)];
}

async function sendWithGif(api, event, body, gifKey, mentions = []) {
    try {
        const gif = pickGif(gifKey);
        const res = await axios.get(gif, { responseType: 'stream' });
        api.sendMessage({ body, mentions, attachment: res.data }, event.threadID);
    } catch (e) {
        api.sendMessage({ body, mentions }, event.threadID);
    }
}

// ==================== 📦 Module Exports ====================
module.exports = {

    // ==================== 🧩 Core ====================
    help: async (api, event, args, config) => {
        try {
            const senderID = event.senderID;
            const threadID = event.threadID;
            const perm = await checkPermission(api, event, config, 0);
            const info = await new Promise(r => api.getUserInfo(senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[senderID])));

            let publicCmds = `\n━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Public Commands
━━━━━━━━━━━━━━━━━━━━━━━━
🧩 /help /ping /uid
💰 /balance /daily /work /gamble /slots /rob /shop /buy
🎬 /hug /kiss /slap /pat /dance /cry /laugh
🎮 /pair /ship /truth /dare /roast /top`;

            let adminCmds = `\n━━━━━━━━━━━━━━━━━━━━━━━━
👑 Group Admin Only
━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ /kick /ban /warn
📊 /tagall /tagadmin /members /adminlist /groupinfo
🔒 /lock /unlock /autokick /antlink /dark
📝 /say /poll`;

            let botAdminsCmds = `\n━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ Bot Admin Only
━━━━━━━━━━━━━━━━━━━━━━━━
📊 /status /maintenance /botadmins`;

            let ownerCmds = `\n━━━━━━━━━━━━━━━━━━━━━━━━
👑 Owner Only
━━━━━━━━━━━━━━━━━━━━━━━━
➕ /addadmin /removeadmin /restart`;

            let extra = "";
            if (perm.userLevel >= 1) extra += adminCmds;
            if (perm.userLevel >= 2) extra += botAdminsCmds;
            if (perm.userLevel >= 3) extra += ownerCmds;

            const msg = `╔══════════════════════════════╗
      💀 DEAD DESTROYER 💀
        ${config.version} — Help Menu
╚══════════════════════════════╝

👤 নাম: ${info.name}
🆔 আইডি: ${senderID}
🎖️ রোল: ${perm.userRole}${publicCmds}${extra}

━━━━━━━━━━━━━━━━━━━━━━━━
💀 Developed by ${config.developer}`;

            await sendWithGif(api, event, msg, 'help');
        } catch (err) {
            console.error("help error:", err);
            api.sendMessage("❌ Help লোড হয়নি।", event.threadID);
        }
    },

    ping: (api, event) => {
        const start = Date.now();
        api.sendMessage("🏓 Pong!", event.threadID, () => {
            api.sendMessage(`⚡ Response: ${Date.now() - start}ms`, event.threadID);
        });
    },

    owner: async (api, event, args, config) => {
        const info = await new Promise(r => api.getUserInfo(config.owner, (e, ret) => r(e ? { name: "Unknown" } : ret[config.owner])));
        api.sendMessage(`👑 Owner: ${info.name}\n🆔 ${config.owner}\n🛠️ Developer: ${config.developer}`, event.threadID);
    },

    uid: async (api, event) => {
        try {
            const mentions = Object.keys(event.mentions || {});
            if (mentions.length > 0) {
                for (const id of mentions) {
                    const name = event.mentions[id].replace('@', '');
                    api.sendMessage(`🆔 ${name}:\n📌 ${id}\n🔗 https://facebook.com/${id}`, event.threadID);
                }
            } else {
                const info = await new Promise(r => api.getUserInfo(event.senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[event.senderID])));
                api.sendMessage(`🆔 আপনার আইডি: ${event.senderID}\n👤 নাম: ${info.name}\n🔗 https://facebook.com/${event.senderID}`, event.threadID);
            }
        } catch (e) {
            api.sendMessage("❌ আইডি লোড হয়নি।", event.threadID);
        }
    },

    // ==================== 📊 Group Info ====================
    groupinfo: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);

        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return api.sendMessage("❌ লোড হয়নি।", event.threadID);
            api.sendMessage(`📊 গ্রুপ তথ্য:\n🏠 ${info.threadName}\n👥 মেম্বার: ${info.participantIDs.length}\n👑 অ্যাডমিন: ${info.adminIDs.length}\n🆔 ${event.threadID}`, event.threadID);
        });
    },

    adminlist: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("❌ লোড হয়নি।", event.threadID);
            let msg = "👑 অ্যাডমিন লিস্ট:\n━━━━━━━━━━━━━━━━━\n";
            const mentions = [];
            for (const a of info.adminIDs) {
                const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
                msg += `👑 @${u.name}\n`;
                mentions.push({ tag: u.name, id: a.id });
            }
            api.sendMessage({ body: msg, mentions }, event.threadID);
        } catch (e) {
            api.sendMessage("❌ লোড হয়নি।", event.threadID);
        }
    },

    members: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return api.sendMessage("❌ লোড হয়নি।", event.threadID);
            api.sendMessage(`👥 মোট মেম্বার: ${info.participantIDs.length}`, event.threadID);
        });
    },

    rules: async (api, event) => {
        const db = getDB();
        const rules = db.groups[event.threadID]?.rules || "❌ কোনো নিয়ম নেই। /setrules লিখে অ্যাডমিন নিয়ম দিতে পারে।";
        api.sendMessage(`📜 গ্রুপের নিয়মাবলী:\n${rules}`, event.threadID);
    },

    setrules: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].rules = args.join(" ") || "কোনো নিয়ম নেই।";
        saveDB(db);
        api.sendMessage("✅ নিয়ম সেট হয়েছে।", event.threadID);
    },

    tagall: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("❌ লোড হয়নি।", event.threadID);
            const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            const mentions = [];
            let body = "📢 সবার প্রতি ডাক! 📢\n━━━━━━━━━━━━━━━━━\n";
            for (const m of members) {
                const u = await new Promise(r => api.getUserInfo(m, (e, ret) => r(e ? { name: "Unknown" } : ret[m])));
                body += `@${u.name} `;
                mentions.push({ tag: u.name, id: m });
            }
            body += `\n━━━━━━━━━━━━━━━━━\n👥 মোট: ${info.participantIDs.length}\n💀 DEAD DESTROYER`;
            api.sendMessage({ body, mentions }, event.threadID);
        } catch (e) {
            api.sendMessage("❌ ট্যাগ হয়নি।", event.threadID);
        }
    },

    tagadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("❌ লোড হয়নি।", event.threadID);
            const mentions = [];
            let body = "👑 অ্যাডমিনদের প্রতি ডাক! 👑\n━━━━━━━━━━━━━━━━━\n";
            for (const a of info.adminIDs) {
                const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
                body += `👑 @${u.name} `;
                mentions.push({ tag: u.name, id: a.id });
            }
            body += `\n━━━━━━━━━━━━━━━━━\n💀 DEAD DESTROYER`;
            api.sendMessage({ body, mentions }, event.threadID);
        } catch (e) {
            api.sendMessage("❌ ট্যাগ হয়নি।", event.threadID);
        }
    },

    // ==================== ⚔️ Moderation ====================
    kick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("❌ ব্যবহার: /kick @user", event.threadID);
        const reason = args.slice(1).join(" ") || "কারণ নেই";
        api.removeUserFromGroup(target, event.threadID, (err) => {
            if (err) return api.sendMessage("❌ কিক করা যায়নি। বট অ্যাডমিন হতে হবে।", event.threadID);
            api.sendMessage(`👢 কিক করা হয়েছে। কারণ: ${reason}`, event.threadID);
        });
    },

    ban: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("❌ ব্যবহার: /ban @user", event.threadID);
        const db = getDB();
        if (!db.banned[event.threadID]) db.banned[event.threadID] = [];
        db.banned[event.threadID].push(target);
        saveDB(db);
        api.sendMessage(`🚫 ইউজারকে ব্যান করা হয়েছে।`, event.threadID);
    },

    warn: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0] || args[0];
        if (!target) return api.sendMessage("❌ ব্যবহার: /warn @user", event.threadID);
        const db = getDB();
        if (!db.warnings[event.threadID]) db.warnings[event.threadID] = {};
        db.warnings[event.threadID][target] = (db.warnings[event.threadID][target] || 0) + 1;
        saveDB(db);
        api.sendMessage(`⚠️ ওয়ার্নিং দেওয়া হয়েছে। মোট: ${db.warnings[event.threadID][target]}`, event.threadID);
    },

    inactive: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.sendMessage("📊 ৭ দিন নিষ্ক্রিয় মেম্বার লোড হচ্ছে...", event.threadID);
    },

    autokick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.autoKick = args[0] === "on";
        saveDB(db);
        api.sendMessage(`⚙️ Auto Kick: ${db.settings.autoKick ? "ON ✅" : "OFF ❌"}`, event.threadID);
    },

    lock: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        if (args[0] === "unlock") {
            db.settings.botLock = false;
            api.sendMessage("🔓 আনলক হয়েছে।", event.threadID);
        } else {
            db.settings.botLock = true;
            api.sendMessage("🔒 বট লক হয়েছে।", event.threadID);
        }
        saveDB(db);
    },

    unlock: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.botLock = false;
        saveDB(db);
        api.sendMessage("🔓 আনলক হয়েছে।", event.threadID);
    },

    antlink: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.antiLink = args[0] === "on";
        saveDB(db);
        api.sendMessage(`🔗 Anti Link: ${db.settings.antiLink ? "ON ✅" : "OFF ❌"}`, event.threadID);
    },

    dark: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.darkMode = !db.settings.darkMode;
        saveDB(db);
        api.sendMessage(`🌙 Dark Mode: ${db.settings.darkMode ? "ON" : "OFF"}`, event.threadID);
    },

    say: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const m = args.join(" ");
        if (!m) return api.sendMessage("❌ ব্যবহার: /say লেখা", event.threadID);
        api.sendMessage(m, event.threadID);
    },

    poll: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const q = args.join(" ") || "আপনার মত?";
        api.sendMessage(`📊 Poll: ${q}\n\n👍 হ্যাঁ\n👎 না`, event.threadID);
    },

    // ==================== 🎬 GIF Fun ====================
    hug: async (api, event) => {
        await sendWithGif(api, event, "🤗 উষ্ণ আলিঙ্গন!", "hug");
    },

    kiss: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0] || "কাউকে";
        await sendWithGif(api, event, `💋 @${t} কে চুমু!`, "kiss");
    },

    slap: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0] || "কাউকে";
        await sendWithGif(api, event, `👋 @${t} কে চড়!`, "slap");
    },

    pat: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0] || "কাউকে";
        await sendWithGif(api, event, `🫶 @${t} কে আদর!`, "pat");
    },

    dance: async (api, event) => {
        await sendWithGif(api, event, "💃 বট নাচছে!", "dance");
    },

    cry: async (api, event) => {
        await sendWithGif(api, event, "😭 বট কাঁদছে!", "cry");
    },

    laugh: async (api, event) => {
        await sendWithGif(api, event, "😂 বট হাসছে!", "laugh");
    },

    // ==================== 💰 Economy ====================
    balance: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        api.sendMessage(`💰 আপনার ব্যালেন্স: ${u.coins} কয়েন`, event.threadID);
    },

    daily: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const now = Date.now();
        if (now - u.lastDaily < 86400000) {
            const rem = Math.ceil((86400000 - (now - u.lastDaily)) / 3600000);
            return api.sendMessage(`⏳ ${rem} ঘণ্টা পরে আবার চেষ্টা করুন।`, event.threadID);
        }
        u.coins += 500;
        u.lastDaily = now;
        saveDB(db);
        api.sendMessage(`✅ ৫০০ কয়েন পেয়েছেন! মোট: ${u.coins}`, event.threadID);
    },

    work: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const e = Math.floor(Math.random() * 201) + 100;
        u.coins += e;
        saveDB(db);
        api.sendMessage(`💼 ${e} কয়েন আয়! মোট: ${u.coins}`, event.threadID);
    },

    gamble: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const amt = parseInt(args[0]);
        if (!amt || amt <= 0) return api.sendMessage("❌ ব্যবহার: /gamble 500", event.threadID);
        if (amt > u.coins) return api.sendMessage("❌ পর্যাপ্ত কয়েন নেই।", event.threadID);
        if (Math.random() < 0.5) {
            u.coins += amt;
            api.sendMessage(`🎉 জিতেছেন! +${amt}। মোট: ${u.coins}`, event.threadID);
        } else {
            u.coins -= amt;
            api.sendMessage(`😢 হেরেছেন! -${amt}। মোট: ${u.coins}`, event.threadID);
        }
        saveDB(db);
    },

    slots: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const amt = parseInt(args[0]) || 100;
        if (amt > u.coins) return api.sendMessage("❌ পর্যাপ্ত কয়েন নেই।", event.threadID);
        const s = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣"];
        const a = s[Math.floor(Math.random() * 6)];
        const b = s[Math.floor(Math.random() * 6)];
        const c = s[Math.floor(Math.random() * 6)];
        const r = `${a} | ${b} | ${c}`;
        if (a === b && b === c) {
            u.coins += amt * 3;
            api.sendMessage(`🎰 JACKPOT! ${r}\n+${amt * 3}! মোট: ${u.coins}`, event.threadID);
        } else {
            u.coins -= amt;
            api.sendMessage(`🎰 ${r}\n😢 -${amt}। মোট: ${u.coins}`, event.threadID);
        }
        saveDB(db);
    },

    rob: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("❌ ব্যবহার: /rob @user", event.threadID);
        const tu = getUser(db, t);
        if (tu.shield) return api.sendMessage("🛡️ টার্গেটের শিল্ড আছে!", event.threadID);
        const amt = Math.floor(Math.random() * 500) + 100;
        if (tu.coins < amt) return api.sendMessage("❌ টার্গেটের পর্যাপ্ত কয়েন নেই।", event.threadID);
        tu.coins -= amt;
        u.coins += amt;
        saveDB(db);
        api.sendMessage(`🦹 ${amt} কয়েন চুরি! মোট: ${u.coins}`, event.threadID);
    },

    shop: (api, event) => {
        const msg = `🛒 DEAD DESTROYER SHOP
━━━━━━━━━━━━━━━━━
🛡️ Shield - 2000 কয়েন
📄 Insurance - 3500
✖️ Double - 1500
💎 VIP - 5000
✨ Glow - 3000
🍀 Lucky - 1000
⚡ Booster - 1200
🔒 Locker - 4000
━━━━━━━━━━━━━━━━━
কিনতে: /buy [আইটেম]`;
        api.sendMessage(msg, event.threadID);
    },

    buy: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const it = args[0]?.toLowerCase();
        const prices = { shield: 2000, insurance: 3500, double: 1500, vip: 5000, glow: 3000, lucky: 1000, booster: 1200, locker: 4000 };
        if (!prices[it]) return api.sendMessage("❌ ব্যবহার: /buy [shield/insurance/double/vip/glow/lucky/booster/locker]", event.threadID);
        if (u.coins < prices[it]) return api.sendMessage(`❌ দরকার: ${prices[it]} কয়েন`, event.threadID);
        u.coins -= prices[it];
        u[it] = true;
        saveDB(db);
        api.sendMessage(`✅ ${it} কিনেছেন! বাকি: ${u.coins}`, event.threadID);
    },

    // ==================== 🎮 Fun ====================
    pair: async (api, event) => {
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("❌ লোড হয়নি।", event.threadID);
            const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            if (members.length < 2) return api.sendMessage("❌ অন্তত ২ জন দরকার।", event.threadID);
            const sh = members.sort(() => 0.5 - Math.random());
            const u1 = sh[0], u2 = sh[1];
            const n1 = await new Promise(r => api.getUserInfo(u1, (e, ret) => r(e ? { name: "Unknown" } : ret[u1])));
            const n2 = await new Promise(r => api.getUserInfo(u2, (e, ret) => r(e ? { name: "Unknown" } : ret[u2])));
            const comp = Math.floor(Math.random() * 41) + 60;

            const msg = `💕 Matchmaking Complete 💕
━━━━━━━━━━━━━━━━━━━━━━
❤️ ${n1.name} ❤️
        ➕
💙 ${n2.name} 💙
━━━━━━━━━━━━━━━━━━━━━━
💌 Destiny has written your names together 💌
💫 May your bond last forever ✨

💖 Compatibility: ${comp}%
${comp >= 90 ? "🔥 Perfect Match!" : comp >= 75 ? "💕 Great Match!" : "💖 Good Match!"}`;

            const mentions = [
                { tag: n1.name, id: u1 },
                { tag: n2.name, id: u2 }
            ];
            await sendWithGif(api, event, msg, 'pair', mentions);
        } catch (e) {
            api.sendMessage("❌ পেয়ার হয়নি।", event.threadID);
        }
    },

    ship: async (api, event) => {
        try {
            const mentions = Object.keys(event.mentions || {});
            let name1, name2;
            if (mentions.length >= 2) {
                const i1 = await new Promise(r => api.getUserInfo(mentions[0], (e, ret) => r(e ? { name: "Unknown" } : ret[mentions[0]])));
                const i2 = await new Promise(r => api.getUserInfo(mentions[1], (e, ret) => r(e ? { name: "Unknown" } : ret[mentions[1]])));
                name1 = i1.name; name2 = i2.name;
            } else {
                const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
                if (!info) return;
                const m = info.participantIDs.filter(id => id !== api.getCurrentUserID());
                const sh = m.sort(() => 0.5 - Math.random());
                const i1 = await new Promise(r => api.getUserInfo(sh[0], (e, ret) => r(e ? { name: "Unknown" } : ret[sh[0]])));
                const i2 = await new Promise(r => api.getUserInfo(sh[1], (e, ret) => r(e ? { name: "Unknown" } : ret[sh[1]])));
                name1 = i1.name; name2 = i2.name;
            }
            const p = Math.floor(Math.random() * 41) + 60;
            const hearts = p >= 90 ? "💖💖💖💖💖" : p >= 75 ? "💖💖💖💖" : "💖💖💖";
            const msg = `💘 Love Calculator 💘
━━━━━━━━━━━━━━━━━━━━━━
❤️ ${name1}
        ➕
💙 ${name2}
━━━━━━━━━━━━━━━━━━━━━━
💕 ভালোবাসা: ${p}%
${hearts}

${p >= 90 ? "🔥 পারফেক্ট কাপল!" : p >= 75 ? "💕 দারুণ জুটি!" : "💖 ভালো জুটি!"}`;
            await sendWithGif(api, event, msg, 'ship');
        } catch (e) {
            api.sendMessage("❌ শিপ হয়নি।", event.threadID);
        }
    },

    truth: (api, event) => {
        const t = ["তোমার সবচেয়ে বড় ভয় কী?", "তুমি কাকে ভালোবাসো?", "তোমার লুকানো প্রতিভা কী?", "তুমি কখনো মিথ্যা বলেছো?"];
        api.sendMessage(`❓ Truth: ${t[Math.floor(Math.random() * t.length)]}`, event.threadID);
    },

    dare: (api, event) => {
        const d = ["তোমার ক্রাশের নাম বলো", "একটি মজার ভিডিও পাঠাও", "তোমার শেষ ছবি পাঠাও", "একটি গান গাও"];
        api.sendMessage(`🔥 Dare: ${d[Math.floor(Math.random() * d.length)]}`, event.threadID);
    },

    roast: (api, event) => {
        const r = ["তুমি এত স্মার্ট যে গুগল তোমাকে সার্চ করে!", "তোমার মাথায় চুলের চেয়ে ভুল বেশি!", "তুমি এত ধীর যে কচ্ছপও ওভারটেক করে!"];
        api.sendMessage(`🔥 Roast: ${r[Math.floor(Math.random() * r.length)]}`, event.threadID);
    },

    top: (api, event) => {
        const db = getDB();
        const u = Object.entries(db.users).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0)).slice(0, 5);
        let msg = "🏆 Top Members:\n";
        u.forEach((x, i) => { msg += `${i + 1}. ${x[0]}: ${x[1].coins} কয়েন\n`; });
        api.sendMessage(msg || "❌ ডেটা নেই।", event.threadID);
    },

    // ==================== 🖼️ Utility ====================
    ghost: (api, event) => {
        api.sendMessage("👻 ২৪ ঘণ্টার জন্য ঘোস্ট মোড!", event.threadID);
    },

    autonick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.sendMessage(`✅ Auto Nick সেট: ${args.join(" ")}`, event.threadID);
    },

    vid: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        if (!args[0]) return api.sendMessage("❌ ব্যবহার: /vid [link]", event.threadID);
        api.sendMessage("📥 ভিডিও ডাউনলোড হচ্ছে...", event.threadID);
    },

    // ==================== 🛡️ Bot Admin ====================
    status: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 2);
        if (!perm.allowed) return sendPermissionDenied(api, event, 2);
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = Math.floor(up % 60);
        const msg = `╔══════════════════════════════╗
      💀 DEAD DESTROYER 💀
         System Status
╚══════════════════════════════╝
🟢 ONLINE ✅
⏱️ Uptime: ${h}ঘ ${m}মি ${s}সে
🤖 ${config.botName}
📦 কমান্ড: 42+
👑 Owner: ${config.owner}
🛠️ Dev: ${config.developer}
🛡️ Bot Admins: ${config.botAdmins?.length || 0} জন`;
        api.sendMessage(msg, event.threadID);
    },

    botadmins: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 2);
        if (!perm.allowed) return sendPermissionDenied(api, event, 2);
        let msg = "🛡️ বট অ্যাডমিন লিস্ট:\n━━━━━━━━━━━━━━━━━\n";
        if (!config.botAdmins || config.botAdmins.length === 0) {
            msg += "❌ কোনো বট অ্যাডমিন নেই।";
        } else {
            for (const id of config.botAdmins) {
                const info = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? { name: "Unknown" } : ret[id])));
                msg += `🛡️ ${info.name}\n🆔 ${id}\n`;
            }
        }
        api.sendMessage(msg, event.threadID);
    },

    maintenance: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 2);
        if (!perm.allowed) return sendPermissionDenied(api, event, 2);
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.maintenance = !db.settings.maintenance;
        saveDB(db);
        api.sendMessage(`🔧 Maintenance Mode: ${db.settings.maintenance ? "ON ⚠️" : "OFF ✅"}`, event.threadID);
    },

    // ==================== 👑 Owner ====================
    addadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("❌ ব্যবহার: /addadmin @user", event.threadID);

        const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        if (!newConfig.botAdmins) newConfig.botAdmins = [];
        if (newConfig.botAdmins.includes(target)) return api.sendMessage("⚠️ ইতিমধ্যেই বট অ্যাডমিন।", event.threadID);
        newConfig.botAdmins.push(target);
        fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
        api.sendMessage(`✅ ইউজারকে বট অ্যাডমিন করা হয়েছে!\n⚠️ বট রিস্টার্ট করুন।`, event.threadID);
    },

    removeadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("❌ ব্যবহার: /removeadmin @user", event.threadID);

        const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        if (!newConfig.botAdmins) newConfig.botAdmins = [];
        newConfig.botAdmins = newConfig.botAdmins.filter(id => id !== target);
        fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
        api.sendMessage(`✅ ইউজারকে সরানো হয়েছে!`, event.threadID);
    },

    restart: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        api.sendMessage("🔄 বট রিস্টার্ট হচ্ছে...", event.threadID, () => process.exit(0));
    }

};