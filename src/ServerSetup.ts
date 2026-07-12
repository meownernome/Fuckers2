import https from 'https';
import { Guild, ChannelType, TextChannel, CategoryChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { logger } from './utils/Logger';
import { ALL_ROLES } from './roles';

const CATEGORIES: { key: string; name: string }[] = [
  { key: 'information', name: '══════════ INFORMATION ══════════' },
  { key: 'community', name: '══════════ COMMUNITY ══════════' },
  { key: 'support', name: '══════════ SUPPORT ══════════' },
  { key: 'tier-testing', name: '══════════ TIER TESTING ══════════' },
  { key: 'tickets', name: '══════════ TICKETS ══════════' },
  { key: 'leaderboards', name: '══════════ LEADERBOARDS ══════════' },
  { key: 'staff', name: '══════════ STAFF ══════════' },
  { key: 'logs', name: '══════════ LOGS ══════════' },
  { key: 'voice', name: '══════════ VOICE ══════════' },
];

const MODE_EMOJI: Record<string, string> = {
  'Sword': '⚔️', 'Crystal': '💎', 'SMP': '🛡️', 'Netherite Pot': '🌋', 'Diamond Pot': '💠',
  'UHC': '❤️', 'BuildUHC': '🏗️', 'NoDebuff': '🚫', 'Combo': '🥊', 'Gapple': '🍎',
  'OP Duel': '⚡', 'Boxing': '🥊', 'Axe': '🪓', 'Mace': '🔨', 'Anchor': '⚓',
  'Cart PvP': '🛒', 'Bedwars': '🛏️', 'Skywars': '☁️', 'Bridge': '🌉', 'Nodebuff': '🔥',
  'Vanilla': '🌿', 'Crossbow': '🏹', 'Trident': '🔱', 'Shield': '🛡️', 'Elytra Combat': '🦅',
  'Custom Duel': '🎯',
};

const CHANNELS: { cat: string; name: string; topic?: string }[] = [
  { cat: 'information', name: 'welcome', topic: '🏰 Welcome to HARVAL MC' },
  { cat: 'information', name: 'rules', topic: '📜 Server rules' },
  { cat: 'information', name: 'faq', topic: '❓ FAQ' },
  { cat: 'information', name: 'server-ip', topic: '🖥️ play.harvalmc.fun' },
  { cat: 'information', name: 'announcements', topic: '📢 Announcements' },
  { cat: 'information', name: 'updates', topic: '🔔 Updates' },
  { cat: 'information', name: 'verify', topic: '✅ Verify' },
  { cat: 'information', name: 'how-tier-testing-works', topic: '📖 Tier guide' },
  { cat: 'information', name: 'staff', topic: '👥 Staff' },
  { cat: 'information', name: 'roles', topic: '🎨 Roles' },
  { cat: 'community', name: 'general', topic: '💬 Chat' },
  { cat: 'community', name: 'minecraft-chat', topic: '⛏️ Minecraft' },
  { cat: 'community', name: 'clips', topic: '🎬 Clips' },
  { cat: 'community', name: 'screenshots', topic: '📸 Screenshots' },
  { cat: 'community', name: 'media', topic: '🎥 Media' },
  { cat: 'community', name: 'polls', topic: '📊 Polls' },
  { cat: 'community', name: 'suggestions', topic: '💡 Suggestions' },
  { cat: 'community', name: 'off-topic', topic: '🎲 Off-topic' },
  { cat: 'support', name: 'create-ticket', topic: '🎫 Open ticket' },
  { cat: 'support', name: 'bug-report', topic: '🐛 Bugs' },
  { cat: 'support', name: 'report-player', topic: '🚨 Reports' },
  { cat: 'support', name: 'appeal', topic: '📩 Appeal' },
  { cat: 'support', name: 'questions', topic: '❓ Questions' },
  { cat: 'tier-testing', name: 'request-tier-test', topic: '⚔️ Request test' },
  { cat: 'tier-testing', name: 'queue', topic: '⏳ Queue' },
  { cat: 'tier-testing', name: 'tier-results', topic: '🏆 Results' },
  { cat: 'tier-testing', name: 'leaderboards', topic: '📊 Leaderboards' },
  { cat: 'tier-testing', name: 'tier-information', topic: '📖 Tier info' },
  { cat: 'tier-testing', name: 'retest-request', topic: '🔄 Retest' },
  { cat: 'staff', name: 'staff-chat', topic: '🔒 Staff' },
  { cat: 'staff', name: 'commands', topic: '⌨️ Commands' },
  { cat: 'staff', name: 'claims', topic: '📌 Claims' },
  { cat: 'staff', name: 'applications', topic: '📝 Applications' },
  { cat: 'staff', name: 'reports', topic: '📋 Reports' },
  { cat: 'staff', name: 'moderation', topic: '🔨 Moderation' },
  { cat: 'logs', name: 'ticket-logs', topic: '🎫 Tickets' },
  { cat: 'logs', name: 'tier-logs', topic: '⚔️ Tier logs' },
  { cat: 'logs', name: 'bot-logs', topic: '🤖 Bot logs' },
  { cat: 'logs', name: 'error-logs', topic: '❌ Errors' },
  { cat: 'logs', name: 'join-leave', topic: '👋 Join/Leave' },
  { cat: 'logs', name: 'role-logs', topic: '🎨 Roles' },
  { cat: 'logs', name: 'verification-logs', topic: '✅ Verification' },
  { cat: 'logs', name: 'command-logs', topic: '⌨️ Commands' },
  { cat: 'voice', name: 'general-1' }, { cat: 'voice', name: 'general-2' },
  { cat: 'voice', name: 'afk' }, { cat: 'voice', name: 'staff-vc' }, { cat: 'voice', name: 'meeting-room' },
];

export class ServerSetup {
  private guild: Guild;

  constructor(client: any, guild: Guild) { this.guild = guild; }

  private sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
  private tc(name: string) { return this.guild.channels.cache.find(c => c.name === name && c.type === ChannelType.GuildText) as TextChannel | undefined; }
  private findCat(key: string) {
    const cat = CATEGORIES.find(c => c.key === key);
    return this.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === cat?.name) as CategoryChannel | undefined;
  }

  // ═══════════════════════════════════════════
  // /all
  // ═══════════════════════════════════════════

  public async setupAll(): Promise<void> {
    logger.info(`══════════ /all START ══════════`);

    // Categories
    for (const c of CATEGORIES) {
      try {
        if (!this.guild.channels.cache.some(ch => ch.type === ChannelType.GuildCategory && ch.name === c.name)) {
          await this.guild.channels.create({ name: c.name, type: ChannelType.GuildCategory });
          logger.info(`  📁 ${c.name}`);
        }
      } catch (e: any) { logger.error(`  📁 FAIL ${c.key}: ${e.message}`); }
    }

    // Channels
    for (const ch of CHANNELS) {
      try {
        const cat = this.findCat(ch.cat);
        if (!cat || cat.children.cache.some(c => c.name === ch.name)) continue;
        await cat.children.create({ name: ch.name, type: ChannelType.GuildText, topic: ch.topic || undefined } as any);
        logger.info(`  #${ch.name}`);
        await this.sleep(300);
      } catch (e: any) { logger.error(`  #${ch.name} FAIL: ${e.message}`); }
    }

    // Roles — create from explicit flat list via direct HTTPS (socket timeout safe)
    const start = Date.now();
    let done = 0;
    let failedRoles = 0;
    try { await this.guild.roles.fetch(); } catch {}
    const existingNames = new Set(this.guild.roles.cache.map(r => r.name));
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;

    for (let i = 0; i < ALL_ROLES.length; i++) {
      if (Date.now() - start > 600000) { logger.warn('⏰ Timeout'); break; }
      const r = ALL_ROLES[i];
      if (existingNames.has(r.name)) { done++; continue; }
      try {
        await new Promise<void>((resolve, reject) => {
          const data = JSON.stringify({ name: r.name, color: r.color, hoist: false, mentionable: false });
          const req = https.request({
            hostname: 'discord.com', path: `/api/v10/guilds/${this.guild.id}/roles`,
            method: 'POST', timeout: 8000,
            headers: { 'Authorization': `Bot ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
          }, (res) => {
            let body = '';
            res.on('data', (c: any) => body += c);
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve();
              else reject(new Error(`HTTP ${res.statusCode}`));
            });
          });
          req.on('error', reject);
          req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
          req.write(data);
          req.end();
        });
        done++;
        if (done % 50 === 0 || done === ALL_ROLES.length) logger.info(`  [${done}/${ALL_ROLES.length}] roles created`);
        await this.sleep(1000);
      } catch (e: any) {
        failedRoles++;
        logger.error(`  FAIL ${r.name}: ${e.message}`);
        await this.sleep(1500);
      }
    }

    logger.info(`══════════ /all DONE (${done} items, ${((Date.now()-start)/1000).toFixed(0)}s) ══════════`);
  }

  // ═══════════════════════════════════════════
  // /cleanup
  // ═══════════════════════════════════════════

  public async cleanup(): Promise<{ channels: number; roles: number }> {
    let ch = 0, rl = 0;
    // Delete channels
    for (const cat of [...this.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).values()]) {
      for (const child of [...(cat as CategoryChannel).children.cache.values()]) {
        await child.delete().catch(() => {}); ch++;
      }
      await cat.delete().catch(() => {}); ch++;
    }
    for (const c of [...this.guild.channels.cache.values()]) {
      if (c.type === ChannelType.GuildCategory) continue;
      await c.delete().catch(() => {}); ch++;
    }
    // Delete roles (skip @everyone and managed)
    for (const r of [...this.guild.roles.cache.values()]) {
      if (r.name === '@everyone' || r.managed) continue;
      await r.delete().catch(() => {}); rl++;
    }
    return { channels: ch, roles: rl };
  }

  // ═══════════════════════════════════════════
  // /setup
  // ═══════════════════════════════════════════

  public async setupContent(): Promise<void> {
    const welcome = this.tc('welcome');
    const rules = this.tc('rules');
    const faq = this.tc('faq');
    const verify = this.tc('verify');
    const staff = this.tc('staff');
    const roles = this.tc('roles');
    const rtt = this.tc('request-tier-test');
    const queue = this.tc('queue');

    // ── Welcome ──
    if (welcome) {
      const e = new EmbedBuilder()
        .setTitle('╔══════════════════════════════╗')
        .setDescription('## 🏰 ━━ HARVAL MC\n*PvP Tier Testing Network*\n╚══════════════════════════════╝\n\n👋 **Welcome to HARVAL MC!**\n\nThe ultimate Minecraft PvP Tier Testing server.\n\n**Getting Started:**\n• 📜 Read the rules in <#rules>\n• ✅ Verify in <#verify>\n• ⚔️ Request a tier test in <#request-tier-test>\n• 🎫 Open a support ticket in <#create-ticket>\n\n> **Server IP:** `play.harvalmc.fun`')
        .setColor(0xFFD700).setFooter({ text: '╠════ HARVAL MC ════╣' }).setTimestamp();
      await welcome.send({ embeds: [e] as any }).catch(() => {});
    }

    // ── Rules ──
    if (rules) {
      const e = new EmbedBuilder()
        .setTitle('╔══════════════════════════════╗')
        .setDescription('## 📜 ━━ SERVER RULES\n╚══════════════════════════════╝\n\n**1. Be Respectful** — No harassment, toxicity, or discrimination.\n**2. No Cheating** — No hacked clients, macros, or unfair advantages.\n**3. Follow Staff** — Staff decisions are final.\n**4. No Spam** — No excessive messages, pings, or ads.\n**5. English Only** — Keep chat in English in public channels.\n**6. No Bug Abuse** — Report bugs to staff immediately.\n**7. Appropriate** — No NSFW, slurs, or offensive content.\n**8. Have Fun!** — This is a competitive but friendly community.')
        .setColor(0xE74C3C).setFooter({ text: '╠════ RULES ════╣ ┃ Updated regularly' }).setTimestamp();
      await rules.send({ embeds: [e] as any }).catch(() => {});
    }

    // ── FAQ ──
    if (faq) {
      const e = new EmbedBuilder()
        .setTitle('╔══════════════════════════════╗')
        .setDescription('## ❓ ━━ FREQUENTLY ASKED QUESTIONS\n╚══════════════════════════════╝\n\n**Q: How does tier testing work?**\nA: Request a test in <#request-tier-test>. A tester will claim your ticket and test you in your chosen mode.\n\n**Q: What tiers are there?**\nA: LT 1 → HT 1 → LT 2 → HT 2 → LT 3 → HT 3 → LT 4 → HT 4 → LT 5 → HT 5 (10 tiers per mode)\n\n**Q: How do I become a tier tester?**\nA: Apply using the tester application form.\n\n**Q: What if I need help?**\nA: Open a ticket in <#create-ticket>.\n\n**Q: What is the server IP?**\nA: `play.harvalmc.fun`')
        .setColor(0x3498DB).setFooter({ text: '╠════ FAQ ════╣ ┃ Updated regularly' }).setTimestamp();
      await faq.send({ embeds: [e] as any }).catch(() => {});
    }

    // ── Verify ──
    if (verify) {
      const e = new EmbedBuilder()
        .setTitle('╔══════════════════════════════╗')
        .setDescription('## ✅ ━━ VERIFICATION\n╚══════════════════════════════╝\n\nClick the button below to verify your account.\nYou will be asked for your Minecraft IGN (in-game name).')
        .setColor(0x2ECC71).setFooter({ text: '╠════ VERIFY ════╣' }).setTimestamp();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('verify_button').setLabel('✅ Verify').setStyle(ButtonStyle.Success),
      );
      await verify.send({ embeds: [e] as any, components: [row as any] }).catch(() => {});
    }

    // ── Request Tier Test panel ──
    if (rtt) {
      const e = new EmbedBuilder()
        .setTitle('╔══════════════════════════════╗')
        .setDescription('## ⚔️ ━━ REQUEST TIER TEST\n╚══════════════════════════════╝\n\nClick the button below to request a tier test.\nA ticket will be created where a tester will assess your skills.\n\n**Available Modes:** Sword, Crystal, UHC, Boxing, Gapple, NoDebuff, Combo, Axe, Bedwars, Skywars, Bridge, and more.\n\n**Tiers:** LT 1 → HT 1 → LT 2 → HT 2 → LT 3 → HT 3 → LT 4 → HT 4 → LT 5 → HT 5')
        .setColor(0xE67E22).setFooter({ text: '╠════ TIER TEST ════╣' }).setTimestamp();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('request_tier_test').setLabel('⚔️ Request Tier Test').setStyle(ButtonStyle.Primary),
      );
      await rtt.send({ embeds: [e] as any, components: [row as any] }).catch(() => {});
    }

    // ── Queue panel ──
    if (queue) {
      const e = new EmbedBuilder()
        .setTitle('╔══════════════════════════════╗')
        .setDescription('## ⏳ ━━ TIER TEST QUEUE\n╚══════════════════════════════╝\n\nActive tier test tickets will appear here.\n\n⚔️ **Current Queue:**\n> No active tests in queue.\n\nWhen a ticket is claimed, it will be removed from this queue.')
        .setColor(0xF1C40F).setFooter({ text: '╠════ QUEUE ════╣ ┃ Updates automatically' }).setTimestamp();
      await queue.send({ embeds: [e] as any }).catch(() => {});
    }

    // ── Roles & Applications ──
    if (roles) {
      const e = new EmbedBuilder()
        .setTitle('╔══════════════════════════════╗')
        .setDescription('## 🎨 ━━ APPLICATIONS\n╚══════════════════════════════╝\n\n**📝 Staff Application** — Join the staff team.\n**⚔️ Tier Tester Application** — Become a certified tier tester.')
        .setColor(0x9B59B6).setFooter({ text: '╠════ APPLICATIONS ════╣' }).setTimestamp();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('staff_apply').setLabel('📝 Staff Apply').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('tester_apply').setLabel('⚔️ Tester Apply').setStyle(ButtonStyle.Secondary),
      );
      await roles.send({ embeds: [e] as any, components: [row as any] }).catch(() => {});
    }

    // ── Support Ticket ──
    if (staff) {
      const e = new EmbedBuilder()
        .setTitle('╔══════════════════════════════╗')
        .setDescription('## 👥 ━━ STAFF & SUPPORT\n╚══════════════════════════════╝\n\nNeed help? Open a support ticket and a staff member will assist you.\n\n**Available for:**\n• General questions\n• Bug reports\n• Player reports\n• Appeal bans/mutes\n• Technical issues')
        .setColor(0xF1C40F).setFooter({ text: '╠════ SUPPORT ════╣' }).setTimestamp();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('support_ticket').setLabel('🎫 Open Support Ticket').setStyle(ButtonStyle.Danger),
      );
      await staff.send({ embeds: [e] as any, components: [row as any] }).catch(() => {});
    }
  }

  // ═══════════════════════════════════════════
  // createTicket
  // ═══════════════════════════════════════════

  public async createTicket(mode: string, player: { id: string; username: string; displayName: string }): Promise<TextChannel | null> {
    const cat = this.findCat('tickets');
    if (!cat) return null;
    const slug = mode.replace(/\s+/g, '-').toLowerCase();
    const name = `ticket-${slug}-${player.displayName}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 100);
    const everyone = this.guild.roles.everyone;
    const overwrites: any[] = [
      { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel], allow: [] },
      { id: player.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory], deny: [] },
    ];
    try {
      const ch = await this.guild.channels.create({ name, type: ChannelType.GuildText, parent: cat, permissionOverwrites: overwrites });
      const emoji = MODE_EMOJI[mode] || '🎮';
      const embed = new EmbedBuilder().setTitle(`${emoji} ${mode} Ticket`).setDescription(`Waiting for tester...`).setColor(0xF1C40F);
      await ch.send({ embeds: [embed] } as any);
      return ch;
    } catch (e: any) { logger.error(`Ticket fail: ${e.message}`); return null; }
  }
}
