/* Fish counting API client.
   For now the browser calls the public fish API directly (as the prototype did).
   When the ASP.NET backend exists, only this file changes: fetchFish() will call
   GET /api/fish on our own server instead. */
import { fishSvg } from "../game/fishSvg";
import type { FishPick } from "../game/types";

export const FISH_API = "https://marcconrad.com/uob/fish/api.php?out=csv&base64=yes";

export interface FishImage {
  src: string;
  sol: number;
}

/** Parse the API's CSV reply: `<base64 image>,<fish count>,<chest count>`.
    (The prototype took the LAST field, which is the chest count, and left ",<fish>" inside the
    image data. The player counts the FISH, so the solution is the second field.) */
export function parseFishCsv(text: string): FishImage {
  const parts = text.trim().split(",");
  const b = (parts[0] ?? "").trim();
  const n = parts.length >= 2 ? parseInt(parts[1], 10) : NaN;
  if (!(n >= 0 && n <= 9) || b.length < 50) throw new Error("Bad data");
  const mime = b.startsWith("/9j/") ? "image/jpeg" : b.startsWith("R0lG") ? "image/gif" : "image/png";
  return { src: b.startsWith("data:") ? b : `data:${mime};base64,${b}`, sol: n };
}

export async function fetchFish(timeoutMs = 5000): Promise<FishImage> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(FISH_API, { signal: ctl.signal, cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return parseFishCsv(await r.text());
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- cache + status (observable, for useSyncExternalStore) ---------- */
export interface ApiStatus {
  ok: boolean | null;
  msg: string;
}

let pool: FishImage[] = [];
let status: ApiStatus = { ok: null, msg: "Waiting for the first mission to finish." };
const listeners = new Set<() => void>();

const setStatus = (s: ApiStatus) => {
  status = s;
  listeners.forEach((l) => l());
};
export const subscribeApi = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getApiStatus = () => status;

/** Called after every finished mission: pre-fetch images as a backup for the next one. */
export async function callApi(): Promise<void> {
  setStatus({ ok: null, msg: "Calling the API for the next mission..." });
  const got: FishImage[] = [];
  for (let i = 0; i < 8; i++) {
    try {
      got.push(await fetchFish());
    } catch {
      break;
    }
  }
  pool = pool.concat(got);
  setStatus(
    got.length
      ? { ok: true, msg: `${got.length} fresh fish images cached as backup for the next mission.` }
      : { ok: false, msg: "API not reachable. Local pictures will be used." },
  );
}

/** Image for one shot: live API, else the cache, else a locally drawn picture. */
export async function getFishForShot(): Promise<FishPick> {
  try {
    const f = await fetchFish();
    return { sol: f.sol, src: f.src, how: "live" };
  } catch {
    const c = pool.shift();
    if (c) return { sol: c.sol, src: c.src, how: "cache" };
    const sol = Math.floor(Math.random() * 10);
    return { sol, src: null, how: "local", svg: fishSvg(sol) };
  }
}

/** test helper */
export const _resetFishCache = () => {
  pool = [];
  status = { ok: null, msg: "Waiting for the first mission to finish." };
};
