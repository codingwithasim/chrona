"use client";

import { type CSSProperties, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import {
  AudioWaveform,
  Bird,
  Bug,
  CloudLightning,
  CloudRain,
  Coffee,
  Flame,
  type LucideIcon,
  Moon,
  Volume2,
  VolumeX,
  Wind,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  BUILT_IN_PRESETS,
  type Channel,
  CHANNEL_INFO,
  CHANNELS,
  sameMix,
  useMixerStore,
} from "@/stores/mixer-store";
import { useSceneStore } from "@/stores/scene-store";

const ICONS: Record<Channel, LucideIcon> = {
  rain: CloudRain,
  thunder: CloudLightning,
  wind: Wind,
  birds: Bird,
  cicadas: Bug,
  crickets: Moon,
  fire: Flame,
  cafe: Coffee,
  brown: AudioWaveform,
};

/** A thin, calm range slider. */
export function CalmRange({
  value,
  onChange,
  label,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  className?: string;
}) {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={value}
      aria-label={label}
      onChange={(event) => onChange(Number(event.target.value))}
      className={cn("calm-range w-full", className)}
      style={{ "--fill": `${Math.round(value * 100)}%` } as CSSProperties}
    />
  );
}

function Pill({
  active,
  onClick,
  children,
  onRemove,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span className="group relative">
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "rounded-full px-3 py-1 text-xs transition-colors duration-300",
          active
            ? "bg-foreground/[0.09] text-foreground"
            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
        )}
      >
        {children}
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label="Delete this mix"
          onClick={onRemove}
          className="absolute -top-1 -right-1 hidden size-4 place-items-center rounded-full bg-foreground/10 text-foreground/70 group-hover:grid hover:bg-foreground/20"
        >
          <X className="size-2.5" />
        </button>
      )}
    </span>
  );
}

export function SoundMixer() {
  const soundOn = useSceneStore((state) => state.soundOn);
  const setSoundOn = useSceneStore((state) => state.setSoundOn);
  const volume = useSceneStore((state) => state.volume);
  const setVolume = useSceneStore((state) => state.setVolume);

  const follow = useMixerStore((state) => state.follow);
  const mix = useMixerStore((state) => state.mix);
  const presets = useMixerStore((state) => state.presets);
  const setFollow = useMixerStore((state) => state.setFollow);
  const setLevel = useMixerStore((state) => state.setLevel);
  const applyMix = useMixerStore((state) => state.applyMix);
  const savePreset = useMixerStore((state) => state.savePreset);
  const deletePreset = useMixerStore((state) => state.deletePreset);

  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  // Touching the mixer means you want to hear it.
  const listen = () => {
    if (!soundOn) {
      setSoundOn(true);
    }
  };

  const allPresets = [...BUILT_IN_PRESETS, ...presets];
  const matches = allPresets.some((preset) => sameMix(preset.mix, mix));

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-foreground/55 hover:text-foreground"
            aria-label="Sounds: rain, café, fireplace and more"
          >
            {soundOn ? (
              <Volume2 className="size-[17px]" strokeWidth={1.7} />
            ) : (
              <VolumeX className="size-[17px]" strokeWidth={1.7} />
            )}
          </Button>
        }
      />

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={10} collisionPadding={12} className="isolate z-50">
          <Popover.Popup className="panel max-h-[min(82dvh,44rem)] w-[min(21rem,calc(100vw-1.5rem))] origin-(--transform-origin) overflow-y-auto p-4 text-sm outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <div className="flex items-center justify-between gap-3">
              <Popover.Title className="text-[13px] font-medium">
                Sounds
                <span className="ml-2 text-[11px] font-normal text-muted-foreground/70">おと</span>
              </Popover.Title>
              <Switch checked={soundOn} onCheckedChange={setSoundOn} aria-label="Play ambient sounds" />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Volume2 className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.7} />
              <CalmRange
                label="Volume"
                value={volume}
                onChange={(value) => {
                  setVolume(value);
                  listen();
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-1">
              <Pill
                active={follow}
                onClick={() => {
                  setFollow(true);
                  listen();
                }}
              >
                Follow the room
              </Pill>
              {allPresets.map((preset) => (
                <Pill
                  key={preset.id}
                  active={!follow && sameMix(preset.mix, mix)}
                  onClick={() => {
                    applyMix(preset.mix);
                    listen();
                  }}
                  onRemove={preset.id.startsWith("mine-") ? () => deletePreset(preset.id) : undefined}
                >
                  {preset.name}
                </Pill>
              ))}
            </div>

            <ul className={cn("mt-4 space-y-2.5 transition-opacity duration-300", follow && "opacity-55")}>
              {CHANNELS.map((channel) => {
                const Icon = ICONS[channel];

                return (
                  <li key={channel} className="flex items-center gap-3">
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                    <span className="w-20 shrink-0 text-xs text-foreground/75">{CHANNEL_INFO[channel].label}</span>
                    <CalmRange
                      label={CHANNEL_INFO[channel].label}
                      value={mix[channel]}
                      onChange={(value) => {
                        setLevel(channel, value);
                        listen();
                      }}
                    />
                  </li>
                );
              })}
            </ul>

            {follow ? (
              <p className="mt-4 text-[11px] leading-5 text-muted-foreground/80">
                Following the room: rain when it rains, crickets at night.
                Move any slider to make your own mix.
              </p>
            ) : naming ? (
              <form
                className="mt-4 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  savePreset(name);
                  setName("");
                  setNaming(false);
                }}
              >
                <input
                  autoFocus
                  value={name}
                  maxLength={24}
                  placeholder="Name this mix"
                  onChange={(event) => setName(event.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 text-xs outline-none focus:border-foreground/25"
                />
                <Button type="submit" size="sm" className="h-8 rounded-full px-3">
                  Save
                </Button>
              </form>
            ) : (
              !matches && (
                <button
                  type="button"
                  onClick={() => setNaming(true)}
                  className="mt-4 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Save this mix
                </button>
              )
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
