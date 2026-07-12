import { Guild } from 'discord.js';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function createRole(guild: Guild, name: string, color: number): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  if (!token) throw new Error('No bot token available for role creation.');

  for (let attempt = 0; attempt < 8; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/roles`, {
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

      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        const retryAfter = Math.max(10, Math.ceil((j as any)?.retry_after || 10));
        await sleep(retryAfter * 1000);
        continue;
      }

      const text = await res.text().catch(() => '');
      let message = `HTTP ${res.status}`;
      if (res.status === 403) {
        message = 'Missing Manage Roles permission or the bot role is too low.';
      } else if (res.status === 400) {
        message = 'The role could not be created. The server may already be at its role limit.';
      } else if (text) {
        message = text;
      }
      throw new Error(message);
    } catch (e: any) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') {
        await sleep(10000);
        continue;
      }

      if (attempt === 7) throw e;

      const retryAfter = e?.message?.includes('429') ? 15 : Math.min(5000 * (attempt + 1), 30000);
      await sleep(retryAfter);
    }
  }
}
