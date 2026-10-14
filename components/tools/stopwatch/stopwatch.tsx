"use client";

import { Digits } from "@/components/shell/digits";
import { ProgressRing } from "@/components/shell/progress-ring";
import { ToolFrame } from "@/components/shell/tool-frame";

import { formatStopwatch, LapList } from "./lap-list";
import { StopwatchControls } from "./stopwatch-controls";
import { useStopwatch } from "./use-stopwatch";

export function StopwatchTool() {
  const sw = useStopwatch();

  // The ring sweeps once per minute, like a second hand.
  const secondSweep = (sw.elapsed % 60_000) / 60_000;

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
              {sw.status === "running"
                ? "RUNNING · けいそく中"
                : sw.status === "paused"
                  ? "PAUSED · ストップ"
                  : "READY · じゅんび"}
            </span>

            <Digits
              value={formatStopwatch(sw.elapsed)}
              className="cel-text text-[clamp(2.1rem,9.5vw,3.3rem)]"
            />

            <span className="text-xs text-muted-foreground">
              {sw.laps.length} {sw.laps.length === 1 ? "lap" : "laps"}
            </span>
          </div>
        </ProgressRing>

        <StopwatchControls
          status={sw.status}
          start={sw.start}
          pause={sw.pause}
          reset={sw.reset}
          lap={sw.lap}
        />

        {/* Laps live in the side panel on wide screens */}
        <LapList
          laps={sw.laps}
          limit={5}
          className="w-full max-w-md xl:hidden"
        />
      </div>
    </ToolFrame>
  );
}
