"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { useMounted, useNow } from "@/hooks/use-now";
import { say, useDialogueStore } from "@/stores/dialogue-store";
import { useSceneStore } from "@/stores/scene-store";

import {
  FAR_CITY,
  GLASS,
  MID_CITY,
  NEAR_ROOFS,
  STARS,
  WINDOW_TONES,
} from "./city";
import { RainCanvas } from "./rain-canvas";

/*
 * The room is drawn in a fixed 1600×1000 coordinate space and
 * scaled to cover the viewport. It is split into a back layer
 * (the sky and city behind the glass) and a front layer (the room),
 * with the rain canvas sandwiched between them.
 */

const VIEWBOX = "0 0 1600 1000";
const WIN = { x: 450, y: 110, w: 700, h: 540 };
const DESK_Y = 770;

const svgProps = {
  viewBox: VIEWBOX,
  preserveAspectRatio: "xMidYMid slice",
  "aria-hidden": true,
  className: "absolute inset-0 size-full",
} as const;

const LINE = "var(--sc-line)";

/* ------------------------------------------------------------------ */
/* Back layer: sky + city                                              */
/* ------------------------------------------------------------------ */

function SkyLayer({
  glassRef,
}: {
  glassRef: React.RefObject<SVGRectElement | null>;
}) {
  const glassBottom = GLASS.y + GLASS.h;

  return (
    <svg {...svgProps}>
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sc-sky-1)" />
          <stop offset="0.45" stopColor="var(--sc-sky-2)" />
          <stop offset="0.78" stopColor="var(--sc-sky-3)" />
          <stop offset="1" stopColor="var(--sc-sky-4)" />
        </linearGradient>

        <radialGradient id="sc-moon-halo">
          <stop offset="0" stopColor="#fff4d6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="sc-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sc-sky-4)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--sc-sky-4)" stopOpacity="0.6" />
        </linearGradient>

        <filter id="sc-soft" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="12" />
        </filter>

        <filter id="sc-neon-glow" x="-80%" y="-30%" width="260%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <clipPath id="sc-glass-clip">
          <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} />
        </clipPath>
      </defs>

      <rect width="1600" height="1000" fill="var(--sc-wall-2)" />

      <g clipPath="url(#sc-glass-clip)">
        <rect
          x={GLASS.x}
          y={GLASS.y}
          width={GLASS.w}
          height={GLASS.h}
          fill="url(#sc-sky)"
        />

        {/* Stars and moon (night only) */}
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

          <circle cx="1012" cy="214" r="130" fill="url(#sc-moon-halo)" />
          <circle cx="1012" cy="214" r="36" fill="#fff3d2" />
          <circle cx="1000" cy="206" r="7" fill="#f2e1b8" />
          <circle cx="1024" cy="224" r="5" fill="#f2e1b8" />
          <circle cx="1018" cy="200" r="3" fill="#f2e1b8" />
        </g>

        {/* Clouds */}
        <g
          className="sc-drift"
          filter="url(#sc-soft)"
          style={{ opacity: "var(--sc-cloud-opacity)" }}
        >
          <ellipse cx="600" cy="190" rx="170" ry="34" fill="var(--sc-cloud)" />
          <ellipse cx="760" cy="160" rx="120" ry="26" fill="var(--sc-cloud)" />
          <ellipse cx="1060" cy="250" rx="190" ry="30" fill="var(--sc-cloud)" />
          <ellipse cx="880" cy="300" rx="150" ry="22" fill="var(--sc-cloud)" />
          <ellipse cx="540" cy="320" rx="110" ry="20" fill="var(--sc-cloud)" />
        </g>

        {/* Far skyline */}
        <g>
          {FAR_CITY.map((building, index) => (
            <rect
              key={index}
              x={building.x}
              y={building.y}
              width={building.w}
              height={building.h}
              fill="var(--sc-city-far)"
            />
          ))}

          <g style={{ opacity: "var(--sc-light-opacity)" }}>
            {FAR_CITY.flatMap((building, index) =>
              building.windows.map((win, windowIndex) => (
                <rect
                  key={`${index}-${windowIndex}`}
                  x={win.x}
                  y={win.y}
                  width={win.w}
                  height={win.h}
                  fill={WINDOW_TONES[0]}
                  opacity="0.55"
                />
              ))
            )}
          </g>
        </g>

        <rect
          x={GLASS.x}
          y={GLASS.y + 220}
          width={GLASS.w}
          height={GLASS.h - 220}
          fill="url(#sc-haze)"
        />

        {/* Mid skyline */}
        <g>
          {MID_CITY.map((building, index) => (
            <g key={index}>
              <rect
                x={building.x}
                y={building.y}
                width={building.w}
                height={building.h}
                fill="var(--sc-city-mid)"
              />
              <rect
                x={building.x}
                y={building.y}
                width={building.w}
                height="5"
                fill="var(--sc-city-far)"
                opacity="0.7"
              />
              {building.antenna && (
                <>
                  <line
                    x1={building.x + building.w * 0.7}
                    y1={building.y}
                    x2={building.x + building.w * 0.7}
                    y2={building.y - 34}
                    stroke="var(--sc-city-mid)"
                    strokeWidth="3"
                  />
                  <g style={{ opacity: "var(--sc-light-opacity)" }}>
                    <circle
                      cx={building.x + building.w * 0.7}
                      cy={building.y - 36}
                      r="3"
                      fill="#ff5d7a"
                      className="sc-blink-light"
                      style={{ animationDelay: `${index * 0.7}s` }}
                    />
                  </g>
                </>
              )}
            </g>
          ))}

          <g style={{ opacity: "var(--sc-light-opacity)" }}>
            {MID_CITY.flatMap((building, index) =>
              building.windows.map((win, windowIndex) => (
                <rect
                  key={`${index}-${windowIndex}`}
                  x={win.x}
                  y={win.y}
                  width={win.w}
                  height={win.h}
                  rx="1"
                  fill={WINDOW_TONES[win.tone]}
                  opacity="0.85"
                />
              ))
            )}
          </g>
        </g>

        {/* Neon café sign: 喫茶 */}
        <g style={{ opacity: "var(--sc-neon-opacity)" }}>
          <g className="sc-neon" filter="url(#sc-neon-glow)">
            <rect
              x="938"
              y="430"
              width="34"
              height="88"
              rx="6"
              fill="#2b1636"
              stroke="#ff7ab8"
              strokeWidth="2.5"
            />
            <text
              x="955"
              y="466"
              textAnchor="middle"
              fontSize="24"
              fontWeight="700"
              fill="#ffd1ea"
              style={{ fontFamily: "var(--font-zen)" }}
            >
              喫
            </text>
            <text
              x="955"
              y="502"
              textAnchor="middle"
              fontSize="24"
              fontWeight="700"
              fill="#ffd1ea"
              style={{ fontFamily: "var(--font-zen)" }}
            >
              茶
            </text>
          </g>
        </g>

        {/* Foreground rooftops */}
        <g fill="var(--sc-city-near)">
          {NEAR_ROOFS.map((roof) => (
            <rect
              key={roof.x}
              x={roof.x}
              y={roof.y}
              width={roof.w}
              height={roof.h}
            />
          ))}

          {/* Water tank */}
          <rect x="1040" y={glassBottom - 132} width="44" height="34" rx="4" />
          <rect x="1046" y={glassBottom - 100} width="4" height="10" />
          <rect x="1074" y={glassBottom - 100} width="4" height="10" />
          <ellipse cx="1062" cy={glassBottom - 132} rx="22" ry="5" />
        </g>

        {/* Utility pole and wires */}
        <g stroke="var(--sc-city-near)" fill="none" strokeLinecap="round">
          <line x1="575" y1="250" x2="575" y2={glassBottom} strokeWidth="11" />
          <line x1="535" y1="282" x2="615" y2="282" strokeWidth="7" />
          <line x1="545" y1="310" x2="605" y2="310" strokeWidth="6" />
          <path d="M535 284 Q 820 350 1140 300" strokeWidth="2" />
          <path d="M615 284 Q 860 330 1140 268" strokeWidth="2" />
          <path d="M545 312 Q 820 390 1140 352" strokeWidth="1.6" />
          <path d="M535 284 Q 500 300 460 296" strokeWidth="2" />
          <path d="M545 312 Q 505 334 460 330" strokeWidth="1.6" />
        </g>
        <g fill="var(--sc-city-near)">
          <rect x="530" y="274" width="8" height="10" rx="2" />
          <rect x="612" y="274" width="8" height="10" rx="2" />
          <rect x="541" y="302" width="7" height="9" rx="2" />
          <rect x="602" y="302" width="7" height="9" rx="2" />
        </g>
      </g>

      <rect
        ref={glassRef}
        x={GLASS.x}
        y={GLASS.y}
        width={GLASS.w}
        height={GLASS.h}
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Front layer: the room                                               */
/* ------------------------------------------------------------------ */

function quadPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number
) {
  const u = 1 - t;

  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ] as const;
}

const FAIRY_COLORS = [
  "var(--honey)",
  "var(--sakura)",
  "var(--mint)",
  "var(--sky)",
];

const FAIRY_BULBS = (
  [
    [[380, 98], [590, 192], [800, 104]],
    [[800, 104], [1010, 192], [1220, 98]],
  ] as const
).flatMap((segment, segmentIndex) =>
  [0.1, 0.24, 0.38, 0.52, 0.66, 0.8, 0.94].map((t, index) => {
    const [x, y] = quadPoint(
      segment[0] as [number, number],
      segment[1] as [number, number],
      segment[2] as [number, number],
      t
    );

    const i = segmentIndex * 7 + index;

    return {
      id: i,
      x,
      y,
      color: FAIRY_COLORS[i % FAIRY_COLORS.length],
      delay: (i * 0.37) % 2.8,
    };
  })
);

const SHELF_BOOKS = [
  { x: 128, w: 20, h: 74, color: "#e7849d" },
  { x: 150, w: 26, h: 86, color: "#8fb6e8" },
  { x: 178, w: 18, h: 66, color: "#f2c66d" },
  { x: 198, w: 24, h: 80, color: "#9dd3a8" },
  { x: 224, w: 20, h: 70, color: "#b69cf0" },
];

function Curtain() {
  return (
    <g className="sc-curtain" style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
      <path
        d="M372 96 L540 96 C 524 210 476 372 452 466 C 466 560 484 642 482 702 Q 458 712 432 702 Q 406 712 380 704 C 384 612 392 526 398 466 C 384 356 374 210 372 96 Z"
        fill="url(#sc-curtain)"
        stroke={LINE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <g stroke="var(--sc-curtain-3)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8">
        <path d="M408 100 C 410 230 418 360 414 460" />
        <path d="M446 100 C 448 220 440 360 428 460" />
        <path d="M494 100 C 486 220 462 360 440 460" />
        <path d="M418 478 C 414 560 410 640 410 702" />
        <path d="M444 478 C 450 560 456 640 458 704" />
      </g>
      <rect x="390" y="456" width="70" height="18" rx="9" fill="var(--sakura)" stroke={LINE} strokeWidth="2.5" />
      <circle cx="425" cy="465" r="6" fill="var(--honey)" stroke={LINE} strokeWidth="2" />
    </g>
  );
}

function Lamp({
  on,
  interactive,
  onToggle,
}: {
  on: boolean;
  interactive: boolean;
  onToggle: () => void;
}) {
  return (
    <g
      onClick={interactive ? onToggle : undefined}
      style={{
        pointerEvents: interactive ? "auto" : "none",
        cursor: interactive ? "pointer" : undefined,
      }}
    >
      <ellipse cx="252" cy="874" rx="78" ry="12" fill="var(--sc-shadow)" />
      <ellipse cx="250" cy="866" rx="64" ry="15" fill="var(--sc-lamp-dark)" stroke={LINE} strokeWidth="2.5" />
      <ellipse cx="250" cy="860" rx="54" ry="11" fill="var(--sc-lamp)" stroke={LINE} strokeWidth="2" />

      <g strokeLinecap="round" fill="none">
        <path d="M250 856 L300 690 L398 622" stroke={LINE} strokeWidth="14" strokeLinejoin="round" />
        <path d="M250 856 L300 690 L398 622" stroke="var(--sc-lamp)" strokeWidth="9" strokeLinejoin="round" />
      </g>
      <circle cx="300" cy="690" r="10" fill="var(--sc-lamp-dark)" stroke={LINE} strokeWidth="2.5" />

      <g transform="translate(400 622) rotate(-28)">
        <path
          d="M-18 -12 L18 -12 L44 42 L-44 42 Z"
          fill="var(--sc-lamp)"
          stroke={LINE}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M-8 -12 L-30 42" stroke="var(--sc-lamp-dark)" strokeWidth="5" opacity="0.6" />
        <ellipse
          cx="0"
          cy="42"
          rx="44"
          ry="9"
          fill={on ? "#fff1c9" : "var(--sc-lamp-dark)"}
          stroke={LINE}
          strokeWidth="2.5"
        />
        <rect x="-10" y="-22" width="20" height="12" rx="4" fill="var(--sc-lamp-dark)" stroke={LINE} strokeWidth="2" />
      </g>
    </g>
  );
}

function Cat({
  awake,
  interactive,
}: {
  awake: boolean;
  interactive: boolean;
}) {
  return (
    <g
      onClick={
        interactive
          ? () =>
              say({
                text: "Nya~ …you found me. Go back to watching the rain.",
              })
          : undefined
      }
      style={{
        pointerEvents: interactive ? "auto" : "none",
        cursor: interactive ? "pointer" : undefined,
      }}
    >
      <defs>
        <clipPath id="sc-cat-body">
          <ellipse cx="968" cy="830" rx="112" ry="48" />
        </clipPath>
      </defs>

      <ellipse cx="958" cy="878" rx="132" ry="11" fill="var(--sc-shadow)" />

      {/* Tail */}
      <g className="sc-tail" style={{ transformBox: "fill-box", transformOrigin: "100% 0%" }}>
        <path
          d="M1068 846 C 1080 880 1010 884 940 880 C 905 878 880 874 872 866"
          fill="none"
          stroke={LINE}
          strokeWidth="23"
          strokeLinecap="round"
        />
        <path
          d="M1068 846 C 1080 880 1010 884 940 880 C 905 878 880 874 872 866"
          fill="none"
          stroke="var(--sc-cat)"
          strokeWidth="17"
          strokeLinecap="round"
        />
        <path
          d="M890 872 C 882 870 876 868 872 866"
          fill="none"
          stroke="var(--sc-cat-patch-2)"
          strokeWidth="15"
          strokeLinecap="round"
        />
      </g>

      {/* Body */}
      <g className="sc-breathe" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <ellipse cx="968" cy="830" rx="112" ry="48" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" />
        <g clipPath="url(#sc-cat-body)">
          <ellipse cx="1012" cy="796" rx="56" ry="32" fill="var(--sc-cat-patch)" />
          <ellipse cx="935" cy="806" rx="26" ry="16" fill="var(--sc-cat-patch-2)" />
          <ellipse cx="968" cy="868" rx="120" ry="16" fill="var(--sc-cat-shade)" opacity="0.7" />
        </g>
        <path d="M1040 838 Q 1052 852 1046 866" fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Ears */}
      <path d="M834 812 L842 770 L866 798 Z" fill="var(--sc-cat-patch)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M842 802 L846 782 L857 796 Z" fill="#f5a3b5" />
      <path d="M874 796 L902 768 L906 810 Z" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M884 796 L899 781 L900 801 Z" fill="#f5a3b5" />

      {/* Head */}
      <ellipse cx="868" cy="832" rx="47" ry="41" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" />
      <path d="M826 818 Q 840 796 862 800 Q 846 812 840 830 Z" fill="var(--sc-cat-patch)" />

      {/* Face */}
      {awake ? (
        <g>
          <ellipse cx="852" cy="832" rx="5.5" ry="7.5" fill={LINE} />
          <ellipse cx="884" cy="832" rx="5.5" ry="7.5" fill={LINE} />
          <circle cx="850" cy="829" r="2" fill="#fff" />
          <circle cx="882" cy="829" r="2" fill="#fff" />
        </g>
      ) : (
        <g fill="none" stroke={LINE} strokeWidth="2.5" strokeLinecap="round">
          <path d="M844 833 Q 852 839 860 833" />
          <path d="M876 833 Q 884 839 892 833" />
        </g>
      )}
      <ellipse cx="840" cy="846" rx="7" ry="4" fill="#f5a3b5" opacity="0.7" />
      <ellipse cx="896" cy="846" rx="7" ry="4" fill="#f5a3b5" opacity="0.7" />
      <path d="M865 842 L871 842 L868 846 Z" fill="#f08aa3" />
      <path
        d="M862 848 Q 865 852 868 848 Q 871 852 874 848"
        fill="none"
        stroke={LINE}
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Paws */}
      <ellipse cx="846" cy="870" rx="17" ry="9" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" />
      <ellipse cx="884" cy="872" rx="17" ry="9" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" />

      {/* Zzz */}
      {!awake && (
        <g
          fill="var(--lavender)"
          stroke={LINE}
          strokeWidth="1"
          fontWeight="700"
          style={{ fontFamily: "var(--font-mochiy)" }}
        >
          <text x="910" y="790" fontSize="16" className="sc-zzz">z</text>
          <text x="914" y="786" fontSize="22" className="sc-zzz" style={{ animationDelay: "1.1s" }}>z</text>
          <text x="918" y="782" fontSize="28" className="sc-zzz" style={{ animationDelay: "2.2s" }}>Z</text>
        </g>
      )}
    </g>
  );
}

function WallClock() {
  const now = useNow();

  const hours = now ? now.getHours() % 12 : 10;
  const minutes = now ? now.getMinutes() : 10;
  const seconds = now ? now.getSeconds() : 0;

  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const cx = 1360;
  const cy = 236;

  return (
    <g>
      {/* Cat ears on the clock */}
      <path d="M1312 196 L1306 152 L1342 176 Z" fill="var(--sc-mug)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M1408 196 L1414 152 L1378 176 Z" fill="var(--sc-mug)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />

      <circle cx={cx + 4} cy={cy + 5} r="66" fill="var(--sc-shadow)" />
      <circle cx={cx} cy={cy} r="66" fill="var(--sc-mug)" stroke={LINE} strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r="54" fill="var(--sc-paper)" stroke={LINE} strokeWidth="2" />

      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index * 30 * Math.PI) / 180;
        const major = index % 3 === 0;
        const r1 = major ? 40 : 44;

        return (
          <line
            key={index}
            x1={cx + Math.sin(angle) * r1}
            y1={cy - Math.cos(angle) * r1}
            x2={cx + Math.sin(angle) * 49}
            y2={cy - Math.cos(angle) * 49}
            stroke={LINE}
            strokeWidth={major ? 3 : 1.6}
            strokeLinecap="round"
          />
        );
      })}

      <g strokeLinecap="round">
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 27}
          stroke={LINE}
          strokeWidth="5"
          transform={`rotate(${hourAngle} ${cx} ${cy})`}
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 40}
          stroke={LINE}
          strokeWidth="3.5"
          transform={`rotate(${minuteAngle} ${cx} ${cy})`}
        />
        <line
          x1={cx}
          y1={cy + 8}
          x2={cx}
          y2={cy - 44}
          stroke="var(--sakura)"
          strokeWidth="1.8"
          transform={`rotate(${secondAngle} ${cx} ${cy})`}
        />
      </g>
      <circle cx={cx} cy={cy} r="4.5" fill="var(--sakura)" stroke={LINE} strokeWidth="1.5" />
    </g>
  );
}

function RoomLayer({
  lampOn,
  awake,
  interactive,
  onToggleLamp,
}: {
  lampOn: boolean;
  awake: boolean;
  interactive: boolean;
  onToggleLamp: () => void;
}) {
  const glassRight = GLASS.x + GLASS.w;
  const glassBottom = GLASS.y + GLASS.h;

  return (
    <svg {...svgProps} style={{ pointerEvents: "none" }}>
      <defs>
        <linearGradient id="sc-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sc-wall-1)" />
          <stop offset="1" stopColor="var(--sc-wall-2)" />
        </linearGradient>

        <pattern id="sc-stripes" width="36" height="36" patternUnits="userSpaceOnUse">
          <rect width="18" height="36" fill="var(--sc-stripe)" />
        </pattern>

        <radialGradient id="sc-window-light" cx="800" cy="380" r="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--sc-wall-light)" />
          <stop offset="1" stopColor="var(--sc-wall-light)" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="sc-curtain" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--sc-curtain-2)" />
          <stop offset="0.2" stopColor="var(--sc-curtain-1)" />
          <stop offset="0.42" stopColor="var(--sc-curtain-2)" />
          <stop offset="0.62" stopColor="var(--sc-curtain-1)" />
          <stop offset="0.85" stopColor="var(--sc-curtain-3)" />
          <stop offset="1" stopColor="var(--sc-curtain-2)" />
        </linearGradient>

        <linearGradient id="sc-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sc-desk-1)" />
          <stop offset="1" stopColor="var(--sc-desk-2)" />
        </linearGradient>

        <linearGradient id="sc-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.16" />
        </linearGradient>

        <linearGradient id="sc-contact" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sc-shadow)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--sc-shadow)" />
        </linearGradient>

        <radialGradient id="sc-lamp-glow" cx="450" cy="760" r="420" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffc983" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#ffb36b" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="sc-lamp-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe2a8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe2a8" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="sc-spill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sc-sky-3)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--sc-sky-3)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Wall, with a hole where the glass is */}
      <path
        d={`M0 0H1600V${DESK_Y}H0Z M${GLASS.x} ${GLASS.y}V${glassBottom}H${glassRight}V${GLASS.y}Z`}
        fillRule="evenodd"
        fill="url(#sc-wall)"
      />
      <path
        d={`M0 0H1600V${DESK_Y}H0Z M${GLASS.x} ${GLASS.y}V${glassBottom}H${glassRight}V${GLASS.y}Z`}
        fillRule="evenodd"
        fill="url(#sc-stripes)"
      />
      <path
        d={`M0 0H1600V${DESK_Y}H0Z M${GLASS.x} ${GLASS.y}V${glassBottom}H${glassRight}V${GLASS.y}Z`}
        fillRule="evenodd"
        fill="url(#sc-window-light)"
      />

      {/* Wainscoting */}
      <rect x="0" y="690" width="1600" height="80" fill="var(--sc-wall-low)" />
      <rect x="0" y="684" width="1600" height="8" fill="var(--sc-trim)" />
      <line x1="0" y1="692" x2="1600" y2="692" stroke={LINE} strokeWidth="1.5" opacity="0.4" />

      {/* Poster */}
      <g transform="rotate(-2 235 275)">
        <rect x="146" y="166" width="184" height="222" rx="4" fill="var(--sc-shadow)" transform="translate(5 6)" />
        <rect x="146" y="166" width="184" height="222" rx="4" fill="var(--sc-paper)" stroke={LINE} strokeWidth="2.5" />
        <rect x="158" y="178" width="160" height="176" fill="#ffc2d4" />
        <rect x="158" y="178" width="160" height="100" fill="#c9b8ff" />
        <circle cx="270" cy="232" r="22" fill="#fff4d6" />
        <path d="M158 300 L206 248 L240 284 L270 258 L318 302 V354 H158 Z" fill="#7d6bd6" />
        <path d="M158 326 L210 290 L256 324 L318 296 V354 H158 Z" fill="#5a4bb0" />
        <text x="238" y="376" textAnchor="middle" fontSize="13" fill={LINE} style={{ fontFamily: "var(--font-mochiy)" }}>
          あめのひ
        </text>
        <rect x="208" y="156" width="60" height="18" fill="var(--honey)" opacity="0.75" transform="rotate(4 238 165)" />
      </g>

      {/* Shelf */}
      <g>
        {SHELF_BOOKS.map((book) => (
          <g key={book.x}>
            <rect
              x={book.x}
              y={470 - book.h}
              width={book.w}
              height={book.h}
              rx="2"
              fill={book.color}
              stroke={LINE}
              strokeWidth="2"
            />
            <rect x={book.x + 3} y={470 - book.h + 10} width={book.w - 6} height="5" fill="#fff" opacity="0.55" />
          </g>
        ))}
        <rect
          x="250"
          y="398"
          width="20"
          height="74"
          rx="2"
          fill="#f39c7a"
          stroke={LINE}
          strokeWidth="2"
          transform="rotate(14 260 470)"
        />

        {/* Star jar */}
        <g>
          <rect x="300" y="420" width="38" height="50" rx="9" fill="#ffffff" opacity="0.25" stroke={LINE} strokeWidth="2" />
          <rect x="304" y="412" width="30" height="10" rx="3" fill="var(--sc-lamp)" stroke={LINE} strokeWidth="2" />
          <g style={{ opacity: "var(--sc-fairy-opacity)" }}>
            <circle cx="312" cy="452" r="3" fill="var(--honey)" className="sc-twinkle" />
            <circle cx="324" cy="440" r="2.5" fill="var(--sakura)" className="sc-twinkle" style={{ animationDelay: "0.8s" }} />
            <circle cx="328" cy="458" r="3" fill="var(--sky)" className="sc-twinkle" style={{ animationDelay: "1.6s" }} />
            <circle cx="316" cy="434" r="2" fill="var(--mint)" className="sc-twinkle" style={{ animationDelay: "2.1s" }} />
          </g>
        </g>

        {/* Little cactus */}
        <rect x="356" y="428" width="18" height="34" rx="9" fill="var(--sc-plant)" stroke={LINE} strokeWidth="2" />
        <path d="M352 454 H378 L374 472 H356 Z" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />

        <rect x="104" y="470" width="300" height="14" rx="3" fill="var(--sc-desk-1)" stroke={LINE} strokeWidth="2.5" />
        <path d="M140 484 L140 510 L166 484 Z" fill="var(--sc-desk-edge)" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
        <path d="M368 484 L368 510 L342 484 Z" fill="var(--sc-desk-edge)" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      </g>

      {/* Wall clock */}
      <WallClock />

      {/* Corkboard */}
      <g>
        <rect x="1270" y="372" width="200" height="150" rx="8" fill="var(--sc-shadow)" transform="translate(5 6)" />
        <rect x="1270" y="372" width="200" height="150" rx="8" fill="var(--sc-desk-edge)" stroke={LINE} strokeWidth="2.5" />
        <rect x="1280" y="382" width="180" height="130" rx="4" fill="var(--sc-cork)" />
        <g transform="rotate(-6 1312 418)">
          <rect x="1288" y="392" width="50" height="50" fill="#ffe08a" stroke={LINE} strokeWidth="1.5" />
          <path d="M1296 408 H1328 M1296 418 H1322 M1296 428 H1326" stroke={LINE} strokeWidth="1.4" opacity="0.5" />
        </g>
        <g transform="rotate(5 1372 420)">
          <rect x="1348" y="394" width="50" height="50" fill="#ffc6d8" stroke={LINE} strokeWidth="1.5" />
          <path d="M1362 410 q 6 -6 12 0 q 6 -6 12 0 q 0 10 -12 18 q -12 -8 -12 -18 z" fill="var(--sakura)" />
        </g>
        <g transform="rotate(-3 1432 446)">
          <rect x="1406" y="402" width="50" height="62" fill="#fffdf8" stroke={LINE} strokeWidth="1.5" />
          <rect x="1411" y="407" width="40" height="40" fill="#b7c6ef" />
          <circle cx="1440" cy="418" r="6" fill="#fff4d6" />
          <path d="M1411 447 L1426 430 L1438 440 L1451 428 V447 Z" fill="#7d6bd6" />
        </g>
        <g transform="rotate(4 1320 476)">
          <rect x="1294" y="452" width="56" height="46" fill="#b8ecd6" stroke={LINE} strokeWidth="1.5" />
          <path d="M1302 466 H1340 M1302 476 H1332 M1302 486 H1336" stroke={LINE} strokeWidth="1.4" opacity="0.5" />
        </g>
        <circle cx="1313" cy="396" r="4" fill="#ff5d7a" stroke={LINE} strokeWidth="1.2" />
        <circle cx="1373" cy="398" r="4" fill="var(--sky)" stroke={LINE} strokeWidth="1.2" />
        <circle cx="1431" cy="405" r="4" fill="var(--mint)" stroke={LINE} strokeWidth="1.2" />
        <circle cx="1322" cy="455" r="4" fill="var(--honey)" stroke={LINE} strokeWidth="1.2" />
      </g>

      {/* Glass sheen and condensation */}
      <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="url(#sc-fog)" />
      <g fill="#ffffff" style={{ opacity: "var(--sc-glass-opacity)" }}>
        <path d={`M${GLASS.x + 40} ${GLASS.y} h70 L${GLASS.x} ${GLASS.y + 150} v-70 Z`} />
        <path d={`M${GLASS.x + 140} ${GLASS.y} h24 L${GLASS.x} ${GLASS.y + 230} v-24 Z`} />
        <path d={`M${glassRight - 120} ${glassBottom} h80 L${glassRight} ${glassBottom - 140} v60 Z`} />
      </g>

      {/* Window frame */}
      <path
        d={`M${WIN.x} ${WIN.y}H${WIN.x + WIN.w}V${WIN.y + WIN.h}H${WIN.x}Z M${GLASS.x} ${GLASS.y}V${glassBottom}H${glassRight}V${GLASS.y}Z`}
        fillRule="evenodd"
        fill="var(--sc-frame)"
      />
      <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="none" stroke="var(--sc-frame-dark)" strokeWidth="5" />
      <line x1={WIN.x + 4} y1={WIN.y + 4} x2={WIN.x + WIN.w - 4} y2={WIN.y + 4} stroke="var(--sc-frame-light)" strokeWidth="3" />
      <rect x="793" y={GLASS.y} width="14" height={GLASS.h} fill="var(--sc-frame)" />
      <line x1="795" y1={GLASS.y} x2="795" y2={glassBottom} stroke="var(--sc-frame-light)" strokeWidth="2" />
      <rect x={GLASS.x} y="374" width={GLASS.w} height="13" fill="var(--sc-frame)" />
      <line x1={GLASS.x} y1="376" x2={glassRight} y2="376" stroke="var(--sc-frame-light)" strokeWidth="2" />
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="none" stroke={LINE} strokeWidth="3" />
      <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="none" stroke={LINE} strokeWidth="2" />
      <rect x="1086" y="372" width="8" height="18" rx="3" fill="var(--honey)" stroke={LINE} strokeWidth="1.5" />

      {/* Teru teru bōzu */}
      <g className="sc-sway" style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
        <line x1="652" y1={GLASS.y} x2="652" y2="190" stroke={LINE} strokeWidth="1.6" />
        <path
          d="M634 212 Q 628 246 616 264 Q 652 274 688 264 Q 676 246 670 212 Z"
          fill="#fbf7f2"
          stroke={LINE}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="652" cy="206" r="19" fill="#fbf7f2" stroke={LINE} strokeWidth="2.5" />
        <rect x="636" y="219" width="32" height="6" rx="3" fill="var(--sakura)" stroke={LINE} strokeWidth="1.5" />
        <circle cx="645" cy="204" r="2.3" fill={LINE} />
        <circle cx="659" cy="204" r="2.3" fill={LINE} />
        <path d="M647 211 Q 652 215 657 211" fill="none" stroke={LINE} strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="640" cy="211" rx="3.5" ry="2" fill="#f5a3b5" />
        <ellipse cx="664" cy="211" rx="3.5" ry="2" fill="#f5a3b5" />
      </g>

      {/* Sill */}
      <rect x="440" y="676" width="720" height="14" fill="var(--sc-shadow)" opacity="0.6" />
      <rect x="428" y="646" width="744" height="20" rx="4" fill="var(--sc-frame)" stroke={LINE} strokeWidth="2.5" />
      <rect x="436" y="664" width="728" height="12" fill="var(--sc-frame-dark)" stroke={LINE} strokeWidth="2" />

      {/* Sill plant */}
      <g>
        <path d="M1066 610 C 1046 590 1040 566 1046 548 C 1060 566 1066 586 1066 610" fill="var(--sc-plant)" stroke={LINE} strokeWidth="2" />
        <path d="M1068 610 C 1074 584 1092 566 1110 562 C 1102 584 1088 600 1068 610" fill="var(--sc-plant-dark)" stroke={LINE} strokeWidth="2" />
        <path d="M1066 612 C 1060 590 1066 566 1080 552 C 1084 576 1078 596 1066 612" fill="var(--sc-plant)" stroke={LINE} strokeWidth="2" />
        <path d="M1040 612 H1096 L1088 646 H1048 Z" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="1036" y="606" width="64" height="10" rx="3" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2.5" />
      </g>

      {/* Little candle jar on the sill */}
      <g>
        <rect x="508" y="618" width="34" height="28" rx="6" fill="#ffffff" opacity="0.3" stroke={LINE} strokeWidth="2" />
        <rect x="516" y="628" width="18" height="16" rx="3" fill="var(--honey)" />
        <g style={{ opacity: "var(--sc-fairy-opacity)" }}>
          <ellipse cx="525" cy="620" rx="4" ry="7" fill="#ffd27a" className="sc-twinkle" />
          <circle cx="525" cy="624" r="18" fill="#ffd27a" opacity="0.18" />
        </g>
      </g>

      {/* Curtain rod and curtains */}
      <rect x="356" y="88" width="888" height="9" rx="4.5" fill="var(--sc-frame-dark)" stroke={LINE} strokeWidth="2" />
      <circle cx="354" cy="92.5" r="11" fill="var(--sc-frame-dark)" stroke={LINE} strokeWidth="2" />
      <circle cx="1246" cy="92.5" r="11" fill="var(--sc-frame-dark)" stroke={LINE} strokeWidth="2" />

      <Curtain />
      <g transform="translate(1600 0) scale(-1 1)">
        <Curtain />
      </g>

      {/* Fairy lights */}
      <path
        d="M380 98 Q 590 192 800 104 Q 1010 192 1220 98"
        fill="none"
        stroke={LINE}
        strokeWidth="1.6"
        opacity="0.8"
      />
      <g style={{ opacity: "var(--sc-fairy-opacity)" }}>
        {FAIRY_BULBS.map((bulb) => (
          <g key={bulb.id} className="sc-twinkle" style={{ animationDelay: `${bulb.delay}s` }}>
            <circle cx={bulb.x} cy={bulb.y + 7} r="15" fill={bulb.color} opacity="0.3" />
            <circle cx={bulb.x} cy={bulb.y + 7} r="5.5" fill={bulb.color} />
          </g>
        ))}
      </g>
      {FAIRY_BULBS.map((bulb) => (
        <rect key={bulb.id} x={bulb.x - 2.5} y={bulb.y - 1} width="5" height="4" rx="1" fill={LINE} />
      ))}

      {/* Desk */}
      <rect x="0" y={DESK_Y - 22} width="1600" height="22" fill="url(#sc-contact)" />
      <rect x="0" y={DESK_Y} width="1600" height="136" fill="url(#sc-desk)" />
      <g stroke="var(--sc-desk-edge)" strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round">
        <path d="M40 800 C 300 794 520 806 760 798" />
        <path d="M900 812 C 1100 806 1300 818 1560 808" />
        <path d="M120 860 C 360 852 600 866 840 856" />
        <path d="M1000 876 C 1200 870 1400 880 1580 872" />
      </g>
      <line x1="0" y1={DESK_Y} x2="1600" y2={DESK_Y} stroke={LINE} strokeWidth="3" opacity="0.7" />
      <rect x="0" y="906" width="1600" height="26" fill="var(--sc-desk-edge)" />
      <line x1="0" y1="906" x2="1600" y2="906" stroke={LINE} strokeWidth="3" />
      <line x1="0" y1="909" x2="1600" y2="909" stroke="var(--sc-desk-2)" strokeWidth="2" opacity="0.7" />
      <rect x="0" y="932" width="1600" height="68" fill="var(--sc-desk-front)" />
      <line x1="0" y1="932" x2="1600" y2="932" stroke={LINE} strokeWidth="2.5" />
      <rect x="276" y="952" width="70" height="10" rx="5" fill="var(--sc-desk-edge)" stroke={LINE} strokeWidth="2" />
      <rect x="1254" y="952" width="70" height="10" rx="5" fill="var(--sc-desk-edge)" stroke={LINE} strokeWidth="2" />

      {/* Window light spilling onto the desk */}
      <path
        d={`M${GLASS.x + 10} ${DESK_Y} H${glassRight - 10} L${glassRight + 110} 906 H${GLASS.x - 110} Z`}
        fill="url(#sc-spill)"
        style={{ opacity: "var(--sc-spill-opacity)", mixBlendMode: "screen" }}
      />

      {/* Notebook and pencil */}
      <g>
        <path d="M440 822 L530 812 L536 884 L432 892 Z" fill="var(--sc-paper)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M530 812 L620 820 L630 890 L536 884 Z" fill="var(--sc-paper)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
        <g stroke="var(--lavender)" strokeWidth="1.4" opacity="0.6">
          <path d="M446 836 L528 828" />
          <path d="M446 850 L530 842" />
          <path d="M444 864 L530 857" />
          <path d="M540 830 L616 836" />
          <path d="M541 844 L618 850" />
          <path d="M542 858 L620 864" />
        </g>
        <path d="M466 834 q 8 -8 16 0 t 16 0" stroke="var(--sakura)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <g transform="rotate(-24 640 860)">
          <rect x="570" y="854" width="96" height="11" rx="2" fill="var(--honey)" stroke={LINE} strokeWidth="2" />
          <rect x="652" y="854" width="14" height="11" fill="#f5a3b5" stroke={LINE} strokeWidth="2" />
          <path d="M570 854 L556 859.5 L570 865 Z" fill="#f7dcc0" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
        </g>
      </g>

      {/* Mug with steam */}
      <g>
        <ellipse cx="736" cy="876" rx="46" ry="7" fill="var(--sc-shadow)" />
        <path d="M772 820 C 802 820 802 856 772 852" fill="none" stroke={LINE} strokeWidth="13" strokeLinecap="round" />
        <path d="M772 820 C 802 820 802 856 772 852" fill="none" stroke="var(--sc-mug)" strokeWidth="8" strokeLinecap="round" />
        <path d="M700 806 H772 V858 Q772 874 756 874 H716 Q700 874 700 858 Z" fill="var(--sc-mug)" stroke={LINE} strokeWidth="2.5" />
        <ellipse cx="736" cy="806" rx="36" ry="8" fill="var(--sc-tea)" stroke={LINE} strokeWidth="2.5" />
        <path d="M708 816 V856" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        <g transform="translate(738 840)" fill="#ffffff">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse key={angle} cx="0" cy="-6" rx="4" ry="6" transform={`rotate(${angle})`} />
          ))}
          <circle r="3" fill="var(--honey)" />
        </g>
        <g fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" opacity="0.65">
          {[722, 738, 752].map((x, index) => (
            <path
              key={x}
              d={`M${x} 796 c -8 -10 8 -18 0 -28 c -8 -10 6 -18 0 -26`}
              className="sc-steam"
              style={{
                animationDelay: `${index * 1.1}s`,
                transformBox: "fill-box",
                transformOrigin: "50% 100%",
              }}
            />
          ))}
        </g>
      </g>

      {/* Books with a succulent */}
      <g>
        <ellipse cx="1256" cy="880" rx="96" ry="8" fill="var(--sc-shadow)" />
        <rect x="1176" y="852" width="162" height="26" rx="3" fill="#8fb6e8" stroke={LINE} strokeWidth="2.5" />
        <rect x="1322" y="856" width="12" height="18" fill="#fffaf2" />
        <rect x="1186" y="828" width="140" height="24" rx="3" fill="#e7849d" stroke={LINE} strokeWidth="2.5" />
        <rect x="1312" y="832" width="10" height="16" fill="#fffaf2" />
        <rect x="1196" y="808" width="118" height="20" rx="3" fill="#b69cf0" stroke={LINE} strokeWidth="2.5" />
        <rect x="1300" y="811" width="10" height="14" fill="#fffaf2" />
        <path d="M1236 788 H1270 L1266 808 H1240 Z" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
        <g fill="var(--sc-plant)" stroke={LINE} strokeWidth="1.8">
          <ellipse cx="1244" cy="780" rx="9" ry="12" transform="rotate(-30 1244 780)" />
          <ellipse cx="1262" cy="780" rx="9" ry="12" transform="rotate(30 1262 780)" />
          <ellipse cx="1253" cy="774" rx="8" ry="13" />
        </g>
      </g>

      {/* Big plant in the corner */}
      <g>
        <g stroke={LINE} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M1490 826 C 1470 760 1420 720 1380 700 C 1420 690 1480 720 1496 790" fill="var(--sc-plant-dark)" />
          <path d="M1494 826 C 1500 740 1540 680 1590 660 C 1590 720 1550 780 1500 826" fill="var(--sc-plant)" />
          <path d="M1488 828 C 1460 790 1440 760 1430 720 C 1470 740 1490 780 1494 826" fill="var(--sc-plant)" />
          <path d="M1496 826 C 1510 760 1520 700 1500 640 C 1536 680 1530 760 1500 828" fill="var(--sc-plant-dark)" />
        </g>
        <path d="M1446 820 H1546 L1534 900 H1458 Z" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="1440" y="812" width="112" height="14" rx="4" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2.5" />
      </g>

      <Lamp on={lampOn} interactive={interactive} onToggle={onToggleLamp} />
      <Cat awake={awake} interactive={interactive} />

      {/* Lamp light */}
      <g
        style={{
          opacity: lampOn ? "var(--sc-lamp-glow-opacity)" : 0,
          transition: "opacity 600ms ease",
          mixBlendMode: "screen",
        }}
      >
        <rect width="1600" height="1000" fill="url(#sc-lamp-glow)" />
        <path d="M382 680 L456 641 L700 870 L330 884 Z" fill="url(#sc-lamp-cone)" />
      </g>

      {/* The room dims when the lamp is off */}
      <rect
        width="1600"
        height="1000"
        fill="#05031a"
        style={{
          opacity: lampOn ? 0 : "var(--sc-dark-room)",
          transition: "opacity 600ms ease",
        }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Overlays                                                           */
/* ------------------------------------------------------------------ */

function Grain() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const image = ctx.createImageData(size, size);

    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.random() * 255;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }

    ctx.putImageData(image, 0, 0);
    element.style.backgroundImage = `url(${canvas.toDataURL()})`;
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
    />
  );
}

/* ------------------------------------------------------------------ */

export function RoomScene() {
  const glassRef = useRef<SVGRectElement | null>(null);

  const mounted = useMounted();
  const { resolvedTheme } = useTheme();

  const rain = useSceneStore((state) => state.rain);
  const lampOn = useSceneStore((state) => state.lampOn);
  const toggleLamp = useSceneStore((state) => state.toggleLamp);
  const gaze = useSceneStore((state) => state.gaze);

  const awake = useDialogueStore((state) => state.current !== null);

  return (
    <div
      data-scene
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden bg-background"
    >
      <SkyLayer glassRef={glassRef} />

      {mounted && (
        <RainCanvas
          targetRef={glassRef}
          level={rain}
          night={resolvedTheme === "dark"}
        />
      )}

      <RoomLayer
        lampOn={lampOn}
        awake={awake}
        interactive={gaze}
        onToggleLamp={toggleLamp}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 45%, var(--sc-vignette) 100%)",
        }}
      />

      <Grain />
    </div>
  );
}
