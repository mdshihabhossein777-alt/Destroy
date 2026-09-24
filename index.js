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
        for (const name in mod) {
            commands[name] = mod[name];
        }
    }
    console.log(`Total ${Object.keys(commands).length} commands loaded`);
} catch (e) {
    console.error("Commands load failed:", e.message);
}

// ==================== Welcome/Left GIFs ====================
const welcomeGifs = [
    "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
];
const leftGifs = [
    "https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif",
    "https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif"
];

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

        // ==================== Message Event ====================
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

        // ==================== Welcome Event ====================
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

            for (const p of added) {
                const name = p.fullName || "New Member";
                const gif = welcomeGifs[Math.floor(Math.random() * welcomeGifs.length)];
                try {
                    const res = await axios.get(gif, { responseType: 'stream' });
                    api.getThreadInfo(tid, (e, info) => {
                        const gn = info?.threadName || "Group";
                        const mc = info?.participantIDs?.length || "?";
                        const wm = `Welcome ${name}\nGroup: ${gn}\nMembers: ${mc}\nType /rules and /help`;
                        api.sendMessage({
                            body: wm,
                            mentions: [{ tag: name, id: p.userFbId }],
                            attachment: res.data
                        }, tid);
                    });
                } catch (e) {
                    api.sendMessage(`Welcome ${name}`, tid);
                }
            }
        }

        // ==================== Left Event ====================
        if (event.logMessageType === "log:unsubscribe") {
            const tid = event.threadID;
            const leftID = event.logMessageData.leftParticipantFbId;
            if (leftID === api.getCurrentUserID()) return;

            const kicked = event.author !== leftID;
            api.getUserInfo(leftID, async (e, ret) => {
                if (e) return;
                const name = ret[leftID]?.name || "A member";
                const gif = leftGifs[Math.floor(Math.random() * leftGifs.length)];
                try {
                    const res = await axios.get(gif, { responseType: 'stream' });
                    const lm = kicked
                        ? `${name} was kicked from the group`
                        : `Goodbye ${name}. We will miss you.`;
                    api.sendMessage({ body: lm, attachment: res.data }, tid);
                } catch (e) {
                    api.sendMessage(kicked ? `${name} was kicked.` : `Goodbye ${name}.`, tid);
                }
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

// ==================== Error Handlers ====================
process.on('uncaughtException', (err) => {
    console.error("Uncaught Exception:", err.message);
});

process.on('unhandledRejection', (err) => {
    console.error("Unhandled Rejection:", err);
});