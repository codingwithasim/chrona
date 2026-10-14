"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Download, Upload } from "lucide-react";

import { downloadBackup, restoreBackup } from "@/lib/backup";

function subscribeOffline(onChange: () => void) {
  if (!("serviceWorker" in navigator)) {
    return () => {};
  }

  navigator.serviceWorker.addEventListener("controllerchange", onChange);
  return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
}

const pill =
  "flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3.5 py-1.5 text-[12px] text-foreground/80 transition-colors duration-300 hover:bg-foreground/[0.07] hover:text-foreground";

/** Save your tasks, focus history, notes and settings to a file, and back. */
export function YourData() {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState(false);
  const offline = useSyncExternalStore(
    subscribeOffline,
    () => "serviceWorker" in navigator && navigator.serviceWorker.controller !== null,
    () => false
  );

  async function restore(file: File | undefined) {
    if (!file) {
      return;
    }

    if (await restoreBackup(file)) {
      window.location.reload();
    } else {
      setProblem(true);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-5 text-muted-foreground">
        Everything Chrona remembers stays on this device. Nothing is sent
        anywhere, so keep a backup if you clear your browser or switch computers.
        {offline && " Chrona also works offline here."}
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={downloadBackup} className={pill}>
          <Download className="size-3.5" strokeWidth={1.7} />
          Save a backup
        </button>
        <button type="button" onClick={() => input.current?.click()} className={pill}>
          <Upload className="size-3.5" strokeWidth={1.7} />
          Restore from a file
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            setProblem(false);
            void restore(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {problem && (
        <p className="text-[12px] text-destructive">That file isn&apos;t a Chrona backup.</p>
      )}
    </div>
  );
}
