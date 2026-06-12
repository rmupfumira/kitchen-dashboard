import { ChefHat, Sofa, BedDouble, Briefcase, Users, Trees, LayoutGrid, Settings, RefreshCw } from "lucide-react";

/**
 * Room-nav rail (left). Kitchen is the live view; other rooms fire a toast
 * until their views exist. Bottom: hard-reload + settings.
 */
const ROOMS = [
  { id: "kitchen", Icon: ChefHat, label: "Kitchen" },
  { id: "living", Icon: Sofa, label: "Living" },
  { id: "master", Icon: BedDouble, label: "Master" },
  { id: "office", Icon: Briefcase, label: "Office" },
  { id: "guest", Icon: Users, label: "Guest" },
  { id: "outdoor", Icon: Trees, label: "Outdoor" },
  { id: "all", Icon: LayoutGrid, label: "All" },
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

export default function Rail({ view, onPick }) {
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
      <button type="button" className="rail-item" onClick={hardReload} aria-label="Refresh" title="Hard reload">
        <RefreshCw size={18} strokeWidth={2} />
        <span>Refresh</span>
      </button>
      <button type="button" className="rail-item" aria-label="Settings">
        <Settings size={19} strokeWidth={2} />
        <span>Settings</span>
      </button>
    </nav>
  );
}
