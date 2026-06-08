/**
 * TweaksPanel — floating bottom-right panel that lets the user change accent,
 * dark/light, card style, and density at runtime. Persisted via useTweaks store.
 *
 * Collapses to a small icon-button when not in use so it doesn't shadow content.
 */
import { useState } from "react";
import clsx from "clsx";
import { Icon } from "./Icon";
import {
  type AccentName,
  type CardStyle,
  type Density,
  useTweaks,
} from "@/state/useTweaks";

const ACCENT_SWATCHES: { id: AccentName; color: string }[] = [
  { id: "amber", color: "#d99a3a" },
  { id: "coral", color: "#e06a4a" },
  { id: "teal", color: "#3ba6a0" },
  { id: "violet", color: "#8b6ee0" },
];

const CARD_STYLES: CardStyle[] = ["glass", "flat", "solid"];
const DENSITIES: Density[] = ["compact", "regular", "comfy"];

export function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const { accent, cardStyle, density, dark, setTweak } = useTweaks();

  if (!open) {
    return (
      <div className="tweaks collapsed">
        <button
          className="icon-btn"
          style={{ width: 38, height: 38 }}
          onClick={() => setOpen(true)}
          aria-label="Open tweaks panel"
          title="Theme tweaks"
        >
          <Icon name="palette" size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <h4>Tweaks</h4>
        <button onClick={() => setOpen(false)} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="tweak-section">Theme</div>
      <div className="tweak-row">
        <label>Accent</label>
        <div className="color-row">
          {ACCENT_SWATCHES.map((a) => (
            <button
              key={a.id}
              className={clsx("color-dot", accent === a.id && "on")}
              style={{ background: a.color }}
              onClick={() => setTweak("accent", a.id)}
              aria-label={`Accent ${a.id}`}
            />
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <label>Dark mode</label>
        <button
          className={clsx("tweak-pill", dark && "on")}
          onClick={() => setTweak("dark", !dark)}
        >
          {dark ? "On" : "Off"}
        </button>
      </div>

      <div className="tweak-section">Surfaces</div>
      <div className="tweak-row">
        <label>Card</label>
        <div className="options">
          {CARD_STYLES.map((s) => (
            <button
              key={s}
              className={clsx("tweak-pill", cardStyle === s && "on")}
              onClick={() => setTweak("cardStyle", s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <label>Density</label>
        <div className="options">
          {DENSITIES.map((d) => (
            <button
              key={d}
              className={clsx("tweak-pill", density === d && "on")}
              onClick={() => setTweak("density", d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
