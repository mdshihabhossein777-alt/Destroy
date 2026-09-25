const axios = require('axios');
const { 
    getDB, saveDB, timeFooter, sendAdvancedGif, getDhakaTime 
} = require('../utils');

module.exports = {

    // ==================== 🎬 HUG ====================
    hug: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "someone";
        const msg = `🤗 𝐖ᴀʀᴍ 𝐇ᴜɢ
━━━━━━━━━━━━━━━━━━━━━━━━
❤️ ${name} ɢᴇᴛꜱ ᴀ ᴡᴀʀᴍ ʜᴜɢ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'love');
    },

    // ==================== 💋 KISS ====================
    kiss: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "someone";
        const msg = `💋 𝐒ᴡᴇᴇᴛ 𝐊ɪꜱꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
💕 ${name} ɢᴇᴛꜱ ᴀ ꜱᴡᴇᴇᴛ ᴋɪꜱꜱ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'love');
    },

    // ==================== 👋 SLAP ====================
    slap: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "someone";
        const msg = `👋 𝐒ʟᴀᴘ!
━━━━━━━━━━━━━━━━━━━━━━━━
🔥 ${name} ɢᴇᴛꜱ ꜱʟᴀᴘᴘᴇᴅ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sakura');
    },

    // ==================== 🫶 PAT ====================
    pat: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "someone";
        const msg = `🫶 𝐂ᴜᴛᴇ 𝐏ᴀᴛ
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 ${name} ɢᴇᴛꜱ ᴘᴀᴛᴛᴇᴅ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sakura');
    },

    // ==================== 💃 DANCE ====================
    dance: async (api, event) => {
        const msg = `💃 𝐃ᴀɴᴄᴇ!
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐁ᴏᴛ ɪꜱ ᴅᴀɴᴄɪɴɢ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sakura');
    },

    // ==================== 😭 CRY ====================
    cry: async (api, event) => {
        const msg = `😭 𝐂ʀʏɪɴɢ...
━━━━━━━━━━━━━━━━━━━━━━━━
💔 𝐁ᴏᴛ ɪꜱ ᴄʀʏɪɴɢ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sayonara');
    },

    // ==================== 😂 LAUGH ====================
    laugh: async (api, event) => {
        const msg = `😂 𝐋ᴏʟ!
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐁ᴏᴛ ɪꜱ ʟᴀᴜɢʜɪɴɢ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sakura');
    },

    // ==================== 😡 ANGRY ====================
    angry: async (api, event) => {
        const msg = `😡 𝐀ɴɢʀʏ!
━━━━━━━━━━━━━━━━━━━━━━━━
🔥 𝐁ᴏᴛ ɪꜱ ᴀɴɢʀʏ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sasuke');
    },

    // ==================== 😴 SLEEP ====================
    sleep: async (api, event) => {
        const msg = `😴 𝐒ʟᴇᴇᴘʏ...
━━━━━━━━━━━━━━━━━━━━━━━━
💤 𝐁ᴏᴛ ɪꜱ ꜱʟᴇᴇᴘɪɴɢ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sakura');
    },

    // ==================== 🤔 THINK ====================
    think: async (api, event) => {
        const msg = `🤔 𝐓ʜɪɴᴋɪɴɢ...
━━━━━━━━━━━━━━━━━━━━━━━━
💭 𝐁ᴏᴛ ɪꜱ ᴛʜɪɴᴋɪɴɢ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sakura');
    },

    // ==================== 😎 COOL ====================
    cool: async (api, event) => {
        const msg = `😎 𝐂ᴏᴏʟ!
━━━━━━━━━━━━━━━━━━━━━━━━
🔥 𝐁ᴏᴛ ɪꜱ ᴄᴏᴏʟ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 💪 FIGHT ====================
    fight: async (api, event) => {
        const t = Object.keys(event.mentions || {})[0];
        const name = t ? event.mentions[t].replace('@', '') : "someone";
        const msg = `💪 𝐅ɪɢʜᴛ!
━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ 𝐁ᴏᴛ ᴠꜱ ${name}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sasuke');
    },

    // ==================== 🎭 POSE ====================
    pose: async (api, event) => {
        const msg = `🎭 𝐏ᴏꜱᴇ!
━━━━━━━━━━━━━━━━━━━━━━━━
🌸 𝐁ᴏᴛ ꜱᴛʀɪᴋᴇꜱ ᴀ ᴘᴏꜱᴇ!
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'itachi');
    },

    // ==================== 🎮 GAME ====================
    game: async (api, event) => {
        const games = [
            "🎲 𝐃ɪᴄᴇ - /dice",
            "🪙 𝐂ᴏɪɴ - /coin",
            "✂️ 𝐑𝐏𝐒 - /rps",
            "🎯 𝐑ᴀɴᴅᴏᴍ - /random",
            "🎱 8𝐁ᴀʟʟ - /8ball"
        ];
        
        const msg = `🎮 𝐆ᴀᴍᴇ 𝐙ᴏɴᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
${games.join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`;
        await sendAdvancedGif(api, event, msg, 'sakura');
    },

    // ==================== 🎲 DICE ====================
    dice: (api, event) => {
        const result = Math.floor(Math.random() * 6) + 1;
        const diceEmoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
        
        api.sendMessage(
            `🎲 𝐃ɪᴄᴇ 𝐑ᴏʟʟ
━━━━━━━━━━━━━━━━━━━━━━━━
${diceEmoji[result - 1]} 𝐑ᴇꜱᴜʟᴛ: ${result}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🪙 COIN ====================
    coin: (api, event) => {
        const result = Math.random() < 0.5 ? "HEADS" : "TAILS";
        const emoji = result === "HEADS" ? "👑" : "🪙";
        
        api.sendMessage(
            `🪙 𝐂ᴏɪɴ 𝐅ʟɪᴘ
━━━━━━━━━━━━━━━━━━━━━━━━
${emoji} 𝐑ᴇꜱᴜʟᴛ: ${result}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== ✂️ RPS ====================
    rps: (api, event, args) => {
        const moves = ["rock", "paper", "scissors"];
        const botMove = moves[Math.floor(Math.random() * 3)];
        const userMove = args[0]?.toLowerCase();
        
        if (!userMove || !moves.includes(userMove)) {
            return api.sendMessage(
                `✂️ 𝐑ᴏᴄᴋ 𝐏ᴀᴘᴇʀ 𝐒ᴄɪꜱꜱᴏʀꜱ
━━━━━━━━━━━━━━━━━━━━━━━━
ᴜꜱᴀɢᴇ: /rps [rock/paper/scissors]
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }
        
        let result;
        if (userMove === botMove) result = "🤝 𝐓ɪᴇ!";
        else if (
            (userMove === "rock" && botMove === "scissors") ||
            (userMove === "paper" && botMove === "rock") ||
            (userMove === "scissors" && botMove === "paper")
        ) result = "🎉 𝐘ᴏᴜ 𝐖ɪɴ!";
        else result = "😢 𝐘ᴏᴜ 𝐋ᴏꜱᴇ!";
        
        const emojis = { rock: "✊", paper: "✋", scissors: "✌️" };
        
        api.sendMessage(
            `✂️ 𝐑𝐏𝐒
━━━━━━━━━━━━━━━━━━━━━━━━
👤 𝐘ᴏᴜ: ${emojis[userMove]} ${userMove}
🤖 𝐁ᴏᴛ: ${emojis[botMove]} ${botMove}
━━━━━━━━━━━━━━━━━━━━━━━━
${result}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🎯 RANDOM ====================
    random: (api, event, args) => {
        const min = parseInt(args[0]) || 1;
        const max = parseInt(args[1]) || 100;
        
        if (min >= max) {
            return api.sendMessage(
                `🎯 𝐑ᴀɴᴅᴏᴍ 𝐍ᴜᴍʙᴇʀ
━━━━━━━━━━━━━━━━━━━━━━━━
ᴜꜱᴀɢᴇ: /random [ᴍɪɴ] [ᴍᴀx]
ᴇxᴀᴍᴘʟᴇ: /random 1 100
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }
        
        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        
        api.sendMessage(
            `🎯 𝐑ᴀɴᴅᴏᴍ 𝐍ᴜᴍʙᴇʀ
━━━━━━━━━━━━━━━━━━━━━━━━
📊 𝐑ᴀɴɢᴇ: ${min} - ${max}
🎲 𝐑ᴇꜱᴜʟᴛ: ${result}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🤔 CHOOSE ====================
    choose: (api, event, args) => {
        const text = args.join(" ");
        if (!text) {
            return api.sendMessage(
                `🤔 𝐂ʜᴏᴏꜱᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
ᴜꜱᴀɢᴇ: /choose option1 | option2 | option3
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }
        
        const options = text.split("|").map(o => o.trim()).filter(o => o);
        if (options.length < 2) {
            return api.sendMessage("❌ 𝐏ʀᴏᴠɪᴅᴇ ᴀᴛ ʟᴇᴀꜱᴛ 2 ᴏᴘᴛɪᴏɴꜱ" + timeFooter(), event.threadID);
        }
        
        const choice = options[Math.floor(Math.random() * options.length)];
        
        api.sendMessage(
            `🤔 𝐈 𝐂ʜᴏᴏꜱᴇ:
━━━━━━━━━━━━━━━━━━━━━━━━
✅ ${choice}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🎰 SLOT ====================
    slot: (api, event, args) => {
        const db = getDB();
        const user = db.users?.[event.senderID] || { coins: 0 };
        const bet = parseInt(args[0]) || 100;
        
        if (bet > user.coins) {
            return api.sendMessage(`❌ 𝐍ᴏᴛ ᴇɴᴏᴜɢʜ ᴄᴏɪɴꜱ!${timeFooter()}`, event.threadID);
        }
        
        const symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣"];
        const s1 = symbols[Math.floor(Math.random() * symbols.length)];
        const s2 = symbols[Math.floor(Math.random() * symbols.length)];
        const s3 = symbols[Math.floor(Math.random() * symbols.length)];
        
        const result = `${s1} | ${s2} | ${s3}`;
        let winAmount = 0;
        
        if (s1 === s2 && s2 === s3) {
            winAmount = bet * 3;
            user.coins += winAmount;
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
            winAmount = Math.floor(bet * 1.5);
            user.coins += winAmount;
        } else {
            user.coins -= bet;
        }
        
        db.users[event.senderID] = user;
        saveDB(db);
        
        api.sendMessage(
            `🎰 𝐒ʟᴏᴛ 𝐌ᴀᴄʜɪɴᴇ
━━━━━━━━━━━━━━━━━━━━━━━━
${result}
━━━━━━━━━━━━━━━━━━━━━━━━
${winAmount > 0 ? `🎉 𝐖ᴏɴ: +${winAmount} 💎` : `😢 𝐋ᴏꜱᴛ: -${bet} 💎`}
💰 𝐁ᴀʟᴀɴᴄᴇ: ${user.coins}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
            event.threadID
        );
    },

    // ==================== 🎰 GAMBLE ====================
    gamble: (api, event, args) => {
        const db = getDB();
        const user = db.users?.[event.senderID] || { coins: 0 };
        const bet = parseInt(args[0]);
        
        if (!bet || bet <= 0) {
            return api.sendMessage(`ᴜꜱᴀɢᴇ: /gamble [ᴀᴍᴏᴜɴᴛ]${timeFooter()}`, event.threadID);
        }
        
        if (bet > user.coins) {
            return api.sendMessage(`❌ 𝐍ᴏᴛ ᴇɴᴏᴜɢʜ ᴄᴏɪɴꜱ!${timeFooter()}`, event.threadID);
        }
        
        if (Math.random() < 0.5) {
            user.coins += bet;
            api.sendMessage(
                `🎉 𝐘ᴏᴜ 𝐖ᴏɴ!
━━━━━━━━━━━━━━━━━━━━━━━━
💰 +${bet} 💎
💎 𝐓ᴏᴛᴀʟ: ${user.coins}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        } else {
            user.coins -= bet;
            api.sendMessage(
                `😢 𝐘ᴏᴜ 𝐋ᴏꜱᴛ!
━━━━━━━━━━━━━━━━━━━━━━━━
💸 -${bet} 💎
💎 𝐓ᴏᴛᴀʟ: ${user.coins}
━━━━━━━━━━━━━━━━━━━━━━━━${timeFooter()}`,
                event.threadID
            );
        }
        
        db.users[event.senderID] = user;
        saveDB(db);
    }

};