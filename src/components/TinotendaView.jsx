import { useEffect, useRef, useState } from "react";
import { BedDouble, Lightbulb, Plug, Thermometer, Droplets, Minus, Plus, Volume2, VolumeX, Gauge } from "lucide-react";
import Led from "./Led";
import { HA_URL } from "../ha/client";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";
import ClimateCard from "./ClimateCard";
import Switch from "./Switch";

const num = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };

/**
 * Tinotenda camera.
 *   Default: reliable live snapshots (camera_proxy, ~1s) — same proven path as
 *            the Cameras view; never blocks the view.
 *   Audio:   tap 🔊 to upgrade to a live WebRTC stream (video + AUDIO). This is
 *            how HA's own UI streams cameras — it carries the audio track that
 *            HA's HLS drops. Peer-to-peer over the LAN (no nginx/HLS proxy).
 *            Any failure self-reverts to snapshots, so the camera always shows.
 */
function TinoCamera({ entityId }) {
  const { conn, status } = useHA();
  const ent = useEntity(entityId);
  const videoRef = useRef(null);
  const gotTrack = useRef(false);
  const [tick, setTick] = useState(0);
  const [audio, setAudio] = useState(false);

  // snapshot refresh (default live-ish view)
  useEffect(() => {
    if (audio) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [audio]);

  // WebRTC stream (video + audio) — only while the user has opted into audio
  useEffect(() => {
    if (!audio || status !== "connected" || !conn) return undefined;
    let alive = true;
    let pc;
    let unsub;
    let sessionId = null;
    let pending = [];
    let failTimer;
    gotTrack.current = false;
    const bail = () => { if (alive) setAudio(false); };
    const sendCandidate = (cand) =>
      conn.sendMessagePromise({ type: "camera/webrtc/candidate", session_id: sessionId, candidate: cand }).catch(() => {});

    (async () => {
      try {
        pc = new RTCPeerConnection();
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addEventListener("track", (ev) => {
          const v = videoRef.current;
          if (!alive || !v || !ev.streams[0]) return;
          v.srcObject = ev.streams[0];
          gotTrack.current = true;
          v.play().catch(() => {});
        });
        pc.addEventListener("icecandidate", (ev) => {
          if (!ev.candidate?.candidate) return;
          const cand = { candidate: ev.candidate.candidate, sdpMid: ev.candidate.sdpMid };
          if (sessionId) sendCandidate(cand); else pending.push(cand);
        });
        pc.addEventListener("connectionstatechange", () => {
          if (["failed", "closed", "disconnected"].includes(pc.connectionState)) bail();
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (!alive) return;

        unsub = await conn.subscribeMessage(
          (msg) => {
            if (!alive) return;
            try {
              if (msg.type === "session") {
                sessionId = msg.session_id;
                pending.forEach(sendCandidate);
                pending = [];
              } else if (msg.type === "answer") {
                pc.setRemoteDescription({ type: "answer", sdp: msg.answer });
              } else if (msg.type === "candidate") {
                const c = typeof msg.candidate === "string" ? { candidate: msg.candidate } : msg.candidate;
                if (c?.candidate) pc.addIceCandidate(c).catch(() => {});
              } else if (msg.type === "error") {
                bail();
              }
            } catch { bail(); }
          },
          { type: "camera/webrtc/offer", entity_id: entityId, offer: pc.localDescription.sdp }
        );

        failTimer = setTimeout(() => { if (alive && !gotTrack.current) bail(); }, 8000);
      } catch { bail(); }
    })();

    return () => {
      alive = false;
      clearTimeout(failTimer);
      try { unsub && unsub(); } catch {}
      try { pc && pc.close(); } catch {}
    };
  }, [audio, conn, status, entityId]);

  const token = (ent?.attributes?.entity_picture || "").split("token=")[1];
  const snap = token ? `${HA_URL}/api/camera_proxy/${entityId}?token=${token}&_=${tick}` : "";

  return (
    <div className="tino-cam">
      {audio ? (
        <video ref={videoRef} autoPlay playsInline />
      ) : snap ? (
        <img src={snap} alt="Tinotenda camera" onError={(e) => { e.currentTarget.style.opacity = 0; }} />
      ) : (
        <div className="cam-fallback">Camera unavailable</div>
      )}
      <span className="cam-live-pill"><Led tone="critical" pulse />LIVE</span>
      <button
        type="button"
        className={"tino-mute" + (audio ? " on" : "")}
        onClick={() => setAudio((a) => !a)}
        aria-label={audio ? "Stop live audio" : "Live audio"}
        title={audio ? "Live audio on — tap to stop" : "Tap for live audio"}
      >
        {audio ? <Volume2 size={22} strokeWidth={2} /> : <VolumeX size={22} strokeWidth={2} />}
      </button>
    </div>
  );
}

function ToggleControl({ id, name, Icon, onToast }) {
  const ent = useEntity(id);
  const call = useService();
  const on = ent?.state === "on";
  const unavail = !ent || ent.state === "unavailable";
  return (
    <div className={"tino-ctl" + (on ? " on" : "")}>
      <Icon size={20} strokeWidth={2} className="tino-ctl-ic" />
      <span className="tino-ctl-n">{name}</span>
      <Switch
        on={on}
        disabled={unavail}
        ariaLabel={name}
        onClick={() => { if (!unavail) { onToast?.("bolt", `${name} ${on ? "off" : "on"}`); call(id.split(".")[0], "toggle", {}, { entity_id: id }); } }}
      />
    </div>
  );
}

function TempRange({ T }) {
  const minEnt = useEntity(T.minTemp);
  const maxEnt = useEntity(T.maxTemp);
  const call = useService();
  const min = num(minEnt);
  const max = num(maxEnt);
  const adj = (id, cur, d) => { if (Number.isFinite(cur)) call("input_number", "set_value", { value: cur + d }, { entity_id: id }); };
  const Row = ({ label, id, val }) => (
    <div className="tino-range-row">
      <span className="tino-range-l">{label}</span>
      <button type="button" onClick={() => adj(id, val, -1)} aria-label="lower"><Minus size={16} strokeWidth={2.4} /></button>
      <b className="tabular">{Number.isFinite(val) ? Math.round(val) : "—"}°</b>
      <button type="button" onClick={() => adj(id, val, 1)} aria-label="raise"><Plus size={16} strokeWidth={2.4} /></button>
    </div>
  );
  return (
    <div className="tino-range">
      <Row label="Min" id={T.minTemp} val={min} />
      <Row label="Max" id={T.maxTemp} val={max} />
    </div>
  );
}

/** Tinotenda's room — his camera commands the view, controls on the right. */
export default function TinotendaView({ onToast }) {
  const T = ENTITIES.tinotenda;
  const t = num(useEntity(T.temp));
  const h = num(useEntity(T.humidity));

  return (
    <div className="sysview">
      <div className="sv-head">
        <BedDouble size={18} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Tinotenda</span>
        <span className="sv-pill" style={{ marginLeft: "auto" }}>
          <Thermometer size={14} strokeWidth={2.2} /> {Number.isFinite(t) ? t.toFixed(1) : "—"}°
        </span>
        <span className="sv-pill">
          <Droplets size={14} strokeWidth={2.2} /> {Number.isFinite(h) ? Math.round(h) : "—"}%
        </span>
      </div>

      <div className="tino-grid">
        <TinoCamera entityId={T.camera} />

        <div className="tino-side">
          <ClimateCard acEntity={T.ac} tempEntity={T.temp} onToast={onToast} />
          <div className="tino-controls">
            <div className="tino-ctl-h">Room controls</div>
            <ToggleControl id={T.light} name="Light" Icon={Lightbulb} onToast={onToast} />
            <ToggleControl id={T.acPower} name="AC Power" Icon={Plug} onToast={onToast} />
            <ToggleControl id={T.autoTemp} name="Auto Temp" Icon={Gauge} onToast={onToast} />
            <TempRange T={T} />
          </div>
        </div>
      </div>
    </div>
  );
}
