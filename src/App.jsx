import { useRef, useState } from "react";
import { useHA } from "./ha/HaContext";
import Rail from "./components/Rail";
import TopClock from "./components/TopClock";
import TopWeather from "./components/TopWeather";
import TopAlerts from "./components/TopAlerts";
import SecurityCard from "./components/SecurityCard";
import KitchenCard from "./components/KitchenCard";
import CamerasCard from "./components/CamerasCard";
import SolarCard from "./components/SolarCard";
import MediaCard from "./components/MediaCard";
import ClimateCard from "./components/ClimateCard";
import ScenesBar from "./components/ScenesBar";
import Toast from "./components/Toast";
import OfflineOverlay from "./components/OfflineOverlay";

/**
 * Luxury Gold kitchen command center.
 *
 * Single screen, no scrolling — the shell grid divides 100vh:
 *   TOP:    Clock (320) · Weather+forecast (flex) · Alerts (380)
 *   MID:    Security (320) · Kitchen Lighting hero (flex) · Cameras (380)
 *   LOWER:  Solar+flow · Media · Air Conditioner
 *   FOOTER: Scenes bar
 */
export default function App() {
  const { status, error, retry } = useHA();
  const [view, setView] = useState("kitchen");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const fireToast = (icon, msg) => {
    setToast({ icon, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const railPick = (id, label) => {
    if (id === "kitchen") setView(id);
    else fireToast("sparkles", `${label} — coming soon`);
  };

  return (
    <div className="lux-app">
      <Rail view={view} onPick={railPick} />

      <div className="lux-main">
        <div className="lux-top">
          <TopClock />
          <TopWeather />
          <TopAlerts />
        </div>

        <div className="lux-mid">
          <SecurityCard onToast={fireToast} />
          <KitchenCard onToast={fireToast} />
          <CamerasCard />
        </div>

        <div className="lux-low">
          <SolarCard />
          <MediaCard onToast={fireToast} />
          <ClimateCard onToast={fireToast} />
        </div>

        <ScenesBar onToast={fireToast} />
      </div>

      <Toast toast={toast} />
      <OfflineOverlay status={status} error={error} onRetry={retry} />
    </div>
  );
}
