const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    sleep 
} = require('../utils');

module.exports = {

    // ==================== 🛡️ REAL-TIME MESSAGE GUARDIAN ====================
    // এই ফাংশনটি index.js থেকে প্রতি মেসেজে কল হবে
    guardian: async (api, event, config) => {
        try {
            const db = getDB();
            const tid = event.threadID;
            const sid = event.senderID;
            const msg = event.body || "";

            // Owner/Bot Admin/Group Admin চেক
            const { getUserRole } = require('../utils');
            const senderRole = await getUserRole(api, event, config);
            const isOwner = senderRole === "owner";
            const isBotAdmin = senderRole === "botadmin";
            const isGroupAdmin = senderRole === "groupadmin";
            const isAdmin = isOwner || isBotAdmin || isGroupAdmin;

            // Admin দের ইগনোর
            if (isAdmin) return false;

            const grp = db.groups[tid] || {};
            const sec = db.security[tid] || {};
            let violation = null;
            let violationType = "";

            // ==================== ১. ANTI-LINK ====================
            if (grp.antiLink) {
                const linkRegex = /(https?:\/\/|www\.|\.com|\.net|\.org|\.xyz|\.live|\.me|fb\.me|bit\.ly|tinyurl)/gi;
                if (linkRegex.test(msg)) {
                    violation = "🔗 𝐋ɪɴᴋ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                    violationType = "antiLink";
                }
            }

            // ==================== ২. ANTI-GALI ====================
            if (!violation && grp.antiGali) {
                const badWords = /(madarchod|bhenchod|fuck|shit|bastard|harami|kutta|kutir|suorer|shala|shali|khanki|magi|choda|chod|bhosdi|gandu|gaandu|bkl|mkc|mc|bc|gali)/gi;
                if (badWords.test(msg)) {
                    violation = "🤬 𝐁ᴀᴅ 𝐖ᴏʀᴅꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                    violationType = "antiGali";
                }
            }

            // ==================== ৩. ANTI-PHONE ====================
            if (!violation && grp.antiPhone) {
                const phoneRegex = /(\+?880|0)?1[3-9]\d{8}/g;
                if (phoneRegex.test(msg)) {
                    violation = "📱 𝐏ʜᴏɴᴇ 𝐍ᴜᴍʙᴇʀ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                    violationType = "antiPhone";
                }
            }

            // ==================== ৪. ANTI-CAPS ====================
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

            // ==================== ৫. ANTI-STICKER ====================
            if (!violation && grp.antiSticker && event.attachments) {
                for (const att of event.attachments) {
                    if (att.type === "sticker") {
                        violation = "🎨 𝐒ᴛɪᴄᴋᴇʀꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                        violationType = "antiSticker";
                        break;
                    }
                }
            }

            // ==================== ৬. ANTI-GIF ====================
            if (!violation && grp.antiGif && event.attachments) {
                for (const att of event.attachments) {
                    if (att.type === "animated_image") {
                        violation = "🎬 𝐆ɪꜰꜱ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                        violationType = "antiGif";
                        break;
                    }
                }
            }

            // ==================== 🚫 লঙ্ঘন হলে ====================
            if (violation) {
                // ১. মেসেজ ডিলিট
                api.unsendMessage(event.messageID, (err) => {
                    if (err) console.log("Delete failed:", err.message);
                });

                // ২. ওয়ার্নিং বাড়ান
                if (!db.warnings[tid]) db.warnings[tid] = {};
                db.warnings[tid][sid] = (db.warnings[tid][sid] || 0) + 1;
                const count = db.warnings[tid][sid];
                const warnLimit = grp.warnLimit || 3;

                // ৩. লগ সেভ
                if (!db.groups[tid]) db.groups[tid] = {};
                if (!db.groups[tid].modLog) db.groups[tid].modLog = [];
                db.groups[tid].modLog.push(
                    `[${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}] ${violationType} by ${sid}`
                );
                
                // লগ সীমিত রাখুন (সর্বশেষ ৫০টি)
                if (db.groups[tid].modLog.length > 50) {
                    db.groups[tid].modLog = db.groups[tid].modLog.slice(-50);
                }

                saveDB(db);

                // ৪. ওয়ার্নিং মেসেজ
                const userInfo = await new Promise(r => api.getUserInfo(sid, (e, ret) => r(e ? null : ret[sid])));
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

                            // ওয়ার্নিং রিসেট
                            db.warnings[tid][sid] = 0;
                            saveDB(db);
                        }
                    });
                }

                return true; // Violation detected
            }

            return false; // No violation
        } catch (err) {
            console.error("Guardian error:", err.message);
            return false;
        }
    },

    // ==================== 🛡️ ENABLE GUARDIAN ====================
    guardianOn: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].guardian = true;
        saveDB(db);

        api.sendMessage(
            `🛡️ 𝐆ᴜᴀʀᴅɪᴀɴ 𝐌ᴏᴅᴇ: ON ✅
━━━━━━━━━━━━━━━━━━━━━━━━
✅ ᴅᴇʟᴇᴛᴇ ᴠɪᴏʟᴀᴛɪɴɢ ᴍᴇꜱꜱᴀɢᴇꜱ
✅ ᴀᴜᴛᴏ ᴡᴀʀɴ ᴜꜱᴇʀꜱ
✅ ᴡᴀʀɴ ʟɪᴍɪᴛ = ᴋɪᴄᴋ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🛡️ DISABLE GUARDIAN ====================
    guardianOff: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].guardian = false;
        saveDB(db);

        api.sendMessage(
            `🛡️ 𝐆ᴜᴀʀᴅɪᴀɴ 𝐌ᴏᴅᴇ: OFF ❌${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📊 GUARDIAN STATUS ====================
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

    // ==================== 🔠 CAPSLOCK ====================
    capslock: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].capslock = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🔠 𝐀ɴᴛɪ-𝐂ᴀᴘꜱ: ${db.security[event.threadID].capslock ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔁 ANTIDUP ====================
    antidup: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiDup = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🔁 𝐀ɴᴛɪ-𝐃ᴜᴘʟɪᴄᴀᴛᴇ: ${db.security[event.threadID].antiDup ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🔁 REPEAT ====================
    repeat: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].repeat = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🔁 𝐀ɴᴛɪ-𝐑ᴇᴘᴇᴀᴛ: ${db.security[event.threadID].repeat ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🚫 ANTITAG ====================
    antitag: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].antiTag = args[0] === "on";
        saveDB(db);

        api.sendMessage(
            `🚫 𝐀ɴᴛɪ-𝐓ᴀɢ: ${db.security[event.threadID].antiTag ? "ON ✅" : "OFF ❌"}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 📊 SECURITYLOG ====================
    securitylog: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");

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

    // ==================== 🧹 SECURITYRESET ====================
    securityreset: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");

        const db = getDB();
        if (db.groups[event.threadID]) {
            db.groups[event.threadID].modLog = [];
            delete db.groups[event.threadID].antiLink;
            delete db.groups[event.threadID].antiGali;
            delete db.groups[event.threadID].antiPhone;
            delete db.groups[event.threadID].antiSticker;
            delete db.groups[event.threadID].antiGif;
            delete db.groups[event.threadID].lockName;
            delete db.groups[event.threadID].lockPhoto;
            delete db.groups[event.threadID].lockNick;
            delete db.groups[event.threadID].slowMode;
        }
        if (db.security[event.threadID]) {
            db.security[event.threadID].capslock = false;
            db.security[event.threadID].antiDup = false;
            db.security[event.threadID].repeat = false;
            db.security[event.threadID].antiTag = false;
            db.security[event.threadID].guardian = false;
        }
        saveDB(db);

        api.sendMessage(
            `🧹 𝐒ᴇᴄᴜʀɪᴛʏ 𝐑ᴇꜱᴇᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ ᴀʟʟ ʟᴏɢꜱ ᴄʟᴇᴀʀᴇᴅ
✅ ᴀʟʟ ᴘʀᴏᴛᴇᴄᴛɪᴏɴꜱ ᴏꜰꜰ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    }

};