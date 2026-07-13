import { Guild, ChannelType, TextChannel, CategoryChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { logger } from './utils/Logger';
import { ALL_ROLES } from './roles';
import { createRole } from './utils/roleCreator';

export const CATEGORIES: { key: string; name: string }[] = [
  { key: 'information', name: '「 ✦ ＩＮＦＯＲＭＡＴＩＯＮ ✦ 」' },
  { key: 'community', name: '「 ✦ ＣＯＭＭＵＮＩＴＹ ✦ 」' },
  { key: 'support', name: '「 ✦ ＳＵＰＰＯＲＴ ✦ 」' },
  { key: 'tier-testing', name: '「 ✦ ＴＩＥＲ ＴＥＳＴＩＮＧ ✦ 」' },
  { key: 'tickets', name: '「 ✦ ＴＩＣＫＥＴＳ ✦ 」' },
  { key: 'leaderboards', name: '「 ✦ ＬＥＡＤＥＲＢＯＡＲＤＳ ✦ 」' },
  { key: 'staff', name: '「 ✦ ＳＴＡＦＦ ✦ 」' },
  { key: 'logs', name: '「 ✦ ＬＯＧＳ ✦ 」' },
  { key: 'voice', name: '「 ✦ ＶＯＩＣＥ ✦ 」' },
];

const MODE_EMOJI: Record<string, string> = {
  'Sword': '⚔️', 'Crystal': '💎', 'SMP': '🛡️', 'Netherite Pot': '🌋', 'Diamond Pot': '💠',
  'UHC': '❤️', 'BuildUHC': '🏗️', 'NoDebuff': '🚫', 'Combo': '🥊', 'Gapple': '🍎',
  'OP Duel': '⚡', 'Boxing': '🥊', 'Axe': '🪓', 'Mace': '🔨', 'Anchor': '⚓',
  'Cart PvP': '🛒', 'Bedwars': '🛏️', 'Skywars': '☁️', 'Bridge': '🌉', 'Nodebuff': '🔥',
  'Vanilla': '🌿', 'Crossbow': '🏹', 'Trident': '🔱', 'Shield': '🛡️', 'Elytra Combat': '🦅',
  'Custom Duel': '🎯',
};

export const CHANNEL_KEYS: Record<string, string> = {
  welcome: 'welcome', rules: 'rules', faq: 'faq',
  'server-ip': 'server-ip', announcements: 'announcements', updates: 'updates',
  verify: 'verify', 'how-tier-testing-works': 'tier-guide', staff: 'staff', roles: 'roles',
  general: 'general', 'minecraft-chat': 'minecraft-chat', clips: 'clips',
  screenshots: 'screenshots', media: 'media', polls: 'polls',
  suggestions: 'suggestions', 'off-topic': 'off-topic',
  'create-ticket': 'create-ticket', 'bug-report': 'bug-report',
  'report-player': 'report-player', appeal: 'appeal', questions: 'questions',
  'request-tier-test': 'request-test', queue: 'queue',
  'tier-results': 'tier-results', leaderboards: 'leaderboards',
  'tier-information': 'tier-info', 'retest-request': 'retest',
  'staff-chat': 'staff-chat', commands: 'commands', claims: 'claims',
  applications: 'applications', reports: 'reports', moderation: 'moderation',
  'ticket-logs': 'ticket-logs', 'tier-logs': 'tier-logs', 'bot-logs': 'bot-logs',
  'error-logs': 'error-logs', 'join-leave': 'join-leave', 'role-logs': 'role-logs',
  'verification-logs': 'verification-logs', 'command-logs': 'command-logs',
  'general-1': 'general-1', 'general-2': 'general-2',
  afk: 'afk', 'staff-vc': 'staff-vc', 'meeting-room': 'meeting-room',
};

const CHANNELS: { cat: string; key: string; topic?: string }[] = [
  { cat: 'information', key: 'welcome', topic: '🏰 Welcome to HARVAL MC' },
  { cat: 'information', key: 'rules', topic: '📜 Server rules' },
  { cat: 'information', key: 'faq', topic: '❓ FAQ' },
  { cat: 'information', key: 'server-ip', topic: '🖥️ play.harvalmc.fun' },
  { cat: 'information', key: 'announcements', topic: '📢 Announcements' },
  { cat: 'information', key: 'updates', topic: '🔔 Updates' },
  { cat: 'information', key: 'verify', topic: '✅ Verify' },
  { cat: 'information', key: 'how-tier-testing-works', topic: '📖 Tier guide' },
  { cat: 'information', key: 'staff', topic: '👥 Staff' },
  { cat: 'information', key: 'roles', topic: '🎨 Roles' },
  { cat: 'community', key: 'general', topic: '💬 Chat' },
  { cat: 'community', key: 'minecraft-chat', topic: '⛏️ Minecraft' },
  { cat: 'community', key: 'clips', topic: '🎬 Clips' },
  { cat: 'community', key: 'screenshots', topic: '📸 Screenshots' },
  { cat: 'community', key: 'media', topic: '🎥 Media' },
  { cat: 'community', key: 'polls', topic: '📊 Polls' },
  { cat: 'community', key: 'suggestions', topic: '💡 Suggestions' },
  { cat: 'community', key: 'off-topic', topic: '🎲 Off-topic' },
  { cat: 'support', key: 'create-ticket', topic: '🎫 Open ticket' },
  { cat: 'support', key: 'bug-report', topic: '🐛 Bugs' },
  { cat: 'support', key: 'report-player', topic: '🚨 Reports' },
  { cat: 'support', key: 'appeal', topic: '📩 Appeal' },
  { cat: 'support', key: 'questions', topic: '❓ Questions' },
  { cat: 'tier-testing', key: 'request-tier-test', topic: '⚔️ Request test' },
  { cat: 'tier-testing', key: 'queue', topic: '⏳ Queue' },
  { cat: 'tier-testing', key: 'tier-results', topic: '🏆 Results' },
  { cat: 'tier-testing', key: 'leaderboards', topic: '📊 Leaderboards' },
  { cat: 'tier-testing', key: 'tier-information', topic: '📖 Tier info' },
  { cat: 'tier-testing', key: 'retest-request', topic: '🔄 Retest' },
  { cat: 'staff', key: 'staff-chat', topic: '🔒 Staff' },
  { cat: 'staff', key: 'commands', topic: '⌨️ Commands' },
  { cat: 'staff', key: 'claims', topic: '📌 Claims' },
  { cat: 'staff', key: 'applications', topic: '📝 Applications' },
  { cat: 'staff', key: 'reports', topic: '📋 Reports' },
  { cat: 'staff', key: 'moderation', topic: '🔨 Moderation' },
  { cat: 'logs', key: 'ticket-logs', topic: '🎫 Tickets' },
  { cat: 'logs', key: 'tier-logs', topic: '⚔️ Tier logs' },
  { cat: 'logs', key: 'bot-logs', topic: '🤖 Bot logs' },
  { cat: 'logs', key: 'error-logs', topic: '❌ Errors' },
  { cat: 'logs', key: 'join-leave', topic: '👋 Join/Leave' },
  { cat: 'logs', key: 'role-logs', topic: '🎨 Roles' },
  { cat: 'logs', key: 'verification-logs', topic: '✅ Verification' },
  { cat: 'logs', key: 'command-logs', topic: '⌨️ Commands' },
  { cat: 'voice', key: 'general-1' }, { cat: 'voice', key: 'general-2' },
  { cat: 'voice', key: 'afk' }, { cat: 'voice', key: 'staff-vc' }, { cat: 'voice', key: 'meeting-room' },
];

export class ServerSetup {
  private guild: Guild;

  constructor(client: any, guild: Guild) { this.guild = guild; }

  private sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
  private tc(key: string) {
    const displayName = CHANNEL_KEYS[key];
    if (!displayName) return undefined;
    return this.guild.channels.cache.find(c => c.name === displayName && c.type === ChannelType.GuildText) as TextChannel | undefined;
  }
  private findCat(key: string) {
    const cat = CATEGORIES.find(c => c.key === key);
    return this.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === cat?.name) as CategoryChannel | undefined;
  }

  // ═══════════════════════════════════════════
  // /all (categories + channels + roles)
  // ═══════════════════════════════════════════

  public async setupCategories(): Promise<number> {
    let count = 0;
    for (const c of CATEGORIES) {
      try {
        if (!this.guild.channels.cache.some(ch => ch.type === ChannelType.GuildCategory && ch.name === c.name)) {
          await this.guild.channels.create({ name: c.name, type: ChannelType.GuildCategory });
          logger.info(`  📁 ${c.name}`);
          count++;
        }
      } catch (e: any) { logger.error(`  📁 FAIL ${c.key}: ${e.message}`); }
    }
    return count;
  }

  public async setupChannels(): Promise<number> {
    let count = 0;
    for (const ch of CHANNELS) {
      try {
        const cat = this.findCat(ch.cat);
        const displayName = CHANNEL_KEYS[ch.key];
        if (!cat || !displayName || cat.children.cache.some(c => c.name === displayName)) continue;
        await cat.children.create({ name: displayName, type: ChannelType.GuildText, topic: ch.topic || undefined } as any);
        logger.info(`  #${displayName}`);
        count++;
        await this.sleep(500);
      } catch (e: any) { logger.error(`  #${ch.key} FAIL: ${e.message}`); }
    }
    return count;
  }

  public async setupAll(): Promise<void> {
    logger.info(`══════════ /all START ══════════`);

    await this.setupCategories();
    await this.setupChannels();

    // Roles — create from explicit flat list
    const start = Date.now();
    let done = 0;
    let failedRoles = 0;
    try { await this.guild.roles.fetch(); } catch {}
    const existingNames = new Set(this.guild.roles.cache.map(r => r.name));
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || '';

    for (let i = 0; i < ALL_ROLES.length; i++) {
      if (Date.now() - start > 600000) { logger.warn('⏰ Timeout'); break; }
      const r = ALL_ROLES[i];
      if (existingNames.has(r.name)) { done++; continue; }
      try {
        await createRole(this.guild, r.name, r.color);
        done++;
        if (done % 50 === 0 || done === ALL_ROLES.length) logger.info(`  [${done}/${ALL_ROLES.length}] roles created`);
        await this.sleep(2000);
      } catch (e: any) {
        failedRoles++;
        logger.error(`  FAIL ${r.name}: ${e?.message || e?.status || '?'}`);
        await this.sleep(3000);
      }
    }

    logger.info(`══════════ /all DONE (${done} roles, ${((Date.now()-start)/1000).toFixed(0)}s) ══════════`);
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
        .setTitle('「 ✦ ＨＡＲＶＡＬ ＭＣ ✦ 」')
        .setDescription('### 🏰 PvP Tier Testing Network\n\n👋 **Welcome to HARVAL MC!**\n\nThe ultimate Minecraft PvP Tier Testing server.\n\n**Getting Started:**\n• 📜 Read the rules in <#rules>\n• ✅ Verify in <#verify>\n• ⚔️ Request a tier test in <#request-tier-test>\n• 🎫 Open a support ticket in <#create-ticket>\n\n> **Server IP:** `play.harvalmc.fun`')
        .setColor(0xFFD700).setFooter({ text: '✦ HARVAL MC ✦' }).setTimestamp();
      await welcome.send({ embeds: [e] as any }).catch(() => {});
    }

    // ── Rules ──
    if (rules) {
      const e = new EmbedBuilder()
        .setTitle('「 ✦ ＲＵＬＥＳ ✦ 」')
        .setDescription('### 📜 Server Rules\n\n**1. Be Respectful** — No harassment, toxicity, or discrimination.\n**2. No Cheating** — No hacked clients, macros, or unfair advantages.\n**3. Follow Staff** — Staff decisions are final.\n**4. No Spam** — No excessive messages, pings, or ads.\n**5. English Only** — Keep chat in English in public channels.\n**6. No Bug Abuse** — Report bugs to staff immediately.\n**7. Appropriate** — No NSFW, slurs, or offensive content.\n**8. Have Fun!** — This is a competitive but friendly community.')
        .setColor(0xE74C3C).setFooter({ text: '✦ RULES ✦ ┃ Updated regularly' }).setTimestamp();
      await rules.send({ embeds: [e] as any }).catch(() => {});
    }

    // ── FAQ ──
    if (faq) {
      const e = new EmbedBuilder()
        .setTitle('「 ✦ ＦＡＱ ✦ 」')
        .setDescription('### ❓ Frequently Asked Questions\n\n**Q: How does tier testing work?**\nA: Request a test in <#request-tier-test>. A tester will claim your ticket and test you in your chosen mode.\n\n**Q: What tiers are there?**\nA: LT 1 → HT 1 → LT 2 → HT 2 → LT 3 → HT 3 → LT 4 → HT 4 → LT 5 → HT 5 (10 tiers per mode)\n\n**Q: How do I become a tier tester?**\nA: Apply using the tester application form.\n\n**Q: What if I need help?**\nA: Open a ticket in <#create-ticket>.\n\n**Q: What is the server IP?**\nA: `play.harvalmc.fun`')
        .setColor(0x3498DB).setFooter({ text: '✦ FAQ ✦ ┃ Updated regularly' }).setTimestamp();
      await faq.send({ embeds: [e] as any }).catch(() => {});
    }

    // ── Verify ──
    if (verify) {
      const e = new EmbedBuilder()
        .setTitle('「 ✦ ＶＥＲＩＦＹ ✦ 」')
        .setDescription('### ✅ Verification\n\nClick the button below to verify your account.\nYou will be asked for your Minecraft IGN (in-game name).')
        .setColor(0x2ECC71).setFooter({ text: '✦ VERIFY ✦' }).setTimestamp();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('verify_button').setLabel('✅ Verify').setStyle(ButtonStyle.Success),
      );
      await verify.send({ embeds: [e] as any, components: [row as any] }).catch(() => {});
    }

    // ── Request Tier Test panel ──
    if (rtt) {
      const e = new EmbedBuilder()
        .setTitle('「 ✦ ＴＩＥＲ ＴＥＳＴ ✦ 」')
        .setDescription('### ⚔️ Request Tier Test\n\nClick the button below to request a tier test.\nA ticket will be created where a tester will assess your skills.\n\n**Available Modes:** Sword, Crystal, UHC, Boxing, Gapple, NoDebuff, Combo, Axe, Bedwars, Skywars, Bridge, and more.\n\n**Tiers:** LT 1 → HT 1 → LT 2 → HT 2 → LT 3 → HT 3 → LT 4 → HT 4 → LT 5 → HT 5')
        .setColor(0xE67E22).setFooter({ text: '✦ TIER TEST ✦' }).setTimestamp();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('request_tier_test').setLabel('⚔️ Request Tier Test').setStyle(ButtonStyle.Primary),
      );
      await rtt.send({ embeds: [e] as any, components: [row as any] }).catch(() => {});
    }

    // ── Queue panel ──
    if (queue) {
      const e = new EmbedBuilder()
        .setTitle('「 ✦ ＱＵＥＵＥ ✦ 」')
        .setDescription('### ⏳ Tier Test Queue\n\nActive tier test tickets will appear here.\n\n⚔️ **Current Queue:**\n> No active tests in queue.\n\nWhen a ticket is claimed, it will be removed from this queue.')
        .setColor(0xF1C40F).setFooter({ text: '✦ QUEUE ✦ ┃ Updates automatically' }).setTimestamp();
      await queue.send({ embeds: [e] as any }).catch(() => {});
    }

    // ── Roles & Applications ──
    if (roles) {
      const e = new EmbedBuilder()
        .setTitle('「 ✦ ＡＰＰＬＩＣＡＴＩＯＮＳ ✦ 」')
        .setDescription('### 🎨 Applications\n\n**📝 Staff Application** — Join the staff team.\n**⚔️ Tier Tester Application** — Become a certified tier tester.')
        .setColor(0x9B59B6).setFooter({ text: '✦ APPLICATIONS ✦' }).setTimestamp();
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('staff_apply').setLabel('📝 Staff Apply').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('tester_apply').setLabel('⚔️ Tester Apply').setStyle(ButtonStyle.Secondary),
      );
      await roles.send({ embeds: [e] as any, components: [row as any] }).catch(() => {});
    }

    // ── Support Ticket ──
    if (staff) {
      const e = new EmbedBuilder()
        .setTitle('「 ✦ ＳＵＰＰＯＲＴ ✦ 」')
        .setDescription('### 👥 Staff & Support\n\nNeed help? Open a support ticket and a staff member will assist you.\n\n**Available for:**\n• General questions\n• Bug reports\n• Player reports\n• Appeal bans/mutes\n• Technical issues')
        .setColor(0xF1C40F).setFooter({ text: '✦ SUPPORT ✦' }).setTimestamp();
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
      const embed = new EmbedBuilder().setTitle(`「 ✦ ＴＩＣＫＥＴ ✦ 」`).setDescription(`### ${emoji} ${mode}\n\nWaiting for tester...`).setColor(0xF1C40F);
      await ch.send({ embeds: [embed] } as any);
      return ch;
    } catch (e: any) { logger.error(`Ticket fail: ${e.message}`); return null; }
  }
}
