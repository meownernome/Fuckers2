# Roblox + Discord Backend

This project is a Node.js + TypeScript backend for Discord verification and Roblox role syncing.

## Environment Variables

Set these variables in Railway / local `.env`:

- `DISCORD_BOT_TOKEN` - your Discord bot token
- `DISCORD_CLIENT_ID` - your Discord application client ID
- `DISCORD_GUILD_ID` - your Discord server (guild) ID
- `SUPABASE_URL` - your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - your Supabase service role key
- `JWT_SECRET` - your verification webhook secret
- `PORT` - optional, default is `3000`

### How to get Supabase variables

1. Sign in to Supabase and open your project.
2. Go to **Settings > API**.
3. Copy the **Project URL** and paste it as `SUPABASE_URL`.
4. Under **Config > API Keys**, copy the **Service Role** key and paste it as `SUPABASE_SERVICE_ROLE_KEY`.

> Use the Service Role key only for backend server-side operations. Do not expose it publicly.

## Deployment on Railway

Railway does not automatically prompt for env vars during deploy. You must add them in the project settings before or after deployment.

1. Open your Railway project.
2. Go to **Variables**.
3. Add the variables from the list above.
4. Deploy the project.

If any required variable is missing, the app will throw an error and fail to start.

## Notes

- `dist/` and `node_modules/` are ignored in `.gitignore`.
- Do not commit `.env` or any real secrets to GitHub.
- If your bot token was compromised, regenerate it in the Discord Developer Portal and update `DISCORD_BOT_TOKEN` in Railway.
