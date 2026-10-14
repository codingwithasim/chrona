"use client";

import { StatusLine } from "@/components/shell/controls";
import { Digits, formatClock } from "@/components/shell/digits";
import { ProgressRing } from "@/components/shell/progress-ring";
import { ToolFrame } from "@/components/shell/tool-frame";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { cn } from "@/lib/utils";
import {
  durationOf,
  nextModeAfter,
  type PomodoroMode,
  pomodoroModes,
  todayKey,
  usePomodoroStore,
} from "@/stores/pomodoro-store";

import { PomodoroControls } from "./pomodoro-controls";

export function PomodoroTool() {
  const mode = usePomodoroStore((state) => state.mode);
  const cycle = usePomodoroStore((state) => state.cycle);
  const remaining = usePomodoroStore((state) => state.remaining);
  const settings = usePomodoroStore((state) => state.settings);
  const stats = usePomodoroStore((state) => state.stats);
  const setMode = usePomodoroStore((state) => state.setMode);
  const toggle = usePomodoroStore((state) => state.toggle);
  const skip = usePomodoroStore((state) => state.skip);
  const reset = usePomodoroStore((state) => state.reset);

  useShortcuts({ space: toggle, s: skip, r: reset });

  const duration = durationOf(settings, mode);
  const progress = Math.min(1, Math.max(0, (duration - remaining) / duration));
  const current = pomodoroModes[mode];
  const next = nextModeAfter(mode, cycle, settings);

  // Focus sessions completed in the current set.
  const setSize = settings.cyclesBeforeLongBreak;
  const doneInSet = mode === "longBreak" ? setSize : (cycle - 1) % setSize;

  const todaySessions = stats.date === todayKey() ? stats.sessions : 0;

  return (
    <ToolFrame href="/pomodoro" placement="side">
      <div className="flex flex-col items-center gap-7">
        <div role="tablist" aria-label="Pomodoro phase" className="flex gap-1">
          {(Object.keys(pomodoroModes) as PomodoroMode[]).map((item) => {
            const active = item === mode;

            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(item)}
                title={`${pomodoroModes[item].jp} · ${settings[item]} min`}
                className={cn(
                  "relative rounded-full px-3 py-1.5 text-xs transition-colors duration-300",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-foreground"
                )}
              >
                {pomodoroModes[item].label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 -bottom-0.5 mx-auto size-1 rounded-full transition-opacity duration-300",
                    active ? "opacity-100" : "opacity-0"
                  )}
                  style={{ backgroundColor: pomodoroModes[item].color }}
                />
              </button>
            );
          })}
        </div>

        <ProgressRing
          value={progress}
          color={current.color}
          className="w-[min(70vw,16.5rem)]"
        >
          <div className="flex flex-col items-center gap-3">
            <StatusLine>{mode === "focus" ? `session ${cycle}` : "break"}</StatusLine>

            <Digits
              value={formatClock(remaining)}
              className="text-[clamp(2.6rem,11vw,3.6rem)]"
            />

            <span className="text-[11px] text-muted-foreground/70">
              then {pomodoroModes[next].label.toLowerCase()}
            </span>
          </div>
        </ProgressRing>

        <PomodoroControls />

        <div
          className="flex items-center gap-3 text-[11px] text-muted-foreground/70"
          role="img"
          aria-label={`${doneInSet} of ${setSize} focus sessions done before the long break, ${todaySessions} today`}
        >
          <span className="flex gap-1.5">
            {Array.from({ length: setSize }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "size-1.5 rounded-full transition-colors duration-500",
                  index < doneInSet ? "" : "bg-foreground/15"
                )}
                style={index < doneInSet ? { backgroundColor: "var(--ember)" } : undefined}
              />
            ))}
          </span>
          <span>{todaySessions} today</span>
        </div>
      </div>
    </ToolFrame>
  );
}
