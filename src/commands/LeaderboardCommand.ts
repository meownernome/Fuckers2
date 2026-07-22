import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export class LeaderboardCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
<<<<<<< HEAD
      .setTitle('Leaderboard')
      .setColor(0xFFD700);

    if (lb.length === 0) {
      embed.setDescription('No players ranked yet. Start tier testing to earn points!');
    } else {
      let desc = '';
      for (let i = 0; i < lb.length; i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        desc += `${medal} ${lb[i].ign || lb[i].userId} — ${lb[i].points} pts\n`;
      }
      embed.setDescription(desc);
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
=======
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

    await interaction.reply({ content: embed.toString(), flags: MessageFlags.Ephemeral });
>>>>>>> parent of dc72afb (sdf)
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('View server leaderboards')
      .setDMPermission(false);
  }
}