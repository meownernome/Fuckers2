import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

const STAFF_ROLE_PATTERNS = /^(👑|⚡|🌐|🛡️|🔰|⚔️|💎|🔨|🎬)/;
const LT_REGEX = /\u{1D40B}\u{1D413} [\u{1D7CE}-\u{1D7D7}]/u;
const HT_REGEX = /\u{1D407}\u{1D413} [\u{1D7CE}-\u{1D7D7}]/u;

export class RolesCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has('ManageRoles')) {
      await interaction.reply({ content: '❌ You need the Manage Roles permission.', flags: MessageFlags.Ephemeral });
      return;
    }

    const roles = interaction.guild?.roles.cache
      .filter(r => r.name !== '@everyone' && !r.managed)
      .sort((a, b) => b.position - a.position);

    if (!roles || roles.size === 0) {
      await interaction.reply({
        content: '❌ No roles found in this server.\n\n> Use **`/all`** to create the full role structure.\n> Or check if `/cleanup` deleted everything.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const staffRoles = roles.filter(r => STAFF_ROLE_PATTERNS.test(r.name));
    const ltRoles = roles.filter(r => LT_REGEX.test(r.name));
    const htRoles = roles.filter(r => HT_REGEX.test(r.name));
    const otherRoles = roles.filter(r => !STAFF_ROLE_PATTERNS.test(r.name) && !LT_REGEX.test(r.name) && !HT_REGEX.test(r.name));

    const embed = new EmbedBuilder()
      .setTitle('「 ✦ ＳＥＲＶＥＲ ＲＯＬＥＳ ✦ 」')
      .setDescription('### 🎨 All Server Roles')
      .setColor(0x3498DB)
      .setTimestamp();

    if (staffRoles.size > 0) {
      embed.addFields({
        name: '🛡️ Staff Roles',
        value: staffRoles.map(r => `> ${r.name} ━━ ${r.members.size} members`).join('\n'),
        inline: false,
      });
    }
    if (ltRoles.size > 0) {
      embed.addFields({
        name: '🟦 Low Tier (LT) Roles',
        value: ltRoles.map(r => `> ${r.name} ━━ ${r.members.size} members`).join('\n'),
        inline: false,
      });
    }
    if (htRoles.size > 0) {
      embed.addFields({
        name: '🟪 High Tier (HT) Roles',
        value: htRoles.map(r => `> ${r.name} ━━ ${r.members.size} members`).join('\n'),
        inline: false,
      });
    }
    if (otherRoles.size > 0) {
      embed.addFields({
        name: '📌 Other Roles',
        value: otherRoles.map(r => `> ${r.name} ━━ ${r.members.size} members`).join('\n'),
        inline: false,
      });
    }

    embed.setFooter({ text: `✦ Total: ${roles.size} roles ✦` });

    await interaction.reply({ embeds: [embed] as any, flags: MessageFlags.Ephemeral });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('roles')
      .setDescription('View all server roles (Admin only)')
      .setDMPermission(false);
  }
}
