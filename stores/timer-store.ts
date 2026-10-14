"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { playSound } from "@/lib/sounds";

import { say } from "./dialogue-store";
import { useSettingsStore } from "./settings-store";

/*
 * The countdown timer lives in a global store driven by a wall-clock
 * end time, so it keeps running on other pages and across reloads.
 */

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export type TimerPreset = {
  id: string;
  label: string;
  duration: number;
};

const LATE_MS = 60_000;

const defaultPresets: TimerPreset[] = [
  { id: "preset-5", label: "Tea", duration: 5 * 60 },
  { id: "preset-10", label: "Stretch", duration: 10 * 60 },
  { id: "preset-25", label: "Study", duration: 25 * 60 },
  { id: "preset-45", label: "Deep work", duration: 45 * 60 },
  { id: "preset-60", label: "One hour", duration: 60 * 60 },
  { id: "preset-20", label: "Nap", duration: 20 * 60 },
];

type TimerStore = {
  duration: number;
  remaining: number;
  status: TimerStatus;
  endAt: number | null;
  /** Name of the preset in use, if any. */
  label: string | null;

  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  setDuration: (seconds: number, label?: string | null) => void;
  addTime: (seconds: number) => void;
  tick: (now: number) => void;

  presets: TimerPreset[];
  addPreset: (preset: TimerPreset) => void;
  removePreset: (id: string) => void;
  updatePreset: (preset: TimerPreset) => void;
};

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      duration: 25 * 60,
      remaining: 25 * 60,
      status: "idle",
      endAt: null,
      label: null,

      start: () => {
        const { status, remaining, duration } = get();

        if (status === "running") {
          return;
        }

        const seconds = remaining > 0 ? remaining : duration;

        if (seconds <= 0) {
          return;
        }

        set({
          status: "running",
          endAt: Date.now() + seconds * 1000,
          remaining: seconds,
        });
      },

      pause: () => {
        const { status, endAt } = get();

        if (status !== "running" || endAt === null) {
          return;
        }

        set({
          status: "paused",
          endAt: null,
          remaining: Math.max(0, Math.ceil((endAt - Date.now()) / 1000)),
        });
      },

      toggle: () => {
        if (get().status === "running") {
          get().pause();
        } else {
          get().start();
        }
      },

      reset: () =>
        set((state) => ({
          status: "idle",
          endAt: null,
          remaining: state.duration,
        })),

      setDuration: (seconds, label = null) => {
        const safe = Math.max(1, Math.round(seconds));

        set({
          duration: safe,
          remaining: safe,
          status: "idle",
          endAt: null,
          label,
        });
      },

      addTime: (seconds) =>
        set((state) => {
          const running = state.status === "running" && state.endAt !== null;

          return {
            duration: state.duration + seconds,
            remaining: state.remaining + seconds,
            endAt: running ? state.endAt! + seconds * 1000 : state.endAt,
            status: state.status === "finished" ? "idle" : state.status,
          };
        }),

      tick: (now) => {
        const { status, endAt, remaining, label } = get();

        if (status !== "running" || endAt === null) {
          return;
        }

        const left = Math.max(0, Math.ceil((endAt - now) / 1000));

        if (left !== remaining) {
          set({ remaining: left });
        }

        if (left > 0) {
          return;
        }

        set({ status: "finished", endAt: null, remaining: 0 });

        if (now - endAt > LATE_MS) {
          say({
            text: "Welcome back! Your timer finished while you were away.",
          });
          return;
        }

        const { sounds, toneVolume } = useSettingsStore.getState();
        playSound(sounds.timer, { volume: toneVolume });

        say({
          tone: "alert",
          text: label
            ? `Ding! ${label} is done~ Stretch a little and sip some tea.`
            : "Ding! Time's up~ Stretch a little and sip some tea.",
        });
      },

      presets: defaultPresets,

      addPreset: (preset) =>
        set((state) => ({
          presets: [...state.presets, preset],
        })),

      removePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),

      updatePreset: (preset) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === preset.id ? preset : p
          ),
        })),
    }),
    {
      name: "timer-store",
      skipHydration: true,
      version: 2,
      partialize: (state) => ({
        duration: state.duration,
        remaining: state.remaining,
        status: state.status,
        endAt: state.endAt,
        label: state.label,
        presets: state.presets,
      }),
      // Version 1 only stored presets.
      migrate: (persisted) => persisted as TimerStore,
    }
  )
);
