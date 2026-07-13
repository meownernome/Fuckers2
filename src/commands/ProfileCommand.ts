import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, User, MessageFlags } from 'discord.js';

export const ProfileCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your or another user\'s tier profile')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view (default: yourself)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target: User = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild?.members.fetch(target.id);

    if (!member) {
      await interaction.reply({ content: 'User not found in this server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const tierRoles = member.roles.cache.filter(r => r.name.match(/^(Sword|Crystal|SMP|Netherite Pot|Diamond Pot|UHC|BuildUHC|NoDebuff|Combo|Gapple|OP Duel|Boxing|Axe|Mace|Anchor|Cart PvP|Bedwars|Skywars|Bridge|Nodebuff|Vanilla|Crossbow|Trident|Shield|Elytra Combat|Custom Duel)\s+(LT|HT)\s+[1-5]$/));
    
    const staffRoles = member.roles.cache.filter(r => 
      ['👑 Founder', '👑 Co-Founder', '⚡ Lead Developer', '⚡ Developer', '🌐 Network Manager', '🛡️ Head Administrator', '🛡️ Administrator', '🔰 Senior Moderator', '🔰 Moderator', '🔰 Trial Moderator', '⚔️ Head Tier Tester', '⚔️ Senior Tier Tester', '⚔️ Tier Tester', '⚔️ Trial Tier Tester', '💎 Support Team', '🔨 Builder', '🎬 Media Team'].includes(r.name)
    );

    const verified = member.roles.cache.has(member.roles.cache.find(r => r.name === '✅ Verified')?.id || '');

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.tag}'s Profile`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setColor(0xFFD700)
      .addFields(
        { name: '📛 Discord', value: `${target.tag} (${target.id})`, inline: true },
        { name: '✅ Verified', value: verified ? 'Yes' : 'No', inline: true },
        { name: '📅 Joined', value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`, inline: true },
        { name: `🏆 Tiers (${tierRoles.size}/260)`, value: tierRoles.size > 0 ? tierRoles.map(r => `\`${r.name}\``).join(', ') : 'No tiers yet', inline: false },
        { name: `👑 Staff Roles (${staffRoles.size})`, value: staffRoles.size > 0 ? staffRoles.map(r => `\`${r.name}\``).join(', ') : 'None', inline: false }
      )
      .setFooter({ text: 'Harval MC • Tier Testing Network' });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};