/** Time zone helpers built on Intl, working from a given instant. */

const partsCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timezone: string) {
  let format = partsCache.get(timezone);

  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

    partsCache.set(timezone, format);
  }

  return format;
}

function zonedParts(date: Date, timezone: string) {
  const parts = Object.fromEntries(
    formatter(timezone)
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Minutes since midnight in the given time zone. */
export function minutesOfDay(date: Date, timezone: string) {
  const { hour, minute } = zonedParts(date, timezone);
  return hour * 60 + minute;
}

/** The zone's UTC offset in minutes at that instant. */
export function zoneOffsetMinutes(date: Date, timezone: string) {
  const p = zonedParts(date, timezone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);

  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** "+5h", "-3h 30m", or null when it matches local time. */
export function offsetFromLocal(date: Date, timezone: string) {
  const local = -date.getTimezoneOffset();
  const difference = zoneOffsetMinutes(date, timezone) - local;

  if (difference === 0) {
    return null;
  }

  const sign = difference > 0 ? "+" : "−";
  const hours = Math.floor(Math.abs(difference) / 60);
  const minutes = Math.abs(difference) % 60;

  return `${sign}${hours}h${minutes ? ` ${minutes}m` : ""}`;
}

export function gmtLabel(date: Date, timezone: string) {
  const offset = zoneOffsetMinutes(date, timezone);
  const sign = offset >= 0 ? "+" : "−";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;

  return `GMT${sign}${hours}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`;
}

export function formatZonedTime(date: Date, timezone: string, hour24: boolean) {
  const { hour, minute } = zonedParts(date, timezone);
  const mm = String(minute).padStart(2, "0");

  if (hour24) {
    return { time: `${String(hour).padStart(2, "0")}:${mm}`, meridiem: "" };
  }

  return {
    time: `${String(hour % 12 || 12).padStart(2, "0")}:${mm}`,
    meridiem: hour >= 12 ? "PM" : "AM",
  };
}

export function formatZonedDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(date);
}

/** Calendar-day difference from local time: -1, 0 or +1. */
export function dayShift(date: Date, timezone: string) {
  const zoned = zonedParts(date, timezone);
  const there = Date.UTC(zoned.year, zoned.month - 1, zoned.day);
  const here = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round((there - here) / 86_400_000);
}

export type DayPhase = "night" | "dawn" | "day" | "dusk";

export function dayPhase(minutes: number): DayPhase {
  const hour = minutes / 60;

  if (hour < 5 || hour >= 20) return "night";
  if (hour < 7) return "dawn";
  if (hour < 17.5) return "day";

  return "dusk";
}

export function formatMinutes(minutes: number, hour24: boolean) {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const mm = String(normalized % 60).padStart(2, "0");

  if (hour24) {
    return `${String(hour).padStart(2, "0")}:${mm}`;
  }

  return `${hour % 12 || 12}:${mm} ${hour >= 12 ? "PM" : "AM"}`;
}
