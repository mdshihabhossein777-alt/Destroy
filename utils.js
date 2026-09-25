const fs = require('fs');
const axios = require('axios');
const dbFile = './database.json';

// ==================== 🗄️ Database ====================
function getDB() {
    try {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    } catch (e) {
        return { groups: {}, users: {}, roles: {}, vips: {}, brothers: {}, army: {}, warnings: {}, blacklist: {}, security: {}, afk: {}, botDetection: {}, settings: {} };
    }
}
function saveDB(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// ==================== 🕐 Real-Time Dhaka Clock ====================
function timeFooter() {
    const now = new Date();
    const options = { 
        timeZone: 'Asia/Dhaka',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const timeStr = now.toLocaleString('en-GB', options);
    const parts = timeStr.split(', ');
    const datePart = parts[0];
    const timePart = parts[1];
    
    return `\n\n🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸
⏰ ${datePart} | ${timePart}
🗾 ᴅʜᴀᴋᴀ, ʙᴀɴɢʟᴀᴅᴇꜱʜ
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ
🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸`;
}

function getDhakaTime() {
    const now = new Date();
    return now.toLocaleString('en-GB', {
        timeZone: 'Asia/Dhaka',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function getHourDhaka() {
    const now = new Date();
    const dhakaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
    return dhakaTime.getHours();
}

function isDayTime() {
    const hour = getHourDhaka();
    return hour >= 6 && hour < 20;
}

// ==================== 👑 Role System ====================
const ROLE_LEVELS = {
    "public": 0,
    "member": 1,
    "army": 2,
    "brother": 3,
    "vip": 4,
    "groupadmin": 5,
    "botadmin": 6,
    "owner": 7
};

function getOwnerList(config) {
    if (!config.owner) return [];
    if (Array.isArray(config.owner)) {
        return config.owner.map(id => String(id).trim()).filter(id => id);
    }
    if (typeof config.owner === "string") {
        return config.owner.split(",").map(id => id.trim()).filter(id => id);
    }
    return [];
}

function getAdminList(config) {
    if (!config.botAdmins) return [];
    if (Array.isArray(config.botAdmins)) {
        return config.botAdmins.map(id => String(id).trim()).filter(id => id);
    }
    if (typeof config.botAdmins === "string") {
        return config.botAdmins.split(",").map(id => id.trim()).filter(id => id);
    }
    return [];
}

async function getUserRole(api, event, config) {
    const senderID = String(event.senderID).trim();
    const threadID = event.threadID;
    const db = getDB();

    const ownerList = getOwnerList(config);
    if (ownerList.includes(senderID)) return "owner";

    const adminList = getAdminList(config);
    if (adminList.includes(senderID)) return "botadmin";

    try {
        const info = await new Promise(r => api.getThreadInfo(threadID, (e, i) => r(e ? null : i)));
        if (info && info.adminIDs && info.adminIDs.some(a => String(a.id).trim() === senderID)) {
            return "groupadmin";
        }
    } catch (e) {}

    if (db.vips[threadID] && db.vips[threadID].includes(senderID)) return "vip";
    if (db.brothers[threadID] && db.brothers[threadID].includes(senderID)) return "brother";
    if (db.army[threadID] && db.army[threadID].includes(senderID)) return "army";

    if (db.roles[threadID] && db.roles[threadID][senderID]) {
        return db.roles[threadID][senderID];
    }

    return "member";
}

async function hasPermission(api, event, config, requiredRole) {
    const userRole = await getUserRole(api, event, config);
    const userLevel = ROLE_LEVELS[userRole] || 0;
    const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
    return userLevel >= requiredLevel;
}

function permissionDenied(api, event, requiredRole) {
    const roleEmojis = {
        "owner": "👑",
        "botadmin": "🛡️",
        "groupadmin": "⚔️",
        "vip": "💎",
        "brother": "🤝",
        "army": "🎖️"
    };
    const emoji = roleEmojis[requiredRole] || "🔒";
    
    api.sendMessage(
        `🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸
       ⛔ 𝐀ᴄᴄᴇꜱꜱ 𝐃ᴇɴɪᴇᴅ
🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸

${emoji} 𝐑ᴇQᴜɪʀᴇᴅ: ${requiredRole.toUpperCase()}
👤 𝐘ᴏᴜʀ 𝐑ᴏʟᴇ: ᴜꜱᴇʀ

🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
        event.threadID
    );
}

// ==================== 🤖 Real-Time Bot Detection ====================
const BOT_KEYWORDS = [
    "bot", "Bot", "BOT", "auto", "Auto", "AUTO",
    "system", "System", "helper", "Helper",
    "assistant", "Assistant", "AI", "ai"
];

function isBot(userName) {
    if (!userName) return false;
    const lower = userName.toLowerCase();
    return BOT_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

async function scanBots(api, threadID) {
    try {
        const info = await new Promise(r => api.getThreadInfo(threadID, (e, i) => r(e ? null : i)));
        if (!info) return [];

        const botID = api.getCurrentUserID();
        const bots = [];

        for (const memberID of info.participantIDs) {
            if (memberID === botID) continue;
            try {
                const user = await new Promise(r => api.getUserInfo(memberID, (e, ret) => r(e ? null : ret[memberID])));
                if (user && isBot(user.name)) {
                    bots.push({
                        id: memberID,
                        name: user.name,
                        detectedAt: Date.now()
                    });
                }
                await sleep(200);
            } catch (e) {}
        }
        return bots;
    } catch (e) {
        return [];
    }
}

// ==================== 🎬 Anime GIF Library ====================
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

// ==================== 🌸 Itachi/Sakura Anime GIFs ====================
const ANIME_GIFS = {
    itachi: [
        "https://media.tenor.com/x8v1oNUOmg4AAAAC/itachi-naruto.gif",
        "https://media.tenor.com/VlYdVjwfWQ8AAAAC/itachi-sharingan.gif",
        "https://media.tenor.com/6n6sJZ2o3WAAAAAC/itachi-uchiha.gif"
    ],
    sasuke: [
        "https://media.tenor.com/3o7btPCcdNniyf0ArS/giphy.gif",
        "https://media.tenor.com/l0HlvtIPzPdt2usKs/giphy.gif"
    ],
    sakura: [
        "https://media.tenor.com/l2QDM9Jnim1YVILXa/giphy.gif"
    ],
    welcome: [
        "https://media.tenor.com/9W3qZfY3XwAAAAAC/anime-welcome.gif",
        "https://media.tenor.com/5K2zXfV3W0AAAAAC/welcome-anime.gif"
    ],
    sayonara: [
        "https://media.tenor.com/8W3qY2zfX0AAAAAC/anime-goodbye.gif",
        "https://media.tenor.com/2Z4vX3WfY0AAAAAC/sad-goodbye-anime.gif"
    ],
    love: [
        "https://media.tenor.com/XkZ3qWfN7B0AAAAC/anime-love-couple.gif"
    ]
};

async function fetchAdvancedGif(key) {
    const urls = ANIME_GIFS[key] || ANIME_GIFS.itachi;
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

// ==================== 👤 Gender Detection ====================
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

// ==================== 🐌 Slow Mode ====================
// ==================== 🐌 REAL HUMAN SLOW MODE ====================
const SLOW_MODE = {
    // ✅ কমান্ড প্রসেসিং (মানুষ যা করে)
    minCommandDelay: 1500,      // সর্বনিম্ন ১.৫ সেকেন্ড
    maxCommandDelay: 3500,      // সর্বোচ্চ ৩.৫ সেকেন্ড
    
    // ✅ রেসপন্স পাঠানো
    minResponseDelay: 800,      // ০.৮ সেকেন্ড
    maxResponseDelay: 2000,     // ২ সেকেন্ড
    
    // ✅ Typing Indicator (টাইপিং দেখানোর সময়)
    minTypingDelay: 800,
    maxTypingDelay: 1800,
    
    // ✅ একই গ্রুপে দুই কমান্ডের মাঝে বিরতি
    groupCommandGap: 3000,      // ৩ সেকেন্ড
    
    // ✅ নোটিফিকেশন পাঠানোর সময় (অনেক গ্রুপে স্প্যাম এড়াতে)
    notificationDelay: 8000,    // ৮ সেকেন্ড
    
    // ✅ বট স্ক্যান
    botScanDelay: 3000,
    
    // ✅ Mass Action (massnick, masskick)
    massActionDelay: 1500,
    
    // ✅ Broadcast
    broadcastDelay: 8000,       // ৮ সেকেন্ড
    
    // ✅ AFK
    afkDelay: 500
};

// ==================== 🎲 Random Delay Generator ====================
// মানুষের মতো র‍্যান্ডম সময় দেয়
function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==================== 🐌 Sleep Function ====================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 🎭 Human Typing Simulator ====================
// মানুষের মতো টাইপ করে - ধীরে ধীরে শব্দ টাইপ করে
async function simulateHumanTyping(api, threadID, text) {
    try {
        // Typing indicator দেখানোর জন্য
        api.sendTypingIndicator(threadID, () => {});
        
        // টেক্সট এর দৈর্ঘ্য অনুযায়ী delay
        const textLength = text.length;
        let typingTime = 0;
        
        if (textLength < 20) {
            typingTime = getRandomDelay(800, 1500);      // ছোট টেক্সট
        } else if (textLength < 50) {
            typingTime = getRandomDelay(1500, 2500);     // মাঝারি টেক্সট
        } else if (textLength < 100) {
            typingTime = getRandomDelay(2000, 3500);     // বড় টেক্সট
        } else {
            typingTime = getRandomDelay(3000, 5000);     // অনেক বড় টেক্সট
        }
        
        await sleep(typingTime);
        return typingTime;
    } catch (e) {
        return 1000;
    }
}

// ==================== 🎯 Advanced Command Delay ====================
// কমান্ড অনুযায়ী আলাদা সময়
async function getCommandDelay(commandName) {
    // ভারী কমান্ডে বেশি সময়
    const heavyCommands = ["massnick", "masskick", "nuke", "broadcast", "groupreset", "cleanadmin"];
    const lightCommands = ["ping", "help", "uid", "time"];
    
    if (heavyCommands.includes(commandName)) {
        return getRandomDelay(2500, 4500);   // ভারী: ২.৫-৪.৫ সেকেন্ড
    } else if (lightCommands.includes(commandName)) {
        return getRandomDelay(800, 1800);    // হালকা: ০.৮-১.৮ সেকেন্ড
    } else {
        return getRandomDelay(1500, 3000);   // সাধারণ: ১.৫-৩ সেকেন্ড
    }
}

// ==================== 🚫 Group Command Throttle ====================
const groupCommandTracker = {};
const groupMessageCount = {};

function isGroupThrottled(threadID) {
    const now = Date.now();
    const last = groupCommandTracker[threadID];
    if (last && now - last < SLOW_MODE.groupCommandGap) return true;
    groupCommandTracker[threadID] = now;
    return false;
}

// ==================== 📊 Anti-Spam Protection ====================
function checkSpam(threadID) {
    const now = Date.now();
    const windowSize = 60000; // ১ মিনিট
    
    if (!groupMessageCount[threadID]) {
        groupMessageCount[threadID] = [];
    }
    
    // ১ মিনিটের পুরনো ডেটা মুছুন
    groupMessageCount[threadID] = groupMessageCount[threadID].filter(
        timestamp => now - timestamp < windowSize
    );
    
    // নতুন মেসেজ যোগ করুন
    groupMessageCount[threadID].push(now);
    
    // ১ মিনিটে ২০টির বেশি মেসেজ = স্প্যাম সতর্কতা
    if (groupMessageCount[threadID].length > 20) {
        return true; // Spam detected
    }
    return false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//const groupCommandTracker = {};

function isGroupThrottled(threadID) {
    const now = Date.now();
    const last = groupCommandTracker[threadID];
    if (last && now - last < SLOW_MODE.groupCommandGap) return true;
    groupCommandTracker[threadID] = now;
    return false;
}

// ==================== 📊 Health Check ====================
function healthCheck() {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    return {
        status: "healthy",
        uptime: Math.floor(uptime),
        uptimeHuman: `${Math.floor(uptime / 3600)}ʜ ${Math.floor((uptime % 3600) / 60)}ᴍ`,
        memoryUsed: Math.round(mem.heapUsed / 1024 / 1024),
        memoryTotal: Math.round(mem.heapTotal / 1024 / 1024),
        avgPing: 0,
        time: getDhakaTime(),
        isDay: isDayTime()
    };
}

// ==================== 🧹 Cache Cleanup ====================
function cleanOldData() {
    try {
        const db = getDB();
        const now = Date.now();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        let cleaned = 0;

        if (db.afk) {
            for (const uid in db.afk) {
                if (now - (db.afk[uid].time || 0) > SEVEN_DAYS) {
                    delete db.afk[uid];
                    cleaned++;
                }
            }
        }

        saveDB(db);
        return cleaned;
    } catch (e) {
        return 0;
    }
}

// ==================== 🎨 Welcome Card ====================
async function generateWelcomeCard(userName, userAvatar, groupName, memberCount, addedBy, dateStr) {
    try {
        const apiUrl = `https://api.popcat.xyz/welcomecard?background=https://i.imgur.com/9YdvXbP.png&text1=${encodeURIComponent(userName)}&text2=${encodeURIComponent('Welcome to ' + groupName.slice(0, 25))}&text3=${encodeURIComponent("You're #" + memberCount + " member")}&avatar=${encodeURIComponent(userAvatar)}`;
        
        const response = await axios.get(apiUrl, { 
            responseType: 'arraybuffer', 
            timeout: 15000 
        });
        
        if (response.data && response.data.byteLength > 500) {
            return Buffer.from(response.data);
        }
        return null;
    } catch (e) {
        console.error("Card error:", e.message);
        return null;
    }
}

// ==================== 🌸 Prefix Check ====================
async function checkPrefix(api, event, config) {
    if (event.body === config.prefix) {
        const threadInfo = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
        const groupName = threadInfo?.threadName || config.groupName || "SAYONARA NO MERCY - さよなら";
        
        const msg = `🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸
   💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ 💀
       🏴 さよなら 🏴
🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸

🏴 𝐆ʀᴏᴜᴘ: ${groupName}
👨‍💻 𝐃ᴇᴠ: ${config.developer}
⚙️ 𝐕ᴇʀꜱɪᴏɴ: ${config.version}

━━━━━━━━━━━━━━━━━━━━━━━━
📖 𝐂ᴏᴍᴍᴀɴᴅ 𝐂ᴀᴛᴇɢᴏʀɪᴇꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
📄 /page1 - ᴄᴏʀᴇ ᴄᴍᴅꜱ
📄 /page2 - ᴍᴇᴍʙᴇʀ ᴄᴍᴅꜱ
📄 /page3 - ꜰᴜɴ ᴄᴍᴅꜱ
📄 /page4 - ᴘʀᴀɴᴋ ᴄᴍᴅꜱ
📄 /page5 - ɢʀᴏᴜᴘ ᴄᴍᴅꜱ
📄 /page6 - ᴍᴏᴅᴇʀᴀᴛɪᴏɴ
📄 /page7 - ꜱᴇᴄᴜʀɪᴛʏ

🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
        
        await sendAdvancedGif(api, event, msg, 'itachi');
        return true;
    }
    return false;
}

// ==================== 📤 Exports ====================
module.exports = {
    getDB, saveDB, timeFooter,
    getDhakaTime, getHourDhaka, isDayTime,
    ROLE_LEVELS, getUserRole, hasPermission, permissionDenied,
    getOwnerList, getAdminList,
    isBot, scanBots,
    fetchAnimeGif, sendWithGif,
    fetchAdvancedGif, sendAdvancedGif,
    guessGender,
    SLOW_MODE, sleep, isGroupThrottled,
    healthCheck, cleanOldData,
    generateWelcomeCard, checkPrefix,
    // ✅ নতুন যোগ করুন
    getRandomDelay,
    simulateHumanTyping,
    getCommandDelay,
    checkSpam
};