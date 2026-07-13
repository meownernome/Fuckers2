"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingCommand = void 0;
const discord_js_1 = require("discord.js");
class PingCommand {
    async execute(interaction) {
        const latency = Date.now() - interaction.createdTimestamp;
        await interaction.reply({ content: `🏓 Pong! Latency: ${latency}ms`, flags: discord_js_1.MessageFlags.Ephemeral });
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('ping')
            .setDescription('Check bot latency')
            .setDMPermission(false);
    }
}
exports.PingCommand = PingCommand;
