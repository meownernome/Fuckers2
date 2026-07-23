"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionCommand = void 0;
const discord_js_1 = require("discord.js");
const Logger_1 = require("../utils/Logger");
const ServerSetup_1 = require("../ServerSetup");
const CATEGORY_KEYS = ServerSetup_1.CATEGORIES.map(c => c.key);
const CATEGORY_PERMS = {
    information: { everyone: true, note: 'Everyone can view' },
    verification: { everyone: true, note: 'Everyone can view' },
    community: { everyone: true, note: 'Everyone can view' },
    roles: { everyone: true, note: 'Everyone can view' },
    'tier-testing': { everyone: true, note: 'Everyone can view' },
    tickets: { everyone: false, note: 'Staff + ticket participants only' },
    support: { everyone: true, note: 'Everyone can view' },
    staff: { everyone: false, note: 'Staff roles only' },
    logs: { everyone: false, note: 'Staff roles only' },
    voice: { everyone: true, note: 'Everyone can view' },
};
class PermissionCommand {
    async execute(interaction) {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const guild = interaction.guild;
        let updated = 0;
        let failed = 0;
        for (const channel of guild.channels.cache.values()) {
            if (channel.type === discord_js_1.ChannelType.GuildCategory || channel.type === discord_js_1.ChannelType.PublicThread || channel.type === discord_js_1.ChannelType.PrivateThread || channel.type === discord_js_1.ChannelType.AnnouncementThread)
                continue;
            const parent = channel.parent;
            if (!parent)
                continue;
            const catEntry = ServerSetup_1.CATEGORIES.find(c => parent.name === c.name);
            const catKey = catEntry?.key;
            if (!catKey)
                continue;
            const perms = CATEGORY_PERMS[catKey];
            if (!perms)
                continue;
            try {
                const everyone = guild.roles.everyone;
                const ch = channel;
                if (perms.everyone) {
                    await ch.permissionOverwrites.edit(everyone, { ViewChannel: null }, { reason: 'Permission reset' });
                }
                else {
                    await ch.permissionOverwrites.edit(everyone, { ViewChannel: false }, { reason: 'Restrict staff channel' });
                }
                updated++;
            }
            catch (e) {
                failed++;
                Logger_1.logger.error(`Perm fail #${channel.name}: ${e.message}`);
            }
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🔒 Permission Sync Complete')
            .setDescription(`\`\`\`\n` +
            `  Updated  ━━  ${updated} channels\n` +
            `  Failed   ━━  ${failed} channels\n` +
            `\`\`\`\n\n` +
            `**Permission Rules Applied:**\n` +
            CATEGORY_KEYS.map(k => `• ${k}: ${CATEGORY_PERMS[k].note}`).join('\n'))
            .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    get command() {
        return new discord_js_1.SlashCommandBuilder()
            .setName('permission')
            .setDescription('Set channel view permissions for all roles')
            .setDMPermission(false);
    }
}
exports.PermissionCommand = PermissionCommand;
