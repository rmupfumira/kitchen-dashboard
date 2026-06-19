# Kitchen Dashboard — agent guide

Self-hosted React wall-panel dashboard talking to Home Assistant over WebSocket. This repo drives the **kitchen** wall panel (a Raspberry Pi kiosk). "Luxury Gold" design system — dark canvas + gold accent, skinnable.

## Sibling repo — keep in sync
One of two near-identical per-panel dashboards split from one codebase:
- **kitchen-dashboard** — this repo. Kitchen Pi. Docker container `kitchen-dashboard`, host port **8080**.
- **living-room-dashboard** — sibling. Living-room Linux Mint kiosk. Container `living-room-dashboard`, port **8081**.

They diverge slowly. **A shared change (design system, a component, a bug fix) must be applied to BOTH repos.**

## Stack & conventions
- React 18 + Vite 5, **plain JavaScript (no TypeScript)**.
- **Plain CSS with custom properties** in `src/luxury.css` (one stylesheet). The accent flows through `--accent` / `--gold*`; skins override it via `[data-skin]`.
- `home-assistant-js-websocket` for live HA state; `lucide-react` icons (`strokeWidth={2}`). No state library, no UI kit, no CSS-in-JS.
- Match the surrounding code style; keep components small and self-contained.

## Key files
- `src/entities.js` — **single source of truth** mapping HA entity IDs → dashboard slots. Wire entities here and nowhere else; check consumers before renaming a slot.
- `src/App.jsx` — view routing (`VIEW_PATH` / `SYSTEM_VIEWS`). `src/components/` — one file per card/view.
- `src/ha/` — `client.js` (WS connect via `VITE_HA_URL`/`VITE_HA_TOKEN`), `HaContext.jsx` (`useHA` / `useEntity`), `useService.js`.
- `src/useSettings.jsx` — per-device settings in localStorage (skin, screensaver + timeout, clock). **Screensaver defaults OFF in this (kitchen) repo.**

## Build / verify / deploy
- `npm install`; `npm run dev` (localhost:5173); `npm run build` (→ `dist/`).
- To verify UI changes without HA: build, then serve a static mock that links the compiled `dist/assets/*.css` and screenshot it (the live app needs a HA connection).
- Homelab deploy: `./deploy.sh` (git pull + `docker compose up -d --build`) or a Portainer stack (compose path `docker-compose.yml`). Serves at `http://<host>:8080`.
- HA token is **build-time** `VITE_HA_URL` / `VITE_HA_TOKEN` (Docker build ARGs / Portainer stack env). `.env` is gitignored — never commit secrets.

## Notes
- Deploys pull from git, so commit changes with a clear message and push when they're ready to ship (ask if unsure).
- Don't add TypeScript, a CSS framework, or a state library.
- Live HA can be inspected via the Home Assistant MCP tools when available.
