"use client";

import { Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { TimerStatus } from "./use-timer";

type TimerControlsProps = {
  status: TimerStatus;
  start: () => void;
  pause: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
};

const quickAdds = [1, 5, 10, 25];

export function TimerControls({
  status,
  start,
  pause,
  reset,
  addTime,
}: TimerControlsProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap justify-center gap-2">
        {quickAdds.map((minutes) => (
          <Button
            key={minutes}
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => addTime(minutes * 60)}
          >
            +{minutes} min
          </Button>
        ))}
      </div>

      <div className="flex gap-3">
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

        <Button size="lg" variant="outline" onClick={reset}>
          <RotateCcw />
          Reset
        </Button>
      </div>
    </div>
  );
}
