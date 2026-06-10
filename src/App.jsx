import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";

import {
  rooms,
  devicesByRoom,
  climateByRoom,
  weather as mockWeather,
  inverter as mockInverter,
  music,
  doorbell as doorbellInit,
  scenes,
  security as securityInit,
  deviceIcon,
} from "./data";
import { applyAccent } from "./lib/accent";

import Rail from "./components/Rail";
import Header from "./components/Header";
import SectionLabel from "./components/SectionLabel";
import ClimateCard from "./components/ClimateCard";
import EnergyCard from "./components/EnergyCard";
import WeatherCard from "./components/WeatherCard";
import NowPlaying from "./components/NowPlaying";
import DoorbellCard from "./components/DoorbellCard";
import SceneStrip from "./components/SceneStrip";
import AccessCard from "./components/AccessCard";
import DeviceCard from "./components/DeviceCard";
import Toast from "./components/Toast";
import AccentPicker from "./components/AccentPicker";
import OfflineOverlay from "./components/OfflineOverlay";

import { useHA, useEntity, useEntities } from "./ha/HaContext";
import { callService } from "./ha/callService";
import { HA_ENTITIES } from "./ha/entityMap";
import {
  weatherFromEntity,
  inverterFromSensors,
  securityFromEntities,
  doorbellFromEntities,
} from "./ha/mappers";

const clone = (o) => JSON.parse(JSON.stringify(o));

/* ─── localStorage helpers ──────────────────────────────────────── */
const LS_THEME = "nocturne.theme";
const LS_ACCENT = "nocturne.accent";

function readTheme() {
  const v = localStorage.getItem(LS_THEME);
  return v === "light" ? false : true; // default dark
}
function readAccent() {
  return localStorage.getItem(LS_ACCENT) || "#5fe3b0";
}

/* ─── scene side-effects ────────────────────────────────────────── */
const SCENE_CLIMATE_PATCH = {
  morning: { brightness: 70, mode: "auto" },
  focus: { brightness: 90, mode: "cool", target: 22 },
  movie: { brightness: 15, mode: "cool" },
  dinner: { brightness: 45, mode: "fan" },
  guest: { brightness: 60, mode: "auto" },
  away: { brightness: 0 },
  night: { brightness: 0, target: 19 },
};

export default function App() {
  /* ─── theme + accent ──────────────────────────────────────────── */
  const [dark, setDark] = useState(readTheme);
  const [accent, setAccent] = useState(readAccent);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    applyAccent(accent, dark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    const root = document.documentElement;
    root.classList.add("theme-anim-off");
    root.setAttribute("data-theme", next ? "dark" : "light");
    applyAccent(accent, next);
    setDark(next);
    localStorage.setItem(LS_THEME, next ? "dark" : "light");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-anim-off"))
    );
  };

  const pickAccent = (hex) => {
    const root = document.documentElement;
    root.classList.add("theme-anim-off");
    setAccent(hex);
    applyAccent(hex, dark);
    localStorage.setItem(LS_ACCENT, hex);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-anim-off"))
    );
  };

  /* ─── routing-ish state ───────────────────────────────────────── */
  const [view, setView] = useState("dashboard");
  const [room, setRoom] = useState("living");
  const [query, setQuery] = useState("");

  /* ─── HA connection ───────────────────────────────────────────── */
  const { status: haStatus, conn, error: haError, retry } = useHA();

  /* ─── mock entity state (used until HA values land) ───────────── */
  /* These are still useful: device-grid toggles for now (until we wire light/
   * switch domains per room), kitchen mood, music transport (until media_player
   * is wired). The mock layer ALSO acts as the visible state when HA is offline
   * so the UI doesn't crash. */
  const [devices, setDevices] = useState(() => clone(devicesByRoom));
  const [climate, setClimate] = useState(() => clone(climateByRoom));
  const [securityMock, setSecurityMock] = useState(() => ({ ...securityInit }));
  const [doorbellMock, setDoorbellMock] = useState(doorbellInit);
  const [activeScene, setActiveScene] = useState(null);

  /* ─── music ───────────────────────────────────────────────────── */
  const [musicState, setMusicState] = useState({ idx: 0, playing: true, progress: 48 });
  const patchMusic = (patch) => setMusicState((s) => ({ ...s, ...patch }));

  /* ─── toast ───────────────────────────────────────────────────── */
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const fireToast = (icon, msg) => {
    setToast({ icon, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  /* ─── HA-driven derived state ─────────────────────────────────── */
  const weatherEnt = useEntity(HA_ENTITIES.weather);
  const [solarS, batteryS, gridS, loadS] = useEntities(
    HA_ENTITIES.power.solar,
    HA_ENTITIES.power.battery,
    HA_ENTITIES.power.grid,
    HA_ENTITIES.power.load
  );
  const [garageS, gateS, outdoorS, indoorS] = useEntities(
    HA_ENTITIES.security.garage,
    HA_ENTITIES.security.gate,
    HA_ENTITIES.security.outdoorAlarm,
    HA_ENTITIES.security.indoorAlarm
  );
  const [ringingFlag, doorbellCam] = useEntities(
    HA_ENTITIES.doorbell?.ringingFlag,
    HA_ENTITIES.doorbell?.camera
  );

  const liveWeather = useMemo(() => weatherFromEntity(weatherEnt), [weatherEnt]);
  const liveInverter = useMemo(
    () => inverterFromSensors({ solar: solarS, battery: batteryS, grid: gridS, load: loadS }),
    [solarS, batteryS, gridS, loadS]
  );
  const liveSecurity = useMemo(
    () => securityFromEntities({ garage: garageS, gate: gateS, outdoorAlarm: outdoorS, indoorAlarm: indoorS }),
    [garageS, gateS, outdoorS, indoorS]
  );
  const liveDoorbell = useMemo(
    () => doorbellFromEntities({ ringingFlag, camera: doorbellCam }),
    [ringingFlag, doorbellCam]
  );

  // Prefer live data where it exists, fall back to mock otherwise.
  const weatherView = liveWeather || mockWeather;
  const inverterView = liveInverter || mockInverter;
  const securityView = haStatus === "connected" && liveSecurity ? liveSecurity : securityMock;
  const doorbellView = haStatus === "connected" && liveDoorbell ? liveDoorbell : doorbellMock;

  /* ─── derived ─────────────────────────────────────────────────── */
  const roomName = rooms.find((r) => r.id === room)?.name ?? "—";
  const cl = climate[room];
  const q = query.trim().toLowerCase();
  const visibleDevices = useMemo(
    () =>
      (devices[room] ?? []).filter(
        (d) => !q || d.name.toLowerCase().includes(q) || d.model.toLowerCase().includes(q)
      ),
    [devices, room, q]
  );

  /* ─── action handlers ─────────────────────────────────────────── */
  const toggleDevice = (rid, did) => {
    setDevices((prev) => {
      const next = clone(prev);
      const dev = next[rid].find((d) => d.id === did);
      dev.on = !dev.on;
      fireToast(dev.on ? "power" : "power-off", `${dev.name} ${dev.on ? "on" : "off"}`);
      return next;
    });
    /* TODO Phase 4b: look up HA_ENTITIES.devices[rid][did] and call
     * light.turn_on / switch.toggle / etc. via callService(conn, …) */
  };

  const patchClimate = (patch) =>
    setClimate((prev) => ({ ...prev, [room]: { ...prev[room], ...patch } }));

  /**
   * Toggle a security/access slot. When connected, fire the actual HA service
   * (cover.toggle / alarm_control_panel.alarm_arm_*); fall back to optimistic
   * mock toggle otherwise. The state subscription will overwrite our local
   * mock state on the next push.
   */
  const toggleSec = (key, onMsg, offMsg, icon) => {
    const haEntityId = HA_ENTITIES.security[key];
    const willBeOn = !securityView[key];

    if (haStatus === "connected" && conn && haEntityId) {
      if (key === "garage" || key === "gate") {
        callService(conn, "cover", willBeOn ? "open_cover" : "close_cover", {}, { entity_id: haEntityId });
      } else {
        callService(
          conn,
          "alarm_control_panel",
          willBeOn ? "alarm_arm_away" : "alarm_disarm",
          {},
          { entity_id: haEntityId }
        );
      }
    } else {
      // Offline → keep the UI responsive.
      setSecurityMock((s) => ({ ...s, [key]: willBeOn }));
    }
    fireToast(icon, willBeOn ? onMsg : offMsg);
  };

  const runScene = (s) => {
    setActiveScene(s.id);
    const patch = SCENE_CLIMATE_PATCH[s.id];
    if (patch) patchClimate(patch);
    if (s.id === "away" || s.id === "night") {
      setSecurityMock((sec) => ({ ...sec, outdoorAlarm: true, indoorAlarm: true }));
    }
    if (s.id === "guest") setSecurityMock((sec) => ({ ...sec, indoorAlarm: false }));
    // If a real HA scene/script is mapped, fire it.
    const haScene = HA_ENTITIES.scenes?.[s.id];
    if (haStatus === "connected" && conn && haScene) {
      const [domain] = haScene.split(".");
      callService(conn, domain, "turn_on", {}, { entity_id: haScene });
    }
    fireToast("sparkles", `${s.name} scene activated`);
  };

  /**
   * Front-door unlock — when connected, fires lock.unlock on the configured
   * lock entity. Always clears the ringing flag locally.
   */
  const unlockDoor = () => {
    setDoorbellMock((d) => ({ ...d, ringing: false }));
    const lockId = HA_ENTITIES.doorbell?.lock;
    if (haStatus === "connected" && conn && lockId) {
      callService(conn, "lock", "unlock", {}, { entity_id: lockId });
    }
    fireToast("lock-open", "Front door unlocked");
  };

  const railPick = (id, label) => {
    if (id === "dashboard") {
      setView(id);
    } else {
      fireToast(
        id === "cameras" ? "cctv" : id === "scenes" ? "sparkles" : "zap",
        `${label} view — coming soon`
      );
    }
  };

  /* ─── render ──────────────────────────────────────────────────── */
  return (
    <div className="app">
      <Rail view={view} onPick={railPick} />

      <div className="main">
        <Header
          roomName={roomName}
          query={query}
          onQuery={setQuery}
          dark={dark}
          onToggleTheme={toggleTheme}
          haStatus={haStatus}
        />

        <div className="board">
          <div className="grid">
            <ClimateCard
              roomName={roomName}
              climate={cl}
              onPatch={patchClimate}
              onToast={fireToast}
            />
            <EnergyCard inverter={inverterView} />
            <WeatherCard weather={weatherView} />

            <NowPlaying
              music={music}
              state={musicState}
              onSet={patchMusic}
              onNext={() =>
                setMusicState((s) => ({
                  ...s,
                  idx: (s.idx + 1) % music.queue.length,
                  progress: 0,
                }))
              }
              onPrev={() =>
                setMusicState((s) => ({
                  ...s,
                  idx: (s.idx - 1 + music.queue.length) % music.queue.length,
                  progress: 0,
                }))
              }
              onTogglePlay={() => setMusicState((s) => ({ ...s, playing: !s.playing }))}
            />
            <DoorbellCard
              doorbell={doorbellView}
              ringing={doorbellView.ringing}
              onUnlock={unlockDoor}
              onTalk={() => {
                setDoorbellMock((d) => ({ ...d, ringing: false }));
                fireToast("mic", "Two-way audio connected");
              }}
              onDismiss={() => {
                setDoorbellMock((d) => ({ ...d, ringing: false }));
                fireToast("bell-off", "Doorbell dismissed");
              }}
            />

            <SectionLabel>Scenes</SectionLabel>
            <SceneStrip scenes={scenes} active={activeScene} onRun={runScene} />

            <SectionLabel>Security &amp; Access</SectionLabel>
            <AccessCard
              icon="warehouse"
              name="Garage Door"
              on={securityView.garage}
              onLabel="Open"
              offLabel="Closed"
              tone="var(--c-solar)"
              onToggle={() => toggleSec("garage", "Garage opening", "Garage closing", "warehouse")}
            />
            <AccessCard
              icon="fence"
              name="Front Gate"
              on={securityView.gate}
              onLabel="Open"
              offLabel="Closed"
              tone="var(--c-solar)"
              onToggle={() => toggleSec("gate", "Gate opening", "Gate closing", "fence")}
            />
            <AccessCard
              icon="siren"
              name="Outdoor Alarm"
              on={securityView.outdoorAlarm}
              onLabel="Armed"
              offLabel="Disarmed"
              tone="var(--alert)"
              onToggle={() =>
                toggleSec("outdoorAlarm", "Outdoor alarm armed", "Outdoor alarm disarmed", "siren")
              }
            />
            <AccessCard
              icon="shield"
              name="Indoor Alarm"
              on={securityView.indoorAlarm}
              onLabel="Armed"
              offLabel="Disarmed"
              tone="var(--alert)"
              onToggle={() =>
                toggleSec("indoorAlarm", "Indoor alarm armed", "Indoor alarm disarmed", "shield")
              }
            />

            <SectionLabel
              right={
                <div className="tabs">
                  {rooms.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={"tab" + (room === r.id ? " on" : "")}
                      onClick={() => setRoom(r.id)}
                    >
                      {r.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="tab-add"
                    onClick={() => fireToast("plus", "Pair a new room in Home Assistant")}
                    aria-label="Add room"
                  >
                    <Plus size={14} strokeWidth={2.4} />
                  </button>
                </div>
              }
            >
              {roomName} // Devices
            </SectionLabel>

            {visibleDevices.map((d) => (
              <DeviceCard
                key={d.id}
                dev={d}
                icon={deviceIcon[d.type] ?? "plug"}
                onToggle={() => toggleDevice(room, d.id)}
              />
            ))}
            {visibleDevices.length === 0 && (
              <div className="empty">No devices match “{query}”.</div>
            )}
          </div>
        </div>
      </div>

      <Toast toast={toast} />
      <AccentPicker accent={accent} onPick={pickAccent} />
      <OfflineOverlay status={haStatus} error={haError} onRetry={retry} />
    </div>
  );
}
