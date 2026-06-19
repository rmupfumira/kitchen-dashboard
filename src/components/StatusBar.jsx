import { useEffect, useState } from "react";
import {
  Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake,
  ShieldCheck, ShieldAlert, AlertTriangle, Lock, ChevronRight,
} from "lucide-react";
import { ENTITIES, ALERT_SENSORS } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";
import { usePersistentNotifications } from "../ha/usePersistentNotifications";
import { useSettings } from "../useSettings";

const COND = {
  "clear-night": Moon, cloudy: Cloud, fog: CloudFog, hail: CloudSnow,
  lightning: CloudLightning, "lightning-rainy": CloudLightning, partlycloudy: CloudSun,
  pouring: CloudRain, rainy: CloudRain, snowy: Snowflake, "snowy-rainy": CloudSnow,
  sunny: Sun, windy: Wind, "windy-variant": Wind,
};
const condIcon = (s) => COND[s] || Cloud;
const condLabel = (s) => (s || "—").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function classify(item) {
  const t = (item.title || "").toLowerCase();
  const id = (item.notification_id || "").toLowerCase();
  if (id.includes("alarm") || t.includes("triggered") || t.includes("breach") || t.includes("leak")) return "critical";
  if (id.includes("battery") || t.includes("battery") || t.includes("open")) return "warning";
  return "info";
}

/**
 * Single compact status bar (corrections 1, 2): time · weather · home · alerts.
 * Weather opens the weather view; home status opens the security drawer.
 * The alerts segment fills remaining width and turns loud (red/amber) when
 * something is active — the most prominent thing on screen when it matters.
 */
export default function StatusBar({ onOpenWeather, onOpenSecurity, onToast }) {
  const { entities } = useHA();
  const { settings } = useSettings();
  const { items: persistents, dismissAll } = usePersistentNotifications();
  const weather = useEntity(ENTITIES.weather);
  const call = useService();

  const secureHome = () => {
    onToast?.("shield-check", "Securing home…");
    call("script", "turn_on", {}, { entity_id: ENTITIES.security.secureHomeScript });
  };

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* clock — 24-hour or 12-hour per settings */
  const h24 = now.getHours();
  const ampm = settings.clock24h ? "" : (h24 >= 12 ? "PM" : "AM");
  const hh = String(settings.clock24h ? h24 : (h24 % 12 || 12)).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });

  /* weather */
  const cond = weather?.state || "—";
  const WIcon = condIcon(cond);
  const temp = Number.isFinite(weather?.attributes?.temperature) ? Math.round(weather.attributes.temperature) : "—";

  /* home status */
  const garage = entities[ENTITIES.security.garage];
  const gate = entities[ENTITIES.security.gate];
  const outdoor = entities[ENTITIES.security.outdoorAlarm];
  const entArea = entities[ENTITIES.security.entArea];
  const frontDoor = entities[ENTITIES.security.frontDoorLock];
  const screen = entities[ENTITIES.security.screenGate];
  const isOpen = (e) => e && /^(open|opening)$/i.test(e.state);
  const isArmed = (e) => e && /^armed/i.test(e.state);
  const isLocked = (e) => e && e.state === "locked";
  // Indoor alarm is intentionally excluded — it stays disarmed while we're home.
  const armed = isArmed(outdoor);
  const allClosed =
    !isOpen(garage) && !isOpen(gate) && !isOpen(screen) && isLocked(entArea) && isLocked(frontDoor);
  const secure = armed && allClosed;

  /* alerts */
  const sensorAlerts = ALERT_SENSORS
    .map((s) => (entities[s.id]?.state === "on" ? { id: s.id, title: s.label, cls: s.class } : null))
    .filter(Boolean);
  const persistentAlerts = persistents.map((p) => ({ id: p.notification_id, title: p.title || p.notification_id, cls: classify(p) }));
  const order = { critical: 0, warning: 1, info: 2 };
  const all = [...sensorAlerts, ...persistentAlerts].sort((a, b) => (order[a.cls] ?? 9) - (order[b.cls] ?? 9));
  const top = all[0];
  const hasCritical = all.some((a) => a.cls === "critical");
  const alertClass = all.length === 0 ? "clear" : hasCritical ? "active" : "warn";

  return (
    <div className="statusbar">
      {/* clock */}
      <div className="sb-seg">
        <div>
          <div className="sb-time">
            <span className="sb-hm">{hh}:{mm}</span>{ampm && <span className="sb-ampm">{ampm}</span>}
          </div>
          <div className="sb-date">{dateStr}</div>
        </div>
      </div>
      <div className="sb-div" />

      {/* weather */}
      <div className="sb-seg sb-weather" onClick={onOpenWeather} role="button" tabIndex={0}>
        <div className="sb-w-ic"><WIcon size={48} strokeWidth={1.6} /></div>
        <div>
          <div className="sb-w-temp tabular">{temp}°</div>
          <div className="sb-w-cond">{condLabel(cond)}</div>
        </div>
      </div>
      <div className="sb-div" />

      {/* home status */}
      <div className={"sb-seg sb-home " + (secure ? "secure" : "attn")} onClick={onOpenSecurity} role="button" tabIndex={0}>
        <div className="sb-home-ic">
          {secure ? <ShieldCheck size={28} strokeWidth={2} /> : <ShieldAlert size={28} strokeWidth={2} />}
        </div>
        <div>
          <div className="sb-home-t">{secure ? "Home Secure" : "Attention"}</div>
          <div className="sb-home-s">{secure ? "All armed" : armed ? "Doors open" : "Disarmed"}</div>
        </div>
      </div>
      <div className="sb-div" />

      {/* alerts — prominent when active */}
      <div className={"sb-alerts " + alertClass}>
        <div className="sb-alert-ic">
          {all.length === 0 ? (
            <ShieldCheck size={28} strokeWidth={2} color="var(--success)" />
          ) : (
            <AlertTriangle size={28} strokeWidth={2} />
          )}
        </div>
        {all.length === 0 ? (
          <div className="sb-alert-meta">
            <div className="sb-alert-t" style={{ color: "var(--success)" }}>All Clear</div>
            <div className="sb-alert-s">No active alerts</div>
          </div>
        ) : (
          <>
            <div className="sb-alert-meta">
              <div className="sb-alert-t">{top.title}</div>
              <div className="sb-alert-s">{all.length} active alert{all.length > 1 ? "s" : ""}</div>
            </div>
            <button type="button" className="sb-alert-clear" onClick={dismissAll}>Clear</button>
          </>
        )}
        {!secure && (
          <button type="button" className="sb-secure-btn" onClick={secureHome}>
            <Lock size={14} strokeWidth={2.2} />
            Secure
          </button>
        )}
      </div>
    </div>
  );
}
