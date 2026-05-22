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
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
    },
});
const discordClient = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
function generateVerificationCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
    console.log(`[API] Express server started on port ${PORT}`);
});
discordClient.once(discord_js_1.Events.ClientReady, () => {
    console.log(`[BOT] Discord bot logged in as ${discordClient.user?.tag}`);
});
discordClient.on(discord_js_1.Events.MessageCreate, async (message) => {
    if (message.author.bot)
        return;
    if (message.guild !== null)
        return;
    const content = message.content.trim();
    if (content.startsWith('/verify ')) {
        const robloxUsername = content.slice(8).trim();
        if (!robloxUsername || robloxUsername.length === 0) {
            await message.reply({
                content: 'Usage: /verify <RobloxUsername>',
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
                await message.reply({
                    content: 'An error occurred. Please try again later.',
                });
                return;
            }
            if (users && users.length > 0) {
                await message.reply({
                    content: `You are already verified as: ${users[0].roblox_username}\n\nTo verify a different account, contact server administrators.`,
                });
                return;
            }
            const code = generateVerificationCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
            const { error: insertError } = await supabase.from('verification_codes').insert({
                roblox_id: null,
                roblox_username: robloxUsername,
                discord_user_id: message.author.id,
                code,
                expires_at: expiresAt,
            });
            if (insertError) {
                console.error('Insert error:', insertError);
                await message.reply({
                    content: 'Failed to generate verification code. Please try again.',
                });
                return;
            }
            const confirmMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VERIFICATION CODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Roblox Username: ${robloxUsername}
Code: \`${code}\`
Expires: 10 minutes

Next Steps:
1. Join the Roblox game
2. Click "CODE RECEIVED" button
3. Click to copy the code shown in-game
4. Paste the code here or in game
5. You will be verified

━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
            await message.reply({
                content: confirmMessage,
            });
        }
        catch (err) {
            console.error('DM verification error:', err);
            await message.reply({
                content: 'An error occurred processing your request.',
            });
        }
        return;
    }
    if (content.length === 6 && /^[A-Z0-9]{6}$/.test(content)) {
        try {
            const { data: codes, error: codeError } = await supabase
                .from('verification_codes')
                .select('roblox_username, expires_at, discord_user_id')
                .eq('code', content)
                .limit(1);
            if (codeError || !codes || codes.length === 0) {
                await message.reply({
                    content: 'Verification code not found or invalid.',
                });
                return;
            }
            const entry = codes[0];
            if (entry.discord_user_id !== message.author.id) {
                await message.reply({
                    content: 'This code belongs to a different user.',
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
            const robloxUsername = entry.roblox_username;
            const { error: upsertError } = await supabase.from('verified_users').upsert({
                discord_id: message.author.id,
                roblox_id: null,
                roblox_username: robloxUsername,
            }, { onConflict: 'discord_id' });
            if (upsertError) {
                console.error('Upsert error:', upsertError);
                await message.reply({
                    content: 'Failed to complete verification.',
                });
                return;
            }
            await supabase.from('verification_codes').delete().eq('code', content);
            try {
                const guild = await discordClient.guilds.fetch(DISCORD_GUILD_ID);
                const member = await guild.members.fetch(message.author.id);
                await member.setNickname(robloxUsername);
            }
            catch (nicknameErr) {
                console.warn('Could not update nickname:', nicknameErr);
            }
            const successMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VERIFICATION COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Username: ${robloxUsername}
Status: Verified

Your Discord server nickname has been updated.
Your roles will sync in the Roblox game.

━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
            await message.reply({
                content: successMessage,
            });
        }
        catch (err) {
            console.error('Code verification error:', err);
            await message.reply({
                content: 'An error occurred verifying your code.',
            });
        }
        return;
    }
});
if (!DISCORD_BOT_TOKEN) {
    console.error('[BOT] Discord bot token is missing or empty. Please set DISCORD_BOT_TOKEN.');
}
else {
    discordClient.login(DISCORD_BOT_TOKEN).catch((error) => {
        console.error('[BOT] Discord login failed:', error);
    });
}
