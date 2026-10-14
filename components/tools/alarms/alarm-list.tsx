"use client";

import { AlarmClock, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useNow } from "@/hooks/use-now";
import { useAlarmStore } from "@/stores/alarms-store";
import { useSceneStore } from "@/stores/scene-store";
import { useSettingsStore } from "@/stores/settings-store";

import { AlarmCard } from "./alarm-card";

type Props = {
  onCreate: () => void;
};

export function AlarmList({ onCreate }: Props) {
  const now = useNow();
  const hour24 = useSceneStore((state) => state.hour24);
  const defaultSound = useSettingsStore((state) => state.sounds.alarm);

  const alarms = useAlarmStore((state) => state.alarms);
  const removeAlarm = useAlarmStore((state) => state.removeAlarm);
  const toggleAlarm = useAlarmStore((state) => state.toggleAlarm);
  const openEditAlarm = useAlarmStore((state) => state.openEditAlarm);

  if (!alarms.length) {
    return (
      <Empty className="py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlarmClock className="size-5" />
          </EmptyMedia>
        </EmptyHeader>

        <EmptyTitle>No alarms yet</EmptyTitle>

        <EmptyDescription>
          Create an alarm for mornings, meetings, or anything
          you don&apos;t want to miss.
        </EmptyDescription>

        <Button size="sm" className="mt-4 rounded-full px-4" onClick={onCreate}>
          <Plus />
          Add alarm
        </Button>
      </Empty>
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
