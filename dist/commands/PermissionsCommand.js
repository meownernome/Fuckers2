"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsCommand = void 0;
const discord_js_1 = require("discord.js");
exports.PermissionsCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('permissions')
        .setDescription('Check bot permissions in this server'),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
            return;
        }
        const me = interaction.guild.members.me;
        if (!me) {
            await interaction.reply({ content: 'Could not fetch bot member.', ephemeral: true });
            return;
        }
        const perms = me.permissions;
        const required = [
            'Administrator',
            'ManageRoles',
            'ManageChannels',
            'ManageMessages',
            'ViewChannel',
            'SendMessages',
            'EmbedLinks',
            'AttachFiles',
            'ReadMessageHistory',
            'MentionEveryone',
            'UseExternalEmojis',
            'AddReactions',
            'ManageThreads',
            'ModerateMembers',
            'BanMembers',
            'KickMembers',
        ];
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🔐 Bot Permissions Check')
            .setColor(perms.has(discord_js_1.PermissionsBitField.Flags.Administrator) ? 0x00FF00 : 0xFFFF00)
            .setDescription(perms.has(discord_js_1.PermissionsBitField.Flags.Administrator)
            ? '✅ **Administrator** - All permissions granted!'
            : '⚠️ Missing Administrator - checking individual permissions...');
        const fields = required.map(p => {
            const has = perms.has(discord_js_1.PermissionsBitField.Flags[p]);
            return { name: `${has ? '✅' : '❌'} ${p}`, value: has ? 'Granted' : 'Missing', inline: true };
        });
        embed.addFields(fields);
        embed.setFooter({ text: 'Harval MC Bot • Permissions Check' });
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
//# sourceMappingURL=PermissionsCommand.js.map