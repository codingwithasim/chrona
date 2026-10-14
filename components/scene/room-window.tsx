"use client";

import { useState } from "react";

import type { Weather } from "@/lib/scene-time";
import { playSfx } from "@/lib/sfx";
import { useSceneStore } from "@/stores/scene-store";

import {
  EDGE,
  GLASS,
  GLASS_BOTTOM,
  GLASS_RIGHT,
  pivot,
  usePoke,
  useSpeak,
  WIN,
} from "./scene-shared";

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
    <g key={poke} className={poke ? "sc-swing" : undefined} style={pivot("50% 0%")}>
      <g className="sc-sway" style={pivot("50% 0%")}>
        <line x1="652" y1={GLASS.y} x2="652" y2="190" stroke={EDGE} strokeWidth="1.4" />
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
            stroke={EDGE}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M660 214 Q 668 246 682 262 Q 670 266 660 266 Q 664 240 654 214 Z" fill="#000000" opacity="0.06" />
          <circle cx="652" cy="206" r="19" fill="#fbf7f2" stroke={EDGE} strokeWidth="1.4" />
          <circle cx="646" cy="199" r="7" fill="#ffffff" opacity="0.8" />
          <rect x="636" y="219" width="32" height="6" rx="3" fill="var(--sakura)" />
          {sunny ? (
            <g fill="none" stroke="#4a3a52" strokeWidth="1.6" strokeLinecap="round">
              <path d="M641 205 Q 645 200 649 205" />
              <path d="M655 205 Q 659 200 663 205" />
            </g>
          ) : (
            <>
              <circle cx="645" cy="204" r="2.2" fill="#4a3a52" />
              <circle cx="659" cy="204" r="2.2" fill="#4a3a52" />
            </>
          )}
          <path
            d={sunny ? "M645 210 Q 652 218 659 210" : "M647 211 Q 652 215 657 211"}
            fill="none"
            stroke="#4a3a52"
            strokeWidth="1.4"
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
      <g key={poke} className={poke ? "sc-swing" : undefined} style={pivot("50% 0%")}>
        <g className="sc-sway" style={{ ...pivot("50% 0%"), animationDelay: "-2s" }}>
          <line x1="962" y1={GLASS.y} x2="962" y2="176" stroke={EDGE} strokeWidth="1.4" />
          <g
            className="sc-hit"
            onClick={() => {
              playSfx("furin");
              bump();
              speak(962, 168, "Chiriin~ 🎐 A cool summer breeze.");
            }}
          >
            <path d="M944 196 Q 944 176 962 176 Q 980 176 980 196 Z" fill="#e7f6ff" fillOpacity="0.7" stroke={EDGE} strokeWidth="1.2" />
            <path d="M949 194 Q 949 180 958 179" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.8" />
            <path d="M948 190 q 6 -6 12 0 q 6 6 12 0" fill="none" stroke="#ff6f8f" strokeWidth="2" />
            <circle cx="956" cy="184" r="2.5" fill="#ff6f8f" />
            <line x1="962" y1="196" x2="962" y2="212" stroke={EDGE} strokeWidth="1.2" />
            <rect x="954" y="212" width="16" height="44" rx="2" fill="#fff4b8" />
            <path d="M958 222 h8 M958 230 h6 M958 238 h8" stroke="var(--sakura)" strokeWidth="1.4" />
          </g>
        </g>
      </g>
    </g>
  );
}

export function WindowFrame({ onKnock }: { onKnock: () => void }) {
  return (
    <g>
      {/* Clicking the glass does something different in every weather */}
      <rect
        x={GLASS.x}
        y={GLASS.y}
        width={GLASS.w}
        height={GLASS.h}
        fill="transparent"
        style={{ pointerEvents: "auto", cursor: "pointer" }}
        onClick={onKnock}
      />

      {/* Glass: inner shadow, condensation and reflections */}
      <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height="26" fill="url(#sc-glass-inner)" />
      <rect x={GLASS.x} y={GLASS.y} width={GLASS.w} height={GLASS.h} fill="url(#sc-fog)" />
      <g fill="#ffffff" style={{ opacity: "var(--sc-glass-opacity)" }}>
        <path d={`M${GLASS.x + 40} ${GLASS.y} h70 L${GLASS.x} ${GLASS.y + 150} v-70 Z`} />
        <path d={`M${GLASS.x + 140} ${GLASS.y} h24 L${GLASS.x} ${GLASS.y + 230} v-24 Z`} />
        <path d={`M${GLASS_RIGHT - 120} ${GLASS_BOTTOM} h80 L${GLASS_RIGHT} ${GLASS_BOTTOM - 140} v60 Z`} />
      </g>
      <rect
        x={GLASS.x}
        y={GLASS.y}
        width={GLASS.w}
        height={GLASS.h}
        fill="url(#sc-frost)"
        style={{ opacity: "var(--sc-frost-opacity)", transition: "opacity 2s ease" }}
      />

      {/* Wooden frame */}
      <path
        d={`M${WIN.x} ${WIN.y}H${WIN.x + WIN.w}V${WIN.y + WIN.h}H${WIN.x}Z M${GLASS.x} ${GLASS.y}V${GLASS_BOTTOM}H${GLASS_RIGHT}V${GLASS.y}Z`}
        fillRule="evenodd"
        fill="url(#sc-wood)"
      />
      <g stroke="#000000" strokeWidth="0.8" opacity="0.08" fill="none">
        <path d={`M${WIN.x + 4} ${WIN.y + 8} H${WIN.x + WIN.w - 4}`} />
        <path d={`M${WIN.x + 6} ${WIN.y + 15} H${WIN.x + WIN.w - 30}`} />
        <path d={`M${WIN.x + 8} ${WIN.y + 30} V${WIN.y + WIN.h - 20}`} />
        <path d={`M${WIN.x + WIN.w - 9} ${WIN.y + 24} V${WIN.y + WIN.h - 30}`} />
      </g>
      <rect x={GLASS.x - 2} y={GLASS.y - 2} width={GLASS.w + 4} height={GLASS.h + 4} fill="none" stroke="var(--sc-frame-dark)" strokeWidth="4" />
      <line x1={WIN.x + 2} y1={WIN.y + 2} x2={WIN.x + WIN.w - 2} y2={WIN.y + 2} stroke="var(--sc-frame-light)" strokeWidth="3" />
      <line x1={WIN.x + 2} y1={WIN.y + 2} x2={WIN.x + 2} y2={WIN.y + WIN.h - 2} stroke="var(--sc-frame-light)" strokeWidth="2" opacity="0.7" />

      {/* Mullions */}
      <rect x="793" y={GLASS.y} width="14" height={GLASS.h} fill="url(#sc-wood)" />
      <line x1="794" y1={GLASS.y} x2="794" y2={GLASS_BOTTOM} stroke="var(--sc-frame-light)" strokeWidth="1.6" />
      <line x1="806" y1={GLASS.y} x2="806" y2={GLASS_BOTTOM} stroke="#000000" strokeWidth="1.6" opacity="0.18" />
      <rect x={GLASS.x} y="374" width={GLASS.w} height="13" fill="url(#sc-wood)" />
      <line x1={GLASS.x} y1="375" x2={GLASS_RIGHT} y2="375" stroke="var(--sc-frame-light)" strokeWidth="1.6" />
      <line x1={GLASS.x} y1="386" x2={GLASS_RIGHT} y2="386" stroke="#000000" strokeWidth="1.6" opacity="0.18" />

      <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill="none" stroke={EDGE} strokeWidth="1.5" />

      {/* Latch */}
      <rect x="1086" y="372" width="8" height="18" rx="3" fill="#d8b56a" />
      <rect x="1086" y="372" width="3" height="18" rx="1.5" fill="#ffffff" opacity="0.5" />

      <TeruTeruBozu />
      <Furin />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Sill                                                                */
/* ------------------------------------------------------------------ */

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
      <ellipse cx="1068" cy="646" rx="40" ry="5" fill="url(#sc-drop-shadow)" />
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 100%")}>
        <path d="M1066 610 C 1046 590 1040 566 1046 546 C 1060 566 1066 586 1066 610" fill="var(--sc-plant)" />
        <path d="M1066 610 C 1056 590 1050 572 1046 546" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.3" />
        <path d="M1068 610 C 1074 584 1092 566 1112 560 C 1102 584 1088 600 1068 610" fill="var(--sc-plant-dark)" />
        <path d="M1068 610 C 1080 590 1094 574 1112 560" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M1066 612 C 1060 588 1066 564 1082 548 C 1086 574 1078 596 1066 612" fill="var(--sc-plant)" />
        <path d="M1066 612 C 1068 590 1074 566 1082 548" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.3" />
      </g>
      <path d="M1040 612 H1096 L1088 646 H1048 Z" fill="var(--sc-pot)" />
      <path d="M1040 612 H1056 L1056 646 H1048 Z" fill="#ffffff" opacity="0.18" />
      <rect x="1036" y="606" width="64" height="10" rx="3" fill="var(--sc-pot)" />
      <rect x="1036" y="606" width="64" height="3" rx="1.5" fill="#ffffff" opacity="0.3" />
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
      <rect x="508" y="618" width="34" height="28" rx="7" fill="url(#sc-glass-ball)" stroke={EDGE} strokeWidth="1" />
      <rect x="516" y="628" width="18" height="16" rx="3" fill="#f3d58a" />
      <line x1="525" y1="628" x2="525" y2="622" stroke="#4a3a2a" strokeWidth="1.2" />
      {lit && (
        <g style={{ opacity: "var(--sc-fairy-opacity)" }}>
          <circle cx="525" cy="620" r="22" fill="#ffd27a" opacity="0.18" />
          <ellipse cx="525" cy="615" rx="4" ry="7" fill="#ffd27a" className="sc-twinkle" style={{ animationDuration: "1.4s" }} />
          <ellipse cx="525" cy="617" rx="1.8" ry="3.5" fill="#fff6dc" />
        </g>
      )}
    </g>
  );
}

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
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 100%")}>
        <g className="season-spring">
          <path d="M906 612 C 900 590 892 572 878 556 M904 596 C 914 580 926 572 940 566" stroke="#6b4b44" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {[[878, 556], [890, 568], [940, 566], [926, 574], [884, 578], [912, 586]].map(([x, y], index) => (
            <g key={index}>
              {[0, 72, 144, 216, 288].map((angle) => (
                <ellipse key={angle} cx={x} cy={y - 3.5} rx="2.6" ry="3.6" fill="#ffd0de" transform={`rotate(${angle} ${x} ${y})`} />
              ))}
              <circle cx={x} cy={y} r="1.6" fill="#ff7fa8" />
            </g>
          ))}
        </g>

        <g className="season-summer">
          <path d="M906 612 C 906 590 908 570 912 552" stroke="#3f9157" strokeWidth="3" fill="none" />
          <ellipse cx="924" cy="586" rx="10" ry="5" fill="#5fae6b" transform="rotate(-30 924 586)" />
          <g transform="translate(912 548)">
            {Array.from({ length: 12 }, (_, index) => (
              <ellipse key={index} cx="0" cy="-12" rx="4" ry="8" fill="#ffd34d" transform={`rotate(${index * 30})`} />
            ))}
            <circle r="7.5" fill="#7a4a2a" />
            <circle cx="-2" cy="-2" r="2.5" fill="#a46a3a" />
          </g>
        </g>

        <g className="season-autumn">
          {[[-18, 0], [-6, -10], [8, -4]].map(([dx, dy], index) => (
            <path
              key={index}
              d={`M906 612 C ${906 + dx / 2} 590 ${906 + dx} ${566 + dy} ${906 + dx * 1.4} ${548 + dy}`}
              stroke="#c9a46a"
              strokeWidth="2"
              fill="none"
            />
          ))}
          {[[880, 552], [900, 540], [918, 548]].map(([x, y], index) => (
            <ellipse key={index} cx={x} cy={y} rx="5" ry="12" fill="#f3dcae" transform={`rotate(${-20 + index * 20} ${x} ${y})`} />
          ))}
          <path d="M934 572 l 6 -10 l 2 8 l 8 -6 l -3 9 l 9 1 l -9 5 l 4 7 l -9 -3 l -2 8 l -4 -8 l -8 3 l 4 -7 Z" fill="#df5d3e" />
        </g>

        <g className="season-winter">
          <path d="M906 612 C 904 594 900 580 892 566 M904 600 C 914 590 922 584 932 580" stroke="#3f6b4f" strokeWidth="2.5" fill="none" />
          <ellipse cx="886" cy="574" rx="8" ry="4.5" fill="#3f8c6c" transform="rotate(-40 886 574)" />
          <ellipse cx="924" cy="590" rx="8" ry="4.5" fill="#3f8c6c" transform="rotate(20 924 590)" />
          <g transform="translate(892 562)">
            {[0, 72, 144, 216, 288].map((angle) => (
              <circle key={angle} cx="0" cy="-6" r="6" fill="#e2344f" transform={`rotate(${angle})`} />
            ))}
            <circle r="3.5" fill="#ffd34d" />
          </g>
          <g transform="translate(934 578)">
            {[0, 72, 144, 216, 288].map((angle) => (
              <circle key={angle} cx="0" cy="-5" r="5" fill="#ffffff" transform={`rotate(${angle})`} />
            ))}
            <circle r="3" fill="#ffd34d" />
          </g>
        </g>
      </g>

      <path d="M896 646 C 888 640 888 624 898 618 L 900 610 H 912 L 914 618 C 924 624 924 640 916 646 Z" fill="#9fd3ea" />
      <path d="M896 646 C 888 640 888 624 898 618 L 900 610 H 904 L 902 618 C 894 626 894 640 900 646 Z" fill="#ffffff" opacity="0.4" />
      <path d="M914 618 C 924 624 924 640 916 646 H 910 C 916 638 916 626 908 618 Z" fill="#000000" opacity="0.1" />
    </g>
  );
}

/** Autumn: persimmons ripening on the sill. */
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
      <ellipse cx="1002" cy="646" rx="34" ry="4" fill="url(#sc-drop-shadow)" />
      <g key={poke} className={poke ? "sc-hop" : undefined} style={pivot("50% 100%")}>
        {[[988, 634], [1016, 635], [1002, 620]].map(([x, y], index) => (
          <g key={index}>
            <ellipse cx={x} cy={y} rx="13" ry="11" fill="#f2863a" />
            <ellipse cx={x + 4} cy={y + 3} rx="9" ry="7" fill="#c9622a" opacity="0.4" />
            <ellipse cx={x - 4} cy={y - 4} rx="3.5" ry="2.2" fill="#ffffff" opacity="0.55" />
            <path d={`M${x - 6} ${y - 10} l 6 -3 l 6 3 l -6 2 Z`} fill="#4f8a3c" />
          </g>
        ))}
      </g>
    </g>
  );
}

export function Sill() {
  return (
    <g>
      <rect x="440" y="676" width="720" height="14" fill="var(--sc-shadow)" opacity="0.5" />
      <rect x="428" y="646" width="744" height="20" rx="4" fill="url(#sc-wood)" />
      <rect x="428" y="646" width="744" height="4" rx="2" fill="#ffffff" opacity="0.3" />
      <g stroke="#000000" strokeWidth="0.8" opacity="0.08">
        <path d="M440 656 C 600 653 800 659 1160 655" fill="none" />
        <path d="M450 661 C 650 658 900 664 1150 660" fill="none" />
      </g>
      <rect x="436" y="664" width="728" height="12" fill="var(--sc-frame-dark)" />
      <rect x="436" y="664" width="728" height="2" fill="#000000" opacity="0.12" />

      <SillPlant />
      <Candle />
      <SillVase />
      <Persimmons />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Curtains and lights                                                 */
/* ------------------------------------------------------------------ */

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
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 0%")}>
        <g className="sc-curtain" style={pivot("50% 0%")}>
          <path
            d="M372 96 L540 96 C 524 210 476 372 452 466 C 466 560 484 642 482 702 Q 470 708 458 703 Q 446 710 434 703 Q 422 710 410 703 Q 398 710 386 703 Q 380 704 380 704 C 384 612 392 526 398 466 C 384 356 374 210 372 96 Z"
            fill="url(#sc-curtain)"
          />
          {/* Light glowing through the fabric near the window */}
          <path
            d="M540 96 C 524 210 476 372 452 466 C 466 560 484 642 482 702 L 440 702 C 446 600 436 520 430 466 C 450 380 494 220 506 96 Z"
            fill="url(#sc-curtain-glow)"
            style={{ opacity: "calc(var(--sc-ray-opacity) * var(--sc-ray-weather) + 0.15)" }}
          />
          <g stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.18">
            <path d="M400 100 C 402 230 410 360 408 460" />
            <path d="M470 100 C 468 220 456 360 440 460" />
            <path d="M426 480 C 422 560 420 640 420 700" />
          </g>
          <g stroke="#000000" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.1">
            <path d="M436 100 C 438 230 432 360 424 460" />
            <path d="M500 100 C 490 220 466 360 446 460" />
            <path d="M448 480 C 452 560 458 640 460 702" />
          </g>
          {/* Lace hem */}
          <path
            d="M382 702 Q 386 712 394 704 Q 400 714 408 705 Q 414 715 422 706 Q 428 716 436 706 Q 442 716 450 705 Q 456 714 464 704 Q 470 712 480 702"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            opacity="0.55"
          />
          <rect x="390" y="456" width="70" height="17" rx="8.5" fill="var(--sakura)" />
          <rect x="390" y="456" width="70" height="5" rx="2.5" fill="#ffffff" opacity="0.3" />
          <circle cx="425" cy="464.5" r="6" fill="var(--honey)" />
          <path d="M425 470 L 421 492 L 429 492 Z" fill="var(--honey)" />
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

export function Curtains() {
  return (
    <g>
      <rect x="356" y="88" width="888" height="9" rx="4.5" fill="#8a6a50" />
      <rect x="356" y="88" width="888" height="3" rx="1.5" fill="#ffffff" opacity="0.3" />
      <circle cx="354" cy="92.5" r="11" fill="#8a6a50" />
      <circle cx="1246" cy="92.5" r="11" fill="#8a6a50" />
      <circle cx="350" cy="88" r="4" fill="#ffffff" opacity="0.3" />
      <circle cx="1242" cy="88" r="4" fill="#ffffff" opacity="0.3" />

      <Curtain />
      <Curtain mirrored />
    </g>
  );
}

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

    return { id: i, x, y, color: FAIRY_COLORS[i % FAIRY_COLORS.length], delay: (i * 0.37) % 2.8 };
  })
);

type FairyMode = "twinkle" | "steady" | "off";

const NEXT_FAIRY: Record<FairyMode, FairyMode> = {
  twinkle: "steady",
  steady: "off",
  off: "twinkle",
};

export function FairyLights() {
  const [mode, setMode] = useState<FairyMode>("twinkle");

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("click");
        setMode(NEXT_FAIRY[mode]);
      }}
    >
      <path d="M380 98 Q 590 192 800 104 Q 1010 192 1220 98" fill="none" stroke="transparent" strokeWidth="30" />
      <path d="M380 98 Q 590 192 800 104 Q 1010 192 1220 98" fill="none" stroke={EDGE} strokeWidth="1.2" />

      {mode !== "off" && (
        <g style={{ opacity: "var(--sc-fairy-opacity)" }}>
          {FAIRY_BULBS.map((bulb) => (
            <g key={bulb.id} className={mode === "twinkle" ? "sc-twinkle" : undefined} style={{ animationDelay: `${bulb.delay}s` }}>
              <circle cx={bulb.x} cy={bulb.y + 7} r="16" fill={bulb.color} opacity="0.22" />
              <circle cx={bulb.x} cy={bulb.y + 7} r="5" fill={bulb.color} />
              <circle cx={bulb.x - 1.5} cy={bulb.y + 5.5} r="1.6" fill="#ffffff" opacity="0.8" />
            </g>
          ))}
        </g>
      )}

      {FAIRY_BULBS.map((bulb) => (
        <g key={bulb.id}>
          {mode === "off" && <circle cx={bulb.x} cy={bulb.y + 7} r="4.5" fill="#d8d2dc" opacity="0.6" />}
          <rect x={bulb.x - 2.5} y={bulb.y - 1} width="5" height="4" rx="1" fill="#5a5260" />
        </g>
      ))}
    </g>
  );
}
