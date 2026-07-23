import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, MessageFlags, GuildMember } from 'discord.js';
import { getAllCommands } from './commands';
import { ServerSetup, CATEGORIES, CHANNEL_KEYS } from './ServerSetup';
import { GtgCommand } from './commands/GtgCommand';
import { ALL_ROLES, getTierRoleName, STAFF_EMOJI_PREFIX, MODES } from './roles';
import { formatStaffRoleName, formatTierRole, BRAND } from './utils/textStyles';
import { createRole } from './utils/roleCreator';
import { logger } from './utils/Logger';
import { setPlayerIGN, getLeaderboard, getAllPlayerData, addTierPoints } from './utils/pointsSystem';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = getAllCommands();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN || '';

const TICKET_STATE = new Map<string, { channelId: string; mode: string; playerId: string; playerName: string; playerDisplay: string; claimedBy?: string; claimedByName?: string }>();


const MODE_EMOJI: Record<string, string> = {
  'Sword': '⚔️', 'Crystal': '💎', 'SMP': '🛡️', 'Netherite Pot': '🌋', 'Diamond Pot': '💠',
  'BuildUHC': '🏗️', 'UHC': '❤️', 'NoDebuff': '🚫', 'Gapple': '🍎', 'Combo': '🥊',
  'Boxing': '🥊', 'Bridge': '🌉', 'Anchor': '⚓', 'Mace': '🔨', 'Axe': '🪓',
  'Cart PvP': '🛒', 'Vanilla': '🌿', 'Bedwars': '🛏️', 'Skywars': '☁️', 'Custom': '🎯',
};

const TIERS = [
  { name: 'LT5', color: 0x7F8C8D },
  { name: 'HT5', color: 0x95A5A6 },
  { name: 'LT4', color: 0x27AE60 },
  { name: 'HT4', color: 0x2ECC71 },
  { name: 'LT3', color: 0x2980B9 },
  { name: 'HT3', color: 0x3498DB },
  { name: 'LT2', color: 0x8E44AD },
  { name: 'HT2', color: 0x9B59B6 },
  { name: 'LT1', color: 0xE74C3C },
  { name: 'HT1', color: 0xC0392B },
];

async function logToChannel(guild: any, key: string, embed: EmbedBuilder) {
  const name = CHANNEL_KEYS[key];
  if (!name) return;
  const ch = guild.channels.cache.find((c: any) => c.name === name && c.type === ChannelType.GuildText) as any;
  if (ch) ch.send({ embeds: [embed] as any }).catch(() => {});
}

async function registerCommands() {
  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.commands.set(commands.map(c => c.command.toJSON()));
      console.log(`📋 Registered ${commands.length} commands in ${guild.name}`);
    } catch (e: any) { console.error(`❌ Guild reg fail: ${e.message}`); }
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user!.tag}`);
  await registerCommands();
  console.log(`Total commands: ${commands.length}`);
  for (const guild of client.guilds.cache.values()) {
    await ensureAllRoles(guild);
  }
});

client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  const guild = member.guild;
  const memberRoleName = formatStaffRoleName('👤', 'Member');
  const memberRole = guild.roles.cache.find((r: any) => r.name === memberRoleName);
  if (memberRole) member.roles.add(memberRole).catch(() => {});

  const welcomeName = CHANNEL_KEYS['welcome'];
  const welcomeCh = guild.channels.cache.find((c: any) => c.name === welcomeName && c.type === ChannelType.GuildText) as any;
  const SEP = BRAND.SEPARATOR;
  if (welcomeCh) {
    const embed = new EmbedBuilder()
      .setColor(BRAND.CYAN)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＷＥＬＣＯＭＥ 〕\n${SEP}\`\`\`\n\n▸ **Welcome to HARVAL MC, ${member.user.username}!**\n\n${'━'.repeat(24)}\n\n│ ◆ Read the rules\n│ ◆ Verify your account\n│ ◆ Request a tier test\n│ ◆ Join the community\n\n${'━'.repeat(24)}\n\n**Server IP:** \`play.harvalmc.fun\`\n│ Member #${guild.memberCount}\n\n${SEP}`)
      .setTimestamp();
    welcomeCh.send({ embeds: [embed] as any, content: `${member.user}` }).catch(() => {});
  }

  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(BRAND.CYAN)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＨＡＲＶＡＬ ＭＣ 〕\n${SEP}\`\`\`\n\n▸ **Welcome to HARVAL MC, ${member.user.username}!**\n\n${'━'.repeat(24)}\n\n│ ◆ Read the rules\n│ ◆ Verify your account\n│ ◆ Request a tier test\n│ ◆ Need help? Open a ticket\n\n${'━'.repeat(24)}\n\n**Server IP:** \`play.harvalmc.fun\`\n\n*Compete. Climb. Conquer.*\n\n${SEP}`)
      .setTimestamp();
    await member.send({ embeds: [dmEmbed] as any });
  } catch { }

  const logEmbed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setDescription(`\`\`\`md\n${SEP}\n〔 ＪＯＩＮ 〕\n${SEP}\`\`\`\n\n**${member.user.tag}** joined the server.\n│ ID: ${member.id}\n\n${SEP}`)
    .setTimestamp();
  await logToChannel(guild, 'join-leave', logEmbed);
});

async function ensureAllRoles(guild: any) {
  try {
    await guild.roles.fetch();
    const existing = new Set(guild.roles.cache.map((r: any) => r.name));
    const missing = ALL_ROLES.filter(r => !existing.has(r.name));
    if (missing.length === 0) {
      console.log(`✅ All ${ALL_ROLES.length} roles already exist in ${guild.name}`);
      return;
    }
    console.log(`🔧 Creating ${missing.length} missing roles in ${guild.name}...`);
    let created = 0;
    for (const role of missing) {
      try {
        await createRole(guild, role.name, role.color);
        created++;
        await new Promise(r => setTimeout(r, 1200));
      } catch (e: any) {
        console.error(`❌ Failed ${role.name}: ${e.message}`);
      }
    }
    console.log(`✅ Created ${created}/${missing.length} roles in ${guild.name}`);
  } catch (e: any) {
    console.error(`❌ Role creation failed in ${guild.name}: ${e.message}`);
  }
}

client.on(Events.GuildCreate, async (guild) => {
  try {
    await guild.commands.set(commands.map(c => c.command.toJSON()));
    console.log(`📋 Registered commands in new guild: ${guild.name}`);
  } catch (e: any) { console.error(`❌ Guild reg fail: ${e.message}`); }
});

client.on(Events.GuildUpdate, async () => {
  await registerCommands();
});

client.on(Events.InteractionCreate, async (interaction: any) => {
  try {
    if (interaction.isCommand()) {
      const cmd = commands.find((c: any) => c.command.name === interaction.commandName);
      if (cmd) await cmd.execute(interaction);
      return;
    }
    if (interaction.isAutocomplete()) {
      if (interaction.commandName === 'gtg' && interaction.options.getFocused(true).name === 'mode') {
        const focused = interaction.options.getFocused(true).value.toLowerCase();
        const choices = MODES.filter(m => m.toLowerCase().includes(focused)).slice(0, 25);
        await interaction.respond(choices.map(m => ({ name: m, value: m })));
      }
      return;
    }
    if (interaction.isButton()) await handleButton(interaction);
    else if (interaction.isModalSubmit()) await handleModal(interaction);
  } catch (e: any) { console.error(`Interaction error: ${e.message}`); }
});

async function handleButton(interaction: any) {
  const id = interaction.customId;

  if (id.startsWith('gtg_create_')) return GtgCommand.handleButton(interaction);
  if (id.startsWith('gtg_skip_')) return GtgCommand.handleSkip(interaction);

  if (id === 'cleanup_confirm') {
    await interaction.deferUpdate();
    const setup = new ServerSetup(interaction.client, interaction.guild);
    const result = await setup.cleanupAll();
    const embed = new EmbedBuilder()
      .setColor(0xE74C3C)
      .setDescription(`\`\`\`md\n${BRAND.SEPARATOR}\n〔 ＮＵＣＬＥＡＲ ＣＬＥＡＮＵＰ 〕\n${BRAND.SEPARATOR}\`\`\`\n\n│ **Channels deleted:** ${result.channels}\n│ **Roles deleted:** ${result.roles}\n│ **Panels cleared:** ${result.panels}\n│ **Log channels:** ${result.logs}\n\n${BRAND.SEPARATOR}`)
      .setTimestamp();
    await interaction.editReply({ embeds: [embed] as any, components: [] });
    return;
  }

  if (id === 'cleanup_cancel') {
    await interaction.update({ content: '❌ Cleanup cancelled.', embeds: [], components: [] });
    return;
  }

  if (id === 'verify_button') {
    const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('✅ Verify Your Account');
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Notch'),
    ));
    await interaction.showModal(modal);
    return;
  }

  if (id === 'support_ticket') {
    const modal = new ModalBuilder().setCustomId('support_ticket_modal').setTitle('🎫 Support Ticket');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('subject').setLabel('Subject').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Describe your issue').setStyle(TextInputStyle.Paragraph).setRequired(true)),
    );
    await interaction.showModal(modal);
    return;
  }

  if (id === 'request_tier_test') {
    const modal = new ModalBuilder().setCustomId('tier_test_request').setTitle('⚔️ Request Tier Test');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('mode').setLabel('Game Mode').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Sword, Crystal, UHC, Boxing...')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Notch')),
    );
    await interaction.showModal(modal);
    return;
  }

  if (id === 'staff_apply') {
    const modal = new ModalBuilder().setCustomId('staff_application').setTitle('📝 Staff Application');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('age').setLabel('Your Age').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('experience').setLabel('Previous Staff Experience').setStyle(TextInputStyle.Paragraph).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('why').setLabel('Why be staff?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
    );
    await interaction.showModal(modal);
    return;
  }

  if (id === 'tester_apply') {
    const modal = new ModalBuilder().setCustomId('tester_application').setTitle('⚔️ Tier Tester Application');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('pvp_experience').setLabel('PvP Experience').setStyle(TextInputStyle.Paragraph).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('why').setLabel('Why pick you?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
    );
    await interaction.showModal(modal);
    return;
  }

  if (id.startsWith('app_approve_')) {
    await interaction.deferUpdate();
    const targetId = id.replace('app_approve_', '');
    const member = await interaction.guild.members.fetch(targetId).catch(() => null);
    if (member) {
      const staffRole = interaction.guild.roles.cache.find((r: any) => STAFF_EMOJI_PREFIX.test(r.name));
      if (staffRole) member.roles.add(staffRole).catch(() => {});
    }
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x2ECC71)
      .setFooter({ text: `\u2714 Approved by ${interaction.user.tag}` });
    await interaction.editReply({ embeds: [embed] as any, components: [] });
    await interaction.channel.send({ content: `✅ <@${targetId}> your application was **approved**!` });
    return;
  }

  if (id.startsWith('app_decline_')) {
    await interaction.deferUpdate();
    const targetId = id.replace('app_decline_', '');
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xE74C3C)
      .setFooter({ text: `\u2718 Declined by ${interaction.user.tag}` });
    await interaction.editReply({ embeds: [embed] as any, components: [] });
    await interaction.channel.send({ content: `❌ <@${targetId}> your application was **declined**.` });
    return;
  }

  if (id.startsWith('ticket_claim_')) {
    const channelId = id.replace('ticket_claim_', '');
    const state = TICKET_STATE.get(channelId);
    if (!state) { await interaction.reply({ content: '❌ Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    if (state.claimedBy) { await interaction.reply({ content: `❌ Already claimed by ${state.claimedByName}.`, flags: MessageFlags.Ephemeral }); return; }
    if (state.playerId === interaction.user.id) { await interaction.reply({ content: '❌ Cannot claim own ticket.', flags: MessageFlags.Ephemeral }); return; }

    state.claimedBy = interaction.user.id;
    state.claimedByName = interaction.member.displayName || interaction.user.username;
    const emoji = MODE_EMOJI[state.mode] || '🎮';

    const SEP = BRAND.SEPARATOR;
    const playerEmbed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＴＩＣＫＥＴ 〕\n${SEP}\`\`\`\n\n▸ **${emoji} ${state.mode} — ${state.playerDisplay}**\n\n│ **Player:** ${state.playerDisplay}\n│ **Mode:** ${emoji} ${state.mode}\n│ **Tester:** ${state.claimedByName}\n│ **Status:** In Progress\n\n${'━'.repeat(24)}\n\n**${state.claimedByName}** has claimed your ticket.\n\n${SEP}`)
      .setTimestamp();
    await interaction.update({ embeds: [playerEmbed] as any, components: [] });

    const staffEmbed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＣＯＮＴＲＯＬ ＰＡＮＥＬ 〕\n${SEP}\`\`\`\n\n▸ **Staff Panel**\n\n│ **Player:** ${state.playerDisplay}\n│ **Mode:** ${emoji} ${state.mode}\n│ **Tester:** ${state.claimedByName}\n\n${'━'.repeat(24)}\n\n│ ◆ **Start** — Send server IP\n│ ◆ **Give Tier** — Assign tier result\n│ ◆ **Finish** — Close ticket\n\n${SEP}`)
      .setTimestamp();
    const staffRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket_claim_${channelId}`).setLabel('Claimed').setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true),
      new ButtonBuilder().setCustomId(`ticket_start_${channelId}`).setLabel('Start').setEmoji('▶️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ticket_givetier_${channelId}`).setLabel('Give Tier').setEmoji('🏆').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket_finish_${channelId}`).setLabel('Finish').setEmoji('✅').setStyle(ButtonStyle.Danger),
    );
    await interaction.followUp({ embeds: [staffEmbed] as any, components: [staffRow as any] });
    await interaction.followUp({ content: `⚔️ ${state.claimedByName} claimed this ticket. <@${state.playerId}> please wait.` });
    return;
  }

  if (id.startsWith('ticket_start_')) {
    const channelId = id.replace('ticket_start_', '');
    const state = TICKET_STATE.get(channelId);
    if (!state) { await interaction.reply({ content: '❌ Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    await interaction.reply({ content: `🌐 **Server IP:** \`play.harvalmc.fun\`\n⚔️ **Mode:** ${state.mode}\n\n<@${state.playerId}> please join.` });
    return;
  }

  if (id.startsWith('ticket_givetier_')) {
    const channelId = id.replace('ticket_givetier_', '');
    if (!TICKET_STATE.get(channelId)) { await interaction.reply({ content: '❌ Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    const modal = new ModalBuilder().setCustomId(`tier_result_${channelId}`).setTitle('Assign Tier');
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId('tier').setLabel('Tier (LT 1-5 / HT 1-5)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. HT 3'),
    ));
    await interaction.showModal(modal);
    return;
  }

  if (id.startsWith('ticket_finish_')) {
    const channelId = id.replace('ticket_finish_', '');
    TICKET_STATE.delete(channelId);
    await interaction.reply({ content: '🔒 Closing ticket...' });
    setTimeout(async () => { try { await interaction.channel?.delete(); } catch {} }, 3000);
    return;
  }
}

async function handleModal(interaction: any) {
  const id = interaction.customId;

  if (id === 'verify_modal') {
    const ign = interaction.fields.getTextInputValue('ign');
    const verifiedRoleName = formatStaffRoleName('✅', 'Verified');
    const verifyRole = interaction.guild.roles.cache.find((r: any) => r.name === verifiedRoleName);
    if (verifyRole) { try { await interaction.member.roles.add(verifyRole); } catch {} }
    setPlayerIGN(interaction.user.id, ign);
    await interaction.reply({ content: `✅ Verified as **${ign}**! Welcome.`, flags: MessageFlags.Ephemeral });

    const SEP = BRAND.SEPARATOR;
    const logEmbed = new EmbedBuilder()
      .setColor(0x2ECC71)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＶＥＲＩＦＹ 〕\n${SEP}\`\`\`\n\n**${interaction.user.tag}** verified as **${ign}**.\n\n${SEP}`)
      .setTimestamp();
    await logToChannel(interaction.guild, 'verification-logs', logEmbed);
    return;
  }

  if (id === 'support_ticket_modal') {
    const subject = interaction.fields.getTextInputValue('subject');
    const desc = interaction.fields.getTextInputValue('description');
    const supportCat = CATEGORIES.find(c => c.key === 'support');
    const cat = interaction.guild.channels.cache.find((c: any) => c.type === ChannelType.GuildCategory && c.name === supportCat?.name);
    const ch = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32),
      type: ChannelType.GuildText, parent: cat,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ],
    });
    const SEP = BRAND.SEPARATOR;
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＳＵＰＰＯＲＴ 〕\n${SEP}\`\`\`\n\n▸ **Support Ticket**\n\n│ **User:** ${interaction.user}\n│ **Subject:** ${subject}\n│ **Description:** ${desc}\n\n${SEP}`)
      .setTimestamp();
    await ch.send({ embeds: [embed] as any, content: `<@${interaction.user.id}>` });
    await interaction.reply({ content: `✅ Ticket created: <#${ch.id}>`, flags: MessageFlags.Ephemeral });

    const logEmbed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＴＩＣＫＥＴ 〕\n${SEP}\`\`\`\n\n**${interaction.user.tag}** opened a support ticket.\n│ **Subject:** ${subject}\n\n${SEP}`)
      .setTimestamp();
    await logToChannel(interaction.guild, 'ticket-logs', logEmbed);
    return;
  }

  if (id === 'tier_test_request') {
    const mode = interaction.fields.getTextInputValue('mode').trim();
    const ign = interaction.fields.getTextInputValue('ign').trim();
    const match = MODES.find(m => m.toLowerCase() === mode.toLowerCase());
    if (!match) { await interaction.reply({ content: `❌ Invalid mode. Options: ${MODES.join(', ')}`, flags: MessageFlags.Ephemeral }); return; }

    const ticket = await new ServerSetup(interaction.client, interaction.guild).createTicket(match, {
      id: interaction.user.id, username: interaction.user.username, displayName: interaction.member.displayName || interaction.user.username,
    });
    if (!ticket) { await interaction.reply({ content: '❌ No tickets category found.', flags: MessageFlags.Ephemeral }); return; }

    const emoji = MODE_EMOJI[match] || '🎮';
    TICKET_STATE.set(ticket.id, { channelId: ticket.id, mode: match, playerId: interaction.user.id, playerName: interaction.user.username, playerDisplay: ign });

    const SEP = BRAND.SEPARATOR;
    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＴＩＥＲ ＴＥＳＴ 〕\n${SEP}\`\`\`\n\n▸ **${emoji} ${match} — ${ign}**\n\n│ **Player:** ${ign}\n│ **Mode:** ${emoji} ${match}\n│ **Status:** Awaiting Claim\n\n${'━'.repeat(24)}\n\nA tester will claim your ticket shortly.\n\n${SEP}`)
      .setTimestamp();
    const claimRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket_claim_${ticket.id}`).setLabel('Claim Ticket').setEmoji('⚔️').setStyle(ButtonStyle.Primary),
    );
    await ticket.send({ embeds: [embed] as any, components: [claimRow as any], content: `<@${interaction.user.id}>` });
    await interaction.reply({ content: `✅ ${match} ticket ready: <#${ticket.id}>`, flags: MessageFlags.Ephemeral });

    const logEmbed = new EmbedBuilder()
      .setColor(0xE67E22)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＴＩＥＲ ＴＥＳＴ 〕\n${SEP}\`\`\`\n\n**${interaction.user.tag}** requested a tier test.\n│ **Mode:** ${emoji} ${match}\n│ **IGN:** ${ign}\n\n${SEP}`)
      .setTimestamp();
    await logToChannel(interaction.guild, 'tier-logs', logEmbed);
    return;
  }

  if (id.startsWith('tier_result_')) {
    const channelId = id.replace('tier_result_', '');
    const state = TICKET_STATE.get(channelId);
    if (!state) { await interaction.reply({ content: '❌ Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    const tierInput = interaction.fields.getTextInputValue('tier').trim().toUpperCase().replace(/\s+/g, '');
    const tierMatch = TIERS.find(t => t.name.toUpperCase() === tierInput);
    if (!tierMatch) { await interaction.reply({ content: `❌ Invalid tier. Use: ${TIERS.map(t => t.name).join(', ')}`, flags: MessageFlags.Ephemeral }); return; }

    const roleName = getTierRoleName(state.mode, tierMatch.name);
    const role = interaction.guild.roles.cache.find((r: any) => r.name === roleName);
    if (!role) { await interaction.reply({ content: `❌ Role ${roleName} not found. Run /makeroles first.`, flags: MessageFlags.Ephemeral }); return; }
    try {
      const member = await interaction.guild.members.fetch(state.playerId);
      await member.roles.add(role);
      await interaction.reply({ content: `✅ **${state.playerDisplay}** → **${roleName}**` });
      await interaction.channel.send({ content: `🏆 <@${state.playerId}> — Ranked **${roleName}**!` });
    } catch (e: any) { await interaction.reply({ content: `❌ Failed: ${e.message}`, flags: MessageFlags.Ephemeral }); }
    return;
  }

  if (id === 'staff_application') {
    const age = interaction.fields.getTextInputValue('age');
    const exp = interaction.fields.getTextInputValue('experience');
    const why = interaction.fields.getTextInputValue('why');
    await handleApplication(interaction, '📝 Staff Application', 'staff', { 'Age': age, 'Experience': exp, 'Why': why }, 0x9B59B6);
    return;
  }

  if (id === 'tester_application') {
    const ign = interaction.fields.getTextInputValue('ign');
    const pvp = interaction.fields.getTextInputValue('pvp_experience');
    const why = interaction.fields.getTextInputValue('why');
    await handleApplication(interaction, '⚔️ Tier Tester Application', 'tester', { 'IGN': ign, 'PvP Experience': pvp, 'Why': why }, 0xE67E22);
    return;
  }
}

async function handleApplication(interaction: any, title: string, type: string, fields: Record<string, string>, color: number) {
  const guild = interaction.guild;
  const staffCat = CATEGORIES.find(c => c.key === 'staff');
  const cat = guild.channels.cache.find((c: any) => c.type === ChannelType.GuildCategory && c.name === staffCat?.name);
  const channelName = `app-${type}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);

  const ch = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: cat,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ],
  });

  const fieldLines = Object.entries(fields).map(([k, v]) => `**${k}:** ${v}`).join('\n');
  const embed = new EmbedBuilder()
    .setTitle(`\u300C \u2726 ${title} \u2726 \u300D`)
    .setDescription(`### Applicant: ${interaction.user}\n\n${fieldLines}`)
    .setColor(color)
    .setFooter({ text: `\u2726 Pending review \u2726` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`app_approve_${interaction.user.id}`).setLabel('Approve').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`app_decline_${interaction.user.id}`).setLabel('Decline').setEmoji('❌').setStyle(ButtonStyle.Danger),
  );

  await ch.send({ embeds: [embed] as any, components: [row as any], content: `<@&${guild.roles.everyone.id}>` });
  await interaction.reply({ content: `✅ Application submitted! Check <#${ch.id}>`, flags: MessageFlags.Ephemeral });

  const logEmbed = new EmbedBuilder()
    .setTitle('\u300C \u2726 ＡＰＰＬＩＣＡＴＩＯＮ \u2726 \u300D')
    .setDescription(`**${interaction.user.tag}** submitted a **${type}** application.\n${fieldLines}`)
    .setColor(color).setTimestamp();
  await logToChannel(guild, 'applications', logEmbed);
}

const PORT = parseInt(process.env.PORT || '8080', 10);
const app = express();
app.use(express.json());
app.use(cors());

let membersCache: any[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 300_000;

async function getCachedMembers(guild: any) {
  if (!membersCache || Date.now() - cacheTime > CACHE_TTL) {
    await guild.members.fetch();
    membersCache = [...guild.members.cache.values()];
    cacheTime = Date.now();
  }
  return membersCache;
}

function getKitMapping(): Record<string, string> {
  return {
    overall: '', sword: 'Sword', axe: 'Axe', pot: 'Netherite Pot',
    vanilla: 'Vanilla', uhc: 'UHC', smp: 'SMP Pot', build: 'BuildUHC',
    parkour: '', events: '',
  };
}

function compareTier(a: string, b: string) {
  const order = ['LT5', 'HT5', 'LT4', 'HT4', 'LT3', 'HT3', 'LT2', 'HT2', 'LT1', 'HT1'];
  return order.indexOf(a) - order.indexOf(b);
}

function getPlayerTiers(member: any): Record<string, string> {
  const tiers: Record<string, string> = {};
  const pattern = /◆ (.+?) • (LT[1-5]|HT[1-5])/;
  for (const role of member.roles.cache.values()) {
    const m = role.name.match(pattern);
    if (m) {
      const mode = m[1].trim();
      const tier = m[2];
      if (!tiers[mode] || compareTier(tier, tiers[mode]) > 0) {
        tiers[mode] = tier;
      }
    }
  }
  return tiers;
}

function getHighestTier(member: any): string {
  const pattern = /◆ (.+?) • (LT[1-5]|HT[1-5])/;
  let highest = null;
  for (const role of member.roles.cache.values()) {
    const m = role.name.match(pattern);
    if (m) {
      const tier = m[2];
      if (!highest || compareTier(tier, highest) > 0) {
        highest = tier;
      }
    }
  }
  return highest || 'Unranked';
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', bot: client.user?.tag }));

app.get('/api/leaderboard/:kit', async (req, res) => {
  try {
    const kit = req.params.kit || 'overall';
    const modeName = getKitMapping()[kit];
    const lb = getLeaderboard();
    const guild = client.guilds.cache.first();

    const entries = await Promise.all(lb.slice(0, 100).map(async (p, i) => {
      const member = guild?.members.cache.get(p.userId);
      const tier = member ? getHighestTier(member) : 'Unranked';
      return {
        place: i + 1,
        username: p.ign,
        discriminator: '0000',
        points: p.points,
        tier,
        status: member?.presence?.status === 'online' ? 'Online' : 'Offline',
        avatar: `https://mc-heads.net/avatar/${p.ign}/100`,
      };
    }));

    res.json(entries);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/players', async (_req, res) => {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return res.json([]);
    const members = await getCachedMembers(guild);
    const data = getAllPlayerData();

    const players = members.map(m => {
      const pd = data[m.id] || { points: 0, modes: {} };
      const tierRoles = getPlayerTiers(m);
      const ign = pd.ign || m.user.username;
      const pts = pd.points || 0;
      const tier = getHighestTier(m);
      const roleList = Object.entries(tierRoles).map(([mode, t]) => formatTierRole(mode, t));
      const modeStats = Object.fromEntries(
        Object.entries(tierRoles).map(([mode, t]) => [
          mode.toLowerCase().replace(/\s+/g, ''),
          {
            points: 0,
            rank: 1,
            tier: t,
          }
        ])
      );

      return {
        id: m.id,
        username: ign,
        discordId: m.id,
        discriminator: m.user.discriminator || '0000',
        points: pts,
        tier,
        roles: roleList,
        avatar: `https://mc-heads.net/avatar/${ign}/100`,
        status: m.presence?.status === 'online' ? 'Online' : m.presence?.status === 'idle' ? 'Online' : 'Offline',
        joinDate: m.joinedAt?.toISOString() || '',
        lastActive: m.presence?.status === 'online' ? 'Just now' : 'Offline',
        weeklyPoints: Math.round(pts * 0.1),
        monthlyPoints: Math.round(pts * 0.4),
        totalPoints: pts,
        stats: modeStats,
        recentActivity: [],
      };
    });

    res.json(players);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/players/:name', async (req, res) => {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return res.status(404).json({ error: 'Not found' });
    const members = await getCachedMembers(guild);
    const data = getAllPlayerData();
    const name = req.params.name.toLowerCase();

    const member = members.find((m: any) => {
      const pd = data[m.id];
      const ign = (pd?.ign || m.user.username).toLowerCase();
      return ign === name || m.user.username.toLowerCase() === name;
    });

    if (!member) return res.status(404).json({ error: 'Player not found' });

    const pd = data[member.id] || { points: 0, modes: {} };
    const ign = pd.ign || member.user.username;
    const pts = pd.points || 0;
    const tier = getHighestTier(member);

    res.json({
      id: member.id,
      username: ign,
      discordId: member.id,
      discriminator: member.user.discriminator || '0000',
      points: pts,
      tier,
      roles: Object.values(getPlayerTiers(member)).filter(Boolean),
      avatar: `https://mc-heads.net/avatar/${ign}/100`,
      status: member.presence?.status === 'online' ? 'Online' : 'Offline',
      joinDate: member.joinedAt?.toISOString() || '',
      lastActive: member.presence?.status === 'online' ? 'Just now' : 'Offline',
      weeklyPoints: Math.round(pts * 0.1),
      monthlyPoints: Math.round(pts * 0.4),
      totalPoints: pts,
      stats: Object.fromEntries(
        Object.entries(getPlayerTiers(member)).map(([mode, t]) => [mode.toLowerCase().replace(/\s+/g, ''), { points: pts, rank: 1, tier: t }])
      ),
      recentActivity: [],
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/staff', async (_req, res) => {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return res.json([]);
    const staffPattern = /^(👑|⚡|🌐|🛡️|🔰|⚔️|💎|🔨|🎬)/;
    const members = await getCachedMembers(guild);
    const staffList = members.filter((m: any) => m.roles.cache.some((r: any) => staffPattern.test(r.name))).map((m: any) => {
      const staffRole = m.roles.cache.find((r: any) => staffPattern.test(r.name));
      return {
        name: m.user.username,
        role: staffRole?.name.replace(/^[^\w]*/, '').replace(/[「 」✦]/g, '').trim() || 'Staff',
        focus: 'Server management',
        avatar: `https://mc-heads.net/avatar/${m.user.username}/100`,
        discord: `${m.user.username}#${m.user.discriminator || '0000'}`,
      };
    });
    res.json(staffList.slice(0, 20));
  } catch { res.json([]); }
});

app.get('/api/news', (_req, res) => {
  res.json([
    { title: 'HARVAL MC Season 2 Live', blurb: 'New points system, tier testing, and leaderboards are now active.', date: new Date().toISOString().split('T')[0], category: 'Announcement' },
    { title: 'Tier Testing Open', blurb: 'Request your tier test in Discord. Prove your skill across 20 PvP modes.', date: new Date().toISOString().split('T')[0], category: 'Updates' },
  ]);
});

app.get('/api/stats', (_req, res) => {
  const guild = client.guilds.cache.first();
  res.json({
    name: 'Harval MC',
    ip: 'play.harvalmc.fun',
    version: '1.20.x - 1.21.x',
    members: guild?.memberCount?.toString() || '0',
    online: guild?.members.cache.filter(m => m.presence?.status === 'online').size.toString() || '0',
  });
});

if (!DISCORD_TOKEN) {
  console.error('❌ No DISCORD_TOKEN env var set');
  process.exit(1);
}

client.login(DISCORD_TOKEN).then(() => {
  app.listen(PORT, () => {
    console.log(`🌐 API server running on port ${PORT}`);
    const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.EXTERNAL_URL || '';
    if (externalUrl) {
      console.log(`🔄 Keep-alive pinging ${externalUrl} every 4 min`);
      setInterval(async () => {
        try { await fetch(`${externalUrl}/api/health`, { signal: AbortSignal.timeout(10000) }); }
        catch { /* keep-alive */ }
      }, 240_000);
    }
  });
}).catch(e => console.error('Login failed:', e.message));
