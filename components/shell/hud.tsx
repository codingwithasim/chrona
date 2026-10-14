"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  CloudMoonRain,
  Eye,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";

import { MobileRightPanel } from "@/components/right-panel/mobile-right-panel";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMounted, useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";
import { useSceneStore } from "@/stores/scene-store";

import { AmbienceMenu } from "./ambience-menu";

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
            className="rounded-full"
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
      aria-label={
        hour24
          ? "Switch to 12-hour time"
          : "Switch to 24-hour time"
      }
      className="hidden h-9 min-w-24 items-center justify-center rounded-full px-3 font-display text-sm tabular-nums transition-colors hover:bg-muted sm:flex"
    >
      {time}
    </button>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5",
        className
      )}
    >
      <span className="grid size-10 -rotate-3 place-items-center rounded-xl border-2 border-ink bg-primary text-primary-foreground shadow-cel transition-transform group-hover:rotate-3">
        <CloudMoonRain className="size-5" strokeWidth={2.4} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl cel-text">
          Chrona
        </span>
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
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();

  const soundOn = useSceneStore((state) => state.soundOn);
  const setSoundOn = useSceneStore((state) => state.setSoundOn);
  const setGaze = useSceneStore((state) => state.setGaze);

  const night = mounted && resolvedTheme === "dark";

  return (
    <header
      data-ui
      className="relative z-20 flex h-18 shrink-0 items-center justify-between gap-2 px-3 sm:px-5"
    >
      <Logo />

      <div className="panel flex items-center gap-0.5 rounded-full p-1">
        <ClockChip />

        <AmbienceMenu />

        <HudButton
          label={soundOn ? "Mute rain" : "Play rain sounds"}
          onClick={() => setSoundOn(!soundOn)}
        >
          {soundOn ? (
            <Volume2 className="size-5" />
          ) : (
            <VolumeX className="size-5" />
          )}
        </HudButton>

        <HudButton
          label={night ? "Switch to a rainy afternoon" : "Switch to night"}
          onClick={() => setTheme(night ? "light" : "dark")}
        >
          {night ? (
            <Moon className="size-5" />
          ) : (
            <Sun className="size-5" />
          )}
        </HudButton>

        <HudButton
          label="Watch the rain (Esc to return)"
          onClick={() => setGaze(true)}
        >
          <Eye className="size-5" />
        </HudButton>

        {showPanelTrigger && <MobileRightPanel />}
      </div>
    </header>
  );
}
