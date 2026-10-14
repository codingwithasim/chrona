"use client";

import { createContext, type ReactNode, useContext } from "react";

import { LINE, mulberry32, pivot } from "../scene-shared";

/*
 * Mochi, a fluffy calico. Every pose is drawn facing left, around a
 * point on the floor under her middle, so she can be placed and
 * mirrored anywhere along the rug.
 */

export type Look = "viewer" | "window" | "left" | "right" | "down";
export type Eyes = "open" | "half" | "closed" | "happy" | "squint";

const FUR = "var(--sc-cat)";
const PATCH = "var(--sc-cat-patch)";
const PATCH_DARK = "var(--sc-cat-patch-2)";
const SHADE = "var(--sc-cat-shade)";
const PINK = "#f4a7b6";

const r1 = (value: number) => Math.round(value * 10) / 10;

export type Pupil = "slit" | "normal" | "wide";
export type Mouth = "smile" | "meow" | "mlem" | "chatter";

/**
 * Details every pose shares: what she's wearing (earned as the room
 * grows), how wide her pupils are, what her mouth is doing, and whether
 * her front paws are kneading.
 */
export const CatWear = createContext<{ bell: boolean; pupil: Pupil; mouth: Mouth; kneading: boolean }>({
  bell: false,
  pupil: "normal",
  mouth: "smile",
  kneading: false,
});

const PUPIL_SIZE: Record<Pupil, { rx: number; ry: number }> = {
  slit: { rx: 1.9, ry: 7.6 },
  normal: { rx: 4, ry: 7.4 },
  wide: { rx: 6.3, ry: 8.1 },
};

/** A red collar with a little gold bell, sitting under her chin. */
function Collar() {
  return (
    <g>
      <path
        d="M-26 32 Q 0 50 26 32 L 26 39 Q 0 57 -26 39 Z"
        fill="#c8553d"
        stroke={LINE}
        strokeOpacity="0.6"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <g transform="translate(0 52)">
        <circle r="6.2" fill="#f2c14e" stroke={LINE} strokeOpacity="0.6" strokeWidth="1.3" />
        <path d="M-5.6 0.4 H5.6" stroke="#9a6a1c" strokeWidth="1.1" />
        <circle cy="2.8" r="1.2" fill="#7a5214" />
        <circle cx="-2.2" cy="-2.4" r="1.5" fill="#ffffff" opacity="0.7" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Fur                                                                 */
/* ------------------------------------------------------------------ */

type FluffOptions = {
  tufts?: number;
  depth?: number;
  seed?: number;
  /** Rotation of the ellipse, in degrees. */
  rotate?: number;
  /** Angle ranges (degrees, 0 = right, 90 = down) that get tufts. */
  only?: Array<[number, number]>;
};

/**
 * An ellipse whose outline breaks into little swept tufts of fur.
 * Seeded, and rounded, so server and browser draw the same cat.
 */
export function fluff(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  { tufts = 28, depth = 4.5, seed = 1, rotate = 0, only }: FluffOptions = {}
) {
  const random = mulberry32(seed);
  const turn = (rotate * Math.PI) / 180;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const step = (Math.PI * 2) / tufts;
  const bulge = 1 / Math.cos(step / 2);

  const at = (angle: number, grow: number, scale = 1) => {
    const x = Math.cos(angle) * (rx + grow) * scale;
    const y = Math.sin(angle) * (ry + grow) * scale;
    return `${r1(cx + x * cos - y * sin)} ${r1(cy + x * sin + y * cos)}`;
  };

  const tufted = (angle: number) => {
    if (!only) {
      return true;
    }

    const degrees = (((angle * 180) / Math.PI) % 360 + 360) % 360;
    return only.some(([from, to]) => degrees >= from && degrees <= to);
  };

  let d = `M${at(0, 0)}`;

  for (let i = 0; i < tufts; i++) {
    const a0 = i * step;
    const grow = depth * (0.55 + random() * 0.8);

    if (tufted(a0 + step / 2)) {
      // Out to a swept tip, then back in to the next root.
      d += ` Q${at(a0 + step * 0.42, grow * 0.8)} ${at(a0 + step * 0.72, grow)}`;
      d += ` Q${at(a0 + step * 0.8, grow * 0.1)} ${at(a0 + step, 0)}`;
    } else {
      d += ` Q${at(a0 + step / 2, 0, bulge)} ${at(a0 + step, 0)}`;
    }
  }

  return d + " Z";
}

/** Short strands of fur scattered over an ellipse, flowing outwards. */
function strands(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  seed: number,
  length = 7
) {
  const random = mulberry32(seed);
  let d = "";

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const reach = Math.sqrt(random()) * 0.85;
    const x = cx + Math.cos(angle) * rx * reach;
    const y = cy + Math.sin(angle) * ry * reach;
    // Fur lies along the body, drooping a little.
    const dx = Math.cos(angle) * length * 0.6;
    const dy = Math.sin(angle) * length * 0.4 + length * 0.5;
    d += `M${r1(x)} ${r1(y)} q${r1(dx * 0.3)} ${r1(dy * 0.6)} ${r1(dx)} ${r1(dy)} `;
  }

  return d;
}

/**
 * A furry body built from overlapping shapes: a soft outline under
 * everything, the fur on top, then patches and shading clipped inside.
 */
function FurBody({
  id,
  parts,
  fill = FUR,
  children,
}: {
  id: string;
  parts: string[];
  fill?: string;
  children?: ReactNode;
}) {
  return (
    <g>
      <clipPath id={id}>
        {parts.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </clipPath>

      <g opacity="0.7" fill={LINE} stroke={LINE} strokeWidth="3.4" strokeLinejoin="round">
        {parts.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
      <g fill={fill}>
        {parts.map((d, index) => (
          <path key={index} d={d} />
        ))}
      </g>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
}

/** Strands drawn in shadow and in light, for texture. */
function Strands({ d, light = false }: { d: string; light?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={light ? "#ffffff" : LINE}
      strokeOpacity={light ? 0.55 : 0.16}
      strokeWidth={light ? 1.3 : 1.1}
      strokeLinecap="round"
    />
  );
}

/** A fluffy tail: a thick stroke whose edge is a row of soft bumps. */
function Tail({ d, width = 20 }: { d: string; width?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g opacity="0.7" stroke={LINE}>
        <path d={d} strokeWidth={width + 3.4} />
        <path d={d} strokeWidth={width + 6.4} strokeDasharray="0.1 6.5" />
      </g>
      <path d={d} stroke={FUR} strokeWidth={width} />
      <path d={d} stroke={FUR} strokeWidth={width + 3} strokeDasharray="0.1 6.5" />
      {/* The last bit of the tail in her darker patch colour */}
      <path d={d} pathLength={100} stroke={PATCH_DARK} strokeWidth={width} strokeDasharray="0 80 20" />
      <path d={d} stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" transform="translate(-1.5 -3)" />
    </g>
  );
}

/** A paw with little toe lines. */
function Paw({ x, y, rx = 12, ry = 6.5 }: { x: number; y: number; rx?: number; ry?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={FUR} stroke={LINE} strokeOpacity="0.7" strokeWidth="1.8" />
      <g stroke={LINE} strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round">
        <line x1={x - rx * 0.3} y1={y + ry * 0.1} x2={x - rx * 0.3} y2={y + ry * 0.85} />
        <line x1={x + rx * 0.2} y1={y + ry * 0.1} x2={x + rx * 0.2} y2={y + ry * 0.85} />
      </g>
    </g>
  );
}

/** A leg: a soft column, a little narrower at the ankle, and a paw. */
function Leg({ x, top, bottom = 0, width = 16, shade = false }: { x: number; top: number; bottom?: number; width?: number; shade?: boolean }) {
  const half = width / 2;
  const ankle = width * 0.36;
  const foot = bottom - 6;

  return (
    <g>
      <path
        d={`M${x - half} ${top} L${x - ankle} ${foot} Q${x} ${foot + 3} ${x + ankle} ${foot} L${x + half} ${top} Q${x} ${top - half} ${x - half} ${top} Z`}
        fill={shade ? SHADE : FUR}
        stroke={LINE}
        strokeOpacity="0.7"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Paw x={x} y={bottom - 4} rx={width * 0.66} ry={5.5} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Defs                                                                */
/* ------------------------------------------------------------------ */

export function CatDefs() {
  return (
    <defs>
      <radialGradient id="sc-cat-iris" cx="0.5" cy="0.62" r="0.62">
        <stop offset="0" stopColor="#fbe7a1" />
        <stop offset="0.55" stopColor="#e3ad48" />
        <stop offset="1" stopColor="#9a6328" />
      </radialGradient>
      <radialGradient id="sc-cat-blush">
        <stop offset="0" stopColor="#f59fb2" stopOpacity="0.85" />
        <stop offset="1" stopColor="#f59fb2" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="sc-cat-light" cx="0.38" cy="0.22" r="0.85">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#4a3434" stopOpacity="0.22" />
      </radialGradient>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/* Head                                                                */
/* ------------------------------------------------------------------ */

export const LOOK_OFFSET: Record<Look, { dx: number; dy: number; tilt: number }> = {
  viewer: { dx: 0, dy: 0, tilt: 0 },
  window: { dx: -1.6, dy: -2.6, tilt: -8 },
  left: { dx: -2.4, dy: 0, tilt: -4 },
  right: { dx: 2.4, dy: 0.4, tilt: 5 },
  down: { dx: 0, dy: 2.2, tilt: 7 },
};

function Eye({ cx, cy, eyes, look, mirror }: { cx: number; cy: number; eyes: Eyes; look: Look; mirror?: boolean }) {
  const { dx, dy } = LOOK_OFFSET[look];
  const pupil = PUPIL_SIZE[useContext(CatWear).pupil];
  const line = { stroke: LINE, strokeWidth: 2.4, fill: "none", strokeLinecap: "round" as const, strokeOpacity: 0.85 };

  if (eyes === "closed") {
    return <path d={`M${cx - 8} ${cy} Q ${cx} ${cy + 6} ${cx + 8} ${cy}`} {...line} />;
  }

  if (eyes === "happy") {
    return <path d={`M${cx - 8} ${cy + 2.5} Q ${cx} ${cy - 6} ${cx + 8} ${cy + 2.5}`} {...line} />;
  }

  if (eyes === "squint") {
    const s = mirror ? -1 : 1;
    return <path d={`M${cx - 7 * s} ${cy - 4} L ${cx + 5 * s} ${cy} L ${cx - 7 * s} ${cy + 4}`} {...line} />;
  }

  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="9" ry="10.2" fill="#2a1d1f" />
      <ellipse cx={cx} cy={cy + 0.8} rx="7.6" ry="8.8" fill="url(#sc-cat-iris)" />
      <g style={{ transform: `translate(${dx}px, ${dy}px)`, transition: "transform 450ms ease" }}>
        {/* Pupils open wide in the dark and on the hunt, narrow in bright day */}
        <ellipse
          cx={cx}
          cy={cy + 0.6}
          rx={pupil.rx}
          ry={pupil.ry}
          fill="#1a1214"
          style={{ rx: pupil.rx, ry: pupil.ry, transition: "rx 500ms ease, ry 500ms ease" } as React.CSSProperties}
        />
        <circle cx={cx - 2.8} cy={cy - 3.6} r="3" fill="#ffffff" />
        <circle cx={cx + 2.6} cy={cy + 3.8} r="1.4" fill="#ffffff" opacity="0.85" />
      </g>
      <path d={`M${cx - 9.6} ${cy - 4} Q ${cx} ${cy - 13.5} ${cx + 9.6} ${cy - 4}`} {...line} strokeWidth={2} />
      {eyes === "half" && (
        <path
          d={`M${cx - 10} ${cy - 11} H${cx + 10} V${cy - 1} Q ${cx} ${cy + 2} ${cx - 10} ${cy - 1} Z`}
          fill={FUR}
          stroke={LINE}
          strokeOpacity="0.6"
          strokeWidth="1.6"
        />
      )}
    </g>
  );
}

const HEAD = fluff(0, 0, 45, 37, { tufts: 30, depth: 6, seed: 7, only: [[6, 74], [106, 174]] });
const HEAD_RUFF = fluff(0, 10, 32, 22, { tufts: 16, depth: 4, seed: 12, only: [[20, 160]] });
const HEAD_STRANDS = strands(0, -6, 38, 26, 16, 21, 6);

/** The head, drawn around (0, 0). */
export function Head({
  eyes,
  look,
  yawning,
  licking,
  earPoke,
}: {
  eyes: Eyes;
  look: Look;
  yawning: boolean;
  licking?: boolean;
  earPoke: number;
}) {
  const { bell, mouth } = useContext(CatWear);

  return (
    <g>
      {bell && <Collar />}

      {/* Ears, with tufts of fur inside */}
      <g key={earPoke} className={earPoke ? "sc-ear" : undefined} style={pivot("50% 100%")}>
        <path d="M-40 -12 Q -43 -46 -33 -56 Q -20 -50 -6 -32 Z" fill={PATCH} stroke={LINE} strokeOpacity="0.7" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-33 -22 Q -35 -40 -30 -47 Q -21 -42 -14 -31 Z" fill={PINK} />
        <path d="M-32 -24 q 1 -7 -1 -14 M-27 -26 q 2 -6 1 -11 M-22 -27 q 2 -4 2 -8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.85" />
      </g>
      <path d="M40 -12 Q 43 -46 33 -56 Q 20 -50 6 -32 Z" fill={PATCH_DARK} stroke={LINE} strokeOpacity="0.7" strokeWidth="2" strokeLinejoin="round" />
      <path d="M33 -22 Q 35 -40 30 -47 Q 21 -42 14 -31 Z" fill={PINK} opacity="0.9" />
      <path d="M32 -24 q -1 -7 1 -14 M27 -26 q -2 -6 -1 -11 M22 -27 q -2 -4 -2 -8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.85" />

      <FurBody id="sc-cat-head-clip" parts={[HEAD]}>
        {/* Calico patches */}
        <path d="M-60 -6 Q -46 -44 -4 -42 Q -10 -26 -24 -18 Q -34 -12 -42 2 Q -50 8 -60 6 Z" fill={PATCH} />
        <ellipse cx="27" cy="-31" rx="18" ry="10" fill={PATCH_DARK} />
        <ellipse cx="0" cy="0" rx="45" ry="37" fill="url(#sc-cat-light)" />
        <Strands d={HEAD_STRANDS} />
      </FurBody>

      {/* A soft white muzzle and cheek ruff */}
      <path d={HEAD_RUFF} fill="#fffaf5" opacity="0.75" />

      <Eye cx={-17} cy={3} eyes={eyes} look={look} />
      <Eye cx={17} cy={3} eyes={eyes} look={look} mirror />

      <ellipse cx="-30" cy="16" rx="9" ry="5.5" fill="url(#sc-cat-blush)" />
      <ellipse cx="30" cy="16" rx="9" ry="5.5" fill="url(#sc-cat-blush)" />

      <path d="M-3.6 13.4 Q 0 12 3.6 13.4 Q 1.4 16.8 0 17 Q -1.4 16.8 -3.6 13.4 Z" fill="#ee8ea3" />
      <circle cx="-1.1" cy="13.6" r="0.9" fill="#ffffff" opacity="0.8" />

      {/* Whisker pads: a few freckles each side of the muzzle */}
      <g fill={LINE} opacity="0.28">
        <circle cx="-9.5" cy="16.5" r="0.9" />
        <circle cx="-12.5" cy="18.6" r="0.9" />
        <circle cx="-10" cy="20.6" r="0.8" />
        <circle cx="9.5" cy="16.5" r="0.9" />
        <circle cx="12.5" cy="18.6" r="0.9" />
        <circle cx="10" cy="20.6" r="0.8" />
      </g>

      {yawning ? (
        <g>
          <ellipse cx="0" cy="25" rx="7.5" ry="9.5" fill="#7a3a4a" stroke={LINE} strokeOpacity="0.7" strokeWidth="1.4" />
          <ellipse cx="0" cy="30" rx="4.8" ry="3.2" fill="#f08aa3" />
          <path d="M-5.4 17.4 L-4.4 21 L-3.4 17.4 Z M3.4 17.4 L4.4 21 L5.4 17.4 Z" fill="#ffffff" />
        </g>
      ) : mouth === "meow" || mouth === "chatter" ? (
        // A little "mew", or her jaw quivering at the birds.
        <g className={mouth === "chatter" ? "sc-chatter" : undefined} style={pivot("50% 0%")}>
          <path d="M-5.6 19.2 Q 0 18 5.6 19.2 Q 4.6 27 0 27.6 Q -4.6 27 -5.6 19.2 Z" fill="#7a3a4a" stroke={LINE} strokeOpacity="0.7" strokeWidth="1.3" strokeLinejoin="round" />
          <ellipse cx="0" cy="25.2" rx="3.2" ry="1.9" fill="#f08aa3" />
          <path d="M-4.2 19.4 L-3.4 21.6 L-2.6 19.4 Z M2.6 19.4 L3.4 21.6 L4.2 19.4 Z" fill="#ffffff" />
        </g>
      ) : (
        <g>
          <path d="M-6.5 19.5 Q -3.2 23 0 19.8 Q 3.2 23 6.5 19.5" fill="none" stroke={LINE} strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
          {/* Mlem: the tip of her tongue, forgotten out in her sleep */}
          {mouth === "mlem" && <path d="M-2.6 20.6 Q -2.8 25.4 0 25.6 Q 2.8 25.4 2.6 20.6 Z" fill="#f08aa3" stroke={LINE} strokeOpacity="0.5" strokeWidth="0.9" />}
        </g>
      )}

      {licking && <ellipse cx="0" cy="23" rx="3.2" ry="2.6" fill="#f08aa3" className="sc-lick" />}

      <g stroke={LINE} strokeOpacity="0.3" strokeWidth="0.9" strokeLinecap="round" fill="none">
        <path d="M-24 14 Q -40 9 -58 8" />
        <path d="M-24 18 Q -40 18 -56 21" />
        <path d="M-23 21 Q -36 25 -50 31" />
        <path d="M24 14 Q 40 9 58 8" />
        <path d="M24 18 Q 40 18 56 21" />
        <path d="M23 21 Q 36 25 50 31" />
      </g>
    </g>
  );
}

export function HeadAt({
  x,
  y,
  scale,
  look,
  tilt = 0,
  ...head
}: {
  x: number;
  y: number;
  scale: number;
  look: Look;
  tilt?: number;
  eyes: Eyes;
  yawning: boolean;
  licking?: boolean;
  earPoke: number;
}) {
  const angle = LOOK_OFFSET[look].tilt + tilt;

  return (
    <g
      style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: `${x}px ${y + 34 * scale}px`,
        transition: "transform 500ms ease",
      }}
    >
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <Head look={look} {...head} />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Poses (facing left, origin on the floor)                            */
/* ------------------------------------------------------------------ */

type HeadProps = { eyes: Eyes; look: Look; yawning: boolean; earPoke: number };

/** Front paws; while kneading they press down in turn, making biscuits. */
function KneadingPaws() {
  const { kneading } = useContext(CatWear);

  return (
    <>
      <g className={kneading ? "sc-knead" : undefined}>
        <Paw x={-74} y={-6} rx={15} ry={8} />
      </g>
      <g className={kneading ? "sc-knead" : undefined} style={{ animationDelay: "-0.4s" }}>
        <Paw x={-46} y={-4} rx={15} ry={8} />
      </g>
    </>
  );
}

const LOAF_BODY = fluff(6, -42, 96, 42, { tufts: 46, depth: 3.4, seed: 31, only: [[170, 370]] });
const LOAF_HIP = fluff(50, -52, 50, 40, { tufts: 24, depth: 3.6, seed: 33, only: [[200, 360]] });
const LOAF_STRANDS = strands(20, -56, 80, 26, 34, 35, 8);

/** Curled up on the rug, head on her paws when asleep. */
export function LoafPose({ sleeping, ...head }: HeadProps & { sleeping: boolean }) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="128" ry="11" fill="url(#sc-drop-shadow)" />

      <g className="sc-breathe" style={{ ...pivot("50% 100%"), animationDuration: sleeping ? "4s" : "3s" }}>
        <FurBody id="sc-cat-loaf-clip" parts={[LOAF_BODY, LOAF_HIP]}>
          <ellipse cx="54" cy="-78" rx="56" ry="30" fill={PATCH} />
          <ellipse cx="-12" cy="-84" rx="26" ry="14" fill={PATCH_DARK} />
          <ellipse cx="96" cy="-40" rx="14" ry="22" fill={PATCH_DARK} />
          <ellipse cx="0" cy="-4" rx="118" ry="16" fill={SHADE} opacity="0.75" />
          <ellipse cx="10" cy="-46" rx="110" ry="54" fill="url(#sc-cat-light)" />
          <Strands d={LOAF_STRANDS} />
          <path d="M-40 -78 Q 10 -92 70 -88" stroke="#ffffff" strokeWidth="2.4" fill="none" opacity="0.45" strokeLinecap="round" />
        </FurBody>
      </g>

      {/* The tail wraps around the front */}
      <g className="sc-tail" style={{ ...pivot("100% 0%"), animationDuration: sleeping ? "3.4s" : "1.6s" }}>
        <Tail d="M98 -22 C 112 4 40 2 -28 0 C -56 -1 -80 -4 -94 -10" />
      </g>

      <KneadingPaws />

      {sleeping ? (
        <HeadAt x={-80} y={-40} scale={1} tilt={-10} {...head} />
      ) : (
        <HeadAt x={-78} y={-56} scale={1} {...head} />
      )}
    </g>
  );
}

const SIT_HIP = fluff(20, -36, 46, 36, { tufts: 26, depth: 3.4, seed: 41, only: [[190, 360]] });
const SIT_TORSO = fluff(-6, -68, 37, 50, { tufts: 28, depth: 3.6, seed: 43, only: [[150, 390]] });
const SIT_CHEST = fluff(-14, -68, 27, 30, { tufts: 18, depth: 6, seed: 45, only: [[20, 170]] });
const SIT_STRANDS = strands(10, -56, 40, 40, 20, 47, 8);
const SIT_RUFF_STRANDS = strands(-14, -66, 20, 22, 10, 49, 6);

/** Sitting up: grooming, batting the yarn, yawning, or just watching. */
export function SitPose({ activity, ...head }: HeadProps & { activity: string }) {
  const grooming = activity === "groom";
  const batting = activity === "bat";

  return (
    <g>
      <ellipse cx="0" cy="0" rx="82" ry="9" fill="url(#sc-drop-shadow)" />

      <g className="sc-tail" style={{ ...pivot("100% 0%"), animationDuration: batting ? "0.5s" : "1.8s" }}>
        <Tail d="M52 -14 C 70 4 30 10 -6 9 C -28 8 -42 4 -50 -2" width={18} />
      </g>

      <g className="sc-breathe" style={{ ...pivot("50% 100%"), animationDuration: "3.2s" }}>
        <FurBody id="sc-cat-sit-clip" parts={[SIT_HIP, SIT_TORSO]}>
          <ellipse cx="40" cy="-50" rx="34" ry="32" fill={PATCH} />
          <ellipse cx="14" cy="-104" rx="16" ry="12" fill={PATCH_DARK} />
          <ellipse cx="0" cy="-6" rx="80" ry="14" fill={SHADE} opacity="0.6" />
          <rect x="-60" y="-130" width="130" height="134" fill="url(#sc-cat-light)" />
          <Strands d={SIT_STRANDS} />
        </FurBody>

        {/* Front legs, under a fluffy ruff */}
        <Leg x={-31} top={-46} width={19} />
        {!grooming && !batting && <Leg x={-7} top={-44} width={19} />}
        <path d={SIT_CHEST} fill="#fffbf6" />
        <path d={SIT_RUFF_STRANDS} fill="none" stroke="#e9dcd2" strokeWidth="1.1" strokeLinecap="round" />
      </g>

      {batting && (
        <g>
          <path d="M-18 -72 Q -70 -70 -104 -26" fill="none" stroke={LINE} strokeOpacity="0.7" strokeWidth="19.4" strokeLinecap="round" />
          <path d="M-18 -72 Q -70 -70 -104 -26" fill="none" stroke={FUR} strokeWidth="16" strokeLinecap="round" />
          <circle cx="-106" cy="-23" r="9.5" fill={FUR} stroke={LINE} strokeOpacity="0.7" strokeWidth="1.8" />
        </g>
      )}

      <HeadAt x={-10} y={-128} scale={0.96} licking={grooming} {...head} />

      {grooming && (
        <g className="sc-lick">
          <path d="M-8 -76 Q 0 -100 -16 -112" fill="none" stroke={LINE} strokeOpacity="0.7" strokeWidth="19.4" strokeLinecap="round" />
          <path d="M-8 -76 Q 0 -100 -16 -112" fill="none" stroke={FUR} strokeWidth="16" strokeLinecap="round" />
          <circle cx="-18" cy="-114" r="9.5" fill={FUR} stroke={LINE} strokeOpacity="0.7" strokeWidth="1.8" />
          <ellipse cx="-21" cy="-117" rx="3.2" ry="2.2" fill={PINK} />
        </g>
      )}
    </g>
  );
}

const STRETCH_HIP = fluff(54, -66, 40, 36, { tufts: 20, depth: 5, seed: 51, only: [[180, 360]] });
const STRETCH_TORSO = fluff(0, -46, 64, 24, { tufts: 26, depth: 4.5, seed: 53, rotate: -16, only: [[170, 370]] });

/** A long morning stretch, bottom in the air. */
export function StretchPose({ earPoke }: { earPoke: number }) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="140" ry="9" fill="url(#sc-drop-shadow)" />

      <g className="sc-tail" style={{ ...pivot("0% 100%"), animationDuration: "1.2s" }}>
        <Tail d="M84 -86 C 108 -110 100 -140 116 -160" width={17} />
      </g>

      <Leg x={50} top={-50} />
      <Leg x={70} top={-52} />

      <FurBody id="sc-cat-stretch-clip" parts={[STRETCH_HIP, STRETCH_TORSO]}>
        <ellipse cx="60" cy="-84" rx="40" ry="24" fill={PATCH} />
        <ellipse cx="0" cy="-20" rx="100" ry="16" fill={SHADE} opacity="0.6" />
        <rect x="-70" y="-110" width="170" height="110" fill="url(#sc-cat-light)" />
      </FurBody>

      <path d="M-36 -24 L -112 -14 Q -124 -9 -112 -4 L -36 -6 Z" fill={FUR} stroke={LINE} strokeOpacity="0.7" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M-30 -16 L -120 -8 Q -132 -2 -120 3 L -30 1 Z" fill={FUR} stroke={LINE} strokeOpacity="0.7" strokeWidth="1.8" strokeLinejoin="round" />

      <HeadAt x={-62} y={-44} scale={0.92} eyes="squint" look="viewer" yawning earPoke={earPoke} />
    </g>
  );
}

const WALK_BODY = fluff(4, -54, 62, 26, { tufts: 32, depth: 4, seed: 61 });
const WALK_CHEST = fluff(-40, -56, 27, 28, { tufts: 16, depth: 6, seed: 63, only: [[30, 200]] });
const WALK_HIP = fluff(42, -56, 30, 29, { tufts: 16, depth: 4.5, seed: 65 });
const WALK_STRANDS = strands(6, -60, 56, 18, 22, 67, 7);

/** Padding along on soft paws, tail up. */
export function WalkPose({ ...head }: HeadProps) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="92" ry="8" fill="url(#sc-drop-shadow)" />

      {/* Far legs in shadow, then near legs, all tucked under the body */}
      <g className="sc-leg" style={{ ...pivot("50% 0%"), animationDelay: "-0.45s" }}>
        <Leg x={-30} top={-44} width={14} shade />
      </g>
      <g className="sc-leg" style={pivot("50% 0%")}>
        <Leg x={54} top={-44} width={14} shade />
      </g>
      <g className="sc-leg" style={pivot("50% 0%")}>
        <Leg x={-46} top={-44} />
      </g>
      <g className="sc-leg" style={{ ...pivot("50% 0%"), animationDelay: "-0.45s" }}>
        <Leg x={36} top={-44} />
      </g>

      <g className="sc-walk-bob">
        <g className="sc-tail" style={{ ...pivot("0% 100%"), animationDuration: "1.4s" }}>
          <Tail d="M58 -68 C 88 -80 94 -116 82 -136 C 76 -146 66 -144 68 -136" width={17} />
        </g>

        <FurBody id="sc-cat-walk-clip" parts={[WALK_HIP, WALK_BODY, WALK_CHEST]}>
          <ellipse cx="30" cy="-76" rx="40" ry="20" fill={PATCH} />
          <ellipse cx="-14" cy="-80" rx="16" ry="10" fill={PATCH_DARK} />
          <ellipse cx="4" cy="-28" rx="80" ry="12" fill={SHADE} opacity="0.7" />
          <rect x="-80" y="-90" width="160" height="70" fill="url(#sc-cat-light)" />
          <Strands d={WALK_STRANDS} />
        </FurBody>
        <path d={WALK_CHEST} fill="#fffbf6" opacity="0.6" />

        <HeadAt x={-58} y={-92} scale={0.86} {...head} />
      </g>
    </g>
  );
}

const CROUCH_BODY = fluff(6, -36, 62, 21, { tufts: 32, depth: 4, seed: 71 });
const CROUCH_CHEST = fluff(-40, -32, 25, 21, { tufts: 14, depth: 5.5, seed: 73, only: [[30, 200]] });
const CROUCH_HIP = fluff(44, -44, 30, 27, { tufts: 16, depth: 4.5, seed: 75 });
const CROUCH_STRANDS = strands(8, -42, 56, 14, 20, 77, 7);

/**
 * Low to the ground, stalking: elbows bent, belly near the floor, bottom
 * a touch higher than her shoulders, tail out straight behind with only
 * its tip twitching. Before a pounce her bottom wiggles.
 */
export function CrouchPose({ wiggling, stalking, ...head }: HeadProps & { wiggling: boolean; stalking: boolean }) {
  return (
    <g>
      <ellipse cx="4" cy="0" rx="96" ry="8" fill="url(#sc-drop-shadow)" />

      {/* Back legs folded under her, ready to spring */}
      <g className={wiggling ? "sc-butt" : undefined} style={pivot("50% 100%")}>
        <ellipse cx="34" cy="-4" rx="15" ry="6" fill={FUR} stroke={LINE} strokeOpacity="0.7" strokeWidth="1.8" />
        <ellipse cx="58" cy="-4" rx="15" ry="6" fill={FUR} stroke={LINE} strokeOpacity="0.7" strokeWidth="1.8" />

        {/* The tail, low and straight, the tip flicking */}
        <g className="sc-tail" style={{ ...pivot("0% 50%"), animationDuration: wiggling ? "0.35s" : "0.8s" }}>
          <Tail d="M64 -40 C 92 -38 114 -30 136 -36" width={16} />
        </g>
      </g>

      {/* Front legs, bent, stepping slowly while she stalks */}
      <g className={stalking ? "sc-leg" : undefined} style={{ ...pivot("50% 0%"), animationDelay: "-0.45s" }}>
        <Leg x={-28} top={-26} width={14} shade />
      </g>
      <g className={stalking ? "sc-leg" : undefined} style={pivot("50% 0%")}>
        <Leg x={-46} top={-26} />
      </g>

      <g className={wiggling ? "sc-butt" : undefined} style={pivot("50% 100%")}>
        <FurBody id="sc-cat-crouch-clip" parts={[CROUCH_HIP, CROUCH_BODY, CROUCH_CHEST]}>
          <ellipse cx="30" cy="-56" rx="40" ry="18" fill={PATCH} />
          <ellipse cx="-12" cy="-58" rx="16" ry="9" fill={PATCH_DARK} />
          <ellipse cx="4" cy="-12" rx="80" ry="10" fill={SHADE} opacity="0.7" />
          <rect x="-80" y="-80" width="160" height="70" fill="url(#sc-cat-light)" />
          <Strands d={CROUCH_STRANDS} />
        </FurBody>
      </g>
      <path d={CROUCH_CHEST} fill="#fffbf6" opacity="0.6" />

      {/* Head low and forward, eyes on the prey */}
      <HeadAt x={-62} y={-62} scale={0.86} {...head} />
    </g>
  );
}

/** Where her head is in each pose, for bubbles, hearts and Zzz. */
export const HEAD_SPOT = {
  loaf: { x: -80, y: -56 },
  sit: { x: -10, y: -128 },
  stretch: { x: -62, y: -44 },
  walk: { x: -58, y: -92 },
  crouch: { x: -62, y: -62 },
} as const;
