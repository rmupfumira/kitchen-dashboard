import { useMemo, useState } from "react";
import { ArrowLeft, Power, Palette, Sparkles, Gauge, Activity, Search, X, SlidersHorizontal, Layers } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

/* Quick-pick colours (RGB) for the swatch row. */
const SWATCHES = [
  { name: "Warm", rgb: [255, 170, 90] },
  { name: "Amber", rgb: [255, 150, 40] },
  { name: "Peach", rgb: [255, 214, 170] },
  { name: "Cool", rgb: [205, 228, 255] },
  { name: "White", rgb: [255, 255, 255] },
  { name: "Crimson", rgb: [255, 45, 60] },
  { name: "Magenta", rgb: [255, 50, 200] },
  { name: "Purple", rgb: [150, 70, 255] },
  { name: "Azure", rgb: [70, 150, 255] },
  { name: "Teal", rgb: [0, 210, 190] },
  { name: "Lime", rgb: [120, 230, 70] },
  { name: "Gold", rgb: [255, 200, 0] },
];

const toPct = (v) => Math.round((Number(v) / 255) * 100);
const to255 = (p) => Math.round((Number(p) / 100) * 255);
const rgbEq = (a, b) => Array.isArray(a) && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * Full WLED control surface for one target — either the whole group or a
 * single strip.  `target` shape:
 *   { light, palettes[], speeds[], intensities[], paletteSource }
 * Colour / brightness / effect go to `light` (the HA group fans out to every
 * member server-side); palette / speed / intensity have no group entity, so
 * they fan out across the per-strip select/number arrays.
 */
function LedControls({ target, onToast }) {
  const call = useService();
  const light = useEntity(target.light);
  const palEnt = useEntity(target.paletteSource);
  const speedEnt = useEntity(target.speeds[0]);
  const intenEnt = useEntity(target.intensities[0]);

  const [fxq, setFxq] = useState("");
  const [palq, setPalq] = useState("");

  const unavail = !light || light.state === "unavailable";
  const on = light?.state === "on";
  const bri = on ? toPct(light?.attributes?.brightness ?? 0) : 0;
  const curEffect = light?.attributes?.effect;
  const curRgb = light?.attributes?.rgb_color;
  const effects = light?.attributes?.effect_list || [];
  const curPalette = palEnt?.state;
  const palettes = palEnt?.attributes?.options || [];
  const speed = toPct(speedEnt?.state ?? 128);
  const intensity = toPct(intenEnt?.state ?? 128);

  const fxList = useMemo(
    () => effects.filter((e) => e.toLowerCase().includes(fxq.trim().toLowerCase())),
    [effects, fxq]
  );
  const palList = useMemo(
    () => palettes.filter((p) => p.toLowerCase().includes(palq.trim().toLowerCase())),
    [palettes, palq]
  );

  const lightOn = (data) => call("light", "turn_on", data, { entity_id: target.light });
  const setPalette = (opt) => call("select", "select_option", { option: opt }, { entity_id: target.palettes });
  const setSpeed = (p) => call("number", "set_value", { value: to255(p) }, { entity_id: target.speeds });
  const setIntensity = (p) => call("number", "set_value", { value: to255(p) }, { entity_id: target.intensities });

  return (
    <div className={"led-ctl" + (unavail ? " unavail" : "")}>
      <div className="led-row">
        <button
          type="button"
          className={"led-power" + (on ? " on" : "")}
          onClick={() => !unavail && call("light", "toggle", {}, { entity_id: target.light })}
          disabled={unavail}
          aria-label="Power"
        >
          <Power size={20} strokeWidth={2.4} />
        </button>
        <input
          type="range"
          className="klx-slider led-bri"
          min={1}
          max={100}
          value={bri || 1}
          disabled={unavail || !on}
          onChange={(e) => lightOn({ brightness_pct: Number(e.target.value) })}
          style={{ ["--vp"]: `${bri}%` }}
          aria-label="Brightness"
        />
        <span className="led-bri-v tabular">{bri}%</span>
      </div>

      <div className="led-swatches">
        {SWATCHES.map((s) => (
          <button
            key={s.name}
            type="button"
            className={"led-sw" + (rgbEq(curRgb, s.rgb) ? " on" : "")}
            style={{ background: `rgb(${s.rgb.join(",")})` }}
            disabled={unavail}
            onClick={() => { onToast?.("palette", s.name); lightOn({ rgb_color: s.rgb }); }}
            aria-label={s.name}
            title={s.name}
          />
        ))}
      </div>

      <div className="led-sliders">
        <div className="led-mini">
          <span className="led-mini-l"><Gauge size={13} strokeWidth={2.2} /> Speed</span>
          <input
            type="range" className="klx-slider" min={0} max={100} value={speed} disabled={unavail}
            onChange={(e) => setSpeed(Number(e.target.value))} style={{ ["--vp"]: `${speed}%` }} aria-label="Effect speed"
          />
          <span className="led-mini-v tabular">{speed}%</span>
        </div>
        <div className="led-mini">
          <span className="led-mini-l"><Activity size={13} strokeWidth={2.2} /> Intensity</span>
          <input
            type="range" className="klx-slider" min={0} max={100} value={intensity} disabled={unavail}
            onChange={(e) => setIntensity(Number(e.target.value))} style={{ ["--vp"]: `${intensity}%` }} aria-label="Effect intensity"
          />
          <span className="led-mini-v tabular">{intensity}%</span>
        </div>
      </div>

      <div className="led-sect">
        <div className="led-sect-h">
          <span><Sparkles size={14} strokeWidth={2.2} /> Effects</span>
          <div className="led-search">
            <Search size={13} strokeWidth={2.2} />
            <input value={fxq} onChange={(e) => setFxq(e.target.value)} placeholder={`Search ${effects.length}…`} aria-label="Search effects" />
          </div>
        </div>
        <div className="led-chips">
          {fxList.length ? fxList.map((fx) => (
            <button
              key={fx} type="button" className={"led-chip" + (curEffect === fx ? " on" : "")} disabled={unavail}
              onClick={() => { onToast?.("sparkles", fx); lightOn({ effect: fx }); }}
            >{fx}</button>
          )) : <div className="led-none">No effects match “{fxq}”</div>}
        </div>
      </div>

      <div className="led-sect">
        <div className="led-sect-h">
          <span><Palette size={14} strokeWidth={2.2} /> Palettes</span>
          <div className="led-search">
            <Search size={13} strokeWidth={2.2} />
            <input value={palq} onChange={(e) => setPalq(e.target.value)} placeholder={`Search ${palettes.length}…`} aria-label="Search palettes" />
          </div>
        </div>
        <div className="led-chips">
          {palList.length ? palList.map((p) => (
            <button
              key={p} type="button" className={"led-chip" + (curPalette === p ? " on" : "")} disabled={unavail}
              onClick={() => { onToast?.("palette", p); setPalette(p); }}
            >{p}</button>
          )) : <div className="led-none">No palettes match “{palq}”</div>}
        </div>
      </div>
    </div>
  );
}

/** Compact row for one strip in the right rail — toggle, brightness, tune. */
function StripRow({ strip, onTune }) {
  const ent = useEntity(strip.light);
  const call = useService();
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const bri = on ? toPct(ent?.attributes?.brightness ?? 0) : 0;
  const fx = ent?.attributes?.effect;

  return (
    <div className={"led-strip" + (on ? " on" : "") + (unavail ? " unavail" : "")}>
      <div className="led-strip-top">
        <span className="led-strip-n">{strip.name}</span>
        <button type="button" className="led-strip-tune" onClick={onTune} disabled={unavail} aria-label={`Tune ${strip.name}`}>
          <SlidersHorizontal size={16} strokeWidth={2.2} />
        </button>
        <span
          className={"switch" + (on ? " on" : "")}
          role="button"
          aria-label={strip.name}
          onClick={() => !unavail && call("light", "toggle", {}, { entity_id: strip.light })}
        />
      </div>
      <div className="led-strip-s">{unavail ? "Offline" : on ? `${bri}% · ${fx || "Solid"}` : "Off"}</div>
      <input
        type="range"
        className="klx-slider"
        min={1}
        max={100}
        value={bri || 1}
        disabled={unavail || !on}
        onChange={(e) => call("light", "turn_on", { brightness_pct: Number(e.target.value) }, { entity_id: strip.light })}
        style={{ ["--vp"]: `${bri}%`, marginTop: 10 }}
        aria-label={`${strip.name} brightness`}
      />
    </div>
  );
}

/**
 * Kitchen WLED control view (opened from the Lighting card's "LED Strips" tile).
 * Left: master controls for the whole group. Right: the 6 strips, each with a
 * Tune button that opens a per-strip control modal.
 */
export default function LightingView({ onBack, onToast }) {
  const { entities } = useHA();
  const call = useService();
  const strips = ENTITIES.kitchen.strips;
  const groupId = ENTITIES.kitchen.ledGroup;
  const group = useEntity(groupId);
  const [tuning, setTuning] = useState(null);

  const liveStrips = strips.filter((s) => entities[s.light] && entities[s.light].state !== "unavailable");
  const onCount = strips.filter((s) => entities[s.light]?.state === "on").length;
  const anyOn = group?.state === "on" || onCount > 0;

  const groupTarget = {
    light: groupId,
    palettes: strips.map((s) => s.palette),
    speeds: strips.map((s) => s.speed),
    intensities: strips.map((s) => s.intensity),
    paletteSource: strips[0].palette,
  };

  const tuned = strips.find((s) => s.id === tuning);
  const stripTarget = tuned && {
    light: tuned.light,
    palettes: [tuned.palette],
    speeds: [tuned.speed],
    intensities: [tuned.intensity],
    paletteSource: tuned.palette,
  };

  const toggleGroup = () => {
    onToast?.(anyOn ? "power-off" : "power", anyOn ? "All strips off" : "All strips on");
    call("light", anyOn ? "turn_off" : "turn_on", {}, { entity_id: groupId });
  };

  return (
    <div className="lux-detail led-view">
      <div className="dv-head">
        <button type="button" className="dv-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={24} strokeWidth={2.2} />
        </button>
        <div>
          <div className="dv-title">Kitchen LED Strips</div>
          <div className="dv-sub">{strips.length} strips · {liveStrips.length} online{onCount ? ` · ${onCount} on` : ""}</div>
        </div>
        <button
          type="button"
          className={"switch" + (anyOn ? " on" : "")}
          onClick={toggleGroup}
          aria-label="All strips"
          style={{ marginLeft: "auto", transform: "scale(1.3)", marginRight: 14 }}
        />
      </div>

      <div className="led-body">
        <div className="led-main">
          <div className="led-main-h"><Layers size={15} strokeWidth={2.2} /> All strips together</div>
          <LedControls target={groupTarget} onToast={onToast} />
        </div>

        <div className="led-side">
          <div className="led-side-h">Individual strips</div>
          <div className="led-strips">
            {strips.map((s) => (
              <StripRow key={s.id} strip={s} onTune={() => setTuning(s.id)} />
            ))}
          </div>
        </div>
      </div>

      {tuned && (
        <div className="led-modal-scrim" onClick={() => setTuning(null)}>
          <div className="led-modal" onClick={(e) => e.stopPropagation()}>
            <div className="led-modal-h">
              <span><SlidersHorizontal size={17} strokeWidth={2.2} /> {tuned.name}</span>
              <button type="button" className="led-modal-x" onClick={() => setTuning(null)} aria-label="Close">
                <X size={20} strokeWidth={2.4} />
              </button>
            </div>
            <LedControls target={stripTarget} onToast={onToast} />
          </div>
        </div>
      )}
    </div>
  );
}
