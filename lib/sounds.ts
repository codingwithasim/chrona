"use client";

import { getAudioContext } from "./audio-context";

/**
 * A small library of alarm and notification tones, all synthesized
 * with the Web Audio API. Each tone schedules one "phrase"; alarms
 * repeat the phrase until they are stopped.
 */

export type SoundId =
  | "music-box"
  | "kalimba"
  | "wind-chime"
  | "marimba"
  | "digital"
  | "bell"
  | "retro"
  | "temple-bell"
  | "koto"
  | "station"
  | "meow"
  | "bubbles"
  | "level-up"
  | "birds"
  | "raindrops";

type Voice = (ctx: AudioContext, out: AudioNode, at: number) => number;

export type SoundDefinition = {
  id: SoundId;
  name: string;
  jp: string;
  /** Seconds between repeats when looping. */
  loopEvery: number;
  play: Voice;
};

export type SoundCategory = {
  id: string;
  label: string;
  jp: string;
  sounds: SoundId[];
};

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

const NOTE: Record<string, number> = {};

// A4 = 440 Hz, names like "C5", "F#4".
["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].forEach(
  (name, index) => {
    for (let octave = 1; octave <= 8; octave++) {
      const midi = (octave + 1) * 12 + index;
      NOTE[`${name}${octave}`] = 440 * Math.pow(2, (midi - 69) / 12);
    }
  }
);

function env(
  ctx: AudioContext,
  out: AudioNode,
  at: number,
  peak: number,
  attack: number,
  decay: number
) {
  const gain = ctx.createGain();

  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  gain.connect(out);

  return gain;
}

function osc(
  ctx: AudioContext,
  out: AudioNode,
  type: OscillatorType,
  frequency: number,
  at: number,
  peak: number,
  decay: number,
  attack = 0.005
) {
  const node = ctx.createOscillator();
  node.type = type;
  node.frequency.setValueAtTime(frequency, at);
  node.connect(env(ctx, out, at, peak, attack, decay));
  node.start(at);
  node.stop(at + attack + decay + 0.05);

  return node;
}

/** Bell-like tone from a few (in)harmonic partials. */
function partials(
  ctx: AudioContext,
  out: AudioNode,
  frequency: number,
  at: number,
  peak: number,
  decay: number,
  ratios: Array<[number, number]>
) {
  for (const [ratio, level] of ratios) {
    // Higher, quieter partials fade out sooner.
    osc(ctx, out, "sine", frequency * ratio, at, peak * level, decay * (0.55 + level * 0.45));
  }
}

function pluck(
  ctx: AudioContext,
  out: AudioNode,
  frequency: number,
  at: number,
  peak: number,
  decay = 1.4
) {
  const node = ctx.createOscillator();
  node.type = "sawtooth";
  node.frequency.setValueAtTime(frequency, at);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(frequency * 8, at);
  filter.frequency.exponentialRampToValueAtTime(frequency * 1.2, at + 0.25);

  node.connect(filter).connect(env(ctx, out, at, peak, 0.004, decay));
  node.start(at);
  node.stop(at + decay + 0.1);
}

function chirp(
  ctx: AudioContext,
  out: AudioNode,
  from: number,
  to: number,
  at: number,
  duration: number,
  peak: number
) {
  const node = ctx.createOscillator();
  node.type = "sine";
  node.frequency.setValueAtTime(from, at);
  node.frequency.exponentialRampToValueAtTime(to, at + duration);
  node.connect(env(ctx, out, at, peak, 0.01, duration));
  node.start(at);
  node.stop(at + duration + 0.05);
}

function sequence(
  notes: Array<string | null>,
  step: number,
  voice: (frequency: number, at: number, index: number) => void,
  at: number
) {
  notes.forEach((note, index) => {
    if (note) {
      voice(NOTE[note], at + index * step, index);
    }
  });

  return notes.length * step;
}

/* ------------------------------------------------------------------ */
/* The library                                                         */
/* ------------------------------------------------------------------ */

const definitions: SoundDefinition[] = [
  {
    id: "music-box",
    name: "Music box",
    jp: "オルゴール",
    loopEvery: 3.4,
    play: (ctx, out, at) =>
      sequence(
        ["E6", "G6", "C7", "B6", "G6", "A6", "E6", null, "D6", "E6", "G6", null],
        0.24,
        (f, t) =>
          partials(ctx, out, f, t, 0.18, 1.3, [
            [1, 1],
            [2, 0.25],
            [3.01, 0.12],
          ]),
        at
      ),
  },
  {
    id: "kalimba",
    name: "Kalimba",
    jp: "カリンバ",
    loopEvery: 2.8,
    play: (ctx, out, at) =>
      sequence(
        ["C5", "E5", "G5", "A5", "G5", "E5", "D5", "G4"],
        0.28,
        (f, t) =>
          partials(ctx, out, f, t, 0.3, 0.9, [
            [1, 1],
            [5.4, 0.15],
          ]),
        at
      ),
  },
  {
    id: "wind-chime",
    name: "Wind chime",
    jp: "ふうりん",
    loopEvery: 3.6,
    play: (ctx, out, at) => {
      const scale = ["C7", "D7", "E7", "G7", "A7", "C8"];

      for (let i = 0; i < 7; i++) {
        const note = scale[Math.floor(Math.random() * scale.length)];

        partials(ctx, out, NOTE[note], at + i * 0.32 + Math.random() * 0.12, 0.1, 2.4, [
          [1, 1],
          [2.76, 0.3],
        ]);
      }

      return 3;
    },
  },
  {
    id: "marimba",
    name: "Marimba",
    jp: "マリンバ",
    loopEvery: 2.4,
    play: (ctx, out, at) =>
      sequence(
        ["G4", "C5", "E5", "G5", null, "E5", "G5", "C6"],
        0.2,
        (f, t) =>
          partials(ctx, out, f, t, 0.32, 0.45, [
            [1, 1],
            [4, 0.2],
            [10, 0.05],
          ]),
        at
      ),
  },
  {
    id: "digital",
    name: "Digital beep",
    jp: "デジタル",
    loopEvery: 1.4,
    play: (ctx, out, at) => {
      for (let i = 0; i < 4; i++) {
        osc(ctx, out, "square", 2048, at + i * 0.16, 0.08, 0.09);
      }

      return 0.8;
    },
  },
  {
    id: "bell",
    name: "Ringing bell",
    jp: "ベル",
    loopEvery: 1.8,
    play: (ctx, out, at) => {
      for (let i = 0; i < 10; i++) {
        partials(ctx, out, i % 2 ? NOTE["A5"] : NOTE["G#5"], at + i * 0.07, 0.12, 0.5, [
          [1, 1],
          [2.76, 0.4],
          [5.4, 0.2],
        ]);
      }

      return 1.2;
    },
  },
  {
    id: "retro",
    name: "Retro game",
    jp: "レトロ",
    loopEvery: 1.6,
    play: (ctx, out, at) =>
      sequence(
        ["C5", "G5", "C6", null, "C5", "G5", "C6"],
        0.11,
        (f, t) => osc(ctx, out, "square", f, t, 0.07, 0.1),
        at
      ),
  },
  {
    id: "temple-bell",
    name: "Temple bell",
    jp: "かね",
    loopEvery: 5,
    play: (ctx, out, at) => {
      const base = NOTE["A2"];

      partials(ctx, out, base, at, 0.5, 4.5, [
        [1, 1],
        [2.01, 0.5],
        [2.76, 0.35],
        [4.07, 0.2],
        [5.4, 0.1],
      ]);

      // Slow beating gives the bell its "wah-wah" shimmer.
      osc(ctx, out, "sine", base * 2.03, at, 0.12, 4);

      return 4.5;
    },
  },
  {
    id: "koto",
    name: "Koto",
    jp: "こと",
    loopEvery: 3,
    play: (ctx, out, at) =>
      sequence(
        ["E4", "F4", "A4", "B4", "C5", null, "B4", "A4", "E5"],
        0.26,
        (f, t) => pluck(ctx, out, f, t, 0.22),
        at
      ),
  },
  {
    id: "station",
    name: "Station melody",
    jp: "えきメロ",
    loopEvery: 2.6,
    play: (ctx, out, at) =>
      sequence(
        ["E5", "G#5", "B5", "E6", "D#6", "B5", "C#6", "E6"],
        0.18,
        (f, t) =>
          partials(ctx, out, f, t, 0.2, 0.7, [
            [1, 1],
            [3, 0.18],
            [4.2, 0.08],
          ]),
        at
      ),
  },
  {
    id: "meow",
    name: "Meow",
    jp: "にゃー",
    loopEvery: 1.8,
    play: (ctx, out, at) => {
      for (const offset of [0, 0.7]) {
        const t = at + offset;
        const node = ctx.createOscillator();
        node.type = "sawtooth";
        node.frequency.setValueAtTime(520, t);
        node.frequency.exponentialRampToValueAtTime(880, t + 0.16);
        node.frequency.exponentialRampToValueAtTime(460, t + 0.5);

        const formant = ctx.createBiquadFilter();
        formant.type = "bandpass";
        formant.Q.value = 3;
        formant.frequency.setValueAtTime(900, t);
        formant.frequency.exponentialRampToValueAtTime(1600, t + 0.18);
        formant.frequency.exponentialRampToValueAtTime(700, t + 0.5);

        node.connect(formant).connect(env(ctx, out, t, 0.5, 0.06, 0.48));
        node.start(t);
        node.stop(t + 0.6);
      }

      return 1.3;
    },
  },
  {
    id: "bubbles",
    name: "Bubbles",
    jp: "あわ",
    loopEvery: 1.6,
    play: (ctx, out, at) => {
      for (let i = 0; i < 6; i++) {
        const from = 300 + Math.random() * 500;
        chirp(ctx, out, from, from * 2.6, at + i * 0.12, 0.09, 0.25);
      }

      return 0.9;
    },
  },
  {
    id: "level-up",
    name: "Level up",
    jp: "レベルアップ",
    loopEvery: 1.8,
    play: (ctx, out, at) => {
      const length = sequence(
        ["C5", "E5", "G5", "C6"],
        0.09,
        (f, t) => osc(ctx, out, "triangle", f, t, 0.18, 0.18),
        at
      );

      for (const note of ["C6", "E6", "G6"]) {
        osc(ctx, out, "square", NOTE[note], at + length, 0.04, 0.5);
      }

      return length + 0.5;
    },
  },
  {
    id: "birds",
    name: "Morning birds",
    jp: "ことり",
    loopEvery: 2.6,
    play: (ctx, out, at) => {
      let t = at;

      for (let i = 0; i < 3; i++) {
        const base = 2600 + Math.random() * 900;

        chirp(ctx, out, base, base * 1.5, t, 0.07, 0.16);
        chirp(ctx, out, base * 1.4, base * 0.9, t + 0.09, 0.08, 0.14);
        t += 0.45 + Math.random() * 0.3;
      }

      return t - at;
    },
  },
  {
    id: "raindrops",
    name: "Raindrops",
    jp: "あまおと",
    loopEvery: 2.2,
    play: (ctx, out, at) => {
      const scale = ["G5", "A5", "C6", "D6", "E6", "G6"];

      for (let i = 0; i < 8; i++) {
        const note = scale[Math.floor(Math.random() * scale.length)];
        chirp(ctx, out, NOTE[note] * 0.8, NOTE[note], at + i * 0.18 + Math.random() * 0.06, 0.12, 0.22);
      }

      return 1.6;
    },
  },
];

export const SOUNDS = Object.fromEntries(
  definitions.map((definition) => [definition.id, definition])
) as Record<SoundId, SoundDefinition>;

export const SOUND_CATEGORIES: SoundCategory[] = [
  { id: "gentle", label: "Gentle", jp: "やさしい", sounds: ["music-box", "kalimba", "wind-chime", "marimba"] },
  { id: "classic", label: "Classic", jp: "クラシック", sounds: ["digital", "bell", "retro"] },
  { id: "japan", label: "Japanese", jp: "和風", sounds: ["temple-bell", "koto", "station"] },
  { id: "cute", label: "Cute", jp: "かわいい", sounds: ["meow", "bubbles", "level-up"] },
  { id: "nature", label: "Nature", jp: "しぜん", sounds: ["birds", "raindrops"] },
];

export function isSoundId(value: unknown): value is SoundId {
  return typeof value === "string" && value in SOUNDS;
}

/* ------------------------------------------------------------------ */
/* Playback                                                            */
/* ------------------------------------------------------------------ */

type PlayOptions = {
  loop?: boolean;
  volume?: number;
  /** Stop looping after this many milliseconds. */
  maxDuration?: number;
};

/**
 * Plays a tone and returns a function that stops it.
 */
export function playSound(
  id: SoundId,
  { loop = false, volume = 0.8, maxDuration = 60_000 }: PlayOptions = {}
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const definition = SOUNDS[id] ?? SOUNDS["music-box"];

  let ctx: AudioContext;

  try {
    ctx = getAudioContext();
  } catch {
    return () => {};
  }

  const master = ctx.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume));
  master.connect(ctx.destination);

  let timer: number | null = null;
  let stopped = false;
  const startedAt = Date.now();

  function phrase() {
    if (stopped) {
      return;
    }

    definition.play(ctx, master, ctx.currentTime + 0.03);

    if (loop && Date.now() - startedAt < maxDuration) {
      timer = window.setTimeout(phrase, definition.loopEvery * 1000);
    }
  }

  phrase();

  return function stop() {
    if (stopped) {
      return;
    }

    stopped = true;

    if (timer !== null) {
      window.clearTimeout(timer);
    }

    master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    window.setTimeout(() => master.disconnect(), 400);
  };
}

let stopPreview: (() => void) | null = null;

/** Plays a single phrase, cutting off any previous preview. */
export function previewSound(id: SoundId, volume?: number) {
  stopPreview?.();
  stopPreview = playSound(id, { volume });
}
