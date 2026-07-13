"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesCommand = void 0;
const discord_js_1 = require("discord.js");
class RulesCommand {
    async execute(interaction) {
        const rules = [
            '1. Be respectful and follow the Discord Code of Conduct.',
            '2. No cheating, hacking, or exploiting.',
            '3. Respect all staff members and their decisions.',
            '4. No excessive spam or self-promotion.',
            '5. Use appropriate channel names and topics.',
            '6. Report any issues to staff immediately.',
            '7. Follow Minecraft game rules during tests.',
            '8. No harassment or discrimination.',
            '9. Keep channels clean and professional.',
            '10. Obey all Discord and Minecraft server rules.',
            '11. Use provided PvP arenas only.',
            '12. Complete tests fairly and honestly.',
            '13. No NSFW or inappropriate content.',
            '14. Respect server timing and schedule.',
            '15. Have fun and enjoy PvP testing!',
        ];
        let rulesContent = '**Server Rules:**\n\n';
        for (const rule of rules) {
            rulesContent += `${rule}\n`;
        }
        await interaction.reply({ content: rulesContent, flags: discord_js_1.MessageFlags.Ephemeral });
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('rules')
            .setDescription('View server rules')
            .setDMPermission(false);
    }
}
exports.RulesCommand = RulesCommand;
