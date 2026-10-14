"use client";

import { useEffect } from "react";

import { useAlarmStore } from "@/stores/alarms-store";
import { useSceneStore } from "@/stores/scene-store";
import { useTimerStore } from "@/stores/timer-store";
import { useWorldClockStore } from "@/stores/world-clock-store";

import {
  startRainSound,
  stopRainSound,
  updateRainSound,
} from "./rain-sound";

/**
 * Side effects for the room: restores saved settings,
 * drives the rain audio and toggles gaze mode.
 */
export function SceneController() {
  const rain = useSceneStore((state) => state.rain);
  const soundOn = useSceneStore((state) => state.soundOn);
  const volume = useSceneStore((state) => state.volume);
  const gaze = useSceneStore((state) => state.gaze);
  const setGaze = useSceneStore((state) => state.setGaze);

  // Persisted stores skip automatic hydration so the first
  // client render matches the server. Restore them here.
  useEffect(() => {
    void useSceneStore.persist.rehydrate();
    void useTimerStore.persist.rehydrate();
    void useAlarmStore.persist.rehydrate();
    void useWorldClockStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (soundOn) {
      void startRainSound(rain, volume);
    } else {
      stopRainSound();
    }
  }, [soundOn, rain, volume]);

  useEffect(() => {
    updateRainSound(rain, volume);
  }, [rain, volume]);

  useEffect(() => {
    document.documentElement.dataset.gaze = String(gaze);

    if (!gaze) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setGaze(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [gaze, setGaze]);

  return null;
}
