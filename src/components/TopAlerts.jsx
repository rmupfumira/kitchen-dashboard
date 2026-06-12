import { Bell, ShieldCheck, X, AlertTriangle } from "lucide-react";
import Led from "./Led";
import { useHA } from "../ha/HaContext";
import { usePersistentNotifications } from "../ha/usePersistentNotifications";
import { ALERT_SENSORS } from "../entities";

function classify(item) {
  const t = (item.title || "").toLowerCase();
  const id = (item.notification_id || "").toLowerCase();
  if (id.includes("alarm") || t.includes("triggered") || t.includes("breach") || t.includes("leak")) return "critical";
  if (id.includes("battery") || t.includes("battery") || t.includes("open")) return "warning";
  return "info";
}

/** Top-right notification center. Green "All Systems Normal" when quiet. */
export default function TopAlerts() {
  const { entities, status } = useHA();
  const { items: persistents, dismiss, dismissAll } = usePersistentNotifications();

  const sensorAlerts = ALERT_SENSORS
    .map((s) => {
      const ent = entities[s.id];
      if (!ent || ent.state !== "on") return null;
      return { notification_id: s.id, title: s.label, _class: s.class, _source: "sensor" };
    })
    .filter(Boolean);

  const persistentAlerts = persistents.map((p) => ({ ...p, _class: classify(p), _source: "persistent" }));
  const order = { critical: 0, warning: 1, info: 2 };
  const all = [...sensorAlerts, ...persistentAlerts].sort(
    (a, b) => (order[a._class] ?? 9) - (order[b._class] ?? 9)
  );
  const quiet = all.length === 0;
  const hasCritical = all.some((a) => a._class === "critical");

  return (
    <div className="card rise talerts">
      <div className="talerts-head">
        <Bell size={15} strokeWidth={2} color={quiet ? "var(--ink-mute)" : hasCritical ? "var(--critical)" : "var(--warning)"} />
        <span className="sect-title">Alerts</span>
        {!quiet && <span className="talerts-badge">{all.length}</span>}
        {!quiet && (
          <button type="button" className="talerts-clear" onClick={dismissAll}>
            Clear all
          </button>
        )}
      </div>

      {quiet ? (
        <div className="talerts-ok">
          <ShieldCheck size={20} strokeWidth={2} />
          {status === "connected" ? "All Systems Normal" : "Connecting…"}
        </div>
      ) : (
        <div className="talerts-list">
          {all.slice(0, 6).map((a) => (
            <div key={`${a._source}:${a.notification_id}`} className={`talert ${a._class}`}>
              {a._class === "critical" ? (
                <AlertTriangle size={13} strokeWidth={2} color="var(--critical)" />
              ) : (
                <Led tone={a._class === "warning" ? "warning" : "gold"} />
              )}
              <span className="t">{a.title || a.notification_id}</span>
              {a._source === "persistent" && (
                <button type="button" className="x" onClick={() => dismiss(a.notification_id)} aria-label="Dismiss">
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
