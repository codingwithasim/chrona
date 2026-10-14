"use client";

import { Popover } from "@base-ui/react/popover";
import {
  CloudDrizzle,
  CloudLightning,
  CloudMoonRain,
  CloudSun,
  type LucideIcon,
  Moon,
  Snowflake,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-now";
import { useResolvedScene } from "@/stores/scene-store";

import { RoomControls } from "./room-controls";

/** The room's weather and time, as one little icon. */
function useWeatherIcon(): LucideIcon {
  const mounted = useMounted();
  const { weather, dark } = useResolvedScene();

  if (!mounted) {
    return CloudMoonRain;
  }

  if (weather === "drizzle") return CloudDrizzle;
  if (weather === "storm") return CloudLightning;
  if (weather === "snow") return Snowflake;
  return dark ? Moon : weather === "clear" ? Sun : CloudSun;
}

export function AmbienceMenu() {
  const Icon = useWeatherIcon();

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-foreground/55 hover:text-foreground"
            aria-label="Room settings: time, season, weather and sound"
          >
            <Icon className="size-[17px]" strokeWidth={1.7} />
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
          <Popover.Popup className="panel max-h-[min(80dvh,40rem)] w-[min(22rem,calc(100vw-1.5rem))] origin-(--transform-origin) overflow-y-auto p-4 text-sm outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <Popover.Title className="mb-4 font-display text-base">
              The room
              <span className="ml-2 font-sans text-xs font-bold text-muted-foreground">
                へや
              </span>
            </Popover.Title>

            <RoomControls />

            <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
              Psst… almost everything in the room reacts when you click
              it. Try the cat, the window and the little ghost doll.
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
