/**
 * DashboardView — the main per-room dashboard.
 *
 * Composition (from the source design):
 *   row 1: Weather (4) · Doorbell (4) · Music (4)
 *   row 2: Thermostat (6) · Light or Mood (6)
 *   section: Security & Access
 *   row 3: 4 AccessCards (3+3+3+3)
 *   section: Scenes
 *   row 4: ScenesStrip (12)
 *   section: Room · Devices
 *   row 5: DeviceCards (3+3+3+3)
 */
import { Icon } from "@/components/ui/Icon";
import { weather, scenes, rooms, type Scene } from "@/data/mock";
import { useDashboardStore } from "@/state/useDashboardStore";
import { useEntitiesStore } from "@/state/useEntitiesStore";
import { WeatherCard } from "@/components/widgets/WeatherCard";
import { DoorbellCard } from "@/components/widgets/DoorbellCard";
import { MusicCard } from "@/components/widgets/MusicCard";
import { ThermostatCard } from "@/components/widgets/ThermostatCard";
import { LightCard } from "@/components/widgets/LightCard";
import { MoodCard } from "@/components/widgets/MoodCard";
import { AccessCard } from "@/components/widgets/AccessCard";
import { ScenesStrip } from "@/components/widgets/ScenesStrip";
import { DeviceCard } from "@/components/widgets/DeviceCard";
import { SectionLabel } from "@/components/widgets/SectionLabel";

const DOORBELL = { name: "Front Door", location: "Porch · Ding C3" };

const DEVICE_ICON: Record<string, string> = {
  ac: "air-vent",
  tv: "tv",
  light: "lightbulb",
  speaker: "speaker",
  fan: "fan",
  blinds: "blinds",
  plug: "plug",
  fridge: "refrigerator",
  garage: "warehouse",
};

export function DashboardView() {
  const { room, query, activeScene, setActiveScene, fireToast } = useDashboardStore();
  const {
    devices,
    climate,
    security,
    ringing,
    toggleDevice,
    setClimateRoom,
    setSecurity,
    setRinging,
  } = useEntitiesStore();

  const cl = climate[room];
  const lightDev = devices[room]?.find((d) => d.type === "light");
  const lightOn = lightDev?.on ?? true;
  const roomName = rooms.find((r) => r.id === room)?.name ?? "—";

  const q = query.trim().toLowerCase();
  const visibleDevices = (devices[room] ?? []).filter(
    (d) => !q || d.name.toLowerCase().includes(q) || d.model.toLowerCase().includes(q)
  );

  const toggleSec = (
    key: "garage" | "gate" | "outdoorAlarm" | "indoorAlarm",
    onMsg: string,
    offMsg: string,
    icon: string
  ) => {
    const next = !security[key];
    setSecurity(key, next);
    fireToast(icon, next ? onMsg : offMsg);
  };

  const runScene = (s: Scene) => {
    setActiveScene(s.id);
    const patches: Record<string, Partial<typeof cl>> = {
      morning: { brightness: 70, mode: "auto" },
      focus: { brightness: 90, mode: "cool", target: 22 },
      movie: { brightness: 15, mode: "cool" },
      dinner: { brightness: 45, mode: "fan" },
      guest: { brightness: 60, mode: "auto" },
      away: { brightness: 0 },
      night: { brightness: 0, target: 19 },
    };
    if (patches[s.id]) setClimateRoom(room, patches[s.id]);
    if (s.id === "away" || s.id === "night") {
      setSecurity("outdoorAlarm", true);
      setSecurity("indoorAlarm", true);
    }
    if (s.id === "guest") setSecurity("indoorAlarm", false);
    fireToast("sparkles", `${s.name} scene activated`);
  };

  return (
    <div className="grid rise">
      <WeatherCard weather={weather} />

      <DoorbellCard
        doorbell={DOORBELL}
        ringing={ringing}
        onTalk={() => fireToast("mic", "Two-way audio connected")}
        onUnlock={() => {
          setRinging(false);
          fireToast("lock-open", "Front door unlocked");
        }}
        onOpen={() => {
          setRinging(false);
          setSecurity("gate", true);
          fireToast("door-open", "Gate opened for visitor");
        }}
        onDismiss={() => {
          setRinging(false);
          fireToast("bell-off", "Doorbell dismissed");
        }}
      />

      <MusicCard />

      <ThermostatCard
        climate={cl}
        on={true}
        set={(patch) => setClimateRoom(room, patch)}
        toggle={() => {
          /* climate on/off — wired in Phase 4 */
        }}
      />

      {room === "kitchen" ? (
        <MoodCard />
      ) : (
        <LightCard
          climate={cl}
          on={lightOn}
          roomName={roomName}
          set={(patch) => setClimateRoom(room, patch)}
          toggle={() => lightDev && toggleDevice(room, lightDev.id)}
        />
      )}

      <SectionLabel icon="shield-check">Security &amp; Access</SectionLabel>

      <AccessCard
        icon="warehouse"
        name="Garage Door"
        on={security.garage}
        onLabel="Open"
        offLabel="Closed"
        tone="var(--c-solar)"
        onToggle={() => toggleSec("garage", "Garage opening", "Garage closing", "warehouse")}
      />
      <AccessCard
        icon="fence"
        name="Gate"
        on={security.gate}
        onLabel="Open"
        offLabel="Closed"
        tone="var(--c-solar)"
        onToggle={() => toggleSec("gate", "Gate opening", "Gate closing", "fence")}
      />
      <AccessCard
        icon="siren"
        name="Outdoor Alarm"
        on={security.outdoorAlarm}
        onLabel="Armed"
        offLabel="Disarmed"
        tone="var(--c-batt)"
        onToggle={() =>
          toggleSec("outdoorAlarm", "Outdoor alarm armed", "Outdoor alarm disarmed", "siren")
        }
      />
      <AccessCard
        icon="shield"
        name="Indoor Alarm"
        on={security.indoorAlarm}
        onLabel="Armed"
        offLabel="Disarmed"
        tone="var(--c-batt)"
        onToggle={() =>
          toggleSec("indoorAlarm", "Indoor alarm armed", "Indoor alarm disarmed", "shield")
        }
      />

      <SectionLabel icon="sparkles">Scenes</SectionLabel>
      <ScenesStrip scenes={scenes} active={activeScene} onRun={runScene} />

      <SectionLabel icon="layout-grid">{roomName} · Devices</SectionLabel>

      {visibleDevices.map((d) => (
        <DeviceCard
          key={d.id}
          dev={d}
          icon={DEVICE_ICON[d.type] ?? "plug"}
          onToggle={() => toggleDevice(room, d.id)}
        />
      ))}
      {visibleDevices.length === 0 && (
        <div className="card" style={{ gridColumn: "span 12" }}>
          <div className="empty">
            No devices match &ldquo;{query}&rdquo;.
            <Icon name="search-x" size={20} style={{ marginLeft: 8, verticalAlign: "middle" }} />
          </div>
        </div>
      )}
    </div>
  );
}
