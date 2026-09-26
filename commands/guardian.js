const {
    getDB, saveDB, timeFooter, sleep, getUserRole,
    hasPermission, permissionDenied
} = require('../utils');

module.exports = {
    // ==================== ✅ ALIAS (index.js এর জন্য) ====================
    // index.js এ `const { guardian } = require('./commands/guardian');` কল করে
    // তাই এই alias দরকার
    guardian: async (api, event, config) => {
        return module.exports.handleGuardian(api, event, config);
    },

    // ==================== 🛡️ REAL-TIME GUARDIAN (Event Handler) ====================
    handleGuardian: async (api, event, config) => {
        try {
            const db = getDB();
            const tid = event.threadID;
            const sid = event.senderID;
            const msg = event.body || "";

            // Guardian OFF থাকলে কিছুই করবে না
            if (!db.security?.[tid]?.guardian) return false;

            // Admin/Owner Check
            const senderRole = await getUserRole(api, event, config);
            const isOwner = senderRole === "owner";
            const isBotAdmin = senderRole === "botadmin";
            const isGroupAdmin = senderRole === "groupadmin";
            const isAdmin = isOwner || isBotAdmin || isGroupAdmin;

            // Admin দের ইগনোর
            if (isAdmin) return false;

            // Safe DB structure
            if (!db.groups[tid]) db.groups[tid] = {};
            if (!db.security[tid]) db.security[tid] = {};
            if (!db.warnings) db.warnings = {};
            if (!db.warnings[tid]) db.warnings[tid] = {};

            const grp = db.groups[tid];
            const sec = db.security[tid];

            let violation = null;
            let violationType = "";

            // ১. ANTI-LINK
            if (grp.antiLink) {
                const linkRegex = /(https?:\/\/|www\.|\.com|\.net|\.org|\.xyz|\.live|\.me|fb\.me|bit\.ly|tinyurl)/gi;
                if (linkRegex.test(msg)) {
                    violation = "🔗 𝐋ɪɴᴋ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                    violationType = "antiLink";
                }
            }

            // ২. ANTI-GALI
            if (!violation && grp.antiGali) {
                const badWords = /(madarchod|bhenchod|fuck|shit|bastard|harami|kutta|kutir|suorer|shala|shali|khanki|magi|choda|chod|bhosdi|gandu|gaandu|bkl|mkc|gali)/gi;
                if (badWords.test(msg)) {
                    violation = "🤬 𝐁ᴀᴅ 𝐖ᴏʀᴅꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                    violationType = "antiGali";
                }
            }

            // ৩. ANTI-PHONE
            if (!violation && grp.antiPhone) {
                const phoneRegex = /(\+?880|0)?1[3-9]\d{8}/g;
                if (phoneRegex.test(msg)) {
                    violation = "📱 𝐏ʜᴏɴᴇ 𝐍ᴜᴍʙᴇʀ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                    violationType = "antiPhone";
                }
            }

            // ৪. ANTI-CAPS
            if (!violation && sec.capslock) {
                const letters = msg.replace(/[^a-zA-Z]/g, "");
                if (letters.length > 10) {
                    const capsCount = (msg.match(/[A-Z]/g) || []).length;
                    const capsRatio = capsCount / letters.length;
                    if (capsRatio > 0.7) {
                        violation = "🔠 𝐄xᴄᴇꜱꜱɪᴠᴇ 𝐂ᴀᴘꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                        violationType = "capslock";
                    }
                }
            }

            // ৫. ANTI-STICKER
            if (!violation && grp.antiSticker && event.attachments) {
                for (const att of event.attachments) {
                    if (att.type === "sticker") {
                        violation = "🎨 𝐒ᴛɪᴄᴋᴇʀꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                        violationType = "antiSticker";
                        break;
                    }
                }
            }

            // ৬. ANTI-GIF
            if (!violation && grp.antiGif && event.attachments) {
                for (const att of event.attachments) {
                    if (att.type === "animated_image") {
                        violation = "🎬 𝐆ɪꜰꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                        violationType = "antiGif";
                        break;
                    }
                }
            }

            // 🚫 লঙ্ঘন হলে
            if (violation) {
                // ১. মেসেজ ডিলিট
                api.unsendMessage(event.messageID, (err) => {
                    if (err) console.log("Delete failed:", err.message);
                });

                // ২. ওয়ার্নিং বাড়ান
                db.warnings[tid][sid] = (db.warnings[tid][sid] || 0) + 1;
                const count = db.warnings[tid][sid];
                const warnLimit = grp.warnLimit || 3;

                // ৩. লগ সেভ
                if (!db.groups[tid].modLog) db.groups[tid].modLog = [];
                db.groups[tid].modLog.push(
                    `[${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}] ${violationType} by ${sid}`
                );
                if (db.groups[tid].modLog.length > 50) {
                    db.groups[tid].modLog = db.groups[tid].modLog.slice(-50);
                }

                saveDB(db);

                // ৪. ওয়ার্নিং মেসেজ
                const userInfo = await new Promise(r =>
                    api.getUserInfo(sid, (e, ret) => r(e ? null : ret[sid]))
                );
                const userName = userInfo?.name || "User";

                await sleep(800);

                api.sendMessage({
                    body: `⚠️ 𝐑ᴜʟᴇ 𝐕ɪᴏʟᴀᴛɪᴏɴ 𝐃ᴇᴛᴇᴄᴛᴇᴅ!
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${userName}
📌 ${violation}
⚠️ 𝐖ᴀʀɴɪɴɢ: ${count}/${warnLimit}
━━━━━━━━━━━━━━━━━━━━━━━━
${count >= warnLimit ? "🚫 ᴋɪᴄᴋɪɴɢ ɪɴ 3 ꜱᴇᴄᴏɴᴅꜱ..." : `⚠️ ${warnLimit - count} ᴍᴏʀᴇ ᴡᴀʀɴɪɴɢꜱ ᴛᴏ ᴋɪᴄᴋ`}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                    mentions: [{ tag: userName, id: sid }]
                }, tid);

                // ৫. ওয়ার্ন লিমিট শেষ হলে কিক
                if (count >= warnLimit) {
                    await sleep(3000);

                    api.removeUserFromGroup(sid, tid, (err) => {
                        if (!err) {
                            api.sendMessage(
                                `🚫 𝐔ꜱᴇʀ 𝐊ɪᴄᴋᴇᴅ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${userName}
📌 𝐑ᴇᴀꜱᴏɴ: ${violation}
📊 𝐓ᴏᴛᴀʟ 𝐖ᴀʀɴɪɴɢꜱ: ${count}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                                tid
                            );
                            db.warnings[tid][sid] = 0;
                            saveDB(db);
                        }
                    });
                }

                return true;
            }

            return false;
        } catch (err) {
            console.error("Guardian error:", err.message);
            return false;
        }
    },

    // ==================== 🛡️ GUARDIAN ON ====================
    guardianOn: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};

        db.security[event.threadID].guardian = true;

        // ডিফল্ট সব filter ON
        db.groups[event.threadID].antiLink = true;
        db.groups[event.threadID].antiGali = true;
        db.groups[event.threadID].antiPhone = true;
        db.groups[event.threadID].antiSticker = true;
        db.groups[event.threadID].antiGif = true;
        db.security[event.threadID].capslock = true;

        saveDB(db);

        api.sendMessage(
            `🛡️ 𝐆ᴜᴀʀᴅɪᴀɴ 𝐌ᴏᴅᴇ: ON ✅
━━━━━━━━━━━━━━━━━━━━━━━━
✅ ᴅᴇʟᴇᴛᴇ ᴠɪᴏʟᴀᴛɪɴɢ ᴍᴇꜱꜱᴀɢᴇꜱ
✅ ᴀᴜᴛᴏ ᴡᴀʀɴ ᴜꜱᴇʀꜱ
✅ ᴡᴀʀɴ ʟɪᴍɪᴛ = ᴋɪᴄᴋ
🔗 𝐀ɴᴛɪ-𝐋ɪɴᴋ: ON ✅
🤬 𝐀ɴᴛɪ-𝐆ᴀʟɪ: ON ✅
📱 𝐀ɴᴛɪ-𝐏ʜᴏɴᴇ: ON ✅
🔠 𝐀ɴᴛɪ-𝐂ᴀᴘꜱ: ON ✅
🎨 𝐀ɴᴛɪ-𝐒ᴛɪᴄᴋᴇʀ: ON ✅
🎬 𝐀ɴᴛɪ-𝐆ɪꜰ: ON ✅
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🛡️ GUARDIAN OFF ====================
    guardianOff: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].guardian = false;
        saveDB(db);

        api.sendMessage(
            `🛡️ 𝐆ᴜᴀʀᴅɪᴀɴ 𝐌ᴏᴅᴇ: OFF ❌${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🛡️ GUARDIAN STATUS ====================
    guardianStatus: async (api, event, args, config) => {
        const db = getDB();
        const sec = db.security[event.threadID] || {};
        const grp = db.groups[event.threadID] || {};

        const msg = `🛡️ 𝐆ᴜᴀʀᴅɪᴀɴ 𝐒ᴛᴀᴛᴜꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🤖 𝐆ᴜᴀʀᴅɪᴀɴ: ${sec.guardian ? "ON ✅" : "OFF ❌"}
🔗 𝐀ɴᴛɪ-𝐋ɪɴᴋ: ${grp.antiLink ? "ON ✅" : "OFF ❌"}
🤬 𝐀ɴᴛɪ-𝐆ᴀʟɪ: ${grp.antiGali ? "ON ✅" : "OFF ❌"}
📱 𝐀ɴᴛɪ-𝐏ʜᴏɴᴇ: ${grp.antiPhone ? "ON ✅" : "OFF ❌"}
🔠 𝐀ɴᴛɪ-𝐂ᴀᴘꜱ: ${sec.capslock ? "ON ✅" : "OFF ❌"}
🎨 𝐀ɴᴛɪ-𝐒ᴛɪᴄᴋᴇʀ: ${grp.antiSticker ? "ON ✅" : "OFF ❌"}
🎬 𝐀ɴᴛɪ-𝐆ɪꜰ: ${grp.antiGif ? "ON ✅" : "OFF ❌"}
📊 𝐖ᴀʀɴ 𝐋ɪᴍɪᴛ: ${grp.warnLimit || 3}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;

        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🔗 ANTI-LINK ====================
    antiLink: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiLink = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🔗 𝐀ɴᴛɪ-𝐋ɪɴᴋ: ${db.groups[event.threadID].antiLink ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🤬 ANTI-GALI ====================
    antiGali: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiGali = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🤬 𝐀ɴᴛɪ-𝐆ᴀʟɪ: ${db.groups[event.threadID].antiGali ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📱 ANTI-PHONE ====================
    antiPhone: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiPhone = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `📱 𝐀ɴᴛɪ-𝐏ʜᴏɴᴇ: ${db.groups[event.threadID].antiPhone ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🎨 ANTI-STICKER ====================
    antiSticker: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiSticker = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🎨 𝐀ɴᴛɪ-𝐒ᴛɪᴄᴋᴇʀ: ${db.groups[event.threadID].antiSticker ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🎬 ANTI-GIF ====================
    antiGif: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].antiGif = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🎬 𝐀ɴᴛɪ-𝐆ɪꜰ: ${db.groups[event.threadID].antiGif ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔠 ANTI-CAPS ====================
    capslock: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].capslock = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🔠 𝐀ɴᴛɪ-𝐂ᴀᴘꜱ: ${db.security[event.threadID].capslock ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== ⚙️ WARN LIMIT SET ====================
    warnLimit: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const num = parseInt(args[0]);
        if (!num || num < 1 || num > 10) {
            return api.sendMessage(
                `⚠️ 𝐔ꜱᴀɢᴇ: warnlimit <1-10>${timeFooter()}`,
                event.threadID
            );
        }

        const db = getDB();
        if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
        db.groups[event.threadID].warnLimit = num;
        saveDB(db);

        api.sendMessage(
            `📊 𝐖ᴀʀɴ 𝐋ɪᴍɪᴛ: ${num} ✅${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📊 SECURITY LOG ====================
    securitylog: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        const logs = db.groups[event.threadID]?.modLog || [];

        let msg = `📊 𝐒ᴇᴄᴜʀɪᴛʏ 𝐋ᴏɢ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        if (logs.length === 0) {
            msg += `✅ ɴᴏ ᴠɪᴏʟᴀᴛɪᴏɴꜱ ʀᴇᴄᴏʀᴅᴇᴅ`;
        } else {
            const recent = logs.slice(-15);
            for (const log of recent) {
                msg += `${log}\n`;
            }
        }
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${logs.length}${timeFooter()}`;
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🔄 RESET WARNINGS ====================
    resetWarns: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin")))
            return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        const targetID = event.mentions && Object.keys(event.mentions)[0];
        const tid = event.threadID;

        if (!targetID) {
            return api.sendMessage(
                `⚠️ 𝐔ꜱᴀɢᴇ: resetwarns @user${timeFooter()}`,
                tid
            );
        }

        if (!db.warnings) db.warnings = {};
        if (!db.warnings[tid]) db.warnings[tid] = {};
        db.warnings[tid][targetID] = 0;
        saveDB(db);

        const targetName = event.mentions[targetID];
        api.sendMessage(
            `✅ 𝐖ᴀʀɴɪɴɢꜱ 𝐑ᴇꜱᴇᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${targetName}
📊 𝐍ᴇᴡ 𝐖ᴀʀɴɪɴɢꜱ: 0
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            tid
        );
    },

    // ==================== 📊 MY WARNS ====================
    myWarns: async (api, event, args, config) => {
        const db = getDB();
        const tid = event.threadID;
        const sid = event.senderID;
        const count = db.warnings?.[tid]?.[sid] || 0;
        const limit = db.groups?.[tid]?.warnLimit || 3;

        api.sendMessage(
            `📊 𝐘ᴏᴜʀ 𝐖ᴀʀɴɪɴɢꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 𝐖ᴀʀɴɪɴɢ: ${count}/${limit}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            tid
        );
    }
};
