"use client";

import { type KeyboardEvent, type PointerEvent, type ReactNode, useRef, useState } from "react";
import {
  Check,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  Flower2,
  Lamp,
  Leaf,
  type LucideIcon,
  MapPin,
  Moon,
  Snowflake,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Volume2,
} from "lucide-react";

import { MOUSE_EVENT } from "@/components/scene/cat/mochi";
import { KNOCK_EVENT } from "@/components/scene/room-scene";
import { summonOutside } from "@/components/scene/sky-events";
import { useMounted } from "@/hooks/use-now";
import { useRoomUnlocks } from "@/hooks/use-room";
import { locate } from "@/lib/live-weather";
import { type Season, type TimeOfDay, type Weather, weatherLabels } from "@/lib/scene-time";
import { cn } from "@/lib/utils";
import { BUILT_IN_PRESETS, useMixerStore } from "@/stores/mixer-store";
import { useRoomStore } from "@/stores/room-store";
import { useResolvedScene, useSceneStore } from "@/stores/scene-store";

import { RoomPreview } from "./room-preview";

/* ------------------------------------------------------------------ */
/* Bits                                                                 */
/* ------------------------------------------------------------------ */

function Heading({ title, jp, children }: { title: string; jp: string; children?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground lowercase">
        {title} <span className="tracking-normal text-muted-foreground/70">· {jp}</span>
      </p>
      {children}
    </div>
  );
}

/** "Follow my clock" and friends: a small pill that lights up when on. */
function AutoPill({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors duration-300",
        on
          ? "bg-[color-mix(in_oklab,var(--mint)_22%,transparent)] text-foreground ring-1 ring-[color-mix(in_oklab,var(--mint)_35%,transparent)]"
          : "text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
      )}
    >
      <span className={cn("size-1.5 rounded-full transition-colors", on ? "bg-[var(--mint)]" : "bg-foreground/25")} />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Time of day: a sun that slides from dawn to night                    */
/* ------------------------------------------------------------------ */

const TIMES: Array<{ id: TimeOfDay; label: string; icon: LucideIcon }> = [
  { id: "morning", label: "Morning", icon: Sunrise },
  { id: "day", label: "Day", icon: Sun },
  { id: "evening", label: "Evening", icon: Sunset },
  { id: "night", label: "Night", icon: Moon },
];

function TimeDial() {
  const setting = useSceneStore((state) => state.timeOfDay);
  const setTimeOfDay = useSceneStore((state) => state.setTimeOfDay);
  const { time: resolved } = useResolvedScene();
  const mounted = useMounted();
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const auto = setting === "auto";
  const value = auto ? resolved : setting;
  const index = TIMES.findIndex((item) => item.id === value);
  const Icon = TIMES[index].icon;

  function pickAt(clientX: number) {
    const rect = track.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const next = TIMES[Math.round(ratio * (TIMES.length - 1))].id;

    if (next !== setting) {
      setTimeOfDay(next);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;

    if (step) {
      event.preventDefault();
      setTimeOfDay(TIMES[(index + step + TIMES.length) % TIMES.length].id);
    }
  }

  return (
    <section>
      <Heading title="Time of day" jp="じかん">
        <AutoPill on={auto} label="Follow my clock" onClick={() => setTimeOfDay(auto ? value : "auto")} />
      </Heading>

      <div
        ref={track}
        role="radiogroup"
        aria-label="Time of day"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          pickAt(event.clientX);
        }}
        onPointerMove={(event) => dragging.current && pickAt(event.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        className="relative mx-4 h-11 cursor-pointer touch-none rounded-full outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {/* The sky across the day */}
        <div
          aria-hidden="true"
          className="absolute inset-x-[-1rem] top-1/2 h-2.5 -translate-y-1/2 rounded-full shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)]"
          style={{ background: "linear-gradient(90deg, #f5c4a6, #8cc6f0 33%, #f3a06e 66%, #2c3a6e)" }}
        />

        {TIMES.map((item, position) => (
          <span
            key={item.id}
            role="radio"
            aria-checked={item.id === value}
            aria-label={item.label}
            className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
            style={{ left: `${(position / (TIMES.length - 1)) * 100}%` }}
          />
        ))}

        {mounted && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background text-foreground shadow-[0_6px_16px_-6px_rgb(0_0_0/0.45)] transition-[left] duration-500 ease-out",
              auto ? "outline-2 outline-offset-2 outline-[var(--mint)] outline-dashed" : "ring-2 ring-foreground/20"
            )}
            style={{ left: `${(index / (TIMES.length - 1)) * 100}%` }}
          >
            <Icon
              className="size-[18px]"
              strokeWidth={1.8}
              style={{ color: value === "night" ? "var(--lavender)" : value === "day" ? "var(--honey)" : "var(--ember)" }}
            />
          </span>
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-[11px]">
        {TIMES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTimeOfDay(item.id)}
            className={cn(
              "w-14 text-center transition-colors first:text-left last:text-right",
              item.id === value ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Season: four painted tiles                                           */
/* ------------------------------------------------------------------ */

const SEASONS: Array<{ id: Season; label: string; jp: string; icon: LucideIcon; paint: string; ink: string }> = [
  { id: "spring", label: "Spring", jp: "はる", icon: Flower2, paint: "linear-gradient(140deg, #fcd6e1, #cfe9c8)", ink: "#c2577a" },
  { id: "summer", label: "Summer", jp: "なつ", icon: Sun, paint: "linear-gradient(140deg, #c6e9f7, #a5d99c)", ink: "#2f7f8f" },
  { id: "autumn", label: "Autumn", jp: "あき", icon: Leaf, paint: "linear-gradient(140deg, #f9d3a4, #e9946a)", ink: "#a8471f" },
  { id: "winter", label: "Winter", jp: "ふゆ", icon: Snowflake, paint: "linear-gradient(140deg, #eef3fa, #c8d5ea)", ink: "#4f6f9c" },
];

function SeasonTiles() {
  const setting = useSceneStore((state) => state.season);
  const setSeason = useSceneStore((state) => state.setSeason);
  const { season: resolved } = useResolvedScene();
  const auto = setting === "auto";
  const value = auto ? resolved : setting;

  return (
    <section>
      <Heading title="Season" jp="きせつ">
        <AutoPill on={auto} label="Follow the calendar" onClick={() => setSeason(auto ? value : "auto")} />
      </Heading>

      <div role="radiogroup" aria-label="Season" className="grid grid-cols-4 gap-2">
        {SEASONS.map((item) => {
          const active = item.id === value;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSeason(item.id)}
              className={cn(
                "relative flex h-[4.6rem] flex-col items-center justify-center gap-1 rounded-2xl text-[#2b2a33] shadow-[inset_0_1px_0_rgb(255_255_255/0.5)] transition-all duration-300",
                active ? "scale-[1.03] outline-2 outline-offset-2" : "opacity-75 hover:scale-[1.02] hover:opacity-100",
                active && (auto ? "outline-dashed" : "outline-solid")
              )}
              style={{ background: item.paint, outlineColor: active ? item.ink : undefined }}
            >
              <Icon className={cn("size-5", active && "wx-bob")} strokeWidth={1.8} style={{ color: item.ink }} />
              <span className="text-[11px] font-medium">{item.label}</span>
              <span className="text-[9px] tracking-widest opacity-60">{item.jp}</span>
              {active && (
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full text-white shadow" style={{ background: item.ink }}>
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Weather: little animated tiles, and "live"                           */
/* ------------------------------------------------------------------ */

function WeatherTiles() {
  const weather = useSceneStore((state) => state.weather);
  const setWeather = useSceneStore((state) => state.setWeather);
  const live = useSceneStore((state) => state.liveWeather);
  const setLiveWeather = useSceneStore((state) => state.setLiveWeather);
  const { dark } = useResolvedScene();
  const [locating, setLocating] = useState(false);
  const [noLocation, setNoLocation] = useState(false);

  const tiles: Array<{ id: Weather | "live"; label: string; icon: LucideIcon; motion: string; color: string }> = [
    { id: "live", label: "Live", icon: MapPin, motion: "wx-hop", color: "var(--mint)" },
    { id: "clear", label: "Clear", icon: dark ? Moon : Sun, motion: dark ? "wx-bob" : "wx-spin", color: "var(--honey)" },
    { id: "drizzle", label: "Drizzle", icon: CloudDrizzle, motion: "wx-bob", color: "var(--sky)" },
    { id: "storm", label: "Storm", icon: CloudLightning, motion: "wx-flicker", color: "var(--lavender)" },
    { id: "snow", label: "Snow", icon: Snowflake, motion: "wx-spin", color: "var(--sky)" },
  ];

  async function pick(id: Weather | "live") {
    setNoLocation(false);

    if (id !== "live") {
      setWeather(id);
      return;
    }

    setLocating(true);

    try {
      setLiveWeather(true, await locate());
    } catch {
      setNoLocation(true);
    } finally {
      setLocating(false);
    }
  }

  const value = live ? "live" : weather;

  return (
    <section>
      <Heading title="Weather" jp="てんき" />

      <div role="radiogroup" aria-label="Weather" className="grid grid-cols-5 gap-1.5">
        {tiles.map((tile) => {
          const active = tile.id === value;
          const Icon = tile.icon;

          return (
            <button
              key={tile.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => void pick(tile.id)}
              className={cn(
                "flex h-[4.1rem] flex-col items-center justify-center gap-1.5 rounded-2xl text-[11px] ring-1 transition-all duration-300",
                active ? "text-foreground" : "bg-foreground/[0.04] text-muted-foreground ring-foreground/[0.07] hover:bg-foreground/[0.07] hover:text-foreground"
              )}
              style={
                active
                  ? {
                      background: `color-mix(in oklab, ${tile.color} 22%, transparent)`,
                      boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tile.color} 45%, transparent)`,
                    }
                  : undefined
              }
            >
              <Icon className={cn("size-5", active && tile.motion)} strokeWidth={1.7} style={active ? { color: tile.color } : undefined} />
              {tile.label}
            </button>
          );
        })}
      </div>

      {locating ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Finding the weather near you…</p>
      ) : noLocation ? (
        <p className="mt-2 text-[11px] leading-4 text-destructive">
          Couldn&apos;t get your location. You can allow it in your browser&apos;s site settings.
        </p>
      ) : (
        live && (
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
            Matching the weather near you: {weatherLabels[weather].label.toLowerCase()} right now.
            Uses your rough location, shared only with Open-Meteo.
          </p>
        )
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Moments: a whole scene (and its sounds) in one tap                   */
/* ------------------------------------------------------------------ */

type Moment = {
  label: string;
  emoji: string;
  time: TimeOfDay;
  season: Season | "auto";
  weather: Weather;
  mix?: string;
  then?: () => void;
};

const MOMENTS: Moment[] = [
  { label: "Rainy night study", emoji: "🌧️", time: "night", season: "auto", weather: "drizzle", mix: "rainy-study" },
  { label: "Snowy morning", emoji: "❄️", time: "morning", season: "winter", weather: "snow" },
  { label: "Spring afternoon", emoji: "🌸", time: "day", season: "spring", weather: "clear", mix: "morning" },
  { label: "Summer evening", emoji: "🎐", time: "evening", season: "summer", weather: "clear", mix: "summer-night" },
  { label: "Autumn storm", emoji: "⛈️", time: "evening", season: "autumn", weather: "storm", mix: "storm" },
  {
    label: "Starry night",
    emoji: "🌠",
    time: "night",
    season: "summer",
    weather: "clear",
    mix: "summer-night",
    then: () => window.setTimeout(() => summonOutside("star"), 1200),
  },
  { label: "By the fire", emoji: "🔥", time: "night", season: "winter", weather: "snow", mix: "fireside" },
  { label: "Café afternoon", emoji: "☕", time: "day", season: "auto", weather: "drizzle", mix: "cafe" },
];

const SKY: Record<TimeOfDay, string> = {
  morning: "linear-gradient(160deg, #f5c4a6, #bcd6ee)",
  day: "linear-gradient(160deg, #6fb2ea, #d3e9f7)",
  evening: "linear-gradient(160deg, #5e5294, #f3a06e)",
  night: "linear-gradient(160deg, #10173a, #3a4a86)",
};

function Moments() {
  const scene = useSceneStore();

  function apply(moment: Moment) {
    scene.setTimeOfDay(moment.time);
    scene.setSeason(moment.season);
    scene.setWeather(moment.weather);

    const preset = BUILT_IN_PRESETS.find((item) => item.id === moment.mix);
    if (preset) {
      useMixerStore.getState().applyMix(preset.mix);
    }

    moment.then?.();
  }

  const isCurrent = (moment: Moment) =>
    scene.timeOfDay === moment.time && scene.season === moment.season && scene.weather === moment.weather && !scene.liveWeather;

  return (
    <section>
      <Heading title="Moments" jp="ひととき" />

      <div className="grid grid-cols-2 gap-2">
        {MOMENTS.map((moment) => (
          <button
            key={moment.label}
            type="button"
            onClick={() => apply(moment)}
            className={cn(
              "group flex items-center gap-2.5 rounded-2xl p-1.5 pr-3 text-left text-[12px] ring-1 transition-all duration-300",
              isCurrent(moment) ? "bg-foreground/[0.08] ring-foreground/25" : "ring-foreground/[0.07] hover:bg-foreground/[0.05]"
            )}
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-xl text-base shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] transition-transform duration-300 group-hover:scale-105"
              style={{ background: SKY[moment.time] }}
            >
              {moment.emoji}
            </span>
            <span className="leading-tight text-foreground/85">{moment.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Little things: make something happen                                 */
/* ------------------------------------------------------------------ */

function LittleThings({ onHappen }: { onHappen?: () => void }) {
  const catName = useRoomStore((state) => state.catName.trim() || "Mochi");

  const things: Array<{ label: string; emoji: string; run: () => void }> = [
    { label: "A train", emoji: "🚃", run: () => summonOutside("train") },
    { label: "Birds", emoji: "🐦", run: () => summonOutside("birds") },
    { label: "Shooting star", emoji: "🌠", run: () => summonOutside("star") },
    { label: "Butterfly", emoji: "🦋", run: () => summonOutside("butterfly") },
    { label: "Fireworks", emoji: "🎆", run: () => window.dispatchEvent(new CustomEvent(KNOCK_EVENT, { detail: "firework" })) },
    { label: "Lightning", emoji: "⚡", run: () => window.dispatchEvent(new CustomEvent(KNOCK_EVENT, { detail: "lightning" })) },
    { label: "A gust", emoji: "🍃", run: () => window.dispatchEvent(new CustomEvent(KNOCK_EVENT, { detail: "gust" })) },
    { label: `A mouse for ${catName}`, emoji: "🐭", run: () => window.dispatchEvent(new Event(MOUSE_EVENT)) },
  ];

  return (
    <section>
      <Heading title="Make something happen" jp="できごと" />

      <div className="flex flex-wrap gap-1.5">
        {things.map((thing) => (
          <button
            key={thing.label}
            type="button"
            onClick={() => {
              thing.run();
              onHappen?.();
            }}
            className="chip group active:scale-90"
          >
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:scale-110">
              {thing.emoji}
            </span>
            {thing.label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Lights and little sounds                                             */
/* ------------------------------------------------------------------ */

function Toggles() {
  const sfxOn = useSceneStore((state) => state.sfxOn);
  const setSfxOn = useSceneStore((state) => state.setSfxOn);
  const lampOn = useSceneStore((state) => state.lampOn);
  const toggleLamp = useSceneStore((state) => state.toggleLamp);
  const starLamp = useRoomStore((state) => state.starLamp);
  const toggleStarLamp = useRoomStore((state) => state.toggleStarLamp);
  const hasStars = useRoomUnlocks().shows("stars");

  const toggles = [
    { label: "Desk lamp", icon: Lamp, on: lampOn, flip: toggleLamp, color: "var(--honey)" },
    ...(hasStars ? [{ label: "Star lamp", icon: Sparkles, on: starLamp, flip: toggleStarLamp, color: "var(--lavender)" }] : []),
    { label: "Little sounds", icon: Volume2, on: sfxOn, flip: () => setSfxOn(!sfxOn), color: "var(--sky)" },
  ];

  return (
    <section>
      <Heading title="Lights & little sounds" jp="あかり" />

      <div className={cn("grid gap-2", toggles.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {toggles.map((toggle) => {
          const Icon = toggle.icon;

          return (
            <button
              key={toggle.label}
              type="button"
              aria-pressed={toggle.on}
              onClick={toggle.flip}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2.5 text-[12px] ring-1 transition-all duration-300",
                toggle.on ? "text-foreground" : "text-muted-foreground ring-foreground/[0.07] hover:text-foreground"
              )}
              style={
                toggle.on
                  ? {
                      background: `color-mix(in oklab, ${toggle.color} 18%, transparent)`,
                      boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${toggle.color} 38%, transparent), 0 0 18px -6px ${toggle.color}`,
                    }
                  : undefined
              }
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.8} style={toggle.on ? { color: toggle.color } : undefined} />
              <span className="truncate">{toggle.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** The little window at the top: shows the choice, and knocks when tapped. */
function PreviewWindow({ onKnock }: { onKnock?: () => void }) {
  const { time, season, weather } = useResolvedScene();
  const mounted = useMounted();
  const labels = `${TIMES.find((item) => item.id === time)?.label} · ${SEASONS.find((item) => item.id === season)?.label} · ${weatherLabels[weather].label}`;

  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent(KNOCK_EVENT));
        onKnock?.();
      }}
      aria-label={`The view: ${labels}. Tap to knock on the window`}
      className="group relative block w-full overflow-hidden rounded-2xl shadow-[0_14px_30px_-18px_rgb(0_0_0/0.6)] ring-1 ring-foreground/10 transition-transform duration-300 active:scale-[0.99]"
    >
      {mounted ? <RoomPreview time={time} season={season} weather={weather} /> : <div className="aspect-[320/150]" />}
      <span className="absolute top-2.5 left-2.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
        {labels}
      </span>
      <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        <Cloud className="size-3" strokeWidth={2} />
        tap to knock
      </span>
    </button>
  );
}

/** Time, season, weather, moments, little events and lights for the room. */
export function RoomControls({ onHappen }: { onHappen?: () => void }) {
  return (
    <div className="space-y-6">
      <PreviewWindow onKnock={onHappen} />
      <TimeDial />
      <SeasonTiles />
      <WeatherTiles />
      <Moments />
      <LittleThings onHappen={onHappen} />
      <Toggles />
    </div>
  );
}
