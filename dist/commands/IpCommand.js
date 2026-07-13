"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCommand = void 0;
const discord_js_1 = require("discord.js");
class IPCommand {
    async execute(interaction) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🎮 HARVAL MC Server IP')
            .setDescription('**Server IP:** `play.harvalmc.fun`')
            .setColor(0x00FF00)
            .addFields({ name: 'Status', value: '🟢 Online', inline: true }, { name: 'Type', value: 'PvP Tier Testing', inline: true }, { name: 'Modes', value: '15+ PvP modes available', inline: true })
            .setFooter({ text: 'Join us for PvP tier testing!' })
            .setTimestamp();
        await interaction.reply({ content: embed.toString(), flags: discord_js_1.MessageFlags.Ephemeral });
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('ip')
            .setDescription('Get the server IP address')
            .setDMPermission(false);
    }
}
exports.IPCommand = IPCommand;
