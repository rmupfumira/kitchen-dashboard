import { useRef, useState } from "react";
import { useHA } from "./ha/HaContext";
import Rail from "./components/Rail";
import TopClock from "./components/TopClock";
import TopWeather from "./components/TopWeather";
import TopAlerts from "./components/TopAlerts";
import SecurityCard from "./components/SecurityCard";
import SecurityDrawer from "./components/SecurityDrawer";
import CamerasCard from "./components/CamerasCard";
import KitchenCard from "./components/KitchenCard";
import SolarCard from "./components/SolarCard";
import MediaCard from "./components/MediaCard";
import ClimateCard from "./components/ClimateCard";
import ScenesBar from "./components/ScenesBar";
import LightingView from "./components/LightingView";
import WeatherView from "./components/WeatherView";
import Toast from "./components/Toast";
import OfflineOverlay from "./components/OfflineOverlay";

/**
 * Luxury Gold kitchen command center — glanceable build.
 *
 * Home view (single screen, designed for 3-5m viewing):
 *   TOP    Clock · Weather (temp + condition, tap → detail) · Alerts
 *   MID    [Security compact + Cameras] · Kitchen lighting (big ON/OFF + LED nav)
 *   LOWER  Solar (battery hero) · Media · Air Conditioner
 *   FOOT   Scenes (large quick-action targets)
 *
 * Sub-views replace the band layout:
 *   "lighting" — WLED control (brightness/colour/effects/strips)
 *   "weather"  — full conditions + 7-day forecast
 */
export default function App() {
  const { status, error, retry } = useHA();
  const [subview, setSubview] = useState(null); // null | "lighting" | "weather"
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const fireToast = (icon, msg) => {
    setToast({ icon, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const railPick = (id, label) => {
    if (id === "kitchen") setSubview(null);
    else fireToast("sparkles", `${label} — coming soon`);
  };

  return (
    <div className="lux-app">
      <Rail view={subview ? "" : "kitchen"} onPick={railPick} />

      <div className="lux-main">
        {subview === "lighting" ? (
          <LightingView onBack={() => setSubview(null)} onToast={fireToast} />
        ) : subview === "weather" ? (
          <WeatherView onBack={() => setSubview(null)} />
        ) : (
          <>
            <div className="lux-top">
              <TopClock />
              <TopWeather onOpen={() => setSubview("weather")} />
              <TopAlerts />
            </div>

            <div className="lux-mid">
              <div className="mid-left">
                <SecurityCard onToast={fireToast} onDetails={() => setDrawerOpen(true)} />
                <CamerasCard />
              </div>
              <KitchenCard onToast={fireToast} onOpenLighting={() => setSubview("lighting")} />
            </div>

            <div className="lux-low">
              <SolarCard />
              <MediaCard onToast={fireToast} />
              <ClimateCard onToast={fireToast} />
            </div>

            <ScenesBar onToast={fireToast} />
          </>
        )}
      </div>

      <SecurityDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onToast={fireToast} />
      <Toast toast={toast} />
      <OfflineOverlay status={status} error={error} onRetry={retry} />
    </div>
  );
}
