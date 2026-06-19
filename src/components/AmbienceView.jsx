import { useState } from "react";
import * as L from "lucide-react";
import { ChevronDown, Volume1, Volume2 } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

function toPascal(name) {
  return String(name).split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/* ── minimalist dropdown (no card; champagne value + thin chevron) ── */
function Dropdown({ value, sub, items, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="amb-dd">
      <button type="button" className="amb-dd-btn" onClick={() => setOpen((o) => !o)}>
        <span className="amb-dd-val">{value}</span>
        <ChevronDown size={16} strokeWidth={1.5} className={"amb-chev" + (open ? " flip" : "")} />
      </button>
      {sub && <div className="amb-dd-sub">{sub}</div>}
      {open && (
        <div className="amb-dd-list">
          {items.map((it) => (
            <button
              type="button"
              key={it.id}
              className={"amb-dd-i" + (it.active ? " on" : "")}
              onClick={() => { onPick(it); setOpen(false); }}
            >
              {it.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── one floating light control (icon · name · level) ── */
function LightItem({ dev }) {
  const ent = useEntity(dev.entity);
  const call = useService();
  const Icon = L[toPascal(dev.icon)] || L.Lightbulb;
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const bri = dev.dimmable && on ? Math.round(((ent.attributes?.brightness ?? 0) / 255) * 100) : null;
  const level = unavail ? "Offline" : dev.dimmable ? (on ? `${bri}%` : "Off") : on ? "On" : "Off";

  return (
    <button
      type="button"
      className={"amb-light" + (on ? " on" : "") + (unavail ? " off" : "")}
      onClick={() => !unavail && call(dev.entity.split(".")[0], "toggle", {}, { entity_id: dev.entity })}
    >
      <Icon size={26} strokeWidth={1.3} className="amb-light-ic" />
      <span className="amb-light-n">{dev.name}</span>
      <span className="amb-light-s">{level}</span>
    </button>
  );
}

/* ── audio: source name + now-playing + thin volume slider ── */
function AudioSection({ onToast }) {
  const players = ENTITIES.music.players;
  const [entId, setEntId] = useState(ENTITIES.music.default);
  const ent = useEntity(entId);
  const call = useService();

  const playerName = players.find((p) => p.entity === entId)?.name || "Speaker";
  const title = ent?.attributes?.media_title || (ent?.state === "playing" ? "Playing" : "Idle");
  const vol = Number(ent?.attributes?.volume_level);
  const volPct = Number.isFinite(vol) ? Math.round(vol * 100) : 30;

  return (
    <section className="amb-sect">
      <div className="amb-label">Audio</div>
      <Dropdown
        value={title}
        sub={playerName}
        items={players.map((p) => ({ id: p.id, name: p.name, active: p.entity === entId }))}
        onPick={(it) => { const p = players.find((x) => x.id === it.id); setEntId(p.entity); onToast?.("disc-3", p.name); }}
      />
      <div className="amb-vol">
        <Volume1 size={15} strokeWidth={1.5} />
        <input
          type="range" className="amb-slider" min={0} max={100} value={volPct}
          onChange={(e) => call("media_player", "volume_set", { volume_level: Number(e.target.value) / 100 }, { entity_id: entId })}
          style={{ ["--vp"]: `${volPct}%` }} aria-label="Volume"
        />
        <Volume2 size={15} strokeWidth={1.5} />
      </div>
    </section>
  );
}

/**
 * Crestron/Savant-style kitchen ambience panel — monolithic, typographic,
 * no cards. KITCHEN title · Ambience + Audio · Scenes (pills) · Lights.
 */
export default function AmbienceView({ onToast }) {
  const { entities } = useHA();
  const call = useService();
  const K = ENTITIES.kitchen;
  const [ambId, setAmbId] = useState(K.ambience[0].id);
  const ambName = K.ambience.find((a) => a.id === ambId)?.name || "—";

  const applyAmbience = (a) => {
    setAmbId(a.id);
    onToast?.("sparkles", a.name);
    if (a.off) { call("light", "turn_off", {}, { entity_id: K.ambienceTarget }); return; }
    const data = { brightness_pct: a.bri ?? 80 };
    if (a.effect) data.effect = a.effect;
    if (a.rgb) data.rgb_color = a.rgb;
    call("light", "turn_on", data, { entity_id: K.ambienceTarget });
  };

  const activateScene = (s) => {
    const domain = s.entity.split(".")[0];
    onToast?.("sparkles", s.name);
    if (domain === "scene") call("scene", "turn_on", {}, { entity_id: s.entity });
    else if (domain === "input_boolean") call("input_boolean", s.momentary ? "turn_on" : "toggle", {}, { entity_id: s.entity });
    else call(domain, "turn_on", {}, { entity_id: s.entity });
  };
  const sceneActive = (s) => s.entity.startsWith("input_boolean.") && !s.momentary && entities[s.entity]?.state === "on";

  return (
    <div className="amb">
      <div className="amb-title">KITCHEN</div>

      <div className="amb-top">
        <section className="amb-sect">
          <div className="amb-label">Ambience</div>
          <Dropdown
            value={ambName}
            sub="Current"
            items={K.ambience.map((a) => ({ id: a.id, name: a.name, active: a.id === ambId }))}
            onPick={applyAmbience}
          />
        </section>
        <AudioSection onToast={onToast} />
      </div>

      <section className="amb-sect">
        <div className="amb-label">Scenes</div>
        <div className="amb-pills">
          {ENTITIES.scenes.map((s) => (
            <button
              type="button"
              key={s.id}
              className={"amb-pill" + (sceneActive(s) ? " on" : "")}
              onClick={() => activateScene(s)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </section>

      <section className="amb-sect">
        <div className="amb-label">Lights</div>
        <div className="amb-lights">
          {K.lights.map((d) => <LightItem key={d.id} dev={d} />)}
        </div>
      </section>
    </div>
  );
}
