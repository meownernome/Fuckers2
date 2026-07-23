import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { ALL_ROLES, STAFF_EMOJI_PREFIX, MODES, TIERS } from '../roles';
import { formatTierRole } from '../utils/textStyles';
import { addTierPoints, POINT_MODES, TIER_POINTS } from '../utils/pointsSystem';
import { createRole } from '../utils/roleCreator';
import { BRAND } from '../utils/textStyles';

const gtgState = new Map<string, { guildId: string; idx: number }>();

function isStaff(member: any): boolean {
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions?.has(PermissionFlagsBits.ManageRoles)) return true;
  return member.roles?.cache?.some((r: any) => STAFF_EMOJI_PREFIX.test(r.name)) ?? false;
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

function progressBar(done: number, total: number): string {
  const size = 20;
  const filled = Math.round((done / total) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
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
      await interaction.reply({ content: '❌ This command is for staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const guild = interaction.guild!;
    await guild.roles.fetch();

    const startIdx = findNextIndex(guild, 0);
    if (startIdx >= ALL_ROLES.length) {
      await interaction.reply({ content: '✅ All roles already exist.', flags: MessageFlags.Ephemeral });
      return;
    }

    const stateKey = `gtg_${interaction.user.id}`;
    gtgState.set(stateKey, { guildId: guild.id, idx: startIdx });

    const remaining = ALL_ROLES.length - startIdx;
    const embed = new EmbedBuilder()
      .setTitle('\u300C \u2726 ＧＴＧ \u2726 \u300D')
      .setDescription(`**Next role:** ${ALL_ROLES[startIdx].name}\n**Remaining:** ${remaining}/${ALL_ROLES.length}\n\nClick the button to create this role.`)
      .setColor(0x3498DB)
      .setFooter({ text: '\u2726 Role creation \u2726' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next').setStyle(ButtonStyle.Success).setEmoji('⚔️'),
    );

    await interaction.reply({ embeds: [embed] as any, components: [row as any], flags: MessageFlags.Ephemeral });
  }

  private async handleAdd(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: '❌ Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const name = interaction.options.getString('name', true);
    const colorStr = interaction.options.getString('color');
    const color = colorStr ? parseHexColor(colorStr) : 0x99AAB5;

    const guild = interaction.guild!;
    await guild.roles.fetch();

    if (guild.roles.cache.some((r: any) => r.name === name)) {
      await interaction.reply({ content: `❌ Role **${name}** already exists.`, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await createRole(guild, name, color);
      const embed = new EmbedBuilder()
        .setTitle('✅ Role Created')
        .setDescription(`**Name:** ${name}\n**Color:** \`#${color.toString(16).padStart(6, '0')}\``)
        .setColor(color)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] as any });
    } catch (e: any) {
      await interaction.editReply({ content: `❌ Failed: ${e.message}` });
    }
  }

  private async handleList(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: '❌ Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    try { await guild.roles.fetch(); } catch {}
    const existingNames = new Set(guild.roles.cache.map((r: any) => r.name));

    const toCreate = ALL_ROLES.filter(r => !existingNames.has(r.name));

    if (toCreate.length === 0) {
      await interaction.editReply({ content: '✅ All roles already exist.' });
      return;
    }

    const total = toCreate.length;
    let created = 0;
    let failed = 0;
    const start = Date.now();

    await interaction.editReply({ content: `\`\`\`\n[${progressBar(0, total)}] 0/${total}\n\`\`\`⚙️ Creating ${total} roles...` });

    for (let i = 0; i < total; i++) {
      const r = toCreate[i];
      try {
        await createRole(guild, r.name, r.color);
        created++;
      } catch {
        failed++;
      }

      if ((i + 1) % 10 === 0 || i === total - 1) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(0);
        await interaction.editReply({
          content: `\`\`\`\n[${progressBar(i + 1, total)}] ${i + 1}/${total}\n\`\`\`⚙️ ${created} created • ${failed} failed • ${elapsed}s`,
        }).catch(() => {});
      }

    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const SEP = BRAND.SEPARATOR;
    const embed = new EmbedBuilder()
      .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ＲＯＬＥ ＣＲＥＡＴＩＯＮ 〕\n${SEP}\`\`\`\n\n│ **Created:** ${created}/${total}\n│ **Failed:** ${failed}\n│ **Time:** ${elapsed}s\n\n${SEP}`)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  }

  private async handleMode(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: '❌ Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const mode = interaction.options.getString('mode', true);
    if (!MODES.includes(mode)) {
      await interaction.reply({ content: `❌ Invalid mode. Available: ${MODES.join(', ')}`, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    await guild.roles.fetch();
    const existing = new Set(guild.roles.cache.map((r: any) => r.name));

    const toCreate = TIERS.map(t => ({ name: formatTierRole(mode, t.name), color: t.color }));
    const skipped = toCreate.filter(r => existing.has(r.name));
    const needed = toCreate.filter(r => !existing.has(r.name));

    if (needed.length === 0) {
      await interaction.editReply({ content: `✅ All **${mode}** roles already exist.` });
      return;
    }

    await interaction.editReply({ content: `\`\`\`\n[${progressBar(0, needed.length)}] 0/${needed.length}\n\`\`\`⚙️ Creating ${needed.length} ${mode} roles...` });

    const failed: string[] = [];
    for (let i = 0; i < needed.length; i++) {
      try {
        await createRole(guild, needed[i].name, needed[i].color);
      } catch {
        failed.push(needed[i].name);
      }
      if ((i + 1) % 5 === 0 || i === needed.length - 1) {
        await interaction.editReply({
          content: `\`\`\`\n[${progressBar(i + 1, needed.length)}] ${i + 1}/${needed.length}\n\`\`\`⚙️ ${needed.length - failed.length} created • ${failed.length} failed`,
        }).catch(() => {});
      }
    }

    const created = needed.length - failed.length;
    const SEP = BRAND.SEPARATOR;
    const embed = new EmbedBuilder()
      .setColor(failed.length > 0 ? 0xF1C40F : 0x2ECC71)
      .setDescription(`\`\`\`md\n${SEP}\n〔 ${mode} ＲＯＬＥＳ 〕\n${SEP}\`\`\`\n\n│ **Created:** ${created}/${needed.length}\n│ **Skipped:** ${skipped.length}\n│ **Failed:** ${failed.length}${failed.length > 0 ? '\n│ ' + failed.slice(0, 5).map(n => `• ${n}`).join('\n│ ') : ''}\n\n${SEP}`)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] as any });
  }

  private async handleGive(interaction: ChatInputCommandInteraction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({ content: '❌ Staff only.', flags: MessageFlags.Ephemeral });
      return;
    }

    const user = interaction.options.getUser('user', true);
    const mode = interaction.options.getString('mode', true);
    const tier = interaction.options.getString('tier', true);
    const tierLabel = `${tier.toUpperCase().includes('LT') ? 'LT' : 'HT'} ${tier.replace(/[^0-9]/g, '')}`;

    if (!MODES.includes(mode)) {
      await interaction.reply({ content: `❌ Invalid mode. Available: ${MODES.join(', ')}`, flags: MessageFlags.Ephemeral });
      return;
    }

    const validTiers = TIERS.map(t => t.name);
    if (!validTiers.includes(tierLabel)) {
      await interaction.reply({ content: `❌ Invalid tier. Use: ${validTiers.join(', ')}`, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild!;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ content: '❌ User not found in this server.' });
      return;
    }

    const roleName = formatTierRole(mode, tierLabel);
    let role = guild.roles.cache.find((r: any) => r.name === roleName);
    if (!role) {
      try {
        const tierData = TIERS.find(t => t.name === tierLabel)!;
        await createRole(guild, roleName, tierData.color);
        await guild.roles.fetch();
        role = guild.roles.cache.find((r: any) => r.name === roleName);
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Failed to create role: ${e.message}` });
        return;
      }
    }

    if (!role) {
      await interaction.editReply({ content: `❌ Role creation failed for ${roleName}.` });
      return;
    }

    try {
      await member.roles.add(role);
      if (POINT_MODES.includes(mode) && TIER_POINTS[tierLabel]) {
        addTierPoints(user.id, mode, tierLabel, user.displayName);
      }
      const SEP = BRAND.SEPARATOR;
      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setDescription(`\`\`\`md\n${SEP}\n〔 ＲＯＬＥ ＧＩＶＥＮ 〕\n${SEP}\`\`\`\n\n│ **User:** ${user}\n│ **Role:** ${roleName}\n\n${SEP}`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed] as any });
    } catch (e: any) {
      await interaction.editReply({ content: `❌ Failed to give role: ${e.message}` });
    }
  }

  static async handleButton(interaction: any) {
    if (!interaction.customId.startsWith('gtg_create_')) return;

    await interaction.deferUpdate();

    if (!isStaff(interaction.member)) {
      await interaction.editReply({ content: '❌ Staff only.', components: [] });
      return;
    }

    const stateKey = interaction.customId.replace('gtg_create_', '');
    const state = gtgState.get(stateKey);
    if (!state) {
      await interaction.editReply({ content: '❌ Session expired. Run /gtg again.', components: [] });
      return;
    }

    const guild = interaction.guild!;
    if (guild.id !== state.guildId) {
      await interaction.editReply({ content: '❌ Wrong server.', components: [] });
      return;
    }

    await guild.roles.fetch();
    const idx = findNextIndex(guild, state.idx);
    if (idx >= ALL_ROLES.length) {
      const embed = new EmbedBuilder()
        .setTitle('✅ All Done!')
        .setDescription(`All ${ALL_ROLES.length} roles created.`)
        .setColor(0x2ECC71);
      await interaction.editReply({ embeds: [embed] as any, components: [] });
      gtgState.delete(stateKey);
      return;
    }

    const role = ALL_ROLES[idx];
    try {
      await createRole(guild, role.name, role.color);
    } catch (e: any) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Failed')
        .setDescription(`Failed: **${role.name}** — ${e.message}`)
        .setColor(0xE74C3C);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Retry').setStyle(ButtonStyle.Danger).setEmoji('🔄'),
        new ButtonBuilder().setCustomId(`gtg_skip_${stateKey}`).setLabel('Skip').setStyle(ButtonStyle.Secondary).setEmoji('⏭️'),
      );
      await interaction.editReply({ embeds: [embed] as any, components: [row as any] });
      return;
    }

    state.idx = idx + 1;
    await guild.roles.fetch();
    const nextIdx = findNextIndex(guild, state.idx);

    if (nextIdx >= ALL_ROLES.length) {
      const embed = new EmbedBuilder()
        .setTitle('✅ All Done!')
        .setDescription(`Created **${role.name}**\n\nAll ${ALL_ROLES.length} roles done!`)
        .setColor(0x2ECC71);
      await interaction.editReply({ embeds: [embed] as any, components: [] });
      gtgState.delete(stateKey);
      return;
    }

    const next = ALL_ROLES[nextIdx];
    const remaining = ALL_ROLES.length - nextIdx;
    const embed = new EmbedBuilder()
      .setTitle('\u300C \u2726 ＧＴＧ \u2726 \u300D')
      .setDescription(`✅ Created **${role.name}**\n\n**Next:** ${next.name}\n**Remaining:** ${remaining}/${ALL_ROLES.length}`)
      .setColor(0x3498DB)
      .setFooter({ text: '\u2726 Role creation \u2726' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next').setStyle(ButtonStyle.Success).setEmoji('⚔️'),
    );

    await interaction.editReply({ embeds: [embed] as any, components: [row as any] });
  }

  static async handleSkip(interaction: any) {
    if (!interaction.customId.startsWith('gtg_skip_')) return;

    await interaction.deferUpdate();

    if (!isStaff(interaction.member)) {
      await interaction.editReply({ content: '❌ Staff only.', components: [] });
      return;
    }

    const stateKey = interaction.customId.replace('gtg_skip_', '');
    const state = gtgState.get(stateKey);
    if (!state) {
      await interaction.editReply({ content: '❌ Session expired.', components: [] });
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
        .setDescription('Manually add a single role by name and color')
        .addStringOption(opt => opt.setName('name').setDescription('Role name').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Hex color (e.g. #FF0000)').setRequired(false)))
      .addSubcommand(sub => sub
        .setName('list')
        .setDescription('Read all_roles_list.txt and bulk create roles from it'))
      .addSubcommand(sub => sub
        .setName('mode')
        .setDescription('Create all 10 tiers for a specific PvP mode')
        .addStringOption(opt => opt.setName('mode').setDescription('PvP mode name').setRequired(true).setAutocomplete(true)))
      .addSubcommand(sub => sub
        .setName('give')
        .setDescription('Give a tier role to a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to give the role to').setRequired(true))
        .addStringOption(opt => opt.setName('mode').setDescription('PvP mode').setRequired(true).setAutocomplete(true))
        .addStringOption(opt => opt.setName('tier').setDescription('Tier (e.g. HT 1, LT 5)').setRequired(true)))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .setDMPermission(false);
  }
}
