"use client";

import { Button } from "@/components/ui/button";
import { LapList } from "@/components/tools/stopwatch/lap-list";
import { useStopwatchStore } from "@/stores/stopwatch-store";

export function StopwatchActions() {
  const laps = useStopwatchStore((state) => state.laps);
  const clearLaps = useStopwatchStore((state) => state.clearLaps);

  return (
    <div className="flex h-full flex-col gap-4">
      <LapList laps={laps} />

      <Button
        variant="ghost"
        className="w-full shrink-0 border border-dashed border-border"
        disabled={laps.length === 0}
        onClick={clearLaps}
      >
        Clear laps
      </Button>
    </div>
  );
}
