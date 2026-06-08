import { useState } from "react";
import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { scenes, type Scene } from "@/data/mock";
import { useDashboardStore } from "@/state/useDashboardStore";

const AUTOMATIONS = [
  { ic: "sunrise", t: "Sunrise routine", d: "Open blinds & warm lights at dawn", on: true },
  { ic: "moon", t: "Auto night mode", d: "Dim everything after 11:00 PM", on: true },
  { ic: "thermometer", t: "Eco thermostat", d: "Drop to 19° when nobody's home", on: false },
  { ic: "shield", t: "Arm on leave", d: "Cameras + locks when last phone exits", on: true },
];

interface AutomationRowProps {
  ic: string;
  t: string;
  d: string;
  on: boolean;
  last?: boolean;
}

function AutomationRow({ ic, t, d, on, last }: AutomationRowProps) {
  const [v, setV] = useState(on);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        borderBottom: last ? "none" : "1px solid var(--glass-line-2)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          display: "grid",
          placeItems: "center",
          background: "var(--glass)",
          color: "var(--amber-deep)",
          flexShrink: 0,
        }}
      >
        <Icon name={ic} size={19} />
      </div>
      <div style={{ flex: 1 }}>
        <b style={{ fontSize: 14, fontWeight: 700 }}>{t}</b>
        <div style={{ fontSize: 12.5, color: "var(--ink-mute)", fontWeight: 500 }}>{d}</div>
      </div>
      <Switch on={v} onClick={() => setV(!v)} />
    </div>
  );
}

/**
 * ScenesView — scene-tile grid + a list of HA automations with on/off toggles.
 */
export function ScenesView() {
  const { activeScene, setActiveScene, fireToast } = useDashboardStore();
  const activate = (s: Scene) => {
    setActiveScene(s.id);
    fireToast("sparkles", `${s.name} scene activated`);
  };

  return (
    <div className="rise">
      <div className="view-head">
        <h2>Scenes &amp; Automations</h2>
        <p>Tap to run · {scenes.length} scenes configured</p>
      </div>

      <div className="scene-grid">
        {scenes.map((s) => (
          <div
            key={s.id}
            className={clsx("scene", activeScene === s.id && "active")}
            onClick={() => activate(s)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") activate(s);
            }}
          >
            <div className="scene-ic">
              <Icon name={s.icon} size={24} />
            </div>
            <h3>{s.name}</h3>
            <p>{s.desc}</p>
            {activeScene === s.id && (
              <div
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  color: "var(--amber-deep)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Icon name="check-circle-2" size={16} />
                Active
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="view-head" style={{ marginTop: 30 }}>
        <h2 style={{ fontSize: 18 }}>Automations</h2>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {AUTOMATIONS.map((a, i) => (
          <AutomationRow key={a.t} {...a} last={i === AUTOMATIONS.length - 1} />
        ))}
      </div>
    </div>
  );
}
