const fs = require('fs');
const axios = require('axios');
const dbFile = './database.json';
const { createCanvas, loadImage } = require('@napi-rs/canvas');

// ==================== Database ====================
function getDB() {
    try {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    } catch (e) {
        return { groups: {}, users: {}, roles: {}, warnings: {}, blacklist: {}, security: {}, afk: {}, settings: {} };
    }
}
function saveDB(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// ==================== Time Footer ====================
function timeFooter() {
    const now = new Date();
    const options = { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric' };
    const timeOpt = { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true };
    const date = now.toLocaleDateString('en-GB', options);
    const time = now.toLocaleTimeString('en-US', timeOpt);
    return `\n\nᴛɪᴍᴇ: ${date} | ${time}\n💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄𝐌\nᴅʜᴀᴋᴀ, ʙᴅ`;
}

// ==================== Role System ====================
const ROLE_LEVELS = {
    "public": 0,
    "mod": 1,
    "groupadmin": 2,
    "botadmin": 3,
    "owner": 4
};

async function getUserRole(api, event, config) {
    const senderID = event.senderID;
    const threadID = event.threadID;
    const db = getDB();

    if (senderID === config.owner) return "owner";
    if (config.botAdmins && config.botAdmins.includes(senderID)) return "botadmin";
    if (db.roles[threadID] && db.roles[threadID][senderID]) return db.roles[threadID][senderID];

    try {
        const info = await new Promise(r => api.getThreadInfo(threadID, (e, i) => r(e ? null : i)));
        if (info && info.adminIDs && info.adminIDs.some(a => a.id === senderID)) {
            return "groupadmin";
        }
    } catch (e) {}
    return "public";
}

async function hasPermission(api, event, config, requiredRole) {
    const userRole = await getUserRole(api, event, config);
    return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[requiredRole] || 0);
}

function permissionDenied(api, event, requiredRole) {
    api.sendMessage(
        `🚫 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴀᴄᴄᴇꜱꜱ ᴅᴇɴɪᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
ʀᴇQᴜɪʀᴇᴅ : ${requiredRole.toUpperCase()}
ʏᴏᴜʀ ʀᴏʟᴇ: ᴜꜱᴇʀ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
        event.threadID
    );
}

// ==================== Anime GIF ====================
const WAIFU_API = "https://api.waifu.pics/sfw";

async function fetchAnimeGif(category) {
    try {
        const res = await axios.get(`${WAIFU_API}/${category}`, { timeout: 8000 });
        return res.data?.url || null;
    } catch (e) {
        try {
            const fbRes = await axios.get(`https://nekos.best/api/v2/${category}`, { timeout: 8000 });
            return fbRes.data?.results?.[0]?.url || null;
        } catch (e2) { return null; }
    }
}

async function sendWithGif(api, event, body, gifKey, mentions = []) {
    try {
        const gifUrl = await fetchAnimeGif(gifKey);
        if (gifUrl) {
            const res = await axios.get(gifUrl, { responseType: 'stream', timeout: 8000 });
            api.sendMessage({ body, mentions, attachment: res.data }, event.threadID);
        } else {
            api.sendMessage({ body, mentions }, event.threadID);
        }
    } catch (e) {
        api.sendMessage({ body, mentions }, event.threadID);
    }
}

// ==================== Advanced GIF Library ====================
const ADVANCED_GIFS = {
    itachi: [
        "https://media.tenor.com/x8v1oNUOmg4AAAAC/itachi-naruto.gif",
        "https://media.tenor.com/VlYdVjwfWQ8AAAAC/itachi-sharingan.gif"
    ],
    sayonara: [
        "https://media.tenor.com/8W3qY2zfX0AAAAAC/anime-goodbye.gif",
        "https://media.tenor.com/2Z4vX3WfY0AAAAAC/sad-goodbye-anime.gif"
    ],
    welcome: [
        "https://media.tenor.com/9W3qZfY3XwAAAAAC/anime-welcome.gif",
        "https://media.tenor.com/5K2zXfV3W0AAAAAC/welcome-anime.gif"
    ],
    love: [
        "https://media.tenor.com/XkZ3qWfN7B0AAAAC/anime-love-couple.gif"
    ]
};

async function fetchAdvancedGif(key) {
    const urls = ADVANCED_GIFS[key] || ADVANCED_GIFS.itachi;
    return urls[Math.floor(Math.random() * urls.length)];
}

async function sendAdvancedGif(api, event, body, gifKey, mentions = []) {
    try {
        const gifUrl = await fetchAdvancedGif(gifKey);
        const res = await axios.get(gifUrl, { responseType: 'stream', timeout: 8000 });
        api.sendMessage({ body, mentions, attachment: res.data }, event.threadID);
    } catch (e) {
        api.sendMessage({ body, mentions }, event.threadID);
    }
}

// ==================== Gender Detection ====================
function guessGender(name) {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    const parts = lower.split(/\s+/);
    const lastPart = parts[parts.length - 1];
    const firstPart = parts[0];

    const femaleEndings = ["akter", "akhtar", "khatun", "begum", "sultana", "banu", "nesa", "khanam", "bibi"];
    const maleEndings = ["islam", "hasan", "hossain", "rahman", "rahim", "karim", "kader", "ahmed", "ali", "khan", "chowdhury", "sarker", "miah", "mia", "haque", "uddin", "ullah"];

    for (const e of femaleEndings) if (lastPart.includes(e)) return "female";
    for (const e of maleEndings) if (lastPart.includes(e)) return "male";

    const malePrefixes = ["md", "mohammad", "mohammed", "muhammad", "abdul", "abdur", "abul", "sk", "sheikh", "syed"];
    for (const p of malePrefixes) if (firstPart === p) return "male";

    const femaleNames = ["riya", "priya", "puja", "tania", "mita", "rita", "rumi", "shilpi", "shila", "sima", "tisha", "trisha", "nipa", "mou", "sathi", "mim", "sumi", "sumaiya", "tasnim", "nusrat", "jannat", "sadia", "sanjida", "farzana", "farhana", "parvin", "nasrin", "sharmin", "shabnam", "ayesha", "aisha", "fatema", "mariam", "maryam", "urmi", "urna", "rukaiya", "fahima", "fahmida", "khadija", "yasmin", "yesmin", "tasnia", "tamanna", "mousumi", "nishi", "nishat", "zarin", "zarina", "zeba"];
    const maleNames = ["rakib", "rasel", "rafi", "rafsan", "raju", "rana", "rony", "shakib", "sakib", "shihab", "arif", "arafat", "ayan", "ayon", "sabbir", "shahin", "shahid", "sohel", "sujon", "sumon", "tanvir", "tonmoy", "tuhin", "tarek", "wasim", "yasin", "yeasin", "yousuf", "zahid", "zaman", "sohag", "shanto", "hasib", "emon", "emran", "imran", "ibrahim", "ismail", "jubayer", "junaid", "omar", "omor", "faruk", "farhan", "fahim", "faisal", "hridoy"];

    for (const n of femaleNames) if (lower.includes(n)) return "female";
    for (const n of maleNames) if (lower.includes(n)) return "male";

    return null;
}

// ==================== Bot Detection ====================
const BOT_KEYWORDS = ["bot", "Bot", "BOT", "auto", "Auto", "AUTO", "system", "System", "helper", "Helper"];

function isBot(userName) {
    if (!userName) return false;
    return BOT_KEYWORDS.some(kw => userName.toLowerCase().includes(kw.toLowerCase()));
}

// ==================== Slow Mode ====================
const SLOW_MODE = {
    commandDelay: 1500,
    responseDelay: 800,
    notificationDelay: 5000,
    groupCommandGap: 2000,
    botScanDelay: 3000,
    massActionDelay: 1000,
    broadcastDelay: 5000,
    typingDelay: 1000,
    afkDelay: 500
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const groupCommandTracker = {};

function isGroupThrottled(threadID) {
    const now = Date.now();
    const last = groupCommandTracker[threadID];
    if (last && now - last < SLOW_MODE.groupCommandGap) return true;
    groupCommandTracker[threadID] = now;
    return false;
}

async function generateWelcomeCard(userName, userAvatar, groupName, memberCount, addedBy, dateStr) {
    try {
        const canvas = createCanvas(700, 300);
        const ctx = canvas.getContext('2d');

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 700, 300);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 700, 300);

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 700, 300);

        // Border
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 680, 280);

        // Avatar
        if (userAvatar) {
            try {
                const avatarImg = await loadImage(userAvatar);
                ctx.save();
                ctx.beginPath();
                ctx.arc(120, 180, 70, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, 50, 110, 140, 140);
                ctx.restore();

                // Avatar border
                ctx.beginPath();
                ctx.arc(120, 180, 70, 0, Math.PI * 2);
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 4;
                ctx.stroke();
            } catch (e) {
                console.log("Avatar failed:", e.message);
            }
        }

        // WELCOME text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 45px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText('Welcome', 400, 110);

        // User name
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ffd700';
        const shortName = userName.length > 25 ? userName.slice(0, 22) + '...' : userName;
        ctx.fillText(shortName, 400, 160);

        // Group name
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffffff';
        const shortGroup = groupName.length > 30 ? groupName.slice(0, 27) + '...' : groupName;
        ctx.fillText(shortGroup, 400, 200);

        // Member count
        ctx.font = '16px Arial';
        ctx.fillStyle = '#b0b0b0';
        ctx.fillText(`You're the ${memberCount}th member`, 400, 230);

        // Added by
        ctx.font = '14px Arial';
        ctx.fillStyle = '#a0a0a0';
        ctx.fillText(`Added by: ${addedBy}`, 400, 255);

        // Branding
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#00d4ff';
        ctx.fillText('💀 SAYONARA SYSTEM 💀', 400, 285);

        return canvas.toBuffer('image/png');
    } catch (e) {
        console.error("Card generation error:", e.message);
        return null;
    }
}


module.exports = {
    getDB, saveDB, timeFooter, ROLE_LEVELS,
    getUserRole, hasPermission, permissionDenied,
    fetchAnimeGif, sendWithGif, guessGender,
    SLOW_MODE, sleep, isGroupThrottled,
    isBot, sendAdvancedGif, fetchAdvancedGif,
    generateWelcomeCard   // ← নতুন
};