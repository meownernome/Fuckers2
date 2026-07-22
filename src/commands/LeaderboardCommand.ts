import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getLeaderboard } from '../utils/pointsSystem';
import { SEP } from '../utils/textStyles';

export class LeaderboardCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const lb = getLeaderboard().slice(0, 20);

    const embed = new EmbedBuilder()
      .setDescription(`${SEP}\n\`〔 LEADERBOARD 〕\`\n${SEP}`)
      .setColor(0xFFD700);

    if (lb.length === 0) {
      embed.setDescription(`${SEP}\n\`〔 LEADERBOARD 〕\`\n${SEP}\n\nNo players ranked yet. Start tier testing to earn points!\n\n${SEP}`);
    } else {
      let desc = `${SEP}\n\`〔 LEADERBOARD 〕\`\n${SEP}\n\n`;
      for (let i = 0; i < lb.length; i++) {
        const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `\`#${i + 1}\``;
        desc += `${medal} ${lb[i].ign || lb[i].userId} — **${lb[i].points}** pts\n`;
      }
      desc += `\n${SEP}`;
      embed.setDescription(desc);
    }

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription('View the tier points leaderboard')
      .setDMPermission(false);
  }
}
