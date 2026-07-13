import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } from 'discord.js';

export const PermissionsCommand = {
  data: new SlashCommandBuilder()
    .setName('permissions')
    .setDescription('Check bot permissions in this server'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const me = interaction.guild.members.me;
    if (!me) {
      await interaction.reply({ content: 'Could not fetch bot member.', flags: MessageFlags.Ephemeral });
      return;
    }

    const perms = me.permissions;
    const required = [
      'Administrator',
      'ManageRoles',
      'ManageChannels',
      'ManageMessages',
      'ViewChannel',
      'SendMessages',
      'EmbedLinks',
      'AttachFiles',
      'ReadMessageHistory',
      'MentionEveryone',
      'UseExternalEmojis',
      'AddReactions',
      'ManageThreads',
      'ModerateMembers',
      'BanMembers',
      'KickMembers',
    ];

    const embed = new EmbedBuilder()
      .setTitle('🔐 Bot Permissions Check')
      .setColor(perms.has(PermissionsBitField.Flags.Administrator) ? 0x00FF00 : 0xFFFF00)
      .setDescription(perms.has(PermissionsBitField.Flags.Administrator) 
        ? '✅ **Administrator** - All permissions granted!' 
        : '⚠️ Missing Administrator - checking individual permissions...');

    const fields = required.map(p => {
      const has = perms.has(PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags]);
      return { name: `${has ? '✅' : '❌'} ${p}`, value: has ? 'Granted' : 'Missing', inline: true };
    });

    embed.addFields(fields);
    embed.setFooter({ text: 'Harval MC Bot • Permissions Check' });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};