"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Lap } from "./use-stopwatch";

export function formatStopwatch(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const cs = String(centiseconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${mm}:${ss}.${cs}`
    : `${mm}:${ss}.${cs}`;
}

type LapListProps = {
  laps: Lap[];
  limit?: number;
  className?: string;
};

export function LapList({ laps, limit, className }: LapListProps) {
  if (laps.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-2 py-8 text-center text-muted-foreground",
          className
        )}
      >
        <Flag className="size-8 opacity-40" />
        <p className="text-sm font-bold">No laps yet</p>
        <p className="text-xs">
          Press{" "}
          <span className="rounded-md border-2 border-border px-1.5 py-0.5 font-bold">
            Lap
          </span>{" "}
          while the stopwatch is running
        </p>
      </div>
    );
  }

  const splits = laps.map((lap) => lap.split);
  const fastest = laps.length > 1 ? Math.min(...splits) : null;
  const slowest = laps.length > 1 ? Math.max(...splits) : null;

  const visible = limit ? laps.slice(0, limit) : laps;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="grid grid-cols-3 px-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
        <span>Lap</span>
        <span className="text-center">Split</span>
        <span className="text-right">Total</span>
      </div>

      <AnimatePresence initial={false}>
        {visible.map((lap) => (
          <motion.div
            layout
            key={lap.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "grid grid-cols-3 items-center rounded-xl border-2 border-transparent bg-card/50 px-3 py-2",
              lap.split === fastest && "border-mint/70",
              lap.split === slowest && "border-sakura/70"
            )}
          >
            <span className="flex items-center gap-1.5 text-sm font-bold">
              #{lap.id}
              {lap.split === fastest && (
                <span className="rounded-full bg-mint px-1.5 text-[10px] text-[#1b1530]">
                  best
                </span>
              )}
              {lap.split === slowest && (
                <span className="rounded-full bg-sakura px-1.5 text-[10px] text-[#1b1530]">
                  slow
                </span>
              )}
            </span>

            <span className="text-center font-display text-sm tabular-nums">
              {formatStopwatch(lap.split)}
            </span>

            <span className="text-right font-display text-sm text-muted-foreground tabular-nums">
              {formatStopwatch(lap.total)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
