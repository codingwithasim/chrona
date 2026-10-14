"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The ambient sound mixer. By default the sounds follow the room
 * (rain when it rains, crickets at night…). Touch any slider and it
 * becomes your own mix, which can be saved as a preset.
 */

export const CHANNELS = [
  "rain",
  "thunder",
  "wind",
  "birds",
  "cicadas",
  "crickets",
  "fire",
  "cafe",
  "brown",
] as const;

export type Channel = (typeof CHANNELS)[number];
export type Mix = Record<Channel, number>;

export const CHANNEL_INFO: Record<Channel, { label: string; jp: string }> = {
  rain: { label: "Rain", jp: "あめ" },
  thunder: { label: "Thunder", jp: "かみなり" },
  wind: { label: "Wind", jp: "かぜ" },
  birds: { label: "Birds", jp: "とり" },
  cicadas: { label: "Cicadas", jp: "せみ" },
  crickets: { label: "Crickets", jp: "むし" },
  fire: { label: "Fireplace", jp: "だんろ" },
  cafe: { label: "Café", jp: "カフェ" },
  brown: { label: "Brown noise", jp: "ノイズ" },
};

export const SILENT: Mix = {
  rain: 0,
  thunder: 0,
  wind: 0,
  birds: 0,
  cicadas: 0,
  crickets: 0,
  fire: 0,
  cafe: 0,
  brown: 0,
};

export type Preset = { id: string; name: string; mix: Mix };

export const BUILT_IN_PRESETS: Preset[] = [
  { id: "rainy-study", name: "Rainy study", mix: { ...SILENT, rain: 0.6, wind: 0.15, brown: 0.1 } },
  { id: "storm", name: "Storm", mix: { ...SILENT, rain: 0.95, thunder: 0.6, wind: 0.4 } },
  { id: "cafe", name: "Café", mix: { ...SILENT, cafe: 0.7, rain: 0.2 } },
  { id: "fireside", name: "Fireside", mix: { ...SILENT, fire: 0.7, wind: 0.25, rain: 0.15 } },
  { id: "summer-night", name: "Summer night", mix: { ...SILENT, crickets: 0.7, wind: 0.1 } },
  { id: "morning", name: "Morning", mix: { ...SILENT, birds: 0.65, wind: 0.1 } },
  { id: "deep-focus", name: "Deep focus", mix: { ...SILENT, brown: 0.7 } },
];

type MixerStore = {
  /** Sounds follow the weather, season and time of day. */
  follow: boolean;
  mix: Mix;
  presets: Preset[];

  setFollow: (follow: boolean) => void;
  setLevel: (channel: Channel, level: number) => void;
  applyMix: (mix: Mix) => void;
  savePreset: (name: string) => void;
  deletePreset: (id: string) => void;
};

export const useMixerStore = create<MixerStore>()(
  persist(
    (set) => ({
      follow: true,
      mix: BUILT_IN_PRESETS[0].mix,
      presets: [],

      setFollow: (follow) => set({ follow }),

      setLevel: (channel, level) =>
        set((state) => ({
          follow: false,
          mix: { ...state.mix, [channel]: Math.min(1, Math.max(0, level)) },
        })),

      applyMix: (mix) => set({ follow: false, mix: { ...SILENT, ...mix } }),

      savePreset: (name) =>
        set((state) => ({
          presets: [
            ...state.presets,
            { id: `mine-${Date.now()}`, name: name.trim().slice(0, 24) || "My mix", mix: state.mix },
          ],
        })),

      deletePreset: (id) =>
        set((state) => ({ presets: state.presets.filter((preset) => preset.id !== id) })),
    }),
    {
      name: "chrona-mixer",
      skipHydration: true,
      partialize: (state) => ({ follow: state.follow, mix: state.mix, presets: state.presets }),
    }
  )
);

/** Whether two mixes are (near enough) the same, to highlight a preset. */
export function sameMix(a: Mix, b: Mix) {
  return CHANNELS.every((channel) => Math.abs((a[channel] ?? 0) - (b[channel] ?? 0)) < 0.02);
}
