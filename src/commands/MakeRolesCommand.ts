import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { ALL_ROLES } from '../roles';
import { logger } from '../utils/Logger';

export class MakeRolesCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: false });

    const guild = interaction.guild!;

    try { await guild.roles.fetch(); } catch {}

    const total = ALL_ROLES.length;
    let created = 0;
    let skipped = 0;
    let failed = 0;
    const start = Date.now();

    const statusMsg = await interaction.editReply({ content: `⚙️ Creating roles... 0/${total}` });

    for (let i = 0; i < total; i++) {
      const r = ALL_ROLES[i];
      try {
        const exists = guild.roles.cache.find(x => x.name === r.name);
        if (exists) { skipped++; continue; }
        await guild.roles.create({ name: r.name, color: r.color });
        created++;
      } catch (e: any) {
        failed++;
        logger.error(`FAIL ${r.name}: ${e.message}`);
      }

      if ((i + 1) % 25 === 0 || i === total - 1) {
        try { await statusMsg.edit({ content: `⚙️ Creating roles... ${i + 1}/${total} (${created} created, ${skipped} skipped, ${failed} failed)` }); } catch {}
      }

      await new Promise(r => setTimeout(r, 1500));
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const embed = new EmbedBuilder()
      .setTitle('✅ Role Creation Complete')
      .setDescription(
        `\`\`\`\n` +
        `  Total    ━━  ${total}\n` +
        `  Created  ━━  ${created}\n` +
        `  Skipped  ━━  ${skipped}\n` +
        `  Failed   ━━  ${failed}\n` +
        `  Time     ━━  ${elapsed}s\n` +
        `\`\`\``
      )
      .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] as any });
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('makeroles')
      .setDescription('Create all tier + staff roles (281 total)')
      .setDMPermission(false);
  }
}
