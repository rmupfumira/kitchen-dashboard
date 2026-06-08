import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { WeatherShape } from "@/data/mock";

/**
 * WeatherCard — top-left card of the dashboard. Shows date, live clock,
 * current temperature/condition, and a 5-day forecast strip.
 *
 * In Phase 4, `weather` prop will come from `weather.*` HA entities.
 */
export function WeatherCard({ weather }: { weather: WeatherShape }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = now.getHours();
  const h12 = ((hh + 11) % 12) + 1;
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ap = hh < 12 ? "AM" : "PM";

  return (
    <div className="card weather rise" style={{ gridColumn: "span 4" }}>
      <div className="weather-top">
        <div style={{ minWidth: 0 }}>
          <div className="date">{weather.date}</div>
          <div className="time">
            {h12}:{mm}
            <span className="ap">{ap}</span>
          </div>
          <div className="temp">
            {weather.temp}°C · feels {weather.temp - 1}° · {weather.cond}
          </div>
        </div>
        <div className="weather-ic">
          <Icon name="cloud-rain" size={46} stroke={1.6} />
        </div>
      </div>
      <div className="forecast">
        {weather.forecast.map((f, i) => (
          <div className={`fcast${i === 0 ? " on" : ""}`} key={f.day}>
            <span className="fd">{f.day}</span>
            <Icon
              name={f.icon}
              size={22}
              stroke={1.7}
              color={i === 0 ? "var(--amber-deep)" : "var(--ink-soft)"}
            />
            <span className="fh">{f.hi}°</span>
            <span className="fl">{f.lo}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
