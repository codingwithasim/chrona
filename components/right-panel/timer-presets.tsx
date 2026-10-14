"use client";

import { type FormEvent, useState } from "react";
import { Hourglass, Plus, X, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatClock } from "@/components/shell/digits";
import { useTimerStore } from "@/stores/timer-store";

export function TimerPresets() {
  const setDuration = useTimerStore((state) => state.setDuration);
  const addTime = useTimerStore((state) => state.addTime);
  const presets = useTimerStore((state) => state.presets);
  const addPreset = useTimerStore((state) => state.addPreset);
  const removePreset = useTimerStore((state) => state.removePreset);

  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState(5);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = label.trim();

    if (!trimmed || minutes <= 0) {
      return;
    }

    addPreset({
      id: crypto.randomUUID(),
      label: trimmed,
      duration: Math.round(minutes * 60),
    });

    setLabel("");
    setMinutes(5);
    setCreating(false);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <Hourglass className="size-4 text-ember" />
          Presets
        </p>

        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <div key={preset.id} className="group relative">
              <button
                type="button"
                onClick={() => setDuration(preset.duration, preset.label)}
                className="flex w-full flex-col items-start rounded-xl border border-border bg-card/70 px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:border-ember hover:shadow-cel-sm"
              >
                <span className="truncate text-sm font-bold">
                  {preset.label}
                </span>
                <span className="font-display text-xs text-muted-foreground">
                  {formatClock(preset.duration)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => removePreset(preset.id)}
                aria-label={`Remove ${preset.label} preset`}
                className="absolute -top-1.5 -right-1.5 hidden size-5 place-items-center rounded-full border border-black/10 bg-card text-foreground group-focus-within:grid group-hover:grid"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>

        {creating ? (
          <form
            onSubmit={handleSave}
            className="space-y-3 rounded-2xl border border-dashed border-border p-3"
          >
            <Input
              autoFocus
              placeholder="Preset name (e.g. Tea)"
              value={label}
              maxLength={24}
              onChange={(event) => setLabel(event.target.value)}
            />

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Input
                type="number"
                min={1}
                max={600}
                value={minutes}
                onChange={(event) =>
                  setMinutes(Number(event.target.value))
                }
                className="w-24"
              />
              minutes
            </label>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>

              <Button type="submit" size="sm">
                Save
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="ghost"
            className="w-full border border-dashed border-border text-muted-foreground"
            onClick={() => setCreating(true)}
          >
            <Plus />
            New preset
          </Button>
        )}
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <Zap className="size-4 text-honey" />
          Quick add
        </p>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addTime(30)}
          >
            +30 sec
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => addTime(60)}
          >
            +1 min
          </Button>
        </div>
      </section>
    </div>
  );
}
