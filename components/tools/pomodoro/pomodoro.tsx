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

import { BreakCompanion } from "./break-companion";
import { CurrentTask } from "./current-task";
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
    <ToolFrame href="/pomodoro" placement="side" accent={current.color}>
      <div data-tool-body className="flex flex-col items-center gap-7">
        <div
          data-recede
          data-compact-hide
          role="tablist"
          aria-label="Pomodoro phase"
          className="flex gap-1 rounded-full bg-background/30 p-1 ring-1 ring-foreground/[0.08] backdrop-blur-md"
        >
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
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-300",
                  active
                    ? "text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.08)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  active
                    ? { backgroundColor: `color-mix(in oklab, ${pomodoroModes[item].color} 24%, transparent)` }
                    : undefined
                }
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: pomodoroModes[item].color, opacity: active ? 1 : 0.5 }}
                />
                {pomodoroModes[item].label}
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

            <span data-compact-hide className="text-[11px] text-muted-foreground/70">
              then {pomodoroModes[next].label.toLowerCase()}
            </span>
          </div>
        </ProgressRing>

        <div data-compact-hide className="-my-3 flex max-w-full justify-center">
          {mode === "focus" ? <CurrentTask /> : <BreakCompanion cycle={cycle} />}
        </div>

        <PomodoroControls />

        <div
          data-recede
          data-compact-hide
          className="flex items-center gap-3 text-[11px] text-muted-foreground/70"
          role="img"
          aria-label={`${doneInSet} of ${setSize} focus sessions done before the long break, ${todaySessions} today`}
        >
          <span className="flex gap-1.5">
            {Array.from({ length: setSize }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "size-2 rounded-full transition-colors duration-500",
                  index < doneInSet ? "shadow-[0_0_6px_var(--ember)]" : "bg-foreground/10 ring-1 ring-foreground/15"
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
