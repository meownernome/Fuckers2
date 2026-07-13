"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeRolesCommand = void 0;
const discord_js_1 = require("discord.js");
const roleCreator_js_1 = require("../utils/roleCreator.js");
const roles_js_1 = require("../roles.js");
const Logger_js_1 = require("../utils/Logger.js");
exports.MakeRolesCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('makeroles')
        .setDescription('Re-create missing roles only (skips existing)'),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has('ManageRoles')) {
            await interaction.editReply({ content: 'You need Manage Roles permission.' });
            return;
        }
        const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            await interaction.editReply({ content: 'Bot token not configured.' });
            return;
        }
        const roleCreator = new roleCreator_js_1.RoleCreator(token, interaction.guild.id);
        const roleData = roles_js_1.ALL_ROLES.map(role => ({
            name: role.name,
            color: role.color,
        }));
        try {
            await interaction.editReply({ content: '🔧 Creating missing roles... (skips existing)' });
            const created = await roleCreator.createRolesSequentially(roleData);
            await interaction.editReply({
                content: `✅ Role creation complete!\n• Total roles processed: ${roles_js_1.ALL_ROLES.length}\n• New roles created: ${created.size}\n• Skipped (already existed): ${roles_js_1.ALL_ROLES.length - created.size}`
            });
        }
        catch (error) {
            Logger_js_1.Logger.error('Error in /makeroles command', error);
            await interaction.editReply({ content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
        }
    },
};
//# sourceMappingURL=MakeRolesCommand.js.map