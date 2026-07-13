import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags, TextChannel } from 'discord.js';
import { RoleCreator } from '../utils/roleCreator.js';
import { Logger } from '../utils/Logger.js';

export const CleanupCommand = {
  data: new SlashCommandBuilder()
    .setName('cleanup')
    .setDescription('Clean up roles, channels, or messages')
    .addSubcommand(sub =>
      sub.setName('roles')
        .setDescription('Delete all bot-created roles (except @everyone)')
    )
    .addSubcommand(sub =>
      sub.setName('channels')
        .setDescription('Delete all channels and categories')
    )
    .addSubcommand(sub =>
      sub.setName('messages')
        .setDescription('Delete all messages in a channel')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to clear messages from')
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.permissions.has('Administrator')) {
      await interaction.editReply({ content: 'You need Administrator permission.' });
      return;
    }

    const guild = interaction.guild;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'channels') {
      await handleCleanupChannels(interaction, guild);
    } else if (subcommand === 'roles') {
      await handleCleanupRoles(interaction, guild);
    } else if (subcommand === 'messages') {
      await handleCleanupMessages(interaction, guild);
    }
  },
};

async function handleCleanupChannels(interaction: ChatInputCommandInteraction, guild: any) {
  try {
    await interaction.editReply({ content: '💥 Deleting all channels...' });

    const channels = guild.channels.cache.filter((c: any) => 'deletable' in c && c.deletable);
    let deletedChannels = 0;
    for (const channel of channels.values()) {
      try {
        await channel.delete('Cleanup via /cleanup channels');
        deletedChannels++;
      } catch (e) {
        // Ignore
      }
    }

    await interaction.editReply({ content: `✅ Deleted ${deletedChannels} channels.` });
  } catch (error) {
    Logger.error('Error in /cleanup channels', error);
    await interaction.editReply({ content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}

async function handleCleanupRoles(interaction: ChatInputCommandInteraction, guild: any) {
  try {
    await interaction.editReply({ content: '💥 Deleting all bot-created roles...' });

    const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      await interaction.editReply({ content: 'Bot token not configured.' });
      return;
    }

    const roleCreator = new RoleCreator(token, guild.id);
    const roles = guild.roles.cache.filter((r: any) => r.id !== guild.id && r.editable);
    let deletedRoles = 0;
    for (const role of roles.values()) {
      if (await roleCreator.deleteRole(role.id)) {
        deletedRoles++;
      }
    }

    await interaction.editReply({
      content: `✅ Deleted ${deletedRoles} roles.`
    });
  } catch (error) {
    Logger.error('Error in /cleanup roles', error);
    await interaction.editReply({ content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}

async function handleCleanupMessages(interaction: ChatInputCommandInteraction, guild: any) {
  const channel = interaction.options.getChannel('channel') as TextChannel;
  if (!channel) {
    await interaction.editReply({ content: '❌ Channel not found.' });
    return;
  }

  try {
    await interaction.editReply({ content: `🧹 Clearing all messages in #${channel.name}...` });

    let deleted = 0;
    let fetched;
    do {
      fetched = await channel.messages.fetch({ limit: 100 });
      if (fetched.size === 0) break;
      const bulk = fetched.filter(m => m.bulkDeletable);
      if (bulk.size > 0) {
        await channel.bulkDelete(bulk, true);
        deleted += bulk.size;
      }
    } while (fetched.size >= 2);

    await interaction.editReply({ content: `✅ Deleted ${deleted} messages in #${channel.name}.` });
  } catch (error) {
    Logger.error('Error in /cleanup messages', error);
    await interaction.editReply({ content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
}