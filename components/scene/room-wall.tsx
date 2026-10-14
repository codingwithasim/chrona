"use client";

import { useState } from "react";

import { useNow } from "@/hooks/use-now";
import { playSfx } from "@/lib/sfx";

import {
  DESK_Y,
  EDGE,
  floatStyle,
  GLASS,
  GLASS_BOTTOM,
  GLASS_RIGHT,
  pick,
  pivot,
  useParticles,
  usePoke,
  useSpeak,
} from "./scene-shared";

/** The wall, with a hole where the glass is. */
export function Wall() {
  const wallPath = `M0 0H1600V${DESK_Y}H0Z M${GLASS.x} ${GLASS.y}V${GLASS_BOTTOM}H${GLASS_RIGHT}V${GLASS.y}Z`;

  return (
    <g>
      <path d={wallPath} fillRule="evenodd" fill="url(#sc-wall)" />
      <path d={wallPath} fillRule="evenodd" fill="url(#sc-stripes)" />
      <path d={wallPath} fillRule="evenodd" fill="url(#sc-window-light)" />

      {/* Corners and ceiling fall into shadow */}
      <rect x="0" y="0" width="300" height={DESK_Y} fill="url(#sc-corner-left)" opacity="0.55" />
      <rect x="1300" y="0" width="300" height={DESK_Y} fill="url(#sc-corner-right)" opacity="0.55" />
      <rect x="0" y="0" width="1600" height="110" fill="url(#sc-ceiling)" opacity="0.5" />

      {/* Wainscoting */}
      <rect x="0" y="690" width="1600" height="80" fill="var(--sc-wall-low)" />
      <g stroke="#000000" strokeWidth="1.2" opacity="0.08">
        {Array.from({ length: 36 }, (_, index) => (
          <line key={index} x1={index * 46} y1="694" x2={index * 46} y2={DESK_Y} />
        ))}
      </g>
      <g stroke="#ffffff" strokeWidth="1" opacity="0.12">
        {Array.from({ length: 36 }, (_, index) => (
          <line key={index} x1={index * 46 + 2} y1="694" x2={index * 46 + 2} y2={DESK_Y} />
        ))}
      </g>
      <rect x="0" y="682" width="1600" height="11" fill="var(--sc-trim)" />
      <line x1="0" y1="683" x2="1600" y2="683" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
      <line x1="0" y1="693" x2="1600" y2="693" stroke="#000000" strokeWidth="1.5" opacity="0.15" />
    </g>
  );
}

/** A little landscape painting, in the same spirit as the room. */
export function Painting() {
  return (
    <g transform="rotate(-1.5 238 270)">
      <rect x="150" y="168" width="178" height="214" rx="3" fill="var(--sc-shadow)" transform="translate(6 8)" opacity="0.7" />
      <rect x="150" y="168" width="178" height="214" rx="3" fill="#b98a63" />
      <rect x="150" y="168" width="178" height="214" rx="3" fill="url(#sc-metal)" opacity="0.5" />
      <rect x="160" y="178" width="158" height="194" fill="var(--sc-paper)" />

      <rect x="170" y="188" width="138" height="150" fill="#9cc8ea" />
      <rect x="170" y="250" width="138" height="88" fill="#d9ecf3" />
      <g fill="#ffffff">
        <circle cx="214" cy="236" r="16" />
        <circle cx="236" cy="224" r="20" />
        <circle cx="260" cy="234" r="15" />
        <rect x="198" y="234" width="76" height="12" />
      </g>
      <path d="M170 300 C 200 282 230 284 260 296 C 280 290 296 286 308 290 V338 H170 Z" fill="#7fb06a" />
      <path d="M170 318 C 210 304 250 312 308 302 V338 H170 Z" fill="#5f9a55" />
      <rect x="268" y="294" width="16" height="10" fill="#f4ecdc" />
      <path d="M266 295 L276 287 L286 295 Z" fill="#c4544f" />
      <path d="M190 338 C 210 326 226 318 248 312" stroke="#e9dcc0" strokeWidth="3" fill="none" />

      <text x="239" y="360" textAnchor="middle" fontSize="11" fill="#7f6e93" style={{ fontFamily: "var(--font-kiwi)" }}>
        なつのそら
      </text>
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
        <rect x="300" y="420" width="38" height="50" rx="10" fill="url(#sc-glass-ball)" stroke={EDGE} strokeWidth="1.2" />
        <rect x="303" y="412" width="32" height="10" rx="3" fill="#c79a6a" />
        <rect x="303" y="412" width="32" height="10" rx="3" fill="url(#sc-metal)" />
        <g style={{ opacity: glow ? 1 : "var(--sc-fairy-opacity)", transition: "opacity 300ms" }}>
          {glow && <circle cx="319" cy="446" r="36" fill="var(--honey)" opacity="0.22" />}
          <circle cx="312" cy="452" r="3" fill="var(--honey)" className="sc-twinkle" />
          <circle cx="324" cy="440" r="2.5" fill="var(--sakura)" className="sc-twinkle" style={{ animationDelay: "0.8s" }} />
          <circle cx="328" cy="458" r="3" fill="var(--sky)" className="sc-twinkle" style={{ animationDelay: "1.6s" }} />
          <circle cx="316" cy="434" r="2" fill="var(--mint)" className="sc-twinkle" style={{ animationDelay: "2.1s" }} />
        </g>
        <path d="M306 428 Q 304 446 308 462" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round" />
      </g>

      {particles.map((particle) => (
        <g key={particle.id} transform={`translate(${particle.x} ${particle.y})`}>
          <path
            d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8 Z"
            fill="var(--honey)"
            className="sc-float-up"
            style={floatStyle(particle.delay)}
          />
        </g>
      ))}
    </g>
  );
}

const SHELF_BOOKS = [
  { x: 128, w: 20, h: 74, color: "#e7849d" },
  { x: 150, w: 26, h: 86, color: "#8fb6e8" },
  { x: 178, w: 18, h: 66, color: "#f2c66d" },
  { x: 198, w: 24, h: 80, color: "#9dd3a8" },
  { x: 224, w: 20, h: 70, color: "#b69cf0" },
];

export function Shelf() {
  return (
    <g>
      {/* Shadow cast on the wall */}
      <rect x="108" y="482" width="300" height="20" fill="url(#sc-contact)" opacity="0.6" transform="rotate(180 258 492)" />

      {SHELF_BOOKS.map((book) => (
        <g key={book.x}>
          <rect x={book.x} y={470 - book.h} width={book.w} height={book.h} rx="2" fill={book.color} stroke={EDGE} strokeWidth="1" />
          <rect x={book.x} y={470 - book.h} width={book.w * 0.3} height={book.h} rx="2" fill="#ffffff" opacity="0.2" />
          <rect x={book.x + 2} y={470 - book.h + 9} width={book.w - 4} height="3" fill="#fff6dc" opacity="0.65" />
          <rect x={book.x + 2} y={470 - book.h + 15} width={book.w - 4} height="1.5" fill="#fff6dc" opacity="0.5" />
          <rect x={book.x + 2} y="458" width={book.w - 4} height="2" fill="#000000" opacity="0.12" />
        </g>
      ))}
      <g transform="rotate(14 260 470)">
        <rect x="250" y="398" width="20" height="74" rx="2" fill="#f39c7a" stroke={EDGE} strokeWidth="1" />
        <rect x="250" y="398" width="6" height="74" fill="#ffffff" opacity="0.2" />
        <rect x="252" y="410" width="16" height="3" fill="#fff6dc" opacity="0.6" />
      </g>

      <StarJar />

      {/* Little cactus */}
      <rect x="356" y="426" width="18" height="34" rx="9" fill="var(--sc-plant)" />
      <rect x="356" y="426" width="7" height="34" rx="3.5" fill="#ffffff" opacity="0.18" />
      <g stroke="#ffffff" strokeWidth="1" opacity="0.5">
        <line x1="362" y1="434" x2="360" y2="432" />
        <line x1="368" y1="444" x2="370" y2="442" />
        <line x1="362" y1="452" x2="360" y2="450" />
      </g>
      <circle cx="365" cy="425" r="3" fill="#f5a3b5" />
      <path d="M352 454 H378 L374 472 H356 Z" fill="var(--sc-pot)" />
      <path d="M352 454 H362 L360 472 H356 Z" fill="#ffffff" opacity="0.15" />

      {/* The shelf plank */}
      <rect x="104" y="470" width="300" height="14" rx="3" fill="var(--sc-desk-1)" />
      <rect x="104" y="470" width="300" height="4" rx="2" fill="#ffffff" opacity="0.22" />
      <rect x="104" y="480" width="300" height="4" fill="#000000" opacity="0.15" />
      <path d="M140 484 L140 508 L162 484 Z" fill="var(--sc-desk-edge)" />
      <path d="M368 484 L368 508 L346 484 Z" fill="var(--sc-desk-edge)" />
    </g>
  );
}

export function WallClock() {
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
    const english = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const japanese = `${h < 12 ? "午前" : "午後"}${h % 12 || 12}時${m}分`;

    playSfx("chime");
    bump();
    speak(cx, 150, `It's ${english} · ${japanese}`);
  }

  return (
    <g className="sc-hit" onClick={tellTime}>
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 0%")}>
        <ellipse cx={cx + 6} cy={cy + 10} rx="66" ry="64" fill="var(--sc-shadow)" opacity="0.6" />

        <path d="M1312 196 L1306 152 L1342 176 Z" fill="var(--sc-mug)" />
        <path d="M1408 196 L1414 152 L1378 176 Z" fill="var(--sc-mug)" />
        <path d="M1316 186 L1313 164 L1330 176 Z" fill="#f5a3b5" opacity="0.8" />
        <path d="M1404 186 L1407 164 L1390 176 Z" fill="#f5a3b5" opacity="0.8" />

        <circle cx={cx} cy={cy} r="66" fill="var(--sc-mug)" />
        <circle cx={cx} cy={cy} r="66" fill="url(#sc-metal)" opacity="0.6" />
        <circle cx={cx} cy={cy} r="54" fill="var(--sc-paper)" />
        <circle cx={cx} cy={cy} r="54" fill="none" stroke={EDGE} strokeWidth="1.2" />

        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index * 30 * Math.PI) / 180;
          const major = index % 3 === 0;
          const r1 = major ? 40 : 45;

          return (
            <line
              key={index}
              x1={(cx + Math.sin(angle) * r1).toFixed(2)}
              y1={(cy - Math.cos(angle) * r1).toFixed(2)}
              x2={(cx + Math.sin(angle) * 49).toFixed(2)}
              y2={(cy - Math.cos(angle) * 49).toFixed(2)}
              stroke="#5a4a5e"
              strokeWidth={major ? 3 : 1.4}
              strokeLinecap="round"
            />
          );
        })}

        <g strokeLinecap="round">
          <line x1={cx} y1={cy} x2={cx} y2={cy - 27} stroke="#3e3346" strokeWidth="4.5" transform={`rotate(${hourAngle} ${cx} ${cy})`} />
          <line x1={cx} y1={cy} x2={cx} y2={cy - 40} stroke="#3e3346" strokeWidth="3" transform={`rotate(${minuteAngle} ${cx} ${cy})`} />
          <line x1={cx} y1={cy + 8} x2={cx} y2={cy - 44} stroke="var(--sakura)" strokeWidth="1.6" transform={`rotate(${secondAngle} ${cx} ${cy})`} />
        </g>
        <circle cx={cx} cy={cy} r="4" fill="var(--sakura)" />

        {/* Glass reflection */}
        <path d="M1318 222 A 46 46 0 0 1 1352 190" stroke="#ffffff" strokeWidth="5" fill="none" opacity="0.45" strokeLinecap="round" />
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

export function Corkboard() {
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
      <rect x="1270" y="372" width="200" height="150" rx="8" fill="var(--sc-shadow)" transform="translate(6 8)" opacity="0.6" />
      <rect x="1270" y="372" width="200" height="150" rx="8" fill="#b98a63" />
      <rect x="1270" y="372" width="200" height="150" rx="8" fill="url(#sc-metal)" opacity="0.4" />
      <rect x="1280" y="382" width="180" height="130" rx="4" fill="var(--sc-cork)" />
      <g fill="#000000" opacity="0.1">
        {[[1290, 400], [1320, 480], [1410, 395], [1440, 470], [1360, 500], [1300, 450], [1450, 420]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />
        ))}
      </g>

      <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 0%")}>
        <g transform="rotate(-6 1312 418)">
          <rect x="1288" y="392" width="50" height="50" fill="#ffe08a" />
          <path d="M1288 392 h50 v6 h-50 Z" fill="#000000" opacity="0.06" />
          <path d="M1295 408 q 8 -3 16 0 t 16 0 M1295 418 q 7 -3 13 0 t 12 0 M1295 428 q 8 -3 16 0" stroke="#7a6a50" strokeWidth="1.2" fill="none" opacity="0.6" />
        </g>
        <g transform="rotate(5 1372 420)">
          <rect x="1348" y="394" width="50" height="50" fill="#ffc6d8" />
          <path d="M1362 410 q 6 -6 12 0 q 6 -6 12 0 q 0 10 -12 18 q -12 -8 -12 -18 z" fill="var(--sakura)" />
        </g>
        <g transform="rotate(-3 1432 446)">
          <rect x="1406" y="402" width="50" height="62" fill="#fffdf8" />
          <rect x="1411" y="407" width="40" height="40" fill="#a9c9ea" />
          <path d="M1411 437 L1424 424 L1434 432 L1446 420 L1451 426 V447 H1411 Z" fill="#6f9b5e" />
          <circle cx="1442" cy="415" r="4.5" fill="#fff4d6" />
        </g>
        <g transform="rotate(4 1320 476)">
          <rect x="1294" y="452" width="56" height="46" fill="#b8ecd6" />
          <path d="M1301 466 h36 M1301 476 h28 M1301 486 h32" stroke="#4f7a68" strokeWidth="1.2" opacity="0.5" />
          <circle cx="1340" cy="466" r="5" fill="none" stroke="#e2344f" strokeWidth="1.4" />
        </g>
      </g>

      {[[1313, 396, "#ff5d7a"], [1373, 398, "var(--sky)"], [1431, 405, "var(--mint)"], [1322, 455, "var(--honey)"]].map(([x, y, color]) => (
        <g key={`${x}`}>
          <circle cx={x as number} cy={y as number} r="4" fill={color as string} />
          <circle cx={(x as number) - 1.2} cy={(y as number) - 1.2} r="1.2" fill="#ffffff" opacity="0.8" />
        </g>
      ))}
    </g>
  );
}
