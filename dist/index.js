"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const roles_js_1 = require("./roles.js");
const Logger_js_1 = require("./utils/Logger.js");
const roleCreator_js_1 = require("./utils/roleCreator.js");
const ServerSetup_js_1 = require("./ServerSetup.js");
const AllCommand_js_1 = require("./commands/AllCommand.js");
const SetupCommand_js_1 = require("./commands/SetupCommand.js");
const CleanupCommand_js_1 = require("./commands/CleanupCommand.js");
const MakeRolesCommand_js_1 = require("./commands/MakeRolesCommand.js");
const GtgCommand_js_1 = require("./commands/GtgCommand.js");
const RolesCommand_js_1 = require("./commands/RolesCommand.js");
const VerifyCommands_js_1 = require("./commands/VerifyCommands.js");
const PermissionsCommand_js_1 = require("./commands/PermissionsCommand.js");
const IpCommand_js_1 = require("./commands/IpCommand.js");
const PingCommand_js_1 = require("./commands/PingCommand.js");
const ProfileCommand_js_1 = require("./commands/ProfileCommand.js");
const LeaderboardCommand_js_1 = require("./commands/LeaderboardCommand.js");
const RulesCommand_js_1 = require("./commands/RulesCommand.js");
const FaqCommand_js_1 = require("./commands/FaqCommand.js");
const TOKEN = (process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN);
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
if (!TOKEN) {
    Logger_js_1.Logger.error('No Discord token found. Set DISCORD_TOKEN or DISCORD_BOT_TOKEN in .env');
    process.exit(1);
}
if (!CLIENT_ID) {
    Logger_js_1.Logger.error('No Discord client ID found. Set DISCORD_CLIENT_ID in .env');
    process.exit(1);
}
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
    ],
});
const commands = [
    AllCommand_js_1.AllCommand.data.toJSON(),
    SetupCommand_js_1.SetupCommand.data.toJSON(),
    CleanupCommand_js_1.CleanupCommand.data.toJSON(),
    MakeRolesCommand_js_1.MakeRolesCommand.data.toJSON(),
    GtgCommand_js_1.GtgCommand.data.toJSON(),
    RolesCommand_js_1.RolesCommand.data.toJSON(),
    VerifyCommands_js_1.VerifyCommands.data.toJSON(),
    VerifyCommands_js_1.SetupVerifyCommand.data.toJSON(),
    PermissionsCommand_js_1.PermissionsCommand.data.toJSON(),
    IpCommand_js_1.IpCommand.data.toJSON(),
    PingCommand_js_1.PingCommand.data.toJSON(),
    ProfileCommand_js_1.ProfileCommand.data.toJSON(),
    LeaderboardCommand_js_1.LeaderboardCommand.data.toJSON(),
    RulesCommand_js_1.RulesCommand.data.toJSON(),
    FaqCommand_js_1.FaqCommand.data.toJSON(),
];
const commandMap = {
    all: AllCommand_js_1.AllCommand,
    setup: SetupCommand_js_1.SetupCommand,
    cleanup: CleanupCommand_js_1.CleanupCommand,
    makeroles: MakeRolesCommand_js_1.MakeRolesCommand,
    gtg: GtgCommand_js_1.GtgCommand,
    roles: RolesCommand_js_1.RolesCommand,
    'verify-panel': VerifyCommands_js_1.VerifyCommands,
    'setup-verify': VerifyCommands_js_1.SetupVerifyCommand,
    permissions: PermissionsCommand_js_1.PermissionsCommand,
    ip: IpCommand_js_1.IpCommand,
    ping: PingCommand_js_1.PingCommand,
    profile: ProfileCommand_js_1.ProfileCommand,
    leaderboard: LeaderboardCommand_js_1.LeaderboardCommand,
    rules: RulesCommand_js_1.RulesCommand,
    faq: FaqCommand_js_1.FaqCommand,
};
let roleCreationInProgress = false;
let roleCreationComplete = false;
async function registerCommands(guild) {
    const rest = new discord_js_1.REST({ version: '10' }).setToken(TOKEN);
    try {
        if (guild) {
            await rest.put(discord_js_1.Routes.applicationGuildCommands(CLIENT_ID, guild.id), { body: commands });
            Logger_js_1.Logger.info(`Registered ${commands.length} commands in guild ${guild.name}`);
        }
        else {
            await rest.put(discord_js_1.Routes.applicationCommands(CLIENT_ID), { body: commands });
            Logger_js_1.Logger.info(`Registered ${commands.length} global commands`);
        }
    }
    catch (error) {
        Logger_js_1.Logger.error('Failed to register commands', error);
    }
}
async function autoCreateAllRoles(guild) {
    if (roleCreationInProgress || roleCreationComplete) {
        Logger_js_1.Logger.info('Role creation already in progress or complete, skipping');
        return;
    }
    roleCreationInProgress = true;
    Logger_js_1.Logger.info('🚀 Starting auto-creation of 281 roles...');
    const roleCreator = new roleCreator_js_1.RoleCreator(TOKEN, guild.id);
    const roleData = roles_js_1.ALL_ROLES.map(role => ({
        name: role.name,
        color: role.color,
    }));
    const existingRoles = await roleCreator.fetchExistingRoles();
    const missingRoles = roleData.filter(r => !existingRoles.has(r.name));
    Logger_js_1.Logger.info(`Found ${existingRoles.size} existing roles, ${missingRoles.length} to create`);
    if (missingRoles.length === 0) {
        Logger_js_1.Logger.success('✅ All 281 roles already exist!');
        roleCreationComplete = true;
        roleCreationInProgress = false;
        return;
    }
    let created = 0;
    for (const role of missingRoles) {
        const roleId = await roleCreator.createRole(role);
        if (roleId)
            created++;
        await new Promise(r => setTimeout(r, 1200));
    }
    Logger_js_1.Logger.success(`✅ Auto-role creation complete: ${created}/${missingRoles.length} new roles created`);
    roleCreationComplete = true;
    roleCreationInProgress = false;
}
async function handleVerifyModal(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: '❌ This command can only be used in a server.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const ign = interaction.fields.getTextInputValue('minecraft_ign').trim();
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const verifiedRole = interaction.guild.roles.cache.find(r => r.name === '✅ Verified');
    if (verifiedRole && member.roles.cache.has(verifiedRole.id)) {
        await interaction.reply({ content: 'You are already verified!', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (verifiedRole) {
        await member.roles.add(verifiedRole, `Verified as ${ign}`);
    }
    const logChannel = interaction.guild.channels.cache.find(c => c.name === 'verification-logs');
    if (logChannel) {
        await logChannel.send({ embeds: [new discord_js_1.EmbedBuilder().setTitle('✅ Verified').setDescription(`<@${interaction.user.id}> verified as **${ign}**`).setColor(0x00FF00).setTimestamp()] });
    }
    await interaction.reply({ content: `✅ Verified as **${ign}**! You now have access to tier testing.`, flags: discord_js_1.MessageFlags.Ephemeral });
}
async function handleTierTestModal(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: '❌ This command can only be used in a server.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const mode = interaction.fields.getTextInputValue('game_mode').trim();
    const ign = interaction.fields.getTextInputValue('player_ign').trim();
    const validModes = [...new Set(roles_js_1.ALL_ROLES.filter(r => r.mode).map(r => r.mode))];
    if (!validModes.includes(mode)) {
        await interaction.reply({ content: `❌ Invalid game mode. Valid modes: ${validModes.join(', ')}`, flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const verifiedRole = interaction.guild.roles.cache.find(r => r.name === '✅ Verified');
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (verifiedRole && !member.roles.cache.has(verifiedRole.id)) {
        await interaction.reply({ content: '❌ You must be verified to request a tier test. Use the verify button in #verify.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const category = interaction.guild.channels.cache.find(c => c.name === 'TICKETS' && c.type === discord_js_1.ChannelType.GuildCategory);
    if (!category) {
        await interaction.reply({ content: '❌ Tickets category not found. Run /all first.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const testerRoles = ['⚔️ Head Tier Tester', '⚔️ Senior Tier Tester', '⚔️ Tier Tester', '⚔️ Trial Tier Tester'];
    const testerRoleIds = interaction.guild.roles.cache.filter(r => testerRoles.includes(r.name)).map(r => r.id) || [];
    const permissionOverwrites = [
        { id: interaction.guild.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] },
        ...testerRoleIds.map(id => ({ id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] })),
    ];
    const ticketChannel = await interaction.guild.channels.create({
        name: `tier-test-${mode.toLowerCase().replace(/\s+/g, '-')}-${interaction.user.username}`,
        type: discord_js_1.ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: permissionOverwrites,
        topic: `Tier Test: ${mode} | Player: ${ign} | Requester: ${interaction.user.tag}`,
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('⚔️ Tier Test Ticket')
        .setColor(0xFF4500)
        .addFields({ name: 'Game Mode', value: mode, inline: true }, { name: 'Player IGN', value: ign, inline: true }, { name: 'Requested By', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Status', value: '⏳ Waiting for tester to claim', inline: false })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder().setCustomId('claim_ticket').setLabel('📋 Claim').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('start_test').setLabel('▶️ Start Test').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('give_tier').setLabel('🏆 Give Tier').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('finish_ticket').setLabel('✅ Finish').setStyle(discord_js_1.ButtonStyle.Secondary));
    await ticketChannel?.send({ embeds: [embed], components: [row] });
    const queueChannel = interaction.guild?.channels.cache.find(c => c.name === 'queue');
    if (queueChannel) {
        await queueChannel.send({ embeds: [new discord_js_1.EmbedBuilder().setTitle('📋 Queue Update').setDescription(`**${ign}** requested **${mode}** test`).setColor(0x00FFFF).setTimestamp()] });
    }
    await interaction.reply({ content: `✅ Tier test ticket created: ${ticketChannel}`, flags: discord_js_1.MessageFlags.Ephemeral });
}
async function handleTicketModal(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: '❌ This command can only be used in a server.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const subject = interaction.fields.getTextInputValue('ticket_subject').trim();
    const description = interaction.fields.getTextInputValue('ticket_description').trim();
    const category = interaction.guild.channels.cache.find(c => c.name === 'SUPPORT' && c.type === discord_js_1.ChannelType.GuildCategory);
    if (!category) {
        await interaction.reply({ content: '❌ Support category not found. Run /all first.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const staffRoles = ['🛡️ Head Administrator', '🛡️ Administrator', '🔰 Senior Moderator', '🔰 Moderator', '🔰 Trial Moderator', '💎 Support Team'];
    const staffRoleIds = interaction.guild.roles.cache.filter(r => staffRoles.includes(r.name)).map(r => r.id) || [];
    const permissionOverwrites = [
        { id: interaction.guild.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] },
        ...staffRoleIds.map(id => ({ id, allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory] })),
    ];
    const ticketChannel = await interaction.guild?.channels.create({
        name: `ticket-${subject.toLowerCase().replace(/\s+/g, '-').substring(0, 50)}-${interaction.user.username}`,
        type: discord_js_1.ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: permissionOverwrites,
        topic: `Support Ticket: ${subject} | User: ${interaction.user.tag}`,
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`🎫 ${subject}`)
        .setColor(0x00FF7F)
        .addFields({ name: 'Description', value: description, inline: false }, { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Status', value: '📋 Open', inline: true })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder().setCustomId('claim_ticket').setLabel('📋 Claim').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Close').setStyle(discord_js_1.ButtonStyle.Danger));
    await ticketChannel?.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `✅ Support ticket created: ${ticketChannel}`, flags: discord_js_1.MessageFlags.Ephemeral });
}
async function handleStaffApplyModal(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: '❌ This command can only be used in a server.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const age = interaction.fields.getTextInputValue('staff_age').trim();
    const experience = interaction.fields.getTextInputValue('staff_experience').trim();
    const why = interaction.fields.getTextInputValue('staff_why').trim();
    const appsChannel = interaction.guild.channels.cache.find(c => c.name === 'applications');
    if (!appsChannel) {
        await interaction.reply({ content: '❌ Applications channel not found. Run /all first.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('📝 Staff Application')
        .setColor(0x9370DB)
        .addFields({ name: 'Applicant', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false }, { name: 'Age', value: age, inline: true }, { name: 'Experience', value: experience, inline: false }, { name: 'Why Harval MC?', value: why, inline: false })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder().setCustomId('accept_staff_app').setLabel('✅ Accept').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('deny_staff_app').setLabel('❌ Deny').setStyle(discord_js_1.ButtonStyle.Danger));
    await appsChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Staff application submitted!', flags: discord_js_1.MessageFlags.Ephemeral });
}
async function handleTesterApplyModal(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: '❌ This command can only be used in a server.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const ign = interaction.fields.getTextInputValue('tester_ign').trim();
    const pvpExp = interaction.fields.getTextInputValue('tester_pvp_exp').trim();
    const why = interaction.fields.getTextInputValue('tester_why').trim();
    const appsChannel = interaction.guild.channels.cache.find(c => c.name === 'applications');
    if (!appsChannel) {
        await interaction.reply({ content: '❌ Applications channel not found. Run /all first.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('⚔️ Tester Application')
        .setColor(0xFF4500)
        .addFields({ name: 'Applicant', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false }, { name: 'Minecraft IGN', value: ign, inline: true }, { name: 'PvP Experience', value: pvpExp, inline: false }, { name: 'Why You?', value: why, inline: false })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder().setCustomId('accept_tester_app').setLabel('✅ Accept').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('deny_tester_app').setLabel('❌ Deny').setStyle(discord_js_1.ButtonStyle.Danger));
    await appsChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Tester application submitted!', flags: discord_js_1.MessageFlags.Ephemeral });
}
async function handleGiveTierModal(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: '❌ This command can only be used in a server.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const tierInput = interaction.fields.getTextInputValue('tier_input').trim().toUpperCase();
    if (!tierInput.match(/^(LT|HT)\s+[1-5]$/)) {
        await interaction.reply({ content: '❌ Invalid tier format. Use format: LT 1, HT 3, etc.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const channel = interaction.channel;
    const topic = channel.topic || '';
    const modeMatch = topic.match(/Tier Test: (.*?) \|/);
    const ignMatch = topic.match(/Player: (.*?) \|/);
    if (!modeMatch || !ignMatch) {
        await interaction.reply({ content: '❌ Could not parse ticket info.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const mode = modeMatch[1];
    const ign = ignMatch[1];
    const roleName = `${mode} ${tierInput}`;
    const role = interaction.guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
        await interaction.reply({ content: `❌ Role "${roleName}" not found.`, flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const member = (await interaction.guild.members.fetch({ query: ign, limit: 1 }).catch(() => null))?.first();
    if (!member) {
        await interaction.reply({ content: `❌ Could not find member with IGN: ${ign}`, flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    await member.roles.add(role, `Tier test result: ${tierInput} by ${interaction.user.tag}`);
    const tierLogsChannel = interaction.guild.channels.cache.find(c => c.name === 'tier-logs');
    if (tierLogsChannel) {
        await tierLogsChannel.send({ embeds: [new discord_js_1.EmbedBuilder().setTitle('🏆 Tier Achieved!').setDescription(`<@${member.id}> ranked **${mode} ${tierInput}**!`).setColor(0xFFD700).setTimestamp()] });
    }
    const resultEmbed = new discord_js_1.EmbedBuilder()
        .setTitle('🏆 Tier Result')
        .setDescription(`${member} has been ranked **${mode} ${tierInput}**!`)
        .setColor(0xFFD700)
        .setTimestamp();
    await channel.send({ embeds: [resultEmbed] });
    await interaction.reply({ content: `✅ Assigned **${roleName}** to ${member}`, flags: discord_js_1.MessageFlags.Ephemeral });
}
async function handleButtonInteraction(interaction) {
    const { customId } = interaction;
    // Verification
    if (customId === 'verify_modal') {
        const modal = ServerSetup_js_1.ServerSetup.createVerifyModal();
        await interaction.showModal(modal);
        return;
    }
    // Tier test request
    if (customId === 'request_tier_test') {
        const modal = ServerSetup_js_1.ServerSetup.createTierTestModal();
        await interaction.showModal(modal);
        return;
    }
    // Support ticket
    if (customId === 'create_ticket') {
        const modal = ServerSetup_js_1.ServerSetup.createTicketModal();
        await interaction.showModal(modal);
        return;
    }
    // Staff application
    if (customId === 'staff_apply') {
        const modal = ServerSetup_js_1.ServerSetup.createStaffApplyModal();
        await interaction.showModal(modal);
        return;
    }
    // Tester application
    if (customId === 'tester_apply') {
        const modal = ServerSetup_js_1.ServerSetup.createTesterApplyModal();
        await interaction.showModal(modal);
        return;
    }
    // Ticket buttons
    if (customId === 'claim_ticket') {
        const channel = interaction.channel;
        await channel.permissionOverwrites.edit(interaction.user, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
        });
        await interaction.reply({ content: `✅ ${interaction.user} claimed this ticket!`, ephemeral: true });
        return;
    }
    if (customId === 'start_test') {
        const channel = interaction.channel;
        const topic = channel.topic || '';
        const ignMatch = topic.match(/Player: (.*?) \|/);
        if (ignMatch) {
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('▶️ Test Started')
                .setDescription(`Tester ${interaction.user} has started the test. Server IP: **play.harvalmc.net**`)
                .setColor(0x00FF00)
                .setTimestamp();
            await channel.send({ embeds: [embed] });
        }
        await interaction.reply({ content: 'Test started! IP sent to player.', ephemeral: true });
        return;
    }
    if (customId === 'give_tier') {
        const modal = ServerSetup_js_1.ServerSetup.createGiveTierModal();
        await interaction.showModal(modal);
        return;
    }
    if (customId === 'finish_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: '✅ Closing ticket in 3 seconds...' });
        setTimeout(() => channel.delete('Ticket finished by tester'), 3000);
        return;
    }
    if (customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: '🔒 Closing ticket in 3 seconds...' });
        setTimeout(() => channel.delete('Ticket closed'), 3000);
        return;
    }
    // Application buttons
    if (customId === 'accept_staff_app' || customId === 'deny_staff_app') {
        const isAccept = customId === 'accept_staff_app';
        const embed = interaction.message.embeds[0];
        const newEmbed = discord_js_1.EmbedBuilder.from(embed).setColor(isAccept ? 0x00FF00 : 0xFF0000).addFields({ name: 'Status', value: isAccept ? '✅ Accepted' : '❌ Denied', inline: true });
        await interaction.message.edit({ embeds: [newEmbed], components: [] });
        await interaction.reply({ content: `${isAccept ? '✅' : '❌'} Application ${isAccept ? 'accepted' : 'denied'}.`, ephemeral: true });
        return;
    }
    if (customId === 'accept_tester_app' || customId === 'deny_tester_app') {
        const isAccept = customId === 'accept_tester_app';
        const embed = interaction.message.embeds[0];
        const newEmbed = discord_js_1.EmbedBuilder.from(embed).setColor(isAccept ? 0x00FF00 : 0xFF0000).addFields({ name: 'Status', value: isAccept ? '✅ Accepted' : '❌ Denied', inline: true });
        await interaction.message.edit({ embeds: [newEmbed], components: [] });
        await interaction.reply({ content: `${isAccept ? '✅' : '❌'} Application ${isAccept ? 'accepted' : 'denied'}.`, ephemeral: true });
        return;
    }
    // GTG buttons
    if (customId.startsWith('gtg_')) {
        await GtgCommand_js_1.GtgCommand.handleButton(interaction);
        return;
    }
}
async function handleModalSubmit(interaction) {
    const { customId } = interaction;
    if (customId === 'verify_modal_submit') {
        await handleVerifyModal(interaction);
    }
    else if (customId === 'tier_test_modal_submit') {
        await handleTierTestModal(interaction);
    }
    else if (customId === 'ticket_modal_submit') {
        await handleTicketModal(interaction);
    }
    else if (customId === 'staff_apply_modal_submit') {
        await handleStaffApplyModal(interaction);
    }
    else if (customId === 'tester_apply_modal_submit') {
        await handleTesterApplyModal(interaction);
    }
    else if (customId === 'give_tier_modal_submit') {
        await handleGiveTierModal(interaction);
    }
}
client.once(discord_js_1.Events.ClientReady, async () => {
    Logger_js_1.Logger.info(`[BOT] Discord bot logged in as ${client.user?.tag}`);
    try {
        if (GUILD_ID) {
            const guild = await client.guilds.fetch(GUILD_ID);
            Logger_js_1.Logger.info(`[BOT] Connected to guild: ${guild.name} (${guild.id})`);
            await registerCommands(guild);
            await autoCreateAllRoles(guild);
        }
        else {
            await registerCommands();
            for (const guild of client.guilds.cache.values()) {
                await autoCreateAllRoles(guild);
            }
        }
    }
    catch (error) {
        Logger_js_1.Logger.error('Startup error', error);
    }
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = commandMap[interaction.commandName];
        if (command) {
            try {
                await command.execute(interaction);
            }
            catch (error) {
                Logger_js_1.Logger.error(`Error executing command ${interaction.commandName}`, error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({ content: 'An error occurred.', flags: discord_js_1.MessageFlags.Ephemeral });
                }
                else {
                    await interaction.reply({ content: 'An error occurred.', flags: discord_js_1.MessageFlags.Ephemeral });
                }
            }
        }
    }
    else if (interaction.isButton()) {
        try {
            await handleButtonInteraction(interaction);
        }
        catch (error) {
            Logger_js_1.Logger.error('Button interaction error', error);
        }
    }
    else if (interaction.isModalSubmit()) {
        try {
            await handleModalSubmit(interaction);
        }
        catch (error) {
            Logger_js_1.Logger.error('Modal submit error', error);
        }
    }
});
client.login(TOKEN).catch((error) => {
    Logger_js_1.Logger.error('Discord login failed', error);
});
//# sourceMappingURL=index.js.map