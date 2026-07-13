"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GtgCommand = void 0;
const discord_js_1 = require("discord.js");
const roles_1 = require("../roles");
const roleCreator_1 = require("../utils/roleCreator");
const gtgState = new Map();
function isStaff(member) {
    if (member.permissions?.has(discord_js_1.PermissionFlagsBits.Administrator))
        return true;
    if (member.permissions?.has(discord_js_1.PermissionFlagsBits.ManageRoles))
        return true;
    return member.roles?.cache?.some((r) => roles_1.STAFF_EMOJI_PREFIX.test(r.name)) ?? false;
}
function findNextIndex(guild, start) {
    const names = new Set(guild.roles.cache.map((r) => r.name));
    for (let i = start; i < roles_1.ALL_ROLES.length; i++) {
        if (!names.has(roles_1.ALL_ROLES[i].name))
            return i;
    }
    return roles_1.ALL_ROLES.length;
}
class GtgCommand {
    async execute(interaction) {
        if (!isStaff(interaction.member)) {
            await interaction.reply({ content: '❌ This command is for staff only.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const guild = interaction.guild;
        await guild.roles.fetch();
        const startIdx = findNextIndex(guild, 0);
        if (startIdx >= roles_1.ALL_ROLES.length) {
            await interaction.reply({ content: '✅ All roles already exist.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const stateKey = `gtg_${interaction.user.id}`;
        gtgState.set(stateKey, { guildId: guild.id, idx: startIdx });
        const remaining = roles_1.ALL_ROLES.length - startIdx;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('\u300C \u2726 ＧＴＧ \u2726 \u300D')
            .setDescription(`**Next role:** ${roles_1.ALL_ROLES[startIdx].name}\n**Remaining:** ${remaining}/${roles_1.ALL_ROLES.length}\n\nClick the button to create this role.`)
            .setColor(0x3498DB)
            .setFooter({ text: '\u2726 Role creation \u2726' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next Role').setStyle(discord_js_1.ButtonStyle.Success).setEmoji('⚔️'));
        await interaction.reply({ embeds: [embed], components: [row], flags: discord_js_1.MessageFlags.Ephemeral });
    }
    static async process(interaction, stateKey) {
        const state = gtgState.get(stateKey);
        if (!state) {
            await interaction.editReply({ content: '❌ Session expired. Run /gtg again.', components: [] });
            return;
        }
        const guild = interaction.guild;
        if (guild.id !== state.guildId) {
            await interaction.editReply({ content: '❌ Wrong server.', components: [] });
            return;
        }
        await guild.roles.fetch();
        const idx = findNextIndex(guild, state.idx);
        if (idx >= roles_1.ALL_ROLES.length) {
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('✅ All Done!')
                .setDescription(`All ${roles_1.ALL_ROLES.length} roles have been created.`)
                .setColor(0x2ECC71);
            await interaction.editReply({ embeds: [embed], components: [] });
            gtgState.delete(stateKey);
            return;
        }
        const role = roles_1.ALL_ROLES[idx];
        try {
            await (0, roleCreator_1.createRole)(guild, role.name, role.color);
        }
        catch (e) {
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('❌ Failed')
                .setDescription(`Failed to create **${role.name}**: ${e.message}\n\nTry again or skip.`)
                .setColor(0xE74C3C);
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Retry').setStyle(discord_js_1.ButtonStyle.Danger).setEmoji('🔄'), new discord_js_1.ButtonBuilder().setCustomId(`gtg_skip_${stateKey}`).setLabel('Skip').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('⏭️'));
            await interaction.editReply({ embeds: [embed], components: [row] });
            return;
        }
        state.idx = idx + 1;
        await guild.roles.fetch();
        const nextIdx = findNextIndex(guild, state.idx);
        if (nextIdx >= roles_1.ALL_ROLES.length) {
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('✅ All Done!')
                .setDescription(`Created **${role.name}**\n\nAll ${roles_1.ALL_ROLES.length} roles are now created!`)
                .setColor(0x2ECC71);
            await interaction.editReply({ embeds: [embed], components: [] });
            gtgState.delete(stateKey);
            return;
        }
        const next = roles_1.ALL_ROLES[nextIdx];
        const remaining = roles_1.ALL_ROLES.length - nextIdx;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('\u300C \u2726 ＧＴＧ \u2726 \u300D')
            .setDescription(`✅ Created **${role.name}**\n\n**Next role:** ${next.name}\n**Remaining:** ${remaining}/${roles_1.ALL_ROLES.length}`)
            .setColor(0x3498DB)
            .setFooter({ text: '\u2726 Role creation \u2726' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next Role').setStyle(discord_js_1.ButtonStyle.Success).setEmoji('⚔️'));
        await interaction.editReply({ embeds: [embed], components: [row] });
    }
    static async handleButton(interaction) {
        if (!interaction.customId.startsWith('gtg_create_'))
            return;
        await interaction.deferUpdate();
        if (!isStaff(interaction.member)) {
            await interaction.editReply({ content: '❌ Staff only.', components: [] });
            return;
        }
        const stateKey = interaction.customId.replace('gtg_create_', '');
        await GtgCommand.process(interaction, stateKey);
    }
    static async handleSkip(interaction) {
        if (!interaction.customId.startsWith('gtg_skip_'))
            return;
        await interaction.deferUpdate();
        if (!isStaff(interaction.member)) {
            await interaction.editReply({ content: '❌ Staff only.', components: [] });
            return;
        }
        const stateKey = interaction.customId.replace('gtg_skip_', '');
        const state = gtgState.get(stateKey);
        if (state)
            state.idx++;
        await GtgCommand.process(interaction, stateKey);
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('gtg')
            .setDescription('Create roles one by one (staff only)')
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
            .setDMPermission(false);
    }
}
exports.GtgCommand = GtgCommand;
