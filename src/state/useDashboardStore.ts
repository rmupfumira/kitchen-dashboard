/**
 * Dashboard client state — which view is active, which room is selected,
 * search query, notification panel open, scene activation toast.
 *
 * This is purely UI state; entity values come from HA (Phase 4) or mock (Phase 2).
 */
import { create } from "zustand";

export type ViewId = "dashboard" | "cameras" | "scenes" | "energy";

interface ToastShape {
  icon: string;
  msg: string;
}

interface DashboardState {
  view: ViewId;
  room: string;
  query: string;
  notifOpen: boolean;
  activeScene: string | null;
  toast: ToastShape | null;
  setView: (v: ViewId) => void;
  setRoom: (r: string) => void;
  setQuery: (q: string) => void;
  toggleNotif: () => void;
  setActiveScene: (s: string | null) => void;
  fireToast: (icon: string, msg: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useDashboardStore = create<DashboardState>((set) => ({
  view: "dashboard",
  room: "living",
  query: "",
  notifOpen: false,
  activeScene: null,
  toast: null,
  setView: (view) => set({ view }),
  setRoom: (room) => set({ room }),
  setQuery: (query) => set({ query }),
  toggleNotif: () => set((s) => ({ notifOpen: !s.notifOpen })),
  setActiveScene: (activeScene) => set({ activeScene }),
  fireToast: (icon, msg) => {
    set({ toast: { icon, msg } });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
}));
