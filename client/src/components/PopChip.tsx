import { useRef, type ReactNode } from "react";
import { useRetrigger } from "../state/hooks";

/** A HUD chip that "pops" whenever its text changes. */
export function PopChip({
  id,
  className = "",
  text,
  children,
  hidden,
}: {
  id?: string;
  className?: string;
  text: string;
  children?: ReactNode;
  hidden?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useRetrigger(ref, "pop", 500, text);
  return (
    <span ref={ref} id={id} className={("chip " + className).trim()} hidden={hidden}>
      {children ?? text}
    </span>
  );
}
