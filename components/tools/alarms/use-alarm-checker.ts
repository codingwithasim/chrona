"use client";

import { useEffect } from "react";

import { say } from "@/stores/dialogue-store";
import { useAlarmStore } from "@/stores/alarms-store";

import {
  getCurrentMinutes,
  getTodayKey,
  minutesToTime,
} from "./alarm-utils";

const SOUND_URL = "/sounds/aud_01.wav";

/** Stop ringing on its own after this long. */
const MAX_RING_MS = 60_000;

export function useAlarmChecker() {
  useEffect(() => {
    const audio = new Audio(SOUND_URL);

    audio.loop = true;
    audio.preload = "auto";

    let stopTimer: number | null = null;

    function stopRinging() {
      audio.pause();
      audio.currentTime = 0;

      if (stopTimer !== null) {
        window.clearTimeout(stopTimer);
        stopTimer = null;
      }
    }

    function checkAlarms() {
      const date = new Date();

      const currentMinutes = getCurrentMinutes(date);
      const today = getTodayKey(date);

      const store = useAlarmStore.getState();

      const dueAlarms = store.alarms.filter(
        (alarm) =>
          alarm.enabled &&
          alarm.time === currentMinutes &&
          alarm.lastTriggeredDate !== today
      );

      const triggered = dueAlarms.filter((alarm) =>
        store.triggerAlarm(alarm.id, today)
      );

      if (!triggered.length) {
        return;
      }

      const labels = triggered
        .map((alarm) => alarm.label.trim() || "Alarm")
        .join(", ");

      stopRinging();

      void audio.play().catch(() => {
        // Playback may be blocked until
        // the user interacts with the page.
      });

      stopTimer = window.setTimeout(stopRinging, MAX_RING_MS);

      say({
        text: `Riiing! ${labels} — it's ${minutesToTime(
          triggered[0].time
        )}. Time to get up~`,
        tone: "alert",
        sticky: true,
        actionLabel: "Stop alarm",
        onDismiss: stopRinging,
      });
    }

    const intervalId = window.setInterval(checkAlarms, 1000);

    return () => {
      window.clearInterval(intervalId);
      stopRinging();
      audio.src = "";
    };
  }, []);
}
