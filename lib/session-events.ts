/**
 * A tiny signal for when a timer or pomodoro phase ends, so the room
 * (Mochi, mostly) and your focus history can react.
 */

export const SESSION_EVENT = "chrona:session";

/** "timer" or "focus": time for a break. "break": back to work. */
export type SessionEnd = "timer" | "focus" | "break";

export type SessionDetail = { kind: SessionEnd; minutes: number };

export function announceSession(kind: SessionEnd, minutes = 0) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<SessionDetail>(SESSION_EVENT, { detail: { kind, minutes } }));
  }
}
