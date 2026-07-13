"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupVerifyCommand = exports.VerifyCommands = void 0;
const discord_js_1 = require("discord.js");
const ServerSetup_js_1 = require("../ServerSetup.js");
exports.VerifyCommands = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('verify-panel')
        .setDescription('Re-post the verification panel'),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
            return;
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has('ManageChannels')) {
            await interaction.reply({ content: 'You need Manage Channels permission.', ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            await interaction.editReply({ content: 'Bot token not configured.' });
            return;
        }
        const setup = new ServerSetup_js_1.ServerSetup(interaction.client, interaction.guild, token);
        await setup.postVerifyPanel();
        await interaction.editReply({ content: '✅ Verification panel posted!' });
    },
};
exports.SetupVerifyCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setup-verify')
        .setDescription('Setup verification system (creates verify channel + panel)'),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
            return;
        }
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (!member.permissions.has('Administrator')) {
            await interaction.reply({ content: 'You need Administrator permission.', ephemeral: true });
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        // Create verify channel if not exists
        let verifyChannel = interaction.guild.channels.cache.find(c => c.name === 'verify' && c.type === 0);
        if (!verifyChannel) {
            const infoCategory = interaction.guild.channels.cache.find(c => c.name === 'INFORMATION' && c.type === 4);
            verifyChannel = await interaction.guild.channels.create({
                name: 'verify',
                type: 0,
                parent: infoCategory?.id,
                topic: 'Verify your Minecraft account',
                reason: 'Auto-created verify channel',
            });
        }
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
        await verifyChannel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: `✅ Verification panel posted in ${verifyChannel}!` });
    },
};
//# sourceMappingURL=VerifyCommands.js.map