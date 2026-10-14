"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
};

export function PomodoroControls({
  isRunning,
  start,
  pause,
  reset,
  skip,
}: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button size="lg" onClick={isRunning ? pause : start}>
        {isRunning ? <Pause /> : <Play />}
        {isRunning ? "Pause" : "Start"}
      </Button>

      <Button size="lg" variant="secondary" onClick={skip}>
        <SkipForward />
        Skip
      </Button>

      <Button size="lg" variant="outline" onClick={reset}>
        <RotateCcw />
        Reset
      </Button>
    </div>
  );
}
