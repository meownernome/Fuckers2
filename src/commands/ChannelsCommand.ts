import { MessageFlags, TextChannel, SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } from 'discord.js';

export class ChannelsCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const cache = interaction.guild?.channels.cache;
    if (!cache) { await interaction.reply({ content: 'No guild found.', ephemeral: true }); return; }
    const channels = cache
      .filter(channel => channel.type !== ChannelType.GuildCategory)
      .sort((a, b) => {
        if (a.parentId === null && b.parentId !== null) return -1;
        if (a.parentId !== null && b.parentId === null) return 1;
        return (a as TextChannel).position - (b as TextChannel).position;
      });

    let channelsList = 'Server channels:\n';
    let currentParent = '';
    for (const channel of channels.values()) {
      if (channel.parent?.name !== currentParent) {
        currentParent = channel.parent?.name || '(No category)';
        channelsList += `\n**${currentParent}**:\n`;
      }
      channelsList += `• ${channel.name} (${channel.type})\n`;
    }

    await interaction.reply({ content: channelsList, ephemeral: true });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('channels')
      .setDescription('List all server channels')
      .setDMPermission(false);
  }
}