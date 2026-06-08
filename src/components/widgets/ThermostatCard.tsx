import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Ring } from "@/components/ui/Ring";
import { Switch } from "@/components/ui/Switch";
import type { ClimateState } from "@/data/mock";
import { CardHead } from "./CardHead";

const MODES = [
  { id: "cool" as const, icon: "snowflake" },
  { id: "heat" as const, icon: "flame" },
  { id: "fan" as const, icon: "fan" },
  { id: "dry" as const, icon: "droplets" },
  { id: "auto" as const, icon: "sparkles" },
];

interface ThermostatCardProps {
  climate: ClimateState;
  on: boolean;
  set: (patch: Partial<ClimateState>) => void;
  toggle: () => void;
}

/**
 * ThermostatCard — circular dial showing target temp, +/- buttons,
 * mode chips (cool/heat/fan/dry/auto), and swing/auto sub-switches.
 *
 * Target temp range is 16°-30°C in 0.5° steps. The Ring fills from
 * 0 (=16°) to 100 (=30°).
 */
export function ThermostatCard({ climate, on, set, toggle }: ThermostatCardProps) {
  const adjust = (delta: number) =>
    set({ target: Math.max(16, Math.min(30, climate.target + delta)) });

  return (
    <div className="card rise" style={{ gridColumn: "span 6" }}>
      <CardHead
        icon="thermometer"
        title="Room Temperature"
        sub={`Now ${climate.temp}°C · ${on ? "Running" : "Idle"}`}
        right={<Switch on={on} onClick={toggle} />}
      />

      <div className="thermo">
        <div style={{ fontSize: 13, color: "var(--ink-mute)", fontWeight: 600 }}>
          Current {climate.temp}°C
        </div>

        <div className="thermo-row">
          <button
            type="button"
            className="round-btn"
            onClick={() => adjust(-0.5)}
            aria-label="cooler"
          >
            −
          </button>

          <div className="dial-wrap">
            <Ring value={((climate.target - 16) / 14) * 100} size={190} thickness={14} />
            <div className="dial-center">
              <div className="dial-knob">
                <span className="nub" />
                <span className="t">{climate.target}°</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="round-btn"
            onClick={() => adjust(0.5)}
            aria-label="warmer"
          >
            +
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", width: 220, marginTop: 2 }}>
          <span className="thermo-edge">16°C</span>
          <span className="thermo-edge warm">30°C</span>
        </div>
      </div>

      <div
        className="split-row"
        style={{ marginTop: 16, borderTop: "1px solid var(--glass-line-2)", paddingTop: 14 }}
      >
        <div className="seg-lbl">
          <Icon name="wind" size={17} color="var(--ink-mute)" />
          <span>Swing</span>
          <Switch on={climate.swing} onClick={() => set({ swing: !climate.swing })} />
        </div>
        <div className="vdiv" />
        <div className="seg-lbl">
          <Icon name="sparkles" size={17} color="var(--ink-mute)" />
          <span>Auto</span>
          <Switch on={climate.auto} onClick={() => set({ auto: !climate.auto })} />
        </div>
      </div>

      <div className="mode-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={clsx("mode-btn", climate.mode === m.id && "on")}
            onClick={() => set({ mode: m.id })}
            aria-label={m.id}
          >
            <Icon name={m.icon} size={19} />
          </button>
        ))}
      </div>
    </div>
  );
}
