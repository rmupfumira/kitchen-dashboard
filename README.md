# NOCTURNE

A precision-instrument smart-home command-deck dashboard for the living-room wall panel. Self-hosted on the LAN.

Aesthetic: obsidian canvas · solid flat panels · hairline borders · a single electric "argon" mint accent · monospace micro-labels · status LEDs · tabular numerals. Ships with two themes — **Nocturne** (dark, default) and **Daybreak** (light) — and a live accent-hue picker.

## Stack (deliberately minimal)

- **React 18** + **Vite 5** (JavaScript, no TypeScript)
- **Plain CSS with custom properties** — one stylesheet, `:root` for dark, `[data-theme="light"]` for light. The accent ramp is set from JS so it's theme-aware.
- **lucide-react** for icons (single-stroke, `strokeWidth={2}`)
- No state library, no UI kit, no CSS-in-JS, no chart library. State is local hooks; the energy sparkline is hand-rolled flex bars.

## Project layout

```
src/
  main.jsx                React mount
  App.jsx                 Shell: state, rail, header, board grid, theme/accent
  nocturne.css            Tokens (both themes) + all component styles
  data.js                 Mock HA dataset
  lib/
    format.js             fmtTime · fmtDur · f1
    accent.js             ACCENTS map + applyAccent(hex, dark)
  components/
    Rail.jsx · Header.jsx · SectionLabel.jsx · Switch.jsx · Led.jsx
    ClimateCard.jsx · EnergyCard.jsx · WeatherCard.jsx
    NowPlaying.jsx · DoorbellCard.jsx · SceneStrip.jsx
    AccessCard.jsx · DeviceCard.jsx · Toast.jsx
    ThemeToggle.jsx · AccentPicker.jsx
```

## Getting started

```bash
npm install
npm run dev                    # http://localhost:5173
npm run build                  # → dist/ (~196 KB gzipped)
```

Requires Node 20+.

## Self-hosted via Docker (Portainer-friendly)

Same deploy infrastructure as before — image was rebuilt to use Node 20.

| File | Purpose |
|---|---|
| `Dockerfile` | Multi-stage: Node 20-alpine builds the bundle → nginx-alpine serves it |
| `docker-compose.yml` | One service, port `${DASHBOARD_PORT:-8080}`, joins a `homelab` bridge net |
| `deploy/nginx.conf` | SPA fallback, gzip on, immutable cache for hashed assets |
| `deploy.sh` | Local one-shot: `./deploy.sh` (up) · `stop` · `restart` · `logs` · `pull` |
| `.gitattributes` | Forces LF on shell scripts so deploy.sh works on Linux |

### From the homelab

```bash
git clone https://github.com/rmupfumira/kitchen-dashboard.git
cd kitchen-dashboard
cp .env.example .env
./deploy.sh                                   # http://<host>:8080
```

### From Portainer

1. **Stacks → Add stack → Web editor**, paste `docker-compose.yml`, OR
2. **Build method → Repository** (private repo needs a fine-grained PAT)
3. Env vars: `DASHBOARD_PORT=8080`, `TZ=Africa/Johannesburg`
4. **Deploy the stack**

## Two intentional design choices

1. **Card entrance is transform-only.** The cards rise on mount but their visible end state is the base style, never `opacity: 0 → 1`. Several hero cards re-render every second (clock, energy flicker, music progress); animating opacity would restart the animation each tick and pin the card invisible.
2. **Transitions are suppressed during theme flip.** Chromium can latch theme-derived properties mid-transition, leaving elements stuck at the old colour. The theme toggle disables `transition` for two animation frames, swaps `data-theme` + accent, then re-enables.

## Home Assistant wiring

Live state via `home-assistant-js-websocket`. The HA layer lives in `src/ha/`:

| File | Purpose |
|---|---|
| `client.js` | Reads `VITE_HA_URL` / `VITE_HA_TOKEN` (inlined at build time), opens a long-lived-token WebSocket connection |
| `HaContext.jsx` | React provider — tracks status (`connecting` / `connected` / `error`), exposes `useHA()`, `useEntity(id)`, `useEntities(...ids)` |
| `entityMap.js` | **Single source of truth** for which HA entities feed which NOCTURNE slot. Edit this to map your instance. |
| `mappers.js` | Pure functions: `weather.*` → WeatherShape, power sensors → InverterShape, alarm + cover → SecurityShape, doorbell flag → DoorbellShape |
| `callService.js` | Thin wrapper for `conn.sendMessagePromise({ type: "call_service", … })` |

### What's already mapped

| NOCTURNE slot | HA entity (default in `entityMap.js`) |
|---|---|
| Weather card | `weather.pirateweather` |
| Power flow card | `sensor.pv_power` / `sensor.battery_state_of_charge` / `sensor.grid_power` / `sensor.load_power` |
| Garage / Front Gate access | `cover.garage_door_z2m` / `cover.centurion_gate_gate` (toggling fires `cover.open_cover` / `cover.close_cover`) |
| Outdoor / Indoor alarm | `alarm_control_panel.partition_outdoor` / `_indoor` (fires `alarm_arm_away` / `alarm_disarm`) |
| Doorbell ringing | `input_boolean.doorbell_ringing` (fallback: doorbell camera recording state) |
| Unlock button | `lock.front_door_lock` (fires `lock.unlock`) |

### What still uses mock data

- Climate card per room (needs `climate.*` entities mapped per NOCTURNE room id)
- Device grid (needs `light.*` / `switch.*` / `media_player.*` per room)
- Music card (needs a `media_player.*`)
- Scenes (optionally fires `scene.turn_on` / `script.turn_on` if mapped)

Open `src/ha/entityMap.js`, slot in the entity IDs, rebuild. Every component picks up live data automatically.

### Connection state in the UI

- Header LED + sysline reflect status: green pulsing (connected), amber (connecting), red (offline).
- A full-screen overlay appears on disconnect with the endpoint URL + retry button. The library auto-retries every ~8 s.
- Offline-mode actions (toggling a switch, opening the garage) still respond visually so the wall panel doesn't feel dead.

### Configure tokens

Generate a long-lived token: **HA → your user profile → bottom of page → Create token**.

```bash
cp .env.example .env
# edit .env — set VITE_HA_URL and VITE_HA_TOKEN
```

For Docker / Portainer deploys, set the same two env vars on the stack — they're forwarded to the build via `docker-compose.yml` `args:` and baked into the bundle.
