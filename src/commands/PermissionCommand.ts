import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, PermissionFlagsBits, EmbedBuilder, Guild, Role } from 'discord.js';
import { logger } from '../utils/Logger';
import { CATEGORIES } from '../ServerSetup';
import { STAFF_PREFIX } from '../roles';

const CATEGORY_PERMS: Record<string, { everyone: boolean; staff?: boolean }> = {
  information: { everyone: true },
  community: { everyone: true },
  support: { everyone: true },
  'tier-testing': { everyone: true },
  tickets: { everyone: false, staff: true },
  leaderboards: { everyone: true },
  staff: { everyone: false, staff: true },
  logs: { everyone: false, staff: true },
  voice: { everyone: true },
};

function findStaffRoles(guild: Guild): { high: Role[]; low: Role[] } {
  const roles = guild.roles.cache;
  const high: Role[] = [];
  const low: Role[] = [];
  for (const r of roles.values()) {
    if (r.name === '@everyone' || r.managed) continue;
    if (r.name.match(STAFF_PREFIX)) { high.push(r); continue; }
    if (r.name.startsWith('\u25C6 ')) { low.push(r); continue; }
  }
  return { high, low };
}

export class PermissionCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    await guild.roles.fetch();
    const staffRoles = findStaffRoles(guild);

    let updated = 0;
    let failed = 0;

    for (const ch of guild.channels.cache.values()) {
      if (ch.type === ChannelType.GuildCategory || ch.isThread()) continue;
      const parent = ch.parent;
      if (!parent) continue;
      const catEntry = CATEGORIES.find(c => parent.name === c.name);
      if (!catEntry) continue;
      const perms = CATEGORY_PERMS[catEntry.key];
      if (!perms) continue;

      try {
        const everyone = guild.roles.everyone;
        const overwrites: { id: string; allow: bigint[]; deny: bigint[] }[] = [];

        if (perms.everyone) {
          overwrites.push({ id: everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [] });
        } else {
          overwrites.push({ id: everyone.id, allow: [], deny: [PermissionFlagsBits.ViewChannel] });
          if (perms.staff) {
            for (const r of staffRoles.high) {
              overwrites.push({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages], deny: [] });
            }
          }
        }

        for (const ov of overwrites) {
          await (ch as any).permissionOverwrites.edit(ov.id, {
            ViewChannel: ov.deny.includes(PermissionFlagsBits.ViewChannel) ? false : ov.allow.includes(PermissionFlagsBits.ViewChannel) ? true : null,
          } as any, { reason: 'Permission sync' });
        }
        updated++;
      } catch (e: any) {
        failed++;
        logger.error(`Perm fail #${ch.name}: ${e.message}`);
      }
    }

    const e = new EmbedBuilder()
      .setDescription(
        `**Updated:** ${updated} channels\n` +
        `**Failed:** ${failed} channels\n\n` +
        CATEGORIES.filter(c => CATEGORY_PERMS[c.key]).map(c =>
          `\u25C6 ${c.key}: ${CATEGORY_PERMS[c.key].everyone ? 'Public' : 'Staff+'}`
        ).join('\n')
      )
      .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ embeds: [e] });
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('permission')
      .setDescription('Set channel view permissions')
      .setDMPermission(false);
  }
}
