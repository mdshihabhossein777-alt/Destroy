const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');
const { getDB, saveDB, timeFooter, sendWithGif, guessGender, getUserRole, hasPermission, permissionDenied } = require('./utils');

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
const joinTracker = {}; // Anti-Raid এর জন্য

// ==================== Login ====================
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
            if (db.settings.lastNotifiedVersion === config.version) return;

            const dbGroups = Object.keys(db.groups || {});
            const configGroups = config.notifyGroups || [];
            const allGroups = [...new Set([...dbGroups, ...configGroups])];

            if (allGroups.length === 0) {
                console.log("⚠️ No groups to notify");
                return;
            }

            const updateMsg = `🔔 ʙᴏᴛ ᴜᴘᴅᴀᴛᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
💀 ${config.botName}
📌 ᴘʀᴇᴠɪᴏᴜꜱ: ${config.previousVersion || "V1.0"}
🚀 ᴄᴜʀʀᴇɴᴛ : ${config.version}
━━━━━━━━━━━━━━━━━━━━━━━━
✨ ɴᴇᴡ ꜰᴇᴀᴛᴜʀᴇꜱ ᴀᴅᴅᴇᴅ
📖 /help ᴛᴏ ꜱᴇᴇ ᴀʟʟ${timeFooter()}`;

            let sent = 0;
            for (const gid of allGroups) {
                try {
                    await new Promise(r => api.sendMessage(updateMsg, gid, () => r()));
                    sent++;
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {}
            }
            db.settings.lastNotifiedVersion = config.version;
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
                    console.log(`📊 Group tracked: ${tid}`);
                } else {
                    db.groups[tid].lastSeen = Date.now();
                    if (event.threadName) db.groups[tid].name = event.threadName;
                    saveDB(db);
                }
            }

            // ==================== 👤 USER ACTIVITY TRACKING ====================
            if (event.senderID && event.type === "message") {
                if (!db.users) db.users = {};
                if (!db.users[event.senderID]) db.users[event.senderID] = { points: 0, lastActive: 0 };
                db.users[event.senderID].points = (db.users[event.senderID].points || 0) + 1;
                db.users[event.senderID].lastActive = Date.now();
                saveDB(db);
            }

            // ==================== 🚫 BOT OFF CHECK ====================
            if (tid && db.security?.[tid]?.botOff && event.senderID !== config.owner) return;

            const sec = db.security?.[tid] || {};
            const grp = db.groups?.[tid] || {};
            const senderRole = event.senderID ? await getUserRole(api, event, config) : "public";
            const isOwner = senderRole === "owner";
            const isBotAdmin = senderRole === "botadmin";
            const isGroupAdmin = senderRole === "groupadmin";
            const isMod = senderRole === "mod";
            const isAdmin = isOwner || isBotAdmin || isGroupAdmin;

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
                    api.sendMessage(`🚨 ᴀɴᴛɪ-ʀᴀɪᴅ ᴛʀɪɢɢᴇʀᴇᴅ!\n⚠️ 5+ ᴊᴏɪɴꜱ ɪɴ 1 ᴍɪɴᴜᴛᴇ\n🔒 ɢʀᴏᴜᴘ ʟᴏᴄᴋᴇᴅ${timeFooter()}`, tid);
                }
            }

            // ==================== 🔒 LOCK NAME ====================
            if (event.logMessageType === "log:thread-name" && grp.lockName) {
                if (!isAdmin) {
                    try {
                        await new Promise(r => api.setTitle(db.groups[tid]?.name || "Locked Group", tid, () => r()));
                        api.sendMessage(`🔒 ɢʀᴏᴜᴘ ɴᴀᴍᴇ ɪꜱ ʟᴏᴄᴋᴇᴅ!\n⚠️ ${event.author} ᴛʀɪᴇᴅ ᴛᴏ ᴄʜᴀɴɢᴇ ɪᴛ${timeFooter()}`, tid);
                    } catch (e) {}
                }
            }

            // ==================== 🔒 LOCK PHOTO ====================
            if (event.logMessageType === "log:thread-icon" && grp.lockPhoto) {
                if (!isAdmin) {
                    api.sendMessage(`🔒 ɢʀᴏᴜᴘ ᴘʜᴏᴛᴏ ɪꜱ ʟᴏᴄᴋᴇᴅ!\n⚠️ ${event.author} ᴛʀɪᴇᴅ ᴛᴏ ᴄʜᴀɴɢᴇ ɪᴛ${timeFooter()}`, tid);
                }
            }

            // ==================== 🔒 LOCK NICK ====================
            if (event.logMessageType === "log:user-nickname" && grp.lockNick) {
                if (!isAdmin) {
                    const target = event.logMessageData?.participant_id;
                    if (target) {
                        try {
                            await new Promise(r => api.changeNickname("", tid, target, () => r()));
                            api.sendMessage(`🔒 ɴɪᴄᴋɴᴀᴍᴇ ɪꜱ ʟᴏᴄᴋᴇᴅ!\n⚠️ ${event.author} ᴛʀɪᴇᴅ ᴛᴏ ᴄʜᴀɴɢᴇ ɪᴛ${timeFooter()}`, tid);
                        } catch (e) {}
                    }
                }
            }

            // ==================== 🎉 WELCOME EVENT ====================
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
                            const customWelcome = db.groups[tid]?.welcome;
                            const welcomeText = customWelcome || `🌸 ᴡᴇʟᴄᴏᴍᴇ ${name}!\n━━━━━━━━━━━━━━━━━━━━━━━━\n🌹 ᴛᴏ ᴏᴜʀ ꜰᴀᴍɪʟʏ!\n⭐ ᴡᴇ'ʀᴇ ᴇxᴄɪᴛᴇᴅ!\n━━━━━━━━━━━━━━━━━━━━━━━━\n👥 ᴍᴇᴍʙᴇʀꜱ: ${mcount}\n📌 ɢʀᴏᴜᴘ: ${gname}`;

                            await sendWithGif(api, event, welcomeText + timeFooter(), 'wave', [{ tag: name, id: p.userFbId }]);
                        }
                    } catch (e) {}
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
                            const customGoodbye = db.groups[tid]?.goodbye;
                            const msg = kicked
                                ? `👢 ${name} ᴡᴀꜱ ᴋɪᴄᴋᴇᴅ\n👥 ʀᴇᴍᴀɪɴɪɴɢ: ${mcount}`
                                : (customGoodbye || `🍂 ɢᴏᴏᴅʙʏᴇ ${name}\n💔 ᴡᴇ'ʟʟ ᴍɪꜱꜱ ʏᴏᴜ\n👥 ʀᴇᴍᴀɪɴɪɴɢ: ${mcount}`);
                            await sendWithGif(api, event, msg + timeFooter(), 'wave');
                        });
                    } catch (e) {}
                }
            }

            // ==================== 💬 MESSAGE PROCESSING ====================
            if (event.type === "message" && event.body) {
                const msg = event.body.trim();

                // AFK check
                if (db.afk?.[event.senderID]) {
                    const afkData = db.afk[event.senderID];
                    delete db.afk[event.senderID];
                    saveDB(db);
                    api.sendMessage(`✅ ᴡᴇʟᴄᴏᴍᴇ ʙᴀᴄᴋ! ʀᴇᴍᴏᴠᴇᴅ ꜰʀᴏᴍ AFK\n📝 ᴡᴀꜱ: ${afkData.reason}${timeFooter()}`, tid);
                }

                // Owner bypass all filters
                if (!isOwner) {

                    // ==================== ANTI-LINK ====================
                    if (grp.antiLink && /(https?:\/\/|www\.|\.com|\.net|\.org|\.xyz|\.live|\.me)/gi.test(event.body)) {
                        if (!isAdmin) {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🔗 ʟɪɴᴋꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!\n⚠️ ${event.body.slice(0, 30)}...${timeFooter()}`, tid);
                            return;
                        }
                    }

                    // ==================== ANTI-GALI ====================
                    if (grp.antiGali && /(madarchod|bhenchod|fuck|shit|bastard|harami|kutta|kutir|suorer|shala|shali|khanki|magi|choda|chod|bhosdi)/gi.test(event.body)) {
                        if (!isAdmin) {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🤬 ʙᴀᴅ ᴡᴏʀᴅꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                            return;
                        }
                    }

                    // ==================== ANTI-PHONE ====================
                    if (grp.antiPhone && /(\+?880|01[3-9])\d{8,9}/g.test(event.body)) {
                        if (!isAdmin) {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`📱 ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                            return;
                        }
                    }
                }

                // Anti-sticker/gif
                if (event.attachments && event.attachments.length > 0 && !isOwner) {
                    for (const att of event.attachments) {
                        if (grp.antiSticker && att.type === "sticker" && !isAdmin) {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🎨 ꜱᴛɪᴄᴋᴇʀꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        }
                        if (grp.antiGif && att.type === "animated_image" && !isAdmin) {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🎬 ɢɪꜰꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        }
                    }
                }

                // ==================== ONLY ADMIN MODE ====================
                if (sec.onlyAdmin && !isAdmin) {
                    api.removeUserFromGroup(event.senderID, tid, (err) => {
                        if (!err) api.sendMessage(`👑 ᴏɴʟʏ ᴀᴅᴍɪɴꜱ ᴄᴀɴ ᴄʜᴀᴛ\n👢 ᴜꜱᴇʀ ᴋɪᴄᴋᴇᴅ${timeFooter()}`, tid);
                    });
                    return;
                }

                // ==================== ALL MUTE ====================
                if (sec.allMute && !isAdmin && !msg.startsWith(config.prefix)) {
                    api.unsendMessage(event.messageID);
                    return;
                }

                // ==================== SLOW MODE ====================
                const slow = grp.slowMode || 0;
                if (slow > 0 && !isAdmin) {
                    if (lastMsg[tid] && Date.now() - lastMsg[tid] < slow * 1000) {
                        api.unsendMessage(event.messageID);
                        return;
                    }
                    lastMsg[tid] = Date.now();
                }

                // ==================== ANTI-BOT ====================
                if (sec.antiBot && !isOwner) {
                    const botKeywords = /(bot|Bot|BOT|auto|Auto)/;
                    if (botKeywords.test(event.body) && event.body.length < 20) {
                        // Check if another bot
                    }
                }

                // ==================== BOT ACTIVE ====================
                if (msg.toLowerCase() === "bot active" || msg.toLowerCase() === "bot") {
                    return api.sendMessage(`💀 ${config.botName} ɪꜱ ᴀᴄᴛɪᴠᴇ ✅\n🛡️ ꜱᴇᴄᴜʀɪᴛʏ: ${Object.keys(sec).filter(k => sec[k]).length} ᴀᴄᴛɪᴠᴇ${timeFooter()}`, tid);
                }

                // ==================== COMMAND PROCESSING ====================
                if (msg.startsWith(config.prefix)) {
                    const args = msg.slice(config.prefix.length).split(' ');
                    const cmd = args.shift().toLowerCase();

                    if (commands[cmd]) {
                        console.log(`✅ Command: ${cmd} | User: ${event.senderID} | Role: ${senderRole}`);
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

        } catch (err) {
            console.error("Event Error:", err.message);
        }
    });
});

// ==================== ⏰ AUTO-KICK (7 days inactive) ====================
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