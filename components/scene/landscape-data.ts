/**
 * Deterministic data for the countryside outside the window:
 * hills with forests, a village, clouds and stars. A seeded random
 * generator keeps server and client renders identical.
 */

import { GLASS, mulberry32 } from "./scene-shared";

/* ------------------------------------------------------------------ */
/* Hills                                                               */
/* ------------------------------------------------------------------ */

type Hill = {
  x0: number;
  x1: number;
  base: number;
  height: number;
  power: number;
};

/** Round so server and browser math always agree to the pixel. */
const round = (value: number) => Math.round(value * 10) / 10;

function hillTop(hill: Hill, x: number) {
  const t = Math.min(1, Math.max(0, (x - hill.x0) / (hill.x1 - hill.x0)));
  return round(hill.base - hill.height * Math.pow(Math.sin(Math.PI * t), hill.power));
}

function hillPath(hill: Hill) {
  const points: string[] = [];

  for (let x = hill.x0; x <= hill.x1; x += 8) {
    points.push(`${x.toFixed(1)} ${hillTop(hill, x).toFixed(1)}`);
  }

  return `M${hill.x0} ${hill.base} L${points.join(" L")} L${hill.x1} ${hill.base} Z`;
}

export type Tree = {
  x: number;
  y: number;
  r: number;
  tone: 1 | 2 | 3;
  /** Round broadleaf crowns, or a narrow Japanese cedar. */
  kind: "broad" | "cedar";
};

function forest(hill: Hill, seed: number): Tree[] {
  const random = mulberry32(seed);
  const trees: Tree[] = [];
  // Mostly the main tone, with the accent used sparingly.
  const tone = () => {
    const roll = random();
    return (roll < 0.5 ? 1 : roll < 0.85 ? 2 : 3) as 1 | 2 | 3;
  };

  // Mostly open meadow: a couple of groves along the ridge, and the
  // odd lone tree between them.
  const span = hill.x1 - hill.x0;
  const groves = Array.from({ length: 2 }, () => {
    const from = hill.x0 + 30 + random() * (span - 120);
    return [from, from + span * (0.12 + random() * 0.1)] as const;
  });

  for (let x = hill.x0 + 18; x < hill.x1 - 14; x += 9 + random() * 7) {
    const top = hillTop(hill, x);
    const height = hill.base - top;
    const inGrove = groves.some(([from, to]) => x >= from && x <= to);

    if (height < 10 || (!inGrove && random() > 0.06)) {
      continue;
    }

    const cedar = random() < 0.15;
    const r = 5 + random() * 4 + height * 0.035;

    trees.push({
      x: round(x),
      y: round(top + (cedar ? 6 : 4)),
      r: round(cedar ? r * 0.8 : r),
      tone: tone(),
      kind: cedar ? "cedar" : "broad",
    });
  }

  // One small wood down the slope.
  for (let cluster = 0; cluster < 1; cluster++) {
    const cx = hill.x0 + 50 + random() * (span - 100);
    const top = hillTop(hill, cx);
    const cy = top + 16 + random() * Math.max(6, hill.base - top - 34);
    const cedar = random() < 0.4;
    const count = cedar ? 6 : 4;

    for (let i = 0; i < count; i++) {
      const x = cx + (random() - 0.5) * (cedar ? 26 : 32);
      const y = Math.max(hillTop(hill, x) + 10, cy + (random() - 0.5) * 12);

      if (y < hill.base - 6) {
        trees.push({
          x: round(x),
          y: round(y),
          r: round(cedar ? 2.6 + random() * 2 : 3.5 + random() * 3.5),
          tone: tone(),
          kind: cedar ? "cedar" : "broad",
        });
      }
    }
  }

  return trees.sort((a, b) => a.y - b.y);
}

const HILL_BACK: Hill = { x0: 620, x1: 920, base: 542, height: 44, power: 1 };
const HILL_LEFT: Hill = { x0: 430, x1: 770, base: 550, height: 76, power: 0.7 };
const HILL_RIGHT: Hill = { x0: 800, x1: 1170, base: 550, height: 96, power: 0.62 };

export const HILLS = [
  { id: "back", path: hillPath(HILL_BACK), trees: forest(HILL_BACK, 11) },
  { id: "left", path: hillPath(HILL_LEFT), trees: forest(HILL_LEFT, 23) },
  { id: "right", path: hillPath(HILL_RIGHT), trees: forest(HILL_RIGHT, 37) },
];

/* ------------------------------------------------------------------ */
/* Forest texture on the mountains                                     */
/* ------------------------------------------------------------------ */

type P = [number, number];

/** The mid mountain ridge, as cubic segments (matches its path). */
const MID_RIDGE: P[][] = [
  [[440, 490], [490, 470], [520, 452], [560, 448]],
  [[560, 448], [600, 444], [622, 430], [660, 432]],
  [[660, 432], [700, 434], [722, 452], [760, 452]],
  [[760, 452], [800, 452], [822, 430], [860, 426]],
  [[860, 426], [900, 422], [930, 440], [970, 446]],
  [[970, 446], [1010, 452], [1040, 440], [1080, 436]],
  [[1080, 436], [1110, 434], [1130, 440], [1160, 446]],
];

function ridgeLine(segments: P[][]) {
  const points = segments.flatMap(([a, b, c, d]) =>
    Array.from({ length: 33 }, (_, index): P => {
      const t = index / 32;
      const u = 1 - t;
      const mix = (i: 0 | 1) =>
        u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i];
      return [mix(0), mix(1)];
    })
  );

  return (x: number) => {
    const index = points.findIndex(([px]) => px >= x);

    if (index <= 0) {
      return points[Math.max(0, index)][1];
    }

    const [x0, y0] = points[index - 1];
    const [x1, y1] = points[index];
    return y0 + ((y1 - y0) * (x - x0)) / Math.max(1e-6, x1 - x0);
  };
}

/** A band of tiny conifers following a line, as one path. */
function treeline(
  lineY: (x: number) => number,
  x0: number,
  x1: number,
  random: () => number,
  { offset, height, depth }: { offset: number; height: number; depth: number }
) {
  const tops: string[] = [];
  const bottom: string[] = [];

  for (let x = x0; x <= x1; x += 2.6 + random() * 2.6) {
    const base = lineY(x) + offset;
    const h = height * (0.45 + random() * 0.75);
    tops.push(`${round(x - 1.4)} ${round(base)} L${round(x)} ${round(base - h)} L${round(x + 1.4)} ${round(base)}`);
    bottom.push(`${round(x)} ${round(base + depth)}`);
  }

  return `M${tops.join(" L")} L${bottom.reverse().join(" L")} Z`;
}

const midRidge = ridgeLine(MID_RIDGE);
const ridgeRandom = mulberry32(57);

/** A fine line of conifers along the mountain ridge. */
export const MOUNTAIN_FOREST = {
  ridge: treeline(midRidge, 444, 1158, ridgeRandom, { offset: 2.5, height: 4.5, depth: 6 }),
};

/** Where the little torii gate stands, on the right hill. */
export const TORII = { x: 1004, y: hillTop(HILL_RIGHT, 1004) + 2 };

/* ------------------------------------------------------------------ */
/* Village                                                             */
/* ------------------------------------------------------------------ */

export type House = {
  x: number;
  base: number;
  w: number;
  h: number;
  roof: string;
  /** Lit window positions, relative to the house. */
  windows: Array<{ x: number; y: number; lit: boolean }>;
};

const ROOFS = ["#c4544f", "#4f7da0", "#7a5a44", "#5f8a5a", "#b8664a"];

export const HOUSES: House[] = [
  { x: 724, base: 534, w: 28, h: 13 },
  { x: 792, base: 532, w: 32, h: 15 },
  { x: 700, base: 546, w: 34, h: 18 },
  { x: 739, base: 545, w: 26, h: 21 },
  { x: 770, base: 548, w: 40, h: 16 },
  { x: 815, base: 546, w: 30, h: 19 },
  { x: 850, base: 549, w: 24, h: 14 },
  { x: 878, base: 547, w: 22, h: 12 },
].map((house, index) => {
  const random = mulberry32(100 + index);
  const windows = [];

  for (let wx = 5; wx < house.w - 6; wx += 9) {
    windows.push({ x: wx, y: 5, lit: random() > 0.35 });
  }

  return { ...house, roof: ROOFS[index % ROOFS.length], windows };
});

/* ------------------------------------------------------------------ */
/* Sky                                                                 */
/* ------------------------------------------------------------------ */

const starRandom = mulberry32(99);

export const STARS = Array.from({ length: 46 }, (_, index) => ({
  id: index,
  x: GLASS.x + starRandom() * GLASS.w,
  y: GLASS.y + starRandom() * GLASS.h * 0.5,
  r: 0.5 + starRandom() * 1.5,
  delay: starRandom() * 4,
}));

type Puff = [x: number, y: number, r: number];

export type Cloud = {
  id: string;
  cx: number;
  cy: number;
  scale: number;
  puffs: Puff[];
  drift: number;
};

/** Towering cumulus clouds, built from puffs around a flat base. */
export const CLOUDS: Cloud[] = [
  {
    id: "a",
    cx: 640,
    cy: 300,
    scale: 1,
    drift: 120,
    puffs: [
      [-120, 26, 34], [-86, 6, 46], [-40, -22, 58], [10, -44, 52],
      [56, -18, 54], [100, 6, 42], [134, 26, 30], [-10, 18, 52], [52, 24, 44],
    ],
  },
  {
    id: "b",
    cx: 985,
    cy: 268,
    scale: 0.9,
    drift: 150,
    puffs: [
      [-96, 22, 32], [-60, -4, 44], [-14, -30, 54], [34, -14, 48],
      [74, 8, 38], [104, 24, 26], [0, 18, 44],
    ],
  },
  {
    id: "c",
    cx: 860,
    cy: 352,
    scale: 0.55,
    drift: 90,
    puffs: [[-60, 10, 26], [-24, -10, 34], [18, -4, 32], [52, 12, 22], [0, 14, 30]],
  },
];
