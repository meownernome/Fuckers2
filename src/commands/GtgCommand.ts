import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { ALL_ROLES, STAFF_EMOJI_PREFIX } from '../roles';
import { createRole } from '../utils/roleCreator';

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

export class GtgCommand {
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      await this.handleAdd(interaction);
    } else if (sub === 'list') {
      await this.handleList(interaction);
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

    const modal = new ModalBuilder()
      .setCustomId('gtg_add_modal')
      .setTitle('Bulk Add Roles');

    const sample = ALL_ROLES.slice(0, 3).map(r => `${r.name}, #${r.color.toString(16).padStart(6, '0')}`).join('\n');
    const placeholder = `Role Name, Hex Color\n${sample}\n...`;

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('roles_data')
          .setLabel('RoleName, #HexColor (one per line)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setPlaceholder(placeholder),
      ),
    );

    await interaction.showModal(modal);
  }

  private static async processBulkAdd(interaction: any, data: string) {
    const lines = data.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('//'));
    if (lines.length === 0) {
      await interaction.reply({ content: '❌ No valid role data found.', flags: MessageFlags.Ephemeral });
      return;
    }

    const guild = interaction.guild!;
    await guild.roles.fetch();
    const existingNames = new Set(guild.roles.cache.map((r: any) => r.name));

    const roles: { name: string; color: number }[] = [];
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 1 || !parts[0]) { errors.push(`Invalid line: ${line}`); continue; }
      const name = parts[0];
      const color = parts[1] ? parseHexColor(parts[1]) : 0x99AAB5;
      if (existingNames.has(name)) { errors.push(`Already exists: ${name}`); continue; }
      roles.push({ name, color });
    }

    if (roles.length === 0) {
      await interaction.reply({ content: `❌ No roles to create.\n${errors.slice(0, 5).join('\n')}`, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let created = 0;
    const failed: string[] = [];

    for (let i = 0; i < roles.length; i++) {
      try {
        await createRole(guild, roles[i].name, roles[i].color);
        created++;
        if ((i + 1) % 5 === 0 || i === roles.length - 1) {
          await interaction.editReply({ content: `⚙️ Creating roles... ${i + 1}/${roles.length} (${created} done)` });
        }
      } catch (e: any) {
        failed.push(roles[i].name);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Bulk Role Creation')
      .setDescription(
        `**Created:** ${created}/${roles.length}\n` +
        (failed.length > 0 ? `**Failed:** ${failed.length}\n${failed.slice(0, 5).map(n => `• ${n}`).join('\n')}` : '') +
        (errors.length > 0 ? `\n**Skipped:** ${errors.length} invalid lines` : '')
      )
      .setColor(failed.length > 0 ? 0xF1C40F : 0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] as any });
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

  static async handleModal(interaction: any) {
    if (interaction.customId !== 'gtg_add_modal') return;
    const data = interaction.fields.getTextInputValue('roles_data');
    await GtgCommand.processBulkAdd(interaction, data);
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
        .setDescription('Bulk add roles by pasting a formatted list'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .setDMPermission(false);
  }
}
