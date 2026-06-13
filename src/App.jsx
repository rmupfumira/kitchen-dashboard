import { useEffect, useRef, useState } from "react";
import { useHA } from "./ha/HaContext";
import { ENTITIES } from "./entities";
import Rail from "./components/Rail";
import StatusBar from "./components/StatusBar";
import SecurityDrawer from "./components/SecurityDrawer";
import CamerasCard from "./components/CamerasCard";
import LightingCard from "./components/LightingCard";
import SolarCard from "./components/SolarCard";
import MediaCard from "./components/MediaCard";
import LaundryCard from "./components/LaundryCard";
import GeyserCard from "./components/GeyserCard";
import ClimateCard from "./components/ClimateCard";
import SecurityControls from "./components/SecurityControls";
import ScenesBar from "./components/ScenesBar";
import LightingView from "./components/LightingView";
import WeatherView from "./components/WeatherView";
import GuestWifi from "./components/GuestWifi";
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
/* Map URL path → room id. Add more rooms here as their pages are built. */
const ROUTES = { "/living-room": "living" };
function roomFromPath() {
  const p = window.location.pathname.replace(/\/+$/, "") || "/";
  return ROUTES[p] || "kitchen";
}

export default function App() {
  const { status, error, retry } = useHA();
  const [room, setRoom] = useState(roomFromPath); // "kitchen" | "living"
  const [subview, setSubview] = useState(null); // null | "lighting" | "weather"
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wifiOpen, setWifiOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Back/forward navigation between room pages.
  useEffect(() => {
    const onPop = () => {
      setRoom(roomFromPath());
      setSubview(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const fireToast = (icon, msg) => {
    setToast({ icon, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const navigate = (path) => {
    if (window.location.pathname.replace(/\/+$/, "") !== path.replace(/\/+$/, "")) {
      window.history.pushState({}, "", path);
    }
    setRoom(roomFromPath());
    setSubview(null);
  };

  const railPick = (id, label) => {
    if (id === "kitchen") navigate("/");
    else if (id === "living") navigate("/living-room");
    else fireToast("sparkles", `${label} — coming soon`);
  };

  return (
    <div className="lux-app">
      <Rail view={subview ? "" : room} onPick={railPick} onWifi={() => setWifiOpen(true)} />

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
                <LightingCard
                  config={ENTITIES.lighting[room]}
                  onToast={fireToast}
                  onOpenLighting={() => setSubview("lighting")}
                />
                {room === "living" ? (
                  <ClimateCard
                    acEntity={ENTITIES.climate.living.ac}
                    tempEntity={ENTITIES.climate.living.temp}
                    onToast={fireToast}
                  />
                ) : (
                  <GeyserCard onToast={fireToast} />
                )}
                <SecurityControls onToast={fireToast} />
              </div>

              <div className="lux-col">
                <SolarCard />
                <LaundryCard />
                <MediaCard onToast={fireToast} />
              </div>
            </div>

            <ScenesBar onToast={fireToast} />
          </>
        )}
      </div>

      <SecurityDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onToast={fireToast} />
      <GuestWifi open={wifiOpen} onClose={() => setWifiOpen(false)} />
      <Toast toast={toast} />
      <OfflineOverlay status={status} error={error} onRetry={retry} />
    </div>
  );
}
