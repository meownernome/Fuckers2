import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ServerSetup } from '../ServerSetup';

export class AllCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      await new ServerSetup(interaction.client, interaction.guild!).setupAll();
      await interaction.editReply({ content: '✅ /all complete. Run `/setup` next.' });
    } catch (e: any) {
      await interaction.editReply({ content: `❌ Failed: ${e.message}` });
    }
  }
  get command() {
    return new SlashCommandBuilder().setName('all').setDescription('Create ALL channels + roles').setDMPermission(false);
  }
}
