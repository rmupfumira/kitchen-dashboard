import { useEffect, useState } from "react";
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake, ShieldOff } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useSettings } from "../useSettings";

const COND = {
  "clear-night": Moon, cloudy: Cloud, fog: CloudFog, hail: CloudSnow,
  lightning: CloudLightning, "lightning-rainy": CloudLightning, partlycloudy: CloudSun,
  pouring: CloudRain, rainy: CloudRain, snowy: Snowflake, "snowy-rainy": CloudSnow,
  sunny: Sun, windy: Wind, "windy-variant": Wind,
};
const condIcon = (s) => COND[s] || Cloud;
const condLabel = (s) => (s || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Idle clock screensaver. Fills the screen with a big digital clock; any tap
 * (or keypress) wakes back to the dashboard. Mounted only while idle.
 */
export default function Screensaver({ onWake }) {
  const [now, setNow] = useState(() => new Date());
  const { settings } = useSettings();
  const weather = useEntity(ENTITIES.weather);
  const guest = useEntity(ENTITIES.guestMode);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Keyboard wake (pointer is handled by the overlay's onClick so the waking
  // tap is fully consumed and can't fall through to a control underneath).
  useEffect(() => {
    const wake = () => onWake();
    window.addEventListener("keydown", wake, true);
    return () => window.removeEventListener("keydown", wake, true);
  }, [onWake]);

  const h24 = now.getHours();
  const ampm = settings.clock24h ? "" : (h24 >= 12 ? "PM" : "AM");
  const hh = String(settings.clock24h ? h24 : (h24 % 12 || 12)).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const cond = weather?.state;
  const WIcon = condIcon(cond);
  const temp = Number.isFinite(weather?.attributes?.temperature) ? Math.round(weather.attributes.temperature) : null;

  return (
    <div className="saver" onClick={onWake} role="button" tabIndex={0} aria-label="Wake dashboard">
      {guest?.state === "on" && (
        <div className="saver-guest"><ShieldOff size={20} strokeWidth={2.2} /> Guest Mode · Security paused</div>
      )}
      <div className="saver-clock tabular">
        <span>{hh}</span><span className="saver-colon">:</span><span>{mm}</span>
        {ampm && <span style={{ fontSize: "0.3em", color: "var(--gold)", fontWeight: 700, marginLeft: "0.22em", verticalAlign: "0.7em" }}>{ampm}</span>}
      </div>
      <div className="saver-date">{dateStr}</div>
      {weather && (
        <div className="saver-wx">
          <WIcon size={56} strokeWidth={1.5} />
          {temp != null && <span className="saver-wx-t">{temp}°</span>}
          {cond && <span className="saver-wx-c">{condLabel(cond)}</span>}
        </div>
      )}
      <div className="saver-hint">Tap anywhere to open the dashboard</div>
    </div>
  );
}
