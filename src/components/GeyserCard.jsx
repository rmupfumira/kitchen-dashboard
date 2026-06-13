import { Flame, Minus, Plus, Droplet } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";
import Switch from "./Switch";

/**
 * Geyser control (replaces the AC card).
 * Big current water temperature + on/off + target setpoint stepper.
 */
export default function GeyserCard({ onToast }) {
  const toggleEnt = useEntity(ENTITIES.geyser.toggle);
  const curEnt = useEntity(ENTITIES.geyser.currentTemp);
  const tgtEnt = useEntity(ENTITIES.geyser.targetTemp);
  const call = useService();

  const on = toggleEnt?.state === "on";
  const unavail = !toggleEnt || toggleEnt.state === "unavailable";
  const current = Number(curEnt?.state);
  const target = Number(tgtEnt?.state);
  const tgtMin = Number(tgtEnt?.attributes?.min) || 30;
  const tgtMax = Number(tgtEnt?.attributes?.max) || 80;
  const tgtStep = Number(tgtEnt?.attributes?.step) || 1;

  const toggle = () => {
    onToast?.(on ? "power-off" : "power", `Geyser ${on ? "off" : "on"}`);
    call(ENTITIES.geyser.toggle.split(".")[0], "toggle", {}, { entity_id: ENTITIES.geyser.toggle });
  };
  const adjust = (delta) => {
    if (!Number.isFinite(target)) return;
    const v = Math.max(tgtMin, Math.min(tgtMax, target + delta));
    onToast?.("thermometer", `Geyser target ${v}°`);
    call("input_number", "set_value", { value: v }, { entity_id: ENTITIES.geyser.targetTemp });
  };

  return (
    <div className="geyser rise">
      <div className="geyser-head">
        <Flame size={16} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Geyser</span>
        <div style={{ flex: 1 }} />
        <Switch on={on} onClick={toggle} disabled={unavail} ariaLabel="Geyser" />
      </div>

      <div className="geyser-body">
        <div className="geyser-cur">
          <div className="geyser-cur-v tabular">
            {Number.isFinite(current) ? Math.round(current) : "—"}<span className="u">°</span>
          </div>
          <div className="geyser-cur-l">
            <Droplet size={13} strokeWidth={2} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Water temp · {unavail ? "Unavailable" : on ? "Heating on" : "Off"}
          </div>
        </div>

        <div className="geyser-target">
          <button type="button" className="geyser-step" onClick={() => adjust(-tgtStep)} aria-label="lower">
            <Minus size={18} strokeWidth={2.4} />
          </button>
          <div className="geyser-target-mid">
            <div className="geyser-target-v tabular">{Number.isFinite(target) ? Math.round(target) : "—"}°</div>
            <div className="geyser-target-l">Target</div>
          </div>
          <button type="button" className="geyser-step" onClick={() => adjust(tgtStep)} aria-label="raise">
            <Plus size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
