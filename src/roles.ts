import { formatRoleName, formatStaffRoleName } from './utils/textStyles';

const MODES = [
  'Sword', 'Crystal', 'SMP', 'Netherite Pot', 'Diamond Pot',
  'UHC', 'BuildUHC', 'NoDebuff', 'Combo', 'Gapple',
  'OP Duel', 'Boxing', 'Axe', 'Mace', 'Anchor',
  'Cart PvP', 'Bedwars', 'Skywars', 'Bridge', 'Nodebuff',
  'Vanilla', 'Crossbow', 'Trident', 'Shield', 'Elytra Combat',
  'Custom Duel',
];

const TIERS: { name: string; color: number }[] = [
  { name: 'LT 1', color: 0x7F8C8D },
  { name: 'HT 1', color: 0x95A5A6 },
  { name: 'LT 2', color: 0x27AE60 },
  { name: 'HT 2', color: 0x2ECC71 },
  { name: 'LT 3', color: 0x2980B9 },
  { name: 'HT 3', color: 0x3498DB },
  { name: 'LT 4', color: 0x8E44AD },
  { name: 'HT 4', color: 0x9B59B6 },
];

interface StaffRoleDef { emoji: string; name: string }

const STAFF_DEFS: StaffRoleDef[] = [
  { emoji: '👑', name: 'Founder' },
  { emoji: '👑', name: 'Co-Founder' },
  { emoji: '⚡', name: 'Lead Developer' },
  { emoji: '⚡', name: 'Developer' },
  { emoji: '🌐', name: 'Network Manager' },
  { emoji: '🛡️', name: 'Head Administrator' },
  { emoji: '🛡️', name: 'Administrator' },
  { emoji: '🔰', name: 'Senior Moderator' },
  { emoji: '🔰', name: 'Moderator' },
  { emoji: '🔰', name: 'Trial Moderator' },
  { emoji: '⚔️', name: 'Head Tier Tester' },
  { emoji: '⚔️', name: 'Senior Tier Tester' },
  { emoji: '⚔️', name: 'Tier Tester' },
  { emoji: '⚔️', name: 'Trial Tier Tester' },
  { emoji: '💎', name: 'Support Team' },
  { emoji: '🔨', name: 'Builder' },
  { emoji: '🎬', name: 'Media Team' },
  { emoji: '✅', name: 'Verified' },
  { emoji: '👤', name: 'Member' },
  { emoji: '🔇', name: 'Muted' },
  { emoji: '🤖', name: 'Bot' },
];

export const ALL_ROLES: { name: string; color: number }[] = [
  ...MODES.flatMap(mode =>
    TIERS.map(tier => ({
      name: formatRoleName(`${mode} ${tier.name}`),
      color: tier.color,
    }))
  ),
  ...STAFF_DEFS.map(sd => ({
    name: formatStaffRoleName(sd.emoji, sd.name),
    color: 0 as number,
  })),
];

export const STAFF_EMOJI_PREFIX = /^(👑|⚡|🌐|🛡️|🔰|⚔️|💎|🔨|🎬)/;

export function getTierRoleName(mode: string, tier: string): string {
  return formatRoleName(`${mode} ${tier}`);
}
