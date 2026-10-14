const MINUTES_PER_DAY = 24 * 60;

export const WEEKDAYS = [
  { day: 0, short: "Sun", letter: "S", jp: "日" },
  { day: 1, short: "Mon", letter: "M", jp: "月" },
  { day: 2, short: "Tue", letter: "T", jp: "火" },
  { day: 3, short: "Wed", letter: "W", jp: "水" },
  { day: 4, short: "Thu", letter: "T", jp: "木" },
  { day: 5, short: "Fri", letter: "F", jp: "金" },
  { day: 6, short: "Sat", letter: "S", jp: "土" },
];

/**
 * Seconds until the alarm next rings, honoring repeat days.
 * Returns null for a repeating alarm with no valid day.
 */
export function getSecondsUntilAlarm(
  alarmMinutes: number,
  now = new Date(),
  repeat: number[] = []
) {
  const nowSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const seconds = dayOffset * 86_400 + alarmMinutes * 60 - nowSeconds;

    if (seconds <= 0) {
      continue;
    }

    const weekday = (now.getDay() + dayOffset) % 7;

    if (repeat.length === 0 || repeat.includes(weekday)) {
      return seconds;
    }
  }

  return null;
}

export function formatTimeUntilAlarm(
  alarmMinutes: number,
  now = new Date(),
  repeat: number[] = []
) {
  const remainingSeconds = getSecondsUntilAlarm(alarmMinutes, now, repeat);

  if (remainingSeconds === null) {
    return "No days selected";
  }

  if (remainingSeconds < 60) {
    return "In less than a minute";
  }

  const totalMinutes = Math.ceil(remainingSeconds / 60);
  const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `In ${days} ${days === 1 ? "day" : "days"}${hours ? ` ${hours} hr` : ""}`;
  }

  if (hours === 0) {
    return `In ${minutes} min`;
  }

  if (minutes === 0) {
    return `In ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `In ${hours} hr ${minutes} min`;
}

export function describeRepeat(repeat: number[] = []) {
  const days = [...repeat].sort((a, b) => a - b);

  if (days.length === 0) return "Once";
  if (days.length === 7) return "Every day";
  if (days.join() === "1,2,3,4,5") return "Weekdays";
  if (days.join() === "0,6") return "Weekends";

  return days.map((day) => WEEKDAYS[day].short).join(", ");
}

export function minutesToTimeParts(minutes: number, hour24 = false) {
  const normalized =
    ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  const hours24 = Math.floor(normalized / 60);
  const mins = String(normalized % 60).padStart(2, "0");

  if (hour24) {
    return {
      hour: String(hours24).padStart(2, "0"),
      minute: mins,
      meridiem: "",
    };
  }

  return {
    hour: String(hours24 % 12 || 12).padStart(2, "0"),
    minute: mins,
    meridiem: hours24 >= 12 ? "PM" : "AM",
  };
}

export function minutesToTime(minutes: number, hour24 = false) {
  const { hour, minute, meridiem } = minutesToTimeParts(minutes, hour24);

  return `${hour}:${minute}${meridiem ? ` ${meridiem}` : ""}`;
}

export function minutesToInputTime(minutes: number) {
  const { hour, minute } = minutesToTimeParts(minutes, true);
  return `${hour}:${minute}`;
}

export function inputTimeToMinutes(value: string) {
  const [hoursValue, minutesValue] = value.split(":");

  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export function getCurrentMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

export function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
