"use client";

import { Digits } from "@/components/shell/digits";
import { ProgressRing } from "@/components/shell/progress-ring";
import { ToolFrame } from "@/components/shell/tool-frame";
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

  // The ring sweeps once per minute, like a second hand.
  const secondSweep = (elapsed % 60_000) / 60_000;

  return (
    <ToolFrame href="/stopwatch">
      <div className="flex flex-col items-center gap-8">
        <ProgressRing
          value={secondSweep}
          color="var(--sky)"
          className="w-[min(76vw,20rem)]"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground">
              {status === "running"
                ? "RUNNING · けいそく中"
                : status === "paused"
                  ? "PAUSED · ストップ"
                  : "READY · じゅんび"}
            </span>

            <Digits
              value={formatStopwatch(elapsed)}
              className="cel-text text-[clamp(2.1rem,9.5vw,3.3rem)]"
            />

            <span className="text-xs text-muted-foreground">
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
