import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { HaProvider } from "./ha/HaContext.jsx";
import "./luxury.css";

/**
 * Auto-fit the UI to the panel.
 *
 * The dashboard is laid out against a fixed "design canvas" width; we scale the
 * whole document with CSS zoom so it fills any panel resolution consistently —
 * a 2520-wide screen renders the same proportions as a 1600-wide one, just
 * bigger. Chromium (the kiosk browser) supports `zoom`; it scales layout so our
 * flex bands and clamp() type all follow.
 *
 * DESIGN_W is the width the layout is tuned for. Zoom is clamped so it never
 * shrinks below 1× (small screens render 1:1 and rely on the responsive rules)
 * and never blows up past 1.8× on ultra-wide panels.
 */
const DESIGN_W = 1600;
function applyScale() {
  const z = Math.max(1, Math.min(1.8, window.innerWidth / DESIGN_W));
  document.documentElement.style.zoom = String(z);
}
applyScale();
window.addEventListener("resize", applyScale);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HaProvider>
      <App />
    </HaProvider>
  </StrictMode>
);
