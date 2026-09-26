const {
    getDB, saveDB, timeFooter, sleep, getUserRole
} = require('../utils');

const utils = require('../utils');

const hasPermission = typeof utils.hasPermission === 'function'
    ? utils.hasPermission
    : async () => true;

const permissionDenied = typeof utils.permissionDenied === 'function'
    ? utils.permissionDenied
    : (api, event, role) => {
        api.sendMessage(
            `⛔ 𝐏ᴇʀᴍɪꜱꜱɪᴏɴ 𝐃ᴇɴɪᴇᴅ (need: ${role})${timeFooter()}`,
            event.threadID
        );
    };

// ==================== 🕒 24 HOURS CONSTANT ====================
const GUARDIAN_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

module.exports = {
    // ==================== ✅ index.js এর জন্য alias ====================
    guardian: async (api, event, config) => {
        return module.exports.handleGuardian(api, event, config);
    },

    // ==================== 🛡️ REAL-TIME GUARDIAN ====================
    handleGuardian: async (api, event, config) => {
        try {
            const db = getDB();
            const tid = event.threadID;
            const sid = event.senderID;
            const msg = event.body || "";

            if (!db.security?.[tid]?.guardian) return false;

            // 🕒 24 ঘণ্টা শেষ হলে auto OFF
            if (db.security[tid].guardianExpiry && Date.now() > db.security[tid].guardianExpiry) {
                db.security[tid].guardian = false;
                saveDB(db);
                api.sendMessage(
                    `⏰ 𝐆ᴜᴀʀᴅɪᴀɴ 𝐄xᴘɪʀᴇᴅ!\n🛡️ 24 ʜᴏᴜʀꜱ ᴄᴏᴍᴘʟᴇᴛᴇᴅ\n💤 Guardian OFF${timeFooter()}`,
                    tid
                );
                return false;
            }

            // Admin/Owner Check
            const senderRole = await getUserRole(api, event, config);
            const isOwner = senderRole === "owner";
            const isBotAdmin = senderRole === "botadmin";
            const isGroupAdmin = senderRole === "groupadmin";
            const isAdmin = isOwner || isBotAdmin || isGroupAdmin;

            // ⚠️ Group Admin দের ignore (owner + botadmin এখনো check হবে)
            // চাইলে নিচের লাইন comment করে দিলে admin-দেরও warn করবে
            if (isAdmin) return false;

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
                const linkRegex = /(https?:\/\/|www\.|\.com|\.net|\.org|\.xyz|\.live|\.me|fb\.me|bit\.ly|tinyurl|t\.me|wa\.me)/gi;
                if (linkRegex.test(msg)) {
                    violation = "🔗 𝐋ɪɴᴋ 𝐍ᴏᴛ 𝐀ʟʟᴏᴡᴇᴅ";
                    violationType = "antiLink";
                }
            }

            // ২. ANTI-GALI
            if (!violation && grp.antiGali) {
                const badWords = /(madarchod|bhenchod|fuck|shit|bastard|harami|kutta|kutir|suorer|shala|shali|khanki|magi|choda|chod|bhosdi|gandu|gaandu|bkl|mkc|gali|mader|bho$di|bhosri|randi|rand|dhon|dhonk|chud|chudir|choda|bara|bara|nunu|kutta|kutti|haramjada|haramzada|jahil|besha|besharam|kutta|kutir|bokachoda|bokachudi|madar|bap|baap)/gi;
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

    // ==================== 🛡️ /guardianon (24h) ====================
    guardianon: async (api, event, args, config) => {
        try {
            console.log("🛡️ guardianOn called by", event.senderID);
            if (!(await hasPermission(api, event, config, "groupadmin"))) {
                return permissionDenied(api, event, "groupadmin");
            }

            const db = getDB();
            if (!db.security[event.threadID]) db.security[event.threadID] = {};
            if (!db.groups[event.threadID]) db.groups[event.threadID] = {};

            const expiry = Date.now() + GUARDIAN_DURATION;
            db.security[event.threadID].guardian = true;
            db.security[event.threadID].guardianExpiry = expiry;
            db.groups[event.threadID].antiLink = true;
            db.groups[event.threadID].antiGali = true;
            db.groups[event.threadID].antiPhone = true;
            db.groups[event.threadID].antiSticker = true;
            db.groups[event.threadID].antiGif = true;
            db.security[event.threadID].capslock = true;
            if (!db.groups[event.threadID].warnLimit) {
                db.groups[event.threadID].warnLimit = 3;
            }

            saveDB(db);
            console.log("✅ Guardian ON saved to DB. Expires:", new Date(expiry).toLocaleString());

            const timeStr = new Date(expiry).toLocaleString('en-GB', {
                timeZone: 'Asia/Dhaka',
                hour12: true
            });

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
⏰ 𝐄xᴘɪʀᴇꜱ: ${timeStr}
🕒 𝐃ᴜʀᴀᴛɪᴏɴ: 24 𝐇ᴏᴜʀꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );
        } catch (err) {
            console.error("guardianOn error:", err.message);
        }
    },

    // ==================== 🛡️ /guardianoff ====================
    guardianoff: async (api, event, args, config) => {
        try {
            if (!(await hasPermission(api, event, config, "groupadmin")))
                return permissionDenied(api, event, "groupadmin");

            const db = getDB();
            if (!db.security[event.threadID]) db.security[event.threadID] = {};
            db.security[event.threadID].guardian = false;
            db.security[event.threadID].guardianExpiry = null;
            saveDB(db);

            api.sendMessage(
                `🛡️ 𝐆ᴜᴀʀᴅɪᴀɴ 𝐌ᴏᴅᴇ: OFF ❌${timeFooter()}`,
                event.threadID
            );
        } catch (err) {
            console.error("guardianOff error:", err.message);
        }
    },

    // ==================== 🛡️ /guardianstatus ====================
    guardianstatus: async (api, event, args, config) => {
        try {
            const db = getDB();
            const sec = db.security[event.threadID] || {};
            const grp = db.groups[event.threadID] || {};

            let expiryInfo = "N/A";
            if (sec.guardianExpiry) {
                const remaining = sec.guardianExpiry - Date.now();
                if (remaining > 0) {
                    const hours = Math.floor(remaining / (60 * 60 * 1000));
                    const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                    expiryInfo = `${hours}h ${mins}m ʙUᴀᴋɪ`;
                } else {
                    expiryInfo = "ᴇxᴘɪʀᴇᴅ";
                }
            }

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
⏰ 𝐄xᴘɪʀʏ: ${expiryInfo}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;

            api.sendMessage(msg, event.threadID);
        } catch (err) {
            console.error("guardianStatus error:", err.message);
        }
    },

    // ==================== 🔗 /antilink ====================
    antilink: async (api, event, args, config) => {
        try {
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
        } catch (err) { console.error("antiLink error:", err.message); }
    },

    // ==================== 🤬 /antigali ====================
    antigali: async (api, event, args, config) => {
        try {
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
        } catch (err) { console.error("antiGali error:", err.message); }
    },

    // ==================== 📱 /antiphone ====================
    antiphone: async (api, event, args, config) => {
        try {
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
        } catch (err) { console.error("antiPhone error:", err.message); }
    },

    // ==================== 🎨 /antisticker ====================
    antisticker: async (api, event, args, config) => {
        try {
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
        } catch (err) { console.error("antiSticker error:", err.message); }
    },

    // ==================== 🎬 /antigif ====================
    antigif: async (api, event, args, config) => {
        try {
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
        } catch (err) { console.error("antiGif error:", err.message); }
    },

    // ==================== 🔠 /capslock ====================
    capslock: async (api, event, args, config) => {
        try {
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
        } catch (err) { console.error("capslock error:", err.message); }
    },

    // ==================== ⚙️ /warnlimit ====================
    warnlimit: async (api, event, args, config) => {
        try {
            if (!(await hasPermission(api, event, config, "groupadmin")))
                return permissionDenied(api, event, "groupadmin");
            const num = parseInt(args[0]);
            if (!num || num < 1 || num > 10) {
                return api.sendMessage(`⚠️ 𝐔ꜱᴀɢᴇ: warnlimit <1-10>${timeFooter()}`, event.threadID);
            }
            const db = getDB();
            if (!db.groups[event.threadID]) db.groups[event.threadID] = {};
            db.groups[event.threadID].warnLimit = num;
            saveDB(db);
            api.sendMessage(`📊 𝐖ᴀʀɴ 𝐋ɪᴍɪᴛ: ${num} ✅${timeFooter()}`, event.threadID);
        } catch (err) { console.error("warnLimit error:", err.message); }
    },

    // ==================== 📊 /securitylog ====================
    securitylog: async (api, event, args, config) => {
        try {
            if (!(await hasPermission(api, event, config, "groupadmin")))
                return permissionDenied(api, event, "groupadmin");
            const db = getDB();
            const logs = db.groups[event.threadID]?.modLog || [];
            let msg = `📊 𝐒ᴇᴄᴜʀɪᴛʏ 𝐋ᴏɢ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            if (logs.length === 0) msg += `✅ ɴᴏ ᴠɪᴏʟᴀᴛɪᴏɴꜱ ʀᴇᴄᴏʀᴅᴇᴅ`;
            else for (const log of logs.slice(-15)) msg += `${log}\n`;
            msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 𝐓ᴏᴛᴀʟ: ${logs.length}${timeFooter()}`;
            api.sendMessage(msg, event.threadID);
        } catch (err) { console.error("securitylog error:", err.message); }
    },

    // ==================== 🔄 /resetwarns ====================
    resetwarns: async (api, event, args, config) => {
        try {
            if (!(await hasPermission(api, event, config, "groupadmin")))
                return permissionDenied(api, event, "groupadmin");
            const db = getDB();
            const targetID = event.mentions && Object.keys(event.mentions)[0];
            const tid = event.threadID;
            if (!targetID) return api.sendMessage(`⚠️ 𝐔ꜱᴀɢᴇ: resetwarns @user${timeFooter()}`, tid);
            if (!db.warnings) db.warnings = {};
            if (!db.warnings[tid]) db.warnings[tid] = {};
            db.warnings[tid][targetID] = 0;
            saveDB(db);
            api.sendMessage(
                `✅ 𝐖ᴀʀɴɪɴɢꜱ 𝐑ᴇꜱᴇᴛ\n👤 ${event.mentions[targetID]}\n📊 ɴᴇᴡ: 0${timeFooter()}`,
                tid
            );
        } catch (err) { console.error("resetWarns error:", err.message); }
    },

    // ==================== 📊 /mywarns ====================
    mywarns: async (api, event, args, config) => {
        try {
            const db = getDB();
            const tid = event.threadID;
            const sid = event.senderID;
            const count = db.warnings?.[tid]?.[sid] || 0;
            const limit = db.groups?.[tid]?.warnLimit || 3;
            api.sendMessage(
                `📊 𝐘ᴏᴜʀ 𝐖ᴀʀɴɪɴɢꜱ\n⚠️ ${count}/${limit}${timeFooter()}`,
                tid
            );
        } catch (err) { console.error("myWarns error:", err.message); }
    }
};
