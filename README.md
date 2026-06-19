# Kitchen Dashboard

Self-hosted React wall-panel dashboard for the home, talking to Home Assistant over WebSocket. Runs full-screen on the **kitchen** wall panel. "Luxury Gold" design system (dark obsidian canvas + gold accent).

> Sister project: the living-room panel lives in its own repo, `living-room-dashboard`. The two share this codebase as a starting point and diverge from there — apply shared fixes to both.

## Stack

- **React 18 + Vite 5** (JavaScript, no TypeScript)
- **Plain CSS with custom properties** — one stylesheet, `src/luxury.css`
- **home-assistant-js-websocket** for the live HA connection
- **lucide-react** icons
- No state library, no UI kit, no CSS-in-JS.

## Configure

Copy `.env.example` → `.env` and set (these are inlined into the bundle at **build** time by Vite, and also accepted as Docker build ARGs / Portainer stack env vars):

| Var | Meaning |
|---|---|
| `VITE_HA_URL` | Browser-reachable HA URL, e.g. `http://192.168.1.141:8123` |
| `VITE_HA_TOKEN` | Long-lived access token (HA → profile → **Long-lived access tokens**) |
| `DASHBOARD_PORT` | Host port for the container (kitchen uses **8080**) |
| `TZ` | Timezone for the header clock, e.g. `Africa/Johannesburg` |

`.env` is gitignored — never commit the token.

## Entities

`src/entities.js` is the **single source of truth** mapping Home Assistant entities to dashboard slots (cameras, lights, climate, power, scenes, security, Music Assistant players, the kitchen WLED strips, etc.). Edit it to point at your instance — components import slot names, not raw entity IDs.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
```

Requires Node 20+. `main.jsx` auto-fits the UI to the panel via CSS `zoom` against a 1600×1000 design canvas.

## Deploy (homelab Docker + nginx)

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage: Node 20-alpine builds the bundle → nginx-alpine serves `dist/` |
| `docker-compose.yml` | One service (`kitchen-dashboard`), host port `${DASHBOARD_PORT:-8080}`, own `homelab` bridge net |
| `deploy/nginx.conf` | SPA fallback + immutable cache for hashed assets, `no-store` on index.html |
| `deploy.sh` | One-shot: `./deploy.sh` (git pull + build + up) · `stop` · `restart` · `logs` · `no-pull` |

```bash
# On the homelab
git clone https://github.com/rmupfumira/kitchen-dashboard.git
cd kitchen-dashboard
cp .env.example .env        # fill in VITE_HA_URL / VITE_HA_TOKEN
./deploy.sh                 # → http://<host>:8080
```

Or add the repo as a **Portainer stack** (compose path `docker-compose.yml`) and set the env vars in the stack panel.

## Kiosk

`deploy/mint-kiosk-setup.sh <dashboard-url>` turns a Linux Mint (X11/Cinnamon) PC into a full-screen, auto-launching kiosk. `deploy/kiosk-setup.sh` does the same for Raspberry Pi OS.

## Home Assistant connection

The HA layer is in `src/ha/`: `client.js` opens the long-lived-token WebSocket; `HaContext.jsx` exposes `useHA()` / `useEntity(id)`; `useService.js` calls services. On disconnect a full-screen overlay shows the endpoint + a retry button and the library auto-reconnects.
