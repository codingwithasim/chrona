"use client";

import { useSyncExternalStore } from "react";

function subscribeToClock(callback: () => void) {
  // Poll faster than once per second so the snapshot
  // flips close to the real second boundary.
  const id = window.setInterval(callback, 250);
  return () => window.clearInterval(id);
}

function getSecondSnapshot() {
  return Math.floor(Date.now() / 1000);
}

function getServerSnapshot() {
  return null;
}

/**
 * Current time, updated every second.
 * Returns null during server rendering and hydration.
 */
export function useNow(): Date | null {
  const seconds = useSyncExternalStore(
    subscribeToClock,
    getSecondSnapshot,
    getServerSnapshot
  );

  return seconds === null ? null : new Date(seconds * 1000);
}

function subscribeNever() {
  return () => {};
}

/** True once the component renders on the client. */
export function useMounted() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}
