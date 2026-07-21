"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_POINTS = exports.POINT_MODES = void 0;
exports.setPlayerIGN = setPlayerIGN;
exports.getPlayerPoints = getPlayerPoints;
exports.addTierPoints = addTierPoints;
exports.getLeaderboard = getLeaderboard;
exports.getAllPlayerData = getAllPlayerData;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const POINTS_FILE = path.join(process.cwd(), 'data', 'playerPoints.json');
exports.POINT_MODES = ['Sword', 'Crystal', 'Axe', 'Netherite Pot', 'Mace', 'SMP Pot', 'UHC'];
exports.TIER_POINTS = {
    'LT 5': 10, 'HT 5': 20,
    'LT 4': 30, 'HT 4': 40,
    'LT 3': 50, 'HT 3': 60,
    'LT 2': 70, 'HT 2': 80,
    'LT 1': 90, 'HT 1': 100,
};
function loadData() {
    try {
        if (fs.existsSync(POINTS_FILE)) {
            return JSON.parse(fs.readFileSync(POINTS_FILE, 'utf8'));
        }
    }
    catch { }
    return {};
}
function saveData(data) {
    const dir = path.dirname(POINTS_FILE);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(POINTS_FILE, JSON.stringify(data, null, 2), 'utf8');
}
function setPlayerIGN(userId, ign) {
    const data = loadData();
    if (!data[userId])
        data[userId] = { points: 0, modes: {} };
    data[userId].ign = ign;
    saveData(data);
}
function getPlayerPoints(userId) {
    const data = loadData();
    return data[userId]?.points || 0;
}
function addTierPoints(userId, mode, tier, ign) {
    const data = loadData();
    if (!data[userId])
        data[userId] = { points: 0, modes: {} };
    const pts = exports.TIER_POINTS[tier] || 0;
    data[userId].points = (data[userId].points || 0) + pts;
    data[userId].modes[mode] = tier;
    if (ign)
        data[userId].ign = ign;
    saveData(data);
}
function getLeaderboard() {
    const data = loadData();
    return Object.entries(data)
        .map(([userId, d]) => ({ userId, ign: d.ign || userId, points: d.points || 0 }))
        .sort((a, b) => b.points - a.points);
}
function getAllPlayerData() {
    return loadData();
}
