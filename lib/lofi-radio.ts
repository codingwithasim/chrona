"use client";

import { getAudioContext } from "@/lib/audio-context";

/*
 * A little lo-fi station, played live in the browser: soft electric-piano
 * chords, a round bass, a lazy swung beat, a few melody notes and vinyl
 * crackle. Nothing is downloaded; every sound is made here.
 */

type Chord = { root: number; notes: number[] };
type Progression = { chords: Chord[]; scale: number[] };

/* Jazz-ish voicings (MIDI numbers), each with a pentatonic to sing over. */
const PROGRESSIONS: Progression[] = [
  {
    // Fmaj9 – Em7 – Dm9 – Cmaj9
    chords: [
      { root: 41, notes: [57, 60, 64, 67] },
      { root: 40, notes: [55, 59, 62, 64] },
      { root: 38, notes: [53, 57, 60, 64] },
      { root: 36, notes: [52, 55, 59, 62] },
    ],
    scale: [60, 62, 64, 67, 69],
  },
  {
    // Cm9 – F13 – Bbmaj9 – Gm7
    chords: [
      { root: 36, notes: [51, 55, 58, 62] },
      { root: 41, notes: [51, 57, 62, 67] },
      { root: 34, notes: [50, 53, 57, 60] },
      { root: 43, notes: [53, 58, 62, 67] },
    ],
    scale: [60, 63, 65, 67, 70],
  },
  {
    // Gm9 – C9 – Fmaj9 – Dm7
    chords: [
      { root: 43, notes: [53, 58, 62, 69] },
      { root: 36, notes: [52, 58, 62, 67] },
      { root: 41, notes: [52, 57, 60, 67] },
      { root: 38, notes: [53, 57, 60, 64] },
    ],
    scale: [65, 67, 69, 72, 74],
  },
  {
    // Abmaj7 – G7sus – Cm9 – Bbm7 Eb9
    chords: [
      { root: 44, notes: [55, 60, 63, 67] },
      { root: 43, notes: [53, 58, 60, 65] },
      { root: 36, notes: [51, 55, 58, 62] },
      { root: 39, notes: [55, 58, 61, 65] },
    ],
    scale: [60, 63, 65, 67, 70],
  },
];

const BPM = 74;
const STEP = 60 / BPM / 4; // a sixteenth
const SWING = 0.17; // off-beat eighths lean late

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  keys: GainNode;
  bass: GainNode;
  drums: GainNode;
  melody: GainNode;
  wobble: GainNode;
  noise: AudioBuffer;
  timer: number;
  nextTime: number;
  step: number;
  bar: number;
  progression: number;
  stops: AudioScheduledSourceNode[];
};

let engine: Engine | null = null;

function makeNoise(ctx: AudioContext) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

/** A soft room: decaying noise as an impulse response. */
function makeReverb(ctx: AudioContext) {
  const length = ctx.sampleRate * 2.2;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
    }
  }

  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

/** Vinyl: a quiet hiss and the odd crackle, looping forever. */
function makeVinyl(ctx: AudioContext, out: AudioNode) {
  const length = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.012;

    if (Math.random() < 0.00018) {
      const pop = (Math.random() * 2 - 1) * (0.25 + Math.random() * 0.5);
      for (let j = 0; j < 40 && i + j < length; j++) {
        data[i + j] += pop * Math.exp(-j / 6);
      }
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const tone = ctx.createBiquadFilter();
  tone.type = "bandpass";
  tone.frequency.value = 2400;
  tone.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.value = 0.55;

  source.connect(tone).connect(gain).connect(out);
  source.start();
  return source;
}

/* ------------------------------------------------------------------ */
/* Instruments                                                          */
/* ------------------------------------------------------------------ */

function electricPiano(e: Engine, time: number, midi: number, velocity: number, length: number) {
  const { ctx } = e;
  const f = freq(midi);
  const body = ctx.createOscillator();
  const shimmer = ctx.createOscillator();
  const tine = ctx.createOscillator();
  body.type = "sine";
  shimmer.type = "triangle";
  tine.type = "sine";
  body.frequency.value = f;
  shimmer.frequency.value = f * 2;
  tine.frequency.value = f * 7.02;

  // Tape wobble: the whole keys bus drifts a few cents together.
  e.wobble.connect(body.detune);
  e.wobble.connect(shimmer.detune);

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.11;
  const tineGain = ctx.createGain();
  tineGain.gain.setValueAtTime(0.05 * velocity, time);
  tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.25);

  const amp = ctx.createGain();
  const peak = 0.15 * velocity;
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(peak, time + 0.012);
  amp.gain.exponentialRampToValueAtTime(peak * 0.35, time + 1.1);
  amp.gain.setTargetAtTime(0.0001, time + length, 0.35);

  body.connect(amp);
  shimmer.connect(shimmerGain).connect(amp);
  tine.connect(tineGain).connect(amp);
  amp.connect(e.keys);

  const end = time + length + 1.6;
  for (const osc of [body, shimmer, tine]) {
    osc.start(time);
    osc.stop(end);
  }

  // Let go of the wobble when the note is done, so nothing piles up.
  body.onended = () => {
    e.wobble.disconnect(body.detune);
    e.wobble.disconnect(shimmer.detune);
  };
}

function bass(e: Engine, time: number, midi: number, length: number) {
  const { ctx } = e;
  const f = freq(midi);
  const low = ctx.createOscillator();
  const second = ctx.createOscillator();
  low.type = "sine";
  second.type = "triangle";
  low.frequency.value = f;
  second.frequency.value = f * 2;

  const secondGain = ctx.createGain();
  secondGain.gain.value = 0.18;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(0.42, time + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.22, time + 0.35);
  amp.gain.setTargetAtTime(0.0001, time + length, 0.08);

  low.connect(amp);
  second.connect(secondGain).connect(amp);
  amp.connect(e.bass);

  for (const osc of [low, second]) {
    osc.start(time);
    osc.stop(time + length + 0.6);
  }
}

function kick(e: Engine, time: number, velocity: number) {
  const { ctx } = e;
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(115, time);
  osc.frequency.exponentialRampToValueAtTime(44, time + 0.13);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.75 * velocity, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);

  osc.connect(amp).connect(e.drums);
  osc.start(time);
  osc.stop(time + 0.45);
}

function noiseHit(e: Engine, time: number, type: BiquadFilterType, frequency: number, level: number, decay: number) {
  const { ctx } = e;
  const source = ctx.createBufferSource();
  source.buffer = e.noise;

  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = 0.8;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(level, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + decay);

  source.connect(filter).connect(amp).connect(e.drums);
  source.start(time, Math.random() * 1.5);
  source.stop(time + decay + 0.02);
}

function snare(e: Engine, time: number, velocity: number) {
  noiseHit(e, time, "bandpass", 1700, 0.32 * velocity, 0.2);

  // A little body under the noise, like a rim on a soft snare.
  const { ctx } = e;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(210, time);
  osc.frequency.exponentialRampToValueAtTime(150, time + 0.06);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.16 * velocity, time);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  osc.connect(amp).connect(e.drums);
  osc.start(time);
  osc.stop(time + 0.1);
}

function hat(e: Engine, time: number, velocity: number, open = false) {
  noiseHit(e, time, "highpass", 7200, 0.09 * velocity, open ? 0.22 : 0.035);
}

function melodyNote(e: Engine, time: number, midi: number, length: number) {
  const { ctx } = e;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq(midi);

  // A slow, shy vibrato.
  const vibrato = ctx.createOscillator();
  vibrato.frequency.value = 4.6;
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0, time);
  depth.gain.linearRampToValueAtTime(7, time + 0.35);
  vibrato.connect(depth).connect(osc.detune);

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(0.09, time + 0.04);
  amp.gain.exponentialRampToValueAtTime(0.03, time + length * 0.8);
  amp.gain.setTargetAtTime(0.0001, time + length, 0.18);

  osc.connect(amp).connect(e.melody);
  for (const node of [osc, vibrato]) {
    node.start(time);
    node.stop(time + length + 1);
  }
}

/* ------------------------------------------------------------------ */
/* The band                                                             */
/* ------------------------------------------------------------------ */

const chance = (p: number) => Math.random() < p;

function playStep(e: Engine, step: number, time: number) {
  const progression = PROGRESSIONS[e.progression];
  const chord = progression.chords[e.bar % progression.chords.length];
  const beat = step % 16;
  const barLength = STEP * 16;

  // Drums: boom-bap, softened.
  if (beat === 0 || beat === 10 || (beat === 7 && chance(0.25))) {
    kick(e, time, beat === 0 ? 1 : 0.8);
  }
  if (beat === 4 || beat === 12) {
    snare(e, time, 0.9 + Math.random() * 0.1);
  }
  if (beat % 2 === 0) {
    hat(e, time, (beat % 4 === 0 ? 0.9 : 0.6) * (0.75 + Math.random() * 0.25), beat === 14 && chance(0.2));
  } else if (chance(0.12)) {
    hat(e, time, 0.35);
  }

  // Keys: the chord, strummed a touch, sometimes pushed again.
  if (beat === 0) {
    chord.notes.forEach((note, index) => {
      electricPiano(e, time + index * 0.018 + Math.random() * 0.01, note, 0.75 + Math.random() * 0.25, barLength * 0.9);
    });
  } else if ((beat === 7 || beat === 11) && chance(0.35)) {
    chord.notes.slice(1).forEach((note, index) => {
      electricPiano(e, time + index * 0.014, note, 0.45, STEP * 3);
    });
  }

  // Bass: root on one, root or fifth on the and-of-three, a pickup now and then.
  if (beat === 0) {
    bass(e, time, chord.root, STEP * 6);
  } else if (beat === 10) {
    bass(e, time, chance(0.6) ? chord.root : chord.root + 7, STEP * 4);
  } else if (beat === 14 && chance(0.3)) {
    bass(e, time, chord.root + 12, STEP * 1.5);
  }

  // A few melody notes, mostly in the second half of each phrase.
  const phraseBar = e.bar % 4;
  if (beat % 2 === 0 && chance(phraseBar % 2 === 1 ? 0.24 : 0.08)) {
    const pick = progression.scale[Math.floor(Math.random() * progression.scale.length)];
    const note = pick < 66 ? pick + 12 : pick;
    melodyNote(e, time, note, STEP * (chance(0.5) ? 2 : 4));
  }
}

function schedule() {
  const e = engine;

  if (!e) {
    return;
  }

  while (e.nextTime < e.ctx.currentTime + 0.15) {
    const beat = e.step % 16;
    const swung = beat % 4 === 2 ? STEP * SWING * 2 : 0;
    playStep(e, e.step, e.nextTime + swung);

    e.step += 1;
    e.nextTime += STEP;

    if (e.step % 16 === 0) {
      e.bar += 1;

      // Every so often, drift to another progression.
      if (e.bar % 16 === 0) {
        e.progression = (e.progression + 1 + Math.floor(Math.random() * (PROGRESSIONS.length - 1))) % PROGRESSIONS.length;
      }
    }
  }
}

export function startRadio(volume: number) {
  if (engine) {
    setRadioVolume(volume);
    return;
  }

  const ctx = getAudioContext();

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.9), ctx.currentTime + 1.5);

  const soften = ctx.createBiquadFilter();
  soften.type = "lowpass";
  soften.frequency.value = 3800;
  soften.Q.value = 0.3;

  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -18;
  glue.ratio.value = 3;

  master.connect(soften).connect(glue).connect(ctx.destination);

  const reverb = makeReverb(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  reverb.connect(wet).connect(master);

  const keysTone = ctx.createBiquadFilter();
  keysTone.type = "lowpass";
  keysTone.frequency.value = 1900;
  const keys = ctx.createGain();
  keys.gain.value = 0.9;
  keys.connect(keysTone);
  keysTone.connect(master);
  keysTone.connect(reverb);

  const bassTone = ctx.createBiquadFilter();
  bassTone.type = "lowpass";
  bassTone.frequency.value = 520;
  const bassBus = ctx.createGain();
  bassBus.gain.value = 0.9;
  bassBus.connect(bassTone).connect(master);

  const drums = ctx.createGain();
  drums.gain.value = 0.6;
  drums.connect(master);

  const melody = ctx.createGain();
  melody.gain.value = 0.8;
  melody.connect(master);
  melody.connect(reverb);

  // Tape wobble, shared by the keys.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.32;
  const wobble = ctx.createGain();
  wobble.gain.value = 7;
  lfo.connect(wobble);
  lfo.start();

  const vinyl = makeVinyl(ctx, master);

  engine = {
    ctx,
    master,
    keys,
    bass: bassBus,
    drums,
    melody,
    wobble,
    noise: makeNoise(ctx),
    timer: window.setInterval(schedule, 25),
    nextTime: ctx.currentTime + 0.1,
    step: 0,
    bar: 0,
    progression: Math.floor(Math.random() * PROGRESSIONS.length),
    stops: [lfo, vinyl],
  };

  schedule();
}

export function stopRadio() {
  const e = engine;

  if (!e) {
    return;
  }

  engine = null;
  window.clearInterval(e.timer);

  const { ctx, master } = e;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

  window.setTimeout(() => {
    for (const node of e.stops) {
      node.stop();
    }
    master.disconnect();
  }, 1000);
}

export function setRadioVolume(volume: number) {
  if (!engine) {
    return;
  }

  const { ctx, master } = engine;
  master.gain.setTargetAtTime(Math.max(0.0001, volume * 0.9), ctx.currentTime, 0.15);
}

/** Skip to another set of chords. */
export function changeRadioMood() {
  if (engine) {
    engine.progression = (engine.progression + 1) % PROGRESSIONS.length;
  }
}
