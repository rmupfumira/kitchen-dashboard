import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Wifi, X, Copy, Check } from "lucide-react";
import { ENTITIES } from "../entities";

/** Escape WiFi-QR special chars per the Wi-Fi Network config spec. */
function esc(s) {
  return String(s).replace(/([\\;,:"])/g, "\\$1");
}

/**
 * Guest WiFi popup — network name, password, and a scan-to-join QR code.
 * The QR is generated locally (offline, no external service), so the
 * password never leaves the device.
 */
export default function GuestWifi({ open, onClose }) {
  const { ssid, password, security } = ENTITIES.guestWifi;
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const payload = `WIFI:T:${security};S:${esc(ssid)};P:${esc(password)};;`;
    QRCode.toDataURL(payload, {
      width: 440,
      margin: 1,
      color: { dark: "#0a0a0a", light: "#f4f2ec" },
      errorCorrectionLevel: "M",
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [open, ssid, password, security]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be blocked on the kiosk — the password is shown anyway */
    }
  };

  if (!open) return null;

  return (
    <div className="wifi-backdrop" onClick={onClose}>
      <div className="wifi-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Guest WiFi">
        <button type="button" className="wifi-close" onClick={onClose} aria-label="Close">
          <X size={20} strokeWidth={2} />
        </button>

        <div className="wifi-head">
          <div className="wifi-ic">
            <Wifi size={26} strokeWidth={2} />
          </div>
          <div>
            <div className="wifi-title">Guest WiFi</div>
            <div className="wifi-sub">Scan to join, or enter manually</div>
          </div>
        </div>

        <div className="wifi-body">
          {qr && <img className="wifi-qr" src={qr} alt="Scan to join guest WiFi" />}

          <div className="wifi-fields">
            <div className="wifi-field">
              <div className="wifi-field-l">Network</div>
              <div className="wifi-field-v">{ssid}</div>
            </div>
            <div className="wifi-field">
              <div className="wifi-field-l">Password</div>
              <div className="wifi-field-v wifi-pw">
                {password}
                <button type="button" className="wifi-copy" onClick={copy} aria-label="Copy password">
                  {copied ? <Check size={16} strokeWidth={2.4} /> : <Copy size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
