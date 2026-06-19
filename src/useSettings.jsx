import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Per-device dashboard settings, persisted to localStorage. Because each wall
 * panel runs in its own browser profile, settings are naturally per-panel —
 * e.g. the living-room panel can enable the screensaver while the kitchen
 * leaves it off. Skins re-tint the whole UI via the --accent CSS vars.
 */
export const SETTINGS_KEY = "dashboard.settings.v1";

export const DEFAULTS = {
  skin: "gold",
  screensaver: false,        // kitchen panel: off by default (living-room repo defaults this true)
  screensaverTimeoutSec: 120,
  clock24h: true,
};

export const SKINS = [
  { id: "gold", name: "Luxury Gold", hex: "#d4af37" },
  { id: "platinum", name: "Platinum", hex: "#c2ccd9" },
  { id: "emerald", name: "Emerald", hex: "#36c281" },
  { id: "sapphire", name: "Sapphire", hex: "#4f8cf7" },
  { id: "amethyst", name: "Amethyst", hex: "#b07cff" },
  { id: "ruby", name: "Ruby", hex: "#ff5d78" },
];

export const SCREENSAVER_TIMEOUTS = [
  { sec: 30, label: "30s" },
  { sec: 60, label: "1 min" },
  { sec: 120, label: "2 min" },
  { sec: 300, label: "5 min" },
  { sec: 600, label: "10 min" },
];

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

const Ctx = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  // Persist on every change.
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* private mode / quota */ }
  }, [settings]);

  // Apply the skin to <html data-skin>; the CSS does the rest.
  useEffect(() => {
    document.documentElement.dataset.skin = settings.skin || "gold";
  }, [settings.skin]);

  const set = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings({ ...DEFAULTS }), []);

  return <Ctx.Provider value={{ settings, set, reset }}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}
