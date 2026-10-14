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
                "relative rounded-full border-2 px-3 py-1 text-xs font-bold transition-all",
                selected
                  ? "border-ink bg-lavender text-[#1b1530] shadow-cel-sm"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {item.label}
              <span className="ml-1 font-normal opacity-70">{item.jp}</span>
              {holdsValue && !selected && (
                <span className="absolute -top-1 -right-1 size-2.5 rounded-full border border-ink bg-primary" />
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
                "group flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left transition-all",
                selected
                  ? "border-ink bg-primary/15 shadow-cel-sm"
                  : "border-border bg-card/50 hover:-translate-y-0.5 hover:border-primary/60"
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
                  selected
                    ? "border-ink bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground group-hover:text-primary"
                )}
              >
                {selected ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : (
                  <Play className="size-3 translate-x-px" fill="currentColor" />
                )}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">
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
