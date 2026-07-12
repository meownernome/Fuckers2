import { MessageFlags,  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export class IPCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle('🎮 HARVAL MC Server IP')
      .setDescription('**Server IP:** `play.harvalmc.fun`')
      .setColor(0x00FF00)
      .addFields(
        { name: 'Status', value: '🟢 Online', inline: true },
        { name: 'Type', value: 'PvP Tier Testing', inline: true },
        { name: 'Modes', value: '15+ PvP modes available', inline: true }
      )
      .setFooter({ text: 'Join us for PvP tier testing!' })
      .setTimestamp();

    await interaction.reply({ content: embed.toString(), ephemeral: true });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('ip')
      .setDescription('Get the server IP address')
      .setDMPermission(false);
  }
}