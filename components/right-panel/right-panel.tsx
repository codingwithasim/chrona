"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { PomodoroControls } from "./pomodoro-controls";
import { StopwatchActions } from "./stopwatch-actions";
import { TimerPresets } from "./timer-presets";

type RightPanelProps = {
  className?: string;
};

type RightPanelConfig = {
  title: string;
  jp: string;
  content: ReactNode;
};

export function useRightPanelConfig(): RightPanelConfig | null {
  const pathname = usePathname();

  switch (pathname) {
    case "/timer":
      return {
        title: "Timer Presets",
        jp: "プリセット",
        content: <TimerPresets />,
      };

    case "/stopwatch":
      return {
        title: "Laps",
        jp: "ラップ",
        content: <StopwatchActions />,
      };

    case "/pomodoro":
      return {
        title: "Pomodoro Controls",
        jp: "せってい",
        content: <PomodoroControls />,
      };

    default:
      return null;
  }
}

export function RightPanel({ className }: RightPanelProps) {
  const config = useRightPanelConfig();

  if (!config) {
    return null;
  }

  return (
    <aside
      data-ui
      className={cn(
        "panel mt-6 mb-6 w-80 shrink-0 flex-col self-start overflow-hidden",
        "max-h-[calc(100%-3rem)]",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-2 border-b-2 border-dashed border-border px-5 pt-4 pb-3">
        <h2 className="font-display text-base">
          {config.title}
        </h2>
        <span className="text-xs font-bold text-muted-foreground">
          {config.jp}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {config.content}
      </div>
    </aside>
  );
}
