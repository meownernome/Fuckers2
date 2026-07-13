import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
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

export class GtgCommand {
  async execute(interaction: ChatInputCommandInteraction) {
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
      new ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next Role').setStyle(ButtonStyle.Success).setEmoji('⚔️'),
    );

    await interaction.reply({ embeds: [embed] as any, components: [row as any], flags: MessageFlags.Ephemeral });
  }

  private static async process(interaction: any, stateKey: string) {
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
        .setDescription(`All ${ALL_ROLES.length} roles have been created.`)
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
        .setDescription(`Failed to create **${role.name}**: ${e.message}\n\nTry again or skip.`)
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
        .setDescription(`Created **${role.name}**\n\nAll ${ALL_ROLES.length} roles are now created!`)
        .setColor(0x2ECC71);
      await interaction.editReply({ embeds: [embed] as any, components: [] });
      gtgState.delete(stateKey);
      return;
    }

    const next = ALL_ROLES[nextIdx];
    const remaining = ALL_ROLES.length - nextIdx;
    const embed = new EmbedBuilder()
      .setTitle('\u300C \u2726 ＧＴＧ \u2726 \u300D')
      .setDescription(`✅ Created **${role.name}**\n\n**Next role:** ${next.name}\n**Remaining:** ${remaining}/${ALL_ROLES.length}`)
      .setColor(0x3498DB)
      .setFooter({ text: '\u2726 Role creation \u2726' })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`gtg_create_${stateKey}`).setLabel('Create Next Role').setStyle(ButtonStyle.Success).setEmoji('⚔️'),
    );

    await interaction.editReply({ embeds: [embed] as any, components: [row as any] });
  }

  static async handleButton(interaction: any) {
    if (!interaction.customId.startsWith('gtg_create_')) return;

    await interaction.deferUpdate();

    if (!isStaff(interaction.member)) {
      await interaction.editReply({ content: '❌ Staff only.', components: [] });
      return;
    }

    const stateKey = interaction.customId.replace('gtg_create_', '');
    await GtgCommand.process(interaction, stateKey);
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
    if (state) state.idx++;
    await GtgCommand.process(interaction, stateKey);
  }

  get command() {
    return new SlashCommandBuilder()
      .setName('gtg')
      .setDescription('Create roles one by one (staff only)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .setDMPermission(false);
  }
}
