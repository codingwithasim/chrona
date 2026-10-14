"use client";

import { RotateCcw, SkipForward } from "lucide-react";

import { ControlRow, PlayButton, QuietAction } from "@/components/shell/controls";
import { usePomodoroStore } from "@/stores/pomodoro-store";

export function PomodoroControls() {
  const status = usePomodoroStore((state) => state.status);
  const toggle = usePomodoroStore((state) => state.toggle);
  const skip = usePomodoroStore((state) => state.skip);
  const reset = usePomodoroStore((state) => state.reset);

  const running = status === "running";

  return (
    <ControlRow>
      <QuietAction icon={RotateCcw} label="Reset" keys="R" onClick={reset} />
      <PlayButton
        running={running}
        label={running ? "Pause" : status === "paused" ? "Resume" : "Start"}
        onClick={toggle}
      />
      <QuietAction icon={SkipForward} label="Skip" keys="S" onClick={skip} />
    </ControlRow>
  );
}
