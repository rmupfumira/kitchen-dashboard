import { House, ChefHat, Sofa, BedDouble, Bot, Zap, Flame, Sprout, Waves, Video, Settings, RefreshCw, Wifi } from "lucide-react";

/**
 * Left nav rail. Home is the clean overview landing; Kitchen / Living /
 * Tinotenda are room dashboards; the rest are dedicated system views.
 * Bottom: WiFi + hard-reload + settings.
 */
const ROOMS = [
  { id: "home", Icon: House, label: "Home" },
  { id: "kitchen", Icon: ChefHat, label: "Kitchen" },
  { id: "living", Icon: Sofa, label: "Living" },
  { id: "tinotenda", Icon: BedDouble, label: "Tinotenda" },
  { id: "vacuum", Icon: Bot, label: "Vacuum" },
  { id: "power", Icon: Zap, label: "Power" },
  { id: "geyser", Icon: Flame, label: "Geyser" },
  { id: "irrigation", Icon: Sprout, label: "Irrigation" },
  { id: "pool", Icon: Waves, label: "Pool" },
  { id: "cameras", Icon: Video, label: "Cameras" },
];

async function hardReload() {
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* best-effort */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_nc", String(Date.now()));
  window.location.replace(url.toString());
}

export default function Rail({ view, onPick, onWifi }) {
  return (
    <nav className="lux-rail">
      {ROOMS.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          className={"rail-item" + (view === id ? " active" : "")}
          onClick={() => onPick(id, label)}
          aria-label={label}
        >
          <Icon size={21} strokeWidth={2} />
          <span>{label}</span>
        </button>
      ))}
      <div className="rail-spacer" />
      <button type="button" className="rail-item" onClick={onWifi} aria-label="Guest WiFi" title="Guest WiFi">
        <Wifi size={20} strokeWidth={2} />
        <span>WiFi</span>
      </button>
      <button type="button" className="rail-refresh" onClick={hardReload} aria-label="Refresh" title="Hard reload">
        <RefreshCw size={26} strokeWidth={2.2} />
        <span>Refresh</span>
      </button>
      <button
        type="button"
        className={"rail-item" + (view === "settings" ? " active" : "")}
        onClick={() => onPick("settings")}
        aria-label="Settings"
      >
        <Settings size={19} strokeWidth={2} />
        <span>Settings</span>
      </button>
    </nav>
  );
}
