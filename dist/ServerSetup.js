"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerSetup = exports.CATEGORIES = void 0;
const discord_js_1 = require("discord.js");
const Logger_js_1 = require("./utils/Logger.js");
const roles_js_1 = require("./roles.js");
const roleCreator_js_1 = require("./utils/roleCreator.js");
exports.CATEGORIES = [
    {
        name: '📜 INFORMATION',
        channels: [
            { name: 'welcome', type: discord_js_1.ChannelType.GuildText, topic: 'Welcome to Harval MC!' },
            { name: 'rules', type: discord_js_1.ChannelType.GuildText, topic: 'Server rules and guidelines' },
            { name: 'faq', type: discord_js_1.ChannelType.GuildText, topic: 'Frequently asked questions' },
            { name: 'server-ip', type: discord_js_1.ChannelType.GuildText, topic: 'Server IP and connection info' },
            { name: 'announcements', type: discord_js_1.ChannelType.GuildText, topic: 'Server announcements' },
            { name: 'updates', type: discord_js_1.ChannelType.GuildText, topic: 'Server updates and changelogs' },
            { name: 'verify', type: discord_js_1.ChannelType.GuildText, topic: 'Verify your Minecraft account' },
            { name: 'how-tier-testing-works', type: discord_js_1.ChannelType.GuildText, topic: 'How tier testing works' },
            { name: 'staff', type: discord_js_1.ChannelType.GuildText, topic: 'Staff team listing' },
            { name: 'roles', type: discord_js_1.ChannelType.GuildText, topic: 'Role information and applications' },
        ],
    },
    {
        name: '💬 COMMUNITY',
        channels: [
            { name: 'general', type: discord_js_1.ChannelType.GuildText, topic: 'General chat' },
            { name: 'minecraft-chat', type: discord_js_1.ChannelType.GuildText, topic: 'Minecraft discussion' },
            { name: 'clips', type: discord_js_1.ChannelType.GuildText, topic: 'Share your PvP clips' },
            { name: 'screenshots', type: discord_js_1.ChannelType.GuildText, topic: 'Share screenshots' },
            { name: 'media', type: discord_js_1.ChannelType.GuildText, topic: 'Media sharing' },
            { name: 'polls', type: discord_js_1.ChannelType.GuildText, topic: 'Server polls' },
            { name: 'suggestions', type: discord_js_1.ChannelType.GuildText, topic: 'Server suggestions' },
            { name: 'off-topic', type: discord_js_1.ChannelType.GuildText, topic: 'Off-topic discussion' },
        ],
    },
    {
        name: '🎫 SUPPORT',
        channels: [
            { name: 'create-ticket', type: discord_js_1.ChannelType.GuildText, topic: 'Create a support ticket' },
            { name: 'bug-report', type: discord_js_1.ChannelType.GuildText, topic: 'Report bugs' },
            { name: 'report-player', type: discord_js_1.ChannelType.GuildText, topic: 'Report a player' },
            { name: 'appeal', type: discord_js_1.ChannelType.GuildText, topic: 'Ban/mute appeals' },
            { name: 'questions', type: discord_js_1.ChannelType.GuildText, topic: 'Ask questions' },
        ],
    },
    {
        name: '⚔️ TIER TESTING',
        channels: [
            { name: 'request-tier-test', type: discord_js_1.ChannelType.GuildText, topic: 'Request a tier test' },
            { name: 'queue', type: discord_js_1.ChannelType.GuildText, topic: 'Live queue display' },
            { name: 'tier-results', type: discord_js_1.ChannelType.GuildText, topic: 'Tier test results' },
            { name: 'leaderboards', type: discord_js_1.ChannelType.GuildText, topic: 'Tier leaderboards' },
            { name: 'tier-information', type: discord_js_1.ChannelType.GuildText, topic: 'Tier information and requirements' },
            { name: 'retest-request', type: discord_js_1.ChannelType.GuildText, topic: 'Request a retest' },
        ],
    },
    {
        name: '🛡️ STAFF',
        channels: [
            { name: 'staff-chat', type: discord_js_1.ChannelType.GuildText, topic: 'Staff discussion' },
            { name: 'commands', type: discord_js_1.ChannelType.GuildText, topic: 'Bot commands' },
            { name: 'claims', type: discord_js_1.ChannelType.GuildText, topic: 'Ticket claims' },
            { name: 'applications', type: discord_js_1.ChannelType.GuildText, topic: 'Staff/Tester applications' },
            { name: 'reports', type: discord_js_1.ChannelType.GuildText, topic: 'Reports' },
            { name: 'moderation', type: discord_js_1.ChannelType.GuildText, topic: 'Moderation actions' },
        ],
    },
    {
        name: '📋 LOGS',
        channels: [
            { name: 'ticket-logs', type: discord_js_1.ChannelType.GuildText, topic: 'Ticket logs' },
            { name: 'tier-logs', type: discord_js_1.ChannelType.GuildText, topic: 'Tier test logs' },
            { name: 'bot-logs', type: discord_js_1.ChannelType.GuildText, topic: 'Bot logs' },
            { name: 'error-logs', type: discord_js_1.ChannelType.GuildText, topic: 'Error logs' },
            { name: 'join-leave', type: discord_js_1.ChannelType.GuildText, topic: 'Join/leave logs' },
            { name: 'role-logs', type: discord_js_1.ChannelType.GuildText, topic: 'Role change logs' },
            { name: 'verification-logs', type: discord_js_1.ChannelType.GuildText, topic: 'Verification logs' },
            { name: 'command-logs', type: discord_js_1.ChannelType.GuildText, topic: 'Command usage logs' },
        ],
    },
    {
        name: '🔊 VOICE',
        channels: [
            { name: 'general-1', type: discord_js_1.ChannelType.GuildVoice },
            { name: 'general-2', type: discord_js_1.ChannelType.GuildVoice },
            { name: 'afk', type: discord_js_1.ChannelType.GuildVoice },
            { name: 'staff-vc', type: discord_js_1.ChannelType.GuildVoice },
            { name: 'meeting-room', type: discord_js_1.ChannelType.GuildVoice },
        ],
    },
];
class ServerSetup {
    static CATEGORIES = exports.CATEGORIES;
    client;
    guild;
    roleCreator;
    createdCategories = new Map();
    createdChannels = new Map();
    roleMap = new Map();
    constructor(client, guild, token) {
        this.client = client;
        this.guild = guild;
        this.roleCreator = new roleCreator_js_1.RoleCreator(token, guild.id);
    }
    async createAllRoles() {
        Logger_js_1.Logger.info('Starting role creation...');
        const roleData = roles_js_1.ALL_ROLES.map(role => ({
            name: role.name,
            color: role.color,
        }));
        const created = await this.roleCreator.createRolesSequentially(roleData);
        Logger_js_1.Logger.success(`Created/fetched ${created.size} roles`);
        return created;
    }
    async createAllCategoriesAndChannels() {
        Logger_js_1.Logger.info('Creating categories and channels...');
        const everyoneRole = this.guild.roles.everyone;
        const staffRoles = [...this.guild.roles.cache.filter(r => roles_js_1.STAFF_ROLE_NAMES.includes(r.name)).values()];
        const verifiedRole = this.guild.roles.cache.find(r => r.name === '✅ Verified');
        const mutedRole = this.guild.roles.cache.find(r => r.name === '🔇 Muted');
        const staffAllow = [
            discord_js_1.PermissionFlagsBits.ViewChannel,
            discord_js_1.PermissionFlagsBits.SendMessages,
            discord_js_1.PermissionFlagsBits.ReadMessageHistory,
            discord_js_1.PermissionFlagsBits.ManageMessages,
            discord_js_1.PermissionFlagsBits.ManageChannels,
        ];
        const everyoneDeny = [discord_js_1.PermissionFlagsBits.ViewChannel];
        const everyoneAllow = [
            discord_js_1.PermissionFlagsBits.ViewChannel,
            discord_js_1.PermissionFlagsBits.SendMessages,
            discord_js_1.PermissionFlagsBits.ReadMessageHistory,
        ];
        const mutedDeny = [
            discord_js_1.PermissionFlagsBits.SendMessages,
            discord_js_1.PermissionFlagsBits.AddReactions,
            discord_js_1.PermissionFlagsBits.CreatePublicThreads,
            discord_js_1.PermissionFlagsBits.CreatePrivateThreads,
        ];
        for (const categoryConfig of exports.CATEGORIES) {
            const category = await this.createCategory(categoryConfig.name, everyoneRole, staffRoles, verifiedRole, mutedRole);
            for (const channelConfig of categoryConfig.channels) {
                await this.createChannel(category, channelConfig, everyoneRole, staffRoles, verifiedRole, mutedRole);
            }
        }
        Logger_js_1.Logger.success('All categories and channels created');
    }
    async createCategory(name, everyoneRole, staffRoles, verifiedRole, mutedRole) {
        const existing = this.guild.channels.cache.find(c => c.type === discord_js_1.ChannelType.GuildCategory && c.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            this.createdCategories.set(name.toLowerCase(), existing);
            return existing;
        }
        const permissionOverwrites = [
            { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel], type: 'role' },
        ];
        for (const role of staffRoles) {
            permissionOverwrites.push({
                id: role.id,
                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory, discord_js_1.PermissionFlagsBits.ManageMessages, discord_js_1.PermissionFlagsBits.ManageChannels],
                type: 'role',
            });
        }
        if (verifiedRole) {
            permissionOverwrites.push({
                id: verifiedRole.id,
                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                type: 'role',
            });
        }
        if (mutedRole) {
            permissionOverwrites.push({
                id: mutedRole.id,
                deny: [discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.AddReactions, discord_js_1.PermissionFlagsBits.CreatePublicThreads, discord_js_1.PermissionFlagsBits.CreatePrivateThreads],
                type: 'role',
            });
        }
        const category = await this.guild.channels.create({
            name,
            type: discord_js_1.ChannelType.GuildCategory,
            permissionOverwrites: permissionOverwrites,
            reason: 'Auto-created category for Harval MC',
        });
        this.createdCategories.set(name.toLowerCase(), category);
        Logger_js_1.Logger.success(`Created category: ${name}`);
        return category;
    }
    async createChannel(category, config, everyoneRole, staffRoles, verifiedRole, mutedRole) {
        const existing = this.guild.channels.cache.find(c => c.parentId === category.id && c.name.toLowerCase() === config.name.toLowerCase());
        if (existing) {
            this.createdChannels.set(`${category.name.toLowerCase()}.${config.name.toLowerCase()}`, existing);
            return existing;
        }
        const permissionOverwrites = [
            { id: everyoneRole.id, deny: [discord_js_1.PermissionFlagsBits.ViewChannel], type: 'role' },
        ];
        for (const role of staffRoles) {
            permissionOverwrites.push({
                id: role.id,
                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory, discord_js_1.PermissionFlagsBits.ManageMessages],
                type: 'role',
            });
        }
        if (verifiedRole && !['staff-chat', 'commands', 'claims', 'applications', 'reports', 'moderation'].includes(config.name)) {
            permissionOverwrites.push({
                id: verifiedRole.id,
                allow: [discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.ReadMessageHistory],
                type: 'role',
            });
        }
        if (mutedRole) {
            permissionOverwrites.push({
                id: mutedRole.id,
                deny: [discord_js_1.PermissionFlagsBits.SendMessages, discord_js_1.PermissionFlagsBits.AddReactions, discord_js_1.PermissionFlagsBits.CreatePublicThreads, discord_js_1.PermissionFlagsBits.CreatePrivateThreads],
                type: 'role',
            });
        }
        const createOptions = {
            name: config.name,
            type: config.type,
            parent: category.id,
            permissionOverwrites: permissionOverwrites,
            reason: `Auto-created channel for Harval MC`,
        };
        if (config.topic) {
            createOptions.topic = config.topic;
        }
        const channel = await this.guild.channels.create(createOptions);
        this.createdChannels.set(`${category.name.toLowerCase()}.${config.name.toLowerCase()}`, channel);
        Logger_js_1.Logger.success(`Created channel: #${config.name} in ${category.name}`);
        return channel;
    }
    async postAllPanels() {
        Logger_js_1.Logger.info('Posting interactive panels...');
        await this.postWelcomePanel();
        await this.postRulesPanel();
        await this.postFaqPanel();
        await this.postVerifyPanel();
        await this.postTierTestPanel();
        await this.postQueuePanel();
        await this.postRolesPanel();
        await this.postStaffPanel();
        Logger_js_1.Logger.success('All panels posted');
    }
    getChannel(categoryName, channelName) {
        return this.createdChannels.get(`${categoryName.toLowerCase()}.${channelName.toLowerCase()}`);
    }
    async sendPanel(channelName, categoryName, content) {
        const channel = this.getChannel(categoryName, channelName);
        if (!channel) {
            Logger_js_1.Logger.warn(`Channel #${channelName} not found in ${categoryName}`);
            return;
        }
        try {
            await channel.send(content);
            Logger_js_1.Logger.success(`Posted panel in #${channelName}`);
        }
        catch (error) {
            Logger_js_1.Logger.error(`Failed to post panel in #${channelName}`, error);
        }
    }
    async postWelcomePanel() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🏰 Welcome to Harval MC')
            .setDescription('The premier Minecraft PvP Tier Testing Network!\n\n' +
            '🌐 **Server IP:** `play.harvalmc.net`\n' +
            '📊 **26 Game Modes** • **10 Tiers Each** • **260 Unique Ranks**\n\n' +
            'Test your skills, climb the ranks, and prove you\'re the best!')
            .setColor(0xFFD700)
            .addFields({ name: '🎮 Game Modes', value: 'Sword • Crystal • SMP • Netherite Pot • Diamond Pot • UHC • BuildUHC • NoDebuff • Combo • Gapple • OP Duel • Boxing • Axe • Mace • Anchor • Cart PvP • Bedwars • Skywars • Bridge • Nodebuff • Vanilla • Crossbow • Trident • Shield • Elytra Combat • Custom Duel', inline: false }, { name: '📋 Quick Links', value: '• [Rules](#rules)\n• [FAQ](#faq)\n• [Verify](#verify)\n• [Request Tier Test](#request-tier-test)\n• [Staff Applications](#staff-apply)', inline: true }, { name: '📊 Quick Stats', value: '• 281 Unique Roles\n• 26 Game Modes\n• 10 Tiers Each\n• Active Testing Daily', inline: true })
            .setThumbnail('https://i.imgur.com/HarvalMC.png')
            .setFooter({ text: 'Harval MC • Tier Testing Network', iconURL: 'https://i.imgur.com/HarvalMC.png' });
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('copy_ip')
            .setLabel('📋 Copy Server IP')
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId('verify_btn')
            .setLabel('✅ Get Verified')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('request_test')
            .setLabel('⚔️ Request Tier Test')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        await this.sendPanel('welcome', 'INFORMATION', { embeds: [embed], components: [row] });
    }
    async postRulesPanel() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('📜 Harval MC Server Rules')
            .setColor(0xFF0000)
            .setDescription('Failure to follow these rules will result in punishment.')
            .addFields({ name: '1️⃣ Respect Everyone', value: 'No harassment, discrimination, hate speech, or toxicity. Treat all players and staff with respect.', inline: false }, { name: '2️⃣ No Cheating', value: 'No hacked clients, autoclickers, macros, or any unfair advantages. This includes both in-game and on Discord.', inline: false }, { name: '3️⃣ No Alting', value: 'Do not use alternate accounts to evade punishments, boost stats, or manipulate leaderboards.', inline: false }, { name: '4️⃣ English Only', value: 'Keep all public chat in English. Other languages allowed in DMs and private channels.', inline: false }, { name: '5️⃣ No Advertising', value: 'No advertising other servers, Discord servers, YouTube channels, or any external content without permission.', inline: false }, { name: '6️⃣ Appropriate Content', value: 'No NSFW, gore, shocking content, or inappropriate usernames/avatars.', inline: false }, { name: '7️⃣ No Drama', value: 'Don\'t start drama, witch hunts, or call-out posts. Use tickets for reports.', inline: false }, { name: '8️⃣ Staff Decisions Final', value: 'Staff have final say. If you disagree, make a ticket - don\'t argue in public.', inline: false })
            .setFooter({ text: 'Harval MC • Last Updated: July 2025' });
        await this.sendPanel('rules', 'INFORMATION', { embeds: [embed] });
    }
    async postFaqPanel() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('❓ Frequently Asked Questions')
            .setColor(0x00FFFF)
            .setDescription('Common questions about Harval MC tier testing')
            .addFields({ name: 'What is tier testing?', value: 'Tier testing evaluates your PvP skill in specific game modes and assigns you a rank (LT 1 - HT 5).', inline: false }, { name: 'How do I get tested?', value: 'Click "Request Tier Test" in #request-tier-test, fill out the modal, and a tester will contact you.', inline: false }, { name: 'What are the tiers?', value: 'LT 1 → HT 1 → LT 2 → HT 2 → LT 3 → HT 3 → LT 4 → HT 4 → LT 5 → HT 5 (LT = Low Tier, HT = High Tier)', inline: false }, { name: 'How long does a test take?', value: 'Typically 10-30 minutes depending on the game mode and tester availability.', inline: false }, { name: 'Can I retest?', value: 'Yes! You can request a retest after 7 days if you feel your rank is inaccurate.', inline: false }, { name: 'Do I need to be verified?', value: 'Yes, you must be verified (✅ Verified role) to request a tier test.', inline: false }, { name: 'What if I disagree with my tier?', value: 'Open a retest request in #retest-request with evidence. Staff will review.', inline: false }, { name: 'How do I become a tester?', value: 'Apply using the "Tester Apply" button in #roles. Requirements: HT 3+ in at least 3 modes.', inline: false }, { name: 'What is the server IP?', value: '`play.harvalmc.net` (Java Edition)', inline: false }, { name: 'Bedrock support?', value: 'Currently Java Edition only. Bedrock support planned for the future.', inline: false })
            .setFooter({ text: 'Harval MC • FAQ' });
        await this.sendPanel('faq', 'INFORMATION', { embeds: [embed] });
    }
    async postVerifyPanel() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('✅ Verification')
            .setColor(0x00FF00)
            .setDescription('Verify your Minecraft account to access tier testing, leaderboards, and more!\n\n' +
            'Click the button below and enter your exact Minecraft IGN.')
            .addFields({ name: 'Requirements', value: '• Valid Minecraft Java account\n• Not banned from Harval MC\n• One account per Discord user', inline: false }, { name: 'Benefits', value: '• Access to tier testing\n• Role assignment on tier achievement\n• Leaderboard eligibility\n• Priority support', inline: false })
            .setFooter({ text: 'Harval MC • Verification' });
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('verify_modal')
            .setLabel('✅ Verify Account')
            .setStyle(discord_js_1.ButtonStyle.Success));
        await this.sendPanel('verify', 'INFORMATION', { embeds: [embed], components: [row] });
    }
    async postTierTestPanel() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('⚔️ Request Tier Test')
            .setColor(0xFF4500)
            .setDescription('Ready to prove your skill? Request a tier test for any of our 26 game modes!\n\n' +
            '**Requirements:**\n' +
            '• ✅ Verified role\n' +
            '• Java Edition Minecraft\n' +
            '• Available for 15-30 minutes\n\n' +
            'A tester will create a private ticket and guide you through the process.')
            .addFields({ name: '🎮 Available Modes (26)', value: 'Sword • Crystal • SMP • Netherite Pot • Diamond Pot • UHC • BuildUHC • NoDebuff • Combo • Gapple • OP Duel • Boxing • Axe • Mace • Anchor • Cart PvP • Bedwars • Skywars • Bridge • Nodebuff • Vanilla • Crossbow • Trident • Shield • Elytra Combat • Custom Duel', inline: false }, { name: '🏆 Tiers', value: 'LT 1 → HT 1 → LT 2 → HT 2 → LT 3 → HT 3 → LT 4 → HT 4 → LT 5 → HT 5', inline: false })
            .setFooter({ text: 'Harval MC • Tier Testing' });
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('request_tier_test')
            .setLabel('⚔️ Request Tier Test')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        await this.sendPanel('request-tier-test', 'TIER TESTING', { embeds: [embed], components: [row] });
    }
    async postQueuePanel() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('📋 Live Queue')
            .setColor(0x00FFFF)
            .setDescription('Current tier testing queue - updated in real-time')
            .addFields({ name: 'Status', value: 'No players currently in queue', inline: false }, { name: 'Next Up', value: '—', inline: true }, { name: 'Estimated Wait', value: '—', inline: true })
            .setFooter({ text: 'Harval MC • Queue Updates Every 30s' });
        await this.sendPanel('queue', 'TIER TESTING', { embeds: [embed] });
    }
    async postRolesPanel() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🎭 Roles & Applications')
            .setColor(0x9370DB)
            .setDescription('Apply for staff or tier tester positions!')
            .addFields({ name: '📝 Staff Application', value: 'Requirements:\n• 14+ years old\n• Discord experience\n• Mature & responsible\n• Active in community', inline: true }, { name: '⚔️ Tester Application', value: 'Requirements:\n• HT 3+ in 3+ modes\n• 50+ tier tests conducted\n• Known by staff team\n• Excellent communication', inline: true }, { name: '💎 Support Team', value: 'Requirements:\n• Helpful & patient\n• Good communication\n• Active in #questions\n• Verified member', inline: true })
            .setFooter({ text: 'Harval MC • Applications' });
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('staff_apply')
            .setLabel('📝 Staff Apply')
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId('tester_apply')
            .setLabel('⚔️ Tester Apply')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        await this.sendPanel('roles', 'INFORMATION', { embeds: [embed], components: [row] });
    }
    async postStaffPanel() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🎫 Support Tickets')
            .setColor(0x00FF7F)
            .setDescription('Need help? Create a support ticket!')
            .addFields({ name: '📋 Ticket Types', value: '• General Support\n• Bug Reports\n• Player Reports\n• Ban/Mute Appeals\n• Questions', inline: false }, { name: '⏱️ Response Time', value: 'Typically within 15 minutes during peak hours', inline: true }, { name: '📝 Required Info', value: 'Subject + Description\nScreenshots encouraged', inline: true })
            .setFooter({ text: 'Harval MC • Support' });
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('🎫 Create Ticket')
            .setStyle(discord_js_1.ButtonStyle.Primary));
        await this.sendPanel('create-ticket', 'SUPPORT', { embeds: [embed], components: [row] });
    }
    // Interactive handlers
    static createVerifyModal() {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('verify_modal_submit')
            .setTitle('✅ Verify Minecraft Account');
        const ignInput = new discord_js_1.TextInputBuilder()
            .setCustomId('minecraft_ign')
            .setLabel('Minecraft IGN (Exact)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('Notch')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(16);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(ignInput));
        return modal;
    }
    static createTierTestModal() {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('tier_test_modal_submit')
            .setTitle('⚔️ Request Tier Test');
        const modeInput = new discord_js_1.TextInputBuilder()
            .setCustomId('game_mode')
            .setLabel('Game Mode (Exact Name)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('Sword, Crystal, UHC, Bedwars, etc.')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(20);
        const ignInput = new discord_js_1.TextInputBuilder()
            .setCustomId('player_ign')
            .setLabel('Your Minecraft IGN')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('Notch')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(16);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(modeInput), new discord_js_1.ActionRowBuilder().addComponents(ignInput));
        return modal;
    }
    static createTicketModal() {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('ticket_modal_submit')
            .setTitle('🎫 Create Support Ticket');
        const subjectInput = new discord_js_1.TextInputBuilder()
            .setCustomId('ticket_subject')
            .setLabel('Subject')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('Bug Report, Player Report, Appeal, etc.')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(50);
        const descriptionInput = new discord_js_1.TextInputBuilder()
            .setCustomId('ticket_description')
            .setLabel('Description')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('Describe your issue in detail...')
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(1000);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(subjectInput), new discord_js_1.ActionRowBuilder().addComponents(descriptionInput));
        return modal;
    }
    static createStaffApplyModal() {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('staff_apply_modal_submit')
            .setTitle('📝 Staff Application');
        const ageInput = new discord_js_1.TextInputBuilder()
            .setCustomId('staff_age')
            .setLabel('Age')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('14')
            .setRequired(true);
        const expInput = new discord_js_1.TextInputBuilder()
            .setCustomId('staff_experience')
            .setLabel('Previous Experience')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('Describe your moderation/admin experience...')
            .setRequired(true)
            .setMaxLength(1000);
        const whyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('staff_why')
            .setLabel('Why Harval MC?')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('Why do you want to join our staff team?')
            .setRequired(true)
            .setMaxLength(1000);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(ageInput), new discord_js_1.ActionRowBuilder().addComponents(expInput), new discord_js_1.ActionRowBuilder().addComponents(whyInput));
        return modal;
    }
    static createTesterApplyModal() {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('tester_apply_modal_submit')
            .setTitle('⚔️ Tester Application');
        const ignInput = new discord_js_1.TextInputBuilder()
            .setCustomId('tester_ign')
            .setLabel('Minecraft IGN')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('Notch')
            .setRequired(true)
            .setMinLength(3)
            .setMaxLength(16);
        const expInput = new discord_js_1.TextInputBuilder()
            .setCustomId('tester_pvp_exp')
            .setLabel('PvP Experience')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('List your tiers, modes, years of experience...')
            .setRequired(true)
            .setMaxLength(1000);
        const whyInput = new discord_js_1.TextInputBuilder()
            .setCustomId('tester_why')
            .setLabel('Why You?')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('Why should you be a tier tester?')
            .setRequired(true)
            .setMaxLength(1000);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(ignInput), new discord_js_1.ActionRowBuilder().addComponents(expInput), new discord_js_1.ActionRowBuilder().addComponents(whyInput));
        return modal;
    }
    static createGiveTierModal() {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('give_tier_modal_submit')
            .setTitle('🏆 Assign Tier Role');
        const tierInput = new discord_js_1.TextInputBuilder()
            .setCustomId('tier_input')
            .setLabel('Tier (e.g., HT 3, LT 5)')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('HT 3')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(10);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(tierInput));
        return modal;
    }
    // Ticket management
    static createTicketButtons(ticketType = 'support') {
        const row = new discord_js_1.ActionRowBuilder();
        if (ticketType === 'tier') {
            row.addComponents(new discord_js_1.ButtonBuilder().setCustomId('claim_ticket').setLabel('📋 Claim').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('start_test').setLabel('▶️ Start Test').setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder().setCustomId('give_tier').setLabel('🏆 Give Tier').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('finish_ticket').setLabel('✅ Finish').setStyle(discord_js_1.ButtonStyle.Secondary));
        }
        else {
            row.addComponents(new discord_js_1.ButtonBuilder().setCustomId('claim_ticket').setLabel('📋 Claim').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Close').setStyle(discord_js_1.ButtonStyle.Danger));
        }
        return row;
    }
    static createTierResultEmbed(playerTag, mode, tier) {
        return new discord_js_1.EmbedBuilder()
            .setTitle('🏆 Tier Achieved!')
            .setDescription(`<@${playerTag}> has been ranked **${mode} ${tier}**!`)
            .setColor(0xFFD700)
            .setTimestamp()
            .setFooter({ text: 'Harval MC • Tier Testing' });
    }
}
exports.ServerSetup = ServerSetup;
//# sourceMappingURL=ServerSetup.js.map