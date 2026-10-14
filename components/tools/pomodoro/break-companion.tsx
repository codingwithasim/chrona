"use client";

import { useEffect, useState } from "react";
import { Wind } from "lucide-react";

const SUGGESTIONS = [
  "Stand up and stretch your arms over your head.",
  "Drink a glass of water.",
  "Look out of the window at something far away for 20 seconds.",
  "Roll your shoulders back, slowly, five times.",
  "Close your eyes and listen to the rain for a moment.",
  "Walk around the room once. Mochi would.",
  "Unclench your jaw. Relax your hands.",
  "Refill your tea.",
];

/* Box breathing: in, hold, out, hold — four seconds each. */
const PHASES = [
  { label: "breathe in", scale: 1 },
  { label: "hold", scale: 1 },
  { label: "breathe out", scale: 0.55 },
  { label: "hold", scale: 0.55 },
] as const;

function Breathing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Four rounds of four phases, then back to the suggestion.
    const id = window.setInterval(() => {
      setStep((value) => value + 1);
    }, 4000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (step >= 16) {
      onDone();
    }
  }, [step, onDone]);

  const phase = PHASES[step % 4];

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="Stop breathing exercise"
      className="flex flex-col items-center gap-3"
    >
      <span className="relative grid size-20 place-items-center">
        <span
          className="absolute inset-0 rounded-full bg-[var(--sky)] opacity-20"
          style={{ transform: `scale(${phase.scale})`, transition: "transform 4s ease-in-out" }}
        />
        <span
          className="absolute inset-3 rounded-full bg-[var(--sky)] opacity-30"
          style={{ transform: `scale(${phase.scale})`, transition: "transform 4s ease-in-out" }}
        />
      </span>
      <span aria-live="polite" className="text-[12px] tracking-[0.2em] text-muted-foreground lowercase">
        {phase.label}
      </span>
    </button>
  );
}

/** During a break: a small idea for resting, and an offer to breathe. */
export function BreakCompanion({ cycle }: { cycle: number }) {
  const [breathing, setBreathing] = useState(false);
  const suggestion = SUGGESTIONS[cycle % SUGGESTIONS.length];

  if (breathing) {
    return <Breathing onDone={() => setBreathing(false)} />;
  }

  return (
    <div className="flex max-w-[16rem] flex-col items-center gap-2 text-center">
      <p className="text-[12px] leading-5 text-muted-foreground">{suggestion}</p>
      <button
        type="button"
        onClick={() => setBreathing(true)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] text-foreground/70 transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
      >
        <Wind className="size-3.5" strokeWidth={1.7} />
        Breathe with me
      </button>
    </div>
  );
}
