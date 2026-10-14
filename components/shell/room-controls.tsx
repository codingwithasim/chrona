"use client";

import { useState } from "react";
import {
  CloudDrizzle,
  CloudLightning,
  Flower2,
  Lamp,
  Leaf,
  type LucideIcon,
  Moon,
  Snowflake,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  TreeDeciduous,
} from "lucide-react";

import { MOUSE_EVENT } from "@/components/scene/cat/mochi";
import { KNOCK_EVENT } from "@/components/scene/room-scene";
import { summonOutside } from "@/components/scene/sky-events";
import { Switch } from "@/components/ui/switch";
import { useMounted } from "@/hooks/use-now";
import { locate } from "@/lib/live-weather";
import {
  type Season,
  seasonLabels,
  type TimeOfDay,
  timeLabels,
  type Weather,
  weatherLabels,
} from "@/lib/scene-time";
import { cn } from "@/lib/utils";
import { useRoomStore } from "@/stores/room-store";
import { useResolvedScene, useSceneStore } from "@/stores/scene-store";

import { RoomPreview } from "./room-preview";

/* ------------------------------------------------------------------ */
/* One row: a name and its current value, then a strip of small icons  */
/* ------------------------------------------------------------------ */

type Choice<T extends string> = { id: T; label: string; icon: LucideIcon; color: string };

function Row<T extends string>({
  title,
  status,
  choices,
  value,
  onPick,
  auto,
}: {
  title: string;
  status: string;
  choices: Choice<T>[];
  /** The highlighted choice (the resolved one while on auto). */
  value: T;
  onPick: (id: T) => void;
  auto: { label: string; on: boolean; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[13px] text-foreground/90">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{status}</p>
      </div>

      <div role="radiogroup" aria-label={title} className="flex shrink-0 items-center gap-0.5 rounded-full bg-foreground/[0.05] p-0.5">
        <button
          type="button"
          aria-pressed={auto.on}
          onClick={auto.onClick}
          className={cn(
            "h-8 rounded-full px-2.5 text-[11px] transition-colors duration-300",
            auto.on ? "bg-foreground/[0.12] text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {auto.label}
        </button>

        {choices.map((choice) => {
          const active = choice.id === value;
          const Icon = choice.icon;

          return (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={choice.label}
              title={choice.label}
              onClick={() => onPick(choice.id)}
              className={cn(
                "grid size-8 place-items-center rounded-full transition-all duration-300",
                active && !auto.on && "bg-foreground/[0.12]",
                !active && "text-foreground/45 hover:text-foreground"
              )}
            >
              <Icon className="size-4" strokeWidth={1.8} style={active ? { color: choice.color } : undefined} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TIMES: Choice<TimeOfDay>[] = [
  { id: "morning", label: "Morning", icon: Sunrise, color: "var(--ember)" },
  { id: "day", label: "Day", icon: Sun, color: "var(--honey)" },
  { id: "evening", label: "Evening", icon: Sunset, color: "var(--ember)" },
  { id: "night", label: "Night", icon: Moon, color: "var(--lavender)" },
];

const SEASONS: Choice<Season>[] = [
  { id: "spring", label: "Spring", icon: Flower2, color: "#e58fae" },
  { id: "summer", label: "Summer", icon: TreeDeciduous, color: "var(--mint)" },
  { id: "autumn", label: "Autumn", icon: Leaf, color: "var(--ember)" },
  { id: "winter", label: "Winter", icon: Snowflake, color: "var(--sky)" },
];

/* ------------------------------------------------------------------ */

/** The slim sky banner at the top: the view right now. Tap to knock. */
export function RoomBanner({ children }: { children?: React.ReactNode }) {
  const { time, season, weather } = useResolvedScene();
  const mounted = useMounted();

  return (
    <div className="relative h-[4.5rem] overflow-hidden rounded-2xl ring-1 ring-foreground/10">
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent(KNOCK_EVENT))}
        title="Knock on the window"
        aria-label="Knock on the window"
        className="absolute inset-0"
      >
        {mounted && <RoomPreview time={time} season={season} weather={weather} framed={false} className="h-full" />}
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/5 to-transparent" />
      </button>
      <div className="pointer-events-none relative flex h-full items-center justify-between px-4">{children}</div>
    </div>
  );
}

/** Time, season and weather for the room, a few things to make happen, and the lamp. */
export function RoomControls({ onHappen }: { onHappen?: () => void }) {
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const setTimeOfDay = useSceneStore((state) => state.setTimeOfDay);
  const season = useSceneStore((state) => state.season);
  const setSeason = useSceneStore((state) => state.setSeason);
  const weather = useSceneStore((state) => state.weather);
  const setWeather = useSceneStore((state) => state.setWeather);
  const live = useSceneStore((state) => state.liveWeather);
  const setLiveWeather = useSceneStore((state) => state.setLiveWeather);
  const lampOn = useSceneStore((state) => state.lampOn);
  const toggleLamp = useSceneStore((state) => state.toggleLamp);
  const sfxOn = useSceneStore((state) => state.sfxOn);
  const setSfxOn = useSceneStore((state) => state.setSfxOn);
  const catName = useRoomStore((state) => state.catName.trim() || "Mochi");
  const resolved = useResolvedScene();

  const [locating, setLocating] = useState(false);
  const [noLocation, setNoLocation] = useState(false);

  async function goLive() {
    setNoLocation(false);
    setLocating(true);

    try {
      setLiveWeather(true, await locate());
    } catch {
      setNoLocation(true);
    } finally {
      setLocating(false);
    }
  }

  const weathers: Choice<Weather>[] = [
    { id: "clear", label: "Clear", icon: resolved.dark ? Moon : Sun, color: "var(--honey)" },
    { id: "drizzle", label: "Drizzle", icon: CloudDrizzle, color: "var(--sky)" },
    { id: "storm", label: "Storm", icon: CloudLightning, color: "var(--lavender)" },
    { id: "snow", label: "Snow", icon: Snowflake, color: "var(--sky)" },
  ];

  const knock = (detail: string) => () => window.dispatchEvent(new CustomEvent(KNOCK_EVENT, { detail }));
  const happenings: Array<{ label: string; emoji: string; run: () => void }> = [
    { label: "A train", emoji: "🚃", run: () => summonOutside("train") },
    { label: "Birds", emoji: "🐦", run: () => summonOutside("birds") },
    { label: "A shooting star", emoji: "🌠", run: () => summonOutside("star") },
    { label: "Fireworks", emoji: "🎆", run: knock("firework") },
    { label: "Lightning", emoji: "⚡", run: knock("lightning") },
    { label: `A mouse for ${catName}`, emoji: "🐭", run: () => window.dispatchEvent(new Event(MOUSE_EVENT)) },
  ];

  return (
    <div className="space-y-4">
      <Row
        title="Time of day"
        status={timeOfDay === "auto" ? `${timeLabels[resolved.time].label}, by your clock` : timeLabels[timeOfDay].label}
        choices={TIMES}
        value={resolved.time}
        onPick={setTimeOfDay}
        auto={{ label: "Auto", on: timeOfDay === "auto", onClick: () => setTimeOfDay(timeOfDay === "auto" ? resolved.time : "auto") }}
      />

      <Row
        title="Season"
        status={season === "auto" ? `${seasonLabels[resolved.season].label}, by the calendar` : seasonLabels[season].label}
        choices={SEASONS}
        value={resolved.season}
        onPick={setSeason}
        auto={{ label: "Auto", on: season === "auto", onClick: () => setSeason(season === "auto" ? resolved.season : "auto") }}
      />

      <Row
        title="Weather"
        status={
          locating
            ? "Finding the weather near you…"
            : noLocation
              ? "Couldn't get your location"
              : live
                ? `${weatherLabels[weather].label}, like outside`
                : weatherLabels[weather].label
        }
        choices={weathers}
        value={weather}
        onPick={setWeather}
        auto={{ label: "Live", on: live, onClick: () => (live ? setWeather(weather) : void goLive()) }}
      />

      {live && (
        <p className="-mt-2 text-[10.5px] leading-4 text-muted-foreground/80">
          Uses your rough location, shared only with Open-Meteo.
        </p>
      )}

      <div className="border-t border-foreground/[0.07] pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] text-foreground/90">Make it happen</p>
          <div className="flex gap-0.5">
            {happenings.map((thing) => (
              <button
                key={thing.label}
                type="button"
                title={thing.label}
                aria-label={thing.label}
                onClick={() => {
                  thing.run();
                  onHappen?.();
                }}
                className="grid size-8 place-items-center rounded-full text-[15px] transition-transform duration-200 hover:scale-115 hover:bg-foreground/[0.06] active:scale-90"
              >
                {thing.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 border-t border-foreground/[0.07] pt-4 text-[13px]">
        <label className="flex items-center gap-2">
          <Switch checked={lampOn} onCheckedChange={toggleLamp} />
          <Lamp className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
          Desk lamp
        </label>
        <label className="flex items-center gap-2">
          <Switch checked={sfxOn} onCheckedChange={setSfxOn} />
          <Sparkles className="size-3.5 text-muted-foreground" strokeWidth={1.8} />
          Little sounds
        </label>
      </div>
    </div>
  );
}
