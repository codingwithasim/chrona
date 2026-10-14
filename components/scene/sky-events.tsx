"use client";

import { useEffect, useState } from "react";

import type { ResolvedScene } from "@/stores/scene-store";

import { ambienceOneShot } from "./ambience-sound";
import { announceOutside, type OutsideEventKind } from "./scene-shared";

/*
 * Little things that happen outside every so often: a train rolls
 * through the valley, cars and bicycles pass on the farm road, birds
 * cross the sky, stars fall, a plane blinks past at night, butterflies
 * flutter by in the warm months.
 */

export type EventKind = OutsideEventKind | "car" | "bike";

export type SkyEvent = {
  id: number;
  kind: EventKind;
  ltr: boolean;
  y: number;
  x: number;
  duration: number;
  /** Which car or bike, and its colour. */
  variant?: number;
};

/** The farm road between the rice fields. */
export const ROAD_Y = 575.5;

const CAR_COLORS = ["#f2f0ea", "#9cc3dd", "#d9534f", "#f2c94c", "#7fa88a", "#5c6b80", "#e8e4d8"];

let eventId = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

type Rule = {
  kind: EventKind;
  every: [number, number];
  allowed: (scene: ResolvedScene) => boolean;
  make: () => Pick<SkyEvent, "ltr" | "y" | "x" | "duration" | "variant">;
};

const RULES: Rule[] = [
  {
    kind: "car",
    every: [9_000, 24_000],
    allowed: (s) => s.weather !== "storm" || Math.random() < 0.4,
    make: () => ({ ltr: Math.random() > 0.5, y: 0, x: 0, duration: rand(8, 12), variant: Math.floor(Math.random() * 30) }),
  },
  {
    kind: "bike",
    every: [40_000, 100_000],
    allowed: (s) => s.time !== "night" && (s.weather === "clear" || s.weather === "drizzle"),
    make: () => ({ ltr: Math.random() > 0.5, y: 0, x: 0, duration: rand(30, 38), variant: Math.floor(Math.random() * 3) }),
  },
  {
    kind: "train",
    every: [35_000, 80_000],
    allowed: () => true,
    make: () => ({ ltr: Math.random() > 0.5, y: 0, x: 0, duration: 13 }),
  },
  {
    kind: "birds",
    every: [22_000, 55_000],
    allowed: (s) => s.time !== "night" && (s.weather === "clear" || s.weather === "drizzle"),
    make: () => ({ ltr: Math.random() > 0.4, y: rand(190, 320), x: 0, duration: rand(13, 18) }),
  },
  {
    kind: "star",
    every: [9_000, 26_000],
    allowed: (s) => s.time === "night" && s.weather === "clear",
    make: () => ({ ltr: true, y: rand(150, 260), x: rand(500, 900), duration: 1.4 }),
  },
  {
    kind: "plane",
    every: [45_000, 90_000],
    allowed: (s) => (s.time === "night" || s.time === "evening") && s.weather !== "storm",
    make: () => ({ ltr: Math.random() > 0.5, y: rand(160, 230), x: 0, duration: 42 }),
  },
  {
    kind: "butterfly",
    every: [25_000, 60_000],
    allowed: (s) =>
      (s.season === "spring" || s.season === "summer") &&
      (s.time === "morning" || s.time === "day") &&
      s.weather === "clear",
    make: () => ({ ltr: Math.random() > 0.5, y: rand(420, 560), x: 0, duration: 11 }),
  },
];

function Train({ event, railY }: { event: SkyEvent; railY: number }) {
  const cars = [0, 72];

  return (
    <g
      className={event.ltr ? "ev-ltr" : "ev-rtl"}
      style={{ animationDuration: `${event.duration}s` }}
    >
      <g transform={event.ltr ? undefined : "translate(140 0) scale(-1 1)"}>
        {/* Headlight beam */}
        <path
          d={`M140 ${railY - 9} L230 ${railY - 16} L230 ${railY - 2} Z`}
          fill="url(#sc-headlight)"
          style={{ opacity: "var(--sc-window-glow)" }}
        />

        {cars.map((x, index) => (
          <g key={x}>
            <rect x={x} y={railY - 19} width="68" height="16" rx="3" fill="var(--sc-train)" />
            <rect x={x + 2} y={railY - 22} width="64" height="4" rx="2" fill="#8a8a98" />
            <rect x={x} y={railY - 8} width="68" height="3" fill="#4f8a6a" />
            {[0, 1, 2, 3, 4].map((window) => (
              <rect
                key={window}
                x={x + 6 + window * 12}
                y={railY - 16}
                width="8"
                height="5"
                rx="1"
                fill="var(--sc-train-window)"
              />
            ))}
            <circle cx={x + 10} cy={railY - 2} r="2" fill="#2c2c3a" />
            <circle cx={x + 58} cy={railY - 2} r="2" fill="#2c2c3a" />
            {index === 1 && (
              <path
                d={`M${x + 30} ${railY - 22} L${x + 38} ${railY - 30} L${x + 46} ${railY - 22}`}
                fill="none"
                stroke="#55556a"
                strokeWidth="1"
              />
            )}
          </g>
        ))}

        <circle cx="139" cy={railY - 10} r="1.8" fill="#fff6c8" />
      </g>
    </g>
  );
}

function Mover({ event, children }: { event: SkyEvent; children: React.ReactNode }) {
  return (
    <g className={event.ltr ? "ev-ltr" : "ev-rtl"} style={{ animationDuration: `${event.duration}s` }}>
      <g transform={`translate(0 ${ROAD_Y}) ${event.ltr ? "" : "scale(-1 1)"}`}>{children}</g>
    </g>
  );
}

/** A small car, kei truck or van, drawn facing right. */
function Car({ event }: { event: SkyEvent }) {
  const variant = event.variant ?? 0;
  const color = CAR_COLORS[variant % CAR_COLORS.length];
  const type = variant % 3;

  return (
    <Mover event={event}>
      <ellipse cx="0" cy="0.4" rx="10" ry="1.2" fill="#000000" opacity="0.18" />
      {type === 0 && (
        <g>
          <path d="M-9 -1.6 V-5 Q-9 -6.2 -7.8 -6.3 L-4.6 -6.6 L-2.4 -9.6 H3.6 L6.2 -6.6 L8.4 -6 Q9.6 -5.6 9.6 -4.4 V-1.6 Z" fill={color} />
          <path d="M-1.8 -9 H3.2 L5.2 -6.8 H-3.6 Z" fill="#3c4a5a" />
          <line x1="0.9" y1="-9" x2="0.9" y2="-6.8" stroke={color} strokeWidth="0.7" />
        </g>
      )}
      {type === 1 && (
        <g>
          {/* Kei truck: a little cab and a flatbed */}
          <path d="M-9.6 -1.6 V-5.4 H1.4 V-1.6 Z" fill="#cfd3d6" />
          <path d="M-9.6 -5.4 H1.4" stroke="#9aa0a6" strokeWidth="0.8" />
          <path d="M1.4 -1.6 V-9.8 H6.4 Q8.8 -9.8 9.2 -7.4 L9.6 -1.6 Z" fill={color} />
          <path d="M2.4 -9 H6.2 Q7.8 -9 8.2 -7 H2.4 Z" fill="#3c4a5a" />
          {variant % 2 === 0 && <rect x="-8.6" y="-8.4" width="8" height="3" rx="0.8" fill="#c79a5a" />}
        </g>
      )}
      {type === 2 && (
        <g>
          {/* A boxy little van */}
          <path d="M-9 -1.6 V-10 Q-9 -10.6 -8.4 -10.6 H5 Q7 -10.6 8 -8 L9.6 -4.6 V-1.6 Z" fill={color} />
          <path d="M3.6 -9.8 H5.4 Q6.6 -9.8 7.2 -8 L8 -6.4 H3.6 Z" fill="#3c4a5a" />
          <path d="M-7.8 -9.4 H2.4 V-6.6 H-7.8 Z" fill="#3c4a5a" opacity="0.85" />
        </g>
      )}
      <circle cx="-5.4" cy="-1.6" r="1.8" fill="#26262c" />
      <circle cx="5.8" cy="-1.6" r="1.8" fill="#26262c" />
      <circle cx="-5.4" cy="-1.6" r="0.6" fill="#9a9aa0" />
      <circle cx="5.8" cy="-1.6" r="0.6" fill="#9a9aa0" />
    </Mover>
  );
}

/** Headlights and tail lights, drawn above the evening tint so they glow. */
function CarLights({ event }: { event: SkyEvent }) {
  return (
    <Mover event={event}>
      <g style={{ opacity: "var(--sc-window-glow)" }}>
        <path d="M9.4 -4.6 L34 -8 L34 -0.6 Z" fill="url(#sc-headlight)" />
        <circle cx="9.3" cy="-4.4" r="1.1" fill="#fff6d0" />
        <circle cx="-9" cy="-4.4" r="0.9" fill="#ff5a4e" />
        <circle cx="-9" cy="-4.4" r="2.6" fill="#ff5a4e" opacity="0.25" />
      </g>
    </Mover>
  );
}

/** A kid on a bicycle, yellow school hat and all. */
function Bike({ event }: { event: SkyEvent }) {
  const shirt = ["#e57373", "#64b5f6", "#81c784"][event.variant ?? 0];

  return (
    <Mover event={event}>
      <ellipse cx="0" cy="0.4" rx="8" ry="1" fill="#000000" opacity="0.15" />
      <g fill="none" stroke="#3a3a44" strokeWidth="0.8">
        <circle cx="-5" cy="-3.2" r="3.2" />
        <circle cx="5" cy="-3.2" r="3.2" />
        <path d="M-5 -3.2 L-1 -3.2 L2.6 -7.4 M-1 -3.2 L-2.4 -7.8 M5 -3.2 L2.6 -7.4 L1.8 -9" />
      </g>
      <g className="ev-bob" style={{ animationDuration: "0.9s" }}>
        <path d="M-2.4 -8 L-0.2 -12.6 L1.6 -12 L0 -8 Z" fill={shirt} />
        <path d="M-1.6 -8 L-0.6 -5 M-0.4 -8 L1 -5" stroke="#2f3a52" strokeWidth="1" />
        <path d="M0.8 -11.8 L2.8 -9.6" stroke={shirt} strokeWidth="1" strokeLinecap="round" />
        <circle cx="0.4" cy="-14" r="1.6" fill="#f2d2b6" />
        <path d="M-1.6 -14.4 Q 0.4 -17 2.4 -14.4 Z" fill="#f2c94c" />
      </g>
    </Mover>
  );
}

function Birds({ event }: { event: SkyEvent }) {
  const flock = [
    [0, 0],
    [-14, 8],
    [-26, 15],
    [-13, -7],
    [-27, -13],
  ];

  return (
    <g
      className={event.ltr ? "ev-ltr" : "ev-rtl"}
      style={{ animationDuration: `${event.duration}s` }}
    >
      <g transform={`translate(0 ${event.y}) ${event.ltr ? "" : "scale(-1 1)"}`}>
        <g className="ev-bob">
          {flock.map(([dx, dy], index) => (
            <g key={index} transform={`translate(${dx} ${dy})`}>
              <path
                d="M-6 0 Q -3 -4 0 0 Q 3 -4 6 0"
                fill="none"
                stroke="var(--sc-bird)"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="ev-flap"
                style={{ animationDelay: `${index * 0.08}s` }}
              />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}

function ShootingStar({ event }: { event: SkyEvent }) {
  return (
    <g transform={`translate(${event.x} ${event.y}) rotate(22)`}>
      <g className="ev-star" style={{ animationDuration: `${event.duration}s` }}>
        <line x1="-70" y1="0" x2="0" y2="0" stroke="url(#sc-star-trail)" strokeWidth="2" strokeLinecap="round" />
        <circle r="1.8" fill="#ffffff" />
      </g>
    </g>
  );
}

function Plane({ event }: { event: SkyEvent }) {
  return (
    <g
      className={event.ltr ? "ev-ltr" : "ev-rtl"}
      style={{ animationDuration: `${event.duration}s` }}
    >
      <g transform={`translate(0 ${event.y})`}>
        <circle r="1.6" fill="#ff6b84" className="sc-blink-light" style={{ animationDuration: "1.4s" }} />
        <circle cx="5" r="1.2" fill="#ffffff" className="sc-blink-light" style={{ animationDuration: "1.4s", animationDelay: "0.7s" }} />
      </g>
    </g>
  );
}

function Butterfly({ event }: { event: SkyEvent }) {
  return (
    <g
      className={event.ltr ? "ev-ltr" : "ev-rtl"}
      style={{ animationDuration: `${event.duration}s` }}
    >
      <g transform={`translate(0 ${event.y})`}>
        <g className="ev-flutter">
          <g className="ev-wing" style={{ transformOrigin: "100% 50%" }}>
            <ellipse cx="-4" cy="-2" rx="4.5" ry="3.5" fill="#fff3a8" />
            <ellipse cx="-3" cy="3" rx="3" ry="2.5" fill="#ffe27a" />
          </g>
          <g className="ev-wing" style={{ transformOrigin: "0% 50%" }}>
            <ellipse cx="4" cy="-2" rx="4.5" ry="3.5" fill="#fff3a8" />
            <ellipse cx="3" cy="3" rx="3" ry="2.5" fill="#ffe27a" />
          </g>
          <rect x="-0.6" y="-4" width="1.2" height="9" rx="0.6" fill="#4a3a2a" />
        </g>
      </g>
    </g>
  );
}

/** Fire this to make something happen outside right away. */
export const SUMMON_EVENT = "chrona:summon";

export function summonOutside(kind: EventKind) {
  window.dispatchEvent(new CustomEvent<EventKind>(SUMMON_EVENT, { detail: kind }));
}

/** Schedules everything that happens outside, for the current scene. */
export function useOutsideEvents(scene: ResolvedScene | null) {
  const [events, setEvents] = useState<SkyEvent[]>([]);

  // Asked for by name (from the room menu): no dice roll, just happens.
  useEffect(() => {
    const timers = new Set<number>();

    function onSummon(event: Event) {
      const kind = (event as CustomEvent<EventKind>).detail;
      const rule = RULES.find((item) => item.kind === kind);

      if (!rule) {
        return;
      }

      const sky: SkyEvent = { id: ++eventId, kind, ...rule.make() };
      setEvents((list) => [...list, sky]);

      if (kind !== "car" && kind !== "bike") {
        announceOutside(kind);
      }

      if (kind === "train") {
        ambienceOneShot("train");
      }

      const id = window.setTimeout(() => {
        timers.delete(id);
        setEvents((list) => list.filter((item) => item.id !== sky.id));
      }, sky.duration * 1000 + 300);
      timers.add(id);
    }

    window.addEventListener(SUMMON_EVENT, onSummon);
    return () => {
      window.removeEventListener(SUMMON_EVENT, onSummon);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const time = scene?.time;
  const season = scene?.season;
  const weather = scene?.weather;

  useEffect(() => {
    if (!time || !season || !weather) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const current = { time, season, weather, dark: time === "evening" || time === "night" };
    const timers = new Set<number>();

    function later(fn: () => void, ms: number) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);

      timers.add(id);
    }

    for (const rule of RULES) {
      const run = () => {
        if (!document.hidden && rule.allowed(current)) {
          const event: SkyEvent = { id: ++eventId, kind: rule.kind, ...rule.make() };

          setEvents((list) => [...list, event]);

          // Cars and bikes are everyday; the cat only looks up for the rest.
          if (rule.kind !== "car" && rule.kind !== "bike") {
            announceOutside(rule.kind);
          }

          if (rule.kind === "train") {
            ambienceOneShot("train");
          }

          later(
            () => setEvents((list) => list.filter((item) => item.id !== event.id)),
            event.duration * 1000 + 300
          );
        }

        later(run, rand(rule.every[0], rule.every[1]));
      };

      later(run, rand(rule.every[0] * 0.15, rule.every[1] * 0.5));
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [time, season, weather]);

  return events;
}

/** Cars and bikes on the road, drawn among the fields (under the tint). */
export function RoadEvents({ events }: { events: SkyEvent[] }) {
  return (
    <g>
      {events.map((event) =>
        event.kind === "car" ? (
          <Car key={event.id} event={event} />
        ) : event.kind === "bike" ? (
          <Bike key={event.id} event={event} />
        ) : null
      )}
    </g>
  );
}

/** Car lights, drawn above the tint. */
export function RoadLights({ events }: { events: SkyEvent[] }) {
  return (
    <g>
      {events.map((event) => (event.kind === "car" ? <CarLights key={event.id} event={event} /> : null))}
    </g>
  );
}

export function SkyEvents({ events, railY }: { events: SkyEvent[]; railY: number }) {
  return (
    <g>
      {events.map((event) => {
        switch (event.kind) {
          case "train":
            return <Train key={event.id} event={event} railY={railY} />;
          case "birds":
            return <Birds key={event.id} event={event} />;
          case "star":
            return <ShootingStar key={event.id} event={event} />;
          case "plane":
            return <Plane key={event.id} event={event} />;
          case "butterfly":
            return <Butterfly key={event.id} event={event} />;
          default:
            return null;
        }
      })}
    </g>
  );
}
