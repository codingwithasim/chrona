"use client";

import { Flag, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  status: "idle" | "running" | "paused";
  start: () => void;
  pause: () => void;
  reset: () => void;
  lap: () => void;
};

export function StopwatchControls({
  status,
  start,
  pause,
  reset,
  lap,
}: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {status === "running" ? (
        <Button size="lg" onClick={pause}>
          <Pause />
          Pause
        </Button>
      ) : (
        <Button size="lg" onClick={start}>
          <Play />
          {status === "paused" ? "Resume" : "Start"}
        </Button>
      )}

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
