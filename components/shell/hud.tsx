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
import { SoundMixer } from "./sound-mixer";
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
            className="size-8 rounded-full text-foreground/55 hover:text-foreground"
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
      className="hidden h-8 items-center px-3 font-display text-[13px] tabular-nums text-foreground/65 transition-colors duration-300 hover:text-foreground sm:flex"
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
      data-chrome
      className={cn(
        "panel flex h-8 items-center gap-2 rounded-full px-3 font-display text-[13px] transition-opacity duration-300 hover:opacity-100",
        paused ? "opacity-55" : "opacity-85"
      )}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.7} />
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
          color="var(--ember)"
          paused={timerStatus === "paused"}
        >
          {formatClock(timerRemaining)}
        </ActiveChip>
      )}

      {showStopwatch && <StopwatchChip />}
    </div>
  );
}

export function Logo({ className, ...props }: { className?: string; "data-chrome"?: boolean }) {
  return (
    <Link
      {...props}
      href="/"
      className={cn(
        "group flex items-center gap-2 text-foreground/75 transition-colors duration-300 hover:text-foreground",
        className
      )}
    >
      <CloudMoonRain
        className="size-[18px] transition-transform duration-500 group-hover:-rotate-6"
        strokeWidth={1.7}
      />
      <span className="font-display text-[15px] tracking-[0.12em]">Chrona</span>
    </Link>
  );
}

export function Hud() {
  const setGaze = useSceneStore((state) => state.setGaze);

  return (
    <header
      data-ui
      className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6"
    >
      <Logo data-chrome />

      <div className="flex items-center gap-2">
        <ActiveTools />

        <div data-chrome className="panel flex items-center gap-0.5 rounded-full p-0.5">
          <Clock />

          <AmbienceMenu />

          <SoundMixer />

          <HudButton
            label="Watch the rain (Esc to return)"
            onClick={() => setGaze(true)}
          >
            <Eye className="size-[17px]" strokeWidth={1.7} />
          </HudButton>

          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/settings"
                  aria-label="Settings"
                  className="grid size-8 place-items-center rounded-full text-foreground/55 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
                >
                  <Settings className="size-[17px]" strokeWidth={1.7} />
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
