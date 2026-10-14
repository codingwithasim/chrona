"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { PomodoroControls } from "@/components/right-panel/pomodoro-controls";
import { StopwatchActions } from "@/components/right-panel/stopwatch-actions";
import { TimerPresets } from "@/components/right-panel/timer-presets";
import { Button } from "@/components/ui/button";

import { PanelStylePicker } from "./panel-style";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ToolOptionsConfig = {
  title: string;
  jp: string;
  content: ReactNode;
};

function useToolOptions(): ToolOptionsConfig | null {
  const pathname = usePathname();

  switch (pathname) {
    case "/timer":
      return { title: "Presets", jp: "プリセット", content: <TimerPresets /> };

    case "/stopwatch":
      return { title: "Laps", jp: "ラップ", content: <StopwatchActions /> };

    case "/pomodoro":
      return { title: "Pomodoro settings", jp: "せってい", content: <PomodoroControls /> };

    default:
      return null;
  }
}

/** Extra controls for the current tool, tucked into a side sheet. */
export function ToolOptions() {
  const config = useToolOptions();

  if (!config) {
    return null;
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Open ${config.title.toLowerCase()}`}
            title={config.title}
          >
            <SlidersHorizontal />
          </Button>
        }
      />

      <SheetContent side="right" className="w-[min(24rem,92vw)] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-dashed px-5 py-4 text-left">
          <SheetTitle className="flex items-baseline gap-2 text-base">
            {config.title}
            <span className="font-sans text-xs font-bold text-muted-foreground">
              {config.jp}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <section className="mb-6 space-y-2 border-b border-foreground/[0.06] pb-6">
            <p className="text-[11px] tracking-[0.25em] text-muted-foreground/80 lowercase">panel style</p>
            <PanelStylePicker className="sm:grid-cols-3" />
          </section>
          {config.content}
        </div>
      </SheetContent>
    </Sheet>
  );
}
