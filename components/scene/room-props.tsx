"use client";

import { useState } from "react";

import { useNow } from "@/hooks/use-now";
import { playSfx } from "@/lib/sfx";
import { playSound } from "@/lib/sounds";
import type { Weather } from "@/lib/scene-time";
import { useSceneStore } from "@/stores/scene-store";
import { useSettingsStore } from "@/stores/settings-store";

import { box, DESK, poly, project, scaleAt, type Vec3, WINDOW } from "./projection";
import { C } from "./room-palette";
import { floatStyle, pick, pivot, useParticles, usePoke, useSpeak } from "./scene-shared";

/** Draw in local units (100 = one world unit) standing at a world point. */
function At({ at, children }: { at: Vec3; children: React.ReactNode }) {
  const [x, y] = project(at);
  const s = scaleAt(at[2]) / 100;

  return <g transform={`translate(${x} ${y}) scale(${s.toFixed(3)})`}>{children}</g>;
}

/* ------------------------------------------------------------------ */
/* Desk lamp                                                           */
/* ------------------------------------------------------------------ */

export const LAMP_BULB: Vec3 = [1.86, -0.38, 9.3];

export function DeskLamp() {
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
      <At at={[2.3, DESK.top, 9.45]}>
        <ellipse cx="0" cy="2" rx="30" ry="6" fill="#000000" opacity="0.18" />
        <ellipse cx="0" cy="0" rx="24" ry="6" fill="#d9dee3" />
        <ellipse cx="-4" cy="-1" rx="14" ry="3" fill="#ffffff" opacity="0.7" />

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0 -2 L -6 -62 L -38 -86" stroke="#b7bfc6" strokeWidth="5" />
          <path d="M-1 -2 L -7 -62 L -39 -86" stroke="#ffffff" strokeWidth="1.6" opacity="0.7" />
        </g>
        <circle cx="-6" cy="-62" r="3.5" fill="#9aa4ad" />

        <g transform="translate(-40 -86) rotate(35)">
          <path d="M-9 -6 L9 -6 L20 18 L-20 18 Z" fill="#e8ecef" />
          <path d="M-9 -6 L0 -6 L-8 18 L-20 18 Z" fill="#ffffff" opacity="0.7" />
          <ellipse cx="0" cy="18" rx="20" ry="4.5" fill={lampOn ? "#fff4d2" : "#b7bfc6"} />
          {lampOn && <ellipse cx="0" cy="18" rx="12" ry="2.6" fill="#ffffff" />}
        </g>
      </At>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Notebook and pencil                                                 */
/* ------------------------------------------------------------------ */

const FORTUNES = [
  "大吉 Great blessing! Your focus will be legendary today.",
  "中吉 Middle blessing. A good day to finish that one task.",
  "小吉 Small blessing. Small steps still count.",
  "吉 Blessing. Tea first, then greatness.",
  "末吉 Future blessing. Things get better after the rain.",
  "凶 Bad luck… but cats cancel bad luck. You're safe.",
];

export function Notebook() {
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  const y = DESK.top + 0.004;
  const left = poly([-1.5, y, 8.86], [-1.0, y, 8.86], [-1.0, y, 9.46], [-1.5, y, 9.46]);
  const right = poly([-1.0, y, 8.86], [-0.5, y, 8.86], [-0.5, y, 9.46], [-1.0, y, 9.46]);

  const rule = (x0: number, x1: number, z: number) => {
    const [ax, ay] = project([x0, y, z]);
    const [bx, by] = project([x1, y, z]);
    return `M${ax} ${ay} L${bx} ${by}`;
  };

  const [px0, py0] = project([-0.85, y + 0.01, 8.98]);
  const [px1, py1] = project([-0.42, y + 0.01, 9.22]);
  const [bubbleX, bubbleY] = project([-1.0, -0.95, 9.1]);

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
        speak(bubbleX, bubbleY, `🎋 Omikuji: ${pick(FORTUNES)}`);
      }}
    >
      <g key={poke} className={poke ? "sc-hop" : undefined} style={pivot("50% 100%")}>
        <path d={poly([-1.52, y - 0.003, 8.84], [-0.48, y - 0.003, 8.84], [-0.48, y - 0.003, 9.48], [-1.52, y - 0.003, 9.48])} fill="#2f4a5e" />
        <path d={left} fill={C.paper} />
        <path d={right} fill="#f5f1e8" />
        <path d={`M${project([-1.0, y, 8.86]).join(" ")} L${project([-1.0, y, 9.46]).join(" ")}`} stroke="#cdbfae" strokeWidth="1" />
        <g stroke="#a9b8cc" strokeWidth="0.6" opacity="0.8">
          {[8.98, 9.08, 9.18, 9.28, 9.38].map((z) => (
            <path key={z} d={`${rule(-1.46, -1.04, z)} ${rule(-0.96, -0.54, z)}`} />
          ))}
        </g>
        <path d={rule(-1.42, -1.12, 9.03)} stroke="#4f5d7a" strokeWidth="0.8" strokeDasharray="3 2" />
        <path d={rule(-1.42, -1.18, 9.13)} stroke="#4f5d7a" strokeWidth="0.8" strokeDasharray="4 2" />
      </g>

      {/* Pencil */}
      <line x1={px0} y1={py0} x2={px1} y2={py1} stroke="#e8b84a" strokeWidth="3.5" strokeLinecap="butt" />
      <line x1={px0} y1={py0 - 0.8} x2={px1} y2={py1 - 0.8} stroke="#ffffff" strokeWidth="1" opacity="0.5" />
      <circle cx={px1} cy={py1} r="2" fill="#e49a8c" />
      <circle cx={px0} cy={py0} r="1.4" fill="#4a4a4a" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Mug                                                                 */
/* ------------------------------------------------------------------ */

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

  const at: Vec3 = [0.12, DESK.top, 9.05];
  const [bx, by] = project(at);
  const s = scaleAt(at[2]) / 100;

  function sip() {
    playSfx(level === 0 ? "pop" : "sip");
    setLevel(level === 0 ? 3 : level - 1);
    bump();
    speak(bx, by - 46 * s, SIP_LINES[level === 0 ? 0 : 4 - level]);
  }

  return (
    <g className="sc-hit" onClick={sip}>
      <At at={at}>
        <ellipse cx="2" cy="2" rx="18" ry="4" fill="#000000" opacity="0.2" />
        <g key={poke} className={poke ? "sc-hop" : undefined} style={pivot("50% 100%")}>
          <path d="M12 -20 C 22 -20 22 -8 12 -8" fill="none" stroke="#86ad97" strokeWidth="4" strokeLinecap="round" />
          <path d="M-12 -26 H12 V-3 Q12 1 8 1 H-8 Q-12 1 -12 -3 Z" fill="url(#rm-mug)" />
          <ellipse cx="0" cy="-26" rx="12" ry="3" fill="#9cc2ad" />
          <ellipse cx="0" cy="-25.6" rx="10.5" ry="2.3" fill={level > 0 ? "#8a5a3a" : "#d6dcd8"} />
          {level > 0 && (
            <>
              <path d="M7 -26 Q 10 -22 12 -16" stroke="#e8e0d4" strokeWidth="0.6" fill="none" />
              <rect x="10" y="-16" width="5" height="6" rx="0.6" fill="#e6cf8a" />
            </>
          )}
        </g>
        {level > 0 && (
          <g fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.55">
            {[-5, 0, 5].map((x, index) => (
              <path
                key={x}
                d={`M${x} -30 c -3 -4 3 -7 0 -11 c -3 -4 2 -7 0 -10`}
                className="sc-steam"
                style={{ animationDelay: `${index * 1.1}s`, ...pivot("50% 100%") }}
              />
            ))}
          </g>
        )}
      </At>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Little things on the desk                                           */
/* ------------------------------------------------------------------ */

export function PenCup() {
  return (
    <At at={[-0.32, DESK.top, 9.72]}>
      <g strokeLinecap="round">
        <line x1="-3" y1="-16" x2="-7" y2="-34" stroke="#3f5d84" strokeWidth="2" />
        <line x1="1" y1="-16" x2="2" y2="-36" stroke="#e8b84a" strokeWidth="2" />
        <line x1="4" y1="-16" x2="9" y2="-31" stroke="#8a4b45" strokeWidth="2" />
      </g>
      <path d="M-8 -18 H8 L7 0 H-7 Z" fill="#7d8fa3" />
      <path d="M-8 -18 H-3 L-3 0 H-7 Z" fill="#ffffff" opacity="0.25" />
      <ellipse cx="0" cy="-18" rx="8" ry="2" fill="#5f6f82" />
    </At>
  );
}

export function Succulent() {
  return (
    <At at={[1.82, DESK.top, 9.8]}>
      <path d="M-9 -12 H9 L7 0 H-7 Z" fill={C.pot} />
      <path d="M-9 -12 H-3 L-3 0 H-7 Z" fill="#ffffff" opacity="0.2" />
      {[[-6, -18, -30], [6, -18, 30], [0, -21, 0], [-3, -15, -60], [3, -15, 60]].map(([x, y, angle]) => (
        <ellipse key={`${x}${angle}`} cx={x} cy={y} rx="3.4" ry="7" fill={angle === 0 ? C.plant : C.plantDark} transform={`rotate(${angle} ${x} ${y})`} />
      ))}
    </At>
  );
}

/** A tiny flip clock showing the real time. */
export function FlipClock() {
  const now = useNow();
  const hour24 = useSceneStore((state) => state.hour24);

  const hours = now ? (hour24 ? now.getHours() : now.getHours() % 12 || 12) : 12;
  const minutes = now ? now.getMinutes() : 0;

  const face = box(0.5, 0.92, DESK.top, DESK.top + 0.17, 9.2, 9.36);
  const [x0, y0] = project([0.53, DESK.top + 0.155, 9.2]);
  const [x1, y1] = project([0.89, DESK.top + 0.02, 9.2]);
  const w = (x1 - x0) / 2 - 1;

  return (
    <g>
      <path d={face.top} fill="#d9d4c8" />
      <path d={face.left} fill="#b9b2a4" />
      <path d={face.front} fill="#e9e4d8" />
      {[String(hours).padStart(2, "0"), String(minutes).padStart(2, "0")].map((text, index) => (
        <g key={index}>
          <rect x={x0 + index * (w + 2)} y={y0} width={w} height={y1 - y0} rx="1.5" fill="#2e3440" />
          <line x1={x0 + index * (w + 2)} y1={(y0 + y1) / 2} x2={x0 + index * (w + 2) + w} y2={(y0 + y1) / 2} stroke="#000000" strokeWidth="0.6" />
          <text
            x={x0 + index * (w + 2) + w / 2}
            y={y1 - 3}
            textAnchor="middle"
            fontSize={(y1 - y0) * 0.78}
            fill="#e9eef4"
            style={{ fontFamily: "var(--font-zen)" }}
            fontWeight="700"
          >
            {text}
          </text>
        </g>
      ))}
    </g>
  );
}

const RADIO_TUNES = ["kalimba", "music-box", "marimba", "koto"] as const;

/** A little radio that plays a tune when poked. */
export function Radio() {
  const toneVolume = useSettingsStore((state) => state.toneVolume);
  const [playing, setPlaying] = useState(false);
  const [notes, burst] = useParticles(2200);

  const body = box(0.98, 1.56, DESK.top, DESK.top + 0.32, 9.55, 9.82);
  const [gx, gy] = project([1.2, DESK.top + 0.16, 9.55]);
  const [dx, dy] = project([1.44, DESK.top + 0.22, 9.55]);
  const [ax, ay] = project([1.5, DESK.top + 0.32, 9.7]);

  return (
    <g
      className="sc-hit"
      onClick={() => {
        if (playing) {
          return;
        }

        setPlaying(true);
        playSound(pick(RADIO_TUNES), { volume: toneVolume * 0.6 });
        burst(gx, gy - 30, 4, 50);
        window.setTimeout(() => setPlaying(false), 2600);
      }}
    >
      <line x1={ax} y1={ay} x2={ax + 26} y2={ay - 34} stroke="#9aa4ad" strokeWidth="1.2" />
      <path d={body.top} fill="#e9dfc9" />
      <path d={body.left} fill="#b9ad94" />
      <path d={body.front} fill="#8fb3a8" />
      <circle cx={gx} cy={gy} r="11" fill="#6c8c82" />
      <g fill="#4f6b62">
        {[-6, 0, 6].flatMap((oy) => [-6, 0, 6].map((ox) => <circle key={`${ox}${oy}`} cx={gx + ox} cy={gy + oy} r="1.4" />))}
      </g>
      <rect x={dx - 9} y={dy - 4} width="18" height="7" rx="1.5" fill="#f3ead2" />
      <line x1={dx - 3} y1={dy - 4} x2={dx - 3} y2={dy + 3} stroke="#c45a3a" strokeWidth="1" />
      <circle cx={dx - 5} cy={dy + 13} r="3" fill="#3c4a46" />
      <circle cx={dx + 5} cy={dy + 13} r="3" fill="#3c4a46" />
      {playing && <circle cx={dx + 12} cy={dy - 3} r="1.6" fill="#7fe0a0" />}

      {notes.map((note) => (
        <text
          key={note.id}
          x={note.x}
          y={note.y}
          fontSize="16"
          fill="#3f5d84"
          className="sc-float-up"
          style={floatStyle(note.delay)}
        >
          ♪
        </text>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Window sill                                                         */
/* ------------------------------------------------------------------ */

const SILL_Y = WINDOW.bottom;
const SILL_Z = 9.96;

export function SillPlant() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <At at={[2.4, SILL_Y, SILL_Z]}>
        <ellipse cx="0" cy="1" rx="16" ry="3" fill="#000000" opacity="0.15" />
        <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 100%")}>
          <path d="M0 -20 C -10 -30 -14 -44 -10 -56 C -2 -44 0 -32 0 -20" fill={C.plant} />
          <path d="M1 -20 C 6 -34 16 -42 26 -44 C 20 -32 12 -24 1 -20" fill={C.plantDark} />
          <path d="M0 -21 C -3 -34 0 -48 8 -56 C 10 -42 6 -30 0 -21" fill={C.plant} />
          <path d="M0 -20 C -12 -26 -20 -34 -24 -40 C -12 -36 -6 -30 0 -20" fill={C.plantDark} />
        </g>
        <path d="M-12 -20 H12 L9 0 H-9 Z" fill={C.pot} />
        <path d="M-12 -20 H-5 L-4 0 H-9 Z" fill="#ffffff" opacity="0.2" />
        <rect x="-13" y="-23" width="26" height="5" rx="1.5" fill={C.pot} />
      </At>
    </g>
  );
}

export function Candle() {
  const [lit, setLit] = useState(true);

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx(lit ? "rustle" : "pop");
        setLit(!lit);
      }}
    >
      <At at={[-2.4, SILL_Y, SILL_Z]}>
        <rect x="-9" y="-16" width="18" height="16" rx="3" fill="url(#rm-glass)" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" />
        <rect x="-6" y="-11" width="12" height="10" rx="1.5" fill="#f1e2bf" />
        <line x1="0" y1="-11" x2="0" y2="-14" stroke="#4a3a2a" strokeWidth="0.8" />
        {lit && (
          <g style={{ opacity: "var(--sc-fairy-opacity)" }}>
            <circle cx="0" cy="-16" r="14" fill="#ffd27a" opacity="0.2" />
            <ellipse cx="0" cy="-17" rx="2.2" ry="4" fill="#ffd27a" className="sc-twinkle" style={{ animationDuration: "1.4s" }} />
            <ellipse cx="0" cy="-16" rx="1" ry="2" fill="#fff6dc" />
          </g>
        )}
      </At>
    </g>
  );
}

export function SillVase() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <At at={[1.05, SILL_Y, SILL_Z]}>
        <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 100%")}>
          <g className="season-spring">
            <path d="M0 -18 C -3 -30 -8 -40 -16 -48 M0 -26 C 6 -34 12 -38 20 -40" stroke="#6b4b44" strokeWidth="1.6" fill="none" />
            {[[-16, -48], [-10, -42], [20, -40], [12, -36], [-6, -34], [4, -44]].map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r="3.4" fill="#f7d3dd" />
            ))}
          </g>
          <g className="season-summer">
            <path d="M0 -18 C 0 -30 1 -40 3 -48" stroke="#4f8a4a" strokeWidth="2" fill="none" />
            <g transform="translate(3 -50)">
              {Array.from({ length: 10 }, (_, index) => (
                <ellipse key={index} cx="0" cy="-7" rx="2.6" ry="5" fill="#f2c94c" transform={`rotate(${index * 36})`} />
              ))}
              <circle r="4.5" fill="#7a4a2a" />
            </g>
          </g>
          <g className="season-autumn">
            {[-10, -2, 7].map((dx) => (
              <path key={dx} d={`M0 -18 C ${dx / 2} -30 ${dx} -40 ${dx * 1.3} -52`} stroke="#c9a46a" strokeWidth="1.4" fill="none" />
            ))}
            {[[-13, -52], [-3, -58], [9, -52]].map(([x, y], index) => (
              <ellipse key={index} cx={x} cy={y} rx="3" ry="8" fill="#eedcb4" transform={`rotate(${-15 + index * 15} ${x} ${y})`} />
            ))}
          </g>
          <g className="season-winter">
            <path d="M0 -18 C -1 -30 -4 -38 -8 -44 M0 -26 C 6 -32 10 -34 15 -36" stroke="#3f6b4f" strokeWidth="1.6" fill="none" />
            {[[-8, -46, "#d64545"], [15, -38, "#fbfaf6"]].map(([x, y, color]) => (
              <g key={`${x}`} transform={`translate(${x} ${y})`}>
                {[0, 72, 144, 216, 288].map((angle) => (
                  <circle key={angle} cx="0" cy="-3.6" r="3.6" fill={color as string} transform={`rotate(${angle})`} />
                ))}
                <circle r="2" fill="#f2c94c" />
              </g>
            ))}
          </g>
        </g>
        <path d="M-7 0 C -12 -4 -12 -14 -5 -18 L -4 -22 H 4 L 5 -18 C 12 -14 12 -4 7 0 Z" fill="#8fb8d0" />
        <path d="M-7 0 C -12 -4 -12 -14 -5 -18 L -4 -22 H -1 L -2 -18 C -8 -14 -8 -4 -4 0 Z" fill="#ffffff" opacity="0.4" />
      </At>
    </g>
  );
}

export function Persimmons() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="season-autumn sc-hit"
      onClick={() => {
        playSfx("pop");
        bump();
      }}
    >
      <At at={[1.75, SILL_Y, SILL_Z]}>
        <g key={poke} className={poke ? "sc-hop" : undefined} style={pivot("50% 100%")}>
          {[[-9, -7], [9, -7], [0, -17]].map(([x, y], index) => (
            <g key={index}>
              <ellipse cx={x} cy={y} rx="9" ry="7.5" fill="#e98a3c" />
              <ellipse cx={x + 3} cy={y + 2} rx="6" ry="4.5" fill="#c9622a" opacity="0.35" />
              <ellipse cx={x - 3} cy={y - 3} rx="2.2" ry="1.4" fill="#ffffff" opacity="0.55" />
              <path d={`M${x - 4} ${y - 7} l 4 -2 l 4 2 l -4 1.5 Z`} fill="#4f8a3c" />
            </g>
          ))}
        </g>
      </At>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Hanging in the window                                               */
/* ------------------------------------------------------------------ */

const WEATHER_LINES: Record<Weather, string> = {
  clear: "Teru teru bōzu worked! The sky cleared up~",
  drizzle: "A gentle drizzle again. Perfect for focusing.",
  storm: "Uh oh, a storm! Good thing we're inside~",
  snow: "Snow?! Everything's going quiet and soft…",
};

export function TeruTeruBozu() {
  const speak = useSpeak();
  const weather = useSceneStore((state) => state.weather);
  const cycleWeather = useSceneStore((state) => state.cycleWeather);
  const [poke, bump] = usePoke();

  const at: Vec3 = [-1.55, WINDOW.glass.top, 10.15];
  const [hx, hy] = project(at);
  const sunny = weather === "clear";

  return (
    <At at={at}>
      <g key={poke} className={poke ? "sc-swing" : undefined} style={pivot("50% 0%")}>
        <g className="sc-sway" style={pivot("50% 0%")}>
          <line x1="0" y1="0" x2="0" y2="40" stroke="#8a8f99" strokeWidth="1" />
          <g
            className="sc-hit"
            onClick={() => {
              const next = cycleWeather();
              playSfx("pop");
              bump();
              speak(hx, hy + 30, WEATHER_LINES[next]);
            }}
          >
            <path d="M-11 60 Q -16 82 -24 94 Q 0 100 24 94 Q 16 82 11 60 Z" fill="#fbfaf7" />
            <path d="M5 60 Q 10 82 18 94 Q 10 97 2 97 Q 6 80 0 60 Z" fill="#000000" opacity="0.06" />
            <circle cx="0" cy="54" r="13" fill="#fbfaf7" />
            <circle cx="-4" cy="49" r="5" fill="#ffffff" />
            <rect x="-11" y="63" width="22" height="3.5" rx="1.7" fill="#5d86b8" />
            {sunny ? (
              <g fill="none" stroke="#4a4f5a" strokeWidth="1.2" strokeLinecap="round">
                <path d="M-7 53 Q -4.5 49.5 -2 53" />
                <path d="M2 53 Q 4.5 49.5 7 53" />
              </g>
            ) : (
              <>
                <circle cx="-4.5" cy="52.5" r="1.6" fill="#4a4f5a" />
                <circle cx="4.5" cy="52.5" r="1.6" fill="#4a4f5a" />
              </>
            )}
            <path d={sunny ? "M-4.5 57 Q 0 62 4.5 57" : "M-3 58 Q 0 60.5 3 58"} fill="none" stroke="#4a4f5a" strokeWidth="1.1" strokeLinecap="round" />
            <ellipse cx="-8" cy="57" rx="2.2" ry="1.3" fill="#f0b3a8" opacity="0.8" />
            <ellipse cx="8" cy="57" rx="2.2" ry="1.3" fill="#f0b3a8" opacity="0.8" />
          </g>
        </g>
      </g>
    </At>
  );
}

export function Furin() {
  const speak = useSpeak();
  const [poke, bump] = usePoke();

  const at: Vec3 = [1.35, WINDOW.glass.top, 10.15];
  const [hx, hy] = project(at);

  return (
    <g className="season-summer">
      <At at={at}>
        <g key={poke} className={poke ? "sc-swing" : undefined} style={pivot("50% 0%")}>
          <g className="sc-sway" style={{ ...pivot("50% 0%"), animationDelay: "-2s" }}>
            <line x1="0" y1="0" x2="0" y2="36" stroke="#8a8f99" strokeWidth="1" />
            <g
              className="sc-hit"
              onClick={() => {
                playSfx("furin");
                bump();
                speak(hx, hy + 20, "Chiriin~ 🎐 A cool summer breeze.");
              }}
            >
              <path d="M-13 50 Q -13 36 0 36 Q 13 36 13 50 Z" fill="#e7f6ff" fillOpacity="0.8" />
              <path d="M-9 48 Q -9 40 -2 38" stroke="#ffffff" strokeWidth="1.6" fill="none" />
              <path d="M-9 45 q 4 -4 9 0 q 4 4 9 0" fill="none" stroke="#e05a4a" strokeWidth="1.6" />
              <line x1="0" y1="50" x2="0" y2="60" stroke="#8a8f99" strokeWidth="0.9" />
              <rect x="-6" y="60" width="12" height="30" rx="1.5" fill="#f6efd0" />
              <path d="M-3 67 h6 M-3 73 h5 M-3 79 h6" stroke="#5d86b8" strokeWidth="1" />
            </g>
          </g>
        </g>
      </At>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Mochi's yarn ball, on the rug                                       */
/* ------------------------------------------------------------------ */

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
      <ellipse cx="1118" cy="879" rx="20" ry="4" fill="#000000" opacity="0.2" />
      <path d="M1100 872 C 1080 880 1060 878 1040 884" stroke="#c9963e" strokeWidth="1.6" fill="none" opacity="0.8" />
      <g key={key} className={key ? "sc-roll" : undefined}>
        <g className={key ? "sc-roll-spin" : undefined} style={pivot("50% 50%")}>
          <circle cx="1118" cy="862" r="16" fill="#e2b04f" />
          <g stroke="#c08f34" strokeWidth="1.4" fill="none" opacity="0.85">
            <path d="M1104 856 C 1112 852 1126 852 1132 860" />
            <path d="M1103 864 C 1112 870 1126 872 1133 864" />
            <path d="M1110 848 C 1106 858 1108 870 1116 877" />
            <path d="M1124 848 C 1130 858 1130 868 1124 877" />
          </g>
          <circle cx="1112" cy="855" r="4" fill="#ffffff" opacity="0.35" />
        </g>
      </g>
    </g>
  );
}
