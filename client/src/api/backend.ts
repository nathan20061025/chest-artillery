/* Where a match gets its fish pictures and how a count is checked.
   - localBackend: guests. The browser calls the public fish API and knows the answer (prototype behaviour).
   - serverBackend: logged-in players. Our API issues the picture and keeps the answer. */
import type { FishPick } from "../game/types";
import { getFishForShot } from "./fishApi";
import { gameApi } from "./server";

export interface Backend {
  getFish: () => Promise<FishPick>;
  /** returns the error size: 0 = perfect count */
  checkAnswer: (fish: FishPick, answer: number, timedOut: boolean) => Promise<number>;
}

export const localBackend: Backend = {
  getFish: getFishForShot,
  checkAnswer: async (fish, answer, timedOut) => (timedOut ? 4 : Math.abs(answer - (fish.sol ?? 0))),
};

export const serverBackend: Backend = {
  getFish: async () => {
    const r = await gameApi.fish();
    return { id: r.id, src: r.image, how: r.source === "live" ? "live" : "local" };
  },
  checkAnswer: async (fish, answer, timedOut) => (await gameApi.answer(fish.id!, timedOut ? -1 : answer)).error,
};
