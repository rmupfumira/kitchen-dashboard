import { useRef, useState } from "react";
import { useHA } from "./ha/HaContext";
import { usePersistentNotifications } from "./ha/usePersistentNotifications";
import Rail from "./components/Rail";
import Header from "./components/Header";
import Toast from "./components/Toast";
import OfflineOverlay from "./components/OfflineOverlay";
import AlertsCard from "./components/AlertsCard";
import ClockCard from "./components/ClockCard";
import WeatherCard from "./components/WeatherCard";
import SecurityCard from "./components/SecurityCard";
import SolarTiles from "./components/SolarTiles";
import ScenesCard from "./components/ScenesCard";
import MediaCard from "./components/MediaCard";
import ClimateCard from "./components/ClimateCard";
import LampCard from "./components/LampCard";
import KitchenCard from "./components/KitchenCard";

/**
 * Aurora dashboard root.
 *
 * Layout (per spec):
 *   Row 1  Alerts                                       (span 12)
 *   Row 2  Doorbell (span 8)        Security (span 4)
 *   Row 3  Solar 4-tile                                 (span 12)
 *   Row 4  Media (span 5)  AC (span 4)  Lamp (span 3)
 *
 * The Rail's non-Home buttons only fire a toast for now — those views are
 * out of scope (explicitly per spec).
 */
export default function App() {
  const { status, error, retry } = useHA();
  const { items: notifs } = usePersistentNotifications();
  const [view, setView] = useState("home");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const fireToast = (icon, msg) => {
    setToast({ icon, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const railPick = (id, label) => {
    if (id === "home") {
      setView(id);
    } else {
      fireToast("sparkles", `${label} — coming soon`);
    }
  };

  return (
    <div className="app">
      <Rail view={view} onPick={railPick} />

      <div className="main">
        <Header haStatus={status} notifCount={notifs.length} />

        <div className="board">
          <div className="grid">
            <AlertsCard />
            <ClockCard />
            <WeatherCard />
            <SecurityCard onToast={fireToast} />
            <SolarTiles />
            <ScenesCard onToast={fireToast} />
            <MediaCard onToast={fireToast} />
            <ClimateCard onToast={fireToast} />
            <LampCard onToast={fireToast} />

            <KitchenCard onToast={fireToast} />
          </div>
        </div>
      </div>

      <Toast toast={toast} />
      <OfflineOverlay status={status} error={error} onRetry={retry} />
    </div>
  );
}
