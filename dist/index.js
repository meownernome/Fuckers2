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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const discord_js_1 = require("discord.js");
const commands_1 = require("./commands");
const ServerSetup_1 = require("./ServerSetup");
const GtgCommand_1 = require("./commands/GtgCommand");
const roles_1 = require("./roles");
const textStyles_1 = require("./utils/textStyles");
const roleCreator_1 = require("./utils/roleCreator");
const pointsSystem_1 = require("./utils/pointsSystem");
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
    ],
});
const commands = (0, commands_1.getAllCommands)();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || '';
const TICKET_STATE = new Map();
const MODE_EMOJI = {
    'Sword': '⚔️', 'Crystal': '💎', 'SMP': '🛡️', 'Netherite Pot': '🌋', 'Diamond Pot': '💠',
    'UHC': '❤️', 'BuildUHC': '🏗️', 'NoDebuff': '🚫', 'Combo': '🥊', 'Gapple': '🍎',
    'OP Duel': '⚡', 'Boxing': '🥊', 'Axe': '🪓', 'Mace': '🔨', 'Anchor': '⚓',
    'Cart PvP': '🛒', 'Bedwars': '🛏️', 'Skywars': '☁️', 'Bridge': '🌉', 'Nodebuff': '🔥',
    'Vanilla': '🌿', 'Crossbow': '🏹', 'Trident': '🔱', 'Shield': '🛡️', 'Elytra Combat': '🦅',
    'Custom Duel': '🎯',
};
const TIERS = [
    { prefix: 'LT', level: 1, name: 'LT 1', color: 0x7F8C8D },
    { prefix: 'HT', level: 1, name: 'HT 1', color: 0x95A5A6 },
    { prefix: 'LT', level: 2, name: 'LT 2', color: 0x27AE60 },
    { prefix: 'HT', level: 2, name: 'HT 2', color: 0x2ECC71 },
    { prefix: 'LT', level: 3, name: 'LT 3', color: 0x2980B9 },
    { prefix: 'HT', level: 3, name: 'HT 3', color: 0x3498DB },
    { prefix: 'LT', level: 4, name: 'LT 4', color: 0x8E44AD },
    { prefix: 'HT', level: 4, name: 'HT 4', color: 0x9B59B6 },
];
async function logToChannel(guild, key, embed) {
    const name = ServerSetup_1.CHANNEL_KEYS[key];
    if (!name)
        return;
    const ch = guild.channels.cache.find((c) => c.name === name && c.type === discord_js_1.ChannelType.GuildText);
    if (ch)
        ch.send({ embeds: [embed] }).catch(() => { });
}
async function registerCommands() {
    for (const guild of client.guilds.cache.values()) {
        try {
            await guild.commands.set(commands.map(c => c.command.toJSON()));
            console.log(`📋 Registered ${commands.length} commands in ${guild.name}`);
        }
        catch (e) {
            console.error(`❌ Guild reg fail: ${e.message}`);
        }
    }
}
client.once(discord_js_1.Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    await registerCommands();
    console.log(`Total commands: ${commands.length}`);
    for (const guild of client.guilds.cache.values()) {
        await ensureAllRoles(guild);
    }
});
client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
    const guild = member.guild;
    const memberRoleName = (0, textStyles_1.formatStaffRoleName)('👤', 'Member');
    const memberRole = guild.roles.cache.find((r) => r.name === memberRoleName);
    if (memberRole)
        member.roles.add(memberRole).catch(() => { });
    const welcomeName = ServerSetup_1.CHANNEL_KEYS['welcome'];
    const welcomeCh = guild.channels.cache.find((c) => c.name === welcomeName && c.type === discord_js_1.ChannelType.GuildText);
    if (welcomeCh) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Welcome!')
            .setDescription(`**${member.user.username}** just joined HARVAL MC!\n\n` +
            '**Quick Start:**\n' +
            '📜 Read <#rules>\n' +
            '✅ Verify in <#verify>\n' +
            '⚔️ Request a tier test in <#request-tier-test>\n' +
            '🎫 Open a ticket in <#create-ticket>\n\n' +
            `Member #${guild.memberCount}`)
            .setColor(0xFFD700);
        welcomeCh.send({ embeds: [embed], content: `${member.user}` }).catch(() => { });
    }
    try {
        const dmEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('Welcome to HARVAL MC!')
            .setDescription(`**${member.user.username}**, welcome to the ultimate Minecraft PvP tier testing network.\n\n` +
            '**Getting Started:**\n' +
            '📜 Read the rules\n' +
            '✅ Verify your account\n' +
            '⚔️ Request a tier test\n' +
            '🎫 Need help? Open a ticket\n\n' +
            '**Server IP:** `play.harvalmc.fun`')
            .setColor(0xFFD700);
        await member.send({ embeds: [dmEmbed] });
    }
    catch { }
    const logEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('Join')
        .setDescription(`**${member.user.tag}** joined the server.`)
        .setColor(0x2ECC71)
        .setFooter({ text: `ID: ${member.id}` })
        .setTimestamp();
    await logToChannel(guild, 'join-leave', logEmbed);
});
async function ensureAllRoles(guild) {
    try {
        await guild.roles.fetch();
        const existing = new Set(guild.roles.cache.map((r) => r.name));
        const missing = roles_1.ALL_ROLES.filter(r => !existing.has(r.name));
        if (missing.length === 0) {
            console.log(`✅ All ${roles_1.ALL_ROLES.length} roles already exist in ${guild.name}`);
            return;
        }
        console.log(`🔧 Creating ${missing.length} missing roles in ${guild.name}...`);
        let created = 0;
        for (const role of missing) {
            try {
                await (0, roleCreator_1.createRole)(guild, role.name, role.color);
                created++;
                await new Promise(r => setTimeout(r, 1200));
            }
            catch (e) {
                console.error(`❌ Failed ${role.name}: ${e.message}`);
            }
        }
        console.log(`✅ Created ${created}/${missing.length} roles in ${guild.name}`);
    }
    catch (e) {
        console.error(`❌ Role creation failed in ${guild.name}: ${e.message}`);
    }
}
client.on(discord_js_1.Events.GuildCreate, async (guild) => {
    try {
        await guild.commands.set(commands.map(c => c.command.toJSON()));
        console.log(`📋 Registered commands in new guild: ${guild.name}`);
    }
    catch (e) {
        console.error(`❌ Guild reg fail: ${e.message}`);
    }
});
client.on(discord_js_1.Events.GuildUpdate, async () => {
    await registerCommands();
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isCommand()) {
            const cmd = commands.find((c) => c.command.name === interaction.commandName);
            if (cmd) {
                const logEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle('Command')
                    .setDescription(`**${interaction.user.tag}** used \`/${interaction.commandName}\``)
                    .setColor(0x3498DB).setTimestamp();
                logToChannel(interaction.guild, 'command-logs', logEmbed);
                await cmd.execute(interaction);
            }
            return;
        }
        if (interaction.isAutocomplete()) {
            if (interaction.commandName === 'gtg' && interaction.options.getFocused(true).name === 'mode') {
                const focused = interaction.options.getFocused(true).value.toLowerCase();
                const choices = roles_1.MODES.filter(m => m.toLowerCase().includes(focused)).slice(0, 25);
                await interaction.respond(choices.map(m => ({ name: m, value: m })));
            }
            return;
        }
        if (interaction.isButton())
            await handleButton(interaction);
        else if (interaction.isModalSubmit())
            await handleModal(interaction);
    }
    catch (e) {
        console.error(`Interaction error: ${e.message}`);
    }
});
async function handleButton(interaction) {
    const id = interaction.customId;
    if (id.startsWith('gtg_create_'))
        return GtgCommand_1.GtgCommand.handleButton(interaction);
    if (id.startsWith('gtg_skip_'))
        return GtgCommand_1.GtgCommand.handleSkip(interaction);
    if (id === 'cleanup_confirm') {
        await interaction.deferUpdate();
        const setup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
        const result = await setup.cleanup();
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Cleanup Complete')
            .setDescription(`Deleted ${result.channels} channels, ${result.roles} roles`)
            .setColor(0x2ECC71);
        await interaction.editReply({ embeds: [embed], components: [] });
        return;
    }
    if (id === 'cleanup_cancel') {
        await interaction.update({ content: '❌ Cleanup cancelled.', embeds: [], components: [] });
        return;
    }
    if (id === 'verify_button') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('verify_modal').setTitle('✅ Verify Your Account');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Notch')));
        await interaction.showModal(modal);
        return;
    }
    if (id === 'support_ticket') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('support_ticket_modal').setTitle('🎫 Support Ticket');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('subject').setLabel('Subject').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('description').setLabel('Describe your issue').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true)));
        await interaction.showModal(modal);
        return;
    }
    if (id === 'request_tier_test') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('tier_test_request').setTitle('⚔️ Request Tier Test');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('mode').setLabel('Game Mode').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('Sword, Crystal, UHC, Boxing...')), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Notch')));
        await interaction.showModal(modal);
        return;
    }
    if (id === 'staff_apply') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('staff_application').setTitle('📝 Staff Application');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('age').setLabel('Your Age').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('experience').setLabel('Previous Staff Experience').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('why').setLabel('Why be staff?').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true)));
        await interaction.showModal(modal);
        return;
    }
    if (id === 'tester_apply') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('tester_application').setTitle('⚔️ Tier Tester Application');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('pvp_experience').setLabel('PvP Experience').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('why').setLabel('Why pick you?').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true)));
        await interaction.showModal(modal);
        return;
    }
    if (id.startsWith('app_approve_')) {
        await interaction.deferUpdate();
        const targetId = id.replace('app_approve_', '');
        const member = await interaction.guild.members.fetch(targetId).catch(() => null);
        if (member) {
            const staffRole = interaction.guild.roles.cache.find((r) => roles_1.STAFF_EMOJI_PREFIX.test(r.name));
            if (staffRole)
                member.roles.add(staffRole).catch(() => { });
        }
        const embed = discord_js_1.EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(0x2ECC71)
            .setFooter({ text: `\u2714 Approved by ${interaction.user.tag}` });
        await interaction.editReply({ embeds: [embed], components: [] });
        await interaction.channel.send({ content: `✅ <@${targetId}> your application was **approved**!` });
        return;
    }
    if (id.startsWith('app_decline_')) {
        await interaction.deferUpdate();
        const targetId = id.replace('app_decline_', '');
        const embed = discord_js_1.EmbedBuilder.from(interaction.message.embeds[0])
            .setColor(0xE74C3C)
            .setFooter({ text: `\u2718 Declined by ${interaction.user.tag}` });
        await interaction.editReply({ embeds: [embed], components: [] });
        await interaction.channel.send({ content: `❌ <@${targetId}> your application was **declined**.` });
        return;
    }
    if (id.startsWith('ticket_claim_')) {
        const channelId = id.replace('ticket_claim_', '');
        const state = TICKET_STATE.get(channelId);
        if (!state) {
            await interaction.reply({ content: '❌ Ticket expired.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        if (state.claimedBy) {
            await interaction.reply({ content: `❌ Already claimed by ${state.claimedByName}.`, flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        if (state.playerId === interaction.user.id) {
            await interaction.reply({ content: '❌ Cannot claim own ticket.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        state.claimedBy = interaction.user.id;
        state.claimedByName = interaction.member.displayName || interaction.user.username;
        const emoji = MODE_EMOJI[state.mode] || '🎮';
        const playerEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('Ticket')
            .setDescription(`${emoji} ${state.mode} — ${state.playerDisplay}\n\n**Player:** ${state.playerDisplay}\n**Mode:** ${emoji} ${state.mode}\n**Tester:** ⚔️ ${state.claimedByName}\n**Status:** In Progress\n\n${state.claimedByName} has claimed your ticket.`)
            .setColor(0x2ECC71);
        await interaction.update({ embeds: [playerEmbed], components: [] });
        const staffEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('Staff Panel')
            .setDescription(`Claimed by **${state.claimedByName}**\n\n▶️ Start — Send IP\n🏆 Give Tier — Assign result\n✅ Finish — Close ticket`)
            .setColor(0x3498DB);
        const staffRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`ticket_claim_${channelId}`).setLabel('Claimed').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Success).setDisabled(true), new discord_js_1.ButtonBuilder().setCustomId(`ticket_start_${channelId}`).setLabel('Start').setEmoji('▶️').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId(`ticket_givetier_${channelId}`).setLabel('Give Tier').setEmoji('🏆').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId(`ticket_finish_${channelId}`).setLabel('Finish').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Danger));
        await interaction.followUp({ embeds: [staffEmbed], components: [staffRow] });
        await interaction.followUp({ content: `⚔️ ${state.claimedByName} claimed this ticket. <@${state.playerId}> please wait.` });
        return;
    }
    if (id.startsWith('ticket_start_')) {
        const channelId = id.replace('ticket_start_', '');
        const state = TICKET_STATE.get(channelId);
        if (!state) {
            await interaction.reply({ content: '❌ Ticket expired.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.reply({ content: `🌐 **Server IP:** \`play.harvalmc.fun\`\n⚔️ **Mode:** ${state.mode}\n\n<@${state.playerId}> please join.` });
        return;
    }
    if (id.startsWith('ticket_givetier_')) {
        const channelId = id.replace('ticket_givetier_', '');
        if (!TICKET_STATE.get(channelId)) {
            await interaction.reply({ content: '❌ Ticket expired.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const modal = new discord_js_1.ModalBuilder().setCustomId(`tier_result_${channelId}`).setTitle('Assign Tier');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder().setCustomId('tier').setLabel('Tier (LT 1-5 / HT 1-5)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. HT 3')));
        await interaction.showModal(modal);
        return;
    }
    if (id.startsWith('ticket_finish_')) {
        const channelId = id.replace('ticket_finish_', '');
        TICKET_STATE.delete(channelId);
        await interaction.reply({ content: '🔒 Closing ticket...' });
        setTimeout(async () => { try {
            await interaction.channel?.delete();
        }
        catch { } }, 3000);
        return;
    }
}
async function handleModal(interaction) {
    const id = interaction.customId;
    if (id === 'verify_modal') {
        const ign = interaction.fields.getTextInputValue('ign');
        const verifiedRoleName = (0, textStyles_1.formatStaffRoleName)('✅', 'Verified');
        const verifyRole = interaction.guild.roles.cache.find((r) => r.name === verifiedRoleName);
        if (verifyRole) {
            try {
                await interaction.member.roles.add(verifyRole);
            }
            catch { }
        }
        (0, pointsSystem_1.setPlayerIGN)(interaction.user.id, ign);
        await interaction.reply({ content: `✅ Verified as **${ign}**! Welcome.`, flags: discord_js_1.MessageFlags.Ephemeral });
        const logEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('Verify')
            .setDescription(`**${interaction.user.tag}** verified as **${ign}**.`)
            .setColor(0x2ECC71).setTimestamp();
        await logToChannel(interaction.guild, 'verification-logs', logEmbed);
        return;
    }
    if (id === 'support_ticket_modal') {
        const subject = interaction.fields.getTextInputValue('subject');
        const desc = interaction.fields.getTextInputValue('description');
        const supportCat = ServerSetup_1.CATEGORIES.find(c => c.key === 'support');
        const cat = interaction.guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildCategory && c.name === supportCat?.name);
        const ch = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32),
            type: discord_js_1.ChannelType.GuildText, parent: cat,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] },
            ],
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Support Ticket')
            .setDescription(`**User:** ${interaction.user}\n**Subject:** ${subject}\n**Description:** ${desc}`)
            .setColor(0xF1C40F);
        await ch.send({ embeds: [embed], content: `<@${interaction.user.id}>` });
        await interaction.reply({ content: `✅ Ticket created: <#${ch.id}>`, flags: discord_js_1.MessageFlags.Ephemeral });
        const logEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('Ticket')
            .setDescription(`**${interaction.user.tag}** opened a support ticket.\n**Subject:** ${subject}`)
            .setColor(0xF1C40F).setTimestamp();
        await logToChannel(interaction.guild, 'ticket-logs', logEmbed);
        return;
    }
    if (id === 'tier_test_request') {
        const mode = interaction.fields.getTextInputValue('mode').trim();
        const ign = interaction.fields.getTextInputValue('ign').trim();
        const match = roles_1.MODES.find(m => m.toLowerCase() === mode.toLowerCase());
        if (!match) {
            await interaction.reply({ content: `❌ Invalid mode. Options: ${roles_1.MODES.join(', ')}`, flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const ticket = await new ServerSetup_1.ServerSetup(interaction.client, interaction.guild).createTicket(match, {
            id: interaction.user.id, username: interaction.user.username, displayName: interaction.member.displayName || interaction.user.username,
        });
        if (!ticket) {
            await interaction.reply({ content: '❌ No tickets category found.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const emoji = MODE_EMOJI[match] || '🎮';
        TICKET_STATE.set(ticket.id, { channelId: ticket.id, mode: match, playerId: interaction.user.id, playerName: interaction.user.username, playerDisplay: ign });
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Ticket')
            .setDescription(`${emoji} ${match} — ${ign}\n\n**Player:** ${ign}\n**Mode:** ${emoji} ${match}\n**Status:** Awaiting Claim\n\nA tester will claim your ticket shortly.`)
            .setColor(0xF1C40F);
        const claimRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`ticket_claim_${ticket.id}`).setLabel('Claim Ticket').setEmoji('⚔️').setStyle(discord_js_1.ButtonStyle.Primary));
        await ticket.send({ embeds: [embed], components: [claimRow], content: `<@${interaction.user.id}>` });
        await interaction.reply({ content: `✅ ${match} ticket ready: <#${ticket.id}>`, flags: discord_js_1.MessageFlags.Ephemeral });
        const logEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('Tier Test')
            .setDescription(`**${interaction.user.tag}** requested a tier test.\n**Mode:** ${emoji} ${match}\n**IGN:** ${ign}`)
            .setColor(0xE67E22).setTimestamp();
        await logToChannel(interaction.guild, 'tier-logs', logEmbed);
        return;
    }
    if (id.startsWith('tier_result_')) {
        const channelId = id.replace('tier_result_', '');
        const state = TICKET_STATE.get(channelId);
        if (!state) {
            await interaction.reply({ content: '❌ Ticket expired.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const tierInput = interaction.fields.getTextInputValue('tier').trim().toUpperCase();
        const tierMatch = TIERS.find(t => t.name.toUpperCase() === tierInput);
        if (!tierMatch) {
            await interaction.reply({ content: '❌ Invalid tier. Use LT 1-5 or HT 1-5.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const roleName = (0, roles_1.getTierRoleName)(state.mode, tierMatch.name);
        const role = interaction.guild.roles.cache.find((r) => r.name === roleName);
        if (!role) {
            await interaction.reply({ content: `❌ Role ${roleName} not found. Run /makeroles first.`, flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        try {
            const member = await interaction.guild.members.fetch(state.playerId);
            await member.roles.add(role);
            await interaction.reply({ content: `✅ **${state.playerDisplay}** → **${roleName}**` });
            await interaction.channel.send({ content: `🏆 <@${state.playerId}> — Ranked **${roleName}**!` });
        }
        catch (e) {
            await interaction.reply({ content: `❌ Failed: ${e.message}`, flags: discord_js_1.MessageFlags.Ephemeral });
        }
        return;
    }
    if (id === 'staff_application') {
        const age = interaction.fields.getTextInputValue('age');
        const exp = interaction.fields.getTextInputValue('experience');
        const why = interaction.fields.getTextInputValue('why');
        await handleApplication(interaction, '📝 Staff Application', 'staff', { 'Age': age, 'Experience': exp, 'Why': why }, 0x9B59B6);
        return;
    }
    if (id === 'tester_application') {
        const ign = interaction.fields.getTextInputValue('ign');
        const pvp = interaction.fields.getTextInputValue('pvp_experience');
        const why = interaction.fields.getTextInputValue('why');
        await handleApplication(interaction, '⚔️ Tier Tester Application', 'tester', { 'IGN': ign, 'PvP Experience': pvp, 'Why': why }, 0xE67E22);
        return;
    }
}
async function handleApplication(interaction, title, type, fields, color) {
    const guild = interaction.guild;
    const staffCat = ServerSetup_1.CATEGORIES.find(c => c.key === 'staff');
    const cat = guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildCategory && c.name === staffCat?.name);
    const channelName = `app-${type}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
    const ch = await guild.channels.create({
        name: channelName,
        type: discord_js_1.ChannelType.GuildText,
        parent: cat,
        permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] },
        ],
    });
    const fieldLines = Object.entries(fields).map(([k, v]) => `**${k}:** ${v}`).join('\n');
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(title)
        .setDescription(`**Applicant:** ${interaction.user}\n\n${fieldLines}`)
        .setColor(color)
        .setFooter({ text: 'Pending review' })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`app_approve_${interaction.user.id}`).setLabel('Approve').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId(`app_decline_${interaction.user.id}`).setLabel('Decline').setEmoji('❌').setStyle(discord_js_1.ButtonStyle.Danger));
    await ch.send({ embeds: [embed], components: [row], content: `<@&${guild.roles.everyone.id}>` });
    await interaction.reply({ content: `✅ Application submitted! Check <#${ch.id}>`, flags: discord_js_1.MessageFlags.Ephemeral });
    const logEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('Application')
        .setDescription(`**${interaction.user.tag}** submitted a **${type}** application.\n${fieldLines}`)
        .setColor(color).setTimestamp();
    await logToChannel(guild, 'applications', logEmbed);
}
const PORT = parseInt(process.env.PORT || '8080', 10);
const app = (0, express_1.default)();
app.use(express_1.default.static(path.join(process.cwd(), 'website')));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', bot: client.user?.tag }));
app.get('/api/leaderboard', async (_req, res) => {
    try {
        const lb = (0, pointsSystem_1.getLeaderboard)();
        const enriched = await Promise.all(lb.slice(0, 100).map(async (p) => {
            let skinUrl = null;
            if (p.ign && p.ign !== p.userId) {
                skinUrl = `https://mc-heads.net/avatar/${p.ign}/64`;
            }
            return { ...p, skin: skinUrl };
        }));
        res.json(enriched);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.get('/api/players', async (_req, res) => {
    try {
        const guild = client.guilds.cache.first();
        if (!guild)
            return res.json([]);
        await guild.members.fetch();
        const data = (0, pointsSystem_1.getAllPlayerData)();
        const players = guild.members.cache.map(m => {
            const pd = data[m.id] || {};
            const tierRoles = {};
            const tierPattern = /「 ✦ (.+?) (LT|HT) [1-5] ✦ 」/;
            for (const role of m.roles.cache.values()) {
                const match = role.name.match(tierPattern);
                if (match) {
                    const mode = match[1];
                    const tier = `${match[2]} ${match[3] || ''}`.trim();
                    if (!tierRoles[mode] || compareTier(tier, tierRoles[mode]) > 0) {
                        tierRoles[mode] = tier;
                    }
                }
            }
            return {
                id: m.id,
                name: m.user.username,
                ign: pd.ign || m.user.username,
                roles: tierRoles,
                totalPoints: pd.points || 0,
                skin: pd.ign ? `https://mc-heads.net/avatar/${pd.ign}/64` : null,
            };
        });
        res.json(players);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
function compareTier(a, b) {
    const order = ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'];
    return order.indexOf(a) - order.indexOf(b);
}
app.listen(PORT, () => console.log(`🌐 Health check server on port ${PORT}`));
if (!DISCORD_TOKEN) {
    console.error('❌ No DISCORD_TOKEN env var set');
    process.exit(1);
}
client.login(DISCORD_TOKEN).catch(e => console.error('Login failed:', e.message));
