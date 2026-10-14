/**
 * Mochi's poses, as skeleton parameters. Everything is in local units
 * with the cat facing left, standing on the floor at y = 0 and centred
 * on x = 0. Any two poses can be blended, which is how she moves
 * smoothly from one to the next.
 */

import { lerp, lerpPt, type Pt } from "./geometry";

export type Pose = {
  /** Centre of the chest (shoulders) and pelvis (hips). */
  chest: Pt;
  pelvis: Pt;
  chestR: number;
  hipR: number;
  /** How far the belly hangs below the spine line. */
  belly: number;
  /** Extra height along the back (a hunch) or a dip (negative). */
  back: number;

  /** Head centre, tilt (degrees) and turn: -1 is profile facing forward, 0 faces you. */
  head: Pt;
  tilt: number;
  yaw: number;

  /** Paw targets: near/far, front/hind. */
  nearFront: Pt;
  farFront: Pt;
  nearHind: Pt;
  farHind: Pt;
  /** 0 standing on the toes, 1 hind legs folded flat (sitting, lying). */
  fold: number;

  /** Tail: angle at the base (0 points back, -90 up), bend per segment, extra curl at the tip. */
  tailBase: number;
  tailBend: number;
  tailCurl: number;

  /** Face. */
  eyes: number;
  ears: number;
  mouth: number;
};

const BASE: Pose = {
  chest: [-33, -60],
  pelvis: [33, -62],
  chestR: 20,
  hipR: 21,
  belly: 13,
  back: 2,
  head: [-58, -86],
  tilt: 0,
  yaw: -0.35,
  nearFront: [-38, 0],
  farFront: [-27, 0],
  nearHind: [30, 0],
  farHind: [41, 0],
  fold: 0,
  tailBase: -40,
  tailBend: -5,
  tailCurl: -6,
  eyes: 1,
  ears: 0,
  mouth: 0,
};

const pose = (overrides: Partial<Pose>): Pose => ({ ...BASE, ...overrides });

export const POSES = {
  stand: BASE,

  walk: pose({
    yaw: -0.8,
    head: [-60, -84],
    tailBase: -58,
    tailBend: -3,
    tailCurl: -11,
  }),

  trot: pose({
    chest: [-35, -56],
    pelvis: [33, -58],
    head: [-64, -76],
    yaw: -0.95,
    ears: 0.6,
    tailBase: -20,
    tailBend: -2,
    tailCurl: -4,
  }),

  sit: pose({
    chest: [-14, -60],
    pelvis: [16, -27],
    chestR: 22,
    hipR: 28,
    belly: 9,
    back: 6,
    head: [-21, -94],
    yaw: -0.15,
    nearFront: [-25, 0],
    farFront: [-17, 0],
    nearHind: [-6, 0],
    farHind: [2, 0],
    fold: 1,
    tailBase: 96,
    tailBend: 8.5,
    tailCurl: 2,
  }),

  loaf: pose({
    chest: [-30, -29],
    pelvis: [32, -29],
    chestR: 22,
    hipR: 25,
    belly: 1,
    back: 7,
    head: [-52, -50],
    yaw: -0.1,
    nearFront: [-32, 0],
    farFront: [-24, 0],
    nearHind: [20, 0],
    farHind: [28, 0],
    fold: 1,
    tailBase: 104,
    tailBend: 9,
    tailCurl: 2,
    eyes: 0.55,
  }),

  sleep: pose({
    chest: [-28, -27],
    pelvis: [32, -28],
    chestR: 22,
    hipR: 25,
    belly: 1,
    back: 8,
    head: [-50, -37],
    tilt: -14,
    yaw: -0.05,
    nearFront: [-32, 0],
    farFront: [-24, 0],
    nearHind: [20, 0],
    farHind: [28, 0],
    fold: 1,
    tailBase: 108,
    tailBend: 9.5,
    tailCurl: 3,
    eyes: 0,
    ears: -0.2,
  }),

  stretch: pose({
    chest: [-40, -27],
    pelvis: [32, -60],
    chestR: 19,
    hipR: 21,
    belly: 11,
    back: -9,
    head: [-66, -36],
    tilt: 12,
    yaw: -0.45,
    nearFront: [-92, 0],
    farFront: [-82, 0],
    nearHind: [36, 0],
    farHind: [46, 0],
    tailBase: -62,
    tailBend: 5,
    tailCurl: 4,
    eyes: 0.15,
    mouth: 1,
  }),

  crouch: pose({
    chest: [-34, -31],
    pelvis: [30, -36],
    chestR: 20,
    hipR: 23,
    belly: 4,
    back: 1,
    head: [-62, -42],
    yaw: -0.95,
    nearFront: [-46, 0],
    farFront: [-37, 0],
    nearHind: [20, 0],
    farHind: [29, 0],
    fold: 0.65,
    tailBase: 8,
    tailBend: 0.5,
    tailCurl: -1,
    ears: 1,
  }),

  pounce: pose({
    chest: [-50, -58],
    pelvis: [30, -52],
    chestR: 20,
    hipR: 21,
    belly: 13,
    back: 4,
    head: [-74, -68],
    yaw: -1,
    nearFront: [-84, -26],
    farFront: [-76, -20],
    nearHind: [58, -10],
    farHind: [66, -6],
    tailBase: -6,
    tailBend: -1,
    tailCurl: -2,
    ears: 1,
  }),
};

export type PoseName = keyof typeof POSES;

export function blendPose(a: Pose, b: Pose, t: number): Pose {
  return {
    chest: lerpPt(a.chest, b.chest, t),
    pelvis: lerpPt(a.pelvis, b.pelvis, t),
    chestR: lerp(a.chestR, b.chestR, t),
    hipR: lerp(a.hipR, b.hipR, t),
    belly: lerp(a.belly, b.belly, t),
    back: lerp(a.back, b.back, t),
    head: lerpPt(a.head, b.head, t),
    tilt: lerp(a.tilt, b.tilt, t),
    yaw: lerp(a.yaw, b.yaw, t),
    nearFront: lerpPt(a.nearFront, b.nearFront, t),
    farFront: lerpPt(a.farFront, b.farFront, t),
    nearHind: lerpPt(a.nearHind, b.nearHind, t),
    farHind: lerpPt(a.farHind, b.farHind, t),
    fold: lerp(a.fold, b.fold, t),
    tailBase: lerp(a.tailBase, b.tailBase, t),
    tailBend: lerp(a.tailBend, b.tailBend, t),
    tailCurl: lerp(a.tailCurl, b.tailCurl, t),
    eyes: lerp(a.eyes, b.eyes, t),
    ears: lerp(a.ears, b.ears, t),
    mouth: lerp(a.mouth, b.mouth, t),
  };
}

export const clonePose = (p: Pose): Pose => blendPose(p, p, 0);
