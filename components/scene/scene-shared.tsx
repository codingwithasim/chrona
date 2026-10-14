"use client";

import { createContext, useContext, useState } from "react";

/*
 * The room is drawn in a fixed 1600×1000 space, scaled to cover.
 * The camera frames a slightly zoomed-in view around the window.
 */
export const VIEWBOX = "130 78 1340 838";
export const GLASS = { x: 472, y: 132, w: 656, h: 496 };
export const GLASS_RIGHT = GLASS.x + GLASS.w;
export const GLASS_BOTTOM = GLASS.y + GLASS.h;

/** Stronger outline, used for the cat. */
export const LINE = "var(--sc-line)";

export const svgProps = {
  viewBox: VIEWBOX,
  preserveAspectRatio: "xMidYMid slice",
  className: "absolute inset-0 size-full",
} as const;

export function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function mulberry32(seed: number) {
  let a = seed;

  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;

    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Speech bubbles                                                      */
/* ------------------------------------------------------------------ */

export const SpeakContext = createContext<
  (x: number, y: number, text: string) => void
>(() => {});

export function useSpeak() {
  return useContext(SpeakContext);
}

/* ------------------------------------------------------------------ */
/* One-shot reactions                                                  */
/* ------------------------------------------------------------------ */

/** A key that changes on every poke, to replay a CSS animation. */
export function usePoke() {
  const [count, setCount] = useState(0);
  return [count, () => setCount((value) => value + 1)] as const;
}

export type Particle = { id: number; x: number; y: number; delay: number };

let particleId = 0;

export function useParticles(lifetime = 1800) {
  const [particles, setParticles] = useState<Particle[]>([]);

  function burst(x: number, y: number, count: number, spread: number) {
    const fresh = Array.from({ length: count }, (_, index) => ({
      id: ++particleId,
      x: x + (Math.random() - 0.5) * spread,
      y: y + (Math.random() - 0.5) * spread * 0.4,
      delay: index * 0.12,
    }));

    setParticles((current) => [...current, ...fresh]);

    window.setTimeout(() => {
      setParticles((current) =>
        current.filter((particle) => !fresh.includes(particle))
      );
    }, lifetime + count * 120);
  }

  return [particles, burst] as const;
}

export const floatStyle = (delay: number) => ({
  animationDelay: `${delay}s`,
  transformBox: "fill-box" as const,
  transformOrigin: "50% 50%",
  opacity: 0,
});

/** Style for a CSS animation that pivots around part of the shape. */
export const pivot = (origin: string) => ({
  transformBox: "fill-box" as const,
  transformOrigin: origin,
});

/* Events from outside that the cat (and others) can react to. */
export const OUTSIDE_EVENT = "chrona:outside";

export type OutsideEventKind = "train" | "birds" | "star" | "plane" | "butterfly";

export function announceOutside(kind: OutsideEventKind) {
  window.dispatchEvent(
    new CustomEvent<OutsideEventKind>(OUTSIDE_EVENT, { detail: kind })
  );
}
