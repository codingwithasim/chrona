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

export function AmbienceMenu() {
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
