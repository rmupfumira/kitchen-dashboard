import { LampCeiling, Lightbulb, Zap, Power } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

const SWITCH_ICONS = { pendant: LampCeiling, down: Lightbulb, peninsula: Lightbulb };

/**
 * One control tile. Works for both switch.* (on/off only) and light.*
 * (toggle + brightness slider). The whole tile toggles on tap; the slider
 * stops propagation so dragging never accidentally toggles.
 */
function Tile({ name, entity, Icon, big = false, onToast }) {
  const ent = useEntity(entity);
  const call = useService();
  const domain = entity.split(".")[0];

  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const dimmable = domain === "light";
  const bri = ent?.attributes?.brightness ?? 0;
  const pct = on ? Math.round((bri / 255) * 100) : 0;

  const toggle = () => {
    if (unavail) return;
    onToast?.(on ? "power-off" : "power", `${name} ${on ? "off" : "on"}`);
    call(domain, "toggle", {}, { entity_id: entity });
  };
  const setBri = (p) => call("light", "turn_on", { brightness_pct: p }, { entity_id: entity });

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
      <div className="klx-tile-top">
        <div className="klx-ic">
          <Icon size={big ? 19 : 16} strokeWidth={2} />
        </div>
        <Power size={14} strokeWidth={2.2} color={on ? "var(--gold)" : "var(--ink-faint)"} />
      </div>
      <div>
        <div className="klx-n">{name}</div>
        <div className="klx-s">{unavail ? "Offline" : dimmable ? (on ? `${pct}%` : "Off") : on ? "On" : "Off"}</div>
        {dimmable && (
          <input
            type="range"
            className="klx-slider"
            min={1}
            max={100}
            value={pct}
            disabled={unavail || !on}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setBri(Number(e.target.value))}
            style={{ ["--vp"]: `${pct}%` }}
            aria-label={`${name} brightness`}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Center hero — Kitchen Lighting.
 * Row 1 (taller): the 3 physical switches (pendant + 2 downlighter sets).
 * Rows 2-3: the 6 WLED zones with brightness sliders.
 */
export default function KitchenCard({ onToast }) {
  const { entities } = useHA();
  const call = useService();

  const stripIds = ENTITIES.kitchen.strips.map((s) => s.entity);
  const liveStrips = stripIds.filter((id) => entities[id] && entities[id].state !== "unavailable");
  const onCount = stripIds.filter((id) => entities[id]?.state === "on").length;
  const anyOn = onCount > 0;

  const masterToggle = () => {
    if (!liveStrips.length) return;
    onToast?.(anyOn ? "power-off" : "power", anyOn ? "All zones off" : "All zones on");
    call("light", anyOn ? "turn_off" : "turn_on", {}, { entity_id: liveStrips });
  };

  return (
    <div className="card rise klx">
      <div className="klx-head">
        <span className="sect-title">Kitchen Lighting</span>
        <div className="spacer" />
        <button
          type="button"
          className={"switch" + (anyOn ? " on" : "")}
          onClick={masterToggle}
          disabled={!liveStrips.length}
          aria-label="All zones"
          title={liveStrips.length ? "Toggle all zones" : "Zones offline"}
          style={!liveStrips.length ? { opacity: 0.35 } : undefined}
        />
      </div>

      <div className="klx-grid">
        {ENTITIES.kitchen.switches.map((sw) => (
          <Tile
            key={sw.id}
            name={sw.name}
            entity={sw.entity}
            Icon={SWITCH_ICONS[sw.id] || Lightbulb}
            big
            onToast={onToast}
          />
        ))}
        {ENTITIES.kitchen.strips.map((s) => (
          <Tile key={s.id} name={s.name} entity={s.entity} Icon={Zap} onToast={onToast} />
        ))}
      </div>
    </div>
  );
}
