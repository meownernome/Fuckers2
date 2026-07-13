"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupCommand = void 0;
const discord_js_1 = require("discord.js");
const ServerSetup_js_1 = require("../ServerSetup.js");
const Logger_js_1 = require("../utils/Logger.js");
exports.SetupCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setup')
        .setDescription('Post all interactive panels in their respective channels'),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command must be used in a server.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has('Administrator')) {
            await interaction.editReply({ content: 'You need Administrator permission.' });
            return;
        }
        const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            await interaction.editReply({ content: 'Bot token not configured.' });
            return;
        }
        const setup = new ServerSetup_js_1.ServerSetup(interaction.client, interaction.guild, token);
        try {
            await interaction.editReply({ content: '📋 Posting all panels...' });
            await setup.postAllPanels();
            await interaction.editReply({ content: '✅ All interactive panels posted successfully!' });
        }
        catch (error) {
            Logger_js_1.Logger.error('Error in /setup command', error);
            await interaction.editReply({ content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
    },
};
//# sourceMappingURL=SetupCommand.js.map