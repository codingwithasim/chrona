"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Pause, PictureInPicture2, Play } from "lucide-react";

import { formatStopwatch } from "@/components/tools/stopwatch/lap-list";
import { pomodoroModes, usePomodoroStore } from "@/stores/pomodoro-store";
import { useStopwatchElapsed, useStopwatchStore } from "@/stores/stopwatch-store";
import { useTimerStore } from "@/stores/timer-store";

import { formatClock } from "./digits";

/* The Document Picture-in-Picture API (Chrome and Edge, for now). */
type PipWindow = Window & typeof globalThis;
type DocumentPip = {
  requestWindow: (options: { width: number; height: number }) => Promise<PipWindow>;
};

function documentPip(): DocumentPip | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as unknown as { documentPictureInPicture?: DocumentPip }).documentPictureInPicture ?? null;
}

const subscribeNothing = () => () => {};

/** The tiny always-on-top clock: whichever tool you're on. */
function MiniClock({ tool }: { tool: "timer" | "pomodoro" | "stopwatch" }) {
  const timer = useTimerStore();
  const pomodoro = usePomodoroStore();
  const stopwatchStatus = useStopwatchStore((state) => state.status);
  const toggleStopwatch = useStopwatchStore((state) => state.toggle);
  const elapsed = useStopwatchElapsed();

  const view =
    tool === "pomodoro"
      ? {
          label: pomodoroModes[pomodoro.mode].label,
          color: pomodoroModes[pomodoro.mode].color,
          time: formatClock(pomodoro.remaining),
          running: pomodoro.status === "running",
          toggle: pomodoro.toggle,
        }
      : tool === "timer"
        ? {
            label: timer.label || "Timer",
            color: "var(--ember)",
            time: formatClock(timer.remaining),
            running: timer.status === "running",
            toggle: timer.toggle,
          }
        : {
            label: "Stopwatch",
            color: "var(--sky)",
            time: formatStopwatch(elapsed).slice(0, -3),
            running: stopwatchStatus === "running",
            toggle: toggleStopwatch,
          };

  return (
    <div className="flex h-screen items-center justify-between gap-4 px-6 select-none">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[12px] text-foreground/60">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: view.color }} />
          {view.label}
        </p>
        <p className="mt-1 font-display text-5xl font-light tabular-nums tracking-tight text-foreground/90">
          {view.time}
        </p>
      </div>
      <button
        type="button"
        onClick={view.toggle}
        aria-label={view.running ? "Pause" : "Start"}
        className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
      >
        {view.running ? (
          <Pause className="size-5" fill="currentColor" strokeWidth={1.8} />
        ) : (
          <Play className="size-5 translate-x-px" fill="currentColor" strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}

/** Pop the current tool out into a tiny window that floats over everything. */
export function PopOutButton() {
  const pathname = usePathname();
  const supported = useSyncExternalStore(subscribeNothing, () => documentPip() !== null, () => false);
  const [pip, setPip] = useState<PipWindow | null>(null);

  const tool = pathname === "/pomodoro" ? "pomodoro" : pathname === "/stopwatch" ? "stopwatch" : pathname === "/timer" ? "timer" : null;

  // Close the little window when leaving the tool.
  useEffect(() => () => pip?.close(), [pip]);

  if (!supported || !tool) {
    return null;
  }

  async function open() {
    const api = documentPip();

    if (!api) {
      return;
    }

    if (pip) {
      pip.close();
      return;
    }

    const win = await api.requestWindow({ width: 320, height: 150 });

    // Bring the app's styles and theme along.
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const style = win.document.createElement("style");
        style.textContent = Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
        win.document.head.appendChild(style);
      } catch {
        if (sheet.href) {
          const link = win.document.createElement("link");
          link.rel = "stylesheet";
          link.href = sheet.href;
          win.document.head.appendChild(link);
        }
      }
    }

    win.document.documentElement.className = document.documentElement.className;
    win.document.body.className = "bg-background text-foreground font-sans antialiased";
    win.document.title = "Chrona";

    win.addEventListener("pagehide", () => setPip(null));
    setPip(win);
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={pip ? "Close the floating timer" : "Pop out a floating timer"}
        title={pip ? "Close the floating timer" : "Pop out (stays on top of other windows)"}
        className="grid size-7 place-items-center rounded-lg transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
      >
        <PictureInPicture2 className="size-4" strokeWidth={1.7} />
      </button>
      {pip && createPortal(<MiniClock tool={tool} />, pip.document.body)}
    </>
  );
}
