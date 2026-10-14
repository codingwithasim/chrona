"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RainLevel = "off" | "light" | "heavy";

const RAIN_LEVELS: RainLevel[] = ["off", "light", "heavy"];

type SceneStore = {
  rain: RainLevel;
  setRain: (rain: RainLevel) => void;
  cycleRain: () => void;

  /**
   * Ambient rain audio. Not persisted: browsers only
   * allow audio to start after a user gesture.
   */
  soundOn: boolean;
  setSoundOn: (soundOn: boolean) => void;

  volume: number;
  setVolume: (volume: number) => void;

  lampOn: boolean;
  toggleLamp: () => void;

  hour24: boolean;
  toggleHour24: () => void;

  /** Hides the interface so only the room is visible. */
  gaze: boolean;
  setGaze: (gaze: boolean) => void;
};

export const useSceneStore = create<SceneStore>()(
  persist(
    (set) => ({
      rain: "light",
      setRain: (rain) => set({ rain }),
      cycleRain: () =>
        set((state) => ({
          rain: RAIN_LEVELS[
            (RAIN_LEVELS.indexOf(state.rain) + 1) %
              RAIN_LEVELS.length
          ],
        })),

      soundOn: false,
      setSoundOn: (soundOn) => set({ soundOn }),

      volume: 0.6,
      setVolume: (volume) =>
        set({
          volume: Math.min(1, Math.max(0, volume)),
        }),

      lampOn: true,
      toggleLamp: () =>
        set((state) => ({ lampOn: !state.lampOn })),

      hour24: false,
      toggleHour24: () =>
        set((state) => ({ hour24: !state.hour24 })),

      gaze: false,
      setGaze: (gaze) => set({ gaze }),
    }),
    {
      name: "chrona-scene",
      skipHydration: true,
      partialize: (state) => ({
        rain: state.rain,
        volume: state.volume,
        lampOn: state.lampOn,
        hour24: state.hour24,
      }),
    }
  )
);

export const rainLabels: Record<
  RainLevel,
  { label: string; jp: string }
> = {
  off: { label: "Clear", jp: "くもり" },
  light: { label: "Drizzle", jp: "こさめ" },
  heavy: { label: "Storm", jp: "おおあめ" },
};
