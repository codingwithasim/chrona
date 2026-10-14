"use client";

import { useState } from "react";
import { Check, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  previewSound,
  SOUND_CATEGORIES,
  SOUNDS,
  type SoundId,
} from "@/lib/sounds";
import { useSettingsStore } from "@/stores/settings-store";

type SoundPickerProps = {
  value: SoundId;
  onChange: (sound: SoundId) => void;
  /** Two columns instead of three, for narrow panels. */
  compact?: boolean;
};

export function SoundPicker({ value, onChange, compact }: SoundPickerProps) {
  const toneVolume = useSettingsStore((state) => state.toneVolume);

  const [category, setCategory] = useState(
    () =>
      SOUND_CATEGORIES.find((item) => item.sounds.includes(value))?.id ??
      SOUND_CATEGORIES[0].id
  );

  const active =
    SOUND_CATEGORIES.find((item) => item.id === category) ??
    SOUND_CATEGORIES[0];

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Sound categories"
        className="flex flex-wrap gap-1.5"
      >
        {SOUND_CATEGORIES.map((item) => {
          const selected = item.id === category;
          const holdsValue = item.sounds.includes(value);

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setCategory(item.id)}
              className={cn(
                "relative rounded-full px-3 py-1 text-xs transition-all duration-300",
                selected
                  ? "bg-foreground/[0.08] text-foreground"
                  : "text-muted-foreground/80 hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              {item.label}
              <span className="ml-1 font-normal opacity-70">{item.jp}</span>
              {holdsValue && !selected && (
                <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary/70" />
              )}
            </button>
          );
        })}
      </div>

      <div
        role="radiogroup"
        aria-label={`${active.label} sounds`}
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
        )}
      >
        {active.sounds.map((id) => {
          const sound = SOUNDS[id];
          const selected = id === value;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                onChange(id);
                previewSound(id, toneVolume);
              }}
              className={cn(
                "group flex items-center gap-2.5 rounded-2xl px-3 py-2 text-left transition-all duration-300",
                selected
                  ? "bg-foreground/[0.08]"
                  : "bg-foreground/[0.025] hover:bg-foreground/[0.05]"
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-300",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/5 text-muted-foreground group-hover:text-foreground"
                )}
              >
                {selected ? (
                  <Check className="size-3.5" strokeWidth={2.2} />
                ) : (
                  <Play className="size-3 translate-x-px" fill="currentColor" />
                )}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-[13px]">
                  {sound.name}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {sound.jp}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
