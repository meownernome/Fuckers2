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
} from 'discord.js';
import { ALL_ROLES, STAFF_ROLE_NAMES, UTILITY_ROLE_NAMES, GAME_MODE_ROLE_NAMES } from './roles.js';
import { Logger } from './utils/Logger.js';
import { RoleCreator, RoleData } from './utils/roleCreator.js';
import { ServerSetup, CATEGORIES } from './ServerSetup.js';
import { AllCommand } from './commands/AllCommand.js';
import { SetupCommand } from './commands/SetupCommand.js';
import { CleanupCommand } from './commands/CleanupCommand.js';
import { MakeRolesCommand } from './commands/MakeRolesCommand.js';
import { GtgCommand } from './commands/GtgCommand.js';
import { RolesCommand } from './commands/RolesCommand.js';
import { VerifyCommands } from './commands/VerifyCommands.js';

const TOKEN = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN) {
  Logger.error('No Discord token found. Set DISCORD_TOKEN or DISCORD_BOT_TOKEN in .env');
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
];

const commandMap = {
  all: AllCommand,
  setup: SetupCommand,
  cleanup: CleanupCommand,
  makeroles: MakeRolesCommand,
  gtg: GtgCommand,
  roles: RolesCommand,
  verify: VerifyCommands,
  'verify-panel': VerifyCommands,
  'setup-verify': VerifyCommands,
};

let roleCreationInProgress = false;
let roleCreationComplete = false;

async function registerCommands(guild?: any) {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    if (guild) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID!, guild.id), { body: commands });
      Logger.info(`Registered ${commands.length} commands in guild ${guild.name}`);
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID!), { body: commands });
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

  const validModes = [...new Set(ALL_ROLES.filter(r => r.mode).map(r => r.mode))];
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
    name: `ticket-${subject.toLowerCase().replace(/\s+/g, '-')}-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: permissionOverwrites as any,
    topic: `Support Ticket: ${subject} | User: ${interaction.user.tag}`,
  });

  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Ticket')
    .setColor(0x00FF7F)
    .addFields(
      { name: 'Subject', value: subject, inline: false },
      { name: 'Description', value: description, inline: false },
      { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Status', value: '🟢 Open', inline: true }
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
    await interaction.reply({ content: '❌ Applications channel not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📝 Staff Application')
    .setColor(0x9370DB)
    .addFields(
      { name: 'Applicant', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false },
      { name: 'Age', value: age, inline: true },
      { name: 'Experience', value: experience.substring(0, 1024), inline: false },
      { name: 'Why Harval MC?', value: why.substring(0, 1024), inline: false }
    )
    .setTimestamp()
    .setFooter({ text: `User ID: ${interaction.user.id}` });

  await appsChannel.send({ embeds: [embed] });
  await interaction.reply({ content: '✅ Staff application submitted!', flags: MessageFlags.Ephemeral });
}

async function handleTesterApplyModal(interaction: ModalSubmitInteraction) {
  const ign = interaction.fields.getTextInputValue('tester_ign').trim();
  const pvpExp = interaction.fields.getTextInputValue('tester_pvp_exp').trim();
  const why = interaction.fields.getTextInputValue('tester_why').trim();

  const appsChannel = interaction.guild?.channels.cache.find(c => c.name === 'applications') as TextChannel;
  if (!appsChannel) {
    await interaction.reply({ content: '❌ Applications channel not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Tester Application')
    .setColor(0xFF4500)
    .addFields(
      { name: 'Applicant', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: false },
      { name: 'Minecraft IGN', value: ign, inline: true },
      { name: 'PvP Experience', value: pvpExp.substring(0, 1024), inline: false },
      { name: 'Why You?', value: why.substring(0, 1024), inline: false }
    )
    .setTimestamp()
    .setFooter({ text: `User ID: ${interaction.user.id}` });

  await appsChannel.send({ embeds: [embed] });
  await interaction.reply({ content: '✅ Tester application submitted!', flags: MessageFlags.Ephemeral });
}

async function handleGiveTierModal(interaction: ModalSubmitInteraction) {
  const tier = interaction.fields.getTextInputValue('tier_input').trim().toUpperCase();
  const channel = interaction.channel as TextChannel;
  const topic = channel.topic || '';
  
  const modeMatch = topic.match(/Tier Test: ([^|]+)/);
  const playerMatch = topic.match(/Player: ([^|]+)/);
  const requesterMatch = topic.match(/Requester: ([^|]+)/);
  
  if (!modeMatch || !playerMatch) {
    await interaction.reply({ content: '❌ Could not parse ticket info.', flags: MessageFlags.Ephemeral });
    return;
  }

  const mode = modeMatch[1].trim();
  const playerIgn = playerMatch[1].trim();
  const requesterTag = requesterMatch?.[1]?.trim();

  const roleName = `${mode} ${tier}`;
  const role = interaction.guild?.roles.cache.find(r => r.name === roleName);
  
  if (!role) {
    await interaction.reply({ content: `❌ Role "${roleName}" not found.`, flags: MessageFlags.Ephemeral });
    return;
  }

  const member = await interaction.guild?.members.fetch(requesterTag?.replace(/[<@!>]/g, '') || '');
  if (!member) {
    await interaction.reply({ content: '❌ Could not find player to assign role.', flags: MessageFlags.Ephemeral });
    return;
  }

  await member.roles.add(role, `Tier test passed: ${mode} ${tier} by ${interaction.user.tag}`);

  const embed = new EmbedBuilder()
    .setTitle('🏆 Tier Achieved!')
    .setDescription(`<@${member.id}> — Ranked **${mode} ${tier}**!`)
    .setColor(0xFFD700)
    .setTimestamp()
    .setFooter({ text: `Tested by ${interaction.user.tag}` });

  await channel.send({ embeds: [embed] });
  
  const resultsChannel = interaction.guild?.channels.cache.find(c => c.name === 'tier-results') as TextChannel;
  if (resultsChannel) {
    await resultsChannel.send({ embeds: [embed] });
  }

  await interaction.reply({ content: `✅ Assigned **${roleName}** to <@${member.id}>`, flags: MessageFlags.Ephemeral });
}

async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { customId } = interaction;

  if (customId === 'verify_modal') {
    await interaction.showModal(ServerSetup.createVerifyModal());
    return;
  }

  if (customId === 'verify_modal_submit') {
    await handleVerifyModal(interaction);
    return;
  }

  if (customId === 'request_tier_test') {
    await interaction.showModal(ServerSetup.createTierTestModal());
    return;
  }

  if (customId === 'tier_test_modal_submit') {
    await handleTierTestModal(interaction);
    return;
  }

  if (customId === 'create_ticket') {
    await interaction.showModal(ServerSetup.createTicketModal());
    return;
  }

  if (customId === 'ticket_modal_submit') {
    await handleTicketModal(interaction);
    return;
  }

  if (customId === 'staff_apply') {
    await interaction.showModal(ServerSetup.createStaffApplyModal());
    return;
  }

  if (customId === 'staff_apply_modal_submit') {
    await handleStaffApplyModal(interaction);
    return;
  }

  if (customId === 'tester_apply') {
    await interaction.showModal(ServerSetup.createTesterApplyModal());
    return;
  }

  if (customId === 'tester_apply_modal_submit') {
    await handleTesterApplyModal(interaction);
    return;
  }

  if (customId === 'give_tier') {
    await interaction.showModal(ServerSetup.createGiveTierModal());
    return;
  }

  if (customId === 'give_tier_modal_submit') {
    await handleGiveTierModal(interaction);
    return;
  }

  if (customId === 'claim_ticket') {
    const member = interaction.member as GuildMember;
    const channel = interaction.channel as TextChannel;
    await channel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    await interaction.reply({ content: `✅ ${member} claimed this ticket!`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (customId === 'start_test') {
    const embed = new EmbedBuilder()
      .setTitle('▶️ Test Started')
      .setDescription('Server IP: `play.harvalmc.net`\nJoin the test server and wait for the tester to join.')
      .setColor(0x00FF00)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (customId === 'finish_ticket' || customId === 'close_ticket') {
    await interaction.reply({ content: '🔒 Closing ticket in 3 seconds...' });
    setTimeout(async () => {
      await interaction.channel?.delete('Ticket finished/closed');
    }, 3000);
    return;
  }

  if (customId === 'copy_ip') {
    await interaction.reply({ content: '📋 **Server IP:** `play.harvalmc.net`', flags: MessageFlags.Ephemeral });
    return;
  }

  if (customId.startsWith('gtg_')) {
    await GtgCommand.handleButton(interaction);
    return;
  }
}

async function handleSlashCommand(interaction: any) {
  if (!interaction.isChatInputCommand()) return;
  
  const command = commandMap[interaction.commandName];
  if (command) {
    try {
      await command.execute(interaction);
    } catch (error) {
      Logger.error(`Error executing /${interaction.commandName}`, error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred.' });
      } else {
        await interaction.reply({ content: '❌ An error occurred.', flags: MessageFlags.Ephemeral });
      }
    }
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  Logger.info(`✅ Bot logged in as ${readyClient.user.tag}`);
  
  if (GUILD_ID) {
    const guild = await readyClient.guilds.fetch(GUILD_ID).catch(() => null);
    if (guild) {
      await registerCommands(guild);
      await autoCreateAllRoles(guild);
    }
  } else {
    for (const guild of readyClient.guilds.cache.values()) {
      await registerCommands(guild);
      await autoCreateAllRoles(guild);
    }
  }
  
  Logger.success('🚀 Harval MC Bot fully initialized!');
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
  } else if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
  } else if (interaction.isModalSubmit()) {
    // Handled in button interaction for modals shown via buttons
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  const memberRole = member.guild.roles.cache.find(r => r.name === '👤 Member');
  if (memberRole) {
    await member.roles.add(memberRole).catch(() => {});
  }
  
  const logChannel = member.guild.channels.cache.find(c => c.name === 'join-leave') as TextChannel;
  if (logChannel) {
    await logChannel.send({ embeds: [new EmbedBuilder().setTitle('👋 Member Joined').setDescription(`<@${member.id}> (${member.user.tag})`).setColor(0x00FF00).setTimestamp()] });
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  const logChannel = member.guild.channels.cache.find(c => c.name === 'join-leave') as TextChannel;
  if (logChannel) {
    await logChannel.send({ embeds: [new EmbedBuilder().setTitle('👋 Member Left').setDescription(`${member.user.tag} (${member.id})`).setColor(0xFF0000).setTimestamp()] });
  }
});

client.login(TOKEN).catch((error) => {
  Logger.error('Failed to login', error);
  process.exit(1);
});