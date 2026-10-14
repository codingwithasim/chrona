"use client";

import type { Season, TimeOfDay, Weather } from "@/lib/scene-time";
import type { Mix } from "@/stores/mixer-store";

/**
 * A procedural soundscape for the room, built from filtered noise and
 * oscillators so no audio files are needed: rain and thunder, wind,
 * birds, cicadas, crickets, a fireplace, a café and brown noise. It
 * either follows the room or plays your own mix. It must be started
 * from a user gesture because of browser autoplay rules.
 */

export type AmbienceState = {
  weather: Weather;
  season: Season;
  time: TimeOfDay;
  volume: number;
  nature: boolean;
  /** Your own mix, or null to follow the room. */
  mix: Mix | null;
};

type Graph = {
  ctx: AudioContext;
  master: GainNode;
  rainHiss: GainNode;
  rainFilter: BiquadFilterNode;
  rumble: GainNode;
  wind: GainNode;
  cicadas: GainNode;
  fire: GainNode;
  cafe: GainNode;
  brown: GainNode;
};

let graph: Graph | null = null;
let state: AmbienceState | null = null;
let running = false;

const timers: Record<"drops" | "birds" | "crickets" | "thunder" | "crackle" | "clink", number | null> = {
  drops: null,
  birds: null,
  crickets: null,
  thunder: null,
  crackle: null,
  clink: null,
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

  // Fireplace: a warm low roar (the crackles are scheduled below)
  const fireFilter = ctx.createBiquadFilter();
  fireFilter.type = "lowpass";
  fireFilter.frequency.value = 700;
  lfo(ctx, 0.3, 120, fireFilter.frequency);

  const fire = ctx.createGain();
  fire.gain.value = 0;

  loopSource(ctx, noiseBuffer(ctx, 7, "brown"))
    .connect(fireFilter)
    .connect(fire)
    .connect(master);

  // Café: the murmur of voices, swelling and settling
  const voices = ctx.createBiquadFilter();
  voices.type = "bandpass";
  voices.frequency.value = 520;
  voices.Q.value = 0.9;
  lfo(ctx, 0.23, 140, voices.frequency);

  const chatter = ctx.createGain();
  chatter.gain.value = 0.7;
  lfo(ctx, 0.9, 0.3, chatter.gain);

  const cafe = ctx.createGain();
  cafe.gain.value = 0;

  loopSource(ctx, noiseBuffer(ctx, 9, "pink"))
    .connect(voices)
    .connect(chatter)
    .connect(cafe)
    .connect(master);

  // Brown noise for deep focus
  const brownFilter = ctx.createBiquadFilter();
  brownFilter.type = "lowpass";
  brownFilter.frequency.value = 900;

  const brown = ctx.createGain();
  brown.gain.value = 0;

  loopSource(ctx, noiseBuffer(ctx, 10, "brown"))
    .connect(brownFilter)
    .connect(brown)
    .connect(master);

  return { ctx, master, rainHiss, rainFilter, rumble, wind, cicadas, fire, cafe, brown };
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

/** What the room itself sounds like right now, as mixer levels. */
function roomMix(s: AmbienceState): Mix {
  const calm = s.weather === "clear" || s.weather === "drizzle";
  const dark = s.time === "evening" || s.time === "night";

  return {
    rain: s.weather === "storm" ? 1 : s.weather === "drizzle" ? 0.6 : 0,
    thunder: s.weather === "storm" ? 0.5 : 0,
    wind:
      s.weather === "snow"
        ? 0.9
        : s.weather === "storm"
          ? 0.6
          : s.season === "winter"
            ? 0.35
            : 0.1,
    birds:
      s.nature &&
      calm &&
      (s.time === "morning" ||
        (s.time === "day" && (s.season === "spring" || s.season === "summer")))
        ? 0.7
        : 0,
    cicadas:
      s.nature && s.season === "summer" && (s.time === "day" || s.time === "evening") && s.weather === "clear"
        ? 0.6
        : 0,
    crickets:
      s.nature && (s.season === "summer" || s.season === "autumn") && dark && calm ? 0.7 : 0,
    fire: 0,
    cafe: 0,
    brown: 0,
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

/** The levels playing right now (read live by the scheduled sounds). */
function current(): Mix {
  return state ? (state.mix ?? roomMix(state)) : roomMix({ weather: "clear", season: "spring", time: "day", volume: 0, nature: false, mix: null });
}

function apply() {
  if (!graph || !state) {
    return;
  }

  const { ctx, master, rainHiss, rainFilter, rumble, wind, cicadas, fire, cafe, brown } = graph;
  const now = ctx.currentTime;
  const mix = state.mix ?? roomMix(state);

  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(running ? state.volume * 0.75 : 0, now, 0.6);

  rainHiss.gain.setTargetAtTime(mix.rain * 0.85, now, 0.8);
  rainFilter.frequency.setTargetAtTime(mix.rain > 0.8 ? 5200 : 3200, now, 0.8);
  rumble.gain.setTargetAtTime(mix.rain * 0.4, now, 0.8);
  wind.gain.setTargetAtTime(mix.wind * 0.6, now, 1.2);
  cicadas.gain.setTargetAtTime(mix.cicadas * 0.08, now, 1.5);
  fire.gain.setTargetAtTime(mix.fire * 0.5, now, 1);
  cafe.gain.setTargetAtTime(mix.cafe * 0.55, now, 1);
  brown.gain.setTargetAtTime(mix.brown * 0.6, now, 1);

  const live = (level: number) => running && level > 0.03;

  // Raindrops patter faster the heavier the rain.
  schedule("drops", live(mix.rain), 40 + (1 - mix.rain) * 140, 120 + (1 - mix.rain) * 380, (g) =>
    burst(g, 2200 + Math.random() * 4200, 0.04, (0.05 + Math.random() * 0.12) * Math.min(1, current().rain * 1.4))
  );

  schedule("thunder", live(mix.thunder), 9000, 26000, (g) => thunder(g, current().thunder));

  schedule("birds", live(mix.birds), 1800, 6000, (g) => {
    let t = g.ctx.currentTime;
    const level = current().birds;

    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      const base = 2600 + Math.random() * 1200;
      tone(g, base, base * 1.5, t, 0.07, 0.07 * level);
      tone(g, base * 1.4, base * 0.9, t + 0.08, 0.08, 0.055 * level);
      t += 0.18 + Math.random() * 0.15;
    }
  });

  schedule("crickets", live(mix.crickets), 700, 1400, (g) => {
    const t = g.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      tone(g, 4600, 4500, t + i * 0.045, 0.025, 0.035 * current().crickets);
    }
  });

  // Wood popping in the fire.
  schedule("crackle", live(mix.fire), 60, 520, (g) => {
    burst(g, 1400 + Math.random() * 3200, 0.02 + Math.random() * 0.03, (0.04 + Math.random() * 0.16) * current().fire);
  });

  // Now and then, a cup set down on a saucer.
  schedule("clink", live(mix.cafe), 2500, 9000, (g) => {
    const t = g.ctx.currentTime;
    const pitch = 2800 + Math.random() * 1600;
    const level = current().cafe;
    tone(g, pitch, pitch * 0.98, t, 0.25, 0.02 * level);
    tone(g, pitch * 1.5, pitch * 1.46, t + 0.06, 0.18, 0.012 * level);
  });
}

/** A long, distant roll of thunder. */
function thunder(g: Graph, level: number) {
  const { ctx } = g;
  const start = ctx.currentTime;
  const duration = 4 + Math.random() * 3;
  const length = Math.round(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 160 + Math.random() * 120;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.9 * level, start + 0.35 + Math.random() * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter).connect(gain).connect(g.master);
  source.start(start);
}

/* ------------------------------------------------------------------ */

/** One-off sounds from outside, only while the ambience is playing. */
export function ambienceOneShot(kind: "train") {
  if (!graph || !running || kind !== "train") {
    return;
  }

  const g = graph;
  const { ctx } = g;
  const start = ctx.currentTime;
  const duration = 9;

  // A distant rumble that swells and fades.
  const length = Math.round(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;

  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 260;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.35, start + duration * 0.45);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(filter).connect(gain).connect(g.master);
  source.start(start);

  // Clack-clack of the wheels over the rail joints.
  for (let t = 1.2; t < duration - 1.2; t += 0.62) {
    const swell = Math.sin((t / duration) * Math.PI);

    burst(g, 900, 0.05, 0.05 * swell, start + t);
    burst(g, 820, 0.05, 0.04 * swell, start + t + 0.14);
  }
}

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
