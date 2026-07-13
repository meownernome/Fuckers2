import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/Logger';

const CATEGORIES = ['information', 'community', 'support', 'tier-testing', 'tickets', 'leaderboards', 'staff', 'logs', 'voice'];

const CATEGORY_PERMS: Record<string, { everyone: boolean; note: string }> = {
  information: { everyone: true, note: 'Everyone can view' },
  community:   { everyone: true, note: 'Everyone can view' },
  support:     { everyone: true, note: 'Everyone can view' },
  'tier-testing': { everyone: true, note: 'Everyone can view' },
  tickets:     { everyone: false, note: 'Staff + ticket participants only' },
  leaderboards: { everyone: true, note: 'Everyone can view' },
  staff:       { everyone: false, note: 'Staff roles only' },
  logs:        { everyone: false, note: 'Staff roles only' },
  voice:       { everyone: true, note: 'Everyone can view' },
};

export class PermissionCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild!;
    let updated = 0;
    let failed = 0;

    for (const channel of guild.channels.cache.values()) {
      if (channel.type === ChannelType.GuildCategory || channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread || channel.type === ChannelType.AnnouncementThread) continue;

      const parent = channel.parent;
      if (!parent) continue;

      const catKey = CATEGORIES.find(k => parent.name.includes(k.toUpperCase()));
      if (!catKey) continue;

      const perms = CATEGORY_PERMS[catKey];
      if (!perms) continue;

      try {
        const everyone = guild.roles.everyone;
        const ch = channel as any;
        if (perms.everyone) {
          await ch.permissionOverwrites.edit(everyone, { ViewChannel: null }, { reason: 'Permission reset' });
        } else {
          await ch.permissionOverwrites.edit(everyone, { ViewChannel: false }, { reason: 'Restrict staff channel' });
        }
        updated++;
      } catch (e: any) {
        failed++;
        logger.error(`Perm fail #${channel.name}: ${e.message}`);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🔒 Permission Sync Complete')
      .setDescription(
        `\`\`\`\n` +
        `  Updated  ━━  ${updated} channels\n` +
        `  Failed   ━━  ${failed} channels\n` +
        `\`\`\`\n\n` +
        `**Permission Rules Applied:**\n` +
        CATEGORIES.map(k => `• ${k}: ${CATEGORY_PERMS[k].note}`).join('\n')
      )
      .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] as any });
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('permission')
      .setDescription('Set channel view permissions for all roles')
      .setDMPermission(false);
  }
}
