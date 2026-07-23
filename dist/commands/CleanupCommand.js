"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupCommand = void 0;
const discord_js_1 = require("discord.js");
const ServerSetup_1 = require("../ServerSetup");
const Logger_1 = require("../utils/Logger");
const textStyles_1 = require("../utils/textStyles");
class CleanupCommand {
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const SEP = textStyles_1.BRAND.SEPARATOR;
        if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({ content: '❌ Administrator permission required.', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        if (sub === 'roles') {
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const setup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
            const count = await setup.cleanupRoles();
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xE74C3C)
                .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＬＥＡＮＵＰ ＲＯＬＥＳ 〕\n${SEP}\`\`\`\n\n│ **Deleted:** ${count} HARVAL roles\n│ *Non-HARVAL roles were left untouched.*\n\n${SEP}`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
            Logger_1.logger.info(`🧹 ${interaction.user.tag} cleaned ${count} roles`);
            return;
        }
        if (sub === 'channels') {
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const setup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
            const count = await setup.cleanupChannels();
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xE74C3C)
                .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＬＥＡＮＵＰ ＣＨＡＮＮＥＬＳ 〕\n${SEP}\`\`\`\n\n│ **Deleted:** ${count} HARVAL channels/categories\n│ *Roles and other channels untouched.*\n\n${SEP}`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
            Logger_1.logger.info(`🧹 ${interaction.user.tag} cleaned ${count} channels`);
            return;
        }
        if (sub === 'panels') {
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const setup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
            const count = await setup.cleanupPanels();
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xE74C3C)
                .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＬＥＡＮＵＰ ＰＡＮＥＬＳ 〕\n${SEP}\`\`\`\n\n│ **Deleted:** ${count} panel messages\n\n${SEP}`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
            Logger_1.logger.info(`🧹 ${interaction.user.tag} cleaned ${count} panels`);
            return;
        }
        if (sub === 'logs') {
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
            const setup = new ServerSetup_1.ServerSetup(interaction.client, interaction.guild);
            const count = await setup.cleanupLogs();
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xE74C3C)
                .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＬＥＡＮＵＰ ＬＯＧＳ 〕\n${SEP}\`\`\`\n\n│ **Deleted:** ${count} log channels\n\n${SEP}`)
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
            Logger_1.logger.info(`🧹 ${interaction.user.tag} cleaned ${count} logs`);
            return;
        }
        if (sub === 'all') {
            const confirmEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0xE74C3C)
                .setDescription(`\`\`\`md\n${SEP}\n〔 ⚠ ＮＵＣＬＥＡＲ ＣＬＥＡＮＵＰ 〕\n${SEP}\`\`\`\n\nThis will delete **ALL** HARVAL-created objects:\n│ ◆ Channels & categories\n│ ◆ Roles\n│ ◆ Panel messages\n│ ◆ Log channels\n\n**This cannot be undone!**\n\n${SEP}`)
                .setTimestamp();
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId('cleanup_confirm').setLabel('YES DELETE EVERYTHING').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId('cleanup_cancel').setLabel('Cancel').setStyle(discord_js_1.ButtonStyle.Secondary));
            await interaction.reply({ embeds: [confirmEmbed], components: [row], flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('cleanup')
            .setDescription('Delete HARVAL-created objects only (NEVER mixes types)')
            .addSubcommand(sub => sub
            .setName('channels')
            .setDescription('Delete only HARVAL channels and categories'))
            .addSubcommand(sub => sub
            .setName('roles')
            .setDescription('Delete only HARVAL roles'))
            .addSubcommand(sub => sub
            .setName('panels')
            .setDescription('Delete only panel messages'))
            .addSubcommand(sub => sub
            .setName('logs')
            .setDescription('Delete only log channels'))
            .addSubcommand(sub => sub
            .setName('all')
            .setDescription('Delete ALL HARVAL-created objects'))
            .setDMPermission(false);
    }
}
exports.CleanupCommand = CleanupCommand;
