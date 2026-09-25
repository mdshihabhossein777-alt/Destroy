const { 
    getDB, saveDB, timeFooter, hasPermission, permissionDenied, 
    sleep, SLOW_MODE 
} = require('../utils');

module.exports = {

    // ==================== 🏷️ AUTONICK ====================
    autonick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0];
        const nick = args.filter(a => !a.startsWith('@')).join(" ").trim();
        
        if (!t || !nick) {
            return api.sendMessage(
                `ᴜꜱᴀɢᴇ: /autonick @ᴜꜱᴇʀ [ɴᴀᴍᴇ]${timeFooter()}`,
                event.threadID
            );
        }

        if (nick.length > 30) {
            return api.sendMessage(`⚠️ ᴍᴀx 30 ᴄʜᴀʀᴀᴄᴛᴇʀꜱ${timeFooter()}`, event.threadID);
        }
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.changeNickname(nick, event.threadID, t, (err) => {
            if (err) {
                return api.sendMessage(`❌ 𝐅ᴀɪʟᴇᴅ ᴛᴏ ꜱᴇᴛ ɴɪᴄᴋ${timeFooter()}`, event.threadID);
            }
            api.sendMessage(
                `✅ 𝐍ɪᴄᴋɴᴀᴍᴇ 𝐒ᴇᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
📝 𝐍ᴇᴡ 𝐍ɪᴄᴋ: ${nick}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );
        });
    },

    // ==================== 🔄 RESETNICK ====================
    resetnick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const t = Object.keys(event.mentions || {})[0] || args[0];
        if (!t) return api.sendMessage(`ᴜꜱᴀɢᴇ: /resetnick @ᴜꜱᴇʀ${timeFooter()}`, event.threadID);
        
        const name = event.mentions[t]?.replace('@', '') || t;
        
        api.changeNickname("", event.threadID, t, (err) => {
            if (err) {
                return api.sendMessage(`❌ 𝐅ᴀɪʟᴇᴅ${timeFooter()}`, event.threadID);
            }
            api.sendMessage(
                `✅ 𝐍ɪᴄᴋɴᴀᴍᴇ 𝐑ᴇꜱᴇᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );
        });
    },

    // ==================== 🌸 MASSNICK ====================
    massnick: async (api, event, args, config) => {
        if (!(await hasPermission(api, event, config, "groupadmin"))) return permissionDenied(api, event, "groupadmin");
        
        const nick = args.join(" ").trim();
        if (!nick) {
            return api.sendMessage(`ᴜꜱᴀɢᴇ: /massnick [ɴᴀᴍᴇ]${timeFooter()}`, event.threadID);
        }
        
        if (nick.length > 30) {
            return api.sendMessage(`⚠️ ᴍᴀx 30 ᴄʜᴀʀᴀᴄᴛᴇʀꜱ${timeFooter()}`, event.threadID);
        }

        try {
            const info = await new Promise(r => api.getThreadInfo(event.threadID, (e, i) => r(e ? null : i)));
            if (!info) return;

            api.sendMessage(
                `⏳ 𝐂ʜᴀɴɢɪɴɢ ${info.participantIDs.length} ɴɪᴄᴋɴᴀᴍᴇꜱ...
━━━━━━━━━━━━━━━━━━━━━━━━
📝 𝐍ᴇᴡ 𝐍ɪᴄᴋ: ${nick}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );

            let ok = 0, fail = 0;
            const botID = api.getCurrentUserID();

            for (const id of info.participantIDs) {
                if (id === botID) continue;
                
                await new Promise(resolve => {
                    api.changeNickname(nick, event.threadID, id, (err) => {
                        if (err) fail++;
                        else ok++;
                        setTimeout(resolve, SLOW_MODE.massActionDelay);
                    });
                });
            }

            api.sendMessage(
                `✅ 𝐌ᴀꜱꜱ 𝐍ɪᴄᴋ 𝐂ᴏᴍᴘʟᴇᴛᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
✅ 𝐒ᴜᴄᴄᴇꜱꜱ: ${ok}
❌ 𝐅ᴀɪʟᴇᴅ: ${fail}
📝 𝐍ɪᴄᴋ: ${nick}
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐒𝐀𝐘𝐎𝐍𝐀𝐑𝐀 𝐒𝐘𝐒𝐓ᴇᴍ${timeFooter()}`,
                event.threadID
            );
        } catch (e) {
            api.sendMessage("❌ 𝐄ʀʀᴏʀ" + timeFooter(), event.threadID);
        }
    }

};