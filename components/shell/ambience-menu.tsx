"use client";

import { Popover } from "@base-ui/react/popover";
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudMoonRain,
  Lamp,
  Sparkles,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  type RainLevel,
  rainLabels,
  useSceneStore,
} from "@/stores/scene-store";

const weatherIcons: Record<RainLevel, typeof Cloud> = {
  off: Cloud,
  light: CloudDrizzle,
  heavy: CloudLightning,
};

export function AmbienceMenu() {
  const rain = useSceneStore((state) => state.rain);
  const setRain = useSceneStore((state) => state.setRain);
  const soundOn = useSceneStore((state) => state.soundOn);
  const setSoundOn = useSceneStore((state) => state.setSoundOn);
  const volume = useSceneStore((state) => state.volume);
  const setVolume = useSceneStore((state) => state.setVolume);
  const sfxOn = useSceneStore((state) => state.sfxOn);
  const setSfxOn = useSceneStore((state) => state.setSfxOn);
  const lampOn = useSceneStore((state) => state.lampOn);
  const toggleLamp = useSceneStore((state) => state.toggleLamp);

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Ambience settings"
          >
            <CloudMoonRain className="size-5" />
          </Button>
        }
      />

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={10}
          className="isolate z-50"
        >
          <Popover.Popup className="panel w-72 origin-(--transform-origin) p-4 text-sm outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <Popover.Title className="font-display text-base">
              Ambience
              <span className="ml-2 font-sans text-xs font-bold text-muted-foreground">
                ふんいき
              </span>
            </Popover.Title>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Weather
              </p>

              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(rainLabels) as RainLevel[]).map(
                  (level) => {
                    const Icon = weatherIcons[level];
                    const active = rain === level;

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setRain(level)}
                        aria-pressed={active}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2 transition-all",
                          active
                            ? "border-ink bg-sky text-[#1b1530] shadow-cel-sm"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <Icon className="size-5" />
                        <span className="text-xs font-bold">
                          {rainLabels[level].label}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {rainLabels[level].jp}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  <Volume2 className="size-4 text-primary" />
                  Rain sounds
                </span>
                <Switch
                  checked={soundOn}
                  onCheckedChange={setSoundOn}
                />
              </label>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                aria-label="Rain volume"
                onChange={(event) =>
                  setVolume(Number(event.target.value))
                }
                disabled={!soundOn}
                className="w-full accent-(--primary) disabled:opacity-40"
              />

              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles className="size-4 text-lavender" />
                  Sound effects
                </span>
                <Switch
                  checked={sfxOn}
                  onCheckedChange={setSfxOn}
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  <Lamp className="size-4 text-honey" />
                  Desk lamp
                </span>
                <Switch
                  checked={lampOn}
                  onCheckedChange={toggleLamp}
                />
              </label>
            </div>

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
