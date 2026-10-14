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
  dawn: { icon: Sunrise, color: "var(--sakura)", label: "Sunrise" },
  day: { icon: Sun, color: "var(--honey)", label: "Daytime" },
  dusk: { icon: Sunset, color: "#f59e5b", label: "Sunset" },
};

const SKY_GRADIENT =
  "linear-gradient(to right, #1d1a4a 0%, #1d1a4a 19%, #f2a3a8 26%, #9fd5f2 33%, #a6dcf5 69%, #f7b267 76%, #7a4f9a 82%, #1d1a4a 88%, #1d1a4a 100%)";

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
    <article className="panel flex flex-col gap-3 p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">{city.name}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {city.country} · {gmtLabel(preview, city.timezone)}
          </p>
        </div>

        <div className="-mt-1 -mr-1 flex shrink-0 items-center">
          <Button variant="ghost" size="icon-sm" aria-label={`Change ${city.name}`} onClick={onEdit}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${city.name}`} onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-3">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-ink text-[#1b1530] shadow-cel-sm"
          style={{ backgroundColor: phase.color }}
          title={phase.label}
        >
          <PhaseIcon className="size-5" strokeWidth={2.4} />
        </span>

        <div className="flex items-baseline gap-1.5">
          <Digits value={time} className={cn("cel-text text-[2.4rem]", previewing && "text-primary")} />
          {meridiem && (
            <span className="text-sm font-bold text-muted-foreground">{meridiem}</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-muted-foreground">{formatZonedDate(preview, city.timezone)}</span>

        {offset ? (
          <span className="rounded-full border-2 border-border px-2 py-0.5 font-bold">
            {offset}
          </span>
        ) : (
          <span className="rounded-full bg-mint/25 px-2 py-0.5 font-bold">same as you</span>
        )}

        {shift !== 0 && (
          <span className="rounded-full bg-lavender/25 px-2 py-0.5 font-bold">
            {shift > 0 ? "tomorrow" : "yesterday"}
          </span>
        )}
      </div>

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
        className="relative mt-2 h-8 cursor-grab touch-none rounded-full border-2 border-ink outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
        style={{ background: SKY_GRADIENT }}
      >
        {[6, 12, 18].map((hour) => (
          <span
            key={hour}
            aria-hidden="true"
            className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-white/60"
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}

        <span
          aria-hidden="true"
          className="absolute top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-card shadow-cel-sm"
          style={{ left: `${(minutes / 1440) * 100}%` }}
        >
          <PhaseIcon className="size-4" style={{ color: phase.color }} strokeWidth={2.6} />
        </span>
      </div>

      <div className="flex justify-between px-1 text-[10px] font-bold text-muted-foreground">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </article>
  );
}
