import { useEffect, useMemo, useState } from "react";
import * as L from "lucide-react";
import {
  ChevronDown, Volume1, Volume2, SkipBack, SkipForward, Play, Pause, ShieldCheck, ShieldAlert,
  Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake,
} from "lucide-react";
import { ENTITIES, ALERT_SENSORS } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService, haAuthUrl } from "../ha/useService";
import { useSettings } from "../useSettings";

const COND = {
  "clear-night": Moon, cloudy: Cloud, fog: CloudFog, hail: CloudSnow, lightning: CloudLightning,
  "lightning-rainy": CloudLightning, partlycloudy: CloudSun, pouring: CloudRain, rainy: CloudRain,
  snowy: Snowflake, "snowy-rainy": CloudSnow, sunny: Sun, windy: Wind, "windy-variant": Wind,
};
const condLabel = (s) => (s || "—").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
function toPascal(name) {
  return String(name).split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/* ── minimalist dropdown ── */
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
            <button type="button" key={it.id} className={"amb-dd-i" + (it.active ? " on" : "")} onClick={() => { onPick(it); setOpen(false); }}>
              {it.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── one floating light (icon · name · level) ── */
function LightItem({ dev }) {
  const ent = useEntity(dev.entity);
  const call = useService();
  const Icon = L[toPascal(dev.icon)] || L.Lightbulb;
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const bri = dev.dimmable && on ? Math.round(((ent.attributes?.brightness ?? 0) / 255) * 100) : null;
  const level = unavail ? "Offline" : dev.dimmable ? (on ? `${bri}%` : "Off") : on ? "On" : "Off";

  return (
    <button type="button" className={"amb-light" + (on ? " on" : "") + (unavail ? " off" : "")}
      onClick={() => !unavail && call(dev.entity.split(".")[0], "toggle", {}, { entity_id: dev.entity })}>
      <Icon size={26} strokeWidth={1.3} className="amb-light-ic" />
      <span className="amb-light-n">{dev.name}</span>
      <span className="amb-light-s">{level}</span>
    </button>
  );
}

/* ── audio: source · now-playing · transport · thin volume ── */
function AudioSection({ onToast }) {
  const players = ENTITIES.music.players;
  const [entId, setEntId] = useState(ENTITIES.music.default);
  const ent = useEntity(entId);
  const call = useService();
  const playing = ent?.state === "playing";
  const playerName = players.find((p) => p.entity === entId)?.name || "Speaker";
  const title = ent?.attributes?.media_title || (playing ? "Playing" : "Idle");
  const artist = ent?.attributes?.media_artist || "";
  const vol = Number(ent?.attributes?.volume_level);
  const volPct = Number.isFinite(vol) ? Math.round(vol * 100) : 30;
  const svc = (s, d = {}) => call("media_player", s, d, { entity_id: entId });

  return (
    <section className="amb-sect">
      <div className="amb-label">Audio</div>
      <Dropdown
        value={title}
        sub={artist || playerName}
        items={players.map((p) => ({ id: p.id, name: p.name, active: p.entity === entId }))}
        onPick={(it) => { const p = players.find((x) => x.id === it.id); setEntId(p.entity); onToast?.("disc-3", p.name); }}
      />
      <div className="amb-transport">
        <button type="button" className="amb-tbtn" onClick={() => svc("media_previous_track")} aria-label="Previous"><SkipBack size={19} strokeWidth={1.4} /></button>
        <button type="button" className="amb-tbtn play" onClick={() => svc("media_play_pause")} aria-label="Play/Pause">{playing ? <Pause size={22} strokeWidth={1.6} /> : <Play size={22} strokeWidth={1.6} />}</button>
        <button type="button" className="amb-tbtn" onClick={() => svc("media_next_track")} aria-label="Next"><SkipForward size={19} strokeWidth={1.4} /></button>
      </div>
      <div className="amb-vol">
        <Volume1 size={15} strokeWidth={1.5} />
        <input type="range" className="amb-slider" min={0} max={100} value={volPct}
          onChange={(e) => svc("volume_set", { volume_level: Number(e.target.value) / 100 })}
          style={{ ["--vp"]: `${volPct}%` }} aria-label="Volume" />
        <Volume2 size={15} strokeWidth={1.5} />
      </div>
    </section>
  );
}

/* ── front-door camera glance ── */
function CameraGlance() {
  const cam = ENTITIES.cameras[0];
  const ent = useEntity(cam.entity);
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 6000); return () => clearInterval(id); }, []);
  const path = ent?.attributes?.entity_picture;
  const src = useMemo(() => { if (!path) return ""; const u = haAuthUrl(path); return u + (u.includes("?") ? "&" : "?") + "t=" + tick; }, [path, tick]);

  return (
    <section className="amb-sect amb-cam-sect">
      <div className="amb-label">{cam.name}</div>
      <div className="amb-cam">
        {src ? <img src={src} alt={cam.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="amb-cam-fallback">{cam.name}</div>}
      </div>
    </section>
  );
}

/* ── bottom status line: time/date · security · weather ── */
function StatusStrip() {
  const { entities } = useHA();
  const { settings } = useSettings();
  const weather = useEntity(ENTITIES.weather);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  const h24 = now.getHours();
  const ampm = settings.clock24h ? "" : (h24 >= 12 ? "PM" : "AM");
  const hh = String(settings.clock24h ? h24 : (h24 % 12 || 12)).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const S = ENTITIES.security;
  const e = (id) => entities[id];
  const isOpen = (x) => x && /^(open|opening)$/i.test(x.state);
  const isArmed = (x) => x && /^armed/i.test(x.state);
  const isLocked = (x) => x && x.state === "locked";
  const armed = isArmed(e(S.outdoorAlarm));
  const allClosed = !isOpen(e(S.garage)) && !isOpen(e(S.gate)) && !isOpen(e(S.screenGate)) && isLocked(e(S.entArea)) && isLocked(e(S.frontDoorLock));
  const hasCritical = ALERT_SENSORS.some((s) => s.class === "critical" && entities[s.id]?.state === "on");
  const secure = armed && allClosed && !hasCritical;

  const cond = weather?.state;
  const WIcon = COND[cond] || Cloud;
  const temp = Number.isFinite(weather?.attributes?.temperature) ? Math.round(weather.attributes.temperature) : "—";

  return (
    <div className="amb-status">
      <div className="amb-stat amb-time">
        <span className="amb-time-v tabular">{hh}:{mm}{ampm && <span className="amb-time-ap">{ampm}</span>}</span>
        <span className="amb-stat-l">{dateStr}</span>
      </div>
      <div className={"amb-stat amb-sec" + (secure ? " ok" : "")}>
        {secure ? <ShieldCheck size={24} strokeWidth={1.4} /> : <ShieldAlert size={24} strokeWidth={1.4} />}
        <div><span className="amb-stat-v">{secure ? "Secure" : "Attention"}</span><span className="amb-stat-l">{secure ? "All armed" : armed ? "Door open" : "Disarmed"}</span></div>
      </div>
      <div className="amb-stat amb-wx">
        <WIcon size={26} strokeWidth={1.4} />
        <div><span className="amb-stat-v tabular">{temp}°</span><span className="amb-stat-l">{condLabel(cond)}</span></div>
      </div>
    </div>
  );
}

/**
 * Crestron/Savant-style kitchen ambience panel — monolithic, typographic, no cards.
 * KITCHEN · (Ambience + Scenes + Lights | Audio + Camera) · time/security/weather.
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

      <div className="amb-body">
        <div className="amb-col amb-col-l">
          <section className="amb-sect">
            <div className="amb-label">Ambience</div>
            <Dropdown value={ambName} sub="Current"
              items={K.ambience.map((a) => ({ id: a.id, name: a.name, active: a.id === ambId }))}
              onPick={applyAmbience} />
          </section>

          <section className="amb-sect">
            <div className="amb-label">Scenes</div>
            <div className="amb-pills">
              {ENTITIES.scenes.map((s) => (
                <button type="button" key={s.id} className={"amb-pill" + (sceneActive(s) ? " on" : "")} onClick={() => activateScene(s)}>
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

        <div className="amb-col amb-col-r">
          <AudioSection onToast={onToast} />
          <CameraGlance />
        </div>
      </div>

      <StatusStrip />
    </div>
  );
}
