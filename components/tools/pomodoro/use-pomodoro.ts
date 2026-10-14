"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { useUIStore } from "@/components/stores/ui-store";
import { playAlarm, SOUNDS } from "@/lib/play-alarm";
import { say } from "@/stores/dialogue-store";

export type PomodoroMode = "focus" | "shortBreak" | "longBreak";

export const POMODORO_CONFIG = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  cyclesBeforeLongBreak: 4,
};

export const pomodoroModes: Record<
  PomodoroMode,
  { label: string; jp: string; color: string }
> = {
  focus: { label: "Focus", jp: "集中", color: "var(--sakura)" },
  shortBreak: { label: "Short break", jp: "小休憩", color: "var(--mint)" },
  longBreak: { label: "Long break", jp: "長休憩", color: "var(--sky)" },
};

function nextModeAfter(mode: PomodoroMode, cycle: number): PomodoroMode {
  if (mode !== "focus") {
    return "focus";
  }

  return cycle % POMODORO_CONFIG.cyclesBeforeLongBreak === 0
    ? "longBreak"
    : "shortBreak";
}

export function usePomodoro() {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState(POMODORO_CONFIG.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [cycle, setCycle] = useState(1);

  // Wall-clock end time, so the countdown never drifts.
  const endRef = useRef<number | null>(null);

  const setPomodoroState = useUIStore((s) => s.setPomodoroState);
  const setPomodoroActions = useUIStore((s) => s.setPomodoroActions);

  useEffect(() => {
    setPomodoroState({ mode, timeLeft, isRunning, cycle });
  }, [mode, timeLeft, isRunning, cycle, setPomodoroState]);

  function enter(next: PomodoroMode, keepRunning: boolean) {
    const duration = POMODORO_CONFIG[next];

    setMode(next);
    setTimeLeft(duration);
    setIsRunning(keepRunning);

    endRef.current = keepRunning
      ? Date.now() + duration * 1000
      : null;
  }

  /** Moves to the next phase. Focus sessions advance the cycle. */
  function advance(keepRunning: boolean) {
    const next = nextModeAfter(mode, cycle);

    if (mode === "focus") {
      setCycle((value) => value + 1);
    }

    enter(next, keepRunning);
    return next;
  }

  const onTick = useEffectEvent(() => {
    if (endRef.current === null) {
      return;
    }

    const left = Math.max(
      0,
      Math.ceil((endRef.current - Date.now()) / 1000)
    );

    setTimeLeft(left);

    if (left > 0) {
      return;
    }

    const next = advance(true);

    playAlarm(SOUNDS.chime);

    say({
      tone: "alert",
      text:
        next === "longBreak"
          ? "Four sessions done! Long break time~ Go stretch, I'll keep your seat warm."
          : next === "shortBreak"
            ? "Focus session done! Take five — I'll guard the desk."
            : "Break's over! Back to focus. You've got this, nya.",
    });
  });

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const id = setInterval(onTick, 250);
    return () => clearInterval(id);
  }, [isRunning]);

  function start() {
    if (isRunning) return;

    const seconds = timeLeft > 0 ? timeLeft : POMODORO_CONFIG[mode];

    endRef.current = Date.now() + seconds * 1000;
    setTimeLeft(seconds);
    setIsRunning(true);
  }

  function pause() {
    if (endRef.current !== null) {
      setTimeLeft(
        Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000))
      );
    }

    endRef.current = null;
    setIsRunning(false);
  }

  function reset() {
    endRef.current = null;
    setIsRunning(false);
    setMode("focus");
    setCycle(1);
    setTimeLeft(POMODORO_CONFIG.focus);
  }

  function selectMode(next: PomodoroMode) {
    enter(next, false);
  }

  function skip() {
    advance(isRunning);
  }

  // The side panel calls into the latest functions.
  const latest = useRef({ start, pause, reset, selectMode });

  useEffect(() => {
    latest.current = { start, pause, reset, selectMode };
  });

  useEffect(() => {
    setPomodoroActions({
      start: () => latest.current.start(),
      pause: () => latest.current.pause(),
      reset: () => latest.current.reset(),
      setMode: (next) => latest.current.selectMode(next),
    });

    return () => setPomodoroActions(undefined);
  }, [setPomodoroActions]);

  return {
    mode,
    timeLeft,
    isRunning,
    cycle,
    duration: POMODORO_CONFIG[mode],
    nextMode: nextModeAfter(mode, cycle),
    start,
    pause,
    reset,
    skip,
    setMode: selectMode,
  };
}
