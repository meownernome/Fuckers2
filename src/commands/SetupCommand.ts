import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { ServerSetup } from '../ServerSetup.js';
import { RoleCreator, RoleData } from '../utils/roleCreator.js';
import { ALL_ROLES } from '../roles.js';
import { Logger } from '../utils/Logger.js';

export const SetupCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Post all interactive panels in their respective channels'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('Administrator')) {
      await interaction.editReply({ content: 'You need Administrator permission.' });
      return;
    }

    const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      await interaction.editReply({ content: 'Bot token not configured.' });
      return;
    }

    const setup = new ServerSetup(interaction.client as any, interaction.guild, token);
    
    try {
      await interaction.editReply({ content: '📋 Posting all panels...' });
      await setup.postAllPanels();
      
      await interaction.editReply({ content: '✅ All interactive panels posted successfully!' });
    } catch (error) {
      Logger.error('Error in /setup command', error);
      await interaction.editReply({ content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  },
};