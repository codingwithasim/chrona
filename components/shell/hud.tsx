"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CloudMoonRain,
  Eye,
  Hourglass,
  Settings,
  Timer,
  TimerReset,
  Volume2,
  VolumeX,
} from "lucide-react";

import { formatStopwatch } from "@/components/tools/stopwatch/lap-list";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { pomodoroModes, usePomodoroStore } from "@/stores/pomodoro-store";
import { useSceneStore } from "@/stores/scene-store";
import { useStopwatchElapsed, useStopwatchStore } from "@/stores/stopwatch-store";
import { useTimerStore } from "@/stores/timer-store";

import { AmbienceMenu } from "./ambience-menu";
import { formatClock } from "./digits";

function HudButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            onClick={onClick}
            aria-label={label}
          >
            {children}
          </Button>
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function Clock() {
  const now = useNow();
  const hour24 = useSceneStore((state) => state.hour24);
  const toggleHour24 = useSceneStore((state) => state.toggleHour24);

  const time = now
    ? now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: !hour24,
      })
    : "--:--";

  return (
    <button
      type="button"
      onClick={toggleHour24}
      aria-label={hour24 ? "Switch to 12-hour time" : "Switch to 24-hour time"}
      className="hidden h-9 items-center px-3 font-display text-sm tabular-nums text-foreground/80 transition-colors hover:text-foreground sm:flex"
    >
      {time}
    </button>
  );
}

function ActiveChip({
  href,
  icon: Icon,
  color,
  paused,
  children,
}: {
  href: string;
  icon: typeof Timer;
  color: string;
  paused: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "panel flex h-9 items-center gap-2 rounded-full px-3 font-display text-sm transition-opacity hover:opacity-100",
        paused ? "opacity-60" : "opacity-90"
      )}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="tabular-nums">{children}</span>
    </Link>
  );
}

function StopwatchChip() {
  const elapsed = useStopwatchElapsed();
  const status = useStopwatchStore((state) => state.status);

  return (
    <ActiveChip
      href="/stopwatch"
      icon={TimerReset}
      color="var(--sky)"
      paused={status === "paused"}
    >
      {formatStopwatch(elapsed).slice(0, -3)}
    </ActiveChip>
  );
}

/** Running tools show up here while you're on another page. */
function ActiveTools() {
  const pathname = usePathname();

  const pomodoroStatus = usePomodoroStore((state) => state.status);
  const pomodoroRemaining = usePomodoroStore((state) => state.remaining);
  const pomodoroMode = usePomodoroStore((state) => state.mode);

  const timerStatus = useTimerStore((state) => state.status);
  const timerRemaining = useTimerStore((state) => state.remaining);

  const stopwatchStatus = useStopwatchStore((state) => state.status);

  const showPomodoro =
    pathname !== "/pomodoro" &&
    (pomodoroStatus === "running" || pomodoroStatus === "paused");

  const showTimer =
    pathname !== "/timer" &&
    (timerStatus === "running" || timerStatus === "paused");

  const showStopwatch =
    pathname !== "/stopwatch" && stopwatchStatus !== "idle";

  if (!showPomodoro && !showTimer && !showStopwatch) {
    return null;
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      {showPomodoro && (
        <ActiveChip
          href="/pomodoro"
          icon={Timer}
          color={pomodoroModes[pomodoroMode].color}
          paused={pomodoroStatus === "paused"}
        >
          {formatClock(pomodoroRemaining)}
        </ActiveChip>
      )}

      {showTimer && (
        <ActiveChip
          href="/timer"
          icon={Hourglass}
          color="var(--sakura)"
          paused={timerStatus === "paused"}
        >
          {formatClock(timerRemaining)}
        </ActiveChip>
      )}

      {showStopwatch && <StopwatchChip />}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2 text-foreground [text-shadow:0_1px_12px_rgb(0_0_0/0.12)]",
        className
      )}
    >
      <CloudMoonRain
        className="size-5 text-primary transition-transform group-hover:-rotate-6"
        strokeWidth={2.2}
      />
      <span className="font-display text-lg tracking-wide">Chrona</span>
    </Link>
  );
}

export function Hud() {
  const soundOn = useSceneStore((state) => state.soundOn);
  const setSoundOn = useSceneStore((state) => state.setSoundOn);
  const setGaze = useSceneStore((state) => state.setGaze);

  return (
    <header
      data-ui
      data-chrome
      className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6"
    >
      <Logo />

      <div className="flex items-center gap-2">
        <ActiveTools />

        <div className="panel flex items-center gap-0.5 rounded-full p-1">
          <Clock />

          <AmbienceMenu />

          <HudButton
            label={soundOn ? "Mute the room" : "Play rain & ambient sounds"}
            onClick={() => setSoundOn(!soundOn)}
          >
            {soundOn ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
          </HudButton>

          <HudButton
            label="Watch the rain (Esc to return)"
            onClick={() => setGaze(true)}
          >
            <Eye className="size-[18px]" />
          </HudButton>

          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/settings"
                  aria-label="Settings"
                  className="grid size-9 place-items-center rounded-full transition-colors hover:bg-foreground/6"
                >
                  <Settings className="size-[18px]" />
                </Link>
              }
            />
            <TooltipContent side="bottom">Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
