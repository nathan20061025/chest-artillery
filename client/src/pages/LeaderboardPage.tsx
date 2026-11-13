import { useEffect, useState } from "react";
import { gameApi } from "../api/server";
import { HubCard } from "../components/Screen";
import { accuracy } from "../game/progress";
import { useGame } from "../state/GameContext";

type Row = { name: string; acc: number; wins: number };

/* shown only if the API cannot be reached */
const OFFLINE: Row[] = [
  { name: "Marina", acc: 94, wins: 31 },
  { name: "Kasun", acc: 88, wins: 24 },
  { name: "Dinuka", acc: 74, wins: 12 },
  { name: "Hasini", acc: 70, wins: 6 },
];

export default function LeaderboardPage() {
  const { S, authed } = useGame();
  const [by, setBy] = useState<"accuracy" | "wins">("accuracy");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let live = true;
    gameApi
      .leaderboard(by)
      .then((r) => live && (setRows(r.map((x) => ({ name: x.username, acc: x.accuracyPct, wins: x.wins }))), setOffline(false)))
      .catch(() => live && setOffline(true));
    return () => {
      live = false;
    };
  }, [by]);

  const list = offline
    ? [...OFFLINE, { name: S.name, acc: accuracy(S.cor, S.ans), wins: S.w }].sort((a, b) => (by === "wins" ? b.wins - a.wins : b.acc - a.acc))
    : (rows ?? []);

  return (
    <HubCard id="board" title="Leaderboard" sub={offline ? "Server offline: showing sample captains." : "Top captains of all time."}>
      <div className="tabs">
        <button className={by === "accuracy" ? "on" : ""} onClick={() => setBy("accuracy")}>
          Accuracy
        </button>
        <button className={by === "wins" ? "on" : ""} onClick={() => setBy("wins")}>
          Wins
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Captain</th>
            <th>Accuracy</th>
            <th>Wins</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={r.name + i} className={authed && r.name === S.name ? "me" : ""}>
              <td>{i + 1}</td>
              <td>{r.name}</td>
              <td>{r.acc}%</td>
              <td>{r.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </HubCard>
  );
}
