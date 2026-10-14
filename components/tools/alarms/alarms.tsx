"use client";

import { useState } from "react";
import { Info, Plus } from "lucide-react";

import { ToolFrame } from "@/components/shell/tool-frame";
import { Button } from "@/components/ui/button";
import { useAlarmStore } from "@/stores/alarms-store";

import { AlarmDialog } from "./alarm-dialog";
import { AlarmList } from "./alarm-list";

export function Alarms() {
  const [addOpen, setAddOpen] = useState(false);

  const editingAlarmId = useAlarmStore((state) => state.editingAlarmId);
  const closeEditAlarm = useAlarmStore((state) => state.closeEditAlarm);

  const dialogOpen = addOpen || editingAlarmId !== null;

  function openCreateDialog() {
    closeEditAlarm();
    setAddOpen(true);
  }

  function handleDialogChange(open: boolean) {
    if (!open) {
      setAddOpen(false);
      closeEditAlarm();
    }
  }

  return (
    <ToolFrame
      href="/alarms"
      className="max-w-3xl"
      actions={
        <Button variant="ghost" size="sm" className="rounded-full" onClick={openCreateDialog}>
          <Plus />
          <span className="hidden sm:inline">Add alarm</span>
        </Button>
      }
    >
      <AlarmList onCreate={openCreateDialog} />

      <p className="mt-6 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground/70">
        <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.7} />
        Alarms ring on any Chrona page as long as the tab stays
        open. Click anywhere once after opening Chrona so your
        browser allows the sound.
      </p>

      <AlarmDialog open={dialogOpen} onOpenChange={handleDialogChange} />
    </ToolFrame>
  );
}
