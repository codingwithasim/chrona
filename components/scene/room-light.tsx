"use client";

import { useSceneStore } from "@/stores/scene-store";

import { DESK_Y, mulberry32 } from "./scene-shared";

const rayStrength = "calc(var(--sc-ray-opacity) * var(--sc-ray-weather))";

/** Sunlight through the window, landing on the desk with the mullions' shadows. */
export function SunPatch() {
  const top = DESK_Y + 4;
  const bottom = 902;
  const mid = 840;

  // Each pane of the window, projected onto the desk.
  const panes = [
    [500, 790, 430, 786],
    [810, 1100, 814, 1180],
  ];

  return (
    <g
      style={{
        opacity: `calc(var(--sc-sunpatch-opacity) * var(--sc-ray-weather))`,
        transform: "skewX(var(--sc-ray-skew))",
        transformOrigin: `800px ${top}px`,
        mixBlendMode: "screen",
        transition: "opacity 1.5s ease",
      }}
    >
      {panes.map(([x1, x2, x3, x4]) => (
        <g key={x1}>
          <path
            d={`M${x1} ${top} L${x2} ${top} L${x2 - (x2 - x4) * 0.5} ${mid - 4} L${x1 - (x1 - x3) * 0.5} ${mid - 4} Z`}
            fill="url(#sc-sunpatch)"
          />
          <path
            d={`M${x1 - (x1 - x3) * 0.55} ${mid + 4} L${x2 - (x2 - x4) * 0.55} ${mid + 4} L${x4} ${bottom} L${x3} ${bottom} Z`}
            fill="url(#sc-sunpatch)"
          />
        </g>
      ))}
    </g>
  );
}

const BEAMS = [
  "M500 210 L556 210 L626 906 L470 906 Z",
  "M612 170 L700 170 L790 906 L610 906 Z",
  "M752 250 L790 250 L862 906 L786 906 Z",
  "M846 176 L962 176 L1068 906 L878 906 Z",
  "M1006 226 L1060 226 L1130 906 L1036 906 Z",
];

/** God rays: soft shafts of light falling into the room. */
export function SunBeams() {
  return (
    <g
      style={{
        opacity: rayStrength,
        transform: "skewX(var(--sc-ray-skew))",
        transformOrigin: "800px 150px",
        mixBlendMode: "screen",
        transition: "opacity 1.5s ease",
      }}
    >
      {BEAMS.map((d, index) => (
        <path key={index} d={d} fill="url(#sc-beam)" opacity={0.55 + (index % 3) * 0.15} />
      ))}
    </g>
  );
}

const moteRandom = mulberry32(5);

const MOTES = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  x: 520 + moteRandom() * 560,
  y: 420 + moteRandom() * 440,
  r: 0.8 + moteRandom() * 1.6,
  delay: -moteRandom() * 14,
  duration: 10 + moteRandom() * 8,
}));

/** Dust floating in the sunbeams. */
export function DustMotes() {
  return (
    <g
      style={{
        opacity: `calc(var(--sc-mote-opacity) * var(--sc-ray-weather))`,
        transform: "skewX(var(--sc-ray-skew))",
        transformOrigin: "800px 150px",
      }}
    >
      {MOTES.map((mote) => (
        <circle
          key={mote.id}
          cx={mote.x}
          cy={mote.y}
          r={mote.r}
          fill="#fffaf0"
          className="sc-mote"
          style={{
            animationDelay: `${mote.delay}s`,
            animationDuration: `${mote.duration}s`,
          }}
        />
      ))}
    </g>
  );
}

/** A soft glow around the bright window. */
export function WindowBloom() {
  return (
    <rect
      width="1600"
      height="1000"
      fill="url(#sc-bloom)"
      style={{ opacity: "var(--sc-bloom)", mixBlendMode: "screen", transition: "opacity 1.5s ease" }}
    />
  );
}

export function LampLight() {
  const lampOn = useSceneStore((state) => state.lampOn);

  return (
    <g
      style={{
        opacity: lampOn ? "var(--sc-lamp-glow-opacity)" : 0,
        transition: "opacity 600ms ease",
        mixBlendMode: "screen",
      }}
    >
      <rect width="1600" height="1000" fill="url(#sc-lamp-glow)" />
      <path d="M382 680 L456 641 L700 878 L320 892 Z" fill="url(#sc-lamp-cone)" />
    </g>
  );
}

/** Color grading and darkness, applied last. */
export function Atmosphere() {
  const lampOn = useSceneStore((state) => state.lampOn);

  return (
    <g>
      <rect
        width="1600"
        height="1000"
        fill="var(--sc-grade)"
        style={{ opacity: "var(--sc-grade-opacity)", mixBlendMode: "soft-light" }}
      />
      <rect
        width="1600"
        height="1000"
        fill="#05031a"
        style={{ opacity: lampOn ? 0 : "var(--sc-dark-room)", transition: "opacity 600ms ease" }}
      />
    </g>
  );
}
