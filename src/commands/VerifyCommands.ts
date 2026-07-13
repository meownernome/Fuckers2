import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, TextChannel, ChannelType } from 'discord.js';
import { ServerSetup } from '../ServerSetup.js';

export const VerifyCommands = {
  data: new SlashCommandBuilder()
    .setName('verify-panel')
    .setDescription('Re-post the verification panel'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('ManageChannels')) {
      await interaction.reply({ content: 'You need Manage Channels permission.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      await interaction.editReply({ content: 'Bot token not configured.' });
      return;
    }

    const setup = new ServerSetup(interaction.client as any, interaction.guild, token);
    await setup.postVerifyPanel();

    await interaction.editReply({ content: '✅ Verification panel posted!' });
  },
};

export const SetupVerifyCommand = {
  data: new SlashCommandBuilder()
    .setName('setup-verify')
    .setDescription('Setup verification system (creates verify channel + panel)'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('Administrator')) {
      await interaction.reply({ content: 'You need Administrator permission.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Create verify channel if not exists
    let verifyChannel = interaction.guild.channels.cache.find(
      c => c.name === 'verify' && c.type === ChannelType.GuildText
    ) as TextChannel;

    if (!verifyChannel) {
      const infoCategory = interaction.guild.channels.cache.find(
        c => c.name === '📜 INFORMATION' && c.type === ChannelType.GuildCategory
      );

      verifyChannel = await interaction.guild.channels.create({
        name: 'verify',
        type: ChannelType.GuildText,
        parent: infoCategory?.id,
        topic: 'Verify your Minecraft account',
        reason: 'Auto-created verify channel',
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Verification')
      .setColor(0x00FF00)
      .setDescription(
        'Verify your Minecraft account to access tier testing, leaderboards, and more!\n\n' +
        'Click the button below and enter your exact Minecraft IGN.'
      )
      .addFields(
        { name: 'Requirements', value: '• Valid Minecraft Java account\n• Not banned from Harval MC\n• One account per Discord user', inline: false },
        { name: 'Benefits', value: '• Access to tier testing\n• Role assignment on tier achievement\n• Leaderboard eligibility\n• Priority support', inline: false }
      )
      .setFooter({ text: 'Harval MC • Verification' });

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('verify_modal')
          .setLabel('✅ Verify Account')
          .setStyle(ButtonStyle.Success)
      );

    await verifyChannel.send({ embeds: [embed], components: [row] });

    await interaction.editReply({ content: `✅ Verification panel posted in ${verifyChannel}!` });
  },
};