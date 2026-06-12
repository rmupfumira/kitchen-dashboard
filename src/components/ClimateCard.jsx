import { Snowflake, Flame, Fan, Wind, CircleGauge, Power, Plus, Minus, Thermometer } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

const MODES = [
  { id: "cool", Icon: Snowflake, label: "Cool" },
  { id: "heat", Icon: Flame, label: "Heat" },
  { id: "fan_only", Icon: Fan, label: "Fan" },
  { id: "dry", Icon: Wind, label: "Dry" },
  { id: "auto", Icon: CircleGauge, label: "Auto" },
];

/** Living Room AC — circular dial + mode column + power. */
export default function ClimateCard({ onToast }) {
  const ent = useEntity(ENTITIES.climate);
  const call = useService();

  const target = Number(ent?.attributes?.temperature);
  const currentRaw = Number(ent?.attributes?.current_temperature);
  const current = Number.isFinite(currentRaw) && Math.abs(currentRaw) > 0.01 ? currentRaw : null;
  const hvacMode = ent?.state || "off";
  const minT = Number(ent?.attributes?.min_temp) || 16;
  const maxT = Number(ent?.attributes?.max_temp) || 30;
  const step = Number(ent?.attributes?.target_temp_step) || 1;
  const isOn = hvacMode !== "off" && hvacMode !== "unavailable";
  const unavail = !ent || hvacMode === "unavailable";

  const adjust = (delta) => {
    if (!Number.isFinite(target)) return;
    const t = Math.max(minT, Math.min(maxT, target + delta));
    onToast?.("thermometer", `Target ${t}°C`);
    call("climate", "set_temperature", { temperature: t }, { entity_id: ENTITIES.climate });
  };
  const setMode = (mode) => {
    onToast?.("fan", mode.replace("_", " "));
    call("climate", "set_hvac_mode", { hvac_mode: mode }, { entity_id: ENTITIES.climate });
  };
  const togglePower = () => {
    onToast?.("power", isOn ? "AC off" : "AC on");
    call("climate", isOn ? "turn_off" : "turn_on", {}, { entity_id: ENTITIES.climate });
  };

  return (
    <div className="card rise clim">
      <div className="clim-left">
        <div className="clim-head">
          <Thermometer size={15} strokeWidth={2} color="var(--gold)" />
          <span className="sect-title">Air Conditioner</span>
        </div>
        <div className="clim-dial-wrap">
          <button type="button" className="clim-step" onClick={() => adjust(-step)} disabled={unavail || !isOn} aria-label="cooler">
            <Minus size={15} strokeWidth={2.4} />
          </button>
          <div className="clim-dial">
            <div>
              <div className="clim-t tabular">
                {Number.isFinite(target) ? Math.round(target) : "—"}
                <span className="u">°C</span>
              </div>
              <div className="clim-cur">
                {unavail ? "Unavailable" : current != null ? `Current ${current.toFixed(1)}°` : isOn ? hvacMode.replace("_", " ") : "Off"}
              </div>
            </div>
          </div>
          <button type="button" className="clim-step" onClick={() => adjust(step)} disabled={unavail || !isOn} aria-label="warmer">
            <Plus size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="clim-modes">
        <button type="button" className={"clim-mode" + (isOn ? " on" : "")} onClick={togglePower} disabled={unavail}>
          <Power size={13} strokeWidth={2.2} />
          Power
        </button>
        {MODES.map(({ id, Icon, label }) => (
          <button
            key={id}
            type="button"
            className={"clim-mode" + (hvacMode === id ? " on" : "")}
            onClick={() => setMode(id)}
            disabled={unavail}
          >
            <Icon size={13} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
