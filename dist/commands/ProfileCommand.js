"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileCommand = void 0;
const discord_js_1 = require("discord.js");
class ProfileCommand {
    async execute(interaction) {
        const minecraftUsername = await this.getMinecraftUsernameFromUser(interaction.user.id);
        const currentTiers = await this.getCurrentTiers(interaction.user.id);
        const tierHistory = await this.getTierHistory(interaction.user.id);
        let profileContent = `**Profile for ${interaction.user.username}**\n\n`;
        if (minecraftUsername) {
            profileContent += `**Minecraft Username:** ${minecraftUsername}\n`;
            profileContent += `**Verified:** ✅\n\n`;
        }
        else {
            profileContent += `**Minecraft Username:** Not verified\n\n`;
        }
        profileContent += `**Current Tiers:**\n`;
        for (const mode in currentTiers) {
            profileContent += `  • ${mode}: ${currentTiers[mode] || 'None'}\n`;
        }
        profileContent += `\n**Tier History:**\n`;
        for (const test of tierHistory) {
            profileContent += `  • ${test.pvpMode} - ${test.tier} (${new Date(test.timestamp).toLocaleDateString()})\n`;
        }
        profileContent += `\n**Tests Completed:** ${tierHistory.length}\n`;
        profileContent += `**Member Since:** ${new Date(interaction.user.createdTimestamp).toLocaleDateString()}\n`;
        await interaction.reply({ content: profileContent, flags: discord_js_1.MessageFlags.Ephemeral });
    }
    async getMinecraftUsernameFromUser(discordUserId) {
        return null;
    }
    async getCurrentTiers(discordUserId) {
        return {};
    }
    async getTierHistory(discordUserId) {
        return [];
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('profile')
            .setDescription('View your profile and tier information')
            .setDMPermission(false);
    }
}
exports.ProfileCommand = ProfileCommand;
