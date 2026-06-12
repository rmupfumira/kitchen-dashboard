import * as L from "lucide-react";
import { Lightbulb, LampCeiling, Zap, Power } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";
import Switch from "./Switch";

function toPascal(name) {
  return String(name)
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/** One WLED strip tile — toggle + brightness slider. */
function StripTile({ strip, onToast }) {
  const ent = useEntity(strip.entity);
  const call = useService();

  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const bri = ent?.attributes?.brightness ?? 0;
  const pct = on ? Math.round((bri / 255) * 100) : 0;

  const toggle = () => {
    if (unavail) return;
    onToast?.(on ? "power-off" : "power", `${strip.name} ${on ? "off" : "on"}`);
    call("light", "toggle", {}, { entity_id: strip.entity });
  };

  const setBri = (newPct) => {
    call("light", "turn_on", { brightness_pct: newPct }, { entity_id: strip.entity });
  };

  return (
    <div className={"kstrip" + (on ? " on" : "") + (unavail ? " unavail" : "")}>
      <div className="kstrip-top">
        <div className="kstrip-ic">
          <Zap size={15} strokeWidth={2} />
        </div>
        <Switch on={on} onClick={toggle} disabled={unavail} ariaLabel={strip.name} />
      </div>
      <div className="kstrip-name">{strip.name}</div>
      <div className="kstrip-state mlabel">
        {unavail ? "Offline" : on ? `${pct}%` : "Off"}
      </div>
      <input
        type="range"
        className="kstrip-slider"
        min={1}
        max={100}
        value={pct}
        onChange={(e) => setBri(Number(e.target.value))}
        disabled={unavail || !on}
        style={{ ["--vp"]: `${pct}%` }}
        aria-label={`${strip.name} brightness`}
      />
    </div>
  );
}

/** One switch row — pendant / downlighter sets (plain on/off). */
function SwitchRow({ sw, onToast }) {
  const ent = useEntity(sw.entity);
  const call = useService();
  const Icon = L[toPascal(sw.icon)] || Lightbulb;

  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";

  const toggle = () => {
    if (unavail) return;
    onToast?.(on ? "power-off" : "power", `${sw.name} ${on ? "off" : "on"}`);
    call("switch", "toggle", {}, { entity_id: sw.entity });
  };

  return (
    <div
      className={"ksw" + (on ? " on" : "") + (unavail ? " unavail" : "")}
      onClick={toggle}
      role="button"
      tabIndex={unavail ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !unavail) toggle();
      }}
    >
      <div className="ksw-ic">
        <Icon size={17} strokeWidth={2} />
      </div>
      <div className="ksw-meta">
        <div className="ksw-name">{sw.name}</div>
        <div className="ksw-state mlabel">{unavail ? "Offline" : on ? "On" : "Off"}</div>
      </div>
      <Switch on={on} onClick={toggle} disabled={unavail} ariaLabel={sw.name} />
    </div>
  );
}

/**
 * Kitchen Lighting — span 12.
 * Left: 6 WLED under-cabinet strips (toggle + brightness each).
 * Right: 3 plain switches (pendant + 2 downlighter sets).
 * Header has a master toggle for all strips at once.
 */
export default function KitchenCard({ onToast }) {
  const { entities } = useHA();
  const call = useService();

  const stripIds = ENTITIES.kitchen.strips.map((s) => s.entity);
  const liveStrips = stripIds.filter((id) => entities[id] && entities[id].state !== "unavailable");
  const onCount = stripIds.filter((id) => entities[id]?.state === "on").length;
  const anyOn = onCount > 0;

  const masterToggle = () => {
    if (liveStrips.length === 0) return;
    onToast?.(anyOn ? "power-off" : "power", anyOn ? "All strips off" : "All strips on");
    call("light", anyOn ? "turn_off" : "turn_on", {}, { entity_id: liveStrips });
  };

  return (
    <div className="span-kitchen" style={{ gridColumn: "span 12" }}>
      <div className="card rise">
        <div className="card-head">
          <div className="card-ic" style={{ color: "var(--warn)" }}>
            <LampCeiling size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="card-title">Kitchen Lighting</div>
            <div className="card-sub mlabel">
              {liveStrips.length === 0
                ? "Strips offline — pendant & downlighters live"
                : `${onCount}/${ENTITIES.kitchen.strips.length} strips on`}
            </div>
          </div>
          <div className="spacer" />
          <button
            type="button"
            className={"chip" + (anyOn ? " on" : "")}
            onClick={masterToggle}
            disabled={liveStrips.length === 0}
            style={liveStrips.length === 0 ? { opacity: 0.4, pointerEvents: "none" } : undefined}
          >
            <Power size={13} strokeWidth={2.4} />
            {anyOn ? "All off" : "All on"}
          </button>
        </div>

        <div className="kitchen-body">
          <div className="kstrip-grid">
            {ENTITIES.kitchen.strips.map((s) => (
              <StripTile key={s.id} strip={s} onToast={onToast} />
            ))}
          </div>
          <div className="ksw-col">
            {ENTITIES.kitchen.switches.map((sw) => (
              <SwitchRow key={sw.id} sw={sw} onToast={onToast} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
