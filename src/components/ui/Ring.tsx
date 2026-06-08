/**
 * Ring — circular gauge (value 0-100) used in humidity, battery, thermostat dial.
 * Renders a gradient stroke on an SVG circle. Children are centered absolutely
 * (number readout, icon, etc.).
 */
import { type ReactNode, useId } from "react";

interface RingProps {
  value: number;
  size?: number;
  thickness?: number;
  track?: string;
  /** [from, to] OKLCH or CSS colors for the stroke gradient. */
  grad?: [string, string];
  children?: ReactNode;
}

export function Ring({
  value,
  size = 100,
  thickness = 11,
  track = "var(--track)",
  grad = ["var(--amber-glow)", "var(--amber-deep)"],
  children,
}: RingProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const off = c * (1 - v / 100);
  const id = useId().replace(/[:]/g, "");

  return (
    <div className="ring" style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={grad[0]} />
            <stop offset="100%" stopColor={grad[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.3,1,.4,1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        {children}
      </div>
    </div>
  );
}
