import { Guild } from 'discord.js';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function createRole(guild: Guild, name: string, color: number): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  if (!token) throw new Error('No bot token available for role creation.');

  await guild.roles.fetch();
  const existingRole = guild.roles.cache.find(role => role.name.toLowerCase() === name.toLowerCase());
  if (existingRole) return;

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
      const normalized = message.toLowerCase();
      console.error(`[role-create] ${name}: ${message}`);

      if (normalized.includes('already exists') || normalized.includes('duplicate') || normalized.includes('name already')) {
        return;
      }

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
        if (res.status === 429) {
          if (attempt === 3) throw new Error('Discord rate limited role creation. Please try again in a moment.');
          await sleep(5000 * (attempt + 1));
          continue;
        }
        if (res.status === 400 && body.includes('maximum')) {
          throw new Error('The server has reached its role limit and can no longer create more roles.');
        }
        if (res.status === 400 && body.includes('already exists')) {
          return;
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
