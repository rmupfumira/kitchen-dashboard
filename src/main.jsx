import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { HaProvider } from "./ha/HaContext.jsx";
import "./luxury.css";

/**
 * Auto-fit the UI to the panel.
 *
 * The layout is tuned for a fixed "design canvas" width; we scale the whole
 * document with CSS zoom so it fills any panel resolution consistently.
 *
 * IMPORTANT: `zoom` and `100vh` don't mix — vh units resolve against the real
 * viewport and then get multiplied by the zoom factor, which would make the
 * app taller/wider than the screen and overflow. So we compute the app box as
 * (viewport ÷ zoom) and feed it through CSS vars; after the browser applies
 * zoom, the box lands back at the true screen size exactly.
 */
const DESIGN_W = 1600;
const DESIGN_H = 1000;
function applyScale() {
  // Fit to BOTH axes: the layout is designed for ~1600×1000, so scale by the
  // smaller ratio. This keeps a tall 3:2 kitchen panel and a short 16:9 FHD
  // panel both inside the viewport — no vertical overflow on the wider screen.
  const z = Math.max(1, Math.min(1.8, Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)));
  const root = document.documentElement;
  root.style.zoom = String(z);
  root.style.setProperty("--app-w", window.innerWidth / z + "px");
  root.style.setProperty("--app-h", window.innerHeight / z + "px");
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
