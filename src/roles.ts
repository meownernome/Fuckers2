import { roleName, staffRoleName } from './utils/textStyles';

export const MODES = [
  'Sword', 'Crystal', 'SMP', 'Netherite Pot', 'Diamond Pot',
  'BuildUHC', 'UHC', 'NoDebuff', 'Gapple', 'Combo',
  'Boxing', 'Bridge', 'Anchor', 'Mace', 'Axe',
  'Cart PvP', 'Vanilla', 'Bedwars', 'Skywars', 'Custom',
];

export const TIERS: { name: string; color: number }[] = [
  { name: 'LT 1', color: 0x7F8C8D },
  { name: 'HT 1', color: 0x95A5A6 },
  { name: 'LT 2', color: 0x27AE60 },
  { name: 'HT 2', color: 0x2ECC71 },
  { name: 'LT 3', color: 0x2980B9 },
  { name: 'HT 3', color: 0x3498DB },
  { name: 'LT 4', color: 0x8E44AD },
  { name: 'HT 4', color: 0x9B59B6 },
  { name: 'LT 5', color: 0xE74C3C },
  { name: 'HT 5', color: 0xC0392B },
];

const STAFF_DEFS = [
  { emoji: '\uD83D\uDC51', name: 'Founder' },
  { emoji: '\uD83D\uDC51', name: 'Co-Founder' },
  { emoji: '\u26A1', name: 'Lead Developer' },
  { emoji: '\u26A1', name: 'Developer' },
  { emoji: '\uD83C\uDF10', name: 'Network Manager' },
  { emoji: '\uD83D\uDEE1\uFE0F', name: 'Head Administrator' },
  { emoji: '\uD83D\uDEE1\uFE0F', name: 'Administrator' },
  { emoji: '\uD83D\uDD30', name: 'Senior Moderator' },
  { emoji: '\uD83D\uDD30', name: 'Moderator' },
  { emoji: '\uD83D\uDD30', name: 'Trial Moderator' },
  { emoji: '\u2694\uFE0F', name: 'Head Tier Tester' },
  { emoji: '\u2694\uFE0F', name: 'Senior Tier Tester' },
  { emoji: '\u2694\uFE0F', name: 'Tier Tester' },
  { emoji: '\u2694\uFE0F', name: 'Trial Tier Tester' },
  { emoji: '\uD83D\uDC8E', name: 'Support Team' },
  { emoji: '\uD83D\uDD28', name: 'Builder' },
  { emoji: '\uD83C\uDFAC', name: 'Media Team' },
  { emoji: '\u2705', name: 'Verified' },
  { emoji: '\uD83D\uDC64', name: 'Member' },
  { emoji: '\uD83D\uDD07', name: 'Muted' },
  { emoji: '\uD83E\uDD16', name: 'Bot' },
];

export const ALL_ROLES: { name: string; color: number }[] = [
  ...MODES.flatMap(mode =>
    TIERS.map(tier => ({
      name: roleName(mode, tier.name),
      color: tier.color,
    }))
  ),
  ...STAFF_DEFS.map(sd => ({
    name: staffRoleName(sd.emoji, sd.name),
    color: 0,
  })),
];

export const STAFF_PREFIX = /\u25C6/;

export function getTierRoleName(mode: string, tier: string): string {
  return roleName(mode, tier);
}
