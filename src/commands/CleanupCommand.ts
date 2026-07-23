import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { ServerSetup } from '../ServerSetup';
import { logger } from '../utils/Logger';
import { BRAND } from '../utils/textStyles';

export class CleanupCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const SEP = BRAND.SEPARATOR;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: '❌ Administrator permission required.', flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'roles') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = new ServerSetup(interaction.client, interaction.guild!);
      const count = await setup.cleanupRoles();
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＬＥＡＮＵＰ ＲＯＬＥＳ 〕\n${SEP}\`\`\`\n\n│ **Deleted:** ${count} roles\n│ *All deletable roles removed (except @everyone & managed).*\n\n${SEP}`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      logger.info(`🧹 ${interaction.user.tag} cleaned ${count} roles`);
      return;
    }

    if (sub === 'channels') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = new ServerSetup(interaction.client, interaction.guild!);
      const count = await setup.cleanupChannels();
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＬＥＡＮＵＰ ＣＨＡＮＮＥＬＳ 〕\n${SEP}\`\`\`\n\n│ **Deleted:** ${count} HARVAL channels/categories\n│ *Roles and other channels untouched.*\n\n${SEP}`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      logger.info(`🧹 ${interaction.user.tag} cleaned ${count} channels`);
      return;
    }

    if (sub === 'panels') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = new ServerSetup(interaction.client, interaction.guild!);
      const count = await setup.cleanupPanels();
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＬＥＡＮＵＰ ＰＡＮＥＬＳ 〕\n${SEP}\`\`\`\n\n│ **Deleted:** ${count} panel messages\n\n${SEP}`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      logger.info(`🧹 ${interaction.user.tag} cleaned ${count} panels`);
      return;
    }

    if (sub === 'logs') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const setup = new ServerSetup(interaction.client, interaction.guild!);
      const count = await setup.cleanupLogs();
      const embed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＬＥＡＮＵＰ ＬＯＧＳ 〕\n${SEP}\`\`\`\n\n│ **Deleted:** ${count} log channels\n\n${SEP}`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
      logger.info(`🧹 ${interaction.user.tag} cleaned ${count} logs`);
      return;
    }

    if (sub === 'all') {
      const confirmEmbed = new EmbedBuilder()
        .setColor(0xE74C3C)
        .setDescription(`\`\`\`md\n${SEP}\n〔 ⚠ ＮＵＣＬＥＡＲ ＣＬＥＡＮＵＰ 〕\n${SEP}\`\`\`\n\nThis will delete **ALL** objects:\n│ ◆ Channels & categories\n│ ◆ Roles (all except @everyone & managed)\n│ ◆ Panel messages\n│ ◆ Log channels\n\n**This cannot be undone!**\n\n${SEP}`)
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('cleanup_confirm').setLabel('YES DELETE EVERYTHING').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cleanup_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ embeds: [confirmEmbed], components: [row], flags: MessageFlags.Ephemeral });
      return;
    }
  }

  get command() {
    return new SlashCommandBuilder()
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
