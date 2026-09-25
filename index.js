const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');
const { getDB, saveDB, timeFooter, sendWithGif, guessGender, getUserRole } = require('./utils');

// ==================== AppState Load ====================
let appState;
try {
    if (process.env.APPSTATE) {
        appState = JSON.parse(process.env.APPSTATE);
        console.log("AppState loaded from Render");
    } else {
        appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
        console.log("AppState loaded from local file");
    }
} catch (e) {
    console.error("AppState load failed:", e.message);
    process.exit(1);
}

// ==================== Commands Loader ====================
const commands = {};

function loadCommands(dir) {
    try {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const mod = require(path.join(__dirname, dir, file));
            for (const name in mod) commands[name] = mod[name];
        }
    } catch (e) {
        console.error(`Load failed from ${dir}:`, e.message);
    }
}

try {
    loadCommands('./commands');   // পুরনো all.js + নতুন public.js, admin.js
    loadCommands('./security');   // নতুন security.js, master.js
    console.log(`📦 Total ${Object.keys(commands).length} commands loaded`);
} catch (e) {
    console.error("Commands load failed:", e.message);
}

// ==================== Login ====================
login({ appState }, (err, api) => {
    if (err) return console.error("Login failed:", err);

    global.globalBotApi = api;
    api.setOptions({ listenEvents: true, selfListen: false });
    console.log(`💀 ${config.botName} is online`);


    // ==================== 🔔 Version Update Notification ====================
    setTimeout(async () => {
        try {
            const db = getDB();
            if (!db.settings) db.settings = {};
            if (!db.groups) db.groups = {};

            // যদি ইতিমধ্যে এই ভার্সনের নোটিফিকেশন পাঠানো হয়ে থাকে
            if (db.settings.lastNotifiedVersion === config.version) {
                console.log(`✅ Version ${config.version} already notified`);
                return;
            }

            const groupIDs = Object.keys(db.groups);
            if (groupIDs.length === 0) {
                console.log("⚠️ No groups found in database to notify");
                db.settings.lastNotifiedVersion = config.version;
                db.settings.lastNotifiedAt = Date.now();
                saveDB(db);
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

✨ ᴡʜᴀᴛ'ꜱ ɴᴇᴡ ɪɴ ${config.version}:
🔹 92 ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ
🔹 ɴᴇᴡ ᴘᴀɢᴇ ꜱʏꜱᴛᴇᴍ (/page1-4)
🔹 ʙʀᴜᴛᴀʟ ꜱᴇᴄᴜʀɪᴛʏ ꜱʏꜱᴛᴇᴍ
🔹 ᴍᴀꜱᴛᴇʀ ᴄᴏɴᴛʀᴏʟ (/security, /war)
🔹 ɪᴍᴘʀᴏᴠᴇᴅ ᴘᴇʀꜰᴏʀᴍᴀɴᴄᴇ
🔹 ᴀɴᴛɪ-ʀᴀɪᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ

📖 ᴛʏᴘᴇ /help ᴛᴏ ꜱᴇᴇ ᴄᴏᴍᴍᴀɴᴅꜱ
💬 ᴛʏᴘᴇ "bot active" ᴛᴏ ᴛᴇꜱᴛ ʙᴏᴛ

━━━━━━━━━━━━━━━━━━━━━━━━
💀 ${config.botName}
👨‍💻 ᴅᴇᴠ: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━`;

            let sent = 0;
            let failed = 0;

            for (const gid of groupIDs) {
                try {
                    await new Promise((resolve) => {
                        api.sendMessage(updateMsg, gid, (err) => {
                            if (err) {
                                console.error(`❌ Failed to notify ${gid}:`, err.message);
                                failed++;
                            } else {
                                console.log(`✅ Notified group: ${gid}`);
                                sent++;
                            }
                            resolve();
                        });
                    });
                    // প্রতি গ্রুপে ২ সেকেন্ড বিরতি (Facebook স্প্যাম ব্লক এড়াতে)
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    failed++;
                }
            }

            // আপডেট শেষে সেভ
            db.settings.lastNotifiedVersion = config.version;
            db.settings.lastNotifiedAt = Date.now();
            saveDB(db);

            console.log(`🔔 Update Notification: ${sent} sent, ${failed} failed`);

            // Owner কে রিপোর্ট পাঠানো
            try {
                api.sendMessage(
                    `✅ ᴠᴇʀꜱɪᴏɴ ᴜᴘᴅᴀᴛᴇ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ ꜱᴇɴᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
📦 ᴠᴇʀꜱɪᴏɴ: ${config.version}
✅ ꜱᴇɴᴛ: ${sent}
❌ ꜰᴀɪʟᴇᴅ: ${failed}
📊 ᴛᴏᴛᴀʟ ɢʀᴏᴜᴘꜱ: ${groupIDs.length}${timeFooter()}`,
                    config.owner
                );
            } catch (e) {}

        } catch (err) {
            console.error("Version notify error:", err.message);
        }
    }, 10000); // ১০ সেকেন্ড পর (বট স্টার্ট আপ শেষ হলে)





       api.listenMqtt(async (err, event) => {
        if (err) return console.error(err);

        // ==================== 📊 AUTO GROUP TRACKING ====================
        // বট যে গ্রুপে মেসেজ পায়, সেই গ্রুপ ট্র্যাক করে
        if (event.threadID && (event.isGroup || event.type === "message" || event.type === "event")) {
            try {
                const db = getDB();
                if (!db.groups) db.groups = {};
                if (!db.groups[event.threadID]) {
                    // নতুন গ্রুপ পেলে ট্র্যাক করুন
                    db.groups[event.threadID] = {
                        firstSeen: Date.now(),
                        lastSeen: Date.now(),
                        name: event.threadName || "Unknown Group"
                    };
                    saveDB(db);
                    console.log(`📊 New group tracked: ${event.threadID} (${event.threadName || "Unknown"})`);
                } else {
                    // পুরনো গ্রুপ আপডেট
                    db.groups[event.threadID].lastSeen = Date.now();
                    if (event.threadName) db.groups[event.threadID].name = event.threadName;
                    saveDB(db);
                }
            } catch (e) {
                console.error("Group tracking error:", e.message);
            }
        }

        // ... আপনার বাকি কোড ...
        // ==================== ACTIVITY TRACKER ====================
    // ==================== 🔔 Version Update Notification ====================
    setTimeout(async () => {
        try {
            const db = getDB();
            if (!db.settings) db.settings = {};

            // ইতিমধ্যে পাঠানো হলে skip
            if (db.settings.lastNotifiedVersion === config.version) {
                console.log(`✅ Version ${config.version} already notified`);
                return;
            }

            // গ্রুপ লিস্ট সংগ্রহ
            const dbGroups = Object.keys(db.groups || {});
            const configGroups = config.notifyGroups || [];
            const allGroups = [...new Set([...dbGroups, ...configGroups])];

            console.log(`📋 Groups to notify: ${allGroups.length} (db: ${dbGroups.length}, config: ${configGroups.length})`);

            if (allGroups.length === 0) {
                console.log("⚠️ No groups found yet! Waiting for bot to receive messages...");
                // ৫ মিনিট পর আবার চেষ্টা করবে
                db.settings.lastNotifiedVersion = null;
                saveDB(db);
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

✨ ᴡʜᴀᴛ'ꜱ ɴᴇᴡ ɪɴ ${config.version}:
🔹 92 ᴛᴏᴛᴀʟ ᴄᴏᴍᴍᴀɴᴅꜱ
🔹 ɴᴇᴡ ᴘᴀɢᴇ ꜱʏꜱᴛᴇᴍ (/page1-4)
🔹 ʙʀᴜᴛᴀʟ ꜱᴇᴄᴜʀɪᴛʏ ꜱʏꜱᴛᴇᴍ
🔹 ᴍᴀꜱᴛᴇʀ ᴄᴏɴᴛʀᴏʟ (/security, /war)
🔹 ɪᴍᴘʀᴏᴠᴇᴅ ᴘᴇʀꜰᴏʀᴍᴀɴᴄᴇ

📖 ᴛʏᴘᴇ /help ᴛᴏ ꜱᴇᴇ ᴄᴏᴍᴍᴀɴᴅꜱ
💬 ᴛʏᴘᴇ "bot active" ᴛᴏ ᴛᴇꜱᴛ ʙᴏᴛ

━━━━━━━━━━━━━━━━━━━━━━━━
💀 ${config.botName}
👨‍💻 ᴅᴇᴠ: ${config.developer}
━━━━━━━━━━━━━━━━━━━━━━━━`;

            let sent = 0, failed = 0;

            for (const gid of allGroups) {
                try {
                    await new Promise((resolve) => {
                        api.sendMessage(updateMsg, gid, (err) => {
                            if (err) {
                                console.error(`❌ Failed ${gid}:`, err.message);
                                failed++;
                            } else {
                                console.log(`✅ Notified: ${gid}`);
                                sent++;
                            }
                            resolve();
                        });
                    });
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    failed++;
                }
            }

            db.settings.lastNotifiedVersion = config.version;
            db.settings.lastNotifiedAt = Date.now();
            saveDB(db);

            console.log(`🔔 Update Notification: ${sent} sent, ${failed} failed of ${allGroups.length}`);

            // Owner কে রিপোর্ট
            try {
                api.sendMessage(
                    `✅ ᴠᴇʀꜱɪᴏɴ ᴜᴘᴅᴀᴛᴇ ʀᴇᴘᴏʀᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
📦 ᴠᴇʀꜱɪᴏɴ: ${config.version}
✅ ꜱᴇɴᴛ: ${sent}
❌ ꜰᴀɪʟᴇᴅ: ${failed}
📊 ᴛᴏᴛᴀʟ ɢʀᴏᴜᴘꜱ: ${allGroups.length}`,
                    config.owner
                );
            } catch (e) {}

        } catch (err) {
            console.error("Version notify error:", err.message);
        }
    }, 15000); // ১৫ সেকেন্ড পর

        // ==================== MESSAGE EVENT ====================
        if (event.type === "message") {
            const msg = event.body.trim();
            const tid = event.threadID;

            const now = Date.now();
            if (lastMsg[tid] && (now - lastMsg[tid] < 3000)) return;
            lastMsg[tid] = now;

            if (msg.toLowerCase() === "bot active" || msg.toLowerCase() === "bot") {
                return api.sendMessage(`${config.botName} is active`, tid);
            }

            if (msg.startsWith(config.prefix)) {
                const args = msg.slice(config.prefix.length).split(' ');
                const cmd = args.shift().toLowerCase();

                if (commands[cmd]) {
                    console.log(`Command executed: ${cmd}`);
                    api.sendTypingIndicator(tid, () => {});
                    const delay = Math.floor(Math.random() * 1000) + 1000;
                    setTimeout(() => {
                        try {
                            commands[cmd](api, event, args, config);
                        } catch (e) {
                            console.error(`${cmd} error:`, e);
                        }
                    }, delay);
                } else {
                    api.sendMessage("Command not found. Type /help", tid);
                }
            }
        }

        // ==================== WELCOME EVENT ====================
        if (event.logMessageType === "log:subscribe") {
            const tid = event.threadID;
            const added = event.logMessageData.addedParticipants;
            const botID = api.getCurrentUserID();
            const isBot = added.some(p => p.userFbId === botID);

            if (isBot) {
                return api.sendMessage(
                    `Thanks for adding me.\nBot: ${config.botName}\nType "bot active" to start\nType /help for commands`,
                    tid
                );
            }

            api.getThreadInfo(tid, async (err, info) => {
                if (err) return;
                const groupName = info?.threadName || "Our Group";
                const memberCount = info?.participantIDs?.length || 0;
                const groupImage = info?.imageSrc || null;

                for (const p of added) {
                    const name = p.fullName || "New Member";
                    const welcomeMsg = `🌸 Welcome ${name}!
━━━━━━━━━━━━━━━━━━━━━━━━
🌹 To our group family!
⭐ We're excited to have you!
🎉 Please introduce yourself!
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 Enjoy your stay!

👥 Total Members: ${memberCount}
📌 Group: ${groupName}
🤖 Bot: ${config.botName}`;

                    if (groupImage) {
                        try {
                            const imageStream = await axios.get(groupImage, { responseType: 'stream' });
                            api.sendMessage({
                                body: welcomeMsg,
                                mentions: [{ tag: name, id: p.userFbId }],
                                attachment: imageStream.data
                            }, tid);
                        } catch (e) {
                            api.sendMessage({
                                body: welcomeMsg,
                                mentions: [{ tag: name, id: p.userFbId }]
                            }, tid);
                        }
                    } else {
                        api.sendMessage({
                            body: welcomeMsg,
                            mentions: [{ tag: name, id: p.userFbId }]
                        }, tid);
                    }
                }
            });
        }

        // ==================== LEFT EVENT ====================
        if (event.logMessageType === "log:unsubscribe") {
            const tid = event.threadID;
            const leftID = event.logMessageData.leftParticipantFbId;
            if (leftID === api.getCurrentUserID()) return;

            const kicked = event.author !== leftID;

            api.getThreadInfo(tid, async (err, info) => {
                if (err) return;
                const groupName = info?.threadName || "Our Group";
                const memberCount = info?.participantIDs?.length || 0;
                const groupImage = info?.imageSrc || null;

                api.getUserInfo(leftID, async (e, ret) => {
                    if (e) return;
                    const name = ret[leftID]?.name || "A member";

                    let leftMsg;
                    if (kicked) {
                        leftMsg = `👢 ${name} was kicked from the group.
━━━━━━━━━━━━━━━━━━━━━━━━
Reason: Rule violation
━━━━━━━━━━━━━━━━━━━━━━━━
👥 Remaining Members: ${memberCount}
📌 Group: ${groupName}
🤖 Bot: ${config.botName}`;
                    } else {
                        leftMsg = `🍂 Goodbye ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
💔 We will miss you
🌟 Hope to see you again
🌙 Farewell and take care
━━━━━━━━━━━━━━━━━━━━━━━━
👥 Remaining Members: ${memberCount}
📌 Group: ${groupName}
🤖 Bot: ${config.botName}`;
                    }

                    if (groupImage) {
                        try {
                            const imageStream = await axios.get(groupImage, { responseType: 'stream' });
                            api.sendMessage({
                                body: leftMsg,
                                attachment: imageStream.data
                            }, tid);
                        } catch (e) {
                            api.sendMessage(leftMsg, tid);
                        }
                    } else {
                        api.sendMessage(leftMsg, tid);
                    }
                });
            });
        }
    });
});

// ==================== AUTO-KICK SCHEDULER ====================
// প্রতি ২৪ ঘণ্টায় একবার চেক করবে
setInterval(async () => {
    try {
        const dbPath = './database.json';
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        
        if (!db.settings || !db.settings.autoKick) return;
        if (!db.activity) return;
        if (!global.globalBotApi) return;

        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        for (const threadID in db.activity) {
            const members = db.activity[threadID];

            global.globalBotApi.getThreadInfo(threadID, async (err, info) => {
                if (err) return;
                if (!info || !info.participantIDs) return;

                const botID = global.globalBotApi.getCurrentUserID();
                const admins = info.adminIDs.map(a => a.id);

                for (const memberID of info.participantIDs) {
                    if (memberID === botID) continue;
                    if (admins.includes(memberID)) continue;

                    const lastActive = members[memberID];
                    if (!lastActive) continue;

                    if (now - lastActive > SEVEN_DAYS) {
                        global.globalBotApi.removeUserFromGroup(memberID, threadID, (err) => {
                            if (!err) {
                                console.log(`[Auto-Kick] Kicked inactive user from ${threadID}`);
                            }
                        });
                    }
                }
            });
        }
    } catch (e) {
        console.error("[Auto-Kick] Error:", e.message);
    }
}, 24 * 60 * 60 * 1000);

// ==================== Health Check Server ====================
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`${config.botName} running 24/7\nUptime: ${Math.floor(process.uptime())}s`);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Health check server running on port ${PORT}`);
});

// ==================== Self-Ping ====================
const RENDER_URL = process.env.RENDER_URL || "https://destroy-k66o.onrender.com";

setInterval(async () => {
    try {
        await axios.get(RENDER_URL);
        console.log(`[Self-Ping] Server alive`);
    } catch (e) {
        console.error(`[Self-Ping] Failed: ${e.message}`);
    }
}, 4 * 60 * 1000);

// ==================== Error Handlers ====================
process.on('uncaughtException', (err) => {
    console.error("Uncaught Exception:", err.message);
});

process.on('unhandledRejection', (err) => {
    console.error("Unhandled Rejection:", err);
});