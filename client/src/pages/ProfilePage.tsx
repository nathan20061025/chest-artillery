import { HubCard } from "../components/Screen";
import { StatTile } from "../components/StatTile";
import { MEDALS } from "../game/data";
import { accuracy, rank } from "../game/progress";
import { useGame } from "../state/GameContext";

export default function ProfilePage() {
  const { S } = useGame();
  return (
    <HubCard id="profile" title="Captain profile">
      <p>
        <span className="chip ok">
          {S.name} · {rank(S.w)}
        </span>
      </p>
      <div className="stats">
        <StatTile value={S.m} label="Matches" />
        <StatTile value={S.w} label="Wins" />
        <StatTile value={accuracy(S.cor, S.ans) + "%"} label="Count accuracy" />
        <StatTile value={S.ch} label="Chests hit" />
        <StatTile value={S.coins} label="Coins" />
      </div>
      <h3>Medals</h3>
      <div className="stats">
        {MEDALS.map((m) => (
          <div key={m.id} className={"stat medal" + (S.ach[m.id] ? " on" : "")}>
            <b>{m.icon}</b>
            {m.name}
            <br />
            <small className="hint">{m.desc}</small>
          </div>
        ))}
      </div>
      <h3>Recent matches</h3>
      {S.hist.length ? (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Level</th>
              <th>Result</th>
              <th>Accuracy</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {S.hist.map((h, i) => (
              <tr key={i}>
                {h.map((x, j) => (
                  <td key={j}>{x}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="hint">No matches yet. Play one to fill this in.</p>
      )}
    </HubCard>
  );
}
