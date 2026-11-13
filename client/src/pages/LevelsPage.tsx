import { useNavigate } from "react-router";
import { HubCard } from "../components/Screen";
import { LEVELS } from "../game/data";
import { useGame } from "../state/GameContext";

export default function LevelsPage() {
  const { S, setSel } = useGame();
  const nav = useNavigate();
  return (
    <HubCard id="levels" title="Campaign" sub="Pick a level. Win to unlock the next one.">
      <div className="tiles">
        {LEVELS.map((l, i) => {
          const n = i + 1;
          const locked = n > S.unl;
          const stars = S.stars[n] || 0;
          return (
            <button
              key={n}
              className="btn tile"
              disabled={locked}
              onClick={() => {
                setSel(n);
                nav("/match");
              }}
            >
              <span className="ic">{locked ? "🔒" : "⚓"}</span>
              {n}. {l.name}
              <small>
                Wind {l.wind} · {l.chests} chests · Rival {l.rivalHp}♥{l.moving ? " · moving" : ""}
                {l.storm ? " · storm" : ""}
              </small>
              <small>
                {"★".repeat(stars)}
                {"☆".repeat(3 - stars)}
              </small>
            </button>
          );
        })}
      </div>
    </HubCard>
  );
}
