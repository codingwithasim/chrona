"use client";

import { useEffect, useState } from "react";
import { Check, Wind } from "lucide-react";

import { useNow } from "@/hooks/use-now";
import { useFocusStore } from "@/stores/focus-store";
import { useRoomStore } from "@/stores/room-store";

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

/** One line about the session that just ended, for the journal. */
function SessionNote() {
  const now = useNow();
  const last = useFocusStore((state) => state.log[state.log.length - 1]);
  const noteLast = useFocusStore((state) => state.noteLast);
  const [draft, setDraft] = useState("");

  // Only for a session that just finished.
  if (!now || !last || now.getTime() - last.at > 40 * 60_000) {
    return null;
  }

  if (last.note) {
    return (
      <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground/80">
        <Check className="size-3.5" strokeWidth={2} style={{ color: "var(--mint)" }} />
        Noted in your journal
      </p>
    );
  }

  return (
    <form
      className="w-full"
      onSubmit={(event) => {
        event.preventDefault();
        noteLast(draft);
      }}
    >
      <input
        value={draft}
        maxLength={140}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="What did you get done in that session?"
        placeholder="What did you get done?"
        className="h-8 w-full rounded-full border border-foreground/15 bg-background/45 px-3.5 text-center text-[12px] backdrop-blur-sm outline-none placeholder:text-foreground/55 focus:border-foreground/30 focus:bg-background/60"
      />
    </form>
  );
}

/** During a break: a small idea for resting, and an offer to breathe. */
export function BreakCompanion({ cycle }: { cycle: number }) {
  const [breathing, setBreathing] = useState(false);
  const name = useRoomStore((state) => state.catName.trim() || "Mochi");
  const suggestion = SUGGESTIONS[cycle % SUGGESTIONS.length].replace("Mochi", name);

  if (breathing) {
    return <Breathing onDone={() => setBreathing(false)} />;
  }

  return (
    <div className="flex w-[16rem] max-w-full flex-col items-center gap-2 text-center">
      <SessionNote />
      <p className="text-[12px] leading-5 text-muted-foreground">{suggestion}</p>
      <button
        type="button"
        onClick={() => setBreathing(true)}
        className="chip"
      >
        <Wind className="size-3.5" strokeWidth={1.7} />
        Breathe with me
      </button>
    </div>
  );
}
