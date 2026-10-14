"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** A small notepad, opened from the corkboard (or N). Saved as you type. */
type NotesStore = {
  text: string;
  open: boolean;
  setText: (text: string) => void;
  setOpen: (open: boolean) => void;
};

export const useNotesStore = create<NotesStore>()(
  persist(
    (set) => ({
      text: "",
      open: false,
      setText: (text) => set({ text: text.slice(0, 20000) }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "chrona-notes",
      skipHydration: true,
      partialize: (state) => ({ text: state.text }),
    }
  )
);
