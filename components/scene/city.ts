/**
 * Deterministic skyline generation for the view outside the window.
 * A seeded PRNG keeps server and client renders identical.
 */

export const GLASS = { x: 472, y: 132, w: 656, h: 496 };

const GLASS_RIGHT = GLASS.x + GLASS.w;
const GLASS_BOTTOM = GLASS.y + GLASS.h;

function mulberry32(seed: number) {
  let a = seed;

  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;

    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type CityWindow = {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: 0 | 1 | 2;
};

export type Building = {
  x: number;
  y: number;
  w: number;
  h: number;
  windows: CityWindow[];
  antenna: boolean;
};

type SkylineOptions = {
  seed: number;
  minH: number;
  maxH: number;
  minW: number;
  maxW: number;
  winW: number;
  winH: number;
  gapX: number;
  gapY: number;
  litChance: number;
  colorful: boolean;
};

function skyline(options: SkylineOptions): Building[] {
  const random = mulberry32(options.seed);
  const buildings: Building[] = [];

  let x = GLASS.x - 20;

  while (x < GLASS_RIGHT + 20) {
    const w = Math.round(
      options.minW +
        random() * (options.maxW - options.minW)
    );

    const h = Math.round(
      options.minH +
        random() * (options.maxH - options.minH)
    );

    const y = GLASS_BOTTOM - h;
    const windows: CityWindow[] = [];

    const padding = Math.max(5, Math.round(w * 0.12));

    for (
      let wy = y + padding + 4;
      wy < GLASS_BOTTOM - options.winH;
      wy += options.winH + options.gapY
    ) {
      for (
        let wx = x + padding;
        wx + options.winW <= x + w - padding;
        wx += options.winW + options.gapX
      ) {
        if (random() > options.litChance) {
          continue;
        }

        const roll = random();

        windows.push({
          x: wx,
          y: wy,
          w: options.winW,
          h: options.winH,
          tone: !options.colorful
            ? 0
            : roll < 0.72
              ? 0
              : roll < 0.86
                ? 1
                : 2,
        });
      }
    }

    buildings.push({
      x,
      y,
      w,
      h,
      windows,
      antenna: h > options.maxH * 0.85 && random() > 0.3,
    });

    x += w + Math.round(random() * 6) - 2;
  }

  return buildings;
}

export const FAR_CITY = skyline({
  seed: 7,
  minH: 110,
  maxH: 250,
  minW: 34,
  maxW: 70,
  winW: 3,
  winH: 4,
  gapX: 6,
  gapY: 8,
  litChance: 0.18,
  colorful: false,
});

export const MID_CITY = skyline({
  seed: 42,
  minH: 120,
  maxH: 320,
  minW: 56,
  maxW: 110,
  winW: 6,
  winH: 9,
  gapX: 8,
  gapY: 9,
  litChance: 0.32,
  colorful: true,
});

const starRandom = mulberry32(99);

export const STARS = Array.from(
  { length: 34 },
  (_, index) => ({
    id: index,
    x: GLASS.x + starRandom() * GLASS.w,
    y: GLASS.y + starRandom() * GLASS.h * 0.42,
    r: 0.6 + starRandom() * 1.4,
    delay: starRandom() * 4,
  })
);

/** Low rooftops in the foreground, just below the window. */
export const NEAR_ROOFS = [
  { x: 460, w: 150, h: 70 },
  { x: 610, w: 90, h: 44 },
  { x: 880, w: 130, h: 58 },
  { x: 1010, w: 130, h: 92 },
].map((roof) => ({
  ...roof,
  y: GLASS_BOTTOM - roof.h,
}));

export const WINDOW_TONES = [
  "#ffd27a",
  "#ff9fcd",
  "#8fe6ff",
] as const;
