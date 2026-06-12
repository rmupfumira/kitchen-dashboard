import { useEffect, useRef, useState } from "react";
import { SkipBack, SkipForward, Play, Pause, Music, Volume2 } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService, haUrl } from "../ha/useService";
import { fmtDur } from "../lib/format";

function livePosition(ent) {
  if (!ent) return 0;
  const pos = Number(ent.attributes?.media_position);
  if (!Number.isFinite(pos)) return 0;
  const since = ent.attributes?.media_position_updated_at;
  if (ent.state === "playing" && since) {
    return Math.max(0, pos + (Date.now() - new Date(since).getTime()) / 1000);
  }
  return pos;
}

/** Lounge TV media card — art, track, seek, transport, volume. */
export default function MediaCard({ onToast }) {
  const ent = useEntity(ENTITIES.media);
  const call = useService();

  const playing = ent?.state === "playing";
  const duration = Number(ent?.attributes?.media_duration) || 0;
  const title = ent?.attributes?.media_title || (ent?.state === "off" ? "Powered off" : "Nothing playing");
  const artist = ent?.attributes?.media_artist || "";
  const device = ent?.attributes?.friendly_name || "Lounge TV";
  const artPath = ent?.attributes?.entity_picture;
  const art = artPath ? haUrl(artPath) : "";
  const volume = Number(ent?.attributes?.volume_level);
  const volPct = Number.isFinite(volume) ? Math.round(volume * 100) : 50;

  const [, force] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const pos = livePosition(ent);
  const pct = duration > 0 ? Math.min(100, (pos / duration) * 100) : 0;

  const seekRef = useRef(null);
  const doSeek = (clientX) => {
    if (!duration || !seekRef.current) return;
    const r = seekRef.current.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    call("media_player", "media_seek", { seek_position: frac * duration }, { entity_id: ENTITIES.media });
  };

  const togglePlay = () => {
    onToast?.(playing ? "pause" : "play", playing ? "Paused" : "Playing");
    call("media_player", "media_play_pause", {}, { entity_id: ENTITIES.media });
  };
  const setVol = (p) =>
    call("media_player", "volume_set", { volume_level: p / 100 }, { entity_id: ENTITIES.media });

  return (
    <div className="card rise media">
      <div className="media-top">
        <div className="m-art">
          {art ? <img src={art} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Music size={26} strokeWidth={1.6} />}
        </div>
        <div className="m-meta">
          <div className="m-dev">
            <Led tone={playing ? "gold" : "default"} pulse={playing} />
            {device}
          </div>
          <div className="m-title">{title}</div>
          {artist && <div className="m-artist">{artist}</div>}
        </div>
      </div>

      <div className="m-seek">
        <span className="m-t tabular">{fmtDur(pos)}</span>
        <div ref={seekRef} className="m-bar" onMouseDown={(e) => doSeek(e.clientX)} onTouchStart={(e) => doSeek(e.touches[0].clientX)}>
          <div className="m-fill" style={{ width: `${pct}%` }}>
            <span className="m-dot" />
          </div>
        </div>
        <span className="m-t r tabular">{duration ? fmtDur(duration) : "—:—"}</span>
      </div>

      <div className="m-ctrls">
        <button type="button" className="m-btn" onClick={() => call("media_player", "media_previous_track", {}, { entity_id: ENTITIES.media })} aria-label="Previous">
          <SkipBack size={15} strokeWidth={2} />
        </button>
        <button type="button" className="m-btn play" onClick={togglePlay} aria-label="Play/Pause">
          {playing ? <Pause size={17} strokeWidth={2.2} /> : <Play size={17} strokeWidth={2.2} />}
        </button>
        <button type="button" className="m-btn" onClick={() => call("media_player", "media_next_track", {}, { entity_id: ENTITIES.media })} aria-label="Next">
          <SkipForward size={15} strokeWidth={2} />
        </button>
        <div className="m-vol">
          <Volume2 size={14} strokeWidth={2} color="var(--ink-mute)" />
          <input
            type="range"
            min={0}
            max={100}
            value={volPct}
            onChange={(e) => setVol(Number(e.target.value))}
            style={{ ["--vp"]: `${volPct}%` }}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
