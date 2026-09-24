const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');

// ==================== 🔑 AppState Load (Local + Render) ====================
let appState;
try {
    if (process.env.APPSTATE) {
        appState = JSON.parse(process.env.APPSTATE);
        console.log("✅ AppState Render থেকে লোড হয়েছে");
    } else {
        appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
        console.log("✅ AppState লোকাল ফাইল থেকে লোড হয়েছে");
    }
} catch (e) {
    console.error("❌ AppState লোড হয়নি:", e.message);
    process.exit(1);
}

// ==================== 📦 Commands Loader ====================
const commands = {};
try {
    const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
    for (const file of files) {
        const mod = require(path.join(__dirname, 'commands', file));
        for (const name in mod) {
            commands[name] = mod[name];
        }
    }
    console.log(`📦 মোট ${Object.keys(commands).length} টি কমান্ড লোড হয়েছে।`);
} catch (e) {
    console.error("❌ কমান্ড লোড হয়নি:", e.message);
}

// ==================== 🎬 Welcome/Left GIFs ====================
const welcomeGifs = [
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
];
const leftGifs = [
    "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif"
];

const lastMsg = {};

// ==================== 🚀 Login ====================
login({ appState }, (err, api) => {
    if (err) return console.error("❌ লগইন ব্যর্থ:", err);

    api.setOptions({
        listenEvents: true,
        selfListen: false
    });

    console.log(`${config.botName} অনলাইন! ✅`);

    api.listenMqtt(async (err, event) => {
        if (err) return console.error(err);

        // ==================== 💬 Message Event ====================
        if (event.type === "message") {
            const msg = event.body.trim();
            const tid = event.threadID;

            // 🛡️ Slow Mode (একই গ্রুপে ৩ সেকেন্ডে একবার)
            const now = Date.now();
            if (lastMsg[tid] && (now - lastMsg[tid] < 3000)) return;
            lastMsg[tid] = now;

            // "bot active" লিখলে উত্তর
            if (msg.toLowerCase() === "bot active" || msg.toLowerCase() === "bot") {
                return api.sendMessage(`${config.botName} সক্রিয় আছে! ✅`, tid);
            }

            // কমান্ড প্রসেসিং
            if (msg.startsWith(config.prefix)) {
                const args = msg.slice(config.prefix.length).split(' ');
                const cmd = args.shift().toLowerCase();

                if (commands[cmd]) {
                    console.log(`✅ কমান্ড রান: ${cmd}`);
                    api.sendTypingIndicator(tid, () => {});
                    const delay = Math.floor(Math.random() * 1000) + 1000;
                    setTimeout(() => {
                        try {
                            commands[cmd](api, event, args, config);
                        } catch (e) {
                            console.error(`❌ ${cmd}:`, e);
                        }
                    }, delay);
                } else {
                    console.log(`❌ কমান্ড পাওয়া যায়নি: ${cmd}`);
                    api.sendMessage("❌ কমান্ডটি খুঁজে পাওয়া যায়নি। /help লিখে দেখুন।", tid);
                }
            }
        }

        // ==================== 🎉 Welcome Event ====================
        if (event.logMessageType === "log:subscribe") {
            const tid = event.threadID;
            const added = event.logMessageData.addedParticipants;
            const botID = api.getCurrentUserID();
            const isBot = added.some(p => p.userFbId === botID);

            if (isBot) {
                return api.sendMessage(
                    `👻 ধন্যবাদ!\n💀 ${config.botName} সেবা দিতে প্রস্তুত।\n✅ bot active\n📖 /help`,
                    tid
                );
            }

            for (const p of added) {
                const name = p.fullName || "নতুন সদস্য";
                const gif = welcomeGifs[Math.floor(Math.random() * welcomeGifs.length)];
                try {
                    const res = await axios.get(gif, { responseType: 'stream' });
                    api.getThreadInfo(tid, (e, info) => {
                        const gn = info?.threadName || "গ্রুপ";
                        const mc = info?.participantIDs?.length || "?";
                        const wm = `🎉 স্বাগতম ${name}! 🎉\n━━━━━━━━━━━━━━\n🏠 ${gn}\n👥 মোট: ${mc}\n💀 ${config.botName}\n━━━━━━━━━━━━━━\n📖 /rules  🤝 /help`;
                        api.sendMessage({
                            body: wm,
                            mentions: [{ tag: name, id: p.userFbId }],
                            attachment: res.data
                        }, tid);
                    });
                } catch (e) {
                    api.sendMessage(`🎉 স্বাগতম ${name}!`, tid);
                }
            }
        }

        // ==================== 👋 Left Event ====================
        if (event.logMessageType === "log:unsubscribe") {
            const tid = event.threadID;
            const leftID = event.logMessageData.leftParticipantFbId;
            if (leftID === api.getCurrentUserID()) return;

            const kicked = event.author !== leftID;
            api.getUserInfo(leftID, async (e, ret) => {
                if (e) return;
                const name = ret[leftID]?.name || "একজন সদস্য";
                const gif = leftGifs[Math.floor(Math.random() * leftGifs.length)];
                try {
                    const res = await axios.get(gif, { responseType: 'stream' });
                    const lm = kicked
                        ? `👢 ${name} কে কিক করা হয়েছে।\n💀 ${config.botName}`
                        : `👋 বিদায় ${name}! 💔\nআবার দেখা হবে! 🌟\n💀 ${config.botName}`;
                    api.sendMessage({ body: lm, attachment: res.data }, tid);
                } catch (e) {
                    api.sendMessage(kicked ? `👢 ${name} কিক হয়েছে।` : `👋 বিদায় ${name}!`, tid);
                }
            });
        }
    });
});

// ==================== 🌐 Health Check Server (Render 24/7) ====================
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`💀 ${config.botName} is running 24/7! ✅\nUptime: ${Math.floor(process.uptime())}s`);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Health Check Server চালু: পোর্ট ${PORT}`);
});

// ==================== 🛡️ Error Handlers ====================
process.on('uncaughtException', (err) => {
    console.error("❌ Uncaught Exception:", err.message);
});

process.on('unhandledRejection', (err) => {
    console.error("❌ Unhandled Rejection:", err);
});