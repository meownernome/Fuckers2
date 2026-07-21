"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardCommand = void 0;
const discord_js_1 = require("discord.js");
const pointsSystem_1 = require("../utils/pointsSystem");
class LeaderboardCommand {
    async execute(interaction) {
        const lb = (0, pointsSystem_1.getLeaderboard)().slice(0, 20);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('「 ✦ ＬＥＡＤＥＲＢＯＡＲＤ ✦ 」')
            .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━\n\n> *Top players ranked by tier points*\n\n━━━━━━━━━━━━━━━━━━━━━━━━')
            .setColor(0xFFD700)
            .setFooter({ text: '✦ Points modes: ' + pointsSystem_1.POINT_MODES.join(', ') })
            .setTimestamp()
            .setThumbnail('https://cdn.discordapp.com/embed/avatars/0.png');
        if (lb.length === 0) {
            embed.addFields({ name: 'No Data', value: 'No players ranked yet. Start tier testing to earn points!' });
        }
        else {
            let desc = '';
            for (let i = 0; i < lb.length; i++) {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                desc += `**${medal}** ${lb[i].ign || lb[i].userId} — **${lb[i].points}** pts\n`;
            }
            embed.setDescription(embed.data.description + '\n\n' + desc + '\n━━━━━━━━━━━━━━━━━━━━━━━━');
        }
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
