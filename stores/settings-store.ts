"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SoundId } from "@/lib/sounds";

export type SoundSlot = "alarm" | "timer" | "pomodoro";

/** How the timer, pomodoro and stopwatch sit over the room. */
export type PanelStyle = "float" | "card" | "memo" | "bar" | "corner";

export const panelStyles: Array<{ id: PanelStyle; label: string; description: string }> = [
  { id: "float", label: "Floating", description: "Just the time over the room, no card." },
  { id: "card", label: "Card", description: "A soft frosted glass card." },
  { id: "memo", label: "Paper memo", description: "A cream note taped to the room." },
  { id: "bar", label: "Bottom bar", description: "A slim player bar along the bottom." },
  { id: "corner", label: "Corner", description: "A small widget in the corner." },
];

type SettingsStore = {
  sounds: Record<SoundSlot, SoundId>;
  setSound: (slot: SoundSlot, sound: SoundId) => void;

  /** Volume for alarm and notification tones, 0–1. */
  toneVolume: number;
  setToneVolume: (volume: number) => void;

  /** Desktop notifications when something finishes in the background. */
  notify: boolean;
  setNotify: (notify: boolean) => void;

  panelStyle: PanelStyle;
  setPanelStyle: (style: PanelStyle) => void;

  /** Fade the panel to just the time while counting and idle. */
  focusFade: boolean;
  setFocusFade: (focusFade: boolean) => void;

  /** Keep the screen from sleeping while something is counting. */
  keepAwake: boolean;
  setKeepAwake: (keepAwake: boolean) => void;
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

      notify: false,
      setNotify: (notify) => set({ notify }),

      panelStyle: "float",
      setPanelStyle: (panelStyle) => set({ panelStyle }),

      focusFade: false,
      setFocusFade: (focusFade) => set({ focusFade }),

      keepAwake: true,
      setKeepAwake: (keepAwake) => set({ keepAwake }),
    }),
    {
      name: "chrona-settings",
      skipHydration: true,
    }
  )
);
