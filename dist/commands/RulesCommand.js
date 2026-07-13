"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesCommand = void 0;
const discord_js_1 = require("discord.js");
exports.RulesCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('rules')
        .setDescription('Re-post the server rules panel'),
    async execute(interaction) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('📜 Harval MC Server Rules')
            .setColor(0xFF0000)
            .setDescription('Failure to follow these rules will result in punishment.')
            .addFields({ name: '1️⃣ Respect Everyone', value: 'No harassment, discrimination, hate speech, or toxicity. Treat all players and staff with respect.', inline: false }, { name: '2️⃣ No Cheating', value: 'No hacked clients, autoclickers, macros, or any unfair advantages. This includes both in-game and on Discord.', inline: false }, { name: '3️⃣ No Alting', value: 'Do not use alternate accounts to evade punishments, boost stats, or manipulate leaderboards.', inline: false }, { name: '4️⃣ English Only', value: 'Keep all public chat in English. Other languages allowed in DMs and private channels.', inline: false }, { name: '5️⃣ No Advertising', value: 'No advertising other servers, Discord servers, YouTube channels, or any external content without permission.', inline: false }, { name: '6️⃣ Appropriate Content', value: 'No NSFW, gore, shocking content, or inappropriate usernames/avatars.', inline: false }, { name: '7️⃣ No Drama', value: 'Don\'t start drama, witch hunts, or call-out posts. Use tickets for reports.', inline: false }, { name: '8️⃣ Staff Decisions Final', value: 'Staff have final say. If you disagree, make a ticket - don\'t argue in public.', inline: false })
            .setFooter({ text: 'Harval MC • Last Updated: July 2025' });
        await interaction.reply({ embeds: [embed] });
    },
};
//# sourceMappingURL=RulesCommand.js.map