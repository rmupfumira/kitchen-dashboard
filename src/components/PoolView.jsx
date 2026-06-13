import { Waves, Thermometer, FlaskConical, Droplets, Power, Lightbulb, Lock, Unlock } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";
import Switch from "./Switch";

const isOn = (ent) => ent?.state === "on";
const num = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };
const fmt = (ent, dp = 1) => { const v = num(ent); return Number.isFinite(v) ? v.toFixed(dp) : "—"; };

function DayChip({ day }) {
  const ent = useEntity(day.entity);
  const call = useService();
  const on = isOn(ent);
  return (
    <button type="button" className={"pool-day" + (on ? " on" : "")}
      onClick={() => call("input_boolean", "toggle", {}, { entity_id: day.entity })}>
      {day.d}
    </button>
  );
}

function LightTile({ light }) {
  const ent = useEntity(light.entity);
  const call = useService();
  const on = isOn(ent);
  const unavail = !ent || ent.state === "unavailable";
  return (
    <button type="button" className={"pool-light" + (on ? " on" : "") + (unavail ? " unavail" : "")}
      onClick={() => !unavail && call("switch", "toggle", {}, { entity_id: light.entity })}>
      <Lightbulb size={20} strokeWidth={2} />
      <span className="pool-light-n">{light.name}</span>
      <span className="pool-light-s">{unavail ? "—" : on ? "ON" : "OFF"}</span>
    </button>
  );
}

/** Full-page Swimming Pool + entertainment-area view. */
export default function PoolView({ onToast }) {
  const PL = ENTITIES.pool;
  const call = useService();
  const pump = useEntity(PL.pump);
  const lock = useEntity(PL.entLock);
  const today = useEntity(PL.runtimeToday);
  const week = useEntity(PL.runtimeWeek);

  const pumpOn = isOn(pump);
  const pumpUnavail = !pump || pump.state === "unavailable";
  const locked = lock?.state === "locked";

  const chem = [
    { Icon: Thermometer, k: "Water temp", v: fmt(useEntity(PL.temp), 1), u: "°C", color: "var(--gold)" },
    { Icon: FlaskConical, k: "pH", v: fmt(useEntity(PL.ph), 1), u: "", color: "var(--success)" },
    { Icon: Droplets, k: "Chlorine", v: fmt(useEntity(PL.chlorine), 0), u: "", color: "#5aa9e6" },
  ];

  const togglePump = () => {
    if (pumpUnavail) return;
    onToast?.("power", `Pool pump ${pumpOn ? "off" : "on"}`);
    call("switch", "toggle", {}, { entity_id: PL.pump });
  };
  const toggleLock = () => {
    onToast?.("lock", `Ent. area ${locked ? "unlocking" : "locking"}`);
    call("lock", locked ? "unlock" : "lock", {}, { entity_id: PL.entLock });
  };

  return (
    <div className="sysview">
      <div className="sv-head">
        <Waves size={18} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Swimming Pool</span>
        <span className={"sv-pill " + (pumpOn ? "ok" : "")}>{pumpUnavail ? "Unavailable" : pumpOn ? "Pump running" : "Pump off"}</span>
        <div style={{ marginLeft: "auto" }}>
          <Switch on={pumpOn} onClick={togglePump} disabled={pumpUnavail} ariaLabel="Pool pump" />
        </div>
      </div>

      <div className="pool-grid">
        <div className="pool-card pool-chem">
          {chem.map((c) => (
            <div key={c.k} className="pool-chem-stat">
              <c.Icon size={22} strokeWidth={2} color={c.color} />
              <div className="pool-chem-v tabular" style={{ color: c.color }}>{c.v}<span className="u">{c.u}</span></div>
              <div className="pool-chem-k">{c.k}</div>
            </div>
          ))}
        </div>

        <div className="pool-card">
          <div className="pool-card-h">Pump runtime</div>
          <div className="pool-runtime">
            <div><div className="pool-rt-v tabular">{fmt(today, 1)}<span className="u">h</span></div><div className="pool-rt-l">Today</div></div>
            <div><div className="pool-rt-v tabular">{fmt(week, 1)}<span className="u">h</span></div><div className="pool-rt-l">This week</div></div>
          </div>
          <div className="pool-card-h" style={{ marginTop: 14 }}>Weekly schedule</div>
          <div className="pool-days">{PL.schedule.map((d) => <DayChip key={d.d} day={d} />)}</div>
        </div>

        <div className="pool-card">
          <div className="pool-card-h" style={{ display: "flex", alignItems: "center" }}>
            Entertainment area
            <button type="button" className={"pool-lock" + (locked ? " locked" : " open")} onClick={toggleLock} style={{ marginLeft: "auto" }}>
              {locked ? <Lock size={14} strokeWidth={2.4} /> : <Unlock size={14} strokeWidth={2.4} />}
              {locked ? "Locked" : "Unlocked"}
            </button>
          </div>
          <div className="pool-lights">{PL.lights.map((l) => <LightTile key={l.id} light={l} />)}</div>
        </div>
      </div>
    </div>
  );
}
