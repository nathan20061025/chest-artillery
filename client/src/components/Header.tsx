import { Link, NavLink, useLocation } from "react-router";
import { ROUTES } from "../game/data";
import { useGame } from "../state/GameContext";
import { PopChip } from "./PopChip";

const PUBLIC = ["/", "/login", "/register"];

export function Header({ mapOpen, onToggleMap }: { mapOpen: boolean; onToggleMap: () => void }) {
  const { S, update } = useGame();
  const { pathname } = useLocation();
  const loggedIn = !PUBLIC.includes(pathname);

  return (
    <>
      <header>
        <Link className="brand" to="/">
          ⚓ Chest Artillery
        </Link>
        <PopChip id="coin" text={"🪙 " + S.coins} hidden={!loggedIn} />
        <span className="chip ok" id="who" hidden={!loggedIn}>
          {"👤 " + S.name}
        </span>
        <button
          id="snd"
          title="Sound"
          onClick={() => update((s) => ({ ...s, snd: s.snd ? 0 : 1 }))}
        >
          {S.snd ? "🔊" : "🔇"}
        </button>
        <button id="mapBtn" aria-expanded={mapOpen} onClick={onToggleMap}>
          Map
        </button>
        <Link className="btn" id="home" to="/menu" hidden={!loggedIn || pathname === "/menu"}>
          Menu
        </Link>
      </header>
      <nav className={"flow" + (mapOpen ? " on" : "")} id="flow" aria-label="Navigation map">
        {ROUTES.map((r) => (
          <NavLink key={r.path} to={r.path} end className={({ isActive }) => (isActive ? "on" : "")}>
            {r.name}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
