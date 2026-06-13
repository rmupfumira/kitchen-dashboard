import { LampCeiling, Lightbulb, Zap, ChevronRight } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

const SWITCH_ICONS = { pendant: LampCeiling, down: Lightbulb, peninsula: Lightbulb };

/**
 * Large ON/OFF status card for a simple switch (correction 3).
 * No slider — just a big glanceable state. Whole card toggles.
 */
function SwitchStatus({ name, entity, Icon, onToast }) {
  const ent = useEntity(entity);
  const call = useService();
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";

  const toggle = () => {
    if (unavail) return;
    onToast?.(on ? "power-off" : "power", `${name} ${on ? "off" : "on"}`);
    call(entity.split(".")[0], "toggle", {}, { entity_id: entity });
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
      <div className="klx-ic">
        <Icon size={32} strokeWidth={2} />
      </div>
      <div>
        <div className="klx-n">{name}</div>
        <div className="klx-state">{unavail ? "Offline" : on ? "ON" : "OFF"}</div>
      </div>
    </div>
  );
}

/**
 * Kitchen Lighting hero — 2×2 grid:
 *   Pendant · Downlighters · Peninsula  (big ON/OFF status, correction 3)
 *   LED Strips — navigates to the lighting control view (correction 4)
 */
export default function KitchenCard({ onToast, onOpenLighting }) {
  const { entities } = useHA();
  const strips = ENTITIES.kitchen.strips;
  const liveCount = strips.filter((s) => entities[s.entity] && entities[s.entity].state !== "unavailable").length;

  return (
    <div className="klx rise">
      <div className="klx-head">
        <span className="sect-title">Kitchen Lighting</span>
      </div>

      <div className="klx-grid2">
        {ENTITIES.kitchen.switches.map((sw) => (
          <SwitchStatus
            key={sw.id}
            name={sw.name}
            entity={sw.entity}
            Icon={SWITCH_ICONS[sw.id] || Lightbulb}
            onToast={onToast}
          />
        ))}

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
              <Zap size={32} strokeWidth={2} />
            </div>
            <div className="klx-nav-arrow">
              <ChevronRight size={24} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div className="klx-n">LED Strips</div>
            <div className="klx-nav-sub">{strips.length} Devices{liveCount === 0 ? " · offline" : ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
