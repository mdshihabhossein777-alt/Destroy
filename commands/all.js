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
    api.sendMessage(`Permission denied.\nRequired: ${levels[requiredLevel]}\nYour role: User`, event.threadID);
}

// ==================== Anime GIFs ====================
const GIFS = {
    help: [
        "https://media.tenor.com/x8v1oNUOmg4AAAAC/itachi-naruto.gif",
        "https://media.tenor.com/VlYdVjwfWQ8AAAAC/itachi-sharingan.gif"
    ],
    hug: [
        "https://media.tenor.com/9B2-jZ7FKW0AAAAC/anime-hug.gif",
        "https://media.tenor.com/LF3P5YjR3r4AAAAC/anime-hug-couple.gif"
    ],
    kiss: [
        "https://media.tenor.com/CQkQ7J4N2X0AAAAC/anime-kiss.gif",
        "https://media.tenor.com/FUc8M1Nr7PAAAAAC/anime-kiss-love.gif"
    ],
    slap: [
        "https://media.tenor.com/6B3vN_P0yLAAAAAC/anime-slap.gif"
    ],
    pat: [
        "https://media.tenor.com/qVzVfEqB3L0AAAAC/anime-pat.gif"
    ],
    dance: [
        "https://media.tenor.com/8vY3Z4XbK0kAAAAC/anime-dance.gif"
    ],
    cry: [
        "https://media.tenor.com/8HZ3vXfK2Z4AAAAC/anime-cry.gif"
    ],
    laugh: [
        "https://media.tenor.com/5WzVf3XzF2AAAAAC/anime-laugh.gif"
    ],
    pair: [
        "https://media.tenor.com/XkZ3qWfN7B0AAAAC/anime-love-couple.gif"
    ],
    ship: [
        "https://media.tenor.com/8K3zVfW2XwAAAAAC/anime-love-heart.gif"
    ],
    game: [
        "https://media.tenor.com/3o7btPCcdNniyf0ArS/giphy.gif"
    ]
};

function pickGif(key) {
    const arr = GIFS[key] || GIFS.help;
    return arr[Math.floor(Math.random() * arr.length)];
}

async function sendWithGif(api, event, body, gifKey, mentions = []) {
    try {
        const url = pickGif(gifKey);
        const res = await axios.get(url, { responseType: 'stream', timeout: 8000 });
        api.sendMessage({ body, mentions, attachment: res.data }, event.threadID);
    } catch (e) {
        api.sendMessage({ body, mentions }, event.threadID);
    }
}

// ==================== Module Exports ====================
module.exports = {

    // ==================== HELP ====================
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

            const helpMsg = `╔══════════════════════════════════╗
     DEAD DESTROYER - HELP MENU
╚══════════════════════════════════╝

[ 01 ] USER INFO
──────────────────────────────────
Name    : ${userInfo.name}
UID     : ${senderID}
Role    : ${perm.userRole}
Credit  : ${user.coins} coins

[ 02 ] GROUP INFO
──────────────────────────────────
Group   : ${groupName}
Members : ${memberCount}
Admins  : ${adminCount}
Admin   : ${adminNames}

[ 03 ] RULES
──────────────────────────────────
${rules}

[ 04 ] CORE COMMANDS
──────────────────────────────────
1.  /help     - This menu
2.  /ping     - Bot status
3.  /uid      - Your ID
4.  /owner    - Owner info
5.  /game     - Game menu

[ 05 ] GROUP COMMANDS (Admin+)
──────────────────────────────────
6.  /groupinfo    7. /adminlist
8.  /members      9. /tagall
10. /tagadmin    11. /rules
12. /setrules

[ 06 ] MODERATION (Admin+)
──────────────────────────────────
13. /kick @user
14. /ban @user
15. /warn @user
16. /inactive
17. /autokick on/off
18. /lock
19. /unlock

[ 07 ] NICKNAME (Admin+)
──────────────────────────────────
20. /autonick @user [name]
21. /resetnick @user
22. /setallnick [name]

[ 08 ] ANIME GIF
──────────────────────────────────
23. /hug @user    24. /kiss @user
25. /slap @user   26. /pat @user
27. /dance        28. /cry
29. /laugh

[ 09 ] GAMES
──────────────────────────────────
30. /dice        31. /coin
32. /rps         33. /random
34. /choose      35. /8ball
36. /quiz        37. /trivia

[ 10 ] ECONOMY
──────────────────────────────────
38. /balance     39. /daily
40. /work        41. /gamble [amt]
42. /slots [amt] 43. /rob @user
44. /shop        45. /buy [item]
46. /top

[ 11 ] FUN
──────────────────────────────────
47. /pair        48. /ship
49. /truth       50. /dare
51. /roast

[ 12 ] UTILITY
──────────────────────────────────
52. /say [text]  53. /poll [text]
54. /ghost       55. /vid [link]

[ 13 ] BOT ADMIN
──────────────────────────────────
56. /status      57. /maintenance
58. /botadmins

[ 14 ] OWNER
──────────────────────────────────
59. /addadmin @user
60. /removeadmin @user
61. /restart

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEAD DESTROYER ${config.version}
Developer: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            await sendWithGif(api, event, helpMsg, 'help');
        } catch (err) {
            console.error("help error:", err);
            api.sendMessage("Help menu failed.", event.threadID);
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

    uid: async (api, event, args) => {
        try {
            const mentions = Object.keys(event.mentions || {});
            if (mentions.length > 0) {
                for (const id of mentions) {
                    const name = event.mentions[id].replace('@', '');
                    api.sendMessage(`Name: ${name}\nUID: ${id}\nProfile: https://facebook.com/${id}`, event.threadID);
                }
            } else {
                const info = await new Promise(r => api.getUserInfo(event.senderID, (e, ret) => r(e ? { name: "Unknown" } : ret[event.senderID])));
                api.sendMessage(`Your Name: ${info.name}\nYour UID: ${event.senderID}\nProfile: https://facebook.com/${event.senderID}`, event.threadID);
            }
        } catch (e) {
            api.sendMessage("Failed to load UID.", event.threadID);
        }
    },

    // ==================== GAME MENU ====================
    game: async (api, event, args, config) => {
        try {
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
💕 /pair        - Matchmaking
💘 /ship        - Love calculator
━━━━━━━━━━━━━━━━━━━━━━━━
Use any command to play!
🤖 ${config.botName}`;

            await sendWithGif(api, event, gamesList, 'game');
        } catch (e) {
            api.sendMessage("Failed to load games.", event.threadID);
        }
    },

    // ==================== GAME COMMANDS ====================
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

    // ==================== GROUP ====================
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
        } catch (e) { api.sendMessage("Failed.", event.threadID); }
    },

    members: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return api.sendMessage("Failed.", event.threadID);
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
        api.sendMessage("Rules updated.", event.threadID);
    },

    tagall: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed.", event.threadID);
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
        } catch (e) { api.sendMessage("Tag failed.", event.threadID); }
    },

    tagadmin: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed.", event.threadID);
            const mentions = [];
            let body = "Attention admins:\n------------------------------\n";
            for (const a of info.adminIDs) {
                const u = await new Promise(r => api.getUserInfo(a.id, (e, ret) => r(e ? { name: "Unknown" } : ret[a.id])));
                body += `@${u.name} `;
                mentions.push({ tag: u.name, id: a.id });
            }
            body += `\n------------------------------\n${config.botName}`;
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
        api.sendMessage("User banned.", event.threadID);
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

    // ==================== INACTIVE ====================
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

            const msg = `Inactive Members (7+ days):
━━━━━━━━━━━━━━━━━━━━━━━━
${inactiveList.join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━
Total: ${inactiveList.length}`;

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
            api.sendMessage("Auto-Kick enabled. Inactive members (7+ days) will be kicked every 24 hours.", event.threadID);
        } else if (args[0] === "off") {
            db.settings.autoKick = false;
            saveDB(db);
            api.sendMessage("Auto-Kick disabled.", event.threadID);
        } else {
            api.sendMessage(`Auto-Kick: ${db.settings.autoKick ? "ON" : "OFF"}\n\nUsage:\n/autokick on\n/autokick off`, event.threadID);
        }
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
            api.sendMessage(`Nickname set: ${nickname}`, event.threadID);
        });
    },

    resetnick: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 1);
        if (!perm.allowed) return sendPermissionDenied(api, event, 1);
        const target = Object.keys(event.mentions || {})[0] || args[0];
        if (!target) return api.sendMessage("Usage: /resetnick @user", event.threadID);
        api.changeNickname("", event.threadID, target, (err) => {
            if (err) return api.sendMessage("Failed.", event.threadID);
            api.sendMessage("Nickname reset.", event.threadID);
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
        } catch (e) { api.sendMessage("Error.", event.threadID); }
    },

    // ==================== ANIME GIF ====================
    hug: async (api, event) => { await sendWithGif(api, event, "Warm hug", "hug"); },
    kiss: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "someone";
        await sendWithGif(api, event, `Kiss for ${name}`, "kiss");
    },
    slap: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "someone";
        await sendWithGif(api, event, `Slap for ${name}`, "slap");
    },
    pat: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "someone";
        await sendWithGif(api, event, `Pat for ${name}`, "pat");
    },
    dance: async (api, event) => { await sendWithGif(api, event, "Bot is dancing", "dance"); },
    cry: async (api, event) => { await sendWithGif(api, event, "Bot is crying", "cry"); },
    laugh: async (api, event) => { await sendWithGif(api, event, "Bot is laughing", "laugh"); },

    // ==================== ECONOMY ====================
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
            api.sendMessage(`You won ${amt}. Total: ${u.coins}`, event.threadID);
        } else {
            u.coins -= amt;
            api.sendMessage(`You lost ${amt}. Total: ${u.coins}`, event.threadID);
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
        if (tu.shield) return api.sendMessage("Target has shield.", event.threadID);
        const amt = Math.floor(Math.random() * 500) + 100;
        if (tu.coins < amt) return api.sendMessage("Target has insufficient coins.", event.threadID);
        tu.coins -= amt;
        u.coins += amt;
        saveDB(db);
        api.sendMessage(`You stole ${amt}. Total: ${u.coins}`, event.threadID);
    },

    shop: (api, event) => {
        const msg = `SHOP
------------------------------
Shield    - 2000 coins
Insurance - 3500 coins
Double    - 1500 coins
VIP       - 5000 coins
Glow      - 3000 coins
Lucky     - 1000 coins
Booster   - 1200 coins
Locker    - 4000 coins
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

    top: (api, event) => {
        const db = getDB();
        const u = Object.entries(db.users).sort((a, b) => (b[1].coins || 0) - (a[1].coins || 0)).slice(0, 5);
        let msg = "Top Members:\n------------------------------\n";
        u.forEach((x, i) => { msg += `${i + 1}. ${x[0]}: ${x[1].coins} coins\n`; });
        api.sendMessage(msg || "No data.", event.threadID);
    },

    // ==================== FUN ====================
    pair: async (api, event) => {
        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return api.sendMessage("Failed.", event.threadID);
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
${comp >= 90 ? "PERFECT MATCH" : comp >= 75 ? "GREAT MATCH" : "GOOD MATCH"}`;
            const mentions = [{ tag: n1.name, id: u1 }, { tag: n2.name, id: u2 }];
            await sendWithGif(api, event, msg, 'pair', mentions);
        } catch (e) { api.sendMessage("Pair failed.", event.threadID); }
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
${p >= 90 ? "PERFECT COUPLE" : p >= 75 ? "GREAT PAIR" : "GOOD PAIR"}`;
            await sendWithGif(api, event, msg, 'ship');
        } catch (e) { api.sendMessage("Ship failed.", event.threadID); }
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
        const r = ["You are so smart Google searches for you!", "You have more mistakes than hair!", "Even turtles overtake you!"];
        api.sendMessage(`Roast: ${r[Math.floor(Math.random() * r.length)]}`, event.threadID);
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
        api.sendMessage(`Poll: ${q}\n\nYes / No`, event.threadID);
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

    // ==================== BOT ADMIN ====================
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
        api.sendMessage(`Maintenance: ${db.settings.maintenance ? "ON" : "OFF"}`, event.threadID);
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
        api.sendMessage("Bot admin added.", event.threadID);
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
        api.sendMessage("Bot admin removed.", event.threadID);
    },

    restart: async (api, event, args, config) => {
        const perm = await checkPermission(api, event, config, 3);
        if (!perm.allowed) return sendPermissionDenied(api, event, 3);
        api.sendMessage("Restarting bot...", event.threadID, () => process.exit(0));
    }

};