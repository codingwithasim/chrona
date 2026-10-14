"use client";

import { Flag, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStopwatchStore } from "@/stores/stopwatch-store";

export function StopwatchControls() {
  const status = useStopwatchStore((state) => state.status);
  const toggle = useStopwatchStore((state) => state.toggle);
  const lap = useStopwatchStore((state) => state.lap);
  const reset = useStopwatchStore((state) => state.reset);

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button size="lg" onClick={toggle}>
        {status === "running" ? <Pause /> : <Play />}
        {status === "running"
          ? "Pause"
          : status === "paused"
            ? "Resume"
            : "Start"}
      </Button>

      <Button
        size="lg"
        variant="secondary"
        onClick={lap}
        disabled={status !== "running"}
      >
        <Flag />
        Lap
      </Button>

      <Button size="lg" variant="outline" onClick={reset}>
        <RotateCcw />
        Reset
      </Button>
    </div>
  );
}
