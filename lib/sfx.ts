"use client";

import { useSceneStore } from "@/stores/scene-store";

import { getAudioContext } from "./audio-context";

/**
 * Tiny synthesized sound effects for room interactions.
 * Everything is generated with the Web Audio API.
 */

export type Sfx =
  | "click"
  | "pop"
  | "purr"
  | "thunder"
  | "sip"
  | "chime"
  | "rustle"
  | "sparkle"
  | "furin"
  | "firework"
  | "beep";


function noiseBuffer(ctx: AudioContext, seconds: number, brown = false) {
  const length = Math.round(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = white;
    }
  }

  return buffer;
}

function envelope(
  ctx: AudioContext,
  peak: number,
  attack: number,
  decay: number,
  at = ctx.currentTime
) {
  const gain = ctx.createGain();

  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);

  gain.connect(ctx.destination);

  return gain;
}

function tone(
  ctx: AudioContext,
  type: OscillatorType,
  from: number,
  to: number,
  peak: number,
  duration: number,
  delay = 0
) {
  const at = ctx.currentTime + delay;
  const osc = ctx.createOscillator();

  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + duration);

  osc.connect(envelope(ctx, peak, 0.005, duration, at));
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

function noise(
  ctx: AudioContext,
  seconds: number,
  filterType: BiquadFilterType,
  frequency: number,
  peak: number,
  options: { brown?: boolean; attack?: number; sweepTo?: number } = {}
) {
  const at = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, seconds, options.brown);

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(frequency, at);

  if (options.sweepTo) {
    filter.frequency.exponentialRampToValueAtTime(
      options.sweepTo,
      at + seconds
    );
  }

  const gain = envelope(
    ctx,
    peak,
    options.attack ?? 0.01,
    seconds - (options.attack ?? 0.01)
  );

  source.connect(filter).connect(gain);
  source.start(at);

  return { source, filter, gain };
}

const players: Record<Sfx, (ctx: AudioContext) => void> = {
  click: (ctx) => {
    tone(ctx, "square", 1800, 1400, 0.05, 0.03);
    tone(ctx, "triangle", 700, 500, 0.08, 0.05, 0.02);
  },

  pop: (ctx) => {
    tone(ctx, "sine", 420, 980, 0.22, 0.12);
  },

  purr: (ctx) => {
    const at = ctx.currentTime;
    const { gain } = noise(ctx, 1.4, "lowpass", 260, 0.5, {
      brown: true,
      attack: 0.25,
    });

    // Flutter the volume ~24 times a second for the purr texture.
    const flutter = ctx.createOscillator();
    flutter.frequency.value = 24;

    const depth = ctx.createGain();
    depth.gain.value = 0.25;

    flutter.connect(depth).connect(gain.gain);
    flutter.start(at);
    flutter.stop(at + 1.4);
  },

  thunder: (ctx) => {
    noise(ctx, 0.25, "highpass", 1500, 0.12);
    noise(ctx, 3.2, "lowpass", 220, 0.9, {
      brown: true,
      attack: 0.12,
      sweepTo: 90,
    });
  },

  sip: (ctx) => {
    noise(ctx, 0.28, "bandpass", 500, 0.18, { sweepTo: 1500 });
  },

  chime: (ctx) => {
    tone(ctx, "sine", 1318, 1318, 0.12, 0.9);
    tone(ctx, "sine", 1760, 1760, 0.1, 1, 0.12);
  },

  rustle: (ctx) => {
    noise(ctx, 0.45, "highpass", 2200, 0.12, { attack: 0.05 });
  },

  furin: (ctx) => {
    // A glass wind chime: bright bell partials, slightly random.
    const scale = [2093, 2349, 2637, 3136, 3520];

    for (let i = 0; i < 3; i++) {
      const frequency = scale[Math.floor(Math.random() * scale.length)];
      const delay = i * 0.14 + Math.random() * 0.05;

      tone(ctx, "sine", frequency, frequency, 0.09, 1.6, delay);
      tone(ctx, "sine", frequency * 2.76, frequency * 2.76, 0.025, 0.8, delay);
    }
  },

  firework: (ctx) => {
    noise(ctx, 0.5, "lowpass", 900, 0.5, { brown: true, attack: 0.005 });

    // Crackle as the sparks burn out.
    for (let i = 0; i < 10; i++) {
      tone(ctx, "square", 2400 + Math.random() * 2000, 1800, 0.015, 0.03, 0.3 + Math.random() * 0.8);
    }
  },

  sparkle: (ctx) => {
    [2093, 2637, 3136].forEach((frequency, index) => {
      tone(ctx, "sine", frequency, frequency * 1.02, 0.07, 0.35, index * 0.07);
    });
  },

  // An air conditioner's little remote-control beep.
  beep: (ctx) => {
    tone(ctx, "sine", 2350, 2350, 0.05, 0.07);
    tone(ctx, "sine", 2350, 2350, 0.05, 0.07, 0.11);
  },
};

export function playSfx(name: Sfx) {
  if (typeof window === "undefined") {
    return;
  }

  if (!useSceneStore.getState().sfxOn) {
    return;
  }

  try {
    players[name](getAudioContext());
  } catch {
    // Audio is a nice-to-have; ignore failures.
  }
}
