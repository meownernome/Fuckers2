import dotenv from 'dotenv';
import express from 'express';
import * as path from 'path';
import { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, MessageFlags, GuildMember } from 'discord.js';
import { getAllCommands } from './commands';
import { ServerSetup, CATEGORIES, CHANNEL_KEYS } from './ServerSetup';
import { GtgCommand } from './commands/GtgCommand';
import { MODES, TIERS, STAFF_PREFIX } from './roles';
import { roleName, staffRoleName } from './utils/textStyles';
import { createRole } from './utils/roleCreator';
import { logger } from './utils/Logger';
import { setPlayerIGN, getLeaderboard, getAllPlayerData } from './utils/pointsSystem';

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
  'Sword': '\u2694\uFE0F', 'Crystal': '\uD83D\uDC8E', 'SMP': '\uD83D\uDEE1\uFE0F',
  'Netherite Pot': '\uD83C\uDF0B', 'Diamond Pot': '\uD83D\uDC80',
  'BuildUHC': '\uD83C\uDFD7\uFE0F', 'UHC': '\u2764\uFE0F', 'NoDebuff': '\uD83D\uDEAB',
  'Gapple': '\uD83C\uDF4E', 'Combo': '\uD83E\uDD4A',
  'Boxing': '\uD83E\uDD4A', 'Bridge': '\uD83C\uDF09', 'Anchor': '\u2693',
  'Mace': '\uD83D\uDD28', 'Axe': '\uD83E\uDE93',
  'Cart PvP': '\uD83D\uDEF2', 'Vanilla': '\uD83C\uDF3F',
  'Bedwars': '\uD83D\uDECF\uFE0F', 'Skywars': '\u2601\uFE0F', 'Custom': '\uD83C\uDFAF',
};

async function logToChannel(guild: any, key: string, embed: EmbedBuilder) {
  const name = CHANNEL_KEYS[key];
  if (!name) return;
  const ch = guild.channels.cache.find((c: any) => c.name === name && c.type === ChannelType.GuildText) as any;
  if (ch) ch.send({ embeds: [embed] }).catch(() => {});
}

async function registerCommands() {
  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.commands.set(commands.map(c => c.command.toJSON()));
      console.log(`Registered ${commands.length} commands in ${guild.name}`);
    } catch (e: any) { console.error(`Guild reg fail: ${e.message}`); }
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user!.tag}`);
  await registerCommands();
  console.log(`Total commands: ${commands.length}`);
});

client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  const guild = member.guild;
  const memberRoleName = staffRoleName('\uD83D\uDC64', 'Member');
  const memberRole = guild.roles.cache.find((r: any) => r.name === memberRoleName);
  if (memberRole) member.roles.add(memberRole).catch(() => {});

  const welcomeName = CHANNEL_KEYS['welcome'];
  const welcomeCh = guild.channels.cache.find((c: any) => c.name === welcomeName && c.type === ChannelType.GuildText) as any;
  if (welcomeCh) {
    const embed = new EmbedBuilder()
      .setDescription(`**${member.user.username}** joined HARVAL MC!\n\nRead rules, verify, and request a tier test. Member #${guild.memberCount}`)
      .setColor(0xFFD700);
    welcomeCh.send({ embeds: [embed], content: `${member.user}` }).catch(() => {});
  }
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    await guild.commands.set(commands.map(c => c.command.toJSON()));
    console.log(`Registered commands in new guild: ${guild.name}`);
  } catch (e: any) { console.error(`Guild reg fail: ${e.message}`); }
});

client.on(Events.GuildUpdate, async () => {
  await registerCommands();
});

client.on(Events.InteractionCreate, async (interaction: any) => {
  try {
    if (interaction.isCommand()) {
      const cmd = commands.find((c: any) => c.command.name === interaction.commandName);
      if (cmd) {
        const logEmbed = new EmbedBuilder()
          .setDescription(`**${interaction.user.tag}** used \`/${interaction.commandName}\``)
          .setColor(0x3498DB).setTimestamp();
        logToChannel(interaction.guild, 'command-logs', logEmbed);
        await cmd.execute(interaction);
      }
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
      .setDescription(`Deleted ${result.channels} channels, ${result.roles} roles`)
      .setColor(0x2ECC71);
    await interaction.editReply({ embeds: [embed], components: [] });
    return;
  }

  if (id === 'cleanup_cancel') {
    await interaction.update({ content: 'Cancelled.', embeds: [], components: [] });
    return;
  }

  if (id === 'verify_button') {
    const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Verify Your Account');
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Notch'),
    ));
    await interaction.showModal(modal);
    return;
  }

  if (id === 'support_ticket') {
    const modal = new ModalBuilder().setCustomId('support_ticket_modal').setTitle('Support Ticket');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('subject').setLabel('Subject').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Describe your issue').setStyle(TextInputStyle.Paragraph).setRequired(true)),
    );
    await interaction.showModal(modal);
    return;
  }

  if (id === 'request_tier_test') {
    const modal = new ModalBuilder().setCustomId('tier_test_request').setTitle('Request Tier Test');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('mode').setLabel('Game Mode').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('Sword, Crystal, UHC, Boxing...')),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('Your Minecraft IGN').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Notch')),
    );
    await interaction.showModal(modal);
    return;
  }

  if (id === 'staff_apply') {
    const modal = new ModalBuilder().setCustomId('staff_application').setTitle('Staff Application');
    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('age').setLabel('Your Age').setStyle(TextInputStyle.Short).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('experience').setLabel('Previous Staff Experience').setStyle(TextInputStyle.Paragraph).setRequired(true)),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder().setCustomId('why').setLabel('Why be staff?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
    );
    await interaction.showModal(modal);
    return;
  }

  if (id === 'tester_apply') {
    const modal = new ModalBuilder().setCustomId('tester_application').setTitle('Tier Tester Application');
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
      const staffRole = interaction.guild.roles.cache.find((r: any) => STAFF_PREFIX.test(r.name));
      if (staffRole) member.roles.add(staffRole).catch(() => {});
    }
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x2ECC71)
      .setFooter({ text: `Approved by ${interaction.user.tag}` });
    await interaction.editReply({ embeds: [embed], components: [] });
    await interaction.channel.send({ content: `\u2705 <@${targetId}> your application was **approved**!` });
    return;
  }

  if (id.startsWith('app_decline_')) {
    await interaction.deferUpdate();
    const targetId = id.replace('app_decline_', '');
    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0xE74C3C)
      .setFooter({ text: `Declined by ${interaction.user.tag}` });
    await interaction.editReply({ embeds: [embed], components: [] });
    await interaction.channel.send({ content: `\u274C <@${targetId}> your application was **declined**.` });
    return;
  }

  if (id.startsWith('ticket_claim_')) {
    const channelId = id.replace('ticket_claim_', '');
    const state = TICKET_STATE.get(channelId);
    if (!state) { await interaction.reply({ content: 'Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    if (state.claimedBy) { await interaction.reply({ content: `Already claimed by ${state.claimedByName}.`, flags: MessageFlags.Ephemeral }); return; }
    if (state.playerId === interaction.user.id) { await interaction.reply({ content: 'Cannot claim own ticket.', flags: MessageFlags.Ephemeral }); return; }

    state.claimedBy = interaction.user.id;
    state.claimedByName = interaction.member.displayName || interaction.user.username;
    const emoji = MODE_EMOJI[state.mode] || '\uD83C\uDFAE';

    const playerEmbed = new EmbedBuilder()
      .setDescription(`${emoji} ${state.mode} — ${state.playerDisplay}\n\n**Player:** ${state.playerDisplay}\n**Mode:** ${emoji} ${state.mode}\n**Tester:** ${state.claimedByName}\n**Status:** In Progress\n\n${state.claimedByName} has claimed your ticket.`)
      .setColor(0x2ECC71);
    await interaction.update({ embeds: [playerEmbed], components: [] });

    const staffEmbed = new EmbedBuilder()
      .setDescription(`Claimed by **${state.claimedByName}**\n\n\u25B6\uFE0F Start — Send IP\n\uD83C\uDFC6 Give Tier — Assign result\n\u2705 Finish — Close ticket`)
      .setColor(0x3498DB);
    const staffRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket_claim_${channelId}`).setLabel('Claimed').setStyle(ButtonStyle.Success).setDisabled(true),
      new ButtonBuilder().setCustomId(`ticket_start_${channelId}`).setLabel('Start').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ticket_givetier_${channelId}`).setLabel('Give Tier').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket_finish_${channelId}`).setLabel('Finish').setStyle(ButtonStyle.Danger),
    );
    await interaction.followUp({ embeds: [staffEmbed], components: [staffRow] });
    await interaction.followUp({ content: `${state.claimedByName} claimed this ticket. <@${state.playerId}> please wait.` });
    return;
  }

  if (id.startsWith('ticket_start_')) {
    const channelId = id.replace('ticket_start_', '');
    const state = TICKET_STATE.get(channelId);
    if (!state) { await interaction.reply({ content: 'Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    await interaction.reply({ content: `**Server IP:** \`play.harvalmc.fun\`\n**Mode:** ${state.mode}\n\n<@${state.playerId}> please join.` });
    return;
  }

  if (id.startsWith('ticket_givetier_')) {
    const channelId = id.replace('ticket_givetier_', '');
    if (!TICKET_STATE.get(channelId)) { await interaction.reply({ content: 'Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    const modal = new ModalBuilder().setCustomId(`tier_result_${channelId}`).setTitle('Assign Tier');
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder().setCustomId('tier').setLabel('Tier (LT 1 / HT 3)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. HT 3'),
    ));
    await interaction.showModal(modal);
    return;
  }

  if (id.startsWith('ticket_finish_')) {
    const channelId = id.replace('ticket_finish_', '');
    TICKET_STATE.delete(channelId);
    await interaction.reply({ content: 'Closing ticket...' });
    setTimeout(async () => { try { await interaction.channel?.delete(); } catch {} }, 3000);
    return;
  }
}

async function handleModal(interaction: any) {
  const id = interaction.customId;

  if (id === 'verify_modal') {
    const ign = interaction.fields.getTextInputValue('ign');
    const verifiedRoleName = staffRoleName('\u2705', 'Verified');
    const verifyRole = interaction.guild.roles.cache.find((r: any) => r.name === verifiedRoleName);
    if (verifyRole) { try { await interaction.member.roles.add(verifyRole); } catch {} }
    setPlayerIGN(interaction.user.id, ign);
    await interaction.reply({ content: `Verified as **${ign}**!`, flags: MessageFlags.Ephemeral });

    const logEmbed = new EmbedBuilder()
      .setDescription(`**${interaction.user.tag}** verified as **${ign}**.`)
      .setColor(0x2ECC71).setTimestamp();
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
    const embed = new EmbedBuilder()
      .setDescription(`**User:** ${interaction.user}\n**Subject:** ${subject}\n**Description:** ${desc}`)
      .setColor(0xF1C40F);
    await ch.send({ embeds: [embed], content: `<@${interaction.user.id}>` });
    await interaction.reply({ content: `Ticket created: <#${ch.id}>`, flags: MessageFlags.Ephemeral });

    const logEmbed = new EmbedBuilder()
      .setDescription(`**${interaction.user.tag}** opened a ticket.\n**Subject:** ${subject}`)
      .setColor(0xF1C40F).setTimestamp();
    await logToChannel(interaction.guild, 'ticket-logs', logEmbed);
    return;
  }

  if (id === 'tier_test_request') {
    const mode = interaction.fields.getTextInputValue('mode').trim();
    const ign = interaction.fields.getTextInputValue('ign').trim();
    const match = MODES.find(m => m.toLowerCase() === mode.toLowerCase());
    if (!match) { await interaction.reply({ content: `Invalid mode. Options: ${MODES.join(', ')}`, flags: MessageFlags.Ephemeral }); return; }

    const ticket = await new ServerSetup(interaction.client, interaction.guild).createTicket(match, {
      id: interaction.user.id, username: interaction.user.username, displayName: interaction.member.displayName || interaction.user.username,
    });
    if (!ticket) { await interaction.reply({ content: 'No tickets category found.', flags: MessageFlags.Ephemeral }); return; }

    const emoji = MODE_EMOJI[match] || '\uD83C\uDFAE';
    TICKET_STATE.set(ticket.id, { channelId: ticket.id, mode: match, playerId: interaction.user.id, playerName: interaction.user.username, playerDisplay: ign });

    const embed = new EmbedBuilder()
      .setDescription(`${emoji} ${match} — ${ign}\n\n**Player:** ${ign}\n**Mode:** ${emoji} ${match}\n**Status:** Awaiting Claim\n\nA tester will claim your ticket shortly.`)
      .setColor(0xF1C40F);
    const claimRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket_claim_${ticket.id}`).setLabel('Claim Ticket').setStyle(ButtonStyle.Primary),
    );
    await ticket.send({ embeds: [embed], components: [claimRow], content: `<@${interaction.user.id}>` });
    await interaction.reply({ content: `${match} ticket ready: <#${ticket.id}>`, flags: MessageFlags.Ephemeral });

    const logEmbed = new EmbedBuilder()
      .setDescription(`**${interaction.user.tag}** requested a tier test.\n**Mode:** ${emoji} ${match}\n**IGN:** ${ign}`)
      .setColor(0xE67E22).setTimestamp();
    await logToChannel(interaction.guild, 'tier-logs', logEmbed);
    return;
  }

  if (id.startsWith('tier_result_')) {
    const channelId = id.replace('tier_result_', '');
    const state = TICKET_STATE.get(channelId);
    if (!state) { await interaction.reply({ content: 'Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    const tierInput = interaction.fields.getTextInputValue('tier').trim().toUpperCase();
    const tierMatch = TIERS.find(t => t.name.toUpperCase() === tierInput);
    if (!tierMatch) { await interaction.reply({ content: 'Invalid tier. Use LT 1-5 or HT 1-5.', flags: MessageFlags.Ephemeral }); return; }

    const roleNameStr = roleName(state.mode, tierMatch.name);
    const role = interaction.guild.roles.cache.find((r: any) => r.name === roleNameStr);
    if (!role) { await interaction.reply({ content: `Role ${roleNameStr} not found.`, flags: MessageFlags.Ephemeral }); return; }
    try {
      const member = await interaction.guild.members.fetch(state.playerId);
      await member.roles.add(role);
      await interaction.reply({ content: `**${state.playerDisplay}** \u2192 **${roleNameStr}**` });
      await interaction.channel.send({ content: `<@${state.playerId}> — Ranked **${roleNameStr}**!` });
    } catch (e: any) { await interaction.reply({ content: `Failed: ${e.message}`, flags: MessageFlags.Ephemeral }); }
    return;
  }

  if (id === 'staff_application') {
    const age = interaction.fields.getTextInputValue('age');
    const exp = interaction.fields.getTextInputValue('experience');
    const why = interaction.fields.getTextInputValue('why');
    await handleApplication(interaction, 'Staff Application', 'staff', { 'Age': age, 'Experience': exp, 'Why': why }, 0x9B59B6);
    return;
  }

  if (id === 'tester_application') {
    const ign = interaction.fields.getTextInputValue('ign');
    const pvp = interaction.fields.getTextInputValue('pvp_experience');
    const why = interaction.fields.getTextInputValue('why');
    await handleApplication(interaction, 'Tier Tester Application', 'tester', { 'IGN': ign, 'PvP Experience': pvp, 'Why': why }, 0xE67E22);
    return;
  }
}

async function handleApplication(interaction: any, title: string, type: string, fields: Record<string, string>, color: number) {
  const guild = interaction.guild;
  const staffCat = CATEGORIES.find(c => c.key === 'staff');
  const cat = guild.channels.cache.find((c: any) => c.type === ChannelType.GuildCategory && c.name === staffCat?.name);
  const channelName = `app-${type}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);

  const ch = await guild.channels.create({
    name: channelName, type: ChannelType.GuildText, parent: cat,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ],
  });

  const fieldLines = Object.entries(fields).map(([k, v]) => `**${k}:** ${v}`).join('\n');
  const embed = new EmbedBuilder()
    .setDescription(`**Applicant:** ${interaction.user}\n\n${fieldLines}`)
    .setColor(color)
    .setFooter({ text: 'Pending review' })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`app_approve_${interaction.user.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`app_decline_${interaction.user.id}`).setLabel('Decline').setStyle(ButtonStyle.Danger),
  );

  await ch.send({ embeds: [embed], components: [row], content: `<@&${guild.roles.everyone.id}>` });
  await interaction.reply({ content: `Application submitted! <#${ch.id}>`, flags: MessageFlags.Ephemeral });

  const logEmbed = new EmbedBuilder()
    .setDescription(`**${interaction.user.tag}** submitted a **${type}** application.\n${fieldLines}`)
    .setColor(color).setTimestamp();
  await logToChannel(guild, 'applications', logEmbed);
}

const PORT = parseInt(process.env.PORT || '8080', 10);
const app = express();
app.use(express.json());

function getKitMapping(): Record<string, string> {
  return {
    overall: '', sword: 'Sword', axe: 'Axe', pot: 'Netherite Pot',
    vanilla: 'Vanilla', uhc: 'UHC', smp: 'SMP', build: 'BuildUHC',
  };
}

function compareTier(a: string, b: string) {
  const order = ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'];
  return order.indexOf(a) - order.indexOf(b);
}

function getPlayerTiers(member: any): Record<string, string> {
  const tiers: Record<string, string> = {};
  const pattern = /\u25C6 (.+?) \u2022 (LT|HT [1-5])/;
  for (const role of member.roles.cache.values()) {
    const m = role.name.match(pattern);
    if (m) {
      const mode = m[1];
      if (!tiers[mode] || compareTier(m[2], tiers[mode]) > 0) {
        tiers[mode] = m[2];
      }
    }
  }
  return tiers;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', bot: client.user?.tag }));

app.get('/api/leaderboard/:kit', async (req, res) => {
  try {
    const kit = req.params.kit || 'overall';
    const lb = getLeaderboard();
    const entries = lb.slice(0, 100).map((p, i) => {
      const data = getAllPlayerData();
      const pd = data[p.userId];
      let pts = (pd?.points || 0);
      return {
        place: i + 1, username: p.ign, discriminator: '0000',
        points: pts,
        tier: pts >= 10000 ? 'Grandmaster' : pts >= 5000 ? 'Master' : pts >= 2500 ? 'Diamond' : pts >= 1000 ? 'Platinum' : pts >= 500 ? 'Gold' : pts >= 100 ? 'Silver' : 'Bronze',
        status: 'Online',
        avatar: p.ign && p.ign !== p.userId ? `https://mc-heads.net/avatar/${p.ign}/100` : undefined,
      };
    });
    res.json(entries);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/players', async (_req, res) => {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return res.json([]);
    await guild.members.fetch();
    const data = getAllPlayerData();
    const players = guild.members.cache.map(m => {
      const pd = data[m.id] || { points: 0, modes: {} };
      const tierRoles = getPlayerTiers(m);
      const ign = pd.ign || m.user.username;
      const pts = pd.points || 0;
      return {
        id: m.id, username: ign, discordId: m.id, discriminator: '0000',
        points: pts,
        tier: pts >= 10000 ? 'Grandmaster' : pts >= 5000 ? 'Master' : pts >= 2500 ? 'Diamond' : pts >= 1000 ? 'Platinum' : pts >= 500 ? 'Gold' : pts >= 100 ? 'Silver' : 'Bronze',
        roles: Object.values(tierRoles).filter(Boolean),
        avatar: `https://mc-heads.net/avatar/${ign}/100`,
        status: m.presence?.status === 'online' ? 'Online' : 'Offline',
        joinDate: m.joinedAt?.toISOString() || '',
        lastActive: m.presence?.status === 'online' ? 'Just now' : 'Offline',
        weeklyPoints: Math.round(pts * 0.1),
        monthlyPoints: Math.round(pts * 0.4),
        totalPoints: pts,
        stats: Object.fromEntries(
          Object.entries(pd.modes || {}).map(([mode, tier]) => [mode.toLowerCase().replace(/\s+/g, ''), { points: pts, rank: 1, tier }])
        ),
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
    await guild.members.fetch();
    const data = getAllPlayerData();
    const name = req.params.name.toLowerCase();
    const member = guild.members.cache.find((m: any) => {
      const pd = data[m.id];
      const ign = (pd?.ign || m.user.username).toLowerCase();
      return ign === name || m.user.username.toLowerCase() === name;
    });
    if (!member) return res.status(404).json({ error: 'Player not found' });
    const pd = data[member.id] || { points: 0, modes: {} };
    const ign = pd.ign || member.user.username;
    const pts = pd.points || 0;
    res.json({
      id: member.id, username: ign, discordId: member.id, discriminator: '0000',
      points: pts,
      tier: pts >= 10000 ? 'Grandmaster' : pts >= 5000 ? 'Master' : pts >= 2500 ? 'Diamond' : pts >= 1000 ? 'Platinum' : pts >= 500 ? 'Gold' : pts >= 100 ? 'Silver' : 'Bronze',
      roles: Object.values(getPlayerTiers(member)).filter(Boolean),
      avatar: `https://mc-heads.net/avatar/${ign}/100`,
      status: member.presence?.status === 'online' ? 'Online' : 'Offline',
      joinDate: member.joinedAt?.toISOString() || '',
      lastActive: member.presence?.status === 'online' ? 'Just now' : 'Offline',
      weeklyPoints: Math.round(pts * 0.1),
      monthlyPoints: Math.round(pts * 0.4),
      totalPoints: pts,
      stats: Object.fromEntries(
        Object.entries(pd.modes || {}).map(([mode, tier]) => [mode.toLowerCase().replace(/\s+/g, ''), { points: pts, rank: 1, tier }])
      ),
      recentActivity: [],
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/staff', async (_req, res) => {
  try {
    const guild = client.guilds.cache.first();
    if (!guild) return res.json([]);
    const members = guild.members.cache.filter((m: any) => m.roles.cache.some((r: any) => /\u25C6/.test(r.name)));
    const staffList = members.map((m: any) => {
      const staffRole = m.roles.cache.find((r: any) => /\u25C6/.test(r.name));
      return {
        name: m.user.username,
        role: staffRole?.name.replace(/^[^\w]*/, '').replace(/[\u25C6\u2022]/g, '').trim() || 'Staff',
        focus: 'Server management',
        avatar: `https://mc-heads.net/avatar/${m.user.username}/100`,
        discord: `${m.user.username}#0000`,
      };
    });
    res.json(staffList.slice(0, 20));
  } catch { res.json([]); }
});

app.get('/api/news', (_req, res) => {
  res.json([
    { title: 'HARVAL MC Live', blurb: 'New points system, tier testing, and leaderboards are active.', date: new Date().toISOString().split('T')[0], category: 'Announcement' },
    { title: 'Tier Testing Open', blurb: 'Request your tier test in Discord. Prove your skill across 20 PvP modes.', date: new Date().toISOString().split('T')[0], category: 'Updates' },
  ]);
});

app.get('/api/stats', (_req, res) => {
  const guild = client.guilds.cache.first();
  res.json({
    name: 'Harval MC', ip: 'play.harvalmc.fun', version: '1.20.x - 1.21.x',
    members: guild?.memberCount?.toString() || '0',
    online: guild?.members.cache.filter(m => m.presence?.status === 'online').size.toString() || '0',
  });
});

app.listen(PORT, () => console.log(`Health check server on port ${PORT}`));

if (!DISCORD_TOKEN) {
  console.error('No DISCORD_TOKEN env var set');
  process.exit(1);
}

client.login(DISCORD_TOKEN).catch(e => console.error('Login failed:', e.message));
