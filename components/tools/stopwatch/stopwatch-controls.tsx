"use client";

import { Flag, RotateCcw } from "lucide-react";

import { ControlRow, PlayButton, QuietAction } from "@/components/shell/controls";
import { useStopwatchStore } from "@/stores/stopwatch-store";

export function StopwatchControls() {
  const status = useStopwatchStore((state) => state.status);
  const toggle = useStopwatchStore((state) => state.toggle);
  const lap = useStopwatchStore((state) => state.lap);
  const reset = useStopwatchStore((state) => state.reset);

  return (
    <ControlRow>
      <QuietAction icon={RotateCcw} label="Reset" keys="R" onClick={reset} disabled={status === "idle"} />
      <PlayButton
        running={status === "running"}
        label={status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start"}
        onClick={toggle}
      />
      <QuietAction icon={Flag} label="Lap" keys="L" onClick={lap} disabled={status !== "running"} />
    </ControlRow>
  );
}
