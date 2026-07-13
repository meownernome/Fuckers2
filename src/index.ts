import dotenv from 'dotenv';
import express from 'express';
import { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { getAllCommands } from './commands';
import { ServerSetup, CATEGORIES, CHANNEL_KEYS } from './ServerSetup';
import { GtgCommand } from './commands/GtgCommand';
import { ALL_ROLES, getTierRoleName } from './roles';
import { formatStaffRoleName } from './utils/textStyles';
import { createRole } from './utils/roleCreator';

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

const MODES = ['Sword', 'Crystal', 'SMP', 'Netherite Pot', 'Diamond Pot', 'UHC', 'BuildUHC', 'NoDebuff', 'Combo', 'Gapple', 'OP Duel', 'Boxing', 'Axe', 'Mace', 'Anchor', 'Cart PvP', 'Bedwars', 'Skywars', 'Bridge', 'Nodebuff', 'Vanilla', 'Crossbow', 'Trident', 'Shield', 'Elytra Combat', 'Custom Duel'];

const MODE_EMOJI: Record<string, string> = {
  'Sword': '⚔️', 'Crystal': '💎', 'SMP': '🛡️', 'Netherite Pot': '🌋', 'Diamond Pot': '💠',
  'UHC': '❤️', 'BuildUHC': '🏗️', 'NoDebuff': '🚫', 'Combo': '🥊', 'Gapple': '🍎',
  'OP Duel': '⚡', 'Boxing': '🥊', 'Axe': '🪓', 'Mace': '🔨', 'Anchor': '⚓',
  'Cart PvP': '🛒', 'Bedwars': '🛏️', 'Skywars': '☁️', 'Bridge': '🌉', 'Nodebuff': '🔥',
  'Vanilla': '🌿', 'Crossbow': '🏹', 'Trident': '🔱', 'Shield': '🛡️', 'Elytra Combat': '🦅',
  'Custom Duel': '🎯',
};

const TIERS = [
  { prefix: 'LT', level: 1, name: 'LT 1', color: 0x7F8C8D },
  { prefix: 'HT', level: 1, name: 'HT 1', color: 0x95A5A6 },
  { prefix: 'LT', level: 2, name: 'LT 2', color: 0x27AE60 },
  { prefix: 'HT', level: 2, name: 'HT 2', color: 0x2ECC71 },
  { prefix: 'LT', level: 3, name: 'LT 3', color: 0x2980B9 },
  { prefix: 'HT', level: 3, name: 'HT 3', color: 0x3498DB },
  { prefix: 'LT', level: 4, name: 'LT 4', color: 0x8E44AD },
  { prefix: 'HT', level: 4, name: 'HT 4', color: 0x9B59B6 },
  { prefix: 'LT', level: 5, name: 'LT 5', color: 0xD4AC0D },
  { prefix: 'HT', level: 5, name: 'HT 5', color: 0xF1C40F },
];

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

  // Auto-create all roles on startup
  for (const guild of client.guilds.cache.values()) {
    await ensureAllRoles(guild);
  }
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
    if (interaction.isButton()) await handleButton(interaction);
    else if (interaction.isModalSubmit()) await handleModal(interaction);
  } catch (e: any) { console.error(`Interaction error: ${e.message}`); }
});

async function handleButton(interaction: any) {
  const id = interaction.customId;

  if (id.startsWith('gtg_create_')) return GtgCommand.handleButton(interaction);
  if (id.startsWith('gtg_skip_')) return GtgCommand.handleSkip(interaction);

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

  if (id.startsWith('ticket_claim_')) {
    const channelId = id.replace('ticket_claim_', '');
    const state = TICKET_STATE.get(channelId);
    if (!state) { await interaction.reply({ content: '❌ Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    if (state.claimedBy) { await interaction.reply({ content: `❌ Already claimed by ${state.claimedByName}.`, flags: MessageFlags.Ephemeral }); return; }
    if (state.playerId === interaction.user.id) { await interaction.reply({ content: '❌ Cannot claim own ticket.', flags: MessageFlags.Ephemeral }); return; }

    state.claimedBy = interaction.user.id;
    state.claimedByName = interaction.member.displayName || interaction.user.username;
    const emoji = MODE_EMOJI[state.mode] || '🎮';

    const playerEmbed = new EmbedBuilder()
      .setTitle(`「 ✦ ＴＩＣＫＥＴ ✦ 」`)
      .setDescription(`### ${emoji} ${state.mode} — ${state.playerDisplay}\n\n**Player:** ${state.playerDisplay}\n**Mode:** ${emoji} ${state.mode}\n**Tester:** ⚔️ ${state.claimedByName}\n**Status:** 🟢 In Progress\n\n> **${state.claimedByName}** has claimed your ticket.`)
      .setColor(0x2ECC71).setFooter({ text: '✦ TICKET ✦' }).setTimestamp();
    await interaction.update({ embeds: [playerEmbed] as any, components: [] });

    const staffEmbed = new EmbedBuilder()
      .setTitle('「 ✦ ＣＯＮＴＲＯＬ ✦ 」')
      .setDescription(`### Staff Panel\n\nClaimed by **${state.claimedByName}**\n\n▶️ **Start** — Send IP\n🏆 **Give Tier** — Assign result\n✅ **Finish** — Close ticket`)
      .setColor(0x3498DB).setFooter({ text: state.playerDisplay }).setTimestamp();
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

  if (id.startsWith('gtg_create_')) {
    const { GtgCommand } = await import('./commands/GtgCommand');
    await GtgCommand.handleButton(interaction);
    return;
  }

  if (id.startsWith('gtg_skip_')) {
    const { GtgCommand } = await import('./commands/GtgCommand');
    await GtgCommand.handleSkip(interaction);
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
    await interaction.reply({ content: `✅ Verified as **${ign}**! Welcome.`, flags: MessageFlags.Ephemeral });
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
    await ch.send({ content: `🎫 Support ticket — <@${interaction.user.id}>\n**Subject:** ${subject}\n${desc}` });
    await interaction.reply({ content: `✅ Ticket created: <#${ch.id}>`, flags: MessageFlags.Ephemeral });
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

    const embed = new EmbedBuilder()
      .setTitle(`「 ✦ ＴＩＣＫＥＴ ✦ 」`)
      .setDescription(`### ${emoji} ${match} — ${ign}\n\n**Player:** ${ign}\n**Mode:** ${emoji} ${match}\n**Status:** 🟡 Awaiting Claim\n\n> A tester will claim your ticket shortly.`)
      .setColor(0xF1C40F).setFooter({ text: '✦ TICKET ✦' }).setTimestamp();
    const claimRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket_claim_${ticket.id}`).setLabel('Claim Ticket').setEmoji('⚔️').setStyle(ButtonStyle.Primary),
    );
    await ticket.send({ embeds: [embed] as any, components: [claimRow as any], content: `<@${interaction.user.id}>` });
    await interaction.reply({ content: `✅ ${match} ticket ready: <#${ticket.id}>`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (id.startsWith('tier_result_')) {
    const channelId = id.replace('tier_result_', '');
    const state = TICKET_STATE.get(channelId);
    if (!state) { await interaction.reply({ content: '❌ Ticket expired.', flags: MessageFlags.Ephemeral }); return; }
    const tierInput = interaction.fields.getTextInputValue('tier').trim().toUpperCase();
    const tierMatch = TIERS.find(t => t.name.toUpperCase() === tierInput);
    if (!tierMatch) { await interaction.reply({ content: '❌ Invalid tier. Use LT 1-5 or HT 1-5.', flags: MessageFlags.Ephemeral }); return; }

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
    const appChName = CHANNEL_KEYS['applications'];
    const appCh = interaction.guild.channels.cache.find((c: any) => c.name === appChName);
    if (appCh) {
      await appCh.send({ embeds: [new EmbedBuilder().setTitle('Staff Application').addFields(
        { name: 'Applicant', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Age', value: age, inline: true },
        { name: 'Experience', value: exp },
        { name: 'Why', value: why },
      ).setColor(0x9B59B6).setTimestamp()] as any });
    }
    await interaction.reply({ content: '✅ Application submitted!', flags: MessageFlags.Ephemeral });
    return;
  }

  if (id === 'tester_application') {
    const ign = interaction.fields.getTextInputValue('ign');
    const pvp = interaction.fields.getTextInputValue('pvp_experience');
    const why = interaction.fields.getTextInputValue('why');
    const appChName = CHANNEL_KEYS['applications'];
    const appCh = interaction.guild.channels.cache.find((c: any) => c.name === appChName);
    if (appCh) {
      await appCh.send({ embeds: [new EmbedBuilder().setTitle('Tester Application').addFields(
        { name: 'Applicant', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'IGN', value: ign, inline: true },
        { name: 'PvP Experience', value: pvp },
        { name: 'Why', value: why },
      ).setColor(0xE67E22).setTimestamp()] as any });
    }
    await interaction.reply({ content: '✅ Application submitted!', flags: MessageFlags.Ephemeral });
    return;
  }
}

const PORT = parseInt(process.env.PORT || '8080', 10);
const app = express();
app.get('/', (_req, res) => res.json({ status: 'ok', bot: client.user?.tag }));
app.listen(PORT, () => console.log(`🌐 Health check server on port ${PORT}`));

if (!DISCORD_TOKEN) {
  console.error('❌ No DISCORD_TOKEN env var set');
  process.exit(1);
}

client.login(DISCORD_TOKEN).catch(e => console.error('Login failed:', e.message));
