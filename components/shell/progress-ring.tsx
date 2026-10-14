import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ProgressRingProps = {
  /** 0 to 1 */
  value: number;
  color?: string;
  className?: string;
  children?: ReactNode;
};

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({
  value,
  color = "var(--primary)",
  className,
  children,
}: ProgressRingProps) {
  const progress = Math.min(1, Math.max(0, value));
  const angle = progress * Math.PI * 2;

  const dotX = 50 + RADIUS * Math.cos(angle);
  const dotY = 50 + RADIUS * Math.sin(angle);

  return (
    <div className={cn("relative aspect-square", className)}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full -rotate-90 overflow-visible"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="48.6" fill="none" stroke="var(--ink)" strokeWidth="1" opacity="0.5" />
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r="37"
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="1.2"
          strokeDasharray="0.6 5.2"
          opacity="0.6"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          style={{ transition: "stroke-dashoffset 300ms linear" }}
        />
        {progress > 0 && progress < 1 && (
          <g transform={`translate(${dotX} ${dotY}) rotate(90)`}>
            <path
              d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z"
              fill="#fffaf0"
              stroke="var(--ink)"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        {children}
      </div>
    </div>
  );
}
