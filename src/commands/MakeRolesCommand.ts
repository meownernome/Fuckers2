import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ALL_ROLES } from '../roles';
import { createRole } from '../utils/roleCreator';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export class MakeRolesCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: false });

    const guild = interaction.guild!;
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
    if (!token) { await interaction.editReply({ content: '❌ No bot token.' }); return; }

    await interaction.editReply({ content: '🔍 Fetching existing roles...' });
    try { await guild.roles.fetch(); } catch {}
    const existingNames = new Set(guild.roles.cache.map(r => r.name));

    const total = ALL_ROLES.length;
    let created = 0, skipped = 0, failed = 0;
    const start = Date.now();
    const failedNames: string[] = [];

    await interaction.editReply({ content: `⚙️ 0/${total}` });

    for (let i = 0; i < total; i++) {
      const r = ALL_ROLES[i];
      if (existingNames.has(r.name)) { skipped++; continue; }

      try {
        await createRole(token, guild.id, r.name, r.color);
        created++;
      } catch (e: any) {
        failed++;
        failedNames.push(r.name);
      }

      if ((i + 1) % 50 === 0 || i === total - 1) {
        const pct = ((i + 1) / total * 100).toFixed(0);
        const sec = ((Date.now() - start) / 1000).toFixed(0);
        await interaction.editReply({
          content: `⚙️ ${i + 1}/${total} (${pct}%) — ✅ ${created} | ⏭️ ${skipped} | ❌ ${failed} — ${sec}s`,
        }).catch(() => {});
      }

      await sleep(2000);
    }

    const sec = ((Date.now() - start) / 1000).toFixed(0);
    let desc = `\`\`\`\n  Total    ━━  ${total}\n  Created  ━━  ${created}\n  Skipped  ━━  ${skipped}\n  Failed   ━━  ${failed}\n  Time     ━━  ${sec}s\n\`\`\``;
    if (failedNames.length > 0) {
      desc += `\n**Failed:** ${failedNames.slice(0, 10).map(n => `• ${n}`).join('\n')}`;
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
      .setDescription('Create all 281 roles') as any;
  }
}
