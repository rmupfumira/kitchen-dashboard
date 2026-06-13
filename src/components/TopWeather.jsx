import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake, ChevronRight } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";

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

/**
 * Home weather — temperature + condition only (correction 5).
 * Tap anywhere to open the detailed weather view.
 */
export default function TopWeather({ onOpen }) {
  const ent = useEntity(ENTITIES.weather);
  const cond = ent?.state || "—";
  const Icon = condIcon(cond);
  const temp = Number.isFinite(ent?.attributes?.temperature) ? Math.round(ent.attributes.temperature) : "—";

  return (
    <div
      className="tweather rise"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className="tw-ic">
        <Icon size={72} strokeWidth={1.5} />
      </div>
      <div>
        <div className="tw-temp tabular">{temp}°</div>
        <div className="tw-cond">{condLabel(cond)}</div>
      </div>
      <div className="tw-more">
        Details
        <ChevronRight size={18} strokeWidth={2} />
      </div>
    </div>
  );
}
