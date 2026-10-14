"use client";

import { create } from "zustand";

import { catName } from "./room-store";

export type DialogueTone = "info" | "alert";

export type DialogueMessage = {
  id: number;
  speaker: string;
  text: string;
  tone: DialogueTone;

  /** Sticky messages stay until dismissed. */
  sticky: boolean;

  actionLabel?: string;
  onDismiss?: () => void;
};

type SayInput = {
  text: string;
  speaker?: string;
  tone?: DialogueTone;
  sticky?: boolean;
  actionLabel?: string;
  onDismiss?: () => void;
};

type DialogueStore = {
  current: DialogueMessage | null;
  say: (input: SayInput) => void;
  dismiss: () => void;
};

let nextId = 1;

export const useDialogueStore = create<DialogueStore>(
  (set, get) => ({
    current: null,

    say: ({
      text,
      speaker = catName(),
      tone = "info",
      sticky = false,
      actionLabel,
      onDismiss,
    }) => {
      // A replaced message still gets its cleanup.
      get().current?.onDismiss?.();

      set({
        current: {
          id: nextId++,
          speaker,
          text,
          tone,
          sticky,
          actionLabel,
          onDismiss,
        },
      });
    },

    dismiss: () => {
      const current = get().current;

      if (!current) {
        return;
      }

      set({ current: null });
      current.onDismiss?.();
    },
  })
);

/** Fire-and-forget helper usable outside React. */
export function say(input: SayInput) {
  useDialogueStore.getState().say(input);
}
