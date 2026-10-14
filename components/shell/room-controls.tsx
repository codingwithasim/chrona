"use client";

import {
  Cloud,
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
  TreePine,
  Trees,
  Wand2,
} from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  type SeasonSetting,
  seasonLabels,
  type TimeSetting,
  timeLabels,
  type Weather,
  weatherLabels,
} from "@/lib/scene-time";
import { cn } from "@/lib/utils";
import { useSceneStore } from "@/stores/scene-store";

type Option<T extends string> = {
  value: T;
  label: string;
  jp: string;
  icon: LucideIcon;
};

const timeOptions: Option<TimeSetting>[] = [
  { value: "auto", ...timeLabels.auto, label: "Auto", icon: Wand2 },
  { value: "morning", ...timeLabels.morning, icon: Sunrise },
  { value: "day", ...timeLabels.day, icon: Sun },
  { value: "evening", ...timeLabels.evening, icon: Sunset },
  { value: "night", ...timeLabels.night, icon: Moon },
];

const seasonOptions: Option<SeasonSetting>[] = [
  { value: "auto", ...seasonLabels.auto, label: "Auto", icon: Wand2 },
  { value: "spring", ...seasonLabels.spring, icon: Flower2 },
  { value: "summer", ...seasonLabels.summer, icon: Trees },
  { value: "autumn", ...seasonLabels.autumn, icon: Leaf },
  { value: "winter", ...seasonLabels.winter, icon: TreePine },
];

const weatherOptions: Option<Weather>[] = [
  { value: "clear", ...weatherLabels.clear, icon: Cloud },
  { value: "drizzle", ...weatherLabels.drizzle, icon: CloudDrizzle },
  { value: "storm", ...weatherLabels.storm, icon: CloudLightning },
  { value: "snow", ...weatherLabels.snow, icon: Snowflake },
];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  color,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>

      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={option.label}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 transition-all",
                active
                  ? "border-black/10 text-[#1b1530] shadow-cel-sm"
                  : "border-border hover:bg-muted"
              )}
              style={active ? { backgroundColor: color } : undefined}
            >
              <Icon className="size-4" />
              <span className="w-full truncate text-center text-[10px] font-bold">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Time, season, weather and sound controls for the room. */
export function RoomControls() {
  const timeOfDay = useSceneStore((state) => state.timeOfDay);
  const setTimeOfDay = useSceneStore((state) => state.setTimeOfDay);
  const season = useSceneStore((state) => state.season);
  const setSeason = useSceneStore((state) => state.setSeason);
  const weather = useSceneStore((state) => state.weather);
  const setWeather = useSceneStore((state) => state.setWeather);

  const sfxOn = useSceneStore((state) => state.sfxOn);
  const setSfxOn = useSceneStore((state) => state.setSfxOn);
  const lampOn = useSceneStore((state) => state.lampOn);
  const toggleLamp = useSceneStore((state) => state.toggleLamp);

  return (
    <div className="space-y-5">
      <Segmented
        label="Time of day · じかん"
        options={timeOptions}
        value={timeOfDay}
        onChange={setTimeOfDay}
        color="var(--honey)"
      />

      <Segmented
        label="Season · きせつ"
        options={seasonOptions}
        value={season}
        onChange={setSeason}
        color="var(--ember)"
      />

      <Segmented
        label="Weather · てんき"
        options={weatherOptions}
        value={weather}
        onChange={setWeather}
        color="var(--sky)"
      />

      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 text-[13px]">
          <span className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" strokeWidth={1.7} />
            Sound effects
          </span>
          <Switch checked={sfxOn} onCheckedChange={setSfxOn} />
        </label>

        <label className="flex items-center justify-between gap-3 text-[13px]">
          <span className="flex items-center gap-2">
            <Lamp className="size-4 text-muted-foreground" strokeWidth={1.7} />
            Desk lamp
          </span>
          <Switch checked={lampOn} onCheckedChange={toggleLamp} />
        </label>
      </div>
    </div>
  );
}
