"use client";

import { useEffect, useState } from "react";

import { COFFEE_URL } from "@/lib/links";
import { playSfx } from "@/lib/sfx";
import { useResolvedScene } from "@/stores/scene-store";

import { box, project, ROOM, scaleAt, type Vec3, WINDOW } from "./projection";
import { C } from "./room-palette";
import { pivot, usePoke, useSpeak } from "./scene-shared";

const { floor: F, back: B } = ROOM;

/** Draw in local units (100 = one world unit) standing at a world point. */
function At({ at, children }: { at: Vec3; children: React.ReactNode }) {
  const [x, y] = project(at);
  const s = scaleAt(at[2]) / 100;

  return <g transform={`translate(${x} ${y}) scale(${s.toFixed(3)})`}>{children}</g>;
}

/* ------------------------------------------------------------------ */
/* A monstera in the corner                                            */
/* ------------------------------------------------------------------ */

/** One split leaf, drawn pointing up from its stem tip. */
function Leaf({ dark }: { dark?: boolean }) {
  return (
    <g>
      <path
        d="M0 0 C -20 -4 -32 -24 -24 -44 C -16 -60 -2 -62 0 -58 C 2 -62 16 -60 24 -44 C 32 -24 20 -4 0 0 Z"
        fill={dark ? C.plantDark : C.plant}
      />
      <path d="M0 -2 L0 -56" stroke="#ffffff" strokeWidth="1.4" opacity="0.25" />
      {/* The splits that make a monstera */}
      <g stroke={dark ? "#2f5a3f" : C.plantDark} strokeWidth="2.6" strokeLinecap="round" opacity="0.9">
        <path d="M-4 -14 L-22 -18" />
        <path d="M-4 -28 L-26 -34" />
        <path d="M-3 -42 L-18 -50" />
        <path d="M4 -16 L22 -20" />
        <path d="M4 -30 L25 -36" />
        <path d="M3 -44 L17 -51" />
      </g>
      <ellipse cx="-10" cy="-38" rx="6" ry="10" fill="#ffffff" opacity="0.12" transform="rotate(-20 -10 -38)" />
    </g>
  );
}

const LEAVES: Array<{ stem: string; tip: [number, number]; angle: number; scale: number; dark?: boolean; delay: number }> = [
  { stem: "M0 -40 C -10 -80 -30 -100 -46 -118", tip: [-46, -118], angle: -38, scale: 0.95, dark: true, delay: 0 },
  { stem: "M2 -40 C 8 -90 22 -112 38 -130", tip: [38, -130], angle: 32, scale: 1, delay: -1.6 },
  { stem: "M0 -40 C -2 -100 -6 -130 -8 -156", tip: [-8, -156], angle: -6, scale: 1.05, delay: -3.1 },
  { stem: "M0 -40 C -16 -64 -40 -74 -60 -78", tip: [-60, -78], angle: -70, scale: 0.85, delay: -4.4 },
  { stem: "M2 -40 C 18 -62 40 -70 58 -74", tip: [58, -74], angle: 68, scale: 0.8, dark: true, delay: -2.2 },
];

export function CornerPlant() {
  const [poke, bump] = usePoke();

  return (
    <g
      className="sc-hit"
      onClick={() => {
        playSfx("rustle");
        bump();
      }}
    >
      <At at={[-3.72, F, 9.5]}>
        <ellipse cx="2" cy="2" rx="34" ry="7" fill="#000000" opacity="0.18" />

        <g key={poke} className={poke ? "sc-rustle" : undefined} style={pivot("50% 100%")}>
          {LEAVES.map((leaf, index) => (
            <g key={index} className="sc-sway" style={{ ...pivot("50% 100%"), animationDuration: `${7 + index}s`, animationDelay: `${leaf.delay}s` }}>
              <path d={leaf.stem} fill="none" stroke="#5a7f4e" strokeWidth="3.4" strokeLinecap="round" />
              <g transform={`translate(${leaf.tip[0]} ${leaf.tip[1]}) rotate(${leaf.angle}) scale(${leaf.scale})`}>
                <Leaf dark={leaf.dark} />
              </g>
            </g>
          ))}
        </g>

        {/* A woven basket pot */}
        <path d="M-30 -44 H30 L24 0 H-24 Z" fill="#c9a77a" />
        <g stroke="#a98455" strokeWidth="1.6" opacity="0.7">
          <path d="M-29 -34 H29 M-28 -24 H28 M-26 -14 H26 M-25 -5 H25" />
        </g>
        <path d="M-30 -44 H-18 L-14 0 H-24 Z" fill="#ffffff" opacity="0.15" />
        <rect x="-33" y="-48" width="66" height="7" rx="3" fill="#b8925f" />
      </At>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Wall air conditioner                                                */
/* ------------------------------------------------------------------ */

const AC = { x0: 3.4, x1: 4.85, y0: 2.6, y1: 2.97, z0: B - 0.22, z1: B };

export function AirConditioner() {
  const speak = useSpeak();
  const { season } = useResolvedScene();
  const [on, setOn] = useState(false);

  // While it runs, the curtains catch the breeze.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-breeze", on);
    return () => document.documentElement.removeAttribute("data-breeze");
  }, [on]);

  const body = box(AC.x0, AC.x1, AC.y0, AC.y1, AC.z0, AC.z1);
  const [fx0, fy0] = project([AC.x0, AC.y1, AC.z0]);
  const [fx1, fy1] = project([AC.x1, AC.y0, AC.z0]);
  const w = fx1 - fx0;
  const h = fy1 - fy0;

  const heater = season === "winter" || season === "autumn";
  const air = heater ? "#ffc89a" : "#cfe8ff";

  function toggle() {
    playSfx("beep");
    setOn(!on);
    speak(fx0 + w / 2, fy1 + 70, on ? "Off. Nice and quiet again." : heater ? "Warm air, on. Toasty~" : "Cool breeze, on. Ahh~");
  }

  return (
    <g className="sc-hit" onClick={toggle}>
      {/* Soft shadow on the wall */}
      <rect x={fx0 + 4} y={fy0 + 8} width={w} height={h} rx="8" fill={C.shadow} opacity="0.7" />

      <path d={body.left} fill="#d9dcdc" />
      <path d={body.bottom} fill="#c9cdce" />
      <rect x={fx0} y={fy0} width={w} height={h} rx="8" fill="#f4f5f2" />
      <rect x={fx0} y={fy0} width={w} height={h * 0.45} rx="8" fill="#ffffff" opacity="0.6" />
      {/* Intake grille and the brand strip */}
      <g stroke="#d6d9d8" strokeWidth="1">
        {Array.from({ length: 5 }, (_, i) => (
          <line key={i} x1={fx0 + 10} y1={fy0 + 6 + i * 3} x2={fx1 - 10} y2={fy0 + 6 + i * 3} />
        ))}
      </g>
      <rect x={fx0 + w * 0.08} y={fy0 + h * 0.52} width={w * 0.14} height="2.4" rx="1.2" fill="#b9bfc2" />
      <circle cx={fx1 - 14} cy={fy0 + h * 0.56} r="2.2" fill={on ? "#6fd18a" : "#c7cccd"} className={on ? "sc-twinkle" : undefined} style={{ animationDuration: "3s" }} />

      {/* The louver: closed flat, or open and slowly swinging */}
      <g
        className={on ? "sc-louver" : undefined}
        style={{ ...pivot("50% 0%"), transform: on ? undefined : "none" }}
      >
        <rect x={fx0 + 8} y={fy1 - 7} width={w - 16} height="6" rx="3" fill="#e3e6e5" />
        <rect x={fx0 + 8} y={fy1 - 7} width={w - 16} height="2" rx="1" fill="#ffffff" opacity="0.7" />
      </g>

      {/* Airflow */}
      {on && (
        <g fill="none" stroke={air} strokeWidth="2.4" strokeLinecap="round" opacity="0.55" style={{ pointerEvents: "none" }}>
          {[0.25, 0.5, 0.75].map((t, i) => {
            const x = fx0 + w * t;
            return (
              <path
                key={t}
                d={`M${x} ${fy1 + 6} c -8 18 10 30 -2 52 c -10 18 8 30 -4 50`}
                className="sc-airflow"
                style={{ animationDelay: `${i * 0.7}s` }}
              />
            );
          })}
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Buy me a coffee: a takeaway cup on the windowsill                   */
/* ------------------------------------------------------------------ */

const CUP_AT: Vec3 = [-1.55, WINDOW.bottom, B - 0.04];

export function CoffeeCup() {
  const speak = useSpeak();
  const [poke, bump] = usePoke();
  const [bx, by] = project(CUP_AT);

  function open() {
    playSfx("sip");
    bump();
    window.open(COFFEE_URL, "_blank", "noopener,noreferrer");
    speak(bx, by - 60, "A coffee for the developer? Thank you so much! ☕");
  }

  return (
    <g
      className="sc-hit"
      role="link"
      tabIndex={0}
      aria-label="Buy me a coffee (opens in a new tab)"
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
    >
      <title>Buy me a coffee ☕</title>
      <At at={CUP_AT}>
        <g transform="scale(1.25)">
        <ellipse cx="1" cy="1" rx="15" ry="3" fill="#000000" opacity="0.16" />

        {/* A little folded card, so you know what the cup is for */}
        <g transform="translate(15 0)">
          <ellipse cx="36" cy="1" rx="36" ry="2.4" fill="#000000" opacity="0.14" />
          <path d="M1 0 L5 -17 H67 L71 0 Z" fill="#f1e2c7" stroke="#cdb48c" strokeWidth="0.7" strokeLinejoin="round" />
          <path d="M5 -17 H67 L68 -14.5 H4.4 Z" fill="#e2cda8" />
          <text
            x="36"
            y="-5.6"
            textAnchor="middle"
            fontSize="7"
            fill="#5a4030"
            style={{ fontFamily: "var(--font-kiwi)" }}
          >
            buy me a coffee
          </text>
        </g>

        <g key={poke} className={poke ? "sc-sip" : undefined} style={pivot("50% 100%")}>
          {/* Paper cup */}
          <path d="M-11 -36 H11 L8 0 H-8 Z" fill="#fbf7f0" />
          <path d="M-11 -36 H-5 L-3.5 0 H-8 Z" fill="#ffffff" opacity="0.7" />
          <path d="M5 -36 H11 L8 0 H4 Z" fill="#e8e1d4" opacity="0.8" />

          {/* Kraft sleeve with a little heart */}
          <path d="M-10.2 -26 H10.2 L9.2 -12 H-9.2 Z" fill="#c0895a" />
          <path d="M-10.2 -26 H10.2 L10 -24.6 H-10 Z" fill="#a8744a" />
          <path d="M0 -15.6 C -4.4 -18.4 -4.2 -22 -1.6 -22 C -0.8 -22 -0.2 -21.4 0 -20.8 C 0.2 -21.4 0.8 -22 1.6 -22 C 4.2 -22 4.4 -18.4 0 -15.6 Z" fill="#fff4e4" />

          {/* Lid */}
          <rect x="-12.5" y="-40" width="25" height="5" rx="2.5" fill="#5b4334" />
          <path d="M-9 -40 Q 0 -45 9 -40 Z" fill="#6c5040" />
          <ellipse cx="3.5" cy="-41.6" rx="2" ry="0.8" fill="#2f2219" />
        </g>

        {/* Steam */}
        <g fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
          {[-3, 3].map((x, index) => (
            <path
              key={x}
              d={`M${x} -46 c -3 -4 3 -7 0 -11 c -3 -4 2 -7 0 -10`}
              className="sc-steam"
              style={{ animationDelay: `${index * 1.3}s`, ...pivot("50% 100%") }}
            />
          ))}
        </g>
        </g>
      </At>
    </g>
  );
}
