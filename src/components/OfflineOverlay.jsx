import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Full-screen offline overlay. Visible whenever HaContext status is "error"
 * OR "connecting" for more than the initial moment. Behind it the dashboard
 * still renders (in its last-known state) so when HA comes back the UI just
 * fades in cleanly.
 *
 * Keeps the NOCTURNE aesthetic — mono mlabel, hairline border, argon accent
 * on the retry button — so it doesn't look like a 3rd-party error page.
 */
export default function OfflineOverlay({ status, error, onRetry }) {
  if (status === "connected") return null;
  const connecting = status === "connecting" || status === "idle";

  return (
    <div className="offline-overlay" role="alertdialog" aria-live="assertive">
      <div className="offline-panel">
        <div className="offline-ic">
          <AlertTriangle size={28} strokeWidth={2} />
        </div>
        <div className="mlabel" style={{ color: connecting ? "var(--warn)" : "var(--alert)" }}>
          {connecting ? "Reconnecting" : "Home Assistant offline"}
        </div>
        <h2 className="offline-title">
          {connecting ? "Linking to Home Assistant…" : "Lost link to Home Assistant"}
        </h2>
        <p className="offline-sub">
          {error || "The dashboard cannot reach your Home Assistant instance right now."}
        </p>
        <div className="offline-meta">
          <span className="mlabel">Endpoint</span>
          <code>{import.meta.env.VITE_HA_URL || "(unset)"}</code>
        </div>
        <button type="button" className="offline-retry" onClick={onRetry}>
          <RefreshCw size={15} strokeWidth={2} />
          Retry now
        </button>
      </div>
    </div>
  );
}
