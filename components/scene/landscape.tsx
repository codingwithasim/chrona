"use client";

import type { RefObject } from "react";

import type { ResolvedScene } from "@/stores/scene-store";

import {
  type Cloud,
  CLOUDS,
  HILLS,
  HOUSES,
  STARS,
  TORII,
} from "./landscape-data";
import {
  GLASS,
  GLASS_BOTTOM,
  GLASS_RIGHT,
  mulberry32,
  svgProps,
} from "./scene-shared";
import { GLASS_RECT } from "./projection";
import { SkyEvents } from "./sky-events";

/** The painted landscape is taller than the window; show its lower part. */
const VIEW_SHIFT = -68;

const RAIL_Y = 552;

function glassRect(props: Record<string, unknown> = {}) {
  return (
    <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} {...props} />
  );
}

/* ------------------------------------------------------------------ */

function CloudShape({ cloud }: { cloud: Cloud }) {
  const clip = `sc-cloud-clip-${cloud.id}`;

  return (
    <g className="sc-drift" style={{ animationDuration: `${cloud.drift}s` }}>
      <g transform={`translate(${cloud.cx} ${cloud.cy}) scale(${cloud.scale})`}>
        <clipPath id={clip}>
          {cloud.puffs.map(([x, y, r], index) => (
            <circle key={index} cx={x} cy={y} r={r} />
          ))}
        </clipPath>

        {/* A flat base, like real cumulus */}
        <g clipPath="url(#sc-cloud-base)">
          <g clipPath={`url(#${clip})`}>
            <rect x="-240" y="-140" width="480" height="220" fill="var(--sc-cloud-light)" />
            <rect x="-240" y="-140" width="480" height="220" fill="url(#sc-cloud-shading)" />
            {cloud.puffs.map(([x, y, r], index) => (
              <circle
                key={index}
                cx={x - r * 0.28}
                cy={y - r * 0.34}
                r={r * 0.85}
                fill="url(#sc-puff-light)"
              />
            ))}
          </g>
        </g>
      </g>
    </g>
  );
}

function SunRays({ cx, cy, length }: { cx: number; cy: number; length: number }) {
  return (
    <g style={{ opacity: "calc(var(--sc-skyray-opacity) * var(--sc-ray-weather))", mixBlendMode: "screen" }}>
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2 + 0.2;
        const spread = 0.06;

        const x1 = cx + Math.cos(angle - spread) * length;
        const y1 = cy + Math.sin(angle - spread) * length;
        const x2 = cx + Math.cos(angle + spread) * length;
        const y2 = cy + Math.sin(angle + spread) * length;

        return (
          <path
            key={index}
            d={`M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z`}
            fill="url(#sc-skyray)"
            className="sc-twinkle"
            style={{ animationDuration: `${6 + (index % 4)}s`, animationDelay: `${index * 0.7}s` }}
          />
        );
      })}
    </g>
  );
}

function Tree({ x, y, r, tone }: { x: number; y: number; r: number; tone: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={`var(--sc-tree-${tone})`} />
      <path
        d={`M${x - r} ${y} A ${r} ${r} 0 0 0 ${x + r} ${y} A ${r * 1.1} ${r * 0.7} 0 0 1 ${x - r} ${y} Z`}
        fill="#1a1030"
        opacity="0.12"
      />
    </g>
  );
}

function House({ house }: { house: (typeof HOUSES)[number] }) {
  const top = house.base - house.h;

  return (
    <g>
      <rect x={house.x} y={top} width={house.w} height={house.h} fill="var(--sc-house-wall)" />
      <rect
        x={house.x + house.w * 0.66}
        y={top}
        width={house.w * 0.34}
        height={house.h}
        fill="var(--sc-house-shade)"
        opacity="0.8"
      />
      <path
        d={`M${house.x - 3} ${top + 1} L${house.x + house.w / 2} ${top - 9} L${house.x + house.w + 3} ${top + 1} Z`}
        fill={house.roof}
      />
      <path
        d={`M${house.x + house.w / 2} ${top - 9} L${house.x + house.w + 3} ${top + 1} L${house.x + house.w / 2 + 2} ${top + 1} Z`}
        fill="#000000"
        opacity="0.15"
      />
      {house.windows.map((win, index) => (
        <rect
          key={index}
          x={house.x + win.x}
          y={top + win.y}
          width="3.5"
          height="4.5"
          fill="#6d7f9a"
          opacity="0.7"
        />
      ))}
    </g>
  );
}

function Torii() {
  const { x, y } = TORII;

  return (
    <g fill="#d6493c">
      <rect x={x - 8} y={y - 15} width="2.4" height="15" />
      <rect x={x + 5.6} y={y - 15} width="2.4" height="15" />
      <rect x={x - 9} y={y - 12} width="18" height="1.8" />
      <path d={`M${x - 12} ${y - 16.5} Q ${x} ${y - 18.5} ${x + 12} ${y - 16.5} L${x + 11} ${y - 14.5} L${x - 11} ${y - 14.5} Z`} />
    </g>
  );
}

const crownRandom = mulberry32(73);

const CROWN = Array.from({ length: 24 }, () => ({
  x: Math.round(1030 + crownRandom() * 130),
  y: Math.round(130 + crownRandom() * 190),
  r: Math.round(18 + crownRandom() * 22),
}));

const CROWN_SPECKS = Array.from({ length: 70 }, () => ({
  x: Math.round(1010 + crownRandom() * 160),
  y: Math.round(110 + crownRandom() * 230),
  r: Math.round((1.5 + crownRandom() * 2.5) * 10) / 10,
  tone: crownRandom() > 0.5 ? 3 : 2,
}));

/** The big tree in the foreground, dressed for the season. */
function ForegroundTree() {
  return (
    <g>
      <clipPath id="sc-crown-clip">
        {CROWN.map((puff, index) => (
          <circle key={index} cx={puff.x} cy={puff.y} r={puff.r} />
        ))}
      </clipPath>

      <g stroke="var(--sc-branch)" fill="none" strokeLinecap="round">
        <path d="M1150 640 C 1140 520 1132 420 1120 340 C 1112 290 1104 250 1090 210" strokeWidth="16" />
        <path d="M1122 350 C 1090 320 1060 300 1022 284" strokeWidth="7" />
        <path d="M1108 260 C 1080 230 1050 210 1030 196" strokeWidth="6" />
        <path d="M1096 220 C 1100 190 1112 170 1130 150" strokeWidth="5" />
        <path d="M1062 300 C 1050 312 1040 316 1028 316" strokeWidth="3" />
      </g>
      <path d="M1146 640 C 1136 520 1128 420 1116 340" stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.12" />

      {/* Snow resting on the branches in winter */}
      <g stroke="#ffffff" fill="none" strokeLinecap="round" style={{ opacity: "var(--sc-snowcap-opacity)" }}>
        <path d="M1118 344 C 1088 316 1058 296 1022 280" strokeWidth="4" />
        <path d="M1104 256 C 1078 228 1050 208 1030 192" strokeWidth="3.5" />
        <path d="M1094 216 C 1098 188 1110 168 1128 146" strokeWidth="3" />
      </g>

      <g style={{ opacity: "var(--sc-crown-opacity)" }}>
        <g clipPath="url(#sc-crown-clip)">
          <rect x="980" y="90" width="220" height="260" fill="var(--sc-crown-1)" />
          {CROWN_SPECKS.map((speck, index) => (
            <circle key={index} cx={speck.x} cy={speck.y} r={speck.r} fill={`var(--sc-crown-${speck.tone})`} />
          ))}
          {CROWN.map((puff, index) => (
            <path
              key={index}
              d={`M${puff.x - puff.r} ${puff.y} A ${puff.r} ${puff.r} 0 0 0 ${puff.x + puff.r} ${puff.y} A ${puff.r * 1.1} ${puff.r * 0.75} 0 0 1 ${puff.x - puff.r} ${puff.y} Z`}
              fill="#1a1030"
              opacity="0.1"
            />
          ))}
          <rect x="980" y="90" width="220" height="260" fill="url(#sc-crown-shading)" />
        </g>
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */

export function Landscape({
  glassRef,
  scene,
}: {
  glassRef: RefObject<SVGRectElement | null>;
  scene: ResolvedScene | null;
}) {
  return (
    <svg {...svgProps} aria-hidden="true">
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sc-sky-1)" />
          <stop offset="0.45" stopColor="var(--sc-sky-2)" />
          <stop offset="0.75" stopColor="var(--sc-sky-3)" />
          <stop offset="1" stopColor="var(--sc-sky-4)" />
        </linearGradient>

        <radialGradient id="sc-moon-halo">
          <stop offset="0" stopColor="#fff4d6" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="sc-sun-halo">
          <stop offset="0" stopColor="#fffbe6" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fffbe6" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="sc-sun-halo-warm">
          <stop offset="0" stopColor="#ffc58a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff9a8a" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="sc-skyray" cx="0" cy="0" r="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#fff6e0" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff6e0" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="sc-cloud-shading" x1="0" y1="-40" x2="0" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--sc-cloud-shade)" stopOpacity="0" />
          <stop offset="0.55" stopColor="var(--sc-cloud-shade)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--sc-cloud-shade)" stopOpacity="1" />
        </linearGradient>

        <radialGradient id="sc-puff-light">
          <stop offset="0" stopColor="var(--sc-cloud-rim)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--sc-cloud-rim)" stopOpacity="0" />
        </radialGradient>

        <clipPath id="sc-cloud-base">
          <rect x="-260" y="-260" width="520" height="306" />
        </clipPath>

        <linearGradient id="sc-crown-shading" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#1a1030" stopOpacity="0.35" />
        </linearGradient>

        <linearGradient id="sc-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sc-mist-color)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--sc-mist-color)" stopOpacity="1" />
          <stop offset="1" stopColor="var(--sc-mist-color)" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="sc-star-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>

        <linearGradient id="sc-headlight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff2b8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff2b8" stopOpacity="0" />
        </linearGradient>

        <clipPath id="sc-glass-clip">{glassRect()}</clipPath>
        <clipPath id="sc-window-clip">
          <rect x={GLASS_RECT.x} y={GLASS_RECT.y} width={GLASS_RECT.w} height={GLASS_RECT.h} />
        </clipPath>
      </defs>

      <rect width="1600" height="1000" fill="var(--sc-wall-2)" />

      <g clipPath="url(#sc-window-clip)">
      <g transform={`translate(0 ${VIEW_SHIFT})`}>
      <g clipPath="url(#sc-glass-clip)">
        {glassRect({ fill: "url(#sc-sky)" })}

        {/* Night: stars and moon */}
        <g style={{ opacity: "var(--sc-moon-opacity)" }}>
          {STARS.map((star) => (
            <circle
              key={star.id}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill="#fff6e0"
              className="sc-twinkle"
              style={{ animationDelay: `${star.delay}s` }}
            />
          ))}

          <circle cx="1040" cy="272" r="120" fill="url(#sc-moon-halo)" />
          <circle cx="1040" cy="272" r="26" fill="#fff4d8" />
          <circle cx="1031" cy="266" r="5" fill="#efdfb8" />
          <circle cx="1049" cy="280" r="4" fill="#efdfb8" />
          <circle cx="1045" cy="259" r="2.2" fill="#efdfb8" />
        </g>

        {/* Suns, with crepuscular rays at dawn and dusk */}
        <g style={{ opacity: "var(--sc-sun-morning)" }}>
          <SunRays cx={590} cy={362} length={420} />
          <circle cx="590" cy="362" r="150" fill="url(#sc-sun-halo-warm)" />
          <circle cx="590" cy="362" r="28" fill="#ffe4c0" />
        </g>
        <g style={{ opacity: "var(--sc-sun-day)" }}>
          <SunRays cx={1012} cy={282} length={380} />
          <circle cx="1012" cy="282" r="150" fill="url(#sc-sun-halo)" />
          <circle cx="1012" cy="282" r="26" fill="#fffbe8" />
        </g>
        <g style={{ opacity: "var(--sc-sun-evening)" }}>
          <SunRays cx={790} cy={366} length={460} />
          <circle cx="790" cy="366" r="220" fill="url(#sc-sun-halo-warm)" />
          <circle cx="790" cy="366" r="44" fill="#ffb873" />
          <circle cx="790" cy="366" r="36" fill="#ffca91" />
        </g>

        {/* Clouds */}
        <g style={{ opacity: "var(--sc-cloud-opacity)" }}>
          {CLOUDS.map((cloud) => (
            <CloudShape key={cloud.id} cloud={cloud} />
          ))}
        </g>

        {/* Overcast sky when it rains or snows */}
        {glassRect({
          fill: "var(--sc-overcast)",
          style: { opacity: "var(--sc-overcast-opacity)", transition: "opacity 1.2s ease" },
        })}

        {/* Far mountains, fading into the air */}
        <path
          d="M440 480 L440 430 C 500 420 520 400 560 392 C 590 386 612 368 640 362 L 656 356 C 690 360 702 375 730 384 C 760 392 782 380 810 372 C 840 364 862 340 896 330 L 912 325 C 944 336 960 352 990 360 C 1020 368 1050 380 1080 384 C 1104 386 1124 394 1160 402 L 1160 480 Z"
          fill="var(--sc-mtn-far)"
        />
        <path
          d="M440 430 C 500 420 520 400 560 392 C 590 386 612 368 640 362 L 656 356 C 690 360 702 375 730 384 C 760 392 782 380 810 372 C 840 364 862 340 896 330 L 912 325 C 944 336 960 352 990 360 C 1020 368 1050 380 1080 384 C 1104 386 1124 394 1160 402"
          fill="none"
          stroke="var(--sc-ridge)"
          strokeWidth="1.6"
        />
        <g fill="var(--sc-snow)" style={{ opacity: "var(--sc-mtn-snow)" }}>
          <path d="M632 367 L656 355 L682 363 L674 369 L664 365 L654 372 L643 367 Z" />
          <path d="M876 339 L910 325 L936 333 L950 343 L934 345 L921 339 L906 347 L893 341 Z" />
        </g>
        <path
          d="M440 490 C 490 470 520 452 560 448 C 600 444 622 430 660 432 C 700 434 722 452 760 452 C 800 452 822 430 860 426 C 900 422 930 440 970 446 C 1010 452 1040 440 1080 436 C 1110 434 1130 440 1160 446 L1160 500 L440 500 Z"
          fill="var(--sc-mtn-mid)"
        />
        <path
          d="M440 490 C 490 470 520 452 560 448 C 600 444 622 430 660 432 C 700 434 722 452 760 452 C 800 452 822 430 860 426 C 900 422 930 440 970 446 C 1010 452 1040 440 1080 436 C 1110 434 1130 440 1160 446"
          fill="none"
          stroke="var(--sc-ridge)"
          strokeWidth="1.2"
          opacity="0.6"
        />

        {/* Valley mist */}
        <rect
          x={GLASS.x}
          y="420"
          width={GLASS.w}
          height="100"
          fill="url(#sc-mist)"
          style={{ opacity: "min(0.9, calc(var(--sc-mist) + var(--sc-mist-add)))" }}
        />

        {/* Hills, forests and the village */}
        <path d={HILLS[0].path} fill="var(--sc-hill)" />
        {HILLS[0].trees.map((tree, index) => (
          <Tree key={`b${index}`} {...tree} />
        ))}
        <rect x={GLASS.x} y="440" width={GLASS.w} height="110" fill="var(--sc-mist-color)" opacity="0.18" />

        {HOUSES.slice(0, 2).map((house) => (
          <House key={house.x} house={house} />
        ))}

        <path d={HILLS[1].path} fill="var(--sc-hill)" />
        {HILLS[1].trees.map((tree, index) => (
          <Tree key={`l${index}`} {...tree} />
        ))}

        <path d={HILLS[2].path} fill="var(--sc-hill)" />
        {HILLS[2].trees.map((tree, index) => (
          <Tree key={`r${index}`} {...tree} />
        ))}
        <Torii />

        {HOUSES.slice(2).map((house) => (
          <House key={house.x} house={house} />
        ))}

        {/* Railway on its embankment */}
        <rect x={GLASS.x} y={RAIL_Y - 3} width={GLASS.w} height="10" fill="var(--sc-levee)" />
        <line x1={GLASS.x} y1={RAIL_Y + 1} x2={GLASS_RIGHT} y2={RAIL_Y + 1} stroke="#6b5a4a" strokeWidth="3" strokeDasharray="2 5" opacity="0.45" />
        <line x1={GLASS.x} y1={RAIL_Y - 0.5} x2={GLASS_RIGHT} y2={RAIL_Y - 0.5} stroke="#55556a" strokeWidth="0.9" opacity="0.7" />
        <line x1={GLASS.x} y1={RAIL_Y + 2.5} x2={GLASS_RIGHT} y2={RAIL_Y + 2.5} stroke="#55556a" strokeWidth="0.9" opacity="0.7" />

        {/* Little poles along the line */}
        <g stroke="var(--sc-silhouette)" fill="none" opacity="0.7">
          {[520, 640, 760, 880, 1000, 1120].map((x) => (
            <g key={x}>
              <line x1={x} y1={RAIL_Y - 3} x2={x} y2={RAIL_Y - 34} strokeWidth="1.6" />
              <line x1={x - 5} y1={RAIL_Y - 31} x2={x + 5} y2={RAIL_Y - 31} strokeWidth="1.2" />
            </g>
          ))}
          <path
            d={`M520 ${RAIL_Y - 31} Q 580 ${RAIL_Y - 24} 640 ${RAIL_Y - 31} Q 700 ${RAIL_Y - 24} 760 ${RAIL_Y - 31} Q 820 ${RAIL_Y - 24} 880 ${RAIL_Y - 31} Q 940 ${RAIL_Y - 24} 1000 ${RAIL_Y - 31} Q 1060 ${RAIL_Y - 24} 1120 ${RAIL_Y - 31}`}
            strokeWidth="0.6"
          />
        </g>

        {/* Rice fields */}
        <path d="M440 557 C 640 552 900 560 1160 554 L1160 576 C 900 582 640 572 440 578 Z" fill="var(--sc-field-1)" />
        <path d="M440 576 C 640 570 900 580 1160 574 L1160 600 C 900 606 640 594 440 600 Z" fill="var(--sc-field-2)" />
        <path d="M440 598 C 640 592 900 604 1160 598 L1160 624 C 900 630 640 618 440 624 Z" fill="var(--sc-field-1)" />
        <path d="M440 622 C 640 616 900 628 1160 622 L1160 640 L440 640 Z" fill="var(--sc-field-2)" />
        <g fill="none" stroke="var(--sc-levee)" strokeWidth="2.5" strokeLinecap="round">
          <path d="M440 577 C 640 571 900 581 1160 575" />
          <path d="M440 599 C 640 593 900 605 1160 599" />
          <path d="M440 623 C 640 617 900 629 1160 623" />
        </g>
        <g fill="none" stroke="#000000" strokeWidth="1.4" strokeDasharray="1.5 7" opacity="0.08">
          <path d="M440 566 C 640 561 900 569 1160 563" />
          <path d="M440 588 C 640 582 900 592 1160 586" />
          <path d="M440 611 C 640 605 900 616 1160 610" />
        </g>

        {/* Rainy haze over the land */}
        {glassRect({
          fill: "var(--sc-overcast)",
          style: { opacity: "calc(var(--sc-overcast-opacity) * 0.35)" },
        })}

        {/* Utility pole and wires */}
        <g stroke="var(--sc-silhouette)" fill="none" strokeLinecap="round">
          <line x1="560" y1="250" x2="560" y2={GLASS_BOTTOM} strokeWidth="10" />
          <line x1="522" y1="282" x2="598" y2="282" strokeWidth="6" />
          <line x1="532" y1="308" x2="588" y2="308" strokeWidth="5" />
          <path d="M522 284 Q 820 352 1140 302" strokeWidth="1.8" />
          <path d="M598 284 Q 860 332 1140 270" strokeWidth="1.8" />
          <path d="M532 310 Q 820 390 1140 352" strokeWidth="1.4" />
          <path d="M522 284 Q 494 300 460 296" strokeWidth="1.8" />
          <path d="M532 310 Q 500 332 460 330" strokeWidth="1.4" />
        </g>
        <g fill="var(--sc-silhouette)">
          <rect x="517" y="274" width="7" height="9" rx="2" />
          <rect x="596" y="274" width="7" height="9" rx="2" />
          <rect x="528" y="300" width="6" height="8" rx="2" />
          <rect x="586" y="300" width="6" height="8" rx="2" />
        </g>

        <ForegroundTree />

        {/* Time-of-day tint over everything outside */}
        {glassRect({ fill: "var(--sc-outside-tint)" })}

        {/* Lights stay bright after dark */}
        <g style={{ opacity: "var(--sc-window-glow)" }}>
          {HOUSES.flatMap((house) =>
            house.windows
              .filter((win) => win.lit)
              .map((win, index) => (
                <g key={`${house.x}-${index}`}>
                  <rect
                    x={house.x + win.x - 2}
                    y={house.base - house.h + win.y - 2}
                    width="7.5"
                    height="8.5"
                    rx="3"
                    fill="#ffd98a"
                    opacity="0.35"
                  />
                  <rect
                    x={house.x + win.x}
                    y={house.base - house.h + win.y}
                    width="3.5"
                    height="4.5"
                    fill="#ffe3a0"
                  />
                </g>
              ))
          )}
        </g>

        {scene && <SkyEvents scene={scene} railY={RAIL_Y} />}
      </g>
      </g>
      </g>

      <rect
        ref={glassRef}
        x={GLASS_RECT.x}
        y={GLASS_RECT.y}
        width={GLASS_RECT.w}
        height={GLASS_RECT.h}
        fill="none"
      />
    </svg>
  );
}
