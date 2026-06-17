import { Sun, House, Zap, AlertTriangle, Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, BatteryWarning } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";

function num(ent, fb = NaN) { const v = Number(ent?.state); return Number.isFinite(v) ? v : fb; }
function toKw(ent) {
  if (!ent) return 0;
  const v = num(ent, 0);
  return (ent.attributes?.unit_of_measurement || "").toLowerCase() === "w" ? v / 1000 : v;
}
const f1 = (n) => (Math.round(Math.abs(n) * 10) / 10).toFixed(1);

function batteryVisual(soc, charging) {
  if (!Number.isFinite(soc)) return { Icon: Battery, color: "var(--ink-faint)" };
  if (charging) return { Icon: BatteryCharging, color: "var(--success)" };
  if (soc >= 80) return { Icon: BatteryFull, color: "var(--success)" };
  if (soc >= 50) return { Icon: BatteryMedium, color: "#a9c74a" };
  if (soc >= 25) return { Icon: BatteryLow, color: "var(--warning)" };
  return { Icon: BatteryWarning, color: "var(--critical)" };
}

/** Full-page Power view — Solar/Load/Battery heroes + a big live Device Usage list. */
export default function PowerView() {
  const P = ENTITIES.power;
  const { entities } = useHA();
  const pv = useEntity(P.pvPower);
  const load = useEntity(P.loadPower);
  const soc = useEntity(P.batterySoc);
  const battP = useEntity(P.batteryPower);
  const ssStage = useEntity(ENTITIES.loadShedding.stage);
  const ssCal = useEntity(ENTITIES.loadShedding.forecast);

  const battKw = toKw(battP);
  const socPct = num(soc);
  const charging = battKw > 0.05, discharging = battKw < -0.05;
  const bv = batteryVisual(socPct, charging);

  const heroes = [
    { Icon: Sun, k: "Solar", v: f1(toKw(pv)), u: "kW", color: "var(--gold)" },
    { Icon: House, k: "Home Load", v: f1(toKw(load)), u: "kW", color: "var(--gold)" },
    {
      Icon: bv.Icon, k: "Battery", v: Number.isFinite(socPct) ? Math.round(socPct) : "—", u: "%", color: bv.color,
      sub: charging ? `Charging ${f1(battKw)} kW` : discharging ? `Discharging ${f1(battKw)} kW` : "Idle",
    },
  ];

  // Only devices meaningfully drawing power (hide standby/trickle + offline), highest first.
  const MIN_W = 10;
  const devices = P.devices
    .map((d) => ({ name: d.name, w: num(entities[d.entity]) }))
    .filter((d) => Number.isFinite(d.w) && d.w >= MIN_W)
    .sort((a, b) => b.w - a.w);
  const maxW = Math.max(1, ...devices.map((d) => d.w));

  const stageNum = num(ssStage);
  const loadShedActive = Number.isFinite(stageNum) && stageNum > 0;
  const nextSlot = ssCal?.state === "on" ? (ssCal.attributes?.message || "On now") : ssCal?.attributes?.start_time;

  return (
    <div className="sysview">
      <div className="sv-head">
        <Zap size={18} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Power</span>
        {ssStage && (
          <span className={"pw-stage " + (loadShedActive ? "on" : "off")}>
            <AlertTriangle size={14} strokeWidth={2.4} />
            {loadShedActive ? `Load-shedding Stage ${stageNum}` : "No load-shedding"}
            {nextSlot ? ` · ${nextSlot}` : ""}
          </span>
        )}
      </div>

      <div className="pw-heroes">
        {heroes.map((h) => (
          <div key={h.k} className="pw-hero">
            <h.Icon size={30} strokeWidth={2} color={h.color} />
            <div className="pw-hero-v tabular" style={{ color: h.color }}>{h.v}<span className="u">{h.u}</span></div>
            <div className="pw-hero-k">{h.k}</div>
            {h.sub && <div className="pw-hero-sub">{h.sub}</div>}
          </div>
        ))}
      </div>

      <div className="pw-devices">
        <div className="pw-dev-h">Device usage · live</div>
        <div className="pw-dev-list">
          {devices.length ? (
            devices.map((d) => {
              const pct = Math.max(4, Math.min(100, (d.w / maxW) * 100));
              return (
                <div key={d.name} className="pw-dev">
                  <span className="pw-dev-n">{d.name}</span>
                  <div className="pw-dev-track"><div className="pw-dev-fill" style={{ width: pct + "%" }} /></div>
                  <span className="pw-dev-v tabular">{Math.round(d.w)}<span className="u">W</span></span>
                </div>
              );
            })
          ) : (
            <div className="pw-dev-empty">Nothing drawing power right now</div>
          )}
        </div>
      </div>
    </div>
  );
}
