"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GtgCommand = void 0;
const discord_js_1 = require("discord.js");
const roleCreator_js_1 = require("../utils/roleCreator.js");
const roles_js_1 = require("../roles.js");
const Logger_js_1 = require("../utils/Logger.js");
const ROLE_CATEGORIES = [
    { id: 'gtg_staff', label: '👑 Staff Roles (21)', roles: roles_js_1.STAFF_ROLE_NAMES },
    { id: 'gtg_utility', label: '🛠️ Utility Roles (4)', roles: roles_js_1.UTILITY_ROLE_NAMES },
    { id: 'gtg_gamemodes', label: '⚔️ Game Mode Tiers (260)', roles: roles_js_1.GAME_MODE_ROLE_NAMES },
    { id: 'gtg_all', label: '🌟 All 281 Roles', roles: roles_js_1.ALL_ROLES.map(r => r.name) },
];
exports.GtgCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('gtg')
        .setDescription('One-click role creator with buttons for each category'),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
            return;
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has('ManageRoles')) {
            await interaction.reply({ content: 'You need Manage Roles permission.', ephemeral: true });
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🚀 GTG - Go To Go Role Creator')
            .setDescription('Click a button below to create roles for that category. Existing roles are skipped automatically.')
            .setColor(0x00FF00)
            .addFields({ name: '👑 Staff Roles (21)', value: 'Founder, Co-Founder, Lead Dev, Dev, Network Manager, Head Admin, Admin, Sr Mod, Mod, Trial Mod, Head Tester, Sr Tester, Tester, Trial Tester, Support, Builder, Media, Verified, Member, Muted, Bot', inline: false }, { name: '⚔️ Game Mode Tiers (260)', value: '26 modes × 10 tiers each (LT 1 → HT 5)', inline: false }, { name: '🛠️ Utility Roles (4)', value: 'Verified, Member, Muted, Bot', inline: false })
            .setFooter({ text: 'Harval MC • Each creation takes ~5 minutes with rate limits' });
        const rows = [];
        for (let i = 0; i < ROLE_CATEGORIES.length; i += 2) {
            const row = new discord_js_1.ActionRowBuilder();
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(ROLE_CATEGORIES[i].id)
                .setLabel(ROLE_CATEGORIES[i].label)
                .setStyle(discord_js_1.ButtonStyle.Primary));
            if (i + 1 < ROLE_CATEGORIES.length) {
                row.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(ROLE_CATEGORIES[i + 1].id)
                    .setLabel(ROLE_CATEGORIES[i + 1].label)
                    .setStyle(discord_js_1.ButtonStyle.Success));
            }
            rows.push(row);
        }
        await interaction.reply({ embeds: [embed], components: rows, flags: discord_js_1.MessageFlags.Ephemeral });
    },
    async handleButton(interaction) {
        if (!interaction.guild)
            return;
        await interaction.deferUpdate();
        const category = ROLE_CATEGORIES.find(c => c.id === interaction.customId);
        if (!category)
            return;
        const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            await interaction.followUp({ content: 'Bot token not configured.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const roleCreator = new roleCreator_js_1.RoleCreator(token, interaction.guild.id);
        const roleData = roles_js_1.ALL_ROLES
            .filter(r => category.roles.includes(r.name))
            .map(r => ({ name: r.name, color: r.color }));
        try {
            await interaction.editReply({
                content: `🔧 Creating ${roleData.length} roles for **${category.label}**...`,
                embeds: [],
                components: []
            });
            const created = await roleCreator.createRolesSequentially(roleData);
            await interaction.followUp({
                content: `✅ **${category.label} Complete!**\n• Roles processed: ${roleData.length}\n• New roles created: ${created.size}\n• Skipped (existed): ${roleData.length - created.size}`,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
        catch (error) {
            Logger_js_1.Logger.error(`Error in GTG ${category.id}`, error);
            await interaction.followUp({
                content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
    },
};
//# sourceMappingURL=GtgCommand.js.map