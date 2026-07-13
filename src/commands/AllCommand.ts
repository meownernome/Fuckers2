import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { ServerSetup } from '../ServerSetup.js';
import { ALL_ROLES } from '../roles.js';
import { Logger } from '../utils/Logger.js';

export const AllCommand = {
  data: new SlashCommandBuilder()
    .setName('all')
    .setDescription('Create all categories, channels, and roles for Harval MC'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);

    if (!member.permissions.has('Administrator')) {
      await interaction.editReply({ content: 'You need Administrator permission.' });
      return;
    }

    const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      await interaction.editReply({ content: 'Bot token not configured.' });
      return;
    }

    const setup = new ServerSetup(interaction.client as any, guild, token);

    try {
      // Step 1: Create all roles
      await interaction.editReply({ content: '🔧 Creating 281 roles... (this takes ~5 minutes)' });
      
      const createdRoles = await setup.createAllRoles();
      Logger.info(`Created/found ${createdRoles.size} roles`);

      // Step 2: Create categories and channels
      await interaction.editReply({ content: '📁 Creating categories and channels...' });
      
      await setup.createAllCategoriesAndChannels();

      // Step 3: Post all panels
      await interaction.editReply({ content: '📋 Posting interactive panels...' });
      
      await setup.postAllPanels();

      await interaction.editReply({ 
        content: '✅ **Complete!** Server structure created:\n' +
          `• ${createdRoles.size} roles\n` +
          `• ${ServerSetup.CATEGORIES.length} categories\n` +
          `• ${ServerSetup.CATEGORIES.reduce((sum, c) => sum + c.channels.length, 0)} channels\n` +
          `• All interactive panels posted`
      });
    } catch (error) {
      Logger.error('Error in /all command', error);
      await interaction.editReply({ content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  },
};