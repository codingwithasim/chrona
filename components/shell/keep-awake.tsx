"use client";

import { useEffect } from "react";

import { usePomodoroStore } from "@/stores/pomodoro-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStopwatchStore } from "@/stores/stopwatch-store";
import { useTimerStore } from "@/stores/timer-store";

type WakeLock = { release: () => Promise<void>; released: boolean };
type WakeLockApi = { request: (type: "screen") => Promise<WakeLock> };

/** Keeps the screen from sleeping while something is counting. */
export function KeepAwake() {
  const enabled = useSettingsStore((state) => state.keepAwake);
  const pomodoro = usePomodoroStore((state) => state.status === "running");
  const timer = useTimerStore((state) => state.status === "running");
  const stopwatch = useStopwatchStore((state) => state.status === "running");
  const wanted = enabled && (pomodoro || timer || stopwatch);

  useEffect(() => {
    const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;

    if (!wanted || !api) {
      return;
    }

    let lock: WakeLock | null = null;
    let done = false;

    async function acquire() {
      if (document.visibilityState !== "visible" || (lock && !lock.released)) {
        return;
      }

      try {
        const next = await api!.request("screen");

        if (done) {
          void next.release();
        } else {
          lock = next;
        }
      } catch {
        // Low battery or not allowed: the screen sleeps as usual.
      }
    }

    // The browser drops the lock when the tab is hidden; take it back.
    document.addEventListener("visibilitychange", acquire);
    void acquire();

    return () => {
      done = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
    };
  }, [wanted]);

  return null;
}
