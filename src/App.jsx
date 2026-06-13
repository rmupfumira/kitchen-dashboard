import { useRef, useState } from "react";
import { useHA } from "./ha/HaContext";
import Rail from "./components/Rail";
import StatusBar from "./components/StatusBar";
import SecurityDrawer from "./components/SecurityDrawer";
import CamerasCard from "./components/CamerasCard";
import KitchenCard from "./components/KitchenCard";
import SolarCard from "./components/SolarCard";
import MediaCard from "./components/MediaCard";
import GeyserCard from "./components/GeyserCard";
import SecurityControls from "./components/SecurityControls";
import ScenesBar from "./components/ScenesBar";
import LightingView from "./components/LightingView";
import WeatherView from "./components/WeatherView";
import Toast from "./components/Toast";
import OfflineOverlay from "./components/OfflineOverlay";

/**
 * Luxury Gold kitchen command center — control-panel layout.
 *
 *   STATUS BAR   time · weather · home · alerts          (one compact strip)
 *   ZONE GRID    Cameras │ Lighting + Air Con │ Solar + Media
 *   SCENES       Good Morning · Night · Guest · Movie     (large action cards)
 *
 * Security lives in the status bar (status + Secure) and a slide-out drawer.
 * LED strips + weather detail are dedicated sub-views.
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
            <StatusBar
              onOpenWeather={() => setSubview("weather")}
              onOpenSecurity={() => setDrawerOpen(true)}
              onToast={fireToast}
            />

            <div className="lux-grid">
              <div className="lux-col">
                <CamerasCard onToast={fireToast} />
              </div>

              <div className="lux-col">
                <KitchenCard onToast={fireToast} onOpenLighting={() => setSubview("lighting")} />
                <GeyserCard onToast={fireToast} />
                <SecurityControls onToast={fireToast} />
              </div>

              <div className="lux-col">
                <SolarCard />
                <MediaCard onToast={fireToast} />
              </div>
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
