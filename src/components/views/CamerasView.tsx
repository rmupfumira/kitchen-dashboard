import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cameras } from "@/data/mock";
import { CameraPlaceholder } from "@/components/widgets/Placeholder";

/**
 * CamerasView — responsive grid of live camera feeds.
 * Each tile shows LIVE / OFFLINE pill + camera name + room + timestamp.
 * Phase 4 will swap CameraPlaceholder for a Frigate / WebRTC stream component.
 */
export function CamerasView() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const stamp = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const live = cameras.filter((c) => c.on).length;

  return (
    <div className="rise">
      <div className="view-head">
        <h2>Cameras</h2>
        <p>
          {live} of {cameras.length} live · armed
        </p>
      </div>
      <div className="cam-grid">
        {cameras.map((c) => (
          <div className="cam" key={c.id}>
            {c.on ? (
              <CameraPlaceholder label={`Feed · ${c.name}`} />
            ) : (
              <div className="ph" style={{ background: "#15130f", color: "rgba(255,255,255,.4)" }}>
                SIGNAL OFFLINE
              </div>
            )}
            <div className="cam-overlay">
              <div className="cam-top">
                {c.on ? (
                  <div className="cam-live">
                    <span className="blink" />
                    LIVE
                  </div>
                ) : (
                  <div className="cam-live" style={{ background: "rgba(120,120,120,.7)" }}>
                    OFFLINE
                  </div>
                )}
                <Icon name="more-horizontal" size={18} color="#fff" />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <div>
                  <div className="cam-name">{c.name}</div>
                  <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11, fontWeight: 500 }}>
                    {c.room}
                  </div>
                </div>
                {c.on && <div className="cam-time">{stamp}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
