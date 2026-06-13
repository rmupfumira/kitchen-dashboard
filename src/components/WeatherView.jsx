import { useMemo } from "react";
import { ArrowLeft, Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useForecast } from "../ha/useForecast";

const COND = {
  "clear-night": Moon, cloudy: Cloud, fog: CloudFog, hail: CloudSnow,
  lightning: CloudLightning, "lightning-rainy": CloudLightning, partlycloudy: CloudSun,
  pouring: CloudRain, rainy: CloudRain, snowy: Snowflake, "snowy-rainy": CloudSnow,
  sunny: Sun, windy: Wind, "windy-variant": Wind,
};
const condIcon = (s) => COND[s] || Cloud;
const condLabel = (s) => (s || "—").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const dayShort = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase() : "—");

/** Detailed weather sub-view (correction 5): full stats + 7-day forecast. */
export default function WeatherView({ onBack }) {
  const ent = useEntity(ENTITIES.weather);
  const forecast = useForecast(ENTITIES.weather, "daily");
  const a = ent?.attributes || {};
  const cond = ent?.state || "—";
  const Icon = condIcon(cond);
  const temp = Number.isFinite(a.temperature) ? Math.round(a.temperature) : "—";
  const days = useMemo(() => forecast.slice(0, 7), [forecast]);

  const stats = [
    { k: "Humidity", v: Number.isFinite(a.humidity) ? Math.round(a.humidity) : "—", u: "%" },
    { k: "Wind", v: Number.isFinite(a.wind_speed) ? Math.round(a.wind_speed) : "—", u: "km/h" },
    { k: "Pressure", v: Number.isFinite(a.pressure) ? Math.round(a.pressure) : "—", u: "hPa" },
    { k: "Visibility", v: Number.isFinite(a.visibility) ? a.visibility.toFixed(0) : "—", u: "km" },
  ];

  return (
    <div className="lux-detail">
      <div className="dv-head">
        <button type="button" className="dv-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={24} strokeWidth={2.2} />
        </button>
        <div>
          <div className="dv-title">Weather</div>
          <div className="dv-sub">{a.friendly_name || "Home"}</div>
        </div>
      </div>

      <div className="wv-body">
        <div className="wv-now">
          <div>
            <div className="wv-temp tabular">{temp}°</div>
            <div className="wv-cond">{condLabel(cond)}</div>
          </div>
          <div className="wv-ic">
            <Icon size={120} strokeWidth={1.4} />
          </div>
        </div>

        <div className="wv-stats">
          {stats.map((s) => (
            <div key={s.k} className="wv-stat">
              <span className="wv-stat-k">{s.k}</span>
              <span className="wv-stat-v tabular">{s.v}<span className="u">{s.u}</span></span>
            </div>
          ))}
        </div>

        <div className="wv-forecast">
          {(days.length ? days : Array.from({ length: 7 }, () => null)).map((d, i) => {
            if (!d) {
              return (
                <div key={i} className="wv-day" style={{ opacity: 0.35 }}>
                  <span className="wv-day-d">—</span>
                  <Cloud size={28} strokeWidth={1.4} color="var(--ink-faint)" />
                  <span className="wv-day-hi">—</span>
                </div>
              );
            }
            const DIcon = condIcon(d.condition);
            const hi = Number.isFinite(d.temperature) ? Math.round(d.temperature) : "—";
            const lo = Number.isFinite(d.templow) ? Math.round(d.templow) : null;
            return (
              <div key={i} className={"wv-day" + (i === 0 ? " today" : "")}>
                <span className="wv-day-d">{i === 0 ? "TODAY" : dayShort(d.datetime)}</span>
                <DIcon size={30} strokeWidth={1.4} color={i === 0 ? "var(--gold)" : "var(--ink-soft)"} />
                <span className="wv-day-hi">{hi}°</span>
                {lo != null && <span className="wv-day-lo">{lo}°</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
