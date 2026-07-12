import { Guild } from 'discord.js';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function createRole(guild: Guild, name: string, color: number): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  if (!token) throw new Error('No bot token available for role creation.');

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await guild.roles.create({
        name,
        color,
        hoist: false,
        mentionable: false,
        reason: 'makeroles command',
      });
      return;
    } catch (error: any) {
      const message = error?.message || String(error || 'Unknown role creation error');
      console.error(`[role-create] ${name}: ${message}`);

      try {
        const res = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/roles`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            color,
            hoist: false,
            mentionable: false,
            permissions: 0,
          }),
        });

        if (res.ok) return;
        const body = await res.text().catch(() => '');
        if (res.status === 403 || res.status === 401) {
          throw new Error('The bot is missing Manage Roles permission or its role is too low in the hierarchy.');
        }
        if (res.status === 400 && body.includes('maximum')) {
          throw new Error('The server has reached its role limit and can no longer create more roles.');
        }
        throw new Error(body || `Discord API error ${res.status}`);
      } catch (fallbackError: any) {
        const fallbackMessage = fallbackError?.message || String(fallbackError || 'Unknown fallback error');
        if (attempt === 3) throw new Error(fallbackMessage);
        await sleep(3000 * (attempt + 1));
      }
    }
  }
}
