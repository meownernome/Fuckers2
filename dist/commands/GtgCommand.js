"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GtgCommand = void 0;
const discord_js_1 = require("discord.js");
const roles_1 = require("../roles");
const textStyles_1 = require("../utils/textStyles");
const pointsSystem_1 = require("../utils/pointsSystem");
const roleCreator_1 = require("../utils/roleCreator");
const textStyles_2 = require("../utils/textStyles");
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
function parseHexColor(color) {
    const hex = color.replace('#', '').replace('0x', '');
    const val = parseInt(hex, 16);
    if (isNaN(val))
        return 0x99AAB5;
    return val;
}
function progressBar(done, total) {
    const size = 20;
    const filled = Math.round((done / total) * size);
    return '█'.repeat(filled) + '░'.repeat(size - filled);
}
class GtgCommand {
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'add') {
            await this.handleAdd(interaction);
        }
        else if (sub === 'list') {
            await this.handleList(interaction);
        }
        else if (sub === 'mode') {
            await this.handleMode(interaction);
        }
        else if (sub === 'give') {
            await this.handleGive(interaction);
        }
        else {
            await this.handleGtg(interaction);
        }
    }
    async handleGtg(interaction) {
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
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next').setStyle(discord_js_1.ButtonStyle.Success).setEmoji('⚔️'));
        await interaction.reply({ embeds: [embed], components: [row], flags: discord_js_1.MessageFlags.Ephemeral });
    }
    async handleAdd(interaction) {
        if (!isStaff(interaction.member)) {
            await interaction.reply({ content: '❌ Staff only.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const name = interaction.options.getString('name', true);
        const colorStr = interaction.options.getString('color');
        const color = colorStr ? parseHexColor(colorStr) : 0x99AAB5;
        const guild = interaction.guild;
        await guild.roles.fetch();
        if (guild.roles.cache.some((r) => r.name === name)) {
            await interaction.reply({ content: `❌ Role **${name}** already exists.`, flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        try {
            await (0, roleCreator_1.createRole)(guild, name, color);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('✅ Role Created')
                .setDescription(`**Name:** ${name}\n**Color:** \`#${color.toString(16).padStart(6, '0')}\``)
                .setColor(color)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            await interaction.editReply({ content: `❌ Failed: ${e.message}` });
        }
    }
    async handleList(interaction) {
        if (!isStaff(interaction.member)) {
            await interaction.reply({ content: '❌ Staff only.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const guild = interaction.guild;
        try {
            await guild.roles.fetch();
        }
        catch { }
        const existingNames = new Set(guild.roles.cache.map((r) => r.name));
        const toCreate = roles_1.ALL_ROLES.filter(r => !existingNames.has(r.name));
        if (toCreate.length === 0) {
            await interaction.editReply({ content: '✅ All roles already exist.' });
            return;
        }
        const total = toCreate.length;
        let created = 0;
        let failed = 0;
        const start = Date.now();
        await interaction.editReply({ content: `\`\`\`\n[${progressBar(0, total)}] 0/${total}\n\`\`\`⚙️ Creating ${total} roles...` });
        for (let i = 0; i < total; i++) {
            const r = toCreate[i];
            try {
                await (0, roleCreator_1.createRole)(guild, r.name, r.color);
                created++;
            }
            catch {
                failed++;
            }
            if ((i + 1) % 10 === 0 || i === total - 1) {
                const elapsed = ((Date.now() - start) / 1000).toFixed(0);
                await interaction.editReply({
                    content: `\`\`\`\n[${progressBar(i + 1, total)}] ${i + 1}/${total}\n\`\`\`⚙️ ${created} created • ${failed} failed • ${elapsed}s`,
                }).catch(() => { });
            }
            await new Promise(r => setTimeout(r, 1100));
        }
        const elapsed = ((Date.now() - start) / 1000).toFixed(0);
        const SEP = textStyles_2.BRAND.SEPARATOR;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
            .setDescription(`\`\`\`md\n${SEP}\n〔 ＲＯＬＥ ＣＲＥＡＴＩＯＮ 〕\n${SEP}\`\`\`\n\n│ **Created:** ${created}/${total}\n│ **Failed:** ${failed}\n│ **Time:** ${elapsed}s\n\n${SEP}`)
            .setTimestamp();
        await interaction.editReply({ content: null, embeds: [embed] });
    }
    async handleMode(interaction) {
        if (!isStaff(interaction.member)) {
            await interaction.reply({ content: '❌ Staff only.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const mode = interaction.options.getString('mode', true);
        if (!roles_1.MODES.includes(mode)) {
            await interaction.reply({ content: `❌ Invalid mode. Available: ${roles_1.MODES.join(', ')}`, flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const guild = interaction.guild;
        await guild.roles.fetch();
        const existing = new Set(guild.roles.cache.map((r) => r.name));
        const toCreate = roles_1.TIERS.map(t => ({ name: (0, textStyles_1.formatTierRole)(mode, t.name), color: t.color }));
        const skipped = toCreate.filter(r => existing.has(r.name));
        const needed = toCreate.filter(r => !existing.has(r.name));
        if (needed.length === 0) {
            await interaction.editReply({ content: `✅ All **${mode}** roles already exist.` });
            return;
        }
        await interaction.editReply({ content: `\`\`\`\n[${progressBar(0, needed.length)}] 0/${needed.length}\n\`\`\`⚙️ Creating ${needed.length} ${mode} roles...` });
        const failed = [];
        for (let i = 0; i < needed.length; i++) {
            try {
                await (0, roleCreator_1.createRole)(guild, needed[i].name, needed[i].color);
            }
            catch {
                failed.push(needed[i].name);
            }
            if ((i + 1) % 5 === 0 || i === needed.length - 1) {
                await interaction.editReply({
                    content: `\`\`\`\n[${progressBar(i + 1, needed.length)}] ${i + 1}/${needed.length}\n\`\`\`⚙️ ${needed.length - failed.length} created • ${failed.length} failed`,
                }).catch(() => { });
            }
            await new Promise(r => setTimeout(r, 1100));
        }
        const created = needed.length - failed.length;
        const SEP = textStyles_2.BRAND.SEPARATOR;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(failed.length > 0 ? 0xF1C40F : 0x2ECC71)
            .setDescription(`\`\`\`md\n${SEP}\n〔 ${mode} ＲＯＬＥＳ 〕\n${SEP}\`\`\`\n\n│ **Created:** ${created}/${needed.length}\n│ **Skipped:** ${skipped.length}\n│ **Failed:** ${failed.length}${failed.length > 0 ? '\n│ ' + failed.slice(0, 5).map(n => `• ${n}`).join('\n│ ') : ''}\n\n${SEP}`)
            .setTimestamp();
        await interaction.editReply({ content: null, embeds: [embed] });
    }
    async handleGive(interaction) {
        if (!isStaff(interaction.member)) {
            await interaction.reply({ content: '❌ Staff only.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const user = interaction.options.getUser('user', true);
        const mode = interaction.options.getString('mode', true);
        const tier = interaction.options.getString('tier', true);
        const tierLabel = `${tier.toUpperCase().includes('LT') ? 'LT' : 'HT'} ${tier.replace(/[^0-9]/g, '')}`;
        if (!roles_1.MODES.includes(mode)) {
            await interaction.reply({ content: `❌ Invalid mode. Available: ${roles_1.MODES.join(', ')}`, flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const validTiers = roles_1.TIERS.map(t => t.name);
        if (!validTiers.includes(tierLabel)) {
            await interaction.reply({ content: `❌ Invalid tier. Use: ${validTiers.join(', ')}`, flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const guild = interaction.guild;
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            await interaction.editReply({ content: '❌ User not found in this server.' });
            return;
        }
        const roleName = (0, textStyles_1.formatTierRole)(mode, tierLabel);
        let role = guild.roles.cache.find((r) => r.name === roleName);
        if (!role) {
            try {
                const tierData = roles_1.TIERS.find(t => t.name === tierLabel);
                await (0, roleCreator_1.createRole)(guild, roleName, tierData.color);
                await guild.roles.fetch();
                role = guild.roles.cache.find((r) => r.name === roleName);
            }
            catch (e) {
                await interaction.editReply({ content: `❌ Failed to create role: ${e.message}` });
                return;
            }
        }
        if (!role) {
            await interaction.editReply({ content: `❌ Role creation failed for ${roleName}.` });
            return;
        }
        try {
            await member.roles.add(role);
            if (pointsSystem_1.POINT_MODES.includes(mode) && pointsSystem_1.TIER_POINTS[tierLabel]) {
                (0, pointsSystem_1.addTierPoints)(user.id, mode, tierLabel, user.displayName);
            }
            const SEP = textStyles_2.BRAND.SEPARATOR;
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x2ECC71)
                .setDescription(`\`\`\`md\n${SEP}\n〔 ＲＯＬＥ ＧＩＶＥＮ 〕\n${SEP}\`\`\`\n\n│ **User:** ${user}\n│ **Role:** ${roleName}\n\n${SEP}`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e) {
            await interaction.editReply({ content: `❌ Failed to give role: ${e.message}` });
        }
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
                .setDescription(`All ${roles_1.ALL_ROLES.length} roles created.`)
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
                .setDescription(`Failed: **${role.name}** — ${e.message}`)
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
                .setDescription(`Created **${role.name}**\n\nAll ${roles_1.ALL_ROLES.length} roles done!`)
                .setColor(0x2ECC71);
            await interaction.editReply({ embeds: [embed], components: [] });
            gtgState.delete(stateKey);
            return;
        }
        const next = roles_1.ALL_ROLES[nextIdx];
        const remaining = roles_1.ALL_ROLES.length - nextIdx;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('\u300C \u2726 ＧＴＧ \u2726 \u300D')
            .setDescription(`✅ Created **${role.name}**\n\n**Next:** ${next.name}\n**Remaining:** ${remaining}/${roles_1.ALL_ROLES.length}`)
            .setColor(0x3498DB)
            .setFooter({ text: '\u2726 Role creation \u2726' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next').setStyle(discord_js_1.ButtonStyle.Success).setEmoji('⚔️'));
        await interaction.editReply({ embeds: [embed], components: [row] });
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
        if (!state) {
            await interaction.editReply({ content: '❌ Session expired.', components: [] });
            return;
        }
        state.idx++;
        await this.handleButton(interaction);
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('gtg')
            .setDescription('Create roles (staff only)')
            .addSubcommand(sub => sub
            .setName('add')
            .setDescription('Manually add a single role by name and color')
            .addStringOption(opt => opt.setName('name').setDescription('Role name').setRequired(true))
            .addStringOption(opt => opt.setName('color').setDescription('Hex color (e.g. #FF0000)').setRequired(false)))
            .addSubcommand(sub => sub
            .setName('list')
            .setDescription('Read all_roles_list.txt and bulk create roles from it'))
            .addSubcommand(sub => sub
            .setName('mode')
            .setDescription('Create all 10 tiers for a specific PvP mode')
            .addStringOption(opt => opt.setName('mode').setDescription('PvP mode name').setRequired(true).setAutocomplete(true)))
            .addSubcommand(sub => sub
            .setName('give')
            .setDescription('Give a tier role to a user')
            .addUserOption(opt => opt.setName('user').setDescription('User to give the role to').setRequired(true))
            .addStringOption(opt => opt.setName('mode').setDescription('PvP mode').setRequired(true).setAutocomplete(true))
            .addStringOption(opt => opt.setName('tier').setDescription('Tier (e.g. HT 1, LT 5)').setRequired(true)))
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
            .setDMPermission(false);
    }
}
exports.GtgCommand = GtgCommand;
