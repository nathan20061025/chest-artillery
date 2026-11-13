export interface LevelDef {
  name: string;
  wind: number;
  chests: number;
  rivalHp: number;
  /** rival aim error factor (lower = more accurate) */
  aimError: number;
  moving: boolean;
  storm: boolean;
}

export const LEVELS: LevelDef[] = [
  { name: "Calm Bay", wind: 1, chests: 2, rivalHp: 2, aimError: 0.08, moving: false, storm: false },
  { name: "Breezy Cove", wind: 3, chests: 3, rivalHp: 3, aimError: 0.065, moving: false, storm: false },
  { name: "Windward Reef", wind: 5, chests: 3, rivalHp: 3, aimError: 0.05, moving: false, storm: false },
  { name: "Pirate Strait", wind: 6, chests: 4, rivalHp: 4, aimError: 0.04, moving: true, storm: false },
  { name: "Leviathan's Gate", wind: 8, chests: 4, rivalHp: 5, aimError: 0.03, moving: true, storm: true },
];

export const MAX_LEVEL = LEVELS.length;

export interface ShopItem {
  id: string;
  icon: string;
  name: string;
  desc: string;
  price: number;
}

export const ITEMS: ShopItem[] = [
  { id: "heart", icon: "❤️", name: "Extra heart", desc: "Start every match with 4 hearts", price: 200 },
  { id: "heavy", icon: "💣", name: "Heavy ball", desc: "Bigger hit area on every shot", price: 250 },
  { id: "time", icon: "⏱", name: "Extra time", desc: "+8 seconds per count", price: 150 },
];

export interface Medal {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export const MEDALS: Medal[] = [
  { id: "win", icon: "🏅", name: "First victory", desc: "Win a match" },
  { id: "combo", icon: "🎯", name: "Sharp eye", desc: "3 correct counts in a row" },
  { id: "hunt", icon: "💰", name: "Treasure hunter", desc: "Hit 3 chests in one match" },
  { id: "rich", icon: "👑", name: "Rich captain", desc: "Earn 500 coins in total" },
];

/** Turn timer (seconds) per difficulty: Easy, Normal, Hard */
export const TURN_SECONDS = [30, 22, 15];
export const DIFFICULTIES = ["Easy", "Normal", "Hard"];
/** Rival aim multiplier per difficulty */
export const RIVAL_AIM = [1.4, 1, 0.7];

export const ROUTES = [
  { path: "/", name: "Start" },
  { path: "/login", name: "Login" },
  { path: "/register", name: "Register" },
  { path: "/menu", name: "Main menu" },
  { path: "/levels", name: "Campaign levels" },
  { path: "/match", name: "Match" },
  { path: "/end", name: "End screen" },
  { path: "/shop", name: "Arsenal (shop)" },
  { path: "/profile", name: "Profile" },
  { path: "/leaderboard", name: "Leaderboard" },
  { path: "/settings", name: "Settings" },
  { path: "/how", name: "How to play" },
] as const;
