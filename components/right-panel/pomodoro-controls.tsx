"use client";

import { Brain, Coffee, Armchair, RefreshCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  POMODORO_CONFIG,
  type PomodoroMode,
  pomodoroModes,
} from "@/components/tools/pomodoro/use-pomodoro";
import { cn } from "@/lib/utils";

import { useUIStore } from "../stores/ui-store";

const modeIcons: Record<PomodoroMode, typeof Brain> = {
  focus: Brain,
  shortBreak: Coffee,
  longBreak: Armchair,
};

export function PomodoroControls() {
  const pomodoroActions = useUIStore((s) => s.pomodoroActions);
  const state = useUIStore((s) => s.pomodoroState);

  const completed = Math.max(0, (state?.cycle ?? 1) - 1);

  return (
    <div className="flex h-full flex-col gap-6">
      <section className="space-y-2">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Phase
        </p>

        <div className="grid gap-2">
          {(Object.keys(pomodoroModes) as PomodoroMode[]).map((mode) => {
            const Icon = modeIcons[mode];
            const active = state?.mode === mode;

            return (
              <button
                key={mode}
                type="button"
                onClick={() => pomodoroActions?.setMode?.(mode)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                  active
                    ? "border-ink text-[#1b1530] shadow-cel-sm"
                    : "border-border hover:bg-muted"
                )}
                style={
                  active
                    ? { backgroundColor: pomodoroModes[mode].color }
                    : undefined
                }
              >
                <Icon className="size-4" />
                <span className="flex-1 text-sm font-bold">
                  {pomodoroModes[mode].label}
                  <span className="ml-2 text-[11px] font-normal opacity-70">
                    {pomodoroModes[mode].jp}
                  </span>
                </span>
                <span className="font-display text-xs opacity-80">
                  {POMODORO_CONFIG[mode] / 60}m
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-dashed border-border p-4 text-center">
        <p className="font-display text-3xl">{completed}</p>
        <p className="text-xs text-muted-foreground">
          focus {completed === 1 ? "session" : "sessions"} finished
        </p>
      </section>

      <Button
        variant="outline"
        onClick={() => pomodoroActions?.reset?.()}
      >
        <RefreshCcw />
        Reset all sessions
      </Button>

      <div className="mt-auto flex gap-2 rounded-xl bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-honey" />
        <span>
          25 min focus → 5 min break. Every fourth session
          earns a 15 min long break.
        </span>
      </div>
    </div>
  );
}
