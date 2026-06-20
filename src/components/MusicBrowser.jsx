import { useEffect, useRef, useState } from "react";
import { Search, X, Play, ListPlus, Speaker, Music, Radio } from "lucide-react";
import { ENTITIES } from "../entities";
import { useService } from "../ha/useService";

const TABS = [
  { id: "track", label: "Songs", key: "tracks" },
  { id: "album", label: "Albums", key: "albums" },
  { id: "playlist", label: "Playlists", key: "playlists" },
  { id: "radio", label: "Radio", key: "radio" },
];

/**
 * Music Assistant browser — search the library and play / queue a result to a
 * speaker (defaults to whatever the audio card is pointed at, i.e. the kitchen
 * speaker). Uses music_assistant.search (response) + music_assistant.play_media.
 */
export default function MusicBrowser({ playerEntity, players, onPickPlayer, onClose, onToast }) {
  const call = useService();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("track");
  const [results, setResults] = useState(null); // null = idle; object = searched
  const [loading, setLoading] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const timer = useRef(null);
  const playerName = players.find((p) => p.entity === playerEntity)?.name || "Speaker";

  // debounced library search
  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim()) { setResults(null); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await call(
          "music_assistant", "search",
          { config_entry_id: ENTITIES.music.configEntry, name: q, media_type: ["track", "album", "playlist", "radio"], limit: 24 },
          undefined, true,
        );
        setResults(res || {});
      } catch {
        setResults({});
        onToast?.("disc-3", "Search failed");
      }
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer.current);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = (item, enqueue) => {
    call("music_assistant", "play_media", { media_id: item.uri, enqueue }, { entity_id: playerEntity });
    onToast?.(enqueue === "add" ? "list-plus" : "play", `${enqueue === "add" ? "Queued" : "Playing"} · ${item.name}`);
  };

  // One-tap preset: find the station by name and play its top hit.
  const playPreset = async (name) => {
    try {
      const res = await call(
        "music_assistant", "search",
        { config_entry_id: ENTITIES.music.configEntry, name, media_type: ["radio"], limit: 1 },
        undefined, true,
      );
      const station = res?.radio?.[0];
      if (!station) { onToast?.("radio", `No station found for ${name}`); return; }
      call("music_assistant", "play_media", { media_id: station.uri, enqueue: "play" }, { entity_id: playerEntity });
      onToast?.("radio", `Playing · ${station.name}`);
    } catch {
      onToast?.("radio", "Couldn't start radio (enable Radio Browser in Music Assistant)");
    }
  };

  const key = TABS.find((t) => t.id === tab)?.key;
  const items = results?.[key] || [];
  const isRadio = tab === "radio";
  const presets = ENTITIES.music.radioPresets || [];
  const showPresets = isRadio && !q.trim() && presets.length > 0;

  return (
    <div className="mbrowse" role="dialog" aria-label="Music browser" onClick={onClose}>
      <div className="mbrowse-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mbrowse-head">
          <div className="mbrowse-search">
            <Search size={22} strokeWidth={1.6} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={isRadio ? "Search radio stations…" : "Search songs, albums, playlists…"} />
          </div>
          <button type="button" className="mbrowse-x" onClick={onClose} aria-label="Close"><X size={24} strokeWidth={2.2} /></button>
        </div>

        <div className="mbrowse-bar">
          <div className="mbrowse-tabs">
            {TABS.map((t) => (
              <button type="button" key={t.id} className={"mbrowse-tab" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <div className="mbrowse-dev">
            <button type="button" className="mbrowse-dev-btn" onClick={() => setPickOpen((o) => !o)}>
              <Speaker size={18} strokeWidth={1.8} /><span>{playerName}</span>
            </button>
            {pickOpen && (
              <div className="mbrowse-dev-list">
                {players.map((p) => (
                  <button type="button" key={p.id} className={p.entity === playerEntity ? "on" : ""} onClick={() => { onPickPlayer(p.entity); setPickOpen(false); }}>{p.name}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mbrowse-results">
          {showPresets && (
            <div className="mbrowse-presets">
              <div className="mbrowse-presets-h">Favourite stations</div>
              <div className="mbrowse-presets-chips">
                {presets.map((name) => (
                  <button type="button" key={name} className="mbrowse-preset" onClick={() => playPreset(name)}>
                    <Radio size={16} strokeWidth={1.8} />{name}
                  </button>
                ))}
              </div>
              <div className="mbrowse-presets-hint">…or search for any station above.</div>
            </div>
          )}
          {loading && <div className="mbrowse-msg">Searching…</div>}
          {!loading && !showPresets && !results && <div className="mbrowse-msg">Type to search your music library.</div>}
          {!loading && results && items.length === 0 && <div className="mbrowse-msg">No {isRadio ? "stations" : key} found for “{q}”.</div>}
          {!loading && items.map((it) => (
            <div className="mbrowse-item" key={it.uri}>
              <div className="mbrowse-art">
                {it.image ? <img src={it.image} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : (isRadio ? <Radio size={22} strokeWidth={1.3} /> : <Music size={22} strokeWidth={1.3} />)}
              </div>
              <div className="mbrowse-meta">
                <div className="mbrowse-name">{it.name}</div>
                <div className="mbrowse-sub">{isRadio ? "Radio station" : (it.artists?.map((a) => a.name).join(", ")) || (tab === "playlist" ? "Playlist" : tab === "album" ? "Album" : "")}</div>
              </div>
              {!isRadio && <button type="button" className="mbrowse-act" onClick={() => play(it, "add")} aria-label="Add to queue" title="Add to queue"><ListPlus size={24} strokeWidth={1.6} /></button>}
              <button type="button" className="mbrowse-act play" onClick={() => play(it, "play")} aria-label="Play now" title="Play now"><Play size={24} strokeWidth={1.8} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
