import * as fs from 'fs';
import * as path from 'path';

const POINTS_FILE = path.join(process.cwd(), 'data', 'playerPoints.json');

export const POINT_MODES = ['Sword', 'Crystal', 'Axe', 'Netherite Pot', 'Mace', 'SMP Pot', 'UHC'];

export const TIER_POINTS: Record<string, number> = {
  'LT5': 10, 'HT5': 20,
  'LT4': 30, 'HT4': 40,
  'LT3': 50, 'HT3': 60,
  'LT2': 70, 'HT2': 80,
  'LT1': 90, 'HT1': 100,
};

interface PlayerData { points: number; modes: Record<string, string>; ign?: string }

function loadData(): Record<string, PlayerData> {
  try {
    if (fs.existsSync(POINTS_FILE)) {
      return JSON.parse(fs.readFileSync(POINTS_FILE, 'utf8'));
    }
  } catch { }
  return {};
}

function saveData(data: Record<string, PlayerData>) {
  const dir = path.dirname(POINTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(POINTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function setPlayerIGN(userId: string, ign: string) {
  const data = loadData();
  if (!data[userId]) data[userId] = { points: 0, modes: {} };
  data[userId].ign = ign;
  saveData(data);
}

export function getPlayerPoints(userId: string): number {
  const data = loadData();
  return data[userId]?.points || 0;
}

export function addTierPoints(userId: string, mode: string, tier: string, ign?: string) {
  const data = loadData();
  if (!data[userId]) data[userId] = { points: 0, modes: {} };
  const pts = TIER_POINTS[tier] || 0;
  data[userId].points = (data[userId].points || 0) + pts;
  data[userId].modes[mode] = tier;
  if (ign) data[userId].ign = ign;
  saveData(data);
}

export function getLeaderboard(): { userId: string; ign: string; points: number }[] {
  const data = loadData();
  return Object.entries(data)
    .map(([userId, d]) => ({ userId, ign: d.ign || userId, points: d.points || 0 }))
    .sort((a, b) => b.points - a.points);
}

export function getAllPlayerData(): Record<string, any> {
  return loadData();
}
