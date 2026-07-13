import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { ServerSetup } from '../ServerSetup';
import { ALL_ROLES } from '../roles';
import { logger } from '../utils/Logger';

export class CleanupCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'roles') {
      await this.cleanupRoles(interaction);
    } else if (sub === 'channels') {
      await this.cleanupChannels(interaction);
    } else {
      await this.cleanupAll(interaction);
    }
  }

  private async cleanupRoles(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== interaction.guild!.ownerId) {
      await interaction.reply({ content: '❌ Only the server owner can use this.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let deleted = 0;
    for (const r of [...interaction.guild!.roles.cache.values()]) {
      if (r.name === '@everyone' || r.managed) continue;
      const match = ALL_ROLES.some(ar => ar.name === r.name);
      if (match) {
        await r.delete().catch(() => {});
        deleted++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Cleanup Roles')
      .setDescription(`**Deleted:** ${deleted} roles`)
      .setColor(0x2ECC71).setTimestamp();
    await interaction.editReply({ embeds: [embed] as any });
    logger.info(`🧹 ${interaction.user.tag} cleaned ${deleted} roles`);
  }

  private async cleanupChannels(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== interaction.guild!.ownerId) {
      await interaction.reply({ content: '❌ Only the server owner can use this.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const setup = new ServerSetup(interaction.client, interaction.guild!);
    const result = await setup.cleanup();

    const embed = new EmbedBuilder()
      .setTitle('✅ Cleanup Channels & Categories')
      .setDescription(`**Deleted:** ${result.channels} channels/categories`)
      .setColor(0x2ECC71).setTimestamp();
    await interaction.editReply({ embeds: [embed] as any });
    logger.info(`🧹 ${interaction.user.tag} cleaned ${result.channels} channels`);
  }

  private async cleanupAll(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== interaction.guild!.ownerId) {
      await interaction.reply({ content: '❌ Only the server owner can use this.', flags: MessageFlags.Ephemeral });
      return;
    }

    const confirmEmbed = new EmbedBuilder()
      .setTitle('⚠️ Confirm Nuclear Cleanup')
      .setDescription('This will delete **ALL** channels, categories, and bot-created roles.\nThis cannot be undone!')
      .setColor(0xE74C3C);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('cleanup_confirm').setLabel('YES, DELETE EVERYTHING').setStyle(ButtonStyle.Danger).setEmoji('⚠️'),
      new ButtonBuilder().setCustomId('cleanup_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary).setEmoji('❌'),
    );

    await interaction.reply({ embeds: [confirmEmbed] as any, components: [row as any], flags: MessageFlags.Ephemeral });
  }

  get command() {
    return new SlashCommandBuilder()
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
