import { useEffect, useMemo, useState } from "react";
import { calm, rnd } from "../state/hooks";

/** Intro splash screen (skipped when the user prefers reduced motion). */
export function Splash() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">(calm ? "gone" : "in");
  useEffect(() => {
    if (calm) return;
    const a = window.setTimeout(() => setPhase("out"), 1300);
    const b = window.setTimeout(() => setPhase("gone"), 2000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  if (phase === "gone") return null;
  return (
    <div id="splash" className={phase === "out" ? "out" : ""}>
      <div className="sp-in">
        <div className="sp-anchor">⚓</div>
        <div className="sp-t">Chest Artillery</div>
        <div className="sp-bar">
          <i />
        </div>
      </div>
    </div>
  );
}

/** Floating background bubbles. */
export function Bubbles() {
  const items = useMemo(
    () =>
      Array.from({ length: 16 }, () => {
        const z = rnd(6, 22);
        return {
          left: rnd(0, 100) + "%",
          width: z,
          height: z,
          animationDuration: rnd(9, 20) + "s",
          animationDelay: -rnd(0, 18) + "s",
        };
      }),
    [],
  );
  if (calm) return null;
  return (
    <div className="bubbles">
      {items.map((s, i) => (
        <span key={i} style={s} />
      ))}
    </div>
  );
}

const COLOURS = ["#e3b24e", "#ff6b5f", "#5fd1a0", "#4aa8c7", "#f3ead3"];

/** Victory confetti. Removes itself after a few seconds. */
export function Confetti() {
  const [on, setOn] = useState(!calm);
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: rnd(0, 100) + "%",
        background: COLOURS[i % 5],
        ["--dx" as string]: rnd(-120, 120) + "px",
        animationDuration: rnd(2, 3.6) + "s",
        animationDelay: rnd(0, 0.8) + "s",
      })),
    [],
  );
  useEffect(() => {
    const id = window.setTimeout(() => setOn(false), 4800);
    return () => clearTimeout(id);
  }, []);
  if (!on) return null;
  return (
    <div className="confetti">
      {pieces.map((p, i) => (
        <i key={i} style={p} />
      ))}
    </div>
  );
}

/** Small toast message at the bottom of the screen. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div id="toast" role="status" style={{ display: message ? "block" : "none" }}>
      {message}
    </div>
  );
}
