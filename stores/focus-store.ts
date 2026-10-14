"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { todayKey } from "@/lib/day-key";

import { say } from "./dialogue-store";

/**
 * What you're working on, and how much you've focused. Everything stays
 * in this browser.
 */

export type FocusTask = { id: string; text: string; done: boolean; pomodoros: number };
export type FocusDay = { date: string; minutes: number; sessions: number };

type FocusStore = {
  tasks: FocusTask[];
  currentId: string | null;
  days: FocusDay[];
  /** Minutes of focus to aim for each day. */
  dailyGoal: number;
  setDailyGoal: (minutes: number) => void;

  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setCurrent: (id: string | null) => void;
  clearDone: () => void;
  recordFocus: (minutes: number) => void;
};

const KEEP_DAYS = 120;

export const useFocusStore = create<FocusStore>()(
  persist(
    (set) => ({
      tasks: [],
      currentId: null,
      days: [],
      dailyGoal: 120,
      setDailyGoal: (minutes) => set({ dailyGoal: Math.min(600, Math.max(15, Math.round(minutes / 15) * 15)) }),

      addTask: (text) =>
        set((state) => {
          const task: FocusTask = {
            id: `task-${Date.now()}`,
            text: text.trim().slice(0, 80),
            done: false,
            pomodoros: 0,
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
              say({ tone: "alert", text: "You reached today's focus goal! Mochi is very proud of you~ 🎉" });
            }, 2500);
          }
          const days = existing
            ? state.days.map((day) =>
                day.date === date ? { ...day, minutes: day.minutes + minutes, sessions: day.sessions + 1 } : day
              )
            : [...state.days, { date, minutes, sessions: 1 }].slice(-KEEP_DAYS);

          return {
            days,
            tasks: state.tasks.map((task) =>
              task.id === state.currentId ? { ...task, pomodoros: task.pomodoros + 1 } : task
            ),
          };
        }),
    }),
    {
      name: "chrona-focus",
      skipHydration: true,
    }
  )
);

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
