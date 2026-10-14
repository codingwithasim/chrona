/**
 * A tiny signal for when a timer or pomodoro phase ends, so the room
 * (Mochi, mostly) can react.
 */

export const SESSION_EVENT = "chrona:session";

/** "timer" or "focus": time for a break. "break": back to work. */
export type SessionEnd = "timer" | "focus" | "break";

export function announceSession(kind: SessionEnd) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<SessionEnd>(SESSION_EVENT, { detail: kind }));
  }
}
