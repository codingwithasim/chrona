"use client";

import { useEffect } from "react";

import { useAlarmStore } from "@/stores/alarms-store";
import { usePomodoroStore } from "@/stores/pomodoro-store";
import {
  useResolvedScene,
  useSceneHydrated,
  useSceneStore,
} from "@/stores/scene-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useStopwatchStore } from "@/stores/stopwatch-store";
import { useTimerStore } from "@/stores/timer-store";
import { useWorldClockStore } from "@/stores/world-clock-store";

import { startAmbience, stopAmbience } from "./ambience-sound";

/**
 * Side effects for the room: restores saved settings, keeps <html>
 * in sync with the time of day / season / weather, drives the
 * ambient soundscape and toggles gaze mode.
 */
export function SceneController() {
  const hydrated = useSceneHydrated();
  const { time, season, weather, dark } = useResolvedScene();

  const soundOn = useSceneStore((state) => state.soundOn);
  const volume = useSceneStore((state) => state.volume);
  const natureOn = useSceneStore((state) => state.natureOn);
  const gaze = useSceneStore((state) => state.gaze);
  const setGaze = useSceneStore((state) => state.setGaze);

  // Persisted stores skip automatic hydration so the first
  // client render matches the server. Restore them here.
  useEffect(() => {
    void useSceneStore.persist.rehydrate();
    void useSettingsStore.persist.rehydrate();
    void useTimerStore.persist.rehydrate();
    void usePomodoroStore.persist.rehydrate();
    void useStopwatchStore.persist.rehydrate();
    void useAlarmStore.persist.rehydrate();
    void useWorldClockStore.persist.rehydrate();
  }, []);

  // The boot script painted the first frame; take over once the
  // saved settings are back, so we never flash the defaults.
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const root = document.documentElement;

    root.dataset.tod = time;
    root.dataset.season = season;
    root.dataset.weather = weather;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  }, [hydrated, time, season, weather, dark]);

  useEffect(() => {
    if (soundOn) {
      void startAmbience({ weather, season, time, volume, nature: natureOn });
    } else {
      stopAmbience();
    }
  }, [soundOn, weather, season, time, volume, natureOn]);

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
