/**
 * Music store — playback state for the MusicCard.
 * Index / progress / volume / shuffle / repeat.
 *
 * Auto-advance is handled by useMusicTick (mounted once at the App level).
 */
import { create } from "zustand";
import { music as musicData } from "@/data/mock";

interface MusicState {
  idx: number;
  playing: boolean;
  progress: number;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
  next: () => void;
  prev: () => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (v: number) => void;
  setProgress: (p: number) => void;
  /** Advance one second; called by the tick hook. */
  tick: () => void;
}

export const useMusicStore = create<MusicState>((set) => ({
  idx: 0,
  playing: true,
  progress: 48,
  volume: 60,
  shuffle: false,
  repeat: false,

  next: () =>
    set((s) => ({
      idx: (s.idx + 1) % musicData.queue.length,
      progress: 0,
    })),
  prev: () =>
    set((s) => ({
      idx: (s.idx - 1 + musicData.queue.length) % musicData.queue.length,
      progress: 0,
    })),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  toggleRepeat: () => set((s) => ({ repeat: !s.repeat })),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),

  tick: () =>
    set((s) => {
      if (!s.playing) return s;
      const track = musicData.queue[s.idx];
      if (s.progress + 1 >= track.dur) {
        return {
          ...s,
          idx: s.repeat ? s.idx : (s.idx + 1) % musicData.queue.length,
          progress: 0,
        };
      }
      return { ...s, progress: s.progress + 1 };
    }),
}));
