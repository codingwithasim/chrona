"use client";

import type { LucideIcon } from "lucide-react";
import { Pause, Play } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function Hint({ label, keys }: { label: string; keys?: string }) {
  return (
    <span className="flex items-center gap-2">
      {label}
      {keys && (
        <kbd className="rounded-md bg-background/15 px-1.5 font-sans text-[10px] tracking-wide opacity-80">
          {keys}
        </kbd>
      )}
    </span>
  );
}

/** The one big button: a soft round play / pause. */
export function PlayButton({
  running,
  onClick,
  label,
}: {
  running: boolean;
  onClick: () => void;
  label?: string;
}) {
  const text = label ?? (running ? "Pause" : "Start");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            aria-label={text}
            data-play
            className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-14px_rgb(30_40_60/0.6)] transition-all duration-300 outline-none hover:scale-[1.04] hover:opacity-95 focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.97]"
          >
            {running ? (
              <Pause className="size-6" strokeWidth={1.8} fill="currentColor" />
            ) : (
              <Play className="size-6 translate-x-[1px]" strokeWidth={1.8} fill="currentColor" />
            )}
          </button>
        }
      />
      <TooltipContent side="bottom">
        <Hint label={text} keys="Space" />
      </TooltipContent>
    </Tooltip>
  );
}

/** A quiet round icon action beside the play button. */
export function QuietAction({
  icon: Icon,
  label,
  keys,
  onClick,
  disabled,
  className,
}: {
  icon: LucideIcon;
  label: string;
  keys?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            data-quiet
            className={cn(
              "grid size-11 place-items-center rounded-full text-foreground/60 transition-all duration-300 outline-none hover:bg-foreground/6 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.95] disabled:pointer-events-none disabled:opacity-30",
              className
            )}
          >
            <Icon className="size-[19px]" strokeWidth={1.7} />
          </button>
        }
      />
      <TooltipContent side="bottom">
        <Hint label={label} keys={keys} />
      </TooltipContent>
    </Tooltip>
  );
}

/** Play in the middle, quiet actions either side. */
export function ControlRow({ children }: { children: React.ReactNode }) {
  return (
    <div data-recede data-controls className="flex items-center justify-center gap-5">
      {children}
    </div>
  );
}

/** A small, lowercase status line, e.g. "ready". */
export function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <span data-compact-hide className="text-[10px] font-medium tracking-[0.32em] text-muted-foreground/80 lowercase">
      {children}
    </span>
  );
}
