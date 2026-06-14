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
    frontDoorLock: "lock.front_door_lock",
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

  /* ─── Scenes (one-tap moods) ────────────────────────────────
     morning/night are momentary TRIGGERS — they turn_on an input_boolean
     that HA automations listen to (no persistent highlight). guest/movie/
     silent are persistent MODES — they toggle and light up while active. */
  scenes: [
    { id: "morning", name: "Good Morning", icon: "sunrise",      entity: "input_boolean.good_morning", momentary: true },
    { id: "night",   name: "Night",        icon: "moon",         entity: "input_boolean.good_night",   momentary: true },
    { id: "guest",   name: "Guest",        icon: "users",        entity: "input_boolean.guest_mode" },
    { id: "movie",   name: "Movie",        icon: "clapperboard", entity: "input_boolean.movie_scene" },
    { id: "silent",  name: "Silent",       icon: "volume-x",     entity: "input_boolean.dont_disturb" },
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
    tinotenda: {
      title: "Tinotenda Lighting",
      tiles: [
        { id: "light", name: "Light", icon: "lightbulb", entity: "switch.sonoff_10021a6997_1" },
        { id: "acplug", name: "AC Power", icon: "plug", entity: "switch.shellyplus1pm_fortune_ac" },
      ],
      ledNav: false,
    },
  },

  /* ─── Per-room climate (kitchen → geyser, others → AC) ────── */
  climate: {
    living: { ac: "climate.living_room_ac", temp: "sensor.living_room_remote_temperature" },
    tinotenda: { ac: "climate.tino_ac", temp: "sensor.tino_temp_sensor_temperature" },
  },

  /* ─── Geyser (kitchen climate slot + full Geyser view) ───── */
  geyser: {
    toggle: "switch.geyser",                              // on/off
    altToggle: "switch.geyserwise_tse_power",             // controller power
    currentTemp: "sensor.geyserwise_tse_water_temperature", // °C actual
    targetTemp: "input_number.geyser_temperature",        // °C setpoint
    power: "sensor.geyser_power",                         // W draw (heating)
  },

  /* ─── Security controls shown on the dashboard (7 tiles) ──── */
  /* `ignore: true` → tile is still shown + tappable, but its state does NOT
     count toward the "all secure" determination (the indoor alarm is meant to
     stay disarmed while we're home, so it must never block the green check). */
  securityControls: [
    { id: "outdoorAlarm", name: "Outdoor Alarm", icon: "siren", entity: "alarm_control_panel.partition_outdoor", kind: "alarm" },
    { id: "indoorAlarm", name: "Indoor Alarm", icon: "shield", entity: "alarm_control_panel.partition_indoor", kind: "alarm", ignore: true },
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

  /* ─── Robot vacuum (Dreame L20 Ultra) ────────────────────── */
  vacuum: {
    entity: "vacuum.vac_man",
    suction: "select.l20_ultra_suction_level",        // Quiet/Standard/Strong/Turbo
    cleaningMode: "select.l20_ultra_cleaning_mode",   // Sweeping/Mopping/…
    selectedMap: "select.l20_ultra_selected_map",
    fanSpeeds: ["Silent", "Standard", "Strong", "Turbo"],
    rooms: [
      { id: "living_room", name: "Living Room" },
      { id: "kitchen", name: "Kitchen" },
      { id: "dining_room", name: "Dining" },
      { id: "master_bedroom", name: "Master" },
      { id: "ednahs_room", name: "Ednah's" },
      { id: "ensuite_bathroom", name: "Ensuite" },
      { id: "guest_bedroom", name: "Guest" },
      { id: "guest_bedroom2", name: "Guest 2" },
      { id: "office", name: "Office" },
      { id: "office_passage", name: "Office Passage" },
      { id: "gym", name: "Gym" },
      { id: "library", name: "Library" },
      { id: "hallway", name: "Hallway" },
      { id: "laundry", name: "Laundry" },
      { id: "scullery", name: "Scullery" },
      { id: "kitchen_knoek", name: "Kitchen Noek" },
      { id: "tinos_bathroom", name: "Tino's Bath" },
      { id: "garage", name: "Garage" },
      { id: "server_room", name: "Server Room" },
    ],
    // vacuum entity attributes (% remaining) shown as maintenance bars
    maintenance: [
      { key: "main_brush_left", name: "Main brush" },
      { key: "side_brush_left", name: "Side brush" },
      { key: "filter_left", name: "Filter" },
      { key: "mop_pad_left", name: "Mop pad" },
    ],
  },

  /* ─── Irrigation / garden ────────────────────────────────── */
  irrigation: {
    pump: "switch.irrigation_pump",
    greyWater: "input_boolean.grey_water_on",
    runFull: "input_boolean.run_full_irrigation_cycle",
    stop: "input_boolean.stop_irrigation",
    tanksEmpty: "input_boolean.tanks_empty",
    scheduledTime: "input_datetime.irrigation_scheduled_time",
    duration: "input_number.irrigation_zone_duration",
    zones: [
      { id: "z1", name: "Zone 1 · Pool Pump", entity: "switch.test_zone_1_pool_pump", sched: "input_boolean.zone_1_scheduled" },
      { id: "z2", name: "Zone 2 · Firepit", entity: "switch.test_zone_2_firepit", sched: "input_boolean.zone_2_scheduled" },
      { id: "z3", name: "Zone 3 · Front Yard", entity: "switch.sprinkler_zone_3_front_yard", sched: "input_boolean.zone_3_scheduled" },
      { id: "z4", name: "Zone 4 · Gate", entity: "switch.test_zone_4_gate", sched: "input_boolean.zone_4_scheduled" },
    ],
    tanks: [
      { id: "black", name: "Black tank", entity: "sensor.black_tank_level" },
      { id: "brown", name: "Brown tank", entity: "sensor.brown_tank_level_liquid_level" },
      { id: "laundry", name: "Laundry tank", entity: "sensor.laundry_tank_level_liquid_level" },
    ],
  },

  /* ─── Swimming pool + entertainment area ─────────────────── */
  pool: {
    pump: "switch.pool_pump_2",
    runPump: "input_boolean.run_pool_pump",
    runtimeToday: "sensor.pool_pump_runtime_today",
    runtimeWeek: "sensor.pool_pump_runtime_this_week",
    temp: "sensor.poolsense_temperature",
    ph: "sensor.poolsense_ph",
    chlorine: "sensor.poolsense_chlorine",
    entLock: "lock.ent_area",
    schedule: [
      { d: "Mon", entity: "input_boolean.pool_run_monday" },
      { d: "Tue", entity: "input_boolean.pool_run_tuesday" },
      { d: "Wed", entity: "input_boolean.pool_run_wednesday" },
      { d: "Thu", entity: "input_boolean.pool_run_thursday" },
      { d: "Fri", entity: "input_boolean.pool_run_friday" },
      { d: "Sat", entity: "input_boolean.pool_run_saturday" },
      { d: "Sun", entity: "input_boolean.pool_run_sunday" },
    ],
    lights: [
      { id: "bollard", name: "Bollards", entity: "switch.bollard_lights" },
      { id: "braai", name: "Braai", entity: "switch.ent_area_downlighter_braai" },
      { id: "pooltable", name: "Pool Table", entity: "switch.ent_area_downlighter_pool_table" },
      { id: "firepit", name: "Firepit", entity: "switch.ent_area_pool_firepit_light" },
      { id: "wall", name: "Wall Lights", entity: "switch.ent_area_wall_lights" },
    ],
  },

  /* ─── Load-shedding (shown on the Power view) ────────────── */
  loadShedding: {
    stage: "sensor.load_shedding_stage_capetown",
    forecast: "calendar.load_shedding_forecast",
  },

  /* ─── All cameras (full Cameras view — 8 Frigate feeds) ──── */
  camerasAll: [
    { id: "doorbell", name: "Front Door", entity: "camera.doorbell_frigate" },
    { id: "frontyard", name: "Front Yard", entity: "camera.front_yard_frigate" },
    { id: "garage", name: "Garage", entity: "camera.garage_cam_frigate" },
    { id: "garagefront", name: "Garage Front", entity: "camera.garage_front_frigate" },
    { id: "gateright", name: "Gate Right", entity: "camera.gate_right_frigate" },
    { id: "gatetop", name: "Gate Top", entity: "camera.gate_top_frigate" },
    { id: "jojo", name: "JoJo Tanks", entity: "camera.jojo_tanks_frigate" },
    { id: "pool", name: "Swimming Pool", entity: "camera.swimming_pool_frigate" },
  ],

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
