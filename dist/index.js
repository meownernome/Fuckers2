"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
const discord_js_1 = require("discord.js");
dotenv_1.default.config();
function getRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
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
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
    },
});
const discordClient = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMembers] });
function generateVerificationCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}
function requireJwtSecret(secretToken) {
    return typeof secretToken === 'string' && secretToken === JWT_SECRET;
}
app.post('/api/game/generate-code', async (req, res) => {
    const { robloxId, robloxUsername, secretToken } = req.body;
    if (!requireJwtSecret(secretToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!robloxId || !robloxUsername) {
        return res.status(400).json({ error: 'robloxId and robloxUsername are required' });
    }
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
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
app.post('/api/game/check-roles', async (req, res) => {
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
    try {
        const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
        const member = await guild.members.fetch(discordId);
        const roleIds = member.roles.cache.map((role) => role.id);
        const response = await supabase
            .from('role_mappings')
            .select('discord_role_id, roblox_team_name');
        const roleMappings = response.data;
        const mappingError = response.error;
        if (mappingError) {
            console.error('Supabase role_mappings query error', mappingError);
            return res.status(500).json({ error: 'Failed to query role mappings' });
        }
        const teamNames = (roleMappings || [])
            .filter((mapping) => roleIds.includes(mapping.discord_role_id))
            .map((mapping) => mapping.roblox_team_name)
            .filter((name) => typeof name === 'string');
        return res.json({ teamNames });
    }
    catch (error) {
        console.error('Discord fetch error', error);
        return res.status(500).json({ error: 'Failed to fetch Discord member or roles' });
    }
});
app.listen(PORT, () => {
    console.log(`Express server started on port ${PORT}`);
});
discordClient.once(discord_js_1.Events.ClientReady, async () => {
    console.log(`Discord bot logged in as ${discordClient.user?.tag}`);
    const verifyCommand = {
        name: 'verify',
        description: 'Verify your Roblox account with a 6-character code',
        options: [
            {
                name: 'code',
                description: 'Your 6-character Roblox verification code',
                type: 3,
                required: true,
            },
        ],
    };
    if (discordClient.application) {
        try {
            await discordClient.application.commands.set([verifyCommand]);
            console.log('Registered global /verify command');
        }
        catch (commandError) {
            console.error('Failed to register slash command', commandError);
        }
    }
});
discordClient.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'verify') {
        return;
    }
    const code = interaction.options.getString('code', true).toUpperCase();
    const { data: codes, error: codeError } = await supabase
        .from('verification_codes')
        .select('roblox_id, roblox_username, expires_at')
        .eq('code', code)
        .limit(1);
    if (codeError) {
        console.error('Supabase verification fetch error', codeError);
        await interaction.reply({ content: 'An error occurred while verifying your code.', ephemeral: true });
        return;
    }
    if (!codes || codes.length === 0) {
        await interaction.reply({ content: 'That verification code was not found.', ephemeral: true });
        return;
    }
    const entry = codes[0];
    const expiresAt = new Date(entry.expires_at);
    if (expiresAt.getTime() < Date.now()) {
        await interaction.reply({ content: 'That verification code has expired.', ephemeral: true });
        return;
    }
    const robloxId = entry.roblox_id;
    const robloxUsername = entry.roblox_username;
    const { error: upsertError } = await supabase.from('verified_users').upsert({
        discord_id: interaction.user.id,
        roblox_id: robloxId,
        roblox_username: robloxUsername,
    }, { onConflict: 'discord_id' });
    if (upsertError) {
        console.error('Supabase upsert verified_users error', upsertError);
        await interaction.reply({ content: 'Failed to save verification mapping.', ephemeral: true });
        return;
    }
    const { error: deleteError } = await supabase.from('verification_codes').delete().eq('code', code);
    if (deleteError) {
        console.error('Supabase delete code error', deleteError);
    }
    try {
        const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
        const member = await guild.members.fetch(interaction.user.id);
        await member.setNickname(`[Verified] ${robloxUsername}`);
    }
    catch (nicknameError) {
        console.warn('Could not update nickname:', nicknameError);
    }
    await interaction.reply({ content: `Verification successful! Your Roblox name ${robloxUsername} is now linked.`, ephemeral: true });
});
if (!DISCORD_BOT_TOKEN) {
    console.error('Discord bot token is missing or empty. Please set DISCORD_BOT_TOKEN.');
}
else {
    discordClient.login(DISCORD_BOT_TOKEN).catch((error) => {
        console.error('Discord login failed:', error);
    });
}
