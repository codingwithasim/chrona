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

export type Tree = { x: number; y: number; r: number; tone: 1 | 2 | 3 };

function forest(hill: Hill, seed: number): Tree[] {
  const random = mulberry32(seed);
  const trees: Tree[] = [];
  // Mostly the main tone, with the accent used sparingly.
  const tone = () => {
    const roll = random();
    return (roll < 0.5 ? 1 : roll < 0.85 ? 2 : 3) as 1 | 2 | 3;
  };

  // A bumpy canopy along the ridge.
  for (let x = hill.x0 + 18; x < hill.x1 - 14; x += 8 + random() * 6) {
    const top = hillTop(hill, x);
    const height = hill.base - top;

    if (height < 10) {
      continue;
    }

    trees.push({ x: round(x), y: round(top + 4), r: round(5 + random() * 4 + height * 0.035), tone: tone() });
  }

  // A few woods on the slopes.
  for (let cluster = 0; cluster < 4; cluster++) {
    const cx = hill.x0 + 40 + random() * (hill.x1 - hill.x0 - 80);
    const top = hillTop(hill, cx);
    const cy = top + 14 + random() * Math.max(6, hill.base - top - 30);

    for (let i = 0; i < 7; i++) {
      const x = cx + (random() - 0.5) * 46;
      const y = Math.max(hillTop(hill, x) + 10, cy + (random() - 0.5) * 18);

      if (y < hill.base - 6) {
        trees.push({ x: round(x), y: round(y), r: round(3.5 + random() * 3.5), tone: tone() });
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
    cy: 262,
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
    cy: 228,
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
    cy: 330,
    scale: 0.55,
    drift: 90,
    puffs: [[-60, 10, 26], [-24, -10, 34], [18, -4, 32], [52, 12, 22], [0, 14, 30]],
  },
];
