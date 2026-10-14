"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SoundId } from "@/lib/sounds";

export type SoundSlot = "alarm" | "timer" | "pomodoro";

type SettingsStore = {
  sounds: Record<SoundSlot, SoundId>;
  setSound: (slot: SoundSlot, sound: SoundId) => void;

  /** Volume for alarm and notification tones, 0–1. */
  toneVolume: number;
  setToneVolume: (volume: number) => void;
};

export const soundSlots: Record<
  SoundSlot,
  { label: string; jp: string; description: string }
> = {
  alarm: {
    label: "Alarms",
    jp: "アラーム",
    description: "Default tone for new alarms. Rings until you stop it.",
  },
  timer: {
    label: "Timer",
    jp: "タイマー",
    description: "Plays when a countdown reaches zero.",
  },
  pomodoro: {
    label: "Pomodoro",
    jp: "ポモドーロ",
    description: "Plays between focus sessions and breaks.",
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      sounds: {
        alarm: "music-box",
        timer: "marimba",
        pomodoro: "wind-chime",
      },
      setSound: (slot, sound) =>
        set((state) => ({
          sounds: { ...state.sounds, [slot]: sound },
        })),

      toneVolume: 0.8,
      setToneVolume: (toneVolume) =>
        set({
          toneVolume: Math.min(1, Math.max(0, toneVolume)),
        }),
    }),
    {
      name: "chrona-settings",
      skipHydration: true,
    }
  )
);
