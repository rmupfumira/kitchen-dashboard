import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import type { Scene } from "@/data/mock";
import { CardHead } from "./CardHead";

interface ScenesStripProps {
  scenes: Scene[];
  active: string | null;
  onRun: (scene: Scene) => void;
}

/**
 * ScenesStrip — full-width row of scene pills inside the dashboard.
 * The user gets one-tap activation; full ScenesView shows descriptions.
 */
export function ScenesStrip({ scenes, active, onRun }: ScenesStripProps) {
  return (
    <div className="card rise" style={{ gridColumn: "span 12" }}>
      <CardHead icon="sparkles" title="Scenes" sub="One tap to set the mood" />
      <div className="scene-strip">
        {scenes.map((s) => (
          <button
            key={s.id}
            type="button"
            className={clsx("scene-pill", active === s.id && "on")}
            onClick={() => onRun(s)}
          >
            <span className="sp-ic">
              <Icon name={s.icon} size={18} />
            </span>
            <span className="sp-tx">
              <b>{s.name}</b>
              <i>{s.desc}</i>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
