"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/*
 * The stopwatch stores when it started rather than ticking,
 * so it keeps counting on other pages and across reloads.
 */

export type StopwatchStatus = "idle" | "running" | "paused";

export type Lap = {
  id: number;
  split: number;
  total: number;
};

type StopwatchStore = {
  status: StopwatchStatus;
  startedAt: number | null;
  /** Milliseconds counted before the current run. */
  accumulated: number;
  laps: Lap[];
  lastLapAt: number;

  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  lap: () => void;
  clearLaps: () => void;
};

export function elapsedAt(
  state: Pick<StopwatchStore, "status" | "startedAt" | "accumulated">,
  now: number
) {
  return state.status === "running" && state.startedAt !== null
    ? state.accumulated + Math.max(0, now - state.startedAt)
    : state.accumulated;
}

export const useStopwatchStore = create<StopwatchStore>()(
  persist(
    (set, get) => ({
      status: "idle",
      startedAt: null,
      accumulated: 0,
      laps: [],
      lastLapAt: 0,

      start: () => {
        if (get().status === "running") {
          return;
        }

        set({ status: "running", startedAt: Date.now() });
      },

      pause: () => {
        const state = get();

        if (state.status !== "running") {
          return;
        }

        set({
          status: "paused",
          accumulated: elapsedAt(state, Date.now()),
          startedAt: null,
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
        set({
          status: "idle",
          startedAt: null,
          accumulated: 0,
          laps: [],
          lastLapAt: 0,
        }),

      lap: () => {
        const state = get();

        if (state.status !== "running") {
          return;
        }

        const total = elapsedAt(state, Date.now());
        const nextId = (state.laps[0]?.id ?? 0) + 1;

        set({
          laps: [
            { id: nextId, split: total - state.lastLapAt, total },
            ...state.laps,
          ],
          lastLapAt: total,
        });
      },

      clearLaps: () =>
        set((state) => ({
          laps: [],
          lastLapAt: elapsedAt(state, Date.now()),
        })),
    }),
    {
      name: "chrona-stopwatch",
      skipHydration: true,
      partialize: (state) => ({
        status: state.status,
        startedAt: state.startedAt,
        accumulated: state.accumulated,
        laps: state.laps,
        lastLapAt: state.lastLapAt,
      }),
    }
  )
);

/* ------------------------------------------------------------------ */
/* A shared animation-frame clock for smooth stopwatch digits          */
/* ------------------------------------------------------------------ */

let frameNow = 0;
let frame = 0;
const listeners = new Set<() => void>();

function loop() {
  frameNow = Date.now();
  listeners.forEach((listener) => listener());
  frame = requestAnimationFrame(loop);
}

function subscribeFrames(listener: () => void) {
  listeners.add(listener);

  if (listeners.size === 1) {
    frameNow = Date.now();
    frame = requestAnimationFrame(loop);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      cancelAnimationFrame(frame);
    }
  };
}

function subscribeNever() {
  return () => {};
}

const getFrameNow = () => frameNow;
const getServerNow = () => 0;

/** Live elapsed milliseconds, updated every animation frame. */
export function useStopwatchElapsed() {
  const status = useStopwatchStore((state) => state.status);
  const startedAt = useStopwatchStore((state) => state.startedAt);
  const accumulated = useStopwatchStore((state) => state.accumulated);

  const now = useSyncExternalStore(
    status === "running" ? subscribeFrames : subscribeNever,
    getFrameNow,
    getServerNow
  );

  return elapsedAt({ status, startedAt, accumulated }, now);
}
