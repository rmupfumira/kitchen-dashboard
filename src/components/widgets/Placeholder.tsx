/**
 * Placeholder — what we render where the design used the <image-slot> custom
 * web component. In production HA mode this would be a camera-stream / album-art
 * subcomponent; in mock mode it's a friendly hatched panel with a caption.
 */
interface PlaceholderProps {
  label: string;
  variant?: "rounded" | "rect";
}

export function Placeholder({ label, variant = "rounded" }: PlaceholderProps) {
  return (
    <div
      className="ph"
      style={{
        borderRadius: variant === "rounded" ? "var(--radius-md)" : 0,
      }}
    >
      {label}
    </div>
  );
}

/**
 * Dark variant for camera/doorbell tiles — same hatched pattern but on a
 * near-black background to read as "video feed".
 */
export function CameraPlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        background:
          "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 10px, transparent 10px 20px), radial-gradient(120% 120% at 50% 35%, #26211b, #131110)",
        color: "rgba(255,255,255,0.55)",
        fontFamily: "var(--mono)",
        fontSize: 11,
        textAlign: "center",
        padding: 12,
      }}
    >
      {label}
    </div>
  );
}
