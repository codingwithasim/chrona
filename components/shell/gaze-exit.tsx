"use client";

import { Clock3, EyeOff, Maximize2, MoonStar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { toggleFullscreen } from "@/lib/fullscreen";
import { cn } from "@/lib/utils";
import { pomodoroModes, usePomodoroStore } from "@/stores/pomodoro-store";
import { useSceneStore } from "@/stores/scene-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useTimerStore } from "@/stores/timer-store";

import { formatClock } from "./digits";

/** A big, quiet clock over the room: a desk or bedside clock. */
function GazeClock() {
  const now = useNow();
  const hour24 = useSceneStore((state) => state.hour24);
  const pomodoro = usePomodoroStore();
  const timer = useTimerStore();

  if (!now) {
    return null;
  }

  const [time, period] = now
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: !hour24 })
    .split(" ");

  const counting =
    pomodoro.status !== "idle"
      ? `${pomodoroModes[pomodoro.mode].label} · ${formatClock(pomodoro.remaining)}`
      : timer.status !== "idle"
        ? `${timer.label || "Timer"} · ${formatClock(timer.remaining)}`
        : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 grid place-items-center px-6">
      <div className="text-center text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.35),0_1px_3px_rgb(0_0_0/0.4)]">
        <p className="font-display text-[clamp(4.5rem,19vw,13rem)] leading-none font-light tracking-tight tabular-nums">
          {time}
          {period && <span className="ml-3 text-[0.22em] tracking-wider opacity-70">{period}</span>}
        </p>
        <p className="mt-4 text-[clamp(0.9rem,2.2vw,1.25rem)] tracking-[0.18em] opacity-75 lowercase">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        {counting && <p className="mt-3 text-sm tabular-nums opacity-70">{counting}</p>}
      </div>
    </div>
  );
}

/** The only controls visible while watching the rain. */
export function GazeExit() {
  const gaze = useSceneStore((state) => state.gaze);
  const setGaze = useSceneStore((state) => state.setGaze);
  const clock = useSettingsStore((state) => state.gazeClock);
  const setClock = useSettingsStore((state) => state.setGazeClock);
  const dim = useSettingsStore((state) => state.gazeDim);
  const setDim = useSettingsStore((state) => state.setGazeDim);

  if (!gaze) {
    return null;
  }

  const round = "size-10 rounded-full opacity-60 transition-opacity hover:opacity-100";

  return (
    <>
      {/* Dimmed for the bedside: the room stays, just softer */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none fixed inset-0 z-20 bg-black transition-opacity duration-1000",
          dim ? "opacity-55" : "opacity-0"
        )}
      />

      {clock && <GazeClock />}

      <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center gap-2 px-4 animate-in fade-in-0 duration-700">
        <Button
          variant="outline"
          className="h-10 rounded-full px-4 opacity-60 transition-opacity hover:opacity-100"
          onClick={() => setGaze(false)}
        >
          <EyeOff />
          Back to the room
          <kbd className="ml-1 rounded-md border px-1.5 text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(round, clock && "opacity-90")}
          aria-pressed={clock}
          aria-label="Show a big clock"
          title="Big clock (desk or bedside)"
          onClick={() => setClock(!clock)}
        >
          <Clock3 className="size-4" strokeWidth={1.7} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(round, dim && "opacity-90")}
          aria-pressed={dim}
          aria-label="Dim the room"
          title="Dim (for the bedside)"
          onClick={() => setDim(!dim)}
        >
          <MoonStar className="size-4" strokeWidth={1.7} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={round}
          aria-label="Full screen (F)"
          title="Full screen (F)"
          onClick={toggleFullscreen}
        >
          <Maximize2 className="size-4" strokeWidth={1.7} />
        </Button>
      </div>
    </>
  );
}
