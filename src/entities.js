/**
 * Aurora → Home Assistant entity mapping.
 *
 * This is the ONLY place in the codebase that hard-codes entity IDs.
 * Every component imports the slot name; if you need to point a tile at a
 * different entity, change it here and only here.
 *
 * Validated against the live HA instance (2026.5.4) during Phase 0
 * — see the Aurora mapping table in the conversation history.
 */

export const ENTITIES = {
  /* ─── Doorbell ──────────────────────────────────────────── */
  doorbell: {
    camera: "camera.doorbell_frigate",
    ring: "binary_sensor.doorbell_doorbell",      // physical button press
    motion: "binary_sensor.g4_doorbell_pro_poe_motion",
    ringing: "input_boolean.doorbell_ringing",    // sticky "is ringing right now"
    lock: "lock.front_door_lock",
  },

  /* ─── Security ──────────────────────────────────────────── */
  security: {
    garage: "cover.garage_door_z2m",
    gate: "cover.centurion_gate_gate",
    outdoorAlarm: "alarm_control_panel.partition_outdoor",
    indoorAlarm: "alarm_control_panel.partition_indoor",
    entArea: "lock.ent_area",       // entertainment area door (it's a lock)
    screenGate: "cover.screen_gate",
    secureHomeScript: "script.secure_home",
  },

  /* ─── Solar / Power (Deye/SunSynk inverter, values in Watts) ── */
  power: {
    pvPower: "sensor.pv_power",                        // W
    pvToday: "sensor.pv_energy",                       // kWh
    pvPeakForecast: "sensor.solcast_pv_forecast_peak_forecast_today", // kW (forecast — fallback ref)
    loadPower: "sensor.load_power",                    // W
    loadToday: "sensor.load_energy",                   // kWh
    gridPower: "sensor.grid_power",                    // W (positive = importing)
    gridImportToday: "sensor.grid_energy_in",          // kWh
    gridExportToday: "sensor.grid_energy_out",         // kWh
    batterySoc: "sensor.battery_state_of_charge",      // %
    batteryPower: "sensor.battery_power",              // W (+charge / −discharge)
    batteryTime: null,                                 // not present in this install
    selfSufficiency: "sensor.off_grid_percentage_today", // %
  },

  /* ─── Scenes (4 one-tap moods) ──────────────────────────── */
  scenes: [
    { id: "morning", name: "Good Morning", icon: "sunrise",      entity: "scene.good_morning" },
    { id: "night",   name: "Night",        icon: "moon",         entity: "scene.good_night" },
    { id: "guest",   name: "Guest",        icon: "users",        entity: "input_boolean.guest_mode" },
    { id: "movie",   name: "Movie",        icon: "clapperboard", entity: "input_boolean.movie_scene" },
  ],

  /* ─── Weather ────────────────────────────────────────────── */
  weather: "weather.pirateweather",

  /* ─── Cameras (3 large previews) ─────────────────────────── */
  cameras: [
    { id: "doorbell", name: "Front Door", entity: "camera.doorbell_frigate" },
    { id: "pool", name: "Swimming Pool", entity: "camera.swimming_pool_frigate" },
    { id: "garage", name: "Garage", entity: "camera.garage_cam_frigate" },
  ],

  /* ─── Kitchen lighting ───────────────────────────────────── */
  /* WLED strips: placeholder IDs — rename these once the 6 strips are
     flashed + named in the WLED integration. Until then the tiles render
     in the muted "unavailable" state. WLED creates light.<device_name>. */
  kitchen: {
    strips: [
      { id: "s1", name: "Strip 1", entity: "light.kitchen_strip_1" },
      { id: "s2", name: "Strip 2", entity: "light.kitchen_strip_2" },
      { id: "s3", name: "Strip 3", entity: "light.kitchen_strip_3" },
      { id: "s4", name: "Strip 4", entity: "light.kitchen_strip_4" },
      { id: "s5", name: "Strip 5", entity: "light.kitchen_strip_5" },
      { id: "s6", name: "Strip 6", entity: "light.kitchen_strip_6" },
    ],
    switches: [
      { id: "pendant", name: "Pendant", icon: "lamp-ceiling", entity: "switch.kitchen_pendant" },
      { id: "down", name: "Downlighters", icon: "lightbulb", entity: "switch.kitchen_downlighter" },
      { id: "peninsula", name: "Peninsula", icon: "lightbulb", entity: "switch.kitchen_peninsula_downlighter" },
    ],
  },

  /* ─── Per-room lighting (the lighting card swaps by route) ── */
  lighting: {
    kitchen: {
      title: "Kitchen Lighting",
      tiles: [
        { id: "pendant", name: "Pendant", icon: "lamp-ceiling", entity: "switch.kitchen_pendant" },
        { id: "down", name: "Downlighters", icon: "lightbulb", entity: "switch.kitchen_downlighter" },
        { id: "peninsula", name: "Peninsula", icon: "lightbulb", entity: "switch.kitchen_peninsula_downlighter" },
      ],
      ledNav: true, // 4th tile → WLED control view
    },
    living: {
      title: "Living Room Lighting",
      tiles: [
        { id: "pendant", name: "Pendant", icon: "lamp-ceiling", entity: "switch.dining_room_pendant" },
        { id: "wall", name: "Wall Light", icon: "lightbulb", entity: "switch.living_room_wall_light" },
        { id: "down", name: "Downlighters", icon: "lightbulb", entity: "switch.living_room_downlighters" },
        { id: "rgb", name: "RGB Lights", icon: "lightbulb", entity: "light.living_room_lights_rgb" },
      ],
      ledNav: false,
    },
  },

  /* ─── Per-room climate (kitchen → geyser, living → AC) ────── */
  climate: {
    living: { ac: "climate.living_room_ac", temp: "sensor.living_room_remote_temperature" },
  },

  /* ─── Geyser (kitchen climate slot) ──────────────────────── */
  geyser: {
    toggle: "switch.geyser",                              // on/off
    currentTemp: "sensor.geyserwise_tse_water_temperature", // °C actual
    targetTemp: "input_number.geyser_temperature",        // °C setpoint
  },

  /* ─── Security controls shown on the dashboard (7 tiles) ──── */
  securityControls: [
    { id: "outdoorAlarm", name: "Outdoor Alarm", icon: "siren", entity: "alarm_control_panel.partition_outdoor", kind: "alarm" },
    { id: "indoorAlarm", name: "Indoor Alarm", icon: "shield", entity: "alarm_control_panel.partition_indoor", kind: "alarm" },
    { id: "gate", name: "Gate", icon: "fence", entity: "cover.centurion_gate_gate", kind: "cover" },
    { id: "garage", name: "Garage Door", icon: "warehouse", entity: "cover.garage_door_z2m", kind: "cover" },
    { id: "frontDoor", name: "Front Door", icon: "door-closed", entity: "lock.front_door_lock", kind: "lock" },
    { id: "screenGate", name: "Screen Gate", icon: "fence", entity: "cover.screen_gate", kind: "cover" },
    { id: "entArea", name: "Ent. Area", icon: "lock", entity: "lock.ent_area", kind: "lock" },
  ],

  /* ─── Laundry status (read-only) ─────────────────────────── */
  /* Both are input_select helpers with options running/finished — the user's
     curated appliance state machines (LG washer + dryer). */
  laundry: [
    { id: "washer", name: "Washer", icon: "washing-machine", entity: "input_select.washing_maschine_state", finished: "input_datetime.washing_machine_finished_timestamp" },
    { id: "dryer", name: "Dryer", icon: "wind", entity: "input_select.dryer_state", finished: "input_datetime.dryer_finished_timestamp" },
  ],

  /* ─── Guest WiFi (static — shown in a popup) ─────────────── */
  guestWifi: {
    ssid: "Mupfumira-GUEST",
    password: "mupfumir@",
    security: "WPA", // WPA/WPA2 — used to build the scan-to-join QR
  },

  /* ─── Media · Lamp ───────────────────────────────────────── */
  media: "media_player.living_room_2",   // "Lounge TV" — LG WebOS
  lamp: "switch.kitchen_pendant",        // "Kitchen Pendant" (switch.* — toggle only)
};

/* ─── Curated binary_sensors that bubble up into the alerts feed.
   Add/remove as needed; severity is inferred by the alerts component
   from the `class` field. */
export const ALERT_SENSORS = [
  { id: "binary_sensor.mg5050_zone_out_main_gate_open", class: "critical", label: "Main gate breach" },
  { id: "binary_sensor.zone_electric_fence_open", class: "critical", label: "Electric fence" },
  { id: "binary_sensor.kitchen_gas_leak_sensor_gas", class: "critical", label: "Kitchen gas leak" },
  { id: "binary_sensor.zone_out_front_door_open", class: "warning", label: "Front door patio" },
  { id: "binary_sensor.zone_out_garage_open", class: "warning", label: "Garage front" },
  { id: "binary_sensor.downstairs_hallway_door_contact", class: "info", label: "Downstairs hallway door" },
];
