"use client";

import { useEffect } from "react";

import { formatClock } from "@/components/shell/digits";
import { pomodoroModes, usePomodoroStore } from "@/stores/pomodoro-store";
import { useTimerStore } from "@/stores/timer-store";

/**
 * Drives the timer and pomodoro from the root layout, so they finish
 * (and ring) on any page. Also mirrors the countdown in the tab title.
 */
export function ToolTicker() {
  useEffect(() => {
    let baseTitle: string | null = null;
    let lastAutoTitle: string | null = null;

    function tick() {
      const now = Date.now();

      usePomodoroStore.getState().tick(now);
      useTimerStore.getState().tick(now);

      const pomodoro = usePomodoroStore.getState();
      const timer = useTimerStore.getState();

      let countdown: string | null = null;

      if (pomodoro.status === "running") {
        countdown = `${formatClock(pomodoro.remaining)} · ${pomodoroModes[pomodoro.mode].label}`;
      } else if (timer.status === "running") {
        countdown = `${formatClock(timer.remaining)} · Timer`;
      }

      if (countdown) {
        const title = `${countdown} — Chrona`;

        // Remember the page title Next.js set, to restore it later.
        if (document.title !== lastAutoTitle) {
          baseTitle = document.title;
        }

        if (document.title !== title) {
          document.title = title;
        }

        lastAutoTitle = title;
      } else if (lastAutoTitle !== null) {
        if (document.title === lastAutoTitle && baseTitle) {
          document.title = baseTitle;
        }

        lastAutoTitle = null;
      }
    }

    const id = window.setInterval(tick, 250);

    return () => window.clearInterval(id);
  }, []);

  return null;
}
