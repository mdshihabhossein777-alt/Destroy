const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');

// ==================== 🔧 Utils Import ====================
const { 
    getDB, saveDB, timeFooter, 
    sendWithGif, guessGender, getUserRole, hasPermission, permissionDenied, 
    SLOW_MODE, sleep, isGroupThrottled, isBot, sendAdvancedGif, 
    generateWelcomeCard, checkPrefix,
    getOwnerList, getAdminList,
    healthCheck, cleanOldData
} = require('./utils');

// ==================== 🔑 AppState Load ====================
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

// ==================== 📦 Load Commands ====================
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

// ==================== Trackers ====================
const lastMsg = {};
const joinTracker = {};

// ==================== Login ====================
login({ appState }, (err, api) => {
    if (err) return console.error("❌ Login failed:", err);

    global.globalBotApi = api;
    api.setOptions({ listenEvents: true, selfListen: false });
    console.log(`🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ is online`);

    // ==================== 🔔 AUTO NOTIFICATION ====================
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

            const updateMsg = `🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸
   💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ 💀
🌸 ━━━━━━━━━━━━━━━━━━━━━ 🌸

🔔 𝐔ᴘᴅᴀᴛᴇ 𝐍ᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ!

📌 ᴘʀᴇᴠɪᴏᴜꜱ: ${config.previousVersion || "V1.1"}
🚀 ᴄᴜʀʀᴇɴᴛ : ${currentVersion}

✨ ɴᴇᴡ ꜰᴇᴀᴛᴜʀᴇꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🎬 ᴀɴɪᴍᴇ ɢɪꜰ ꜱʏꜱᴛᴇᴍ
🛡️ ʙʀᴜᴛᴀʟ ꜱᴇᴄᴜʀɪᴛʏ
🎨 ᴡᴇʟᴄᴏᴍᴇ ᴄᴀʀᴅꜱ
💰 ᴇᴄᴏɴᴏᴍʏ + ɢᴀᴍᴇꜱ
🔒 ɢʀᴏᴜᴘ ʟᴏᴄᴋ ꜱʏꜱᴛᴇᴍ
🤖 ᴀɴᴛɪ-ʙᴏᴛ ᴅᴇᴛᴇᴄᴛɪᴏɴ

━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;

            let sent = 0, failed = 0;
            for (const gid of allGroups) {
                try {
                    const isValid = await new Promise(r => {
                        let done = false;
                        const timeout = setTimeout(() => { if (!done) { done = true; r(false); } }, 8000);
                        api.getThreadInfo(gid, (err, info) => {
                            if (done) return;
                            done = true;
                            clearTimeout(timeout);
                            if (err || !info) r(false);
                            else r(true);
                        });
                    });

                    if (!isValid) {
                        delete db.groups[gid];
                        continue;
                    }

                    await new Promise(r => api.sendMessage(updateMsg, gid, () => r()));
                    sent++;
                    await sleep(SLOW_MODE.notificationDelay);
                } catch (e) { failed++; }
            }

            db.settings.lastNotifiedVersion = currentVersion;
            saveDB(db);
            console.log(`🔔 Notified: ${sent}/${allGroups.length}`);
        } catch (e) { console.error("Notify error:", e.message); }
    }, 15000);

    // ==================== 📨 MAIN LISTENER ====================
    api.listenMqtt(async (err, event) => {
        if (err) return console.error("MQTT Error:", err.message);
        if (!event) return;

        try {
            const db = getDB();
            const tid = event.threadID;

            // ==================== 📊 AUTO GROUP TRACKING ====================
            if (tid && event.isGroup) {
                if (!db.groups) db.groups = {};
                if (!db.groups[tid]) {
                    db.groups[tid] = {
                        firstSeen: Date.now(),
                        lastSeen: Date.now(),
                        name: event.threadName || "Unknown"
                    };
                    saveDB(db);
                    console.log(`📊 NEW Group: ${tid}`);
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

            // ==================== 👤 USER ACTIVITY ====================
            if (event.senderID && event.type === "message") {
                if (!db.users) db.users = {};
                if (!db.users[event.senderID]) db.users[event.senderID] = { points: 0, coins: 0, lastActive: 0 };
                db.users[event.senderID].points = (db.users[event.senderID].points || 0) + 1;
                db.users[event.senderID].lastActive = Date.now();
                saveDB(db);
            }

            if (tid && db.security?.[tid]?.botOff && event.senderID !== config.owner) return;

            const sec = db.security?.[tid] || {};
            const grp = db.groups?.[tid] || {};
            const senderRole = event.senderID ? await getUserRole(api, event, config) : "member";
            const isOwner = senderRole === "owner";
            const isBotAdmin = senderRole === "botadmin";
            const isGroupAdmin = senderRole === "groupadmin";
            const isAdmin = isOwner || isBotAdmin || isGroupAdmin;

            // ==================== 💬 MESSAGE PROCESSING ====================
// ==================== 🛡️ REAL-TIME GUARDIAN CHECK ====================
if (event.type === "message" && event.body) {
    const { guardian } = require('./commands/guardian');
    const isViolation = await guardian(api, event, config);
    if (isViolation) return; // লঙ্ঘন হলে পরের প্রসেসিং বন্ধ
}


            if (event.type === "message" && event.body) {
                const msg = event.body.trim();

                // Prefix Only Check
                if (msg === config.prefix) {
                    await checkPrefix(api, event, config);
                    return;
                }

                // AFK
                if (db.afk?.[event.senderID]) {
                    delete db.afk[event.senderID];
                    saveDB(db);
                    api.sendMessage(`✅ 𝐖ᴇʟᴄᴏᴍᴇ 𝐁ᴀᴄᴋ!${timeFooter()}`, tid);
                }

                // Protections
                if (!isOwner && !isBotAdmin && !isAdmin) {
                    if (grp.antiLink && /(https?:\/\/|www\.|\.com|\.net)/gi.test(event.body)) {
                        api.unsendMessage(event.messageID);
                        api.sendMessage(`🔗 𝐋ɪɴᴋꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        return;
                    }
                    if (grp.antiGali && /(madarchod|bhenchod|fuck|shit|bastard|harami)/gi.test(event.body)) {
                        api.unsendMessage(event.messageID);
                        api.sendMessage(`🤬 𝐁ᴀᴅ 𝐖ᴏʀᴅꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        return;
                    }
                    if (grp.antiPhone && /(\+?880|01[3-9])\d{8,9}/g.test(event.body)) {
                        api.unsendMessage(event.messageID);
                        api.sendMessage(`📱 𝐏ʜᴏɴᴇ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        return;
                    }
                }

                // Anti-sticker/gif
                if (event.attachments && event.attachments.length > 0 && !isOwner && !isBotAdmin && !isAdmin) {
                    for (const att of event.attachments) {
                        if (grp.antiSticker && att.type === "sticker") {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🎨 𝐒ᴛɪᴄᴋᴇʀꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        }
                        if (grp.antiGif && att.type === "animated_image") {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🎬 𝐆ɪꜰꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        }
                    }
                }

                if (sec.onlyAdmin && !isAdmin) {
                    api.removeUserFromGroup(event.senderID, tid, () => {});
                    return;
                }

                if (sec.allMute && !isAdmin && !msg.startsWith(config.prefix)) {
                    api.unsendMessage(event.messageID);
                    return;
                }

                const slow = grp.slowMode || 0;
                if (slow > 0 && !isAdmin) {
                    if (lastMsg[tid] && Date.now() - lastMsg[tid] < slow * 1000) {
                        api.unsendMessage(event.messageID);
                        return;
                    }
                    lastMsg[tid] = Date.now();
                }

                // Bot Active
                if (msg.toLowerCase() === "bot active" || msg.toLowerCase() === "bot") {
                    const secCount = Object.keys(sec).filter(k => sec[k] === true).length;
                    return api.sendMessage(
                        `🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ 𝐈ꜱ 𝐀ᴄᴛɪᴠᴇ ✅\n🛡️ 𝐒ᴇᴄᴜʀɪᴛʏ: ${secCount} 𝐀ᴄᴛɪᴠᴇ${timeFooter()}`,
                        tid
                    );
                }

                // Command Processing
                if (msg.startsWith(config.prefix)) {
                    const args = msg.slice(config.prefix.length).split(' ');
                    const cmd = args.shift().toLowerCase();

                    if (isGroupThrottled(tid) && !isOwner) return;

                    if (commands[cmd]) {
                        console.log(`✅ Command: ${cmd} | Role: ${senderRole}`);
                        await sleep(SLOW_MODE.typingDelay);
                        api.sendTypingIndicator(tid, () => {});
                        setTimeout(() => {
                            try {
                                commands[cmd](api, event, args, config);
                            } catch (e) {
                                console.error(`❌ ${cmd} error:`, e.message);
                            }
                        }, SLOW_MODE.commandDelay);
                    } else {
                        await sleep(SLOW_MODE.responseDelay);
                        api.sendMessage(`❌ 𝐂ᴏᴍᴍᴀɴᴅ 𝐍ᴏᴛ 𝐅ᴏᴜɴᴅ: ${cmd}\n📖 ᴛʏᴘᴇ /help${timeFooter()}`, tid);
                    }
                }
            }

            // ==================== 🎉 WELCOME EVENT ====================
            if (event.logMessageType === "log:subscribe") {
                const added = event.logMessageData?.addedParticipants || [];
                const botID = api.getCurrentUserID();
                const isBotJoined = added.some(p => p.userFbId === botID);

                if (isBotJoined) {
                    api.sendMessage(
                        `🌸 𝐓ʜᴀɴᴋꜱ 𝐅ᴏʀ 𝐀ᴅᴅɪɴɢ 𝐌ᴇ!\n💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ\n✅ ᴛʏᴘᴇ "bot active"${timeFooter()}`,
                        tid
                    );
                } else {
                    try {
                        const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                        const gname = info?.threadName || config.groupName || "SAYONARA NO MERCY - さよなら";
                        
                        let mcount = 0;
                        if (info && info.participantIDs) {
                            if (Array.isArray(info.participantIDs)) mcount = info.participantIDs.length;
                            else if (typeof info.participantIDs === 'object') mcount = Object.keys(info.participantIDs).length;
                        }
                        if (mcount === 0) mcount = 100;

                        let addedBy = "Unknown";
                        try {
                            const adminInfo = await new Promise(r => api.getUserInfo(event.author, (e, ret) => r(e ? null : ret[event.author])));
                            if (adminInfo && adminInfo.name) addedBy = adminInfo.name;
                        } catch (e) {}

                        const now = new Date();
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayName = days[now.getDay()];
                        const dateStr = `${dayName}, ${now.toLocaleDateString('en-US')}, ${now.toLocaleTimeString('en-US')}`;

                        for (const p of added) {
                            const name = p.fullName || "New Member";
                            
                            const welcomeText = `🌸 𝐇ᴇʟʟᴏ ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
🎌 𝐖ᴇʟᴄᴏᴍᴇ ᴛᴏ ${gname}
━━━━━━━━━━━━━━━━━━━━━━━━
📊 𝐘ᴏᴜ'ʀᴇ ᴛʜᴇ ${mcount}ᴛʜ 𝐌ᴇᴍʙᴇʀ!
🎉 𝐄ɴᴊᴏʏ ʏᴏᴜʀ ꜱᴛᴀʏ!
━━━━━━━━━━━━━━━━━━━━━━━━
➕ 𝐀ᴅᴅᴇᴅ ʙʏ : ${addedBy}
📅 ${dateStr}${timeFooter()}`;

                            const avatarUrl = `https://graph.facebook.com/${p.userFbId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

                            // টেক্সট মেসেজ
                            api.sendMessage({
                                body: welcomeText,
                                mentions: [{ tag: name, id: p.userFbId }]
                            }, tid);

                            await sleep(1500);

                            // Welcome Card
                            const cardBuffer = await generateWelcomeCard(name, avatarUrl, gname, mcount, addedBy, dateStr);
                            if (cardBuffer) {
                                const { PassThrough } = require('stream');
                                const stream = new PassThrough();
                                stream.end(cardBuffer);
                                api.sendMessage({ attachment: stream }, tid);
                            } else {
                                await sendAdvancedGif(api, event, "🌸 𝐖ᴇʟᴄᴏᴍᴇ!", 'welcome');
                            }

                            await sleep(2000);
                        }
                    } catch (e) {
                        console.error("Welcome error:", e.message);
                    }
                }
            }

            // ==================== 👋 LEFT EVENT ====================
            if (event.logMessageType === "log:unsubscribe") {
                const lid = event.logMessageData?.leftParticipantFbId;
                if (lid && lid !== api.getCurrentUserID()) {
                    const kicked = event.author !== lid;
                    try {
                        const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                        api.getUserInfo(lid, async (e, ret) => {
                            if (e) return;
                            const name = ret[lid]?.name || "A member";
                            const mcount = info?.participantIDs?.length || 0;
                            const msg = kicked
                                ? `👢 ${name} 𝐖ᴀꜱ 𝐊ɪᴄᴋᴇᴅ\n👥 ʀᴇᴍᴀɪɴɪɴɢ: ${mcount}${timeFooter()}`
                                : `🌸 ꜱᴀʏᴏɴᴀʀᴀ ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
💔 𝐆ᴏᴏᴅʙʏᴇ, ꜰʀɪᴇɴᴅ
🌙 ᴍᴀʏ ʏᴏᴜ ꜰɪɴᴅ ᴘᴇᴀᴄᴇ
⭐ ᴡᴇ ᴡɪʟʟ ᴍɪꜱꜱ ʏᴏᴜ
━━━━━━━━━━━━━━━━━━━━━━━━
👥 ʀᴇᴍᴀɪɴɪɴɢ: ${mcount}${timeFooter()}`;
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

// ==================== ⏰ AUTO-KICK ====================
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

// ==================== 🧹 CACHE CLEANUP ====================
setInterval(async () => {
    try {
        const cleaned = cleanOldData();
        if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} old entries`);
    } catch (e) {}
}, 24 * 60 * 60 * 1000);

// ==================== 🌐 HEALTH SERVER ====================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ 24/7\nUptime: ${Math.floor(process.uptime())}s`);
}).listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Health server on port ${PORT}`);
});

// ==================== 🔄 SELF-PING ====================
const RENDER_URL = process.env.RENDER_URL || "https://destroy-k66o.onrender.com";
setInterval(async () => {
    try { await axios.get(RENDER_URL); } catch (e) {}
}, 4 * 60 * 1000);

// ==================== 🛡️ ERROR HANDLERS ====================
process.on('uncaughtException', (err) => console.error("Uncaught:", err.message));
process.on('unhandledRejection', (err) => console.error("Unhandled:", err));