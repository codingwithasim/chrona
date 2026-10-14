"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UnlockId } from "@/lib/unlocks";

/** Mochi's coat: fur, shading, and the two patch colours. */
export type Coat = "calico" | "ginger" | "tuxedo" | "grey" | "snow";

export const COATS: Record<Coat, { label: string; fur: string; shade: string; patch: string; patch2: string }> = {
  calico: { label: "Calico", fur: "#fff6ee", shade: "#ead8cc", patch: "#f3a65c", patch2: "#6a4c42" },
  ginger: { label: "Ginger", fur: "#f8cf9c", shade: "#e3a96e", patch: "#ec9a52", patch2: "#d27c3c" },
  tuxedo: { label: "Tuxedo", fur: "#3d3944", shade: "#2b2831", patch: "#34303b", patch2: "#26232c" },
  grey: { label: "Blue grey", fur: "#c8ced8", shade: "#a8b0bd", patch: "#a3abb9", patch2: "#858e9e" },
  snow: { label: "Snow", fur: "#fffaf6", shade: "#ece4de", patch: "#f3e7dc", patch2: "#e6d8cb" },
};

export const DEFAULT_CAT_NAME = "Mochi";

type RoomStore = {
  catName: string;
  coat: Coat;
  /** Earned things you'd rather not see in the room. */
  hidden: UnlockId[];
  /** The star lamp's switch. */
  starLamp: boolean;
  toggleStarLamp: () => void;
  setCatName: (name: string) => void;
  setCoat: (coat: Coat) => void;
  toggleHidden: (id: UnlockId) => void;
};

export const useRoomStore = create<RoomStore>()(
  persist(
    (set) => ({
      catName: DEFAULT_CAT_NAME,
      coat: "calico",
      hidden: [],
      starLamp: true,
      toggleStarLamp: () => set((state) => ({ starLamp: !state.starLamp })),
      setCatName: (catName) => set({ catName: catName.replace(/\s+/g, " ").slice(0, 16) }),
      setCoat: (coat) => set({ coat }),
      toggleHidden: (id) =>
        set((state) => ({
          hidden: state.hidden.includes(id) ? state.hidden.filter((item) => item !== id) : [...state.hidden, id],
        })),
    }),
    {
      name: "chrona-room",
      skipHydration: true,
    }
  )
);

/** The cat's name, for messages written outside React. */
export function catName() {
  return useRoomStore.getState().catName.trim() || DEFAULT_CAT_NAME;
}
