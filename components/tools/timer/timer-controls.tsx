"use client";

import { RotateCcw } from "lucide-react";

import { ControlRow, PlayButton, QuietAction } from "@/components/shell/controls";
import { useTimerStore } from "@/stores/timer-store";

const quickAdds = [1, 5, 10];

export function TimerControls() {
  const status = useTimerStore((state) => state.status);
  const toggle = useTimerStore((state) => state.toggle);
  const reset = useTimerStore((state) => state.reset);
  const addTime = useTimerStore((state) => state.addTime);

  const counting = status === "running" || status === "paused";

  return (
    <div className="flex flex-col items-center gap-4">
      <ControlRow>
        <QuietAction icon={RotateCcw} label="Reset" keys="R" onClick={reset} disabled={status === "idle"} />
        <PlayButton
          running={status === "running"}
          label={status === "running" ? "Pause" : status === "paused" ? "Resume" : "Start"}
          onClick={toggle}
        />
        {/* Keeps the play button centred */}
        <span className="size-11" aria-hidden="true" />
      </ControlRow>

      {counting && (
        <div className="flex gap-1 animate-in fade-in-0 duration-500">
          {quickAdds.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => addTime(minutes * 60)}
              className="rounded-full px-2.5 py-1 text-xs text-muted-foreground/80 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
            >
              +{minutes} min
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
