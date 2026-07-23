import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/Logger';
import { CATEGORIES } from '../ServerSetup';

const CATEGORY_PERMS: Record<string, { view: boolean; send: boolean; note: string }> = {
  information:    { view: true,  send: false, note: 'Everyone can view, read-only' },
  verification:   { view: true,  send: false, note: 'Everyone can view, read-only' },
  community:      { view: true,  send: true,  note: 'Everyone can view & chat' },
  roles:          { view: true,  send: false, note: 'Everyone can view, read-only' },
  'tier-testing': { view: true,  send: false, note: 'Everyone can view, read-only' },
  support:        { view: true,  send: false, note: 'Everyone can view, read-only' },
  staff:          { view: false, send: false, note: 'Staff only' },
  logs:           { view: false, send: false, note: 'Staff only' },
  tickets:        { view: false, send: false, note: 'Staff + ticket participants' },
  voice:          { view: true,  send: true,  note: 'Everyone can view & join' },
};

export class PermissionCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    let updated = 0;
    let failed = 0;

    for (const channel of guild.channels.cache.values()) {
      if (channel.type === ChannelType.GuildCategory || channel.type === ChannelType.PublicThread || channel.type === ChannelType.PrivateThread || channel.type === ChannelType.AnnouncementThread) continue;

      const parent = channel.parent;
      if (!parent) continue;

      const catEntry = CATEGORIES.find(c => parent.name === c.name);
      const catKey = catEntry?.key;
      if (!catKey) continue;

      const perms = CATEGORY_PERMS[catKey];
      if (!perms) continue;

      try {
        const everyone = guild.roles.everyone;
        if (perms.view && perms.send) {
          await (channel as any).permissionOverwrites.delete(everyone).catch(() => {});
        } else if (perms.view && !perms.send) {
          await (channel as any).permissionOverwrites.edit(everyone, {
            ViewChannel: true,
            SendMessages: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
            AddReactions: true,
          }, { reason: 'Permission sync - read-only' });
        } else {
          await (channel as any).permissionOverwrites.edit(everyone, {
            ViewChannel: false,
          }, { reason: 'Permission sync - staff only' });
        }
        updated++;
      } catch (e: any) {
        failed++;
        logger.error(`Perm fail #${channel.name}: ${e.message}`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
      .setDescription(
        Object.entries(CATEGORY_PERMS)
          .map(([k, v]) => `• **${k}**: ${v.note}`)
          .join('\n') +
        `\n\n**Updated:** ${updated} channels\n**Failed:** ${failed}`
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] as any });
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('permission')
      .setDescription('Set view & send permissions for all channels by category')
      .setDMPermission(false);
  }
}
