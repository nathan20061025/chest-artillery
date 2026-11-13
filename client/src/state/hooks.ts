import { useEffect, useRef, type RefObject } from "react";

export const calm: boolean =
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Restart a CSS animation class on an element (remove, force reflow, add again). */
export function retrigger(el: Element | null, cls: string, ms?: number): void {
  if (!el || calm) return;
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
  if (ms) window.setTimeout(() => el.classList.remove(cls), ms);
}

/** Run `cb(dt, t)` every animation frame while mounted. dt is capped at 33 ms. */
export function useRaf(cb: (dt: number, t: number) => void): void {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    let id = 0;
    let last = 0;
    let t = 0;
    const loop = (ts: number) => {
      const dt = Math.min(0.033, (ts - last) / 1000 || 0);
      last = ts;
      t += dt;
      ref.current(dt, t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
}

/** Play a CSS animation class on `ref` whenever `trigger` changes (not on first render). */
export function useRetrigger(ref: RefObject<Element | null>, cls: string, ms: number, trigger: unknown): void {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    retrigger(ref.current, cls, ms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
}
