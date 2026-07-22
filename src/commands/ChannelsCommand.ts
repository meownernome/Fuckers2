import { MessageFlags, TextChannel, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { ServerSetup } from '../ServerSetup';
import { logger } from '../utils/Logger';

export class ChannelsCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      await this.handleAdd(interaction);
    } else {
      await this.handleList(interaction);
    }
  }

  private async handleList(interaction: ChatInputCommandInteraction): Promise<void> {
    const cache = interaction.guild?.channels.cache;
    if (!cache) { await interaction.reply({ content: 'No guild found.', flags: MessageFlags.Ephemeral }); return; }
    const channels = cache
      .filter(channel => channel.type !== ChannelType.GuildCategory)
      .sort((a, b) => {
        if (a.parentId === null && b.parentId !== null) return -1;
        if (a.parentId !== null && b.parentId === null) return 1;
        return (a as TextChannel).position - (b as TextChannel).position;
      });

    let channelsList = '';
    let currentParent = '';
    for (const channel of channels.values()) {
      if (channel.parent?.name !== currentParent) {
        currentParent = channel.parent?.name || '(No category)';
        channelsList += `\n**${currentParent}**\n`;
      }
      channelsList += `\u2514 ${channel.name}\n`;
    }

    const embed = new EmbedBuilder()
      .setDescription(channelsList)
      .setColor(0x3498DB)
      .setFooter({ text: `\u25C6 ${channels.size} channels \u25C6` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  private async handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({ content: 'You need Manage Channels permission.', flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    const setup = new ServerSetup(interaction.client, guild);

    let catsCreated = 0;
    let chsCreated = 0;

    try {
      catsCreated = await setup.setupCategories();
      chsCreated = await setup.setupChannels();
      logger.info(`/channels add by ${interaction.user.tag}: ${catsCreated} cats, ${chsCreated} chs`);
    } catch (e: any) {
      await interaction.editReply({ content: `Failed: ${e.message}` });
      return;
    }

    const embed = new EmbedBuilder()
      .setDescription(
        `**Categories Created:** ${catsCreated}\n` +
        `**Channels Created:** ${chsCreated}\n\n` +
        `All categories use the \`\u2501 {NAME} \u3015\` format.\n` +
        `Channels use the \`\u25C6\u30FB{name}\` prefix.`
      )
      .setColor(0x2ECC71)
      .setFooter({ text: '\u25C6 Use /permission to sync \u25C6' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('channels')
      .setDescription('Manage server channels')
      .addSubcommand(sub => sub.setName('list').setDescription('List all server channels'))
      .addSubcommand(sub => sub.setName('add').setDescription('Create all categories and channels'))
      .setDMPermission(false);
  }
}
