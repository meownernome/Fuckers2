"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRole = createRole;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function createRole(guild, name, color) {
    const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || '';
    if (!token)
        throw new Error('No DISCORD_TOKEN');
    const guildId = guild.id;
    for (let attempt = 0; attempt < 5; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        try {
            const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, color, hoist: false, mentionable: false }),
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (res.ok)
                return;
            if (res.status === 429) {
                const j = await res.json().catch(() => ({}));
                const retryAfter = j.retry_after || 5;
                await sleep(Math.ceil(retryAfter * 1000) + 1000);
                continue;
            }
            throw new Error(`HTTP ${res.status}`);
        }
        catch (e) {
            clearTimeout(timer);
            if (e?.name === 'AbortError') {
                await sleep(3000);
                continue;
            }
            if (attempt === 4)
                throw e;
            await sleep(5000);
        }
    }
}
