"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { todayKey } from "@/lib/day-key";
import { crossed, unlockTitle } from "@/lib/unlocks";

import { say } from "./dialogue-store";
import { catName } from "./room-store";

/**
 * What you're working on, and how much you've focused. Everything stays
 * in this browser.
 */

export type FocusTask = {
  id: string;
  text: string;
  done: boolean;
  pomodoros: number;
  /** How many pomodoros you expect it to take; 0 for no guess. */
  estimate?: number;
};
export type FocusDay = { date: string; minutes: number; sessions: number };
/** One finished focus session, and what you got done in it. */
export type FocusEntry = { at: number; minutes: number; task?: string; note?: string };

type FocusStore = {
  tasks: FocusTask[];
  currentId: string | null;
  days: FocusDay[];
  log: FocusEntry[];
  /** Focus minutes ever, which `days` (only the last months) can't tell. */
  totalMinutes: number;
  /** Minutes of focus to aim for each day. */
  dailyGoal: number;
  setDailyGoal: (minutes: number) => void;

  addTask: (text: string, estimate?: number) => void;
  setEstimate: (id: string, estimate: number) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setCurrent: (id: string | null) => void;
  clearDone: () => void;
  recordFocus: (minutes: number) => void;
  /** Say what you got done in the session that just ended. */
  noteLast: (note: string) => void;
};

const KEEP_DAYS = 120;
const KEEP_ENTRIES = 500;
export const MAX_ESTIMATE = 8;

export const useFocusStore = create<FocusStore>()(
  persist(
    (set) => ({
      tasks: [],
      currentId: null,
      days: [],
      log: [],
      totalMinutes: 0,
      dailyGoal: 120,
      setDailyGoal: (minutes) => set({ dailyGoal: Math.min(600, Math.max(15, Math.round(minutes / 15) * 15)) }),

      addTask: (text, estimate = 0) =>
        set((state) => {
          const task: FocusTask = {
            id: `task-${Date.now()}`,
            text: text.trim().slice(0, 80),
            done: false,
            pomodoros: 0,
            estimate,
          };

          if (!task.text) {
            return state;
          }

          return {
            tasks: [...state.tasks, task],
            // The first task you add is the one you're on.
            currentId: state.currentId ?? task.id,
          };
        }),

      toggleTask: (id) =>
        set((state) => {
          const tasks = state.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
          const finishedCurrent = state.currentId === id && tasks.find((task) => task.id === id)?.done;

          return {
            tasks,
            // Done with it? Move on to the next open task.
            currentId: finishedCurrent ? (tasks.find((task) => !task.done)?.id ?? null) : state.currentId,
          };
        }),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          currentId: state.currentId === id ? null : state.currentId,
        })),

      setEstimate: (id, estimate) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, estimate: Math.min(MAX_ESTIMATE, Math.max(0, estimate)) } : task
          ),
        })),

      setCurrent: (currentId) => set({ currentId }),

      clearDone: () => set((state) => ({ tasks: state.tasks.filter((task) => !task.done) })),

      recordFocus: (minutes) =>
        set((state) => {
          const date = todayKey();
          const existing = state.days.find((day) => day.date === date);
          const before = existing?.minutes ?? 0;

          // Crossing today's goal deserves a little cheer.
          if (before < state.dailyGoal && before + minutes >= state.dailyGoal) {
            window.setTimeout(() => {
              say({ tone: "alert", text: `You reached today's focus goal! ${catName()} is very proud of you~ 🎉` });
            }, 2500);
          }
          // The room grows: something new for crossing a milestone.
          const lifetimeBefore = lifetimeMinutes(state);
          const earned = crossed(lifetimeBefore, lifetimeBefore + minutes);

          if (earned.length > 0) {
            window.setTimeout(() => {
              const name = catName();
              const things = earned.map((unlock) => unlockTitle(unlock, name).replace(/^A /, "a ")).join(" and ");
              say({ tone: "alert", text: `Something new in the room: ${things}! Thank you for focusing~ ✨` });
            }, 6000);
          }

          const days = existing
            ? state.days.map((day) =>
                day.date === date ? { ...day, minutes: day.minutes + minutes, sessions: day.sessions + 1 } : day
              )
            : [...state.days, { date, minutes, sessions: 1 }].slice(-KEEP_DAYS);

          const current = state.tasks.find((task) => task.id === state.currentId && !task.done);

          return {
            days,
            log: [...state.log, { at: Date.now(), minutes, task: current?.text }].slice(-KEEP_ENTRIES),
            totalMinutes: lifetimeBefore + minutes,
            tasks: state.tasks.map((task) =>
              task.id === state.currentId ? { ...task, pomodoros: task.pomodoros + 1 } : task
            ),
          };
        }),

      noteLast: (note) =>
        set((state) => {
          const last = state.log[state.log.length - 1];
          const text = note.trim().slice(0, 140);

          if (!last || !text) {
            return state;
          }

          return { log: [...state.log.slice(0, -1), { ...last, note: text }] };
        }),
    }),
    {
      name: "chrona-focus",
      skipHydration: true,
    }
  )
);

/** All the focus you've ever done here, in minutes. */
export function lifetimeMinutes(state: { totalMinutes?: number; days: FocusDay[] }) {
  const kept = state.days.reduce((sum, day) => sum + day.minutes, 0);
  return Math.max(state.totalMinutes ?? 0, kept);
}

/** The last `count` days, oldest first, including empty ones. */
export function recentDays(days: FocusDay[], count = 7, now = new Date()): FocusDay[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (count - 1 - index));
    const key = todayKey(date);
    return days.find((day) => day.date === key) ?? { date: key, minutes: 0, sessions: 0 };
  });
}

/** Consecutive days with at least one focus session, ending today (or yesterday). */
export function streakOf(days: FocusDay[], now = new Date()) {
  const active = new Set(days.filter((day) => day.sessions > 0).map((day) => day.date));
  const date = new Date(now);

  // Today doesn't break the streak until it's over.
  if (!active.has(todayKey(date))) {
    date.setDate(date.getDate() - 1);
  }

  let streak = 0;

  while (active.has(todayKey(date))) {
    streak++;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}
