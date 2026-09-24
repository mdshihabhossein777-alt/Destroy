const fs = require('fs');
const axios = require('axios');
const dbFile = './database.json';

// ==================== Database Helpers ====================
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

// ==================== Permission Checker ====================
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
    const levelNames = { 1: "Group Admin", 2: "Bot Admin", 3: "Owner" };
    api.sendMessage(
        `Permission denied.\nRequired: ${levelNames[requiredLevel]}\nYour role: User`,
        event.threadID
    );
}

// ==================== GIF Libraries ====================
// ==================== 🎬 Anime & Emotional GIF Library ====================
const gifLib = {
    help: [
        "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
        "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
        "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif"
    ],
    hug: [
        "https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif",
        "https://media.giphy.com/media/3o7abB06u9bNzA8lu8/giphy.gif",
        "https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
        "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif"
    ],
    kiss: [
        "https://media.giphy.com/media/G3va31o04lMKM/giphy.gif",
        "https://media.giphy.com/media/11k3uN9S0F7Xy8/giphy.gif",
        "https://media.giphy.com/media/3o6ZsYm5xYc0NhyWsw/giphy.gif"
    ],
    slap: [
        "https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif",
        "https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif",
        "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif"
    ],
    pat: [
        "https://media.giphy.com/media/109ltuoSQT212w/giphy.gif",
        "https://media.giphy.com/media/ARSp9T7wwxNcs/giphy.gif",
        "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif"
    ],
    dance: [
        "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
        "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
        "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif"
    ],
    cry: [
        "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
        "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif",
        "https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif",
        "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif"
    ],
    laugh: [
        "https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif",
        "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
        "https://media.giphy.com/media/3o6Zt8Me0j9kaZLLXG/giphy.gif"
    ],
    pair: [
        "https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif",
        "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
        "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
        "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
    ],
    ship: [
        "https://media.giphy.com/media/G3va31o04lMKM/giphy.gif",
        "https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif",
        "https://media.giphy.com/media/11k3uN9S0F7Xy8/giphy.gif"
    ],
    welcome: [
        "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
        "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
        "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
    ],
    goodbye: [
        "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
        "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif",
        "https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif"
    ]
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

// ==================== Module Exports ====================
module.exports = {

    // ==================== Core ====================
    help: async (api, event, args, config) => {
        try {
            const senderID = event.senderID;
            const perm = await checkPermission(api, event, config, 0);
            const info = await new Promise(r => api.getUserInfo(senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[senderID])));

            let publicCmds = `
------------------------------
Public Commands
------------------------------
Core: /help /ping /uid /owner
Economy: /balance /daily /work /gamble /slots /rob /shop /buy
Fun: /hug /kiss /slap /pat /dance /cry /laugh /pair /ship /truth /dare /roast /top`;

            let adminCmds = `
------------------------------
Group Admin Only
------------------------------
/kick /ban /warn
/tagall /tagadmin /members /adminlist /groupinfo
/lock /unlock /autokick /antlink /dark
/say /poll /autonick /resetnick /setallnick`;

            let botAdminCmds = `
------------------------------
Bot Admin Only
------------------------------
/status /maintenance /botadmins`;

            let ownerCmds = `
------------------------------
Owner Only
------------------------------
/addadmin /removeadmin /restart`;

            let extra = "";
            if (perm.userLevel >= 1) extra += adminCmds;
            if (perm.userLevel >= 2) extra += botAdminCmds;
            if (perm.userLevel >= 3) extra += ownerCmds;

            const msg = `${config.botName}
${config.version} - Help Menu

Name: ${info.name}
ID: ${senderID}
Role: ${perm.userRole}${publicCmds}${extra}

------------------------------
Developer: ${config.developer}`;

            await sendWithGif(api, event, msg, 'help');
        } catch (err) {
            console.error("help error:", err);
            api.sendMessage("Help menu failed to load.", event.threadID);
        }
    },

    ping: (api, event) => {
        const start = Date.now();
        api.sendMessage("Pong", event.threadID, () => {
            api.sendMessage(`Response: ${Date.now() - start}ms`, event.threadID);
        });
    },

    owner: async (api, event, args, config) => {
        const info = await new Promise(r => api.getUserInfo(config.owner, (e, ret) => r(e ? { name: "Unknown" } : ret[config.owner])));
        api.sendMessage(`Owner: ${info.name}\nID: ${config.owner}\nDeveloper: ${config.developer}`, event.threadID);
    },

    uid: async (api, event) => {
        try {
            const mentions = Object.keys(event.mentions || {});
            if (mentions.length > 0) {
                for (const id of mentions) {
                    const name = event.mentions[id].replace('@', '');
                    api.sendMessage(`${name}\nID: ${id}\nProfile: https://facebook.com/${id}`, event.threadID);
                }
            } else {
                const info = await new Promise(r => api.getUserInfo(event.senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[event.senderID])));
                api.sendMessage(`Your ID: ${event.senderID}\nName: ${info.name}\nProfile: https://facebook.com/${event.senderID}`, event.threadID);
            }
        } catch (e) {
            api.sendMessage("Failed to load ID.", event.threadID);
        }
    },

    // ==================== Group Info ====================
    groupinfo: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return api.sendMessage("Failed to load.", event.threadID);
            api.sendMessage(`Group: ${info.threadName}\nMembers: ${info.participantIDs.length}\nAdmins: ${info.adminIDs.length}\nID: ${event.threadID}`, event.threadID);
        });
    },

    adminlist: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed to load.", event.threadID);
            let msg = "Admin List:\n------------------------------\n";
            const mentions = [];
            for (const a of info.adminIDs) {
                const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
                msg += `@${u.name}\n`;
                mentions.push({ tag: u.name, id: a.id });
            }
            api.sendMessage({ body: msg, mentions }, event.threadID);
        } catch (e) {
            api.sendMessage("Failed to load.", event.threadID);
        }
    },

    members: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return api.sendMessage("Failed to load.", event.threadID);
            api.sendMessage(`Total members: ${info.participantIDs.length}`, event.threadID);
        });
    },

    rules: async (api, event) => {
        const db = getDB();
        const rules = db.groups[event.threadID]?.rules || "No rules set yet.";
        api.sendMessage(`Group Rules:\n${rules}`, event.threadID);
    },

    setrules: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].rules = args.join(" ") || "No rules set.";
        saveDB(db);
        api.sendMessage("Rules have been updated.", event.threadID);
    },

    tagall: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed to load.", event.threadID);
            const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            const mentions = [];
            let body = "Attention everyone:\n------------------------------\n";
            for (const m of members) {
                const u = await new Promise(r => api.getUserInfo(m, (e, ret) => r(e ? { name: "Unknown" } : ret[m])));
                body += `@${u.name} `;
                mentions.push({ tag: u.name, id: m });
            }
            body += `\n------------------------------\nTotal: ${info.participantIDs.length}\n${config.botName}`;
            api.sendMessage({ body, mentions }, event.threadID);
        } catch (e) {
            api.sendMessage("Tag failed.", event.threadID);
        }
    },

    tagadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed to load.", event.threadID);
            const mentions = [];
            let body = "Attention admins:\n------------------------------\n";
            for (const a of info.adminIDs) {
                const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
                body += `@${u.name} `;
                mentions.push({ tag: u.name, id: a.id });
            }
            body += `\n------------------------------\n${config.botName}`;
            api.sendMessage({ body, mentions }, event.threadID);
        } catch (e) {
            api.sendMessage("Tag failed.", event.threadID);
        }
    },

    // ==================== Moderation ====================
    kick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("Usage: /kick @user", event.threadID);
        const reason = args.filter(a => !a.startsWith('@')).join(" ") || "No reason";
        api.removeUserFromGroup(target, event.threadID, (err) => {
            if (err) return api.sendMessage("Failed to kick. Bot needs to be admin.", event.threadID);
            api.sendMessage(`User kicked. Reason: ${reason}`, event.threadID);
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
        api.sendMessage("User has been banned.", event.threadID);
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
        api.sendMessage(`Warning issued. Total: ${db.warnings[event.threadID][target]}`, event.threadID);
    },

    inactive: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.sendMessage("Loading inactive members...", event.threadID);
    },

    autokick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.autoKick = args[0] === "on";
        saveDB(db);
        api.sendMessage(`Auto Kick: ${db.settings.autoKick ? "ON" : "OFF"}`, event.threadID);
    },

    lock: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        if (args[0] === "unlock") {
            db.settings.botLock = false;
            api.sendMessage("Bot unlocked.", event.threadID);
        } else {
            db.settings.botLock = true;
            api.sendMessage("Bot locked.", event.threadID);
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
        api.sendMessage("Bot unlocked.", event.threadID);
    },

    antlink: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.antiLink = args[0] === "on";
        saveDB(db);
        api.sendMessage(`Anti Link: ${db.settings.antiLink ? "ON" : "OFF"}`, event.threadID);
    },

    dark: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.darkMode = !db.settings.darkMode;
        saveDB(db);
        api.sendMessage(`Dark Mode: ${db.settings.darkMode ? "ON" : "OFF"}`, event.threadID);
    },

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
        api.sendMessage(`Poll: ${q}\n\nYes / No`, event.threadID);
    },

    // ==================== Nickname ====================
    autonick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("Usage: /autonick @user [nickname]", event.threadID);
        const nickname = args.filter(a => !a.startsWith('@')).join(" ").trim();
        if (!nickname) return api.sendMessage("Please provide a nickname.", event.threadID);
        if (nickname.length > 30) return api.sendMessage("Nickname must be under 30 characters.", event.threadID);
        api.changeNickname(nickname, event.threadID, target, (err) => {
            if (err) return api.sendMessage("Failed to set nickname. Bot may need admin.", event.threadID);
            api.sendMessage(`Nickname set: ${nickname}`, event.threadID);
        });
    },

    resetnick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0] || args[0];
        if (!target) return api.sendMessage("Usage: /resetnick @user", event.threadID);
        api.changeNickname("", event.threadID, target, (err) => {
            if (err) return api.sendMessage("Failed to reset.", event.threadID);
            api.sendMessage("Nickname reset.", event.threadID);
        });
    },

    setallnick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const nickname = args.join(" ").trim();
        if (!nickname) return api.sendMessage("Usage: /setallnick [nickname]", event.threadID);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed to load.", event.threadID);
            api.sendMessage(`Setting nickname for ${info.participantIDs.length} members...`, event.threadID);
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
            api.sendMessage(`Success: ${success}\nFailed: ${failed}`, event.threadID);
        } catch (e) {
            api.sendMessage("Something went wrong.", event.threadID);
        }
    },

    // ==================== GIF Fun ====================
    hug: async (api, event) => { await sendWithGif(api, event, "Warm hug", "hug"); },
    kiss: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0] || "someone";
        await sendWithGif(api, event, `Kiss for @${t}`, "kiss");
    },
    slap: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0] || "someone";
        await sendWithGif(api, event, `Slap for @${t}`, "slap");
    },
    pat: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0] || "someone";
        await sendWithGif(api, event, `Pat for @${t}`, "pat");
    },
    dance: async (api, event) => { await sendWithGif(api, event, "Bot is dancing", "dance"); },
    cry: async (api, event) => { await sendWithGif(api, event, "Bot is crying", "cry"); },
    laugh: async (api, event) => { await sendWithGif(api, event, "Bot is laughing", "laugh"); },

    // ==================== Economy ====================
    balance: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        api.sendMessage(`Your balance: ${u.coins} coins`, event.threadID);
    },

    daily: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const now = Date.now();
        if (now - u.lastDaily < 86400000) {
            const rem = Math.ceil((86400000 - (now - u.lastDaily)) / 3600000);
            return api.sendMessage(`Try again in ${rem} hours.`, event.threadID);
        }
        u.coins += 500;
        u.lastDaily = now;
        saveDB(db);
        api.sendMessage(`You claimed 500 coins. Total: ${u.coins}`, event.threadID);
    },

    work: (api, event) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const e = Math.floor(Math.random() * 201) + 100;
        u.coins += e;
        saveDB(db);
        api.sendMessage(`You earned ${e} coins. Total: ${u.coins}`, event.threadID);
    },

    gamble: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const amt = parseInt(args[0]);
        if (!amt || amt <= 0) return api.sendMessage("Usage: /gamble 500", event.threadID);
        if (amt > u.coins) return api.sendMessage("Not enough coins.", event.threadID);
        if (Math.random() < 0.5) {
            u.coins += amt;
            api.sendMessage(`You won ${amt} coins. Total: ${u.coins}`, event.threadID);
        } else {
            u.coins -= amt;
            api.sendMessage(`You lost ${amt} coins. Total: ${u.coins}`, event.threadID);
        }
        saveDB(db);
    },

    slots: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const amt = parseInt(args[0]) || 100;
        if (amt > u.coins) return api.sendMessage("Not enough coins.", event.threadID);
        const s = ["cherry", "lemon", "orange", "grape", "gem", "seven"];
        const a = s[Math.floor(Math.random() * 6)];
        const b = s[Math.floor(Math.random() * 6)];
        const c = s[Math.floor(Math.random() * 6)];
        const r = `${a} | ${b} | ${c}`;
        if (a === b && b === c) {
            u.coins += amt * 3;
            api.sendMessage(`JACKPOT! ${r}\n+${amt * 3}. Total: ${u.coins}`, event.threadID);
        } else {
            u.coins -= amt;
            api.sendMessage(`${r}\n-${amt}. Total: ${u.coins}`, event.threadID);
        }
        saveDB(db);
    },

    rob: (api, event, args) => {
        const db = getDB();
        const u = getUser(db, event.senderID);
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage("Usage: /rob @user", event.threadID);
        const tu = getUser(db, t);
        if (tu.shield) return api.sendMessage("Target has shield. Rob failed.", event.threadID);
        const amt = Math.floor(Math.random() * 500) + 100;
        if (tu.coins < amt) return api.sendMessage("Target has insufficient coins.", event.threadID);
        tu.coins -= amt;
        u.coins += amt;
        saveDB(db);
        api.sendMessage(`You stole ${amt} coins. Total: ${u.coins}`, event.threadID);
    },

    shop: (api, event) => {
        const msg = `SHOP
------------------------------
Shield - 2000 coins
Insurance - 3500 coins
Double - 1500 coins
VIP - 5000 coins
Glow - 3000 coins
Lucky - 1000 coins
Booster - 1200 coins
Locker - 4000 coins
------------------------------
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
        api.sendMessage(`Purchased ${it}. Remaining: ${u.coins}`, event.threadID);
    },

    // ==================== Fun ====================
    pair: async (api, event) => {
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed to load.", event.threadID);
            const members = info.participantIDs.filter(id => id !== api.getCurrentUserID());
            if (members.length < 2) return api.sendMessage("Need at least 2 members.", event.threadID);
            const sh = members.sort(() => 0.5 - Math.random());
            const u1 = sh[0], u2 = sh[1];
            const n1 = await new Promise(r => api.getUserInfo(u1, (e, ret) => r(e ? { name: "Unknown" } : ret[u1])));
            const n2 = await new Promise(r => api.getUserInfo(u2, (e, ret) => r(e ? { name: "Unknown" } : ret[u2])));
            const comp = Math.floor(Math.random() * 41) + 60;

            const msg = `Matchmaking Complete
------------------------------
${n1.name}  +  ${n2.name}
------------------------------
Compatibility: ${comp}%
${comp >= 90 ? "Perfect Match" : comp >= 75 ? "Great Match" : "Good Match"}`;

            const mentions = [
                { tag: n1.name, id: u1 },
                { tag: n2.name, id: u2 }
            ];
            await sendWithGif(api, event, msg, 'pair', mentions);
        } catch (e) {
            api.sendMessage("Pair failed.", event.threadID);
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
            const msg = `Love Calculator
------------------------------
${name1}  +  ${name2}
------------------------------
Love: ${p}%

${p >= 90 ? "Perfect Couple" : p >= 75 ? "Great Pair" : "Good Pair"}`;
            await sendWithGif(api, event, msg, 'ship');
        } catch (e) {
            api.sendMessage("Ship failed.", event.threadID);
        }
    },

    truth: (api, event) => {
        const t = ["What is your biggest fear?", "Who do you love most?", "What is your hidden talent?", "Have you ever lied?"];
        api.sendMessage(`Truth: ${t[Math.floor(Math.random() * t.length)]}`, event.threadID);
    },

    dare: (api, event) => {
        const d = ["Say your crush's name", "Send a funny video", "Send your last photo", "Sing a song"];
        api.sendMessage(`Dare: ${d[Math.floor(Math.random() * d.length)]}`, event.threadID);
    },

    roast: (api, event) => {
        const r = ["You are so smart that Google searches you!", "You have more mistakes than hair on your head!", "You are so slow that even turtles overtake you!"];
        api.sendMessage(`Roast: ${r[Math.floor(Math.random() * r.length)]}`, event.threadID);
    },

    top: (api, event) => {
        const db = getDB();
        const u = Object.entries(db.users).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0)).slice(0, 5);
        let msg = "Top Members:\n------------------------------\n";
        u.forEach((x, i) => { msg += `${i + 1}. ${x[0]}: ${x[1].coins} coins\n`; });
        api.sendMessage(msg || "No data.", event.threadID);
    },

    ghost: (api, event) => {
        api.sendMessage("Ghost mode activated for 24 hours.", event.threadID);
    },

    vid: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        if (!args[0]) return api.sendMessage("Usage: /vid [link]", event.threadID);
        api.sendMessage("Downloading video...", event.threadID);
    },

    // ==================== Bot Admin ====================
    status: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 2);
        if (!perm.allowed) return sendPermissionDenied(api, event, 2);
        const up = process.uptime();
        const h = Math.floor(up / 3600), m = Math.floor((up % 3600) / 60), s = Math.floor(up % 60);
        const msg = `System Status
------------------------------
Status: ONLINE
Uptime: ${h}h ${m}m ${s}s
Name: ${config.botName}
Owner: ${config.owner}
Developer: ${config.developer}
Bot Admins: ${config.botAdmins?.length || 0}`;
        api.sendMessage(msg, event.threadID);
    },

    botadmins: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 2);
        if (!perm.allowed) return sendPermissionDenied(api, event, 2);
        let msg = "Bot Admins:\n------------------------------\n";
        if (!config.botAdmins || config.botAdmins.length === 0) {
            msg += "No bot admins.";
        } else {
            for (const id of config.botAdmins) {
                const info = await new Promise(r => api.getUserInfo(id, (e, ret) => r(e ? { name: "Unknown" } : ret[id])));
                msg += `${info.name}\nID: ${id}\n`;
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
        api.sendMessage(`Maintenance Mode: ${db.settings.maintenance ? "ON" : "OFF"}`, event.threadID);
    },

    // ==================== Owner ====================
    addadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        const target = Object.keys(event.mentions || {})[0];
        if (!target) return api.sendMessage("Usage: /addadmin @user", event.threadID);
        const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        if (!newConfig.botAdmins) newConfig.botAdmins = [];
        if (newConfig.botAdmins.includes(target)) return api.sendMessage("Already a bot admin.", event.threadID);
        newConfig.botAdmins.push(target);
        fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
        api.sendMessage("User added as bot admin. Restart bot to apply.", event.threadID);
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
        api.sendMessage("User removed from bot admins.", event.threadID);
    },

    restart: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        api.sendMessage("Bot is restarting...", event.threadID, () => process.exit(0));
    }

};