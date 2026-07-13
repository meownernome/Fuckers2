export interface RoleConfig {
  name: string;
  color: number;
  tier?: string;
  mode?: string;
  isStaff?: boolean;
  isUtility?: boolean;
}

const GAME_MODES: { name: string; tiers: string[]; baseColor: number }[] = [
  { name: 'Sword', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x808080 },
  { name: 'Crystal', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x00FFFF },
  { name: 'SMP', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x8FBC8F },
  { name: 'Netherite Pot', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x4B0082 },
  { name: 'Diamond Pot', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x00FFFF },
  { name: 'UHC', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xFFD700 },
  { name: 'BuildUHC', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xFF8C00 },
  { name: 'NoDebuff', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x00FF00 },
  { name: 'Combo', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xFF69B4 },
  { name: 'Gapple', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xFFD700 },
  { name: 'OP Duel', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x8B0000 },
  { name: 'Boxing', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xCD7F32 },
  { name: 'Axe', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x8B4513 },
  { name: 'Mace', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x8B008B },
  { name: 'Anchor', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x4B0082 },
  { name: 'Cart PvP', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x696969 },
  { name: 'Bedwars', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xFF69B4 },
  { name: 'Skywars', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x87CEEB },
  { name: 'Bridge', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xCD853F },
  { name: 'Nodebuff', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x228B22 },
  { name: 'Vanilla', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xFFFFFF },
  { name: 'Crossbow', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x8B4513 },
  { name: 'Trident', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x00CED1 },
  { name: 'Shield', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xC0C0C0 },
  { name: 'Elytra Combat', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0x00BFFF },
  { name: 'Custom Duel', tiers: ['LT 1', 'HT 1', 'LT 2', 'HT 2', 'LT 3', 'HT 3', 'LT 4', 'HT 4', 'LT 5', 'HT 5'], baseColor: 0xFF1493 },
];

const STAFF_ROLES: RoleConfig[] = [
  { name: '⋆ Founder ⋆', color: 0xFFD700, isStaff: true },
  { name: '⋆ Co-Founder ⋆', color: 0xFFD700, isStaff: true },
  { name: '⚡ Lead Developer', color: 0x00FFFF, isStaff: true },
  { name: '⚡ Developer', color: 0x00FFFF, isStaff: true },
  { name: '◈ Network Manager', color: 0x00FF7F, isStaff: true },
  { name: '◆ Head Administrator', color: 0xFF0000, isStaff: true },
  { name: '◆ Administrator', color: 0xFF0000, isStaff: true },
  { name: '▸ Senior Moderator', color: 0xFFA500, isStaff: true },
  { name: '▸ Moderator', color: 0xFFA500, isStaff: true },
  { name: '▸ Trial Moderator', color: 0xFFA500, isStaff: true },
  { name: '⏣ Head Tier Tester', color: 0xFF4500, isStaff: true },
  { name: '⏣ Senior Tier Tester', color: 0xFF4500, isStaff: true },
  { name: '⏣ Tier Tester', color: 0xFF4500, isStaff: true },
  { name: '⏣ Trial Tier Tester', color: 0xFF4500, isStaff: true },
  { name: '○ Support Team', color: 0x9370DB, isStaff: true },
  { name: '◇ Builder', color: 0xDEB887, isStaff: true },
  { name: '◇ Media Team', color: 0xFF69B4, isStaff: true },
  { name: '[✓] Verified', color: 0x00FF00, isUtility: true },
  { name: '[●] Member', color: 0x808080, isUtility: true },
  { name: '[✕] Muted', color: 0x808080, isUtility: true },
  { name: '[◈] Bot', color: 0x7289DA, isUtility: true },
];

export const ALL_ROLES: RoleConfig[] = [];

for (const mode of GAME_MODES) {
  let color = mode.baseColor;
  for (let i = 0; i < mode.tiers.length; i++) {
    const tier = mode.tiers[i];
    const colorShift = Math.floor(i / 2) * 25;
    color = Math.min(0xFFFFFF, color + colorShift);

    ALL_ROLES.push({
      name: `${mode.name} ${tier}`,
      color,
      tier,
      mode: mode.name,
    });
  }
}

for (const staff of STAFF_ROLES) {
  ALL_ROLES.push(staff);
}

export const ROLE_NAMES = ALL_ROLES.map(r => r.name);
export const STAFF_ROLE_NAMES = STAFF_ROLES.filter(r => r.isStaff).map(r => r.name);
export const UTILITY_ROLE_NAMES = STAFF_ROLES.filter(r => r.isUtility).map(r => r.name);
export const GAME_MODE_ROLE_NAMES = ALL_ROLES.filter(r => r.mode && r.tier).map(r => r.name);