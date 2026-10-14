"use client";

import { useState } from "react";

import { playSfx } from "@/lib/sfx";

import {
  box,
  GLASS_RECT,
  poly,
  project,
  ROOM,
  type Vec3,
  WINDOW,
} from "./projection";
import { C } from "./room-palette";
import { mulberry32, pivot, usePoke } from "./scene-shared";

const { left: L, right: R, floor: F, ceiling: T, back: B, near: N } = ROOM;

/* ------------------------------------------------------------------ */
/* Walls, floor and ceiling                                            */
/* ------------------------------------------------------------------ */

const PLANK_WIDTH = 0.42;

const PLANKS = (() => {
  const random = mulberry32(17);
  const planks: Array<{ d: string; fill: string; seams: string[]; grain: string[] }> = [];
  const tones = [C.floorA, C.floorB, C.floorC];

  for (let x = L; x < R - 0.001; x += PLANK_WIDTH) {
    const x1 = Math.min(R, x + PLANK_WIDTH);
    const seams: string[] = [];

    // Board ends, staggered from plank to plank.
    for (let z = B - 0.4 - random() * 1.6; z > N; z -= 1.6 + random() * 1.4) {
      seams.push(poly([x, F, z], [x1, F, z], [x1, F, z - 0.015], [x, F, z - 0.015]));
    }

    // Fine grain running along each board, gently wavering.
    const grain: string[] = [];
    for (let g = 0; g < 3; g++) {
      const base = x + (x1 - x) * (0.2 + g * 0.3 + random() * 0.1);
      const phase = random() * 6;
      const points: string[] = [];

      for (let z = B; z >= N; z -= 0.35) {
        const [px, py] = project([base + Math.sin(z * 1.7 + phase) * 0.025, F, z]);
        points.push(`${px.toFixed(1)} ${py.toFixed(1)}`);
      }

      grain.push(`M${points.join(" L")}`);
    }

    planks.push({
      d: poly([x, F, B], [x1, F, B], [x1, F, N], [x, F, N]),
      fill: tones[Math.floor(random() * tones.length)],
      seams,
      grain,
    });
  }

  return planks;
})();

export function RoomShell() {
  const [gx0, gy0] = [GLASS_RECT.x, GLASS_RECT.y];
  const [gx1, gy1] = [GLASS_RECT.x + GLASS_RECT.w, GLASS_RECT.y + GLASS_RECT.h];

  // The back wall, with the window opening cut out.
  const [wx0, wy0] = project([WINDOW.left, WINDOW.top, B]);
  const [wx1, wy1] = project([WINDOW.right, WINDOW.bottom, B]);
  const [bx0, by0] = project([L, T, B]);
  const [bx1, by1] = project([R, F, B]);

  const backWall = `M${bx0} ${by0} H${bx1} V${by1} H${bx0} Z M${wx0} ${wy0} V${wy1} H${wx1} V${wy0} Z`;

  return (
    <g>
      {/* Ceiling */}
      <path d={poly([L, T, B], [R, T, B], [R, T, N], [L, T, N])} fill={C.ceiling} />
      <path d={poly([L, T, B], [R, T, B], [R, T, N], [L, T, N])} fill="url(#rm-ceiling-shade)" />

      {/* Side walls */}
      <path d={poly([L, T, B], [L, F, B], [L, F, N], [L, T, N])} fill={C.wallLeft} />
      <path d={poly([L, T, B], [L, F, B], [L, F, N], [L, T, N])} fill="url(#rm-left-shade)" />
      <path d={poly([R, T, B], [R, F, B], [R, F, N], [R, T, N])} fill={C.wallRight} />
      <path d={poly([R, T, B], [R, F, B], [R, F, N], [R, T, N])} fill="url(#rm-right-shade)" />

      {/* Back wall */}
      <path d={backWall} fillRule="evenodd" fill={C.wallBack} />
      <path d={backWall} fillRule="evenodd" fill="url(#rm-back-light)" />

      {/* Floor */}
      {PLANKS.map((plank, index) => (
        <g key={index}>
          <path d={plank.d} fill={plank.fill} />
          {plank.seams.map((seam, seamIndex) => (
            <path key={seamIndex} d={seam} fill={C.seam} opacity="0.5" />
          ))}
          <g fill="none" stroke={C.seam} strokeWidth="0.7" opacity="0.14">
            {plank.grain.map((line, lineIndex) => (
              <path key={lineIndex} d={line} />
            ))}
          </g>
        </g>
      ))}
      <g stroke={C.seam} strokeWidth="1" opacity="0.4">
        {PLANKS.map((_, index) => {
          const x = L + index * PLANK_WIDTH;
          const [ax, ay] = project([x, F, B]);
          const [bx, by] = project([x, F, N]);

          return <line key={index} x1={ax} y1={ay} x2={bx} y2={by} />;
        })}
      </g>
      <path d={poly([L, F, B], [R, F, B], [R, F, N], [L, F, N])} fill="url(#rm-floor-shade)" />

      {/* Baseboards */}
      <path d={poly([L, F, B], [R, F, B], [R, F + 0.16, B], [L, F + 0.16, B])} fill={C.trim} />
      <path d={poly([L, F, B], [L, F + 0.16, B], [L, F + 0.16, N], [L, F, N])} fill={C.trim} />
      <path d={poly([R, F, B], [R, F + 0.16, B], [R, F + 0.16, N], [R, F, N])} fill="#dfe4e8" />

      {/* Soft shadows where surfaces meet */}
      <path d={poly([L, F, B], [R, F, B], [R, F, B - 0.5], [L, F, B - 0.5])} fill="url(#rm-contact-back)" />
      <g stroke="#1e2633" strokeWidth="1.5" opacity="0.18">
        <line x1={bx0} y1={by0} x2={bx0} y2={by1} />
        <line x1={bx1} y1={by0} x2={bx1} y2={by1} />
        <line x1={bx0} y1={by0} x2={bx1} y2={by0} />
      </g>

      {/* Ambient shadow in the corners, where light reaches less */}
      <SoftCorners />

      {/* Keep the window hole free of the room's tint */}
      <rect x={gx0} y={gy0} width={gx1 - gx0} height={gy1 - gy0} fill="none" />
    </g>
  );
}

/** Soft, painterly shadow where walls meet each other and the ceiling. */
function SoftCorners() {
  const [lx, ty] = project([L, T, B]);
  const [rx, by] = project([R, F, B]);
  const [lxNear] = project([L, T, B - 1.2]);
  const [rxNear] = project([R, T, B - 1.2]);
  const shade = "#1e2633";

  return (
    <g style={{ pointerEvents: "none" }}>
      <defs>
        <linearGradient id="rm-corner-left" gradientUnits="userSpaceOnUse" x1={lx} y1="0" x2={lx + 90} y2="0">
          <stop offset="0" stopColor={shade} stopOpacity="0.16" />
          <stop offset="1" stopColor={shade} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rm-corner-right" gradientUnits="userSpaceOnUse" x1={rx} y1="0" x2={rx - 90} y2="0">
          <stop offset="0" stopColor={shade} stopOpacity="0.16" />
          <stop offset="1" stopColor={shade} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rm-corner-ceiling" gradientUnits="userSpaceOnUse" x1="0" y1={ty} x2="0" y2={ty + 70}>
          <stop offset="0" stopColor={shade} stopOpacity="0.14" />
          <stop offset="1" stopColor={shade} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rm-side-left" gradientUnits="userSpaceOnUse" x1={lx} y1="0" x2={lxNear} y2="0">
          <stop offset="0" stopColor={shade} stopOpacity="0.14" />
          <stop offset="1" stopColor={shade} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rm-side-right" gradientUnits="userSpaceOnUse" x1={rx} y1="0" x2={rxNear} y2="0">
          <stop offset="0" stopColor={shade} stopOpacity="0.14" />
          <stop offset="1" stopColor={shade} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Back wall, along both corners and under the ceiling */}
      <rect x={lx} y={ty} width="90" height={by - ty} fill="url(#rm-corner-left)" />
      <rect x={rx - 90} y={ty} width="90" height={by - ty} fill="url(#rm-corner-right)" />
      <rect x={lx} y={ty} width={rx - lx} height="70" fill="url(#rm-corner-ceiling)" />

      {/* Side walls, darkest at the back corner */}
      <path d={poly([L, T, B], [L, F, B], [L, F, B - 1.2], [L, T, B - 1.2])} fill="url(#rm-side-left)" />
      <path d={poly([R, T, B], [R, F, B], [R, F, B - 1.2], [R, T, B - 1.2])} fill="url(#rm-side-right)" />
      <path d={poly([L, T, B], [R, T, B], [R, T, B - 1.2], [L, T, B - 1.2])} fill={shade} opacity="0.06" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Window                                                              */
/* ------------------------------------------------------------------ */

export function WindowUnit({ onKnock }: { onKnock: () => void }) {
  const { left, right, bottom, top, depth, glass, mullion, transom } = WINDOW;

  const frameOuter = poly([left, top, depth], [right, top, depth], [right, bottom, depth], [left, bottom, depth]);
  const [gx, gy] = [GLASS_RECT.x, GLASS_RECT.y];

  const frameWithHole = `${frameOuter} M${gx} ${gy} V${gy + GLASS_RECT.h} H${gx + GLASS_RECT.w} V${gy} Z`;

  const sill = box(left - 0.22, right + 0.22, bottom - 0.08, bottom, B - 0.24, depth);

  return (
    <g>
      {/* Glass: clicking it does something different in every weather */}
      <rect
        x={gx}
        y={gy}
        width={GLASS_RECT.w}
        height={GLASS_RECT.h}
        fill="transparent"
        style={{ pointerEvents: "auto", cursor: "pointer" }}
        onClick={onKnock}
      />
      <rect x={gx} y={gy} width={GLASS_RECT.w} height={GLASS_RECT.h} fill="url(#rm-glass-fog)" />
      <g fill="#ffffff" style={{ opacity: "var(--sc-glass-opacity)" }}>
        <path d={`M${gx + 60} ${gy} h60 L${gx} ${gy + 120} v-60 Z`} />
        <path d={`M${gx + 150} ${gy} h22 L${gx} ${gy + 190} v-22 Z`} />
      </g>
      <rect
        x={gx}
        y={gy}
        width={GLASS_RECT.w}
        height={GLASS_RECT.h}
        fill="url(#rm-frost)"
        style={{ opacity: "var(--sc-frost-opacity)", transition: "opacity 2s ease" }}
      />

      {/* Wall thickness around the opening */}
      <path d={poly([left, top, B], [left, top, depth], [left, bottom, depth], [left, bottom, B])} fill="#aeb9c1" />
      <path d={poly([right, top, B], [right, top, depth], [right, bottom, depth], [right, bottom, B])} fill="#aeb9c1" />
      <path d={poly([left, top, B], [right, top, B], [right, top, depth], [left, top, depth])} fill="#9eaab3" />

      {/* Painted wooden frame, mullion and transom */}
      <path d={frameWithHole} fillRule="evenodd" fill={C.frame} />
      <path d={poly([-mullion, glass.top, depth], [mullion, glass.top, depth], [mullion, glass.bottom, depth], [-mullion, glass.bottom, depth])} fill={C.frame} />
      <path d={poly([glass.left, transom.top, depth], [glass.right, transom.top, depth], [glass.right, transom.bottom, depth], [glass.left, transom.bottom, depth])} fill={C.frame} />
      <g stroke={C.frameShade} strokeWidth="1.5">
        <rect x={gx} y={gy} width={GLASS_RECT.w} height={GLASS_RECT.h} fill="none" />
        <line {...lineProps([mullion, glass.top, depth], [mullion, glass.bottom, depth])} />
        <line {...lineProps([glass.left, transom.bottom, depth], [glass.right, transom.bottom, depth])} />
      </g>

      {/* Latch */}
      <path d={poly([0.12, 0.45, depth - 0.02], [0.2, 0.45, depth - 0.02], [0.2, 0.2, depth - 0.02], [0.12, 0.2, depth - 0.02])} fill="#c9a45a" />

      {/* Sill */}
      <path d={sill.top} fill="#f6f7f8" />
      <path d={sill.front} fill="#d9dfe3" />
      <path d={poly([left - 0.22, bottom - 0.08, B - 0.24], [right + 0.22, bottom - 0.08, B - 0.24], [right + 0.22, bottom - 0.3, B], [left - 0.22, bottom - 0.3, B])} fill="url(#rm-sill-shadow)" />
    </g>
  );
}

function lineProps(a: Vec3, b: Vec3) {
  const [x1, y1] = project(a);
  const [x2, y2] = project(b);
  return { x1, y1, x2, y2 };
}

/* ------------------------------------------------------------------ */
/* Sheer curtains                                                      */
/* ------------------------------------------------------------------ */

function curtainPath(x0: number, x1: number, sway: number) {
  const z = B - 0.12;
  const [ax, ay] = project([x0, 2.76, z]);
  const [bx] = project([x1, 2.76, z]);
  const [, by] = project([x1, -1.18, z]);
  const width = bx - ax;

  // Gathered at the top, gently wavy at the hem.
  let hem = "";
  const folds = 6;

  for (let i = folds; i >= 0; i--) {
    const x = ax + (width * i) / folds;
    hem += ` Q ${x + width / folds / 2} ${by + (i % 2 ? 8 : -2)} ${x} ${by}`;
  }

  return `M${ax} ${ay} L${bx} ${ay} C ${bx + sway} ${ay + 120} ${bx - sway} ${by - 140} ${bx} ${by}${hem} C ${ax - sway} ${by - 140} ${ax + sway} ${ay + 120} ${ax} ${ay} Z`;
}

function Curtain({ x0, x1, flip }: { x0: number; x1: number; flip?: boolean }) {
  const [poke, bump] = usePoke();
  const d = curtainPath(x0, x1, flip ? -6 : 6);

  const [ax, ay] = project([x0, 2.76, B - 0.12]);
  const [bx] = project([x1, 2.76, B - 0.12]);

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <g key={poke} className={poke ? "sc-billow" : undefined} style={pivot("50% 0%")}>
        <g className="sc-curtain" style={pivot("50% 0%")}>
          <path d={d} fill="url(#rm-sheer)" />
          <path d={d} fill="url(#rm-sheer-glow)" style={{ opacity: "calc(var(--rm-light) * var(--sc-ray-weather))" }} />
          <g stroke="#ffffff" strokeWidth="2" opacity="0.35" fill="none">
            {[0.18, 0.42, 0.66, 0.88].map((t) => (
              <path
                key={t}
                d={`M${ax + (bx - ax) * t} ${ay + 4} Q ${ax + (bx - ax) * (t + 0.03)} ${ay + 200} ${ax + (bx - ax) * t} 570`}
              />
            ))}
          </g>
        </g>
      </g>
    </g>
  );
}

const ROD_Y = 2.78;
const ROD_Z = B - 0.15;

const BULBS = (() => {
  const bulbs: Array<{ x: number; y: number; delay: number }> = [];
  const [ax, ay] = project([-3.7, ROD_Y, ROD_Z]);
  const [bx] = project([3.7, ROD_Y, ROD_Z]);
  const segments = 4;
  const span = (bx - ax) / segments;

  for (let s = 0; s < segments; s++) {
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const x = ax + span * (s + t);
      const y = ay + 6 + Math.sin(Math.PI * t) * 26;

      bulbs.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, delay: ((s * 6 + i) * 0.41) % 3 });
    }
  }

  return bulbs;
})();

type FairyMode = "twinkle" | "steady" | "off";

const NEXT_FAIRY: Record<FairyMode, FairyMode> = {
  twinkle: "steady",
  steady: "off",
  off: "twinkle",
};

export function CurtainsAndLights() {
  const [mode, setMode] = useState<FairyMode>("twinkle");

  const [ax, ay] = project([-3.75, ROD_Y, ROD_Z]);
  const [bx] = project([3.75, ROD_Y, ROD_Z]);
  const span = (bx - ax - 10) / 4;

  const wire = Array.from({ length: 4 }, (_, s) => {
    const x0 = ax + 5 + span * s;
    return `M${x0} ${ay + 6} Q ${x0 + span / 2} ${ay + 6 + 52} ${x0 + span} ${ay + 6}`;
  }).join(" ");

  return (
    <g>
      <Curtain x0={-3.75} x1={-2.3} />
      <Curtain x0={2.3} x1={3.75} flip />

      {/* Rod */}
      <rect x={ax - 6} y={ay - 2} width={bx - ax + 12} height="5" rx="2.5" fill="#b9c2c9" />
      <rect x={ax - 6} y={ay - 2} width={bx - ax + 12} height="1.6" rx="0.8" fill="#ffffff" opacity="0.6" />
      <circle cx={ax - 8} cy={ay + 0.5} r="5" fill="#b9c2c9" />
      <circle cx={bx + 8} cy={ay + 0.5} r="5" fill="#b9c2c9" />

      {/* Fairy lights */}
      <g
        className="sc-hit"
        onClick={() => {
          playSfx("click");
          setMode(NEXT_FAIRY[mode]);
        }}
      >
        <path d={wire} fill="none" stroke="transparent" strokeWidth="18" />
        <path d={wire} fill="none" stroke="#6b6560" strokeWidth="0.9" opacity="0.7" />

        {BULBS.map((bulb, index) => (
          <g key={index}>
            {mode !== "off" && (
              <g
                className={mode === "twinkle" ? "sc-twinkle" : undefined}
                style={{ animationDelay: `${bulb.delay}s`, opacity: "var(--sc-fairy-opacity)" }}
              >
                <circle cx={bulb.x} cy={bulb.y + 3} r="9" fill="#ffd98a" opacity="0.25" />
                <circle cx={bulb.x} cy={bulb.y + 3} r="2.6" fill="#fff1c4" />
              </g>
            )}
            {mode === "off" && <circle cx={bulb.x} cy={bulb.y + 3} r="2.4" fill="#d8d2c8" opacity="0.7" />}
          </g>
        ))}
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Pendant lamp                                                        */
/* ------------------------------------------------------------------ */

export function PendantLamp() {
  const z = 8.2;
  const [cx, topY] = project([0, T, z]);
  const [, cordEnd] = project([0, 2.42, z]);
  const [, bottomY] = project([0, 2.12, z]);
  const radius = (0.36 * 1120) / z;

  return (
    <g>
      <line x1={cx} y1={topY} x2={cx} y2={cordEnd} stroke="#4a4744" strokeWidth="1.4" />
      <path
        d={`M${cx - radius} ${bottomY} Q ${cx - radius} ${cordEnd} ${cx} ${cordEnd} Q ${cx + radius} ${cordEnd} ${cx + radius} ${bottomY} Z`}
        fill="#e9e3d6"
      />
      <path
        d={`M${cx - radius} ${bottomY} Q ${cx - radius} ${cordEnd} ${cx} ${cordEnd} L ${cx - radius * 0.2} ${bottomY} Z`}
        fill="#ffffff"
        opacity="0.45"
      />
      <ellipse cx={cx} cy={bottomY} rx={radius} ry={radius * 0.22} fill="#cfc6b6" />
    </g>
  );
}
