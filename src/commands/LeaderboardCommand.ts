import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getLeaderboard, POINT_MODES } from '../utils/pointsSystem';

export class LeaderboardCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const lb = getLeaderboard().slice(0, 20);

    const embed = new EmbedBuilder()
      .setTitle('「 ✦ ＬＥＡＤＥＲＢＯＡＲＤ ✦ 」')
      .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━\n\n> *Top players ranked by tier points*\n\n━━━━━━━━━━━━━━━━━━━━━━━━')
      .setColor(0xFFD700)
      .setFooter({ text: '✦ Points modes: ' + POINT_MODES.join(', ') })
      .setTimestamp()
      .setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png');

    if (lb.length === 0) {
      embed.addFields({ name: 'No Data', value: 'No players ranked yet. Start tier testing to earn points!' });
    } else {
      let desc = '';
      for (let i = 0; i < lb.length; i++) {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        desc += `**${medal}** ${lb[i].ign || lb[i].userId} — **${lb[i].points}** pts\n`;
      }
      embed.setDescription(embed.data.description + '\n\n' + desc + '\n━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    await interaction.reply({ embeds: [embed] as any, flags: MessageFlags.Ephemeral });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('View the tier points leaderboard')
      .setDMPermission(false);
  }
}
