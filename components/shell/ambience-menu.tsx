"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import {
  CloudDrizzle,
  CloudLightning,
  CloudMoonRain,
  CloudSun,
  Dices,
  type LucideIcon,
  Moon,
  Snowflake,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-now";
import type { Season, TimeOfDay, Weather } from "@/lib/scene-time";
import { useResolvedScene, useSceneStore } from "@/stores/scene-store";

import { RoomBanner, RoomControls } from "./room-controls";

const ICONS: Record<string, LucideIcon> = {
  drizzle: CloudDrizzle,
  storm: CloudLightning,
  snow: Snowflake,
  night: Moon,
  clear: Sun,
  cloudy: CloudSun,
  loading: CloudMoonRain,
};

/** The room's weather and time, as one little icon. */
function WeatherIcon() {
  const mounted = useMounted();
  const { weather, dark } = useResolvedScene();
  const key = !mounted ? "loading" : weather !== "clear" ? weather : dark ? "night" : "clear";
  const Icon = ICONS[key] ?? CloudSun;

  return <Icon className="size-[17px]" strokeWidth={1.7} />;
}

const pickOther = <T,>(items: T[], current: T) => {
  const others = items.filter((item) => item !== current);
  return others[Math.floor(Math.random() * others.length)];
};

/** A random time, season and weather, never quite the same as now. */
function useSurprise() {
  const resolved = useResolvedScene();

  return () => {
    const scene = useSceneStore.getState();
    scene.setTimeOfDay(pickOther<TimeOfDay>(["morning", "day", "evening", "night"], resolved.time));
    scene.setSeason(pickOther<Season>(["spring", "summer", "autumn", "winter"], resolved.season));
    scene.setWeather(pickOther<Weather>(["clear", "drizzle", "storm", "snow"], resolved.weather));
  };
}

export function AmbienceMenu() {
  const [open, setOpen] = useState(false);
  const surprise = useSurprise();

  // On small screens the menu covers the window: close it so you can watch.
  const watch = () => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-foreground/55 hover:text-foreground"
            aria-label="The room: time, season, weather and more"
          >
            <WeatherIcon />
          </Button>
        }
      />

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className="isolate z-50"
        >
          <Popover.Popup className="panel max-h-[min(85dvh,40rem)] w-[min(23rem,calc(100vw-1.5rem))] origin-(--transform-origin) overflow-y-auto p-3 text-sm outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <RoomBanner>
              <Popover.Title className="flex items-baseline gap-2 font-display text-[17px] text-white [text-shadow:0_1px_4px_rgb(0_0_0/0.35)]">
                The room
                <span className="font-sans text-[11px] text-white/75">へや</span>
              </Popover.Title>

              <button
                type="button"
                onClick={surprise}
                title="Surprise me: a random time, season and weather"
                aria-label="Surprise me"
                className="pointer-events-auto grid size-8 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-transform duration-500 hover:rotate-180"
              >
                <Dices className="size-4" strokeWidth={1.8} />
              </button>
            </RoomBanner>

            <div className="px-1 pt-4 pb-1">
              <RoomControls onHappen={watch} />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
