/* App-wide state: the player's profile/progress, the selected level, the last match result, toasts.
   Guests keep progress in localStorage. Logged-in players load and save through the API (src/api/server.ts). */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, gameApi, getToken, setToken, toPlayerState, type AuthResponse, type ProfileDto } from "../api/server";
import { defaultState } from "../game/progress";
import { setSoundEnabled } from "../game/sound";
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
  /** erase guest progress but keep the player's name */
  resetProgress: () => void;
  /** true when logged in to the API (false = guest) */
  authed: boolean;
  signIn: (r: AuthResponse) => Promise<void>;
  logout: () => void;
  /** replace local state with the server's profile */
  applyProfile: (p: ProfileDto) => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [S, setS] = useState<PlayerState>(load);
  const [sel, setSel] = useState(() => load().unl);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [authed, setAuthed] = useState(() => !!getToken());
  const timer = useRef<number | undefined>(undefined);
  /** last settings known to the server, so we only PUT real changes */
  const synced = useRef("");

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

  const applyProfile = useCallback((p: ProfileDto) => {
    const s = toPlayerState(p);
    synced.current = `${s.snd}${s.diff}${s.theme}`;
    setS(s);
  }, []);

  const signIn = useCallback(
    async (r: AuthResponse) => {
      setToken(r.token);
      setAuthed(true);
      const p = await gameApi.profile();
      applyProfile(p);
      setSel(p.unlockedLevel);
    },
    [applyProfile],
  );

  const logout = useCallback(() => {
    setToken(null);
    setAuthed(false);
    synced.current = "";
    setS(defaultState());
    setSel(1);
    setResult(null);
  }, []);

  /* resume a saved login */
  useEffect(() => {
    if (!getToken()) return;
    gameApi
      .profile()
      .then((p) => {
        applyProfile(p);
        setSel(p.unlockedLevel);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) logout();
      });
  }, [applyProfile, logout]);

  /* save sound / difficulty / theme changes to the server */
  useEffect(() => {
    const k = `${S.snd}${S.diff}${S.theme}`;
    if (!authed || !synced.current || synced.current === k) return;
    synced.current = k;
    gameApi.settings({ sound: !!S.snd, difficulty: S.diff, theme: S.theme }).catch(() => {});
  }, [authed, S.snd, S.diff, S.theme]);

  const value = useMemo(
    () => ({ S, update, sel, setSel, result, setResult, toast, toastMsg, resetProgress, authed, signIn, logout, applyProfile }),
    [S, update, sel, result, toast, toastMsg, resetProgress, authed, signIn, logout, applyProfile],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame must be used inside <GameProvider>");
  return c;
}
