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
  chest: [-26, -48],
  pelvis: [26, -49],
  chestR: 24,
  hipR: 25,
  belly: 9,
  back: 3,
  head: [-46, -86],
  tilt: 0,
  yaw: -0.3,
  nearFront: [-30, 0],
  farFront: [-21, 0],
  nearHind: [22, 0],
  farHind: [32, 0],
  fold: 0,
  tailBase: -42,
  tailBend: -5,
  tailCurl: -8,
  eyes: 1,
  ears: 0,
  mouth: 0,
};

const pose = (overrides: Partial<Pose>): Pose => ({ ...BASE, ...overrides });

export const POSES = {
  stand: BASE,

  walk: pose({
    yaw: -0.65,
    head: [-48, -84],
    tailBase: -60,
    tailBend: -3,
    tailCurl: -12,
  }),

  trot: pose({
    chest: [-28, -45],
    pelvis: [26, -47],
    head: [-52, -76],
    yaw: -0.85,
    ears: 0.6,
    tailBase: -22,
    tailBend: -2,
    tailCurl: -4,
  }),

  sit: pose({
    chest: [-8, -50],
    pelvis: [14, -25],
    chestR: 25,
    hipR: 29,
    belly: 6,
    back: 6,
    head: [-12, -94],
    yaw: -0.05,
    nearFront: [-19, 0],
    farFront: [-10, 0],
    nearHind: [-2, 0],
    farHind: [6, 0],
    fold: 1,
    tailBase: 96,
    tailBend: 9,
    tailCurl: 3,
  }),

  loaf: pose({
    chest: [-22, -28],
    pelvis: [26, -28],
    chestR: 26,
    hipR: 28,
    belly: 0,
    back: 7,
    head: [-40, -54],
    yaw: -0.05,
    nearFront: [-26, 0],
    farFront: [-18, 0],
    nearHind: [18, 0],
    farHind: [26, 0],
    fold: 1,
    tailBase: 104,
    tailBend: 9,
    tailCurl: 3,
    eyes: 0.8,
  }),

  sleep: pose({
    chest: [-20, -26],
    pelvis: [26, -27],
    chestR: 26,
    hipR: 28,
    belly: 0,
    back: 8,
    head: [-40, -40],
    tilt: -14,
    yaw: 0,
    nearFront: [-26, 0],
    farFront: [-18, 0],
    nearHind: [18, 0],
    farHind: [26, 0],
    fold: 1,
    tailBase: 108,
    tailBend: 10,
    tailCurl: 3,
    eyes: 0,
    ears: -0.2,
  }),

  stretch: pose({
    chest: [-32, -26],
    pelvis: [24, -52],
    chestR: 22,
    hipR: 24,
    belly: 8,
    back: -8,
    head: [-54, -38],
    tilt: 12,
    yaw: -0.35,
    nearFront: [-76, 0],
    farFront: [-67, 0],
    nearHind: [28, 0],
    farHind: [37, 0],
    tailBase: -62,
    tailBend: 5,
    tailCurl: 4,
    eyes: 0.15,
    mouth: 1,
  }),

  crouch: pose({
    chest: [-26, -30],
    pelvis: [24, -34],
    chestR: 23,
    hipR: 25,
    belly: 2,
    back: 2,
    head: [-48, -46],
    yaw: -0.8,
    nearFront: [-36, 0],
    farFront: [-28, 0],
    nearHind: [16, 0],
    farHind: [24, 0],
    fold: 0.65,
    tailBase: 8,
    tailBend: 0.5,
    tailCurl: -1,
    ears: 1,
  }),

  pounce: pose({
    chest: [-36, -52],
    pelvis: [22, -48],
    chestR: 23,
    hipR: 24,
    belly: 9,
    back: 4,
    head: [-58, -70],
    yaw: -0.85,
    nearFront: [-66, -24],
    farFront: [-60, -18],
    nearHind: [46, -10],
    farHind: [53, -6],
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
