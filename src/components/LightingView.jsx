import { useState } from "react";
import { ArrowLeft, Zap, Power, Palette, Sparkles, SlidersHorizontal } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

/* Preset colours for the swatch row (RGB). */
const SWATCHES = [
  { name: "Warm", rgb: [255, 170, 90] },
  { name: "Soft", rgb: [255, 214, 170] },
  { name: "Cool", rgb: [205, 228, 255] },
  { name: "Amber", rgb: [255, 150, 40] },
  { name: "Crimson", rgb: [255, 60, 70] },
  { name: "Azure", rgb: [70, 150, 255] },
];

/* Fallback effects if the entity doesn't expose effect_list. */
const FALLBACK_EFFECTS = ["Solid", "Breathe", "Rainbow", "Twinkle", "Fireworks", "Wipe"];

/** One individual strip control in the right column. */
function StripCard({ strip }) {
  const ent = useEntity(strip.entity);
  const call = useService();
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const bri = ent?.attributes?.brightness ?? 0;
  const pct = on ? Math.round((bri / 255) * 100) : 0;

  return (
    <div className={"lv-strip" + (on ? " on" : "") + (unavail ? " unavail" : "")}>
      <div className="lv-strip-top">
        <span className="lv-strip-n">{strip.name}</span>
        <span
          className={"switch" + (on ? " on" : "")}
          role="button"
          aria-label={strip.name}
          onClick={() => !unavail && call("light", "toggle", {}, { entity_id: strip.entity })}
        />
      </div>
      <div className="lv-strip-s">{unavail ? "Offline" : on ? `${pct}% brightness` : "Off"}</div>
      <input
        type="range"
        className="klx-slider"
        min={1}
        max={100}
        value={pct}
        disabled={unavail || !on}
        onChange={(e) => call("light", "turn_on", { brightness_pct: Number(e.target.value) }, { entity_id: strip.entity })}
        style={{ ["--vp"]: `${pct}%`, marginTop: 12 }}
        aria-label={`${strip.name} brightness`}
      />
    </div>
  );
}

/**
 * Dedicated WLED lighting control view (correction 4):
 * master brightness · colour swatches · effects · individual strips.
 * Controls target every live strip at once; per-strip on the right.
 */
export default function LightingView({ onBack, onToast }) {
  const { entities } = useHA();
  const call = useService();
  const strips = ENTITIES.kitchen.strips;

  const liveStrips = strips.filter((s) => entities[s.entity] && entities[s.entity].state !== "unavailable");
  const liveIds = liveStrips.map((s) => s.entity);
  const anyOn = liveStrips.some((s) => entities[s.entity]?.state === "on");
  const offline = liveStrips.length === 0;

  // master brightness = avg of live strips that are on
  const onStrips = liveStrips.filter((s) => entities[s.entity]?.state === "on");
  const avgBri = onStrips.length
    ? Math.round(onStrips.reduce((a, s) => a + (entities[s.entity]?.attributes?.brightness ?? 0), 0) / onStrips.length / 255 * 100)
    : 0;
  const [master, setMaster] = useState(avgBri || 60);

  const firstEnt = entities[liveStrips[0]?.entity];
  const effectList = firstEnt?.attributes?.effect_list || FALLBACK_EFFECTS;
  const activeEffect = firstEnt?.attributes?.effect;

  const applyAll = (data) => {
    if (offline) return;
    call("light", "turn_on", data, { entity_id: liveIds });
  };
  const toggleAll = () => {
    if (offline) return;
    onToast?.(anyOn ? "power-off" : "power", anyOn ? "All strips off" : "All strips on");
    call("light", anyOn ? "turn_off" : "turn_on", {}, { entity_id: liveIds });
  };

  return (
    <div className="lux-detail">
      <div className="dv-head">
        <button type="button" className="dv-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={24} strokeWidth={2.2} />
        </button>
        <div>
          <div className="dv-title">Kitchen Lighting</div>
          <div className="dv-sub">{strips.length} LED strips · {offline ? "all offline" : `${liveStrips.length} online`}</div>
        </div>
        <button
          type="button"
          className={"switch" + (anyOn ? " on" : "")}
          onClick={toggleAll}
          aria-label="All strips"
          style={{ marginLeft: "auto", transform: "scale(1.3)", marginRight: 14 }}
        />
      </div>

      <div className="lv-body">
        <div className="lv-left">
          <div className="lv-panel">
            <div className="lv-panel-title"><SlidersHorizontal size={14} strokeWidth={2} style={{ verticalAlign: "-2px", marginRight: 6 }} />Brightness</div>
            <div className="lv-master">
              <span className="lv-master-pct">{master}%</span>
              <input
                type="range"
                className="lv-bigslider"
                min={1}
                max={100}
                value={master}
                disabled={offline}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMaster(v);
                  applyAll({ brightness_pct: v });
                }}
                style={{ ["--vp"]: `${master}%` }}
                aria-label="Master brightness"
              />
            </div>
          </div>

          <div className="lv-panel">
            <div className="lv-panel-title"><Palette size={14} strokeWidth={2} style={{ verticalAlign: "-2px", marginRight: 6 }} />Colour</div>
            <div className="lv-swatches">
              {SWATCHES.map((sw) => (
                <button
                  key={sw.name}
                  type="button"
                  className="lv-swatch"
                  style={{ background: `rgb(${sw.rgb.join(",")})` }}
                  disabled={offline}
                  onClick={() => { onToast?.("palette", sw.name); applyAll({ rgb_color: sw.rgb }); }}
                  aria-label={sw.name}
                  title={sw.name}
                />
              ))}
            </div>
          </div>

          <div className="lv-panel grow">
            <div className="lv-panel-title"><Sparkles size={14} strokeWidth={2} style={{ verticalAlign: "-2px", marginRight: 6 }} />Effects</div>
            <div className="lv-effects">
              {effectList.slice(0, 9).map((fx) => (
                <button
                  key={fx}
                  type="button"
                  className={"lv-effect" + (activeEffect === fx ? " on" : "")}
                  disabled={offline}
                  onClick={() => { onToast?.("sparkles", fx); applyAll({ effect: fx }); }}
                >
                  {fx}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lv-panel grow">
          <div className="lv-panel-title"><Zap size={14} strokeWidth={2} style={{ verticalAlign: "-2px", marginRight: 6 }} />Individual Strips</div>
          {offline ? (
            <div className="lv-empty">
              <Zap size={40} strokeWidth={1.4} />
              <div className="lv-empty-t">Strips offline</div>
              <div className="lv-empty-s">
                Your 6 WLED strips aren't on the network yet. Once they're flashed and named,
                their controls appear here automatically.
              </div>
            </div>
          ) : (
            <div className="lv-strips">
              {strips.map((s) => (
                <StripCard key={s.id} strip={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
