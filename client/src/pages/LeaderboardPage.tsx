import { useState } from "react";
import { HubCard } from "../components/Screen";
import { accuracy } from "../game/progress";
import { useGame } from "../state/GameContext";

type Row = { name: string; acc: number; wins: number; me?: boolean };

/* Placeholder rivals. GET /api/leaderboard will replace these. */
const OTHERS: Row[] = [
  { name: "Marina", acc: 94, wins: 31 },
  { name: "Kasun", acc: 88, wins: 24 },
  { name: "Dinuka", acc: 74, wins: 12 },
  { name: "Hasini", acc: 70, wins: 6 },
];

export default function LeaderboardPage() {
  const { S } = useGame();
  const [by, setBy] = useState<"acc" | "wins">("acc");
  const me: Row = { name: S.name, acc: accuracy(S.cor, S.ans), wins: S.w, me: true };
  const rows = [...OTHERS, me].sort((a, b) => (by === "wins" ? b.wins - a.wins : b.acc - a.acc));

  return (
    <HubCard id="board" title="Leaderboard" sub="Top captains this week.">
      <div className="tabs">
        <button className={by === "acc" ? "on" : ""} onClick={() => setBy("acc")}>
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
          {rows.map((r, i) => (
            <tr key={r.name + i} className={r.me ? "me" : ""}>
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
