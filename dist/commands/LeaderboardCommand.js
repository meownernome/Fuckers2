"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardCommand = void 0;
const discord_js_1 = require("discord.js");
exports.LeaderboardCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View tier leaderboards')
        .addStringOption(option => option.setName('mode')
        .setDescription('Game mode to view (default: all)')
        .setRequired(false)),
    async execute(interaction) {
        const mode = interaction.options.getString('mode');
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`🏆 ${mode ? `${mode} ` : ''}Tier Leaderboard`)
            .setColor(0xFFD700)
            .setDescription(mode
            ? `Top players in **${mode}**`
            : 'Overall tier leaderboard across all 26 modes')
            .addFields({ name: '🥇 1st', value: 'No data yet', inline: true }, { name: '🥈 2nd', value: 'No data yet', inline: true }, { name: '🥉 3rd', value: 'No data yet', inline: true })
            .setFooter({ text: 'Harval MC • Leaderboards update after each tier test' });
        await interaction.reply({ embeds: [embed] });
    },
};
//# sourceMappingURL=LeaderboardCommand.js.map