import https from 'https';
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ALL_ROLES } from '../roles';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function createRole(token: string, guildId: string, name: string, color: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ name, color, hoist: false, mentionable: false });
    const req = https.request({
      hostname: 'discord.com', path: `/api/v10/guilds/${guildId}/roles`,
      method: 'POST', timeout: 8000,
      headers: {
        'Authorization': `Bot ${token}`, 'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk: string) => body += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 100)}`));
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.write(data);
    req.end();
  });
}

export class MakeRolesCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: false });

    const guild = interaction.guild!;
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
    if (!token) { await interaction.editReply({ content: '❌ No bot token in environment.' }); return; }

    await interaction.editReply({ content: '🔍 Checking existing roles...' });
    try { await guild.roles.fetch(); } catch {}
    const existingNames = new Set(guild.roles.cache.map(r => r.name));

    const total = ALL_ROLES.length;
    let created = 0, skipped = 0, failed = 0;
    const start = Date.now();
    const failedNames: string[] = [];

    await interaction.editReply({ content: `⚙️ 0/${total} — starting...` });

    for (let i = 0; i < total; i++) {
      const r = ALL_ROLES[i];
      if (existingNames.has(r.name)) { skipped++; continue; }

      let ok = false;
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
        try {
          await createRole(token, guild.id, r.name, r.color);
          created++; ok = true;
        } catch (e: any) {
          if (attempt === 1) { failed++; failedNames.push(r.name); }
          else await sleep(2000);
        }
      }

      if ((i + 1) % 50 === 0 || i === total - 1) {
        const pct = ((i + 1) / total * 100).toFixed(0);
        const sec = ((Date.now() - start) / 1000).toFixed(0);
        await interaction.editReply({
          content: `⚙️ ${i + 1}/${total} (${pct}%) — ✅ ${created} | ⏭️ ${skipped} | ❌ ${failed} — ${sec}s`,
        }).catch(() => {});
      }

      await sleep(1000);
    }

    const sec = ((Date.now() - start) / 1000).toFixed(0);
    let desc = `\`\`\`\n  Total    ━━  ${total}\n  Created  ━━  ${created}\n  Skipped  ━━  ${skipped}\n  Failed   ━━  ${failed}\n  Time     ━━  ${sec}s\n\`\`\``;
    if (failedNames.length > 0) {
      desc += `\n**Failed:** ${failedNames.slice(0, 10).join(', ')}${failedNames.length > 10 ? ` +${failedNames.length - 10} more` : ''}`;
    }

    const embed = new EmbedBuilder()
      .setTitle(failed > 0 ? '⚠️ Partial' : '✅ Done!')
      .setDescription(desc)
      .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] as any });
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('makeroles')
      .setDescription('Create all 281 roles (~5 min)')
      .setDMPermission(false);
  }
}
