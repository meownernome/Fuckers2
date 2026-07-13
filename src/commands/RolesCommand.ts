import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { ALL_ROLES, STAFF_ROLE_NAMES, UTILITY_ROLE_NAMES, GAME_MODE_ROLE_NAMES } from '../roles.js';

export const RolesCommand = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('List all configured roles (281 total)'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;
    if (!guild) return;

    const existingRoles = guild.roles.cache;
    const found = existingRoles.filter(r => ALL_ROLES.some(ar => ar.name === r.name));

    const embed = new EmbedBuilder()
      .setTitle('🎭 Harval MC Role Registry')
      .setDescription(`Total configured: **281** | Found in server: **${found.size}**`)
      .setColor(0x9370DB)
      .addFields(
        { name: '👑 Staff Roles (21)', value: STAFF_ROLE_NAMES.map(r => `\`${r}\``).join(' • ').substring(0, 1020), inline: false },
        { name: '🛠️ Utility Roles (4)', value: UTILITY_ROLE_NAMES.map(r => `\`${r}\``).join(' • '), inline: false },
        { name: '⚔️ Game Mode Tiers (256+)', value: `${GAME_MODE_ROLE_NAMES.length} configured (26 modes × 10 tiers)`, inline: false }
      )
      .setFooter({ text: 'Use /makeroles to create missing roles' });

    await interaction.editReply({ embeds: [embed] });
  },
};