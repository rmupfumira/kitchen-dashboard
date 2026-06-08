import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import { Switch } from "@/components/ui/Switch";
import { useEntitiesStore } from "@/state/useEntitiesStore";
import { CardHead } from "./CardHead";

/** Kelvin slider maps temp 0..100 → 2700K..6500K (rounded to 50K). */
const kelvin = (t: number) => Math.round((2700 + (t / 100) * (6500 - 2700)) / 50) * 50;

const SIMPLE_FIXTURES = [
  { id: "pendant" as const, name: "Pendant Light", icon: "lamp-ceiling" },
  { id: "ceiling1" as const, name: "Ceiling Light 1", icon: "lightbulb" },
  { id: "ceiling2" as const, name: "Ceiling Light 2", icon: "lightbulb" },
];

const MOODS = [
  { id: "cook", name: "Cook", icon: "chef-hat" },
  { id: "dine", name: "Dine", icon: "utensils" },
  { id: "relax", name: "Relax", icon: "sofa" },
  { id: "off", name: "Off", icon: "power" },
];

/**
 * MoodCard — kitchen-only replacement for LightCard.
 *
 * Layout: 4 mood preset chips on top, then a list of fixtures.
 * The LED strip is dimmable + tunable (extra slider row when on);
 * the other three fixtures are on/off only.
 */
export function MoodCard() {
  const { kLights, kMood, setFixture, applyMood } = useEntitiesStore();
  const s = kLights.strip;
  const onCount =
    (s.on ? 1 : 0) +
    SIMPLE_FIXTURES.filter((f) => kLights[f.id].on).length;

  return (
    <div className="card rise" style={{ gridColumn: "span 6" }}>
      <CardHead
        icon="sparkles"
        title="Kitchen Mood"
        sub="LED · Pendant · 2× Ceiling"
        right={
          <span style={{ fontSize: 12.5, color: "var(--ink-mute)", fontWeight: 600 }}>
            {onCount}/4 on
          </span>
        }
      />

      <div className="mood-row">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={clsx("mood-chip", kMood === m.id && "on")}
            onClick={() => applyMood(m.id)}
          >
            <Icon name={m.icon} size={16} />
            {m.name}
          </button>
        ))}
      </div>

      <div className="fix-list">
        {/* LED strip — dimmable + tunable */}
        <div className={clsx("fix-row", s.on && "on")}>
          <div className="fix-ic">
            <Icon name="lightbulb" size={17} />
          </div>
          <div className="fix-meta">
            <b>LED Strips</b>
            <span>{s.on ? `${s.bri}% · ${kelvin(s.temp ?? 0)}K` : "Off"}</span>
          </div>
          <span className="fix-tag">Dimmable</span>
          <Switch on={s.on} onClick={() => setFixture("strip", { on: !s.on })} />
        </div>

        {s.on && (
          <div className="strip-ctl">
            <div className="sc-row">
              <Icon name="sun" size={15} />
              <input
                type="range"
                className="msl"
                min={1}
                max={100}
                value={s.bri ?? 0}
                style={{ ["--vp" as string]: `${s.bri}%` }}
                onChange={(e) => setFixture("strip", { bri: Number(e.target.value) })}
              />
              <span className="kval">{s.bri}%</span>
            </div>
            <div className="sc-row">
              <Icon name="thermometer-sun" size={15} />
              <input
                type="range"
                className="ctsl"
                min={0}
                max={100}
                value={s.temp ?? 0}
                onChange={(e) => setFixture("strip", { temp: Number(e.target.value) })}
              />
              <span className="kval">{kelvin(s.temp ?? 0)}K</span>
            </div>
          </div>
        )}

        {SIMPLE_FIXTURES.map((f) => {
          const st = kLights[f.id];
          return (
            <div key={f.id} className={clsx("fix-row", st.on && "on")}>
              <div className="fix-ic">
                <Icon name={f.icon} size={17} />
              </div>
              <div className="fix-meta">
                <b>{f.name}</b>
                <span>{st.on ? "On" : "Off"}</span>
              </div>
              <Switch on={st.on} onClick={() => setFixture(f.id, { on: !st.on })} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
