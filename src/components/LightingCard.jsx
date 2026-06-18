import * as L from "lucide-react";
import { Lightbulb, Zap, ChevronRight } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

function toPascal(name) {
  return String(name).split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/** Big ON/OFF status tile for a switch or light. Whole tile toggles. */
function SwitchStatus({ tile }) {
  const ent = useEntity(tile.entity);
  const call = useService();
  const Icon = L[toPascal(tile.icon)] || Lightbulb;
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";

  const toggle = () => {
    if (unavail) return;
    call(tile.entity.split(".")[0], "toggle", {}, { entity_id: tile.entity });
  };

  return (
    <div
      className={"klx-tile" + (on ? " on" : "") + (unavail ? " unavail" : "")}
      onClick={toggle}
      role="button"
      tabIndex={unavail ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !unavail) toggle();
      }}
    >
      <div className="klx-top">
        <div className="klx-ic">
          <Icon size={26} strokeWidth={2} />
        </div>
      </div>
      <div>
        <div className="klx-n">{tile.name}</div>
        <div className="klx-state">{unavail ? "Offline" : on ? "ON" : "OFF"}</div>
      </div>
    </div>
  );
}

/**
 * Room lighting card. `config` (from ENTITIES.lighting[room]) supplies the
 * title, the switch tiles, and whether to append an LED-strips nav tile.
 */
export default function LightingCard({ config, onToast, onOpenLighting }) {
  const { entities } = useHA();
  const strips = ENTITIES.kitchen.strips;
  const liveCount = strips.filter((s) => entities[s.light] && entities[s.light].state !== "unavailable").length;

  return (
    <div className="klx rise">
      <div className="klx-head">
        <span className="sect-title">{config.title}</span>
      </div>

      <div className="klx-row">
        {config.tiles.map((t) => (
          <SwitchStatus key={t.id} tile={t} />
        ))}

        {config.ledNav && (
          <div
            className="klx-tile klx-nav"
            onClick={onOpenLighting}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onOpenLighting();
            }}
          >
            <div className="klx-top">
              <div className="klx-ic">
                <Zap size={26} strokeWidth={2} />
              </div>
              <div className="klx-nav-arrow">
                <ChevronRight size={22} strokeWidth={2.4} />
              </div>
            </div>
            <div>
              <div className="klx-n">LED Strips</div>
              <div className="klx-nav-sub">{strips.length} Devices{liveCount === 0 ? " · offline" : ""}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
