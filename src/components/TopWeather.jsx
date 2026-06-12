import { useMemo } from "react";
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useForecast } from "../ha/useForecast";

const COND = {
  "clear-night": Moon,
  cloudy: Cloud,
  fog: CloudFog,
  hail: CloudSnow,
  lightning: CloudLightning,
  "lightning-rainy": CloudLightning,
  partlycloudy: CloudSun,
  pouring: CloudRain,
  rainy: CloudRain,
  snowy: Snowflake,
  "snowy-rainy": CloudSnow,
  sunny: Sun,
  windy: Wind,
  "windy-variant": Wind,
};
const condIcon = (s) => COND[s] || Cloud;
const condLabel = (s) =>
  (s || "—").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function dayShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
}

/** Top-center weather — current + stats + 7-day forecast in one strip. */
export default function TopWeather() {
  const ent = useEntity(ENTITIES.weather);
  const forecast = useForecast(ENTITIES.weather, "daily");
  const a = ent?.attributes || {};
  const cond = ent?.state || "—";
  const Icon = condIcon(cond);
  const temp = Number.isFinite(a.temperature) ? Math.round(a.temperature) : "—";

  const days = useMemo(() => forecast.slice(0, 7), [forecast]);

  return (
    <div className="card rise tweather">
      <div className="tw-now">
        <div className="tw-ic">
          <Icon size={52} strokeWidth={1.5} />
        </div>
        <div>
          <div className="tw-temp tabular">{temp}°</div>
          <div className="tw-cond">{condLabel(cond)}</div>
        </div>
      </div>

      <div className="tw-stats">
        <div className="tw-stat"><span className="k">Humidity</span><span className="v">{Number.isFinite(a.humidity) ? Math.round(a.humidity) + "%" : "—"}</span></div>
        <div className="tw-stat"><span className="k">Wind</span><span className="v">{Number.isFinite(a.wind_speed) ? Math.round(a.wind_speed) + " km/h" : "—"}</span></div>
        <div className="tw-stat"><span className="k">Pressure</span><span className="v">{Number.isFinite(a.pressure) ? Math.round(a.pressure) + " hPa" : "—"}</span></div>
        <div className="tw-stat"><span className="k">Visibility</span><span className="v">{Number.isFinite(a.visibility) ? a.visibility.toFixed(0) + " km" : "—"}</span></div>
      </div>

      <div className="tw-forecast">
        {(days.length ? days : Array.from({ length: 7 }, () => null)).map((d, i) => {
          if (!d) {
            return (
              <div key={i} className="tw-day" style={{ opacity: 0.35 }}>
                <span className="d">—</span>
                <Cloud size={18} strokeWidth={1.6} color="var(--ink-faint)" />
                <span className="hi">—</span>
              </div>
            );
          }
          const DIcon = condIcon(d.condition);
          const hi = Number.isFinite(d.temperature) ? Math.round(d.temperature) : "—";
          const lo = Number.isFinite(d.templow) ? Math.round(d.templow) : null;
          return (
            <div key={i} className={"tw-day" + (i === 0 ? " today" : "")}>
              <span className="d">{i === 0 ? "TODAY" : dayShort(d.datetime)}</span>
              <DIcon size={18} strokeWidth={1.6} color={i === 0 ? "var(--gold)" : "var(--ink-soft)"} />
              <span className="hi">{hi}°</span>
              {lo != null && <span className="lo">{lo}°</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
