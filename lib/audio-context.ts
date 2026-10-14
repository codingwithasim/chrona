"use client";

let context: AudioContext | null = null;

/**
 * One shared AudioContext for sound effects and alarm tones.
 * Browsers only let it play after the first user gesture.
 */
export function getAudioContext() {
  context ??= new AudioContext();

  if (context.state === "suspended") {
    void context.resume();
  }

  return context;
}

// Unlock audio on the first interaction so alarms can ring later,
// even when they fire without a click.
if (typeof window !== "undefined") {
  const unlock = () => {
    getAudioContext();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}
