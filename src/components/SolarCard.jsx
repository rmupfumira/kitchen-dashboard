import { Sun, House, UtilityPole, Zap, Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, BatteryWarning } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";

function num(ent, fallback = 0) {
  const v = Number(ent?.state);
  return Number.isFinite(v) ? v : fallback;
}
function toKw(ent) {
  if (!ent) return 0;
  const v = num(ent, 0);
  const unit = (ent.attributes?.unit_of_measurement || "").toLowerCase();
  return unit === "w" ? v / 1000 : v;
}
const f1 = (n) => (Math.round(Math.abs(n) * 10) / 10).toFixed(1);

function batteryVisual(socPct, charging) {
  if (!Number.isFinite(socPct)) return { Icon: Battery, color: "var(--ink-faint)" };
  if (charging) return { Icon: BatteryCharging, color: "var(--success)" };
  if (socPct >= 80) return { Icon: BatteryFull, color: "var(--success)" };
  if (socPct >= 50) return { Icon: BatteryMedium, color: "#a9c74a" };
  if (socPct >= 25) return { Icon: BatteryLow, color: "var(--warning)" };
  if (socPct >= 10) return { Icon: BatteryLow, color: "#e07b3a" };
  return { Icon: BatteryWarning, color: "var(--critical)" };
}

/**
 * Solar — Battery % is the hero metric (correction 6).
 * Big battery panel on the left, PV / Load / Grid as small stats on the right.
 */
export default function SolarCard() {
  const pvPower = useEntity(ENTITIES.power.pvPower);
  const loadPower = useEntity(ENTITIES.power.loadPower);
  const gridPower = useEntity(ENTITIES.power.gridPower);
  const soc = useEntity(ENTITIES.power.batterySoc);
  const battPower = useEntity(ENTITIES.power.batteryPower);

  const pvKw = toKw(pvPower);
  const loadKw = toKw(loadPower);
  const gridKw = toKw(gridPower);
  const battKw = toKw(battPower);
  const socPct = num(soc, NaN);
  const importing = gridKw > 0.05;
  const exporting = gridKw < -0.05;
  const charging = battKw > 0.05;
  const discharging = battKw < -0.05;
  const battVis = batteryVisual(socPct, charging);

  return (
    <div className="solar rise">
      <div className="solar-head">
        <Zap size={16} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Power</span>
      </div>

      <div className="solar-body">
        {/* Load is the hero metric */}
        <div className="batt-hero">
          <House size={34} strokeWidth={2} color="var(--gold)" style={{ marginBottom: 4 }} />
          <div className="batt-hero-pct" style={{ color: "var(--gold)" }}>
            {f1(loadKw)}<span className="u">kW</span>
          </div>
          <div className="batt-hero-lbl">Home Load</div>
          <div className="batt-hero-sub">drawing now</div>
        </div>

        <div className="solar-mini">
          <div className="sstat">
            <Sun size={20} strokeWidth={2} color="var(--gold)" />
            <div className="sstat-meta"><span className="k">Solar</span></div>
            <span className="v tabular">{f1(pvKw)}<span className="u">kW</span></span>
          </div>
          <div className="sstat">
            <battVis.Icon size={20} strokeWidth={2} color={battVis.color} />
            <div className="sstat-meta"><span className="k">Battery</span></div>
            <span className="v tabular" style={{ color: battVis.color }}>
              {Number.isFinite(socPct) ? Math.round(socPct) : "—"}<span className="u">%</span>
            </span>
          </div>
          <div className="sstat">
            <UtilityPole size={20} strokeWidth={2} color={importing ? "var(--warning)" : exporting ? "var(--success)" : "var(--ink-mute)"} />
            <div className="sstat-meta"><span className="k">{importing ? "Import" : exporting ? "Export" : "Grid"}</span></div>
            <span className="v tabular">{f1(gridKw)}<span className="u">kW</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
