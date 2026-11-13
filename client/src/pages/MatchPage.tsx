import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { callApi, getFishForShot } from "../api/fishApi";
import { PopChip } from "../components/PopChip";
import { Screen } from "../components/Screen";
import { MatchEngine } from "../game/engine";
import { applyResult } from "../game/progress";
import { Renderer } from "../game/render";
import { sfx } from "../game/sound";
import type { MatchStats } from "../game/types";
import { useGame } from "../state/GameContext";
import { retrigger, useRaf, useRetrigger } from "../state/hooks";

const HINTS: Record<string, string> = {
  power: "Type the cannon power (30–100), then press Set power.",
  angle: "Type the angle in degrees (10–80), then press Set angle.",
  loading: "Calling the fish API before your shot…",
  count: "Count the fish to lock your shot, then press Fire.",
  ready: "Count locked. Press the FIRE button!",
  fly: "Count locked. Press the FIRE button!",
  enemy: "Rival is firing…",
};

export default function MatchPage() {
  const { S, sel, update, setResult } = useGame();
  const nav = useNavigate();
  const level = Math.min(sel, S.unl);

  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [paused, setPaused] = useState(false);
  const [runId, setRunId] = useState(0);
  const [powIn, setPowIn] = useState(65);
  const [angIn, setAngIn] = useState(45);

  const engine = useRef<MatchEngine | null>(null);
  const renderer = useRef<Renderer | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLElement>(null);
  const sceneEl = useRef<HTMLDivElement>(null);
  const fishEl = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  const latest = useRef({ S, angIn });
  latest.current = { S, angIn };

  const finish = useCallback(
    (stats: MatchStats) => {
      const { state, result } = applyResult(latest.current.S, level, stats);
      update(() => state);
      setResult(result);
      if (stats.win) sfx.win();
      void callApi();
      nav("/end");
    },
    [level, update, setResult, nav],
  );

  /* create (and on restart, recreate) the match */
  useEffect(() => {
    const { S: s, angIn: a } = latest.current;
    const e = new MatchEngine(
      { level, diff: s.diff, heart: !!s.items.heart, heavy: !!s.items.heavy, time: !!s.items.time },
      { onChange: rerender, onFinish: finish, getFish: getFishForShot },
    );
    e.previewAim = a;
    engine.current = e;
    renderer.current = new Renderer();
    setPaused(false);
    e.start();
    return () => {
      e.dispose();
      engine.current = null;
    };
  }, [level, runId, finish]);

  /* game loop: update physics, draw the canvas, move the timer bar */
  useRaf((dt) => {
    const e = engine.current;
    const c = canvas.current?.getContext("2d");
    if (!e || !c || !renderer.current) return;
    if (!pausedRef.current) e.update(dt);
    renderer.current.draw(c, e, !!latest.current.S.items.heavy);
    if (bar.current && e.ph === "count") {
      bar.current.style.width = Math.max(0, (e.tl / e.tm) * 100) + "%";
      bar.current.style.background = e.tl < 5 ? "var(--red)" : "";
    }
  });

  /* keep the cannon aiming at the typed angle while choosing it */
  useEffect(() => {
    const e = engine.current;
    if (!e) return;
    e.previewAim = angIn;
    if (e.ph === "angle" && angIn >= 10 && angIn <= 80) e.aim = angIn;
  }, [angIn]);

  /* keyboard: 0-9 count, Esc pause, Space/Enter fire */
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const e = engine.current;
      if (!e) return;
      if (/^\d$/.test(ev.key) && !pausedRef.current) e.answer(+ev.key);
      if (ev.key === "Escape") setPaused((p) => !p);
      if ((ev.key === " " || ev.key === "Enter") && e.ph === "ready" && !pausedRef.current) {
        ev.preventDefault();
        e.fire();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const e = engine.current;
  const ph = e?.ph ?? "power";
  const step = ph === "power" ? 0 : ph === "angle" ? 1 : 2;
  const fish = e?.fish ?? null;

  /* little animations */
  useRetrigger(fishEl, "swap", 600, e?.fishId);
  const fbNow = e?.fb;
  useEffect(() => {
    if (fbNow?.text && engine.current?.ph === "ready") retrigger(fishEl.current, fbNow.tone === "good" ? "good" : "bad", 800);
  }, [fbNow]);
  const hp = e?.hp ?? 0;
  const prevHp = useRef(hp);
  useEffect(() => {
    if (hp < prevHp.current) retrigger(sceneEl.current, "hit", 600);
    prevHp.current = hp;
  }, [hp]);

  const hearts = (n: number) => "♥".repeat(Math.max(0, n));
  const wind = e?.wind ?? 0;
  const stepName = ph === "power" ? "pow" : ph === "angle" ? "ang" : "cnt";

  const placeholder =
    ph === "power" ? (
      <>
        🎯 Step 1: type your cannon power.
        <br />
        <small>The fish API is called at the Fire step.</small>
      </>
    ) : ph === "angle" ? (
      <>
        📐 Step 2: type the angle.
        <br />
        <small>Watch the cannon turn as you change it.</small>
      </>
    ) : (
      <>⏳ Calling the fish API…</>
    );

  return (
    <Screen id="match">
      <div className="hud">
        <PopChip id="hl" text={`Lv${level} ${e?.L.name ?? ""}`} />
        <PopChip id="h1" text={`You ${hearts(hp)}${"♡".repeat(Math.max(0, (e?.hpMax ?? 0) - hp))}`} />
        <PopChip id="h2" text={`Rival ${hearts(e?.he ?? 0)}`} />
        <PopChip id="hw" text={`Wind ${wind >= 0 ? "→ " : "← "}${Math.abs(wind).toFixed(1)}`} />
        <PopChip id="hs" text={`Score ${e?.sc ?? 0}`} />
        <PopChip id="hc2" text={`Combo x${e?.cb ?? 0}`} />
        <span className={"chip" + (fish?.how === "live" ? " ok" : "")} id="hapi">
          {fish ? (fish.how === "live" ? "Fish API: live ✓" : `Fish API: offline (${fish.how})`) : "Fish API: –"}
        </span>
        <div className="bar" title="Turn timer">
          <i id="tb" ref={bar} />
        </div>
        <button id="pzb" onClick={() => setPaused(true)}>
          ⏸ Pause
        </button>
      </div>

      <div className="scene" ref={sceneEl}>
        <canvas ref={canvas} id="mc" width={1600} height={760} />
      </div>

      <div className="play">
        <div>
          <div className="steps">
            {["1 Power", "2 Angle", "3 Fire"].map((s, i) => (
              <span key={s} id={"s" + i} className={i < step ? "done" : i === step ? "on" : ""}>
                {s}
              </span>
            ))}
          </div>
          <div className="fishbox" id="fish" role="img" aria-label="Fish and chests to count" ref={fishEl}>
            {ph === "power" || ph === "angle" || ph === "loading" || !fish ? (
              <div className="ph">
                <div>{placeholder}</div>
              </div>
            ) : fish.src ? (
              <>
                <span className="tag">{fish.how === "live" ? "🌐 API image" : "🗃 Cached API image"}</span>
                <img alt="Fish and chests to count" src={fish.src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </>
            ) : (
              <>
                <span className="tag">💾 Local image</span>
                <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: fish.svg ?? "" }} />
              </>
            )}
          </div>
          <p className="hint" id="pt">
            {HINTS[ph] ?? ""}
          </p>
          <p className="fb" id="fb" aria-live="polite" style={{ color: e?.fb.tone === "bad" ? "var(--red)" : e?.fb.tone === "good" ? "var(--green)" : "" }}>
            {e?.fb.text}
          </p>
        </div>

        <div>
          <div id="inPow" className="inbox" hidden={stepName !== "pow"}>
            <label htmlFor="pwIn">Cannon power (30–100)</label>
            <div className="inrow">
              <input
                id="pwIn"
                type="number"
                min={30}
                max={100}
                value={powIn}
                onChange={(ev) => setPowIn(+ev.target.value)}
                onKeyDown={(ev) => ev.key === "Enter" && e?.setPower(powIn)}
              />
              <button className="primary" id="pwSet" onClick={() => e?.setPower(powIn)}>
                Set power ▶
              </button>
            </div>
            <input type="range" id="pwR" min={30} max={100} value={powIn} onChange={(ev) => setPowIn(+ev.target.value)} aria-label="Power slider" />
          </div>
          <div id="inAng" className="inbox" hidden={stepName !== "ang"}>
            <label htmlFor="agIn">Angle in degrees (10–80)</label>
            <div className="inrow">
              <input
                id="agIn"
                type="number"
                min={10}
                max={80}
                value={angIn}
                onChange={(ev) => setAngIn(+ev.target.value)}
                onKeyDown={(ev) => ev.key === "Enter" && e?.setAngle(angIn)}
              />
              <button className="primary" id="agSet" onClick={() => e?.setAngle(angIn)}>
                Set angle ▶
              </button>
            </div>
            <input type="range" id="agR" min={10} max={80} value={angIn} onChange={(ev) => setAngIn(+ev.target.value)} aria-label="Angle slider" />
          </div>
          <div id="inCnt" hidden={stepName !== "cnt"}>
            <label>Count the fish in the picture (0–9)</label>
            <div className="pad" id="pad">
              {Array.from({ length: 10 }, (_, i) => (
                <button key={i} aria-label={"Answer " + i} disabled={ph !== "count" || paused} onClick={() => e?.answer(i)}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="hud">
            <span className="chip">
              Power <b id="pw">{e?.pw || "–"}</b>
            </span>
            <span className="chip">
              Angle <b id="an">{e?.ag ? e.ag + "°" : "–"}</b>
            </span>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="fire" id="fireBtn" disabled={ph !== "ready"} onClick={() => e?.fire()}>
              🔥 Fire!
            </button>
          </div>
          <p className="hint">Tip: Enter confirms power or angle, keys 0–9 count the fish, Space fires, Esc pauses.</p>
        </div>
      </div>

      {paused && (
        <div className="pz on" id="pz">
          <div className="card">
            <h2>Paused</h2>
            <div className="stack" style={{ marginTop: 12 }}>
              <button className="primary" id="p1" onClick={() => setPaused(false)}>
                Resume
              </button>
              <button id="p2" onClick={() => setRunId((n) => n + 1)}>
                Restart level
              </button>
              <Link className="btn" to="/levels">
                Quit to levels
              </Link>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
