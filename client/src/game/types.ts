export interface Shot {
  me: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  tr: [number, number][];
  /** perfect count: small score bonus */
  pf?: boolean;
}

/** [x, y, vx, vy, life, colour] */
export type Particle = [number, number, number, number, number, string];
/** [x, y, life, text, colour] */
export type FloatText = [number, number, number, string, string];

export interface Chest {
  x: number;
  on: boolean;
}

/** Everything the renderer needs to draw one frame of the battle scene. */
export interface SceneState {
  t: number;
  storm: boolean;
  wind: number;
  aim: number;
  rx: number;
  ca: Chest[];
  shot: Shot | null;
  P: Particle[];
  TX: FloatText[];
  shake: number;
  flash: number;
  hp: number;
  he: number;
  chs: number;
}

export type Phase = "power" | "angle" | "loading" | "count" | "checking" | "ready" | "fly" | "enemy" | "done";

export type FishSource = "live" | "cache" | "local";

export interface FishPick {
  /** correct count. Only known in guest (local) mode; the server keeps it for logged-in players */
  sol?: number;
  /** server challenge id (logged-in mode) */
  id?: string;
  /** data-URL image from the fish API, or null when a local SVG is used */
  src: string | null;
  how: FishSource;
  /** locally drawn SVG markup (only when src is null) */
  svg?: string;
}

export interface MatchStats {
  win: boolean;
  sc: number;
  ans: number;
  cor: number;
  chs: number;
  hits: number;
  best: number;
  hp: number;
  hpMax: number;
}

export interface MatchResult {
  win: boolean;
  stars: number;
  coins: number;
  acc: number;
  sc: number;
  chs: number;
  best: number;
  /** names of medals unlocked this match */
  na: string[];
}

export type HistRow = [string, string, string, string, number];

export type ThemeMode = "auto" | "dark" | "light";

export interface PlayerState {
  name: string;
  coins: number;
  earned: number;
  unl: number;
  stars: Record<number, number>;
  items: Record<string, number>;
  ach: Record<string, number>;
  m: number;
  w: number;
  ans: number;
  cor: number;
  ch: number;
  hist: HistRow[];
  snd: number;
  diff: number;
  theme: ThemeMode;
}
