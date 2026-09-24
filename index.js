const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');

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
try {
    const files = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
    for (const file of files) {
        const mod = require(path.join(__dirname, 'commands', file));
        for (const name in mod) commands[name] = mod[name];
    }
    console.log(`Total ${Object.keys(commands).length} commands loaded`);
} catch (e) {
    console.error("Commands load failed:", e.message);
}

const lastMsg = {};

// ==================== Login ====================
login({ appState }, (err, api) => {
    if (err) return console.error("Login failed:", err);

    api.setOptions({
        listenEvents: true,
        selfListen: false
    });

    console.log(`${config.botName} is online`);

    api.listenMqtt(async (err, event) => {
        if (err) return console.error(err);

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
                        const welcomeGifs = [
                            "https://media.tenor.com/9W3qZfY3XwAAAAAC/anime-welcome.gif",
                            "https://media.tenor.com/5K2zXfV3W0AAAAAC/welcome-anime.gif"
                        ];
                        const gif = welcomeGifs[Math.floor(Math.random() * welcomeGifs.length)];
                        try {
                            const gifRes = await axios.get(gif, { responseType: 'stream' });
                            api.sendMessage({
                                body: welcomeMsg,
                                mentions: [{ tag: name, id: p.userFbId }],
                                attachment: gifRes.data
                            }, tid);
                        } catch (e) {
                            api.sendMessage({
                                body: welcomeMsg,
                                mentions: [{ tag: name, id: p.userFbId }]
                            }, tid);
                        }
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
                        const leftGifs = [
                            "https://media.tenor.com/8W3qY2zfX0AAAAAC/anime-goodbye.gif",
                            "https://media.tenor.com/2Z4vX3WfY0AAAAAC/sad-goodbye-anime.gif"
                        ];
                        const gif = leftGifs[Math.floor(Math.random() * leftGifs.length)];
                        try {
                            const gifRes = await axios.get(gif, { responseType: 'stream' });
                            api.sendMessage({
                                body: leftMsg,
                                attachment: gifRes.data
                            }, tid);
                        } catch (e) {
                            api.sendMessage(leftMsg, tid);
                        }
                    }
                });
            });
        }
    });
});

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