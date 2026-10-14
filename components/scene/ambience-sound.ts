"use client";

import type { Season, TimeOfDay, Weather } from "@/lib/scene-time";

/**
 * A procedural soundscape for the room, built from filtered noise and
 * oscillators so no audio files are needed: rain, wind, and seasonal
 * nature (birds, cicadas, crickets). It must be started from a user
 * gesture because of browser autoplay rules.
 */

export type AmbienceState = {
  weather: Weather;
  season: Season;
  time: TimeOfDay;
  volume: number;
  nature: boolean;
};

type Graph = {
  ctx: AudioContext;
  master: GainNode;
  rainHiss: GainNode;
  rainFilter: BiquadFilterNode;
  rumble: GainNode;
  wind: GainNode;
  cicadas: GainNode;
};

let graph: Graph | null = null;
let state: AmbienceState | null = null;
let running = false;

const timers: Record<"drops" | "birds" | "crickets", number | null> = {
  drops: null,
  birds: null,
  crickets: null,
};

/* ------------------------------------------------------------------ */

function noiseBuffer(ctx: AudioContext, seconds: number, kind: "white" | "pink" | "brown") {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let last = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;

    if (kind === "white") {
      data[i] = white * 0.5;
    } else if (kind === "brown") {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      // Paul Kellet's refined pink noise filter.
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }

  return buffer;
}

function loopSource(ctx: AudioContext, buffer: AudioBuffer) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();
  return source;
}

function lfo(ctx: AudioContext, frequency: number, depth: number, target: AudioParam) {
  const osc = ctx.createOscillator();
  osc.frequency.value = frequency;

  const gain = ctx.createGain();
  gain.gain.value = depth;

  osc.connect(gain).connect(target);
  osc.start();
}

function createGraph(): Graph {
  const ctx = new AudioContext();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Rain hiss
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 380;

  const rainFilter = ctx.createBiquadFilter();
  rainFilter.type = "lowpass";
  rainFilter.frequency.value = 3600;

  const rainHiss = ctx.createGain();
  rainHiss.gain.value = 0;

  loopSource(ctx, noiseBuffer(ctx, 6, "pink"))
    .connect(highpass)
    .connect(rainFilter)
    .connect(rainHiss)
    .connect(master);

  // Low rumble on the roof
  const rumbleFilter = ctx.createBiquadFilter();
  rumbleFilter.type = "lowpass";
  rumbleFilter.frequency.value = 420;

  const rumble = ctx.createGain();
  rumble.gain.value = 0;

  loopSource(ctx, noiseBuffer(ctx, 6, "brown"))
    .connect(rumbleFilter)
    .connect(rumble)
    .connect(master);

  // Wind, with slow gusts
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 500;
  windFilter.Q.value = 0.6;
  lfo(ctx, 0.06, 180, windFilter.frequency);

  const wind = ctx.createGain();
  wind.gain.value = 0;

  loopSource(ctx, noiseBuffer(ctx, 8, "brown"))
    .connect(windFilter)
    .connect(wind)
    .connect(master);

  // Cicadas: narrow band of noise pulsing very fast
  const cicadaFilter = ctx.createBiquadFilter();
  cicadaFilter.type = "bandpass";
  cicadaFilter.frequency.value = 5200;
  cicadaFilter.Q.value = 5;

  const pulse = ctx.createGain();
  pulse.gain.value = 0.5;
  lfo(ctx, 38, 0.5, pulse.gain);

  const cicadas = ctx.createGain();
  cicadas.gain.value = 0;

  loopSource(ctx, noiseBuffer(ctx, 4, "white"))
    .connect(cicadaFilter)
    .connect(pulse)
    .connect(cicadas)
    .connect(master);

  return { ctx, master, rainHiss, rainFilter, rumble, wind, cicadas };
}

/* ------------------------------------------------------------------ */
/* One-shot voices                                                     */
/* ------------------------------------------------------------------ */

function burst(
  g: Graph,
  frequency: number,
  duration: number,
  level: number,
  at = g.ctx.currentTime
) {
  const { ctx } = g;
  const length = Math.max(1, Math.round(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = frequency;
  band.Q.value = 4;

  const gain = ctx.createGain();
  gain.gain.value = level;

  source.connect(band).connect(gain).connect(g.master);
  source.start(at);
}

function tone(g: Graph, from: number, to: number, at: number, duration: number, level: number) {
  const { ctx } = g;

  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(gain).connect(g.master);
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

/* ------------------------------------------------------------------ */
/* What should be playing                                              */
/* ------------------------------------------------------------------ */

function layers(s: AmbienceState) {
  const raining = s.weather === "drizzle" || s.weather === "storm";
  const calm = s.weather === "clear" || s.weather === "drizzle";
  const dark = s.time === "evening" || s.time === "night";

  return {
    rain: s.weather === "storm" ? 1 : s.weather === "drizzle" ? 0.6 : 0,
    raining,
    wind:
      s.weather === "snow"
        ? 0.55
        : s.weather === "storm"
          ? 0.35
          : s.season === "winter"
            ? 0.2
            : 0.06,
    birds:
      s.nature &&
      calm &&
      (s.time === "morning" ||
        (s.time === "day" && (s.season === "spring" || s.season === "summer"))),
    cicadas:
      s.nature &&
      s.season === "summer" &&
      (s.time === "day" || s.time === "evening") &&
      s.weather === "clear",
    crickets:
      s.nature &&
      (s.season === "summer" || s.season === "autumn") &&
      dark &&
      calm,
  };
}

function schedule(
  name: keyof typeof timers,
  active: boolean,
  minDelay: number,
  maxDelay: number,
  play: (g: Graph) => void
) {
  if (!active) {
    if (timers[name] !== null) {
      window.clearTimeout(timers[name]!);
      timers[name] = null;
    }

    return;
  }

  if (timers[name] !== null) {
    return;
  }

  const tick = () => {
    if (!graph || !running) {
      timers[name] = null;
      return;
    }

    play(graph);
    timers[name] = window.setTimeout(
      tick,
      minDelay + Math.random() * (maxDelay - minDelay)
    );
  };

  timers[name] = window.setTimeout(tick, Math.random() * maxDelay);
}

function apply() {
  if (!graph || !state) {
    return;
  }

  const { ctx, master, rainHiss, rainFilter, rumble, wind, cicadas } = graph;
  const now = ctx.currentTime;
  const mix = layers(state);

  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(running ? state.volume * 0.75 : 0, now, 0.6);

  rainHiss.gain.setTargetAtTime(mix.rain * 0.85, now, 0.8);
  rainFilter.frequency.setTargetAtTime(state.weather === "storm" ? 5200 : 3200, now, 0.8);
  rumble.gain.setTargetAtTime(mix.rain * 0.4, now, 0.8);
  wind.gain.setTargetAtTime(mix.wind, now, 1.2);
  cicadas.gain.setTargetAtTime(mix.cicadas ? 0.05 : 0, now, 1.5);

  const heavy = state.weather === "storm";

  schedule("drops", running && mix.raining, heavy ? 40 : 140, heavy ? 120 : 420, (g) =>
    burst(g, 2200 + Math.random() * 4200, 0.04, 0.05 + Math.random() * 0.12)
  );

  schedule("birds", running && mix.birds, 1800, 6000, (g) => {
    let t = g.ctx.currentTime;

    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      const base = 2600 + Math.random() * 1200;
      tone(g, base, base * 1.5, t, 0.07, 0.05);
      tone(g, base * 1.4, base * 0.9, t + 0.08, 0.08, 0.04);
      t += 0.18 + Math.random() * 0.15;
    }
  });

  schedule("crickets", running && mix.crickets, 700, 1400, (g) => {
    const t = g.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      tone(g, 4600, 4500, t + i * 0.045, 0.025, 0.025);
    }
  });
}

/* ------------------------------------------------------------------ */

export async function startAmbience(next: AmbienceState) {
  graph ??= createGraph();
  state = next;
  running = true;

  if (graph.ctx.state === "suspended") {
    await graph.ctx.resume();
  }

  apply();
}

export function updateAmbience(next: AmbienceState) {
  state = next;
  apply();
}

export function stopAmbience() {
  if (!graph) {
    return;
  }

  running = false;
  apply();

  const g = graph;

  window.setTimeout(() => {
    if (!running && g.master.gain.value < 0.01) {
      void g.ctx.suspend();
    }
  }, 2500);
}
