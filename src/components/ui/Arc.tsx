/**
 * Arc — 270° interactive dial used for light brightness.
 * The user can drag anywhere along the arc; the handle snaps to the closest
 * legal angle. Gap is at the bottom (135° → 405°).
 */
import { useCallback, useEffect, useId, useRef } from "react";

interface ArcProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}

export function Arc({ value, onChange, size = 230 }: ArcProps) {
  const ref = useRef<SVGSVGElement>(null);
  const dragRef = useRef(false);
  const thickness = 18;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAng = 135;
  const sweep = 270;
  const id = useId().replace(/[:]/g, "");

  const polar = (ang: number): [number, number] => {
    const a = ((ang - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arcPath = (frac: number) => {
    const a0 = startAng;
    const a1 = startAng + sweep * frac;
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const v = Math.max(0, Math.min(100, value));
  const [hx, hy] = polar(startAng + sweep * (v / 100));

  const handlePoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = clientX - rect.left - cx;
      const py = clientY - rect.top - cy;
      let ang = (Math.atan2(py, px) * 180) / Math.PI + 90;
      if (ang < 0) ang += 360;
      let rel = ang - startAng;
      if (rel < 0) rel += 360;
      if (rel > sweep) rel = rel > sweep + (360 - sweep) / 2 ? 0 : sweep;
      onChange?.(Math.round((rel / sweep) * 100));
    },
    [onChange, cx, cy, startAng, sweep]
  );

  // Global mouse/touch listeners so drag can leave the SVG bounds.
  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const point = "touches" in e ? e.touches[0] : (e as MouseEvent);
      handlePoint(point.clientX, point.clientY);
    };
    const up = () => {
      dragRef.current = false;
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
  }, [handlePoint]);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      style={{ cursor: "pointer", touchAction: "none" }}
      onMouseDown={(e) => {
        dragRef.current = true;
        handlePoint(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        dragRef.current = true;
        const t = e.touches[0];
        handlePoint(t.clientX, t.clientY);
      }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--amber-glow)" />
          <stop offset="100%" stopColor="var(--amber-deep)" />
        </linearGradient>
      </defs>
      <path d={arcPath(1)} fill="none" stroke="var(--track)" strokeWidth={thickness} strokeLinecap="round" />
      <path
        d={arcPath(v / 100)}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={thickness}
        strokeLinecap="round"
        style={{ transition: "all .4s cubic-bezier(.3,1,.4,1)" }}
      />
      <circle
        cx={hx}
        cy={hy}
        r={11}
        fill="#fff"
        stroke="var(--amber-deep)"
        strokeWidth={3}
        style={{ filter: "drop-shadow(0 3px 6px rgba(120,95,40,.4))" }}
      />
    </svg>
  );
}
