/**
 * NOCTURNE → Home Assistant entity mapping.
 *
 * This file is the ONLY place you need to edit when adding/removing entities
 * from the dashboard. Defaults match the entities the dev session discovered
 * on the user's instance; if anything is wrong, just edit the right-hand side.
 *
 * Set a slot to null to leave that piece of the UI on mock data.
 */

export const HA_ENTITIES = {
  /* ── Weather (WeatherCard) ───────────────────────────────── */
  weather: "weather.pirateweather",

  /* ── Power flow (EnergyCard) ─────────────────────────────── */
  power: {
    solar: "sensor.pv_power",            // kW
    battery: "sensor.battery_state_of_charge",  // %
    grid: "sensor.grid_power",           // kW (positive = importing)
    load: "sensor.load_power",           // kW
  },

  /* ── Security (4 AccessCards) ────────────────────────────── */
  security: {
    garage: "cover.garage_door_z2m",
    gate: "cover.centurion_gate_gate",
    outdoorAlarm: "alarm_control_panel.partition_outdoor",
    indoorAlarm: "alarm_control_panel.partition_indoor",
  },

  /* ── Doorbell (DoorbellCard) ─────────────────────────────── */
  doorbell: {
    /* The ringing flag is derived from the doorbell camera's recording state
     * OR an input_boolean.doorbell_ringing if you have one; fallback shows idle. */
    ringingFlag: "input_boolean.doorbell_ringing",
    camera: "camera.doorbell_frigate",
    /* Optional override for the unlock button — defaults to the front-door lock. */
    lock: "lock.front_door_lock",
  },

  /* ── Climate (ClimateCard, per active room) ──────────────── */
  /* Slot the user's actual climate entity ids in here when ready.
   * Each room id (matches data.js rooms[]) → climate entity. */
  climate: {
    living: null,
    bed: null,
    kitchen: null,
    dining: null,
    garage: null,
  },

  /* ── Devices (DeviceCard grid, per room) ─────────────────── */
  /* Per-room device lists. Each device: { id, name, model, type, entity }.
   * Leave the room undefined to keep showing mock data for that room. */
  devices: {
    // Example:
    // living: [
    //   { id: "tv",   name: "Living Room TV",  model: "Sony Bravia",   type: "tv",     entity: "media_player.bravia" },
    //   { id: "lamp", name: "Floor Lamp",      model: "Philips Hue",   type: "light",  entity: "light.living_room_lamp" },
    // ],
  },

  /* ── Music (NowPlaying) ──────────────────────────────────── */
  music: null,        // e.g. "media_player.sonos_living_room"

  /* ── Scenes (SceneStrip) ─────────────────────────────────── */
  /* If you want the scene tiles to trigger real scene.* / script.* / automation.*
   * entities, slot them here keyed by the NOCTURNE scene id from data.js.
   * Anything left null fires a toast only. */
  scenes: {
    morning: null,
    night: null,
    guest: null,
    focus: null,
    movie: null,
    dinner: null,
    away: null,
  },
};
