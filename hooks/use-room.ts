"use client";

import { plantGrowth, type UnlockId, UNLOCKS } from "@/lib/unlocks";
import { lifetimeMinutes, useFocusStore } from "@/stores/focus-store";
import { useRoomStore } from "@/stores/room-store";

/** What the room has earned so far, minus anything you've hidden. */
export function useRoomUnlocks() {
  const minutes = useFocusStore(lifetimeMinutes);
  const hidden = useRoomStore((state) => state.hidden);

  const shows = (id: UnlockId) =>
    !hidden.includes(id) && minutes >= (UNLOCKS.find((unlock) => unlock.id === id)?.minutes ?? Infinity);

  return { minutes, shows, growth: plantGrowth(minutes) };
}
