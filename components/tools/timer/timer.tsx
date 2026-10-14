"use client";

import { useEffect, useRef } from "react";

import { Digits, formatClock } from "@/components/shell/digits";
import { ProgressRing } from "@/components/shell/progress-ring";
import { ToolFrame } from "@/components/shell/tool-frame";
import { useTimerStore } from "@/stores/timer-store";

import { TimerControls } from "./timer-controls";
import { type TimerStatus, useTimer } from "./use-timer";

const statusLabels: Record<TimerStatus, string> = {
  idle: "READY · じゅんび",
  running: "COUNTING · カウント中",
  paused: "PAUSED · ひとやすみ",
  finished: "DONE · おわり",
};

export function TimerTool() {
  const timer = useTimer(25 * 60);
  const setActions = useTimerStore((state) => state.setActions);

  // The presets panel calls into the latest timer functions.
  const latest = useRef(timer);

  useEffect(() => {
    latest.current = timer;
  });

  useEffect(() => {
    setActions({
      setDuration: (seconds) => latest.current.changeDuration(seconds),
      addTime: (seconds) => latest.current.addTime(seconds),
      start: () => latest.current.start(),
      reset: () => latest.current.reset(),
    });

    return () => setActions(undefined);
  }, [setActions]);

  const progress =
    timer.duration > 0
      ? (timer.duration - timer.remaining) / timer.duration
      : 0;

  return (
    <ToolFrame href="/timer">
      <div className="flex flex-col items-center gap-8">
        <ProgressRing
          value={progress}
          color="var(--sakura)"
          className="w-[min(76vw,20rem)]"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground">
              {statusLabels[timer.status]}
            </span>

            <Digits
              value={formatClock(timer.remaining)}
              className="cel-text text-[clamp(2.6rem,12vw,4.1rem)]"
            />

            <span className="text-xs text-muted-foreground">
              of {formatClock(timer.duration)}
            </span>
          </div>
        </ProgressRing>

        <TimerControls
          status={timer.status}
          start={timer.start}
          pause={timer.pause}
          reset={timer.reset}
          addTime={timer.addTime}
        />
      </div>
    </ToolFrame>
  );
}
