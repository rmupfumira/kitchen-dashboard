import { useEffect, useMemo, useState } from "react";
import { Cctv } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { haAuthUrl } from "../ha/useService";

/** One camera preview tile — authed snapshot refreshed every 6s. */
function CamTile({ cam, big = false, tick }) {
  const ent = useEntity(cam.entity);
  const path = ent?.attributes?.entity_picture;
  const src = useMemo(() => {
    if (!path) return "";
    const url = haAuthUrl(path);
    return url + (url.includes("?") ? "&" : "?") + "t=" + tick;
  }, [path, tick]);
  const live = ent && ent.state !== "unavailable";

  return (
    <div className={"cam-tile" + (big ? " big" : "")}>
      {src ? (
        <img src={src} alt={cam.name} onError={(e) => { e.currentTarget.style.display = "none"; }} />
      ) : (
        <div className="cam-fallback">{cam.name}</div>
      )}
      <div className="cam-overlay">
        <div className="cam-name-row">
          <span className="cam-nm">{cam.name}</span>
          <span className="cam-live">
            <Led tone={live ? "critical" : "default"} pulse={live} />
            {live ? "LIVE" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Right column — 1 big doorbell preview + 2 smaller (pool, garage). */
export default function CamerasCard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 6000);
    return () => clearInterval(id);
  }, []);

  const [first, ...rest] = ENTITIES.cameras;

  return (
    <div className="card rise cams">
      <div className="cams-head">
        <Cctv size={15} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Cameras</span>
      </div>
      <div className="cam-grid">
        <CamTile cam={first} big tick={tick} />
        {rest.map((c) => (
          <CamTile key={c.id} cam={c} tick={tick} />
        ))}
      </div>
    </div>
  );
}
