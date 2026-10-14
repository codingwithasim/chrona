import { cn } from "@/lib/utils";

const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const TINT = "color-mix(in oklab, var(--tool) 22%, transparent)";

/** The cat, curled up asleep, drawn around (0, 0) = the floor under her. */
function SleepingCat() {
  return (
    <g>
      {/* Body, a soft loaf, with the tail wrapped round */}
      <path d="M-34 0 C -40 -22 -18 -36 4 -34 C 26 -32 38 -18 34 0 Z" {...LINE} fill={TINT} />
      <path d="M30 -2 C 26 6 -6 8 -24 4" {...LINE} />
      {/* Head on her paws */}
      <path d="M-46 -2 C -52 -10 -50 -22 -40 -26 L -42 -36 L -33 -29 C -29 -30 -25 -30 -21 -29 L -14 -36 L -14 -25 C -8 -20 -8 -8 -14 -2 Z" {...LINE} fill={TINT} />
      <path d="M-38 -14 q 3 2 6 0 M-26 -14 q 3 2 6 0" {...LINE} strokeWidth={1.6} />
      <path d="M-31 -8 q 1.5 1.5 3 0" {...LINE} strokeWidth={1.4} />
    </g>
  );
}

function Zzz() {
  return (
    <g fill="currentColor" opacity="0.55" style={{ fontFamily: "var(--font-kiwi)" }}>
      <text x="0" y="0" fontSize="10">z</text>
      <text x="8" y="-9" fontSize="13">z</text>
      <text x="18" y="-20" fontSize="16">Z</text>
    </g>
  );
}

/** A little line drawing for an empty alarm list, in the tool's colour. */
export function SleepyClockArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 120" aria-hidden="true" className={cn("h-28 w-auto text-foreground/70", className)}>
      <ellipse cx="92" cy="104" rx="74" ry="6" fill="currentColor" opacity="0.08" />

      {/* An alarm clock with two bells */}
      <g transform="translate(124 66)">
        <path d="M-22 -28 A 9 9 0 0 1 -8 -36" {...LINE} strokeWidth={5} stroke="var(--tool)" opacity="0.8" />
        <path d="M22 -28 A 9 9 0 0 0 8 -36" {...LINE} strokeWidth={5} stroke="var(--tool)" opacity="0.8" />
        <path d="M-16 30 L -21 37 M16 30 L 21 37" {...LINE} />
        <circle r="30" {...LINE} fill={TINT} />
        <circle r="23" fill="var(--background)" opacity="0.55" />
        <path d="M0 0 L0 -15 M0 0 L10 6" {...LINE} />
        <circle r="2" fill="currentColor" />
      </g>

      <g transform="translate(62 104)">
        <SleepingCat />
      </g>

      <g transform="translate(30 60)">
        <Zzz />
      </g>
    </svg>
  );
}
