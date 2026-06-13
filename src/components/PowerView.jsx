import { Sun, House, UtilityPole, Zap, Leaf, Plug, AlertTriangle,
  Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, BatteryWarning } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";

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

/** Full-page Power / Energy view. */
export default function PowerView() {
  const P = ENTITIES.power;
  const pv = useEntity(P.pvPower);
  const load = useEntity(P.loadPower);
  const grid = useEntity(P.gridPower);
  const soc = useEntity(P.batterySoc);
  const battP = useEntity(P.batteryPower);
  const pvToday = useEntity(P.pvToday);
  const loadToday = useEntity(P.loadToday);
  const self = useEntity(P.selfSufficiency);
  const impToday = useEntity(P.gridImportToday);
  const expToday = useEntity(P.gridExportToday);
  const ssStage = useEntity(ENTITIES.loadShedding.stage);
  const ssCal = useEntity(ENTITIES.loadShedding.forecast);

  const gridKw = toKw(grid);
  const battKw = toKw(battP);
  const socPct = num(soc);
  const importing = gridKw > 0.05, exporting = gridKw < -0.05;
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

  const stats = [
    { Icon: UtilityPole, k: importing ? "Importing" : exporting ? "Exporting" : "Grid", v: f1(gridKw), u: "kW",
      color: importing ? "var(--warning)" : exporting ? "var(--success)" : "var(--ink-soft)" },
    { Icon: Leaf, k: "Self-sufficiency", v: Number.isFinite(num(self)) ? Math.round(num(self)) : "—", u: "%", color: "var(--success)" },
    { Icon: Sun, k: "Solar today", v: Number.isFinite(num(pvToday)) ? f1(num(pvToday)) : "—", u: "kWh", color: "var(--gold)" },
    { Icon: Plug, k: "Used today", v: Number.isFinite(num(loadToday)) ? f1(num(loadToday)) : "—", u: "kWh", color: "var(--ink-soft)" },
    { Icon: UtilityPole, k: "Imported today", v: Number.isFinite(num(impToday)) ? f1(num(impToday)) : "—", u: "kWh", color: "var(--warning)" },
    { Icon: UtilityPole, k: "Exported today", v: Number.isFinite(num(expToday)) ? f1(num(expToday)) : "—", u: "kWh", color: "var(--success)" },
  ];

  const stage = ssStage?.state;
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

      <div className="pw-stats">
        {stats.map((s, i) => (
          <div key={i} className="pw-stat">
            <div className="pw-stat-ic" style={{ color: s.color }}><s.Icon size={18} strokeWidth={2} /></div>
            <div className="pw-stat-meta">
              <div className="pw-stat-v tabular">{s.v}<span className="u">{s.u}</span></div>
              <div className="pw-stat-k">{s.k}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
