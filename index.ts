import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// 1. Generate Verification Code (Called by Roblox)
app.post('/api/game/generate-code', async (req, res) => {
  const { robloxId, robloxUsername, secretToken } = req.body;
  if (secretToken !== process.env.JWT_SECRET) return res.status(401).json({ error: 'Unauthorized.' });

  const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const { error } = await supabase.from('verification_codes').insert({
    code: verificationCode,
    roblox_id: robloxId.toString(),
    roblox_username: robloxUsername,
    expires_at: expiresAt.toISOString()
  });

  if (error) return res.status(500).json({ error: 'DB Error' });
  return res.status(200).json({ code: verificationCode });
});

// 2. Complete Verification Gateway (Called by Website UI)
app.post('/api/verify', async (req, res) => {
  const { discordId, verificationCode } = req.body;

  const { data: codeData, error: codeError } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('code', verificationCode.toUpperCase())
    .single();

  if (codeError || !codeData) return res.status(400).json({ error: 'Invalid or missing code.' });
  if (new Date() > new Date(codeData.expires_at)) {
    await supabase.from('verification_codes').delete().eq('code', verificationCode);
    return res.status(400).json({ error: 'Token expired.' });
  }

  const { error: insertError } = await supabase.from('verified_users').upsert({
    discord_id: discordId,
    roblox_username: codeData.roblox_username,
    roblox_id: codeData.roblox_id
  });

  if (insertError) return res.status(500).json({ error: 'Failed to bind accounts.' });
  await supabase.from('verification_codes').delete().eq('code', verificationCode);

  try {
    const guild = await bot.guilds.fetch(process.env.DISCORD_GUILD_ID || '');
    const member = await guild.members.fetch(discordId);
    if (member) await member.setNickname(`[Verified] ${codeData.roblox_username}`).catch(() => {});
  } catch (e) {}

  return res.status(200).json({ success: true, robloxUsername: codeData.roblox_username });
});

// 3. Role Synchronization (Called by Roblox)
app.post('/api/game/check-roles', async (req, res) => {
  const { robloxId, secretToken } = req.body;
  if (secretToken !== process.env.JWT_SECRET) return res.status(401).json({ error: 'Unauthorized.' });

  const { data: user, error } = await supabase
    .from('verified_users')
    .select('discord_id')
    .eq('roblox_id', robloxId.toString())
    .single();

  if (error || !user) return res.status(404).json({ error: 'User profile not found.' });

  try {
    const guild = await bot.guilds.fetch(process.env.DISCORD_GUILD_ID || '');
    const member = await guild.members.fetch(user.discord_id);
    const { data: mappings } = await supabase.from('role_mappings').select('*').eq('is_enabled', true);
    
    const matchingTeams: string[] = [];
    if (mappings && member) {
      for (const map of mappings) {
        if (member.roles.cache.has(map.discord_role_id)) {
          matchingTeams.push(map.roblox_team_name);
        }
      }
    }
    return res.status(200).json({ isVerified: true, teams: matchingTeams });
  } catch (err) {
    return res.status(200).json({ isVerified: true, teams: [] });
  }
});

// Bot Commands Setup
const commands = [
  new SlashCommandBuilder().setName('verify').setDescription('Get your verification link.'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Check linked account information.')
];

bot.on('ready', async () => {
  console.log(`🤖 Bot connected as: ${bot.user?.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN || '');
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID || '', process.env.DISCORD_GUILD_ID || ''),
      { body: commands }
    );
  } catch (e) { console.error(e); }
});

bot.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, user } = interaction;

  if (commandName === 'verify') {
    await interaction.reply({ content: `👋 Go to the Web Dashboard to verify your account securely!`, ephemeral: true });
  }
  if (commandName === 'userinfo') {
    const { data } = await supabase.from('verified_users').select('*').eq('discord_id', user.id).single();
    if (!data) return interaction.reply({ content: '❌ No profile link found.', ephemeral: true });
    return interaction.reply({ content: `📋 **Linked Account:** ${data.roblox_username} (ID: ${data.roblox_id})`, ephemeral: true });
  }
});

app.listen(PORT, () => console.log(`🚀 Web server listening on port ${PORT}`));
bot.login(process.env.DISCORD_BOT_TOKEN);
