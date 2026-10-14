"use client";

import { type FormEvent, useState } from "react";

import { SoundPicker } from "@/components/shell/sound-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SoundId } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { type Alarm, useAlarmStore } from "@/stores/alarms-store";
import { useSettingsStore } from "@/stores/settings-store";

import {
  describeRepeat,
  inputTimeToMinutes,
  minutesToInputTime,
  WEEKDAYS,
} from "./alarm-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const quickRepeats = [
  { label: "Once", days: [] },
  { label: "Weekdays", days: [1, 2, 3, 4, 5] },
  { label: "Weekends", days: [0, 6] },
  { label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
];

export function AlarmDialog({ open, onOpenChange }: Props) {
  const alarms = useAlarmStore((state) => state.alarms);
  const editingAlarmId = useAlarmStore((state) => state.editingAlarmId);
  const closeEditAlarm = useAlarmStore((state) => state.closeEditAlarm);

  const editingAlarm = editingAlarmId
    ? alarms.find((alarm) => alarm.id === editingAlarmId)
    : undefined;

  function handleOpenChange(value: boolean) {
    if (!value) {
      closeEditAlarm();
    }

    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg gap-0 overflow-y-auto p-0">
        {/* Remount per alarm so the form starts from its values */}
        {open && (
          <AlarmForm
            key={editingAlarm?.id ?? "new"}
            alarm={editingAlarm}
            onDone={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AlarmForm({
  alarm,
  onDone,
}: {
  alarm?: Alarm;
  onDone: () => void;
}) {
  const alarms = useAlarmStore((state) => state.alarms);
  const addAlarm = useAlarmStore((state) => state.addAlarm);
  const updateAlarm = useAlarmStore((state) => state.updateAlarm);
  const defaultSound = useSettingsStore((state) => state.sounds.alarm);

  const [timeValue, setTimeValue] = useState(
    alarm ? minutesToInputTime(alarm.time) : "07:30"
  );
  const [label, setLabel] = useState(alarm?.label ?? "");
  const [repeat, setRepeat] = useState<number[]>(alarm?.repeat ?? []);
  const [sound, setSound] = useState<SoundId>(alarm?.sound ?? defaultSound);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setRepeat((days) =>
      days.includes(day)
        ? days.filter((value) => value !== day)
        : [...days, day].sort((a, b) => a - b)
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const time = inputTimeToMinutes(timeValue);
    const normalizedLabel = label.trim();

    if (time === null) {
      setError("Enter a valid alarm time.");
      return;
    }

    const duplicate = alarms.some(
      (other) =>
        other.id !== alarm?.id &&
        other.time === time &&
        other.label.trim().toLowerCase() === normalizedLabel.toLowerCase()
    );

    if (duplicate) {
      setError("An alarm with this time and label already exists.");
      return;
    }

    if (alarm) {
      updateAlarm(alarm.id, {
        time,
        label: normalizedLabel,
        repeat,
        sound,
        enabled: true,
      });
    } else {
      addAlarm({
        time,
        label: normalizedLabel,
        repeat,
        sound,
        enabled: true,
      });
    }

    onDone();
  }

  return (
    <>
      <div className="border-b-2 border-dashed border-border px-5 pt-5 pb-4">
        <DialogHeader>
          <DialogTitle className="text-base">
            {alarm ? "Edit alarm" : "New alarm"}
            <span className="ml-2 font-sans text-xs font-bold text-muted-foreground">
              アラーム
            </span>
          </DialogTitle>
        </DialogHeader>
      </div>

      <form onSubmit={handleSubmit} data-clarity-mask="true">
        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <label className="space-y-2">
              <span className="text-sm font-bold">Time</span>
              <Input
                type="time"
                step={60}
                autoFocus
                required
                value={timeValue}
                onChange={(event) => setTimeValue(event.target.value)}
                className="h-14 font-display text-2xl"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold">Label</span>
              <Input
                value={label}
                maxLength={40}
                placeholder="Wake up, meeting, medicine…"
                onChange={(event) => setLabel(event.target.value)}
                className="h-14"
              />
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold">
              Repeat
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {describeRepeat(repeat)}
              </span>
            </legend>

            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const active = repeat.includes(day.day);

                return (
                  <button
                    key={day.day}
                    type="button"
                    aria-pressed={active}
                    aria-label={day.short}
                    onClick={() => toggleDay(day.day)}
                    className={cn(
                      "flex size-10 flex-col items-center justify-center rounded-xl border-2 text-xs font-bold transition-all",
                      active
                        ? "border-ink bg-lavender text-[#1b1530] shadow-cel-sm"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {day.short.slice(0, 2)}
                    <span className="text-[9px] font-normal opacity-70">{day.jp}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {quickRepeats.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setRepeat(option.days)}
                  className="rounded-full border-2 border-border px-2.5 py-0.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <p className="text-sm font-bold">Sound</p>
            <SoundPicker value={sound} onChange={setSound} />
          </div>

          {error && (
            <p role="alert" className="text-sm font-bold text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t-2 border-dashed border-border px-5 py-4">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>

          <Button type="submit">{alarm ? "Save changes" : "Add alarm"}</Button>
        </div>
      </form>
    </>
  );
}
