import { useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Screen } from "../components/Screen";
import { Renderer } from "../game/render";
import { useGame } from "../state/GameContext";
import { useRaf } from "../state/hooks";

export default function StartPage() {
  const { update } = useGame();
  const nav = useNavigate();
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<Renderer | null>(null);

  useRaf((_dt, t) => {
    const c = canvas.current?.getContext("2d");
    if (!c) return;
    renderer.current ??= new Renderer();
    renderer.current.hero(c, t);
  });

  return (
    <Screen id="start">
      <div className="card hero">
        <div>
          <h1>Count the fish. Sink the ship.</h1>
          <p className="sub">Every cannon shot starts with counting fish. Beat 5 levels.</p>
          <div className="stack">
            <Link className="btn primary" to="/login">
              Log in
            </Link>
            <Link className="btn" to="/register">
              Create account
            </Link>
            <button
              id="guest"
              onClick={() => {
                update((s) => ({ ...s, name: "Guest" }));
                nav("/menu");
              }}
            >
              Play as guest
            </button>
          </div>
        </div>
        <div className="scene">
          <canvas ref={canvas} id="hc" width={1600} height={760} />
        </div>
      </div>
    </Screen>
  );
}
