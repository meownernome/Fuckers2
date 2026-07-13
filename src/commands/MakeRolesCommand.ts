import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { RoleCreator, RoleData } from '../utils/roleCreator.js';
import { ALL_ROLES } from '../roles.js';
import { Logger } from '../utils/Logger.js';

export const MakeRolesCommand = {
  data: new SlashCommandBuilder()
    .setName('makeroles')
    .setDescription('Re-create missing roles only (skips existing)'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('ManageRoles')) {
      await interaction.editReply({ content: 'You need Manage Roles permission.' });
      return;
    }

    const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      await interaction.editReply({ content: 'Bot token not configured.' });
      return;
    }

    const roleCreator = new RoleCreator(token, interaction.guild.id);
    const roleData: RoleData[] = ALL_ROLES.map(role => ({
      name: role.name,
      color: role.color,
    }));

    try {
      await interaction.editReply({ content: '🔧 Creating missing roles... (skips existing)' });
      
      const created = await roleCreator.createRolesSequentially(roleData);
      
      await interaction.editReply({ 
        content: `✅ Role creation complete!\n• Total roles processed: ${ALL_ROLES.length}\n• New roles created: ${created.size}\n• Skipped (already existed): ${ALL_ROLES.length - created.size}`
      });
    } catch (error) {
      Logger.error('Error in /makeroles command', error);
      await interaction.editReply({ content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  },
};