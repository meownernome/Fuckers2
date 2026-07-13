"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationCommand = void 0;
const discord_js_1 = require("discord.js");
class VerificationCommand {
    async execute(interaction) {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const minecraftUsername = await this.getMinecraftUsernameFromUser(interaction.user.id);
        if (!minecraftUsername) {
            await interaction.editReply({
                content: '❌ You are not verified. Please provide your Minecraft username using /verify <username>.'
            });
            return;
        }
        const verifiedRole = interaction.guild?.roles.cache.find(role => role.name === 'Verified');
        if (verifiedRole && interaction.member) {
            await interaction.member.roles.add(verifiedRole);
            await interaction.editReply({
                content: '✅ You have been verified!'
            });
        }
    }
    async getMinecraftUsernameFromUser(discordUserId) {
        return null;
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('verify')
            .setDescription('Verify your Minecraft username')
            .addStringOption(option => option.setName('minecraft-username')
            .setDescription('Your Minecraft username')
            .setRequired(true))
            .setDMPermission(false);
    }
}
exports.VerificationCommand = VerificationCommand;
