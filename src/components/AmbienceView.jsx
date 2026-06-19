import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as L from "lucide-react";
import {
  ChevronDown, Volume1, Volume2, SkipBack, SkipForward, Play, Pause, ShieldCheck, ShieldAlert, Shield, Music, Zap, Maximize2, X, Search, Sparkles,
  Shirt, Square, CheckSquare, Plus, AlertTriangle, DoorOpen, Fence, SlidersHorizontal, Bell,
  Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake,
} from "lucide-react";
import { ENTITIES, ALERT_SENSORS } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService, haUrl, haAuthUrl } from "../ha/useService";
import { usePersistentNotifications } from "../ha/usePersistentNotifications";
import { useSettings } from "../useSettings";
import { useConfirm } from "./Confirm";
import MusicBrowser from "./MusicBrowser";

const COND = {
  "clear-night": Moon, cloudy: Cloud, fog: CloudFog, hail: CloudSnow, lightning: CloudLightning,
  "lightning-rainy": CloudLightning, partlycloudy: CloudSun, pouring: CloudRain, rainy: CloudRain,
  snowy: Snowflake, "snowy-rainy": CloudSnow, sunny: Sun, windy: Wind, "windy-variant": Wind,
};
const condLabel = (s) => (s || "—").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
function toPascal(name) {
  return String(name).split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/* security state derivation (mirrors SecurityControls) */
const UNSECURE_VERB = { alarm: "Disarm", cover: "Open", lock: "Unlock", gate: "Open" };
function secStatus(ctl, state) {
  const unavail = !state || state === "unavailable";
  if (ctl.kind === "alarm") { const s = /^armed/i.test(state || ""); return { secure: s, unavail, label: s ? "Armed" : "Disarmed" }; }
  if (ctl.kind === "cover") { const o = /^(open|opening)$/i.test(state || ""); return { secure: !o, unavail, label: o ? "Open" : "Closed" }; }
  if (ctl.kind === "gate") { const c = (state || "").toLowerCase() === "closed"; return { secure: c, unavail, label: state || "—" }; }
  const locked = state === "locked"; return { secure: locked, unavail, label: locked ? "Locked" : "Unlocked" };
}

/* ── minimalist dropdown ── */
function Dropdown({ value, sub, items, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="amb-dd">
      <button type="button" className="amb-dd-btn" onClick={() => setOpen((o) => !o)}>
        <span className="amb-dd-val">{value}</span>
        <ChevronDown size={20} strokeWidth={1.5} className={"amb-chev" + (open ? " flip" : "")} />
      </button>
      {sub && <div className="amb-dd-sub">{sub}</div>}
      {open && (
        <div className="amb-dd-list">
          {items.map((it) => (
            <button type="button" key={it.id} className={"amb-dd-i" + (it.active ? " on" : "")} onClick={() => { onPick(it); setOpen(false); }}>{it.name}</button>
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
      <Icon size={32} strokeWidth={1.3} className="amb-light-ic" />
      <span className="amb-light-n">{dev.name}</span>
      <span className="amb-light-s">{level}</span>
    </button>
  );
}

/* ── one WLED strip as a rainbow brightness slider ── */
function WledStrip({ strip }) {
  const ent = useEntity(strip.light);
  const call = useService();
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const briPct = on ? Math.round(((ent.attributes?.brightness ?? 0) / 255) * 100) : 0;
  const [local, setLocal] = useState(briPct);
  const draggingRef = useRef(false);
  const timer = useRef(null);
  useEffect(() => { if (!draggingRef.current) setLocal(briPct); }, [briPct]);
  const slide = (v) => {
    draggingRef.current = true;
    setLocal(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (v === 0) call("light", "turn_off", {}, { entity_id: strip.light });
      else call("light", "turn_on", { brightness_pct: v }, { entity_id: strip.light });
    }, 130);
  };
  const commit = () => { draggingRef.current = false; };
  return (
    <div className={"amb-wled-item" + (on ? "" : " off") + (unavail ? " na" : "")}>
      <div className="amb-wled-top">
        <span className="amb-wled-n">{strip.name}</span>
        <span className="amb-wled-v tabular">{unavail ? "—" : on ? `${local}%` : "Off"}</span>
      </div>
      <input type="range" className="amb-wled-slider" min={0} max={100} value={local} disabled={unavail}
        onChange={(e) => slide(Number(e.target.value))} onPointerUp={commit} onTouchEnd={commit} onMouseUp={commit}
        style={{ ["--vp"]: `${local}%` }} aria-label={strip.name} />
    </div>
  );
}

/* ── cabinet strips popup (the individual strip sliders) ── */
function StripsPopup({ onClose, onOpenLighting }) {
  const strips = ENTITIES.kitchen.strips;
  return (
    <div className="strips-modal" role="dialog" aria-label="Cabinet strips" onClick={onClose}>
      <div className="strips-panel" onClick={(e) => e.stopPropagation()}>
        <div className="strips-head">
          <span><SlidersHorizontal size={20} strokeWidth={1.8} /> Cabinet Strips</span>
          <button type="button" className="strips-x" onClick={onClose} aria-label="Close"><X size={24} strokeWidth={2.2} /></button>
        </div>
        <div className="strips-grid">
          {strips.map((s) => <WledStrip key={s.id} strip={s} />)}
        </div>
        {onOpenLighting && (
          <button type="button" className="strips-effects" onClick={() => { onClose(); onOpenLighting(); }}>
            <Sparkles size={18} strokeWidth={2} /> Effects &amp; colours
          </button>
        )}
      </div>
    </div>
  );
}

/* ── laundry (washer + dryer) ── */
function LaundryTile({ item }) {
  const ent = useEntity(item.entity);
  const fin = useEntity(item.finished);
  const Icon = L[toPascal(item.icon)] || Shirt;
  const running = ent?.state === "running";
  const unavail = !ent || ent.state === "unavailable";
  const t = fin?.state ? new Date(fin.state.replace(" ", "T")).getTime() : NaN;
  const mins = Number.isFinite(t) ? Math.round((t - Date.now()) / 60000) : null;
  const sub = unavail ? "—" : running ? (mins != null && mins > 0 ? `${mins}m left` : "Running") : (ent?.state ? ent.state.charAt(0).toUpperCase() + ent.state.slice(1) : "Idle");
  return (
    <div className={"amb-appl" + (running ? " on" : "")}>
      <Icon size={26} strokeWidth={1.4} className="amb-appl-ic" />
      <div className="amb-appl-meta">
        <div className="amb-appl-n">{item.name}</div>
        <div className="amb-appl-s">{sub}</div>
      </div>
    </div>
  );
}
function LaundryMini() {
  return (
    <section className="amb-sect amb-sect-grow">
      <div className="amb-label">Laundry</div>
      <div className="amb-appls">{ENTITIES.laundry.map((i) => <LaundryTile key={i.id} item={i} />)}</div>
    </section>
  );
}

/* ── shopping list (HA todo) ── */
function ShoppingList({ onToast }) {
  const call = useService();
  const ent = useEntity(ENTITIES.shoppingList);
  const [items, setItems] = useState([]);
  const [adding, setAdding] = useState("");
  const load = useCallback(async () => {
    try {
      const res = await call("todo", "get_items", {}, { entity_id: ENTITIES.shoppingList }, true);
      setItems(res?.[ENTITIES.shoppingList]?.items || []);
    } catch { /* ignore */ }
  }, [call]);
  useEffect(() => { load(); }, [load, ent?.state]);
  const toggle = (it) => {
    call("todo", "update_item", { item: it.uid || it.summary, status: it.status === "completed" ? "needs_action" : "completed" }, { entity_id: ENTITIES.shoppingList });
    setItems((cur) => cur.map((x) => (x.uid === it.uid ? { ...x, status: x.status === "completed" ? "needs_action" : "completed" } : x)));
  };
  const add = () => {
    const v = adding.trim();
    if (!v) return;
    call("todo", "add_item", { item: v }, { entity_id: ENTITIES.shoppingList });
    setAdding(""); onToast?.("shopping-cart", `Added ${v}`); setTimeout(load, 500);
  };
  return (
    <section className="amb-sect amb-sect-grow">
      <div className="amb-label">Shopping List</div>
      <div className="amb-shop">
        <div className="amb-shop-items">
          {items.length === 0 && <div className="amb-shop-empty">Nothing on the list.</div>}
          {items.map((it) => {
            const done = it.status === "completed";
            return (
              <button type="button" key={it.uid || it.summary} className={"amb-shop-i" + (done ? " done" : "")} onClick={() => toggle(it)}>
                {done ? <CheckSquare size={20} strokeWidth={1.6} /> : <Square size={20} strokeWidth={1.6} />}
                <span>{it.summary}</span>
              </button>
            );
          })}
        </div>
        <div className="amb-shop-add">
          <input value={adding} onChange={(e) => setAdding(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="Add an item…" />
          <button type="button" onClick={add} aria-label="Add"><Plus size={20} strokeWidth={2} /></button>
        </div>
      </div>
    </section>
  );
}

/* ── security: status chips + open-door / open-gate ── */
function SecChip({ ctl, onToast }) {
  const ent = useEntity(ctl.statusEntity || ctl.entity);
  const call = useService();
  const confirm = useConfirm();
  const Icon = L[toPascal(ctl.icon)] || Shield;
  const { secure, unavail, label } = secStatus(ctl, ent?.state);
  const alert = !secure && !unavail && !ctl.ignore;
  const act = () => {
    if (ctl.kind === "alarm") call("alarm_control_panel", secure ? "alarm_disarm" : "alarm_arm_away", {}, { entity_id: ctl.entity });
    else if (ctl.kind === "cover" || ctl.kind === "gate") call("cover", secure ? "open_cover" : "close_cover", {}, { entity_id: ctl.entity });
    else call("lock", secure ? "unlock" : "lock", {}, { entity_id: ctl.entity });
  };
  const toggle = async () => {
    if (unavail) return;
    if (secure) {
      const verb = UNSECURE_VERB[ctl.kind] || "Change";
      const ok = await confirm({ title: `${verb} ${ctl.name}?`, message: `This will ${verb.toLowerCase()} ${ctl.name.toLowerCase()} and reduce your home security.`, confirmLabel: verb, danger: true });
      if (!ok) return;
    }
    onToast?.("shield", ctl.name); act();
  };
  return (
    <button type="button" className={"amb-secchip" + (alert ? " alert" : secure ? " ok" : "") + (unavail ? " na" : "")} onClick={toggle}>
      <Icon size={18} strokeWidth={1.5} />
      <span className="amb-secchip-n">{ctl.name}</span>
      <span className="amb-secchip-s">{unavail ? "—" : label}</span>
    </button>
  );
}
function SecurityWidget({ onToast }) {
  const { entities } = useHA();
  const call = useService();
  const confirm = useConfirm();
  const open = ENTITIES.securityControls.filter((c) => !c.ignore).filter((c) => {
    const { secure, unavail } = secStatus(c, entities[c.statusEntity || c.entity]?.state);
    return !secure && !unavail;
  });
  const allSecure = open.length === 0;
  const fire = (e) => { const d = e.split(".")[0]; call(d, d === "automation" ? "trigger" : "turn_on", {}, { entity_id: e }); };
  const openFront = async () => {
    const ok = await confirm({ title: "Open the front door?", message: "This disarms the outdoor alarm, unlocks the front door, and opens the screen gate.", confirmLabel: "Open", danger: true });
    if (!ok) return; onToast?.("door-open", "Opening front door…"); fire(ENTITIES.entryScript);
  };
  const openGate = async () => {
    const ok = await confirm({ title: "Open the gate?", message: "This disarms the outdoor alarm and opens the gate.", confirmLabel: "Open", danger: true });
    if (!ok) return; onToast?.("door-open", "Opening gate…"); fire(ENTITIES.gateScript);
  };
  return (
    <section className="amb-sect">
      <div className="amb-label amb-label-row">
        <span>Security</span>
        <span className={"amb-secverdict" + (allSecure ? " ok" : "")}>
          {allSecure ? <><ShieldCheck size={16} strokeWidth={2} /> All secure</> : <><AlertTriangle size={16} strokeWidth={2} /> {open.length} open</>}
        </span>
      </div>
      <div className="amb-secchips">
        {ENTITIES.securityControls.map((c) => <SecChip key={c.id} ctl={c} onToast={onToast} />)}
      </div>
      <div className="amb-secact">
        <button type="button" className="amb-secbtn" onClick={openFront}><DoorOpen size={18} strokeWidth={1.8} /> Open Front Door</button>
        <button type="button" className="amb-secbtn" onClick={openGate}><Fence size={18} strokeWidth={1.8} /> Open Gate</button>
      </div>
    </section>
  );
}

/* ── notifications (sensor alerts + HA persistent notifications) ── */
function NotificationsWidget() {
  const { entities } = useHA();
  const { items, dismiss } = usePersistentNotifications();
  const sensorAlerts = ALERT_SENSORS.filter((s) => entities[s.id]?.state === "on").map((s) => ({ id: s.id, title: s.label, cls: s.class, sensor: true }));
  const persistent = items.map((p) => ({ id: p.notification_id, title: p.title || p.notification_id, cls: "info" }));
  const order = { critical: 0, warning: 1, info: 2 };
  const all = [...sensorAlerts, ...persistent].sort((a, b) => (order[a.cls] ?? 9) - (order[b.cls] ?? 9));
  return (
    <section className="amb-sect amb-sect-grow">
      <div className="amb-label">Notifications</div>
      <div className="amb-notifs">
        {all.length === 0 && <div className="amb-notif-empty"><ShieldCheck size={18} strokeWidth={1.5} /> All clear · no alerts</div>}
        {all.map((n) => (
          <div key={n.id} className={"amb-notif " + n.cls}>
            {n.cls === "info" ? <Bell size={18} strokeWidth={1.6} /> : <AlertTriangle size={18} strokeWidth={1.6} />}
            <span className="amb-notif-t">{n.title}</span>
            {!n.sensor && <button type="button" className="amb-notif-x" onClick={() => dismiss(n.id)} aria-label="Dismiss"><X size={16} strokeWidth={2} /></button>}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── audio: album art · source · now-playing · transport · volume · browse ── */
function AudioSection({ onToast }) {
  const players = ENTITIES.music.players;
  const [entId, setEntId] = useState(ENTITIES.music.default);
  const [browse, setBrowse] = useState(false);
  const ent = useEntity(entId);
  const call = useService();
  const playing = ent?.state === "playing";
  const playerName = players.find((p) => p.entity === entId)?.name || "Speaker";
  const title = ent?.attributes?.media_title || (playing ? "Playing" : "Idle");
  const artist = ent?.attributes?.media_artist || "";
  const artPath = ent?.attributes?.entity_picture;
  const art = artPath ? haUrl(artPath) : "";
  const svc = (s, d = {}) => call("media_player", s, d, { entity_id: entId });

  const entVol = Number(ent?.attributes?.volume_level);
  const entVolPct = Number.isFinite(entVol) ? Math.round(entVol * 100) : 30;
  const [localVol, setLocalVol] = useState(entVolPct);
  const draggingRef = useRef(false);
  const volTimer = useRef(null);
  useEffect(() => { if (!draggingRef.current) setLocalVol(entVolPct); }, [entVolPct]);
  const onVol = (v) => { draggingRef.current = true; setLocalVol(v); clearTimeout(volTimer.current); volTimer.current = setTimeout(() => svc("volume_set", { volume_level: v / 100 }), 120); };
  const commitVol = () => { draggingRef.current = false; clearTimeout(volTimer.current); svc("volume_set", { volume_level: localVol / 100 }); };

  return (
    <section className="amb-sect">
      <div className="amb-label amb-label-row">
        <span>Audio</span>
        <button type="button" className="amb-link" onClick={() => setBrowse(true)}><Search size={16} strokeWidth={2} /> Browse</button>
      </div>
      <div className="amb-audio">
        <div className="amb-art">{art ? <img src={art} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Music size={36} strokeWidth={1.2} />}</div>
        <div className="amb-audio-meta">
          <Dropdown value={title} sub={artist || playerName}
            items={players.map((p) => ({ id: p.id, name: p.name, active: p.entity === entId }))}
            onPick={(it) => { const p = players.find((x) => x.id === it.id); setEntId(p.entity); onToast?.("disc-3", p.name); }} />
          <div className="amb-transport">
            <button type="button" className="amb-tbtn" onClick={() => svc("media_previous_track")} aria-label="Previous"><SkipBack size={24} strokeWidth={1.4} /></button>
            <button type="button" className="amb-tbtn play" onClick={() => svc("media_play_pause")} aria-label="Play/Pause">{playing ? <Pause size={28} strokeWidth={1.6} /> : <Play size={28} strokeWidth={1.6} />}</button>
            <button type="button" className="amb-tbtn" onClick={() => svc("media_next_track")} aria-label="Next"><SkipForward size={24} strokeWidth={1.4} /></button>
          </div>
        </div>
      </div>
      <div className="amb-vol">
        <Volume1 size={18} strokeWidth={1.5} />
        <input type="range" className="amb-slider" min={0} max={100} value={localVol}
          onChange={(e) => onVol(Number(e.target.value))} onPointerUp={commitVol} onTouchEnd={commitVol} onMouseUp={commitVol}
          style={{ ["--vp"]: `${localVol}%` }} aria-label="Volume" />
        <Volume2 size={18} strokeWidth={1.5} />
      </div>
      {browse && <MusicBrowser playerEntity={entId} players={players} onPickPlayer={setEntId} onClose={() => setBrowse(false)} onToast={onToast} />}
    </section>
  );
}

/* ── front-door camera glance (tap to enlarge) — compact ── */
function CameraGlance() {
  const cam = ENTITIES.cameras[0];
  const ent = useEntity(cam.entity);
  const [tick, setTick] = useState(0);
  const [full, setFull] = useState(false);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), full ? 2000 : 6000); return () => clearInterval(id); }, [full]);
  const path = ent?.attributes?.entity_picture;
  const src = useMemo(() => { if (!path) return ""; const u = haAuthUrl(path); return u + (u.includes("?") ? "&" : "?") + "t=" + tick; }, [path, tick]);
  return (
    <section className="amb-sect amb-cam-sect">
      <div className="amb-label">{cam.name}</div>
      <div className="amb-cam" role="button" tabIndex={0} onClick={() => setFull(true)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFull(true); }}>
        {src ? <img src={src} alt={cam.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="amb-cam-fallback">{cam.name}</div>}
        <span className="amb-cam-expand"><Maximize2 size={18} strokeWidth={2} /></span>
      </div>
      {full && (
        <div className="cam-modal" role="dialog" aria-label={cam.name} onClick={() => setFull(false)}>
          <div className="cam-modal-inner" onClick={(e) => e.stopPropagation()}>
            <div className="cam-modal-h">
              <span>{cam.name}</span>
              <button type="button" className="cam-modal-x" onClick={() => setFull(false)} aria-label="Close"><X size={22} strokeWidth={2.4} /></button>
            </div>
            <div className="cam-modal-view">{src ? <img src={src} alt={cam.name} /> : <div className="cam-fallback">{cam.name}</div>}</div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── bottom status line: time/date · security · weather · solar ── */
function StatusStrip() {
  const { entities } = useHA();
  const { settings } = useSettings();
  const weather = useEntity(ENTITIES.weather);
  const pv = useEntity(ENTITIES.power.pvPower);
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
  const pvW = Number(pv?.state);
  const solar = Number.isFinite(pvW) ? (Math.round(pvW / 100) / 10).toFixed(1) : "—";
  return (
    <div className="amb-status">
      <div className="amb-stat amb-time">
        <span className="amb-time-v tabular">{hh}:{mm}{ampm && <span className="amb-time-ap">{ampm}</span>}</span>
        <span className="amb-stat-l">{dateStr}</span>
      </div>
      <div className={"amb-stat amb-sec" + (secure ? " ok" : "")}>
        {secure ? <ShieldCheck size={26} strokeWidth={1.4} /> : <ShieldAlert size={26} strokeWidth={1.4} />}
        <div><span className="amb-stat-v">{secure ? "Secure" : "Attention"}</span><span className="amb-stat-l">{secure ? "All armed" : armed ? "Door open" : "Disarmed"}</span></div>
      </div>
      <div className="amb-stat amb-wx">
        <WIcon size={28} strokeWidth={1.4} />
        <div><span className="amb-stat-v tabular">{temp}°</span><span className="amb-stat-l">{condLabel(cond)}</span></div>
      </div>
      <div className="amb-stat amb-solar">
        <Zap size={26} strokeWidth={1.4} />
        <div><span className="amb-stat-v tabular">{solar} kW</span><span className="amb-stat-l">Solar</span></div>
      </div>
    </div>
  );
}

/**
 * Crestron/Savant-style kitchen ambience panel.
 * Left: Ambience · Scenes · Lights (+ Strips popup) · Security.
 * Right: Audio · Laundry + Shopping · Notifications · Camera. Bottom: status line.
 */
export default function AmbienceView({ onToast, onOpenLighting }) {
  const { entities } = useHA();
  const call = useService();
  const K = ENTITIES.kitchen;
  const [stripsOpen, setStripsOpen] = useState(false);

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
            <div className="amb-label">Scenes</div>
            <div className="amb-pills">
              {ENTITIES.scenes.map((s) => (
                <button type="button" key={s.id} className={"amb-pill" + (sceneActive(s) ? " on" : "")} onClick={() => activateScene(s)}>{s.name}</button>
              ))}
            </div>
          </section>

          <section className="amb-sect">
            <div className="amb-label amb-label-row">
              <span>Lights</span>
              <button type="button" className="amb-link" onClick={() => setStripsOpen(true)}><SlidersHorizontal size={16} strokeWidth={2} /> Cabinet strips</button>
            </div>
            <div className="amb-lights">{K.lights.map((d) => <LightItem key={d.id} dev={d} />)}</div>
          </section>

          <SecurityWidget onToast={onToast} />
        </div>

        <div className="amb-col amb-col-r">
          <AudioSection onToast={onToast} />
          <div className="amb-row2">
            <LaundryMini />
            <ShoppingList onToast={onToast} />
          </div>
          <NotificationsWidget />
          <CameraGlance />
        </div>
      </div>

      <StatusStrip />

      {stripsOpen && <StripsPopup onClose={() => setStripsOpen(false)} onOpenLighting={onOpenLighting} />}
    </div>
  );
}
