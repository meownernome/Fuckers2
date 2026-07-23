function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function createRole(guild: any, name: string, color: number): Promise<void> {
  const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || '';
  if (!token) throw new Error('No DISCORD_TOKEN');
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
      if (res.ok) return;
      if (res.status === 403) {
        throw new Error(`HTTP 403 Forbidden — bot needs Manage Roles permission in guild ${guildId}`);
      }
      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        const retryAfter = (j as any).retry_after || 5;
        console.warn(`[createRole] 429 rate limited, retrying in ${retryAfter}s for "${name}"`);
        await sleep(Math.ceil(retryAfter * 1000) + 1000);
        continue;
      }
      // Try to read error body for debugging
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} creating "${name}": ${body.slice(0, 200)}`);
    } catch (e: any) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') {
        console.warn(`[createRole] Timeout attempt ${attempt + 1} for "${name}"`);
        await sleep(3000);
        continue;
      }
      if (attempt === 4) {
        console.error(`[createRole] FAILED after 5 attempts for "${name}": ${e.message}`);
        throw e;
      }
      console.warn(`[createRole] Retry ${attempt + 1} for "${name}": ${e.message}`);
      await sleep(5000);
    }
  }
}