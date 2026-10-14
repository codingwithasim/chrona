import { cn } from "@/lib/utils";

type DigitsProps = {
  value: string;
  className?: string;
};

/**
 * Renders a time string with fixed-width digit cells so the
 * rounded display font never jitters while counting.
 */
export function Digits({ value, className }: DigitsProps) {
  return (
    <span
      data-digits
      className={cn(
        "inline-flex items-baseline font-display font-light leading-none tracking-tight text-foreground/90",
        className
      )}
    >
      <span className="sr-only">{value}</span>

      {Array.from(value).map((character, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            "inline-block text-center",
            /\d/.test(character)
              ? "w-[0.62em]"
              : character === ":" || character === "."
                ? "w-[0.3em] -translate-y-[0.05em] opacity-60"
                : "px-[0.08em]"
          )}
        >
          {character}
        </span>
      ))}
    </span>
  );
}

/** 125 → "02:05", 3725 → "1:02:05" */
export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${mm}:${ss}`
    : `${mm}:${ss}`;
}
