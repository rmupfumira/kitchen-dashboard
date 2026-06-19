import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { HaProvider } from "./ha/HaContext.jsx";
import { ConfirmProvider } from "./components/Confirm.jsx";
import { SettingsProvider, SETTINGS_KEY } from "./useSettings.jsx";
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
  //
  // The lower bound MUST be able to drop below 1.0: when the usable height is
  // less than the design height (e.g. an FHD panel shown in a browser tab where
  // the address bar eats ~140px, leaving ~940px), zoom needs to shrink to ~0.94
  // so the 1000px-tall canvas still fits. A 1.0 floor would force overflow +
  // scrolling. 0.4 is just a sanity floor so a tiny window doesn't vanish.
  const z = Math.max(0.4, Math.min(1.8, Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)));
  const root = document.documentElement;
  root.style.zoom = String(z);
  root.style.setProperty("--app-w", window.innerWidth / z + "px");
  root.style.setProperty("--app-h", window.innerHeight / z + "px");
}
applyScale();
window.addEventListener("resize", applyScale);

// Pre-apply the saved skin before first paint to avoid a flash of the default.
try {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  document.documentElement.dataset.skin = saved.skin || "gold";
} catch {
  document.documentElement.dataset.skin = "gold";
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SettingsProvider>
      <HaProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </HaProvider>
    </SettingsProvider>
  </StrictMode>
);
