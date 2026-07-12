import { SlashCommandBuilder } from 'discord.js';
import { ServerSetup } from '../ServerSetup';

export class CleanupCommand {
  public async execute(interaction: any): Promise<void> {
    if (interaction.user.id !== interaction.guild?.ownerId) {
      await interaction.reply({ content: '❌ Only the server owner can use this command.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const serverSetup = new ServerSetup(interaction.client, interaction.guild);
    const result = await serverSetup.cleanup();

    try {
      await interaction.editReply({
        content: `✅ Cleanup complete!\n\n🗑️ Deleted **${result.channels}** channels\n🗑️ Deleted **${result.roles}** roles\n\nAll channels and roles have been removed.`
      });
    } catch { /* interaction may be gone after deleting everything */ }
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('cleanup')
      .setDescription('Nuclear: delete ALL channels and ALL roles')
      .setDMPermission(false);
  }
}
