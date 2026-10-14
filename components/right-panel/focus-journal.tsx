"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { useNow } from "@/hooks/use-now";
import { todayKey } from "@/lib/day-key";
import { type FocusEntry, useFocusStore } from "@/stores/focus-store";
import { useSceneStore } from "@/stores/scene-store";

const SHOWN = 4;

function dayLabel(date: Date, now: Date) {
  const key = todayKey(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (key === todayKey(now)) {
    return "Today";
  }

  if (key === todayKey(yesterday)) {
    return "Yesterday";
  }

  return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

/** The week's sessions, newest first, grouped by day. */
function groupByDay(entries: FocusEntry[], now: Date, hour24: boolean) {
  const groups: Array<{ label: string; rows: Array<FocusEntry & { time: string }> }> = [];

  for (const entry of [...entries].reverse()) {
    const date = new Date(entry.at);
    const label = dayLabel(date, now);
    const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: !hour24 });
    const group = groups.at(-1);

    if (group?.label === label) {
      group.rows.push({ ...entry, time });
    } else {
      groups.push({ label, rows: [{ ...entry, time }] });
    }
  }

  return groups;
}

/** What you got done, session by session, for the last seven days. */
export function FocusJournal() {
  const now = useNow();
  const log = useFocusStore((state) => state.log);
  const hour24 = useSceneStore((state) => state.hour24);
  const [all, setAll] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!now) {
    return null;
  }

  const since = new Date(now);
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);
  const week = log.filter((entry) => entry.at >= since.getTime());

  if (week.length === 0) {
    return null;
  }

  const groups = groupByDay(all ? week : week.slice(-SHOWN), now, hour24);

  async function copy() {
    const text = groupByDay(week, now!, hour24)
      .map((group) =>
        [
          group.label,
          ...group.rows.map((row) => `- ${row.time} · ${row.minutes}m · ${row.note ?? row.task ?? "focus"}`),
        ].join("\n")
      )
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard not allowed here; nothing to do.
    }
  }

  return (
    <section className="mb-6 space-y-3 border-b border-foreground/[0.06] pb-6">
      <div className="flex items-center justify-between">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground/80 lowercase">journal</p>
        <button
          type="button"
          onClick={copy}
          title="Copy the week as text"
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" strokeWidth={1.7} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="text-[11px] text-muted-foreground/70">{group.label}</p>
          <ul className="space-y-1">
            {group.rows.map((row) => (
              <li key={row.at} className="flex gap-2.5 text-[12px] leading-5">
                <span className="w-14 shrink-0 tabular-nums text-muted-foreground/60">{row.time}</span>
                <span className={row.note ? "min-w-0 flex-1 text-foreground/80" : "min-w-0 flex-1 text-muted-foreground/60"}>
                  {row.note ?? row.task ?? "Focus session"}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground/60">{row.minutes}m</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {week.length > SHOWN && (
        <button
          type="button"
          onClick={() => setAll((value) => !value)}
          className="text-[11px] text-muted-foreground/70 underline-offset-4 hover:text-foreground hover:underline"
        >
          {all ? "Show less" : `Show the whole week (${week.length})`}
        </button>
      )}
    </section>
  );
}
