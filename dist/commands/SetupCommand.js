"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupCommand = void 0;
const discord_js_1 = require("discord.js");
const ServerSetup_1 = require("../ServerSetup");
class SetupCommand {
    async execute(interaction) {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const serverSetup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
        await serverSetup.setupContent();
        await interaction.editReply({ content: '✅ Content panels posted! Welcome, rules, FAQ, verify button, tier test buttons, and leaderboards are now live.' });
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('setup')
            .setDescription('Post content panels (rules, verify, tier test buttons, etc.)')
            .setDMPermission(false);
    }
}
exports.SetupCommand = SetupCommand;
