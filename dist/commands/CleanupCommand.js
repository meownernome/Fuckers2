"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupCommand = void 0;
const discord_js_1 = require("discord.js");
const ServerSetup_1 = require("../ServerSetup");
const roles_1 = require("../roles");
const Logger_1 = require("../utils/Logger");
class CleanupCommand {
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'roles') {
            await this.cleanupRoles(interaction);
        }
        else if (sub === 'channels') {
            await this.cleanupChannels(interaction);
        }
        else {
            await this.cleanupAll(interaction);
        }
    }
    async cleanupRoles(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            await interaction.reply({ content: '❌ Only the server owner can use this.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        let deleted = 0;
        for (const r of [...interaction.guild.roles.cache.values()]) {
            if (r.name === '@everyone' || r.managed)
                continue;
            const match = roles_1.ALL_ROLES.some(ar => ar.name === r.name);
            if (match) {
                await r.delete().catch(() => { });
                deleted++;
            }
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('✅ Cleanup Roles')
            .setDescription(`**Deleted:** ${deleted} roles`)
            .setColor(0x2ECC71).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        Logger_1.logger.info(`🧹 ${interaction.user.tag} cleaned ${deleted} roles`);
    }
    async cleanupChannels(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            await interaction.reply({ content: '❌ Only the server owner can use this.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const setup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
        const result = await setup.cleanup();
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('✅ Cleanup Channels & Categories')
            .setDescription(`**Deleted:** ${result.channels} channels/categories`)
            .setColor(0x2ECC71).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        Logger_1.logger.info(`🧹 ${interaction.user.tag} cleaned ${result.channels} channels`);
    }
    async cleanupAll(interaction) {
        if (interaction.user.id !== interaction.guild.ownerId) {
            await interaction.reply({ content: '❌ Only the server owner can use this.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const confirmEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('⚠️ Confirm Nuclear Cleanup')
            .setDescription('This will delete **ALL** channels, categories, and bot-created roles.\nThis cannot be undone!')
            .setColor(0xE74C3C);
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('cleanup_confirm').setLabel('YES, DELETE EVERYTHING').setStyle(discord_js_1.ButtonStyle.Danger).setEmoji('⚠️'), new discord_js_1.ButtonBuilder().setCustomId('cleanup_cancel').setLabel('Cancel').setStyle(discord_js_1.ButtonStyle.Secondary).setEmoji('❌'));
        await interaction.reply({ embeds: [confirmEmbed], components: [row], flags: discord_js_1.MessageFlags.Ephemeral });
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('cleanup')
            .setDescription('Delete bot-created channels and roles')
            .addSubcommand(sub => sub
            .setName('all')
            .setDescription('Nuclear: delete ALL channels + roles'))
            .addSubcommand(sub => sub
            .setName('channels')
            .setDescription('Delete only channels and categories'))
            .addSubcommand(sub => sub
            .setName('roles')
            .setDescription('Delete only bot-created roles'))
            .setDMPermission(false);
    }
}
exports.CleanupCommand = CleanupCommand;
