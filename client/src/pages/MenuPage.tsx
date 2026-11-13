import { Link } from "react-router";
import { Screen } from "../components/Screen";
import { rank } from "../game/progress";
import { useGame } from "../state/GameContext";

const TILES = [
  { to: "/levels", icon: "🎯", title: "Play campaign", sub: "5 levels, storms and a boss", primary: true },
  { to: "/shop", icon: "🛒", title: "Arsenal", sub: "Upgrades for your cannon" },
  { to: "/profile", icon: "🧭", title: "Profile", sub: "Stats and medals" },
  { to: "/leaderboard", icon: "🏆", title: "Leaderboard", sub: "Best counters first" },
  { to: "/settings", icon: "⚙️", title: "Settings", sub: "Sound, theme, difficulty" },
  { to: "/how", icon: "📖", title: "How to play", sub: "Quick guide" },
  { to: "/", icon: "🚪", title: "Log out", sub: "" },
];

export default function MenuPage() {
  const { S, logout } = useGame();
  return (
    <Screen id="menu">
      <div className="card">
        <h2 id="hi">{`Welcome, ${S.name} · ${rank(S.w)}`}</h2>
        <p className="sub">Choose your next move.</p>
        <div className="tiles" id="mt">
          {TILES.map((t) => (
            <Link key={t.to} className={"btn tile" + (t.primary ? " primary" : "")} to={t.to} onClick={t.title === "Log out" ? logout : undefined}>
              <span className="ic">{t.icon}</span>
              {t.title}
              <small style={t.primary ? { color: "#3b2d08" } : undefined}>{t.sub}</small>
            </Link>
          ))}
        </div>
      </div>
    </Screen>
  );
}
