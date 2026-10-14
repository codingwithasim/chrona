/**
 * Small 2D geometry helpers for drawing Mochi: vectors, smooth closed
 * curves, furry outlines, capsules for limbs and two-bone IK.
 */

import { mulberry32 } from "../scene-shared";

export type Pt = [number, number];

export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const len = (a: Pt) => Math.hypot(a[0], a[1]);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** Perpendicular, turned a quarter to the left on screen. */
export const perp = (a: Pt): Pt => [-a[1], a[0]];
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
export const rad = (degrees: number) => (degrees * Math.PI) / 180;

export function norm(a: Pt): Pt {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
}

export const fromAngle = (degrees: number, length = 1): Pt => [
  Math.cos(rad(degrees)) * length,
  Math.sin(rad(degrees)) * length,
];

const f = (value: number) => Math.round(value * 10) / 10;
export const ptStr = ([x, y]: Pt) => `${f(x)} ${f(y)}`;

export const smoothstep = (t: number) => t * t * (3 - 2 * t);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ------------------------------------------------------------------ */
/* Curves                                                              */
/* ------------------------------------------------------------------ */

function catmull(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const t2 = t * t;
  const t3 = t2 * t;
  const at = (i: 0 | 1) =>
    0.5 *
    (2 * p1[i] +
      (-p0[i] + p2[i]) * t +
      (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 +
      (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3);
  return [at(0), at(1)];
}

/** Dense points along a smooth closed curve through `points`. */
export function sampleClosed(points: Pt[], perSegment = 6): Pt[] {
  const n = points.length;
  const out: Pt[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    for (let s = 0; s < perSegment; s++) {
      out.push(catmull(p0, p1, p2, p3, s / perSegment));
    }
  }

  return out;
}

/** Dense points along a smooth open curve through `points`. */
export function sampleOpen(points: Pt[], perSegment = 6): Pt[] {
  const n = points.length;
  const out: Pt[] = [];

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];

    for (let s = 0; s < perSegment; s++) {
      out.push(catmull(p0, p1, p2, p3, s / perSegment));
    }
  }

  out.push(points[n - 1]);
  return out;
}

export function ellipsePoints(c: Pt, rx: number, ry: number, count = 24, rotate = 0): Pt[] {
  const cos = Math.cos(rad(rotate));
  const sin = Math.sin(rad(rotate));

  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    return [c[0] + x * cos - y * sin, c[1] + x * sin + y * cos] as Pt;
  });
}

function signedArea(points: Pt[]) {
  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % points.length];
    area += x0 * y1 - x1 * y0;
  }

  return area / 2;
}

/**
 * A closed path through dense points, with swept tufts of fur along
 * the edge. `weight(t)` (t from 0 to 1 around the loop) sets how fluffy
 * each part is. Tufts come from a fixed seed so they stay put while
 * the shape moves.
 */
export function furPath(
  points: Pt[],
  { depth = 3, every = 2, seed = 1, weight }: { depth?: number; every?: number; seed?: number; weight?: (t: number) => number } = {}
) {
  const n = points.length;
  const random = mulberry32(seed);
  const outward = signedArea(points) > 0 ? -1 : 1;

  let d = `M${ptStr(points[0])}`;

  for (let i = 0; i < n; i += every) {
    const a = points[i];
    const b = points[Math.min(i + every, n) % n];
    const w = (weight ? weight(i / n) : 1) * depth * (0.55 + random() * 0.8);

    if (w < 0.4) {
      // Plain edge: pass through the points in between.
      for (let j = 1; j <= every; j++) {
        d += ` L${ptStr(points[(i + j) % n])}`;
      }
      continue;
    }

    const dir = sub(b, a);
    const normal = mul(norm(perp(dir)), outward);
    const tip = add(add(a, mul(dir, 0.72)), mul(normal, w));
    const c1 = add(add(a, mul(dir, 0.42)), mul(normal, w * 0.8));
    const c2 = add(add(a, mul(dir, 0.82)), mul(normal, w * 0.1));

    d += ` Q${ptStr(c1)} ${ptStr(tip)} Q${ptStr(c2)} ${ptStr(b)}`;
  }

  return d + " Z";
}

/** A smooth closed path (no fur). */
export function closedPath(points: Pt[]) {
  return `M${points.map(ptStr).join(" L")} Z`;
}

export function openPath(points: Pt[]) {
  return `M${points.map(ptStr).join(" L")}`;
}

/** A limb segment: a capsule from a (radius ra) to b (radius rb). */
export function capsule(a: Pt, b: Pt, ra: number, rb: number) {
  const n = norm(perp(sub(b, a)));
  const a1 = add(a, mul(n, ra));
  const a2 = sub(a, mul(n, ra));
  const b1 = add(b, mul(n, rb));
  const b2 = sub(b, mul(n, rb));

  return `M${ptStr(a1)} L${ptStr(b1)} A${f(rb)} ${f(rb)} 0 0 0 ${ptStr(b2)} L${ptStr(a2)} A${f(ra)} ${f(ra)} 0 0 0 ${ptStr(a1)} Z`;
}

/**
 * Two-bone IK: where the middle joint goes so that bones of length
 * l1 and l2 reach from `root` to `target`, bending to `side` (±1).
 */
export function ik(root: Pt, target: Pt, l1: number, l2: number, side: 1 | -1): Pt {
  const toTarget = sub(target, root);
  const d = clamp(len(toTarget), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const dir = norm(toTarget);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));

  return add(add(root, mul(dir, a)), mul(perp(dir), h * side));
}
