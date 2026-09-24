const fs = require('fs');
const axios = require('axios');
const dbFile = './database.json';

// ==================== Database ====================
function getDB() {
    try {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    } catch (e) {
        return { groups: {}, users: {}, warnings: {}, banned: {}, activity: {}, settings: {} };
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

// ==================== Permission ====================
async function checkPermission(api, event, config, requiredLevel) {
    const senderID = event.senderID;
    const threadID = event.threadID;
    let userLevel = 0;
    let userRole = "User";

    if (senderID === config.owner) {
        userLevel = 3;
        userRole = "Owner";
    } else if (config.botAdmins && config.botAdmins.includes(senderID)) {
        userLevel = 2;
        userRole = "Bot Admin";
    } else {
        try {
            const info = await new Promise(r => api.getThreadInfo(threadID, (e, i) => r(e ? null : i)));
            if (info && info.adminIDs && info.adminIDs.some(a => a.id === senderID)) {
                userLevel = 1;
                userRole = "Group Admin";
            }
        } catch (e) {}
    }
    return { allowed: userLevel >= requiredLevel, userLevel, userRole };
}

function sendPermissionDenied(api, event, requiredLevel) {
    const levels = { 1: "Group Admin", 2: "Bot Admin", 3: "Owner" };
    api.sendMessage(
        `🚫 Permission Denied
━━━━━━━━━━━━━━━━━━━━━━━━
Required : ${levels[requiredLevel]}
Your Role: User
━━━━━━━━━━━━━━━━━━━━━━━━`,
        event.threadID
    );
}

// ==================== Anime GIF (Waifu.pics Auto) ====================
const WAIFU_API = "https://api.waifu.pics/sfw";

const animeCategories = {
    help: "wave",
    owner: "smile",
    hug: "hug",
    kiss: "kiss",
    slap: "slap",
    pat: "pat",
    dance: "dance",
    cry: "cry",
    laugh: "happy",
    pair: "cuddle",
    ship: "kiss",
    roast: "bonk",
    game: "dance",
    welcome: "wave",
    goodbye: "wave"
};

async function fetchAnimeGif(category) {
    try {
        const cat = animeCategories[category] || "hug";
        const res = await axios.get(`${WAIFU_API}/${cat}`, { timeout: 8000 });
        if (res.data && res.data.url) return res.data.url;
        return null;
    } catch (e) {
        // Fallback: Nekos.best
        try {
            const fallbackMap = { help: "wave", owner: "smile", pair: "cuddle", ship: "kiss", roast: "bonk" };
            const fbCat = fallbackMap[category] || "hug";
            const fbRes = await axios.get(`https://nekos.best/api/v2/${fbCat}`, { timeout: 8000 });
            if (fbRes.data && fbRes.data.results && fbRes.data.results[0]) {
                return fbRes.data.results[0].url;
            }
        } catch (e2) {}
        return null;
    }
}

async function sendWithGif(api, event, body, gifKey, mentions = []) {
    try {
        const gifUrl = await fetchAnimeGif(gifKey);
        if (gifUrl) {
            const gifRes = await axios.get(gifUrl, { responseType: 'stream', timeout: 8000 });
            api.sendMessage({ body, mentions, attachment: gifRes.data }, event.threadID);
        } else {
            api.sendMessage({ body, mentions }, event.threadID);
        }
    } catch (e) {
        api.sendMessage({ body, mentions }, event.threadID);
    }
}

// ==================== Module Exports ====================
module.exports = {

    // ==================== HELP (Role-based) ====================
    help: async (api, event, args, config) => {
        try {
            const senderID = event.senderID;
            const threadID = event.threadID;
            const perm = await checkPermission(api, event, config, 0);
            const userInfo = await new Promise(r => api.getUserInfo(senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[senderID])));
            
            const threadInfo = await new Promise(r => api.getThreadInfo(threadID, (e, i) => r(e ? null : i)));
            const groupName = threadInfo?.threadName || "Unknown Group";
            const memberCount = threadInfo?.participantIDs?.length || 0;
            const adminCount = threadInfo?.adminIDs?.length || 0;

            let adminNames = "None";
            if (threadInfo?.adminIDs && threadInfo.adminIDs.length > 0) {
                const names = [];
                for (const a of threadInfo.adminIDs.slice(0, 3)) {
                    const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
                    names.push(u.name);
                }
                adminNames = names.join(", ");
                if (threadInfo.adminIDs.length > 3) adminNames += ` +${threadInfo.adminIDs.length - 3}`;
            }

            const db = getDB();
            const rules = db.groups[threadID]?.rules || "No rules set yet";
            const user = getUser(db, senderID);

            // এখন তারিখ ও সময়
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });

            // ========== Role অনুযায়ী কমান্ড লিস্ট ==========
            let coreCmds = `
[ 01 ] USER INFO
──────────────────────────────
Name    : ${userInfo.name}
UID     : ${senderID}
Role    : ${perm.userRole}
Credit  : ${user.coins} coins
Date    : ${dateStr}
Time    : ${timeStr}

[ 02 ] GROUP INFO
──────────────────────────────
Group   : ${groupName}
Members : ${memberCount}
Admins  : ${adminCount}
Admin   : ${adminNames}

[ 03 ] RULES
──────────────────────────────
${rules}`;

            let publicCmds = `
[ 04 ] PUBLIC COMMANDS
──────────────────────────────
/help     - This menu
/ping     - Bot status
/uid      - Your ID
/owner    - Owner info
/balance  - Check coins
/daily    - Claim 500 coins
/work     - Earn coins
/gamble   - Gamble coins
/slots    - Slot machine
/shop     - Shop items
/buy      - Buy item
/top      - Top members
/game     - Game menu
/dice     - Roll dice
/coin     - Flip coin
/rps      - Rock Paper Scissors
/random   - Random number
/choose   - Pick option
/8ball    - Magic 8-ball
/quiz     - Quiz
/trivia   - Trivia
/pair     - Matchmaking
/ship     - Love calculator
/roast    - Roast user`;

            let adminCmds = `
[ 05 ] GROUP ADMIN COMMANDS
──────────────────────────────
/groupinfo    /adminlist
/members      /tagall
/tagadmin     /rules
/setrules     /kick @user
/ban @user    /warn @user
/inactive     /autokick
/lock         /unlock
/autonick     /resetnick
/setallnick   /say
/poll         /vid`;

            let botAdminCmds = `
[ 06 ] BOT ADMIN COMMANDS
──────────────────────────────
/status       /maintenance
/botadmins`;

            let ownerCmds = `
[ 07 ] OWNER COMMANDS
──────────────────────────────
/addadmin @user
/removeadmin @user
/restart`;

            // Role অনুযায়ী শুধু সেই কমান্ড দেখানো
            let fullMsg = coreCmds + publicCmds;

            if (perm.userLevel >= 1) fullMsg += adminCmds;
            if (perm.userLevel >= 2) fullMsg += botAdminCmds;
            if (perm.userLevel >= 3) fullMsg += ownerCmds;

            fullMsg += `

━━━━━━━━━━━━━━━━━━━━━━━━━━
💀 DEAD DESTROYER ${config.version}
👨‍💻 Developer: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            await sendWithGif(api, event, fullMsg, 'help');
        } catch (err) {
            console.error("help error:", err);
            api.sendMessage("Help menu failed.", event.threadID);
        }
    },

    // ==================== PING ====================
    ping: (api, event) => {
        const start = Date.now();
        api.sendMessage("🏓 Pong", event.threadID, () => {
            api.sendMessage(`⚡ Response: ${Date.now() - start}ms`, event.threadID);
        });
    },

    // ==================== OWNER ====================
    owner: async (api, event, args, config) => {
        try {
            const threadID = event.threadID;
            const db = getDB();
            const user = getUser(db, event.senderID);

            // বর্তমান তারিখ ও সময়
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
            const timeStr = now.toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });

            const ownerMsg = `👑 OWNER INFO 👑
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name       : Ariyan Shihab
🌹 Nick       : কীট গোলাপ
🎂 Age        : 21+
💖 Relation   : Single
📚 Profession : Student
🎓 Education  : Degree 1st Year
📍 Location   : Naoagon
━━━━━━━━━━━━━━━━━━━━━━━━
🔗 CONTACT
━━━━━━━━━━━━━━━━━━━━━━━━
📘 Facebook   : https://facebook.com/mdshihabofc
💬 Messenger  : https://m.me/mdshihabofc
━━━━━━━━━━━━━━━━━━━━━━━━
💰 Your Credit: ${user.coins} coins
📅 Date       : ${dateStr}
⏰ Time       : ${timeStr}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 DEAD DESTROYER ${config.version}
👨‍💻 Developer: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━`;

            await sendWithGif(api, event, ownerMsg, 'owner');
        } catch (err) {
            console.error("owner error:", err);
            api.sendMessage("Failed to load owner info.", event.threadID);
        }
    },

    // ==================== UID ====================
    uid: async (api, event, args) => {
        try {
            const mentions = Object.keys(event.mentions || {});
            if (mentions.length > 0) {
                for (const id of mentions) {
                    const name = event.mentions[id].replace('@', '');
                    api.sendMessage(`👤 Name: ${name}\n🆔 UID: ${id}\n🔗 https://facebook.com/${id}`, event.threadID);
                }
            } else {
                const info = await new Promise(r => api.getUserInfo(event.senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[event.senderID])));
                api.sendMessage(`👤 Name: ${info.name}\n🆔 UID: ${event.senderID}\n🔗 https://facebook.com/${event.senderID}`, event.threadID);
            }
        } catch (e) {
            api.sendMessage("Failed to load UID.", event.threadID);
        }
    },

    // ==================== GROUP ====================
    groupinfo: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return api.sendMessage("Failed to load.", event.threadID);
            api.sendMessage(`📊 Group Info\n━━━━━━━━━━━━━━━━━━━━━━\n📌 Name    : ${info.threadName}\n👥 Members : ${info.participantIDs.length}\n👑 Admins  : ${info.adminIDs.length}\n🆔 ID      : ${event.threadID}`, event.threadID);
        });
    },

    adminlist: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed to load.", event.threadID);
            let msg = "👑 Admin List\n━━━━━━━━━━━━━━━━━━━━━━\n";
            const mentions = [];
            for (const a of info.adminIDs) {
                const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
                msg += `👑 @${u.name}\n`;
                mentions.push({ tag: u.name, id: a.id });
            }
            api.sendMessage({ body: msg, mentions }, event.threadID);
        } catch (e) { api.sendMessage("Failed.", event.threadID); }
    },

    members: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return api.sendMessage("Failed.", event.threadID);
            api.sendMessage(`👥 Total members: ${info.participantIDs.length}`, event.threadID);
        });
    },

    rules: async (api, event) => {
        const db = getDB();
        const rules = db.groups[event.threadID]?.rules || "No rules set yet.";
        api.sendMessage(`📜 Group Rules\n━━━━━━━━━━━━━━━━━━━━━━\n${rules}`, event.threadID);
    },

    setrules: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].rules = args.join(" ") || "No rules set.";
        saveDB(db);
        api.sendMessage("✅ Rules updated.", event.threadID);
    },

    tagall: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed.", event.threadID);
            const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            const mentions = [];
            let body = "📢 Attention Everyone\n━━━━━━━━━━━━━━━━━━━━━━\n";
            for (const m of members) {
                const u = await new Promise(r => api.getUserInfo(m, (e, ret) => r(e ? { name: "Unknown" } : ret[m])));
                body += `@${u.name} `;
                mentions.push({ tag: u.name, id: m });
            }
            body += `\n━━━━━━━━━━━━━━━━━━━━━━\n👥 Total: ${info.participantIDs.length}`;
            api.sendMessage({ body, mentions }, event.threadID);
        } catch (e) { api.sendMessage("Tag failed.", event.threadID); }
    },

    tagadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed.", event.threadID);
            const mentions = [];
            let body = "👑 Attention Admins\n━━━━━━━━━━━━━━━━━━━━━━\n";
            for (const a of info.adminIDs) {
                const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
                body += `@${u.name} `;
                mentions.push({ tag: u.name, id: a.id });
            }
            api.sendMessage({ body, mentions }, event.threadID);
        } catch (e) { api.sendMessage("Tag failed.", event.threadID); }
    },

    // ==================== MODERATION ====================
    kick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("Usage: /kick @user", event.threadID);
        const reason = args.filter(a => !a.startsWith('@')).join(" ") || "No reason";
        api.removeUserFromGroup(target, event.threadID, (err) => {
            if (err) return api.sendMessage("Failed to kick. Bot needs admin.", event.threadID);
            api.sendMessage(`👢 User kicked. Reason: ${reason}`, event.threadID);
        });
    },

    ban: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("Usage: /ban @user", event.threadID);
        const db = getDB();
        if (!db.banned[event.threadID]) db.banned[event.threadID] = [];
        db.banned[event.threadID].push(target);
        saveDB(db);
        api.sendMessage("🚫 User banned.", event.threadID);
    },

    warn: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0] || args[0];
        if (!target) return api.sendMessage("Usage: /warn @user", event.threadID);
        const db = getDB();
        if (!db.warnings[event.threadID]) db.warnings[event.threadID] = {};
        db.warnings[event.threadID][target] = (db.warnings[event.threadID][target] || 0) + 1;
        saveDB(db);
        api.sendMessage(`⚠️ Warning issued. Total: ${db.warnings[event.threadID][target]}`, event.threadID);
    },

    inactive: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);

        try {
            const db = getDB();
            if (!db.activity || !db.activity[event.threadID]) {
                return api.sendMessage("No activity data yet.", event.threadID);
            }

            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed.", event.threadID);

            const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            const inactiveList = [];
            const botID = api.getCurrentUserID();
            const admins = info.adminIDs.map(a => a.id);

            for (const memberID of info.participantIDs) {
                if (memberID === botID) continue;
                if (admins.includes(memberID)) continue;
                const lastActive = db.activity[event.threadID][memberID];
                if (!lastActive) continue;
                if (now - lastActive > SEVEN_DAYS) {
                    const days = Math.floor((now - lastActive) / (24 * 60 * 60 * 1000));
                    const u = await new Promise(r => api.getUserInfo(memberID, (e, ret) => r(e ? { name: "Unknown" } : ret[memberID])));
                    inactiveList.push(`${u.name} - ${days} days`);
                }
            }

            if (inactiveList.length === 0) {
                return api.sendMessage("No inactive members (7+ days).", event.threadID);
            }

            const msg = `😴 Inactive Members (7+ days)\n━━━━━━━━━━━━━━━━━━━━━━\n${inactiveList.join("\n")}\n━━━━━━━━━━━━━━━━━━━━━━\nTotal: ${inactiveList.length}`;
            api.sendMessage(msg, event.threadID);
        } catch (e) {
            console.error("inactive error:", e);
            api.sendMessage("Failed.", event.threadID);
        }
    },

    autokick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);

        const db = getDB();
        if (!db.settings) db.settings = {};
        
        if (args[0] === "on") {
            db.settings.autoKick = true;
            saveDB(db);
            api.sendMessage("✅ Auto-Kick enabled. Inactive members (7+ days) will be kicked every 24 hours.", event.threadID);
        } else if (args[0] === "off") {
            db.settings.autoKick = false;
            saveDB(db);
            api.sendMessage("❌ Auto-Kick disabled.", event.threadID);
        } else {
            api.sendMessage(`⚙️ Auto-Kick: ${db.settings.autoKick ? "ON" : "OFF"}\n\nUsage:\n/autokick on\n/autokick off`, event.threadID);
        }
    },

    lock: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        if (args[0] === "unlock") {
            db.settings.botLock = false;
            api.sendMessage("🔓 Bot unlocked.", event.threadID);
        } else {
            db.settings.botLock = true;
            api.sendMessage("🔒 Bot locked.", event.threadID);
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
        api.sendMessage("🔓 Bot unlocked.", event.threadID);
    },

    // ==================== NICKNAME ====================
    autonick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("Usage: /autonick @user [name]", event.threadID);
        const nickname = args.filter(a => !a.startsWith('@')).join(" ").trim();
        if (!nickname) return api.sendMessage("Provide a nickname.", event.threadID);
        if (nickname.length > 30) return api.sendMessage("Max 30 characters.", event.threadID);
        api.changeNickname(nickname, event.threadID, target, (err) => {
            if (err) return api.sendMessage("Failed. Bot may need admin.", event.threadID);
            api.sendMessage(`✅ Nickname set: ${nickname}`, event.threadID);
        });
    },

    resetnick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0] || args[0];
        if (!target) return api.sendMessage("Usage: /resetnick @user", event.threadID);
        api.changeNickname("", event.threadID, target, (err) => {
            if (err) return api.sendMessage("Failed.", event.threadID);
            api.sendMessage("✅ Nickname reset.", event.threadID);
        });
    },

    setallnick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const nickname = args.join(" ").trim();
        if (!nickname) return api.sendMessage("Usage: /setallnick [name]", event.threadID);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed.", event.threadID);
            api.sendMessage(`⏳ Setting nickname for ${info.participantIDs.length} members...`, event.threadID);
            let success = 0, failed = 0;
            for (const id of info.participantIDs) {
                if (id === api.getCurrentUserID()) continue;
                await new Promise(resolve => {
                    api.changeNickname(nickname, event.threadID, id, (err) => {
                        if (err) failed++; else success++;
                        setTimeout(resolve, 300);
                    });
                });
            }
            api.sendMessage(`✅ Success: ${success}\n❌ Failed: ${failed}`, event.threadID);
        } catch (e) { api.sendMessage("Error.", event.threadID); }
    },

    // ==================== ECONOMY ====================
    balance: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        api.sendMessage(`💰 Your balance: ${u.coins} coins`, event.threadID);
    },

    daily: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const now = Date.now();
        if (now - u.lastDaily < 86400000) {
            const rem = Math.ceil((86400000 - (now - u.lastDaily)) / 3600000);
            return api.sendMessage(`⏳ Try again in ${rem} hours.`, event.threadID);
        }
        u.coins += 500;
        u.lastDaily = now;
        saveDB(db);
        api.sendMessage(`✅ You claimed 500 coins. Total: ${u.coins}`, event.threadID);
    },

    work: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const e = Math.floor(Math.random() * 201) + 100;
        u.coins += e;
        saveDB(db);
        api.sendMessage(`💼 You earned ${e} coins. Total: ${u.coins}`, event.threadID);
    },

    gamble: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const amt = parseInt(args[0]);
        if (!amt || amt <= 0) return api.sendMessage("Usage: /gamble 500", event.threadID);
        if (amt > u.coins) return api.sendMessage("Not enough coins.", event.threadID);
        if (Math.random() < 0.5) {
            u.coins += amt;
            api.sendMessage(`🎉 You won ${amt}. Total: ${u.coins}`, event.threadID);
        } else {
            u.coins -= amt;
            api.sendMessage(`😢 You lost ${amt}. Total: ${u.coins}`, event.threadID);
        }
        saveDB(db);
    },

    slots: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const amt = parseInt(args[0]) || 100;
        if (amt > u.coins) return api.sendMessage("Not enough coins.", event.threadID);
        const s = ["CHERRY", "LEMON", "ORANGE", "GRAPE", "GEM", "SEVEN"];
        const a = s[Math.floor(Math.random() * 6)];
        const b = s[Math.floor(Math.random() * 6)];
        const c = s[Math.floor(Math.random() * 6)];
        const r = `${a} | ${b} | ${c}`;
        if (a === b && b === c) {
            u.coins += amt * 3;
            api.sendMessage(`🎰 JACKPOT! ${r}\n+${amt * 3}. Total: ${u.coins}`, event.threadID);
        } else {
            u.coins -= amt;
            api.sendMessage(`🎰 ${r}\n-${amt}. Total: ${u.coins}`, event.threadID);
        }
        saveDB(db);
    },

    rob: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("Usage: /rob @user", event.threadID);
        const tu = getUser(db, t);
        if (tu.shield) return api.sendMessage("🛡️ Target has shield.", event.threadID);
        const amt = Math.floor(Math.random() * 500) + 100;
        if (tu.coins < amt) return api.sendMessage("Target has insufficient coins.", event.threadID);
        tu.coins -= amt;
        u.coins += amt;
        saveDB(db);
        api.sendMessage(`🦹 You stole ${amt}. Total: ${u.coins}`, event.threadID);
    },

    shop: (api, event) => {
        const msg = `🛒 SHOP
━━━━━━━━━━━━━━━━━━━━━━
🛡️ Shield    - 2000 coins
📄 Insurance - 3500 coins
✖️ Double    - 1500 coins
💎 VIP       - 5000 coins
✨ Glow      - 3000 coins
🍀 Lucky     - 1000 coins
⚡ Booster   - 1200 coins
🔒 Locker    - 4000 coins
━━━━━━━━━━━━━━━━━━━━━━
Buy: /buy [item]`;
        api.sendMessage(msg, event.threadID);
    },

    buy: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const it = args[0]?.toLowerCase();
        const prices = { shield: 2000, insurance: 3500, double: 1500, vip: 5000, glow: 3000, lucky: 1000, booster: 1200, locker: 4000 };
        if (!prices[it]) return api.sendMessage("Usage: /buy [shield/insurance/double/vip/glow/lucky/booster/locker]", event.threadID);
        if (u.coins < prices[it]) return api.sendMessage(`Need ${prices[it]} coins.`, event.threadID);
        u.coins -= prices[it];
        u[it] = true;
        saveDB(db);
        api.sendMessage(`✅ Purchased ${it}. Remaining: ${u.coins}`, event.threadID);
    },

    top: (api, event) => {
        const db = getDB();
        const u = Object.entries(db.users).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0)).slice(0, 5);
        let msg = "🏆 Top Members\n━━━━━━━━━━━━━━━━━━━━━━\n";
        u.forEach((x, i) => { msg += `${i + 1}. ${x[0]}: ${x[1].coins} coins\n`; });
        api.sendMessage(msg || "No data.", event.threadID);
    },

    // ==================== GAMES ====================
    game: async (api, event, args, config) => {
        const gamesList = `🎮 GAME ZONE 🎮
━━━━━━━━━━━━━━━━━━━━━━━━
🎲 /dice        - Roll a dice
🪙 /coin        - Flip a coin
🎰 /slots [amt] - Slot machine
🃏 /gamble [amt]- Gamble coins
✊ /rps [move]  - Rock Paper Scissors
🔢 /random      - Random number
🤔 /choose      - Pick from options
🎱 /8ball       - Magic 8-Ball
❓ /quiz        - Quiz question
🧠 /trivia      - Trivia question
━━━━━━━━━━━━━━━━━━━━━━━━
Use any command to play!
🤖 ${config.botName}`;

        await sendWithGif(api, event, gamesList, 'game');
    },

    dice: (api, event) => {
        const result = Math.floor(Math.random() * 6) + 1;
        api.sendMessage(`🎲 Dice rolled: ${result}`, event.threadID);
    },

    coin: (api, event) => {
        const result = Math.random() < 0.5 ? "HEADS" : "TAILS";
        api.sendMessage(`🪙 Coin flip: ${result}`, event.threadID);
    },

    rps: (api, event, args) => {
        const moves = ["rock", "paper", "scissors"];
        const botMove = moves[Math.floor(Math.random() * 3)];
        const userMove = args[0]?.toLowerCase();
        if (!userMove || !moves.includes(userMove)) {
            return api.sendMessage("Usage: /rps [rock/paper/scissors]", event.threadID);
        }
        let result;
        if (userMove === botMove) result = "TIE!";
        else if (
            (userMove === "rock" && botMove === "scissors") ||
            (userMove === "paper" && botMove === "rock") ||
            (userMove === "scissors" && botMove === "paper")
        ) result = "YOU WIN!";
        else result = "YOU LOSE!";
        api.sendMessage(`✊ RPS\nYou: ${userMove}\nBot: ${botMove}\n━━━━━━━━━━━━\nResult: ${result}`, event.threadID);
    },

    random: (api, event, args) => {
        const min = parseInt(args[0]) || 1;
        const max = parseInt(args[1]) || 100;
        if (min >= max) return api.sendMessage("Usage: /random 1 100", event.threadID);
        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        api.sendMessage(`🔢 Random (${min}-${max}): ${result}`, event.threadID);
    },

    choose: (api, event, args) => {
        const text = args.join(" ");
        if (!text) return api.sendMessage("Usage: /choose option1 | option2", event.threadID);
        const options = text.split("|").map(o => o.trim()).filter(o => o);
        if (options.length < 2) return api.sendMessage("Provide at least 2 options separated by |", event.threadID);
        const choice = options[Math.floor(Math.random() * options.length)];
        api.sendMessage(`🤔 I choose: ${choice}`, event.threadID);
    },

    '8ball': (api, event, args) => {
        const q = args.join(" ");
        if (!q) return api.sendMessage("Usage: /8ball [question]", event.threadID);
        const answers = ["Yes, definitely.", "No, not at all.", "Maybe...", "Ask again later.", "The stars say yes.", "Don't count on it.", "Most likely.", "Very doubtful."];
        const answer = answers[Math.floor(Math.random() * answers.length)];
        api.sendMessage(`🎱 Q: ${q}\nA: ${answer}`, event.threadID);
    },

    quiz: (api, event) => {
        const q = ["What is the capital of Bangladesh?", "How many continents?", "What is 5 + 5?", "Who invented the light bulb?", "What color is the sky?"];
        api.sendMessage(`❓ Quiz: ${q[Math.floor(Math.random() * q.length)]}`, event.threadID);
    },

    trivia: (api, event) => {
        const t = ["Honey never spoils.", "Octopuses have three hearts.", "A day on Venus is longer than a year.", "Bananas are berries.", "Eiffel Tower grows in summer."];
        api.sendMessage(`🧠 Trivia: Did you know? ${t[Math.floor(Math.random() * t.length)]}`, event.threadID);
    },

    // ==================== PAIR ====================
    pair: async (api, event) => {
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed to load.", event.threadID);
            
            const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            if (members.length < 2) {
                return api.sendMessage("Need at least 2 members.", event.threadID);
            }

            const sh = members.sort(() => 0.5 - Math.random());
            const u1 = sh[0], u2 = sh[1];

            const n1 = await new Promise(r => api.getUserInfo(u1, (e, ret) => r(e ? { name: "Unknown" } : ret[u1])));
            const n2 = await new Promise(r => api.getUserInfo(u2, (e, ret) => r(e ? { name: "Unknown" } : ret[u2])));

            const comp = Math.floor(Math.random() * 41) + 60;

            const msg = `💕 Matchmaking Complete 💕
━━━━━━━━━━━━━━━━━━━━━━━━
❤️ ${n1.name} ❤️
        ➕
💙 ${n2.name} 💙
━━━━━━━━━━━━━━━━━━━━━━━━
💌 Destiny has written your names together 💌
💫 May your bond last forever ✨

💖 Compatibility: ${comp}%
${comp >= 90 ? "🔥 PERFECT MATCH!" : comp >= 75 ? "💕 GREAT MATCH!" : "💖 GOOD MATCH!"}
━━━━━━━━━━━━━━━━━━━━━━━━`;

            const mentions = [
                { tag: n1.name, id: u1 },
                { tag: n2.name, id: u2 }
            ];

            await sendWithGif(api, event, msg, 'pair', mentions);
        } catch (e) {
            console.error("pair error:", e);
            api.sendMessage("Pair failed.", event.threadID);
        }
    },

    // ==================== SHIP ====================
    ship: async (api, event) => {
        try {
            const mentions = Object.keys(event.mentions || {});
            let name1, name2;

            if (mentions.length >= 2) {
                const i1 = await new Promise(r => api.getUserInfo(mentions[0], (e, ret) => r(e ? { name: "Unknown" } : ret[mentions[0]])));
                const i2 = await new Promise(r => api.getUserInfo(mentions[1], (e, ret) => r(e ? { name: "Unknown" } : ret[mentions[1]])));
                name1 = i1.name;
                name2 = i2.name;
            } else {
                const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
                if (!info) return api.sendMessage("Failed to load.", event.threadID);
                const m = info.participantIDs.filter(id => id !== api.getCurrentUserID());
                if (m.length < 2) return api.sendMessage("Need at least 2 members.", event.threadID);
                const sh = m.sort(() => 0.5 - Math.random());
                const i1 = await new Promise(r => api.getUserInfo(sh[0], (e, ret) => r(e ? { name: "Unknown" } : ret[sh[0]])));
                const i2 = await new Promise(r => api.getUserInfo(sh[1], (e, ret) => r(e ? { name: "Unknown" } : ret[sh[1]])));
                name1 = i1.name;
                name2 = i2.name;
            }

            const p = Math.floor(Math.random() * 41) + 60;
            const hearts = p >= 90 ? "💖💖💖💖💖" : p >= 75 ? "💖💖💖💖" : "💖💖💖";

            const msg = `💘 Love Calculator 💘
━━━━━━━━━━━━━━━━━━━━━━━━
❤️ ${name1}
        ➕
💙 ${name2}
━━━━━━━━━━━━━━━━━━━━━━━━
💕 Love: ${p}%
${hearts}

${p >= 90 ? "🔥 PERFECT COUPLE!" : p >= 75 ? "💕 GREAT PAIR!" : "💖 GOOD PAIR!"}
━━━━━━━━━━━━━━━━━━━━━━━━`;

            await sendWithGif(api, event, msg, 'ship');
        } catch (e) {
            console.error("ship error:", e);
            api.sendMessage("Ship failed.", event.threadID);
        }
    },

    // ==================== ROAST (Target User) ====================
    roast: async (api, event, args) => {
        try {
            const mentions = Object.keys(event.mentions || {});
            
            let targetID, targetName;
            
            if (mentions.length > 0) {
                targetID = mentions[0];
                targetName = event.mentions[targetID].replace('@', '');
            } else {
                targetID = event.senderID;
                const info = await new Promise(r => api.getUserInfo(event.senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[event.senderID])));
                targetName = info.name;
            }

            const roastTemplates = [
                `${targetName} is so slow that even a turtle would win a race against them!`,
                `${targetName} is like a cloud — when they disappear, it's a beautiful day!`,
                `${targetName} is so dumb that they stare at an orange juice box because it says "concentrate"!`,
                `${targetName} is the reason shampoo bottles have instructions!`,
                `${targetName} is so boring that even their shadow leaves them!`,
                `${targetName}'s brain has too many tabs open and none of them are loading!`,
                `${targetName} is proof that even evolution can make mistakes!`,
                `${targetName} is so ugly that when they were born, the doctor slapped their mother!`,
                `${targetName} is so poor that they can't even pay attention!`,
                `${targetName} is like a software update — when they appear, you think "not now"!`,
                `${targetName} is so annoying that even Alexa says "I don't understand" to them!`,
                `${targetName} is so useless that even Google asks "Do you mean someone else?"`,
                `${targetName} is the human version of a typo!`,
                `${targetName} is so forgetful that they forget what they're doing while doing it!`,
                `${targetName} is so lazy that they don't even wake up to their own alarm!`,
                `${targetName}'s jokes are so bad that even Wi-Fi signals avoid them!`,
                `${targetName} is so scared that they scream at their own shadow!`,
                `${targetName} is so confused that they get lost in their own thoughts!`,
                `${targetName} is like a broken pencil — pointless!`,
                `${targetName} is so weird that even aliens say "We don't want to meet them!"`
            ];

            const roast = roastTemplates[Math.floor(Math.random() * roastTemplates.length)];

            const msg = `🔥 ROAST 🔥
━━━━━━━━━━━━━━━━━━━━━━━━
${roast}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 DEAD DESTROYER`;

            await sendWithGif(api, event, msg, 'roast', [{ tag: targetName, id: targetID }]);

        } catch (e) {
            console.error("roast error:", e);
            api.sendMessage("Roast failed.", event.threadID);
        }
    },

    // ==================== UTILITY ====================
    say: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const m = args.join(" ");
        if (!m) return api.sendMessage("Usage: /say text", event.threadID);
        api.sendMessage(m, event.threadID);
    },

    poll: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const q = args.join(" ") || "Your opinion?";
        api.sendMessage(`📊 Poll: ${q}\n\n👍 Yes\n👎 No`, event.threadID);
    },

    ghost: (api, event) => {
        api.sendMessage("👻 Ghost mode activated for 24 hours.", event.threadID);
    },

    vid: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        if (!args[0]) return api.sendMessage("Usage: /vid [link]", event.threadID);
        api.sendMessage("📥 Downloading video...", event.threadID);
    },

    // ==================== BOT ADMIN ====================
    status: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 2);
        if (!perm.allowed) return sendPermissionDenied(api, event, 2);
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = Math.floor(up % 60);
        const msg = `⚙️ System Status
━━━━━━━━━━━━━━━━━━━━━━
🟢 Status: ONLINE
⏱️ Uptime: ${h}h ${m}m ${s}s
🤖 Name: ${config.botName}
👑 Owner: ${config.owner}
🛠️ Dev: ${config.developer}
🛡️ Bot Admins: ${config.botAdmins?.length || 0}`;
        api.sendMessage(msg, event.threadID);
    },

    botadmins: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 2);
        if (!perm.allowed) return sendPermissionDenied(api, event, 2);
        let msg = "🛡️ Bot Admins\n━━━━━━━━━━━━━━━━━━━━━━\n";
        if (!config.botAdmins || config.botAdmins.length === 0) {
            msg += "No bot admins.";
        } else {
            for (const id of config.botAdmins) {
                const info = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? { name: "Unknown" } : ret[id])));
                msg += `👤 ${info.name}\n🆔 ${id}\n`;
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
        api.sendMessage(`🔧 Maintenance: ${db.settings.maintenance ? "ON" : "OFF"}`, event.threadID);
    },

    // ==================== OWNER ====================
    addadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("Usage: /addadmin @user", event.threadID);
        const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        if (!newConfig.botAdmins) newConfig.botAdmins = [];
        if (newConfig.botAdmins.includes(target)) return api.sendMessage("Already admin.", event.threadID);
        newConfig.botAdmins.push(target);
        fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
        api.sendMessage("✅ Bot admin added.", event.threadID);
    },

    removeadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("Usage: /removeadmin @user", event.threadID);
        const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        if (!newConfig.botAdmins) newConfig.botAdmins = [];
        newConfig.botAdmins = newConfig.botAdmins.filter(id => id !== target);
        fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
        api.sendMessage("✅ Bot admin removed.", event.threadID);
    },

    restart: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        api.sendMessage("🔄 Restarting bot...", event.threadID, () => process.exit(0));
    }

};