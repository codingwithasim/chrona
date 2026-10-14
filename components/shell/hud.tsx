"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CloudMoonRain,
  Eye,
  Hourglass,
  Moon,
  Settings,
  Sun,
  Timer,
  TimerReset,
  Volume2,
  VolumeX,
} from "lucide-react";

import { MobileRightPanel } from "@/components/right-panel/mobile-right-panel";
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
import { useResolvedScene, useSceneStore } from "@/stores/scene-store";
import { useStopwatchElapsed, useStopwatchStore } from "@/stores/stopwatch-store";
import { useTimerStore } from "@/stores/timer-store";

import { formatClock } from "./digits";
import { AmbienceMenu } from "./ambience-menu";

function HudButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
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
            className={cn("rounded-full", className)}
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

function ClockChip() {
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
      className="hidden h-9 min-w-24 items-center justify-center rounded-full px-3 font-display text-sm tabular-nums transition-colors hover:bg-muted sm:flex"
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
        "flex h-9 items-center gap-1.5 rounded-full border-2 border-ink px-3 font-display text-sm text-[#1b1530] shadow-cel-sm transition-transform hover:-translate-y-0.5",
        paused && "opacity-70"
      )}
      style={{ backgroundColor: color }}
    >
      <Icon className="size-4" strokeWidth={2.4} />
      <span className="tabular-nums">{children}</span>
      {paused && <span className="font-sans text-[10px] font-bold">II</span>}
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
      className={cn("group flex items-center gap-2.5", className)}
    >
      <span className="grid size-10 -rotate-3 place-items-center rounded-xl border-2 border-ink bg-primary text-primary-foreground shadow-cel transition-transform group-hover:rotate-3">
        <CloudMoonRain className="size-5" strokeWidth={2.4} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl cel-text">Chrona</span>
        <span className="mt-1 text-[11px] font-bold tracking-[0.3em] text-muted-foreground">
          クロナ
        </span>
      </span>
    </Link>
  );
}

type HudProps = {
  showPanelTrigger?: boolean;
};

export function Hud({ showPanelTrigger = false }: HudProps) {
  const { dark } = useResolvedScene();

  const soundOn = useSceneStore((state) => state.soundOn);
  const setSoundOn = useSceneStore((state) => state.setSoundOn);
  const setTimeOfDay = useSceneStore((state) => state.setTimeOfDay);
  const setGaze = useSceneStore((state) => state.setGaze);

  return (
    <header
      data-ui
      className="relative z-20 flex h-18 shrink-0 items-center justify-between gap-2 px-3 sm:px-5"
    >
      <Logo />

      <div className="flex items-center gap-3">
        <ActiveTools />

        <div className="panel flex items-center gap-0.5 rounded-full p-1">
          <ClockChip />

          <AmbienceMenu />

          <HudButton
            label={soundOn ? "Mute the room" : "Play rain & ambient sounds"}
            onClick={() => setSoundOn(!soundOn)}
          >
            {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </HudButton>

          <HudButton
            className="hidden sm:inline-flex"
            label={dark ? "Switch to daytime" : "Switch to night"}
            onClick={() => setTimeOfDay(dark ? "day" : "night")}
          >
            {dark ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </HudButton>

          <HudButton
            label="Watch the rain (Esc to return)"
            onClick={() => setGaze(true)}
          >
            <Eye className="size-5" />
          </HudButton>

          {showPanelTrigger && <MobileRightPanel />}

          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/settings"
                  aria-label="Settings"
                  className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted"
                >
                  <Settings className="size-5" />
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
