import { Bot, Play, Pause, Home, MapPin, Wrench } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

const isOn = (ent) => ent?.state === "on";

function RoomChip({ room }) {
  const id = `input_boolean.vacuum_room_${room.id}`;
  const ent = useEntity(id);
  const call = useService();
  const on = isOn(ent);
  const unavail = !ent || ent.state === "unavailable";
  return (
    <button type="button" className={"vac-room" + (on ? " on" : "") + (unavail ? " unavail" : "")}
      onClick={() => !unavail && call("input_boolean", "toggle", {}, { entity_id: id })}>
      {room.name}
    </button>
  );
}

/** Full-page robot-vacuum view. */
export default function VacuumView({ onToast }) {
  const V = ENTITIES.vacuum;
  const vac = useEntity(V.entity);
  const mode = useEntity(V.cleaningMode);
  const call = useService();

  const a = vac?.attributes || {};
  const state = vac?.state || "unknown";
  const unavail = !vac || state === "unavailable";
  const battery = Number(a.battery_level ?? a.battery);
  const fanList = a.fan_speed_list || V.fanSpeeds;
  const fanNow = a.fan_speed;
  const cleaning = state === "cleaning" || a.running;
  const statusText = a.status || (state.charAt(0).toUpperCase() + state.slice(1));

  const act = (svc, label) => { onToast?.("bot", label); call("vacuum", svc, {}, { entity_id: V.entity }); };
  const setFan = (sp) => { onToast?.("bot", `Suction · ${sp}`); call("vacuum", "set_fan_speed", { fan_speed: sp }, { entity_id: V.entity }); };
  const setMode = (opt) => { onToast?.("bot", opt); call("select", "select_option", { option: opt }, { entity_id: V.cleaningMode }); };

  const actions = [
    { svc: cleaning ? "pause" : "start", Icon: cleaning ? Pause : Play, label: cleaning ? "Pause" : "Start", primary: true },
    { svc: "return_to_base", Icon: Home, label: "Dock" },
    { svc: "locate", Icon: MapPin, label: "Locate" },
  ];

  return (
    <div className="sysview">
      <div className="sv-head">
        <Bot size={18} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Vacuum</span>
        <span className={"sv-pill " + (cleaning ? "ok" : "")}>{unavail ? "Unavailable" : statusText}</span>
        <span className="vac-batt" style={{ marginLeft: "auto" }}>
          {Number.isFinite(battery) ? `${Math.round(battery)}%` : "—"} battery
        </span>
      </div>

      <div className="vac-grid">
        {/* left: status + controls */}
        <div className="vac-card vac-control">
          <div className="vac-hero">
            <div className="vac-hero-ic"><Bot size={64} strokeWidth={1.4} /></div>
            <div className="vac-hero-state">{unavail ? "Offline" : statusText}</div>
            {Number.isFinite(a.cleaning_time) && cleaning && (
              <div className="vac-hero-sub">{a.cleaning_time} min · {a.cleaned_area || 0} m²</div>
            )}
          </div>
          <div className="vac-actions">
            {actions.map((b) => (
              <button key={b.label} type="button" className={"vac-act" + (b.primary ? " primary" : "")}
                onClick={() => act(b.svc, b.label)} disabled={unavail}>
                <b.Icon size={20} strokeWidth={2.2} />{b.label}
              </button>
            ))}
          </div>

          <div className="vac-sub-h">Suction</div>
          <div className="vac-chips">
            {fanList.map((sp) => (
              <button key={sp} type="button" className={"vac-chip" + (fanNow === sp ? " on" : "")}
                onClick={() => setFan(sp)} disabled={unavail}>{sp}</button>
            ))}
          </div>

          {mode?.attributes?.options && (
            <>
              <div className="vac-sub-h">Mode</div>
              <div className="vac-chips">
                {mode.attributes.options.map((opt) => (
                  <button key={opt} type="button" className={"vac-chip" + (mode.state === opt ? " on" : "")}
                    onClick={() => setMode(opt)}>{opt}</button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* right: rooms + maintenance */}
        <div className="vac-card">
          <div className="vac-card-h">Clean a room</div>
          <div className="vac-rooms">
            {V.rooms.map((r) => <RoomChip key={r.id} room={r} />)}
          </div>

          <div className="vac-card-h" style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 7 }}>
            <Wrench size={14} strokeWidth={2.2} /> Maintenance
          </div>
          <div className="vac-maint">
            {V.maintenance.map((m) => {
              const v = Number(a[m.key]);
              const pct = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
              const low = Number.isFinite(v) && v < 15;
              return (
                <div key={m.key} className="vac-maint-row">
                  <span className="vac-maint-n">{m.name}</span>
                  <div className="vac-maint-track"><div className="vac-maint-fill" style={{ width: pct + "%", background: low ? "var(--warning)" : "var(--gold)" }} /></div>
                  <span className="vac-maint-v tabular" style={{ color: low ? "var(--warning)" : "var(--ink-mute)" }}>
                    {Number.isFinite(v) ? `${Math.round(v)}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
