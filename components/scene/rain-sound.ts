"use client";

import type { RainLevel } from "@/stores/scene-store";

/**
 * Procedural rain ambience built from filtered noise,
 * so no audio files are needed. Must be started from
 * a user gesture because of browser autoplay rules.
 */

type Graph = {
  ctx: AudioContext;
  master: GainNode;
  hiss: GainNode;
  hissFilter: BiquadFilterNode;
  rumble: GainNode;
};

let graph: Graph | null = null;
let dropTimer: number | null = null;
let currentLevel: RainLevel = "light";

function pinkNoiseBuffer(ctx: AudioContext, seconds: number) {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Paul Kellet's refined pink noise filter.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;

    data[i] =
      (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) *
      0.11;

    b6 = white * 0.115926;
  }

  return buffer;
}

function brownNoiseBuffer(ctx: AudioContext, seconds: number) {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  return buffer;
}

function createGraph(): Graph {
  const ctx = new AudioContext();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Steady hiss of rain.
  const hissSource = ctx.createBufferSource();
  hissSource.buffer = pinkNoiseBuffer(ctx, 6);
  hissSource.loop = true;

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 380;

  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = "lowpass";
  hissFilter.frequency.value = 3600;

  const hiss = ctx.createGain();
  hiss.gain.value = 0.6;

  hissSource
    .connect(highpass)
    .connect(hissFilter)
    .connect(hiss)
    .connect(master);

  // Slow gusts.
  const gust = ctx.createOscillator();
  gust.frequency.value = 0.07;

  const gustDepth = ctx.createGain();
  gustDepth.gain.value = 0.12;

  gust.connect(gustDepth).connect(hiss.gain);

  // Low rumble on the roof.
  const rumbleSource = ctx.createBufferSource();
  rumbleSource.buffer = brownNoiseBuffer(ctx, 6);
  rumbleSource.loop = true;

  const rumbleFilter = ctx.createBiquadFilter();
  rumbleFilter.type = "lowpass";
  rumbleFilter.frequency.value = 420;

  const rumble = ctx.createGain();
  rumble.gain.value = 0.25;

  rumbleSource
    .connect(rumbleFilter)
    .connect(rumble)
    .connect(master);

  hissSource.start();
  rumbleSource.start();
  gust.start();

  return { ctx, master, hiss, hissFilter, rumble };
}

/** A single drop tapping on the window. */
function playDrop(g: Graph) {
  const { ctx } = g;
  const duration = 0.04;

  const buffer = ctx.createBuffer(
    1,
    Math.round(ctx.sampleRate * duration),
    ctx.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] =
      (Math.random() * 2 - 1) *
      Math.pow(1 - i / data.length, 4);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2200 + Math.random() * 4200;
  band.Q.value = 4;

  const gain = ctx.createGain();
  gain.gain.value = 0.05 + Math.random() * 0.12;

  source.connect(band).connect(gain).connect(g.master);
  source.start();
}

function scheduleDrops() {
  if (dropTimer !== null) {
    window.clearTimeout(dropTimer);
  }

  const tick = () => {
    if (!graph || currentLevel === "off") {
      dropTimer = null;
      return;
    }

    playDrop(graph);

    const base = currentLevel === "heavy" ? 40 : 140;
    dropTimer = window.setTimeout(
      tick,
      base + Math.random() * base * 2
    );
  };

  tick();
}

function applyLevel(level: RainLevel, volume: number) {
  if (!graph) {
    return;
  }

  const { ctx, master, hiss, hissFilter, rumble } = graph;
  const now = ctx.currentTime;

  const loudness =
    level === "off" ? 0 : level === "heavy" ? 1 : 0.6;

  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(
    loudness * volume * 0.7,
    now,
    0.6
  );

  hiss.gain.setTargetAtTime(
    level === "heavy" ? 0.85 : 0.55,
    now,
    0.6
  );

  hissFilter.frequency.setTargetAtTime(
    level === "heavy" ? 5200 : 3200,
    now,
    0.6
  );

  rumble.gain.setTargetAtTime(
    level === "heavy" ? 0.45 : 0.2,
    now,
    0.6
  );
}

export async function startRainSound(
  level: RainLevel,
  volume: number
) {
  graph ??= createGraph();

  if (graph.ctx.state === "suspended") {
    await graph.ctx.resume();
  }

  updateRainSound(level, volume);
}

export function updateRainSound(
  level: RainLevel,
  volume: number
) {
  if (!graph) {
    return;
  }

  const levelChanged = level !== currentLevel;
  currentLevel = level;

  applyLevel(level, volume);

  if (levelChanged || dropTimer === null) {
    scheduleDrops();
  }
}

export function stopRainSound() {
  if (!graph) {
    return;
  }

  const g = graph;

  g.master.gain.setTargetAtTime(0, g.ctx.currentTime, 0.3);

  if (dropTimer !== null) {
    window.clearTimeout(dropTimer);
    dropTimer = null;
  }

  window.setTimeout(() => {
    if (g.master.gain.value < 0.01) {
      void g.ctx.suspend();
    }
  }, 1500);
}
