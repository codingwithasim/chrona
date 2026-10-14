"use client";

import type { CSSProperties } from "react";

import { useRoomUnlocks } from "@/hooks/use-room";
import { playSfx } from "@/lib/sfx";
import { formatHours } from "@/lib/unlocks";
import { COATS, useRoomStore } from "@/stores/room-store";

import { project, ROOM, scaleAt, type Vec3 } from "./projection";
import { C } from "./room-palette";
import { mulberry32, pivot, usePoke, useSpeak } from "./scene-shared";

/*
 * Things the room earns as your focus time adds up (see lib/unlocks).
 * Each one appears quietly the first time you come back to the room.
 */

const { back: B, ceiling: CEIL } = ROOM;

function At({ at, children }: { at: Vec3; children: React.ReactNode }) {
  const [x, y] = project(at);
  const s = scaleAt(at[2]) / 100;

  return <g transform={`translate(${x} ${y}) scale(${s.toFixed(3)})`}>{children}</g>;
}

/** Mochi's coat as CSS variables, for anything that draws her. */
export function useCoatStyle() {
  const coat = COATS[useRoomStore((state) => state.coat)] ?? COATS.calico;

  return {
    "--sc-cat": coat.fur,
    "--sc-cat-shade": coat.shade,
    "--sc-cat-patch": coat.patch,
    "--sc-cat-patch-2": coat.patch2,
  } as CSSProperties;
}

/* ------------------------------------------------------------------ */
/* A hanging pothos that grows with your focus                         */
/* ------------------------------------------------------------------ */

const POT_AT: Vec3 = [-3.2, 1.95, 9.85];
/** Down from the pot to the hook in the ceiling, in local units. */
const HOOK_Y = -(CEIL - POT_AT[1]) * 100;

/** A heart-shaped pothos leaf, hanging from its stem at (0, 0). */
function PothosLeaf({ x, y, angle, size, dark }: { x: number; y: number; angle: number; size: number; dark: boolean }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(0)}) scale(${size.toFixed(2)})`}>
      <path
        d="M0 0 C -5 -3 -10 2 -8 7 C -6 12 -1 14 0 17 C 1 14 6 12 8 7 C 10 2 5 -3 0 0 Z"
        fill={dark ? C.plantDark : C.plant}
      />
      {/* Golden pothos: a pale streak down each leaf */}
      <path d="M0 2 Q 2 8 0 14" stroke="#e8e1a8" strokeWidth="1.6" fill="none" opacity="0.55" strokeLinecap="round" />
    </g>
  );
}

type Vine = { x: number; sway: number; phase: number; reach: number };

const VINES: Vine[] = [
  { x: -16, sway: 7, phase: 0, reach: 1 },
  { x: 15, sway: 6, phase: 2.1, reach: 0.72 },
  { x: -9, sway: 8, phase: 4.2, reach: 0.86 },
  { x: 11, sway: 5, phase: 1.2, reach: 0.5 },
];

const VINE_LENGTH = 150;
/** The top of the pot, where the vines spill over. */
const RIM = -19;

/** A vine as points from the rim down, and leaves along it. */
function vineOf(vine: Vine, length: number, seed: number) {
  const random = mulberry32(seed);
  const points: Array<[number, number]> = [];

  // Over the rim, down the side of the pot, then trailing free.
  for (let t = 0; t <= length + 20; t += 4) {
    const outward = Math.sign(vine.x) * Math.min(3, t / 6);
    points.push([vine.x + outward + Math.sin(t / 26 + vine.phase) * vine.sway * Math.min(1, t / 40), RIM + t]);
  }

  const leaves = [];

  for (let t = 26, side = 1; t < length + 20; t += 11 + random() * 5, side = -side) {
    const [lx, ly] = points[Math.min(points.length - 1, Math.round(t / 4))];
    leaves.push({ x: lx, y: ly, angle: side * (28 + random() * 26), size: 0.8 + random() * 0.35, dark: random() < 0.35 });
  }

  return { d: points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" "), leaves };
}

export function Pothos() {
  const { shows, growth, minutes } = useRoomUnlocks();
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  if (!shows("pothos")) {
    return null;
  }

  const vines = VINES.map((vine, index) => vineOf(vine, VINE_LENGTH * vine.reach * growth, index + 3));
  const leafCount = vines.reduce((sum, vine) => sum + vine.leaves.length, 0) + 5;

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
        const [x, y] = project(POT_AT);
        speak(x, y - 10, `${leafCount} leaves, from ${formatHours(minutes)} of focus. It's growing with you 🌱`);
      }}
    >
      <At at={POT_AT}>
        {/* Cords up to a hook in the ceiling */}
        <g stroke="#cbb89a" strokeWidth="1.2" fill="none" opacity="0.9">
          <path d={`M-15 -20 L0 ${HOOK_Y}`} />
          <path d={`M15 -20 L0 ${HOOK_Y}`} />
          <path d={`M0 -18 L0 ${HOOK_Y}`} />
        </g>
        <circle cx="0" cy={HOOK_Y + 2} r="2.4" fill="none" stroke="#9c8a70" strokeWidth="1.4" />

        <g key={poke} className={poke ? "sc-rustle" : "sc-sway"} style={{ ...pivot(`50% 0%`), animationDuration: poke ? undefined : "9s" }}>
          {/* A little ceramic pot in a macramé cradle */}
          <path d="M-17 -20 L17 -20 L13 4 Q 0 9 -13 4 Z" fill="#f1ebe1" />
          <path d="M-17 -20 L17 -20 L16 -15 L-16 -15 Z" fill="#e2d8ca" />
          <path d="M-14 -8 Q 0 -3 14 -8 M-13 0 Q 0 5 13 0" stroke="#cbb89a" strokeWidth="1.3" fill="none" />
          <path d="M-17 -20 L17 -20 L13 4 Q 0 9 -13 4 Z" fill="url(#sc-cat-light)" opacity="0.4" />

          {/* The vines spill over the rim and trail down */}
          {vines.map((vine, index) => (
            <g key={index}>
              <path d={vine.d} stroke="#5f8a4f" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              {vine.leaves.map((leaf, leafIndex) => (
                <PothosLeaf key={leafIndex} {...leaf} />
              ))}
            </g>
          ))}

          {/* Leaves spilling over the rim */}
          <PothosLeaf x={-9} y={-20} angle={150} size={0.95} dark={false} />
          <PothosLeaf x={6} y={-21} angle={-160} size={1} dark />
          <PothosLeaf x={-1} y={-22} angle={178} size={1.05} dark={false} />
          <PothosLeaf x={13} y={-19} angle={-120} size={0.85} dark={false} />
          <PothosLeaf x={-15} y={-18} angle={115} size={0.8} dark />
        </g>
      </At>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* A polaroid of Mochi on the corkboard                                */
/* ------------------------------------------------------------------ */

export function Polaroid() {
  const { shows } = useRoomUnlocks();
  const coat = useCoatStyle();
  const name = useRoomStore((state) => state.catName.trim() || "Mochi");
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  if (!shows("polaroid")) {
    return null;
  }

  const [x, y] = project([4.38, 0.18, B - 0.03]);

  return (
    <g
      className="sc-hit"
      onClick={(event) => {
        event.stopPropagation();
        playSfx("rustle");
        bump();
        speak(x, y - 30, `${name}, fast asleep on your notes. 📷`);
      }}
    >
      <g transform={`translate(${x} ${y}) rotate(7)`} style={coat}>
        <g key={poke} className={poke ? "sc-flutter" : undefined} style={pivot("50% 0%")}>
          <rect x="-15" y="-16" width="31" height="37" fill="#000000" opacity="0.18" transform="translate(2 2)" />
          <rect x="-15" y="-16" width="31" height="37" fill="#fdfcf8" />
          {/* The photo: a sleepy cat on a blue blanket */}
          <rect x="-12" y="-13" width="25" height="24" fill="#c9d9e6" />
          <ellipse cx="0.5" cy="8" rx="11" ry="5" fill="var(--sc-cat)" />
          <ellipse cx="4" cy="6" rx="5" ry="3" fill="var(--sc-cat-patch)" />
          <path d="M-7 -1 L-6 -7 L-3 -3 Z M5 -1 L4 -7 L1 -3 Z" fill="var(--sc-cat-patch-2)" />
          <circle cx="-1" cy="1" r="6.5" fill="var(--sc-cat)" />
          <path d="M-4 1 q1.2 1 2.4 0 M0.6 1 q1.2 1 2.4 0" stroke="#3b2e3a" strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <circle cx="-1" cy="3.4" r="0.7" fill="#ee8ea3" />
        </g>
        <circle cx="0.5" cy="-14" r="2" fill="#5a8fc4" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* A star lamp on the headboard, and its stars at night                */
/* ------------------------------------------------------------------ */

const LAMP_AT: Vec3 = [4.55, -0.55, 9.83];

const STARS = (() => {
  const random = mulberry32(77);
  const stars: Array<{ x: number; y: number; r: number; delay: number; big: boolean }> = [];

  while (stars.length < 46) {
    const x = 140 + random() * 1320;
    const y = 82 + random() * 250;
    // Not on the glass: it's light on walls, not on the night outside.
    const onGlass = x > 466 && x < 1134 && y > 126;

    if (!onGlass) {
      stars.push({ x, y, r: 1.2 + random() * 2.2, delay: -random() * 6, big: random() < 0.22 });
    }
  }

  return stars;
})();

/** The lamp's stars on the walls: only after dark, only while it's on. */
export function StarField() {
  const { shows } = useRoomUnlocks();
  const on = useRoomStore((state) => state.starLamp);
  const [lx, ly] = project(LAMP_AT);

  if (!shows("stars")) {
    return null;
  }

  return (
    <g className="sc-starfield" data-on={on} aria-hidden="true" style={{ pointerEvents: "none" }}>
      <g className="sc-star-drift" style={{ transformOrigin: `${lx}px ${ly}px` }}>
        {STARS.map((star, index) =>
          star.big ? (
            <path
              key={index}
              d={`M${star.x} ${star.y - star.r * 2.4} L${star.x + star.r * 0.6} ${star.y - star.r * 0.6} L${star.x + star.r * 2.4} ${star.y} L${star.x + star.r * 0.6} ${star.y + star.r * 0.6} L${star.x} ${star.y + star.r * 2.4} L${star.x - star.r * 0.6} ${star.y + star.r * 0.6} L${star.x - star.r * 2.4} ${star.y} L${star.x - star.r * 0.6} ${star.y - star.r * 0.6} Z`}
              fill="#fff3c9"
              className="sc-twinkle"
              style={{ animationDelay: `${star.delay}s` }}
            />
          ) : (
            <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff3c9" className="sc-twinkle" style={{ animationDelay: `${star.delay}s` }} />
          )
        )}
      </g>
    </g>
  );
}

export function StarLamp() {
  const { shows } = useRoomUnlocks();
  const on = useRoomStore((state) => state.starLamp);
  const toggle = useRoomStore((state) => state.toggleStarLamp);

  if (!shows("stars")) {
    return null;
  }

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("click");
        toggle();
      }}
    >
      <title>{on ? "Turn off the star lamp" : "Turn on the star lamp"}</title>
      <At at={LAMP_AT}>
        <ellipse cx="0" cy="1" rx="13" ry="3" fill="#000000" opacity="0.2" />
        <path d="M-11 0 L11 0 L9 -5 L-9 -5 Z" fill="#c9b18e" />
        {/* A frosted dome with little star holes */}
        <path d="M-10 -5 A 10 11 0 0 1 10 -5 Z" fill="#f4ecdf" />
        <path className="sc-starlamp-glow" data-on={on} d="M-10 -5 A 10 11 0 0 1 10 -5 Z" fill="#ffe7a6" />
        <g fill="#c99a4a" opacity="0.7">
          <circle cx="-4" cy="-10" r="1.1" />
          <circle cx="3" cy="-13" r="1" />
          <circle cx="5" cy="-8" r="0.9" />
          <circle cx="-1" cy="-7" r="0.8" />
        </g>
      </At>
    </g>
  );
}
