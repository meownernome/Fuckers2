import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ServerSetup } from '../ServerSetup';

export class SetupCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const serverSetup = new ServerSetup(interaction.client, interaction.guild!);
    await serverSetup.setupContent();

    await interaction.editReply({ content: '✅ Content panels posted! Welcome, rules, FAQ, verify button, tier test buttons, and leaderboards are now live.' });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Post content panels (rules, verify, tier test buttons, etc.)')
      .setDMPermission(false);
  }
}
