"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { SHORTCUTS } from "@/lib/shortcuts";

/** Press ? anywhere for a little sheet of shortcuts. */
export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useShortcuts({ "?": () => setOpen((value) => !value) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-2 text-[15px] font-medium">
            Shortcuts
            <span className="text-[11px] font-normal text-muted-foreground/70">ショートカット</span>
          </DialogTitle>
        </DialogHeader>

        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-[13px]">
          {SHORTCUTS.map(([key, description]) => (
            <div key={key} className="contents">
              <dt>
                <kbd className="inline-grid min-w-8 place-items-center rounded-md bg-foreground/[0.06] px-2 py-0.5 font-sans text-xs">
                  {key}
                </kbd>
              </dt>
              <dd className="text-muted-foreground">{description}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
