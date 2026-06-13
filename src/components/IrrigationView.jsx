import { Sprout, Power, Play, Square, Recycle, Clock, Timer, Droplets, AlertTriangle } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";
import Switch from "./Switch";

const isOn = (ent) => ent?.state === "on";
const num = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };

/** A small labelled toggle row (switch or input_boolean). */
function ToggleRow({ id, name, Icon }) {
  const ent = useEntity(id);
  const call = useService();
  const on = isOn(ent);
  const unavail = !ent || ent.state === "unavailable";
  const toggle = () => !unavail && call(id.split(".")[0], "toggle", {}, { entity_id: id });
  return (
    <div className={"irr-row" + (on ? " on" : "")}>
      {Icon && <Icon size={18} strokeWidth={2} className="irr-row-ic" />}
      <span className="irr-row-n">{name}</span>
      <Switch on={on} onClick={toggle} disabled={unavail} ariaLabel={name} />
    </div>
  );
}

function TankBar({ tank }) {
  const ent = useEntity(tank.entity);
  const v = num(ent);
  const pct = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
  const low = Number.isFinite(v) && v < 20;
  return (
    <div className="irr-tank">
      <div className="irr-tank-top">
        <span className="irr-tank-n">{tank.name}</span>
        <span className="irr-tank-v tabular" style={{ color: low ? "var(--warning)" : "var(--ink)" }}>
          {Number.isFinite(v) ? Math.round(v) : "—"}<span className="u">%</span>
        </span>
      </div>
      <div className="irr-tank-track"><div className="irr-tank-fill" style={{ width: pct + "%", background: low ? "var(--warning)" : "var(--gold)" }} /></div>
    </div>
  );
}

/** Full-page Irrigation / garden view. */
export default function IrrigationView({ onToast }) {
  const I = ENTITIES.irrigation;
  const call = useService();
  const tanksEmpty = useEntity(I.tanksEmpty);
  const schedTime = useEntity(I.scheduledTime);
  const duration = useEntity(I.duration);

  const pulse = (id, label) => { onToast?.("sprout", label); call("input_boolean", "turn_on", {}, { entity_id: id }); };

  return (
    <div className="sysview">
      <div className="sv-head">
        <Sprout size={18} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Irrigation</span>
        {isOn(tanksEmpty) && (
          <span className="sv-pill warn"><AlertTriangle size={14} strokeWidth={2.4} /> Tanks empty</span>
        )}
        <div className="irr-actions">
          <button type="button" className="irr-btn go" onClick={() => pulse(I.runFull, "Running full cycle")}>
            <Play size={15} strokeWidth={2.4} /> Run full cycle
          </button>
          <button type="button" className="irr-btn stop" onClick={() => pulse(I.stop, "Stopping irrigation")}>
            <Square size={14} strokeWidth={2.6} /> Stop
          </button>
        </div>
      </div>

      <div className="irr-grid">
        <div className="irr-card">
          <div className="irr-card-h">Zones</div>
          {I.zones.map((z) => <ToggleRow key={z.id} id={z.entity} name={z.name} Icon={Droplets} />)}
        </div>

        <div className="irr-card">
          <div className="irr-card-h">Supply</div>
          <ToggleRow id={I.pump} name="Irrigation Pump" Icon={Power} />
          <ToggleRow id={I.greyWater} name="Grey Water" Icon={Recycle} />
          <div className="irr-meta">
            <div className="irr-meta-row"><Clock size={15} strokeWidth={2} /><span>Scheduled</span><b className="tabular">{schedTime?.state?.slice(0, 5) || "—"}</b></div>
            <div className="irr-meta-row"><Timer size={15} strokeWidth={2} /><span>Zone duration</span><b className="tabular">{Number.isFinite(num(duration)) ? `${Math.round(num(duration))} min` : "—"}</b></div>
          </div>
        </div>

        <div className="irr-card">
          <div className="irr-card-h">Tank levels</div>
          {I.tanks.map((t) => <TankBar key={t.id} tank={t} />)}
        </div>
      </div>
    </div>
  );
}
