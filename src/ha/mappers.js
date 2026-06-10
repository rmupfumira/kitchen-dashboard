/**
 * Pure mappers — turn raw HA state objects into the data shapes that
 * NOCTURNE's components already consume. Each one tolerates missing /
 * undefined input by returning `null` so callers can fall back to mock.
 */
import { weather as mockWeather, inverter as mockInverter } from "../data";

/** Parse a numeric state, returning fallback if it isn't a finite number. */
const num = (s, fallback = 0) => {
  const v = Number(s?.state);
  return Number.isFinite(v) ? v : fallback;
};
const round1 = (n) => Math.round(n * 10) / 10;

/* ─── weather ─────────────────────────────────────────────────
   HA weather.* entities expose:
     state           = condition string ("sunny", "cloudy", …)
     attributes      = { temperature, humidity, wind_speed, forecast: [...] }
   We map the condition string into a sensible lucide icon name. */
const CONDITION_ICON = {
  "clear-night": "moon",
  cloudy: "cloud",
  exceptional: "alert-triangle",
  fog: "cloud-fog",
  hail: "cloud-hail",
  lightning: "cloud-lightning",
  "lightning-rainy": "cloud-lightning",
  partlycloudy: "cloud-sun",
  pouring: "cloud-rain",
  rainy: "cloud-rain",
  snowy: "snowflake",
  "snowy-rainy": "cloud-snow",
  sunny: "sun",
  windy: "wind",
  "windy-variant": "wind",
};
const condIcon = (cond) => CONDITION_ICON[cond] || "cloud";

export function weatherFromEntity(state) {
  if (!state) return null;
  const a = state.attributes || {};
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const temp = Math.round(num(state, mockWeather.temp));
  const forecast = (a.forecast || []).slice(0, 5).map((f, i) => {
    const day = i === 0 ? "Today" : new Date(f.datetime || Date.now()).toLocaleDateString("en-GB", { weekday: "short" });
    return {
      day,
      icon: condIcon(f.condition),
      hi: Math.round(f.temperature ?? f.high ?? temp),
      lo: Math.round(f.templow ?? f.low ?? temp - 3),
    };
  });
  while (forecast.length < 5) forecast.push({ day: "—", icon: "cloud", hi: temp, lo: temp - 3 });
  return {
    date: dateStr,
    cond: (state.state || "").replace(/-/g, " "),
    temp,
    high: Math.round(a.temperature_high ?? forecast[0]?.hi ?? temp),
    low: Math.round(a.temperature_low ?? forecast[0]?.lo ?? temp - 3),
    wind: Math.round(a.wind_speed ?? 0),
    rain: Math.round(a.precipitation_probability ?? a.precipitation ?? 0),
    uv: Math.round(a.uv_index ?? 0),
    forecast,
  };
}

/* ─── inverter / power flow ───────────────────────────────────
   Several sensors combined into the EnergyCard shape. Sensors may report
   watts or kilowatts depending on integration — sniff via unit_of_measurement
   and normalise to kW. The historical curve and "today" totals fall back to
   the mock values unless dedicated HA sensors are wired in. */
function toKw(state) {
  if (!state) return 0;
  const v = num(state, 0);
  const unit = (state.attributes?.unit_of_measurement || "").toLowerCase();
  return unit === "w" ? v / 1000 : v;
}

export function inverterFromSensors({ solar, battery, grid, load }) {
  if (!solar && !battery && !grid && !load) return null;
  const solarKw = solar ? round1(toKw(solar)) : mockInverter.solar;
  const loadKw = load ? round1(toKw(load)) : mockInverter.load;
  const gridKw = grid ? round1(toKw(grid)) : mockInverter.grid;
  const batteryPct = battery ? Math.round(num(battery, mockInverter.battery)) : mockInverter.battery;
  // batteryFlow isn't always its own sensor — infer from energy balance:
  //   solar = load + batteryCharge + gridExport   (sign: + charge, - discharge)
  const batteryFlow = round1(solarKw - loadKw - Math.max(0, -gridKw) + Math.max(0, gridKw) * 0);
  return {
    ...mockInverter, // keep curve / today totals / batteryTime for now
    solar: solarKw,
    load: loadKw,
    grid: gridKw,
    battery: batteryPct,
    batteryFlow,
    selfSufficiency:
      solarKw + loadKw > 0
        ? Math.min(100, Math.round((Math.min(solarKw, loadKw) / loadKw) * 100))
        : 0,
  };
}

/* ─── security (4 access tiles) ───────────────────────────────
   Garage / Gate are HA covers — `state` is "open"/"closed"/"opening"/"closing".
   Alarms are alarm_control_panel — `state` is "armed_away"/"armed_home"/"disarmed"/… */
export function securityFromEntities({ garage, gate, outdoorAlarm, indoorAlarm }) {
  const open = (s) => s && /^(open|opening)$/i.test(s.state);
  const armed = (s) => s && /^armed/i.test(s.state);
  return {
    garage: open(garage),
    gate: open(gate),
    outdoorAlarm: armed(outdoorAlarm),
    indoorAlarm: armed(indoorAlarm),
  };
}

/* ─── doorbell ───────────────────────────────────────────────
   Best-effort ring detection: prefer an input_boolean.doorbell_ringing flag,
   fall back to recording state on the doorbell camera. */
export function doorbellFromEntities({ ringingFlag, camera }) {
  const ringing =
    (ringingFlag && ringingFlag.state === "on") ||
    (camera && /^recording$/i.test(camera.state));
  return {
    name: "Front Door",
    location: camera?.attributes?.friendly_name || "Doorbell",
    ringing: Boolean(ringing),
    lastRing: "Recent",
  };
}
