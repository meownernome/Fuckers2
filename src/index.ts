import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  Client,
  GatewayIntentBits,
  Events,
  type Role,
  type GuildChannel,
  type GuildMember,
  type OverwriteData,
  PermissionFlagsBits,
  AttachmentBuilder,
  ChannelType,
} from 'discord.js';

dotenv.config();

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Available env vars: ${Object.keys(process.env).filter(k => k.includes('DISCORD') || k.includes('SUPABASE') || k.includes('JWT')).join(', ')}`);
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const DISCORD_BOT_TOKEN = getRequiredEnv('DISCORD_BOT_TOKEN');
const DISCORD_CLIENT_ID = getRequiredEnv('DISCORD_CLIENT_ID');
const DISCORD_GUILD_ID = getRequiredEnv('DISCORD_GUILD_ID');
const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
const JWT_SECRET = getRequiredEnv('JWT_SECRET');
const PORT = Number(process.env.PORT ?? '3000');

const DIVISION_LUA_PATH = path.resolve(process.cwd(), 'division.lua');
const GUILD_CONFIG_PATH = path.resolve(process.cwd(), 'guilds.json');

type GuildConfig = {
  id: string;
  name: string;
};

type DivisionDefinition = {
  key: string;
  displayName: string;
  role: string;
  visualColor: string;
  icon: string;
  notes: string;
  ranks: string[];
};

function loadGuildConfigs(): GuildConfig[] {
  if (!fs.existsSync(GUILD_CONFIG_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(GUILD_CONFIG_PATH, 'utf8');
    return JSON.parse(raw) as GuildConfig[];
  } catch (error) {
    console.warn('Could not load guild definitions:', error);
    return [];
  }
}

function saveGuildConfigs(configs: GuildConfig[]) {
  fs.writeFileSync(GUILD_CONFIG_PATH, JSON.stringify(configs, null, 2), 'utf8');
}

function getGuildConfig(guildId: string): GuildConfig | undefined {
  return loadGuildConfigs().find((config) => config.id === guildId);
}

function upsertGuildConfig(config: GuildConfig): GuildConfig[] {
  const configs = loadGuildConfigs();
  const foundIndex = configs.findIndex((entry) => entry.id === config.id);
  if (foundIndex >= 0) {
    configs[foundIndex] = config;
  } else {
    configs.push(config);
  }
  saveGuildConfigs(configs);
  return configs;
}

function removeGuildConfig(guildId: string): GuildConfig[] {
  const configs = loadGuildConfigs().filter((entry) => entry.id !== guildId);
  saveGuildConfigs(configs);
  return configs;
}

function formatGuildListMessage(configs: GuildConfig[]): string {
  if (configs.length === 0) {
    return 'No guild definitions are stored yet. Use `/guild add` to register a server.';
  }
  return configs.map((entry) => `• ${entry.name} — ${entry.id}`).join('\n');
}

function parseDivisionLua(): DivisionDefinition[] {
  if (!fs.existsSync(DIVISION_LUA_PATH)) {
    throw new Error(`division.lua file not found at ${DIVISION_LUA_PATH}`);
  }

  const content = fs.readFileSync(DIVISION_LUA_PATH, 'utf8');
  const divisions: DivisionDefinition[] = [];
  const lines = content.split(/\r?\n/);

  let current: Partial<DivisionDefinition> | null = null;
  let parsingRanks = false;
  let parsingVisual = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!parsingRanks && !parsingVisual) {
      const divisionMatch = line.match(/^([A-Za-z0-9_]+)\s*=\s*{/);
      if (divisionMatch && !line.startsWith('ranks =') && !line.startsWith('visual =')) {
        current = {
          key: divisionMatch[1],
          displayName: divisionMatch[1],
          role: '',
          visualColor: '',
          icon: '',
          notes: '',
          ranks: [],
        };
        continue;
      }
    }

    if (!current) {
      continue;
    }

    const displayNameMatch = line.match(/^displayName\s*=\s*"([^"]+)"/);
    if (displayNameMatch) {
      current.displayName = displayNameMatch[1];
      continue;
    }

    const roleMatch = line.match(/^role\s*=\s*"([^"]+)"/);
    if (roleMatch) {
      current.role = roleMatch[1];
      continue;
    }

    const notesMatch = line.match(/^notes\s*=\s*"([^"]+)"/);
    if (notesMatch) {
      current.notes = notesMatch[1];
      continue;
    }

    // Handle visual table start
    if (line.startsWith('visual = {')) {
      parsingVisual = true;
      const colorMatch = line.match(/color\s*=\s*"([^\"]+)"/);
      if (colorMatch) {
        current.visualColor = colorMatch[1];
      }

      const iconMatch = line.match(/icon\s*=\s*"([^\"]+)"/);
      if (iconMatch) {
        current.icon = iconMatch[1];
      }

      if (line.includes('}')) {
        parsingVisual = false;
      }
      continue;
    }

    // Parse color and icon within visual table
    if (parsingVisual) {
      const colorMatch = line.match(/color\s*=\s*"([^"]+)"/);
      if (colorMatch) {
        current.visualColor = colorMatch[1];
      }

      const iconMatch = line.match(/icon\s*=\s*"([^"]+)"/);
      if (iconMatch) {
        current.icon = iconMatch[1];
      }

      if (line.includes('}')) {
        parsingVisual = false;
      }
      continue;
    }

    if (line.startsWith('ranks = {')) {
      parsingRanks = true;
      continue;
    }

    if (parsingRanks) {
      if (line.startsWith('}')) {
        parsingRanks = false;
        continue;
      }

      const rankMatches = [...line.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      current.ranks = current.ranks ?? [];
      current.ranks.push(...rankMatches);
      continue;
    }

    if (line === '},' || line === '}') {
      if (current.key) {
        divisions.push(current as DivisionDefinition);
      }
      current = null;
    }
  }

  if (current && current.key) {
    divisions.push(current as DivisionDefinition);
  }

  return divisions;
}

function discordColorFromName(name: string): number {
  const normalized = name.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (tokens.includes('gold')) return 0xf39c12;
  if (tokens.includes('yellow')) return 0xf1c40f;
  if (tokens.includes('orange')) return 0xe67e22;
  if (tokens.includes('fiery')) return 0xe74c3c;
  if (tokens.includes('rust')) return 0xd35400;
  if (tokens.includes('red')) return 0xe74c3c;
  if (tokens.includes('crimson')) return 0xdc143c;
  if (tokens.includes('maroon')) return 0x800000;
  if (tokens.includes('pink')) return 0xff79c6;
  if (tokens.includes('magenta')) return 0xc0392b;
  if (tokens.includes('purple')) return 0x8e44ad;
  if (tokens.includes('indigo')) return 0x4b0082;
  if (tokens.includes('blue')) return 0x3498db;
  if (tokens.includes('royal')) return 0x4169e1;
  if (tokens.includes('navy')) return 0x2c3e50;
  if (tokens.includes('teal')) return 0x1abc9c;
  if (tokens.includes('cyan')) return 0x17a589;
  if (tokens.includes('green')) return 0x2ecc71;
  if (tokens.includes('olive')) return 0x556b2f;
  if (tokens.includes('brown')) return 0x6e2c00;
  if (tokens.includes('gunmetal')) return 0x7f8c8d;
  if (tokens.includes('slate')) return 0x708090;
  if (tokens.includes('silver')) return 0xbdc3c7;
  if (tokens.includes('black')) return 0x23272a;
  if (tokens.includes('white')) return 0xffffff;
  if (tokens.includes('gray') || tokens.includes('grey')) return 0x95a5a6;

  return 0x5865f2;
}

function buildRoleName(division: DivisionDefinition, rank: string): string {
  return `${division.displayName} | ${rank}`;
}

function buildDivisionRoleName(division: DivisionDefinition): string {
  return division.displayName;
}

function getChannelSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\/\\'"`^]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildDivisionCategoryName(division: DivisionDefinition): string {
  return `${division.displayName} Division`;
}

function buildDivisionChannelNames(division: DivisionDefinition): string[] {
  const prefix = getChannelSlug(division.displayName);
  return [
    `${prefix}-general`,
    `${prefix}-announcements`,
    `${prefix}-ops`,
    `${prefix}-briefing`,
    `${prefix}-team-chat`,
    `${prefix}-resources`,
    `${prefix}-command-voice`,
    `${prefix}-briefing-voice`,
  ];
}

function csvEscape(text: string): string {
  return `"${text.replace(/"/g, '""')}"`;
}

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

const discordClient = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function resolveGuild(interaction: any, explicitGuildId?: string) {
  const requestedGuildId = explicitGuildId?.trim() || interaction.guild?.id;
  if (!requestedGuildId) {
    const knownGuilds = loadGuildConfigs();
    if (knownGuilds.length === 1) {
      return await discordClient.guilds.fetch(knownGuilds[0].id);
    }
    throw new Error('No guild context available. Run this command in a server or provide a defined guild id.');
  }

  if (interaction.guild?.id === requestedGuildId) {
    return interaction.guild;
  }

  const guildConfig = getGuildConfig(requestedGuildId);
  if (!guildConfig) {
    throw new Error(`Guild ${requestedGuildId} is not defined. Add it with /guild add to target it outside the server.`);
  }

  return await discordClient.guilds.fetch(requestedGuildId);
}

async function fetchGuildMember(interaction: any, guild: any) {
  if (interaction.guild?.id === guild.id && interaction.member) {
    return interaction.member as GuildMember;
  }

  return await guild.members.fetch(interaction.user.id);
}

async function resolveDefaultGuild() {
  const configs = loadGuildConfigs();
  if (configs.length === 1) {
    return await discordClient.guilds.fetch(configs[0].id);
  }

  return await discordClient.guilds.fetch(DISCORD_GUILD_ID);
}

function generateVerificationCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

async function unlinkRobloxVerification(robloxId: string, keepDiscordId?: string) {
  if (!robloxId) {
    return;
  }

  let query = supabase.from('verified_users').delete().eq('roblox_id', robloxId);
  if (keepDiscordId) {
    query = supabase.from('verified_users').delete().eq('roblox_id', robloxId).neq('discord_id', keepDiscordId);
  }

  const { error } = await query;
  if (error) {
    console.error('Supabase unlink roblox verification error:', error);
  }
}

function requireJwtSecret(secretToken: unknown): boolean {
  return typeof secretToken === 'string' && secretToken === JWT_SECRET;
}

type RoleMapping = {
  discord_role_id: string;
  roblox_team_name: string;
};

app.post('/api/game/generate-code', async (req: Request, res: Response) => {
  const { robloxId, robloxUsername, secretToken } = req.body;

  if (!requireJwtSecret(secretToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!robloxId || !robloxUsername) {
    return res.status(400).json({ error: 'robloxId and robloxUsername are required' });
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase.from('verification_codes').insert({
    roblox_id: robloxId,
    roblox_username: robloxUsername,
    code,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('Supabase insert error', error);
    return res.status(500).json({ error: 'Failed to store verification code' });
  }

  return res.json({ code });
});

app.post('/api/game/check-roles', async (req: Request, res: Response) => {
  const { robloxId, secretToken } = req.body;

  if (!requireJwtSecret(secretToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!robloxId) {
    return res.status(400).json({ error: 'robloxId is required' });
  }

  const { data: verifiedUsers, error: userError } = await supabase
    .from('verified_users')
    .select('discord_id')
    .eq('roblox_id', robloxId)
    .limit(1);

  if (userError) {
    console.error('Supabase query error', userError);
    return res.status(500).json({ error: 'Failed to query verified user' });
  }

  if (!verifiedUsers || verifiedUsers.length === 0) {
    return res.json({ teamNames: [] });
  }

  const discordId = verifiedUsers[0].discord_id;
  console.log('[API] check-roles request for robloxId=', robloxId, 'discordId=', discordId);

  try {
    const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
    const member = await guild.members.fetch({ user: discordId, force: true });
    const roleIds = member.roles.cache.map((role: Role) => role.id);
    console.log('[API] discord role ids for member=', roleIds);

    const response = await supabase
      .from('role_mappings')
      .select('discord_role_id, roblox_team_name');

    const roleMappings = response.data as RoleMapping[] | null;
    const mappingError = response.error;

    if (mappingError) {
      console.error('Supabase role_mappings query error', mappingError);
      return res.status(500).json({ error: 'Failed to query role mappings' });
    }

    console.log('[API] role mappings loaded:', roleMappings);

    const teamNames = (roleMappings || [])
      .filter((mapping: RoleMapping) => roleIds.includes(mapping.discord_role_id))
      .map((mapping: RoleMapping) => mapping.roblox_team_name)
      .filter((name: unknown): name is string => typeof name === 'string');

    console.log('[API] matched team names:', teamNames);
    return res.json({ teamNames });
  } catch (error) {
    console.error('Discord fetch error', error);
    return res.status(500).json({ error: 'Failed to fetch Discord member or roles' });
  }
});

app.listen(PORT, () => {
  console.log(`[API] Express server started on port ${PORT}`);
});

discordClient.once(Events.ClientReady, async () => {
  console.log(`[BOT] Discord bot logged in as ${discordClient.user?.tag}`);

  try {
    const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
    console.log(`[BOT] Connected to guild: ${guild.name} (${guild.id})`);
  } catch (guildFetchError) {
    const guildCache = discordClient.guilds.cache.map((guild) => `${guild.name} (${guild.id})`);
    console.error('[BOT] Failed to fetch configured guild:', guildFetchError);
    console.warn('[BOT] Bot is currently in these guilds:', guildCache);
    if (!discordClient.guilds.cache.has(DISCORD_GUILD_ID)) {
      console.warn('[BOT] Configured guild ID is not in the current guild cache. Make sure DISCORD_GUILD_ID is correct and the bot is a member of that server.');
    }
  }

  const commandDefinition = [
    {
      name: 'verify',
      description: 'Start Roblox verification',
      options: [
        {
          name: 'username',
          description: 'Your Roblox username',
          type: 3,
          required: true,
        },
      ],
    },
    {
      name: 'logout',
      description: 'Remove your Roblox verification and reset your nickname for this server',
    },
    {
      name: 'guild',
      description: 'Manage known guild definitions for multi-server automation',
      options: [
        {
          name: 'add',
          description: 'Add or update a guild definition',
          type: 1,
          options: [
            {
              name: 'guild-id',
              description: 'Discord guild ID to register; leave blank to use current server',
              type: 3,
              required: false,
            },
            {
              name: 'name',
              description: 'Friendly name for this server',
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: 'remove',
          description: 'Remove a stored guild definition',
          type: 1,
          options: [
            {
              name: 'guild-id',
              description: 'Guild ID to remove',
              type: 3,
              required: true,
            },
          ],
        },
        {
          name: 'list',
          description: 'List all stored guild definitions',
          type: 1,
        },
      ],
    },
    {
      name: 'ban',
      description: 'Ban a user from the Discord server',
      options: [
        {
          name: 'user',
          description: 'User to ban',
          type: 6,
          required: true,
        },
        {
          name: 'reason',
          description: 'Reason for the ban',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'kick',
      description: 'Kick a user from the Discord server',
      options: [
        {
          name: 'user',
          description: 'User to kick',
          type: 6,
          required: true,
        },
        {
          name: 'reason',
          description: 'Reason for the kick',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'freeze',
      description: 'Temporarily timeout a user for a moderation action',
      options: [
        {
          name: 'user',
          description: 'User to freeze',
          type: 6,
          required: true,
        },
        {
          name: 'minutes',
          description: 'Length of the timeout in minutes',
          type: 4,
          required: false,
        },
        {
          name: 'reason',
          description: 'Reason for the timeout',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'complete',
      description: 'Build a division category and channels automatically',
      options: [
        {
          name: 'division',
          description: 'Division key or display name to finish server setup for',
          type: 3,
          required: true,
        },
        {
          name: 'guild-id',
          description: 'Optional guild ID to target when running outside the server',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'create-roles',
      description: 'Automatically create division and rank roles from division.lua',
      options: [
        {
          name: 'scope',
          description: 'Create division roles, rank roles, or both',
          type: 3,
          required: false,
          choices: [
            { name: 'all', value: 'all' },
            { name: 'division', value: 'division' },
            { name: 'rank', value: 'rank' },
          ],
        },
        {
          name: 'division',
          description: 'Optional: create roles only for a specific division key or display name, or use all',
          type: 3,
          required: false,
        },
        {
          name: 'guild-id',
          description: 'Optional guild ID to target when running outside the server',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'role-list',
      description: 'Export a CSV list of role names and Discord role IDs',
      options: [
        {
          name: 'scope',
          description: 'Include division-level roles, rank roles, or both',
          type: 3,
          required: false,
          choices: [
            { name: 'all', value: 'all' },
            { name: 'division', value: 'division' },
            { name: 'rank', value: 'rank' },
          ],
        },
        {
          name: 'guild-id',
          description: 'Optional guild ID to target when running outside the server',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'delete-allroles',
      description: '⚠️ DANGER: Delete all roles from the server',
      options: [
        {
          name: 'guild-id',
          description: 'Optional guild ID to target when running outside the server',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'delete-role',
      description: 'Delete a specific role by name',
      options: [
        {
          name: 'role-name',
          description: 'The exact name of the role to delete',
          type: 3,
          required: true,
        },
        {
          name: 'guild-id',
          description: 'Optional guild ID to target when running outside the server',
          type: 3,
          required: false,
        },
      ],
    },
    {
      name: 'delete-visual-roles',
      description: 'Delete all rank/visual roles created from division.lua',
      options: [
        {
          name: 'guild-id',
          description: 'Optional guild ID to target when running outside the server',
          type: 3,
          required: false,
        },
      ],
    },
  ];

  try {
    if (!discordClient.application?.commands) {
      console.warn('[BOT] Global application commands are unavailable.');
      return;
    }

    const commandData = commandDefinition;
    const knownGuilds = loadGuildConfigs();
    const guildIds = new Set<string>();
    if (DISCORD_GUILD_ID) guildIds.add(DISCORD_GUILD_ID);
    for (const guildConfig of knownGuilds) {
      if (guildConfig.id) guildIds.add(guildConfig.id);
    }

    if (guildIds.size === 0) {
      await discordClient.application.commands.set(commandData);
      console.log('[BOT] Registered global slash commands for verification and admin moderation');
    } else {
      for (const guildId of guildIds) {
        try {
          await discordClient.application.commands.set(commandData, guildId);
          console.log(`[BOT] Registered slash commands in guild ${guildId}`);
        } catch (guildError) {
          console.warn(`[BOT] Command registration failed for guild ${guildId}:`, guildError);
        }
      }
    }
  } catch (globalError) {
    console.error('[BOT] Slash command registration failed:', globalError);
  }
});

const pendingVerifications = new Map<string, string>();

discordClient.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'logout') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { error } = await supabase.from('verified_users').delete().eq('discord_id', interaction.user.id);
      if (error) {
        console.error('Supabase logout delete error:', error);
        await interaction.editReply({ content: 'Unable to log you out right now. Please try again later.' });
        return;
      }

      try {
        const guild = await resolveGuild(interaction);
        const member = await guild.members.fetch(interaction.user.id);
        await member.setNickname(null);
      } catch (nicknameError) {
        console.warn('Could not reset nickname during logout:', nicknameError);
      }

      await interaction.editReply({ content: 'You have been logged out from Roblox verification and your server nickname was reset.' });
    } catch (err) {
      console.error('Logout command error:', err);
      await interaction.editReply({ content: 'An error occurred while logging you out.' });
    }
    return;
  }

  if (interaction.commandName === 'ban' || interaction.commandName === 'kick') {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command must be used in the server channel.' });
      return;
    }

    const isBan = interaction.commandName === 'ban';
    const permission = isBan ? PermissionFlagsBits.BanMembers : PermissionFlagsBits.KickMembers;
    if (!interaction.memberPermissions?.has(permission)) {
      await interaction.editReply({ content: 'You need permission to perform this moderation action.' });
      return;
    }

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? `${interaction.commandName} command issued by ${interaction.user.tag}`;

    try {
      const guild = await resolveGuild(interaction);
      const member = await guild.members.fetch(target.id);

      if (isBan) {
        await member.ban({ reason });
      } else {
        await member.kick(reason);
      }

      await interaction.editReply({ content: `${isBan ? 'Banned' : 'Kicked'} <@${target.id}> successfully.` });
    } catch (err) {
      console.error(`${interaction.commandName} command error:`, err);
      await interaction.editReply({ content: `Unable to ${interaction.commandName} that user. Check bot permissions and role hierarchy.` });
    }
    return;
  }

  if (interaction.commandName === 'freeze') {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command must be used in the server channel.' });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      await interaction.editReply({ content: 'You need Moderate Members permission to freeze users.' });
      return;
    }

    const target = interaction.options.getUser('user', true);
    const minutes = interaction.options.getInteger('minutes') ?? 60;
    const reason = interaction.options.getString('reason') ?? `Frozen by ${interaction.user.tag}`;

    try {
      const guild = await resolveGuild(interaction);
      const member = await guild.members.fetch(target.id);
      await member.timeout(minutes * 60 * 1000, reason);
      await interaction.editReply({ content: `⏱️ ${target.tag} has been timed out for ${minutes} minute(s).` });
    } catch (err) {
      console.error('freeze command error:', err);
      await interaction.editReply({ content: 'Unable to freeze that user. Please check bot permissions and role hierarchy.' });
    }
    return;
  }

  if (interaction.commandName === 'guild') {
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const specifiedGuildId = interaction.options.getString('guild-id');
      const guildId = specifiedGuildId?.trim() || interaction.guild?.id;
      const name = interaction.options.getString('name', true).trim();

      if (!guildId) {
        await interaction.editReply({ content: 'Please run this command in a server or provide a guild id.' });
        return;
      }

      try {
        if (interaction.guild?.id !== guildId) {
          await discordClient.guilds.fetch(guildId);
        }
        upsertGuildConfig({ id: guildId, name });
        await interaction.editReply({ content: `Guild definition saved: ${name} (${guildId}).` });
      } catch (err) {
        console.error('guild add error:', err);
        await interaction.editReply({ content: 'Unable to save that guild. Make sure the bot is in that server and the guild ID is correct.' });
      }
    } else if (subcommand === 'remove') {
      const guildId = interaction.options.getString('guild-id', true).trim();
      const existing = getGuildConfig(guildId);
      if (!existing) {
        await interaction.editReply({ content: `Guild ${guildId} is not defined.` });
        return;
      }
      removeGuildConfig(guildId);
      await interaction.editReply({ content: `Guild definition removed: ${existing.name} (${guildId}).` });
    } else if (subcommand === 'list') {
      const configs = loadGuildConfigs();
      await interaction.editReply({ content: formatGuildListMessage(configs) });
    }
    return;
  }

  if (interaction.commandName === 'complete') {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.options.getString('guild-id');
    const divisionArg = interaction.options.getString('division', true).trim();

    let guild;
    try {
      guild = await resolveGuild(interaction, guildId ?? undefined);
    } catch (err) {
      await interaction.editReply({ content: (err as Error).message });
      return;
    }

    const member = await fetchGuildMember(interaction, guild);
    if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.editReply({ content: 'You need Manage Channels permission in the target server to complete a division setup.' });
      return;
    }

    let divisions: DivisionDefinition[];
    try {
      divisions = parseDivisionLua();
    } catch (err) {
      console.error('complete parse error:', err);
      await interaction.editReply({ content: 'Unable to load division.lua. Make sure the file exists and is accessible.' });
      return;
    }

    const lowerArg = divisionArg.toLowerCase();
    const matched = divisions.find(
      (division) =>
        division.key.toLowerCase() === lowerArg || division.displayName.toLowerCase() === lowerArg
    );

    if (!matched) {
      await interaction.editReply({ content: `Division not found: ${divisionArg}. Use a valid division key or display name from division.lua.` });
      return;
    }

    try {
      await guild.roles.fetch();
      await guild.channels.fetch();

      let divisionRole = guild.roles.cache.find((role: Role) => role.name === buildDivisionRoleName(matched));
      let roleCreationNote = '';
      if (!divisionRole) {
        try {
          divisionRole = await guild.roles.create({
            name: buildDivisionRoleName(matched),
            color: discordColorFromName(matched.visualColor),
            reason: `Auto-created division role for ${matched.displayName} category setup`,
          });
          roleCreationNote = `
Division role created: ${divisionRole.name}`;
        } catch (roleCreateError) {
          console.warn('Could not create division role for complete command:', roleCreateError);
        }
      }

      const categoryName = buildDivisionCategoryName(matched);
      const existingCategory = guild.channels.cache.find(
        (channel: GuildChannel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === categoryName.toLowerCase()
      );

      const permissionOverwrites: OverwriteData[] = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ];

      if (divisionRole) {
        permissionOverwrites.push({
          id: divisionRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        });
      }

      const category =
        existingCategory ??
        (await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
          permissionOverwrites,
          reason: `Auto-created category for ${matched.displayName}`,
        }));

      const textChannels = ['general', 'announcements', 'ops', 'briefing', 'team-chat', 'resources'];
      const voiceChannels = ['command-voice', 'briefing-voice'];
      const createdChannels: string[] = [];
      const existingChannels: string[] = [];

      for (const baseName of [...textChannels, ...voiceChannels]) {
        const channelName = `${getChannelSlug(matched.displayName)}-${baseName}`;
        const existing = guild.channels.cache.find(
          (channel: GuildChannel) => channel.parentId === category.id && channel.name === channelName
        );

        if (existing) {
          existingChannels.push(channelName);
          continue;
        }

        await guild.channels.create({
          name: channelName,
          type: voiceChannels.includes(baseName) ? ChannelType.GuildVoice : ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites,
          topic:
            baseName === 'announcements'
              ? `Announcements for ${matched.displayName}`
              : `Channel for ${matched.displayName} division`,
          reason: `Auto-created ${baseName} channel for ${matched.displayName}`,
        });
        createdChannels.push(channelName);
      }

      const parts = [`✓ Setup complete for ${matched.displayName}.`, roleCreationNote];
      if (createdChannels.length) {
        parts.push(`Created channels:
• ${createdChannels.join('\n• ')}`);
      }
      if (existingChannels.length) {
        parts.push(`Already existing channels:
• ${existingChannels.join('\n• ')}`);
      }

      await interaction.editReply({ content: parts.filter(Boolean).join('\n\n') });
    } catch (err) {
      console.error('complete command error:', err);
      await interaction.editReply({ content: 'Unable to complete the division channel setup. Check bot permissions and try again.' });
    }
    return;
  }

  if (interaction.commandName === 'create-roles') {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.options.getString('guild-id');
    const scope = interaction.options.getString('scope') ?? 'all';
    const divisionArg = interaction.options.getString('division')?.trim();

    let guild;
    try {
      guild = await resolveGuild(interaction, guildId ?? undefined);
    } catch (err) {
      await interaction.editReply({ content: (err as Error).message });
      return;
    }

    const member = await fetchGuildMember(interaction, guild);
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: 'You need Manage Roles permission in the target server to create roles.' });
      return;
    }

    let divisions: DivisionDefinition[];
    try {
      divisions = parseDivisionLua();
    } catch (err) {
      console.error('create-roles parse error:', err);
      await interaction.editReply({ content: 'Unable to load division.lua. Make sure the file exists and is accessible.' });
      return;
    }

    let targetDivisions = divisions;
    if (divisionArg && divisionArg.toLowerCase() !== 'all') {
      const lowerArg = divisionArg.toLowerCase();
      const matched = divisions.find(
        (division) =>
          division.key.toLowerCase() === lowerArg || division.displayName.toLowerCase() === lowerArg
      );
      if (!matched) {
        await interaction.editReply({ content: `Division not found: ${divisionArg}. Use a valid division key or display name from division.lua.` });
        return;
      }
      targetDivisions = [matched];
    }

    await guild.roles.fetch();

    const createDivisionRoles = scope === 'division' || scope === 'all';
    const createRankRoles = scope === 'rank' || scope === 'all';

    const divisionRoles = createDivisionRoles
      ? targetDivisions.map((division) => ({
          name: buildDivisionRoleName(division),
          color: discordColorFromName(division.visualColor),
          type: 'division' as const,
        }))
      : [];

    const rankRoles = createRankRoles
      ? targetDivisions.flatMap((division) =>
          division.ranks.map((rank) => ({
            name: buildRoleName(division, rank),
            color: discordColorFromName(division.visualColor),
            type: 'rank' as const,
          }))
        )
      : [];

    const requestedRoles = [...divisionRoles, ...rankRoles];
    const existingRoles = guild.roles.cache;
    const newRoles = requestedRoles.filter((roleItem) => !existingRoles.some((role: Role) => role.name === roleItem.name));
    const totalToCreate = newRoles.length;
    const availableSlots = 250 - existingRoles.size;

    if (totalToCreate === 0) {
      const existingNames = requestedRoles.map((roleItem) => roleItem.name).slice(0, 15);
      const suffix = requestedRoles.length > 15 ? `\n...and ${requestedRoles.length - 15} more` : '';
      await interaction.editReply({
        content: `✓ All requested roles already exist in the server.\n\nExisting roles:\n${existingNames.map((n) => `• ${n}`).join('\n')}${suffix}`,
      });
      return;
    }

    if (totalToCreate > availableSlots || totalToCreate > 180) {
      await interaction.editReply({ content: `There are ${totalToCreate} roles to create, which exceeds Discord limits or available role slots. Use "/create-roles scope:division" or "/create-roles scope:rank" instead, or reduce the total number of requested roles.` });
      return;
    }

    let createdCount = 0;
    const createdNames: string[] = [];

    for (const roleItem of newRoles) {
      try {
        await guild.roles.create({
          name: roleItem.name,
          color: roleItem.color,
          reason: `Auto-created ${roleItem.type} role from division.lua`,
        });
        createdCount += 1;
        if (createdNames.length < 15) {
          createdNames.push(roleItem.name);
        }
      } catch (err) {
        console.warn(`Failed to create ${roleItem.type} role:`, roleItem.name, err);
      }
    }

    const existingRolesCount = requestedRoles.length - createdCount;
    const createdSample = createdNames.join('\n') + (createdCount > 15 ? `\n...and ${createdCount - 15} more` : '');
    await interaction.editReply({ content: `✓ Created ${createdCount} role(s) from division.lua.\n(${existingRolesCount} already existed)\n\nCreated roles:\n${createdSample}` });
    return;
  }

  if (interaction.commandName === 'role-list') {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.options.getString('guild-id');

    let guild;
    try {
      guild = await resolveGuild(interaction, guildId ?? undefined);
    } catch (err) {
      await interaction.editReply({ content: (err as Error).message });
      return;
    }

    const member = await fetchGuildMember(interaction, guild);
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: 'You need Manage Roles permission in the target server to export role lists.' });
      return;
    }

    let divisions: DivisionDefinition[];
    try {
      divisions = parseDivisionLua();
    } catch (err) {
      console.error('role-list parse error:', err);
      await interaction.editReply({ content: 'Unable to load division.lua. Make sure the file exists and is accessible.' });
      return;
    }

    await guild.roles.fetch();

    const scope = interaction.options.getString('scope') ?? 'all';
    const rows = ['discord_role_id,roblox_team_name'];
    let foundCount = 0;

    for (const division of divisions) {
      if (scope === 'division' || scope === 'all') {
        const roleName = buildDivisionRoleName(division);
        const roleId = guild.roles.cache.find((role: Role) => role.name === roleName)?.id ?? '';
        if (roleId) {
          rows.push([csvEscape(roleId), csvEscape(division.displayName)].join(','));
          foundCount += 1;
        }
      }

      if (scope === 'rank' || scope === 'all') {
        for (const rank of division.ranks) {
          const roleName = buildRoleName(division, rank);
          const roleId = guild.roles.cache.find((role: Role) => role.name === roleName)?.id ?? '';
          if (roleId) {
            rows.push([csvEscape(roleId), csvEscape(division.displayName)].join(','));
            foundCount += 1;
          }
        }
      }
    }

    if (foundCount === 0) {
      await interaction.editReply({ content: 'No matching division or rank roles were found in the target server. Create roles first or use a different guild.' });
      return;
    }

    const csvBuffer = Buffer.from(rows.join('\r\n'), 'utf8');
    const attachment = new AttachmentBuilder(csvBuffer).setName('division_roles.csv');

    await interaction.editReply({ content: 'Role mapping list generated for Supabase import with discord_role_id and roblox_team_name.', files: [attachment] });
    return;
  }

  if (interaction.commandName === 'delete-allroles') {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.options.getString('guild-id');

    let guild;
    try {
      guild = await resolveGuild(interaction, guildId ?? undefined);
    } catch (err) {
      await interaction.editReply({ content: (err as Error).message });
      return;
    }

    const member = await fetchGuildMember(interaction, guild);
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.editReply({ content: 'You need Administrator permission in the target server to delete all roles.' });
      return;
    }

    await guild.roles.fetch();

    let deletedCount = 0;
    for (const role of guild.roles.cache.values()) {
      if (role.id === guild.id) continue; // Skip @everyone
      try {
        await role.delete('Deleted via /delete-allroles command');
        deletedCount += 1;
      } catch (err) {
        console.warn(`Failed to delete role: ${role.name}`, err);
      }
    }

    await interaction.editReply({ content: `⚠️ Deleted ${deletedCount} role(s) from the server.` });
    return;
  }

  if (interaction.commandName === 'delete-role') {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.options.getString('guild-id');
    const roleName = interaction.options.getString('role-name', true);

    let guild;
    try {
      guild = await resolveGuild(interaction, guildId ?? undefined);
    } catch (err) {
      await interaction.editReply({ content: (err as Error).message });
      return;
    }

    const member = await fetchGuildMember(interaction, guild);
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: 'You need Manage Roles permission in the target server to delete roles.' });
      return;
    }

    await guild.roles.fetch();

    const roleToDelete = guild.roles.cache.find((r: Role) => r.name === roleName);
    if (!roleToDelete) {
      await interaction.editReply({ content: `Role "${roleName}" not found.` });
      return;
    }

    try {
      await roleToDelete.delete(`Deleted via /delete-role by ${interaction.user.tag}`);
      await interaction.editReply({ content: `✓ Deleted role: ${roleName}` });
    } catch (err) {
      console.error('Failed to delete role:', err);
      await interaction.editReply({ content: `Failed to delete role. Check bot permissions and role hierarchy.` });
    }
    return;
  }

  if (interaction.commandName === 'delete-visual-roles') {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.options.getString('guild-id');

    let guild;
    try {
      guild = await resolveGuild(interaction, guildId ?? undefined);
    } catch (err) {
      await interaction.editReply({ content: (err as Error).message });
      return;
    }

    const member = await fetchGuildMember(interaction, guild);
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: 'You need Manage Roles permission in the target server to delete roles.' });
      return;
    }

    let divisions: DivisionDefinition[];
    try {
      divisions = parseDivisionLua();
    } catch (err) {
      console.error('delete-visual-roles parse error:', err);
      await interaction.editReply({ content: 'Unable to load division.lua.' });
      return;
    }

    await guild.roles.fetch();

    const rankRoleNames = divisions.flatMap((division) =>
      division.ranks.map((rank) => buildRoleName(division, rank))
    );
    const divisionRoleNames = divisions.map((d) => buildDivisionRoleName(d));
    const allVisualNames = [...rankRoleNames, ...divisionRoleNames];

    const rolesToDelete = guild.roles.cache.filter((role: Role) => allVisualNames.includes(role.name));
    let deletedCount = 0;

    for (const role of rolesToDelete.values()) {
      try {
        await role.delete('Deleted via /delete-visual-roles');
        deletedCount += 1;
      } catch (err) {
        console.warn(`Failed to delete visual role: ${role.name}`, err);
      }
    }

    await interaction.editReply({ content: `✓ Deleted ${deletedCount} visual/rank role(s).` });
    return;
  }

  if (interaction.commandName !== 'verify') return;

  console.log('[BOT] Interaction received from', interaction.user.tag);

  await interaction.deferReply({ ephemeral: true });

  const rawInput = interaction.options.getString('username') ?? interaction.options.getString('code');

  const robloxUsername = rawInput ? rawInput.trim() : '';

  if (!robloxUsername) {
    await interaction.editReply({ content: 'Please provide your Roblox username.' });
    return;
  }

  const pendingUsername = pendingVerifications.get(interaction.user.id);
  const isSixCharCode = /^[A-Z0-9]{6}$/i.test(robloxUsername);

  if (pendingUsername && isSixCharCode) {
    try {
      const codeCandidate = robloxUsername.toUpperCase();
      const { data: codes, error: codeError } = await supabase
        .from('verification_codes')
        .select('roblox_id, roblox_username, expires_at')
        .eq('code', codeCandidate)
        .limit(1);

      if (codeError || !codes || codes.length === 0) {
        await interaction.editReply({ content: 'Verification code not found or invalid.' });
        return;
      }

      const entry = codes[0];
      if (!entry.roblox_username || entry.roblox_username.toLowerCase() !== pendingUsername.toLowerCase()) {
        await interaction.editReply({ content: 'This code does not match the Roblox username you provided.' });
        return;
      }

      const expiresAt = new Date(entry.expires_at);
      if (expiresAt.getTime() < Date.now()) {
        await interaction.editReply({ content: 'This verification code has expired.' });
        return;
      }

      await unlinkRobloxVerification(entry.roblox_id, interaction.user.id);
      const { error: upsertError } = await supabase.from('verified_users').upsert(
        {
          discord_id: interaction.user.id,
          roblox_id: entry.roblox_id,
          roblox_username: entry.roblox_username,
        },
        { onConflict: 'discord_id' }
      );

      if (upsertError) {
        console.error('Supabase upsert verified_users error:', upsertError);
        await interaction.editReply({ content: 'Failed to save verification mapping.' });
        return;
      }

      const { error: deleteError } = await supabase.from('verification_codes').delete().eq('code', codeCandidate);
      if (deleteError) {
        console.error('Supabase delete code error', deleteError);
      }

      pendingVerifications.delete(interaction.user.id);

      let nicknameMessage = 'Your Discord server nickname has been updated.';
      try {
        const guild = await resolveDefaultGuild();
        const member = await guild.members.fetch(interaction.user.id);
        await member.setNickname(entry.roblox_username);
      } catch (nicknameError) {
        console.warn('Could not update nickname:', nicknameError);
        const errMsg = nicknameError instanceof Error ? nicknameError.message : String(nicknameError);
        nicknameMessage = `Nickname update failed: ${errMsg}`;
      }

      await interaction.editReply({ content: `Verification complete. Username ${entry.roblox_username} is now linked.\n${nicknameMessage}` });
      return;
    } catch (err) {
      console.error('Slash code verification error:', err);
      await interaction.editReply({ content: 'An error occurred verifying your code.' });
      return;
    }
  }

  try {
    const { data: users, error: userError } = await supabase
      .from('verified_users')
      .select('roblox_id, roblox_username')
      .eq('discord_id', interaction.user.id)
      .limit(1);

    if (userError) {
      console.error('Supabase user lookup failed, continuing verification:', userError);
    } else if (users && users.length > 0) {
      await interaction.editReply({ content: `You are already verified as: ${users[0].roblox_username}
If you want to switch accounts, use /logout first and then verify again.` });
      return;
    }

    pendingVerifications.set(interaction.user.id, robloxUsername);

    await interaction.editReply({ content: 'Verification started. Check your DMs for the next step.' });
    try {
      await interaction.user.send({
        content: `Verification initiated for Roblox username: **${robloxUsername}**

Please paste the 6-character code from the game in this DM now.`,
      });
    } catch (dmError) {
      console.warn('Could not send DM to user:', dmError);
      await interaction.followUp({ content: 'Unable to send DM. Please enable DMs from server members and try again.', ephemeral: true });
    }
  } catch (err) {
    console.error('Slash command verification error:', err);
    await interaction.editReply({ content: 'An error occurred processing your request.' });
  }
});

discordClient.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.guild !== null) return;

  const content = message.content.trim();
  const normalized = content.toLowerCase();

  if (normalized === '/logout' || normalized === '/logout ') {
    try {
      const { error } = await supabase.from('verified_users').delete().eq('discord_id', message.author.id);
      if (error) {
        console.error('Supabase DM logout delete error:', error);
        await message.reply({ content: 'Unable to log you out right now. Please try again later.' });
        return;
      }

      try {
        const guild = await resolveDefaultGuild();
        const member = await guild.members.fetch(message.author.id);
        await member.setNickname(null);
      } catch (nicknameError) {
        console.warn('Could not reset nickname during DM logout:', nicknameError);
      }

      await message.reply({ content: 'You have been logged out from Roblox verification and your server nickname was reset.' });
    } catch (err) {
      console.error('DM logout error:', err);
      await message.reply({ content: 'An error occurred while logging you out.' });
    }
    return;
  }

  if (normalized === '/verify' || normalized === '/verify ') {
    await message.reply({
      content: 'Please send your Roblox username in this DM using `/verify <RobloxUsername>`.',
    });
    return;
  }

  if (normalized.startsWith('/verify ')) {
    const robloxUsername = content.slice(8).trim();

    if (!robloxUsername) {
      await message.reply({
        content: 'Please provide your Roblox username: `/verify <RobloxUsername>`.',
      });
      return;
    }

    try {
      const { data: users, error: userError } = await supabase
        .from('verified_users')
        .select('roblox_id, roblox_username')
        .eq('discord_id', message.author.id)
        .limit(1);

      if (userError) {
        console.error('Supabase user lookup failed, continuing verification:', userError);
      } else if (users && users.length > 0) {
        await message.reply({
          content: `You are already verified as: ${users[0].roblox_username}\n\nTo verify a different account, contact a server administrator.`,
        });
        return;
      }

      pendingVerifications.set(message.author.id, robloxUsername);
      await message.reply({
        content: `Verification started for Roblox username: **${robloxUsername}**\n\nPlease paste the 6-character code from the game in this DM now.`,
      });
    } catch (err) {
      console.error('DM verification error:', err);
      await message.reply({
        content: 'An error occurred processing your request.',
      });
    }
    return;
  }

  const codeCandidate = content.toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(codeCandidate)) {
    const pendingUsername = pendingVerifications.get(message.author.id);
    if (!pendingUsername) {
      await message.reply({
        content: 'Please start verification first with `/verify <RobloxUsername>`.',
      });
      return;
    }

    try {
      const { data: codes, error: codeError } = await supabase
        .from('verification_codes')
        .select('roblox_id, roblox_username, expires_at')
        .eq('code', codeCandidate)
        .limit(1);

      if (codeError || !codes || codes.length === 0) {
        await message.reply({
          content: 'Verification code not found or invalid.',
        });
        return;
      }

      const entry = codes[0];
      if (!entry.roblox_username || entry.roblox_username.toLowerCase() !== pendingUsername.toLowerCase()) {
        await message.reply({
          content: 'This code does not match the Roblox username you provided.',
        });
        return;
      }

      const expiresAt = new Date(entry.expires_at);
      if (expiresAt.getTime() < Date.now()) {
        await message.reply({
          content: 'This verification code has expired.',
        });
        return;
      }

      const robloxId = entry.roblox_id;
      const robloxUsername = entry.roblox_username;

      await unlinkRobloxVerification(robloxId, message.author.id);
      const { error: upsertError } = await supabase.from('verified_users').upsert(
        {
          discord_id: message.author.id,
          roblox_id: robloxId,
          roblox_username: robloxUsername,
        },
        { onConflict: 'discord_id' }
      );

      if (upsertError) {
        console.error('Supabase upsert verified_users error', upsertError);
        await message.reply({
          content: 'Failed to save verification mapping.',
        });
        return;
      }

      const { error: deleteError } = await supabase.from('verification_codes').delete().eq('code', codeCandidate);
      if (deleteError) {
        console.error('Supabase delete code error', deleteError);
      }

      pendingVerifications.delete(message.author.id);

      let nicknameMessage = 'Your Discord server nickname has been updated.';
      try {
        const guild = await resolveDefaultGuild();
        const member = await guild.members.fetch(message.author.id);
        await member.setNickname(robloxUsername);
      } catch (nicknameError) {
        console.warn('Could not update nickname:', nicknameError);
        const errMsg = nicknameError instanceof Error ? nicknameError.message : String(nicknameError);
        nicknameMessage = `Nickname update failed: ${errMsg}`;
      }

      const successMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VERIFICATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Username: ${robloxUsername}
Status: Verified

${nicknameMessage}
Your roles will sync in the Roblox game.

━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      await message.reply({
        content: successMessage,
      });
    } catch (err) {
      console.error('Code verification error:', err);
      await message.reply({
        content: 'An error occurred verifying your code.',
      });
    }
    return;
  }

  await message.reply({
    content: 'Send `/verify <RobloxUsername>` to begin verification, then paste the code from the game in this DM.',
  });
});

if (!DISCORD_BOT_TOKEN) {
  console.error('[BOT] Discord bot token is missing or empty. Please set DISCORD_BOT_TOKEN.');
} else {
  discordClient.login(DISCORD_BOT_TOKEN).catch((error: unknown) => {
    console.error('[BOT] Discord login failed:', error);
  });
}
