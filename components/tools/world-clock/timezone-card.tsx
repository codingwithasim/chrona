"use client";

import { type KeyboardEvent, type PointerEvent, useRef } from "react";
import {
  Moon,
  Pencil,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
} from "lucide-react";

import { Digits } from "@/components/shell/digits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { City } from "@/stores/world-clock-store";

import {
  type DayPhase,
  dayPhase,
  dayShift,
  formatMinutes,
  formatZonedDate,
  formatZonedTime,
  gmtLabel,
  minutesOfDay,
  offsetFromLocal,
} from "./time-utils";

const phases: Record<DayPhase, { icon: typeof Sun; color: string; label: string }> = {
  night: { icon: Moon, color: "var(--lavender)", label: "Night" },
  dawn: { icon: Sunrise, color: "var(--ember)", label: "Sunrise" },
  day: { icon: Sun, color: "var(--honey)", label: "Daytime" },
  dusk: { icon: Sunset, color: "#f59e5b", label: "Sunset" },
};

const SKY_GRADIENT =
  "linear-gradient(to right, #4a4d72 0%, #4a4d72 19%, #e9bcb6 26%, #c6e0ee 33%, #cfe5f0 69%, #efcb9f 76%, #9a8db5 82%, #4a4d72 88%, #4a4d72 100%)";

const SNAP = 15;

type Props = {
  city: City;
  preview: Date;
  hour24: boolean;
  previewing: boolean;
  onScrub: (deltaMinutes: number) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TimezoneCard({
  city,
  preview,
  hour24,
  previewing,
  onScrub,
  onEdit,
  onDelete,
}: Props) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const minutes = minutesOfDay(preview, city.timezone);
  const phase = phases[dayPhase(minutes)];
  const PhaseIcon = phase.icon;

  const { time, meridiem } = formatZonedTime(preview, city.timezone, hour24);
  const offset = offsetFromLocal(preview, city.timezone);
  const shift = dayShift(preview, city.timezone);

  function scrubTo(clientX: number) {
    const bar = barRef.current;

    if (!bar) {
      return;
    }

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const target = Math.round((ratio * 1440) / SNAP) * SNAP;

    let delta = target - minutes;

    // Take the short way around the clock.
    if (delta > 720) delta -= 1440;
    if (delta < -720) delta += 1440;

    if (delta !== 0) {
      onScrub(delta);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    scrubTo(event.clientX);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragging.current) {
      scrubTo(event.clientX);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowLeft: -SNAP,
      ArrowDown: -SNAP,
      ArrowRight: SNAP,
      ArrowUp: SNAP,
      PageDown: -60,
      PageUp: 60,
    };

    if (event.key in steps) {
      event.preventDefault();
      onScrub(steps[event.key]);
    }
  }

  return (
    <article className="group flex flex-col gap-3 rounded-3xl border border-foreground/[0.06] bg-foreground/[0.025] p-5 transition-colors duration-300 hover:bg-foreground/[0.04]">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{city.name}</h2>
          <p className="truncate text-[11px] text-muted-foreground/80">
            {city.country} · {gmtLabel(preview, city.timezone)}
          </p>
        </div>

        <div className="-mt-1 -mr-1 flex shrink-0 items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <Button variant="ghost" size="icon-sm" aria-label={`Change ${city.name}`} onClick={onEdit}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${city.name}`} onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-3">
        <span title={phase.label} className="shrink-0">
          <PhaseIcon className="size-[18px]" strokeWidth={1.7} style={{ color: phase.color }} />
        </span>

        <div className="flex items-baseline gap-1.5">
          <Digits value={time} className={cn("text-[2.1rem]", previewing && "text-foreground")} />
          {meridiem && (
            <span className="text-xs text-muted-foreground/80">{meridiem}</span>
          )}
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground/80">
        <span>{formatZonedDate(preview, city.timezone)}</span>
        <span aria-hidden="true">·</span>
        <span>{offset || "same as you"}</span>
        {shift !== 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>{shift > 0 ? "tomorrow" : "yesterday"}</span>
          </>
        )}
      </p>

      {/* 24-hour timeline: drag to see what time it would be */}
      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label={`Time in ${city.name}`}
        aria-valuemin={0}
        aria-valuemax={1439}
        aria-valuenow={minutes}
        aria-valuetext={formatMinutes(minutes, hour24)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative mt-2 h-5 cursor-grab touch-none rounded-full outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:cursor-grabbing"
      >
        {/* The day, as a thin soft band */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full opacity-80"
          style={{ background: SKY_GRADIENT }}
        />

        <span
          aria-hidden="true"
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card shadow-[0_1px_6px_rgb(0_0_0/0.25)] ring-1 ring-black/5"
          style={{ left: `${(minutes / 1440) * 100}%` }}
        />
      </div>

      <div className="flex justify-between px-0.5 text-[10px] text-muted-foreground/60">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </article>
  );
}
