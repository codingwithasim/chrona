"use client";

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

function Tomato({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-7 transition-transform", filled && "scale-110")}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="13.5"
        r="8.5"
        fill={filled ? "var(--ember)" : "transparent"}
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeDasharray={filled ? undefined : "2.4 2"}
        opacity={filled ? 1 : 0.55}
      />
      {filled && <ellipse cx="9" cy="11" rx="2" ry="1.3" fill="#fff" opacity="0.7" />}
      <path
        d="M12 5.5 L10 3.5 M12 5.5 L14.5 3.8 M12 5.5 L8.5 6.5 M12 5.5 L15.5 6.6"
        stroke="var(--mint)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={filled ? 1 : 0.55}
      />
    </svg>
  );
}

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
    <ToolFrame href="/pomodoro">
      <div className="flex flex-col items-center gap-7">
        <div
          role="tablist"
          aria-label="Pomodoro phase"
          className="flex w-full max-w-md gap-1 rounded-2xl border border-border bg-card/60 p-1"
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
                className={cn(
                  "flex flex-1 flex-col items-center rounded-xl border px-2 py-1.5 transition-all",
                  active
                    ? "border-black/10 text-[#1b1530] shadow-cel-sm"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
                style={active ? { backgroundColor: pomodoroModes[item].color } : undefined}
              >
                <span className="text-xs font-bold sm:text-sm">
                  {pomodoroModes[item].label}
                </span>
                <span className="text-[10px] opacity-75">
                  {pomodoroModes[item].jp} · {settings[item]}m
                </span>
              </button>
            );
          })}
        </div>

        <ProgressRing
          value={progress}
          color={current.color}
          className="w-[min(72vw,19rem)]"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground">
              {mode === "focus" ? `SESSION ${cycle}` : "BREAK"} · {current.jp}
            </span>

            <Digits
              value={formatClock(remaining)}
              className="cel-text text-[clamp(2.6rem,12vw,4.1rem)]"
            />

            <span className="text-xs text-muted-foreground">
              next: {pomodoroModes[next].label.toLowerCase()}
            </span>
          </div>
        </ProgressRing>

        <div className="flex flex-col items-center gap-2">
          <div
            className="flex items-center gap-2"
            role="img"
            aria-label={`${doneInSet} of ${setSize} focus sessions done before the long break`}
          >
            {Array.from({ length: setSize }, (_, index) => (
              <Tomato key={index} filled={index < doneInSet} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {todaySessions} {todaySessions === 1 ? "session" : "sessions"} today
          </p>
        </div>

        <PomodoroControls />

        <p className="hidden text-[11px] text-muted-foreground/70 sm:block">
          Space start / pause · S skip · R reset
        </p>
      </div>
    </ToolFrame>
  );
}
