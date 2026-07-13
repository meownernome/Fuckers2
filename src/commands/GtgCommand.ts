import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { MANUAL_ROLES, getManualRoleByName, getManualRoleNames } from '../manualRoles';
import { createRole } from '../utils/roleCreator';

export class GtgCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();
    const roleName = interaction.options.getString('role')?.trim();

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: '❌ You need Manage Roles permission to use this command.' });
      return;
    }

    if (subcommand === 'list') {
      const names = getManualRoleNames().join('\n');
      await interaction.editReply({ content: `📋 Available roles:\n\n${names}` });
      return;
    }

    if (subcommand === 'bulk') {
      const created: string[] = [];
      const skipped: string[] = [];
      const failed: string[] = [];

      await interaction.guild?.roles.fetch();

      for (const manualRole of MANUAL_ROLES) {
        const existingRole = interaction.guild?.roles.cache.find(role => role.name.toLowerCase() === manualRole.name.toLowerCase());
        if (existingRole) {
          skipped.push(manualRole.name);
          continue;
        }

        try {
          await createRole(interaction.guild!, manualRole.name, manualRole.color);
          created.push(manualRole.name);
        } catch (e: any) {
          failed.push(`${manualRole.name}: ${e?.message || 'Unknown error'}`);
        }
      }

      await interaction.editReply({
        content: `✅ Created ${created.length} roles. Skipped ${skipped.length} existing roles. ${failed.length > 0 ? `⚠️ Failed: ${failed.length}` : ''}`,
      });
      return;
    }

    if (!roleName) {
      await interaction.editReply({ content: '❌ Provide a role name, for example: /gtg create Sword LT 1' });
      return;
    }

    const manualRole = getManualRoleByName(roleName);
    if (!manualRole) {
      await interaction.editReply({ content: `❌ Role not found in the manual list: ${roleName}` });
      return;
    }

    try {
      await createRole(interaction.guild!, manualRole.name, manualRole.color);
      await interaction.editReply({ content: `✅ Created role: ${manualRole.name}` });
    } catch (e: any) {
      await interaction.editReply({ content: `❌ Failed: ${e.message}` });
    }
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('gtg')
      .setDescription('Create roles from the manual role list')
      .addSubcommand(sub => sub.setName('create').setDescription('Create one role').addStringOption(option => option.setName('role').setDescription('Role name').setRequired(true)))
      .addSubcommand(sub => sub.setName('list').setDescription('List all available roles'))
      .addSubcommand(sub => sub.setName('bulk').setDescription('Create every role from the manual list'))
      .setDMPermission(false);
  }
}
