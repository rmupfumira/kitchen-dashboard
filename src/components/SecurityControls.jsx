import * as L from "lucide-react";
import { Shield } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

function toPascal(name) {
  return String(name).split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/**
 * One security control tile. `kind` decides the service + the on/off semantics:
 *   alarm → armed/disarmed (arm_away / disarm)
 *   cover → open/closed (open_cover / close_cover)
 *   lock  → locked/unlocked (lock / unlock)
 * "active" (gold) state = armed / closed / locked — i.e. the secure state.
 */
function ControlTile({ ctl, onToast }) {
  const ent = useEntity(ctl.entity);
  const call = useService();
  const Icon = L[toPascal(ctl.icon)] || Shield;
  const unavail = !ent || ent.state === "unavailable";

  let secure, label, action;
  if (ctl.kind === "alarm") {
    secure = /^armed/i.test(ent?.state || "");
    label = secure ? "Armed" : "Disarmed";
    action = () => call("alarm_control_panel", secure ? "alarm_disarm" : "alarm_arm_away", {}, { entity_id: ctl.entity });
  } else if (ctl.kind === "cover") {
    const open = /^(open|opening)$/i.test(ent?.state || "");
    secure = !open;
    label = open ? "Open" : "Closed";
    action = () => call("cover", open ? "close_cover" : "open_cover", {}, { entity_id: ctl.entity });
  } else {
    const locked = ent?.state === "locked";
    secure = locked;
    label = locked ? "Locked" : "Unlocked";
    action = () => call("lock", locked ? "unlock" : "lock", {}, { entity_id: ctl.entity });
  }

  const toggle = () => {
    if (unavail) return;
    onToast?.("shield", `${ctl.name} ${secure ? "opening/disarming" : "securing"}`);
    action();
  };

  return (
    <div
      className={"secctl" + (secure ? " secure" : " open") + (unavail ? " unavail" : "")}
      onClick={toggle}
      role="button"
      tabIndex={unavail ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !unavail) toggle();
      }}
    >
      <div className="secctl-ic">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="secctl-meta">
        <div className="secctl-n">{ctl.name}</div>
        <div className="secctl-s">{unavail ? "Unavailable" : label}</div>
      </div>
    </div>
  );
}

/**
 * Security control grid (correction): outdoor + indoor alarm, gate,
 * front door lock, screen gate, entertainment area lock — 6 tap tiles.
 */
export default function SecurityControls({ onToast }) {
  return (
    <div className="secctls rise">
      <div className="secctls-head">
        <Shield size={16} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Security</span>
      </div>
      <div className="secctls-grid">
        {ENTITIES.securityControls.map((c) => (
          <ControlTile key={c.id} ctl={c} onToast={onToast} />
        ))}
      </div>
    </div>
  );
}
