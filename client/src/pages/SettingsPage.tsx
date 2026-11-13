import { useState } from "react";
import { HubCard } from "../components/Screen";
import { DIFFICULTIES } from "../game/data";
import { useGame } from "../state/GameContext";
import type { ThemeMode } from "../game/types";

const NEXT_THEME: Record<ThemeMode, ThemeMode> = { auto: "dark", dark: "light", light: "auto" };

export default function SettingsPage() {
  const { S, update, resetProgress, toast } = useGame();
  const [confirm, setConfirm] = useState(false);

  return (
    <HubCard id="settings" title="Settings">
      <div className="stack">
        <button id="sn" onClick={() => update((s) => ({ ...s, snd: s.snd ? 0 : 1 }))}>
          Sound: {S.snd ? "On" : "Off"}
        </button>
        <button id="sd" onClick={() => update((s) => ({ ...s, diff: (s.diff + 1) % 3 }))}>
          Difficulty: {DIFFICULTIES[S.diff]}
        </button>
        <button id="stt" onClick={() => update((s) => ({ ...s, theme: NEXT_THEME[s.theme] }))}>
          Theme: {S.theme}
        </button>
        <button
          id="sr"
          onClick={() => {
            if (!confirm) return setConfirm(true);
            resetProgress();
            setConfirm(false);
            toast("Progress reset");
          }}
        >
          {confirm ? "Click again to confirm" : "Reset progress"}
        </button>
      </div>
      <p className="hint">Difficulty changes the turn timer and the rival's aim.</p>
    </HubCard>
  );
}
