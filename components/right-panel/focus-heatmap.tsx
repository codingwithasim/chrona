"use client";

import { useNow } from "@/hooks/use-now";
import { todayKey } from "@/lib/day-key";
import { useFocusStore } from "@/stores/focus-store";

const WEEKS = 17;

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Every day of the last few months as a little square, darker for more focus. */
export function FocusHeatmap() {
  const now = useNow();
  const days = useFocusStore((state) => state.days);

  if (!now) {
    return null;
  }

  const byDate = new Map(days.map((day) => [day.date, day.minutes]));

  // Start on the Monday WEEKS-1 weeks ago, so columns are weeks.
  const start = new Date(now);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (WEEKS - 1) * 7);

  const columns = Array.from({ length: WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + weekday);
      const key = todayKey(date);
      return { key, date, minutes: byDate.get(key) ?? 0, future: date > now };
    })
  );

  const active = days.filter((day) => day.minutes > 0).length;
  const total = days.reduce((sum, day) => sum + day.minutes, 0);

  const level = (minutes: number) =>
    minutes === 0 ? 0 : minutes < 30 ? 0.3 : minutes < 60 ? 0.5 : minutes < 120 ? 0.72 : 1;

  return (
    <section className="mb-6 space-y-3 border-b border-foreground/[0.06] pb-6">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground/80 lowercase">your months</p>
        <p className="text-[11px] text-muted-foreground/70">
          {active} {active === 1 ? "day" : "days"} · {formatMinutes(total)}
        </p>
      </div>

      <div className="flex gap-[3px]" role="img" aria-label={`Focus on ${active} days in the last ${WEEKS} weeks`}>
        {columns.map((column, index) => (
          <div key={index} className="flex flex-1 flex-col gap-[3px]">
            {column.map((day) => (
              <span
                key={day.key}
                title={day.future ? undefined : `${day.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}: ${day.minutes ? formatMinutes(day.minutes) : "no focus"}`}
                className="aspect-square w-full rounded-[3px]"
                style={{
                  opacity: day.future ? 0 : 1,
                  backgroundColor: day.minutes
                    ? `color-mix(in oklab, var(--ember) ${Math.round(level(day.minutes) * 100)}%, transparent)`
                    : "color-mix(in oklab, var(--foreground) 7%, transparent)",
                  outline: day.key === todayKey(now) ? "1px solid color-mix(in oklab, var(--foreground) 40%, transparent)" : undefined,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground/70">
        less
        {[0, 0.3, 0.5, 0.72, 1].map((value) => (
          <span
            key={value}
            className="size-2.5 rounded-[3px]"
            style={{
              backgroundColor: value
                ? `color-mix(in oklab, var(--ember) ${value * 100}%, transparent)`
                : "color-mix(in oklab, var(--foreground) 7%, transparent)",
            }}
          />
        ))}
        more
      </div>
    </section>
  );
}
