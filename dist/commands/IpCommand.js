"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpCommand = void 0;
const discord_js_1 = require("discord.js");
exports.IpCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ip')
        .setDescription('Show the Harval MC server IP'),
    async execute(interaction) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🌐 Harval MC Server IP')
            .setColor(0x00FFFF)
            .setDescription('**Java Edition:** `play.harvalmc.net`\n**Port:** `25565` (default)')
            .addFields({ name: '📋 Copy Command', value: '`/server play.harvalmc.net` in Minecraft', inline: false }, { name: '🎮 Supported Versions', value: '1.8.x - 1.20.x (Recommended: 1.8.9 / 1.16.5)', inline: false }, { name: '🌍 Regions', value: 'US East • EU West • Asia Singapore', inline: true }, { name: '🏆 Game Modes', value: '26 modes • 10 tiers each', inline: true })
            .setFooter({ text: 'Harval MC • Tier Testing Network' });
        await interaction.reply({ embeds: [embed] });
    },
};
//# sourceMappingURL=IpCommand.js.map