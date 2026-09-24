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
    pair: "cuddle",
    ship: "kiss",
    roast: "bonk",
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

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });

            let coreCmds = `
[ 01 ] USER INFO
──────────────────────────────
Name    : ${userInfo.name}
UID     : ${senderID}
Role    : ${perm.userRole}
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
/pair     - Boy-Girl matchmaking
/ship     - Love calculator
/roast    - Roast a user`;

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
/poll         /vid
/setgender    /genderlist
/cleargender`;

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

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

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
            api.sendMessage("✅ Auto-Kick enabled.", event.threadID);
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

    // ==================== SETGENDER ====================
    setgender: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);

        const target = Object.keys(event.mentions || {})[0];
        if (!target) {
            return api.sendMessage(
                `⚙️ Set Gender
━━━━━━━━━━━━━━━━━━━━━━
Usage: /setgender @user male
       /setgender @user female

Example:
/setgender @Riya female
/setgender @Omor male`,
                event.threadID
            );
        }

        const gender = args.filter(a => !a.startsWith('@'))[0]?.toLowerCase();
        if (!gender || !["male", "female", "boy", "girl"].includes(gender)) {
            return api.sendMessage("❌ Usage: /setgender @user male/female", event.threadID);
        }

        const normalizedGender = (gender === "boy") ? "male" : (gender === "girl") ? "female" : gender;

        const db = getDB();
        if (!db.groups) db.groups = {};
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        if (!db.groups[event.threadID].genders) db.groups[event.threadID].genders = {};

        db.groups[event.threadID].genders[target] = normalizedGender;
        saveDB(db);

        const name = event.mentions[target].replace('@', '');
        api.sendMessage(`✅ ${name} is set as ${normalizedGender.toUpperCase()}`, event.threadID);
    },

    genderlist: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);

        const db = getDB();
        if (!db.groups || !db.groups[event.threadID] || !db.groups[event.threadID].genders) {
            return api.sendMessage("❌ No gender data yet. Use /setgender to add.", event.threadID);
        }

        const genders = db.groups[event.threadID].genders;
        const males = [];
        const females = [];

        for (const id in genders) {
            const info = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? { name: "Unknown" } : ret[id])));
            if (genders[id] === "male") males.push(info.name);
            else if (genders[id] === "female") females.push(info.name);
        }

        let msg = `👥 Gender List\n━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `👦 Males (${males.length}):\n${males.join(", ") || "None"}\n\n`;
        msg += `👧 Females (${females.length}):\n${females.join(", ") || "None"}`;

        api.sendMessage(msg, event.threadID);
    },

    cleargender: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);

        const db = getDB();
        if (!db.groups || !db.groups[event.threadID]) {
            return api.sendMessage("❌ No data to clear.", event.threadID);
        }

        db.groups[event.threadID].genders = {};
        saveDB(db);
        api.sendMessage("✅ All gender data cleared.", event.threadID);
    },

    // ==================== PAIR (Boy + Girl Only) ====================
    pair: async (api, event) => {
        try {
            const threadID = event.threadID;
            const db = getDB();

            const info = await new Promise(r => api.getThreadInfo(threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("❌ Failed to load group info.", threadID);

            const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            if (members.length < 2) {
                return api.sendMessage("❌ Need at least 2 members.", threadID);
            }

            if (!db.groups) db.groups = {};
            if (!db.groups[threadID]) db.groups[threadID] = {};
            if (!db.groups[threadID].genders) db.groups[threadID].genders = {};

            const savedGenders = db.groups[threadID].genders || {};

            const maleList = [];
            const femaleList = [];

            for (const memberID of members) {
                if (savedGenders[memberID]) {
                    if (savedGenders[memberID] === "male") maleList.push(memberID);
                    else if (savedGenders[memberID] === "female") femaleList.push(memberID);
                    continue;
                }

                try {
                    const userInfo = await new Promise(r => api.getUserInfo(memberID, (e, ret) => r(e ? null : ret[memberID])));
                    if (userInfo && userInfo.gender) {
                        if (userInfo.gender === 2) maleList.push(memberID);
                        else if (userInfo.gender === 1) femaleList.push(memberID);
                    }
                } catch (e) {}
            }

            if (maleList.length === 0 || femaleList.length === 0) {
                return api.sendMessage(
                    `⚠️ Cannot find a boy-girl pair!
━━━━━━━━━━━━━━━━━━━━━━
👦 Males  : ${maleList.length}
👧 Females: ${femaleList.length}
━━━━━━━━━━━━━━━━━━━━━━
Use /setgender to register members:
/setgender @user male
/setgender @user female`,
                    threadID
                );
            }

            const boy = maleList[Math.floor(Math.random() * maleList.length)];
            const girl = femaleList[Math.floor(Math.random() * femaleList.length)];

            const boyInfo = await new Promise(r => api.getUserInfo(boy, (e, ret) => r(e ? { name: "Unknown" } : ret[boy])));
            const girlInfo = await new Promise(r => api.getUserInfo(girl, (e, ret) => r(e ? { name: "Unknown" } : ret[girl])));

            const comp = Math.floor(Math.random() * 41) + 60;

            const msg = `💕 Matchmaking Complete 💕
━━━━━━━━━━━━━━━━━━━━━━━━
👦 ${boyInfo.name}  ❤️  👧 ${girlInfo.name}
━━━━━━━━━━━━━━━━━━━━━━━━
💌 Destiny has written your names together 💌
💫 May your bond last forever ✨

💖 Compatibility: ${comp}%
${comp >= 90 ? "🔥 PERFECT MATCH!" : comp >= 75 ? "💕 GREAT MATCH!" : "💖 GOOD MATCH!"}
━━━━━━━━━━━━━━━━━━━━━━━━
💘 A beautiful couple made in heaven 💘`;

            const mentions = [
                { tag: boyInfo.name, id: boy },
                { tag: girlInfo.name, id: girl }
            ];

            await sendWithGif(api, event, msg, 'pair', mentions);
        } catch (e) {
            console.error("pair error:", e);
            api.sendMessage("❌ Pair failed.", event.threadID);
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

    // ==================== ROAST ====================
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