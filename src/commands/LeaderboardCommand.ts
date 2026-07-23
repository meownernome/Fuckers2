import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getLeaderboard, POINT_MODES } from '../utils/pointsSystem';
import { BRAND } from '../utils/textStyles';

export class LeaderboardCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const lb = getLeaderboard().slice(0, 20);
    const SEP = BRAND.SEPARATOR;

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＬＥＡＤＥＲＢＯＡＲＤ 〕\n${SEP}\`\`\`\n\n▸ *Top players ranked by tier points*\n\n${'━'.repeat(24)}`)
      .setTimestamp();

    if (lb.length === 0) {
      embed.addFields({ name: 'No Data', value: 'No players ranked yet. Start tier testing to earn points!' });
    } else {
      let desc = '';
      for (let i = 0; i < lb.length; i++) {
        const medal = i === 0 ? '◆ #1' : i === 1 ? '◇ #2' : i === 2 ? '▸ #3' : `  #${i + 1}`;
        desc += `**${medal}** ${lb[i].ign || lb[i].userId} — **${lb[i].points}** pts\n`;
      }
      desc += `\n${SEP}`;
      embed.setDescription(embed.data.description + '\n' + desc);
    }

    embed.setFooter({ text: `Modes: ${POINT_MODES.join(', ')}` });

    await interaction.reply({ embeds: [embed] as any, flags: MessageFlags.Ephemeral });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('View the tier points leaderboard')
      .setDMPermission(false);
  }
}
