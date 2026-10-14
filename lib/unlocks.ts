/**
 * The room grows with you: a little something new appears as your
 * focus time adds up. Nothing to buy, nothing to lose.
 */

export type UnlockId = "pothos" | "bell" | "polaroid" | "stars";

export type Unlock = {
  id: UnlockId;
  /** Lifetime focus minutes it takes. */
  minutes: number;
  title: string;
  where: string;
};

export const UNLOCKS: Unlock[] = [
  { id: "pothos", minutes: 30, title: "A pothos cutting", where: "Hangs by the window, and grows as you focus." },
  { id: "bell", minutes: 180, title: "A bell for {cat}", where: "On a little red collar." },
  { id: "polaroid", minutes: 480, title: "A polaroid of {cat}", where: "Pinned to the corkboard." },
  { id: "stars", minutes: 1200, title: "A star lamp", where: "Stars on the ceiling at night." },
];

/** How grown the pothos is, 0 to 1, from its first half hour to 40 hours. */
export function plantGrowth(minutes: number) {
  const first = UNLOCKS[0].minutes;
  const full = 40 * 60;

  if (minutes < first) {
    return 0;
  }

  // Quick at first, slower later, so early sessions show.
  return Math.min(1, Math.sqrt((minutes - first) / (full - first)) * 0.92 + 0.08);
}

/** An unlock's name, with your cat's name in it. */
export function unlockTitle(unlock: Unlock, cat: string) {
  return unlock.title.replace("{cat}", cat);
}

export function nextUnlock(minutes: number) {
  return UNLOCKS.find((unlock) => unlock.minutes > minutes) ?? null;
}

/** Unlocks crossed by going from `before` to `after` minutes. */
export function crossed(before: number, after: number) {
  return UNLOCKS.filter((unlock) => before < unlock.minutes && after >= unlock.minutes);
}

export function formatHours(minutes: number) {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
