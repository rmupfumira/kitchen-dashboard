/**
 * Tweaks store — accent / dark / card style / density.
 * Persists to localStorage so the wall panel keeps its look across reboots.
 *
 * The store also installs a tiny effect that writes the current values to
 * CSS custom properties on <:root>, so card components can stay theme-agnostic.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect } from "react";

export type AccentName = "amber" | "coral" | "teal" | "violet";
export type CardStyle = "glass" | "flat" | "solid";
export type Density = "compact" | "regular" | "comfy";

interface TweaksState {
  accent: AccentName;
  dark: boolean;
  cardStyle: CardStyle;
  density: Density;
  setTweak: <K extends keyof TweaksState>(key: K, value: TweaksState[K]) => void;
}

export const useTweaks = create<TweaksState>()(
  persist(
    (set) => ({
      accent: "amber",
      dark: false,
      cardStyle: "glass",
      density: "regular",
      setTweak: (key, value) => set({ [key]: value } as Partial<TweaksState>),
    }),
    { name: "dashboard.tweaks" }
  )
);

/* OKLCH ramps per accent — exact match to design app.jsx ACCENTS. */
const ACCENTS: Record<AccentName, { base: string; deep: string; soft: string; glow: string }> = {
  amber: {
    base: "oklch(0.78 0.135 74)",
    deep: "oklch(0.70 0.150 62)",
    soft: "oklch(0.86 0.090 82)",
    glow: "oklch(0.82 0.130 80)",
  },
  coral: {
    base: "oklch(0.72 0.150 32)",
    deep: "oklch(0.64 0.160 28)",
    soft: "oklch(0.85 0.080 40)",
    glow: "oklch(0.78 0.130 38)",
  },
  teal: {
    base: "oklch(0.72 0.120 200)",
    deep: "oklch(0.62 0.110 210)",
    soft: "oklch(0.86 0.070 195)",
    glow: "oklch(0.80 0.110 195)",
  },
  violet: {
    base: "oklch(0.66 0.150 300)",
    deep: "oklch(0.56 0.160 300)",
    soft: "oklch(0.85 0.080 300)",
    glow: "oklch(0.74 0.130 300)",
  },
};

const DENSITY_VALUE: Record<Density, number> = { compact: 0.78, regular: 1, comfy: 1.16 };
const CARD_ALPHA: Record<CardStyle, number> = { glass: 0.62, flat: 0.88, solid: 0.96 };

/**
 * Mounts a side-effect hook that mirrors store values to CSS variables on <html>.
 * Call once near the root.
 */
export function useApplyTweaks() {
  const { accent, dark, cardStyle, density } = useTweaks();
  useEffect(() => {
    const a = ACCENTS[accent];
    const root = document.documentElement;
    root.style.setProperty("--amber", a.base);
    root.style.setProperty("--amber-deep", a.deep);
    root.style.setProperty("--amber-soft", a.soft);
    root.style.setProperty("--amber-glow", a.glow);
    root.style.setProperty("--density", String(DENSITY_VALUE[density]));
    root.style.setProperty("--card-alpha", String(CARD_ALPHA[cardStyle]));
    document.body.classList.toggle("theme-dark", dark);
  }, [accent, dark, cardStyle, density]);
}
