"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingCommand = void 0;
const discord_js_1 = require("discord.js");
exports.PingCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true, ephemeral: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor(latency < 200 ? 0x00FF00 : latency < 500 ? 0xFFFF00 : 0xFF0000)
            .addFields({ name: '📡 Bot Latency', value: `${latency}ms`, inline: true }, { name: '💓 API Heartbeat', value: `${apiLatency}ms`, inline: true })
            .setFooter({ text: 'Harval MC Bot' });
        await interaction.editReply({ content: null, embeds: [embed] });
    },
};
//# sourceMappingURL=PingCommand.js.map