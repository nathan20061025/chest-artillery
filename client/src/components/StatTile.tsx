import { useEffect, useState, type ReactNode } from "react";
import { calm } from "../state/hooks";

/** A number box. When `value` looks like "12", "+50", "x3" or "85%" it counts up from 0. */
export function StatTile({ value, label, count = false }: { value: string | number; label: ReactNode; count?: boolean }) {
  const text = String(value);
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const m = text.match(/^([+x]?)(\d+)(%?)$/);
    if (!count || !m || calm) {
      setShown(text);
      return;
    }
    const to = +m[2];
    const t0 = performance.now();
    let id = 0;
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / 900);
      setShown(m[1] + Math.round(to * (1 - Math.pow(1 - u, 3))) + m[3]);
      if (u < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [text, count]);

  return (
    <div className="stat">
      <b>{shown}</b>
      {label}
    </div>
  );
}
