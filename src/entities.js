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
    allowScene: "input_boolean.allow_visitor_in", // "Allow in" → fires the arrive-home scene
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
    // Individual device power draw (W) — shown on the Power view, sorted live
    // by current consumption. Offline plugs render as "—" and sort to the end.
    devices: [
      { name: "Pool Pump", entity: "sensor.pool_pump" },
      { name: "Geyser", entity: "sensor.geyser_power" },
      { name: "Dryer", entity: "sensor.dryer_power" },
      { name: "Washing Machine", entity: "sensor.washing_machine_power" },
      { name: "Living Room AC", entity: "sensor.livingroom_ac_power" },
      { name: "Master Bed AC", entity: "sensor.master_bed_ac_switch_0_power" },
      { name: "Office AC", entity: "sensor.office_ac_power_2" },
      { name: "Craig AC", entity: "sensor.craigacpower" },
      { name: "Mini PC", entity: "sensor.mini_pc_switch_0_power" },
      { name: "Hallway Light", entity: "sensor.hallway_smartplug_light_power" },
      { name: "Scullery Lights", entity: "sensor.scullery_undercabinet_light_plug_power" },
      { name: "Irrigation Pump", entity: "sensor.irrigation_pump_power" },
      { name: "Laundry Iron", entity: "sensor.laundry_iron_power" },
      { name: "Faith's Lamp", entity: "sensor.faith_lamp_power" },
      { name: "Russel's Lamp", entity: "sensor.russel_lamp_power" },
      { name: "Knoek Lamp", entity: "sensor.knoek_lamp_smart_plug_power" },
    ],
  },

  /* ─── Scenes (one-tap moods) ────────────────────────────────
     morning/night are momentary TRIGGERS — they turn_on an input_boolean
     that HA automations listen to (no persistent highlight). guest/movie/
     silent are persistent MODES — they toggle and light up while active. */
  scenes: [
    { id: "morning", name: "Good Morning", icon: "sunrise",      entity: "input_boolean.good_morning", momentary: true, tone: "amber" },
    { id: "night",   name: "Good Night",   icon: "moon",         entity: "input_boolean.good_night",   momentary: true, tone: "indigo" },
    { id: "guest",   name: "Guest",        icon: "users",        entity: "input_boolean.guest_mode",   tone: "teal" },
    { id: "movie",   name: "Movie",        icon: "clapperboard", entity: "input_boolean.movie_scene",  tone: "magenta" },
    { id: "silent",  name: "Silent",       icon: "volume-x",     entity: "input_boolean.dont_disturb", tone: "slate" },
  ],

  /* ─── Guest mode (suspends security automations — must be loud) ── */
  guestMode: "input_boolean.guest_mode",

  /* ─── Front-entry HA scripts (disarm outdoor alarm first) — triggered by the
     prominent buttons on the Security card. */
  entryScript: "automation.button_action_unlock_front_and_screen_door", // working automation: unlock front + screen door
  gateScript: "automation.open_gate",       // working automation: disarm → open the gate

  /* ─── Weather ────────────────────────────────────────────── */
  weather: "weather.pirateweather",

  /* ─── Cameras (kitchen doorbell card — switchable feed) ──── */
  cameras: [
    { id: "doorbell", name: "Front Door", icon: "door-open", entity: "camera.doorbell_frigate" },
    { id: "pool", name: "Pool", icon: "waves", entity: "camera.swimming_pool_frigate" },
    { id: "garage", name: "Garage", icon: "warehouse", entity: "camera.garage_cam_frigate" },
  ],

  /* ─── Music Assistant (kitchen Now-Playing card) ─────────────
     These are Music Assistant players (config entry 01KTS5…, platform
     music_assistant) — verified vs HA 2026-06-18. Default = the scullery
     speaker (kitchen zone); the card's device picker switches the controlled
     player. NB: many same-named media_players exist from cast/apple_tv — only
     the IDs below are the MA ones, so transport/queue actually work. */
  music: {
    default: "media_player.scullery_speaker",
    players: [
      { id: "scullery", name: "Kitchen · Scullery", entity: "media_player.scullery_speaker" },
      { id: "all",      name: "All Speakers",        entity: "media_player.all_speakers_3" },
      { id: "office",   name: "Office",              entity: "media_player.office_speaker" },
      { id: "main_bed", name: "Main Bedroom",        entity: "media_player.main_bedroom_speaker" },
      { id: "master",   name: "Master Bedroom",      entity: "media_player.master_bedroom_2_2" },
    ],
  },

  /* ─── Kitchen lighting ───────────────────────────────────── */
  /* WLED cabinet/island/peninsula strips. `ledGroup` is the HA light group
     (light.turn_on fans out to all members server-side). Effects + colour +
     brightness go through the group; palette / speed / intensity are per-WLED
     `select`/`number` entities, so the LED view fans those out to every strip.
     Entity IDs are messy (the bottom-right WLED uses an `alarm_light_*` base)
     — verified against HA on 2026-06-18. Speed/intensity are 0–255. */
  kitchen: {
    ledGroup: "light.kitchen_cabinets_strip_grp",
    strips: [
      { id: "win_bottom",   name: "Bottom Window", light: "light.kitchen_bottom_cabinet_window",  palette: "select.wled_gledopto_color_palette",   speed: "number.wled_gledopto_speed",   intensity: "number.wled_gledopto_intensity" },
      { id: "win_top",      name: "Top Window",    light: "light.wled_gledopto_2",                 palette: "select.wled_gledopto_color_palette_2", speed: "number.wled_gledopto_speed_2", intensity: "number.wled_gledopto_intensity_2" },
      { id: "top_right",    name: "Top Right",     light: "light.wled_gledopto_3",                 palette: "select.wled_gledopto_color_palette_3", speed: "number.wled_gledopto_speed_3", intensity: "number.wled_gledopto_intensity_3" },
      { id: "island",       name: "Island",        light: "light.wled_kitchen_island",             palette: "select.wled_gledopto_color_palette_4", speed: "number.wled_gledopto_speed_4", intensity: "number.wled_gledopto_intensity_4" },
      { id: "peninsula",    name: "Peninsula",     light: "light.wled_kitchen_peninsula_strip",    palette: "select.wled_gledopto_color_palette_5", speed: "number.wled_gledopto_speed_5", intensity: "number.wled_gledopto_intensity_5" },
      { id: "bottom_right", name: "Bottom Right",  light: "light.kitchen_bottom_right_strip",       palette: "select.alarm_light_color_palette_2",   speed: "number.alarm_light_speed_2",   intensity: "number.alarm_light_intensity_2" },
    ],
    switches: [
      { id: "pendant", name: "Pendant", icon: "lamp-ceiling", entity: "switch.kitchen_pendant" },
      { id: "down", name: "Downlighters", icon: "lightbulb", entity: "switch.kitchen_downlighter" },
      { id: "peninsula", name: "Peninsula", icon: "lightbulb", entity: "switch.kitchen_peninsula_downlighter" },
    ],

    /* ── Crestron/Savant-style Ambience panel (kitchen tab) ─────────
       Ambience presets apply a mood to the WLED cabinet group; the light
       row mixes on/off switches with the dimmable WLED group. Scenes use
       the existing global ENTITIES.scenes. */
    ambienceTarget: "light.kitchen_cabinets_strip_grp",
    ambience: [
      { id: "shimmer", name: "Shimmering Light", effect: "Aurora",       rgb: [255, 198, 120], bri: 80 },
      { id: "warm",    name: "Warm Glow",        effect: "Solid",        rgb: [255, 156, 72],  bri: 70 },
      { id: "cool",    name: "Cool White",       effect: "Solid",        rgb: [220, 234, 255], bri: 85 },
      { id: "candle",  name: "Candlelight",      effect: "Candle Multi", rgb: [255, 140, 50],  bri: 45 },
      { id: "party",   name: "Party",            effect: "Pride 2015",                          bri: 100 },
      { id: "off",     name: "Off",              off: true },
    ],
    lights: [
      { id: "pendants",  name: "Pendants",     icon: "lamp-ceiling", entity: "switch.kitchen_pendant" },
      { id: "ambient",   name: "Ambient",      icon: "lightbulb",    entity: "switch.kitchen_downlighter" },
      { id: "peninsula", name: "Peninsula",    icon: "lamp",         entity: "switch.kitchen_peninsula_downlighter" },
      { id: "cabinets",  name: "Undercabinet", icon: "sparkles",     entity: "light.kitchen_cabinets_strip_grp", dimmable: true },
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
    living: { ac: "climate.living_room_ac", temp: "sensor.apollo_msr_living_room_temp_bookshelf" },
    tinotenda: { ac: "climate.tino_ac", temp: "sensor.tino_temp_sensor_temperature" },
  },

  /* ─── Geyser (kitchen climate slot + full Geyser view) ───── */
  geyser: {
    toggle: "switch.geyser",                              // DB / mains isolator switch
    controller: "switch.geyserwise_tse_power",            // GeyserWise controller power
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
    { id: "gate", name: "Gate", icon: "fence", entity: "cover.centurion_gate_gate", statusEntity: "sensor.centurion_gate_status", kind: "gate" },
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

  /* ─── Tinotenda's room (dedicated view: big live camera + controls) ── */
  tinotenda: {
    camera: "camera.tino_rtsp",
    ac: "climate.tino_ac",
    acPower: "switch.shellyplus1pm_fortune_ac",     // AC plug
    light: "switch.sonoff_10021a6997_1",
    temp: "sensor.tino_temp_sensor_temperature",
    humidity: "sensor.tino_temp_sensor_humidity",
    autoTemp: "input_boolean.tino_auto_temp_control",
    minTemp: "input_number.tino_min_temp",
    maxTemp: "input_number.tino_max_temp",
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

  /* ─── Wake-on-motion refresh ─────────────────────────────────
     Each panel watches its room's occupancy sensor; when someone walks up
     (off→on) the dashboard refreshes so it's never showing stale data.
     `_default` is used on the system views (which aren't tied to one room). */
  wake: {
    _default: "binary_sensor.apollo_bookshelf_zone2_occupancy", // lounge radar
    kitchen: "binary_sensor.kitchen_occupancy_group",
    living: "binary_sensor.apollo_bookshelf_zone2_occupancy",
    tinotenda: null,
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
