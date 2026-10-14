"use client";

import { Plus } from "lucide-react";

import { SleepyClockArt } from "@/components/shell/empty-art";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { useAlarmStore } from "@/stores/alarms-store";
import { useSceneStore } from "@/stores/scene-store";
import { useSettingsStore } from "@/stores/settings-store";

import { AlarmCard } from "./alarm-card";

type Props = {
  onCreate: () => void;
};

/** One-tap alarms for an empty list. */
const QUICK = [
  { label: "Wake up", emoji: "☀️", time: 7 * 60, repeat: [1, 2, 3, 4, 5] },
  { label: "Lunch", emoji: "🍱", time: 12 * 60 + 30, repeat: [] },
  { label: "Wind down", emoji: "🌙", time: 22 * 60 + 30, repeat: [0, 1, 2, 3, 4, 5, 6] },
];

function formatQuick(minutes: number, hour24: boolean) {
  const hours = Math.floor(minutes / 60);
  const rest = String(minutes % 60).padStart(2, "0");

  if (hour24) {
    return `${String(hours).padStart(2, "0")}:${rest}`;
  }

  return `${hours % 12 || 12}:${rest} ${hours < 12 ? "am" : "pm"}`;
}

export function AlarmList({ onCreate }: Props) {
  const now = useNow();
  const hour24 = useSceneStore((state) => state.hour24);
  const defaultSound = useSettingsStore((state) => state.sounds.alarm);

  const alarms = useAlarmStore((state) => state.alarms);
  const removeAlarm = useAlarmStore((state) => state.removeAlarm);
  const toggleAlarm = useAlarmStore((state) => state.toggleAlarm);
  const openEditAlarm = useAlarmStore((state) => state.openEditAlarm);
  const addAlarm = useAlarmStore((state) => state.addAlarm);

  if (!alarms.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <SleepyClockArt />
        <h2 className="mt-2 font-display text-lg">No alarms yet</h2>
        <p className="max-w-xs text-[13px] leading-5 text-muted-foreground">
          For mornings, meetings, or anything you don&apos;t want to miss.
          Start with one of these, or make your own.
        </p>

        <div className="mt-1 flex flex-wrap justify-center gap-1.5">
          {QUICK.map((quick) => (
            <button
              key={quick.label}
              type="button"
              className="chip"
              onClick={() => addAlarm({ time: quick.time, label: quick.label, repeat: quick.repeat })}
            >
              <span aria-hidden="true">{quick.emoji}</span>
              {quick.label} · {formatQuick(quick.time, hour24)}
            </button>
          ))}
        </div>

        <Button size="sm" className="mt-3 rounded-full px-4" onClick={onCreate}>
          <Plus />
          New alarm
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {alarms.map((alarm) => (
        <AlarmCard
          key={alarm.id}
          alarm={alarm}
          now={now}
          hour24={hour24}
          defaultSound={defaultSound}
          onDelete={() => removeAlarm(alarm.id)}
          onToggle={() => toggleAlarm(alarm.id)}
          onEdit={() => openEditAlarm(alarm.id)}
        />
      ))}
    </div>
  );
}
