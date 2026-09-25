const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    isBot, scanBots, sleep, SLOW_MODE 
} = require('../utils');

module.exports = {

    // ==================== 👁️ BOTDETECT ====================
    botdetect: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        api.sendMessage(
            `👁️ 𝐒ᴄᴀɴɴɪɴɢ ꜰᴏʀ ʙᴏᴛꜱ...
━━━━━━━━━━━━━━━━━━━━━━━━
⏳ ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ...
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
        
        await sleep(2000);
        
        try {
            const bots = await scanBots(api, event.threadID);
            
            let msg = `🤖 𝐁ᴏᴛ 𝐒ᴄᴀɴ 𝐑ᴇᴘᴏʀᴛ
━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            msg += `📊 𝐁ᴏᴛꜱ 𝐅ᴏᴜɴᴅ: ${bots.length}\n\n`;
            
            if (bots.length === 0) {
                msg += `✅ ɴᴏ ꜱᴜꜱᴘɪᴄɪᴏᴜꜱ ʙᴏᴛꜱ`;
            } else {
                for (let i = 0; i < bots.length; i++) {
                    msg += `${i + 1}. ⚠️ ${bots[i].name}\n   🆔 ${bots[i].id}\n`;
                }
                
                // Save detection
                const db = getDB();
                if (!db.botDetection[event.threadID]) db.botDetection[event.threadID] = [];
                db.botDetection[event.threadID].push({
                    timestamp: Date.now(),
                    bots: bots
                });
                saveDB(db);
            }
            
            msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`;
            
            api.sendMessage(msg, event.threadID);
        } catch (e) {
            api.sendMessage("❌ 𝐒ᴄᴀɴ ꜰᴀɪʟᴇᴅ" + timeFooter(), event.threadID);
        }
    },

    // ==================== 🔍 BOTCHECK ====================
    botcheck: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /botcheck @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        try {
            const user = await new Promise(r => api.getUserInfo(t, (e, ret) => r(e ? null : ret[t])));
            if (!user) return;
            
            const isBotUser = isBot(user.name);
            const name = user.name;
            
            api.sendMessage(
                `${isBotUser ? "⚠️" : "✅"} 𝐁ᴏᴛ 𝐂ʜᴇᴄᴋ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐍ᴀᴍᴇ: ${name}
🆔 ${t}
🤖 𝐈ꜱ 𝐁ᴏᴛ: ${isBotUser ? "✅ ʏᴇꜱ" : "❌ ɴᴏ"}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );
        } catch (e) {}
    },

    // ==================== 📋 BOTLIST ====================
    botlist: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        const detections = db.botDetection[event.threadID] || [];
        
        let msg = `📋 𝐁ᴏᴛ 𝐃ᴇᴛᴇᴄᴛɪᴏɴ 𝐋ɪꜱᴛ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (detections.length === 0) {
            msg += `✅ ɴᴏ ᴅᴇᴛᴇᴄᴛɪᴏɴꜱ ʏᴇᴛ`;
        } else {
            const latest = detections[detections.length - 1];
            for (let i = 0; i < latest.bots.length; i++) {
                msg += `${i + 1}. ${latest.bots[i].name}\n`;
            }
        }
        
        msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 📊 BOTLOG ====================
    botlog: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const db = getDB();
        const detections = db.botDetection[event.threadID] || [];
        
        let msg = `📊 𝐁ᴏᴛ 𝐋ᴏɢ\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (detections.length === 0) {
            msg += `✅ ɴᴏ ʟᴏɢꜱ`;
        } else {
            const recent = detections.slice(-5);
            for (const log of recent) {
                const date = new Date(log.timestamp).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' });
                msg += `📅 ${date}\n🤖 ${log.bots.length} ʙᴏᴛꜱ\n\n`;
            }
        }
        
        msg += `━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        
        api.sendMessage(msg, event.threadID);
    },

    // ==================== 🛡️ BOTPROTECT ====================
    botprotect: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].botProtect = args[0] === "on";
        saveDB(db);
        
        api.sendMessage(
            `🛡️ 𝐁ᴏᴛ 𝐏ʀᴏᴛᴇᴄᴛ: ${db.security[event.threadID].botProtect ? "ON ✅" : "OFF ❌"}
━━━━━━━━━━━━━━━━━━━━━━━━
💡 ɴᴇᴡ ʙᴏᴛꜱ ᴡɪʟʟ ʙᴇ ᴋɪᴄᴋᴇᴅ ᴀᴜᴛᴏᴍᴀᴛɪᴄᴀʟʟʏ
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== ⚙️ BOTTHRESHOLD ====================
    botthreshold: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const level = parseInt(args[0]) || 3;
        
        if (level < 1 || level > 10) {
            return api.sendMessage(`⚠️ ʀᴀɴɢᴇ: 1-10${timeFooter()}`, event.threadID);
        }
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        db.security[event.threadID].botThreshold = level;
        saveDB(db);
        
        api.sendMessage(
            `⚙️ 𝐁ᴏᴛ 𝐓ʜʀᴇꜱʜᴏʟᴅ: ${level}${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 👁️ BOTREVIEW ====================
    botreview: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /botreview @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const db = getDB();
        if (!db.security[event.threadID]) db.security[event.threadID] = {};
        if (!db.security[event.threadID].review) db.security[event.threadID].review = [];
        
        db.security[event.threadID].review.push({
            userID: t,
            reviewedBy: event.senderID,
            time: Date.now()
        });
        saveDB(db);
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.sendMessage(
            `👁️ 𝐁ᴏᴛ 𝐑ᴇᴠɪᴇᴡ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
🆔 ${t}
✅ ᴀᴅᴅᴇᴅ ᴛᴏ ʀᴇᴠɪᴇᴡ ʟɪꜱᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🧹 BOTCLEAR ====================
    botclear: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "botadmin"))) return permissionDenied(api, event, "botadmin");
        
        const db = getDB();
        db.botDetection[event.threadID] = [];
        saveDB(db);
        
        api.sendMessage(
            `🧹 𝐁ᴏᴛ 𝐃ᴇᴛᴇᴄᴛɪᴏɴ 𝐂ʟᴇᴀʀᴇᴅ${timeFooter()}`,
            event.threadID
        );
    }

};