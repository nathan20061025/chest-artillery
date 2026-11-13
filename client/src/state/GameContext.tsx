/* App-wide state: the player's profile/progress, the selected level, the last match result, toasts.
   Progress is kept in localStorage for now; when the ASP.NET backend exists this provider will
   load and save through src/api instead. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { setSoundEnabled } from "../game/sound";
import { defaultState } from "../game/progress";
import type { MatchResult, PlayerState } from "../game/types";

const KEY = "ca2";

function load(): PlayerState {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return defaultState();
  }
}

interface GameCtx {
  S: PlayerState;
  update: (fn: (s: PlayerState) => PlayerState) => void;
  /** selected campaign level (1-based) */
  sel: number;
  setSel: (n: number) => void;
  result: MatchResult | null;
  setResult: (r: MatchResult | null) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
  /** erase progress but keep the player's name */
  resetProgress: () => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [S, setS] = useState<PlayerState>(load);
  const [sel, setSel] = useState(() => load().unl);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch {
      /* storage may be unavailable */
    }
  }, [S]);

  useEffect(() => {
    document.documentElement.dataset.theme = S.theme === "auto" ? "" : S.theme;
  }, [S.theme]);

  useEffect(() => {
    setSoundEnabled(!!S.snd);
  }, [S.snd]);

  const update = useCallback((fn: (s: PlayerState) => PlayerState) => setS((s) => fn(s)), []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const resetProgress = useCallback(() => {
    setS((s) => ({ ...defaultState(), name: s.name }));
    setSel(1);
  }, []);

  const value = useMemo(
    () => ({ S, update, sel, setSel, result, setResult, toast, toastMsg, resetProgress }),
    [S, update, sel, result, toast, toastMsg, resetProgress],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame must be used inside <GameProvider>");
  return c;
}
