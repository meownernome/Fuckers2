import { MessageFlags, SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { staffRoleName } from '../utils/textStyles';
import { setPlayerIGN } from '../utils/pointsSystem';
import { SEP } from '../utils/textStyles';

export class VerificationCommand {
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const ign = interaction.options.getString('minecraft-username', true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    setPlayerIGN(interaction.user.id, ign);

    const verifiedRoleName = staffRoleName('\u2705', 'Verified');
    const verifiedRole = interaction.guild?.roles.cache.find(role => role.name === verifiedRoleName);
    if (verifiedRole && interaction.member) {
      await (interaction.member as any).roles.add(verifiedRole);
    }

    const embed = new EmbedBuilder()
      .setDescription(`${SEP}\n\`〔 VERIFIED 〕\`\n${SEP}\n\n**Minecraft IGN:** ${ign}\n\nYou are now verified on HARVAL MC.\n\n${SEP}`)
      .setColor(0x2ECC71)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  public get command() {
    return new SlashCommandBuilder()
      .setName('verify')
      .setDescription('Verify your Minecraft username')
      .addStringOption(option =>
        option.setName('minecraft-username')
          .setDescription('Your Minecraft username')
          .setRequired(true)
      )
      .setDMPermission(false);
  }
}
