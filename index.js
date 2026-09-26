const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');

const { 
    getDB, saveDB, timeFooter, 
    sendWithGif, guessGender, getUserRole, hasPermission, permissionDenied, 
    SLOW_MODE, sleep, isGroupThrottled, isBot, sendAdvancedGif, 
    generateWelcomeCard, checkPrefix,
    getOwnerList, getAdminList,
    healthCheck, cleanOldData,
    getRandomDelay, getCommandDelay, checkSpam
} = require('./utils');

// Guardian import
const { guardian } = require('./commands/guardian');

let appState;
try {
    if (process.env.APPSTATE) {
        appState = JSON.parse(process.env.APPSTATE);
        console.log("✅ AppState loaded from Render");
    } else {
        appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
        console.log("✅ AppState loaded from local");
    }
} catch (e) {
    console.error("❌ AppState load failed:", e.message);
    process.exit(1);
}

const commands = {};
function loadCommands(dir) {
    try {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            try {
                const mod = require(path.join(__dirname, dir, file));
                for (const name in mod) {
                    if (typeof mod[name] === 'function') {
                        commands[name] = mod[name];
                    }
                }
            } catch (e) {
                console.error(`❌ Load failed: ${file} -`, e.message);
            }
        }
    } catch (e) {}
}
loadCommands('./commands');
loadCommands('./security');
console.log(`📦 Total ${Object.keys(commands).length} commands loaded`);

const lastMsg = {};
const joinTracker = {};

login({ appState }, (err, api) => {
    if (err) return console.error("❌ Login failed:", err);

    global.globalBotApi = api;
    api.setOptions({ listenEvents: true, selfListen: false });
    console.log(`🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ is online`);

    // AUTO NOTIFICATION
    setTimeout(async () => {
        try {
            const db = getDB();
            if (!db.settings) db.settings = {};
            const dbGroups = Object.keys(db.groups || {});
            const configGroups = config.notifyGroups || [];
            const allGroups = [...new Set([...dbGroups, ...configGroups])];
            console.log(`📋 Groups to notify: ${allGroups.length}`);
            if (allGroups.length === 0) return;
            const currentVersion = config.version || "V2.0";
            if (db.settings.lastNotifiedVersion === currentVersion) return;
            const updateMsg = `🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ ᴜᴘᴅᴀᴛᴇ\n📌 ᴘʀᴇᴠɪᴏᴜꜱ: ${config.previousVersion || "V1.1"}\n🚀 ᴄᴜʀʀᴇɴᴛ : ${currentVersion}\n${timeFooter()}`;
            let sent = 0;
            for (const gid of allGroups) {
                try {
                    await new Promise(r => api.sendMessage(updateMsg, gid, () => r()));
                    sent++;
                    await sleep(getRandomDelay(6000, 12000));
                } catch (e) {}
            }
            db.settings.lastNotifiedVersion = currentVersion;
            saveDB(db);
            console.log(`🔔 Notified: ${sent}/${allGroups.length}`);
        } catch (e) {}
    }, 15000);

    // MAIN LISTENER
    api.listenMqtt(async (err, event) => {
        if (err) return console.error("MQTT Error:", err.message);
        if (!event) return;

        try {
            const db = getDB();
            const tid = event.threadID;

            // GROUP TRACKING
            if (tid && event.isGroup) {
                if (!db.groups) db.groups = {};
                if (!db.groups[tid]) {
                    db.groups[tid] = { firstSeen: Date.now(), lastSeen: Date.now(), name: event.threadName || "Unknown" };
                    saveDB(db);
                    try {
                        const newConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
                        if (!newConfig.notifyGroups) newConfig.notifyGroups = [];
                        if (!newConfig.notifyGroups.includes(tid)) {
                            newConfig.notifyGroups.push(tid);
                            fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
                        }
                    } catch (e) {}
                } else {
                    if (event.threadName && !db.groups[tid].lockName && event.threadName !== "Unknown") {
                        db.groups[tid].name = event.threadName;
                    }
                    db.groups[tid].lastSeen = Date.now();
                    saveDB(db);
                }
            }

            // USER ACTIVITY
            if (event.senderID && event.type === "message") {
                if (!db.users) db.users = {};
                if (!db.users[event.senderID]) db.users[event.senderID] = { points: 0, coins: 0, lastActive: 0 };
                db.users[event.senderID].points = (db.users[event.senderID].points || 0) + 1;
                db.users[event.senderID].lastActive = Date.now();
                saveDB(db);
            }

            // ==================== 🛡️ GUARDIAN CHECK ====================
            // ✅ FIX 1: try/catch যোগ করা হয়েছে যাতে guardian error main loop crash না করে
            if (event.type === "message" && event.body && tid) {
                try {
                    const isViolation = await guardian(api, event, config);
                    if (isViolation) return; // লঙ্ঘন হলে পরের প্রসেসিং বন্ধ
                } catch (gErr) {
                    console.error("⚠️ Guardian check error:", gErr.message);
                }
            }

            if (tid && db.security?.[tid]?.botOff && event.senderID !== config.owner) return;

            const sec = db.security?.[tid] || {};
            const grp = db.groups?.[tid] || {};
            const senderRole = event.senderID ? await getUserRole(api, event, config) : "member";
            const isOwner = senderRole === "owner";
            const isBotAdmin = senderRole === "botadmin";
            const isGroupAdmin = senderRole === "groupadmin";
            const isAdmin = isOwner || isBotAdmin || isGroupAdmin;

            // MESSAGE PROCESSING
            if (event.type === "message" && event.body) {
                const msg = event.body.trim();

                if (msg === config.prefix) {
                    await checkPrefix(api, event, config);
                    return;
                }

                if (db.afk?.[event.senderID]) {
                    delete db.afk[event.senderID];
                    saveDB(db);
                    api.sendMessage(`✅ 𝐖ᴇʟᴄᴏᴍᴇ 𝐁ᴀᴄᴋ!${timeFooter()}`, tid);
                }

                if (sec.onlyAdmin && !isAdmin) {
                    api.removeUserFromGroup(event.senderID, tid, () => {});
                    return;
                }

                if (sec.allMute && !isAdmin && !msg.startsWith(config.prefix)) {
                    api.unsendMessage(event.messageID);
                    return;
                }

                if (msg.toLowerCase() === "bot active" || msg.toLowerCase() === "bot") {
                    return api.sendMessage(`🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ 𝐈ꜱ 𝐀ᴄᴛɪᴠᴇ ✅${timeFooter()}`, tid);
                }

                if (msg.startsWith(config.prefix)) {
                    const args = msg.slice(config.prefix.length).split(' ');
                    const cmd = args.shift().toLowerCase();

                    if (isGroupThrottled(tid) && !isOwner) return;

                    if (commands[cmd]) {
                        console.log(`✅ Command: ${cmd}`);
                        const isSpam = checkSpam(tid);
                        if (isSpam) await sleep(10000);
                        
                        api.sendTypingIndicator(tid, () => {});
                        const commandDelay = await getCommandDelay(cmd);
                        await sleep(commandDelay);
                        
                        // ✅ FIX 2: await যোগ করা হয়েছে যাতে async command এর error ধরা পড়ে
                        // ✅ FIX 3: e.stack log করা হয়েছে যাতে exact error location দেখা যায়
                        try {
                            await commands[cmd](api, event, args, config);
                        } catch (e) {
                            console.error(`❌ ${cmd} error:`, e.message);
                            console.error(e.stack);
                        }
                    } else {
                        await sleep(getRandomDelay(800, 2000));
                        api.sendMessage(`❌ 𝐂ᴏᴍᴍᴀɴᴅ 𝐍ᴏᴛ 𝐅ᴏᴜɴᴅ: ${cmd}\n📖 ᴛʏᴘᴇ /help${timeFooter()}`, tid);
                    }
                }
            }

            // WELCOME EVENT
            if (event.logMessageType === "log:subscribe") {
                const added = event.logMessageData?.addedParticipants || [];
                const botID = api.getCurrentUserID();
                const isBotJoined = added.some(p => p.userFbId === botID);

                if (isBotJoined) {
                    api.sendMessage(`🌸 𝐓ʜᴀɴᴋꜱ 𝐅ᴏʀ 𝐀ᴅᴅɪɴɢ 𝐌ᴇ!\n💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ\n✅ ᴛʏᴘᴇ "bot active"${timeFooter()}`, tid);
                } else {
                    try {
                        const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                        const gname = info?.threadName || config.groupName || "SAYONARA NO MERCY - さよなら";
                        let mcount = info?.participantIDs?.length || 100;
                        let addedBy = "Unknown";
                        try {
                            const adminInfo = await new Promise(r => api.getUserInfo(event.author, (e, ret) => r(e ? null : ret[event.author])));
                            if (adminInfo && adminInfo.name) addedBy = adminInfo.name;
                        } catch (e) {}
                        const now = new Date();
                        const dateStr = `${now.toLocaleDateString('en-US')}, ${now.toLocaleTimeString('en-US')}`;

                        for (const p of added) {
                            const name = p.fullName || "New Member";
                            const welcomeText = `🌸 𝐇ᴇʟʟᴏ ${name}\n🎌 𝐖ᴇʟᴄᴏᴍᴇ ᴛᴏ ${gname}\n📊 𝐘ᴏᴜ'ʀᴇ ${mcount}ᴛʜ 𝐌ᴇᴍʙᴇʀ\n➕ 𝐀ᴅᴅᴇᴅ ʙʏ: ${addedBy}\n📅 ${dateStr}${timeFooter()}`;
                            api.sendMessage({ body: welcomeText, mentions: [{ tag: name, id: p.userFbId }] }, tid);
                            await sleep(getRandomDelay(2000, 4000));
                        }
                    } catch (e) {}
                }
            }

            // LEFT EVENT
            if (event.logMessageType === "log:unsubscribe") {
                const lid = event.logMessageData?.leftParticipantFbId;
                if (lid && lid !== api.getCurrentUserID()) {
                    const kicked = event.author !== lid;
                    try {
                        api.getUserInfo(lid, async (e, ret) => {
                            if (e) return;
                            const name = ret[lid]?.name || "A member";
                            const msg = kicked
                                ? `👢 ${name} 𝐖ᴀꜱ 𝐊ɪᴄᴋᴇᴅ${timeFooter()}`
                                : `🌸 ꜱᴀʏᴏɴᴀʀᴀ ${name}\n💔 𝐆ᴏᴏᴅʙʏᴇ${timeFooter()}`;
                            await sendAdvancedGif(api, event, msg, 'sayonara');
                        });
                    } catch (e) {}
                }
            }

        } catch (err) {
            console.error("Event Error:", err.message);
        }
    });
});

setInterval(async () => {
    try {
        if (!global.globalBotApi) return;
        const db = getDB();
        if (!db.security) return;
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        for (const tid in db.security) {
            if (!db.security[tid].autoKick) continue;
            global.globalBotApi.getThreadInfo(tid, async (err, info) => {
                if (err || !info) return;
                const botID = global.globalBotApi.getCurrentUserID();
                const admins = info.adminIDs.map(a => a.id);
                for (const mid of info.participantIDs) {
                    if (mid === botID || admins.includes(mid)) continue;
                    const u = db.users?.[mid];
                    if (!u || !u.lastActive) continue;
                    if (now - u.lastActive > SEVEN_DAYS) {
                        global.globalBotApi.removeUserFromGroup(mid, tid, () => {});
                    }
                }
            });
        }
    } catch (e) {}
}, 24 * 60 * 60 * 1000);

setInterval(async () => {
    try {
        const cleaned = cleanOldData();
        if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} old entries`);
    } catch (e) {}
}, 24 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ 24/7\nUptime: ${Math.floor(process.uptime())}s`);
}).listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Health server on port ${PORT}`);
});

const RENDER_URL = process.env.RENDER_URL || "https://destroy-k66o.onrender.com";
setInterval(async () => {
    try { await axios.get(RENDER_URL); } catch (e) {}
}, 4 * 60 * 1000);

process.on('uncaughtException', (err) => console.error("Uncaught:", err.message));
process.on('unhandledRejection', (err) => console.error("Unhandled:", err));
