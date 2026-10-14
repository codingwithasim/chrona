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

import { useShortcuts } from "@/hooks/use-shortcuts";
import { toggleFullscreen } from "@/lib/fullscreen";
import { useFocusStore } from "@/stores/focus-store";
import { useMixerStore } from "@/stores/mixer-store";
import { useNotesStore } from "@/stores/notes-store";
import { useRoomStore } from "@/stores/room-store";

import { startAmbience, stopAmbience } from "./ambience-sound";

const IDLE_MS = 8000;

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
  const follow = useMixerStore((state) => state.follow);
  const mix = useMixerStore((state) => state.mix);
  const setGaze = useSceneStore((state) => state.setGaze);

  const setSoundOn = useSceneStore((state) => state.setSoundOn);

  useShortcuts({
    g: () => setGaze(!gaze),
    m: () => setSoundOn(!soundOn),
    f: toggleFullscreen,
    n: () => useNotesStore.getState().setOpen(true),
  });

  // Persisted stores skip automatic hydration so the first
  // client render matches the server. Restore them here.
  useEffect(() => {
    void useSceneStore.persist.rehydrate();
    void useSettingsStore.persist.rehydrate();
    void useTimerStore.persist.rehydrate();
    void usePomodoroStore.persist.rehydrate();
    void useStopwatchStore.persist.rehydrate();
    void useRoomStore.persist.rehydrate();
    void useAlarmStore.persist.rehydrate();
    void useWorldClockStore.persist.rehydrate();
    void useMixerStore.persist.rehydrate();
    void useFocusStore.persist.rehydrate();
    void useNotesStore.persist.rehydrate();
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
      void startAmbience({ weather, season, time, volume, nature: natureOn, mix: follow ? null : mix });
    } else {
      stopAmbience();
    }
  }, [soundOn, weather, season, time, volume, natureOn, follow, mix]);

  // Focus mode is opt-in: mark the page so its CSS can apply.
  const focusFade = useSettingsStore((state) => state.focusFade);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-focus-fade", focusFade);
  }, [focusFade]);

  // Let the interface soften when you're not touching anything.
  useEffect(() => {
    const root = document.documentElement;
    let timer = window.setTimeout(() => (root.dataset.idle = "true"), IDLE_MS);

    function wake() {
      root.dataset.idle = "false";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => (root.dataset.idle = "true"), IDLE_MS);
    }

    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((name) => window.addEventListener(name, wake, { passive: true }));

    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, wake));
    };
  }, []);

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
