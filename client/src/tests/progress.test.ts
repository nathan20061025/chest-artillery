import { accuracy, applyResult, defaultState, rank } from "../game/progress";
import type { MatchStats } from "../game/types";

const win: MatchStats = { win: true, sc: 120, ans: 4, cor: 4, chs: 2, hits: 2, best: 4, hp: 3, hpMax: 3 };

describe("applyResult", () => {
  it("awards coins, 3 stars, unlocks the next level and the first-win medal", () => {
    const { state, result } = applyResult(defaultState(), 1, win, "now");
    expect(result.coins).toBe(50 + 10 + 2 * 10 + 2 * 20);
    expect(result.stars).toBe(3);
    expect(state.unl).toBe(2);
    expect(state.w).toBe(1);
    expect(result.na).toContain("First victory");
    expect(result.na).toContain("Sharp eye");
    expect(state.hist[0]).toEqual(["now", "Calm Bay", "Win", "100%", 120]);
  });

  it("gives a loss only small coins and no stars or unlock", () => {
    const { state, result } = applyResult(defaultState(), 1, { ...win, win: false, hits: 0, chs: 1 }, "now");
    expect(result.coins).toBe(20);
    expect(result.stars).toBe(0);
    expect(state.unl).toBe(1);
    expect(state.w).toBe(0);
  });

  it("does not mutate the previous state", () => {
    const prev = defaultState();
    applyResult(prev, 1, win, "now");
    expect(prev.coins).toBe(0);
    expect(prev.hist).toHaveLength(0);
  });

  it("keeps the best star rating and stops unlocking after level 5", () => {
    const s = { ...defaultState(), unl: 5, stars: { 5: 3 } };
    const { state } = applyResult(s, 5, { ...win, hp: 1, cor: 0 }, "now");
    expect(state.unl).toBe(5);
    expect(state.stars[5]).toBe(3);
  });
});

describe("helpers", () => {
  it("ranks by wins", () => {
    expect([0, 1, 3, 6, 10].map(rank)).toEqual(["Cabin Boy", "Deckhand", "Gunner", "Captain", "Admiral"]);
  });
  it("accuracy handles zero answers", () => {
    expect(accuracy(0, 0)).toBe(0);
    expect(accuracy(3, 4)).toBe(75);
  });
});
