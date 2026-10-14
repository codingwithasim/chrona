"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { notify } from "@/lib/notify";
import { playSound } from "@/lib/sounds";

import { say } from "./dialogue-store";
import { useSettingsStore } from "./settings-store";

/*
 * The pomodoro lives in a global store driven by a wall-clock end
 * time, so it keeps running while you visit other tools and even
 * survives a page reload.
 */

export type PomodoroMode = "focus" | "shortBreak" | "longBreak";
export type PomodoroStatus = "idle" | "running" | "paused";

export type PomodoroSettings = {
  /** Minutes */
  focus: number;
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
};

type PomodoroStats = {
  date: string;
  sessions: number;
  minutes: number;
};

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
};

export const pomodoroModes: Record<
  PomodoroMode,
  { label: string; jp: string; color: string }
> = {
  focus: { label: "Focus", jp: "集中", color: "var(--ember)" },
  shortBreak: { label: "Short break", jp: "小休憩", color: "var(--mint)" },
  longBreak: { label: "Long break", jp: "長休憩", color: "var(--sky)" },
};

/** Finishing more than this late (e.g. after a reload) is quiet. */
const LATE_MS = 60_000;

export function durationOf(settings: PomodoroSettings, mode: PomodoroMode) {
  return Math.max(1, Math.round(settings[mode] * 60));
}

export function nextModeAfter(
  mode: PomodoroMode,
  cycle: number,
  settings: PomodoroSettings
): PomodoroMode {
  if (mode !== "focus") {
    return "focus";
  }

  return cycle % settings.cyclesBeforeLongBreak === 0
    ? "longBreak"
    : "shortBreak";
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type AdvanceKind = "complete" | "late" | "skip";

type PomodoroStore = {
  settings: PomodoroSettings;
  mode: PomodoroMode;
  /** Number of the current (or next) focus session, starting at 1. */
  cycle: number;
  status: PomodoroStatus;
  endAt: number | null;
  /** Seconds left in the current phase. */
  remaining: number;
  stats: PomodoroStats;

  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (mode: PomodoroMode) => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  tick: (now: number) => void;
};

const FINISH_LINES: Record<PomodoroMode, string> = {
  shortBreak: "Focus session done! Take five — I'll guard the desk.",
  longBreak:
    "That's a full set! Long break time~ Go stretch, I'll keep your seat warm.",
  focus: "Break's over! Back to focus. You've got this, nya.",
};

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => {
      function advance(kind: AdvanceKind) {
        const { mode, cycle, settings, stats, status } = get();

        const next = nextModeAfter(mode, cycle, settings);
        const finishedFocus = mode === "focus";

        const today = todayKey();
        const base =
          stats.date === today
            ? stats
            : { date: today, sessions: 0, minutes: 0 };

        const counted = finishedFocus && kind !== "skip";

        const autoStart =
          kind === "skip"
            ? status === "running"
            : kind === "complete" &&
              (next === "focus"
                ? settings.autoStartFocus
                : settings.autoStartBreaks);

        const duration = durationOf(settings, next);

        set({
          mode: next,
          cycle: finishedFocus ? cycle + 1 : cycle,
          status: autoStart ? "running" : "idle",
          endAt: autoStart ? Date.now() + duration * 1000 : null,
          remaining: duration,
          stats: counted
            ? {
                date: today,
                sessions: base.sessions + 1,
                minutes: base.minutes + settings.focus,
              }
            : base,
        });

        if (kind === "complete") {
          const { sounds, toneVolume } = useSettingsStore.getState();
          playSound(sounds.pomodoro, { volume: toneVolume });
          notify(
            next === "focus" ? "Back to focus 🍅" : "Break time ☕",
            FINISH_LINES[next]
          );

          say({
            tone: "alert",
            text: autoStart
              ? FINISH_LINES[next]
              : `${FINISH_LINES[next]} Press start when you're ready.`,
          });
        }

        if (kind === "late") {
          say({
            text: `Welcome back! Your ${pomodoroModes[mode].label.toLowerCase()} ended while you were away. Ready for the next one?`,
          });
        }
      }

      return {
        settings: DEFAULT_POMODORO_SETTINGS,
        mode: "focus",
        cycle: 1,
        status: "idle",
        endAt: null,
        remaining: DEFAULT_POMODORO_SETTINGS.focus * 60,
        stats: { date: "", sessions: 0, minutes: 0 },

        start: () => {
          const { status, remaining, settings, mode } = get();

          if (status === "running") {
            return;
          }

          const seconds =
            remaining > 0 ? remaining : durationOf(settings, mode);

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
            remaining: Math.max(
              0,
              Math.ceil((endAt - Date.now()) / 1000)
            ),
          });
        },

        toggle: () => {
          if (get().status === "running") {
            get().pause();
          } else {
            get().start();
          }
        },

        reset: () => {
          const { settings } = get();

          set({
            mode: "focus",
            cycle: 1,
            status: "idle",
            endAt: null,
            remaining: durationOf(settings, "focus"),
          });
        },

        skip: () => advance("skip"),

        setMode: (mode) => {
          set({
            mode,
            status: "idle",
            endAt: null,
            remaining: durationOf(get().settings, mode),
          });
        },

        updateSettings: (partial) => {
          const settings = { ...get().settings, ...partial };

          set({ settings });

          // An untouched phase picks up the new length right away.
          if (get().status === "idle") {
            set({ remaining: durationOf(settings, get().mode) });
          }
        },

        tick: (now) => {
          const { status, endAt, remaining } = get();

          if (status !== "running" || endAt === null) {
            return;
          }

          const left = Math.max(0, Math.ceil((endAt - now) / 1000));

          if (left !== remaining) {
            set({ remaining: left });
          }

          if (left === 0) {
            advance(now - endAt > LATE_MS ? "late" : "complete");
          }
        },
      };
    },
    {
      name: "chrona-pomodoro",
      skipHydration: true,
      partialize: (state) => ({
        settings: state.settings,
        mode: state.mode,
        cycle: state.cycle,
        status: state.status,
        endAt: state.endAt,
        remaining: state.remaining,
        stats: state.stats,
      }),
    }
  )
);
