import { Palette, MonitorPlay, Clock, RotateCcw } from "lucide-react";
import { useSettings, SKINS, SCREENSAVER_TIMEOUTS } from "../useSettings";

/** Per-device settings: skin, screensaver (enable + timeout), clock format. */
export default function SettingsView({ onToast }) {
  const { settings, set, reset } = useSettings();

  return (
    <div className="settings">
      <div className="set-head">
        <span className="sect-title">Settings</span>
        <div className="set-sub">Saved on this device only — each wall panel configures independently.</div>
      </div>

      {/* Appearance */}
      <div className="set-card">
        <div className="set-card-h"><Palette size={15} strokeWidth={2.2} /> Appearance · Skin</div>
        <div className="set-skins">
          {SKINS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={"set-skin" + (settings.skin === s.id ? " on" : "")}
              style={{ ["--swatch"]: s.hex }}
              onClick={() => { set({ skin: s.id }); onToast?.("palette", s.name); }}
            >
              <span className="set-skin-dot" />{s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Screensaver */}
      <div className="set-card">
        <div className="set-card-h"><MonitorPlay size={15} strokeWidth={2.2} /> Screensaver</div>
        <div className="set-row">
          <div className="set-row-l">
            <div className="set-row-t">Clock screensaver</div>
            <div className="set-row-s">Show a full-screen clock when the panel sits idle.</div>
          </div>
          <span
            className={"switch" + (settings.screensaver ? " on" : "")}
            role="button"
            tabIndex={0}
            aria-label="Toggle screensaver"
            onClick={() => set({ screensaver: !settings.screensaver })}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") set({ screensaver: !settings.screensaver }); }}
          />
        </div>
        <div className="set-row">
          <div className="set-row-l">
            <div className="set-row-t">Idle timeout</div>
            <div className="set-row-s">How long before the clock appears.</div>
          </div>
          <div className="set-seg">
            {SCREENSAVER_TIMEOUTS.map((t) => (
              <button
                key={t.sec}
                type="button"
                disabled={!settings.screensaver}
                className={settings.screensaverTimeoutSec === t.sec ? "on" : ""}
                onClick={() => set({ screensaverTimeoutSec: t.sec })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clock */}
      <div className="set-card">
        <div className="set-card-h"><Clock size={15} strokeWidth={2.2} /> Clock</div>
        <div className="set-row">
          <div className="set-row-l">
            <div className="set-row-t">Time format</div>
            <div className="set-row-s">24-hour or 12-hour (AM/PM).</div>
          </div>
          <div className="set-seg">
            <button type="button" className={settings.clock24h ? "on" : ""} onClick={() => set({ clock24h: true })}>24-hour</button>
            <button type="button" className={!settings.clock24h ? "on" : ""} onClick={() => set({ clock24h: false })}>12-hour</button>
          </div>
        </div>
      </div>

      <button type="button" className="set-reset" onClick={() => { reset(); onToast?.("rotate-ccw", "Settings reset to defaults"); }}>
        <RotateCcw size={15} strokeWidth={2.2} /> Reset to defaults
      </button>
      <div className="set-note">Tip: turn the screensaver on for the living-room panel and leave it off in the kitchen.</div>
    </div>
  );
}
