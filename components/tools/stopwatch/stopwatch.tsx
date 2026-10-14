"use client";

import { StatusLine } from "@/components/shell/controls";
import { Digits } from "@/components/shell/digits";
import { ProgressRing } from "@/components/shell/progress-ring";
import { ToolFrame } from "@/components/shell/tool-frame";
import { useShortcuts } from "@/hooks/use-shortcuts";
import {
  useStopwatchElapsed,
  useStopwatchStore,
} from "@/stores/stopwatch-store";

import { formatStopwatch, LapList } from "./lap-list";
import { StopwatchControls } from "./stopwatch-controls";

export function StopwatchTool() {
  const elapsed = useStopwatchElapsed();
  const status = useStopwatchStore((state) => state.status);
  const laps = useStopwatchStore((state) => state.laps);
  const toggle = useStopwatchStore((state) => state.toggle);
  const lap = useStopwatchStore((state) => state.lap);
  const reset = useStopwatchStore((state) => state.reset);

  useShortcuts({ space: toggle, l: lap, r: reset });

  // The ring sweeps once per minute, like a second hand.
  const secondSweep = (elapsed % 60_000) / 60_000;

  return (
    <ToolFrame href="/stopwatch" placement="side">
      <div className="flex flex-col items-center gap-7">
        <ProgressRing
          value={secondSweep}
          color="var(--sky)"
          className="w-[min(70vw,16.5rem)]"
        >
          <div className="flex flex-col items-center gap-3">
            <StatusLine>{status === "running" ? "running" : status === "paused" ? "paused" : "ready"}</StatusLine>

            <Digits
              value={formatStopwatch(elapsed)}
              className="text-[clamp(2.1rem,9vw,2.9rem)]"
            />

            <span className="text-[11px] text-muted-foreground/70">
              {laps.length} {laps.length === 1 ? "lap" : "laps"}
            </span>
          </div>
        </ProgressRing>

        <StopwatchControls />

        {laps.length > 0 && (
          <LapList
            laps={laps}
            className="max-h-64 w-full max-w-md overflow-y-auto pr-1"
          />
        )}
      </div>
    </ToolFrame>
  );
}
