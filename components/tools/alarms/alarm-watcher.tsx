"use client";

import { useAlarmChecker } from "./use-alarm-checker";

/** Mounted once in the root layout so alarms ring on every page. */
export function AlarmWatcher() {
  useAlarmChecker();

  return null;
}
