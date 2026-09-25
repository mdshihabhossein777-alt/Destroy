const fs = require('fs');
const path = require('path');
const axios = require('axios');
const http = require('http');
const login = require('@dongdev/fca-unofficial');
const config = require('./config.json');

// ✅ এখানে utils ইমপোর্ট করুন
const { getDB, saveDB, timeFooter, sendWithGif, guessGender, getUserRole } = require('./utils');

// ==================== AppState Load ====================
let appState;
try {
    if (process.env.APPSTATE) {
        appState = JSON.parse(process.env.APPSTATE);
        console.log("✅ AppState loaded from Render");
    } else {
        appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
        console.log("✅ AppState loaded from local");
    }
} catch (e) {
    console.error("❌ AppState load failed:", e.message);
    process.exit(1);
}

// ==================== Load Commands ====================
const commands = {};

function loadCommands(dir) {
    try {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const mod = require(path.join(__dirname, dir, file));
            for (const name in mod) commands[name] = mod[name];
        }
    } catch (e) {
        console.error(`Load failed from ${dir}:`, e.message);
    }
}

try {
    loadCommands('./commands');
    loadCommands('./security');
    console.log(`📦 Total ${Object.keys(commands).length} commands loaded`);
} catch (e) {
    console.error("Commands load failed:", e.message);
}

// ✅ এখানে lastMsg ডিক্লেয়ার করুন
const lastMsg = {};

// ==================== Login ====================
login({ appState }, (err, api) => {
    if (err) return console.error("Login failed:", err);

    global.globalBotApi = api;
    api.setOptions({ listenEvents: true, selfListen: false });
    console.log(`💀 ${config.botName} is online`);

    // ==================== 🔔 NOTIFICATION SYSTEM ====================
    setTimeout(async () => {
        try {
            const db = getDB();
            // ... আপনার নোটিফিকেশন কোড ...
        } catch (err) {
            console.error("Version notify error:", err.message);
        }
    }, 15000);

    // ==================== MESSAGE LISTENER ====================
    api.listenMqtt(async (err, event) => {
        if (err) return console.error(err);

        // Group tracking
        if (event.threadID && event.isGroup) {
            try {
                const db = getDB();
                // ...
            } catch (e) {}
        }

        // Message processing
        if (event.type === "message") {
            // ...
        }
    });
});

// ==================== Health Server ====================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`💀 ${config.botName} 24/7\nUptime: ${Math.floor(process.uptime())}s`);
}).listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Health server on port ${PORT}`);
});

// ==================== Self-Ping ====================
const RENDER_URL = process.env.RENDER_URL || "https://destroy-k66o.onrender.com";
setInterval(async () => {
    try { await axios.get(RENDER_URL); } catch (e) {}
}, 4 * 60 * 1000);

// ==================== Error Handlers ====================
process.on('uncaughtException', (err) => console.error("Uncaught:", err.message));
process.on('unhandledRejection', (err) => console.error("Unhandled:", err));