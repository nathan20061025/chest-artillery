/* Rewards and progression after a match. Pure functions, easy to unit-test.
   Later the ASP.NET backend will do this calculation (ScoreService) and the client will only display it. */
import { LEVELS, MAX_LEVEL, MEDALS } from "./data";
import type { HistRow, MatchResult, MatchStats, PlayerState } from "./types";

export const defaultState = (): PlayerState => ({
  name: "Captain",
  coins: 0,
  earned: 0,
  unl: 1,
  stars: {},
  items: {},
  ach: {},
  m: 0,
  w: 0,
  ans: 0,
  cor: 0,
  ch: 0,
  hist: [],
  snd: 1,
  diff: 1,
  theme: "auto",
});

export const rank = (wins: number): string =>
  wins < 1 ? "Cabin Boy" : wins < 3 ? "Deckhand" : wins < 6 ? "Gunner" : wins < 10 ? "Captain" : "Admiral";

export const accuracy = (cor: number, ans: number): number => (ans ? Math.round((100 * cor) / ans) : 0);

export function applyResult(
  prev: PlayerState,
  level: number,
  g: MatchStats,
  when: string = new Date().toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
): { state: PlayerState; result: MatchResult } {
  const S: PlayerState = {
    ...prev,
    stars: { ...prev.stars },
    items: { ...prev.items },
    ach: { ...prev.ach },
    hist: [...prev.hist],
  };
  const acc = accuracy(g.cor, g.ans);
  const coins = g.win ? 50 + level * 10 + g.chs * 10 + g.hits * 20 : 10 + g.chs * 10;
  const stars = g.win ? 1 + (g.hp >= g.hpMax ? 1 : 0) + (acc >= 70 ? 1 : 0) : 0;
  const na: string[] = [];
  const unlock = (id: string) => {
    if (!S.ach[id]) {
      S.ach[id] = 1;
      na.push(MEDALS.find((m) => m.id === id)!.name);
    }
  };

  S.m++;
  S.ans += g.ans;
  S.cor += g.cor;
  S.ch += g.chs;
  S.coins += coins;
  S.earned += coins;
  if (g.win) {
    S.w++;
    unlock("win");
    S.stars[level] = Math.max(S.stars[level] || 0, stars);
    if (level === S.unl && level < MAX_LEVEL) S.unl++;
  }
  if (g.best >= 3) unlock("combo");
  if (g.chs >= 3) unlock("hunt");
  if (S.earned >= 500) unlock("rich");

  const row: HistRow = [when, LEVELS[level - 1].name, g.win ? "Win" : "Loss", acc + "%", g.sc];
  S.hist = [row, ...S.hist].slice(0, 8);

  return { state: S, result: { win: g.win, stars, coins, acc, sc: g.sc, chs: g.chs, best: g.best, na } };
}
