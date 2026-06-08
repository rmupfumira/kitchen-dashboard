import clsx from "clsx";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { music as musicData } from "@/data/mock";
import { useMusicStore } from "@/state/useMusicStore";

function fmt(s: number): string {
  const sec = Math.max(0, Math.round(s));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/**
 * MusicCard — now-playing tile with album art, draggable progress, shuffle/repeat,
 * play/pause, and volume. In Phase 4 the track + playing state map to
 * `media_player.*` entities; for now it ticks against the mock queue.
 */
export function MusicCard() {
  const {
    idx,
    playing,
    progress,
    volume,
    shuffle,
    repeat,
    setProgress,
    next,
    prev,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    tick,
  } = useMusicStore();

  // Tick once per second while playing — keeps progress bar moving.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [playing, idx, tick]);

  const seekRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const track = musicData.queue[idx];

  const seek = (clientX: number) => {
    const node = seekRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setProgress(frac * track.dur);
  };

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const pt = "touches" in e ? e.touches[0] : (e as MouseEvent);
      seek(pt.clientX);
    };
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const pct = (progress / track.dur) * 100;
  const volStyle = { ["--vp" as string]: `${volume}%` };

  return (
    <div className="card music rise" style={{ gridColumn: "span 4" }}>
      <div className="music-top">
        <div className="music-art">
          <Icon name="music" size={36} />
          <div className={clsx("music-eq", playing && "on")}>
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="music-meta">
          <div className="music-dev">
            <Icon name="cast" size={13} />
            {musicData.device}
          </div>
          <div className="music-title">{track.title}</div>
          <div className="music-artist">{track.artist}</div>
        </div>
      </div>

      <div className="music-seek">
        <span className="t">{fmt(progress)}</span>
        <div
          ref={seekRef}
          className="seekbar"
          onMouseDown={(e) => {
            draggingRef.current = true;
            seek(e.clientX);
          }}
          onTouchStart={(e) => {
            draggingRef.current = true;
            seek(e.touches[0].clientX);
          }}
        >
          <div className="seekfill" style={{ width: `${pct}%` }}>
            <span className="seekdot" />
          </div>
        </div>
        <span className="t">{fmt(track.dur)}</span>
      </div>

      <div className="music-ctrls">
        <button
          type="button"
          className={clsx("mc", shuffle && "act")}
          onClick={toggleShuffle}
          aria-label="Shuffle"
        >
          <Icon name="shuffle" size={17} />
        </button>
        <button type="button" className="mc" onClick={prev} aria-label="Previous">
          <Icon name="skip-back" size={20} />
        </button>
        <button type="button" className="mc play" onClick={togglePlay} aria-label="Play/Pause">
          <Icon name={playing ? "pause" : "play"} size={22} />
        </button>
        <button type="button" className="mc" onClick={next} aria-label="Next">
          <Icon name="skip-forward" size={20} />
        </button>
        <button
          type="button"
          className={clsx("mc", repeat && "act")}
          onClick={toggleRepeat}
          aria-label="Repeat"
        >
          <Icon name="repeat" size={17} />
        </button>
      </div>

      <div className="music-vol">
        <Icon name="volume-2" size={16} color="var(--ink-mute)" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="vol"
          style={volStyle}
        />
        <span className="vlabel">{volume}</span>
      </div>
    </div>
  );
}
