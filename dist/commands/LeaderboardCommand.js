"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardCommand = void 0;
const discord_js_1 = require("discord.js");
const pointsSystem_1 = require("../utils/pointsSystem");
const textStyles_1 = require("../utils/textStyles");
class LeaderboardCommand {
    async execute(interaction) {
        const lb = (0, pointsSystem_1.getLeaderboard)().slice(0, 20);
        const SEP = textStyles_1.BRAND.SEPARATOR;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xFFD700)
            .setDescription(`\`\`\`md\n${SEP}\n〔 ＬＥＡＤＥＲＢＯＡＲＤ 〕\n${SEP}\`\`\`\n\n▸ *Top players ranked by tier points*\n\n${'━'.repeat(24)}`)
            .setTimestamp();
        if (lb.length === 0) {
            embed.addFields({ name: 'No Data', value: 'No players ranked yet. Start tier testing to earn points!' });
        }
        else {
            let desc = '';
            for (let i = 0; i < lb.length; i++) {
                const medal = i === 0 ? '◆ #1' : i === 1 ? '◇ #2' : i === 2 ? '▸ #3' : `  #${i + 1}`;
                desc += `**${medal}** ${lb[i].ign || lb[i].userId} — **${lb[i].points}** pts\n`;
            }
            desc += `\n${SEP}`;
            embed.setDescription(embed.data.description + '\n' + desc);
        }
        embed.setFooter({ text: `Modes: ${pointsSystem_1.POINT_MODES.join(', ')}` });
        await interaction.reply({ embeds: [embed], flags: discord_js_1.MessageFlags.Ephemeral });
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription('View the tier points leaderboard')
            .setDMPermission(false);
    }
}
exports.LeaderboardCommand = LeaderboardCommand;
