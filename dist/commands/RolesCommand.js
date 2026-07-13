"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesCommand = void 0;
const discord_js_1 = require("discord.js");
const roles_js_1 = require("../roles.js");
exports.RolesCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('roles')
        .setDescription('List all configured roles (281 total)'),
    async execute(interaction) {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const guild = interaction.guild;
        if (!guild)
            return;
        const existingRoles = guild.roles.cache;
        const found = existingRoles.filter(r => roles_js_1.ALL_ROLES.some(ar => ar.name === r.name));
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🎭 Harval MC Role Registry')
            .setDescription(`Total configured: **281** | Found in server: **${found.size}**`)
            .setColor(0x9370DB)
            .addFields({ name: '👑 Staff Roles (21)', value: roles_js_1.STAFF_ROLE_NAMES.map(r => `\`${r}\``).join(' • ').substring(0, 1020), inline: false }, { name: '🛠️ Utility Roles (4)', value: roles_js_1.UTILITY_ROLE_NAMES.map(r => `\`${r}\``).join(' • '), inline: false }, { name: '⚔️ Game Mode Tiers (256+)', value: `${roles_js_1.GAME_MODE_ROLE_NAMES.length} configured (26 modes × 10 tiers)`, inline: false })
            .setFooter({ text: 'Use /makeroles to create missing roles' });
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=RolesCommand.js.map