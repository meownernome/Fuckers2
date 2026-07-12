import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { ALL_ROLES } from '../roles';
import { createRole } from '../utils/roleCreator';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function progressBar(done: number, total: number) {
  const size = 20;
  const completed = Math.round((done / total) * size);
  const remaining = size - completed;
  return '█'.repeat(completed) + '░'.repeat(remaining);
}

export class MakeRolesCommand {
  constructor(private readonly commandName = 'makeroles') {}

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const guild = interaction.guild!;
    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: '❌ I need the Manage Roles permission to create roles.' });
      return;
    }

    await interaction.editReply({ content: '🔎 Fetching the current server roles…' });
    try { await guild.roles.fetch(); } catch {}

    const existingNames = new Set(guild.roles.cache.map(r => r.name));
    const missingRoles = ALL_ROLES.filter(r => !existingNames.has(r.name));
    const rolesToCreate = missingRoles;
    const skipped = ALL_ROLES.length - rolesToCreate.length;

    if (rolesToCreate.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Roles already present')
        .setDescription('All of the configured roles already exist in this server.')
        .setColor(0x2ECC71)
        .setTimestamp();
      await interaction.editReply({ content: null, embeds: [embed] as any });
      return;
    }

    let created = 0, failed = 0;
    const start = Date.now();
    const failedNames: string[] = [];
    const total = rolesToCreate.length;

    await interaction.editReply({ content: `⚙️ Creating roles…\n\n${progressBar(0, total)} 0/${total}` });

    for (let i = 0; i < rolesToCreate.length; i++) {
      const role = rolesToCreate[i];
      try {
        await createRole(guild, role.name, role.color);
        created++;
      } catch (e: any) {
        failed++;
        failedNames.push(`${role.name}: ${e?.message || 'Unknown error'}`);
        if (e?.message?.includes('limit') || e?.message?.includes('403') || e?.message?.includes('permission') || e?.message?.includes('Missing')) {
          break;
        }
      }

      if ((i + 1) % 10 === 0 || i === rolesToCreate.length - 1) {
        const pct = ((i + 1) / total * 100).toFixed(0);
        const sec = ((Date.now() - start) / 1000).toFixed(0);
        await interaction.editReply({
          content: `⚙️ Creating roles…\n\n${progressBar(i + 1, total)} ${i + 1}/${total} (${pct}%)\n\n✅ ${created} created • ❌ ${failed} failed • ⏭️ ${skipped} already existed • ⏱️ ${sec}s`,
        }).catch(() => {});
      }

      if (i < rolesToCreate.length - 1) {
        await sleep(900);
      }
    }

    const sec = ((Date.now() - start) / 1000).toFixed(0);
    const summary = [
      `• Total queued: ${total}`,
      `• Created: ${created}`,
      `• Already existed: ${skipped}`,
      `• Failed: ${failed}`,
      `• Time: ${sec}s`,
    ].join('\n');

    const embed = new EmbedBuilder()
      .setTitle(failed > 0 ? '⚠️ Partial role setup' : '✅ Role setup complete')
      .setDescription(`${summary}${failedNames.length > 0 ? `\n\n**Failed:**\n${failedNames.slice(0, 10).map(n => `• ${n}`).join('\n')}` : ''}`)
      .setColor(failed > 0 ? 0xF1C40F : 0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] as any });
  }

  get command() {
    return new SlashCommandBuilder()
      .setName(this.commandName)
      .setDescription('Create the server role set') as any;
  }
}
