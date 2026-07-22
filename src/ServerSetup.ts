import { Guild, ChannelType, TextChannel, CategoryChannel, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { logger } from './utils/Logger';
import { catName, channelName, panel, SEP } from './utils/textStyles';

export const CATEGORIES: { key: string; name: string }[] = [
  { key: 'information', name: catName('INFORMATION') },
  { key: 'community', name: catName('COMMUNITY') },
  { key: 'support', name: catName('SUPPORT') },
  { key: 'tier-testing', name: catName('TIER TESTING') },
  { key: 'tickets', name: catName('TICKETS') },
  { key: 'leaderboards', name: catName('LEADERBOARDS') },
  { key: 'staff', name: catName('STAFF') },
  { key: 'logs', name: catName('LOGS') },
  { key: 'voice', name: catName('VOICE') },
];

const MODE_EMOJI: Record<string, string> = {
  'Sword': '\u2694\uFE0F', 'Crystal': '\uD83D\uDC8E', 'SMP': '\uD83D\uDEE1\uFE0F',
  'Netherite Pot': '\uD83C\uDF0B', 'Diamond Pot': '\uD83D\uDC80',
  'UHC': '\u2764\uFE0F', 'BuildUHC': '\uD83C\uDFD7\uFE0F', 'NoDebuff': '\uD83D\uDEAB',
  'Combo': '\uD83E\uDD4A', 'Gapple': '\uD83C\uDF4E',
  'OP Duel': '\u26A1', 'Boxing': '\uD83E\uDD4A', 'Axe': '\uD83E\uDE93',
  'Bedwars': '\uD83D\uDECF\uFE0F', 'Skywars': '\u2601\uFE0F',
  'Bridge': '\uD83C\uDF09', 'Nodebuff': '\uD83D\uDD25', 'Vanilla': '\uD83C\uDF3F',
  'Shield': '\uD83D\uDEE1\uFE0F', 'Custom Duel': '\uD83C\uDFAF',
  'Anchor': '\u2693', 'Mace': '\uD83D\uDD28', 'Cart PvP': '\uD83D\uDEF2',
};

export const CHANNEL_KEYS: Record<string, string> = {
  welcome: channelName('welcome'), rules: channelName('rules'),
  faq: channelName('faq'), 'server-ip': channelName('server-ip'),
  announcements: channelName('announcements'), updates: channelName('updates'),
  verify: channelName('verify'), 'tier-guide': channelName('tier-guide'),
  staff: channelName('staff'), roles: channelName('roles'),
  general: channelName('general'), 'minecraft-chat': channelName('minecraft'),
  clips: channelName('clips'), screenshots: channelName('screenshots'),
  media: channelName('media'), polls: channelName('polls'),
  suggestions: channelName('suggestions'), 'off-topic': channelName('off-topic'),
  'create-ticket': channelName('create-ticket'), 'bug-report': channelName('bug-report'),
  'report-player': channelName('report-player'), appeal: channelName('appeal'),
  questions: channelName('questions'), 'request-test': channelName('request-test'),
  queue: channelName('queue'), 'tier-results': channelName('tier-results'),
  leaderboards: channelName('leaderboards'), 'tier-info': channelName('tier-info'),
  retest: channelName('retest'), 'staff-chat': channelName('staff-chat'),
  commands: channelName('commands'), claims: channelName('claims'),
  applications: channelName('applications'), reports: channelName('reports'),
  moderation: channelName('moderation'), 'ticket-logs': channelName('ticket-logs'),
  'tier-logs': channelName('tier-logs'), 'bot-logs': channelName('bot-logs'),
  'error-logs': channelName('error-logs'), 'join-leave': channelName('join-leave'),
  'role-logs': channelName('role-logs'), 'verification-logs': channelName('verification-logs'),
  'command-logs': channelName('command-logs'),
  'general-1': channelName('general-1'), 'general-2': channelName('general-2'),
  afk: channelName('afk'), 'staff-vc': channelName('staff-vc'),
  'meeting-room': channelName('meeting-room'),
};

const CHANNELS: { cat: string; key: string; topic?: string }[] = [
  { cat: 'information', key: 'welcome', topic: 'Welcome to HARVAL MC' },
  { cat: 'information', key: 'rules', topic: 'Server rules' },
  { cat: 'information', key: 'faq', topic: 'Frequently asked questions' },
  { cat: 'information', key: 'server-ip', topic: 'play.harvalmc.fun' },
  { cat: 'information', key: 'announcements', topic: 'Official announcements' },
  { cat: 'information', key: 'updates', topic: 'Patch notes & updates' },
  { cat: 'information', key: 'verify', topic: 'Verify your account' },
  { cat: 'information', key: 'tier-guide', topic: 'How tier testing works' },
  { cat: 'information', key: 'staff', topic: 'Staff team' },
  { cat: 'information', key: 'roles', topic: 'Server roles & applications' },
  { cat: 'community', key: 'general', topic: 'General chat' },
  { cat: 'community', key: 'minecraft-chat', topic: 'Minecraft discussions' },
  { cat: 'community', key: 'clips', topic: 'Share your clips' },
  { cat: 'community', key: 'screenshots', topic: 'Screenshots & media' },
  { cat: 'community', key: 'media', topic: 'Video content' },
  { cat: 'community', key: 'polls', topic: 'Community polls' },
  { cat: 'community', key: 'suggestions', topic: 'Suggestions & feedback' },
  { cat: 'community', key: 'off-topic', topic: 'Off-topic discussion' },
  { cat: 'support', key: 'create-ticket', topic: 'Open a support ticket' },
  { cat: 'support', key: 'bug-report', topic: 'Report a bug' },
  { cat: 'support', key: 'report-player', topic: 'Report a player' },
  { cat: 'support', key: 'appeal', topic: 'Appeal a punishment' },
  { cat: 'support', key: 'questions', topic: 'Ask a question' },
  { cat: 'tier-testing', key: 'request-test', topic: 'Request a tier test' },
  { cat: 'tier-testing', key: 'queue', topic: 'Active test queue' },
  { cat: 'tier-testing', key: 'tier-results', topic: 'Tier test results' },
  { cat: 'tier-testing', key: 'leaderboards', topic: 'Tier leaderboards' },
  { cat: 'tier-testing', key: 'tier-info', topic: 'Tier information' },
  { cat: 'tier-testing', key: 'retest', topic: 'Request a retest' },
  { cat: 'staff', key: 'staff-chat', topic: 'Staff discussions' },
  { cat: 'staff', key: 'commands', topic: 'Bot commands' },
  { cat: 'staff', key: 'claims', topic: 'Ticket claims' },
  { cat: 'staff', key: 'applications', topic: 'Staff applications' },
  { cat: 'staff', key: 'reports', topic: 'Player reports' },
  { cat: 'staff', key: 'moderation', topic: 'Moderation actions' },
  { cat: 'logs', key: 'ticket-logs', topic: 'Ticket logs' },
  { cat: 'logs', key: 'tier-logs', topic: 'Tier test logs' },
  { cat: 'logs', key: 'bot-logs', topic: 'Bot activity logs' },
  { cat: 'logs', key: 'error-logs', topic: 'Error logs' },
  { cat: 'logs', key: 'join-leave', topic: 'Join/leave logs' },
  { cat: 'logs', key: 'role-logs', topic: 'Role change logs' },
  { cat: 'logs', key: 'verification-logs', topic: 'Verification logs' },
  { cat: 'logs', key: 'command-logs', topic: 'Command usage logs' },
  { cat: 'voice', key: 'general-1' }, { cat: 'voice', key: 'general-2' },
  { cat: 'voice', key: 'afk' }, { cat: 'voice', key: 'staff-vc' },
  { cat: 'voice', key: 'meeting-room' },
];

export class ServerSetup {
  private guild: Guild;

  constructor(client: any, guild: Guild) { this.guild = guild; }

  private sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  private tc(key: string) {
    const display = CHANNEL_KEYS[key];
    if (!display) return undefined;
    return this.guild.channels.cache.find(c => c.name === display && c.isTextBased()) as TextChannel | undefined;
  }

  private findCat(key: string) {
    const cat = CATEGORIES.find(c => c.key === key);
    return this.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === cat?.name) as CategoryChannel | undefined;
  }

  static isHarvalObject(name: string): boolean {
    if (name.startsWith('\u25C6\u30FB')) return true;
    if (name.startsWith('\u2501'.repeat(4) + ' \u3014')) return true;
    if (name.startsWith('\u25C6 ')) return true;
    return false;
  }

  async setupCategories(): Promise<number> {
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

  async setupChannels(): Promise<number> {
    let count = 0;
    for (const ch of CHANNELS) {
      try {
        const cat = this.findCat(ch.cat);
        const display = CHANNEL_KEYS[ch.key];
        if (!cat || !display || cat.children.cache.some(c => c.name === display)) continue;
        await cat.children.create({ name: display, type: ChannelType.GuildText, topic: ch.topic || undefined } as any);
        logger.info(`  #${display}`);
        count++;
        await this.sleep(500);
      } catch (e: any) { logger.error(`  #${ch.key} FAIL: ${e.message}`); }
    }
    return count;
  }

  async setupAll(): Promise<void> {
    logger.info(`══════════ /all START ══════════`);
    await this.setupCategories();
    await this.setupChannels();
    logger.info('══════════ /all DONE (roles: run /makeroles separately) ══════════');
  }

  async cleanupChannels(): Promise<number> {
    let del = 0;
    for (const ch of [...this.guild.channels.cache.values()]) {
      const name = ch.name;
      if (ServerSetup.isHarvalObject(name)) {
        await ch.delete().catch(() => {}); del++;
      }
    }
    return del;
  }

  async cleanupRoles(): Promise<number> {
    let del = 0;
    for (const r of [...this.guild.roles.cache.values()]) {
      if (r.name === '@everyone' || r.managed) continue;
      if (ServerSetup.isHarvalObject(r.name)) {
        await r.delete().catch(() => {}); del++;
      }
    }
    return del;
  }

  async cleanupAll(): Promise<{ channels: number; roles: number }> {
    const channels = await this.cleanupChannels();
    const roles = await this.cleanupRoles();
    return { channels, roles };
  }

  async setupContent(): Promise<void> {
    const w = this.tc('welcome');
    const r = this.tc('rules');
    const f = this.tc('faq');
    const v = this.tc('verify');
    const s = this.tc('staff');
    const apps = this.tc('roles');
    const rtt = this.tc('request-test');
    const q = this.tc('queue');

    if (w) {
      await w.send({ embeds: [
        panel('WELCOME',
          `**HARVAL MC**\n` +
          `The Ultimate Minecraft PvP Tier Testing Network\n\n` +
          `${SEP}\n\n` +
          `**Getting Started**\n\n` +
          `\u25C6 Read the rules below\n` +
          `\u25C6 Verify your account\n` +
          `\u25C6 Request a tier test\n` +
          `\u25C6 Open a ticket for help\n\n` +
          `${SEP}\n\n` +
          `**Server IP**\n` +
          `\`play.harvalmc.fun\``,
          0x00E5FF, 'HARVAL MC'),
      ] }).catch(() => {});
    }

    if (r) {
      await r.send({ embeds: [
        panel('RULES',
          `\` 1. \` **Be Respectful** — No harassment, hate speech, or discrimination.\n` +
          `\` 2. \` **No Cheating** — Hacked clients, macros, and unfair advantages are banned.\n` +
          `\` 3. \` **Follow Staff** — Staff decisions are final. Respect all members.\n` +
          `\` 4. \` **No Spam** — No excessive messages, pings, or advertisements.\n` +
          `\` 5. \` **English Only** — Keep public chat in English.\n` +
          `\` 6. \` **No Bug Abuse** — Report bugs. Do not exploit them.\n` +
          `\` 7. \` **Keep It Clean** — No NSFW, slurs, or offensive content.\n` +
          `\` 8. \` **Have Fun!** — Competitive but friendly community.\n\n` +
          `${SEP}\n\n` +
          `**Additional Rules**\n\n` +
          `\` 9. \` **No Doxxing** — Do not share personal information.\n` +
          `\`10. \` **No Ban Evasion** — Evading a punishment = extended ban.\n` +
          `\`11. \` **No False Reports** — Knowingly false reports = punishment.\n` +
          `\`12. \` **No Cross-Teaming** — In PvP events, no alliances.\n` +
          `\`13. \` **No Alt Abuse** — Alts used to bypass limits will be banned.\n` +
          `\`14. \` **No Lag Switching** — Intentional lag manipulation is cheating.\n` +
          `\`15. \` **No DDOS Threats** — Threats of any kind = immediate ban.\n` +
          `\`16. \` **No Impersonation** — Impersonating staff = permanent ban.\n` +
          `\`17. \` **No Proxy / VPN** — Using VPN to evade = mute.\n` +
          `\`18. \` **Keep Channels On-Topic** — Use correct channels.\n` +
          `\`19. \` **No NSFW Profiles** — Avatars, banners, status must be SFW.\n` +
          `\`20. \` **No Advertising** — No DMs advertising servers.\n\n` +
          `${SEP}\n\n` +
          `**Violations may result in warnings, mutes, or bans.**`,
          0xE74C3C, 'HARVAL MC RULES'),
      ] }).catch(() => {});
    }

    if (f) {
      await f.send({ embeds: [
        panel('FAQ',
          `**What is HARVAL MC?**\n` +
          `A Minecraft PvP tier testing network where players prove their skill across 20 competitive modes.\n\n` +
          `${SEP}\n\n` +
          `**How does tier testing work?**\n` +
          `Request a test in <#request-test>. A tester claims your ticket, you duel, and they assign your tier.\n\n` +
          `**What tiers exist?**\n` +
          `LT 1 \u2192 HT 1 \u2192 LT 2 \u2192 HT 2 \u2192 LT 3 \u2192 HT 3 \u2192 LT 4 \u2192 HT 4 \u2192 LT 5 \u2192 HT 5\n` +
          `10 tiers per mode.\n\n` +
          `**How do I get a retest?**\n` +
          `If you improved, request a retest in <#retest>. One retest per 7 days.\n\n` +
          `**How long does a test take?**\n` +
          `Most tests take 5\u201310 minutes. Queue time depends on tester availability.\n\n` +
          `**Can I test for multiple modes?**\n` +
          `Yes. Each mode has its own tier progression.\n\n` +
          `**How do points work?**\n` +
          `Earning a tier awards points: HT 1 = 100, LT 1 = 90 ... LT 5 = 10.\n` +
          `Points accumulate across 7 scoring modes.\n\n` +
          `**How do I become a tester?**\n` +
          `Apply via the Tier Tester application form below.\n\n` +
          `**What is the server IP?**\n` +
          `\`play.harvalmc.fun\`\n\n` +
          `**I got banned. How do I appeal?**\n` +
          `Go to <#appeal> and open a ticket.\n\n` +
          `**Are alts allowed?**\n` +
          `No. Alts will be banned.\n\n` +
          `**How do I report a player?**\n` +
          `Use <#report-player> with evidence.\n\n` +
          `**Where can I suggest features?**\n` +
          `Use <#suggestions>.\n\n` +
          `**Is staff hiring?**\n` +
          `Applications open periodically. Check <#announcements>.\n\n` +
          `**What versions are supported?**\n` +
          `1.20.x \u2013 1.21.x\n\n` +
          `**Can I record my test?**\n` +
          `Yes. Recording is encouraged for dispute resolution.\n\n` +
          `**What if a tester is offline?**\n` +
          `Be patient. Tests are claimed by available testers.\n\n` +
          `${SEP}\n\n` +
          `More questions? Open a ticket in <#create-ticket>.`,
          0x00E5FF, 'HARVAL MC FAQ'),
      ] }).catch(() => {});
    }

    if (v) {
      await v.send({ embeds: [
        panel('VERIFICATION',
          `Verify your account to access the server.\n\n` +
          `${SEP}\n\n` +
          `**Benefits of Verifying**\n\n` +
          `\u25C6 Full server access\n` +
          `\u25C6 Tier testing eligibility\n` +
          `\u25C6 Points & leaderboard tracking\n` +
          `\u25C6 Minecraft profile linking\n\n` +
          `${SEP}\n\n` +
          `Click the button below to verify.\n` +
          `You will be asked for your Minecraft IGN.`,
          0x00E5FF, 'VERIFICATION'),
      ], components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('verify_button').setLabel('VERIFY NOW').setStyle(ButtonStyle.Success).setEmoji('\u2705'),
        ),
      ] }).catch(() => {});
    }

    if (rtt) {
      await rtt.send({ embeds: [
        panel('TIER TEST REQUEST',
          `Request a tier test to prove your skill and earn ranking points.\n\n` +
          `${SEP}\n\n` +
          `**How Testing Works**\n\n` +
          `\u25C6 You request a test for a specific mode\n` +
          `\u25C6 A ticket is created in the tickets category\n` +
          `\u25C6 An available tester claims your ticket\n` +
          `\u25C6 You duel the tester in the selected mode\n` +
          `\u25C6 The tester assigns your tier based on performance\n\n` +
          `**Test Duration**\n` +
          `Typically 5\u201310 minutes.\n\n` +
          `**Retest Policy**\n` +
          `You may request one retest per 7 days per mode.\n\n` +
          `**Requirements**\n` +
          `\u25C6 You must be verified\n` +
          `\u25C6 You must have access to the Minecraft server\n` +
          `\u25C6 Recording is recommended\n\n` +
          `${SEP}\n\n` +
          `**Available Modes**\n` +
          `Sword, Crystal, UHC, Boxing, Gapple, NoDebuff, Combo, Axe,\n` +
          `Bedwars, Skywars, Bridge, SMP, Netherite Pot, Vanilla, and more\n\n` +
          `**Tier Progression**\n` +
          `LT 1 \u2192 HT 1 \u2192 LT 2 \u2192 HT 2 \u2192 LT 3 \u2192 HT 3 \u2192 LT 4 \u2192 HT 4 \u2192 LT 5 \u2192 HT 5`,
          0x00E5FF, 'TIER TESTING'),
      ], components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('request_tier_test').setLabel('\u2694\uFE0F REQUEST TEST').setStyle(ButtonStyle.Primary),
        ),
      ] }).catch(() => {});
    }

    if (q) {
      await q.send({ embeds: [
        panel('QUEUE',
          `**Active Tier Tests**\n\n` +
          `No active tests in queue.\n\n` +
          `${SEP}\n\n` +
          `Request a test using the panel above.`,
          0xF1C40F, 'QUEUE'),
      ] }).catch(() => {});
    }

    if (apps) {
      await apps.send({ embeds: [
        panel('APPLICATIONS',
          `**Staff Application**\n` +
          `Join the staff team and help manage the server.\n\n` +
          `**Tier Tester Application**\n` +
          `Become a certified tier tester and assess players.\n\n` +
          `${SEP}\n\n` +
          `Click a button below to apply.`,
          0x9B59B6, 'APPLICATIONS'),
      ], components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('staff_apply').setLabel('\uD83D\uDCDD STAFF').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('tester_apply').setLabel('\u2694\uFE0F TESTER').setStyle(ButtonStyle.Secondary),
        ),
      ] }).catch(() => {});
    }

    if (s) {
      await s.send({ embeds: [
        panel('SUPPORT',
          `Need help? Open a ticket and a staff member will assist you.\n\n` +
          `${SEP}\n\n` +
          `**Available For**\n\n` +
          `\u25C6 General questions\n` +
          `\u25C6 Bug reports\n` +
          `\u25C6 Player reports\n` +
          `\u25C6 Ban/mute appeals\n` +
          `\u25C6 Suggestions & feedback\n\n` +
          `${SEP}\n\n` +
          `Click the button below to open a ticket.`,
          0xF1C40F, 'SUPPORT'),
      ], components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('support_ticket').setLabel('\uD83C\uDFAB OPEN TICKET').setStyle(ButtonStyle.Danger),
        ),
      ] }).catch(() => {});
    }
  }

  async createTicket(mode: string, player: { id: string; username: string; displayName: string }): Promise<TextChannel | null> {
    const cat = this.findCat('tickets');
    if (!cat) return null;
    const slug = mode.replace(/\s+/g, '-').toLowerCase();
    const name = `ticket-${slug}-${player.displayName}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 100);
    const everyone = this.guild.roles.everyone;
    try {
      const ch = await this.guild.channels.create({
        name, type: ChannelType.GuildText, parent: cat,
        permissionOverwrites: [
          { id: everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: player.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ],
      });
      const emoji = MODE_EMOJI[mode] || '\uD83C\uDFAE';
      await ch.send({ embeds: [
        panel('TICKET',
          `${emoji} **${mode}**\n\n` +
          `**Player:** ${player.displayName}\n` +
          `**Status:** Awaiting claim\n\n` +
          `${SEP}\n\n` +
          `A tester will claim your ticket shortly.`,
          0xF1C40F, 'TICKET'),
      ] });
      return ch;
    } catch (e: any) { logger.error(`Ticket fail: ${e.message}`); return null; }
  }
}
