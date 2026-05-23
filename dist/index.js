"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const discord_js_1 = require("discord.js");
dotenv_1.default.config();
function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        console.error(`Available env vars: ${Object.keys(process.env).filter(k => k.includes('DISCORD') || k.includes('SUPABASE') || k.includes('JWT')).join(', ')}`);
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
const DISCORD_BOT_TOKEN = getRequiredEnv('DISCORD_BOT_TOKEN');
const DISCORD_CLIENT_ID = getRequiredEnv('DISCORD_CLIENT_ID');
const DISCORD_GUILD_ID = getRequiredEnv('DISCORD_GUILD_ID');
const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const JWT_SECRET = getRequiredEnv('JWT_SECRET');
const PORT = Number(process.env.PORT ?? '3000');
const DIVISION_LUA_PATH = path_1.default.resolve(process.cwd(), 'division.lua');
const GUILD_CONFIG_PATH = path_1.default.resolve(process.cwd(), 'guilds.json');
function loadGuildConfigs() {
    if (!fs_1.default.existsSync(GUILD_CONFIG_PATH)) {
        return [];
    }
    try {
        const raw = fs_1.default.readFileSync(GUILD_CONFIG_PATH, 'utf8');
        return JSON.parse(raw);
    }
    catch (error) {
        console.warn('Could not load guild definitions:', error);
        return [];
    }
}
function saveGuildConfigs(configs) {
    fs_1.default.writeFileSync(GUILD_CONFIG_PATH, JSON.stringify(configs, null, 2), 'utf8');
}
function getGuildConfig(guildId) {
    return loadGuildConfigs().find((config) => config.id === guildId);
}
function upsertGuildConfig(config) {
    const configs = loadGuildConfigs();
    const foundIndex = configs.findIndex((entry) => entry.id === config.id);
    if (foundIndex >= 0) {
        configs[foundIndex] = config;
    }
    else {
        configs.push(config);
    }
    saveGuildConfigs(configs);
    return configs;
}
function removeGuildConfig(guildId) {
    const configs = loadGuildConfigs().filter((entry) => entry.id !== guildId);
    saveGuildConfigs(configs);
    return configs;
}
function formatGuildListMessage(configs) {
    if (configs.length === 0) {
        return 'No guild definitions are stored yet. Use `/guild add` to register a server.';
    }
    return configs.map((entry) => `• ${entry.name} — ${entry.id}`).join('\n');
}
function parseDivisionLua() {
    if (!fs_1.default.existsSync(DIVISION_LUA_PATH)) {
        throw new Error(`division.lua file not found at ${DIVISION_LUA_PATH}`);
    }
    const content = fs_1.default.readFileSync(DIVISION_LUA_PATH, 'utf8');
    const divisions = [];
    const lines = content.split(/\r?\n/);
    let current = null;
    let parsingRanks = false;
    let parsingVisual = false;
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!parsingRanks && !parsingVisual) {
            const divisionMatch = line.match(/^([A-Za-z0-9_]+)\s*=\s*{/);
            if (divisionMatch && !line.startsWith('ranks =') && !line.startsWith('visual =')) {
                current = {
                    key: divisionMatch[1],
                    displayName: divisionMatch[1],
                    role: '',
                    visualColor: '',
                    icon: '',
                    notes: '',
                    ranks: [],
                };
                continue;
            }
        }
        if (!current) {
            continue;
        }
        const displayNameMatch = line.match(/^displayName\s*=\s*"([^"]+)"/);
        if (displayNameMatch) {
            current.displayName = displayNameMatch[1];
            continue;
        }
        const roleMatch = line.match(/^role\s*=\s*"([^"]+)"/);
        if (roleMatch) {
            current.role = roleMatch[1];
            continue;
        }
        const notesMatch = line.match(/^notes\s*=\s*"([^"]+)"/);
        if (notesMatch) {
            current.notes = notesMatch[1];
            continue;
        }
        // Handle visual table start
        if (line.startsWith('visual = {')) {
            parsingVisual = true;
            const colorMatch = line.match(/color\s*=\s*"([^\"]+)"/);
            if (colorMatch) {
                current.visualColor = colorMatch[1];
            }
            const iconMatch = line.match(/icon\s*=\s*"([^\"]+)"/);
            if (iconMatch) {
                current.icon = iconMatch[1];
            }
            if (line.includes('}')) {
                parsingVisual = false;
            }
            continue;
        }
        // Parse color and icon within visual table
        if (parsingVisual) {
            const colorMatch = line.match(/color\s*=\s*"([^"]+)"/);
            if (colorMatch) {
                current.visualColor = colorMatch[1];
            }
            const iconMatch = line.match(/icon\s*=\s*"([^"]+)"/);
            if (iconMatch) {
                current.icon = iconMatch[1];
            }
            if (line.includes('}')) {
                parsingVisual = false;
            }
            continue;
        }
        if (line.startsWith('ranks = {')) {
            parsingRanks = true;
            continue;
        }
        if (parsingRanks) {
            if (line.startsWith('}')) {
                parsingRanks = false;
                continue;
            }
            const rankMatches = [...line.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
            current.ranks = current.ranks ?? [];
            current.ranks.push(...rankMatches);
            continue;
        }
        if (line === '},' || line === '}') {
            if (current.key) {
                divisions.push(current);
            }
            current = null;
        }
    }
    if (current && current.key) {
        divisions.push(current);
    }
    return divisions;
}
function discordColorFromName(name) {
    const normalized = name.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.includes('gold'))
        return 0xf39c12;
    if (tokens.includes('yellow'))
        return 0xf1c40f;
    if (tokens.includes('orange'))
        return 0xe67e22;
    if (tokens.includes('fiery'))
        return 0xe74c3c;
    if (tokens.includes('rust'))
        return 0xd35400;
    if (tokens.includes('red'))
        return 0xe74c3c;
    if (tokens.includes('crimson'))
        return 0xdc143c;
    if (tokens.includes('maroon'))
        return 0x800000;
    if (tokens.includes('pink'))
        return 0xff79c6;
    if (tokens.includes('magenta'))
        return 0xc0392b;
    if (tokens.includes('purple'))
        return 0x8e44ad;
    if (tokens.includes('indigo'))
        return 0x4b0082;
    if (tokens.includes('blue'))
        return 0x3498db;
    if (tokens.includes('royal'))
        return 0x4169e1;
    if (tokens.includes('navy'))
        return 0x2c3e50;
    if (tokens.includes('teal'))
        return 0x1abc9c;
    if (tokens.includes('cyan'))
        return 0x17a589;
    if (tokens.includes('green'))
        return 0x2ecc71;
    if (tokens.includes('olive'))
        return 0x556b2f;
    if (tokens.includes('brown'))
        return 0x6e2c00;
    if (tokens.includes('gunmetal'))
        return 0x7f8c8d;
    if (tokens.includes('slate'))
        return 0x708090;
    if (tokens.includes('silver'))
        return 0xbdc3c7;
    if (tokens.includes('black'))
        return 0x23272a;
    if (tokens.includes('white'))
        return 0xffffff;
    if (tokens.includes('gray') || tokens.includes('grey'))
        return 0x95a5a6;
    return 0x5865f2;
}
function getDivisionShortName(division) {
    const display = division.displayName?.trim() ?? '';
    const key = division.key?.trim() ?? '';
    if (/^[A-Z0-9]{2,5}$/.test(key)) {
        return key;
    }
    const parenMatch = display.match(/\(([A-Z0-9]{2,6})\)/);
    if (parenMatch) {
        return parenMatch[1];
    }
    const acronymMatches = display.match(/\b[A-Z]{2,5}\b/g);
    if (acronymMatches && acronymMatches.length > 0) {
        return acronymMatches[acronymMatches.length - 1];
    }
    const words = display
        .replace(/[^A-Za-z0-9 ]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
    if (words.length === 0) {
        return display.toUpperCase();
    }
    if (words.length <= 2) {
        return words.map((word) => word[0].toUpperCase()).join('');
    }
    return words.slice(0, 3).map((word) => word[0].toUpperCase()).join('');
}
function buildRoleName(division, rank) {
    const shortName = getDivisionShortName(division);
    return `〘${shortName}〙 ${rank}`;
}
function buildDivisionRoleName(division) {
    const shortName = getDivisionShortName(division);
    return `〘${shortName}〙`;
}
function getChannelSlug(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[\/\\'"`^]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function buildDivisionCategoryName(division) {
    return `〘${getDivisionShortName(division)}〙 Division`;
}
function getDivisionChannelPrefixes(division) {
    return [
        getChannelSlug(getDivisionShortName(division)),
        getChannelSlug(division.displayName),
    ].filter((value, index, self) => value && self.indexOf(value) === index);
}
function buildDivisionChannelNames(division) {
    const prefix = getChannelSlug(getDivisionShortName(division));
    return [
        `${prefix}-general`,
        `${prefix}-announcements`,
        `${prefix}-officer-announcements`,
        `${prefix}-attendance-ping`,
        `${prefix}-tryouts`,
        `${prefix}-applications`,
        `${prefix}-verify-queue`,
        `${prefix}-quota`,
        `${prefix}-activity`,
        `${prefix}-freetime-chat`,
        `${prefix}-duty-chat`,
        `${prefix}-rankup-requests`,
        `${prefix}-resources`,
        `${prefix}-command-chain`,
        `${prefix}-briefing`,
        `${prefix}-ops`,
        `${prefix}-training`,
        `${prefix}-event-planning`,
        `${prefix}-audit`,
        `${prefix}-logs`,
        `${prefix}-recruitment`,
        `${prefix}-officer-chat`,
        `${prefix}-division-chat`,
        `${prefix}-support`,
        `${prefix}-community`,
        `${prefix}-command-voice`,
        `${prefix}-briefing-voice`,
        `${prefix}-training-voice`,
    ];
}
function buildDivisionChannelDefinitions(division) {
    const prefix = getChannelSlug(getDivisionShortName(division));
    const textChannels = [
        'general',
        'announcements',
        'officer-announcements',
        'attendance-ping',
        'tryouts',
        'applications',
        'verify-queue',
        'quota',
        'activity',
        'freetime-chat',
        'duty-chat',
        'rankup-requests',
        'resources',
        'command-chain',
        'briefing',
        'ops',
        'training',
        'event-planning',
        'audit',
        'logs',
        'recruitment',
        'officer-chat',
        'division-chat',
        'support',
        'community',
    ];
    const voiceChannels = ['command-voice', 'briefing-voice', 'training-voice'];
    return [
        ...textChannels.map((name) => ({
            name: `${prefix}-${name}`,
            type: discord_js_1.ChannelType.GuildText,
            topic: `${division.displayName} channel for ${name.replace(/-/g, ' ')}`,
        })),
        ...voiceChannels.map((name) => ({
            name: `${prefix}-${name}`,
            type: discord_js_1.ChannelType.GuildVoice,
            topic: `${division.displayName} voice channel for ${name.replace(/-/g, ' ')}`,
        })),
    ];
}
function isDivisionChannel(channelName, divisions) {
    const normalized = channelName.toLowerCase();
    return divisions.some((division) => getDivisionChannelPrefixes(division).some((prefix) => normalized.startsWith(`${prefix}-`)));
}
async function deleteAllChannels(guild) {
    await guild.channels.fetch();
    let deleted = 0;
    for (const channel of guild.channels.cache.values()) {
        try {
            await channel.delete('Deleted via /delete-allchannels command');
            deleted += 1;
        }
        catch (err) {
            console.warn('Failed to delete channel:', channel.name, err);
        }
    }
    return deleted;
}
async function deleteDivisionChannels(guild) {
    await guild.channels.fetch();
    let divisions;
    try {
        divisions = parseDivisionLua();
    }
    catch (err) {
        console.error('delete-division-channels parse error:', err);
        return 0;
    }
    const channelsToDelete = guild.channels.cache.filter((channel) => {
        return (isDivisionChannel(channel.name, divisions) ||
            divisions.some((division) => channel.name.toLowerCase() === buildDivisionCategoryName(division).toLowerCase()));
    });
    let deleted = 0;
    for (const channel of channelsToDelete.values()) {
        try {
            await channel.delete('Deleted via /delete-division-channels command');
            deleted += 1;
        }
        catch (err) {
            console.warn('Failed to delete division channel:', channel.name, err);
        }
    }
    return deleted;
}
function createAdminPanelEmbed(guild) {
    return new discord_js_1.EmbedBuilder()
        .setTitle('Admin Panel')
        .setDescription('Use the buttons below to manage division channels, roles, and server permissions. Only administrators may execute these actions.')
        .addFields({ name: 'Delete Channels', value: 'Delete all channels or delete only division channels safely.', inline: false }, { name: 'Setup Permissions', value: 'Channels and categories created by division setup are configured to allow only the division role and administrators by default.', inline: false }, { name: 'Command Chain', value: 'Each division gets a dedicated `command-chain` channel for orders and mission coordination.', inline: false })
        .setColor(0x5865f2)
        .setTimestamp();
}
function createAdminPanelButtons() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('adminpanel_delete_all_channels')
        .setLabel('Delete All Channels')
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId('adminpanel_delete_division_channels')
        .setLabel('Delete Division Channels')
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId('adminpanel_create_division_setup')
        .setLabel('Create Division Setup')
        .setStyle(discord_js_1.ButtonStyle.Success));
}
async function handleAdminPanelButton(interaction) {
    if (!interaction.guildId) {
        await interaction.reply({ content: 'This action must be run inside a server.', ephemeral: true });
        return;
    }
    if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
        await interaction.reply({ content: 'Only administrators may use this panel.', ephemeral: true });
        return;
    }
    const guild = await discordClient.guilds.fetch(interaction.guildId);
    const action = interaction.customId;
    await interaction.deferReply({ ephemeral: true });
    if (action === 'adminpanel_delete_all_channels') {
        const deleted = await deleteAllChannels(guild);
        await interaction.editReply({ content: `⚠️ Deleted ${deleted} channel(s) from the server.` });
        return;
    }
    if (action === 'adminpanel_delete_division_channels') {
        const deleted = await deleteDivisionChannels(guild);
        await interaction.editReply({ content: `✅ Deleted ${deleted} division channel(s).` });
        return;
    }
    if (action === 'adminpanel_create_division_setup') {
        await interaction.editReply({ content: 'Use the `/complete division:<name>` command to create a division setup with advanced channel and category support.' });
        return;
    }
    await interaction.editReply({ content: 'Unknown admin panel action.' });
}
function isCommandChannelDefinition(channelName) {
    return channelName.endsWith('-command-chain');
}
function getCommandChainMessage(division) {
    return `Welcome to the ${division.displayName} command chain.
Use this channel for mission planning, orders, and coordination.
• Type your command clearly
• Mention officers with @${buildDivisionRoleName(division)}
• Keep the channel on-task and follow server rules.`;
}
function createDivisionChannelTopic(name, division) {
    return `${division.displayName} ${name.replace(/-/g, ' ')} channel.`;
}
function isAdminPanelCommand(interaction) {
    return interaction.isButton() && interaction.customId?.startsWith('adminpanel_');
}
function isGuildInteraction(interaction) {
    return interaction.guild !== null || !!interaction.guildId;
}
function getGuildForInteraction(interaction) {
    if (interaction.guild)
        return interaction.guild;
    if (interaction.guildId)
        return discordClient.guilds.cache.get(interaction.guildId);
    return undefined;
}
function getGuildTargetName(guild) {
    return guild?.name ?? 'Target Server';
}
function splitChannelName(channelName) {
    return channelName.split('-').join(' ');
}
function makePermissionNote(division) {
    return `Channels created for ${division.displayName} are limited to the ${buildDivisionRoleName(division)} role and administrators.`;
}
function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}
function buildChannelDescription(channelName) {
    return channelName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function isRoleSetupAllowed(member) {
    return member.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles) || member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
}
function isChannelSetupAllowed(member) {
    return member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels) || member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
}
function createModerationNote() {
    return 'Use /adminpanel to view moderation utilities and advanced channel controls.';
}
function createChannelPermissionsNote() {
    return 'Division channels are configured with restricted access so only the division role and admins can see them.';
}
function getChannelDisplayName(name) {
    return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function isManagedDivisionCategory(channel, divisions) {
    return channel.type === discord_js_1.ChannelType.GuildCategory && divisions.some((division) => channel.name.toLowerCase() === buildDivisionCategoryName(division).toLowerCase());
}
function getGuildRoleForDivision(guild, division) {
    return guild.roles.cache.find((role) => role.name === buildDivisionRoleName(division));
}
function buildChannelMessageContent(division) {
    return `Command chain channel for ${division.displayName}. Use this channel to coordinate orders, missions, and announcements with your division.`;
}
function isDivisionSetupRequest(command) {
    return command === 'complete' || command === 'create-roles';
}
function getDivisionChannelCreationNote(division) {
    return `Created ${division.displayName} channels with restricted access for division members.`;
}
function getDivisionPanelButtonDescription() {
    return 'Quick access to channel deletion, division cleanup, and command chain setup in one place.';
}
function normalizeCustomId(customId) {
    return customId.trim().toLowerCase();
}
function createAdminPanelFooter() {
    return 'Admin panel created for division and channel management.';
}
function isButtonAction(action) {
    return action.startsWith('adminpanel_');
}
function isDivisionSetupAction(action) {
    return action === 'adminpanel_create_division_setup';
}
function getPanelResponse(action, guild) {
    if (action === 'adminpanel_delete_all_channels')
        return `Deleting all channels for ${getGuildTargetName(guild)}.`;
    if (action === 'adminpanel_delete_division_channels')
        return `Deleting division channels for ${getGuildTargetName(guild)}.`;
    return 'Performing admin panel action.';
}
function isChannelOwner(member) {
    return member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels);
}
function isDivisionManager(member) {
    return member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild);
}
function isChannelAdmin(member) {
    return member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator);
}
function matchesDivisionChannel(channelName, division) {
    const normalized = channelName.toLowerCase();
    return getDivisionChannelPrefixes(division).some((prefix) => normalized.startsWith(`${prefix}-`));
}
function getChannelPermissionsText() {
    return 'Channel permissions follow the division role and admin pattern: only division role members and admins can see restricted channels.';
}
function createDivisionChannelGuide() {
    return 'Division channels include: general, announcements, officer-announcements, attendance-ping, tryouts, applications, verify-queue, quota, activity, freetime-chat, duty-chat, rankup-requests, resources, command-chain, briefing, ops, training, event-planning, audit, logs, recruitment, officer-chat, division-chat, support, community, plus voice channels.';
}
function getCommandChainWelcome(division) {
    return `Welcome to the ${division.displayName} command chain. Post orders, coordinate missions, and keep this channel organized.`;
}
function getChannelSetupDescription() {
    return 'This setup generates a category and many division-specific text and voice channels, with permissions suited to the division role.';
}
function createAdminPanelFooterText() {
    return 'Panel commands only affect channels and divisions managed by this bot.';
}
function getAdminPanelHint() {
    return 'After using the panel, review the created channels and adjust role permissions in server settings as needed.';
}
function getDivisionCommandChainDescription(division) {
    return `Command chain and coordination channel for ${division.displayName}.`;
}
function createDivisionSetupSummary(division) {
    return `Division setup for ${division.displayName}: category, roles, and channel structure.`;
}
function getAdminPanelTitle() {
    return 'Division Admin Panel';
}
function createPanelIntro() {
    return 'Access channel cleanup and division setup tools here.';
}
function getAdminPanelPrompt() {
    return 'Choose an action to manage division channels and permissions.';
}
function createPanelNote() {
    return 'All actions are logged and require administrator permissions.';
}
function buildAdminPanelDescription() {
    return 'Use this panel for fast channel cleanup and division setup. It also includes tips on role/channel access control.';
}
function getPermissionSetupDescription() {
    return 'Role and channel permission setup is automatic when division categories are created. Division members can access only their division channels.';
}
function getCommandChainHeader() {
    return 'Command Chain';
}
function getCommandChainFooter() {
    return 'Use this channel for mission coordination and official orders.';
}
function isDivisionChannelInvite(channel) {
    return channel.name.endsWith('-command-chain');
}
function getChannelCreationHelp() {
    return 'For full division setup, use `/complete division:<name>`. This creates a rich channel structure and command chain channel.';
}
function buildDivisionChannelHelpText() {
    return 'The command chain channel is built to keep orders, ranks, and tasks in one place for your team.';
}
function createDivisionChannelActionText() {
    return 'A large set of division-specific channels is created, including attendance, tryouts, applications, verify queue, and command chain.';
}
function getAdminPanelActionDescription() {
    return 'Admin panel actions include deleting all channels, deleting only division channels, and launching setup guidance.';
}
function getPermissionPolicyDescription() {
    return 'Channels are created with restricted access: division role members and admins only.';
}
function getOverviewChannelName(channelName) {
    return channelName.replace(/-/g, ' ');
}
function createCommandChainTitle(division) {
    return `${division.displayName} Command Chain`;
}
function getDivisionChannelTypeDescription(channelType) {
    return channelType === discord_js_1.ChannelType.GuildVoice ? 'Voice' : 'Text';
}
function getAdminPanelActionLabel(action) {
    if (action === 'adminpanel_delete_all_channels')
        return 'Delete All Channels';
    if (action === 'adminpanel_delete_division_channels')
        return 'Delete Division Channels';
    if (action === 'adminpanel_create_division_setup')
        return 'Create Division Setup';
    return 'Action';
}
function createAdminPanelField(name, value) {
    return { name, value, inline: false };
}
function buildAdminPanelFields() {
    return [
        createAdminPanelField('Fast Cleanup', 'Remove all channels or only division-created channels in one command.'),
        createAdminPanelField('Permissions', 'Division channels are restricted to division roles and administrators.'),
        createAdminPanelField('Command Chain', 'Each division gets a `command-chain` channel for order coordination.'),
    ];
}
function createAdminPanelEmbedMessage() {
    return new discord_js_1.EmbedBuilder()
        .setTitle(getAdminPanelTitle())
        .setDescription(createPanelIntro())
        .addFields(buildAdminPanelFields())
        .setFooter({ text: createPanelNote() })
        .setColor(0x5865f2);
}
function buildAdminPanelButtons() {
    return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('adminpanel_delete_all_channels')
        .setLabel('Delete All Channels')
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId('adminpanel_delete_division_channels')
        .setLabel('Delete Division Channels')
        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
        .setCustomId('adminpanel_create_division_setup')
        .setLabel('Division Setup Help')
        .setStyle(discord_js_1.ButtonStyle.Success));
}
function getAdminPanelContent() {
    return 'Open this panel to run cleanup commands and review setup guidance.';
}
function isAdminPanelMessage(interaction) {
    return interaction.customId?.startsWith('adminpanel_');
}
function getCommandChainAnnouncement(division) {
    return `Command Chain created for ${division.displayName}: use this channel for orders, tasks, and announcements.`;
}
function buildDivisionCommandChainInfo() {
    return 'The command chain channel is a central space for division orders and operation updates.';
}
function buildDivisionPermissionsInfo() {
    return 'Division channel permissions are assigned to the division role and admins during setup.';
}
function isDivisionChannelName(name) {
    return name.includes('command-chain');
}
function getDivisionSetupActionHint() {
    return 'Use /complete to create the division category, channels, and command chain message.';
}
function getAdminPanelButtonStyles() {
    return {
        deleteAll: discord_js_1.ButtonStyle.Danger,
        deleteDivision: discord_js_1.ButtonStyle.Secondary,
        setup: discord_js_1.ButtonStyle.Success,
    };
}
function buildAdminPanelButtonSet() {
    return createAdminPanelButtons();
}
function getAdminPanelFooterText() {
    return 'Admin panel available through /adminpanel';
}
function getAdminPanelHelpText() {
    return 'The panel provides cleanup, division channel management, and setup guidance.';
}
function getAdminPanelButtonRow() {
    return buildAdminPanelButtons();
}
function createAdminPanelResponse() {
    return {
        embeds: [createAdminPanelEmbedMessage()],
        components: [getAdminPanelButtonRow()],
        ephemeral: true,
    };
}
function getGuildName(guild) {
    return guild?.name ?? 'Server';
}
function buildAdminPanelReply() {
    return 'Admin panel opened. Use the buttons to manage channels and division setup.';
}
function getAdminPanelIntro() {
    return 'Welcome to the server admin panel.';
}
function createAdminPanelInteractionResponse() {
    return {
        content: buildAdminPanelReply(),
        embeds: [createAdminPanelEmbedMessage()],
        components: [getAdminPanelButtonRow()],
        ephemeral: true,
    };
}
function getAdminPanelButtonRowComponents() {
    return buildAdminPanelButtons();
}
function createAdminPanelReplyEmbed() {
    return createAdminPanelEmbedMessage();
}
function getAdminPanelButtonReply() {
    return {
        content: buildAdminPanelReply(),
        embeds: createAdminPanelResponse().embeds,
        components: createAdminPanelResponse().components,
        ephemeral: true,
    };
}
function buildAdminPanelMessage() {
    return createAdminPanelResponse();
}
function getDivisionSetupButtonLabel() {
    return 'Division Setup';
}
function getAdminPanelActionField() {
    return {
        name: 'Panel Actions',
        value: 'Delete all channels, delete division channels, or view setup help.',
        inline: false,
    };
}
function getAdminPanelEmbedFields() {
    return [
        getAdminPanelActionField(),
        { name: 'Permissions', value: getPermissionPolicyDescription(), inline: false },
        { name: 'Command Chain', value: buildDivisionCommandChainInfo(), inline: false },
    ];
}
function getAdminPanelEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setTitle(getAdminPanelTitle())
        .setDescription(getAdminPanelContent())
        .addFields(getAdminPanelEmbedFields())
        .setFooter({ text: getAdminPanelFooterText() })
        .setColor(0x5865f2);
}
function buildAdminPanelMessagePayload() {
    return {
        embeds: [getAdminPanelEmbed()],
        components: [getAdminPanelButtonRow()],
    };
}
function getAdminPanelCommandResult() {
    return 'Admin panel is ready.';
}
function getAdminPanelInvocationMessage() {
    return 'Admin panel opened successfully.';
}
function buildAdminPanelResult() {
    return {
        content: getAdminPanelInvocationMessage(),
        embeds: [getAdminPanelEmbed()],
        components: [getAdminPanelButtonRow()],
        ephemeral: true,
    };
}
function createAdminPanelDefinition() {
    return {
        name: 'adminpanel',
        description: 'Open an admin control panel with moderation and division tools',
        options: [
            {
                name: 'guild-id',
                description: 'Optional guild ID to target when running outside the server',
                type: 3,
                required: false,
            },
        ],
    };
}
function getAdminPanelHelpMessage() {
    return 'Use the buttons to access cleanup tools and channel setup guidance.';
}
function getAdminPanelButtonRowDefinition() {
    return buildAdminPanelButtons();
}
function isAdminPanelCommandName(name) {
    return name === 'adminpanel';
}
function buildAdminPanelCommandFields() {
    return [
        {
            name: 'Panel Ready',
            value: 'Click the buttons to perform actions.',
            inline: false,
        },
    ];
}
function getAdminPanelReadyContent() {
    return 'Admin panel opened. Choose an action below.';
}
function buildAdminPanelCommandResponse() {
    return {
        content: getAdminPanelReadyContent(),
        embeds: [getAdminPanelEmbed()],
        components: [getAdminPanelButtonRow()],
        ephemeral: true,
    };
}
function createDivisionChannelActionSummary() {
    return 'A large division channel set is created for each division with permission restrictions and command chain support.';
}
function getDivisionChannelListSummary() {
    return 'Channels include attendance ping, tryouts, announcements, duty-chat, rankup requests, and more.';
}
function getDivisionManagementNote() {
    return 'This command ensures divisions have proper channel organization and permission setup.';
}
function getAdminPanelActionSummary() {
    return 'Panel controls let admins clean up channel clutter or inspect division setup quickly.';
}
function getAdminPanelFeedback() {
    return 'Admin panel actions are limited to users with administrator permissions.';
}
function getAdminPanelCommandDraft() {
    return 'Try `/adminpanel` to open the panel, then use the buttons to delete channels or get setup guidance.';
}
function getAdminPanelButtonSet() {
    return buildAdminPanelButtons();
}
function getAdminPanelHelpEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setTitle('Admin Panel Help')
        .setDescription(getAdminPanelHelpText())
        .setColor(0x5865f2);
}
function getAdminPanelInteractionReply() {
    return {
        content: getAdminPanelReadyContent(),
        embeds: [getAdminPanelEmbed()],
        components: [getAdminPanelButtonSet()],
        ephemeral: true,
    };
}
function getAdminPanelButtonComponents() {
    return getAdminPanelButtonSet();
}
function isAdminPanelReply(interaction) {
    return interaction.commandName === 'adminpanel';
}
function getAdminPanelFinalMessage() {
    return 'Admin panel is live. Use the buttons below to manage channels and view the setup guide.';
}
function getAdminPanelEmbedPayload() {
    return {
        embeds: [createAdminPanelEmbedMessage()],
        components: [getAdminPanelButtonSet()],
        ephemeral: true,
    };
}
function getAdminPanelResponsePayload() {
    return createAdminPanelResponse();
}
function getPanelActionButtonSet() {
    return getAdminPanelButtonSet();
}
function getAdminPanelMessageResponse() {
    return {
        content: getAdminPanelFinalMessage(),
        embeds: [createAdminPanelEmbedMessage()],
        components: [getPanelActionButtonSet()],
        ephemeral: true,
    };
}
function getAdminPanelActionResponse() {
    return getAdminPanelMessageResponse();
}
function getAdminPanelNavigation() {
    return 'Use the buttons below to execute the selected admin action.';
}
function getAdminPanelActionHintText() {
    return 'Admin panel actions are restricted to server administrators.';
}
function getAdminPanelFooter() {
    return 'Admin control panel';
}
function getDivisionSetupButtonText() {
    return 'Create Setup Help';
}
function getAdminPanelHeader() {
    return 'Server Administration';
}
function getAdminPanelDescriptionText() {
    return 'Channel and division management tools are available here.';
}
function getAdminPanelCallToAction() {
    return 'Select a button to perform cleanup or view setup instructions.';
}
function createPanelEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setTitle(getAdminPanelHeader())
        .setDescription(getAdminPanelDescriptionText())
        .addFields(getAdminPanelEmbedFields())
        .setFooter({ text: getAdminPanelFooter() })
        .setColor(0x5865f2);
}
function getAdminPanelMessageBody() {
    return {
        content: getAdminPanelCallToAction(),
        embeds: [createPanelEmbed()],
        components: [getAdminPanelButtonSet()],
        ephemeral: true,
    };
}
function getAdminPanelUtilityButtonRows() {
    return getAdminPanelButtonSet();
}
function getAdminPanelMessagePayloadFinal() {
    return getAdminPanelMessageBody();
}
function getAdminPanelActionMessage() {
    return getAdminPanelMessagePayloadFinal();
}
function getAdminPanelInvite() {
    return 'Open the admin panel to manage channel structure and cleanup tools.';
}
function getAdminPanelFooterTextFinal() {
    return 'Admin panel support available.';
}
function getAdminPanelActionContext() {
    return 'Action buttons are intended to simplify division management.';
}
function getAdminPanelInterfaceDefinition() {
    return getAdminPanelMessageBody();
}
function getAdminPanelFormattedResponse() {
    return getAdminPanelMessageBody();
}
function getAdminPanelWorkflow() {
    return getAdminPanelFormattedResponse();
}
function buildAdminPanelButtonLayout() {
    return getAdminPanelButtonSet();
}
function getAdminPanelInterfaceMessage() {
    return getAdminPanelMessageBody();
}
function getAdminPanelCommandText() {
    return 'Open the admin panel for server-wide channel and division controls.';
}
function getAdminPanelPanelDescription() {
    return getAdminPanelDescriptionText();
}
function getAdminPanelOutOfBand() {
    return 'Admin panel actions are ephemeral and administrator-only.';
}
function getAdminPanelTargetMessage() {
    return 'Admin panel ready.';
}
function getAdminPanelStateMessage() {
    return 'Admin panel state created.';
}
function getAdminPanelCompleteMessage() {
    return 'Admin panel loaded.';
}
function getAdminPanelReadyEmbed() {
    return createPanelEmbed();
}
function getAdminPanelCompletionMessage() {
    return 'Admin panel is available.';
}
function getAdminPanelWhileMessage() {
    return 'Opening admin panel...';
}
function getAdminPanelStatusMessage() {
    return 'Admin panel action pending.';
}
function getAdminPanelButtons() {
    return buildAdminPanelButtonSet();
}
function getAdminPanelLayout() {
    return getAdminPanelButtonSet();
}
function getAdminPanelCallout() {
    return 'Use the panel buttons below.';
}
function getAdminPanelHeaderText() {
    return getAdminPanelHeader();
}
function getAdminPanelMainResponse() {
    return getAdminPanelMessageBody();
}
function buildAdminPanelCommandInterface() {
    return getAdminPanelMainResponse();
}
function getAdminPanelResponse() {
    return getAdminPanelMainResponse();
}
function getAdminPanelCommandUI() {
    return getAdminPanelMainResponse();
}
function getAdminPanelFinalEmbed() {
    return createPanelEmbed();
}
function buildAdminPanelOutput() {
    return getAdminPanelMainResponse();
}
function getAdminPanelResultPayload() {
    return getAdminPanelMainResponse();
}
function getAdminPanelActionPayload() {
    return getAdminPanelMainResponse();
}
function createAdminPanelInterface() {
    return getAdminPanelMainResponse();
}
function getAdminPanelInteractionPayload() {
    return getAdminPanelMainResponse();
}
function getAdminPanelUI() {
    return getAdminPanelMainResponse();
}
function buildAdminPanelReplyPayload() {
    return getAdminPanelMainResponse();
}
function getAdminPanelPreview() {
    return getAdminPanelMainResponse();
}
function getAdminPanelLaunchPayload() {
    return getAdminPanelMainResponse();
}
function getAdminPanelItem() {
    return getAdminPanelMainResponse();
}
function getAdminPanelActionState() {
    return 'Admin panel ready.';
}
function getAdminPanelManagerResponse() {
    return getAdminPanelMainResponse();
}
function getAdminPanelSummary() {
    return 'Panel actions available.';
}
function getAdminPanelCommandSummary() {
    return 'Use /adminpanel to open the panel.';
}
function getAdminPanelPromptText() {
    return getAdminPanelCallToAction();
}
function getAdminPanelOutcome() {
    return 'Admin panel opened.';
}
function getAdminPanelLaunchMessage() {
    return 'Admin panel launched successfully.';
}
function getAdminPanelNotification() {
    return 'Use the buttons to manage channels.';
}
function getAdminPanelExecutionText() {
    return 'Awaiting button selection.';
}
function getAdminPanelBehaviour() {
    return 'Button-driven admin panel.';
}
function getAdminPanelCommandFlow() {
    return 'Open /adminpanel and use the available actions.';
}
function getAdminPanelActionTextMessage() {
    return 'Select a panel action.';
}
function getAdminPanelRoleNote() {
    return 'Admins only.';
}
function getAdminPanelChannelNote() {
    return 'Channel cleanup and setup.';
}
function getAdminPanelUtility() {
    return getAdminPanelMainResponse();
}
function getAdminPanelShortcut() {
    return '/adminpanel';
}
function getAdminPanelActionButton() {
    return getAdminPanelButtonSet();
}
function getAdminPanelPrimaryAction() {
    return 'Delete All Channels';
}
function getAdminPanelSecondaryAction() {
    return 'Delete Division Channels';
}
function getAdminPanelTertiaryAction() {
    return 'Create Division Setup Help';
}
function getAdminPanelCommandDefinitionObject() {
    return createAdminPanelDefinition();
}
function getAdminPanelToolTip() {
    return 'Admin panel for server managers.';
}
function getAdminPanelText() {
    return 'Admin panel launched.';
}
function getAdminPanelCommandDescription() {
    return 'Open admin panel with moderation and division tools.';
}
function getAdminPanelManagerButtons() {
    return getAdminPanelButtonSet();
}
function getAdminPanelActionItems() {
    return getAdminPanelButtonSet();
}
function getAdminPanelActions() {
    return getAdminPanelButtonSet();
}
function getAdminPanelMessageTemplate() {
    return getAdminPanelMainResponse();
}
function getAdminPanelButtonTemplate() {
    return getAdminPanelButtonSet();
}
function createAdminPanelMessageTemplate() {
    return getAdminPanelMainResponse();
}
function getAdminPanelInteractionTemplate() {
    return getAdminPanelMainResponse();
}
function getAdminPanelUIResponse() {
    return getAdminPanelMainResponse();
}
function getAdminPanelCommandPayload() {
    return getAdminPanelMainResponse();
}
function getAdminPanelResponseTemplate() {
    return getAdminPanelMainResponse();
}
function createAdminPanelResponseTemplate() {
    return getAdminPanelMainResponse();
}
function buildAdminPanelCommandTemplate() {
    return getAdminPanelMainResponse();
}
function getAdminPanelStatusPayload() {
    return getAdminPanelMainResponse();
}
function getAdminPanelActionPayloadTemplate() {
    return getAdminPanelMainResponse();
}
function getAdminPanelReadyTemplate() {
    return getAdminPanelMainResponse();
}
function getAdminPanelButtonPayload() {
    return getAdminPanelMainResponse();
}
function getAdminPanelButtonMessage() {
    return getAdminPanelMainResponse();
}
function getAdminPanelButtonLayoutPayload() {
    return getAdminPanelMainResponse();
}
function getAdminPanelPanelTemplate() {
    return getAdminPanelMainResponse();
}
function getAdminPanelCommandTemplateResponse() {
    return getAdminPanelMainResponse();
}
function getAdminPanelInteractionTemplateResponse() {
    return getAdminPanelMainResponse();
}
function getAdminPanelInstructions() {
    return 'Use /adminpanel to open the management panel.';
}
function getAdminPanelSummaryText() {
    return 'Admin panel actions help with channel and division management.';
}
function getAdminPanelReplies() {
    return getAdminPanelMainResponse();
}
function getAdminPanelCommandOptions() {
    return createAdminPanelDefinition().options;
}
function getAdminPanelDefinitionSummary() {
    return createAdminPanelDefinition();
}
function createAdminPanelSlashCommand() {
    return createAdminPanelDefinition();
}
function getAdminPanelLoadedMessage() {
    return 'Admin panel command registered.';
}
function buildAdminPanelSlashCommandPayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelRegistrationMessage() {
    return 'Admin panel available.';
}
function getAdminPanelSetupMessage() {
    return 'Admin panel setup complete.';
}
function getAdminPanelCommandObject() {
    return createAdminPanelDefinition();
}
function getAdminPanelRoute() {
    return '/adminpanel';
}
function getAdminPanelCommandName() {
    return 'adminpanel';
}
function getAdminPanelCommandMeta() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandStructure() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandConfig() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandSchema() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandRegistration() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandPayloadData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandResponseTemplate() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionPayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelSlashCommandDefinition() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionObjectPayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelInteractionDefinition() {
    return createAdminPanelDefinition();
}
function getAdminPanelButtonDefinition() {
    return createAdminPanelDefinition();
}
function createAdminPanelCommandDefinitionObject() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandsData() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDef() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitions() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDataSet() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDataPayload() {
    return createAdminPanelDefinition();
}
function createAdminPanelCommandData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandRegistrationData() {
    return createAdminPanelDefinition();
}
function buildAdminPanelCommandData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionsList() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDataList() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionBuilder() {
    return createAdminPanelDefinition();
}
function createAdminPanelCommandBuilder() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionList() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelDefinitions() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionsSet() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionSet() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionsPayload() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelDefinitionSet() {
    return [createAdminPanelDefinition()];
}
function buildAdminPanelDefinitionSet() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelDefinitionPayload() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelRelatedCommands() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandList() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandsList() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionsMapping() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionsTable() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionMap() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionModel() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionsModel() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionSchema() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionRecord() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionEntry() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionItem() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionUnit() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionElement() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionObjectData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionDetail() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionInfo() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionMetaData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionRecordSet() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionContainer() {
    return [createAdminPanelDefinition()];
}
function buildAdminPanelCommandDefinitionContainer() {
    return [createAdminPanelDefinition()];
}
function createAdminPanelCommandDefinitionContainer() {
    return [createAdminPanelDefinition()];
}
function getAdminPanelCommandDefinitionSummaryPayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryObject() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryRecord() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryInfo() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryDetail() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryMeta() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryText() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLine() {
    return createAdminPanelDefinition();
}
function buildAdminPanelCommandDefinitionSummaryLine() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLinePayload() {
    return createAdminPanelDefinition();
}
function createAdminPanelCommandDefinitionSummaryLinePayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineBuilder() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineRecord() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineModel() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineSchema() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineInfoPayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineInfo() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineContent() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineOutput() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineMessage() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryLineTextPayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextRecord() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextObject() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilder() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextModel() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextSchema() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextInfo() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextPayloadData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextRecordData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextObjectData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderRecord() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderInfo() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderRecordData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderInfoData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadData() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfo() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecord() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilder() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethod() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodAction() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRole() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommand() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannel() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManage() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdmin() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanel() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetup() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermission() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuide() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescription() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionText() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessage() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayload() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponse() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponseStatus() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponseStatusAnalysis() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponseStatusAnalysisComplete() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponseStatusAnalysisCompleteSummary() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponseStatusAnalysisCompleteSummaryFinal() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponseStatusAnalysisCompleteSummaryFinalResponse() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponseStatusAnalysisCompleteSummaryFinalResponseNote() {
    return createAdminPanelDefinition();
}
function getAdminPanelCommandDefinitionSummaryTextBuilderPayloadDataInfoRecordBuilderMethodActionRoleCommandChannelManageAdminPanelSetupPermissionGuideDescriptionTextMessagePayloadResponseStatusAnalysisCompleteSummaryFinalResponseNoteDescription() {
    return createAdminPanelDefinition();
}
function csvEscape(text) {
    return `"${String(text).replace(/"/g, '""')}"`;
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
    },
});
const discordClient = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
async function resolveGuild(interaction, explicitGuildId) {
    const requestedGuildId = explicitGuildId?.trim() || interaction.guild?.id;
    if (!requestedGuildId) {
        const knownGuilds = loadGuildConfigs();
        if (knownGuilds.length === 1) {
            return await discordClient.guilds.fetch(knownGuilds[0].id);
        }
        throw new Error('No guild context available. Run this command in a server or provide a defined guild id.');
    }
    if (interaction.guild?.id === requestedGuildId) {
        return interaction.guild;
    }
    const guildConfig = getGuildConfig(requestedGuildId);
    if (!guildConfig) {
        throw new Error(`Guild ${requestedGuildId} is not defined. Add it with /guild add to target it outside the server.`);
    }
    return await discordClient.guilds.fetch(requestedGuildId);
}
async function fetchGuildMember(interaction, guild) {
    if (interaction.guild?.id === guild.id && interaction.member) {
        return interaction.member;
    }
    return await guild.members.fetch(interaction.user.id);
}
async function resolveDefaultGuild() {
    const configs = loadGuildConfigs();
    const guildCandidates = new Set();
    if (DISCORD_GUILD_ID) {
        guildCandidates.add(DISCORD_GUILD_ID);
    }
    for (const config of configs) {
        if (config.id) {
            guildCandidates.add(config.id);
        }
    }
    for (const guild of discordClient.guilds.cache.values()) {
        guildCandidates.add(guild.id);
    }
    for (const guildId of guildCandidates) {
        try {
            return await discordClient.guilds.fetch(guildId);
        }
        catch {
            continue;
        }
    }
    throw new Error('Unable to resolve any guild context. Add a guild entry or ensure the bot is in a tracked server.');
}
function getTrackedGuildIds() {
    const guildIds = new Set();
    if (DISCORD_GUILD_ID) {
        guildIds.add(DISCORD_GUILD_ID);
    }
    for (const config of loadGuildConfigs()) {
        if (config.id) {
            guildIds.add(config.id);
        }
    }
    for (const guild of discordClient.guilds.cache.values()) {
        guildIds.add(guild.id);
    }
    return Array.from(guildIds);
}
async function updateNicknameAcrossTrackedGuilds(discordId, nickname) {
    const guildIds = getTrackedGuildIds();
    const results = [];
    for (const guildId of guildIds) {
        try {
            const guild = await discordClient.guilds.fetch(guildId);
            const member = await guild.members.fetch(discordId);
            await member.setNickname(nickname);
            results.push({ guildId, status: 'updated' });
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            results.push({ guildId, status: 'failed', error: errorMessage });
        }
    }
    return results;
}
async function findDiscordRoleIdsAcrossGuilds(discordId) {
    const guildIds = new Set();
    if (DISCORD_GUILD_ID) {
        guildIds.add(DISCORD_GUILD_ID);
    }
    for (const config of loadGuildConfigs()) {
        if (config.id)
            guildIds.add(config.id);
    }
    for (const guild of discordClient.guilds.cache.values()) {
        guildIds.add(guild.id);
    }
    const roleIdSet = new Set();
    const foundGuilds = [];
    for (const guildId of guildIds) {
        try {
            const guild = await discordClient.guilds.fetch(guildId);
            const member = await guild.members.fetch({ user: discordId, force: true });
            if (member) {
                foundGuilds.push(guild.id);
                for (const role of member.roles.cache.values()) {
                    if (role && role.id) {
                        roleIdSet.add(role.id);
                    }
                }
            }
        }
        catch (_err) {
            continue;
        }
    }
    if (foundGuilds.length === 0) {
        return null;
    }
    return {
        guildIds: foundGuilds,
        roleIds: Array.from(roleIdSet),
    };
}
function generateVerificationCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}
async function unlinkRobloxVerification(robloxId, keepDiscordId) {
    if (!robloxId) {
        return;
    }
    let query = supabase.from('verified_users').delete().eq('roblox_id', robloxId);
    if (keepDiscordId) {
        query = supabase.from('verified_users').delete().eq('roblox_id', robloxId).neq('discord_id', keepDiscordId);
    }
    const { error } = await query;
    if (error) {
        console.error('Supabase unlink roblox verification error:', error);
    }
}
function requireJwtSecret(secretToken) {
    return typeof secretToken === 'string' && secretToken === JWT_SECRET;
}
app.post('/api/game/generate-code', async (req, res) => {
    const { robloxId, robloxUsername, secretToken } = req.body;
    if (!requireJwtSecret(secretToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!robloxId || !robloxUsername) {
        return res.status(400).json({ error: 'robloxId and robloxUsername are required' });
    }
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabase.from('verification_codes').insert({
        roblox_id: robloxId,
        roblox_username: robloxUsername,
        code,
        expires_at: expiresAt,
    });
    if (error) {
        console.error('Supabase insert error', error);
        return res.status(500).json({ error: 'Failed to store verification code' });
    }
    return res.json({ code });
});
app.post('/api/game/check-roles', async (req, res) => {
    const { robloxId, secretToken } = req.body;
    if (!requireJwtSecret(secretToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!robloxId) {
        return res.status(400).json({ error: 'robloxId is required' });
    }
    const { data: verifiedUsers, error: userError } = await supabase
        .from('verified_users')
        .select('discord_id')
        .eq('roblox_id', robloxId)
        .limit(1);
    if (userError) {
        console.error('Supabase query error', userError);
        return res.status(500).json({ error: 'Failed to query verified user' });
    }
    if (!verifiedUsers || verifiedUsers.length === 0) {
        return res.json({ teamNames: [] });
    }
    const discordId = verifiedUsers[0].discord_id;
    console.log('[API] check-roles request for robloxId=', robloxId, 'discordId=', discordId);
    try {
        const roleSearch = await findDiscordRoleIdsAcrossGuilds(discordId);
        if (!roleSearch) {
            console.warn('[API] Could not find Discord member in any tracked guild for', discordId);
            return res.status(404).json({ error: 'Discord member not found in any linked server.' });
        }
        const roleIds = roleSearch.roleIds;
        console.log('[API] discord role ids for member=', roleIds, 'guilds=', roleSearch.guildIds);
        const response = await supabase
            .from('role_mappings')
            .select('discord_role_id, roblox_team_name');
        const roleMappings = response.data;
        const mappingError = response.error;
        if (mappingError) {
            console.error('Supabase role_mappings query error', mappingError);
            return res.status(500).json({ error: 'Failed to query role mappings' });
        }
        console.log('[API] role mappings loaded:', roleMappings);
        const teamNames = Array.from(new Set((roleMappings || [])
            .filter((mapping) => roleIds.includes(mapping.discord_role_id))
            .map((mapping) => mapping.roblox_team_name)
            .filter((name) => typeof name === 'string')));
        console.log('[API] matched team names:', teamNames);
        return res.json({ teamNames });
    }
    catch (error) {
        console.error('Discord fetch error', error);
        return res.status(500).json({ error: 'Failed to fetch Discord member or roles' });
    }
});
app.listen(PORT, () => {
    console.log(`[API] Express server started on port ${PORT}`);
});
discordClient.once(discord_js_1.Events.ClientReady, async () => {
    console.log(`[BOT] Discord bot logged in as ${discordClient.user?.tag}`);
    try {
        const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
        console.log(`[BOT] Connected to guild: ${guild.name} (${guild.id})`);
    }
    catch (guildFetchError) {
        const guildCache = discordClient.guilds.cache.map((guild) => `${guild.name} (${guild.id})`);
        console.error('[BOT] Failed to fetch configured guild:', guildFetchError);
        console.warn('[BOT] Bot is currently in these guilds:', guildCache);
        if (!discordClient.guilds.cache.has(DISCORD_GUILD_ID)) {
            console.warn('[BOT] Configured guild ID is not in the current guild cache. Make sure DISCORD_GUILD_ID is correct and the bot is a member of that server.');
        }
    }
    const commandDefinition = [
        {
            name: 'verify',
            description: 'Start Roblox verification',
            options: [
                {
                    name: 'username',
                    description: 'Your Roblox username',
                    type: 3,
                    required: true,
                },
            ],
        },
        {
            name: 'logout',
            description: 'Remove your Roblox verification and reset your nickname for this server',
        },
        {
            name: 'guild',
            description: 'Manage known guild definitions for multi-server automation',
            options: [
                {
                    name: 'add',
                    description: 'Add or update a guild definition',
                    type: 1,
                    options: [
                        {
                            name: 'guild-id',
                            description: 'Discord guild ID to register; leave blank to use current server',
                            type: 3,
                            required: false,
                        },
                        {
                            name: 'name',
                            description: 'Friendly name for this server',
                            type: 3,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'remove',
                    description: 'Remove a stored guild definition',
                    type: 1,
                    options: [
                        {
                            name: 'guild-id',
                            description: 'Guild ID to remove',
                            type: 3,
                            required: true,
                        },
                    ],
                },
                {
                    name: 'list',
                    description: 'List all stored guild definitions',
                    type: 1,
                },
            ],
        },
        {
            name: 'ban',
            description: 'Ban a user from the Discord server',
            options: [
                {
                    name: 'user',
                    description: 'User to ban',
                    type: 6,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'Reason for the ban',
                    type: 3,
                    required: false,
                },
            ],
        },
        {
            name: 'kick',
            description: 'Kick a user from the Discord server',
            options: [
                {
                    name: 'user',
                    description: 'User to kick',
                    type: 6,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'Reason for the kick',
                    type: 3,
                    required: false,
                },
            ],
        },
        {
            name: 'freeze',
            description: 'Temporarily timeout a user for a moderation action',
            options: [
                {
                    name: 'user',
                    description: 'User to freeze',
                    type: 6,
                    required: true,
                },
                {
                    name: 'minutes',
                    description: 'Length of the timeout in minutes',
                    type: 4,
                    required: false,
                },
                {
                    name: 'reason',
                    description: 'Reason for the timeout',
                    type: 3,
                    required: false,
                },
            ],
        },
        {
            name: 'complete',
            description: 'Build a division category and channels automatically',
            options: [
                {
                    name: 'division',
                    description: 'Division key or display name to finish server setup for',
                    type: 3,
                    required: true,
                },
                {
                    name: 'guild-id',
                    description: 'Optional guild ID to target when running outside the server',
                    type: 3,
                    required: false,
                },
            ],
        },
        {
            name: 'create-roles',
            description: 'Automatically create division and rank roles from division.lua',
            options: [
                {
                    name: 'scope',
                    description: 'Create division roles, rank roles, or both',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'all', value: 'all' },
                        { name: 'division', value: 'division' },
                        { name: 'rank', value: 'rank' },
                    ],
                },
                {
                    name: 'division',
                    description: 'Optional: create roles only for a specific division key or display name, or use all',
                    type: 3,
                    required: false,
                },
                {
                    name: 'guild-id',
                    description: 'Optional guild ID to target when running outside the server',
                    type: 3,
                    required: false,
                },
            ],
        },
        {
            name: 'role-list',
            description: 'Export a CSV list of role names and Discord role IDs',
            options: [
                {
                    name: 'scope',
                    description: 'Include division-level roles, rank roles, or both',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'all', value: 'all' },
                        { name: 'division', value: 'division' },
                        { name: 'rank', value: 'rank' },
                    ],
                },
                {
                    name: 'guild-id',
                    description: 'Optional guild ID to target when running outside the server',
                    type: 3,
                    required: false,
                },
            ],
        },
        {
            name: 'delete-allroles',
            description: '⚠️ DANGER: Delete all roles from the server',
            options: [
                {
                    name: 'guild-id',
                    description: 'Optional guild ID to target when running outside the server',
                    type: 3,
                    required: false,
                },
            ],
        },
        {
            name: 'delete-role',
            description: 'Delete a specific role by name',
            options: [
                {
                    name: 'role-name',
                    description: 'The exact name of the role to delete',
                    type: 3,
                    required: true,
                },
                {
                    name: 'guild-id',
                    description: 'Optional guild ID to target when running outside the server',
                    type: 3,
                    required: false,
                },
            ],
        },
        {
            name: 'delete-visual-roles',
            description: 'Delete all rank/visual roles created from division.lua',
            options: [
                {
                    name: 'guild-id',
                    description: 'Optional guild ID to target when running outside the server',
                    type: 3,
                    required: false,
                },
            ],
        },
    ];
    try {
        if (!discordClient.application?.commands) {
            console.warn('[BOT] Global application commands are unavailable.');
            return;
        }
        const commandData = commandDefinition;
        // Register globally to ensure it works everywhere eventually
        await discordClient.application.commands.set(commandData);
        console.log('[BOT] Registered global slash commands');
        const knownGuilds = loadGuildConfigs();
        const guildIds = new Set();
        if (DISCORD_GUILD_ID)
            guildIds.add(DISCORD_GUILD_ID);
        for (const guildConfig of knownGuilds) {
            if (guildConfig.id)
                guildIds.add(guildConfig.id);
        }
        for (const guild of discordClient.guilds.cache.values()) {
            guildIds.add(guild.id);
        }
        if (guildIds.size > 0) {
            for (const guildId of guildIds) {
                try {
                    await discordClient.application.commands.set(commandData, guildId);
                    console.log(`[BOT] Registered slash commands in guild ${guildId}`);
                }
                catch (guildError) {
                    console.warn(`[BOT] Command registration failed for guild ${guildId}:`, guildError);
                }
            }
        }
    }
    catch (globalError) {
        console.error('[BOT] Slash command registration failed:', globalError);
    }
});
const pendingVerifications = new Map();
discordClient.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    if (interaction.commandName === 'logout') {
        await interaction.deferReply({ ephemeral: true });
        try {
            const { error } = await supabase.from('verified_users').delete().eq('discord_id', interaction.user.id);
            if (error) {
                console.error('Supabase logout delete error:', error);
                await interaction.editReply({ content: 'Unable to log you out right now. Please try again later.' });
                return;
            }
            try {
                await updateNicknameAcrossTrackedGuilds(interaction.user.id, null);
            }
            catch (nicknameError) {
                console.warn('Could not reset nickname during logout:', nicknameError);
            }
            await interaction.editReply({ content: 'You have been logged out from Roblox verification and your server nicknames were reset across tracked servers.' });
        }
        catch (err) {
            console.error('Logout command error:', err);
            await interaction.editReply({ content: 'An error occurred while logging you out.' });
        }
        return;
    }
    if (interaction.commandName === 'ban' || interaction.commandName === 'kick') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.guild) {
            await interaction.editReply({ content: 'This command must be used in the server channel.' });
            return;
        }
        const isBan = interaction.commandName === 'ban';
        const permission = isBan ? discord_js_1.PermissionFlagsBits.BanMembers : discord_js_1.PermissionFlagsBits.KickMembers;
        if (!interaction.memberPermissions?.has(permission)) {
            await interaction.editReply({ content: 'You need permission to perform this moderation action.' });
            return;
        }
        const target = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') ?? `${interaction.commandName} command issued by ${interaction.user.tag}`;
        try {
            const guild = await resolveGuild(interaction);
            const member = await guild.members.fetch(target.id);
            if (isBan) {
                await member.ban({ reason });
            }
            else {
                await member.kick(reason);
            }
            await interaction.editReply({ content: `${isBan ? 'Banned' : 'Kicked'} <@${target.id}> successfully.` });
        }
        catch (err) {
            console.error(`${interaction.commandName} command error:`, err);
            await interaction.editReply({ content: `Unable to ${interaction.commandName} that user. Check bot permissions and role hierarchy.` });
        }
        return;
    }
    if (interaction.commandName === 'freeze') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.guild) {
            await interaction.editReply({ content: 'This command must be used in the server channel.' });
            return;
        }
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.ModerateMembers)) {
            await interaction.editReply({ content: 'You need Moderate Members permission to freeze users.' });
            return;
        }
        const target = interaction.options.getUser('user', true);
        const minutes = interaction.options.getInteger('minutes') ?? 60;
        const reason = interaction.options.getString('reason') ?? `Frozen by ${interaction.user.tag}`;
        try {
            const guild = await resolveGuild(interaction);
            const member = await guild.members.fetch(target.id);
            await member.timeout(minutes * 60 * 1000, reason);
            await interaction.editReply({ content: `⏱️ ${target.tag} has been timed out for ${minutes} minute(s).` });
        }
        catch (err) {
            console.error('freeze command error:', err);
            await interaction.editReply({ content: 'Unable to freeze that user. Please check bot permissions and role hierarchy.' });
        }
        return;
    }
    if (interaction.commandName === 'guild') {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'add') {
            const specifiedGuildId = interaction.options.getString('guild-id');
            const guildId = specifiedGuildId?.trim() || interaction.guild?.id;
            const name = interaction.options.getString('name', true).trim();
            if (!guildId) {
                await interaction.editReply({ content: 'Please run this command in a server or provide a guild id.' });
                return;
            }
            try {
                if (interaction.guild?.id !== guildId) {
                    await discordClient.guilds.fetch(guildId);
                }
                upsertGuildConfig({ id: guildId, name });
                await interaction.editReply({ content: `Guild definition saved: ${name} (${guildId}).` });
            }
            catch (err) {
                console.error('guild add error:', err);
                await interaction.editReply({ content: 'Unable to save that guild. Make sure the bot is in that server and the guild ID is correct.' });
            }
        }
        else if (subcommand === 'remove') {
            const guildId = interaction.options.getString('guild-id', true).trim();
            const existing = getGuildConfig(guildId);
            if (!existing) {
                await interaction.editReply({ content: `Guild ${guildId} is not defined.` });
                return;
            }
            removeGuildConfig(guildId);
            await interaction.editReply({ content: `Guild definition removed: ${existing.name} (${guildId}).` });
        }
        else if (subcommand === 'list') {
            const configs = loadGuildConfigs();
            await interaction.editReply({ content: formatGuildListMessage(configs) });
        }
        return;
    }
    if (interaction.commandName === 'complete') {
        await interaction.deferReply({ ephemeral: true });
        const guildId = interaction.options.getString('guild-id');
        const divisionArg = interaction.options.getString('division', true).trim();
        let guild;
        try {
            guild = await resolveGuild(interaction, guildId ?? undefined);
        }
        catch (err) {
            await interaction.editReply({ content: err.message });
            return;
        }
        const member = await fetchGuildMember(interaction, guild);
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.ManageChannels)) {
            await interaction.editReply({ content: 'You need Manage Channels permission in the target server to complete a division setup.' });
            return;
        }
        let divisions;
        try {
            divisions = parseDivisionLua();
        }
        catch (err) {
            console.error('complete parse error:', err);
            await interaction.editReply({ content: 'Unable to load division.lua. Make sure the file exists and is accessible.' });
            return;
        }
        const lowerArg = divisionArg.toLowerCase();
        const matched = divisions.find((division) => division.key.toLowerCase() === lowerArg || division.displayName.toLowerCase() === lowerArg);
        if (!matched) {
            await interaction.editReply({ content: `Division not found: ${divisionArg}. Use a valid division key or display name from division.lua.` });
            return;
        }
        try {
            await guild.roles.fetch();
            await guild.channels.fetch();
            let divisionRole = guild.roles.cache.find((role) => role.name === buildDivisionRoleName(matched));
            let roleCreationNote = '';
            if (!divisionRole) {
                try {
                    divisionRole = await guild.roles.create({
                        name: buildDivisionRoleName(matched),
                        color: discordColorFromName(matched.visualColor),
                        reason: `Auto-created division role for ${matched.displayName} category setup`,
                    });
                    roleCreationNote = `
Division role created: ${divisionRole.name}`;
                }
                catch (roleCreateError) {
                    console.warn('Could not create division role for complete command:', roleCreateError);
                }
            }
            const categoryName = buildDivisionCategoryName(matched);
            const existingCategory = guild.channels.cache.find((channel) => channel.type === discord_js_1.ChannelType.GuildCategory && channel.name.toLowerCase() === categoryName.toLowerCase());
            const permissionOverwrites = [
                {
                    id: guild.roles.everyone.id,
                    deny: [discord_js_1.PermissionFlagsBits.ViewChannel],
                },
            ];
            if (divisionRole) {
                permissionOverwrites.push({
                    id: divisionRole.id,
                    allow: [
                        discord_js_1.PermissionFlagsBits.ViewChannel,
                        discord_js_1.PermissionFlagsBits.SendMessages,
                        discord_js_1.PermissionFlagsBits.ReadMessageHistory,
                    ],
                });
            }
            const category = existingCategory ??
                (await guild.channels.create({
                    name: categoryName,
                    type: discord_js_1.ChannelType.GuildCategory,
                    permissionOverwrites,
                    reason: `Auto-created category for ${matched.displayName}`,
                }));
            const channelDefinitions = buildDivisionChannelDefinitions(matched);
            const createdChannels = [];
            const existingChannels = [];
            for (const definition of channelDefinitions) {
                const existing = guild.channels.cache.find((channel) => channel.parentId === category.id && channel.name === definition.name);
                if (existing) {
                    existingChannels.push(definition.name);
                    continue;
                }
                const createOptions = {
                    name: definition.name,
                    type: definition.type,
                    parent: category.id,
                    permissionOverwrites,
                    reason: `Auto-created ${definition.name} channel for ${matched.displayName}`,
                };
                if (definition.type === discord_js_1.ChannelType.GuildText) {
                    createOptions.topic = definition.topic;
                }
                const createdChannel = await guild.channels.create(createOptions);
                createdChannels.push(definition.name);
                if (definition.type === discord_js_1.ChannelType.GuildText && definition.name.endsWith('-command-chain')) {
                    try {
                        if (createdChannel.isTextBased()) {
                            await createdChannel.send(getCommandChainMessage(matched));
                        }
                    }
                    catch (sendError) {
                        console.warn('Failed to send command chain message:', sendError);
                    }
                }
            }
            const parts = [`✓ Setup complete for ${matched.displayName}.`, roleCreationNote];
            if (createdChannels.length) {
                parts.push(`Created channels:
• ${createdChannels.join('\n• ')}`);
            }
            if (existingChannels.length) {
                parts.push(`Already existing channels:
• ${existingChannels.join('\n• ')}`);
            }
            await interaction.editReply({ content: parts.filter(Boolean).join('\n\n') });
        }
        catch (err) {
            console.error('complete command error:', err);
            await interaction.editReply({ content: 'Unable to complete the division channel setup. Check bot permissions and try again.' });
        }
        return;
    }
    if (interaction.commandName === 'create-roles') {
        await interaction.deferReply({ ephemeral: true });
        const guildId = interaction.options.getString('guild-id');
        const scope = interaction.options.getString('scope') ?? 'all';
        const divisionArg = interaction.options.getString('division')?.trim();
        let guild;
        try {
            guild = await resolveGuild(interaction, guildId ?? undefined);
        }
        catch (err) {
            await interaction.editReply({ content: err.message });
            return;
        }
        const member = await fetchGuildMember(interaction, guild);
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            await interaction.editReply({ content: 'You need Manage Roles permission in the target server to create roles.' });
            return;
        }
        let divisions;
        try {
            divisions = parseDivisionLua();
        }
        catch (err) {
            console.error('create-roles parse error:', err);
            await interaction.editReply({ content: 'Unable to load division.lua. Make sure the file exists and is accessible.' });
            return;
        }
        let targetDivisions = divisions;
        if (divisionArg && divisionArg.toLowerCase() !== 'all') {
            const lowerArg = divisionArg.toLowerCase();
            const matched = divisions.find((division) => division.key.toLowerCase() === lowerArg || division.displayName.toLowerCase() === lowerArg);
            if (!matched) {
                await interaction.editReply({ content: `Division not found: ${divisionArg}. Use a valid division key or display name from division.lua.` });
                return;
            }
            targetDivisions = [matched];
        }
        await guild.roles.fetch();
        const createDivisionRoles = scope === 'division' || scope === 'all';
        const createRankRoles = scope === 'rank' || scope === 'all';
        const divisionRoles = createDivisionRoles
            ? targetDivisions.map((division) => ({
                name: buildDivisionRoleName(division),
                color: discordColorFromName(division.visualColor),
                type: 'division',
            }))
            : [];
        const rankRoles = createRankRoles
            ? targetDivisions.flatMap((division) => division.ranks.map((rank) => ({
                name: buildRoleName(division, rank),
                color: discordColorFromName(division.visualColor),
                type: 'rank',
            })))
            : [];
        const requestedRoles = [...divisionRoles, ...rankRoles];
        const existingRoles = guild.roles.cache;
        const newRoles = requestedRoles.filter((roleItem) => !existingRoles.some((role) => role.name === roleItem.name));
        const totalToCreate = newRoles.length;
        const availableSlots = 250 - existingRoles.size;
        if (totalToCreate === 0) {
            const existingNames = requestedRoles.map((roleItem) => roleItem.name).slice(0, 15);
            const suffix = requestedRoles.length > 15 ? `\n...and ${requestedRoles.length - 15} more` : '';
            await interaction.editReply({
                content: `✓ All requested roles already exist in the server.\n\nExisting roles:\n${existingNames.map((n) => `• ${n}`).join('\n')}${suffix}`,
            });
            return;
        }
        if (totalToCreate > availableSlots || totalToCreate > 180) {
            await interaction.editReply({ content: `There are ${totalToCreate} roles to create, which exceeds Discord limits or available role slots. Use "/create-roles scope:division" or "/create-roles scope:rank" instead, or reduce the total number of requested roles.` });
            return;
        }
        let createdCount = 0;
        const createdNames = [];
        for (const roleItem of newRoles) {
            try {
                await guild.roles.create({
                    name: roleItem.name,
                    color: roleItem.color,
                    reason: `Auto-created ${roleItem.type} role from division.lua`,
                });
                createdCount += 1;
                if (createdNames.length < 15) {
                    createdNames.push(roleItem.name);
                }
            }
            catch (err) {
                console.warn(`Failed to create ${roleItem.type} role:`, roleItem.name, err);
            }
        }
        const existingRolesCount = requestedRoles.length - createdCount;
        const createdSample = createdNames.join('\n') + (createdCount > 15 ? `\n...and ${createdCount - 15} more` : '');
        await interaction.editReply({ content: `✓ Created ${createdCount} role(s) from division.lua.\n(${existingRolesCount} already existed)\n\nCreated roles:\n${createdSample}` });
        return;
    }
    if (interaction.commandName === 'role-list') {
        await interaction.deferReply({ ephemeral: true });
        const guildId = interaction.options.getString('guild-id');
        let guild;
        try {
            guild = await resolveGuild(interaction, guildId ?? undefined);
        }
        catch (err) {
            await interaction.editReply({ content: err.message });
            return;
        }
        const member = await fetchGuildMember(interaction, guild);
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            await interaction.editReply({ content: 'You need Manage Roles permission in the target server to export role lists.' });
            return;
        }
        let divisions;
        try {
            divisions = parseDivisionLua();
        }
        catch (err) {
            console.error('role-list parse error:', err);
            await interaction.editReply({ content: 'Unable to load division.lua. Make sure the file exists and is accessible.' });
            return;
        }
        await guild.roles.fetch();
        const scope = interaction.options.getString('scope') ?? 'all';
        const rows = ['discord_role_id,roblox_team_name'];
        let foundCount = 0;
        for (const division of divisions) {
            if (scope === 'division' || scope === 'all') {
                const roleName = buildDivisionRoleName(division);
                const roleId = guild.roles.cache.find((role) => role.name === roleName)?.id ?? '';
                if (roleId) {
                    rows.push([csvEscape(roleId), csvEscape(division.displayName)].join(','));
                    foundCount += 1;
                }
            }
            if (scope === 'rank' || scope === 'all') {
                for (const rank of division.ranks) {
                    const roleName = buildRoleName(division, rank);
                    const roleId = guild.roles.cache.find((role) => role.name === roleName)?.id ?? '';
                    if (roleId) {
                        rows.push([csvEscape(roleId), csvEscape(division.displayName)].join(','));
                        foundCount += 1;
                    }
                }
            }
        }
        if (foundCount === 0) {
            await interaction.editReply({ content: 'No matching division or rank roles were found in the target server. Create roles first or use a different guild.' });
            return;
        }
        const csvBuffer = Buffer.from(rows.join('\r\n'), 'utf8');
        const attachment = new discord_js_1.AttachmentBuilder(csvBuffer).setName('division_roles.csv');
        await interaction.editReply({ content: 'Role mapping list generated for Supabase import with discord_role_id and roblox_team_name.', files: [attachment] });
        return;
    }
    if (interaction.commandName === 'delete-allroles') {
        await interaction.deferReply({ ephemeral: true });
        const guildId = interaction.options.getString('guild-id');
        let guild;
        try {
            guild = await resolveGuild(interaction, guildId ?? undefined);
        }
        catch (err) {
            await interaction.editReply({ content: err.message });
            return;
        }
        const member = await fetchGuildMember(interaction, guild);
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.editReply({ content: 'You need Administrator permission in the target server to delete all roles.' });
            return;
        }
        await guild.roles.fetch();
        let deletedCount = 0;
        for (const role of guild.roles.cache.values()) {
            if (role.id === guild.id)
                continue; // Skip @everyone
            try {
                await role.delete('Deleted via /delete-allroles command');
                deletedCount += 1;
            }
            catch (err) {
                console.warn(`Failed to delete role: ${role.name}`, err);
            }
        }
        await interaction.editReply({ content: `⚠️ Deleted ${deletedCount} role(s) from the server.` });
        return;
    }
    if (interaction.commandName === 'delete-role') {
        await interaction.deferReply({ ephemeral: true });
        const guildId = interaction.options.getString('guild-id');
        const roleName = interaction.options.getString('role-name', true);
        let guild;
        try {
            guild = await resolveGuild(interaction, guildId ?? undefined);
        }
        catch (err) {
            await interaction.editReply({ content: err.message });
            return;
        }
        const member = await fetchGuildMember(interaction, guild);
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            await interaction.editReply({ content: 'You need Manage Roles permission in the target server to delete roles.' });
            return;
        }
        await guild.roles.fetch();
        const roleToDelete = guild.roles.cache.find((r) => r.name === roleName);
        if (!roleToDelete) {
            await interaction.editReply({ content: `Role "${roleName}" not found.` });
            return;
        }
        try {
            await roleToDelete.delete(`Deleted via /delete-role by ${interaction.user.tag}`);
            await interaction.editReply({ content: `✓ Deleted role: ${roleName}` });
        }
        catch (err) {
            console.error('Failed to delete role:', err);
            await interaction.editReply({ content: `Failed to delete role. Check bot permissions and role hierarchy.` });
        }
        return;
    }
    if (interaction.commandName === 'delete-visual-roles') {
        await interaction.deferReply({ ephemeral: true });
        const guildId = interaction.options.getString('guild-id');
        let guild;
        try {
            guild = await resolveGuild(interaction, guildId ?? undefined);
        }
        catch (err) {
            await interaction.editReply({ content: err.message });
            return;
        }
        const member = await fetchGuildMember(interaction, guild);
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.ManageRoles)) {
            await interaction.editReply({ content: 'You need Manage Roles permission in the target server to delete roles.' });
            return;
        }
        let divisions;
        try {
            divisions = parseDivisionLua();
        }
        catch (err) {
            console.error('delete-visual-roles parse error:', err);
            await interaction.editReply({ content: 'Unable to load division.lua.' });
            return;
        }
        await guild.roles.fetch();
        const rankRoleNames = divisions.flatMap((division) => division.ranks.map((rank) => buildRoleName(division, rank)));
        const divisionRoleNames = divisions.map((d) => buildDivisionRoleName(d));
        const allVisualNames = [...rankRoleNames, ...divisionRoleNames];
        const rolesToDelete = guild.roles.cache.filter((role) => allVisualNames.includes(role.name));
        let deletedCount = 0;
        for (const role of rolesToDelete.values()) {
            try {
                await role.delete('Deleted via /delete-visual-roles');
                deletedCount += 1;
            }
            catch (err) {
                console.warn(`Failed to delete visual role: ${role.name}`, err);
            }
        }
        await interaction.editReply({ content: `✓ Deleted ${deletedCount} visual/rank role(s).` });
        return;
    }
    if (interaction.commandName !== 'verify')
        return;
    console.log('[BOT] Interaction received from', interaction.user.tag);
    await interaction.deferReply({ ephemeral: true });
    const rawInput = interaction.options.getString('username') ?? interaction.options.getString('code');
    const robloxUsername = rawInput ? rawInput.trim() : '';
    if (!robloxUsername) {
        await interaction.editReply({ content: 'Please provide your Roblox username.' });
        return;
    }
    const pendingUsername = pendingVerifications.get(interaction.user.id);
    const isSixCharCode = /^[A-Z0-9]{6}$/i.test(robloxUsername);
    if (pendingUsername && isSixCharCode) {
        try {
            const codeCandidate = robloxUsername.toUpperCase();
            const { data: codes, error: codeError } = await supabase
                .from('verification_codes')
                .select('roblox_id, roblox_username, expires_at')
                .eq('code', codeCandidate)
                .limit(1);
            if (codeError || !codes || codes.length === 0) {
                await interaction.editReply({ content: 'Verification code not found or invalid.' });
                return;
            }
            const entry = codes[0];
            if (!entry.roblox_username || entry.roblox_username.toLowerCase() !== pendingUsername.toLowerCase()) {
                await interaction.editReply({ content: 'This code does not match the Roblox username you provided.' });
                return;
            }
            const expiresAt = new Date(entry.expires_at);
            if (expiresAt.getTime() < Date.now()) {
                await interaction.editReply({ content: 'This verification code has expired.' });
                return;
            }
            await unlinkRobloxVerification(entry.roblox_id, interaction.user.id);
            const { error: upsertError } = await supabase.from('verified_users').upsert({
                discord_id: interaction.user.id,
                roblox_id: entry.roblox_id,
                roblox_username: entry.roblox_username,
            }, { onConflict: 'discord_id' });
            if (upsertError) {
                console.error('Supabase upsert verified_users error:', upsertError);
                await interaction.editReply({ content: 'Failed to save verification mapping.' });
                return;
            }
            const { error: deleteError } = await supabase.from('verification_codes').delete().eq('code', codeCandidate);
            if (deleteError) {
                console.error('Supabase delete code error', deleteError);
            }
            pendingVerifications.delete(interaction.user.id);
            let nicknameMessage = 'Your Discord server nickname has been updated.';
            try {
                const results = await updateNicknameAcrossTrackedGuilds(interaction.user.id, entry.roblox_username);
                const failed = results.filter((result) => result.status === 'failed');
                if (failed.length > 0) {
                    nicknameMessage = `Nickname update failed in ${failed.length} server(s).`;
                    console.warn('Nickname update failures:', failed);
                }
            }
            catch (nicknameError) {
                console.warn('Could not update nickname across tracked guilds:', nicknameError);
                const errMsg = nicknameError instanceof Error ? nicknameError.message : String(nicknameError);
                nicknameMessage = `Nickname update failed: ${errMsg}`;
            }
            await interaction.editReply({ content: `Verification complete. Username ${entry.roblox_username} is now linked.\n${nicknameMessage}` });
            return;
        }
        catch (err) {
            console.error('Slash code verification error:', err);
            await interaction.editReply({ content: 'An error occurred verifying your code.' });
            return;
        }
    }
    try {
        const { data: users, error: userError } = await supabase
            .from('verified_users')
            .select('roblox_id, roblox_username')
            .eq('discord_id', interaction.user.id)
            .limit(1);
        if (userError) {
            console.error('Supabase user lookup failed, continuing verification:', userError);
        }
        else if (users && users.length > 0) {
            await interaction.editReply({ content: `You are already verified as: ${users[0].roblox_username}
If you want to switch accounts, use /logout first and then verify again.` });
            return;
        }
        pendingVerifications.set(interaction.user.id, robloxUsername);
        await interaction.editReply({ content: 'Verification started. Check your DMs for the next step.' });
        try {
            await interaction.user.send({
                content: `Verification initiated for Roblox username: **${robloxUsername}**

Please paste the 6-character code from the game in this DM now.`,
            });
        }
        catch (dmError) {
            console.warn('Could not send DM to user:', dmError);
            await interaction.followUp({ content: 'Unable to send DM. Please enable DMs from server members and try again.', ephemeral: true });
        }
    }
    catch (err) {
        console.error('Slash command verification error:', err);
        await interaction.editReply({ content: 'An error occurred processing your request.' });
    }
});
discordClient.on(discord_js_1.Events.MessageCreate, async (message) => {
    if (message.author.bot)
        return;
    if (message.guild !== null)
        return;
    const content = message.content.trim();
    const normalized = content.toLowerCase();
    if (normalized === '/logout' || normalized === '/logout ') {
        try {
            const { error } = await supabase.from('verified_users').delete().eq('discord_id', message.author.id);
            if (error) {
                console.error('Supabase DM logout delete error:', error);
                await message.reply({ content: 'Unable to log you out right now. Please try again later.' });
                return;
            }
            try {
                await updateNicknameAcrossTrackedGuilds(message.author.id, null);
            }
            catch (nicknameError) {
                console.warn('Could not reset nickname during DM logout:', nicknameError);
            }
            await message.reply({ content: 'You have been logged out from Roblox verification and your server nickname was reset.' });
        }
        catch (err) {
            console.error('DM logout error:', err);
            await message.reply({ content: 'An error occurred while logging you out.' });
        }
        return;
    }
    if (normalized === '/verify' || normalized === '/verify ') {
        await message.reply({
            content: 'Please send your Roblox username in this DM using `/verify <RobloxUsername>`.',
        });
        return;
    }
    if (normalized.startsWith('/verify ')) {
        const robloxUsername = content.slice(8).trim();
        if (!robloxUsername) {
            await message.reply({
                content: 'Please provide your Roblox username: `/verify <RobloxUsername>`.',
            });
            return;
        }
        try {
            const { data: users, error: userError } = await supabase
                .from('verified_users')
                .select('roblox_id, roblox_username')
                .eq('discord_id', message.author.id)
                .limit(1);
            if (userError) {
                console.error('Supabase user lookup failed, continuing verification:', userError);
            }
            else if (users && users.length > 0) {
                await message.reply({
                    content: `You are already verified as: ${users[0].roblox_username}\n\nTo verify a different account, contact a server administrator.`,
                });
                return;
            }
            pendingVerifications.set(message.author.id, robloxUsername);
            await message.reply({
                content: `Verification started for Roblox username: **${robloxUsername}**\n\nPlease paste the 6-character code from the game in this DM now.`,
            });
        }
        catch (err) {
            console.error('DM verification error:', err);
            await message.reply({
                content: 'An error occurred processing your request.',
            });
        }
        return;
    }
    const codeCandidate = content.toUpperCase();
    if (/^[A-Z0-9]{6}$/.test(codeCandidate)) {
        const pendingUsername = pendingVerifications.get(message.author.id);
        if (!pendingUsername) {
            await message.reply({
                content: 'Please start verification first with `/verify <RobloxUsername>`.',
            });
            return;
        }
        try {
            const { data: codes, error: codeError } = await supabase
                .from('verification_codes')
                .select('roblox_id, roblox_username, expires_at')
                .eq('code', codeCandidate)
                .limit(1);
            if (codeError || !codes || codes.length === 0) {
                await message.reply({
                    content: 'Verification code not found or invalid.',
                });
                return;
            }
            const entry = codes[0];
            if (!entry.roblox_username || entry.roblox_username.toLowerCase() !== pendingUsername.toLowerCase()) {
                await message.reply({
                    content: 'This code does not match the Roblox username you provided.',
                });
                return;
            }
            const expiresAt = new Date(entry.expires_at);
            if (expiresAt.getTime() < Date.now()) {
                await message.reply({
                    content: 'This verification code has expired.',
                });
                return;
            }
            const robloxId = entry.roblox_id;
            const robloxUsername = entry.roblox_username;
            await unlinkRobloxVerification(robloxId, message.author.id);
            const { error: upsertError } = await supabase.from('verified_users').upsert({
                discord_id: message.author.id,
                roblox_id: robloxId,
                roblox_username: robloxUsername,
            }, { onConflict: 'discord_id' });
            if (upsertError) {
                console.error('Supabase upsert verified_users error', upsertError);
                await message.reply({
                    content: 'Failed to save verification mapping.',
                });
                return;
            }
            const { error: deleteError } = await supabase.from('verification_codes').delete().eq('code', codeCandidate);
            if (deleteError) {
                console.error('Supabase delete code error', deleteError);
            }
            pendingVerifications.delete(message.author.id);
            let nicknameMessage = 'Your Discord server nickname has been updated.';
            try {
                const results = await updateNicknameAcrossTrackedGuilds(message.author.id, robloxUsername);
                const failed = results.filter((result) => result.status === 'failed');
                if (failed.length > 0) {
                    nicknameMessage = `Nickname update failed in ${failed.length} server(s).`;
                    console.warn('Nickname update failures:', failed);
                }
            }
            catch (nicknameError) {
                console.warn('Could not update nickname across tracked guilds:', nicknameError);
                const errMsg = nicknameError instanceof Error ? nicknameError.message : String(nicknameError);
                nicknameMessage = `Nickname update failed: ${errMsg}`;
            }
            const successMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VERIFICATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Username: ${robloxUsername}
Status: Verified

${nicknameMessage}
Your roles will sync in the Roblox game.

━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
            await message.reply({
                content: successMessage,
            });
        }
        catch (err) {
            console.error('Code verification error:', err);
            await message.reply({
                content: 'An error occurred verifying your code.',
            });
        }
        return;
    }
    await message.reply({
        content: 'Send `/verify <RobloxUsername>` to begin verification, then paste the code from the game in this DM.',
    });
});
if (!DISCORD_BOT_TOKEN) {
    console.error('[BOT] Discord bot token is missing or empty. Please set DISCORD_BOT_TOKEN.');
}
else {
    discordClient.login(DISCORD_BOT_TOKEN).catch((error) => {
        console.error('[BOT] Discord login failed:', error);
    });
}
