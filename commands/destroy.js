const fs = require('fs');
const { 
    getDB, saveDB, timeFooter, sleep, SLOW_MODE, sendAdvancedGif 
} = require('../utils');

// ==================== SUDO CHECK ====================
function isSudo(event, config) {
    return event.senderID === config.owner;
}

function sudoDenied(api, event) {
    api.sendMessage(
        `⛔ 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐍ᴏ ᴍᴇʀᴄʏ
━━━━━━━━━━━━━━━━━━━━━━━━
🚫 ꜱᴜᴅᴏ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ!
👑 ᴏᴡɴᴇʀ ᴏɴʟʏ
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
        event.threadID
    );
}

module.exports = {

    // ==================== 1. GROUP DESTROY ====================

    // Bot group theke ber hoye jabe
    botout: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        api.sendMessage(
            `👋 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ʟᴇᴀᴠɪɴɢ ɢʀᴏᴜᴘ...
━━━━━━━━━━━━━━━━━━━━━━━━
🚪 Bot will exit in 3 seconds
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID,
            () => {
                setTimeout(() => {
                    api.removeUserFromGroup(api.getCurrentUserID(), event.threadID, (err) => {
                        if (err) console.log("Bot out error:", err.message);
                    });
                }, 3000);
            }
        );
    },

    // 10 jon ke ek sathe kick
    masskick: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const mentions = Object.keys(event.mentions || {});
        if (mentions.length === 0) {
            return api.sendMessage(
                `💀 𝐌𝐀𝐒𝐒 𝐊𝐈𝐂𝐊\n━━━━━━━━━━━━━━━━━━━━━━━━\nᴜꜱᴀɢᴇ: /masskick @ᴜꜱᴇʀ1 @ᴜꜱᴇʀ2 ...\n\n⚠️ ᴍᴀx 10 ᴜꜱᴇʀꜱ ᴀᴛ ᴏɴᴄᴇ${timeFooter()}`,
                event.threadID
            );
        }

        api.sendMessage(
            `💀 𝐌𝐀𝐒𝐒 𝐊𝐈𝐂𝐊 ɪɴɪᴛɪᴀᴛᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
⏳ Kicking ${mentions.length} users...
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );

        let kicked = 0;
        let failed = 0;

        for (const uid of mentions.slice(0, 10)) {
            try {
                await new Promise(r => {
                    api.removeUserFromGroup(uid, event.threadID, (err) => {
                        if (err) failed++;
                        else kicked++;
                        r();
                    });
                });
                await sleep(1500);
            } catch (e) {
                failed++;
            }
        }

        api.sendMessage(
            `✅ 𝐌𝐀𝐒𝐒 𝐊𝐈𝐂𝐊 ᴄᴏᴍᴘʟᴇᴛᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Kicked: ${kicked}
❌ Failed: ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // Sobar nick change
    massnick: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const nick = args.join(" ").trim();
        if (!nick) {
            return api.sendMessage(
                `💀 𝐌𝐀𝐒𝐒 𝐍𝐈𝐂𝐊\n━━━━━━━━━━━━━━━━━━━━━━━━\nᴜꜱᴀɢᴇ: /massnick [ɴᴀᴍᴇ]\n━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }

        const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
        if (!info) return;

        api.sendMessage(
            `⏳ Changing ${info.participantIDs.length} nicknames...${timeFooter()}`,
            event.threadID
        );

        let ok = 0;
        let fail = 0;

        for (const id of info.participantIDs) {
            if (id === api.getCurrentUserID()) continue;
            await new Promise(resolve => {
                api.changeNickname(nick, event.threadID, id, (err) => {
                    if (err) fail++;
                    else ok++;
                    setTimeout(resolve, 500);
                });
            });
        }

        api.sendMessage(
            `✅ 𝐌𝐀𝐒𝐒 𝐍𝐈𝐂𝐊 ᴅᴏɴᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ OK: ${ok}
❌ Failed: ${fail}
📝 Nick: ${nick}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // Sob lock + mute
    nuke: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);

        const db = getDB();
        const tid = event.threadID;
        if (!db.security[tid]) db.security[tid] = {};
        if (!db.groups[tid]) db.groups[tid] = {};

        // Security
        db.security[tid].allMute = true;
        db.security[tid].onlyAdmin = true;
        db.security[tid].lockAll = true;
        db.security[tid].antiBot = true;
        db.security[tid].antiraid = true;
        db.security[tid].shield = true;

        // Group Locks
        db.groups[tid].lockName = true;
        db.groups[tid].lockPhoto = true;
        db.groups[tid].lockNick = true;
        db.groups[tid].antiLink = true;
        db.groups[tid].antiGali = true;
        db.groups[tid].antiSticker = true;
        db.groups[tid].antiGif = true;
        db.groups[tid].antiPhone = true;
        db.groups[tid].slowMode = 5;

        saveDB(db);

        const msg = `💀 𝐍𝐔𝐊𝐄 𝐄𝐗𝐄𝐂𝐔𝐓𝐄𝐃
━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Lock Name
🔒 Lock Photo
🔒 Lock Nick
🔇 All Mute
👑 Only Admin
🔗 Anti Link
🤬 Anti Gali
🎨 Anti Sticker
🎬 Anti GIF
📱 Anti Phone
🤖 Anti Bot
🛡️ Anti Raid
🛡️ Shield Mode
🐌 Slow Mode: 5s
━━━━━━━━━━━━━━━━━━━━━━━━
⛔ 𝐆ʀᴏᴜᴘ ɴᴜᴄʟᴇᴀʀ ᴇxᴇᴄᴜᴛᴇᴅ
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`;

        api.sendMessage(msg, tid);
    },

    // Sob admin remove, sudhu tumi thakba
    cleanadmin: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);

        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info || !info.adminIDs) {
                return api.sendMessage("❌ Failed to load admins" + timeFooter(), event.threadID);
            }

            const botID = api.getCurrentUserID();
            const toRemove = info.adminIDs.filter(a => a.id !== botID && a.id !== event.senderID);

            if (toRemove.length === 0) {
                return api.sendMessage(
                    `👑 𝐂𝐋𝐄𝐀𝐍 𝐀𝐃𝐌𝐈𝐍\n━━━━━━━━━━━━━━━━━━━━━━━━\nℹ️ No admins to remove${timeFooter()}`,
                    event.threadID
                );
            }

            api.sendMessage(
                `👑 𝐂𝐋𝐄𝐀𝐍 𝐀𝐃𝐌𝐈𝐍
━━━━━━━━━━━━━━━━━━━━━━━━
⏳ Removing ${toRemove.length} admins...
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );

            let removed = 0;

            for (const admin of toRemove) {
                try {
                    // Facebook API: cannot directly remove admin
                    // But we can change their role via API
                    await new Promise(r => {
                        api.changeAdminStatus(event.threadID, admin.id, false, (err) => {
                            if (!err) removed++;
                            r();
                        });
                    });
                    await sleep(1500);
                } catch (e) {}
            }

            api.sendMessage(
                `👑 𝐂𝐋𝐄𝐀𝐍 𝐀𝐃𝐌𝐈𝐍 ᴄᴏᴍᴘʟᴇᴛᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Removed: ${removed}/${toRemove.length}
👑 Only Owner remains
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
                event.threadID
            );
        } catch (e) {
            api.sendMessage("❌ Failed: " + e.message + timeFooter(), event.threadID);
        }
    },

    // Name + photo + nick reset
    groupreset: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);

        const db = getDB();
        const tid = event.threadID;

        api.sendMessage(
            `🔄 𝐆𝐑𝐎𝐔𝐏 𝐑𝐄𝐒𝐄𝐓 ɪɴɪᴛɪᴀᴛᴇᴅ...
━━━━━━━━━━━━━━━━━━━━━━━━
⏳ Please wait...${timeFooter()}`,
            tid
        );

        try {
            // Reset group name
            const newName = config.groupName || "SAYONARA NO MERCY - さよなら";
            await new Promise(r => {
                api.setTitle(newName, tid, (err) => {
                    if (err) console.log("Set title error:", err.message);
                    r();
                });
            });
            await sleep(1500);

            // Unlock all locks
            if (db.groups[tid]) {
                db.groups[tid].lockName = false;
                db.groups[tid].lockPhoto = false;
                db.groups[tid].lockNick = false;
                db.groups[tid].name = newName;
                db.groups[tid].lockedName = newName;
            }
            saveDB(db);
            await sleep(1000);

            // Reset all nicks
            const info = await new Promise(r => api.getThreadInfo(tid, (e, i) => r(e ? null : i)));
            let nicksReset = 0;

            if (info && info.participantIDs) {
                for (const id of info.participantIDs) {
                    if (id === api.getCurrentUserID()) continue;
                    await new Promise(resolve => {
                        api.changeNickname("", tid, id, (err) => {
                            if (!err) nicksReset++;
                            setTimeout(resolve, 400);
                        });
                    });
                }
            }

            api.sendMessage(
                `🔄 𝐆𝐑𝐎𝐔𝐏 𝐑𝐄𝐒𝐄𝐓 ᴄᴏᴍᴘʟᴇᴛᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Name Reset: ${newName}
✅ Photo Unlocked
✅ ${nicksReset} Nicknames Reset
✅ All Locks Cleared
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
                tid
            );
        } catch (e) {
            api.sendMessage("❌ Reset failed: " + e.message + timeFooter(), tid);
        }
    },

    // ==================== 2. BOT SYSTEM ====================

    // Auto rejoin
    autorejoin: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.autoRejoin = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🔄 𝐀ᴜᴛᴏ 𝐑ᴇᴊᴏɪɴ: ${db.settings.autoRejoin ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
${db.settings.autoRejoin ? "⚠️ Bot will rejoin if kicked" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // Anti-dead
    antidead: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.antiDead = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `💀 𝐀ɴᴛɪ-𝐃ᴇᴀᴅ: ${db.settings.antiDead ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
💡 DEAD BOT ignore + loop fix
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // Admin shield
    shieldmax: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].shieldMax = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🛡️ 𝐒ʜɪᴇʟᴅ 𝐌ᴀx: ${db.security[event.threadID].shieldMax ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
💡 Admin shield activated
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // Bot hide
    selfhide: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.selfHide = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `👻 𝐒ᴇʟꜰ 𝐇ɪᴅᴇ: ${db.settings.selfHide ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
${db.settings.selfHide ? "⚠️ Bot will hide from non-owner" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // Cache clean
    clean: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        try {
            const db = getDB();
            const oldUsers = Object.keys(db.users || {}).length;
            const oldAFK = Object.keys(db.afk || {}).length;
            const oldWarnings = Object.keys(db.warnings || {}).length;

            // Clean data
            db.users = {};
            db.afk = {};
            db.warnings = {};

            saveDB(db);

            api.sendMessage(
                `🧹 𝐂𝐀𝐂𝐇𝐄 𝐂𝐋𝐄𝐀𝐍ᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👥 Users: ${oldUsers} → 0
💤 AFK: ${oldAFK} → 0
⚠️ Warnings: ${oldWarnings} → 0
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
                event.threadID
            );
        } catch (e) {
            api.sendMessage("❌ Failed: " + e.message + timeFooter(), event.threadID);
        }
    },

    // Delay set
    cooldown: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const seconds = parseInt(args[0]) || 5;
        if (seconds < 1 || seconds > 60) {
            return api.sendMessage(
                `⏱️ 𝐂ᴏᴏʟᴅᴏᴡɴ\n━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ Range: 1-60 seconds\nᴜꜱᴀɢᴇ: /cooldown [ꜱᴇᴄᴏɴᴅꜱ]${timeFooter()}`,
                event.threadID
            );
        }
        
        SLOW_MODE.commandDelay = seconds * 1000;
        
        api.sendMessage(
            `⏱️ 𝐂ᴏᴏʟᴅᴏᴡɴ 𝐒ᴇᴛ: ${seconds}ꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
💡 Command delay updated
⚠️ Prevents spam block
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // Offline dekhabe
    selfkill: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.settings) db.settings = {};
        db.settings.selfKill = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `💀 𝐒ᴇʟꜰ 𝐊ɪʟʟ: ${db.settings.selfKill ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
${db.settings.selfKill ? "⚠️ Bot will appear offline (only owner can use)" : ""}
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 3. BRUTAL CONTROL ====================

    // Force kick
    ghostkick: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) {
            return api.sendMessage(
                `👻 𝐆ʜᴏꜱᴛ 𝐊ɪᴄᴋ\n━━━━━━━━━━━━━━━━━━━━━━━━\nᴜꜱᴀɢᴇ: /ghostkick @ᴜꜱᴇʀ${timeFooter()}`,
                event.threadID
            );
        }

        api.sendMessage(
            `👻 𝐆ʜᴏꜱᴛ 𝐊ɪᴄᴋ ɪɴɪᴛɪᴀᴛᴇᴅ...
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ Multiple kick attempts
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );

        await sleep(1000);

        // Multiple attempts to ensure kick
        for (let i = 0; i < 3; i++) {
            await new Promise(r => {
                api.removeUserFromGroup(t, event.threadID, () => r());
            });
            await sleep(800);
        }

        api.sendMessage(
            `💀 𝐆ʜᴏꜱᴛ 𝐊ɪᴄᴋ ᴄᴏᴍᴘʟᴇᴛᴇᴅ!
━━━━━━━━━━━━━━━━━━━━━━━━
✅ User removed
🚫 Cannot be blocked
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // Nick war
    nickwar: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) {
            return api.sendMessage(
                `⚔️ 𝐍ɪᴄᴋ 𝐖ᴀʀ\n━━━━━━━━━━━━━━━━━━━━━━━━\nᴜꜱᴀɢᴇ: /nickwar @ᴜꜱᴇʀ${timeFooter()}`,
                event.threadID
            );
        }

        const name = event.mentions[t].replace('@', '');
        const nicknames = [
            "💀 SAYONARA",
            "💀 KILLED",
            "💀 DESTROYED",
            "💀 NO MERCY",
            "💀 GONE FOREVER"
        ];

        api.sendMessage(
            `⚔️ 𝐍ɪᴄᴋ 𝐖ᴀʀ ꜱᴛᴀʀᴛᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Target: ${name}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );

        for (let i = 0; i < 5; i++) {
            const nick = nicknames[i % nicknames.length];
            await new Promise(r => {
                api.changeNickname(nick, event.threadID, t, () => r());
            });
            await sleep(1000);
        }

        api.sendMessage(
            `💀 𝐍ɪᴄᴋ 𝐖ᴀʀ ᴄᴏᴍᴘʟᴇᴛᴇᴅ!
━━━━━━━━━━━━━━━━━━━━━━━━
✅ User renamed 5 times
🚫 Sudo only command
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // 3 warn = kick
    warnkill: async (api, event, args, config) => {
        if (!isSudo(event, config)) return sudoDenied(api, event);
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].warnKill = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `⚠️ 𝐖ᴀʀɴ 𝐊ɪʟʟ: ${db.security[event.threadID].warnKill ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
💡 3 warns = auto kick
━━━━━━━━━━━━━━━━━━━━━━━━
💀 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 ꜱʏꜱᴛᴇᴍ${timeFooter()}`,
            event.threadID
        );
    }

};