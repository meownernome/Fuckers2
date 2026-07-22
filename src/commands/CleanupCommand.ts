import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { ServerSetup } from '../ServerSetup';
import { logger } from '../utils/Logger';
import { panel } from '../utils/textStyles';

export class CleanupCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'channels') {
      await this.cleanupChannels(interaction);
    } else if (sub === 'roles') {
      await this.cleanupRoles(interaction);
    } else {
      await this.cleanupAll(interaction);
    }
  }

  private async cleanupChannels(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== interaction.guild!.ownerId) {
      await interaction.reply({ content: 'Only the server owner can use this.', flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const setup = new ServerSetup(interaction.client, interaction.guild!);
    const del = await setup.cleanupChannels();
    const e = new EmbedBuilder()
      .setDescription(`**Deleted ${del} channels/categories**`)
      .setColor(0x2ECC71).setTimestamp();
    await interaction.editReply({ embeds: [e] });
    logger.info(`Cleanup channels: ${interaction.user.tag} deleted ${del}`);
  }

  private async cleanupRoles(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== interaction.guild!.ownerId) {
      await interaction.reply({ content: 'Only the server owner can use this.', flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const setup = new ServerSetup(interaction.client, interaction.guild!);
    const del = await setup.cleanupRoles();
    const e = new EmbedBuilder()
      .setDescription(`**Deleted ${del} roles**`)
      .setColor(0x2ECC71).setTimestamp();
    await interaction.editReply({ embeds: [e] });
    logger.info(`Cleanup roles: ${interaction.user.tag} deleted ${del}`);
  }

  private async cleanupAll(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== interaction.guild!.ownerId) {
      await interaction.reply({ content: 'Only the server owner can use this.', flags: MessageFlags.Ephemeral });
      return;
    }
    const e = new EmbedBuilder()
      .setDescription('This will delete **ALL** channels, categories, and ◆-prefixed roles.\nThis cannot be undone!')
      .setColor(0xE74C3C);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('cleanup_confirm').setLabel('YES, DELETE EVERYTHING').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cleanup_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ embeds: [e], components: [row], flags: MessageFlags.Ephemeral });
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('cleanup')
      .setDescription('Delete bot-created channels and roles')
      .addSubcommand(sub => sub.setName('all').setDescription('Delete all channels + roles'))
      .addSubcommand(sub => sub.setName('channels').setDescription('Delete only channels'))
      .addSubcommand(sub => sub.setName('roles').setDescription('Delete only roles'))
      .setDMPermission(false);
  }
}
