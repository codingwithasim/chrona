import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ProgressRingProps = {
  /** 0 to 1 */
  value: number;
  color?: string;
  className?: string;
  children?: ReactNode;
};

const RADIUS = 46;
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
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          className="text-foreground/15"
        />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          style={{ transition: "stroke-dashoffset 400ms linear" }}
        />
        {progress > 0 && progress < 1 && (
          <>
            <circle cx={dotX} cy={dotY} r="3.4" fill={color} opacity="0.18" />
            <circle cx={dotX} cy={dotY} r="1.5" fill={color} />
          </>
        )}
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        {children}
      </div>
    </div>
  );
}
