"use client";

import { type FormEvent, useState } from "react";
import { Pencil } from "lucide-react";

import { StatusLine } from "@/components/shell/controls";
import { Digits, formatClock } from "@/components/shell/digits";
import { ProgressRing } from "@/components/shell/progress-ring";
import { ToolFrame } from "@/components/shell/tool-frame";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type TimerStatus, useTimerStore } from "@/stores/timer-store";

import { TimerControls } from "./timer-controls";

const statusLabels: Record<TimerStatus, string> = {
  idle: "ready",
  running: "counting",
  paused: "paused",
  finished: "done",
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
      className="flex w-full max-w-sm flex-col items-center gap-5 py-6"
    >
      <div className="flex items-end gap-2">
        {fields.map((field, index) => (
          <div key={field.label} className="flex items-end gap-2">
            {index > 0 && (
              <span className="pb-7 font-display text-2xl font-light text-muted-foreground/60">
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
                className="h-14 w-18 rounded-2xl border-foreground/10 bg-foreground/[0.03] text-center font-display text-2xl font-light"
              />
              <span className="text-[10px] tracking-[0.25em] text-muted-foreground/80 lowercase">
                {field.label}
              </span>
            </label>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" className="rounded-full px-4" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" className="rounded-full px-4">
          Set
        </Button>
      </div>
    </form>
  );
}

function InlinePresets() {
  const presets = useTimerStore((state) => state.presets);
  const setDuration = useTimerStore((state) => state.setDuration);

  return (
    <div data-recede className="flex max-w-xs flex-wrap justify-center gap-x-1 gap-y-0.5">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          onClick={() => setDuration(preset.duration, preset.label)}
          title={formatClock(preset.duration)}
          className="rounded-full px-2.5 py-1 text-xs text-muted-foreground/80 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
        >
          {preset.label}
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
            size="icon-sm"
            aria-label="Set time"
            title="Set time"
            onClick={() => setEditing(true)}
          >
            <Pencil strokeWidth={1.7} />
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
            className="w-[min(70vw,16.5rem)]"
          >
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => setEditing(true)}
              aria-label="Set timer duration"
              className="flex flex-col items-center gap-3 rounded-3xl p-2"
            >
              <StatusLine>{statusLabels[status]}</StatusLine>

              <Digits
                value={formatClock(remaining)}
                className="text-[clamp(2.6rem,11vw,3.6rem)]"
              />

              <span className="text-[11px] text-muted-foreground/70">
                {label ? `${label} · ` : ""}
                {formatClock(duration)}
              </span>
            </button>
          </ProgressRing>
        )}

        <TimerControls />

        {status === "idle" && !editing && <InlinePresets />}
      </div>
    </ToolFrame>
  );
}
