"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type DialogueMessage,
  useDialogueStore,
} from "@/stores/dialogue-store";

const TYPE_SPEED_MS = 28;
const AUTO_DISMISS_MS = 6500;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * A visual-novel style message box with a name plate and
 * typewriter text. Click to finish typing, click again to close.
 */
export function DialogueBox() {
  const current = useDialogueStore((state) => state.current);

  if (!current) {
    return null;
  }

  return <DialogueContent key={current.id} message={current} />;
}

function DialogueContent({ message }: { message: DialogueMessage }) {
  const dismiss = useDialogueStore((state) => state.dismiss);

  const [shown, setShown] = useState(() =>
    prefersReducedMotion() ? message.text.length : 0
  );

  const done = shown >= message.text.length;

  useEffect(() => {
    if (done) {
      return;
    }

    const id = window.setInterval(() => {
      setShown((count) => Math.min(message.text.length, count + 1));
    }, TYPE_SPEED_MS);

    return () => window.clearInterval(id);
  }, [done, message.text.length]);

  useEffect(() => {
    if (!done || message.sticky) {
      return;
    }

    const id = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [done, message.sticky, dismiss]);

  function handleClick() {
    if (!done) {
      setShown(message.text.length);
      return;
    }

    dismiss();
  }

  return (
    <div
      role={message.tone === "alert" ? "alert" : "status"}
      className="fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] z-60 mx-auto max-w-xl ui-rise lg:bottom-6"
    >
      <div
        className={cn(
          "panel cursor-pointer px-5 pt-7 pb-4 ui-fade",
          message.tone === "alert" && "ring-4 ring-primary/40"
        )}
        onClick={handleClick}
      >
        <div className="absolute -top-4 left-5 -rotate-2 rounded-lg border border-black/10 bg-primary px-3 py-1 font-display text-sm text-primary-foreground shadow-cel-sm">
          {message.speaker}
        </div>

        <p className="min-h-12 text-[15px] leading-7">
          {message.text.slice(0, shown)}
          {!done && (
            <span className="caret-blink ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-primary" />
          )}
        </p>

        <div className="mt-1 flex items-center justify-end gap-3">
          {message.actionLabel && (
            <Button
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                dismiss();
              }}
            >
              {message.actionLabel}
            </Button>
          )}

          {done && !message.actionLabel && (
            <span
              aria-hidden="true"
              className="caret-blink text-xs text-primary"
            >
              ▼
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
