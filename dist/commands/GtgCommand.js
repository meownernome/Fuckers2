"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GtgCommand = void 0;
const discord_js_1 = require("discord.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
function parseHexColor(color) {
    const hex = color.replace('#', '').replace('0x', '');
    const val = parseInt(hex, 16);
    if (isNaN(val))
        return 0x99AAB5;
    return val;
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
        const filePath = path.join(process.cwd(), 'all_roles_list.txt');
        if (!fs.existsSync(filePath)) {
            await interaction.reply({ content: `❌ File \`all_roles_list.txt\` not found. Upload it to the bot directory.`, flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
        if (lines.length === 0) {
            await interaction.reply({ content: '❌ No valid role data in file.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.reply({ content: `📄 Found **${lines.length}** roles in file. Starting creation...`, flags: discord_js_1.MessageFlags.Ephemeral });
        const guild = interaction.guild;
        await guild.roles.fetch();
        const existingNames = new Set(guild.roles.cache.map((r) => r.name));
        const toCreate = [];
        const errors = [];
        for (const line of lines) {
            const parts = line.split(',').map(s => s.trim());
            if (parts.length < 1 || !parts[0]) {
                errors.push(`Invalid: ${line}`);
                continue;
            }
            const name = parts[0];
            const color = parts[1] ? parseHexColor(parts[1]) : 0x99AAB5;
            if (existingNames.has(name)) {
                errors.push(`Exists: ${name}`);
                continue;
            }
            toCreate.push({ name, color });
        }
        if (toCreate.length === 0) {
            await interaction.editReply({ content: `❌ No roles to create.\n${errors.slice(0, 5).join('\n')}` });
            return;
        }
        let created = 0;
        const failed = [];
        for (let i = 0; i < toCreate.length; i++) {
            try {
                await (0, roleCreator_1.createRole)(guild, toCreate[i].name, toCreate[i].color);
                created++;
                if ((i + 1) % 5 === 0 || i === toCreate.length - 1) {
                    await interaction.editReply({ content: `⚙️ Creating... ${i + 1}/${toCreate.length} (${created} done)` });
                }
                await new Promise(r => setTimeout(r, 2000));
            }
            catch (e) {
                failed.push(toCreate[i].name);
            }
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('✅ Bulk Role Creation')
            .setDescription(`**Created:** ${created}/${toCreate.length}\n` +
            (failed.length > 0 ? `**Failed:** ${failed.length}\n${failed.slice(0, 5).map(n => `• ${n}`).join('\n')}` : '') +
            (errors.length > 0 ? `\n**Skipped:** ${errors.length} invalid lines` : ''))
            .setColor(failed.length > 0 ? 0xF1C40F : 0x2ECC71)
            .setTimestamp();
        await interaction.editReply({ content: null, embeds: [embed] });
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
            .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageRoles)
            .setDMPermission(false);
    }
}
exports.GtgCommand = GtgCommand;
