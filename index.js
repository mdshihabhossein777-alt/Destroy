const fs = require('fs');
const path = require('path');
const axios = require('axios');
// Increase memory limit for better performance
process.env.NODE_OPTIONS = '--max-old-space-size=512';
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');
const { getDB, saveDB, timeFooter, sendWithGif, guessGender, getUserRole, hasPermission, permissionDenied, SLOW_MODE, sleep, isGroupThrottled, isBot, sendAdvancedGif, generateWelcomeCard } = require('./utils');

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
                    if (typeof mod[name] === 'function') {
                        if (commands[name]) {
                            console.log(`⚠️ Duplicate command: ${name} in ${file}`);
                        }
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

// ==================== Login ====================
login({ appState }, (err, api) => {
    if (err) return console.error("❌ Login failed:", err);

    global.globalBotApi = api;
    api.setOptions({ listenEvents: true, selfListen: false });
    console.log(`💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄𝐌 is online`);

       // ==================== 🔔 AUTO NOTIFICATION (Fixed) ====================
    setTimeout(async () => {
        try {
            const db = getDB();
            if (!db.settings) db.settings = {};
            if (!db.groups) db.groups = {};

            const dbGroups = Object.keys(db.groups);
            const configGroups = config.notifyGroups || [];
            const allGroups = [...new Set([...dbGroups, ...configGroups])];

            console.log(`📋 Groups to notify: ${allGroups.length}`);

            if (allGroups.length === 0) {
                console.log("⚠️ No groups yet. Auto-track on message.");
                return;
            }

            const currentVersion = config.version || "V2.0";
            if (db.settings.lastNotifiedVersion === currentVersion) {
                console.log(`✅ Version ${currentVersion} already notified`);
                return;
            }

            const updateMsg = `🔔 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴜᴘᴅᴀᴛᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄𝐌
━━━━━━━━━━━━━━━━━━━━━━━━
🆙 ᴠᴇʀꜱɪᴏɴ ᴜᴘᴅᴀᴛᴇ!

📌 ᴘʀᴇᴠɪᴏᴜꜱ: ${config.previousVersion || "V1.1"}
🚀 ᴄᴜʀʀᴇɴᴛ : ${currentVersion}

✨ ɴᴇᴡ ꜰᴇᴀᴛᴜʀᴇꜱ:
🔹 ᴡᴇʟᴄᴏᴍᴇ ᴄᴀʀᴅ ᴡɪᴛʜ ɢɪꜰ
🔹 ꜰᴜʟʟ ꜱᴇᴄᴜʀɪᴛʏ
🔹 107 ᴄᴏᴍᴍᴀɴᴅꜱ

🛡️ /security on
📖 /help

━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💻 ᴅᴇᴠ: ${config.developer}
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;

            let sent = 0;
            let failed = 0;
            let removed = 0;

            for (const gid of allGroups) {
                try {
                    // ✅ গ্রুপটি বৈধ কি না চেক করুন
                    const isValid = await new Promise(r => {
                        let done = false;
                        const timeout = setTimeout(() => { if (!done) { done = true; r(false); } }, 8000);
                        api.getThreadInfo(gid, (err, info) => {
                            if (done) return;
                            done = true;
                            clearTimeout(timeout);
                            if (err || !info || !info.threadID) r(false);
                            else r(true);
                        });
                    });

                    if (!isValid) {
                        console.log(`⚠️ Invalid group removed: ${gid}`);
                        // ডেটাবেস থেকে সরান
                        if (db.groups[gid]) {
                            delete db.groups[gid];
                            removed++;
                        }
                        continue;
                    }

                    // ✅ গ্রুপ বৈধ হলে মেসেজ পাঠান
                    await new Promise(r => {
                        api.sendMessage(updateMsg, gid, (err) => {
                            if (err) failed++;
                            else sent++;
                            r();
                        });
                    });

                    await sleep(SLOW_MODE.notificationDelay);
                } catch (e) {
                    failed++;
                }
            }

            // ডেটাবেস থেকে পুরনো গ্রুপ সরান
            if (removed > 0) {
                console.log(`🧹 Removed ${removed} invalid groups`);
            }

            db.settings.lastNotifiedVersion = currentVersion;
            db.settings.lastNotifiedAt = Date.now();
            saveDB(db);

            console.log(`🔔 Notified: ${sent} sent, ${failed} failed, ${removed} removed`);

            // Owner কে রিপোর্ট
            try {
                api.sendMessage(
                    `✅ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ ʀᴇᴘᴏʀᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
📦 ᴠᴇʀꜱɪᴏɴ: ${currentVersion}
✅ ꜱᴇɴᴛ: ${sent}
❌ ꜰᴀɪʟᴇᴅ: ${failed}
🧹 ʀᴇᴍᴏᴠᴇᴅ: ${removed}
📊 ᴛᴏᴛᴀʟ: ${allGroups.length}${timeFooter()}`,
                    config.owner
                );
            } catch (e) {}

        } catch (e) {
            console.error("Notify error:", e.message);
        }
    }, 15000);

    // ==================== 📨 MAIN LISTENER (একটিই!) ====================
    api.listenMqtt(async (err, event) => {
        if (err) return console.error("MQTT Error:", err.message);
        if (!event) return;

        try {
            const db = getDB();
            const tid = event.threadID;

            // ==================== AUTO GROUP TRACKING ====================
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

            // ==================== USER ACTIVITY ====================
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
            const senderRole = event.senderID ? await getUserRole(api, event, config) : "public";
            const isOwner = senderRole === "owner";
            const isBotAdmin = senderRole === "botadmin";
            const isGroupAdmin = senderRole === "groupadmin";
            const isAdmin = isOwner || isBotAdmin || isGroupAdmin;

            // ==================== LOCK NAME ====================
            if (event.logMessageType === "log:thread-name" && grp.lockName) {
                if (!isOwner && !isBotAdmin) {
                    let savedName = db.groups[tid]?.lockedName;
                    if (!savedName || savedName === "Unknown") {
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
                            api.sendMessage(`🔒 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ɢʀᴏᴜᴘ ɴᴀᴍᴇ ʟᴏᴄᴋᴇᴅ!\n📌 ${savedName}${timeFooter()}`, tid);
                        } catch (e) {}
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

            // LOCK PHOTO
            if (event.logMessageType === "log:thread-icon" && grp.lockPhoto && !isAdmin) {
                api.sendMessage(`🔒 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴘʜᴏᴛᴏ ʟᴏᴄᴋᴇᴅ!${timeFooter()}`, tid);
            }

            // LOCK NICK
            if (event.logMessageType === "log:user-nickname" && grp.lockNick && !isAdmin) {
                const target = event.logMessageData?.participant_id;
                if (target) {
                    try {
                        await new Promise(r => api.changeNickname("", tid, target, () => r()));
                        api.sendMessage(`🔒 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ɴɪᴄᴋɴᴀᴍᴇ ʟᴏᴄᴋᴇᴅ!${timeFooter()}`, tid);
                    } catch (e) {}
                }
            }

            // ANTI-RAID
            if (event.logMessageType === "log:subscribe" && sec.antiRaid) {
                if (!joinTracker[tid]) joinTracker[tid] = [];
                const now = Date.now();
                joinTracker[tid] = joinTracker[tid].filter(t => now - t < 60000);
                joinTracker[tid].push(now);
                if (joinTracker[tid].length >= 5) {
                    db.groups[tid] = db.groups[tid] || {};
                    db.groups[tid].lockAll = true;
                    saveDB(db);
                    api.sendMessage(`🚨 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴀɴᴛɪ-ʀᴀɪᴅ!${timeFooter()}`, tid);
                }
            }

            // AUTO BOT KICK
            if (event.logMessageType === "log:subscribe" && sec.antiBotAuto) {
                const added = event.logMessageData?.addedParticipants || [];
                const botID = api.getCurrentUserID();
                for (const p of added) {
                    if (p.userFbId === botID) continue;
                    setTimeout(async () => {
                        try {
                            const user = await new Promise(r => api.getUserInfo(p.userFbId, (e, ret) => r(e ? null : ret[p.userFbId])));
                            if (user && isBot(user.name)) {
                                await sleep(2000);
                                api.removeUserFromGroup(p.userFbId, tid, (err) => {
                                    if (!err) api.sendMessage(`🤖 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ᴀɴᴛɪ-ʙᴏᴛ!\n⚠️ ${user.name} ᴋɪᴄᴋᴇᴅ${timeFooter()}`, tid);
                                });
                            }
                        } catch (e) {}
                    }, 3000);
                }
            }

                      // ==================== 🎉 WELCOME EVENT ====================
            if (event.logMessageType === "log:subscribe") {
                const added = event.logMessageData?.addedParticipants || [];
                const botID = api.getCurrentUserID();
                const isBotJoined = added.some(p => p.userFbId === botID);

                if (isBotJoined) {
                    api.sendMessage(`👻 ᴛʜᴀɴᴋꜱ ꜰᴏʀ ᴀᴅᴅɪɴɢ ᴍᴇ!\n💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄𝐌\n✅ ᴛʏᴘᴇ "bot active"${timeFooter()}`, tid);
                } else {
                    try {
                        // গ্রুপ তথ্য সংগ্রহ
                        const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
                        
                        // গ্রুপের নাম
                        const gname = info?.threadName || config.groupName || "SAYONARA NO MERCY - さよなら";
                        
                        // ✅ মেম্বার কাউন্ট সঠিকভাবে বের করা
                        let mcount = 0;
                        if (info && info.participantIDs) {
                            if (Array.isArray(info.participantIDs)) {
                                mcount = info.participantIDs.length;
                            } else if (typeof info.participantIDs === 'object') {
                                mcount = Object.keys(info.participantIDs).length;
                            }
                        }
                        if (mcount === 0) mcount = 100;

                        // কে অ্যাড করলো
                        let addedBy = "Unknown";
                        try {
                            const adminInfo = await new Promise(r => api.getUserInfo(event.author, (e, ret) => r(e ? null : ret[event.author])));
                            if (adminInfo && adminInfo.name) addedBy = adminInfo.name;
                        } catch (e) {}

                        // তারিখ ও সময়
                        const now = new Date();
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayName = days[now.getDay()];
                        const month = String(now.getMonth() + 1).padStart(2, '0');
                        const day = String(now.getDate()).padStart(2, '0');
                        const year = now.getFullYear();
                        let hours = now.getHours();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12 || 12;
                        const hoursStr = String(hours).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        const seconds = String(now.getSeconds()).padStart(2, '0');
                        const dateStr = `${dayName}, ${month}/${day}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;

                        for (const p of added) {
                            const name = p.fullName || "New Member";

                            // টেক্সট Message
                            const welcomeText = `Hello ${name}
Welcome to ${gname}
You're the ${mcount} member on this group, please enjoy 🎉

➕ Added by : ${addedBy}
━━━━━━━━━━━━━━━━━━━━━━━━
📅 ${dateStr}${timeFooter()}`;

                            // Avatar URL
                            const avatarUrl = `https://graph.facebook.com/${p.userFbId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

                            // টেক্সট মেসেজ আগে পাঠান
                            api.sendMessage({
                                body: welcomeText,
                                mentions: [{ tag: name, id: p.userFbId }]
                            }, tid);

                            await sleep(1500);

                            // ✅ Welcome Card তৈরি ও পাঠান
                            try {
                                const cardBuffer = await generateWelcomeCard(
                                    name,
                                    avatarUrl,
                                    gname,
                                    mcount,
                                    addedBy,
                                    dateStr
                                );

                                if (cardBuffer && cardBuffer.length > 500) {
                                    const { PassThrough } = require('stream');
                                    const stream = new PassThrough();
                                    stream.end(cardBuffer);
                                    
                                    api.sendMessage({ attachment: stream }, tid);
                                    console.log(`✅ Welcome card sent for ${name}`);
                                } else {
                                    console.log(`⚠️ Card buffer empty for ${name}, using fallback GIF`);
                                    await sendAdvancedGif(api, event, "🎉 Welcome!", 'welcome');
                                }
                            } catch (cardError) {
                                console.error("Card error:", cardError.message);
                                await sendAdvancedGif(api, event, "🎉 Welcome!", 'welcome');
                            }

                            await sleep(2000);
                        }
                    } catch (e) {
                        console.error("Welcome error:", e.message);
                    }
                }
            }

            // LEFT
            if (event.logMessageType === "log:unsubscribe") {
                const lid = event.logMessageData?.leftParticipantFbId;
                if (lid && lid !== api.getCurrentUserID()) {
                    const kicked = event.author !== lid;
                    try {
                        api.getUserInfo(lid, async (e, ret) => {
                            if (e) return;
                            const name = ret[lid]?.name || "A member";
                            const msg = kicked
                                ? `👢 ${name} ᴋɪᴄᴋᴇᴅ\n💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ`
                                : `🌸 ꜱᴀʏᴏɴᴀʀᴀ ${name}\n💔 ɢᴏᴏᴅʙʏᴇ\n💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ`;
                            await sendAdvancedGif(api, event, msg + timeFooter(), 'sayonara');
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
                    api.sendMessage(`✅ ᴡᴇʟᴄᴏᴍᴇ ʙᴀᴄᴋ!${timeFooter()}`, tid);
                }

                // Protections
                if (!isOwner && !isBotAdmin && !isAdmin) {
                    if (grp.antiLink && /(https?:\/\/|www\.|\.com|\.net)/gi.test(event.body)) {
                        api.unsendMessage(event.messageID);
                        api.sendMessage(`🔗 ʟɪɴᴋꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        return;
                    }
                    if (grp.antiGali && /(madarchod|bhenchod|fuck|shit|bastard|harami)/gi.test(event.body)) {
                        api.unsendMessage(event.messageID);
                        api.sendMessage(`🤬 ʙᴀᴅ ᴡᴏʀᴅꜱ!${timeFooter()}`, tid);
                        return;
                    }
                    if (grp.antiPhone && /(\+?880|01[3-9])\d{8,9}/g.test(event.body)) {
                        api.unsendMessage(event.messageID);
                        api.sendMessage(`📱 ᴘʜᴏɴᴇ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        return;
                    }
                }

                // Anti-sticker/gif
                if (event.attachments && event.attachments.length > 0 && !isOwner && !isBotAdmin && !isAdmin) {
                    for (const att of event.attachments) {
                        if (grp.antiSticker && att.type === "sticker") {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🎨 ꜱᴛɪᴄᴋᴇʀꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
                        }
                        if (grp.antiGif && att.type === "animated_image") {
                            api.unsendMessage(event.messageID);
                            api.sendMessage(`🎬 ɢɪꜰꜱ ɴᴏᴛ ᴀʟʟᴏᴡᴇᴅ!${timeFooter()}`, tid);
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

                // ==================== BOT ACTIVE ====================
                if (msg.toLowerCase() === "bot active" || msg.toLowerCase() === "bot") {
                    const secCount = Object.keys(sec).filter(k => sec[k] === true).length;
                    return api.sendMessage(`💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄ᴍ ɪꜱ ᴀᴄᴛɪᴠᴇ ✅\n🛡️ ꜱᴇᴄᴜʀɪᴛʏ: ${secCount} ᴀᴄᴛɪᴠᴇ${timeFooter()}`, tid);
                }

                // ==================== COMMAND PROCESSING (একবারই!) ====================
                if (msg.startsWith(config.prefix)) {
                    const args = msg.slice(config.prefix.length).split(' ');
                    const cmd = args.shift().toLowerCase();

                    // Group Throttle
                    if (isGroupThrottled(tid) && !isOwner) {
                        return;
                    }

                    // Command Check
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
                        // শুধু একবার "not found" পাঠাবে
                        console.log(`❌ Command not found: ${cmd}`);
                        await sleep(SLOW_MODE.responseDelay);
                        api.sendMessage(`❌ ᴄᴏᴍᴍᴀɴᴅ ɴᴏᴛ ꜰᴏᴜɴᴅ: ${cmd}\n📖 ᴛʏᴘᴇ /help${timeFooter()}`, tid);
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
                        global.globalBotApi.removeUserFromGroup(mid, tid, () => {});
                    }
                }
            });
        }
    } catch (e) {}
}, 24 * 60 * 60 * 1000);

// ==================== HEALTH SERVER ====================
const PORT = process.env.PORT || 3000;

// ==================== ⏰ TIME SYSTEM SCHEDULERS ====================

// ✅ ১. Keep-Alive Self-Ping (প্রতি ৩ মিনিটে)
const RENDER_URL = process.env.RENDER_URL || "https://destroy-k66o.onrender.com";
setInterval(async () => {
    try {
        const start = Date.now();
        await axios.get(RENDER_URL, { timeout: 10000 });
        const responseTime = Date.now() - start;
        const { addPingHistory } = require('./utils');
        addPingHistory(responseTime);
        console.log(`⏰ [${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour12: false })}] Keep-Alive: ${responseTime}ms`);
    } catch (e) {
        console.log(`⚠️ Keep-Alive failed: ${e.message}`);
    }
}, 3 * 60 * 1000); // ৩ মিনিট

// ✅ ২. Health Monitor (প্রতি ৫ মিনিটে)
setInterval(async () => {
    try {
        const { healthCheck, getAvgPing } = require('./utils');
        const health = healthCheck();
        
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`💀 SAYONARA HEALTH CHECK`);
        console.log(`⏱️ Uptime: ${health.uptimeHuman}`);
        console.log(`💾 Memory: ${health.memoryUsed}MB / ${health.memoryTotal}MB`);
        console.log(`📡 Avg Ping: ${health.avgPing}ms`);
        console.log(`🕐 Time: ${health.time}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━`);

        // রিম লিমিট চেক
        if (health.memoryUsed > 400) {
            console.log("⚠️ Memory high! Cleaning...");
            if (global.gc) global.gc();
        }
    } catch (e) {
        console.error("Health check error:", e.message);
    }
}, 5 * 60 * 1000); // ৫ মিনিট

// ✅ ৩. Auto-Restart (প্রতি ৬ ঘণ্টায়)
setInterval(async () => {
    try {
        const { shouldRestart } = require('./utils');
        if (shouldRestart()) {
            console.log("🔄 Auto-restart scheduled (every 6 hours)");
            console.log("⏰ Restarting in 10 seconds...");
            
            setTimeout(() => {
                console.log("🔄 Restarting now...");
                process.exit(0);
            }, 10000);
        }
    } catch (e) {}
}, 30 * 60 * 1000); // প্রতি ৩০ মিনিটে চেক করবে

// ✅ ৪. Cache Cleanup (প্রতি ২৪ ঘণ্টায়)
setInterval(async () => {
    try {
        const { cleanOldData } = require('./utils');
        const cleaned = cleanOldData();
        console.log(`🧹 Cache cleanup: ${cleaned} old entries removed`);
    } catch (e) {}
}, 24 * 60 * 60 * 1000); // ২৪ ঘণ্টা

// ✅ ৫. Daily Status Report (প্রতিদিন সকাল ৯টায়)
setInterval(async () => {
    try {
        const { getHourDhaka, healthCheck } = require('./utils');
        const hour = getHourDhaka();
        
        if (hour === 9) {
            const health = healthCheck();
            console.log(`📊 DAILY STATUS REPORT`);
            console.log(`⏱️ Uptime: ${health.uptimeHuman}`);
            console.log(`💾 Memory: ${health.memoryUsed}MB`);
            console.log(`📡 Ping: ${health.avgPing}ms`);
        }
    } catch (e) {}
}, 60 * 60 * 1000); // প্রতি ঘণ্টায় চেক

// ==================== 🌐 HEALTH SERVER ====================



http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓𝐄𝐌 24/7\nUptime: ${Math.floor(process.uptime())}s`);
}).listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Health server on port ${PORT}`);
});


// ==================== ERROR HANDLERS ====================
process.on('uncaughtException', (err) => console.error("Uncaught:", err.message));
process.on('unhandledRejection', (err) => console.error("Unhandled:", err));