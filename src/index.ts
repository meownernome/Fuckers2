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
  PermissionFlagsBits,
  AttachmentBuilder,
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

type DivisionDefinition = {
  key: string;
  displayName: string;
  role: string;
  visualColor: string;
  icon: string;
  notes: string;
  ranks: string[];
};

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
      if (divisionMatch && !line.startsWith('ranks =')) {
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

      if (line.startsWith('}')) {
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

function generateVerificationCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
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
      name: 'create-roles',
      description: 'Automatically create roles from division.lua',
      options: [
        {
          name: 'scope',
          description: 'Create either division or rank roles',
          type: 3,
          required: false,
          choices: [
            { name: 'division', value: 'division' },
            { name: 'rank', value: 'rank' },
          ],
        },
      ],
    },
    {
      name: 'role-list',
      description: 'Export a CSV list of division roles and ranks',
      options: [
        {
          name: 'scope',
          description: 'Include division-level roles or full rank list',
          type: 3,
          required: false,
          choices: [
            { name: 'division', value: 'division' },
            { name: 'rank', value: 'rank' },
          ],
        },
      ],
    },
    {
      name: 'delete',
      description: 'Delete roles from the server',
      options: [
        {
          name: 'scope',
          description: 'What to delete',
          type: 3,
          required: true,
          choices: [
            { name: 'all roles', value: 'all' },
            { name: 'division roles', value: 'divisions' },
            { name: 'rank/visual roles', value: 'visual' },
            { name: 'single role', value: 'single' },
          ],
        },
        {
          name: 'role-name',
          description: 'Name of the role to delete (only for single role)',
          type: 3,
          required: false,
        },
      ],
    },
  ];

  try {
    if (discordClient.application?.commands) {
      await discordClient.application.commands.set(commandDefinition);
      console.log('[BOT] Registered global slash commands for verification and admin moderation');
    } else {
      console.warn('[BOT] Global application commands are unavailable.');
    }
  } catch (globalError) {
    console.error('[BOT] Global command registration failed:', globalError);
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
        const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
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
      const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
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
      const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
      const member = await guild.members.fetch(target.id);
      await member.timeout(minutes * 60 * 1000, reason);
      await interaction.editReply({ content: `⏱️ ${target.tag} has been timed out for ${minutes} minute(s).` });
    } catch (err) {
      console.error('freeze command error:', err);
      await interaction.editReply({ content: 'Unable to freeze that user. Please check bot permissions and role hierarchy.' });
    }
    return;
  }

  if (interaction.commandName === 'create-roles') {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command must be used in the server channel.' });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: 'You need Manage Roles permission to create roles.' });
      return;
    }

    const scope = interaction.options.getString('scope') ?? 'division';
    let divisions: DivisionDefinition[];
    try {
      divisions = parseDivisionLua();
    } catch (err) {
      console.error('create-roles parse error:', err);
      await interaction.editReply({ content: 'Unable to load division.lua. Make sure the file exists and is accessible.' });
      return;
    }

    const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
    await guild.roles.fetch();

    if (scope === 'rank') {
      const rankRoles = divisions.flatMap((division) =>
        division.ranks.map((rank) => ({
          name: buildRoleName(division, rank),
          color: discordColorFromName(division.visualColor),
          division: division.displayName,
        }))
      );

      const newRoles = rankRoles.filter((roleItem) => !guild.roles.cache.some((role) => role.name === roleItem.name));
      const availableSlots = 250 - guild.roles.cache.size;
      const existingRolesCount = rankRoles.length - newRoles.length;

      console.log(`[create-roles] Total rank roles needed: ${rankRoles.length}, Already exist: ${existingRolesCount}, Need to create: ${newRoles.length}`);
      console.log(`[create-roles] Sample roles to create:`, newRoles.slice(0, 5));

      if (newRoles.length === 0) {
        const existingRoleNames = rankRoles
          .filter((roleItem) => guild.roles.cache.some((role) => role.name === roleItem.name))
          .map((r) => r.name)
          .slice(0, 10);
        const suffix = rankRoles.length > 10 ? `\n...and ${rankRoles.length - 10} more` : '';
        await interaction.editReply({ content: `✓ All ${rankRoles.length} rank roles already exist in the server.\n\nExisting roles:\n${existingRoleNames.map(n => `• ${n}`).join('\n')}${suffix}\n\nTo recreate roles, use \`/delete all-roles\` first then run this command again.` });
        return;
      }

      if (newRoles.length > availableSlots || newRoles.length > 180) {
        await interaction.editReply({ content: `There are ${newRoles.length} rank roles to create, which exceeds Discord limits (max 180). Use "/create-roles scope:division" instead or create a smaller subset.` });
        return;
      }

      let createdCount = 0;
      const createdRoles: string[] = [];
      for (const roleItem of newRoles) {
        try {
          await guild.roles.create({
            name: roleItem.name,
            color: roleItem.color,
            reason: 'Auto-created rank role from division.lua',
          });
          createdCount += 1;
          if (createdCount <= 15) {
            createdRoles.push(`• ${roleItem.name}`);
          }
        } catch (err) {
          console.warn('Failed to create rank role:', roleItem.name, err);
        }
      }

      const displayRoles = createdRoles.join('\n') + (newRoles.length > 15 ? `\n...and ${newRoles.length - 15} more roles` : '');
      await interaction.editReply({ content: `✓ Created ${createdCount} rank role(s) from division.lua!\n(${existingRolesCount} roles already existed)\n\n**Sample roles created:**\n${displayRoles}` });
      return;
    }

    const divisionRoles = divisions.map((division) => ({
      name: buildDivisionRoleName(division),
      color: discordColorFromName(division.visualColor),
    }));

    const newDivisionRoles = divisionRoles.filter((roleItem) => !guild.roles.cache.some((role) => role.name === roleItem.name));
    let createdCount = 0;
    for (const roleItem of newDivisionRoles) {
      try {
        await guild.roles.create({
          name: roleItem.name,
          color: roleItem.color,
          reason: 'Auto-created division role from division.lua',
        });
        createdCount += 1;
      } catch (err) {
        console.warn('Failed to create division role:', roleItem.name, err);
      }
    }

    await interaction.editReply({ content: `Created ${createdCount} division role(s) from division.lua.` });
    return;
  }

  if (interaction.commandName === 'role-list') {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: 'You need Manage Roles permission to export role lists.' });
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

    const scope = interaction.options.getString('scope') ?? 'division';
    const rows = ['division_key,division_name,rank,role_name,color,icon,notes'];

    for (const division of divisions) {
      if (scope === 'division') {
        rows.push([
          csvEscape(division.key),
          csvEscape(division.displayName),
          '',
          csvEscape(buildDivisionRoleName(division)),
          csvEscape(division.visualColor),
          csvEscape(division.icon),
          csvEscape(division.notes),
        ].join(','));
      } else {
        for (const rank of division.ranks) {
          rows.push([
            csvEscape(division.key),
            csvEscape(division.displayName),
            csvEscape(rank),
            csvEscape(buildRoleName(division, rank)),
            csvEscape(division.visualColor),
            csvEscape(division.icon),
            csvEscape(division.notes),
          ].join(','));
        }
      }
    }

    const csvBuffer = Buffer.from(rows.join('\r\n'), 'utf8');
    const attachment = new AttachmentBuilder(csvBuffer).setName('division_roles.csv');

    await interaction.editReply({ content: 'Division role list generated.', files: [attachment] });
    return;
  }

  if (interaction.commandName === 'delete') {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command must be used in the server channel.' });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.editReply({ content: 'You need Manage Roles permission to delete roles.' });
      return;
    }

    const scope = interaction.options.getString('scope') ?? 'all-roles';
    const singleRoleName = interaction.options.getString('role-name');

    const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
    await guild.roles.fetch();

    if (scope === 'single') {
      if (!singleRoleName) {
        await interaction.editReply({ content: 'Please specify a role name to delete.' });
        return;
      }

      const roleToDelete = guild.roles.cache.find((role) => role.name === singleRoleName);
      if (!roleToDelete) {
        await interaction.editReply({ content: `Role "${singleRoleName}" not found in this server.` });
        return;
      }

      try {
        await roleToDelete.delete('Deleted via /delete command');
        await interaction.editReply({ content: `✓ Deleted role: ${singleRoleName}` });
      } catch (err) {
        console.error('Failed to delete role:', err);
        await interaction.editReply({ content: `Failed to delete role. Check bot permissions and role hierarchy.` });
      }
      return;
    }

    if (scope === 'divisions') {
      let divisions: DivisionDefinition[];
      try {
        divisions = parseDivisionLua();
      } catch (err) {
        console.error('delete divisions parse error:', err);
        await interaction.editReply({ content: 'Unable to load division.lua.' });
        return;
      }

      const divisionRoleNames = divisions.map((d) => buildDivisionRoleName(d));
      const rolesToDelete = guild.roles.cache.filter((role) => divisionRoleNames.includes(role.name));
      let deletedCount = 0;

      for (const role of rolesToDelete.values()) {
        try {
          await role.delete('Deleted via /delete division roles');
          deletedCount += 1;
        } catch (err) {
          console.warn('Failed to delete division role:', role.name, err);
        }
      }

      await interaction.editReply({ content: `✓ Deleted ${deletedCount} division role(s).` });
      return;
    }

    if (scope === 'visual') {
      let divisions: DivisionDefinition[];
      try {
        divisions = parseDivisionLua();
      } catch (err) {
        console.error('delete visual parse error:', err);
        await interaction.editReply({ content: 'Unable to load division.lua.' });
        return;
      }

      const rankRoleNames = divisions.flatMap((division) =>
        division.ranks.map((rank) => buildRoleName(division, rank))
      );
      const rolesToDelete = guild.roles.cache.filter((role) => rankRoleNames.includes(role.name));
      let deletedCount = 0;

      for (const role of rolesToDelete.values()) {
        try {
          await role.delete('Deleted via /delete visual roles');
          deletedCount += 1;
        } catch (err) {
          console.warn('Failed to delete visual role:', role.name, err);
        }
      }

      await interaction.editReply({ content: `✓ Deleted ${deletedCount} rank/visual role(s).` });
      return;
    }

    // scope === 'all'
    let deletedCount = 0;
    for (const role of guild.roles.cache.values()) {
      // Skip @everyone role
      if (role.id === guild.id) continue;

      try {
        await role.delete('Deleted via /delete all roles');
        deletedCount += 1;
      } catch (err) {
        console.warn('Failed to delete role:', role.name, err);
      }
    }

    await interaction.editReply({ content: `⚠️ Deleted ${deletedCount} role(s) from the server.` });
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
        const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
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
        const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
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
        const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
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
