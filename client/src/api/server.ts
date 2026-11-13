/* Typed client for the ASP.NET API (server/). The JWT is kept in localStorage. */
import type { MatchResult, PlayerState } from "../game/types";

const BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:5100";
const TOKEN = "ca_token";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN);
  } catch {
    return null;
  }
};
export const setToken = (t: string | null): void => {
  try {
    if (t) localStorage.setItem(TOKEN, t);
    else localStorage.removeItem(TOKEN);
  } catch {
    /* storage may be unavailable */
  }
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const token = getToken();
  let r: Response;
  try {
    r = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(data?.error ?? `Request failed (${r.status})`, r.status);
  return data as T;
}

/* ---------- DTOs (mirror ChestArtillery.Core/Models.cs, camelCase) ---------- */
export interface AuthResponse { token: string; username: string }
export interface ProfileDto {
  name: string; coins: number; totalEarned: number; unlockedLevel: number; stars: Record<string, number>;
  items: string[]; medals: string[]; matches: number; wins: number; answersTotal: number; answersCorrect: number; chestsHit: number;
  settings: { sound: boolean; difficulty: number; theme: "auto" | "dark" | "light" };
  history: { playedAt: string; level: string; won: boolean; accuracyPct: number; score: number }[];
}
export interface MatchReport {
  level: number; won: boolean; score: number; answersTotal: number; answersCorrect: number;
  chestsHit: number; rivalHits: number; bestCombo: number; heartsLeft: number;
}
export interface MatchResultDto {
  won: boolean; stars: number; coins: number; accuracy: number; score: number; chestsHit: number; bestCombo: number;
  newMedals: string[]; profile: ProfileDto;
}
export interface LeaderRow { rank: number; username: string; accuracyPct: number; wins: number }

export const authApi = {
  login: (username: string, password: string) => api<AuthResponse>("/api/auth/login", "POST", { username, password }),
  register: (username: string, email: string, password: string) => api<AuthResponse>("/api/auth/register", "POST", { username, email, password }),
};

export const gameApi = {
  profile: () => api<ProfileDto>("/api/profile"),
  settings: (s: ProfileDto["settings"]) => api<ProfileDto["settings"]>("/api/settings", "PUT", s),
  fish: () => api<{ id: string; image: string; source: string }>("/api/fish"),
  answer: (id: string, answer: number) => api<{ error: number; correct: boolean }>("/api/fish/answer", "POST", { id, answer }),
  submitMatch: (r: MatchReport) => api<MatchResultDto>("/api/matches", "POST", r),
  buy: (itemId: string) => api<ProfileDto>(`/api/shop/buy/${itemId}`, "POST"),
  leaderboard: (by: "accuracy" | "wins") => api<LeaderRow[]>(`/api/leaderboard?by=${by}`),
};

/* ---------- server DTO -> the shapes the UI already uses ---------- */
const utc = (s: string) => (/Z|[+-]\d\d:\d\d$/.test(s) ? s : s + "Z");

export function toPlayerState(p: ProfileDto): PlayerState {
  return {
    name: p.name, coins: p.coins, earned: p.totalEarned, unl: p.unlockedLevel,
    stars: Object.fromEntries(Object.entries(p.stars).map(([k, v]) => [Number(k), v])),
    items: Object.fromEntries(p.items.map((i) => [i, 1])),
    ach: Object.fromEntries(p.medals.map((m) => [m, 1])),
    m: p.matches, w: p.wins, ans: p.answersTotal, cor: p.answersCorrect, ch: p.chestsHit,
    hist: p.history.map((h) => [
      new Date(utc(h.playedAt)).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      h.level, h.won ? "Win" : "Loss", h.accuracyPct + "%", h.score,
    ]),
    snd: p.settings.sound ? 1 : 0, diff: p.settings.difficulty, theme: p.settings.theme,
  };
}

export const toResult = (r: MatchResultDto): MatchResult => ({
  win: r.won, stars: r.stars, coins: r.coins, acc: r.accuracy, sc: r.score, chs: r.chestsHit, best: r.bestCombo, na: r.newMedals,
});
