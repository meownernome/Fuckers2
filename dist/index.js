"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
const commands_1 = require("./commands");
const ServerSetup_1 = require("./ServerSetup");
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
const PREFIX = 'hc!';
const TICKET_STATE = new Map();
const MODES = ['Sword', 'Crystal', 'SMP', 'Netherite Pot', 'Diamond Pot', 'UHC', 'BuildUHC', 'NoDebuff', 'Combo', 'Gapple', 'OP Duel', 'Boxing', 'Axe', 'Mace', 'Anchor', 'Cart PvP', 'Bedwars', 'Skywars', 'Bridge', 'Nodebuff', 'Vanilla', 'Crossbow', 'Trident', 'Shield', 'Elytra Combat', 'Custom Duel'];
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
    { prefix: 'LT', level: 5, name: 'LT 5', color: 0xD4AC0D },
    { prefix: 'HT', level: 5, name: 'HT 5', color: 0xF1C40F },
];
client.once(discord_js_1.Events.ClientReady, async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    for (const guild of client.guilds.cache.values()) {
        try {
            await guild.commands.set(commands.map(c => c.command.toJSON()));
            console.log(`  📋 Registered ${commands.length} commands in ${guild.name}`);
        }
        catch (e) {
            console.error(`  ❌ Failed to register in ${guild.name}: ${e.message}`);
        }
    }
    console.log(`Total commands: ${commands.length}`);
});
client.on(discord_js_1.Events.GuildCreate, async (guild) => {
    try {
        await guild.commands.set(commands.map(c => c.command.toJSON()));
        console.log(`📋 Registered commands in new guild: ${guild.name}`);
    }
    catch (e) {
        console.error(`❌ Guild reg fail: ${e.message}`);
    }
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isCommand()) {
            const cmd = commands.find((c) => c.command.name === interaction.commandName);
            if (cmd)
                await cmd.execute(interaction);
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
    // ── Verify Button ──
    if (id === 'verify_button') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('verify_modal').setTitle('✅ Verify Your Account');
        const ignInput = new discord_js_1.TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Notch');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(ignInput));
        await interaction.showModal(modal);
        return;
    }
    // ── Support Ticket ──
    if (id === 'support_ticket') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('support_ticket_modal').setTitle('🎫 Support Ticket');
        const subject = new discord_js_1.TextInputBuilder().setCustomId('subject').setLabel('Subject').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true);
        const desc = new discord_js_1.TextInputBuilder().setCustomId('description').setLabel('Describe your issue').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(subject), new discord_js_1.ActionRowBuilder().addComponents(desc));
        await interaction.showModal(modal);
        return;
    }
    // ── Request Tier Test ──
    if (id === 'request_tier_test') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('tier_test_request').setTitle('⚔️ Request Tier Test');
        const modeInput = new discord_js_1.TextInputBuilder().setCustomId('mode').setLabel('Game Mode').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Sword, Crystal, UHC, Boxing...');
        const ignInput = new discord_js_1.TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Notch');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(modeInput), new discord_js_1.ActionRowBuilder().addComponents(ignInput));
        await interaction.showModal(modal);
        return;
    }
    // ── Staff Application ──
    if (id === 'staff_apply') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('staff_application').setTitle('📝 Staff Application');
        const age = new discord_js_1.TextInputBuilder().setCustomId('age').setLabel('Your Age').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true);
        const exp = new discord_js_1.TextInputBuilder().setCustomId('experience').setLabel('Previous Staff Experience').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Describe any moderation experience...');
        const why = new discord_js_1.TextInputBuilder().setCustomId('why').setLabel('Why do you want to be staff?').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(age), new discord_js_1.ActionRowBuilder().addComponents(exp), new discord_js_1.ActionRowBuilder().addComponents(why));
        await interaction.showModal(modal);
        return;
    }
    // ── Tester Application ──
    if (id === 'tester_apply') {
        const modal = new discord_js_1.ModalBuilder().setCustomId('tester_application').setTitle('⚔️ Tier Tester Application');
        const ign = new discord_js_1.TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true);
        const pvp = new discord_js_1.TextInputBuilder().setCustomId('pvp_experience').setLabel('PvP Experience').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true).setPlaceholder('Describe your PvP experience & best modes...');
        const why = new discord_js_1.TextInputBuilder().setCustomId('why').setLabel('Why should we pick you?').setStyle(discord_js_1.TextInputStyle.Paragraph).setRequired(true);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(ign), new discord_js_1.ActionRowBuilder().addComponents(pvp), new discord_js_1.ActionRowBuilder().addComponents(why));
        await interaction.showModal(modal);
        return;
    }
    // ── Ticket: Claim ──
    if (id.startsWith('ticket_claim_')) {
        const channelId = id.replace('ticket_claim_', '');
        const state = TICKET_STATE.get(channelId);
        if (!state) {
            await interaction.reply({ content: '❌ Ticket state expired.', ephemeral: true });
            return;
        }
        if (state.claimedBy) {
            await interaction.reply({ content: `❌ Already claimed by **${state.claimedByName}**.`, ephemeral: true });
            return;
        }
        if (state.playerId === interaction.user.id) {
            await interaction.reply({ content: '❌ You cannot claim your own ticket.', ephemeral: true });
            return;
        }
        state.claimedBy = interaction.user.id;
        state.claimedByName = interaction.member.displayName || interaction.user.username;
        const emoji = MODE_EMOJI[state.mode] || '🎮';
        const playerEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('╔══════════════════════════════╗')
            .setDescription(`## ${emoji} ━━ TIER TEST TICKET\n### *${state.mode} — ${state.playerDisplay}*\n╚══════════════════════════════╝\n\n**╔══════════ TICKET INFO ══════════╗**\n\`\`\`\n  ┃  Player   ━━  ${state.playerDisplay}\n  ┃  Mode     ━━  ${emoji} ${state.mode}\n  ┃  Tester   ━━  ⚔️ ${state.claimedByName}\n  ┃  Status   ━━  🟢 In Progress\n\`\`\`\n**╚═══════════════════════════════════╝**\n\n> **${state.claimedByName}** has claimed your ticket.\n> They will send instructions shortly. Please wait!`)
            .setColor(0x2ECC71).setFooter({ text: '╠════ TIER TEST TICKET ════╣' }).setTimestamp();
        await interaction.update({ embeds: [playerEmbed], components: [] });
        const staffEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('╔══════════════════════════════╗')
            .setDescription(`## ⚔️ ━━ STAFF CONTROL PANEL\n### *Claimed by ${state.claimedByName}*\n╚══════════════════════════════╝\n\n**╔══════════ ACTIONS ══════════╗**\n\`\`\`\n  ┃  ▶️  Start    ━━  Send IP & instructions\n  ┃  🏆  Give Tier ━━  Assign tier result\n  ┃  ✅  Finish   ━━  Close the ticket\n\`\`\`\n**╚═══════════════════════════════════╝**`)
            .setColor(0x3498DB).setFooter({ text: `╠════ STAFF PANEL ════╣ ┃ ${state.playerDisplay}` }).setTimestamp();
        const staffRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`ticket_claim_${channelId}`).setLabel('Claimed').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Success).setDisabled(true), new discord_js_1.ButtonBuilder().setCustomId(`ticket_start_${channelId}`).setLabel('Start').setEmoji('▶️').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId(`ticket_givetier_${channelId}`).setLabel('Give Tier').setEmoji('🏆').setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId(`ticket_finish_${channelId}`).setLabel('Finish').setEmoji('✅').setStyle(discord_js_1.ButtonStyle.Danger));
        await interaction.followUp({ embeds: [staffEmbed], components: [staffRow] });
        await interaction.followUp({ content: `⚔️ **${state.claimedByName}** has claimed this ticket. <@${state.playerId}> please wait while the tester prepares.` });
        return;
    }
    // ── Ticket: Start (send IP) ──
    if (id.startsWith('ticket_start_')) {
        const channelId = id.replace('ticket_start_', '');
        const state = TICKET_STATE.get(channelId);
        if (!state) {
            await interaction.reply({ content: '❌ Ticket expired.', ephemeral: true });
            return;
        }
        await interaction.reply({ content: `🌐 **Server IP:** \`play.harvalmc.fun\`\n⚔️ **Mode:** ${state.mode}\n\n<@${state.playerId}> please join and the tester will be with you shortly.` });
        return;
    }
    // ── Ticket: Give Tier ──
    if (id.startsWith('ticket_givetier_')) {
        const channelId = id.replace('ticket_givetier_', '');
        const state = TICKET_STATE.get(channelId);
        if (!state) {
            await interaction.reply({ content: '❌ Ticket expired.', ephemeral: true });
            return;
        }
        const modal = new discord_js_1.ModalBuilder().setCustomId(`tier_result_${channelId}`).setTitle(`🏆 Assign Tier - ${state.mode}`);
        const tierSelect = new discord_js_1.TextInputBuilder().setCustomId('tier').setLabel('Tier (LT 1-5 / HT 1-5)').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. HT 3');
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(tierSelect));
        await interaction.showModal(modal);
        return;
    }
    // ── Ticket: Finish ──
    if (id.startsWith('ticket_finish_')) {
        const channelId = id.replace('ticket_finish_', '');
        const state = TICKET_STATE.get(channelId);
        if (!state) {
            await interaction.reply({ content: '❌ Ticket expired.', ephemeral: true });
            return;
        }
        TICKET_STATE.delete(channelId);
        await interaction.reply({ content: `✅ Ticket closed. Archiving channel...` });
        const channel = interaction.channel;
        if (channel) {
            await channel.send({ content: `🔒 Ticket closed by ${interaction.user}. Channel will be deleted shortly.` });
            setTimeout(async () => { try {
                await channel.delete();
            }
            catch { } }, 5000);
        }
        return;
    }
}
async function handleModal(interaction) {
    const id = interaction.customId;
    // ── Verify Modal ──
    if (id === 'verify_modal') {
        const ign = interaction.fields.getTextInputValue('ign');
        const member = interaction.member;
        const verifyRole = interaction.guild.roles.cache.find((r) => r.name === '✅ ━━ Verified');
        if (verifyRole) {
            try {
                await member.roles.add(verifyRole);
            }
            catch { }
        }
        await interaction.reply({ content: `✅ You have been verified as **${ign}**! Welcome to HARVAL MC.`, ephemeral: true });
        return;
    }
    // ── Support Ticket Modal ──
    if (id === 'support_ticket_modal') {
        const subject = interaction.fields.getTextInputValue('subject');
        const description = interaction.fields.getTextInputValue('description');
        const cat = interaction.guild.channels.cache.find((c) => c.type === discord_js_1.ChannelType.GuildCategory && c.name.includes('SUPPORT'));
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            type: discord_js_1.ChannelType.GuildText,
            parent: cat,
            permissionOverwrites: [
                { id: interaction.guild.roles.everyone.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] },
            ],
        });
        await channel.send({ content: `🎫 **Support Ticket** — <@${interaction.user.id}>\n**Subject:** ${subject}\n**Description:** ${description}` });
        await interaction.reply({ content: `✅ Support ticket created: <#${channel.id}>`, ephemeral: true });
        return;
    }
    // ── Tier Test Request ──
    if (id === 'tier_test_request') {
        const mode = interaction.fields.getTextInputValue('mode').trim();
        const ign = interaction.fields.getTextInputValue('ign').trim();
        const match = MODES.find(m => m.toLowerCase() === mode.toLowerCase());
        if (!match) {
            await interaction.reply({ content: `❌ Invalid mode. Available: ${MODES.join(', ')}`, ephemeral: true });
            return;
        }
        const serverSetup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
        const ticket = await serverSetup.createTicket(match, { id: interaction.user.id, username: interaction.user.username, displayName: interaction.member.displayName || interaction.user.username });
        if (!ticket) {
            await interaction.reply({ content: '❌ Failed to create ticket (no tickets category).', ephemeral: true });
            return;
        }
        const emoji = MODE_EMOJI[match] || '🎮';
        TICKET_STATE.set(ticket.id, { channelId: ticket.id, mode: match, playerId: interaction.user.id, playerName: interaction.user.username, playerDisplay: ign });
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('╔══════════════════════════════╗')
            .setDescription(`## ${emoji} ━━ TIER TEST TICKET\n### *${match} — ${ign}*\n╚══════════════════════════════╝\n\n**╔══════════ INFO ══════════╗**\n\`\`\`\n  ┃  Player  ━━  ${ign}\n  ┃  Mode    ━━  ${emoji} ${match}\n  ┃  Status  ━━  🟡 Awaiting Claim\n\`\`\`\n**╚═══════════════════════════════════╝**\n\n> A tier tester will claim your ticket shortly.`)
            .setColor(0xF1C40F).setFooter({ text: '╠════ TIER TEST TICKET ════╣' }).setTimestamp();
        const claimRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`ticket_claim_${ticket.id}`).setLabel('Claim Ticket').setEmoji('⚔️').setStyle(discord_js_1.ButtonStyle.Primary));
        await ticket.send({ embeds: [embed], components: [claimRow], content: `<@${interaction.user.id}>` });
        await interaction.reply({ content: `✅ **Ticket Created!** ${emoji} Your ${match} tier test ticket is ready: <#${ticket.id}>\n\n> A tester will claim your ticket shortly. Please wait in the ticket channel.`, ephemeral: true });
        return;
    }
    // ── Tier Result ──
    if (id.startsWith('tier_result_')) {
        const channelId = id.replace('tier_result_', '');
        const state = TICKET_STATE.get(channelId);
        if (!state) {
            await interaction.reply({ content: '❌ Ticket expired.', ephemeral: true });
            return;
        }
        const tierInput = interaction.fields.getTextInputValue('tier').trim().toUpperCase();
        const tierMatch = TIERS.find(t => t.name.toUpperCase() === tierInput);
        if (!tierMatch) {
            await interaction.reply({ content: `❌ Invalid tier. Valid options: LT 1, HT 1, LT 2, HT 2, LT 3, HT 3, LT 4, HT 4, LT 5, HT 5`, ephemeral: true });
            return;
        }
        const roleName = `${state.mode} ${tierMatch.name}`;
        const role = interaction.guild.roles.cache.find((r) => r.name === roleName);
        if (!role) {
            await interaction.reply({ content: `❌ Role "${roleName}" not found. Run /all first.`, ephemeral: true });
            return;
        }
        try {
            const member = await interaction.guild.members.fetch(state.playerId);
            await member.roles.add(role);
            await interaction.reply({ content: `✅ **${state.playerDisplay}** has been assigned **${roleName}**!` });
            await interaction.channel.send({ content: `🏆 <@${state.playerId}> — You have been ranked **${roleName}**! Congratulations!` });
        }
        catch (e) {
            await interaction.reply({ content: `❌ Failed to assign role: ${e.message}`, ephemeral: true });
        }
        return;
    }
    // ── Staff Application ──
    if (id === 'staff_application') {
        const age = interaction.fields.getTextInputValue('age');
        const exp = interaction.fields.getTextInputValue('experience');
        const why = interaction.fields.getTextInputValue('why');
        const appChannel = interaction.guild.channels.cache.find((c) => c.name === 'applications');
        if (appChannel) {
            await appChannel.send({ embeds: [new discord_js_1.EmbedBuilder().setTitle('📝 Staff Application').addFields({ name: 'Applicant', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Age', value: age, inline: true }, { name: 'Experience', value: exp }, { name: 'Why', value: why }).setColor(0x9B59B6).setTimestamp()] });
        }
        await interaction.reply({ content: '✅ Staff application submitted! Staff will review it shortly.', ephemeral: true });
        return;
    }
    // ── Tester Application ──
    if (id === 'tester_application') {
        const ign = interaction.fields.getTextInputValue('ign');
        const pvp = interaction.fields.getTextInputValue('pvp_experience');
        const why = interaction.fields.getTextInputValue('why');
        const appChannel = interaction.guild.channels.cache.find((c) => c.name === 'applications');
        if (appChannel) {
            await appChannel.send({ embeds: [new discord_js_1.EmbedBuilder().setTitle('⚔️ Tier Tester Application').addFields({ name: 'Applicant', value: `<@${interaction.user.id}>`, inline: true }, { name: 'IGN', value: ign, inline: true }, { name: 'PvP Experience', value: pvp }, { name: 'Why', value: why }).setColor(0xE67E22).setTimestamp()] });
        }
        await interaction.reply({ content: '✅ Tier tester application submitted! Staff will review it shortly.', ephemeral: true });
        return;
    }
}
client.login(process.env.DISCORD_BOT_TOKEN).catch(e => console.error('Login failed:', e.message));
