import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, ButtonInteraction } from 'discord.js';
import { RoleCreator, RoleData } from '../utils/roleCreator.js';
import { ALL_ROLES, STAFF_ROLE_NAMES, UTILITY_ROLE_NAMES, GAME_MODE_ROLE_NAMES } from '../roles.js';
import { Logger } from '../utils/Logger.js';

const ROLE_CATEGORIES = [
  { id: 'gtg_staff', label: '👑 Staff Roles (17)', roles: STAFF_ROLE_NAMES },
  { id: 'gtg_utility', label: '🛠️ Utility Roles (4)', roles: UTILITY_ROLE_NAMES },
  { id: 'gtg_gamemodes', label: '⚔️ Game Mode Tiers (260)', roles: GAME_MODE_ROLE_NAMES },
  { id: 'gtg_all', label: '🌟 All 281 Roles', roles: ALL_ROLES.map(r => r.name) },
];

export const GtgCommand = {
  data: new SlashCommandBuilder()
    .setName('gtg')
    .setDescription('One-click role creator with buttons for each category'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('ManageRoles')) {
      await interaction.reply({ content: 'You need Manage Roles permission.', flags: MessageFlags.Ephemeral });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🚀 GTG - Go To Go Role Creator')
      .setDescription('Click a button below to create roles for that category. Existing roles are skipped automatically.')
      .setColor(0x00FF00)
      .addFields(
        { name: '👑 Staff Roles (17)', value: 'Founder, Co-Founder, Lead Dev, Dev, Network Manager, Head Admin, Admin, Sr Mod, Mod, Trial Mod, Head Tester, Sr Tester, Tester, Trial Tester, Support, Builder, Media', inline: false },
        { name: '⚔️ Game Mode Tiers (260)', value: '26 modes × 10 tiers each (LT 1 → HT 5)', inline: false },
        { name: '🛠️ Utility Roles (4)', value: 'Verified, Member, Muted, Bot', inline: false }
      )
      .setFooter({ text: 'Harval MC • Each creation takes ~5 minutes with rate limits' });

    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    for (let i = 0; i < ROLE_CATEGORIES.length; i += 2) {
      const row = new ActionRowBuilder<ButtonBuilder>();
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(ROLE_CATEGORIES[i].id)
          .setLabel(ROLE_CATEGORIES[i].label)
          .setStyle(ButtonStyle.Primary)
      );
      if (i + 1 < ROLE_CATEGORIES.length) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(ROLE_CATEGORIES[i + 1].id)
            .setLabel(ROLE_CATEGORIES[i + 1].label)
            .setStyle(ButtonStyle.Success)
        );
      }
      rows.push(row);
    }

    await interaction.reply({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
  },

  async handleButton(interaction: ButtonInteraction) {
    if (!interaction.guild) return;

    const category = ROLE_CATEGORIES.find(c => c.id === interaction.customId);
    if (!category) return;

    const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      await interaction.reply({ content: 'Bot token not configured.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const roleCreator = new RoleCreator(token, interaction.guild.id);
    const roleData: RoleData[] = ALL_ROLES
      .filter(r => category.roles.includes(r.name))
      .map(r => ({ name: r.name, color: r.color }));

    try {
      await interaction.editReply({ content: `🔧 Creating ${roleData.length} roles for **${category.label}**...` });

      const created = await roleCreator.createRolesSequentially(roleData);

      await interaction.editReply({
        content: `✅ **${category.label} Complete!**\n• Roles processed: ${roleData.length}\n• New roles created: ${created.size}\n• Skipped (existed): ${roleData.length - created.size}`
      });
    } catch (error) {
      Logger.error(`Error in GTG ${category.id}`, error);
      await interaction.editReply({
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  },
};