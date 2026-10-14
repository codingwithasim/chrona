"use client";

import { useNow } from "@/hooks/use-now";
import { useRoomUnlocks } from "@/hooks/use-room";
import { todayKey } from "@/lib/day-key";
import { formatHours, nextUnlock, unlockTitle } from "@/lib/unlocks";
import { recentDays, streakOf, useFocusStore } from "@/stores/focus-store";
import { usePomodoroStore } from "@/stores/pomodoro-store";
import { useRoomStore } from "@/stores/room-store";

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Today, your streak, and the last seven days. Quiet, out of the way. */
export function FocusStats() {
  const now = useNow();
  const history = useFocusStore((state) => state.days);
  const dailyGoal = useFocusStore((state) => state.dailyGoal);
  const setDailyGoal = useFocusStore((state) => state.setDailyGoal);
  // Sessions counted before the history existed still show for today.
  const pomodoroToday = usePomodoroStore((state) => state.stats);
  const { minutes: lifetime } = useRoomUnlocks();
  const catName = useRoomStore((state) => state.catName.trim() || "Mochi");
  const next = nextUnlock(lifetime);

  if (!now) {
    return null;
  }

  const todayDate = todayKey(now);
  const days = history.some((day) => day.date === todayDate) || pomodoroToday.date !== todayDate
    ? history
    : [...history, { date: todayDate, minutes: pomodoroToday.minutes, sessions: pomodoroToday.sessions }];

  const week = recentDays(days, 7, now);
  const today = week[week.length - 1];
  const streak = streakOf(days, now);
  const weekMinutes = week.reduce((sum, day) => sum + day.minutes, 0);
  const peak = Math.max(30, ...week.map((day) => day.minutes));

  return (
    <section className="mb-6 space-y-4 border-b border-foreground/[0.06] pb-6">
      <p className="text-[11px] tracking-[0.25em] text-muted-foreground/80 lowercase">your focus</p>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "today", value: formatMinutes(today.minutes) },
          { label: "sessions", value: String(today.sessions) },
          { label: streak === 1 ? "day streak" : "days streak", value: String(streak) },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-foreground/[0.03] px-2 py-3">
            <dt className="text-[10px] tracking-wide text-muted-foreground/80">{item.label}</dt>
            <dd className="mt-1 font-display text-xl font-light">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* Today's goal */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/80">
          <span>
            {today.minutes >= dailyGoal ? "goal reached" : `${formatMinutes(Math.max(0, dailyGoal - today.minutes))} to go`}
          </span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Lower the daily goal"
              onClick={() => setDailyGoal(dailyGoal - 15)}
              className="grid size-5 place-items-center rounded-full hover:bg-foreground/5 hover:text-foreground"
            >
              −
            </button>
            <span className="tabular-nums">goal {formatMinutes(dailyGoal)}</span>
            <button
              type="button"
              aria-label="Raise the daily goal"
              onClick={() => setDailyGoal(dailyGoal + 15)}
              className="grid size-5 place-items-center rounded-full hover:bg-foreground/5 hover:text-foreground"
            >
              +
            </button>
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (today.minutes / dailyGoal) * 100)}%`,
              backgroundColor: today.minutes >= dailyGoal ? "var(--mint)" : "var(--ember)",
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex h-16 items-end justify-between gap-1.5" role="img" aria-label={`Focus over the last 7 days: ${formatMinutes(weekMinutes)} in total`}>
          {week.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1" title={`${day.date}: ${formatMinutes(day.minutes)}`}>
              <div
                className="w-full rounded-full transition-all duration-500"
                style={{
                  height: `${Math.max(4, (day.minutes / peak) * 56)}px`,
                  backgroundColor: day.minutes > 0 ? "var(--ember)" : "color-mix(in oklab, var(--foreground) 10%, transparent)",
                  opacity: day.date === todayDate ? 1 : 0.6,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between gap-1.5 text-[10px] text-muted-foreground/60">
          {week.map((day) => (
            <span key={day.date} className="flex-1 text-center">
              {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "narrow" })}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          {formatMinutes(weekMinutes)} this week
        </p>
      </div>

      {next && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
          <span aria-hidden="true">🌱</span>
          <span>
            Next for the room: {unlockTitle(next, catName).replace(/^A /, "a ")} ·{" "}
            {formatHours(next.minutes - lifetime)} to go
          </span>
        </p>
      )}
    </section>
  );
}
