"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaderboardCommand = void 0;
const discord_js_1 = require("discord.js");
class LeaderboardCommand {
    async execute(interaction) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🏆 HARVAL MC Leaderboards')
            .setDescription('Top players and testers')
            .setColor(0xFFD700)
            .addFields({ name: 'Most Active Players', value: '📊 Coming soon...', inline: true }, { name: 'Most Tests Completed', value: '🏅 Coming soon...', inline: true }, { name: 'Highest Rated Testers', value: '⭐ Coming soon...', inline: true }, { name: 'Highest Ranked Players', value: '🎯 Coming soon...', inline: true }, { name: 'Most Requested PvP Modes', value: '🎮 Coming soon...', inline: true })
            .setFooter({ text: 'Leaderboards are updated regularly' })
            .setTimestamp();
        await interaction.reply({ content: embed.toString(), flags: discord_js_1.MessageFlags.Ephemeral });
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('leaderboard')
            .setDescription('View server leaderboards')
            .setDMPermission(false);
    }
}
exports.LeaderboardCommand = LeaderboardCommand;
