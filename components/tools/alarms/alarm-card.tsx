"use client";

import { BellRing, Pencil, Repeat, Trash2 } from "lucide-react";

import { Digits } from "@/components/shell/digits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SOUNDS } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { Alarm } from "@/stores/alarms-store";

import {
  describeRepeat,
  formatTimeUntilAlarm,
  minutesToTimeParts,
  WEEKDAYS,
} from "./alarm-utils";

type Props = {
  alarm: Alarm;
  now: Date | null;
  hour24: boolean;
  defaultSound: keyof typeof SOUNDS;

  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
};

export function AlarmCard({
  alarm,
  now,
  hour24,
  defaultSound,
  onEdit,
  onDelete,
  onToggle,
}: Props) {
  const { hour, minute, meridiem } = minutesToTimeParts(alarm.time, hour24);
  const alarmLabel = alarm.label.trim() || "Alarm";
  const repeat = alarm.repeat ?? [];
  const sound = SOUNDS[alarm.sound ?? defaultSound];

  const remaining =
    alarm.enabled && now
      ? formatTimeUntilAlarm(alarm.time, now, repeat)
      : "Sleeping";

  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-3xl border p-5 transition-all duration-300",
        alarm.enabled
          ? "border-[color-mix(in_oklab,var(--tool)_26%,transparent)] bg-[color-mix(in_oklab,var(--tool)_10%,transparent)] shadow-[0_10px_30px_-22px_var(--tool)]"
          : "border-foreground/[0.06] bg-foreground/[0.025] opacity-60"
      )}
      data-clarity-mask="true"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate font-display text-[15px]">{alarmLabel}</h2>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground/80">
            <BellRing className="size-3" strokeWidth={1.7} />
            {sound?.name ?? "Default"}
          </p>
        </div>

        <div className="-mt-1 -mr-1 flex shrink-0 items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${alarmLabel}`}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Delete ${alarmLabel}`}>
            <Trash2 />
          </Button>
        </div>
      </header>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <Digits value={`${hour}:${minute}`} className="text-[2.6rem]" />
          {meridiem && (
            <span className="text-xs text-muted-foreground/80">{meridiem}</span>
          )}
        </div>

        <Switch
          checked={alarm.enabled}
          onCheckedChange={onToggle}
          aria-label={alarm.enabled ? `Turn off ${alarmLabel}` : `Turn on ${alarmLabel}`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1" aria-label={describeRepeat(repeat)}>
          {WEEKDAYS.map((day) => {
            const active = repeat.includes(day.day);

            return (
              <span
                key={day.day}
                aria-hidden="true"
                className={cn(
                  "grid size-6 place-items-center rounded-full text-[10px]",
                  active
                    ? "bg-[color-mix(in_oklab,var(--tool)_28%,transparent)] text-foreground"
                    : "text-muted-foreground/50"
                )}
              >
                {day.jp}
              </span>
            );
          })}
        </div>

        <span className="flex items-center gap-1 text-[11px] whitespace-nowrap text-muted-foreground/80">
          {repeat.length > 0 && <Repeat className="size-3" strokeWidth={1.7} />}
          {remaining}
        </span>
      </div>
    </article>
  );
}
