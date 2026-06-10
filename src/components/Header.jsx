import { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";
import { fmtTime } from "../lib/format";
import ThemeToggle from "./ThemeToggle";
import Led from "./Led";

/**
 * Header — clock · greet · search · theme/bell/avatar.
 *
 * Connection state is reflected in the LED + sysline:
 *   connected  → green LED, pulsing, "{room} // all systems nominal"
 *   connecting → amber LED, pulsing, "Linking to home assistant…"
 *   error      → red LED, "Home assistant offline"
 *   demo       → amber LED, "Demo mode // mock data"
 */
const STATUS_COPY = {
  connected: { tone: "on", text: (room) => `${room} // all systems nominal` },
  connecting: { tone: "warn", text: () => "Linking to home assistant…" },
  error: { tone: "alert", text: () => "Home assistant offline" },
  idle: { tone: "warn", text: () => "Linking to home assistant…" },
  demo: { tone: "warn", text: () => "Demo mode // mock data" },
};

export default function Header({
  roomName,
  query,
  onQuery,
  dark,
  onToggleTheme,
  haStatus = "demo",
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = fmtTime(now);
  const hm = t.slice(0, 5);
  const ss = t.slice(6);

  const stat = STATUS_COPY[haStatus] || STATUS_COPY.demo;

  return (
    <header className="header">
      <div className="clock">
        <span className="clock-hm">{hm}</span>
        <span className="clock-s">:{ss}</span>
      </div>

      <div className="greet">
        <h1>NOCTURNE</h1>
        <div className="sysline">
          <Led tone={stat.tone} pulse={haStatus !== "connected" ? false : true} />
          <span className="mlabel">{stat.text(roomName)}</span>
        </div>
      </div>

      <div className="search">
        <Search size={16} strokeWidth={2} color="var(--ink-faint)" />
        <input
          type="search"
          placeholder="Search any device…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        <span className="kbd">⌘K</span>
      </div>

      <div className="header-right">
        <ThemeToggle dark={dark} onToggle={onToggleTheme} />
        <button type="button" className="icon-btn" aria-label="Notifications">
          <Bell size={18} strokeWidth={2} />
          <span className="ping" />
        </button>
        <div className="avatar" aria-hidden="true">W</div>
      </div>
    </header>
  );
}
