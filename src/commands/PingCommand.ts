import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export const PingCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot latency'),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, flags: MessageFlags.Ephemeral });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setColor(latency < 200 ? 0x00FF00 : latency < 500 ? 0xFFFF00 : 0xFF0000)
      .addFields(
        { name: '📡 Bot Latency', value: `${latency}ms`, inline: true },
        { name: '💓 API Heartbeat', value: `${apiLatency}ms`, inline: true }
      )
      .setFooter({ text: 'Harval MC Bot' });

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};