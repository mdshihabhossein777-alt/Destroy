const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');
const { getDB, saveDB, timeFooter, sendWithGif, guessGender, getUserRole, hasPermission, permissionDenied, SLOW_MODE, sleep, isGroupThrottled } = require('./utils');
// ==================== AppState Load ====================
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

// ==================== Load Commands ====================
const commands = {};
function loadCommands(dir) {
    try {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            try {
                const mod = require(path.join(__dirname, dir, file));
                for (const name in mod) {
                    if (typeof mod[name] === 'function') commands[name] = mod[name];
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
    console.log(`💀 ${config.botName} is online`);

    // ==================== 🔔 AUTO NOTIFICATION ON STARTUP ====================
    setTimeout(async () => {
        try {
            const db = getDB();
            if (!db.settings) db.settings = {};

            const dbGroups = Object.keys(db.groups || {});
            const configGroups = config.notifyGroups || [];
            const allGroups = [...new Set([...dbGroups, ...configGroups])];

            console.log(`📋 Groups to notify: ${allGroups.length} (DB: ${dbGroups.length}, Config: ${configGroups.length})`);

            if (allGroups.length === 0) {
                console.log("⚠️ No groups yet. Auto-track when messages arrive.");
                return;
            }

            const currentVersion = config.version || "V1.1";
            if (db.settings.lastNotifiedVersion === currentVersion) {
                console.log(`✅ Version ${currentVersion} already notified`);
                return;
            }

            const updateMsg = `🔔 ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ
━━━━━━━━━━━━━━━━━━━━━━━━
💀 ${config.botName}
━━━━━━━━━━━━━━━━━━━━━━━━
🆙 ᴠᴇʀꜱɪᴏɴ ᴜᴘᴅᴀᴛᴇ!

📌 ᴘʀᴇᴠɪᴏᴜꜱ: ${config.previousVersion || "V1.0"}
🚀 ᴄᴜʀʀᴇɴᴛ : ${currentVersion}
━━━━━━━━━━━━━━━━━━━━━━━━

✨ ɴᴇᴡ ꜰᴇᴀᴛᴜʀᴇꜱ:
🔹 ꜰᴜʟʟ ꜱᴇᴄᴜʀɪᴛʏ ꜱʏꜱᴛᴇᴍ
🔹 ꜱʟᴏᴡ ᴍᴏᴅᴇ
🔹 ɢʀᴏᴜᴘ ɴᴀᴍᴇ ʟᴏᴄᴋ

🛡️ /security on ꜰᴏʀ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ
📖 /help ꜰᴏʀ ᴄᴏᴍᴍᴀɴᴅꜱ

━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💻 ᴅᴇᴠ: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;

            let sent = 0, failed = 0;
            for (const gid of allGroups) {
                try {
                    await new Promise(r => api.sendMessage(updateMsg, gid, () => r()));
                    sent++;
                    await sleep(SLOW_MODE.notificationDelay);
                } catch (e) { failed++; }
            }

            db.settings.lastNotifiedVersion = currentVersion;
            db.settings.lastNotifiedAt = Date.now();
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
                if (!db.users[event.senderID]) db.users[event.senderID] = { points: 0, lastActive: 0 };
                db.users[event.senderID].points = (db.users[event.senderID].points || 0) + 1;
                db.users[event.senderID].lastActive = Date.now();
                saveDB(db);
            }

            // ==================== 🚫 BOT OFF ====================
            if (tid && db.security?.[tid]?.botOff && event.senderID !== config.owner) return;

            const sec = db.security?.[tid] || {};
            const grp = db.groups?.[tid] || {};
            const senderRole = event.senderID ? await getUserRole(api, event, config) : "public";
            const isOwner = senderRole === "owner";
            const isBotAdmin = senderRole === "botadmin";
            const isGroupAdmin = senderRole === "groupadmin";
            const isAdmin = isOwner || isBotAdmin || isGroupAdmin;

            // ==================== 🔒 LOCK NAME ====================
            if (event.logMessageType === "log:thread-name" && grp.lockName) {
                console.log(`🔒 Name change detected`);
                if (!isOwner && !isBotAdmin) {
                    let savedName = db.groups[tid]?.lockedName;
                    if (!savedName || savedName === "Unknown" || savedName.trim() === "") {
                        try {
                            const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                            if (info?.threadName && info.threadName !== "Unknown") {
                                savedName = info.threadName;
                                db.groups[tid].lockedName = savedName;
                                saveDB(db);
                            }
                        } catch (e) {}
                    }
                    if (savedName && savedName !== "Unknown") {
                        try {
                            await new Promise(r => api.setTitle(savedName, tid, () => r()));
                            api.sendMessage(`🔒 ɢʀᴏᴜᴘ ɴᴀᴍᴇ ɪꜱ ʟᴏᴄᴋᴇᴅ!\n📌 ʀᴇꜱᴛᴏʀᴇᴅ: ${savedName}${timeFooter()}`, tid);
                        } catch (e) {
                            console.error("Restore failed:", e.message);
                        }
                    }
                } else {
                    try {
                        const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                        if (info?.threadName && info.threadName !== "Unknown") {
                            db.groups[tid].lockedName = info.threadName;
                            db.groups[tid].name = info.threadName;
                            saveDB(db);
                        }
                    } catch (e) {}
                }
            }

            // ==================== 🔒 LOCK PHOTO ====================
            if (event.logMessageType === "log:thread-icon" && grp.lockPhoto && !isAdmin) {
                api.sendMessage(`🔒 ᴘʜᴏᴛᴏ ɪꜱ ʟᴏᴄᴋᴇᴅ!${timeFooter()}`, tid);
            }

            // ==================== 🔒 LOCK NICK ====================
            if (event.logMessageType === "log:user-nickname" && grp.lockNick && !isAdmin) {
                const target = event.logMessageData?.participant_id;
                if (target) {
                    try {
                        await new Promise(r => api.changeNickname("", tid, target, () => r()));
                        api.sendMessage(`🔒 ɴɪᴄᴋɴᴀᴍᴇ ɪꜱ ʟᴏᴄᴋᴇᴅ!${timeFooter()}`, tid);
                    } catch (e) {}
                }
            }

            // ==================== 🛡️ ANTI-RAID ====================
            if (event.logMessageType === "log:subscribe" && sec.antiRaid) {
                if (!joinTracker[tid]) joinTracker[tid] = [];
                const now = Date.now();
                joinTracker[tid] = joinTracker[tid].filter(t => now - t < 60000);
                joinTracker[tid].push(now);
                if (joinTracker[tid].length >= 5) {
                    db.groups[tid] = db.groups[tid] || {};
                    db.groups[tid].lockAll = true;
                    saveDB(db);
                    api.sendMessage(`🚨 ᴀɴᴛɪ-ʀᴀɪᴅ ᴛʀɪɢɢᴇʀᴇᴅ!${timeFooter()}`, tid);
                }
            }

            // ==================== 🎉 WELCOME ====================
            if (event.logMessageType === "log:subscribe") {
                const added = event.logMessageData?.addedParticipants || [];
                const botID = api.getCurrentUserID();
                const isBot = added.some(p => p.userFbId === botID);

                if (isBot) {
                    api.sendMessage(`👻 ᴛʜᴀɴᴋꜱ ꜰᴏʀ ᴀᴅᴅɪɴɢ ᴍᴇ!\n💀 ${config.botName}\n✅ ᴛʏᴘᴇ "bot active"${timeFooter()}`, tid);
                } else {
                    try {
                        const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                        const gname = info?.threadName || "Group";
                        const mcount = info?.participantIDs?.length || 0;
                        for (const p of added) {
                            const name = p.fullName || "New Member";
                            const wm = `🌸 ᴡᴇʟᴄᴏᴍᴇ ${name}!\n━━━━━━━━━━━━━━━━━━━━━━━━\n🌹 ᴛᴏ ᴏᴜʀ ꜰᴀᴍɪʟʏ!\n⭐ ᴡᴇ'ʀᴇ ᴇxᴄɪᴛᴇᴅ!\n━━━━━━━━━━━━━━━━━━━━━━━━\n👥 ᴍᴇᴍʙᴇʀꜱ: ${mcount}\n📌 ɢʀᴏᴜᴘ: ${gname}`;
                            await sendWithGif(api, event, wm + timeFooter(), 'wave', [{ tag: name, id: p.userFbId }]);
                        }
                    } catch (e) {}
                }
            }

            // ==================== 👋 LEFT ====================
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
                                ? `👢 ${name} ᴡᴀꜱ ᴋɪᴄᴋᴇᴅ\n👥 ʀᴇᴍᴀɪɴɪɴɢ: ${mcount}`
                                : `🍂 ɢᴏᴏᴅʙʏᴇ ${name}\n💔 ᴡᴇ'ʟʟ ᴍɪꜱꜱ ʏᴏᴜ\n👥 ʀᴇᴍᴀɪɴɪɴɢ: ${mcount}`;
                            await sendWithGif(api, event, msg + timeFooter(), 'wave');
                        });
                    } catch (e) {}
                }
            }

            // ==================== 💬 MESSAGE PROCESSING ====================
            if (event.type === "message" && event.body) {
                const msg = event.body.trim();

                // AFK
                if (db.afk?.[event.senderID]) {
                    delete db.afk[event.senderID];
                    saveDB(db);
                    await sleep(SLOW_MODE.afkDelay);
                    api.sendMessage(`✅ ᴡᴇʟᴄᴏᴍᴇ ʙᴀᴄᴋ!${timeFooter()}`, tid);
                }

                // Protections (Owner + Bot Admin bypass)
                if (!isOwner && !isBotAdmin) {
                    if (grp.antiLink && /(https?:\/\/|www\.|\.com|\.net)/gi.test(event.body) && !isAdmin) {
                        api.unsendMessage(event.messageID);
                        await sleep(SLOW_MODE.responseDelay);
                        api.sendMessage(`🔗 ʟɪɴᴋꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        return;
                    }
                    if (grp.antiGali && /(madarchod|bhenchod|fuck|shit|bastard|harami)/gi.test(event.body) && !isAdmin) {
                        api.unsendMessage(event.messageID);
                        await sleep(SLOW_MODE.responseDelay);
                        api.sendMessage(`🤬 ʙᴀᴅ ᴡᴏʀᴅꜱ!${timeFooter()}`, tid);
                        return;
                    }
                    if (grp.antiPhone && /(\+?880|01[3-9])\d{8,9}/g.test(event.body) && !isAdmin) {
                        api.unsendMessage(event.messageID);
                        await sleep(SLOW_MODE.responseDelay);
                        api.sendMessage(`📱 ᴘʜᴏɴᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        return;
                    }
                }

                // Anti-sticker/gif
                if (event.attachments && event.attachments.length > 0 && !isOwner && !isBotAdmin && !isAdmin) {
                    for (const att of event.attachments) {
                        if (grp.antiSticker && att.type === "sticker") {
                            api.unsendMessage(event.messageID);
                            await sleep(SLOW_MODE.responseDelay);
                            api.sendMessage(`🎨 ꜱᴛɪᴄᴋᴇʀꜱ!${timeFooter()}`, tid);
                        }
                        if (grp.antiGif && att.type === "animated_image") {
                            api.unsendMessage(event.messageID);
                            await sleep(SLOW_MODE.responseDelay);
                            api.sendMessage(`🎬 ɢɪꜰꜱ!${timeFooter()}`, tid);
                        }
                    }
                }

                // Only Admin
                if (sec.onlyAdmin && !isAdmin) {
                    api.removeUserFromGroup(event.senderID, tid, () => {});
                    return;
                }

                // All Mute
                if (sec.allMute && !isAdmin && !msg.startsWith(config.prefix)) {
                    api.unsendMessage(event.messageID);
                    return;
                }

                // Slow Mode
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
                    return api.sendMessage(`💀 ${config.botName} ɪꜱ ᴀᴄᴛɪᴠᴇ ✅\n🛡️ ꜱᴇᴄᴜʀɪᴛʏ: ${secCount} ᴀᴄᴛɪᴠᴇ${timeFooter()}`, tid);
                }

                // ==================== COMMAND PROCESSING ====================
                if (msg.startsWith(config.prefix)) {
                    const args = msg.slice(config.prefix.length).split(' ');
                    const cmd = args.shift().toLowerCase();

                    // Per-Group Throttle
                    if (isGroupThrottled(tid) && !isOwner) {
                        return;
                    }

                    if (commands[cmd]) {
                        console.log(`✅ Command: ${cmd}`);
                        await sleep(SLOW_MODE.typingDelay);
                        api.sendTypingIndicator(tid, () => {});
                        setTimeout(() => {
                            try {
                                commands[cmd](api, event, args, config);
                            } catch (e) {
                                console.error(`❌ ${cmd}:`, e.message);
                            }
                        }, SLOW_MODE.commandDelay);
                    } else {
                        await sleep(SLOW_MODE.responseDelay);
                        api.sendMessage(`❌ ᴄᴏᴍᴍᴀɴᴅ ɴᴏᴛ ꜰᴏᴜɴᴅ: ${cmd}${timeFooter()}`, tid);
                    }
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
                        global.globalBotApi.removeUserFromGroup(mid, tid, () => {
                            console.log(`[Auto-Kick] ${mid} from ${tid}`);
                        });
                    }
                }
            });
        }
    } catch (e) {}
}, 24 * 60 * 60 * 1000);

// ==================== 🌐 HEALTH SERVER ====================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`💀 ${config.botName} 24/7\nUptime: ${Math.floor(process.uptime())}s`);
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