"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useNow } from "@/hooks/use-now";
import type { Place } from "@/lib/live-weather";
import {
  isDarkTime,
  resolveSeason,
  resolveTimeOfDay,
  SCENE_STORAGE_KEY,
  type Season,
  type SeasonSetting,
  type TimeOfDay,
  type TimeSetting,
  type Weather,
} from "@/lib/scene-time";

const WEATHER_CYCLE: Weather[] = ["clear", "drizzle", "storm", "snow"];

type SceneStore = {
  timeOfDay: TimeSetting;
  setTimeOfDay: (timeOfDay: TimeSetting) => void;

  season: SeasonSetting;
  setSeason: (season: SeasonSetting) => void;

  weather: Weather;
  /** Pick the weather yourself (this stops following the real one). */
  setWeather: (weather: Weather) => void;
  cycleWeather: () => Weather;

  /** Follow the real weather where you are (opt-in). */
  liveWeather: boolean;
  /** Rounded to ~10 km, and only kept on this device. */
  place: Place | null;
  setLiveWeather: (liveWeather: boolean, place?: Place) => void;
  applyLiveWeather: (weather: Weather) => void;

  /**
   * Ambient audio. Not persisted: browsers only
   * allow audio to start after a user gesture.
   */
  soundOn: boolean;
  setSoundOn: (soundOn: boolean) => void;

  volume: number;
  setVolume: (volume: number) => void;

  /** Birds, cicadas and crickets, depending on season and time. */
  natureOn: boolean;
  setNatureOn: (natureOn: boolean) => void;

  /** Little sounds when you poke things in the room. */
  sfxOn: boolean;
  setSfxOn: (sfxOn: boolean) => void;

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
    (set, get) => ({
      timeOfDay: "auto",
      setTimeOfDay: (timeOfDay) => set({ timeOfDay }),

      season: "auto",
      setSeason: (season) => set({ season }),

      weather: "drizzle",
      setWeather: (weather) => set({ weather, liveWeather: false }),
      cycleWeather: () => {
        const next =
          WEATHER_CYCLE[
            (WEATHER_CYCLE.indexOf(get().weather) + 1) %
              WEATHER_CYCLE.length
          ];

        set({ weather: next, liveWeather: false });
        return next;
      },

      liveWeather: false,
      place: null,
      setLiveWeather: (liveWeather, place) =>
        set((state) => ({ liveWeather, place: place ?? state.place })),
      applyLiveWeather: (weather) => set({ weather }),

      soundOn: false,
      setSoundOn: (soundOn) => set({ soundOn }),

      volume: 0.6,
      setVolume: (volume) =>
        set({
          volume: Math.min(1, Math.max(0, volume)),
        }),

      natureOn: true,
      setNatureOn: (natureOn) => set({ natureOn }),

      sfxOn: true,
      setSfxOn: (sfxOn) => set({ sfxOn }),

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
      name: SCENE_STORAGE_KEY,
      skipHydration: true,
      version: 2,
      partialize: (state) => ({
        timeOfDay: state.timeOfDay,
        season: state.season,
        weather: state.weather,
        liveWeather: state.liveWeather,
        place: state.place,
        volume: state.volume,
        natureOn: state.natureOn,
        sfxOn: state.sfxOn,
        lampOn: state.lampOn,
        hour24: state.hour24,
      }),
      // Version 1 stored rain as "off" | "light" | "heavy".
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        const legacy: Record<string, Weather> = {
          off: "clear",
          light: "drizzle",
          heavy: "storm",
        };

        if (typeof state.rain === "string" && !state.weather) {
          state.weather = legacy[state.rain] ?? "drizzle";
        }

        delete state.rain;
        return state as unknown as SceneStore;
      },
    }
  )
);

/* ------------------------------------------------------------------ */

function subscribeHydration(callback: () => void) {
  return useSceneStore.persist.onFinishHydration(callback);
}

/** True once the saved scene settings have been restored. */
export function useSceneHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    () => useSceneStore.persist.hasHydrated(),
    () => false
  );
}

export type ResolvedScene = {
  time: TimeOfDay;
  season: Season;
  weather: Weather;
  dark: boolean;
};

/**
 * The scene as it should look right now, resolving "auto"
 * settings against the clock and calendar.
 */
export function useResolvedScene(): ResolvedScene {
  const now = useNow();
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const season = useSceneStore((state) => state.season);
  const weather = useSceneStore((state) => state.weather);

  // During server rendering there is no clock yet; the boot script
  // has already painted the right scene by the time this matters.
  const date = now ?? new Date(2026, 0, 1, 22);

  const time = resolveTimeOfDay(timeOfDay, date);

  return {
    time,
    season: resolveSeason(season, date),
    weather,
    dark: isDarkTime(time),
  };
}
