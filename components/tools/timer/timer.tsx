"use client";

import { type FormEvent, useState } from "react";
import { Pencil } from "lucide-react";

import { Digits, formatClock } from "@/components/shell/digits";
import { ProgressRing } from "@/components/shell/progress-ring";
import { ToolFrame } from "@/components/shell/tool-frame";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type TimerStatus, useTimerStore } from "@/stores/timer-store";

import { TimerControls } from "./timer-controls";

const statusLabels: Record<TimerStatus, string> = {
  idle: "READY · じゅんび",
  running: "COUNTING · カウント中",
  paused: "PAUSED · ひとやすみ",
  finished: "DONE · おわり",
};

function DurationEditor({
  initial,
  onDone,
}: {
  initial: number;
  onDone: () => void;
}) {
  const setDuration = useTimerStore((state) => state.setDuration);

  const [hours, setHours] = useState(Math.floor(initial / 3600));
  const [minutes, setMinutes] = useState(Math.floor((initial % 3600) / 60));
  const [seconds, setSeconds] = useState(initial % 60);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const total = hours * 3600 + minutes * 60 + seconds;

    if (total > 0) {
      setDuration(total);
    }

    onDone();
  }

  const fields = [
    { label: "hours", value: hours, set: setHours, max: 23 },
    { label: "min", value: minutes, set: setMinutes, max: 59 },
    { label: "sec", value: seconds, set: setSeconds, max: 59 },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed border-border p-4"
    >
      <div className="flex items-end gap-2">
        {fields.map((field, index) => (
          <div key={field.label} className="flex items-end gap-2">
            {index > 0 && (
              <span className="pb-2 font-display text-2xl text-muted-foreground">
                :
              </span>
            )}
            <label className="flex flex-col items-center gap-1">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={field.max}
                value={field.value}
                autoFocus={index === 1}
                onChange={(event) =>
                  field.set(
                    Math.min(
                      field.max,
                      Math.max(0, Math.floor(Number(event.target.value) || 0))
                    )
                  )
                }
                className="h-14 w-18 text-center font-display text-2xl"
              />
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                {field.label}
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Set timer
        </Button>
      </div>
    </form>
  );
}

function InlinePresets() {
  const presets = useTimerStore((state) => state.presets);
  const setDuration = useTimerStore((state) => state.setDuration);

  return (
    <div className="flex max-w-md flex-wrap justify-center gap-1.5">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => setDuration(preset.duration, preset.label)}
          className="rounded-full px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
        >
          {preset.label}
          <span className="ml-1.5 font-display font-normal text-muted-foreground">
            {formatClock(preset.duration)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function TimerTool() {
  const duration = useTimerStore((state) => state.duration);
  const remaining = useTimerStore((state) => state.remaining);
  const status = useTimerStore((state) => state.status);
  const label = useTimerStore((state) => state.label);

  const [editing, setEditing] = useState(false);

  const toggle = useTimerStore((state) => state.toggle);
  const reset = useTimerStore((state) => state.reset);

  useShortcuts({ space: toggle, r: reset });

  const progress = duration > 0 ? (duration - remaining) / duration : 0;
  const canEdit = status !== "running";

  return (
    <ToolFrame
      href="/timer"
      placement="side"
      actions={
        canEdit && !editing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil />
            Set time
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col items-center gap-7">
        {editing && canEdit ? (
          <DurationEditor
            initial={duration}
            onDone={() => setEditing(false)}
          />
        ) : (
          <ProgressRing
            value={progress}
            color="var(--ember)"
            className="w-[min(76vw,20rem)]"
          >
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => setEditing(true)}
              aria-label="Set timer duration"
              className="flex flex-col items-center gap-2 rounded-3xl p-2 enabled:cursor-pointer"
            >
              <span className="text-[11px] font-bold tracking-[0.2em] text-muted-foreground">
                {statusLabels[status]}
              </span>

              <Digits
                value={formatClock(remaining)}
                className="cel-text text-[clamp(2.6rem,12vw,4.1rem)]"
              />

              <span className="text-xs text-muted-foreground">
                {label ? `${label} · ` : ""}
                of {formatClock(duration)}
              </span>
            </button>
          </ProgressRing>
        )}

        <TimerControls />

        <InlinePresets />

        <p className="hidden text-[11px] text-muted-foreground/70 sm:block">
          Space start / pause · R reset
        </p>
      </div>
    </ToolFrame>
  );
}
