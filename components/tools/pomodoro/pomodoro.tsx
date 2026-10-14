"use client";

import { Digits, formatClock } from "@/components/shell/digits";
import { ProgressRing } from "@/components/shell/progress-ring";
import { ToolFrame } from "@/components/shell/tool-frame";
import { cn } from "@/lib/utils";

import { PomodoroControls } from "./pomodoro-controls";
import {
  POMODORO_CONFIG,
  type PomodoroMode,
  pomodoroModes,
  usePomodoro,
} from "./use-pomodoro";

function Tomato({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        "size-7 transition-transform",
        filled && "scale-110"
      )}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="13.5"
        r="8.5"
        fill={filled ? "var(--sakura)" : "transparent"}
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeDasharray={filled ? undefined : "2.4 2"}
        opacity={filled ? 1 : 0.55}
      />
      {filled && (
        <ellipse cx="9" cy="11" rx="2" ry="1.3" fill="#fff" opacity="0.7" />
      )}
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
  const p = usePomodoro();

  const progress = (p.duration - p.timeLeft) / p.duration;
  const current = pomodoroModes[p.mode];

  // Focus sessions completed in the current set of four.
  const setSize = POMODORO_CONFIG.cyclesBeforeLongBreak;
  const doneInSet =
    p.mode === "longBreak" ? setSize : (p.cycle - 1) % setSize;

  return (
    <ToolFrame href="/pomodoro">
      <div className="flex flex-col items-center gap-7">
        <div
          role="tablist"
          aria-label="Pomodoro phase"
          className="flex w-full max-w-md gap-1 rounded-2xl border-2 border-border bg-card/60 p-1"
        >
          {(Object.keys(pomodoroModes) as PomodoroMode[]).map((mode) => {
            const active = p.mode === mode;

            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => p.setMode(mode)}
                className={cn(
                  "flex flex-1 flex-col items-center rounded-xl border-2 px-2 py-1.5 transition-all",
                  active
                    ? "border-ink text-[#1b1530] shadow-cel-sm"
                    : "border-transparent text-muted-foreground hover:bg-muted"
                )}
                style={
                  active
                    ? { backgroundColor: pomodoroModes[mode].color }
                    : undefined
                }
              >
                <span className="text-xs font-bold sm:text-sm">
                  {pomodoroModes[mode].label}
                </span>
                <span className="text-[10px] opacity-75">
                  {pomodoroModes[mode].jp}
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
              SESSION {p.cycle} · {current.jp}
            </span>

            <Digits
              value={formatClock(p.timeLeft)}
              className="cel-text text-[clamp(2.6rem,12vw,4.1rem)]"
            />

            <span className="text-xs text-muted-foreground">
              next: {pomodoroModes[p.nextMode].label.toLowerCase()}
            </span>
          </div>
        </ProgressRing>

        <div
          className="flex items-center gap-2"
          aria-label={`${doneInSet} of ${setSize} focus sessions done before the long break`}
        >
          {Array.from({ length: setSize }, (_, index) => (
            <Tomato key={index} filled={index < doneInSet} />
          ))}
        </div>

        <PomodoroControls
          isRunning={p.isRunning}
          start={p.start}
          pause={p.pause}
          reset={p.reset}
          skip={p.skip}
        />
      </div>
    </ToolFrame>
  );
}
