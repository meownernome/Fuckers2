"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqCommand = void 0;
const discord_js_1 = require("discord.js");
exports.FaqCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('faq')
        .setDescription('Re-post the FAQ panel'),
    async execute(interaction) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('❓ Frequently Asked Questions')
            .setColor(0x00FFFF)
            .setDescription('Common questions about Harval MC tier testing')
            .addFields({ name: 'What is tier testing?', value: 'Tier testing evaluates your PvP skill in specific game modes and assigns you a rank (LT 1 - HT 5).', inline: false }, { name: 'How do I get tested?', value: 'Click "Request Tier Test" in #request-tier-test, fill out the modal, and a tester will contact you.', inline: false }, { name: 'What are the tiers?', value: 'LT 1 → HT 1 → LT 2 → HT 2 → LT 3 → HT 3 → LT 4 → HT 4 → LT 5 → HT 5 (LT = Low Tier, HT = High Tier)', inline: false }, { name: 'How long does a test take?', value: 'Typically 10-30 minutes depending on the game mode and tester availability.', inline: false }, { name: 'Can I retest?', value: 'Yes! You can request a retest after 7 days if you feel your rank is inaccurate.', inline: false }, { name: 'Do I need to be verified?', value: 'Yes, you must be verified (✅ Verified role) to request a tier test.', inline: false }, { name: 'What if I disagree with my tier?', value: 'Open a retest request in #retest-request with evidence. Staff will review.', inline: false }, { name: 'How do I become a tester?', value: 'Apply using the "Tester Apply" button in #roles. Requirements: HT 3+ in at least 3 modes.', inline: false }, { name: 'What is the server IP?', value: '`play.harvalmc.net` (Java Edition)', inline: false }, { name: 'Bedrock support?', value: 'Currently Java Edition only. Bedrock support planned for the future.', inline: false })
            .setFooter({ text: 'Harval MC • FAQ' });
        await interaction.reply({ embeds: [embed] });
    },
};
//# sourceMappingURL=FaqCommand.js.map