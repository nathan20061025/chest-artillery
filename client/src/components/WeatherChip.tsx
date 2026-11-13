import { useEffect, useState } from "react";
import { gameApi } from "../api/server";

/** Real wind from the server (Open-Meteo). Flavour only: the game's wind stays random. Hidden if the server has no weather. */
export function WeatherChip() {
  const [w, setW] = useState<Awaited<ReturnType<typeof gameApi.wind>> | null>(null);
  useEffect(() => {
    let live = true;
    gameApi.wind().then((x) => live && setW(x)).catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  if (!w) return null;
  return (
    <p>
      <span className="chip" id="weather" title="Real weather from Open-Meteo. It does not change the game.">
        🌬 Wind today in {w.location}: {Math.round(w.windKmh)} km/h from {w.compass}
      </span>
    </p>
  );
}
