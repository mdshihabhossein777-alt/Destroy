const { createCanvas, loadImage } = require('@napi-rs/canvas');
const path = require('path');
const fs = require('fs');

async function generateWelcomeCard(options) {
    const {
        userName = "New Member",
        userAvatar = null,
        groupName = "SAYONARA NO MERCY",
        memberCount = 0,
        type = "welcome"
    } = options;

    const W = 1080;
    const H = 1080;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // ==================== BACKGROUND ====================
    try {
        const bgName = type === "welcome" ? 'welcome_bg.jpg' : 'goodbye_bg.jpg';
        const bgPath = path.join(__dirname, '..', 'assets', bgName);

        if (fs.existsSync(bgPath)) {
            const bg = await loadImage(bgPath);
            const ratio = Math.max(W / bg.width, H / bg.height);
            const newW = bg.width * ratio;
            const newH = bg.height * ratio;
            const x = (W - newW) / 2;
            const y = (H - newH) / 2;
            ctx.drawImage(bg, x, y, newW, newH);
        } else {
            const grad = ctx.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, '#1a1a2e');
            grad.addColorStop(1, '#0f3460');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }
    } catch (e) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, H);
    }

    // ==================== DARK OVERLAY ====================
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, W, H);

    // ==================== BORDER ====================
    ctx.strokeStyle = 'rgba(255, 200, 220, 0.9)';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    // ==================== TOP TITLE ====================
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.shadowColor = 'rgba(255, 105, 180, 0.9)';
    ctx.shadowBlur = 30;

    const mainTitle = type === "welcome" ? '🌸 WELCOME 🌸' : '💔 GOODBYE 💔';
    ctx.fillText(mainTitle, W / 2, 220);
    ctx.shadowBlur = 0;

    // Divider
    ctx.strokeStyle = 'rgba(255, 105, 180, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(220, 265);
    ctx.lineTo(W - 220, 265);
    ctx.stroke();

    // ==================== USER AVATAR ====================
    const avatarSize = 280;
    const avatarX = W / 2;
    const avatarY = 450;

    if (userAvatar) {
        try {
            const avatar = await loadImage(userAvatar);

            // Outer glow
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 + 18, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 105, 180, 0.25)';
            ctx.fill();

            // Circle clip
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
            ctx.restore();

            // Pink ring
            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();

            // White ring
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarSize / 2 + 15, 0, Math.PI * 2);
            ctx.stroke();
        } catch (e) {
            console.error("Avatar load error:", e.message);
        }
    }

    // ==================== USER NAME ====================
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 62px sans-serif';

    let displayName = userName;
    if (displayName.length > 22) displayName = displayName.slice(0, 20) + '...';
    ctx.fillText(displayName, W / 2, 690);
    ctx.shadowBlur = 0;

    // ==================== GROUP NAME ====================
    ctx.fillStyle = 'rgba(255, 220, 235, 0.95)';
    ctx.font = 'italic 38px sans-serif';

    let displayGroup = groupName;
    if (displayGroup.length > 28) displayGroup = displayGroup.slice(0, 26) + '...';
    ctx.fillText(displayGroup, W / 2, 750);

    // ==================== INFO BOX ====================
    const boxY = 810;
    const boxH = 170;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(120, boxY, W - 240, boxH);

    ctx.strokeStyle = 'rgba(255, 105, 180, 0.75)';
    ctx.lineWidth = 3;
    ctx.strokeRect(120, boxY, W - 240, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px sans-serif';

    if (type === "welcome") {
        ctx.fillText(`📊 Member #${memberCount}`, W / 2, boxY + 65);
        ctx.fillText(`💖 Enjoy Your Stay!`, W / 2, boxY + 125);
    } else {
        ctx.fillText(`📊 Remaining: ${memberCount}`, W / 2, boxY + 65);
        ctx.fillText(`💔 We'll Miss You!`, W / 2, boxY + 125);
    }

    // ==================== BOTTOM ====================
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('🌸 SAYONARA SYSTEM 🌸', W / 2, H - 75);

    return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeCard };
