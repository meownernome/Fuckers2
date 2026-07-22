import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getPlayerData, getAllPlayerData } from '../utils/pointsSystem';
import { SEP } from '../utils/textStyles';

export class ProfileCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const target = interaction.options.getUser('user') || interaction.user;
    const data = getPlayerData(target.id);
    const allData = getAllPlayerData();
    const member = interaction.guild?.members.cache.get(target.id);

    let desc = `${SEP}\n\`〔 PROFILE 〕\`\n${SEP}\n\n`;

    desc += `**User:** ${target}\n`;
    desc += `**IGN:** ${data?.ign || 'Not verified'}\n`;
    desc += `**Points:** ${data?.points || 0}\n`;

    const tierRoles: string[] = [];
    if (member) {
      const pattern = /\u25C6 (.+?) \u2022 (LT|HT [1-5])/;
      for (const role of member.roles.cache.values()) {
        const m = role.name.match(pattern);
        if (m) tierRoles.push(`${m[1]} \u2192 ${m[2]}`);
      }
    }

    if (tierRoles.length > 0) {
      desc += `\n**Tier Roles:**\n${tierRoles.map(t => `\u25C6 ${t}`).join('\n')}\n`;
    }

    if (data?.modes && Object.keys(data.modes).length > 0) {
      desc += `\n**Mode Tiers:**\n`;
      for (const [mode, tier] of Object.entries(data.modes)) {
        desc += `\u25C6 ${mode}: ${tier}\n`;
      }
    }

    desc += `\n${SEP}`;

    const position = allData.findIndex((p: any) => p.userId === target.id) + 1;
    if (position > 0) {
      desc += `\n**Leaderboard Rank:** #${position}`;
    }

    const embed = new EmbedBuilder()
      .setDescription(desc)
      .setColor(0x00E5FF)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('profile')
      .setDescription('View your profile and tier information')
      .addUserOption(opt => opt.setName('user').setDescription('User to view').setRequired(false))
      .setDMPermission(false);
  }
}
