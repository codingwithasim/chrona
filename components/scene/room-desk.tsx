"use client";

import { useState } from "react";

import { playSfx } from "@/lib/sfx";
import { useSceneStore } from "@/stores/scene-store";

import {
  DESK_Y,
  EDGE,
  mulberry32,
  pivot,
  usePoke,
  useSpeak,
} from "./scene-shared";

/* ------------------------------------------------------------------ */
/* Wooden desk                                                         */
/* ------------------------------------------------------------------ */

const PLANKS = [
  { y0: DESK_Y, y1: 814 },
  { y0: 814, y1: 860 },
  { y0: 860, y1: 906 },
];

function grain(seed: number) {
  const random = mulberry32(seed);

  return PLANKS.flatMap((plank) => {
    const lines: Array<{ d: string; opacity: number; width: number }> = [];
    const count = 7;

    for (let i = 0; i < count; i++) {
      const y = plank.y0 + ((i + 0.5) / count) * (plank.y1 - plank.y0) + (random() - 0.5) * 3;
      let d = `M0 ${y.toFixed(1)}`;

      for (let x = 0; x < 1600; x += 200) {
        const wobble = (random() - 0.5) * 5;
        d += ` Q ${x + 100} ${(y + wobble).toFixed(1)} ${x + 200} ${(y + (random() - 0.5) * 2).toFixed(1)}`;
      }

      lines.push({ d, opacity: 0.08 + random() * 0.14, width: 0.6 + random() * 1.1 });
    }

    return lines;
  });
}

const GRAIN = grain(7);

const KNOTS = [
  { x: 330, y: 838, rx: 14, ry: 5 },
  { x: 1060, y: 790, rx: 10, ry: 4 },
  { x: 1380, y: 884, rx: 16, ry: 5 },
];

export function Desk() {
  return (
    <g>
      {/* Contact shadow where the desk meets the wall */}
      <rect x="0" y={DESK_Y - 26} width="1600" height="26" fill="url(#sc-contact)" />

      <rect x="0" y={DESK_Y} width="1600" height="136" fill="url(#sc-desk)" />

      {PLANKS.map((plank) => (
        <rect
          key={plank.y0}
          x="0"
          y={plank.y0}
          width="1600"
          height={plank.y1 - plank.y0}
          fill="url(#sc-plank)"
          opacity="0.35"
        />
      ))}

      <g fill="none" stroke="var(--sc-desk-edge)" strokeLinecap="round">
        {GRAIN.map((line, index) => (
          <path key={index} d={line.d} strokeWidth={line.width} opacity={line.opacity} />
        ))}
      </g>

      <g fill="none" stroke="var(--sc-desk-edge)" opacity="0.3">
        {KNOTS.map((knot) => (
          <g key={knot.x}>
            <ellipse cx={knot.x} cy={knot.y} rx={knot.rx} ry={knot.ry} strokeWidth="1.2" />
            <ellipse cx={knot.x} cy={knot.y} rx={knot.rx * 0.6} ry={knot.ry * 0.55} strokeWidth="1" />
            <ellipse cx={knot.x} cy={knot.y} rx={knot.rx * 0.25} ry={knot.ry * 0.3} fill="var(--sc-desk-edge)" />
          </g>
        ))}
      </g>

      {/* Plank seams */}
      {[814, 860].map((y) => (
        <g key={y}>
          <line x1="0" y1={y} x2="1600" y2={y} stroke="#000000" strokeWidth="1.4" opacity="0.14" />
          <line x1="0" y1={y + 1.5} x2="1600" y2={y + 1.5} stroke="#ffffff" strokeWidth="1" opacity="0.12" />
        </g>
      ))}

      <line x1="0" y1={DESK_Y} x2="1600" y2={DESK_Y} stroke="#000000" strokeWidth="2" opacity="0.2" />

      {/* Bevelled front edge */}
      <rect x="0" y="906" width="1600" height="26" fill="url(#sc-desk-edge)" />
      <line x1="0" y1="906.5" x2="1600" y2="906.5" stroke="#ffffff" strokeWidth="1.6" opacity="0.35" />

      {/* Drawers */}
      <rect x="0" y="932" width="1600" height="68" fill="var(--sc-desk-front)" />
      <line x1="0" y1="932" x2="1600" y2="932" stroke="#000000" strokeWidth="2" opacity="0.25" />
      <g fill="none" stroke="#000000" strokeWidth="1.5" opacity="0.18">
        <rect x="140" y="944" width="340" height="60" rx="4" />
        <rect x="1120" y="944" width="340" height="60" rx="4" />
      </g>
      {[311, 1291].map((x) => (
        <g key={x}>
          <rect x={x - 35} y="958" width="70" height="9" rx="4.5" fill="#c79a52" />
          <rect x={x - 35} y="958" width="70" height="3" rx="1.5" fill="#fff2c4" opacity="0.6" />
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

const FORTUNES = [
  "大吉 Great blessing! Your focus will be legendary today.",
  "中吉 Middle blessing. A good day to finish that one task.",
  "小吉 Small blessing. Small steps still count — try one pomodoro.",
  "吉 Blessing. Tea first, then greatness.",
  "末吉 Future blessing. Things get better after the rain.",
  "凶 Bad luck… but cats cancel bad luck. You're safe.",
];

export function Notebook() {
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
        speak(530, 800, `🎋 Omikuji: ${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}`);
      }}
    >
      <ellipse cx="535" cy="892" rx="110" ry="9" fill="url(#sc-drop-shadow)" />

      <g key={poke} className={poke ? "sc-hop" : undefined} style={pivot("50% 100%")}>
        {/* Page edges */}
        <path d="M436 826 L530 816 L536 888 L428 896 Z" fill="#e8ded2" />
        <path d="M530 816 L626 824 L638 894 L536 888 Z" fill="#e8ded2" />

        <path d="M440 822 L530 812 L536 884 L432 892 Z" fill="url(#sc-page-left)" />
        <path d="M530 812 L622 820 L632 890 L536 884 Z" fill="url(#sc-page-right)" />
        <path d="M530 812 L536 884" stroke="#000000" strokeWidth="1" opacity="0.15" />

        <g stroke="var(--lavender)" strokeWidth="1" opacity="0.45">
          <path d="M446 836 L526 828" />
          <path d="M446 849 L528 841" />
          <path d="M445 862 L529 855" />
          <path d="M444 875 L530 868" />
          <path d="M541 830 L616 836" />
          <path d="M542 843 L618 849" />
          <path d="M542 856 L620 862" />
          <path d="M543 869 L622 875" />
        </g>

        {/* Handwriting */}
        <path d="M452 832 q 5 -5 10 0 t 10 0 t 10 0 t 10 0 M452 845 q 5 -5 10 0 t 10 0 t 10 0 M452 858 q 5 -5 10 0 t 10 0 t 10 0 t 10 0 t 10 0" stroke="#5b5a8e" strokeWidth="1.2" fill="none" opacity="0.65" />

        {/* A doodle of Mochi */}
        <g stroke="var(--sakura)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M566 852 q 14 -14 28 0 q 0 14 -14 16 q -14 -2 -14 -16 Z" />
          <path d="M568 846 l 4 -9 l 5 7 M592 846 l -4 -9 l -5 7" />
          <path d="M574 856 q 2 2 4 0 M582 856 q 2 2 4 0 M578 861 q 2 2 4 0" />
        </g>

        {/* Ribbon bookmark */}
        <path d="M528 813 L534 813 L540 904 L535 898 L531 906 Z" fill="#e2344f" />
      </g>
    </g>
  );
}

export function Pencil() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("click");
        bump();
      }}
    >
      <ellipse cx="616" cy="870" rx="56" ry="5" fill="url(#sc-drop-shadow)" />
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 50%")}>
        <g transform="rotate(-20 620 860)">
          <rect x="568" y="853" width="92" height="4" fill="#f9d77a" />
          <rect x="568" y="857" width="92" height="4" fill="#f2c14e" />
          <rect x="568" y="861" width="92" height="3" fill="#d9a43a" />
          <rect x="660" y="853" width="12" height="11" fill="#c8c8d4" />
          <rect x="660" y="853" width="12" height="3" fill="#ffffff" opacity="0.6" />
          <line x1="663" y1="853" x2="663" y2="864" stroke="#8a8a9a" strokeWidth="0.8" />
          <line x1="668" y1="853" x2="668" y2="864" stroke="#8a8a9a" strokeWidth="0.8" />
          <rect x="672" y="853" width="10" height="11" rx="2" fill="#f5a3b5" />
          <path d="M568 853 L552 858.5 L568 864 Z" fill="#f0d2a4" />
          <path d="M556 857 L552 858.5 L556 860 Z" fill="#4a4a4a" />
        </g>
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

export function Mug() {
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
      <ellipse cx="738" cy="878" rx="52" ry="8" fill="url(#sc-drop-shadow)" />

      <g key={poke} className={poke ? "sc-hop" : undefined} style={pivot("50% 100%")}>
        {/* Handle */}
        <path d="M772 820 C 804 818 804 858 772 854" fill="none" stroke="var(--sc-mug)" strokeWidth="9" strokeLinecap="round" />
        <path d="M774 822 C 798 822 798 852 774 850" fill="none" stroke="#000000" strokeWidth="2" opacity="0.12" />

        {/* Body */}
        <path d="M700 806 H772 V858 Q772 874 756 874 H716 Q700 874 700 858 Z" fill="url(#sc-mug-body)" />
        <path d="M700 806 H772 V858 Q772 874 756 874 H716 Q700 874 700 858 Z" fill="none" stroke={EDGE} strokeWidth="1" />

        {/* Rim and tea */}
        <ellipse cx="736" cy="806" rx="36" ry="8" fill="var(--sc-mug)" />
        <ellipse cx="736" cy="807" rx="32" ry="6" fill={level > 0 ? "url(#sc-tea)" : "#d9c6c0"} />
        {level > 0 && <ellipse cx="726" cy="805" rx="8" ry="1.6" fill="#ffffff" opacity="0.35" />}

        {/* Sakura decal */}
        <g transform="translate(742 840)">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse key={angle} cx="0" cy="-6" rx="4" ry="6" fill="#ffffff" transform={`rotate(${angle})`} />
          ))}
          <circle r="2.8" fill="var(--honey)" />
        </g>

        {/* Tea bag string and tag */}
        {level > 0 && (
          <g>
            <path d="M760 806 Q 770 812 776 826" stroke="#e8e0d4" strokeWidth="1" fill="none" />
            <rect x="770" y="826" width="12" height="14" rx="1.5" fill="#f4d98a" transform="rotate(8 776 833)" />
          </g>
        )}
      </g>

      {level > 0 && (
        <g fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.5">
          {[722, 738, 752].map((x, index) => (
            <path
              key={x}
              d={`M${x} 796 c -8 -10 8 -18 0 -28 c -8 -10 6 -18 0 -26`}
              className="sc-steam"
              style={{ animationDelay: `${index * 1.1}s`, ...pivot("50% 100%") }}
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
          style={pivot("50% 50%")}
        />
      )}
    </g>
  );
}

export function Books() {
  const [poke, bump] = usePoke();

  const stack = [
    { x: 1176, y: 852, w: 162, h: 26, color: "#8fb6e8" },
    { x: 1186, y: 828, w: 140, h: 24, color: "#e7849d" },
    { x: 1196, y: 808, w: 118, h: 20, color: "#b69cf0" },
  ];

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("pop");
        bump();
      }}
    >
      <ellipse cx="1258" cy="882" rx="100" ry="8" fill="url(#sc-drop-shadow)" />

      {stack.map((book) => (
        <g key={book.y}>
          <rect x={book.x} y={book.y} width={book.w} height={book.h} rx="3" fill={book.color} />
          <rect x={book.x} y={book.y} width={book.w} height={book.h * 0.35} rx="3" fill="#ffffff" opacity="0.2" />
          <rect x={book.x + book.w - 14} y={book.y + 3} width="11" height={book.h - 6} fill="#fffaf2" />
          <g stroke="#c9b8a8" strokeWidth="0.6">
            {[0.3, 0.5, 0.7].map((t) => (
              <line key={t} x1={book.x + book.w - 14} y1={book.y + book.h * t} x2={book.x + book.w - 3} y2={book.y + book.h * t} />
            ))}
          </g>
          <rect x={book.x + 14} y={book.y + book.h / 2 - 1.5} width={book.w * 0.35} height="3" rx="1.5" fill="#fff6dc" opacity="0.6" />
          <rect x={book.x} y={book.y} width={book.w} height={book.h} rx="3" fill="none" stroke={EDGE} strokeWidth="0.8" />
        </g>
      ))}

      <g key={poke} className={poke ? "sc-hop" : undefined} style={pivot("50% 100%")}>
        <path d="M1236 788 H1270 L1266 808 H1240 Z" fill="var(--sc-pot)" />
        <path d="M1236 788 H1246 L1246 808 H1240 Z" fill="#ffffff" opacity="0.2" />
        <g>
          <ellipse cx="1244" cy="780" rx="9" ry="12" fill="var(--sc-plant)" transform="rotate(-30 1244 780)" />
          <ellipse cx="1262" cy="780" rx="9" ry="12" fill="var(--sc-plant-dark)" transform="rotate(30 1262 780)" />
          <ellipse cx="1253" cy="774" rx="8" ry="13" fill="var(--sc-plant)" />
          <ellipse cx="1250" cy="770" rx="3" ry="6" fill="#ffffff" opacity="0.25" />
        </g>
      </g>
    </g>
  );
}

/** Mochi's yarn ball. Rolls when batted or poked. */
export function YarnBall({ kick }: { kick: number }) {
  const [poke, bump] = usePoke();
  const key = kick + poke * 1000;

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("pop");
        bump();
      }}
    >
      <ellipse cx="1118" cy="879" rx="20" ry="4" fill="url(#sc-drop-shadow)" />
      <path d="M1100 872 C 1080 880 1060 878 1040 884" stroke="#f08aa3" strokeWidth="1.6" fill="none" opacity="0.8" />
      <g key={key} className={key ? "sc-roll" : undefined}>
        <g className={key ? "sc-roll-spin" : undefined} style={pivot("50% 50%")}>
          <circle cx="1118" cy="862" r="16" fill="#f5a3b5" />
          <g stroke="#e07a98" strokeWidth="1.4" fill="none" opacity="0.8">
            <path d="M1104 856 C 1112 852 1126 852 1132 860" />
            <path d="M1103 864 C 1112 870 1126 872 1133 864" />
            <path d="M1110 848 C 1106 858 1108 870 1116 877" />
            <path d="M1124 848 C 1130 858 1130 868 1124 877" />
          </g>
          <circle cx="1112" cy="855" r="4" fill="#ffffff" opacity="0.4" />
        </g>
      </g>
    </g>
  );
}

export function BigPlant() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <ellipse cx="1496" cy="900" rx="70" ry="8" fill="url(#sc-drop-shadow)" />
      <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 100%")}>
        <g>
          <path d="M1490 826 C 1470 760 1420 720 1376 702 C 1420 690 1480 720 1496 790" fill="var(--sc-plant-dark)" />
          <path d="M1494 826 C 1500 740 1540 680 1592 658 C 1592 720 1552 780 1500 826" fill="var(--sc-plant)" />
          <path d="M1488 828 C 1460 790 1440 760 1428 718 C 1470 740 1490 780 1494 826" fill="var(--sc-plant)" />
          <path d="M1496 826 C 1510 760 1520 700 1500 638 C 1536 680 1530 760 1500 828" fill="var(--sc-plant-dark)" />
        </g>
        <g stroke="#ffffff" strokeWidth="1.2" fill="none" opacity="0.28" strokeLinecap="round">
          <path d="M1494 820 C 1500 760 1530 700 1585 664" />
          <path d="M1492 820 C 1470 780 1450 750 1432 724" />
          <path d="M1498 822 C 1510 760 1514 700 1502 646" />
          <path d="M1490 820 C 1460 770 1420 732 1384 706" />
        </g>
        {/* Monstera splits */}
        <g stroke="var(--sc-wall-low)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6">
          <path d="M1556 700 L1544 716" />
          <path d="M1568 690 L1560 708" />
          <path d="M1430 716 L1446 724" />
        </g>
      </g>
      <path d="M1446 820 H1546 L1534 900 H1458 Z" fill="var(--sc-pot)" />
      <path d="M1446 820 H1470 L1474 900 H1458 Z" fill="#ffffff" opacity="0.16" />
      <path d="M1520 820 H1546 L1534 900 H1516 Z" fill="#000000" opacity="0.12" />
      <rect x="1440" y="812" width="112" height="14" rx="4" fill="var(--sc-pot)" />
      <rect x="1440" y="812" width="112" height="4" rx="2" fill="#ffffff" opacity="0.28" />
      <ellipse cx="1496" cy="816" rx="50" ry="4" fill="#4a3428" opacity="0.6" />
    </g>
  );
}

export function Lamp() {
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
      <ellipse cx="252" cy="878" rx="84" ry="11" fill="url(#sc-drop-shadow)" />

      {/* Base */}
      <ellipse cx="250" cy="866" rx="64" ry="15" fill="var(--sc-lamp-dark)" />
      <ellipse cx="250" cy="860" rx="56" ry="11" fill="var(--sc-lamp)" />
      <ellipse cx="236" cy="857" rx="26" ry="4" fill="#ffffff" opacity="0.35" />

      {/* Arm */}
      <g strokeLinecap="round" fill="none" strokeLinejoin="round">
        <path d="M250 856 L300 690 L398 622" stroke="var(--sc-lamp-dark)" strokeWidth="11" />
        <path d="M250 856 L300 690 L398 622" stroke="var(--sc-lamp)" strokeWidth="7" />
        <path d="M248 852 L297 692 L394 625" stroke="#ffffff" strokeWidth="2" opacity="0.45" />
      </g>
      <circle cx="300" cy="690" r="10" fill="var(--sc-lamp-dark)" />
      <circle cx="300" cy="690" r="4" fill="#d8d8e2" />
      <circle cx="298" cy="688" r="1.6" fill="#ffffff" />

      {/* Shade */}
      <g transform="translate(400 622) rotate(-28)">
        <path d="M-18 -12 L18 -12 L44 42 L-44 42 Z" fill="var(--sc-lamp)" />
        <path d="M-18 -12 L-4 -12 L-24 42 L-44 42 Z" fill="#ffffff" opacity="0.28" />
        <path d="M8 -12 L18 -12 L44 42 L26 42 Z" fill="#000000" opacity="0.12" />
        <ellipse cx="0" cy="42" rx="44" ry="9" fill={lampOn ? "#fff3cf" : "var(--sc-lamp-dark)"} />
        {lampOn && <ellipse cx="0" cy="42" rx="30" ry="5" fill="#ffffff" />}
        <rect x="-10" y="-22" width="20" height="12" rx="4" fill="var(--sc-lamp-dark)" />
      </g>
    </g>
  );
}
