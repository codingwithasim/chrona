"use client";

import { type ReactNode, useId } from "react";

import { cn } from "@/lib/utils";

import { usePanelStyle } from "./panel-style";

type ProgressRingProps = {
  /** 0 to 1 */
  value: number;
  color?: string;
  className?: string;
  children?: ReactNode;
};

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Sixty little marks around the face, longer every five. */
const TICKS = Array.from({ length: 60 }, (_, index) => {
  const angle = (index / 60) * Math.PI * 2;
  const major = index % 5 === 0;
  const inner = major ? 39.2 : 40.6;
  const outer = 42.2;
  const round = (value: number) => Math.round(value * 100) / 100;

  return {
    major,
    x1: round(50 + inner * Math.cos(angle)),
    y1: round(50 + inner * Math.sin(angle)),
    x2: round(50 + outer * Math.cos(angle)),
    y2: round(50 + outer * Math.sin(angle)),
  };
});

export function ProgressRing({
  value,
  color = "var(--primary)",
  className,
  children,
}: ProgressRingProps) {
  const style = usePanelStyle();
  const id = useId().replace(/:/g, "");
  const progress = Math.min(1, Math.max(0, value));
  const angle = progress * Math.PI * 2;

  // In the bar and the corner widget, the ring becomes a slim line.
  if (style === "bar" || style === "corner") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        {children}
        <div className={cn("h-[2px] overflow-hidden rounded-full bg-foreground/10", style === "bar" ? "w-28" : "w-40")}>
          <div
            className="h-full rounded-full"
            style={{ width: `${progress * 100}%`, backgroundColor: color, transition: "width 400ms linear" }}
          />
        </div>
      </div>
    );
  }

  const dotX = 50 + RADIUS * Math.cos(angle);
  const dotY = 50 + RADIUS * Math.sin(angle);

  return (
    <div className={cn("relative aspect-square", className)}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full -rotate-90 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${id}-face`}>
            <stop offset="0" style={{ stopColor: color, stopOpacity: 0.1 }} />
            <stop offset="0.75" style={{ stopColor: color, stopOpacity: 0.03 }} />
            <stop offset="1" style={{ stopColor: color, stopOpacity: 0 }} />
          </radialGradient>
          <linearGradient id={`${id}-arc`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: color, stopOpacity: 0.55 }} />
            <stop offset="1" style={{ stopColor: color }} />
          </linearGradient>
        </defs>

        {/* A soft face, tinted with the tool's colour */}
        <circle cx="50" cy="50" r="43.5" fill={`url(#${id}-face)`} />

        <g stroke="currentColor" strokeLinecap="round" className="text-foreground/25">
          {TICKS.map((tick, index) => (
            <line
              key={index}
              {...{ x1: tick.x1, y1: tick.y1, x2: tick.x2, y2: tick.y2 }}
              strokeWidth={tick.major ? 0.7 : 0.35}
              opacity={tick.major ? 0.9 : 0.55}
            />
          ))}
        </g>

        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          className="text-foreground/10"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={`url(#${id}-arc)`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          style={{ transition: "stroke-dashoffset 400ms linear" }}
        />
        {progress > 0 && progress < 1 && (
          <>
            <circle cx={dotX} cy={dotY} r="4.6" fill={color} opacity="0.2" />
            <circle cx={dotX} cy={dotY} r="2.3" fill="#ffffff" stroke={color} strokeWidth="1.3" />
          </>
        )}
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        {children}
      </div>
    </div>
  );
}
