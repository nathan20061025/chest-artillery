import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { Bubbles, Splash, Toast } from "./components/Effects";
import { Header } from "./components/Header";
import { startAmbient } from "./game/sound";
import EndPage from "./pages/EndPage";
import HowPage from "./pages/HowPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import LeaderboardPage from "./pages/LeaderboardPage";
import LevelsPage from "./pages/LevelsPage";
import MatchPage from "./pages/MatchPage";
import MenuPage from "./pages/MenuPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ShopPage from "./pages/ShopPage";
import StartPage from "./pages/StartPage";
import { useGame } from "./state/GameContext";
import { calm } from "./state/hooks";

export default function App() {
  const { toastMsg } = useGame();
  const { pathname } = useLocation();
  const [mapOpen, setMapOpen] = useState(false);

  /* sea ambience needs a user gesture first */
  useEffect(() => {
    const go = () => startAmbient();
    addEventListener("pointerdown", go, { once: true });
    addEventListener("keydown", go, { once: true });
    return () => {
      removeEventListener("pointerdown", go);
      removeEventListener("keydown", go);
    };
  }, []);

  /* button ripple */
  useEffect(() => {
    if (calm) return;
    const onDown = (e: PointerEvent) => {
      const b = (e.target as Element | null)?.closest?.("button,.btn") as HTMLElement | null;
      if (!b || (b as HTMLButtonElement).disabled) return;
      const r = b.getBoundingClientRect();
      const d = Math.max(r.width, r.height) * 2;
      const s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s);
      setTimeout(() => s.remove(), 650);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Bubbles />
      <Splash />
      <Header mapOpen={mapOpen} onToggleMap={() => setMapOpen((o) => !o)} />
      <main>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/levels" element={<LevelsPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/end" element={<EndPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/how" element={<HowPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast message={toastMsg} />
    </>
  );
}
