"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useMounted, useNow } from "@/hooks/use-now";
import { playSfx } from "@/lib/sfx";
import { useDialogueStore } from "@/stores/dialogue-store";
import type { Weather } from "@/lib/scene-time";
import { useResolvedScene, useSceneStore } from "@/stores/scene-store";

import {
  FAR_CITY,
  GLASS,
  MID_CITY,
  NEAR_ROOFS,
  STARS,
  WINDOW_TONES,
} from "./city";
import { RainCanvas, triggerSky } from "./rain-canvas";

/*
 * The room is drawn in a fixed 1600×1000 coordinate space and
 * scaled to cover the viewport. It is split into a back layer
 * (the sky and city behind the glass) and a front layer (the room),
 * with the rain canvas sandwiched between them.
 *
 * Almost everything in the room reacts when clicked.
 */

const VIEWBOX = "0 0 1600 1000";
const WIN = { x: 450, y: 110, w: 700, h: 540 };
const DESK_Y = 770;
const GLASS_RIGHT = GLASS.x + GLASS.w;
const GLASS_BOTTOM = GLASS.y + GLASS.h;

const svgProps = {
  viewBox: VIEWBOX,
  preserveAspectRatio: "xMidYMid slice",
  className: "absolute inset-0 size-full",
} as const;

const LINE = "var(--sc-line)";

function pick<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

/* ------------------------------------------------------------------ */
/* Speech bubbles                                                      */
/* ------------------------------------------------------------------ */

type Bubble = { id: number; x: number; y: number; text: string };

const SpeakContext = createContext<
  (x: number, y: number, text: string) => void
>(() => {});

function useSpeak() {
  return useContext(SpeakContext);
}

function SpeechBubble({ bubble }: { bubble: Bubble }) {
  const width = 340;
  const height = 150;

  return (
    <foreignObject
      x={bubble.x - width / 2}
      y={bubble.y - height}
      width={width}
      height={height}
      style={{ pointerEvents: "none", overflow: "visible" }}
    >
      <div className="flex h-full items-end justify-center">
        <div className="relative max-w-[320px] animate-in rounded-2xl border-[2.5px] border-[#1b1530] bg-[#fffaf2] px-4 py-2.5 text-center text-[17px] leading-snug font-bold text-[#2a2140] shadow-[4px_4px_0_rgb(27_21_48/0.85)] duration-200 fade-in-0 zoom-in-75 slide-in-from-bottom-2">
          {bubble.text}
          <span className="absolute -bottom-[9px] left-1/2 size-4 -translate-x-1/2 rotate-45 border-r-[2.5px] border-b-[2.5px] border-[#1b1530] bg-[#fffaf2]" />
        </div>
      </div>
    </foreignObject>
  );
}

/* ------------------------------------------------------------------ */
/* Back layer: sky + city                                              */
/* ------------------------------------------------------------------ */

const FOLIAGE = [
  { x: 1112, y: 162, r: 22 },
  { x: 1080, y: 150, r: 18 },
  { x: 1050, y: 186, r: 20 },
  { x: 1010, y: 150, r: 16 },
  { x: 1000, y: 132, r: 14 },
  { x: 975, y: 206, r: 18 },
  { x: 940, y: 212, r: 16 },
  { x: 905, y: 200, r: 14 },
  { x: 872, y: 192, r: 12 },
  { x: 996, y: 236, r: 14 },
  { x: 985, y: 262, r: 11 },
  { x: 1128, y: 210, r: 18 },
];

/** A tree branch reaching into view; its leaves change with the season. */
function SeasonalBranch() {
  return (
    <g>
      <g stroke="var(--sc-branch)" fill="none" strokeLinecap="round">
        <path d="M1140 150 C 1060 168 990 196 930 206 C 905 210 880 200 860 190" strokeWidth="10" />
        <path d="M1040 178 C 1020 160 1006 146 998 126" strokeWidth="6" />
        <path d="M1000 198 C 996 220 992 240 984 266" strokeWidth="5" />
        <path d="M1110 162 C 1124 186 1130 200 1136 218" strokeWidth="6" />
      </g>

      {/* Snow resting on the branch in winter */}
      <g
        stroke="#ffffff"
        fill="none"
        strokeLinecap="round"
        style={{ opacity: "var(--sc-snowcap-opacity)" }}
      >
        <path d="M1130 146 C 1060 162 990 190 930 200 C 905 204 884 196 866 186" strokeWidth="5" />
        <path d="M1036 172 C 1020 156 1008 144 1000 128" strokeWidth="3.5" />
      </g>

      <g style={{ opacity: "var(--sc-foliage-opacity)" }}>
        {FOLIAGE.map((leaf, index) => (
          <g key={index}>
            <circle cx={leaf.x} cy={leaf.y} r={leaf.r} fill="var(--sc-foliage-2)" />
            <circle cx={leaf.x - leaf.r * 0.25} cy={leaf.y - leaf.r * 0.25} r={leaf.r * 0.72} fill="var(--sc-foliage-1)" />
            <circle cx={leaf.x - leaf.r * 0.4} cy={leaf.y - leaf.r * 0.45} r={leaf.r * 0.3} fill="var(--sc-foliage-3)" />
          </g>
        ))}
      </g>
    </g>
  );
}

function SkyLayer({
  glassRef,
}: {
  glassRef: React.RefObject<SVGRectElement | null>;
}) {
  return (
    <svg {...svgProps} aria-hidden="true">
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

        <radialGradient id="sc-sun-halo">
          <stop offset="0" stopColor="#fffbe6" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fffbe6" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="sc-sun-halo-warm">
          <stop offset="0" stopColor="#ffc58a" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ff9a8a" stopOpacity="0" />
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
        <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="url(#sc-sky)" />

        {/* Suns for morning, day and evening */}
        <g style={{ opacity: "var(--sc-sun-morning)" }}>
          <circle cx="600" cy="470" r="150" fill="url(#sc-sun-halo-warm)" />
          <circle cx="600" cy="470" r="30" fill="#ffe0b8" />
        </g>
        <g style={{ opacity: "var(--sc-sun-day)" }}>
          <circle cx="1000" cy="210" r="140" fill="url(#sc-sun-halo)" />
          <circle cx="1000" cy="210" r="30" fill="#fff8dc" />
        </g>
        <g style={{ opacity: "var(--sc-sun-evening)" }}>
          <circle cx="1050" cy="505" r="210" fill="url(#sc-sun-halo-warm)" />
          <circle cx="1050" cy="505" r="46" fill="#ffb873" />
          <circle cx="1050" cy="505" r="38" fill="#ffc98f" />
        </g>

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
        <g className="sc-drift" filter="url(#sc-soft)" style={{ opacity: "var(--sc-cloud-opacity)" }}>
          <ellipse cx="600" cy="190" rx="170" ry="34" fill="var(--sc-cloud)" />
          <ellipse cx="760" cy="160" rx="120" ry="26" fill="var(--sc-cloud)" />
          <ellipse cx="1060" cy="250" rx="190" ry="30" fill="var(--sc-cloud)" />
          <ellipse cx="880" cy="300" rx="150" ry="22" fill="var(--sc-cloud)" />
          <ellipse cx="540" cy="320" rx="110" ry="20" fill="var(--sc-cloud)" />
        </g>

        {/* Overcast sky when it rains or snows */}
        <rect
          x={GLASS.x}
          y={GLASS.y}
          width={GLASS.w}
          height={GLASS.h}
          fill="var(--sc-overcast)"
          style={{ opacity: "var(--sc-overcast-opacity)", transition: "opacity 1.2s ease" }}
        />

        {/* Far skyline */}
        <g>
          {FAR_CITY.map((building, index) => (
            <rect key={index} x={building.x} y={building.y} width={building.w} height={building.h} fill="var(--sc-city-far)" />
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

        <rect x={GLASS.x} y={GLASS.y + 220} width={GLASS.w} height={GLASS.h - 220} fill="url(#sc-haze)" />

        {/* Mid skyline */}
        <g>
          {MID_CITY.map((building, index) => (
            <g key={index}>
              <rect x={building.x} y={building.y} width={building.w} height={building.h} fill="var(--sc-city-mid)" />
              <rect x={building.x} y={building.y} width={building.w} height="5" fill="var(--sc-city-far)" opacity="0.7" />
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
            <rect x="938" y="430" width="34" height="88" rx="6" fill="#2b1636" stroke="#ff7ab8" strokeWidth="2.5" />
            <text x="955" y="466" textAnchor="middle" fontSize="24" fontWeight="700" fill="#ffd1ea" style={{ fontFamily: "var(--font-zen)" }}>
              喫
            </text>
            <text x="955" y="502" textAnchor="middle" fontSize="24" fontWeight="700" fill="#ffd1ea" style={{ fontFamily: "var(--font-zen)" }}>
              茶
            </text>
          </g>
        </g>

        {/* Foreground rooftops */}
        <g fill="var(--sc-city-near)">
          {NEAR_ROOFS.map((roof) => (
            <rect key={roof.x} x={roof.x} y={roof.y} width={roof.w} height={roof.h} />
          ))}

          {/* Water tank */}
          <rect x="1040" y={GLASS_BOTTOM - 132} width="44" height="34" rx="4" />
          <rect x="1046" y={GLASS_BOTTOM - 100} width="4" height="10" />
          <rect x="1074" y={GLASS_BOTTOM - 100} width="4" height="10" />
          <ellipse cx="1062" cy={GLASS_BOTTOM - 132} rx="22" ry="5" />
        </g>

        {/* Utility pole and wires */}
        <g stroke="var(--sc-city-near)" fill="none" strokeLinecap="round">
          <line x1="575" y1="250" x2="575" y2={GLASS_BOTTOM} strokeWidth="11" />
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

        {/* Rainy haze over the city */}
        <rect
          x={GLASS.x}
          y={GLASS.y}
          width={GLASS.w}
          height={GLASS.h}
          fill="var(--sc-overcast)"
          style={{ opacity: "calc(var(--sc-overcast-opacity) * 0.3)" }}
        />

        <SeasonalBranch />

        <rect
          x={GLASS.x}
          y={GLASS.y}
          width={GLASS.w}
          height={GLASS.h}
          fill="var(--sc-outside-tint)"
        />
      </g>

      <rect ref={glassRef} x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers for one-shot reactions                                      */
/* ------------------------------------------------------------------ */

/** Returns a key that changes on every poke, to replay an animation. */
function usePoke() {
  const [count, setCount] = useState(0);
  return [count, () => setCount((value) => value + 1)] as const;
}

type Particle = { id: number; x: number; y: number; delay: number };

let particleId = 0;

function useParticles(lifetime = 1800) {
  const [particles, setParticles] = useState<Particle[]>([]);

  function burst(x: number, y: number, count: number, spread: number) {
    const fresh = Array.from({ length: count }, (_, index) => ({
      id: ++particleId,
      x: x + (Math.random() - 0.5) * spread,
      y: y + (Math.random() - 0.5) * spread * 0.4,
      delay: index * 0.12,
    }));

    setParticles((current) => [...current, ...fresh]);

    window.setTimeout(() => {
      setParticles((current) =>
        current.filter((particle) => !fresh.includes(particle))
      );
    }, lifetime + count * 120);
  }

  return [particles, burst] as const;
}

const floatStyle = (delay: number) => ({
  animationDelay: `${delay}s`,
  transformBox: "fill-box" as const,
  transformOrigin: "50% 50%",
  opacity: 0,
});

/* ------------------------------------------------------------------ */
/* Wall                                                                */
/* ------------------------------------------------------------------ */

const SHELF_BOOKS = [
  { x: 128, w: 20, h: 74, color: "#e7849d" },
  { x: 150, w: 26, h: 86, color: "#8fb6e8" },
  { x: 178, w: 18, h: 66, color: "#f2c66d" },
  { x: 198, w: 24, h: 80, color: "#9dd3a8" },
  { x: 224, w: 20, h: 70, color: "#b69cf0" },
];

function Poster() {
  return (
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
  );
}

function StarJar() {
  const [particles, burst] = useParticles(1400);
  const [glow, setGlow] = useState(false);

  return (
    <g>
      <g
        className="sc-hit"
        onClick={() => {
          playSfx("sparkle");
          burst(319, 420, 6, 60);
          setGlow(true);
          window.setTimeout(() => setGlow(false), 1500);
        }}
      >
        <rect x="300" y="420" width="38" height="50" rx="9" fill="#ffffff" opacity="0.25" stroke={LINE} strokeWidth="2" />
        <rect x="304" y="412" width="30" height="10" rx="3" fill="var(--sc-lamp)" stroke={LINE} strokeWidth="2" />
        <g style={{ opacity: glow ? 1 : "var(--sc-fairy-opacity)", transition: "opacity 300ms" }}>
          {glow && <circle cx="319" cy="446" r="34" fill="var(--honey)" opacity="0.25" />}
          <circle cx="312" cy="452" r="3" fill="var(--honey)" className="sc-twinkle" />
          <circle cx="324" cy="440" r="2.5" fill="var(--sakura)" className="sc-twinkle" style={{ animationDelay: "0.8s" }} />
          <circle cx="328" cy="458" r="3" fill="var(--sky)" className="sc-twinkle" style={{ animationDelay: "1.6s" }} />
          <circle cx="316" cy="434" r="2" fill="var(--mint)" className="sc-twinkle" style={{ animationDelay: "2.1s" }} />
        </g>
      </g>

      {particles.map((particle) => (
        <g key={particle.id} transform={`translate(${particle.x} ${particle.y})`}>
          <path
            d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z"
            fill="var(--honey)"
            stroke={LINE}
            strokeWidth="1"
            className="sc-float-up"
            style={floatStyle(particle.delay)}
          />
        </g>
      ))}
    </g>
  );
}

function Shelf() {
  return (
    <g>
      {SHELF_BOOKS.map((book) => (
        <g key={book.x}>
          <rect x={book.x} y={470 - book.h} width={book.w} height={book.h} rx="2" fill={book.color} stroke={LINE} strokeWidth="2" />
          <rect x={book.x + 3} y={470 - book.h + 10} width={book.w - 6} height="5" fill="#fff" opacity="0.55" />
        </g>
      ))}
      <rect x="250" y="398" width="20" height="74" rx="2" fill="#f39c7a" stroke={LINE} strokeWidth="2" transform="rotate(14 260 470)" />

      <StarJar />

      {/* Little cactus */}
      <rect x="356" y="428" width="18" height="34" rx="9" fill="var(--sc-plant)" stroke={LINE} strokeWidth="2" />
      <path d="M352 454 H378 L374 472 H356 Z" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />

      <rect x="104" y="470" width="300" height="14" rx="3" fill="var(--sc-desk-1)" stroke={LINE} strokeWidth="2.5" />
      <path d="M140 484 L140 510 L166 484 Z" fill="var(--sc-desk-edge)" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      <path d="M368 484 L368 510 L342 484 Z" fill="var(--sc-desk-edge)" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

function WallClock() {
  const now = useNow();
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  const hours = now ? now.getHours() % 12 : 10;
  const minutes = now ? now.getMinutes() : 10;
  const seconds = now ? now.getSeconds() : 0;

  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const cx = 1360;
  const cy = 236;

  function tellTime() {
    const date = new Date();
    const h = date.getHours();
    const m = date.getMinutes();
    const english = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const japanese = `${h < 12 ? "午前" : "午後"}${h % 12 || 12}時${m}分`;

    playSfx("chime");
    bump();
    speak(cx, 150, `It's ${english} · ${japanese}`);
  }

  return (
    <g className="sc-hit" onClick={tellTime}>
      <g
        key={poke}
        className={poke ? "sc-rustle" : undefined}
        style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
      >
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
          <line x1={cx} y1={cy} x2={cx} y2={cy - 27} stroke={LINE} strokeWidth="5" transform={`rotate(${hourAngle} ${cx} ${cy})`} />
          <line x1={cx} y1={cy} x2={cx} y2={cy - 40} stroke={LINE} strokeWidth="3.5" transform={`rotate(${minuteAngle} ${cx} ${cy})`} />
          <line x1={cx} y1={cy + 8} x2={cx} y2={cy - 44} stroke="var(--sakura)" strokeWidth="1.8" transform={`rotate(${secondAngle} ${cx} ${cy})`} />
        </g>
        <circle cx={cx} cy={cy} r="4.5" fill="var(--sakura)" stroke={LINE} strokeWidth="1.5" />
      </g>
    </g>
  );
}

const TIPS = [
  "Drink some water! 💧",
  "Stand up and stretch for a minute.",
  "One task at a time~",
  "Rest is part of the work.",
  "Close the tabs you don't need. Not this one though.",
  "Write down the next tiny step.",
  "You're doing better than you think.",
];

function Corkboard() {
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
        speak(1370, 368, `📌 ${pick(TIPS)}`);
      }}
    >
      <rect x="1270" y="372" width="200" height="150" rx="8" fill="var(--sc-shadow)" transform="translate(5 6)" />
      <rect x="1270" y="372" width="200" height="150" rx="8" fill="var(--sc-desk-edge)" stroke={LINE} strokeWidth="2.5" />
      <rect x="1280" y="382" width="180" height="130" rx="4" fill="var(--sc-cork)" />
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
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
      </g>
      <circle cx="1313" cy="396" r="4" fill="#ff5d7a" stroke={LINE} strokeWidth="1.2" />
      <circle cx="1373" cy="398" r="4" fill="var(--sky)" stroke={LINE} strokeWidth="1.2" />
      <circle cx="1431" cy="405" r="4" fill="var(--mint)" stroke={LINE} strokeWidth="1.2" />
      <circle cx="1322" cy="455" r="4" fill="var(--honey)" stroke={LINE} strokeWidth="1.2" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Window                                                              */
/* ------------------------------------------------------------------ */

const WEATHER_LINES: Record<Weather, string> = {
  clear: "Teru teru bōzu worked! The sky cleared up~",
  drizzle: "A gentle drizzle again. Perfect for focusing.",
  storm: "Uh oh, a storm! Good thing we're inside~",
  snow: "Snow?! Everything's going quiet and soft…",
};

function TeruTeruBozu() {
  const speak = useSpeak();
  const weather = useSceneStore((state) => state.weather);
  const cycleWeather = useSceneStore((state) => state.cycleWeather);
  const [poke, bump] = usePoke();

  const sunny = weather === "clear";

  return (
    <g
      key={poke}
      className={poke ? "sc-swing" : undefined}
      style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
    >
      <g className="sc-sway" style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
        <line x1="652" y1={GLASS.y} x2="652" y2="190" stroke={LINE} strokeWidth="1.6" />
        <g
          className="sc-hit"
          onClick={() => {
            const next = cycleWeather();
            playSfx("pop");
            bump();
            speak(652, 176, WEATHER_LINES[next]);
          }}
        >
          <path
            d="M634 212 Q 628 246 616 264 Q 652 274 688 264 Q 676 246 670 212 Z"
            fill="#fbf7f2"
            stroke={LINE}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="652" cy="206" r="19" fill="#fbf7f2" stroke={LINE} strokeWidth="2.5" />
          <rect x="636" y="219" width="32" height="6" rx="3" fill="var(--sakura)" stroke={LINE} strokeWidth="1.5" />
          {sunny ? (
            <g fill="none" stroke={LINE} strokeWidth="1.8" strokeLinecap="round">
              <path d="M641 205 Q 645 200 649 205" />
              <path d="M655 205 Q 659 200 663 205" />
            </g>
          ) : (
            <>
              <circle cx="645" cy="204" r="2.3" fill={LINE} />
              <circle cx="659" cy="204" r="2.3" fill={LINE} />
            </>
          )}
          <path
            d={sunny ? "M645 210 Q 652 218 659 210" : "M647 211 Q 652 215 657 211"}
            fill="none"
            stroke={LINE}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <ellipse cx="640" cy="211" rx="3.5" ry="2" fill="#f5a3b5" />
          <ellipse cx="664" cy="211" rx="3.5" ry="2" fill="#f5a3b5" />
        </g>
      </g>
    </g>
  );
}

/** Summer: a glass wind chime (fūrin) that rings when poked. */
function Furin() {
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  return (
    <g className="season-summer">
      <g
        key={poke}
        className={poke ? "sc-swing" : undefined}
        style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
      >
        <g className="sc-sway" style={{ transformBox: "fill-box", transformOrigin: "50% 0%", animationDelay: "-2s" }}>
          <line x1="962" y1={GLASS.y} x2="962" y2="176" stroke={LINE} strokeWidth="1.6" />
          <g
            className="sc-hit"
            onClick={() => {
              playSfx("furin");
              bump();
              speak(962, 168, "Chiriin~ 🎐 A cool summer breeze.");
            }}
          >
            <path
              d="M944 196 Q 944 176 962 176 Q 980 176 980 196 Z"
              fill="#e7f6ff"
              fillOpacity="0.75"
              stroke={LINE}
              strokeWidth="2"
            />
            <path d="M948 190 q 6 -6 12 0 q 6 6 12 0" fill="none" stroke="#ff6f8f" strokeWidth="2" />
            <circle cx="955" cy="184" r="2.5" fill="#ff6f8f" />
            <line x1="962" y1="196" x2="962" y2="212" stroke={LINE} strokeWidth="1.4" />
            <rect x="954" y="212" width="16" height="44" rx="2" fill="#fff4b8" stroke={LINE} strokeWidth="1.6" />
            <path d="M958 222 h8 M958 230 h6 M958 238 h8" stroke="var(--sakura)" strokeWidth="1.4" />
          </g>
        </g>
      </g>
    </g>
  );
}

/** A little vase on the sill with a seasonal arrangement. */
function SillVase() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {/* Spring: a sakura branch */}
        <g className="season-spring">
          <path d="M906 612 C 900 590 892 572 878 556 M904 596 C 914 580 926 572 940 566" stroke="#6b4b44" strokeWidth="3" fill="none" strokeLinecap="round" />
          {[[878, 556], [890, 568], [940, 566], [926, 574], [884, 578], [912, 586]].map(([x, y], index) => (
            <g key={index} fill="#ffc6da" stroke={LINE} strokeWidth="1">
              <circle cx={x} cy={y} r="6" />
              <circle cx={x} cy={y} r="2" fill="#ff7fa8" stroke="none" />
            </g>
          ))}
        </g>

        {/* Summer: a sunflower */}
        <g className="season-summer">
          <path d="M906 612 C 906 590 908 570 912 552" stroke="#3f9157" strokeWidth="3.5" fill="none" />
          <ellipse cx="924" cy="586" rx="10" ry="5" fill="#5fae6b" stroke={LINE} strokeWidth="1.2" transform="rotate(-30 924 586)" />
          <g transform="translate(912 548)">
            {Array.from({ length: 12 }, (_, index) => (
              <ellipse key={index} cx="0" cy="-12" rx="4.5" ry="8" fill="#ffd34d" stroke={LINE} strokeWidth="1" transform={`rotate(${index * 30})`} />
            ))}
            <circle r="8" fill="#7a4a2a" stroke={LINE} strokeWidth="1.2" />
          </g>
        </g>

        {/* Autumn: susuki grass and a maple twig */}
        <g className="season-autumn">
          {[[-18, 0], [-6, -10], [8, -4]].map(([dx, dy], index) => (
            <path
              key={index}
              d={`M906 612 C ${906 + dx / 2} 590 ${906 + dx} ${566 + dy} ${906 + dx * 1.4} ${548 + dy}`}
              stroke="#c9a46a"
              strokeWidth="2.5"
              fill="none"
            />
          ))}
          {[[880, 552], [900, 540], [918, 548]].map(([x, y], index) => (
            <ellipse key={index} cx={x} cy={y} rx="5" ry="12" fill="#f3dcae" stroke={LINE} strokeWidth="1" transform={`rotate(${-20 + index * 20} ${x} ${y})`} />
          ))}
          <path d="M934 572 l 6 -10 l 2 8 l 8 -6 l -3 9 l 9 1 l -9 5 l 4 7 l -9 -3 l -2 8 l -4 -8 l -8 3 l 4 -7 Z" fill="#df5d3e" stroke={LINE} strokeWidth="1" />
        </g>

        {/* Winter: camellia */}
        <g className="season-winter">
          <path d="M906 612 C 904 594 900 580 892 566 M904 600 C 914 590 922 584 932 580" stroke="#3f6b4f" strokeWidth="3" fill="none" />
          <ellipse cx="886" cy="574" rx="8" ry="4.5" fill="#3f8c6c" stroke={LINE} strokeWidth="1" transform="rotate(-40 886 574)" />
          <ellipse cx="924" cy="590" rx="8" ry="4.5" fill="#3f8c6c" stroke={LINE} strokeWidth="1" transform="rotate(20 924 590)" />
          <g transform="translate(892 562)">
            {[0, 72, 144, 216, 288].map((angle) => (
              <circle key={angle} cx="0" cy="-6" r="6" fill="#e2344f" stroke={LINE} strokeWidth="1" transform={`rotate(${angle})`} />
            ))}
            <circle r="3.5" fill="#ffd34d" />
          </g>
          <g transform="translate(934 578)">
            {[0, 72, 144, 216, 288].map((angle) => (
              <circle key={angle} cx="0" cy="-5" r="5" fill="#ffffff" stroke={LINE} strokeWidth="1" transform={`rotate(${angle})`} />
            ))}
            <circle r="3" fill="#ffd34d" />
          </g>
        </g>
      </g>

      <path d="M896 646 C 888 640 888 624 898 618 L 900 610 H 912 L 914 618 C 924 624 924 640 916 646 Z" fill="#9fd3ea" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M896 630 h20" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
    </g>
  );
}

/** Autumn: persimmons next to the books. */
function Persimmons() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="season-autumn sc-hit"
      onClick={() => {
        playSfx("pop");
        bump();
      }}
    >
      <ellipse cx="1124" cy="878" rx="44" ry="6" fill="var(--sc-shadow)" />
      <g key={poke} className={poke ? "sc-hop" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        {[[1104, 860], [1140, 862], [1122, 840]].map(([x, y], index) => (
          <g key={index}>
            <ellipse cx={x} cy={y} rx="17" ry="14" fill="#f2863a" stroke={LINE} strokeWidth="2" />
            <ellipse cx={x - 6} cy={y - 5} rx="4" ry="2.5" fill="#ffffff" opacity="0.5" />
            <path d={`M${x - 7} ${y - 13} l 7 -4 l 7 4 l -7 3 Z`} fill="#4f8a3c" stroke={LINE} strokeWidth="1.2" />
          </g>
        ))}
      </g>
    </g>
  );
}

function WindowFrame({ onKnock }: { onKnock: () => void }) {
  return (
    <g>
      {/* Clicking the glass calls the lightning */}
      <rect
        x={GLASS.x}
        y={GLASS.y}
        width={GLASS.w}
        height={GLASS.h}
        fill="transparent"
        style={{ pointerEvents: "auto", cursor: "pointer" }}
        onClick={onKnock}
      />

      {/* Glass sheen */}
      <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="url(#sc-fog)" />
      <g fill="#ffffff" style={{ opacity: "var(--sc-glass-opacity)" }}>
        <path d={`M${GLASS.x + 40} ${GLASS.y} h70 L${GLASS.x} ${GLASS.y + 150} v-70 Z`} />
        <path d={`M${GLASS.x + 140} ${GLASS.y} h24 L${GLASS.x} ${GLASS.y + 230} v-24 Z`} />
        <path d={`M${GLASS_RIGHT - 120} ${GLASS_BOTTOM} h80 L${GLASS_RIGHT} ${GLASS_BOTTOM - 140} v60 Z`} />
      </g>

      {/* Frost creeping in from the corners when it snows */}
      <rect
        x={GLASS.x}
        y={GLASS.y}
        width={GLASS.w}
        height={GLASS.h}
        fill="url(#sc-frost)"
        style={{ opacity: "var(--sc-frost-opacity)", transition: "opacity 2s ease" }}
      />

      <path
        d={`M${WIN.x} ${WIN.y}H${WIN.x + WIN.w}V${WIN.y + WIN.h}H${WIN.x}Z M${GLASS.x} ${GLASS.y}V${GLASS_BOTTOM}H${GLASS_RIGHT}V${GLASS.y}Z`}
        fillRule="evenodd"
        fill="var(--sc-frame)"
      />
      <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="none" stroke="var(--sc-frame-dark)" strokeWidth="5" />
      <line x1={WIN.x + 4} y1={WIN.y + 4} x2={WIN.x + WIN.w - 4} y2={WIN.y + 4} stroke="var(--sc-frame-light)" strokeWidth="3" />
      <rect x="793" y={GLASS.y} width="14" height={GLASS.h} fill="var(--sc-frame)" />
      <line x1="795" y1={GLASS.y} x2="795" y2={GLASS_BOTTOM} stroke="var(--sc-frame-light)" strokeWidth="2" />
      <rect x={GLASS.x} y="374" width={GLASS.w} height="13" fill="var(--sc-frame)" />
      <line x1={GLASS.x} y1="376" x2={GLASS_RIGHT} y2="376" stroke="var(--sc-frame-light)" strokeWidth="2" />
      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="none" stroke={LINE} strokeWidth="3" />
      <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="none" stroke={LINE} strokeWidth="2" />
      <rect x="1086" y="372" width="8" height="18" rx="3" fill="var(--honey)" stroke={LINE} strokeWidth="1.5" />

      <TeruTeruBozu />
      <Furin />
    </g>
  );
}

function SillPlant() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path d="M1066 610 C 1046 590 1040 566 1046 548 C 1060 566 1066 586 1066 610" fill="var(--sc-plant)" stroke={LINE} strokeWidth="2" />
        <path d="M1068 610 C 1074 584 1092 566 1110 562 C 1102 584 1088 600 1068 610" fill="var(--sc-plant-dark)" stroke={LINE} strokeWidth="2" />
        <path d="M1066 612 C 1060 590 1066 566 1080 552 C 1084 576 1078 596 1066 612" fill="var(--sc-plant)" stroke={LINE} strokeWidth="2" />
      </g>
      <path d="M1040 612 H1096 L1088 646 H1048 Z" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="1036" y="606" width="64" height="10" rx="3" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2.5" />
    </g>
  );
}

function Candle() {
  const [lit, setLit] = useState(true);

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx(lit ? "rustle" : "pop");
        setLit(!lit);
      }}
    >
      <rect x="508" y="618" width="34" height="28" rx="6" fill="#ffffff" opacity="0.3" stroke={LINE} strokeWidth="2" />
      <rect x="516" y="628" width="18" height="16" rx="3" fill="var(--honey)" />
      <line x1="525" y1="628" x2="525" y2="622" stroke={LINE} strokeWidth="1.5" />
      {lit && (
        <g style={{ opacity: "var(--sc-fairy-opacity)" }}>
          <circle cx="525" cy="620" r="20" fill="#ffd27a" opacity="0.2" />
          <ellipse cx="525" cy="616" rx="4" ry="7" fill="#ffd27a" className="sc-twinkle" style={{ animationDuration: "1.4s" }} />
          <ellipse cx="525" cy="618" rx="1.8" ry="3.5" fill="#fff6dc" />
        </g>
      )}
    </g>
  );
}

function Curtain({ mirrored }: { mirrored?: boolean }) {
  const [poke, bump] = usePoke();

  const body = (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
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
      </g>
    </g>
  );

  return mirrored ? (
    <g transform="translate(1600 0) scale(-1 1)">{body}</g>
  ) : (
    body
  );
}

/* ------------------------------------------------------------------ */
/* Fairy lights                                                        */
/* ------------------------------------------------------------------ */

function quadPoint(
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
  t: number
) {
  const u = 1 - t;

  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ] as const;
}

const FAIRY_COLORS = ["var(--honey)", "var(--sakura)", "var(--mint)", "var(--sky)"];

const FAIRY_SEGMENTS = [
  [[380, 98], [590, 192], [800, 104]],
  [[800, 104], [1010, 192], [1220, 98]],
] as const;

const FAIRY_BULBS = FAIRY_SEGMENTS.flatMap((segment, segmentIndex) =>
  [0.1, 0.24, 0.38, 0.52, 0.66, 0.8, 0.94].map((t, index) => {
    const [x, y] = quadPoint(segment[0], segment[1], segment[2], t);
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

type FairyMode = "twinkle" | "steady" | "off";

const NEXT_FAIRY: Record<FairyMode, FairyMode> = {
  twinkle: "steady",
  steady: "off",
  off: "twinkle",
};

function FairyLights() {
  const [mode, setMode] = useState<FairyMode>("twinkle");

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("click");
        setMode(NEXT_FAIRY[mode]);
      }}
    >
      {/* Generous invisible hit area along the wire */}
      <path
        d="M380 98 Q 590 192 800 104 Q 1010 192 1220 98"
        fill="none"
        stroke="transparent"
        strokeWidth="30"
      />
      <path d="M380 98 Q 590 192 800 104 Q 1010 192 1220 98" fill="none" stroke={LINE} strokeWidth="1.6" opacity="0.8" />

      {mode !== "off" && (
        <g style={{ opacity: "var(--sc-fairy-opacity)" }}>
          {FAIRY_BULBS.map((bulb) => (
            <g
              key={bulb.id}
              className={mode === "twinkle" ? "sc-twinkle" : undefined}
              style={{ animationDelay: `${bulb.delay}s` }}
            >
              <circle cx={bulb.x} cy={bulb.y + 7} r="15" fill={bulb.color} opacity="0.3" />
              <circle cx={bulb.x} cy={bulb.y + 7} r="5.5" fill={bulb.color} />
            </g>
          ))}
        </g>
      )}

      {FAIRY_BULBS.map((bulb) => (
        <g key={bulb.id}>
          {mode === "off" && (
            <circle cx={bulb.x} cy={bulb.y + 7} r="5" fill="var(--sc-wall-low)" stroke={LINE} strokeWidth="1" opacity="0.8" />
          )}
          <rect x={bulb.x - 2.5} y={bulb.y - 1} width="5" height="4" rx="1" fill={LINE} />
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Desk                                                                */
/* ------------------------------------------------------------------ */

const FORTUNES = [
  "大吉 Great blessing! Your focus will be legendary today.",
  "中吉 Middle blessing. A good day to finish that one task.",
  "小吉 Small blessing. Small steps still count — try one pomodoro.",
  "吉 Blessing. Tea first, then greatness.",
  "末吉 Future blessing. Things get better after the rain.",
  "凶 Bad luck… but cats cancel bad luck. You're safe.",
];

function Notebook() {
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
        speak(530, 800, `🎋 Omikuji: ${pick(FORTUNES)}`);
      }}
    >
      <g key={poke} className={poke ? "sc-hop" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
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
      </g>
      <g transform="rotate(-24 640 860)">
        <rect x="570" y="854" width="96" height="11" rx="2" fill="var(--honey)" stroke={LINE} strokeWidth="2" />
        <rect x="652" y="854" width="14" height="11" fill="#f5a3b5" stroke={LINE} strokeWidth="2" />
        <path d="M570 854 L556 859.5 L570 865 Z" fill="#f7dcc0" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  );
}

const SIP_LINES = [
  "*refills the mug* Fresh hōjicha~",
  "Sip… still warm.",
  "Sip… half left.",
  "Last sip! The mug is empty.",
];

function Mug() {
  const speak = useSpeak();
  const [level, setLevel] = useState(3);
  const [poke, bump] = usePoke();

  function sip() {
    const next = level === 0 ? 3 : level - 1;

    playSfx(level === 0 ? "pop" : "sip");
    setLevel(next);
    bump();
    speak(736, 772, SIP_LINES[level === 0 ? 0 : 4 - level]);
  }

  return (
    <g className="sc-hit" onClick={sip}>
      <ellipse cx="736" cy="876" rx="46" ry="7" fill="var(--sc-shadow)" />
      <g key={poke} className={poke ? "sc-hop" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path d="M772 820 C 802 820 802 856 772 852" fill="none" stroke={LINE} strokeWidth="13" strokeLinecap="round" />
        <path d="M772 820 C 802 820 802 856 772 852" fill="none" stroke="var(--sc-mug)" strokeWidth="8" strokeLinecap="round" />
        <path d="M700 806 H772 V858 Q772 874 756 874 H716 Q700 874 700 858 Z" fill="var(--sc-mug)" stroke={LINE} strokeWidth="2.5" />
        <ellipse
          cx="736"
          cy="806"
          rx="36"
          ry="8"
          fill={level > 0 ? "var(--sc-tea)" : "var(--sc-cat-shade)"}
          stroke={LINE}
          strokeWidth="2.5"
        />
        <path d="M708 816 V856" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        <g transform="translate(738 840)" fill="#ffffff">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse key={angle} cx="0" cy="-6" rx="4" ry="6" transform={`rotate(${angle})`} />
          ))}
          <circle r="3" fill="var(--honey)" />
        </g>
      </g>

      {level > 0 && (
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
      )}

      {poke > 0 && level > 0 && (
        <circle
          key={`puff-${poke}`}
          cx="736"
          cy="786"
          r="16"
          fill="#ffffff"
          opacity="0.5"
          className="sc-puff"
          style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
        />
      )}
    </g>
  );
}

function Books() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("pop");
        bump();
      }}
    >
      <ellipse cx="1256" cy="880" rx="96" ry="8" fill="var(--sc-shadow)" />
      <rect x="1176" y="852" width="162" height="26" rx="3" fill="#8fb6e8" stroke={LINE} strokeWidth="2.5" />
      <rect x="1322" y="856" width="12" height="18" fill="#fffaf2" />
      <rect x="1186" y="828" width="140" height="24" rx="3" fill="#e7849d" stroke={LINE} strokeWidth="2.5" />
      <rect x="1312" y="832" width="10" height="16" fill="#fffaf2" />
      <rect x="1196" y="808" width="118" height="20" rx="3" fill="#b69cf0" stroke={LINE} strokeWidth="2.5" />
      <rect x="1300" y="811" width="10" height="14" fill="#fffaf2" />
      <g key={poke} className={poke ? "sc-hop" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path d="M1236 788 H1270 L1266 808 H1240 Z" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
        <g fill="var(--sc-plant)" stroke={LINE} strokeWidth="1.8">
          <ellipse cx="1244" cy="780" rx="9" ry="12" transform="rotate(-30 1244 780)" />
          <ellipse cx="1262" cy="780" rx="9" ry="12" transform="rotate(30 1262 780)" />
          <ellipse cx="1253" cy="774" rx="8" ry="13" />
        </g>
      </g>
    </g>
  );
}

function BigPlant() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <g stroke={LINE} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M1490 826 C 1470 760 1420 720 1380 700 C 1420 690 1480 720 1496 790" fill="var(--sc-plant-dark)" />
          <path d="M1494 826 C 1500 740 1540 680 1590 660 C 1590 720 1550 780 1500 826" fill="var(--sc-plant)" />
          <path d="M1488 828 C 1460 790 1440 760 1430 720 C 1470 740 1490 780 1494 826" fill="var(--sc-plant)" />
          <path d="M1496 826 C 1510 760 1520 700 1500 640 C 1536 680 1530 760 1500 828" fill="var(--sc-plant-dark)" />
        </g>
      </g>
      <path d="M1446 820 H1546 L1534 900 H1458 Z" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="1440" y="812" width="112" height="14" rx="4" fill="var(--sc-pot)" stroke={LINE} strokeWidth="2.5" />
    </g>
  );
}

function Lamp() {
  const lampOn = useSceneStore((state) => state.lampOn);
  const toggleLamp = useSceneStore((state) => state.toggleLamp);

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("click");
        toggleLamp();
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
        <path d="M-18 -12 L18 -12 L44 42 L-44 42 Z" fill="var(--sc-lamp)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-8 -12 L-30 42" stroke="var(--sc-lamp-dark)" strokeWidth="5" opacity="0.6" />
        <ellipse cx="0" cy="42" rx="44" ry="9" fill={lampOn ? "#fff1c9" : "var(--sc-lamp-dark)"} stroke={LINE} strokeWidth="2.5" />
        <rect x="-10" y="-22" width="20" height="12" rx="4" fill="var(--sc-lamp-dark)" stroke={LINE} strokeWidth="2" />
      </g>
    </g>
  );
}

const CAT_LINES = [
  "Nya~",
  "Purrrr… five more minutes.",
  "Pets accepted. Carry on.",
  "Did you finish your pomodoro?",
  "The rain is nice, isn't it?",
  "I'm not sleeping. I'm resting my eyes.",
  "Mrrp! That tickles.",
  "Is it snack time? It's always snack time.",
];

function Cat() {
  const speak = useSpeak();
  const dialogueOpen = useDialogueStore((state) => state.current !== null);

  const [pets, setPets] = useState(0);
  const [awake, setAwake] = useState(false);
  const [poke, bump] = usePoke();
  const [hearts, burst] = useParticles();
  const sleepTimer = useRef<number | null>(null);

  const eyesOpen = awake || dialogueOpen;

  function pet() {
    const count = pets + 1;

    setPets(count);
    setAwake(true);
    bump();
    burst(868, 770, 3, 70);
    playSfx("purr");

    speak(
      868,
      764,
      count % 10 === 0
        ? `That's ${count} pets! We're best friends now. 🐾`
        : pick(CAT_LINES)
    );

    if (sleepTimer.current !== null) {
      window.clearTimeout(sleepTimer.current);
    }

    sleepTimer.current = window.setTimeout(() => setAwake(false), 4000);
  }

  return (
    <g>
      <g className="sc-hit" onClick={pet}>
        <defs>
          <clipPath id="sc-cat-body">
            <ellipse cx="968" cy="830" rx="112" ry="48" />
          </clipPath>
        </defs>

        <ellipse cx="958" cy="878" rx="132" ry="11" fill="var(--sc-shadow)" />

        {/* Tail */}
        <g className="sc-tail" style={{ transformBox: "fill-box", transformOrigin: "100% 0%", animationDuration: eyesOpen ? "0.9s" : undefined }}>
          <path d="M1068 846 C 1080 880 1010 884 940 880 C 905 878 880 874 872 866" fill="none" stroke={LINE} strokeWidth="23" strokeLinecap="round" />
          <path d="M1068 846 C 1080 880 1010 884 940 880 C 905 878 880 874 872 866" fill="none" stroke="var(--sc-cat)" strokeWidth="17" strokeLinecap="round" />
          <path d="M890 872 C 882 870 876 868 872 866" fill="none" stroke="var(--sc-cat-patch-2)" strokeWidth="15" strokeLinecap="round" />
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

        {/* Winter scarf */}
        <g className="season-winter">
          <path d="M893 806 Q 926 836 906 878 L 888 872 Q 904 840 878 814 Z" fill="#e2344f" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M889 818 Q 908 838 898 862" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="5 6" opacity="0.8" />
          <path d="M900 868 L 914 892 L 928 886 L 914 862 Z" fill="#e2344f" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
        </g>

        {/* Head, which bobs when petted */}
        <g key={poke} className={poke ? "sc-hop" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
          <g className={poke ? "sc-ear" : undefined} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
            <path d="M834 812 L842 770 L866 798 Z" fill="var(--sc-cat-patch)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M842 802 L846 782 L857 796 Z" fill="#f5a3b5" />
          </g>
          <path d="M874 796 L902 768 L906 810 Z" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M884 796 L899 781 L900 801 Z" fill="#f5a3b5" />

          <ellipse cx="868" cy="832" rx="47" ry="41" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" />
          <path d="M826 818 Q 840 796 862 800 Q 846 812 840 830 Z" fill="var(--sc-cat-patch)" />

          {eyesOpen ? (
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
          <ellipse cx="840" cy="846" rx="7" ry="4" fill="#f5a3b5" opacity={eyesOpen ? 0.95 : 0.7} />
          <ellipse cx="896" cy="846" rx="7" ry="4" fill="#f5a3b5" opacity={eyesOpen ? 0.95 : 0.7} />
          <path d="M865 842 L871 842 L868 846 Z" fill="#f08aa3" />
          <path d="M862 848 Q 865 852 868 848 Q 871 852 874 848" fill="none" stroke={LINE} strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Paws */}
        <ellipse cx="846" cy="870" rx="17" ry="9" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" />
        <ellipse cx="884" cy="872" rx="17" ry="9" fill="var(--sc-cat)" stroke={LINE} strokeWidth="2.5" />

        {/* Zzz */}
        {!eyesOpen && (
          <g fill="var(--lavender)" stroke={LINE} strokeWidth="1" fontWeight="700" style={{ fontFamily: "var(--font-mochiy)" }}>
            {[
              { x: 910, y: 790, size: 16, char: "z" },
              { x: 914, y: 786, size: 22, char: "z" },
              { x: 918, y: 782, size: 28, char: "Z" },
            ].map((z, index) => (
              <text
                key={index}
                x={z.x}
                y={z.y}
                fontSize={z.size}
                className="sc-zzz"
                style={{
                  animationDelay: `${index * 1.1}s`,
                  transformBox: "fill-box",
                  transformOrigin: "50% 50%",
                  opacity: 0,
                }}
              >
                {z.char}
              </text>
            ))}
          </g>
        )}
      </g>

      {hearts.map((heart) => (
        <g key={heart.id} transform={`translate(${heart.x} ${heart.y}) scale(1.8)`}>
          <path
            d="M0 3 C0 -1 -6 -2 -6 2 C -6 6 0 9 0 11 C 0 9 6 6 6 2 C 6 -2 0 -1 0 3 Z"
            fill="var(--sakura)"
            stroke={LINE}
            strokeWidth="0.8"
            className="sc-float-up"
            style={floatStyle(heart.delay)}
          />
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Front layer: the room                                               */
/* ------------------------------------------------------------------ */

function RoomDefs() {
  return (
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

      <radialGradient id="sc-frost" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
      </radialGradient>

      {/* Soft halo when hovering something clickable */}
      <filter id="sc-hover-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick" />
        <feGaussianBlur in="thick" stdDeviation="5" result="blur" />
        <feFlood floodColor="#fff1c2" floodOpacity="0.9" />
        <feComposite in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function RoomLayer({ onKnock }: { onKnock: () => void }) {
  const lampOn = useSceneStore((state) => state.lampOn);

  const [bubble, setBubble] = useState<Bubble | null>(null);
  const bubbleTimer = useRef<number | null>(null);

  function speak(x: number, y: number, text: string) {
    const id = Date.now();

    setBubble({ id, x, y, text });

    if (bubbleTimer.current !== null) {
      window.clearTimeout(bubbleTimer.current);
    }

    bubbleTimer.current = window.setTimeout(() => {
      setBubble((current) => (current?.id === id ? null : current));
    }, 3800);
  }

  const wallPath = `M0 0H1600V${DESK_Y}H0Z M${GLASS.x} ${GLASS.y}V${GLASS_BOTTOM}H${GLASS_RIGHT}V${GLASS.y}Z`;

  return (
    <SpeakContext.Provider value={speak}>
      <svg {...svgProps} style={{ pointerEvents: "none" }}>
        <RoomDefs />

        {/* Wall, with a hole where the glass is */}
        <path d={wallPath} fillRule="evenodd" fill="url(#sc-wall)" />
        <path d={wallPath} fillRule="evenodd" fill="url(#sc-stripes)" />
        <path d={wallPath} fillRule="evenodd" fill="url(#sc-window-light)" />

        {/* Wainscoting */}
        <rect x="0" y="690" width="1600" height="80" fill="var(--sc-wall-low)" />
        <rect x="0" y="684" width="1600" height="8" fill="var(--sc-trim)" />
        <line x1="0" y1="692" x2="1600" y2="692" stroke={LINE} strokeWidth="1.5" opacity="0.4" />

        <Poster />
        <Shelf />
        <WallClock />
        <Corkboard />

        <WindowFrame onKnock={onKnock} />

        {/* Sill */}
        <rect x="440" y="676" width="720" height="14" fill="var(--sc-shadow)" opacity="0.6" />
        <rect x="428" y="646" width="744" height="20" rx="4" fill="var(--sc-frame)" stroke={LINE} strokeWidth="2.5" />
        <rect x="436" y="664" width="728" height="12" fill="var(--sc-frame-dark)" stroke={LINE} strokeWidth="2" />

        <SillPlant />
        <Candle />
        <SillVase />

        {/* Curtain rod and curtains */}
        <rect x="356" y="88" width="888" height="9" rx="4.5" fill="var(--sc-frame-dark)" stroke={LINE} strokeWidth="2" />
        <circle cx="354" cy="92.5" r="11" fill="var(--sc-frame-dark)" stroke={LINE} strokeWidth="2" />
        <circle cx="1246" cy="92.5" r="11" fill="var(--sc-frame-dark)" stroke={LINE} strokeWidth="2" />

        <Curtain />
        <Curtain mirrored />

        <FairyLights />

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
          d={`M${GLASS.x + 10} ${DESK_Y} H${GLASS_RIGHT - 10} L${GLASS_RIGHT + 110} 906 H${GLASS.x - 110} Z`}
          fill="url(#sc-spill)"
          style={{ opacity: "var(--sc-spill-opacity)", mixBlendMode: "screen" }}
        />

        <Notebook />
        <Mug />
        <Books />
        <Persimmons />
        <BigPlant />
        <Lamp />
        <Cat />

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

        {bubble && <SpeechBubble key={bubble.id} bubble={bubble} />}
      </svg>
    </SpeakContext.Provider>
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
  const scene = useResolvedScene();

  const [flashKey, setFlashKey] = useState(0);

  /** Clicking the window does something different in every weather. */
  function knock() {
    if (scene.weather === "clear") {
      triggerSky("firework");
      window.setTimeout(() => playSfx("firework"), 900);
      return;
    }

    if (scene.weather === "snow") {
      triggerSky("gust");
      playSfx("rustle");
      return;
    }

    triggerSky("lightning");
    setFlashKey((value) => value + 1);

    // Light travels faster than sound.
    window.setTimeout(() => playSfx("thunder"), 280);
  }

  return (
    <div
      data-scene
      className="fixed inset-0 z-0 overflow-hidden bg-background select-none"
    >
      <SkyLayer glassRef={glassRef} />

      {mounted && (
        <RainCanvas
          targetRef={glassRef}
          weather={scene.weather}
          season={scene.season}
          time={scene.time}
        />
      )}

      <RoomLayer onKnock={knock} />

      {flashKey > 0 && (
        <div
          key={flashKey}
          aria-hidden="true"
          className="sc-room-flash pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgb(225 232 255 / 0.85), rgb(225 232 255 / 0.15) 70%)",
          }}
        />
      )}

      <div
        aria-hidden="true"
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
