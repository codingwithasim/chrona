"use client";

import { Button } from "@/components/ui/button";
import { LapList } from "@/components/tools/stopwatch/lap-list";

import { useUIStore } from "../stores/ui-store";

export function StopwatchActions() {
  const laps = useUIStore((s) => s.stopwatchLaps);

  const clearLaps = useUIStore(
    (s) => s.stopwatchActions?.clearLaps
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <LapList laps={laps} />

      <Button
        variant="ghost"
        className="w-full shrink-0 border-2 border-dashed border-border"
        disabled={laps.length === 0}
        onClick={() => clearLaps?.()}
      >
        Clear laps
      </Button>
    </div>
  );
}
