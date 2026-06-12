import { ShieldCheck, Shield, Siren, Warehouse, Fence, DoorClosed, DoorOpen, Lock } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

/**
 * Left-column security card: hero status + SECURE HOME + device list.
 * Rows show status and are tap-to-toggle (cover/alarm/lock domain-aware).
 * "alert-state" styling = anything open/unlocked/disarmed that matters.
 */
function SecItem({ Icon, name, status, alerting, unavail, onClick }) {
  return (
    <div
      className={"sec-item" + (alerting ? " alert-state" : "") + (unavail ? " unavail" : "")}
      onClick={unavail ? undefined : onClick}
      role="button"
      tabIndex={unavail ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !unavail) onClick();
      }}
    >
      <div className="sec-item-ic">
        <Icon size={19} strokeWidth={2} />
      </div>
      <div className="sec-item-meta">
        <div className="sec-item-n">{name}</div>
        <div className="sec-item-s">{unavail ? "Unavailable" : status}</div>
      </div>
    </div>
  );
}

export default function SecurityCard({ onToast }) {
  const garage = useEntity(ENTITIES.security.garage);
  const gate = useEntity(ENTITIES.security.gate);
  const outdoor = useEntity(ENTITIES.security.outdoorAlarm);
  const indoor = useEntity(ENTITIES.security.indoorAlarm);
  const entArea = useEntity(ENTITIES.security.entArea);
  const screen = useEntity(ENTITIES.security.screenGate);
  const call = useService();

  const isOpen = (e) => e && /^(open|opening)$/i.test(e.state);
  const isArmed = (e) => e && /^armed/i.test(e.state);
  const isLocked = (e) => e && e.state === "locked";
  const unavail = (e) => !e || e.state === "unavailable";

  const allArmed = isArmed(outdoor) && isArmed(indoor);
  const allClosed = !isOpen(garage) && !isOpen(gate) && !isOpen(screen) && isLocked(entArea);
  const fullySecure = allArmed && allClosed;

  const toggleCover = (slot, ent, openMsg, closeMsg) => {
    const open = isOpen(ent);
    onToast?.("shield", open ? closeMsg : openMsg);
    call("cover", open ? "close_cover" : "open_cover", {}, { entity_id: ENTITIES.security[slot] });
  };
  const toggleAlarm = (slot, ent, armMsg, disarmMsg) => {
    const armed = isArmed(ent);
    onToast?.("shield", armed ? disarmMsg : armMsg);
    call("alarm_control_panel", armed ? "alarm_disarm" : "alarm_arm_away", {}, { entity_id: ENTITIES.security[slot] });
  };
  const toggleLock = (slot, ent, lockMsg, unlockMsg) => {
    const locked = isLocked(ent);
    onToast?.("lock", locked ? unlockMsg : lockMsg);
    call("lock", locked ? "unlock" : "lock", {}, { entity_id: ENTITIES.security[slot] });
  };

  const secureHome = () => {
    onToast?.("shield-check", "Securing home…");
    call("script", "turn_on", {}, { entity_id: ENTITIES.security.secureHomeScript });
  };

  return (
    <div className="card rise sec-card">
      <div className={"sec-hero" + (fullySecure ? " armed" : "")}>
        <div className="sec-hero-ic">
          <ShieldCheck size={22} strokeWidth={2} />
        </div>
        <div>
          <div className="sec-hero-t">Security</div>
          <div className="sec-hero-s">
            {fullySecure ? (
              <>All systems <b>armed</b></>
            ) : allArmed ? (
              "Armed — check doors"
            ) : (
              "Partially disarmed"
            )}
          </div>
        </div>
      </div>

      <button type="button" className="secure-btn" onClick={secureHome}>
        <Lock size={15} strokeWidth={2.2} />
        Secure Home
      </button>

      <div className="sec-list">
        <SecItem
          Icon={Warehouse}
          name="Garage Door"
          status={isOpen(garage) ? "Open" : "Closed"}
          alerting={isOpen(garage)}
          unavail={unavail(garage)}
          onClick={() => toggleCover("garage", garage, "Garage opening", "Garage closing")}
        />
        <SecItem
          Icon={Fence}
          name="Front Gate"
          status={isOpen(gate) ? "Open" : "Closed"}
          alerting={isOpen(gate)}
          unavail={unavail(gate)}
          onClick={() => toggleCover("gate", gate, "Gate opening", "Gate closing")}
        />
        <SecItem
          Icon={Siren}
          name="Outdoor Alarm"
          status={isArmed(outdoor) ? "Armed" : "Disarmed"}
          alerting={!isArmed(outdoor) && !unavail(outdoor)}
          unavail={unavail(outdoor)}
          onClick={() => toggleAlarm("outdoorAlarm", outdoor, "Outdoor alarm armed", "Outdoor alarm disarmed")}
        />
        <SecItem
          Icon={Shield}
          name="Indoor Alarm"
          status={isArmed(indoor) ? "Armed" : "Disarmed"}
          alerting={false}
          unavail={unavail(indoor)}
          onClick={() => toggleAlarm("indoorAlarm", indoor, "Indoor alarm armed", "Indoor alarm disarmed")}
        />
        <SecItem
          Icon={isLocked(entArea) ? DoorClosed : DoorOpen}
          name="Entertainment Door"
          status={isLocked(entArea) ? "Locked" : "Unlocked"}
          alerting={!isLocked(entArea) && !unavail(entArea)}
          unavail={unavail(entArea)}
          onClick={() => toggleLock("entArea", entArea, "Ent door locked", "Ent door unlocked")}
        />
        <SecItem
          Icon={isOpen(screen) ? DoorOpen : DoorClosed}
          name="Screen Gate"
          status={isOpen(screen) ? "Open" : "Closed"}
          alerting={isOpen(screen)}
          unavail={unavail(screen)}
          onClick={() => toggleCover("screenGate", screen, "Screen gate opening", "Screen gate closing")}
        />
      </div>
    </div>
  );
}
