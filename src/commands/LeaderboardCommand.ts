import { MessageFlags,  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export class LeaderboardCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🏆 HARVAL MC Leaderboards')
      .setDescription('Top players and testers')
      .setColor(0xFFD700)
      .addFields(
        { name: 'Most Active Players', value: '📊 Coming soon...', inline: true },
        { name: 'Most Tests Completed', value: '🏅 Coming soon...', inline: true },
        { name: 'Highest Rated Testers', value: '⭐ Coming soon...', inline: true },
        { name: 'Highest Ranked Players', value: '🎯 Coming soon...', inline: true },
        { name: 'Most Requested PvP Modes', value: '🎮 Coming soon...', inline: true }
      )
      .setFooter({ text: 'Leaderboards are updated regularly' })
      .setTimestamp();

    await interaction.reply({ content: embed.toString(), ephemeral: true });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('View server leaderboards')
      .setDMPermission(false);
  }
}