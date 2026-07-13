"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllCommand = void 0;
const discord_js_1 = require("discord.js");
const ServerSetup_1 = require("../ServerSetup");
class AllCommand {
    async execute(interaction) {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            await new ServerSetup_1.ServerSetup(interaction.client, interaction.guild).setupAll();
            await interaction.editReply({ content: '✅ /all complete. Run `/setup` next.' });
        }
        catch (e) {
            await interaction.editReply({ content: `❌ Failed: ${e.message}` });
        }
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder().setName('all').setDescription('Create ALL channels + roles').setDMPermission(false);
    }
}
exports.AllCommand = AllCommand;
