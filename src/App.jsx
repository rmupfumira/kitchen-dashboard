import { useEffect, useRef, useState } from "react";
import { useHA } from "./ha/HaContext";
import { useWakeRefresh } from "./ha/useWakeRefresh";
import { useIdle } from "./useIdle";
import { useSettings } from "./useSettings";
import { ENTITIES, ALERT_SENSORS } from "./entities";
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
import WeatherModal from "./components/WeatherModal";
import GuestWifi from "./components/GuestWifi";
import Screensaver from "./components/Screensaver";
import DoorbellOverlay from "./components/DoorbellOverlay";
import GuestModeAlert from "./components/GuestModeAlert";
import VacuumView from "./components/VacuumView";
import PowerView from "./components/PowerView";
import GeyserView from "./components/GeyserView";
import IrrigationView from "./components/IrrigationView";
import PoolView from "./components/PoolView";
import CamerasView from "./components/CamerasView";
import TinotendaView from "./components/TinotendaView";
import HomeView from "./components/HomeView";
import AmbienceView from "./components/AmbienceView";
import SettingsView from "./components/SettingsView";
import Toast from "./components/Toast";
import OfflineOverlay from "./components/OfflineOverlay";

/**
 * Luxury Gold command center.
 *
 * Two kinds of views, chosen from the left rail:
 *   • Room dashboards (kitchen / living / tinotenda) — the 3-column layout
 *     (Cameras │ Lighting + Climate + Security │ Power + Laundry + Media + Scenes).
 *   • System views (vacuum / power / geyser / irrigation / pool / cameras) —
 *     dedicated full-page components under the shared status bar.
 */
const VIEW_PATH = {
  home: "/",
  kitchen: "/kitchen",
  living: "/living-room",
  tinotenda: "/tinotenda",
  vacuum: "/vacuum",
  power: "/power",
  geyser: "/geyser",
  irrigation: "/irrigation",
  pool: "/swimming-pool",
  cameras: "/cameras",
  settings: "/settings",
};
const ROUTES = Object.fromEntries(Object.entries(VIEW_PATH).map(([v, p]) => [p, v]));
const ROOM_VIEWS = ["kitchen", "living"];

function viewFromPath() {
  const p = window.location.pathname.replace(/\/+$/, "") || "/";
  return ROUTES[p] || "home";
}

const SYSTEM_VIEWS = {
  tinotenda: TinotendaView,
  vacuum: VacuumView,
  power: PowerView,
  geyser: GeyserView,
  irrigation: IrrigationView,
  pool: PoolView,
  cameras: CamerasView,
  settings: SettingsView,
};

export default function App() {
  const { status, error, retry, entities } = useHA();
  const [view, setView] = useState(viewFromPath); // see VIEW_PATH
  const [subview, setSubview] = useState(null); // null | "lighting" (room views only)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wifiOpen, setWifiOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  // Back/forward navigation between views.
  useEffect(() => {
    const onPop = () => {
      setView(viewFromPath());
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
    setView(viewFromPath());
    setSubview(null);
  };

  const railPick = (id) => navigate(VIEW_PATH[id] || "/");

  const isHome = view === "home";
  const isRoom = ROOM_VIEWS.includes(view);
  const SystemView = SYSTEM_VIEWS[view];
  const climate = ENTITIES.climate[view]; // present for living/tinotenda → AC; absent for kitchen → geyser

  // Self-heal a long-running panel: reload on staleness + on room motion.
  useWakeRefresh(view in ENTITIES.wake ? ENTITIES.wake[view] : ENTITIES.wake._default);

  // Idle clock screensaver — suppressed while a critical alert is active (so an
  // emergency is never hidden) or the doorbell is ringing (so the visitor
  // takeover shows the dashboard, not the clock, afterwards).
  const criticalAlert = ALERT_SENSORS.some((s) => s.class === "critical" && entities[s.id]?.state === "on");
  const doorbellRinging = entities[ENTITIES.doorbell.ringing]?.state === "on";
  const { settings } = useSettings();
  const idleMs = Math.max(15, settings.screensaverTimeoutSec || 120) * 1000;
  const [idle, wake] = useIdle(idleMs, { inhibit: !settings.screensaver || criticalAlert || doorbellRinging });

  return (
    <div className="lux-app">
      <Rail view={subview ? "" : view} onPick={railPick} onWifi={() => setWifiOpen(true)} />

      <div className={"lux-main" + (isHome || view === "kitchen" ? " home-main" : isRoom ? "" : " system")}>
        {subview === "lighting" ? (
          <LightingView onBack={() => setSubview(null)} onToast={fireToast} />
        ) : isHome ? (
          <HomeView
            name="Mupfumira"
            onToast={fireToast}
            onOpenSecurity={() => setDrawerOpen(true)}
            navigate={navigate}
          />
        ) : view === "kitchen" ? (
          <AmbienceView onToast={fireToast} />
        ) : (
          <>
            <StatusBar
              onOpenWeather={() => setWeatherOpen(true)}
              onOpenSecurity={() => setDrawerOpen(true)}
              onToast={fireToast}
            />

            {isRoom ? (
              <>
                <div className="lux-grid">
                  <div className="lux-col">
                    <CamerasCard onToast={fireToast} />
                  </div>

                  <div className="lux-col">
                    <SecurityControls onToast={fireToast} />
                    {climate ? (
                      <ClimateCard acEntity={climate.ac} tempEntity={climate.temp} onToast={fireToast} />
                    ) : (
                      <GeyserCard onToast={fireToast} />
                    )}
                    <LightingCard
                      config={ENTITIES.lighting[view]}
                      onToast={fireToast}
                      onOpenLighting={() => setSubview("lighting")}
                    />
                  </div>

                  <div className="lux-col">
                    <SolarCard />
                    <LaundryCard />
                    <MediaCard onToast={fireToast} />
                  </div>
                </div>

                <ScenesBar onToast={fireToast} />
              </>
            ) : (
              SystemView && <SystemView onToast={fireToast} />
            )}
          </>
        )}
      </div>

      <SecurityDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onToast={fireToast} />
      <GuestWifi open={wifiOpen} onClose={() => setWifiOpen(false)} />
      <WeatherModal open={weatherOpen} onClose={() => setWeatherOpen(false)} />
      <Toast toast={toast} />
      <OfflineOverlay status={status} error={error} onRetry={retry} />
      {idle && <Screensaver onWake={wake} />}
      <DoorbellOverlay onToast={fireToast} />
      <GuestModeAlert onToast={fireToast} />
    </div>
  );
}
