"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupCommand = void 0;
const discord_js_1 = require("discord.js");
const ServerSetup_1 = require("../ServerSetup");
class CleanupCommand {
    async execute(interaction) {
        if (interaction.user.id !== interaction.guild?.ownerId) {
            await interaction.reply({ content: '❌ Only the server owner can use this command.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const serverSetup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
        const result = await serverSetup.cleanup();
        try {
            await interaction.editReply({
                content: `✅ Cleanup complete!\n\n🗑️ Deleted **${result.channels}** channels\n🗑️ Deleted **${result.roles}** roles\n\nAll channels and roles have been removed.`
            });
        }
        catch { /* interaction may be gone after deleting everything */ }
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('cleanup')
            .setDescription('Nuclear: delete ALL channels and ALL roles')
            .setDMPermission(false);
    }
}
exports.CleanupCommand = CleanupCommand;
