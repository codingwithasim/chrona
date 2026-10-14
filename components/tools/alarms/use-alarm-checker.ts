"use client";

import { useEffect } from "react";

import { notify } from "@/lib/notify";
import { isSoundId, playSound } from "@/lib/sounds";
import { say } from "@/stores/dialogue-store";
import { useAlarmStore } from "@/stores/alarms-store";
import { useSceneStore } from "@/stores/scene-store";
import { useSettingsStore } from "@/stores/settings-store";

import {
  getCurrentMinutes,
  getTodayKey,
  minutesToTime,
} from "./alarm-utils";

/** Stop ringing on its own after this long. */
const MAX_RING_MS = 90_000;

export function useAlarmChecker() {
  useEffect(() => {
    let stopRinging: (() => void) | null = null;

    function stop() {
      stopRinging?.();
      stopRinging = null;
    }

    function checkAlarms() {
      const date = new Date();

      const currentMinutes = getCurrentMinutes(date);
      const today = getTodayKey(date);

      const store = useAlarmStore.getState();

      const weekday = date.getDay();

      const dueAlarms = store.alarms.filter(
        (alarm) =>
          alarm.enabled &&
          alarm.time === currentMinutes &&
          alarm.lastTriggeredDate !== today &&
          (!alarm.repeat?.length || alarm.repeat.includes(weekday))
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

      const { sounds, toneVolume } = useSettingsStore.getState();
      const sound = isSoundId(triggered[0].sound)
        ? triggered[0].sound
        : sounds.alarm;

      stop();
      stopRinging = playSound(sound, {
        loop: true,
        volume: toneVolume,
        maxDuration: MAX_RING_MS,
      });

      notify("⏰ " + labels, `It's ${minutesToTime(triggered[0].time, useSceneStore.getState().hour24)}.`);

      say({
        text: `Riiing! ${labels} — it's ${minutesToTime(
          triggered[0].time,
          useSceneStore.getState().hour24
        )}. Time to get up~`,
        tone: "alert",
        sticky: true,
        actionLabel: "Stop alarm",
        onDismiss: stop,
      });
    }

    const intervalId = window.setInterval(checkAlarms, 1000);

    return () => {
      window.clearInterval(intervalId);
      stop();
    };
  }, []);
}
