import clsx from "clsx";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CameraPlaceholder } from "./Placeholder";

interface DoorbellInfo {
  name: string;
  location: string;
}

interface DoorbellCardProps {
  doorbell: DoorbellInfo;
  ringing: boolean;
  onTalk: () => void;
  onUnlock: () => void;
  onOpen: () => void;
  onDismiss: () => void;
}

/**
 * DoorbellCard — live doorbell feed with pulsing ring border when active,
 * shake animation on the bell icon, and Talk / Unlock / Open buttons.
 *
 * Phase 4: replace CameraPlaceholder with a Frigate / WebRTC stream component
 * sourced from `camera.doorbell_frigate`.
 */
export function DoorbellCard({
  doorbell,
  ringing,
  onTalk,
  onUnlock,
  onOpen,
  onDismiss,
}: DoorbellCardProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const stamp = now.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={clsx("card doorbell rise", ringing && "ringing")}
      style={{ gridColumn: "span 4", padding: 0 }}
    >
      <div className="db-feed">
        <CameraPlaceholder label="Doorbell feed" />
        <div className="db-overlay">
          <div className="db-top">
            <div className="cam-live">
              <span className="blink" />
              LIVE
            </div>
            <div className="db-badges">
              <span className="db-mini">
                <Icon name="mic" size={13} />
              </span>
              <span className="db-mini">
                <Icon name="video" size={13} />
              </span>
            </div>
          </div>
          <div className="db-bottom">
            <div>
              <div className="cam-name">{doorbell.name}</div>
              <div className="db-loc">{doorbell.location}</div>
            </div>
            <div className="cam-time">{stamp}</div>
          </div>
        </div>
      </div>

      <div className="db-actions">
        {ringing && (
          <div className="db-ring">
            <Icon name="bell-ring" size={15} className="ic" />
            Someone's at the door
            <button className="db-x" onClick={onDismiss} aria-label="Dismiss">
              <Icon name="x" size={14} />
            </button>
          </div>
        )}
        <div className="db-btns">
          <button type="button" className="db-btn" onClick={onTalk}>
            <Icon name="mic" size={16} />
            Talk
          </button>
          <button type="button" className="db-btn" onClick={onUnlock}>
            <Icon name="lock-open" size={16} />
            Unlock
          </button>
          <button
            type="button"
            className="db-btn primary"
            onClick={onOpen}
            title="Open for visitor"
          >
            <Icon name="door-open" size={16} />
            Open for Visitor
          </button>
        </div>
      </div>
    </div>
  );
}
