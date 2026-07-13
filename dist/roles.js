"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAFF_EMOJI_PREFIX = exports.ALL_ROLES = void 0;
exports.getTierRoleName = getTierRoleName;
const textStyles_1 = require("./utils/textStyles");
const MODES = [
    'Sword', 'Crystal', 'SMP', 'Netherite Pot', 'Diamond Pot',
    'UHC', 'BuildUHC', 'NoDebuff', 'Combo', 'Gapple',
    'OP Duel', 'Boxing', 'Axe', 'Mace', 'Anchor',
    'Cart PvP', 'Bedwars', 'Skywars', 'Bridge', 'Nodebuff',
    'Vanilla', 'Crossbow', 'Trident', 'Shield', 'Elytra Combat',
    'Custom Duel',
];
const TIERS = [
    { name: 'LT 1', color: 0x7F8C8D },
    { name: 'HT 1', color: 0x95A5A6 },
    { name: 'LT 2', color: 0x27AE60 },
    { name: 'HT 2', color: 0x2ECC71 },
    { name: 'LT 3', color: 0x2980B9 },
    { name: 'HT 3', color: 0x3498DB },
    { name: 'LT 4', color: 0x8E44AD },
    { name: 'HT 4', color: 0x9B59B6 },
];
const STAFF_DEFS = [
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
exports.ALL_ROLES = [
    ...MODES.flatMap(mode => TIERS.map(tier => ({
        name: (0, textStyles_1.formatRoleName)(`${mode} ${tier.name}`),
        color: tier.color,
    }))),
    ...STAFF_DEFS.map(sd => ({
        name: (0, textStyles_1.formatStaffRoleName)(sd.emoji, sd.name),
        color: 0,
    })),
];
exports.STAFF_EMOJI_PREFIX = /^(👑|⚡|🌐|🛡️|🔰|⚔️|💎|🔨|🎬)/;
function getTierRoleName(mode, tier) {
    return (0, textStyles_1.formatRoleName)(`${mode} ${tier}`);
}
