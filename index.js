const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');

// ==================== 🔧 Utils Import ====================
const { getDB, saveDB, timeFooter, sendWithGif, guessGender, getUserRole, hasPermission, permissionDenied } = require('./utils');

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
    } catch (e) {
        console.error(`❌ Dir failed: ${dir} -`, e.message);
    }
}

loadCommands('./commands');
loadCommands('./security');
console.log(`📦 Total ${Object.keys(commands).length} commands loaded`);

// ==================== 🚫 Slow Mode Tracker ====================
const lastMsg = {};

// ==================== 🚀 Login ====================
login({ appState }, (err, api) => {
    if (err) return console.error("❌ Login failed:", err);

    global.globalBotApi = api;
    api.setOptions({ listenEvents: true, selfListen: false });
    console.log(`💀 ${config.botName} is online`);

    // ==================== 🔔 VERSION NOTIFICATION ====================
    setTimeout(async () => {
        try {
            const db = getDB();
            if (!db.settings) db.settings = {};

            if (db.settings.lastNotifiedVersion === config.version) {
                console.log(`✅ Version ${config.version} already notified`);
                return;
            }

            const dbGroups = Object.keys(db.groups || {});
            const configGroups = config.notifyGroups || [];
            const allGroups = [...new Set([...dbGroups, ...configGroups])];

            console.log(`📋 Groups to notify: ${allGroups.length}`);

            if (allGroups.length === 0) {
                console.log("⚠️ No groups yet. Auto-track will collect them.");
                return;
            }

            const updateMsg = `🔔 ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ
━━━━━━━━━━━━━━━━━━━━━━━━
💀 ${config.botName}
━━━━━━━━━━━━━━━━━━━━━━━━
🆙 ᴠᴇʀꜱɪᴏɴ ᴜᴘᴅᴀᴛᴇ!

📌 ᴘʀᴇᴠɪᴏᴜꜱ: ${config.previousVersion || "V1.0"}
🚀 ᴄᴜʀʀᴇɴᴛ : ${config.version}
━━━━━━━━━━━━━━━━━━━━━━━━

✨ ᴡʜᴀᴛ'ꜱ ɴᴇᴡ:
🔹 92 ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ
🔹 ɴᴇᴡ ᴘᴀɢᴇ ꜱʏꜱᴛᴇᴍ (/page1-4)
🔹 ʙʀᴜᴛᴀʟ ꜱᴇᴄᴜʀɪᴛʏ
🔹 ᴍᴀꜱᴛᴇʀ ᴄᴏɴᴛʀᴏʟ (/security, /war)

📖 /help ᴛᴏ ꜱᴇᴇ ᴄᴏᴍᴍᴀɴᴅꜱ
💬 "bot active" ᴛᴏ ᴛᴇꜱᴛ

━━━━━━━━━━━━━━━━━━━━━━━━
💀 ${config.botName}
👨‍💻 ᴅᴇᴠ: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;

            let sent = 0, failed = 0;
            for (const gid of allGroups) {
                try {
                    await new Promise(r => {
                        api.sendMessage(updateMsg, gid, (e) => {
                            if (e) failed++; else sent++;
                            r();
                        });
                    });
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) { failed++; }
            }

            db.settings.lastNotifiedVersion = config.version;
            db.settings.lastNotifiedAt = Date.now();
            saveDB(db);
            console.log(`🔔 Notified: ${sent} sent, ${failed} failed`);
        } catch (e) {
            console.error("Notification error:", e.message);
        }
    }, 15000);

    // ==================== 📨 MESSAGE LISTENER ====================
    api.listenMqtt(async (err, event) => {
        if (err) return console.error("MQTT Error:", err.message);
        if (!event) return;

        try {
            // 🔍 Debug Log
            if (event.type === "message") {
                console.log(`📨 /${event.body?.slice(0, 30)} | Group: ${event.threadID}`);
            }

            // ==================== 📊 AUTO GROUP TRACKING ====================
            if (event.threadID && event.isGroup) {
                try {
                    const db = getDB();
                    if (!db.groups) db.groups = {};
                    if (!db.groups[event.threadID]) {
                        db.groups[event.threadID] = {
                            firstSeen: Date.now(),
                            lastSeen: Date.now(),
                            name: event.threadName || "Unknown"
                        };
                        saveDB(db);
                        console.log(`📊 Group tracked: ${event.threadID}`);
                    } else {
                        db.groups[event.threadID].lastSeen = Date.now();
                        if (event.threadName) db.groups[event.threadID].name = event.threadName;
                        saveDB(db);
                    }
                } catch (e) {}
            }

            // ==================== 🚫 BOT OFF CHECK ====================
            const db = getDB();
            if (event.threadID && db.security?.[event.threadID]?.botOff) return;

            // ==================== 🐌 SLOW MODE ====================
            if (event.type === "message" && event.threadID) {
                const slow = db.groups?.[event.threadID]?.slowMode || 0;
                if (slow > 0) {
                    if (lastMsg[event.threadID] && Date.now() - lastMsg[event.threadID] < slow * 1000) return;
                    lastMsg[event.threadID] = Date.now();
                }
            }

            // ==================== 📨 MESSAGE EVENT ====================
            if (event.type === "message") {
                const msg = (event.body || "").trim();
                const tid = event.threadID;

                // AFK check
                if (db.afk?.[event.senderID]) {
                    delete db.afk[event.senderID];
                    saveDB(db);
                    api.sendMessage(`✅ ᴡᴇʟᴄᴏᴍᴇ ʙᴀᴄᴋ! AFK ʀᴇᴍᴏᴠᴇᴅ${timeFooter()}`, tid);
                }

                // Bot active check
                if (msg.toLowerCase() === "bot active" || msg.toLowerCase() === "bot") {
                    return api.sendMessage(`💀 ${config.botName} ɪꜱ ᴀᴄᴛɪᴠᴇ ✅${timeFooter()}`, tid);
                }

                // Command processing
                if (msg.startsWith(config.prefix)) {
                    const args = msg.slice(config.prefix.length).split(' ');
                    const cmd = args.shift().toLowerCase();

                    if (commands[cmd]) {
                        console.log(`✅ Command: ${cmd}`);
                        api.sendTypingIndicator(tid, () => {});
                        setTimeout(() => {
                            try {
                                commands[cmd](api, event, args, config);
                            } catch (e) {
                                console.error(`❌ ${cmd} error:`, e.message);
                            }
                        }, 800);
                    } else {
                        api.sendMessage(`❌ ᴄᴏᴍᴍᴀɴᴅ ɴᴏᴛ ꜰᴏᴜɴᴅ: ${cmd}${timeFooter()}`, tid);
                    }
                }
            }

            // ==================== 🎉 WELCOME EVENT ====================
            if (event.logMessageType === "log:subscribe") {
                const tid = event.threadID;
                const added = event.logMessageData?.addedParticipants || [];
                const botID = api.getCurrentUserID();
                const isBot = added.some(p => p.userFbId === botID);

                if (isBot) {
                    return api.sendMessage(`👻 ᴛʜᴀɴᴋꜱ ꜰᴏʀ ᴀᴅᴅɪɴɢ ᴍᴇ!\n💀 ${config.botName}\n✅ ᴛʏᴘᴇ "bot active"${timeFooter()}`, tid);
                }

                try {
                    const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                    const gname = info?.threadName || "Group";
                    const mcount = info?.participantIDs?.length || 0;

                    for (const p of added) {
                        const name = p.fullName || "New Member";
                        const wmsg = `🌸 ᴡᴇʟᴄᴏᴍᴇ ${name}!
━━━━━━━━━━━━━━━━━━━━━━━━
🌹 ᴛᴏ ᴏᴜʀ ɢʀᴏᴜᴘ ꜰᴀᴍɪʟʏ!
⭐ ᴡᴇ'ʀᴇ ᴇxᴄɪᴛᴇᴅ ᴛᴏ ʜᴀᴠᴇ ʏᴏᴜ!
━━━━━━━━━━━━━━━━━━━━━━━━
👥 ᴍᴇᴍʙᴇʀꜱ: ${mcount}
📌 ɢʀᴏᴜᴘ: ${gname}${timeFooter()}`;
                        await sendWithGif(api, event, wmsg, 'wave', [{ tag: name, id: p.userFbId }]);
                    }
                } catch (e) {}
            }

            // ==================== 👋 LEFT EVENT ====================
            if (event.logMessageType === "log:unsubscribe") {
                const tid = event.threadID;
                const lid = event.logMessageData?.leftParticipantFbId;
                if (!lid || lid === api.getCurrentUserID()) return;

                const kicked = event.author !== lid;
                try {
                    const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                    api.getUserInfo(lid, async (e, ret) => {
                        if (e) return;
                        const name = ret[lid]?.name || "A member";
                        const mcount = info?.participantIDs?.length || 0;
                        const msg = kicked
                            ? `👢 ${name} ᴡᴀꜱ ᴋɪᴄᴋᴇᴅ\n👥 ʀᴇᴍᴀɪɴɪɴɢ: ${mcount}${timeFooter()}`
                            : `🍂 ɢᴏᴏᴅʙʏᴇ ${name}\n💔 ᴡᴇ ᴡɪʟʟ ᴍɪꜱꜱ ʏᴏᴜ\n👥 ʀᴇᴍᴀɪɴɪɴɢ: ${mcount}${timeFooter()}`;
                        await sendWithGif(api, event, msg, 'wave');
                    });
                } catch (e) {}
            }

            // ==================== 🛡️ ANTI-FEATURES ====================
            if (event.type === "message" && event.body) {
                const tid = event.threadID;
                const sec = db.security?.[tid] || {};
                const grp = db.groups?.[tid] || {};
                const senderRole = await getUserRole(api, event, config);

                // Owner bypass
                if (senderRole === "owner") return;

                // Only admin
                if (sec.onlyAdmin && senderRole === "public") {
                    api.removeUserFromGroup(event.senderID, tid, () => {
                        api.sendMessage(`👑 ᴏɴʟʏ ᴀᴅᴍɪɴꜱ ᴄᴀɴ ᴄʜᴀᴛ${timeFooter()}`, tid);
                    });
                    return;
                }

                // Anti-link
                if (grp.antiLink && /(https?:\/\/|www\.)/gi.test(event.body)) {
                    api.unsendMessage(event.messageID);
                    api.sendMessage(`🔗 ʟɪɴᴋꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ${timeFooter()}`, tid);
                }

                // Anti-gali
                if (grp.antiGali && /(madarchod|bhenchod|fuck|shit|bastard|harami)/gi.test(event.body)) {
                    api.unsendMessage(event.messageID);
                    api.sendMessage(`🤬 ʙᴀᴅ ᴡᴏʀᴅꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ${timeFooter()}`, tid);
                }

                // Anti-phone
                if (grp.antiPhone && /(\+?880|01[3-9])\d{8,9}/g.test(event.body)) {
                    api.unsendMessage(event.messageID);
                    api.sendMessage(`📱 ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ${timeFooter()}`, tid);
                }

                // Anti-sticker/gif
                if (event.attachments && event.attachments.length > 0) {
                    for (const att of event.attachments) {
                        if (grp.antiSticker && att.type === "sticker") {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🎨 ꜱᴛɪᴄᴋᴇʀꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ${timeFooter()}`, tid);
                        }
                        if (grp.antiGif && att.type === "animated_image") {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🎬 ɢɪꜰꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ${timeFooter()}`, tid);
                        }
                    }
                }
            }

        } catch (err) {
            console.error("Event Error:", err.message);
        }
    });
});

// ==================== ⏰ AUTO-KICK SCHEDULER ====================
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