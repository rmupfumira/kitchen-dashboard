import { useEffect, useMemo, useState } from "react";
import { Cctv } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { haAuthUrl } from "../ha/useService";

/** One camera tile — authed snapshot refreshed every 5s. */
function CamTile({ cam, tick }) {
  const ent = useEntity(cam.entity);
  const path = ent?.attributes?.entity_picture;
  const live = ent && ent.state !== "unavailable";
  const src = useMemo(() => {
    if (!path) return "";
    const url = haAuthUrl(path);
    return url + (url.includes("?") ? "&" : "?") + "t=" + tick;
  }, [path, tick]);

  return (
    <div className="cv-tile">
      {src ? (
        <img src={src} alt={cam.name} onError={(e) => { e.currentTarget.style.display = "none"; }} />
      ) : (
        <div className="cam-fallback">{cam.name}</div>
      )}
      {live && <span className="cam-live-pill"><Led tone="critical" pulse />LIVE</span>}
      <div className="cam-overlay"><span className="cam-nm">{cam.name}</span></div>
    </div>
  );
}

/** Full-page Cameras view — every Frigate feed in a responsive grid. */
export default function CamerasView() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sysview">
      <div className="sv-head">
        <Cctv size={18} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Cameras</span>
        <span className="sv-sub">{ENTITIES.camerasAll.length} live feeds</span>
      </div>
      <div className="cv-grid">
        {ENTITIES.camerasAll.map((c) => (
          <CamTile key={c.id} cam={c} tick={tick} />
        ))}
      </div>
    </div>
  );
}
