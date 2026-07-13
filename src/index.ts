import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  ButtonInteraction,
  ModalSubmitInteraction,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  CategoryChannel,
  Role,
  GuildMember,
  MessageFlags,
  Interaction,
  Collection,
  ChatInputCommandInteraction,
} from 'discord.js';
import { ALL_ROLES, STAFF_ROLE_NAMES, UTILITY_ROLE_NAMES, GAME_MODE_ROLE_NAMES } from './roles.js';
import { Logger } from './utils/Logger.js';
import { RoleCreator, RoleData } from './utils/roleCreator.js';
import { ServerSetup } from './ServerSetup.js';
import { AllCommand } from './commands/AllCommand.js';
import { SetupCommand } from './commands/SetupCommand.js';
import { CleanupCommand } from './commands/CleanupCommand.js';
import { MakeRolesCommand } from './commands/MakeRolesCommand.js';
import { GtgCommand } from './commands/GtgCommand.js';
import { RolesCommand } from './commands/RolesCommand.js';
import { VerifyCommands, SetupVerifyCommand } from './commands/VerifyCommands.js';
import { PermissionsCommand } from './commands/PermissionsCommand.js';
import { IpCommand } from './commands/IPCommand.js';
import { PingCommand } from './commands/PingCommand.js';
import { ProfileCommand } from './commands/ProfileCommand.js';
import { LeaderboardCommand } from './commands/LeaderboardCommand.js';
import { RulesCommand } from './commands/RulesCommand.js';
import { FaqCommand } from './commands/FAQCommand.js';

const TOKEN = (process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN)!;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN) {
  Logger.error('No Discord token found. Set DISCORD_TOKEN or DISCORD_BOT_TOKEN in .env');
  process.exit(1);
}
if (!CLIENT_ID) {
  Logger.error('No Discord client ID found. Set DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const commands = [
  AllCommand.data.toJSON(),
  SetupCommand.data.toJSON(),
  CleanupCommand.data.toJSON(),
  MakeRolesCommand.data.toJSON(),
  GtgCommand.data.toJSON(),
  RolesCommand.data.toJSON(),
  VerifyCommands.data.toJSON(),
  SetupVerifyCommand.data.toJSON(),
  PermissionsCommand.data.toJSON(),
  IpCommand.data.toJSON(),
  PingCommand.data.toJSON(),
  ProfileCommand.data.toJSON(),
  LeaderboardCommand.data.toJSON(),
  RulesCommand.data.toJSON(),
  FaqCommand.data.toJSON(),
];

const commandMap = {
  all: AllCommand,
  setup: SetupCommand,
  cleanup: CleanupCommand,
  makeroles: MakeRolesCommand,
  gtg: GtgCommand,
  roles: RolesCommand,
  'verify-panel': VerifyCommands,
  'setup-verify': SetupVerifyCommand,
  permissions: PermissionsCommand,
  ip: IpCommand,
  ping: PingCommand,
  profile: ProfileCommand,
  leaderboard: LeaderboardCommand,
  rules: RulesCommand,
  faq: FaqCommand,
};

let roleCreationInProgress = false;
let roleCreationComplete = false;

async function registerCommands(guild?: any) {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    if (guild) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), { body: commands });
      Logger.info(`Registered ${commands.length} commands in guild ${guild.name}`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      Logger.info(`Registered ${commands.length} global commands`);
    }
  } catch (error) {
    Logger.error('Failed to register commands', error);
  }
}

async function autoCreateAllRoles(guild: any) {
  if (roleCreationInProgress || roleCreationComplete) {
    Logger.info('Role creation already in progress or complete, skipping');
    return;
  }

  roleCreationInProgress = true;
  Logger.info('🚀 Starting auto-creation of 281 roles...');

  const roleCreator = new RoleCreator(TOKEN, guild.id);
  const roleData: RoleData[] = ALL_ROLES.map(role => ({
    name: role.name,
    color: role.color,
  }));

  const existingRoles = await roleCreator.fetchExistingRoles();
  const missingRoles = roleData.filter(r => !existingRoles.has(r.name));
  
  Logger.info(`Found ${existingRoles.size} existing roles, ${missingRoles.length} to create`);

  if (missingRoles.length === 0) {
    Logger.success('✅ All 281 roles already exist!');
    roleCreationComplete = true;
    roleCreationInProgress = false;
    return;
  }

  let created = 0;
  for (const role of missingRoles) {
    const roleId = await roleCreator.createRole(role);
    if (roleId) created++;
    await new Promise(r => setTimeout(r, 1200));
  }

  Logger.success(`✅ Auto-role creation complete: ${created}/${missingRoles.length} new roles created`);
  roleCreationComplete = true;
  roleCreationInProgress = false;
}

async function handleVerifyModal(interaction: ModalSubmitInteraction) {
  const ign = interaction.fields.getTextInputValue('minecraft_ign').trim();
  const member = interaction.member as GuildMember;
  
  const verifiedRole = interaction.guild?.roles.cache.find(r => r.name === '✅ Verified');
  if (verifiedRole && member.roles.cache.has(verifiedRole.id)) {
    await interaction.reply({ content: 'You are already verified!', flags: MessageFlags.Ephemeral });
    return;
  }

  if (verifiedRole) {
    await member.roles.add(verifiedRole, `Verified as ${ign}`);
  }

  const logChannel = interaction.guild?.channels.cache.find(c => c.name === 'verification-logs') as TextChannel;
  if (logChannel) {
    await logChannel.send({ embeds: [new EmbedBuilder().setTitle('✅ Verified').setDescription(`<@${interaction.user.id}> verified as **${ign}**`).setColor(0x00FF00).setTimestamp()] });
  }

  await interaction.reply({ content: `✅ Verified as **${ign}**! You now have access to tier testing.`, flags: MessageFlags.Ephemeral });
}

async function handleTierTestModal(interaction: ModalSubmitInteraction) {
  const mode = interaction.fields.getTextInputValue('game_mode').trim();
  const ign = interaction.fields.getTextInputValue('player_ign').trim();

  const validModes = [...new Set(ALL_ROLES.filter(r => r.mode).map(r => r.mode!))];
  if (!validModes.includes(mode)) {
    await interaction.reply({ content: `❌ Invalid game mode. Valid modes: ${validModes.join(', ')}`, flags: MessageFlags.Ephemeral });
    return;
  }

  const verifiedRole = interaction.guild?.roles.cache.find(r => r.name === '✅ Verified');
  const member = interaction.member as GuildMember;
  if (verifiedRole && !member.roles.cache.has(verifiedRole.id)) {
    await interaction.reply({ content: '❌ You must be verified to request a tier test. Use the verify button in #verify.', flags: MessageFlags.Ephemeral });
    return;
  }

  const category = interaction.guild?.channels.cache.find(c => c.name === 'TICKETS' && c.type === ChannelType.GuildCategory) as CategoryChannel;
  if (!category) {
    await interaction.reply({ content: '❌ Tickets category not found. Run /all first.', flags: MessageFlags.Ephemeral });
    return;
  }

  const testerRoles = ['⚔️ Head Tier Tester', '⚔️ Senior Tier Tester', '⚔️ Tier Tester', '⚔️ Trial Tier Tester'];
  const testerRoleIds = interaction.guild?.roles.cache.filter(r => testerRoles.includes(r.name)).map(r => r.id) || [];
  
  const permissionOverwrites = [
    { id: interaction.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ...testerRoleIds.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
  ];

  const ticketChannel = await interaction.guild?.channels.create({
    name: `tier-test-${mode.toLowerCase().replace(/\s+/g, '-')}-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: permissionOverwrites as any,
    topic: `Tier Test: ${mode} | Player: ${ign} | Requester: ${interaction.user.tag}`,
  });

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Tier Test Ticket')
    .setColor(0xFF4500)
    .addFields(
      { name: 'Game Mode', value: mode, inline: true },
      { name: 'Player IGN', value: ign, inline: true },
      { name: 'Requested By', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Status', value: '⏳ Waiting for tester to claim', inline: false }
    )
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder().setCustomId('claim_ticket').setLabel('📋 Claim').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('start_test').setLabel('▶️ Start Test').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('give_tier').setLabel('🏆 Give Tier').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('finish_ticket').setLabel('✅ Finish').setStyle(ButtonStyle.Secondary)
    );

  await ticketChannel?.send({ embeds: [embed], components: [row] });
  
  const queueChannel = interaction.guild?.channels.cache.find(c => c.name === 'queue') as TextChannel;
  if (queueChannel) {
    await queueChannel.send({ embeds: [new EmbedBuilder().setTitle('📋 Queue Update').setDescription(`**${ign}** requested **${mode}** test`).setColor(0x00FFFF).setTimestamp()] });
  }

  await interaction.reply({ content: `✅ Tier test ticket created: ${ticketChannel}`, flags: MessageFlags.Ephemeral });
}

async function handleTicketModal(interaction: ModalSubmitInteraction) {
  const subject = interaction.fields.getTextInputValue('ticket_subject').trim();
  const description = interaction.fields.getTextInputValue('ticket_description').trim();

  const category = interaction.guild?.channels.cache.find(c => c.name === 'SUPPORT' && c.type === ChannelType.GuildCategory) as CategoryChannel;
  if (!category) {
    await interaction.reply({ content: '❌ Support category not found. Run /all first.', flags: MessageFlags.Ephemeral });
    return;
  }

  const staffRoles = ['🛡️ Head Administrator', '🛡️ Administrator', '🔰 Senior Moderator', '🔰 Moderator', '🔰 Trial Moderator', '💎 Support Team'];
  const staffRoleIds = interaction.guild?.roles.cache.filter(r => staffRoles.includes(r.name)).map(r => r.id) || [];
  
  const permissionOverwrites = [
    { id: interaction.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ...staffRoleIds.map(id => ({ id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] })),
  ];

  const ticketChannel = await interaction.guild?.channels.create({
    name: `ticket-${subject.toLowerCase().replace(/\s+/g, '-').substring(0, 50)}-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: permissionOverwrites as any,
    topic: `Support Ticket: ${subject} | User: ${interaction.user.tag}`,
  });

  const embed = new EmbedBuilder()
    .setTitle(`🎫 ${subject}`)
    .setColor(0x00FF7F)
    .addFields(
      { name: 'Description', value: description, inline: false },
      { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Status', value: '📋 Open', inline: true }
    )
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder().setCustomId('claim_ticket').setLabel('📋 Claim').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Close').setStyle(ButtonStyle.Danger)
    );

  await ticketChannel?.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: `✅ Support ticket created: ${ticketChannel}`, flags: MessageFlags.Ephemeral });
}

async function handleStaffApplyModal(interaction: ModalSubmitInteraction) {
  const age = interaction.fields.getTextInputValue('staff_age').trim();
  const experience = interaction.fields.getTextInputValue('staff_experience').trim();
  const why = interaction.fields.getTextInputValue('staff_why').trim();

  const appsChannel = interaction.guild?.channels.cache.find(c => c.name === 'applications') as TextChannel;
  if (!appsChannel) {
    await interaction.reply({ content: '❌ Applications channel not found. Run /all first.', flags: MessageFlags.Ephemeral });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📝 Staff Application')
    .setColor(0x9370DB)
    .addFields(
      { name: 'Applicant', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false },
      { name: 'Age', value: age, inline: true },
      { name: 'Experience', value: experience, inline: false },
      { name: 'Why Harval MC?', value: why, inline: false }
    )
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder().setCustomId('accept_staff_app').setLabel('✅ Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('deny_staff_app').setLabel('❌ Deny').setStyle(ButtonStyle.Danger)
    );

  await appsChannel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: '✅ Staff application submitted!', flags: MessageFlags.Ephemeral });
}

async function handleTesterApplyModal(interaction: ModalSubmitInteraction) {
  const ign = interaction.fields.getTextInputValue('tester_ign').trim();
  const pvpExp = interaction.fields.getTextInputValue('tester_pvp_exp').trim();
  const why = interaction.fields.getTextInputValue('tester_why').trim();

  const appsChannel = interaction.guild?.channels.cache.find(c => c.name === 'applications') as TextChannel;
  if (!appsChannel) {
    await interaction.reply({ content: '❌ Applications channel not found. Run /all first.', flags: MessageFlags.Ephemeral });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Tester Application')
    .setColor(0xFF4500)
    .addFields(
      { name: 'Applicant', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false },
      { name: 'Minecraft IGN', value: ign, inline: true },
      { name: 'PvP Experience', value: pvpExp, inline: false },
      { name: 'Why You?', value: why, inline: false }
    )
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder().setCustomId('accept_tester_app').setLabel('✅ Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('deny_tester_app').setLabel('❌ Deny').setStyle(ButtonStyle.Danger)
    );

  await appsChannel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: '✅ Tester application submitted!', flags: MessageFlags.Ephemeral });
}

async function handleGiveTierModal(interaction: ModalSubmitInteraction) {
  const tierInput = interaction.fields.getTextInputValue('tier_input').trim().toUpperCase();
  
  if (!tierInput.match(/^(LT|HT)\s+[1-5]$/)) {
    await interaction.reply({ content: '❌ Invalid tier format. Use format: LT 1, HT 3, etc.', flags: MessageFlags.Ephemeral });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const topic = channel.topic || '';
  const modeMatch = topic.match(/Tier Test: (.*?) \|/);
  const ignMatch = topic.match(/Player: (.*?) \|/);
  
  if (!modeMatch || !ignMatch) {
    await interaction.reply({ content: '❌ Could not parse ticket info.', flags: MessageFlags.Ephemeral });
    return;
  }

  const mode = modeMatch[1];
  const ign = ignMatch[1];
  
  const roleName = `${mode} ${tierInput}`;
  const role = interaction.guild?.roles.cache.find(r => r.name === roleName);
  
  if (!role) {
    await interaction.reply({ content: `❌ Role "${roleName}" not found.`, flags: MessageFlags.Ephemeral });
    return;
  }

  const member = await interaction.guild?.members.fetch(ign).catch(() => null);
  if (!member) {
    await interaction.reply({ content: `❌ Could not find member with IGN: ${ign}`, flags: MessageFlags.Ephemeral });
    return;
  }

  await member.roles.add(role, `Tier test result: ${tierInput} by ${interaction.user.tag}`);
  
  const tierLogsChannel = interaction.guild?.channels.cache.find(c => c.name === 'tier-logs') as TextChannel;
  if (tierLogsChannel) {
    await tierLogsChannel.send({ embeds: [new EmbedBuilder().setTitle('🏆 Tier Achieved!').setDescription(`<@${member.id}> ranked **${mode} ${tierInput}**!`).setColor(0xFFD700).setTimestamp()] });
  }

  const resultEmbed = new EmbedBuilder()
    .setTitle('🏆 Tier Result')
    .setDescription(`${member} has been ranked **${mode} ${tierInput}**!`)
    .setColor(0xFFD700)
    .setTimestamp();

  await channel.send({ embeds: [resultEmbed] });
  await interaction.reply({ content: `✅ Assigned **${roleName}** to ${member}`, flags: MessageFlags.Ephemeral });
}

async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { customId } = interaction;

  // Verification
  if (customId === 'verify_modal') {
    const modal = ServerSetup.createVerifyModal();
    await interaction.showModal(modal);
    return;
  }

  // Tier test request
  if (customId === 'request_tier_test') {
    const modal = ServerSetup.createTierTestModal();
    await interaction.showModal(modal);
    return;
  }

  // Support ticket
  if (customId === 'create_ticket') {
    const modal = ServerSetup.createTicketModal();
    await interaction.showModal(modal);
    return;
  }

  // Staff application
  if (customId === 'staff_apply') {
    const modal = ServerSetup.createStaffApplyModal();
    await interaction.showModal(modal);
    return;
  }

  // Tester application
  if (customId === 'tester_apply') {
    const modal = ServerSetup.createTesterApplyModal();
    await interaction.showModal(modal);
    return;
  }

  // Ticket buttons
  if (customId === 'claim_ticket') {
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(interaction.user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });
    await interaction.reply({ content: `✅ ${interaction.user} claimed this ticket!`, ephemeral: true });
    return;
  }

  if (customId === 'start_test') {
    const channel = interaction.channel as TextChannel;
    const topic = channel.topic || '';
    const ignMatch = topic.match(/Player: (.*?) \|/);
    if (ignMatch) {
      const embed = new EmbedBuilder()
        .setTitle('▶️ Test Started')
        .setDescription(`Tester ${interaction.user} has started the test. Server IP: **play.harvalmc.net**`)
        .setColor(0x00FF00)
        .setTimestamp();
      await channel.send({ embeds: [embed] });
    }
    await interaction.reply({ content: 'Test started! IP sent to player.', ephemeral: true });
    return;
  }

  if (customId === 'give_tier') {
    const modal = ServerSetup.createGiveTierModal();
    await interaction.showModal(modal);
    return;
  }

  if (customId === 'finish_ticket') {
    const channel = interaction.channel as TextChannel;
    await interaction.reply({ content: '✅ Closing ticket in 3 seconds...' });
    setTimeout(() => channel.delete('Ticket finished by tester'), 3000);
    return;
  }

  if (customId === 'close_ticket') {
    const channel = interaction.channel as TextChannel;
    await interaction.reply({ content: '🔒 Closing ticket in 3 seconds...' });
    setTimeout(() => channel.delete('Ticket closed'), 3000);
    return;
  }

  // Application buttons
  if (customId === 'accept_staff_app' || customId === 'deny_staff_app') {
    const isAccept = customId === 'accept_staff_app';
    const embed = interaction.message.embeds[0];
    const newEmbed = EmbedBuilder.from(embed).setColor(isAccept ? 0x00FF00 : 0xFF0000).addFields({ name: 'Status', value: isAccept ? '✅ Accepted' : '❌ Denied', inline: true });
    await interaction.message.edit({ embeds: [newEmbed], components: [] });
    await interaction.reply({ content: `${isAccept ? '✅' : '❌'} Application ${isAccept ? 'accepted' : 'denied'}.`, ephemeral: true });
    return;
  }

  if (customId === 'accept_tester_app' || customId === 'deny_tester_app') {
    const isAccept = customId === 'accept_tester_app';
    const embed = interaction.message.embeds[0];
    const newEmbed = EmbedBuilder.from(embed).setColor(isAccept ? 0x00FF00 : 0xFF0000).addFields({ name: 'Status', value: isAccept ? '✅ Accepted' : '❌ Denied', inline: true });
    await interaction.message.edit({ embeds: [newEmbed], components: [] });
    await interaction.reply({ content: `${isAccept ? '✅' : '❌'} Application ${isAccept ? 'accepted' : 'denied'}.`, ephemeral: true });
    return;
  }

  // GTG buttons
  if (customId.startsWith('gtg_')) {
    await GtgCommand.handleButton(interaction);
    return;
  }
}

async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  const { customId } = interaction;

  if (customId === 'verify_modal_submit') {
    await handleVerifyModal(interaction);
  } else if (customId === 'tier_test_modal_submit') {
    await handleTierTestModal(interaction);
  } else if (customId === 'ticket_modal_submit') {
    await handleTicketModal(interaction);
  } else if (customId === 'staff_apply_modal_submit') {
    await handleStaffApplyModal(interaction);
  } else if (customId === 'tester_apply_modal_submit') {
    await handleTesterApplyModal(interaction);
  } else if (customId === 'give_tier_modal_submit') {
    await handleGiveTierModal(interaction);
  }
}

client.once(Events.ClientReady, async () => {
  Logger.info(`[BOT] Discord bot logged in as ${client.user?.tag}`);

  try {
    if (GUILD_ID) {
      const guild = await client.guilds.fetch(GUILD_ID);
      Logger.info(`[BOT] Connected to guild: ${guild.name} (${guild.id})`);
      await registerCommands(guild);
      await autoCreateAllRoles(guild);
    } else {
      await registerCommands();
      for (const guild of client.guilds.cache.values()) {
        await autoCreateAllRoles(guild);
      }
    }
  } catch (error) {
    Logger.error('Startup error', error);
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = commandMap[interaction.commandName as keyof typeof commandMap];
    if (command) {
      try {
        await command.execute(interaction as ChatInputCommandInteraction);
      } catch (error) {
        Logger.error(`Error executing command ${interaction.commandName}`, error);
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: 'An error occurred.', flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: 'An error occurred.', flags: MessageFlags.Ephemeral });
        }
      }
    }
  } else if (interaction.isButton()) {
    try {
      await handleButtonInteraction(interaction);
    } catch (error) {
      Logger.error('Button interaction error', error);
    }
  } else if (interaction.isModalSubmit()) {
    try {
      await handleModalSubmit(interaction);
    } catch (error) {
      Logger.error('Modal submit error', error);
    }
  }
});

client.login(TOKEN).catch((error) => {
  Logger.error('Discord login failed', error);
});