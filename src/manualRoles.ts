import fs from 'fs';
import path from 'path';

export interface ManualRole {
  name: string;
  color: number;
}

const DEFAULT_COLOR = 0x2ECC71;
const ROLE_COLORS: Record<string, number> = {
  Sword: 0x7F8C8D,
  Crystal: 0x95A5A6,
  SMP: 0x27AE60,
  'Netherite Pot': 0x2ECC71,
  'Diamond Pot': 0x2980B9,
  UHC: 0x8E44AD,
  BuildUHC: 0x9B59B6,
  NoDebuff: 0xD4AC0D,
  Combo: 0xF1C40F,
  Gapple: 0xE67E22,
  'OP Duel': 0x34495E,
  Boxing: 0x1ABC9C,
  Axe: 0x16A085,
  Mace: 0x27AE60,
  Anchor: 0x8E44AD,
  'Cart PvP': 0x3498DB,
  Bedwars: 0xE74C3C,
  Skywars: 0x9B59B6,
  Bridge: 0xF39C12,
  Nodebuff: 0xC0392B,
  Vanilla: 0x2ECC71,
  Crossbow: 0x7D6608,
  Trident: 0x2874A6,
  Shield: 0x1F618D,
  'Elytra Combat': 0x7DCEA0,
  'Custom Duel': 0xAF7AC5,
};

const MODES = [
  'Sword', 'Crystal', 'SMP', 'Netherite Pot', 'Diamond Pot', 'UHC', 'BuildUHC', 'NoDebuff', 'Combo', 'Gapple',
  'OP Duel', 'Boxing', 'Axe', 'Mace', 'Anchor', 'Cart PvP', 'Bedwars', 'Skywars', 'Bridge', 'Nodebuff',
  'Vanilla', 'Crossbow', 'Trident', 'Shield', 'Elytra Combat', 'Custom Duel'
];

const TIERS = ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'];

const STAFF_ROLES = [
  '👑 ━━ Founder',
  '👑 ━━ Co-Founder',
  '⚡ ━━ Lead Developer',
  '⚡ ━━ Developer',
  '🌐 ━━ Network Manager',
  '🛡️ ━━ Head Administrator',
  '🛡️ ━━ Administrator',
  '🔰 ━━ Senior Moderator',
  '🔰 ━━ Moderator',
  '🔰 ━━ Trial Moderator',
  '⚔️ ━━ Head Tier Tester',
  '⚔️ ━━ Senior Tier Tester',
  '⚔️ ━━ Tier Tester',
  '⚔️ ━━ Trial Tier Tester',
  '💎 ━━ Support Team',
  '🔨 ━━ Builder',
  '🎬 ━━ Media Team',
  '✅ ━━ Verified',
  '👤 ━━ Member',
  '🔇 ━━ Muted',
  '🤖 ━━ Bot',
];

function normalizeRoleName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parseRolesFromFile(): ManualRole[] {
  const filePath = path.join(__dirname, 'allRoles.txt');
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const roles: ManualRole[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const colorToken = parts[parts.length - 1];
    const nameParts = parts.slice(0, -1);
    const name = nameParts.join(' ');

    const color = parseInt(colorToken.replace(/^0x/i, ''), 16);
    roles.push({ name, color: Number.isNaN(color) ? DEFAULT_COLOR : color });
  }

  return roles;
}

const parsedRoles = parseRolesFromFile();

export const MANUAL_ROLES: ManualRole[] = parsedRoles.length > 0
  ? parsedRoles
  : [
      ...MODES.flatMap(mode => TIERS.map(tier => ({
        name: `${mode} ${tier}`,
        color: ROLE_COLORS[mode] ?? DEFAULT_COLOR,
      }))),
      ...STAFF_ROLES.map(name => ({ name, color: 0x000000 })),
    ];

export function getManualRoleByName(name: string): ManualRole | undefined {
  const normalized = normalizeRoleName(name);
  return MANUAL_ROLES.find(role => normalizeRoleName(role.name) === normalized);
}

export function getManualRoleNames(): string[] {
  return MANUAL_ROLES.map(role => role.name);
}
