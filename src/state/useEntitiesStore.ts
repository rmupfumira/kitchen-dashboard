/**
 * Entities store — mutable simulated HA state.
 *
 * In Phase 4 this whole module gets replaced by a hook tree that subscribes to
 * Home Assistant via WebSocket; the shape stays the same so widgets don't change.
 */
import { create } from "zustand";
import {
  climateByRoom as initialClimate,
  devicesByRoom as initialDevices,
  security as initialSecurity,
  type ClimateState,
  type Device,
} from "@/data/mock";

interface SecurityState {
  garage: boolean;
  gate: boolean;
  outdoorAlarm: boolean;
  indoorAlarm: boolean;
}

interface KitchenLightState {
  on: boolean;
  bri?: number;
  temp?: number;
}

interface EntitiesState {
  devices: Record<string, Device[]>;
  climate: Record<string, ClimateState>;
  security: SecurityState;
  ringing: boolean;
  /** Kitchen-only: LED strip (dimmable + tunable) + 3 on/off fixtures. */
  kLights: {
    strip: KitchenLightState;
    pendant: KitchenLightState;
    ceiling1: KitchenLightState;
    ceiling2: KitchenLightState;
  };
  kMood: string;

  toggleDevice: (roomId: string, deviceId: string) => void;
  setClimateRoom: (roomId: string, patch: Partial<ClimateState>) => void;
  setSecurity: (key: keyof SecurityState, value: boolean) => void;
  setRinging: (v: boolean) => void;
  setFixture: (id: keyof EntitiesState["kLights"], patch: Partial<KitchenLightState>) => void;
  applyMood: (id: string) => void;
}

const MOOD_PRESETS: Record<string, EntitiesState["kLights"]> = {
  cook: {
    strip: { on: true, bri: 75, temp: 70 },
    pendant: { on: true },
    ceiling1: { on: true },
    ceiling2: { on: true },
  },
  dine: {
    strip: { on: true, bri: 45, temp: 22 },
    pendant: { on: true },
    ceiling1: { on: true },
    ceiling2: { on: false },
  },
  relax: {
    strip: { on: true, bri: 60, temp: 10 },
    pendant: { on: true },
    ceiling1: { on: false },
    ceiling2: { on: false },
  },
  off: {
    strip: { on: false, bri: 40, temp: 38 },
    pendant: { on: false },
    ceiling1: { on: false },
    ceiling2: { on: false },
  },
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const useEntitiesStore = create<EntitiesState>((set) => ({
  devices: clone(initialDevices),
  climate: clone(initialClimate),
  security: { ...initialSecurity },
  ringing: true,
  kLights: {
    strip: { on: true, bri: 55, temp: 38 },
    pendant: { on: true },
    ceiling1: { on: true },
    ceiling2: { on: false },
  },
  kMood: "",

  toggleDevice: (roomId, deviceId) =>
    set((state) => {
      const next = clone(state.devices);
      const dev = next[roomId]?.find((d) => d.id === deviceId);
      if (dev) dev.on = !dev.on;
      return { devices: next };
    }),

  setClimateRoom: (roomId, patch) =>
    set((state) => ({
      climate: { ...state.climate, [roomId]: { ...state.climate[roomId], ...patch } },
    })),

  setSecurity: (key, value) =>
    set((state) => ({ security: { ...state.security, [key]: value } })),

  setRinging: (v) => set({ ringing: v }),

  setFixture: (id, patch) =>
    set((state) => ({
      kLights: { ...state.kLights, [id]: { ...state.kLights[id], ...patch } },
      kMood: "", // manual fixture change clears the active mood
    })),

  applyMood: (id) => {
    const preset = MOOD_PRESETS[id];
    if (!preset) return;
    set({ kLights: clone(preset), kMood: id });
  },
}));
