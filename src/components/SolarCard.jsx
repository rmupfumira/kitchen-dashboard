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
 * Solar System — 4 stat tiles + animated Solar → Home → Battery → Grid flow.
 * Battery icon/colour shifts with SoC; flow dashes animate when power moves.
 */
export default function SolarCard() {
  const pvPower = useEntity(ENTITIES.power.pvPower);
  const pvToday = useEntity(ENTITIES.power.pvToday);
  const loadPower = useEntity(ENTITIES.power.loadPower);
  const loadToday = useEntity(ENTITIES.power.loadToday);
  const gridPower = useEntity(ENTITIES.power.gridPower);
  const soc = useEntity(ENTITIES.power.batterySoc);
  const battPower = useEntity(ENTITIES.power.batteryPower);
  const selfS = useEntity(ENTITIES.power.selfSufficiency);

  const pvKw = toKw(pvPower);
  const loadKw = toKw(loadPower);
  const gridKw = toKw(gridPower);
  const battKw = toKw(battPower);
  const socPct = num(soc, NaN);
  const selfPct = num(selfS, NaN);
  const importing = gridKw > 0.05;
  const exporting = gridKw < -0.05;
  const charging = battKw > 0.05;
  const battVis = batteryVisual(socPct, charging);

  return (
    <div className="card rise solar">
      <div className="solar-head">
        <Zap size={15} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Solar System</span>
        <span className="self">
          {Number.isFinite(selfPct) ? `Self-Sufficiency ${selfPct.toFixed(0)}%` : ""}
        </span>
      </div>

      <div className="solar-stats">
        <div className="sstat">
          <Sun className="ic" size={21} strokeWidth={2} color="var(--gold)" />
          <span className="v tabular">{f1(pvKw)}<span className="u">kW</span></span>
          <span className="k">PV Power</span>
          <span className="sub">{f1(num(pvToday, 0))} kWh today</span>
        </div>
        <div className="sstat">
          <House className="ic" size={21} strokeWidth={2} color="var(--ink-soft)" />
          <span className="v tabular">{f1(loadKw)}<span className="u">kW</span></span>
          <span className="k">Load</span>
          <span className="sub">{f1(num(loadToday, 0))} kWh today</span>
        </div>
        <div className="sstat">
          <UtilityPole className="ic" size={21} strokeWidth={2} color={importing ? "var(--warning)" : exporting ? "var(--success)" : "var(--ink-mute)"} />
          <span className="v tabular">{f1(gridKw)}<span className="u">kW</span></span>
          <span className="k">{importing ? "Importing" : exporting ? "Exporting" : "Grid"}</span>
          <span className="sub">{importing ? "from grid" : exporting ? "to grid" : "standby"}</span>
        </div>
        <div className="sstat">
          <battVis.Icon className="ic" size={21} strokeWidth={2} color={battVis.color} />
          <span className="v tabular">{Number.isFinite(socPct) ? Math.round(socPct) : "—"}<span className="u">%</span></span>
          <span className="k">Battery</span>
          <span className="sub">{charging ? `+${f1(battKw)} kW` : battKw < -0.05 ? `−${f1(battKw)} kW` : "holding"}</span>
        </div>
      </div>

      <div className="sflow">
        <div className="sflow-node">
          <div className="ic"><Sun size={17} strokeWidth={2} color="var(--gold)" /></div>
          <span className="k">Solar</span>
        </div>
        <div className={"sflow-link" + (pvKw > 0.05 ? "" : " idle")} />
        <div className="sflow-node">
          <div className="ic"><House size={17} strokeWidth={2} color="var(--ink-soft)" /></div>
          <span className="k">Home</span>
        </div>
        <div className={"sflow-link" + (charging || battKw < -0.05 ? "" : " idle")} />
        <div className="sflow-node">
          <div className="ic"><battVis.Icon size={17} strokeWidth={2} color={battVis.color} /></div>
          <span className="k">Battery</span>
        </div>
        <div className={"sflow-link" + (importing || exporting ? "" : " idle")} />
        <div className="sflow-node">
          <div className="ic"><UtilityPole size={17} strokeWidth={2} color="var(--ink-mute)" /></div>
          <span className="k">Grid</span>
        </div>
      </div>
    </div>
  );
}
