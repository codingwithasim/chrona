"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { changeRadioMood, setRadioVolume, startRadio, stopRadio } from "@/lib/lofi-radio";

import { useMusicStore } from "./music-store";

/** The generated lo-fi station: on or off, and how loud. */
type RadioStore = {
  on: boolean;
  volume: number;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  changeMood: () => void;
};

export const useRadioStore = create<RadioStore>()(
  persist(
    (set, get) => ({
      on: false,
      volume: 0.55,

      start: () => {
        // One thing playing at a time.
        useMusicStore.getState().pause();
        startRadio(get().volume);
        set({ on: true });
      },

      stop: () => {
        stopRadio();
        set({ on: false });
      },

      toggle: () => (get().on ? get().stop() : get().start()),

      setVolume: (volume) => {
        const clamped = Math.min(1, Math.max(0, volume));
        setRadioVolume(clamped);
        set({ volume: clamped });
      },

      changeMood: () => changeRadioMood(),
    }),
    {
      name: "chrona-radio",
      skipHydration: true,
      // Audio can't start without a click, so only the volume is kept.
      partialize: (state) => ({ volume: state.volume }),
    }
  )
);
