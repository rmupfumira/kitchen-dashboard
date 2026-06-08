/**
 * App shell.
 *
 * Phase 1 deliverable: render the icon rail, header (greet/search/dark-toggle/
 * notifications/avatar), view container (currently empty stubs), room tabs
 * (only visible on Dashboard view), the toast system, and the live TweaksPanel.
 *
 * Everything that the Phase-2 widgets will need is already in place:
 * - useDashboardStore: view, room, query, toast, scene
 * - useTweaks: accent / dark / cardStyle / density (mirrored to CSS vars)
 * - HA / mock data lives in @/data/mock and is ready to be threaded in.
 */
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Toast } from "@/components/ui/Toast";
import { TweaksPanel } from "@/components/ui/TweaksPanel";
import { DashboardView } from "@/components/views/DashboardView";
import { CamerasView } from "@/components/views/CamerasView";
import { ScenesView } from "@/components/views/ScenesView";
import { PowerView } from "@/components/views/PowerView";
import { useApplyTweaks, useTweaks } from "@/state/useTweaks";
import { useDashboardStore, type ViewId } from "@/state/useDashboardStore";
import { notifications, rooms } from "@/data/mock";

interface RailItem {
  id: ViewId;
  icon: string;
  label: string;
}

const RAIL: RailItem[] = [
  { id: "dashboard", icon: "layout-dashboard", label: "Home" },
  { id: "cameras", icon: "cctv", label: "Cameras" },
  { id: "scenes", icon: "sparkles", label: "Scenes" },
  { id: "energy", icon: "zap", label: "Power" },
];

export default function App() {
  useApplyTweaks(); // mirror tweaks → CSS vars + body.theme-dark

  const { dark, setTweak } = useTweaks();
  const {
    view,
    room,
    query,
    notifOpen,
    setView,
    setRoom,
    setQuery,
    toggleNotif,
  } = useDashboardStore();

  const roomName = rooms.find((r) => r.id === room)?.name ?? "—";
  const headerSub =
    view === "dashboard"
      ? `${roomName} · all systems normal`
      : "Connected to Home Assistant";

  return (
    <div className="app">
      {/* ─── icon rail ─── */}
      <nav className="rail">
        <div className="rail-logo">
          <Icon name="house-plug" size={24} />
        </div>
        {RAIL.map((r) => (
          <button
            key={r.id}
            type="button"
            className={clsx("rail-btn", view === r.id && "active")}
            onClick={() => setView(r.id)}
            title={r.label}
            aria-label={r.label}
          >
            <Icon name={r.icon} size={22} />
          </button>
        ))}
        <div className="rail-spacer" />
        <button type="button" className="rail-btn" title="Settings" aria-label="Settings">
          <Icon name="settings" size={22} />
        </button>
      </nav>

      {/* ─── main column ─── */}
      <div className="main">
        <header className="header">
          <div className="greet">
            <h1>
              Welcome, Watson <span className="wave">·</span>
            </h1>
            <p>{headerSub}</p>
          </div>

          <div className="search">
            <Icon name="search" size={18} color="var(--ink-faint)" />
            <input
              type="search"
              placeholder="Search any device here…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="kbd">⌘K</span>
          </div>

          <div className="header-right">
            <div className="seg">
              <button
                type="button"
                className={clsx(!dark && "on")}
                onClick={() => setTweak("dark", false)}
              >
                <Icon name="sun" size={15} className="ic" />
                Light
              </button>
              <button
                type="button"
                className={clsx(dark && "on")}
                onClick={() => setTweak("dark", true)}
              >
                <Icon name="moon" size={15} className="ic" />
                Dark
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="icon-btn"
                onClick={toggleNotif}
                aria-label="Notifications"
              >
                <Icon name="bell" size={20} />
                <span className="dot" />
              </button>
              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 60,
                    right: 0,
                    width: 320,
                    padding: 14,
                    background: "var(--glass-strong)",
                    border: "1px solid var(--glass-line)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-pop)",
                    backdropFilter: "blur(20px)",
                    zIndex: 50,
                  }}
                >
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "var(--ink-soft)",
                      marginBottom: 10,
                    }}
                  >
                    Notifications
                  </h4>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        padding: "8px 4px",
                        borderTop: "1px solid var(--glass-line-2)",
                      }}
                    >
                      <Icon name={n.icon} size={17} />
                      <div style={{ flex: 1 }}>
                        <b style={{ display: "block", fontSize: 13 }}>{n.title}</b>
                        <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{n.body}</span>
                      </div>
                      <time style={{ fontSize: 11, color: "var(--ink-faint)" }}>{n.time}</time>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="avatar">W</div>
          </div>
        </header>

        <div className="board">
          {view === "dashboard" && <DashboardView />}
          {view === "cameras" && <CamerasView />}
          {view === "scenes" && <ScenesView />}
          {view === "energy" && <PowerView />}
        </div>

        {/* Room tabs only appear on the Dashboard view (per design). */}
        {view === "dashboard" && (
          <div className="tabs">
            {rooms.map((r) => (
              <button
                key={r.id}
                type="button"
                className={clsx("tab", room === r.id && "on")}
                onClick={() => setRoom(r.id)}
              >
                {r.name}
              </button>
            ))}
            <button type="button" className="tab-add" aria-label="Add room">
              <Icon name="plus" size={20} />
            </button>
          </div>
        )}
      </div>

      <Toast />
      <TweaksPanel />
    </div>
  );
}
