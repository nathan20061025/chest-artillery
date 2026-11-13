import { useSyncExternalStore } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { callApi, getApiStatus, subscribeApi } from "../api/fishApi";
import { Confetti } from "../components/Effects";
import { Screen } from "../components/Screen";
import { StatTile } from "../components/StatTile";
import { MAX_LEVEL } from "../game/data";
import { useGame } from "../state/GameContext";

export default function EndPage() {
  const { result: r, sel, setSel } = useGame();
  const nav = useNavigate();
  const api = useSyncExternalStore(subscribeApi, getApiStatus);
  if (!r) return <Navigate to="/menu" replace />;

  const cls = api.ok === null ? "" : api.ok ? " ok" : " bad";
  const icon = api.ok === null ? "⏳ " : api.ok ? "✅ " : "⚠️ ";

  return (
    <Screen id="end">
      {r.win && <Confetti />}
      <div className="card">
        <h2 id="et">{r.win ? "Victory! Rival ship sunk" : "Defeat: your ship went down"}</h2>
        <p className="sub" id="es" style={{ fontSize: 24 }}>
          {r.win ? "★".repeat(r.stars) + "☆".repeat(3 - r.stars) : "Try again, Captain."}
        </p>
        <div className="stats" id="est">
          <StatTile count value={r.sc} label="Score" />
          <StatTile count value={r.acc + "%"} label="Count accuracy" />
          <StatTile count value={r.chs} label="Chests hit" />
          <StatTile count value={"+" + r.coins} label="Coins earned" />
          <StatTile count value={"x" + r.best} label="Best combo" />
        </div>
        <div id="ea">
          {r.na.map((a) => (
            <span key={a} className="chip ok">
              New medal: {a}{" "}
            </span>
          ))}
        </div>
        <div className={"apibox" + cls} id="api" role="status">
          {icon}Fish API: {api.msg}
          {api.ok === false && (
            <button style={{ marginLeft: 8, padding: "4px 12px" }} onClick={() => void callApi()}>
              Retry
            </button>
          )}
        </div>
        <div className="row">
          {r.win && sel < MAX_LEVEL && (
            <button
              className="primary"
              id="nx"
              onClick={() => {
                setSel(sel + 1);
                nav("/match");
              }}
            >
              Next level ▶
            </button>
          )}
          <Link className="btn" to="/match">
            Retry
          </Link>
          <Link className="btn" to="/levels">
            Levels
          </Link>
          <Link className="btn" to="/leaderboard">
            Leaderboard
          </Link>
          <Link className="btn" to="/menu">
            Menu
          </Link>
        </div>
      </div>
    </Screen>
  );
}
