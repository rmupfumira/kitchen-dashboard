import clsx from "clsx";
import { Arc } from "@/components/ui/Arc";
import { Switch } from "@/components/ui/Switch";
import type { ClimateState } from "@/data/mock";
import { CardHead } from "./CardHead";
import { Placeholder } from "./Placeholder";

const WATTS = [12, 18, 20, 24];

interface LightCardProps {
  climate: ClimateState;
  on: boolean;
  roomName: string;
  set: (patch: Partial<ClimateState>) => void;
  toggle: () => void;
}

/**
 * LightCard — 270° arc dial for brightness + watt chips + image slot.
 * Used for every room except Kitchen (which uses MoodCard instead).
 */
export function LightCard({ climate, on, roomName, set, toggle }: LightCardProps) {
  const label =
    climate.brightness > 66 ? "High" : climate.brightness > 33 ? "Medium" : "Low";

  return (
    <div className="card rise" style={{ gridColumn: "span 6", minHeight: 300 }}>
      <CardHead
        icon="lightbulb"
        title="Ambient Light"
        sub={`${roomName} · ${climate.watt}W`}
        right={<Switch on={on} onClick={toggle} />}
      />

      <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 7 }}>
            {WATTS.map((w) => (
              <button
                key={w}
                type="button"
                className={clsx("chip", climate.watt === w && "on")}
                onClick={() => set({ watt: w })}
              >
                {w}W
              </button>
            ))}
          </div>

          <div
            style={{
              position: "relative",
              opacity: on ? 1 : 0.4,
              transition: "opacity .3s",
              pointerEvents: on ? "auto" : "none",
            }}
          >
            <Arc
              value={climate.brightness}
              onChange={(v) => set({ brightness: v })}
              size={210}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.03em" }}>
                  {climate.brightness}%
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 600 }}>
                  {label}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: 200,
              fontSize: 12,
              color: "var(--ink-mute)",
              fontWeight: 600,
              marginTop: -6,
            }}
          >
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            minHeight: 200,
            alignSelf: "stretch",
          }}
        >
          <Placeholder label="Lamp / room photo" />
        </div>
      </div>
    </div>
  );
}
