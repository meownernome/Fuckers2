import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { ALL_ROLES, MODES, TIERS, STAFF_PREFIX } from '../roles';
import { roleName } from '../utils/textStyles';
import { addTierPoints, POINT_MODES, TIER_POINTS } from '../utils/pointsSystem';
import { createRole } from '../utils/roleCreator';

const gtgState = new Map<string, { guildId: string; idx: number }>();

function isStaff(member: any): boolean {
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions?.has(PermissionFlagsBits.ManageRoles)) return true;
  return member.roles?.cache?.some((r: any) => STAFF_PREFIX.test(r.name)) ?? false;
}

function findNextIndex(guild: any, start: number): number {
  const names = new Set(guild.roles.cache.map((r: any) => r.name));
  for (let i = start; i < ALL_ROLES.length; i++) {
    if (!names.has(ALL_ROLES[i].name)) return i;
  }
  return ALL_ROLES.length;
}

function parseHexColor(color: string): number {
  const hex = color.replace('#', '').replace('0x', '');
  const val = parseInt(hex, 16);
  if (isNaN(val)) return 0x99AAB5;
  return val;
}

export class GtgCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      await this.handleAdd(interaction);
    } else if (sub === 'list') {
      await this.handleList(interaction);
    } else if (sub === 'mode') {
      await this.handleMode(interaction);
    } else if (sub === 'give') {
      await this.handleGive(interaction);
    } else {
      await this.handleGtg(interaction);
    }
  }

  private async handleGtg(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: 'Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const guild = interaction.guild!;
    await guild.roles.fetch();

    const startIdx = findNextIndex(guild, 0);
    if (startIdx >= ALL_ROLES.length) {
      await interaction.reply({ content: 'All roles already exist.', flags: MessageFlags.Ephemeral });
      return;
    }

    const stateKey = `gtg_${interaction.user.id}`;
    gtgState.set(stateKey, { guildId: guild.id, idx: startIdx });

    const remaining = ALL_ROLES.length - startIdx;
    const embed = new EmbedBuilder()
      .setDescription(`**Next:** ${ALL_ROLES[startIdx].name}\n**Remaining:** ${remaining}/${ALL_ROLES.length}`)
      .setColor(0x3498DB)
      .setFooter({ text: '\u25C6 Role creation \u25C6' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next').setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  }

  private async handleAdd(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: 'Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name', true);
    const colorStr = interaction.options.getString('color');
    const color = colorStr ? parseHexColor(colorStr) : 0x99AAB5;

    const guild = interaction.guild!;
    await guild.roles.fetch();

    if (guild.roles.cache.some((r: any) => r.name === name)) {
      await interaction.reply({ content: `Role **${name}** already exists.`, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await createRole(guild, name, color);
      const embed = new EmbedBuilder()
        .setDescription(`**Created:** ${name}\n**Color:** \`#${color.toString(16).padStart(6, '0')}\``)
        .setColor(color)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e: any) {
      await interaction.editReply({ content: `Failed: ${e.message}` });
    }
  }

  private async handleList(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: 'Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const filePath = path.join(process.cwd(), 'all_roles_list.txt');
    if (!fs.existsSync(filePath)) {
      await interaction.reply({ content: 'File `all_roles_list.txt` not found.', flags: MessageFlags.Ephemeral });
      return;
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
    if (lines.length === 0) {
      await interaction.reply({ content: 'No valid role data in file.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    await guild.roles.fetch();
    const existingNames = new Set(guild.roles.cache.map((r: any) => r.name));

    const toCreate: { name: string; color: number }[] = [];
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 1 || !parts[0]) { errors.push(`Invalid: ${line}`); continue; }
      const name = parts[0];
      const color = parts[1] ? parseHexColor(parts[1]) : 0x99AAB5;
      if (existingNames.has(name)) { errors.push(`Exists: ${name}`); continue; }
      toCreate.push({ name, color });
    }

    if (toCreate.length === 0) {
      await interaction.editReply({ content: `No roles to create.\n${errors.slice(0, 5).join('\n')}` });
      return;
    }

    await interaction.editReply({ content: `Creating ${toCreate.length} roles in batches of 5...` });

    const failed: string[] = [];
    const BATCH = 5;

    for (let i = 0; i < toCreate.length; i += BATCH) {
      const batch = toCreate.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(r => guild.roles.create({ name: r.name, colors: { primaryColor: r.color }, hoist: false, mentionable: false, reason: 'GTG bulk' })
          .then(() => true)
          .catch(() => { failed.push(r.name); return false; }))
      );
      await interaction.editReply({ content: `Created ${Math.min(i + BATCH, toCreate.length)}/${toCreate.length} roles...` });
    }

    const created = toCreate.length - failed.length;
    const embed = new EmbedBuilder()
      .setDescription(
        `**Created:** ${created}/${toCreate.length}\n` +
        (failed.length > 0 ? `**Failed:** ${failed.length}\n${failed.slice(0, 5).map(n => `\u25C6 ${n}`).join('\n')}` : '') +
        (errors.length > 0 ? `\n**Skipped:** ${errors.length} invalid lines` : '')
      )
      .setColor(failed.length > 0 ? 0xF1C40F : 0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  }

  private async handleMode(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: 'Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const mode = interaction.options.getString('mode', true);
    if (!MODES.includes(mode)) {
      await interaction.reply({ content: `Invalid mode. Options: ${MODES.join(', ')}`, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    await guild.roles.fetch();
    const existing = new Set(guild.roles.cache.map((r: any) => r.name));

    const toCreate = TIERS.map(t => ({ name: roleName(mode, t.name), color: t.color }));
    const skipped = toCreate.filter(r => existing.has(r.name));
    const needed = toCreate.filter(r => !existing.has(r.name));

    if (needed.length === 0) {
      await interaction.editReply({ content: `All **${mode}** roles exist.` });
      return;
    }

    await interaction.editReply({ content: `Creating ${needed.length} ${mode} roles...` });

    const failed: string[] = [];
    const BATCH = 5;

    for (let i = 0; i < needed.length; i += BATCH) {
      const batch = needed.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(r => guild.roles.create({ name: r.name, colors: { primaryColor: r.color }, hoist: false, mentionable: false, reason: `GTG ${mode}` })
          .then(() => {})
          .catch(() => { failed.push(r.name); }))
      );
      await interaction.editReply({ content: `${mode}: ${Math.min(i + BATCH, needed.length)}/${needed.length}` });
    }

    const created = needed.length - failed.length;
    const embed = new EmbedBuilder()
      .setDescription(
        `**Created:** ${created}/${needed.length} for ${mode}\n` +
        (skipped.length ? `**Exists:** ${skipped.length}\n` : '') +
        (failed.length ? `**Failed:** ${failed.length}\n${failed.slice(0, 3).map(n => `\u25C6 ${n}`).join('\n')}` : '')
      )
      .setColor(0x2ECC71).setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  }

  private async handleGive(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: 'Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const mode = interaction.options.getString('mode', true);
    const tier = interaction.options.getString('tier', true);
    const tierLabel = `${tier.toUpperCase().includes('LT') ? 'LT' : 'HT'} ${tier.replace(/[^0-9]/g, '')}`;

    if (!MODES.includes(mode)) {
      await interaction.reply({ content: `Invalid mode. Options: ${MODES.join(', ')}`, flags: MessageFlags.Ephemeral });
      return;
    }

    const validTiers = TIERS.map(t => t.name);
    if (!validTiers.includes(tierLabel)) {
      await interaction.reply({ content: `Invalid tier. Use: ${validTiers.join(', ')}`, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: 'User not found in this server.' });
      return;
    }

    const roleNameStr = roleName(mode, tierLabel);
    let role = guild.roles.cache.find((r: any) => r.name === roleNameStr);
    if (!role) {
      try {
        const tierData = TIERS.find(t => t.name === tierLabel)!;
        role = await guild.roles.create({ name: roleNameStr, colors: { primaryColor: tierData.color }, hoist: false, mentionable: false, reason: `GTG give by ${interaction.user.tag}` });
      } catch (e: any) {
        await interaction.editReply({ content: `Failed to create role: ${e.message}` });
        return;
      }
    }

    try {
      await member.roles.add(role);
      if (POINT_MODES.includes(mode) && TIER_POINTS[tierLabel]) {
        addTierPoints(user.id, mode, tierLabel, user.displayName);
      }
      const embed = new EmbedBuilder()
        .setDescription(`**${user}** received **${roleNameStr}**`)
        .setColor(0x2ECC71).setTimestamp();
      await interaction.editReply({ embeds: [embed] });
    } catch (e: any) {
      await interaction.editReply({ content: `Failed to give role: ${e.message}` });
    }
  }

  static async handleButton(interaction: any) {
    if (!interaction.customId.startsWith('gtg_create_')) return;

    await interaction.deferUpdate();

    if (!isStaff(interaction.member)) {
      await interaction.editReply({ content: 'Staff only.', components: [] });
      return;
    }

    const stateKey = interaction.customId.replace('gtg_create_', '');
    const state = gtgState.get(stateKey);
    if (!state) {
      await interaction.editReply({ content: 'Session expired. Run /gtg again.', components: [] });
      return;
    }

    const guild = interaction.guild!;
    if (guild.id !== state.guildId) {
      await interaction.editReply({ content: 'Wrong server.', components: [] });
      return;
    }

    await guild.roles.fetch();
    const idx = findNextIndex(guild, state.idx);
    if (idx >= ALL_ROLES.length) {
      const embed = new EmbedBuilder()
        .setDescription(`All ${ALL_ROLES.length} roles created.`)
        .setColor(0x2ECC71);
      await interaction.editReply({ embeds: [embed], components: [] });
      gtgState.delete(stateKey);
      return;
    }

    const role = ALL_ROLES[idx];
    try {
      await createRole(guild, role.name, role.color);
    } catch (e: any) {
      const embed = new EmbedBuilder()
        .setDescription(`Failed: **${role.name}** — ${e.message}`)
        .setColor(0xE74C3C);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Retry').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`gtg_skip_${stateKey}`).setLabel('Skip').setStyle(ButtonStyle.Secondary),
      );
      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }

    state.idx = idx + 1;
    await guild.roles.fetch();
    const nextIdx = findNextIndex(guild, state.idx);

    if (nextIdx >= ALL_ROLES.length) {
      const embed = new EmbedBuilder()
        .setDescription(`Created **${role.name}**\n\nAll ${ALL_ROLES.length} roles done!`)
        .setColor(0x2ECC71);
      await interaction.editReply({ embeds: [embed], components: [] });
      gtgState.delete(stateKey);
      return;
    }

    const next = ALL_ROLES[nextIdx];
    const remaining = ALL_ROLES.length - nextIdx;
    const embed = new EmbedBuilder()
      .setDescription(`Created **${role.name}**\n\n**Next:** ${next.name}\n**Remaining:** ${remaining}/${ALL_ROLES.length}`)
      .setColor(0x3498DB)
      .setFooter({ text: '\u25C6 Role creation \u25C6' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next').setStyle(ButtonStyle.Success),
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }

  static async handleSkip(interaction: any) {
    if (!interaction.customId.startsWith('gtg_skip_')) return;

    await interaction.deferUpdate();

    if (!isStaff(interaction.member)) {
      await interaction.editReply({ content: 'Staff only.', components: [] });
      return;
    }

    const stateKey = interaction.customId.replace('gtg_skip_', '');
    const state = gtgState.get(stateKey);
    if (!state) {
      await interaction.editReply({ content: 'Session expired.', components: [] });
      return;
    }

    state.idx++;
    await this.handleButton(interaction);
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('gtg')
      .setDescription('Create roles (staff only)')
      .addSubcommand(sub => sub
        .setName('add')
        .setDescription('Add a single role')
        .addStringOption(opt => opt.setName('name').setDescription('Role name').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Hex color').setRequired(false)))
      .addSubcommand(sub => sub
        .setName('list')
        .setDescription('Bulk create roles from all_roles_list.txt'))
      .addSubcommand(sub => sub
        .setName('mode')
        .setDescription('Create 10 tiers for a PvP mode')
        .addStringOption(opt => opt.setName('mode').setDescription('PvP mode').setRequired(true).setAutocomplete(true)))
      .addSubcommand(sub => sub
        .setName('give')
        .setDescription('Give a tier role to a user')
        .addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true))
        .addStringOption(opt => opt.setName('mode').setDescription('PvP mode').setRequired(true).setAutocomplete(true))
        .addStringOption(opt => opt.setName('tier').setDescription('Tier').setRequired(true)))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .setDMPermission(false);
  }
}
