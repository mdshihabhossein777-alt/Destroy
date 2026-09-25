// ==================== 🐌 SLOW MODE ====================
const SLOW_MODE = {
    commandDelay: 1500,
    responseDelay: 800,
    notificationDelay: 5000,
    groupCommandGap: 2000,
    botScanDelay: 3000,
    massActionDelay: 1000,
    broadcastDelay: 5000,
    typingDelay: 1000,
    afkDelay: 500
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const groupCommandTracker = {};

function isGroupThrottled(threadID) {
    const now = Date.now();
    const last = groupCommandTracker[threadID];
    if (last && now - last < SLOW_MODE.groupCommandGap) {
        return true;
    }
    groupCommandTracker[threadID] = now;
    return false;
}


module.exports = {
    getDB, saveDB, timeFooter, ROLE_LEVELS,
    getUserRole, hasPermission, permissionDenied,
    fetchAnimeGif, sendWithGif, guessGender,
    SLOW_MODE, sleep, isGroupThrottled
};