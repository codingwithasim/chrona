"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePomodoroStore } from "@/stores/pomodoro-store";

export function PomodoroControls() {
  const status = usePomodoroStore((state) => state.status);
  const toggle = usePomodoroStore((state) => state.toggle);
  const skip = usePomodoroStore((state) => state.skip);
  const reset = usePomodoroStore((state) => state.reset);

  const running = status === "running";

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button size="lg" onClick={toggle}>
        {running ? <Pause /> : <Play />}
        {running ? "Pause" : status === "paused" ? "Resume" : "Start"}
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
