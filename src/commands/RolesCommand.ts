import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const STAFF_PATTERN = /\u25C6/;
const TIER_PATTERN = /\u25C6 (.+?) \u2022 (LT|HT [1-5])/;

export class RolesCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has('ManageRoles')) {
      await interaction.reply({ content: 'You need Manage Roles permission.', flags: MessageFlags.Ephemeral });
      return;
    }

    const roles = interaction.guild?.roles.cache
      .filter(r => r.name !== '@everyone' && !r.managed)
      .sort((a, b) => b.position - a.position);

    if (!roles || roles.size === 0) {
      await interaction.reply({
        content: 'No roles found. Use `/all` to create the role structure.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const staffRoles = roles.filter(r => STAFF_PATTERN.test(r.name) && !TIER_PATTERN.test(r.name));
    const tierRoles = roles.filter(r => TIER_PATTERN.test(r.name));
    const otherRoles = roles.filter(r => !STAFF_PATTERN.test(r.name));

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTimestamp();

    if (staffRoles.size > 0) {
      embed.addFields({
        name: 'Staff Roles',
        value: staffRoles.map(r => `> ${r.name} \u2501 ${r.members.size} members`).join('\n'),
        inline: false,
      });
    }
    if (tierRoles.size > 0) {
      embed.addFields({
        name: 'Tier Roles',
        value: tierRoles.map(r => `> ${r.name} \u2501 ${r.members.size} members`).join('\n'),
        inline: false,
      });
    }
    if (otherRoles.size > 0) {
      embed.addFields({
        name: 'Other Roles',
        value: otherRoles.map(r => `> ${r.name} \u2501 ${r.members.size} members`).join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: `\u25C6 Total: ${roles.size} roles \u25C6` });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('roles')
      .setDescription('View all server roles')
      .setDMPermission(false);
  }
}
