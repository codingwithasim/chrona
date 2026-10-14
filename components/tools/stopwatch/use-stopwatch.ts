"use client";

import { useEffect, useRef, useState } from "react";

import { useUIStore } from "@/components/stores/ui-store";

type Status = "idle" | "running" | "paused";

export type Lap = {
  id: number;
  split: number;
  total: number;
};

export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [laps, setLaps] = useState<Lap[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLapRef = useRef(0);

  const setStopwatchLaps = useUIStore((s) => s.setStopwatchLaps);
  const setStopwatchActions = useUIStore((s) => s.setStopwatchActions);

  function stopTicking() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function lap() {
    if (status !== "running") return;

    const split = elapsed - lastLapRef.current;

    lastLapRef.current = elapsed;

    setLaps((prev) => [
      {
        id: prev.length + 1,
        split,
        total: elapsed,
      },
      ...prev,
    ]);
  }

  function start() {
    if (status === "running") return;

    startTimeRef.current = Date.now() - pausedAtRef.current;

    setStatus("running");

    stopTicking();
    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;

      setElapsed(Date.now() - startTimeRef.current);
    }, 50);
  }

  function pause() {
    if (status !== "running") return;

    setStatus("paused");
    stopTicking();

    pausedAtRef.current = elapsed;
  }

  function reset() {
    stopTicking();

    setElapsed(0);
    setStatus("idle");
    startTimeRef.current = null;
    pausedAtRef.current = 0;

    lastLapRef.current = 0;
    setLaps([]);
  }

  function clearLaps() {
    lastLapRef.current = elapsed;
    setLaps([]);
  }

  useEffect(() => {
    setStopwatchLaps(laps);
  }, [laps, setStopwatchLaps]);

  // The laps panel calls into the latest functions, not the
  // ones captured on the first render.
  const latest = useRef({ lap, clearLaps });

  useEffect(() => {
    latest.current = { lap, clearLaps };
  });

  useEffect(() => {
    setStopwatchActions({
      lap: () => latest.current.lap(),
      clearLaps: () => latest.current.clearLaps(),
    });

    return () => {
      setStopwatchActions(undefined);
      setStopwatchLaps([]);
    };
  }, [setStopwatchActions, setStopwatchLaps]);

  useEffect(() => stopTicking, []);

  return {
    elapsed,
    status,
    start,
    pause,
    reset,
    lap,
    clearLaps,
    laps,
  };
}
