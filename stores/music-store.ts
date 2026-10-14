"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { addTracks, listTracks, removeTrack, type Track, trackBlob } from "@/lib/music-library";

/**
 * A tiny player for your own music: one <audio> element, files read
 * from this browser's storage.
 */

type MusicStore = {
  tracks: Track[];
  loaded: boolean;
  currentId: string | null;
  playing: boolean;
  volume: number;
  shuffle: boolean;
  /** A track that couldn't be played (unsupported format). */
  failedId: string | null;

  load: () => Promise<void>;
  add: (files: File[]) => Promise<number>;
  remove: (id: string) => Promise<void>;
  play: (id?: string) => Promise<void>;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
};

let audio: HTMLAudioElement | null = null;
let objectUrl: string | null = null;

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => {
      function element() {
        if (!audio) {
          audio = new Audio();
          audio.preload = "auto";
          audio.volume = get().volume;
          audio.addEventListener("ended", () => get().next());
          audio.addEventListener("pause", () => set({ playing: false }));
          audio.addEventListener("play", () => set({ playing: true }));
          audio.addEventListener("error", () => {
            const { currentId, tracks } = get();
            set({ playing: false, failedId: currentId });

            // Skip what this browser can't play, unless it's the only one.
            if (tracks.length > 1) {
              window.setTimeout(() => get().next(), 400);
            }
          });
          mediaKeys();
        }

        return audio;
      }

      /** Play/pause and skip from the keyboard's media keys. */
      function mediaKeys() {
        const session = navigator.mediaSession;

        if (!session) {
          return;
        }

        session.setActionHandler("play", () => void get().play());
        session.setActionHandler("pause", () => get().pause());
        session.setActionHandler("nexttrack", () => get().next());
        session.setActionHandler("previoustrack", () => get().previous());
      }

      function step(direction: 1 | -1) {
        const { tracks, currentId, shuffle } = get();

        if (tracks.length === 0) {
          return;
        }

        const index = tracks.findIndex((track) => track.id === currentId);
        let next = (index + direction + tracks.length) % tracks.length;

        if (shuffle && tracks.length > 2 && direction === 1) {
          do {
            next = Math.floor(Math.random() * tracks.length);
          } while (next === index);
        }

        void get().play(tracks[next].id);
      }

      return {
        tracks: [],
        loaded: false,
        currentId: null,
        playing: false,
        volume: 0.6,
        shuffle: false,
        failedId: null,

        load: async () => {
          try {
            set({ tracks: await listTracks(), loaded: true });
          } catch {
            set({ loaded: true });
          }
        },

        add: async (files) => {
          const added = await addTracks(files);
          await get().load();
          return added;
        },

        remove: async (id) => {
          if (get().currentId === id) {
            audio?.pause();
            set({ currentId: null });
          }

          await removeTrack(id);
          await get().load();
        },

        play: async (id) => {
          const { tracks, currentId } = get();
          const target = id ?? currentId ?? tracks[0]?.id;

          if (!target) {
            return;
          }

          const player = element();

          // One thing playing at a time: the lo-fi radio steps aside.
          const { useRadioStore } = await import("./radio-store");
          useRadioStore.getState().stop();

          // Same track: just carry on.
          if (target === currentId && player.src) {
            await player.play().catch(() => {});
            return;
          }

          const blob = await trackBlob(target);

          if (!blob) {
            return;
          }

          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }

          objectUrl = URL.createObjectURL(blob);
          player.src = objectUrl;
          set({ currentId: target, failedId: null });

          const track = tracks.find((item) => item.id === target);

          if (navigator.mediaSession && track && "MediaMetadata" in window) {
            navigator.mediaSession.metadata = new MediaMetadata({ title: track.name, artist: "Chrona" });
          }

          await player.play().catch(() => {});
        },

        pause: () => audio?.pause(),

        toggle: () => {
          if (get().playing) {
            get().pause();
          } else {
            void get().play();
          }
        },

        next: () => step(1),
        previous: () => {
          // A few seconds in, "previous" means start this one again.
          if (audio && audio.currentTime > 4) {
            audio.currentTime = 0;
            return;
          }

          step(-1);
        },

        setVolume: (volume) => {
          const clamped = Math.min(1, Math.max(0, volume));

          if (audio) {
            audio.volume = clamped;
          }

          set({ volume: clamped });
        },

        toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      };
    },
    {
      name: "chrona-music",
      skipHydration: true,
      partialize: (state) => ({ volume: state.volume, shuffle: state.shuffle, currentId: state.currentId }),
    }
  )
);
