/**
 * Mock Home Assistant state — TypeScript port of the design's data.js.
 *
 * Used until Phase 4 replaces these shapes with live HA WebSocket subscriptions.
 * Keep the property names identical so downstream code doesn't change when
 * we swap the source: the HA `entityMap.ts` translates real entities into this shape.
 */

export interface Room {
  id: string;
  name: string;
  entity: string;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  type: string;
  on: boolean;
}

export interface ClimateState {
  temp: number;
  target: number;
  humidity: number;
  mode: "cool" | "heat" | "fan" | "dry" | "auto";
  swing: boolean;
  auto: boolean;
  brightness: number;
  watt: number;
}

export interface ForecastDay {
  day: string;
  icon: string;
  hi: number;
  lo: number;
}

export interface WeatherShape {
  date: string;
  cond: string;
  temp: number;
  high: number;
  low: number;
  wind: number;
  rain: number;
  uv: number;
  forecast: ForecastDay[];
}

export interface Scene {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface Camera {
  id: string;
  name: string;
  room: string;
  on: boolean;
}

export interface InverterShape {
  solar: number;
  solarToday: number;
  solarPeak: number;
  battery: number;
  batteryFlow: number;
  batteryCap: number;
  batteryTime: string;
  grid: number;
  gridToday: { import: number; export: number };
  load: number;
  loadToday: number;
  selfSufficiency: number;
  curve: number[];
  curveLabels: string[];
}

export const rooms: Room[] = [
  { id: "living", name: "Living Room", entity: "living_room" },
  { id: "bed", name: "Bed Room", entity: "bedroom" },
  { id: "kitchen", name: "Kitchen", entity: "kitchen" },
  { id: "dining", name: "Dining Room", entity: "dining_room" },
  { id: "garage", name: "Garage", entity: "garage" },
];

export const devicesByRoom: Record<string, Device[]> = {
  living: [
    { id: "ac", name: "Air Conditioner", model: "Daikin FTKM-R32", type: "ac", on: true },
    { id: "tv", name: "Television", model: "Sony Bravia 9", type: "tv", on: true },
    { id: "lamp", name: "Smart Light", model: "Philips Hue", type: "light", on: true },
    { id: "theater", name: "Home Theater", model: "Sony BDV E6-100", type: "speaker", on: false },
  ],
  bed: [
    { id: "lamp", name: "Bedside Lamp", model: "Philips Hue Go", type: "light", on: true },
    { id: "ac", name: "Air Conditioner", model: "LG DualCool", type: "ac", on: false },
    { id: "purifier", name: "Air Purifier", model: "Dyson TP07", type: "fan", on: true },
    { id: "blinds", name: "Smart Blinds", model: "IKEA Fyrtur", type: "blinds", on: false },
  ],
  kitchen: [
    { id: "lights", name: "Ceiling Lights", model: "Hue Ambiance", type: "light", on: true },
    { id: "kettle", name: "Smart Kettle", model: "Smarter iKettle", type: "plug", on: false },
    { id: "fridge", name: "Refrigerator", model: "Samsung Family Hub", type: "fridge", on: true },
    { id: "hood", name: "Range Hood", model: "Bosch Series 6", type: "fan", on: false },
  ],
  dining: [
    { id: "chandelier", name: "Chandelier", model: "Hue Filament", type: "light", on: true },
    { id: "speaker", name: "Dining Speaker", model: "Sonos Era 100", type: "speaker", on: true },
    { id: "ac", name: "Air Conditioner", model: "Mitsubishi MSZ", type: "ac", on: false },
    { id: "diffuser", name: "Aroma Diffuser", model: "Pura 4", type: "plug", on: true },
  ],
  garage: [
    { id: "door", name: "Garage Door", model: "Chamberlain B970", type: "garage", on: false },
    { id: "lights", name: "Work Lights", model: "Hue Outdoor", type: "light", on: false },
    { id: "charger", name: "EV Charger", model: "Tesla Wall Connector", type: "plug", on: true },
    { id: "freezer", name: "Chest Freezer", model: "GE Garage Ready", type: "fridge", on: true },
  ],
};

export const climateByRoom: Record<string, ClimateState> = {
  living: { temp: 24, target: 24, humidity: 65, mode: "cool", swing: true, auto: false, brightness: 62, watt: 20 },
  bed: { temp: 22, target: 21, humidity: 58, mode: "auto", swing: false, auto: true, brightness: 35, watt: 12 },
  kitchen: { temp: 25, target: 23, humidity: 51, mode: "cool", swing: true, auto: false, brightness: 88, watt: 24 },
  dining: { temp: 23, target: 23, humidity: 60, mode: "fan", swing: false, auto: true, brightness: 70, watt: 18 },
  garage: { temp: 19, target: 18, humidity: 47, mode: "heat", swing: false, auto: false, brightness: 15, watt: 9 },
};

export const weather: WeatherShape = {
  date: "8 December, 2025",
  cond: "Light Rain",
  temp: 19,
  high: 22,
  low: 14,
  wind: 12,
  rain: 80,
  uv: 2,
  forecast: [
    { day: "Today", icon: "cloud-rain", hi: 22, lo: 14 },
    { day: "Tue", icon: "cloud-sun", hi: 24, lo: 15 },
    { day: "Wed", icon: "sun", hi: 27, lo: 17 },
    { day: "Thu", icon: "cloud", hi: 23, lo: 16 },
    { day: "Fri", icon: "cloud-lightning", hi: 20, lo: 13 },
  ],
};

export interface Track {
  title: string;
  artist: string;
  dur: number;
}

export interface MusicShape {
  cover: string;
  device: string;
  queue: Track[];
}

export const music: MusicShape = {
  cover: "music-cover",
  device: "Living Room · Sonos",
  queue: [
    { title: "Midnight Drive", artist: "Lumen Fields", dur: 214 },
    { title: "Amber Light", artist: "The Hollows", dur: 187 },
    { title: "Slow Mornings", artist: "Kō & Reyna", dur: 243 },
    { title: "Paper Planes", artist: "Vesper", dur: 198 },
  ],
};

export const scenes: Scene[] = [
  { id: "morning", name: "Morning", desc: "Lights 70% · blinds up · coffee on", icon: "sunrise" },
  { id: "night", name: "Night", desc: "All off · thermostat 19° · alarm armed", icon: "moon" },
  { id: "guest", name: "Guest Mode", desc: "Warm lights · music on · indoor alarm off", icon: "users" },
  { id: "focus", name: "Focus", desc: "Cool white · AC 22° · do not disturb", icon: "target" },
  { id: "movie", name: "Movie Night", desc: "Dim 15% · TV on · theater audio", icon: "clapperboard" },
  { id: "dinner", name: "Dinner", desc: "Warm 45% · chandelier · soft jazz", icon: "utensils" },
  { id: "away", name: "Away", desc: "All off · doors locked · cameras armed", icon: "lock" },
];

export const cameras: Camera[] = [
  { id: "front", name: "Front Door", room: "Entrance", on: true },
  { id: "back", name: "Backyard", room: "Garden", on: true },
  { id: "garage", name: "Garage", room: "Garage", on: true },
  { id: "living", name: "Living Room", room: "Living Room", on: false },
];

export const inverter: InverterShape = {
  solar: 4.2,
  solarToday: 18.6,
  solarPeak: 5.9,
  battery: 82,
  batteryFlow: 1.1,
  batteryCap: 13.5,
  batteryTime: "6h 20m",
  grid: -0.8,
  gridToday: { import: 3.2, export: 9.4 },
  load: 2.3,
  loadToday: 11.8,
  selfSufficiency: 88,
  curve: [0.2, 1.4, 3.6, 5.1, 5.9, 4.8, 2.7, 0.6],
  curveLabels: ["6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p"],
};

export const security = {
  garage: false,
  gate: false,
  outdoorAlarm: true,
  indoorAlarm: false,
};

export const notifications = [
  { id: 1, icon: "battery-low", title: "Front Door Lock", body: "Battery low — 15% remaining", time: "12m" },
  { id: 2, icon: "shield-check", title: "Security armed", body: "Away mode activated all cameras", time: "1h" },
  { id: 3, icon: "droplets", title: "Humidity high", body: "Living Room reached 65%", time: "2h" },
  { id: 4, icon: "zap", title: "Energy report", body: "8% less usage than last month", time: "5h" },
];
